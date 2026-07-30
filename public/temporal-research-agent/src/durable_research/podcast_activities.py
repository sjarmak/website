from __future__ import annotations

import asyncio
import json
from dataclasses import replace
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from temporalio import activity

from durable_research.activities import (
    _escape_markdown_text,
    _normalize_sources,
)
from durable_research.artifacts import ArtifactStore
from durable_research.external_calls import journaled_call_tool
from durable_research.podcast_models import (
    DeepDiveRequest,
    EpisodeRequest,
    EpisodeResult,
    ManifestRequest,
    PodcastEpisode,
    PodcastPipelineResult,
    PodcastSeries,
    PodcastSourceRef,
    ScriptRequest,
    SeriesReviewRequest,
    SeriesReviewResult,
    WriterCommand,
)
from durable_research.podcast_prompts import (
    deep_dive_prompt,
    podcast_script_prompt,
    research_prompt,
    series_review_prompt,
)

_HEARTBEAT_INTERVAL_SECONDS = 10.0


@activity.defn(name="research_episode")
async def research_episode(request: EpisodeRequest) -> EpisodeResult:
    """Retrieve and persist the evidence required for one historical episode."""
    await _demo_delay(request)
    if (
        activity.in_activity()
        and request.pipeline.fail_once_episode == request.episode.key
        and activity.info().attempt == 1
    ):
        raise RuntimeError(f"injected transient failure for {request.episode.key}")

    store = ArtifactStore(request.pipeline.artifact_root)
    if request.pipeline.mode == "fixture":
        raw_sources = await asyncio.to_thread(_fixture_sources, request)
    else:
        raw_sources = await _live_sources_with_heartbeats(request, store)

    source_refs: list[PodcastSourceRef] = []
    for raw in raw_sources:
        artifact = await asyncio.to_thread(
            store.put_json,
            request.pipeline_id,
            "evidence",
            raw,
        )
        source_refs.append(
            PodcastSourceRef(
                source_id=str(raw["id"]),
                lane=raw["lane"],
                title=str(raw["title"]),
                locator=str(raw["locator"]),
                retrieved_at=str(raw["retrieved_at"]),
                content_hash=artifact.content_hash,
                artifact_ref=artifact.path,
                request_id=(
                    str(raw["request_id"]) if raw.get("request_id") is not None else None
                ),
            )
        )

    evidence_index = await asyncio.to_thread(
        store.put_named_text,
        f"{request.pipeline_id}/evidence/{request.episode.key}.json",
        json.dumps(
            {
                "episode_key": request.episode.key,
                "sources": [source.__dict__ for source in source_refs],
            },
            indent=2,
            sort_keys=True,
        )
        + "\n",
    )
    series = _series_for(request.pipeline.series, request.episode.series_key)
    research_body = await asyncio.to_thread(
        _render_research,
        store,
        series,
        request.episode,
        tuple(source_refs),
    )
    research_artifact = await asyncio.to_thread(
        store.put_named_text,
        f"{request.pipeline_id}/research/{request.episode.key}.md",
        research_body,
    )
    return EpisodeResult(
        episode_key=request.episode.key,
        series_key=request.episode.series_key,
        status="researched",
        evidence_ref=evidence_index.path,
        research_ref=research_artifact.path,
        sources=tuple(source_refs),
    )


@activity.defn(name="write_deep_dive")
async def write_deep_dive(request: DeepDiveRequest) -> EpisodeResult:
    """Turn episode research into the long-form source document used by the script."""
    result = request.episode_result
    if not isinstance(result, EpisodeResult) or result.status != "researched":
        actual = getattr(result, "status", None)
        raise ValueError(f"expected researched episode result, got {actual}")
    if result.research_ref is None:
        raise ValueError("researched episode has no research artifact")

    store = ArtifactStore(request.pipeline.artifact_root)
    series = _series_for(request.pipeline.series, request.episode.series_key)
    prompt = deep_dive_prompt(series, request.episode, research_ref=result.research_ref)
    if request.pipeline.mode == "fixture":
        research = await asyncio.to_thread(store.read_text, result.research_ref)
        body = _render_fixture_deep_dive(series, request.episode, research, result.sources)
    else:
        body = await _run_writer_with_heartbeats(
            request.pipeline.writer,
            prompt,
            episode_key=request.episode.key,
            stage="deep-dive",
        )

    pipeline_id = _pipeline_id_from_ref(result.research_ref)
    artifact = await asyncio.to_thread(
        store.put_named_text,
        f"{pipeline_id}/deep-dives/{request.episode.key}.md",
        body,
    )
    return replace(result, status="deep_dive_complete", deep_dive_ref=artifact.path)


@activity.defn(name="write_podcast_script")
async def write_podcast_script(request: ScriptRequest) -> EpisodeResult:
    """Write the episode delivery artifact from its completed deep dive."""
    result = request.episode_result
    if result.status != "deep_dive_complete":
        raise ValueError(f"expected deep_dive_complete episode result, got {result.status}")
    if result.deep_dive_ref is None:
        raise ValueError("deep-dive episode has no deep-dive artifact")

    store = ArtifactStore(request.pipeline.artifact_root)
    series = _series_for(request.pipeline.series, request.episode.series_key)
    prompt = podcast_script_prompt(
        series,
        request.episode,
        deep_dive_ref=result.deep_dive_ref,
    )
    if request.pipeline.mode == "fixture":
        deep_dive = await asyncio.to_thread(store.read_text, result.deep_dive_ref)
        body = _render_fixture_script(series, request.episode, deep_dive, result.sources)
    else:
        body = await _run_writer_with_heartbeats(
            request.pipeline.writer,
            prompt,
            episode_key=request.episode.key,
            stage="script",
        )

    pipeline_id = _pipeline_id_from_ref(result.deep_dive_ref)
    artifact = await asyncio.to_thread(
        store.put_named_text,
        f"{pipeline_id}/scripts/"
        f"podcast-script-{series.file_prefix}-ep{request.episode.number}-"
        f"{request.episode.slug}.md",
        body,
    )
    return replace(result, status="complete", script_ref=artifact.path)


@activity.defn(name="write_series_review")
async def write_series_review(request: SeriesReviewRequest) -> SeriesReviewResult:
    """Fan completed episode deep dives into the historical per-series review."""
    if not request.episodes:
        raise ValueError(f"series {request.series.key} has no completed episodes")
    if any(
        result.status != "complete" or result.deep_dive_ref is None
        for result in request.episodes
    ):
        raise ValueError("series review requires completed episode deep dives")

    store = ArtifactStore(request.pipeline.artifact_root)
    episode_specs = tuple(
        _episode_for(request.pipeline.episodes, result.episode_key)
        for result in request.episodes
    )
    deep_dive_refs = tuple(
        result.deep_dive_ref
        for result in request.episodes
        if result.deep_dive_ref is not None
    )
    prompt = series_review_prompt(request.series, episode_specs, deep_dive_refs)
    if request.pipeline.mode == "fixture":
        deep_dives = tuple(
            await asyncio.gather(
                *(
                    asyncio.to_thread(store.read_text, reference)
                    for reference in deep_dive_refs
                )
            )
        )
        body = _render_fixture_series_review(
            request.series,
            episode_specs,
            deep_dives,
            request.episodes,
        )
    else:
        body = await _run_writer_with_heartbeats(
            request.pipeline.writer,
            prompt,
            episode_key=request.series.key,
            stage="series-review",
        )

    pipeline_id = _pipeline_id_from_ref(deep_dive_refs[0])
    artifact = await asyncio.to_thread(
        store.put_named_text,
        f"{pipeline_id}/reviews/{request.series.key}-literature-review.md",
        body,
    )
    return SeriesReviewResult(
        series_key=request.series.key,
        report_ref=artifact.path,
        episode_keys=tuple(result.episode_key for result in request.episodes),
    )


@activity.defn(name="write_pipeline_manifest")
async def write_pipeline_manifest(request: ManifestRequest) -> PodcastPipelineResult:
    """Persist compact provenance for every output of the Temporalized pipeline."""
    completed = tuple(
        result.episode_key for result in request.episodes if result.status == "complete"
    )
    failed = tuple(
        result.episode_key for result in request.episodes if result.status == "failed"
    )
    manifest = {
        "pipeline_id": request.pipeline_id,
        "completed_episode_keys": list(completed),
        "failed_episode_keys": list(failed),
        "episodes": [
            {
                "episode_key": result.episode_key,
                "series_key": result.series_key,
                "status": result.status,
                "research_ref": result.research_ref,
                "deep_dive_ref": result.deep_dive_ref,
                "script_ref": result.script_ref,
                "sources": [source.__dict__ for source in result.sources],
                "error": result.error,
            }
            for result in request.episodes
        ],
        "series_reviews": [
            {
                "series_key": review.series_key,
                "report_ref": review.report_ref,
                "episode_keys": list(review.episode_keys),
            }
            for review in request.series_reviews
        ],
    }
    store = ArtifactStore(request.pipeline.artifact_root)
    artifact = await asyncio.to_thread(
        store.put_named_text,
        f"{request.pipeline_id}/manifest.json",
        json.dumps(manifest, indent=2, sort_keys=True) + "\n",
    )
    return PodcastPipelineResult(
        pipeline_id=request.pipeline_id,
        manifest_ref=artifact.path,
        completed_episode_keys=completed,
        failed_episode_keys=failed,
        series_reviews=request.series_reviews,
    )


def _fixture_sources(request: EpisodeRequest) -> list[dict[str, Any]]:
    if request.pipeline.fixture_path is None:
        raise ValueError("fixture mode requires fixture_path")
    fixture = json.loads(Path(request.pipeline.fixture_path).read_text())
    lanes = fixture.get(request.episode.key)
    if not isinstance(lanes, dict):
        raise ValueError(f"no fixture evidence for episode {request.episode.key}")
    retrieved_at = "2026-07-30T00:00:00Z"
    return [
        {
            **source,
            "lane": lane,
            "retrieved_at": source.get("retrieved_at", retrieved_at),
        }
        for lane in ("scix", "digest")
        for source in lanes.get(lane, [])
    ]


async def _live_sources(
    request: EpisodeRequest,
    store: ArtifactStore,
) -> list[dict[str, Any]]:
    pipeline = request.pipeline
    if pipeline.scix_server is None or pipeline.digest_server is None:
        raise ValueError("live mode requires both SciX and Digest servers")
    query = f"{request.episode.title}: {request.episode.focus}"
    scix_call = await journaled_call_tool(
        store=store,
        review_id=request.pipeline_id,
        operation=f"{request.episode.key}:scix-search:v1",
        server=pipeline.scix_server,
        tool="search",
        arguments={
            "query": query,
            "mode": "hybrid",
            "filters": {"year_min": 2019},
            "limit": 6,
            "disambiguate": False,
        },
    )
    digest_call = await journaled_call_tool(
        store=store,
        review_id=request.pipeline_id,
        operation=f"{request.episode.key}:digest-search:v1",
        server=pipeline.digest_server,
        tool="semantic_search_items",
        arguments={"query": query, "limit": 6},
    )
    timestamp = datetime.now(UTC).isoformat()
    return [
        *_normalize_sources(
            scix_call.response,
            "scix",
            timestamp,
            request_id=scix_call.request_id,
        ),
        *_normalize_sources(
            digest_call.response,
            "digest",
            timestamp,
            request_id=digest_call.request_id,
        ),
    ]


async def _live_sources_with_heartbeats(
    request: EpisodeRequest,
    store: ArtifactStore,
) -> list[dict[str, Any]]:
    retrieval = asyncio.create_task(_live_sources(request, store))
    try:
        while True:
            _heartbeat(request.episode.key, "research")
            try:
                return await asyncio.wait_for(
                    asyncio.shield(retrieval),
                    timeout=_HEARTBEAT_INTERVAL_SECONDS,
                )
            except TimeoutError:
                continue
    finally:
        if not retrieval.done():
            retrieval.cancel()
            await asyncio.gather(retrieval, return_exceptions=True)


async def _run_writer_with_heartbeats(
    writer: WriterCommand | None,
    prompt: str,
    *,
    episode_key: str,
    stage: str,
) -> str:
    if writer is None:
        raise ValueError("live writing requires a configured writer command")
    process = await asyncio.create_subprocess_exec(
        writer.command,
        *writer.args,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    communication = asyncio.create_task(process.communicate(prompt.encode()))
    try:
        while True:
            _heartbeat(episode_key, stage)
            try:
                stdout, stderr = await asyncio.wait_for(
                    asyncio.shield(communication),
                    timeout=_HEARTBEAT_INTERVAL_SECONDS,
                )
                break
            except TimeoutError:
                continue
    finally:
        if not communication.done():
            process.kill()
            await process.wait()
            communication.cancel()
            await asyncio.gather(communication, return_exceptions=True)
    if process.returncode != 0:
        message = stderr.decode(errors="replace").strip()
        raise RuntimeError(f"writer command failed for {episode_key}: {message}")
    result = stdout.decode().strip()
    if not result:
        raise ValueError(f"writer command returned no content for {episode_key}")
    return result + "\n"


async def _demo_delay(request: EpisodeRequest) -> None:
    remaining = request.pipeline.activity_delay_seconds
    while remaining > 0:
        _heartbeat(
            request.episode.key,
            "research",
            remaining_seconds=round(remaining, 1),
        )
        interval = min(1.0, remaining)
        await asyncio.sleep(interval)
        remaining -= interval


def _heartbeat(episode_key: str, stage: str, **details: object) -> None:
    if activity.in_activity():
        activity.heartbeat(
            {
                "episode": episode_key,
                "stage": stage,
                **details,
            }
        )


def _render_research(
    store: ArtifactStore,
    series: PodcastSeries,
    episode: PodcastEpisode,
    sources: tuple[PodcastSourceRef, ...],
) -> str:
    prompt = research_prompt(series, episode)
    findings = []
    new_bibcodes = []
    for source in sources:
        raw = store.read_json(source.artifact_ref)
        summary = str(raw.get("summary") or "No summary returned.").strip()
        findings.append(
            f"- **{'SciX' if source.lane == 'scix' else 'Code Intelligence Digest'}:** "
            f"{summary} ([{_escape_markdown_text(source.title)}]({_source_url(source)}))"
        )
        if source.lane == "scix" and source.source_id not in episode.seeds:
            new_bibcodes.append(source.source_id)
    return (
        f"# {episode.title} — Research\n\n"
        f"**Series:** {series.name}\n\n"
        f"**Focus:** {episode.focus}\n\n"
        "## Research contract\n\n"
        f"{prompt}\n\n"
        "## Key findings\n\n"
        + "\n".join(findings)
        + "\n\n## New bibcodes\n\n"
        + ("\n".join(f"- `{value}`" for value in sorted(new_bibcodes)) or "- None")
        + "\n"
    )


def _render_fixture_deep_dive(
    series: PodcastSeries,
    episode: PodcastEpisode,
    research: str,
    sources: tuple[PodcastSourceRef, ...],
) -> str:
    findings = _research_findings(research)
    return f"""# {episode.title} — Deep Dive

**Series:** {series.name}

## The core framing

{episode.focus}

## Why it matters

The retrieved evidence shows why this episode belongs in the series and where
the implementation and evaluation boundaries sit.

## The mechanism and technical substance

{findings}

## Tensions, contrasts, and dissent

The sources distinguish architectural mechanisms from production claims and
retain differences between scholarly evidence and engineering reports.

## Evidence & evaluation

The research Activity persisted {len(sources)} source records with content
hashes and provider provenance before this document was written.

## Practical takeaways

Treat the episode as a sequence of evidence-backed decisions rather than one
opaque model call.

## Key sources

{_render_source_list(sources)}
"""


def _render_fixture_script(
    series: PodcastSeries,
    episode: PodcastEpisode,
    deep_dive: str,
    sources: tuple[PodcastSourceRef, ...],
) -> str:
    framing = _section_excerpt(deep_dive, "## The core framing")
    evidence = _section_excerpt(deep_dive, "## Evidence & evaluation")
    return f"""# Code Intel Digest — {series.name}, Episode {episode.number}: {episode.title}

**Series:** {series.name} ({episode.number} of 5)
**Target runtime:** Fixture-backed demonstration edition

## COLD OPEN

{framing}

## INTRO

This episode follows the original research-to-deep-dive-to-script contract.

## SEGMENT 1 — The problem

{episode.focus}

## SEGMENT 2 — The evidence

{evidence}

## SEGMENT 3 — The mechanism

The research artifact and deep dive remain separate, inspectable inputs.

## SEGMENT 4 — The tension

Scholarly and engineering sources provide different kinds of evidence.

## SEGMENT 5 — What to evaluate

Recovery must preserve correct outputs, not merely reach a completed status.

## SEGMENT 6 — What to build

Keep orchestration decisions in the Workflow and nondeterministic work in
Activities with explicit timeouts and retry contracts.

## OUTRO

The episode closes with a source-grounded artifact that survived Worker loss.

## Citations

{_render_source_list(sources)}
"""


def _render_fixture_series_review(
    series: PodcastSeries,
    episode_specs: tuple[PodcastEpisode, ...],
    deep_dives: tuple[str, ...],
    results: tuple[EpisodeResult, ...],
) -> str:
    landscape = "\n\n".join(
        f"### Episode {episode.number}: {episode.title}\n\n"
        f"{_section_excerpt(deep_dive, '## The core framing')}"
        for episode, deep_dive in zip(episode_specs, deep_dives, strict=True)
    )
    all_sources = tuple(source for result in results for source in result.sources)
    return f"""# {series.name} — Literature Review

## Scope & method

This review synthesizes {len(episode_specs)} completed episode deep dives from
the fixture-backed recovery run.

## Landscape

{landscape}

## Cross-cutting themes

Evidence provenance, explicit stage boundaries, and inspectable artifacts recur
across the completed episodes.

## Open problems & the frontier

The production path still requires provider-specific retry and idempotency
contracts for expensive or mutating external calls.

## Practical implications

Temporal can resume orchestration after Worker loss while preserving the
business sequence that creates each deliverable.

## References

{_render_source_list(all_sources)}
"""


def _research_findings(research: str) -> str:
    marker = "## Key findings"
    if marker not in research:
        return research.strip()
    return research.split(marker, 1)[1].split("## New bibcodes", 1)[0].strip()


def _section_excerpt(document: str, heading: str) -> str:
    if heading not in document:
        return document.strip()[:600]
    section = document.split(heading, 1)[1]
    if "\n## " in section:
        section = section.split("\n## ", 1)[0]
    return section.strip()


def _render_source_list(sources: tuple[PodcastSourceRef, ...]) -> str:
    seen: set[tuple[str, str]] = set()
    lines = []
    for source in sources:
        key = (source.lane, " ".join(source.title.casefold().split()))
        if key in seen:
            continue
        seen.add(key)
        lane = "SciX" if source.lane == "scix" else "Code Intelligence Digest"
        lines.append(
            f"- **{lane}:** "
            f"[{_escape_markdown_text(source.title)}]({_source_url(source)})"
        )
    return "\n".join(lines) or "- No sources"


def _source_url(source: PodcastSourceRef) -> str:
    locator = source.locator.strip()
    if locator.startswith(("https://", "http://")):
        return locator
    if locator.startswith("doi:"):
        return f"https://doi.org/{locator.removeprefix('doi:')}"
    if source.lane == "scix":
        return f"https://ui.adsabs.harvard.edu/abs/{locator}/abstract"
    return locator


def _series_for(
    series_collection: tuple[PodcastSeries, ...],
    series_key: str,
) -> PodcastSeries:
    return next(series for series in series_collection if series.key == series_key)


def _episode_for(
    episodes: tuple[PodcastEpisode, ...],
    episode_key: str,
) -> PodcastEpisode:
    return next(episode for episode in episodes if episode.key == episode_key)


def _pipeline_id_from_ref(reference: str) -> str:
    return reference.split("/", 1)[0]
