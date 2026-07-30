from pathlib import Path

import pytest
from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker

from durable_research.activities import (
    finalize_review,
    research_angle,
    synthesize_section,
    verify_evidence,
)
from durable_research.agent_lifecycle import (
    ResultNotReady,
    describe_review,
    read_review_result,
    start_review,
)
from durable_research.models import Angle, ReviewInput
from durable_research.workflow import LiteratureReviewWorkflow


@pytest.mark.asyncio
async def test_detached_lifecycle_can_be_reopened_by_workflow_and_run_id(tmp_path) -> None:
    fixture_path = _write_fixture(tmp_path)
    review = ReviewInput(
        topic="Caller-independent research",
        angles=(Angle("recovery", "How?", "papers", "posts"),),
        artifact_root=str(tmp_path / "artifacts"),
        mode="fixture",
        fixture_path=str(fixture_path),
    )

    async with await WorkflowEnvironment.start_time_skipping() as env:
        task_queue = "agent-lifecycle-test"
        async with Worker(
            env.client,
            task_queue=task_queue,
            workflows=[LiteratureReviewWorkflow],
            activities=[research_angle, verify_evidence, synthesize_section, finalize_review],
        ):
            started = await start_review(
                env.client,
                review,
                workflow_id="agent-lifecycle-review",
                task_queue=task_queue,
                ui_url="http://localhost:8233",
            )
            result = await read_review_result(
                env.client,
                workflow_id=started["workflow_id"],
                run_id=started["run_id"],
                wait=True,
            )

        status = await describe_review(
            env.client,
            workflow_id=started["workflow_id"],
            run_id=started["run_id"],
            include_progress=False,
        )

    assert started["status"] == "STARTED"
    assert started["workflow_id"] == "agent-lifecycle-review"
    assert started["run_id"]
    assert started["temporal_ui_url"].endswith(
        "/namespaces/default/workflows/agent-lifecycle-review/"
        f"{started['run_id']}/history"
    )
    assert result["status"] == "COMPLETED"
    assert result["result"]["completed_angles"] == ["recovery"]
    assert status["status"] == "COMPLETED"
    assert status["history_length"] > 0


@pytest.mark.asyncio
async def test_nonblocking_result_reports_running_execution(tmp_path) -> None:
    fixture_path = _write_fixture(tmp_path)
    review = ReviewInput(
        topic="Still running",
        angles=(Angle("recovery", "How?", "papers", "posts"),),
        artifact_root=str(tmp_path / "artifacts"),
        mode="fixture",
        fixture_path=str(fixture_path),
        activity_delay_seconds=5,
    )

    async with await WorkflowEnvironment.start_time_skipping() as env:
        task_queue = "agent-not-ready-test"
        async with Worker(
            env.client,
            task_queue=task_queue,
            workflows=[LiteratureReviewWorkflow],
            activities=[research_angle, verify_evidence, synthesize_section, finalize_review],
        ):
            started = await start_review(
                env.client,
                review,
                workflow_id="agent-not-ready-review",
                task_queue=task_queue,
                ui_url="http://localhost:8233",
            )
            with pytest.raises(ResultNotReady, match="RUNNING"):
                await read_review_result(
                    env.client,
                    workflow_id=started["workflow_id"],
                    run_id=started["run_id"],
                    wait=False,
                )


def _write_fixture(root: Path) -> Path:
    fixture = root / "fixture.json"
    fixture.write_text(
        """
{
  "recovery": {
    "scix": [
      {
        "id": "paper-9",
        "title": "Recovery",
        "locator": "doi:10.example/recovery",
        "summary": "Workflow state survives a caller exit."
      }
    ],
    "digest": [
      {
        "id": "post-4",
        "title": "Operator report",
        "locator": "https://example.test/recovery",
        "summary": "Workers can be replaced independently."
      }
    ]
  }
}
""".strip()
        + "\n"
    )
    return fixture
