from __future__ import annotations

import asyncio
import hashlib
import json
from datetime import UTC, datetime
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

from temporalio import activity

from durable_research.artifacts import ArtifactStore
from durable_research.external_calls import journaled_call_tool
from durable_research.models import (
    BranchRequest,
    BranchResult,
    FinalizeRequest,
    ReviewResult,
    SectionRequest,
    SourceRef,
    VerifyRequest,
)

_HEARTBEAT_INTERVAL_SECONDS = 10.0


@activity.defn(name="research_angle")
async def research_angle(request: BranchRequest) -> BranchResult:
    """Retrieve nondeterministic external evidence and persist full payloads."""
    await _demo_delay(request)
    if (
        activity.in_activity()
        and request.review.fail_once_angle == request.angle.key
        and activity.info().attempt == 1
    ):
        raise RuntimeError(f"injected transient failure for {request.angle.key}")
    store = ArtifactStore(request.review.artifact_root)
    if request.review.mode == "fixture":
        sources = await asyncio.to_thread(_fixture_sources, request)
    else:
        sources = await _live_sources_with_heartbeats(request, store)

    refs: list[SourceRef] = []
    for raw in sources:
        artifact = await asyncio.to_thread(
            store.put_json,
            request.review_id,
            "evidence",
            raw,
        )
        refs.append(
            SourceRef(
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
    index = await asyncio.to_thread(
        store.put_json,
        request.review_id,
        f"branches/{request.angle.key}",
        {"angle": request.angle.key, "sources": [ref.__dict__ for ref in refs]},
    )
    return BranchResult(
        angle_key=request.angle.key,
        status="researched",
        evidence_ref=index.path,
        sources=tuple(refs),
    )


@activity.defn(name="verify_evidence")
async def verify_evidence(request: VerifyRequest) -> BranchResult:
    """Validate citations against persisted evidence as a retryable side effect."""
    branch = request.branch
    if branch.status != "researched":
        raise ValueError(f"expected researched branch, got {branch.status}")
    if not branch.sources:
        raise ValueError(f"no evidence returned for {branch.angle_key}")
    store = ArtifactStore(request.review.artifact_root)
    for source in branch.sources:
        if not source.source_id or not source.title or not source.locator:
            raise ValueError(f"incomplete source metadata in {branch.angle_key}")
        content = await asyncio.to_thread(store.read_text, source.artifact_ref)
        digest = hashlib.sha256(content.encode()).hexdigest()
        if digest != source.content_hash:
            raise ValueError(f"evidence hash mismatch for {source.source_id}")
    return BranchResult(
        angle_key=branch.angle_key,
        status="verified",
        evidence_ref=branch.evidence_ref,
        sources=branch.sources,
    )


@activity.defn(name="synthesize_section")
async def synthesize_section(request: SectionRequest) -> BranchResult:
    """Render findings from evidence; file reads/writes remain outside Workflow code."""
    branch = request.branch
    if branch.status != "verified":
        raise ValueError(f"expected verified branch, got {branch.status}")
    store = ArtifactStore(request.review.artifact_root)
    angle = next(angle for angle in request.review.angles if angle.key == branch.angle_key)
    findings: list[str] = []
    references: list[str] = []
    for source in branch.sources:
        raw = await asyncio.to_thread(store.read_json, source.artifact_ref)
        summary = str(raw.get("summary") or raw.get("text") or "No summary returned.").strip()
        lane = "SciX" if source.lane == "scix" else "Code Intelligence Digest"
        findings.append(f"- [{lane}] {summary} [{source.source_id}]")
        references.append(
            f"- [{lane}] [{source.source_id}] {source.title}. {source.locator}"
        )
    body = (
        f"## {angle.key.replace('-', ' ').title()}\n\n"
        f"**Question:** {angle.question}\n\n"
        "### Synthesized findings\n\n"
        + "\n".join(findings)
        + "\n\n### Sources\n\n"
        + "\n".join(references)
        + "\n"
    )
    path = f"{_review_id_from_ref(branch.evidence_ref)}/sections/{branch.angle_key}.md"
    artifact = await asyncio.to_thread(store.put_named_text, path, body)
    return BranchResult(
        angle_key=branch.angle_key,
        status="complete",
        evidence_ref=branch.evidence_ref,
        section_ref=artifact.path,
        sources=branch.sources,
    )


@activity.defn(name="finalize_review")
async def finalize_review(request: FinalizeRequest) -> ReviewResult:
    """Fan in completed sections and record an inspectable provenance manifest."""
    store = ArtifactStore(request.review.artifact_root)
    completed = tuple(
        branch.angle_key for branch in request.branches if branch.status == "complete"
    )
    failed = tuple(branch.angle_key for branch in request.branches if branch.status == "failed")
    sections = []
    for branch in request.branches:
        if branch.status == "complete" and branch.section_ref:
            sections.append(await asyncio.to_thread(store.read_text, branch.section_ref))

    synthesis_markdown = ""
    synthesis_manifest: dict[str, Any] | None = None
    scix_bibcodes = sorted(
        {
            source.source_id
            for branch in request.branches
            if branch.status == "complete"
            for source in branch.sources
            if source.lane == "scix"
        }
    )
    if request.review.mode == "live" and request.review.scix_server and scix_bibcodes:
        synthesis_call = await journaled_call_tool(
            store=store,
            review_id=request.review_id,
            operation="review:scix-synthesize-findings:v1",
            server=request.review.scix_server,
            tool="synthesize_findings",
            arguments={
                "working_set_bibcodes": scix_bibcodes,
                "include_full_abstracts": True,
                "include_citation_contexts": True,
            },
        )
        synthesis_artifact = await asyncio.to_thread(
            store.put_json,
            request.review_id,
            "synthesis",
            synthesis_call.response,
        )
        synthesis_markdown = _render_scix_synthesis(
            synthesis_call.response,
            paper_count=len(scix_bibcodes),
        )
        synthesis_manifest = {
            "tool": "synthesize_findings",
            "request_id": synthesis_call.request_id,
            "artifact_ref": synthesis_artifact.path,
            "input_paper_count": len(scix_bibcodes),
        }

    report = (
        f"# {request.review.topic}\n\n"
        + synthesis_markdown
        + "\n".join(sections)
    )
    report_ref = await asyncio.to_thread(
        store.put_named_text,
        f"{request.review_id}/report.md",
        report,
    )
    manifest = {
        "review_id": request.review_id,
        "topic": request.review.topic,
        "completed_angles": list(completed),
        "failed_angles": list(failed),
        "synthesis": synthesis_manifest,
        "branches": [
            {
                "angle": branch.angle_key,
                "status": branch.status,
                "section_ref": branch.section_ref,
                "sources": [source.__dict__ for source in branch.sources],
                "error": branch.error,
            }
            for branch in request.branches
        ],
    }
    manifest_ref = await asyncio.to_thread(
        store.put_named_text,
        f"{request.review_id}/manifest.json",
        json.dumps(manifest, indent=2, sort_keys=True) + "\n",
    )
    return ReviewResult(
        review_id=request.review_id,
        report_ref=report_ref.path,
        manifest_ref=manifest_ref.path,
        completed_angles=completed,
        failed_angles=failed,
    )


def _render_scix_synthesis(response: Any, *, paper_count: int) -> str:
    if not isinstance(response, dict) or not isinstance(response.get("sections"), list):
        return ""
    lines = [
        "## SciX synthesis scaffold",
        "",
        (
            "SciX `synthesize_findings` mechanically grouped "
            f"{paper_count} retrieved papers into an auditable writing outline. "
            "The cited findings by research question follow this scaffold."
        ),
        "",
    ]
    for raw_section in response["sections"]:
        if not isinstance(raw_section, dict):
            continue
        cited = raw_section.get("cited_papers")
        if not isinstance(cited, list) or not cited:
            continue
        name = str(raw_section.get("name") or "section").replace("_", " ").title()
        lines.extend((f"### {name}", ""))
        for paper in cited:
            if not isinstance(paper, dict):
                continue
            bibcode = str(paper.get("bibcode") or "unknown")
            title = str(paper.get("title") or bibcode)
            year = paper.get("year")
            year_text = f" ({year})" if year is not None else ""
            signal = str(paper.get("signal_used") or "unclassified").replace("_", " ")
            lines.append(f"- {title}{year_text} [{bibcode}], assigned by {signal}.")
        lines.append("")
    unattributed = response.get("unattributed_bibcodes")
    if isinstance(unattributed, list) and unattributed:
        lines.extend(
            (
                f"Unattributed working-set papers: {', '.join(map(str, unattributed))}.",
                "",
            )
        )
    return "\n".join(lines) + "\n"


def _fixture_sources(request: BranchRequest) -> list[dict[str, Any]]:
    if request.review.fixture_path is None:
        raise ValueError("fixture mode requires fixture_path")
    fixture = json.loads(Path(request.review.fixture_path).read_text())
    lanes = fixture.get(request.angle.key)
    if not lanes:
        raise ValueError(f"no fixture evidence for angle {request.angle.key}")
    retrieved_at = "2026-07-29T00:00:00Z"
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
    request: BranchRequest,
    store: ArtifactStore,
) -> list[dict[str, Any]]:
    if request.review.scix_server is None or request.review.digest_server is None:
        raise ValueError("live mode requires both scix_server and digest_server")
    scix_call = await journaled_call_tool(
        store=store,
        review_id=request.review_id,
        operation=f"{request.angle.key}:scix-search:v1",
        server=request.review.scix_server,
        tool="search",
        arguments={
            "query": request.angle.scix_query,
            "mode": "hybrid",
            "filters": {"year_min": 2023},
            "limit": 6,
            "disambiguate": False,
        },
    )
    digest_call = await journaled_call_tool(
        store=store,
        review_id=request.review_id,
        operation=f"{request.angle.key}:digest-search:v1",
        server=request.review.digest_server,
        tool="semantic_search_items",
        arguments={"query": request.angle.digest_query, "limit": 6},
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
    request: BranchRequest,
    store: ArtifactStore,
) -> list[dict[str, Any]]:
    retrieval = asyncio.create_task(_live_sources(request, store))
    try:
        while True:
            if activity.in_activity():
                activity.heartbeat(
                    {
                        "angle": request.angle.key,
                        "stage": "retrieval",
                    }
                )
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


def _normalize_sources(
    result: Any,
    lane: str,
    retrieved_at: str,
    *,
    request_id: str | None = None,
) -> list[dict[str, Any]]:
    candidates: Any = result
    if isinstance(result, dict):
        for key in ("results", "items", "papers", "data"):
            if isinstance(result.get(key), list):
                candidates = result[key]
                break
    if not isinstance(candidates, list):
        candidates = [candidates]
    normalized: list[dict[str, Any]] = []
    for index, item in enumerate(candidates):
        if not isinstance(item, dict):
            continue
        source_id = str(
            item.get("id") or item.get("bibcode") or item.get("url") or f"{lane}-{index + 1}"
        )
        normalized.append(
            {
                "id": source_id,
                "lane": lane,
                "title": str(item.get("title") or source_id),
                "locator": str(
                    item.get("url") or item.get("doi") or item.get("bibcode") or source_id
                ),
                "summary": str(
                    _summary_text(
                        item.get("summary")
                        or item.get("abstract")
                        or item.get("abstract_snippet")
                        or item.get("description")
                        or item
                    )
                ),
                "retrieved_at": retrieved_at,
                "request_id": request_id,
                "raw": item,
            }
        )
    if not normalized:
        raise ValueError(f"{lane} returned no usable sources")
    return normalized


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag in {"br", "div", "li", "p", "td", "tr"}:
            self.parts.append(" ")


def _summary_text(value: object, *, limit: int = 600) -> str:
    text = str(value)
    parser = _TextExtractor()
    parser.feed(text)
    normalized = " ".join("".join(parser.parts).split())
    if len(normalized) <= limit:
        return normalized
    return normalized[: limit - 1].rstrip() + "…"


async def _demo_delay(request: BranchRequest) -> None:
    remaining = request.review.activity_delay_seconds
    while remaining > 0:
        if activity.in_activity():
            activity.heartbeat(
                {
                    "angle": request.angle.key,
                    "remaining_seconds": round(remaining, 1),
                }
            )
        interval = min(1.0, remaining)
        await asyncio.sleep(interval)
        remaining -= interval


def _review_id_from_ref(reference: str | None) -> str:
    if not reference:
        raise ValueError("branch has no evidence reference")
    return reference.split("/", 1)[0]
