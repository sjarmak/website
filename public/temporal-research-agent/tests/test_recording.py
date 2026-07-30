import json
from pathlib import Path

import pytest

from durable_research.recording import RecordingVerificationError, verify_recording


def write_evidence(tmp_path: Path) -> tuple[Path, Path, Path]:
    evidence_dir = tmp_path / "evidence"
    evidence_dir.mkdir()
    (evidence_dir / "run.json").write_text(
        json.dumps(
            {
                "workflow_id": "temporal-lit-review-demo",
                "run_id": "run-123",
                "status": "COMPLETED",
                "killed_worker_pid": 4101,
                "replacement_worker_pid": 4202,
                "completed_angles": 4,
                "failed_angles": 0,
            }
        )
    )
    (evidence_dir / "history.json").write_text(
        json.dumps(
            {
                "events": [
                    {
                        "eventType": "EVENT_TYPE_ACTIVITY_TASK_STARTED",
                        "activityTaskStartedEventAttributes": {
                            "identity": "4101@demo",
                            "attempt": 1,
                        },
                    },
                    {
                        "eventType": "EVENT_TYPE_ACTIVITY_TASK_STARTED",
                        "activityTaskStartedEventAttributes": {
                            "identity": "4202@demo",
                            "attempt": 2,
                            "lastFailure": {
                                "timeoutFailureInfo": {
                                    "timeoutType": "TIMEOUT_TYPE_HEARTBEAT"
                                }
                            },
                        },
                    },
                ]
            }
        )
    )
    cast_path = tmp_path / "recovery.cast"
    cast_path.write_text(
        '{"version":2,"width":120,"height":30,"timestamp":1,"env":{"TERM":"xterm"}}\n'
        '[0.1,"o","Kill Worker PID 4101 while Activities are running\\r\\n"]\n'
        '[0.2,"o","Pending Activities: 2\\r\\n"]\n'
        '[0.3,"o","Restart Worker PID 4202; the same Workflow run resumes\\r\\n"]\n'
        '[0.4,"o","Status          COMPLETED\\r\\n"]\n'
        '[0.5,"o","Event History confirms heartbeat timeout and replacement '
        'Activity attempts. This padding also represents normal command output.\\r\\n"]\n'
        '[0.6,"o","Report and provenance manifest were written successfully. '
        'All four research angles completed under the original run.\\r\\n"]\n'
    )
    webui_path = tmp_path / "webui.webm"
    webui_path.write_bytes(b"webm" * 300)
    return evidence_dir, cast_path, webui_path


def test_recording_gate_accepts_real_recovery_evidence(tmp_path: Path) -> None:
    evidence_dir, cast_path, webui_path = write_evidence(tmp_path)

    report = verify_recording(evidence_dir, cast_path, webui_path)

    assert report.workflow_id == "temporal-lit-review-demo"
    assert report.run_id == "run-123"
    assert report.retry_attempts == 1
    assert report.checks == 8


@pytest.mark.parametrize(
    ("field", "value", "message"),
    [
        ("status", "RUNNING", "completed Workflow"),
        ("replacement_worker_pid", 4101, "distinct Worker PIDs"),
        ("completed_angles", 3, "all four research angles"),
    ],
)
def test_recording_gate_rejects_invalid_run_metadata(
    tmp_path: Path, field: str, value: object, message: str
) -> None:
    evidence_dir, cast_path, webui_path = write_evidence(tmp_path)
    run_path = evidence_dir / "run.json"
    run = json.loads(run_path.read_text())
    run[field] = value
    run_path.write_text(json.dumps(run))

    with pytest.raises(RecordingVerificationError, match=message):
        verify_recording(evidence_dir, cast_path, webui_path)


def test_recording_gate_requires_heartbeat_retry(tmp_path: Path) -> None:
    evidence_dir, cast_path, webui_path = write_evidence(tmp_path)
    history_path = evidence_dir / "history.json"
    history = json.loads(history_path.read_text())
    history["events"][1]["activityTaskStartedEventAttributes"]["attempt"] = 1
    history_path.write_text(json.dumps(history))

    with pytest.raises(RecordingVerificationError, match="attempt 2"):
        verify_recording(evidence_dir, cast_path, webui_path)


def test_recording_gate_requires_both_recording_lanes(tmp_path: Path) -> None:
    evidence_dir, cast_path, webui_path = write_evidence(tmp_path)
    webui_path.write_bytes(b"")

    with pytest.raises(RecordingVerificationError, match="Temporal Web"):
        verify_recording(evidence_dir, cast_path, webui_path)
