from __future__ import annotations

import asyncio
import os
from datetime import timedelta

from temporalio.client import Client
from temporalio.worker import Worker

from durable_research.podcast_activities import (
    research_episode,
    write_deep_dive,
    write_pipeline_manifest,
    write_podcast_script,
    write_series_review,
)
from durable_research.podcast_preset import TASK_QUEUE
from durable_research.podcast_workflow import PodcastResearchWorkflow


async def run_worker() -> None:
    address = os.environ.get("TEMPORAL_ADDRESS", "localhost:7233")
    client = await Client.connect(address)
    worker = Worker(
        client,
        task_queue=TASK_QUEUE,
        workflows=[PodcastResearchWorkflow],
        activities=[
            research_episode,
            write_deep_dive,
            write_podcast_script,
            write_series_review,
            write_pipeline_manifest,
        ],
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
