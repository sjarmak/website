from __future__ import annotations

import argparse
import asyncio
import json
import os

from temporalio.client import Client

from durable_research.models import stable_review_id
from durable_research.preset import TASK_QUEUE, durable_agents_review
from durable_research.workflow import LiteratureReviewWorkflow


def parser() -> argparse.ArgumentParser:
    value = argparse.ArgumentParser(description="Start the durable literature-review demo")
    value.add_argument("--mode", choices=("fixture", "live"), default="fixture")
    value.add_argument("--artifacts", default="artifacts")
    value.add_argument("--delay", type=float, default=0)
    value.add_argument("--fail-once", metavar="ANGLE")
    value.add_argument("--workflow-id")
    return value


async def start(args: argparse.Namespace) -> None:
    review = durable_agents_review(
        args.artifacts,
        mode=args.mode,
        activity_delay_seconds=args.delay,
        fail_once_angle=args.fail_once,
    )
    workflow_id = args.workflow_id or f"{stable_review_id(review)}-demo"
    address = os.environ.get("TEMPORAL_ADDRESS", "localhost:7233")
    client = await Client.connect(address)
    handle = await client.start_workflow(
        LiteratureReviewWorkflow.run,
        review,
        id=workflow_id,
        task_queue=TASK_QUEUE,
    )
    print(f"started: workflow_id={handle.id} run_id={handle.result_run_id}", flush=True)
    ui_url = os.environ.get("TEMPORAL_UI_URL", "http://localhost:8233")
    print(f"Temporal UI: {ui_url}", flush=True)
    result = await handle.result()
    print(json.dumps(result.__dict__, indent=2), flush=True)


def main() -> None:
    args = parser().parse_args()
    args.artifacts = os.path.abspath(args.artifacts)
    asyncio.run(start(args))


if __name__ == "__main__":
    main()
