from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass, field
from typing import Literal


@dataclass(frozen=True)
class Angle:
    key: str
    question: str
    scix_query: str
    digest_query: str


@dataclass(frozen=True)
class McpServer:
    command: str
    args: tuple[str, ...] = ()
    cwd: str | None = None
    env: dict[str, str] = field(default_factory=dict)
    idempotency_key_argument: str | None = None

    def __post_init__(self) -> None:
        if self.idempotency_key_argument is not None and not self.idempotency_key_argument:
            raise ValueError("idempotency_key_argument must not be empty")


@dataclass(frozen=True)
class ReviewInput:
    topic: str
    angles: tuple[Angle, ...]
    artifact_root: str
    mode: Literal["fixture", "live"] = "fixture"
    fixture_path: str | None = None
    scix_server: McpServer | None = None
    digest_server: McpServer | None = None
    minimum_completed_angles: int = 1
    max_parallel_angles: int = 2
    activity_retry_attempts: int = 3
    activity_delay_seconds: float = 0
    fail_once_angle: str | None = None

    def __post_init__(self) -> None:
        keys = [angle.key for angle in self.angles]
        if not self.topic.strip():
            raise ValueError("topic must not be empty")
        if not keys:
            raise ValueError("at least one angle is required")
        if len(keys) != len(set(keys)):
            raise ValueError("angle keys must be unique")
        if any(re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", key) is None for key in keys):
            raise ValueError(
                "angle keys must use lowercase letters, numbers, and single hyphens"
            )
        if self.minimum_completed_angles < 1:
            raise ValueError("minimum_completed_angles must be positive")
        if self.minimum_completed_angles > len(keys):
            raise ValueError("minimum_completed_angles cannot exceed the number of angles")
        if self.max_parallel_angles < 1:
            raise ValueError("max_parallel_angles must be positive")
        if self.activity_retry_attempts < 1:
            raise ValueError("activity_retry_attempts must be positive")
        if self.activity_delay_seconds < 0:
            raise ValueError("activity_delay_seconds cannot be negative")


@dataclass(frozen=True)
class ArtifactRef:
    path: str
    content_hash: str


@dataclass(frozen=True)
class SourceRef:
    source_id: str
    lane: Literal["scix", "digest"]
    title: str
    locator: str
    retrieved_at: str
    content_hash: str
    artifact_ref: str
    request_id: str | None = None


@dataclass(frozen=True)
class BranchRequest:
    review_id: str
    review: ReviewInput
    angle: Angle


@dataclass(frozen=True)
class BranchResult:
    angle_key: str
    status: Literal["researched", "verified", "complete", "failed"]
    evidence_ref: str | None = None
    section_ref: str | None = None
    sources: tuple[SourceRef, ...] = ()
    error: str | None = None


@dataclass(frozen=True)
class SectionRequest:
    review: ReviewInput
    branch: BranchResult


@dataclass(frozen=True)
class VerifyRequest:
    review: ReviewInput
    branch: BranchResult


@dataclass(frozen=True)
class FinalizeRequest:
    review_id: str
    review: ReviewInput
    branches: tuple[BranchResult, ...]


@dataclass(frozen=True)
class ReviewResult:
    review_id: str
    report_ref: str
    manifest_ref: str
    completed_angles: tuple[str, ...]
    failed_angles: tuple[str, ...]


@dataclass(frozen=True)
class Progress:
    phase: str
    total: int
    running: int
    completed: int
    failed: int


def stable_review_id(review: ReviewInput) -> str:
    """Hash logical research inputs, excluding machine-specific runtime paths."""
    logical_input = {
        "topic": review.topic,
        "angles": [
            {
                "key": angle.key,
                "question": angle.question,
                "scix_query": angle.scix_query,
                "digest_query": angle.digest_query,
            }
            for angle in sorted(review.angles, key=lambda value: value.key)
        ],
    }
    encoded = json.dumps(logical_input, sort_keys=True, separators=(",", ":")).encode()
    return f"review-{hashlib.sha256(encoded).hexdigest()[:12]}"
