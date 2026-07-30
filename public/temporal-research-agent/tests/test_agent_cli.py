import argparse
import json

import pytest
from temporalio.client import WorkflowFailureError

from durable_research import agent_cli
from durable_research.agent_lifecycle import ResultNotReady
from durable_research.models import Angle, ReviewInput


def test_parser_exposes_detached_lifecycle_commands() -> None:
    parser = agent_cli.build_parser()

    started = parser.parse_args(
        ["start", "request.json", "--workflow-id", "research-42"]
    )
    status = parser.parse_args(["status", "research-42", "--run-id", "run-7"])
    result = parser.parse_args(["result", "research-42"])
    waited = parser.parse_args(["wait", "research-42"])

    assert started.command == "start"
    assert started.workflow_id == "research-42"
    assert status.command == "status"
    assert status.run_id == "run-7"
    assert result.command == "result"
    assert waited.command == "wait"


@pytest.mark.asyncio
async def test_start_command_returns_without_waiting_for_result(monkeypatch, tmp_path) -> None:
    request_path = tmp_path / "request.json"
    request_path.write_text("{}")
    review = ReviewInput(
        topic="Detached",
        angles=(Angle("one", "Question?", "papers", "posts"),),
        artifact_root=str(tmp_path),
    )
    calls: list[tuple[str, str]] = []

    monkeypatch.setattr(agent_cli, "load_review_request", lambda path: review)

    async def fake_start(client, value, *, workflow_id, task_queue, ui_url):
        assert value is review
        calls.append((workflow_id, task_queue))
        return {
            "status": "STARTED",
            "workflow_id": workflow_id,
            "run_id": "run-99",
            "temporal_ui_url": f"{ui_url}/run-99",
        }

    monkeypatch.setattr(agent_cli, "start_review", fake_start)
    args = agent_cli.build_parser().parse_args(
        ["start", str(request_path), "--workflow-id", "research-99"]
    )

    output = await agent_cli.run_command(args, client=object())

    assert output["status"] == "STARTED"
    assert calls == [("research-99", "temporal-literature-review")]


@pytest.mark.asyncio
async def test_result_and_wait_select_nonblocking_or_blocking_read(monkeypatch) -> None:
    waits: list[bool] = []

    async def fake_result(client, *, workflow_id, run_id, wait):
        waits.append(wait)
        return {"workflow_id": workflow_id, "run_id": run_id, "status": "COMPLETED"}

    monkeypatch.setattr(agent_cli, "read_review_result", fake_result)
    parser = agent_cli.build_parser()

    await agent_cli.run_command(
        parser.parse_args(["result", "research-7", "--run-id", "run-7"]),
        client=object(),
    )
    await agent_cli.run_command(
        parser.parse_args(["wait", "research-7", "--run-id", "run-7"]),
        client=object(),
    )

    assert waits == [False, True]


@pytest.mark.asyncio
async def test_run_cli_prints_machine_readable_not_ready_error(monkeypatch, capsys) -> None:
    async def fake_connect(args: argparse.Namespace):
        return object()

    async def fake_run(args: argparse.Namespace, *, client):
        raise ResultNotReady("workflow research-7 is RUNNING")

    monkeypatch.setattr(agent_cli, "_connect", fake_connect)
    monkeypatch.setattr(agent_cli, "run_command", fake_run)

    exit_code = await agent_cli.run_cli(["result", "research-7"])
    captured = capsys.readouterr()

    assert exit_code == 2
    assert captured.out == ""
    assert json.loads(captured.err) == {
        "error": "result_not_ready",
        "message": "workflow research-7 is RUNNING",
    }


@pytest.mark.asyncio
async def test_run_cli_prints_machine_readable_workflow_failure(monkeypatch, capsys) -> None:
    async def fake_connect(args: argparse.Namespace):
        return object()

    async def fake_run(args: argparse.Namespace, *, client):
        raise WorkflowFailureError(cause=RuntimeError("minimum evidence gate failed"))

    monkeypatch.setattr(agent_cli, "_connect", fake_connect)
    monkeypatch.setattr(agent_cli, "run_command", fake_run)

    exit_code = await agent_cli.run_cli(["wait", "research-8"])
    captured = capsys.readouterr()

    assert exit_code == 1
    assert captured.out == ""
    assert json.loads(captured.err) == {
        "error": "workflow_failed",
        "message": "minimum evidence gate failed",
    }
