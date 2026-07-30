from __future__ import annotations

import asyncio
import os
from datetime import timedelta

from temporalio.client import Client
from temporalio.worker import Worker

from durable_research.activities import (
    finalize_review,
    research_angle,
    synthesize_section,
    verify_evidence,
)
from durable_research.preset import TASK_QUEUE
from durable_research.workflow import LiteratureReviewWorkflow


async def run_worker() -> None:
    address = os.environ.get("TEMPORAL_ADDRESS", "localhost:7233")
    client = await Client.connect(address)
    worker = Worker(
        client,
        task_queue=TASK_QUEUE,
        workflows=[LiteratureReviewWorkflow],
        activities=[research_angle, verify_evidence, synthesize_section, finalize_review],
        graceful_shutdown_timeout=timedelta(seconds=30),
    )
    print(f"worker ready: pid={os.getpid()} queue={TASK_QUEUE} server={address}", flush=True)
    print(f"demo recovery: kill -9 {os.getpid()}, then run the worker again", flush=True)
    await worker.run()


def main() -> None:
    try:
        asyncio.run(run_worker())
    except KeyboardInterrupt:
        print("worker stopped", flush=True)


if __name__ == "__main__":
    main()
