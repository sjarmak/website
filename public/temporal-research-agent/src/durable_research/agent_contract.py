from __future__ import annotations

import json
import os
from collections.abc import Mapping
from pathlib import Path
from typing import Any, cast

from durable_research.models import Angle, ReviewInput
from durable_research.preset import live_mcp_servers

_REQUEST_FIELDS = {
    "topic",
    "angles",
    "artifact_root",
    "mode",
    "fixture_path",
    "minimum_completed_angles",
    "max_parallel_angles",
    "activity_retry_attempts",
}
_ANGLE_FIELDS = {"key", "question", "scix_query", "digest_query"}


def load_review_request(
    request_path: str | Path,
    *,
    environment: Mapping[str, str] | None = None,
) -> ReviewInput:
    path = Path(request_path).expanduser().resolve()
    raw = json.loads(path.read_text())
    if not isinstance(raw, dict):
        raise ValueError("request must be a JSON object")
    payload = cast(dict[str, Any], raw)
    unknown = set(payload) - _REQUEST_FIELDS
    if unknown:
        raise ValueError(f"unknown request fields: {', '.join(sorted(unknown))}")

    mode = payload.get("mode", "live")
    if mode not in {"fixture", "live"}:
        raise ValueError("mode must be 'fixture' or 'live'")

    raw_angles = payload.get("angles")
    if not isinstance(raw_angles, list) or not raw_angles:
        raise ValueError("angles must be a non-empty list")
    angles = tuple(_parse_angle(value, index) for index, value in enumerate(raw_angles))

    artifact_root = _required_string(payload, "artifact_root")
    fixture_path = payload.get("fixture_path")
    if mode == "fixture" and not isinstance(fixture_path, str):
        raise ValueError("fixture mode requires fixture_path")
    if fixture_path is not None and not isinstance(fixture_path, str):
        raise ValueError("fixture_path must be a string")

    values = environment or os.environ
    scix_server = None
    digest_server = None
    if mode == "live":
        scix_server, digest_server = live_mcp_servers(values)

    return ReviewInput(
        topic=_required_string(payload, "topic"),
        angles=angles,
        artifact_root=str(_resolve_from(path.parent, artifact_root)),
        mode=mode,
        fixture_path=(
            str(_resolve_from(path.parent, fixture_path)) if fixture_path is not None else None
        ),
        scix_server=scix_server,
        digest_server=digest_server,
        minimum_completed_angles=_integer(
            payload,
            "minimum_completed_angles",
            default=len(angles),
        ),
        max_parallel_angles=_integer(payload, "max_parallel_angles", default=2),
        activity_retry_attempts=_integer(payload, "activity_retry_attempts", default=3),
    )


def _parse_angle(value: object, index: int) -> Angle:
    if not isinstance(value, dict):
        raise ValueError(f"angles[{index}] must be an object")
    angle = cast(dict[str, Any], value)
    if set(angle) != _ANGLE_FIELDS:
        raise ValueError(
            f"angle fields must be exactly: {', '.join(sorted(_ANGLE_FIELDS))}"
        )
    return Angle(
        key=_required_string(angle, "key"),
        question=_required_string(angle, "question"),
        scix_query=_required_string(angle, "scix_query"),
        digest_query=_required_string(angle, "digest_query"),
    )


def _required_string(payload: Mapping[str, Any], key: str) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{key} must be a non-empty string")
    return value


def _integer(payload: Mapping[str, Any], key: str, *, default: int) -> int:
    value = payload.get(key, default)
    if not isinstance(value, int) or isinstance(value, bool):
        raise ValueError(f"{key} must be an integer")
    return value


def _resolve_from(parent: Path, value: str) -> Path:
    path = Path(value).expanduser()
    return path.resolve() if path.is_absolute() else (parent / path).resolve()
