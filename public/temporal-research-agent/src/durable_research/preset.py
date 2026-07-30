from __future__ import annotations

import os
from collections.abc import Mapping
from pathlib import Path

from durable_research.models import Angle, McpServer, ReviewInput

TASK_QUEUE = "temporal-literature-review"
PROJECT_ROOT = Path(__file__).resolve().parents[2]


def live_mcp_servers(
    environment: Mapping[str, str] | None = None,
) -> tuple[McpServer, McpServer]:
    values = environment or os.environ
    scix = McpServer(
        command=values.get(
            "SCIX_PYTHON",
            "/home/ds/projects/scix_experiments/.venv/bin/python",
        ),
        args=("-m", "scix.mcp_server"),
        cwd=values.get(
            "SCIX_CWD",
            "/home/ds/projects/scix_experiments",
        ),
        env={
            "SCIX_EMBED_DEVICE": values.get("SCIX_EMBED_DEVICE", "cpu"),
            "QDRANT_URL": values.get("QDRANT_URL", "http://127.0.0.1:6633"),
        },
    )
    digest = McpServer(
        command=values.get("DIGEST_COMMAND", "npx"),
        args=(
            "tsx",
            values.get(
                "DIGEST_SERVER",
                "/home/ds/projects/code-intelligence-digest/src/mcp/server.ts",
            ),
        ),
        cwd=values.get(
            "DIGEST_CWD",
            "/home/ds/projects/code-intelligence-digest",
        ),
    )
    return scix, digest


def durable_agents_review(
    artifact_root: str,
    *,
    mode: str = "fixture",
    activity_delay_seconds: float = 0,
    fail_once_angle: str | None = None,
) -> ReviewInput:
    angles = (
        Angle(
            key="durable-execution",
            question="What state must survive process failure in an agent research pipeline?",
            scix_query="durable execution fault tolerant autonomous agents checkpoint recovery",
            digest_query="durable execution Temporal agents workflow recovery",
        ),
        Angle(
            key="tool-reliability",
            question="How should unreliable tool and retrieval calls be retried and observed?",
            scix_query="LLM agents tool reliability retries failure recovery observability",
            digest_query="agent tool retries observability production reliability",
        ),
        Angle(
            key="state-and-memory",
            question="Where is the boundary between orchestration state and research artifacts?",
            scix_query="agent memory persistent state workflow artifacts provenance",
            digest_query="agent state artifacts provenance workflow history",
        ),
        Angle(
            key="evaluation",
            question=(
                "How do we test that recovery preserves correctness rather than only completion?"
            ),
            scix_query="agent evaluation failure recovery process correctness benchmark",
            digest_query="agent evaluation replay failure recovery correctness",
        ),
    )
    fixture_path = str(PROJECT_ROOT / "fixtures" / "sources.json")
    kwargs: dict[str, object] = {
        "topic": "Durable literature-review agents",
        "angles": angles,
        "artifact_root": artifact_root,
        "mode": mode,
        "fixture_path": fixture_path,
        "minimum_completed_angles": 3,
        "max_parallel_angles": 2,
        "activity_retry_attempts": 3,
        "activity_delay_seconds": activity_delay_seconds,
        "fail_once_angle": fail_once_angle,
    }
    if mode == "live":
        scix_server, digest_server = live_mcp_servers()
        kwargs.update(
            {
                "scix_server": scix_server,
                "digest_server": digest_server,
            }
        )
    return ReviewInput(**kwargs)  # type: ignore[arg-type]
