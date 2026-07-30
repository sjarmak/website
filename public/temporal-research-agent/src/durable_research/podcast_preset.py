from __future__ import annotations

import hashlib
import os
import shlex
from collections.abc import Mapping
from pathlib import Path

from durable_research.podcast_models import (
    PodcastEpisode,
    PodcastPipelineInput,
    PodcastSeries,
    WriterCommand,
)
from durable_research.preset import live_mcp_servers

TASK_QUEUE = "temporal-podcast-research"
PROJECT_ROOT = Path(__file__).resolve().parents[2]
SOURCE_CONTEXT_ROOT = PROJECT_ROOT / "before" / "context"

SERIES = (
    PodcastSeries(
        key="mas",
        name="Multi-Agent Orchestration",
        file_prefix="multiagent-orchestration",
    ),
    PodcastSeries(
        key="code",
        name="Code Retrieval & Enterprise Codebases",
        file_prefix="code-retrieval",
    ),
)

EPISODES = (
    PodcastEpisode(
        "mas",
        1,
        "foundations-and-topologies",
        "Foundations & Topologies",
        (
            "What multi-agent orchestration is and why or when it helps or hurts "
            "versus a single agent. Cover orchestrator-worker or supervisor, "
            "hierarchical, swarm or decentralized, blackboard or shared-workspace, "
            "and pipeline topologies. Establish the core vocabulary."
        ),
        (
            "2024arXiv240201680G",
            "2023arXiv230603314T",
            "2024arXiv241104468F",
            "2024arXiv240204578C",
            "2025arXiv250400587Y",
            "2026arXiv260513850H",
            "2026arXiv260502431W",
            "2026arXiv260503310N",
        ),
    ),
    PodcastEpisode(
        "mas",
        2,
        "patterns-and-frameworks",
        "Patterns & Frameworks",
        (
            "The pattern vocabulary and the frameworks that encode it: AutoGen, "
            "MetaGPT, CAMEL, ChatDev, and AgentVerse; planning and decomposition, "
            "routing, handoffs, debate and voting; interoperability protocols "
            "including MCP and A2A. Treat LangGraph, CrewAI, and OpenAI Swarm as "
            "external vendor sources."
        ),
        (
            "2023arXiv230808155W",
            "2023arXiv230800352H",
            "2023arXiv230317760L",
            "2023arXiv230707924Q",
            "2023arXiv230810848C",
            "2023arXiv230514325D",
            "2023arXiv231002170L",
            "2026arXiv260409744Q",
            "2025arXiv250323278H",
            "2025arXiv250202533Z",
        ),
    ),
    PodcastEpisode(
        "mas",
        3,
        "memory-in-mas",
        "Memory in Multi-Agent Systems",
        (
            "The link back to the agentic-memory series: shared versus per-agent "
            "memory; shared ledgers and blackboards; KV-cache sharing; shared "
            "knowledge graphs; reusable workflow memory; durable cross-session team "
            "substrates; and how conventions and identity emerge from accumulated "
            "memory. Cross-reference records-management as shared-substrate "
            "governance and consolidation."
        ),
        (
            "2026arXiv260522721H",
            "2025arXiv250406135H",
            "2024arXiv241102820L",
            "2024arXiv240907429Z",
            "2024arXiv241104468F",
            "2023arXiv230403442P",
            "2026arXiv260604197M",
            "2025arXiv250205453Y",
            "2024arXiv241100114A",
        ),
    ),
    PodcastEpisode(
        "mas",
        4,
        "enterprise-and-production",
        "Enterprise & Production",
        (
            "Running agent systems in production: reliability and failure modes, "
            "observability and tracing, evaluation, guardrails and policy, "
            "cross-agent injection, cost and latency, human oversight, and real "
            "enterprise deployments. Use industry sources heavily."
        ),
        (
            "2025arXiv250313657C",
            "2026arXiv260509076L",
            "2026arXiv260520874S",
            "2025arXiv250211448L",
            "2024arXiv241007283L",
            "2024arXiv241002644Z",
            "2026arXiv260412262C",
            "2026arXiv260411641L",
            "2026arXiv260602755L",
        ),
    ),
    PodcastEpisode(
        "mas",
        5,
        "frontier-and-open-problems",
        "Frontier & Open Problems",
        (
            "Build the episode around the ranked open problems in the series "
            "brainstorm report: causal failure attribution, verified coordination "
            "protocols, cost-bounded orchestration, durable shared team memory, "
            "emergent-behavior evaluation, information-flow control, calibrated "
            "consensus, learned topology, human-checkpoint placement, trace "
            "observability standards, cognitive-tier routing, and cross-session "
            "organizational memory."
        ),
        (
            "2026arXiv260507935X",
            "2026arXiv260407667F",
            "2026arXiv260409703L",
            "2026arXiv260408963L",
            "2026arXiv260407775A",
            "2025arXiv250313657C",
        ),
        frontier=True,
    ),
    PodcastEpisode(
        "code",
        1,
        "why-code-isnt-text-ir",
        "Why Code Isn't Text IR",
        (
            "How retrieving code differs from text information retrieval: "
            "structure, symbols, references, the natural-language-intent-to-code "
            "gap, and exact versus semantic match. Use CodeSearchNet and CoIR as "
            "the evaluation backbone and explain why naive embedding search "
            "underperforms on code."
        ),
        (
            "2019arXiv190909436H",
            "2022arXiv220402765D",
            "2020arXiv200208155F",
            "2024arXiv240702883L",
            "2023arXiv231107989Z",
            "2020arXiv200514373L",
        ),
    ),
    PodcastEpisode(
        "code",
        2,
        "techniques-lexical-neural-graph",
        "Techniques: Lexical → Neural → Graph",
        (
            "The technique ladder: lexical, trigram, and BM25 retrieval; neural "
            "embeddings including CodeBERT, GraphCodeBERT, UniXcoder, CodeT5, and "
            "OpenAI code embeddings; AST and graph retrieval including deGraphCS, "
            "GraphSearchNet, and graph matching; hybrid retrieve-then-rerank with "
            "ColBERT, CoRNStack, and cascaded fast or slow systems; and contrastive "
            "representation learning."
        ),
        (
            "2020arXiv200908366G",
            "2021arXiv210900859W",
            "2022arXiv220303850G",
            "2022arXiv220110005N",
            "2021arXiv210313020Z",
            "2021arXiv211102671L",
            "2020arXiv200412832K",
            "2024arXiv240201007S",
            "2021arXiv211007811G",
            "2020arXiv200704973J",
        ),
    ),
    PodcastEpisode(
        "code",
        3,
        "repo-scale-and-code-graphs",
        "Repository-Scale & Code Graphs",
        (
            "Scaling beyond a single file: RepoCoder, RepoBench, CrossCodeEval, "
            "dataflow and static-analysis-guided retrieval, code property graphs "
            "and knowledge graphs including QVoG, Code Digital Twin, and AOCI, and "
            "agentic codebase navigation with SWE-agent, OpenHands, LocAgent, "
            "ARISE, and CodePlan."
        ),
        (
            "2023arXiv230312570Z",
            "2023arXiv230603091L",
            "2023arXiv231011248D",
            "2024arXiv240519782C",
            "2024arXiv240608098L",
            "2025arXiv250307967P",
            "2026arXiv260502421L",
            "2024arXiv240515793Y",
            "2024arXiv240716741W",
            "2025arXiv250309089C",
            "2023arXiv230912499B",
        ),
    ),
    PodcastEpisode(
        "code",
        4,
        "enterprise-codebase-challenges",
        "The Unique Challenges of Large Enterprise Codebases",
        (
            "What breaks at enterprise scale: monorepos and billions of lines of "
            "code, polyglot dependency chains, proprietary code and access-control "
            "boundaries, stale code and churn, tribal knowledge, poor "
            "documentation, build-system complexity, and honest evaluation. Cover "
            "Google Kythe, Zoekt, monorepo systems, Meta Glean, Sourcegraph SCIP, "
            "EnterpriseBench, CodeScaleBench, and codeprobe, including the "
            "ground-truth-tautology and tool-versus-no-tool evaluation problem."
        ),
        (
            "2024arXiv240601359D",
            "2024arXiv240606025L",
            "2025arXiv250215872K",
            "2023arXiv230902182C",
            "2025arXiv250417972A",
            "2026arXiv260508112D",
            "2025arXiv250318305O",
            "2024arXiv240814354Z",
        ),
    ),
    PodcastEpisode(
        "code",
        5,
        "frontier-and-open-problems",
        "Frontier & Open Problems",
        (
            "Build the episode around the ranked open problems in the series "
            "brainstorm report: access-aware retrieval, contamination-proof "
            "evaluation from private history, symbolic and semantic indexing at "
            "monorepo scale, staleness-aware retrieval, polyglot dependencies, "
            "tribal-knowledge retrieval, build-graph-grounded context, "
            "tool-versus-no-tool causal evaluation, long-context-versus-retrieval "
            "policy, incremental indexing, and graph-guided edit localization."
        ),
        (
            "2026arXiv260502421L",
            "2026arXiv260508112D",
            "2025arXiv250215872K",
            "2024arXiv240608098L",
            "2025arXiv250309089C",
            "2026arXiv260503117S",
        ),
        frontier=True,
    ),
)


def phase_e_pipeline(
    artifact_root: str,
    *,
    mode: str = "fixture",
    activity_delay_seconds: float = 0,
    fail_once_episode: str | None = None,
    environment: Mapping[str, str] | None = None,
) -> PodcastPipelineInput:
    """Build the complete historical ten-episode preset."""
    return phase_e_selection(
        artifact_root,
        episode_keys=tuple(episode.key for episode in EPISODES),
        mode=mode,
        activity_delay_seconds=activity_delay_seconds,
        fail_once_episode=fail_once_episode,
        environment=environment,
    )


def phase_e_selection(
    artifact_root: str,
    *,
    episode_keys: tuple[str, ...],
    mode: str = "fixture",
    activity_delay_seconds: float = 0,
    fail_once_episode: str | None = None,
    environment: Mapping[str, str] | None = None,
) -> PodcastPipelineInput:
    """Build a pipeline input for any selected subset of historical episodes."""
    if not episode_keys:
        raise ValueError("at least one episode key is required")
    if len(episode_keys) != len(set(episode_keys)):
        raise ValueError("episode keys must be unique")
    known = {episode.key for episode in EPISODES}
    unknown = sorted(set(episode_keys) - known)
    if unknown:
        raise ValueError(f"unknown episode keys: {', '.join(unknown)}")

    selected_keys = set(episode_keys)
    episodes = tuple(
        episode for episode in EPISODES if episode.key in selected_keys
    )
    selected_series_keys = {episode.series_key for episode in episodes}
    series = tuple(
        value for value in SERIES if value.key in selected_series_keys
    )
    values = environment or os.environ
    kwargs: dict[str, object] = {
        "series": series,
        "episodes": episodes,
        "artifact_root": artifact_root,
        "mode": mode,
        "fixture_path": str(PROJECT_ROOT / "fixtures" / "phasee_sources.json"),
        "source_context_root": str(SOURCE_CONTEXT_ROOT),
        "source_context_hashes": _source_context_hashes(series),
        "minimum_completed_episodes": len(episodes),
        "max_parallel_episodes": min(2, len(episodes)),
        "activity_retry_attempts": 3,
        "activity_delay_seconds": activity_delay_seconds,
        "fail_once_episode": fail_once_episode,
    }
    if mode == "live":
        scix_server, digest_server = live_mcp_servers(values)
        kwargs.update(
            {
                "scix_server": scix_server,
                "digest_server": digest_server,
                "writer": WriterCommand(
                    command=values.get("WRITER_COMMAND", "claude"),
                    args=tuple(shlex.split(values.get("WRITER_ARGS", "-p"))),
                ),
            }
        )
    return PodcastPipelineInput(**kwargs)  # type: ignore[arg-type]


def _source_context_hashes(
    series_values: tuple[PodcastSeries, ...],
) -> tuple[tuple[str, str], ...]:
    values: list[tuple[str, str]] = []
    for series in series_values:
        digest = hashlib.sha256()
        for name in ("bibliography.md", "brainstorm.md"):
            digest.update((SOURCE_CONTEXT_ROOT / series.key / name).read_bytes())
            digest.update(b"\0")
        values.append((series.key, digest.hexdigest()))
    return tuple(values)


def phase_e_demo(
    artifact_root: str,
    *,
    activity_delay_seconds: float = 0,
    fail_once_episode: str | None = None,
) -> PodcastPipelineInput:
    demo_keys = {"mas-ep4", "code-ep4"}
    episodes = tuple(episode for episode in EPISODES if episode.key in demo_keys)
    return PodcastPipelineInput(
        series=SERIES,
        episodes=episodes,
        artifact_root=artifact_root,
        mode="fixture",
        fixture_path=str(PROJECT_ROOT / "fixtures" / "phasee_sources.json"),
        minimum_completed_episodes=len(episodes),
        max_parallel_episodes=2,
        activity_retry_attempts=3,
        activity_delay_seconds=activity_delay_seconds,
        fail_once_episode=fail_once_episode,
    )
