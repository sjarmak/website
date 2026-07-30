from __future__ import annotations

from dataclasses import asdict
from datetime import timedelta
from typing import Any
from urllib.parse import quote

from temporalio.client import (
    Client,
    WorkflowExecutionStatus,
    WorkflowQueryFailedError,
    WorkflowQueryRejectedError,
)
from temporalio.service import RPCError

from durable_research.models import ReviewInput, ReviewResult
from durable_research.workflow import LiteratureReviewWorkflow


class ResultNotReady(RuntimeError):
    pass


async def start_review(
    client: Client,
    review: ReviewInput,
    *,
    workflow_id: str,
    task_queue: str,
    ui_url: str,
) -> dict[str, Any]:
    handle = await client.start_workflow(
        LiteratureReviewWorkflow.run,
        review,
        id=workflow_id,
        task_queue=task_queue,
        static_summary=f"Durable research: {review.topic}",
    )
    run_id = handle.result_run_id
    if run_id is None:
        raise RuntimeError("Temporal did not return a run ID")
    return {
        "status": "STARTED",
        "workflow_id": handle.id,
        "run_id": run_id,
        "temporal_ui_url": _workflow_url(ui_url, handle.id, run_id),
    }


async def describe_review(
    client: Client,
    *,
    workflow_id: str,
    run_id: str | None = None,
    include_progress: bool = True,
) -> dict[str, Any]:
    handle = client.get_workflow_handle(
        workflow_id,
        run_id=run_id,
        result_type=ReviewResult,
    )
    description = await handle.describe()
    view: dict[str, Any] = {
        "workflow_id": description.id,
        "run_id": description.run_id,
        "status": _status_name(description.status),
        "task_queue": description.task_queue,
        "history_length": description.history_length,
        "start_time": description.start_time.isoformat(),
        "close_time": (
            description.close_time.isoformat() if description.close_time is not None else None
        ),
    }
    if include_progress:
        try:
            progress = await handle.query(
                LiteratureReviewWorkflow.progress,
                rpc_timeout=timedelta(seconds=2),
            )
            view["progress"] = asdict(progress)
        except (RPCError, WorkflowQueryFailedError, WorkflowQueryRejectedError) as error:
            view["progress"] = None
            view["progress_unavailable"] = type(error).__name__
    return view


async def read_review_result(
    client: Client,
    *,
    workflow_id: str,
    run_id: str | None = None,
    wait: bool,
) -> dict[str, Any]:
    handle = client.get_workflow_handle(
        workflow_id,
        run_id=run_id,
        result_type=ReviewResult,
    )
    if not wait:
        description = await handle.describe()
        if description.status != WorkflowExecutionStatus.COMPLETED:
            raise ResultNotReady(
                f"workflow {workflow_id} is {_status_name(description.status)}"
            )
    result = await handle.result()
    description = await handle.describe()
    return {
        "workflow_id": description.id,
        "run_id": description.run_id,
        "status": _status_name(description.status),
        "result": {
            "review_id": result.review_id,
            "report_ref": result.report_ref,
            "manifest_ref": result.manifest_ref,
            "completed_angles": list(result.completed_angles),
            "failed_angles": list(result.failed_angles),
        },
    }


def _status_name(status: WorkflowExecutionStatus | None) -> str:
    return status.name if status is not None else "UNKNOWN"


def _workflow_url(base_url: str, workflow_id: str, run_id: str) -> str:
    base = base_url.rstrip("/")
    return (
        f"{base}/namespaces/default/workflows/"
        f"{quote(workflow_id, safe='')}/{quote(run_id, safe='')}/history"
    )
