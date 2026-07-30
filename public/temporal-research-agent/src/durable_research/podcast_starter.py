from __future__ import annotations

import argparse
import asyncio
import json
import os

from temporalio.client import Client

from durable_research.podcast_models import stable_pipeline_id
from durable_research.podcast_preset import (
    EPISODES,
    TASK_QUEUE,
    phase_e_demo,
    phase_e_pipeline,
    phase_e_selection,
)
from durable_research.podcast_workflow import PodcastResearchWorkflow


def parser() -> argparse.ArgumentParser:
    value = argparse.ArgumentParser(description="Start the Temporalized phaseE pipeline")
    value.add_argument("--scope", choices=("demo", "full"), default="demo")
    value.add_argument("--mode", choices=("fixture", "live"), default="fixture")
    value.add_argument("--artifacts", default="artifacts")
    value.add_argument("--delay", type=float, default=0)
    value.add_argument("--fail-once", metavar="EPISODE_KEY")
    value.add_argument("--workflow-id")
    value.add_argument(
        "--episode-key",
        action="append",
        choices=tuple(episode.key for episode in EPISODES),
        help=(
            "run only this episode; repeat the option to select several episodes "
            "from the preserved business input"
        ),
    )
    return value


async def start(args: argparse.Namespace) -> None:
    if args.episode_key:
        pipeline = phase_e_selection(
            args.artifacts,
            episode_keys=tuple(args.episode_key),
            mode=args.mode,
            activity_delay_seconds=args.delay,
            fail_once_episode=args.fail_once,
        )
    elif args.scope == "demo":
        if args.mode != "fixture":
            raise ValueError("the bounded demo scope is fixture-backed")
        pipeline = phase_e_demo(
            args.artifacts,
            activity_delay_seconds=args.delay,
            fail_once_episode=args.fail_once,
        )
    else:
        pipeline = phase_e_pipeline(
            args.artifacts,
            mode=args.mode,
            activity_delay_seconds=args.delay,
            fail_once_episode=args.fail_once,
        )
    workflow_id = args.workflow_id or f"{stable_pipeline_id(pipeline)}-demo"
    address = os.environ.get("TEMPORAL_ADDRESS", "localhost:7233")
    client = await Client.connect(address)
    handle = await client.start_workflow(
        PodcastResearchWorkflow.run,
        pipeline,
        id=workflow_id,
        task_queue=TASK_QUEUE,
    )
    print(f"started: workflow_id={handle.id} run_id={handle.result_run_id}", flush=True)
    ui_url = os.environ.get("TEMPORAL_UI_URL", "http://localhost:8233")
    print(f"Temporal UI: {ui_url}", flush=True)
    result = await handle.result()
    print(json.dumps(result.__dict__, default=lambda value: value.__dict__, indent=2), flush=True)


def main() -> None:
    args = parser().parse_args()
    args.artifacts = os.path.abspath(args.artifacts)
    asyncio.run(start(args))


if __name__ == "__main__":
    main()
