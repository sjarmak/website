from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
import uuid
from collections.abc import Sequence
from typing import Any

from temporalio.client import Client, WorkflowFailureError
from temporalio.exceptions import WorkflowAlreadyStartedError
from temporalio.service import RPCError

from durable_research.agent_contract import load_review_request
from durable_research.agent_lifecycle import (
    ResultNotReady,
    describe_review,
    read_review_result,
    start_review,
)
from durable_research.models import stable_review_id
from durable_research.preset import TASK_QUEUE


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="durable-research",
        description="Start and inspect Temporal-backed literature reviews",
    )
    parser.add_argument(
        "--address",
        default=os.environ.get("TEMPORAL_ADDRESS", "localhost:7233"),
        help="Temporal frontend address (default: TEMPORAL_ADDRESS or localhost:7233)",
    )
    parser.add_argument(
        "--namespace",
        default=os.environ.get("TEMPORAL_NAMESPACE", "default"),
        help="Temporal namespace (default: TEMPORAL_NAMESPACE or default)",
    )
    parser.add_argument(
        "--ui-url",
        default=os.environ.get("TEMPORAL_UI_URL", "http://localhost:8233"),
        help="Temporal Web base URL included in start output",
    )
    commands = parser.add_subparsers(dest="command", required=True)

    start = commands.add_parser("start", help="Start a review and return immediately")
    start.add_argument("request", help="Path to a JSON research request")
    start.add_argument("--workflow-id")
    start.add_argument(
        "--task-queue",
        default=os.environ.get("TEMPORAL_RESEARCH_TASK_QUEUE", TASK_QUEUE),
    )

    status = commands.add_parser("status", help="Describe a review and query progress")
    _add_execution_identity(status)
    status.add_argument(
        "--no-progress",
        action="store_true",
        help="Skip the Workflow progress Query",
    )

    result = commands.add_parser(
        "result",
        help="Read a completed result without waiting",
    )
    _add_execution_identity(result)

    wait = commands.add_parser("wait", help="Wait for and return the result")
    _add_execution_identity(wait)
    return parser


async def run_command(args: argparse.Namespace, *, client: Client) -> dict[str, Any]:
    if args.command == "start":
        review = load_review_request(args.request)
        workflow_id = args.workflow_id or (
            f"{stable_review_id(review)}-{uuid.uuid4().hex[:8]}"
        )
        return await start_review(
            client,
            review,
            workflow_id=workflow_id,
            task_queue=args.task_queue,
            ui_url=args.ui_url,
        )
    if args.command == "status":
        return await describe_review(
            client,
            workflow_id=args.workflow_id,
            run_id=args.run_id,
            include_progress=not args.no_progress,
        )
    if args.command in {"result", "wait"}:
        return await read_review_result(
            client,
            workflow_id=args.workflow_id,
            run_id=args.run_id,
            wait=args.command == "wait",
        )
    raise AssertionError(f"unhandled command: {args.command}")


async def run_cli(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        client = await _connect(args)
        output = await run_command(args, client=client)
    except ResultNotReady as error:
        _print_error("result_not_ready", str(error))
        return 2
    except (ValueError, FileNotFoundError, json.JSONDecodeError) as error:
        _print_error("invalid_request", str(error))
        return 2
    except WorkflowAlreadyStartedError as error:
        _print_error("workflow_already_started", str(error))
        return 2
    except WorkflowFailureError as error:
        _print_error("workflow_failed", str(error.cause))
        return 1
    except RPCError as error:
        _print_error("temporal_rpc_error", str(error))
        return 1
    print(json.dumps(output, indent=2, sort_keys=True), flush=True)
    return 0


async def _connect(args: argparse.Namespace) -> Client:
    return await Client.connect(args.address, namespace=args.namespace)


def _add_execution_identity(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("workflow_id")
    parser.add_argument("--run-id")


def _print_error(kind: str, message: str) -> None:
    print(
        json.dumps({"error": kind, "message": message}, sort_keys=True),
        file=sys.stderr,
        flush=True,
    )


def main() -> None:
    raise SystemExit(asyncio.run(run_cli()))


if __name__ == "__main__":
    main()
