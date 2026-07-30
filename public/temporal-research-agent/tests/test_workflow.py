import base64
import json
from datetime import timedelta

import pytest
from temporalio import activity
from temporalio.client import Client
from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker

from durable_research.models import (
    Angle,
    BranchRequest,
    BranchResult,
    FinalizeRequest,
    ReviewInput,
    ReviewResult,
    SectionRequest,
    VerifyRequest,
)
from durable_research.workflow import LiteratureReviewWorkflow


@activity.defn(name="research_angle")
async def stub_research(request: BranchRequest) -> BranchResult:
    if request.angle.key == "fails":
        raise RuntimeError("source is unavailable")
    return BranchResult(angle_key=request.angle.key, status="researched")


@activity.defn(name="verify_evidence")
async def stub_verify(request: VerifyRequest) -> BranchResult:
    return BranchResult(angle_key=request.branch.angle_key, status="verified")


@activity.defn(name="synthesize_section")
async def stub_section(request: SectionRequest) -> BranchResult:
    return BranchResult(
        angle_key=request.branch.angle_key,
        status="complete",
        section_ref=f"sections/{request.branch.angle_key}.md",
    )


@activity.defn(name="finalize_review")
async def stub_finalize(request: FinalizeRequest) -> ReviewResult:
    completed = tuple(
        branch.angle_key for branch in request.branches if branch.status == "complete"
    )
    failed = tuple(branch.angle_key for branch in request.branches if branch.status == "failed")
    return ReviewResult(
        review_id=request.review_id,
        report_ref="report.md",
        manifest_ref="manifest.json",
        completed_angles=completed,
        failed_angles=failed,
    )


@pytest.mark.asyncio
async def test_workflow_recovers_partial_results_and_exposes_progress() -> None:
    async with await WorkflowEnvironment.start_time_skipping() as env:
        task_queue = "test-literature-review"
        async with Worker(
            env.client,
            task_queue=task_queue,
            workflows=[LiteratureReviewWorkflow],
            activities=[stub_research, stub_verify, stub_section, stub_finalize],
        ):
            handle = await env.client.start_workflow(
                LiteratureReviewWorkflow.run,
                ReviewInput(
                    topic="Durable agents",
                    angles=(
                        Angle("works", "Works?", "papers", "posts"),
                        Angle("fails", "Fails?", "papers", "posts"),
                    ),
                    artifact_root="/tmp/not-used-by-stubs",
                    minimum_completed_angles=1,
                    activity_retry_attempts=1,
                ),
                id="workflow-test-partial",
                task_queue=task_queue,
                execution_timeout=timedelta(seconds=30),
            )
            result = await handle.result()
            progress = await handle.query(LiteratureReviewWorkflow.progress)

    assert result.completed_angles == ("works",)
    assert result.failed_angles == ("fails",)
    assert progress.phase == "complete"
    assert progress.completed == 1
    assert progress.failed == 1


@pytest.mark.asyncio
async def test_workflow_history_contains_refs_not_large_evidence(tmp_path) -> None:
    sentinel = "FULL-TEXT-SENTINEL-" + ("x" * 20_000)

    @activity.defn(name="research_angle")
    async def storing_research(request: BranchRequest) -> BranchResult:
        evidence = tmp_path / "large-source.txt"
        evidence.write_text(sentinel)
        return BranchResult(
            angle_key=request.angle.key,
            status="researched",
            evidence_ref=str(evidence),
        )

    async with await WorkflowEnvironment.start_time_skipping() as env:
        task_queue = "test-compact-history"
        async with Worker(
            env.client,
            task_queue=task_queue,
            workflows=[LiteratureReviewWorkflow],
            activities=[storing_research, stub_verify, stub_section, stub_finalize],
        ):
            result = await env.client.execute_workflow(
                LiteratureReviewWorkflow.run,
                ReviewInput(
                    topic="Compact histories",
                    angles=(Angle("one", "Question?", "papers", "posts"),),
                    artifact_root=str(tmp_path),
                ),
                id="workflow-test-compact",
                task_queue=task_queue,
            )
            assert result.completed_angles == ("one",)
            history = await _history_json(env.client, "workflow-test-compact")

    assert sentinel not in history
    assert "large-source.txt" in history


async def _history_json(client: Client, workflow_id: str) -> str:
    handle = client.get_workflow_handle(workflow_id)
    history = json.loads((await handle.fetch_history()).to_json())
    decoded_payloads: list[str] = []

    def visit(value: object) -> None:
        if isinstance(value, dict):
            for key, child in value.items():
                if key == "data" and isinstance(child, str):
                    try:
                        decoded_payloads.append(base64.b64decode(child).decode(errors="replace"))
                    except ValueError:
                        pass
                else:
                    visit(child)
        elif isinstance(value, list):
            for child in value:
                visit(child)

    visit(history)
    return "\n".join(decoded_payloads)
