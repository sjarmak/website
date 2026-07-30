from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


class RecordingVerificationError(ValueError):
    """Raised when captured demo artifacts do not prove the recovery claim."""


@dataclass(frozen=True)
class RecordingReport:
    workflow_id: str
    run_id: str
    retry_attempts: int
    checks: int


def _load_object(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError) as error:
        raise RecordingVerificationError(f"cannot read valid JSON evidence: {path}") from error
    if not isinstance(value, dict):
        raise RecordingVerificationError(f"expected a JSON object: {path}")
    return value


def _require(condition: bool, message: str) -> None:
    if not condition:
        raise RecordingVerificationError(message)


def verify_recording(
    evidence_dir: Path,
    cast_path: Path,
    webui_path: Path,
) -> RecordingReport:
    """Verify that the two recording lanes capture a real Temporal recovery."""

    run = _load_object(evidence_dir / "run.json")
    history = _load_object(evidence_dir / "history.json")

    workflow_id = run.get("workflow_id")
    run_id = run.get("run_id")
    if (
        not isinstance(workflow_id, str)
        or not workflow_id
        or not isinstance(run_id, str)
        or not run_id
    ):
        raise RecordingVerificationError("run evidence must name one Workflow ID and run ID")
    _require(run.get("status") == "COMPLETED", "recording must show a completed Workflow")

    killed_pid = run.get("killed_worker_pid")
    replacement_pid = run.get("replacement_worker_pid")
    _require(
        isinstance(killed_pid, int)
        and isinstance(replacement_pid, int)
        and killed_pid > 0
        and replacement_pid > 0
        and killed_pid != replacement_pid,
        "recording must show distinct Worker PIDs",
    )
    _require(
        run.get("completed_episode_keys") == ["mas-ep4", "code-ep4"]
        and run.get("failed_episode_keys") == [],
        "recording must complete both demonstration episodes",
    )
    _require(
        run.get("series_review_keys") == ["mas", "code"],
        "recording must produce both series reviews",
    )

    events = history.get("events")
    if not isinstance(events, list):
        raise RecordingVerificationError("Event History evidence must contain an events list")
    retry_events: list[dict[str, Any]] = []
    for event in events:
        if not isinstance(event, dict):
            continue
        attributes = event.get("activityTaskStartedEventAttributes")
        if not isinstance(attributes, dict) or attributes.get("attempt") != 2:
            continue
        failure = attributes.get("lastFailure")
        timeout = failure.get("timeoutFailureInfo") if isinstance(failure, dict) else None
        if (
            isinstance(timeout, dict)
            and timeout.get("timeoutType") == "TIMEOUT_TYPE_HEARTBEAT"
            and str(replacement_pid) in str(attributes.get("identity", ""))
        ):
            retry_events.append(attributes)
    _require(
        bool(retry_events),
        "Event History must show a heartbeat timeout followed by Activity attempt 2",
    )

    try:
        cast_text = cast_path.read_text()
    except OSError as error:
        raise RecordingVerificationError(f"cannot read terminal recording: {cast_path}") from error
    normalized_cast_text = " ".join(cast_text.split())
    required_cast_text = (
        f"Kill Worker PID {killed_pid}",
        "Pending Activities: 2",
        f"Restart Worker PID {replacement_pid}",
        "Status COMPLETED",
    )
    _require(
        cast_path.stat().st_size >= 500
        and all(text in normalized_cast_text for text in required_cast_text),
        "terminal recording must show the kill, pending Activities, replacement, and completion",
    )
    _require(
        webui_path.is_file() and webui_path.stat().st_size >= 1_000,
        "Temporal Web recording is missing or empty",
    )

    return RecordingReport(
        workflow_id=workflow_id,
        run_id=run_id,
        retry_attempts=len(retry_events),
        checks=8,
    )
