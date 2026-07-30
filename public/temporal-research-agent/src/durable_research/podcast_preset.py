from __future__ import annotations

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
            "What multi-agent orchestration is and why or when it helps versus a "
            "single agent. Cover orchestrator-worker, hierarchical, swarm, "
            "blackboard, and pipeline topologies."
        ),
        (
            "2024arXiv240201680G",
            "2024arXiv241104468F",
            "2026arXiv260502431W",
        ),
    ),
    PodcastEpisode(
        "mas",
        2,
        "patterns-and-frameworks",
        "Patterns & Frameworks",
        (
            "Planning, decomposition, routing, handoffs, debate, voting, and the "
            "frameworks and interoperability protocols that encode those patterns."
        ),
        (
            "2023arXiv230808155W",
            "2023arXiv230800352H",
            "2025arXiv250323278H",
        ),
    ),
    PodcastEpisode(
        "mas",
        3,
        "memory-in-mas",
        "Memory in Multi-Agent Systems",
        (
            "Shared versus per-agent memory, blackboards and ledgers, shared "
            "knowledge graphs, workflow memory, and durable team substrates."
        ),
        (
            "2025arXiv250406135H",
            "2024arXiv240907429Z",
            "2024arXiv241104468F",
        ),
    ),
    PodcastEpisode(
        "mas",
        4,
        "enterprise-and-production",
        "Enterprise & Production",
        (
            "Production reliability and failure modes, observability, evaluation, "
            "guardrails, cross-agent security, cost, latency, and human oversight."
        ),
        (
            "2025arXiv250313657C",
            "2024arXiv241007283L",
            "2026arXiv260411641L",
        ),
    ),
    PodcastEpisode(
        "mas",
        5,
        "frontier-and-open-problems",
        "Frontier & Open Problems",
        (
            "Causal failure attribution, verified coordination, cost-bounded "
            "orchestration, durable team memory, calibrated consensus, learned "
            "topology, and trace standards."
        ),
        (
            "2026arXiv260507935X",
            "2026arXiv260407667F",
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
            "How structure, symbols, references, and the natural-language intent "
            "gap distinguish code retrieval from text information retrieval."
        ),
        (
            "2019arXiv190909436H",
            "2020arXiv200208155F",
            "2024arXiv240702883L",
        ),
    ),
    PodcastEpisode(
        "code",
        2,
        "techniques-lexical-neural-graph",
        "Techniques: Lexical → Neural → Graph",
        (
            "The technique ladder from lexical retrieval through code embeddings, "
            "graph retrieval, late interaction, and hybrid reranking."
        ),
        (
            "2020arXiv200908366G",
            "2021arXiv210900859W",
            "2020arXiv200412832K",
        ),
    ),
    PodcastEpisode(
        "code",
        3,
        "repo-scale-and-code-graphs",
        "Repository-Scale & Code Graphs",
        (
            "Cross-file and repository retrieval, static-analysis guidance, code "
            "property graphs, knowledge graphs, and agentic codebase navigation."
        ),
        (
            "2023arXiv230312570Z",
            "2023arXiv231011248D",
            "2024arXiv240515793Y",
        ),
    ),
    PodcastEpisode(
        "code",
        4,
        "enterprise-codebase-challenges",
        "The Unique Challenges of Large Enterprise Codebases",
        (
            "Monorepos, polyglot dependencies, access-control boundaries, stale "
            "code, tribal knowledge, build complexity, and honest evaluation."
        ),
        (
            "2024arXiv240601359D",
            "2024arXiv240606025L",
            "2026arXiv260508112D",
        ),
    ),
    PodcastEpisode(
        "code",
        5,
        "frontier-and-open-problems",
        "Frontier & Open Problems",
        (
            "Access-aware retrieval, contamination-proof evaluation, scalable "
            "symbolic-semantic indexes, staleness, polyglot dependencies, build "
            "graphs, and incremental indexing."
        ),
        (
            "2026arXiv260502421L",
            "2026arXiv260508112D",
            "2025arXiv250309089C",
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
    values = environment or os.environ
    kwargs: dict[str, object] = {
        "series": SERIES,
        "episodes": EPISODES,
        "artifact_root": artifact_root,
        "mode": mode,
        "fixture_path": str(PROJECT_ROOT / "fixtures" / "phasee_sources.json"),
        "minimum_completed_episodes": len(EPISODES),
        "max_parallel_episodes": 2,
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
