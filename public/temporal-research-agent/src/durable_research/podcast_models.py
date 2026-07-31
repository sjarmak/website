from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from typing import Literal

from durable_research.models import McpServer

_SAFE_KEY = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")
_SAFE_ENV_KEY = re.compile(r"[A-Za-z_][A-Za-z0-9_]*")


@dataclass(frozen=True)
class PodcastSeries:
    key: str
    name: str
    file_prefix: str

    def __post_init__(self) -> None:
        if _SAFE_KEY.fullmatch(self.key) is None:
            raise ValueError("series key must use lowercase letters, numbers, and single hyphens")
        if not self.name.strip():
            raise ValueError("series name must not be empty")
        if _SAFE_KEY.fullmatch(self.file_prefix) is None:
            raise ValueError(
                "series file_prefix must use lowercase letters, numbers, and single hyphens"
            )


@dataclass(frozen=True)
class PodcastEpisode:
    series_key: str
    number: int
    slug: str
    title: str
    focus: str
    seeds: tuple[str, ...] = ()
    frontier: bool = False

    def __post_init__(self) -> None:
        if _SAFE_KEY.fullmatch(self.series_key) is None:
            raise ValueError(
                "episode series_key must use lowercase letters, numbers, and single hyphens"
            )
        if self.number < 1:
            raise ValueError("episode number must be positive")
        if _SAFE_KEY.fullmatch(self.slug) is None:
            raise ValueError("episode slug must use lowercase letters, numbers, and single hyphens")
        if not self.title.strip():
            raise ValueError("episode title must not be empty")
        if not self.focus.strip():
            raise ValueError("episode focus must not be empty")

    @property
    def key(self) -> str:
        return f"{self.series_key}-ep{self.number}"


@dataclass(frozen=True)
class WriterCommand:
    command: str
    args: tuple[str, ...] = ("-p",)
    idempotency_key_env: str | None = None

    def __post_init__(self) -> None:
        if not self.command.strip():
            raise ValueError("writer command must not be empty")
        if (
            self.idempotency_key_env is not None
            and _SAFE_ENV_KEY.fullmatch(self.idempotency_key_env) is None
        ):
            raise ValueError("writer idempotency_key_env must be an environment variable name")


@dataclass(frozen=True)
class PodcastSourceRef:
    source_id: str
    lane: str
    title: str
    locator: str
    retrieved_at: str
    content_hash: str
    artifact_ref: str
    request_id: str | None = None

    def __post_init__(self) -> None:
        if self.lane not in {"scix", "digest"}:
            raise ValueError("source lane must be scix or digest")


@dataclass(frozen=True)
class PodcastPipelineInput:
    series: tuple[PodcastSeries, ...]
    episodes: tuple[PodcastEpisode, ...]
    artifact_root: str
    mode: Literal["fixture", "live"] = "fixture"
    fixture_path: str | None = None
    scix_server: McpServer | None = None
    digest_server: McpServer | None = None
    writer: WriterCommand | None = None
    source_context_root: str | None = None
    source_context_hashes: tuple[tuple[str, str], ...] = ()
    minimum_completed_episodes: int = 1
    max_parallel_episodes: int = 2
    activity_retry_attempts: int = 3
    activity_delay_seconds: float = 0
    fail_once_episode: str | None = None

    def __post_init__(self) -> None:
        series_keys = [series.key for series in self.series]
        episode_keys = [episode.key for episode in self.episodes]
        if not series_keys:
            raise ValueError("at least one series is required")
        if len(series_keys) != len(set(series_keys)):
            raise ValueError("series keys must be unique")
        if not episode_keys:
            raise ValueError("at least one episode is required")
        if len(episode_keys) != len(set(episode_keys)):
            raise ValueError("episode keys must be unique")
        unknown_series = sorted(
            {episode.series_key for episode in self.episodes} - set(series_keys)
        )
        if unknown_series:
            raise ValueError(f"episodes reference unknown series: {', '.join(unknown_series)}")
        if self.minimum_completed_episodes < 1:
            raise ValueError("minimum_completed_episodes must be positive")
        if self.minimum_completed_episodes > len(episode_keys):
            raise ValueError(
                "minimum_completed_episodes cannot exceed the number of episodes"
            )
        if self.max_parallel_episodes < 1:
            raise ValueError("max_parallel_episodes must be positive")
        if self.activity_retry_attempts < 1:
            raise ValueError("activity_retry_attempts must be positive")
        if self.activity_delay_seconds < 0:
            raise ValueError("activity_delay_seconds cannot be negative")
        if self.fail_once_episode is not None and self.fail_once_episode not in episode_keys:
            raise ValueError("fail_once_episode must name an episode in this pipeline")


EpisodeStatus = Literal["researched", "deep_dive_complete", "complete", "failed"]


@dataclass(frozen=True)
class EpisodeRequest:
    pipeline_id: str
    pipeline: PodcastPipelineInput
    episode: PodcastEpisode


@dataclass(frozen=True)
class EpisodeResult:
    episode_key: str
    series_key: str
    status: EpisodeStatus
    evidence_ref: str | None = None
    research_ref: str | None = None
    deep_dive_ref: str | None = None
    script_ref: str | None = None
    sources: tuple[PodcastSourceRef, ...] = ()
    error: str | None = None


@dataclass(frozen=True)
class DeepDiveRequest:
    pipeline: PodcastPipelineInput
    episode: PodcastEpisode
    episode_result: EpisodeResult


@dataclass(frozen=True)
class ScriptRequest:
    pipeline: PodcastPipelineInput
    episode: PodcastEpisode
    episode_result: EpisodeResult


@dataclass(frozen=True)
class SeriesReviewRequest:
    pipeline: PodcastPipelineInput
    series: PodcastSeries
    episodes: tuple[EpisodeResult, ...]


@dataclass(frozen=True)
class SeriesReviewResult:
    series_key: str
    report_ref: str
    episode_keys: tuple[str, ...]


@dataclass(frozen=True)
class ManifestRequest:
    pipeline_id: str
    pipeline: PodcastPipelineInput
    episodes: tuple[EpisodeResult, ...]
    series_reviews: tuple[SeriesReviewResult, ...]


@dataclass(frozen=True)
class PodcastPipelineResult:
    pipeline_id: str
    manifest_ref: str
    completed_episode_keys: tuple[str, ...]
    failed_episode_keys: tuple[str, ...]
    series_reviews: tuple[SeriesReviewResult, ...]


@dataclass(frozen=True)
class PodcastProgress:
    phase: str
    total: int
    running: int
    completed: int
    failed: int
    series_reviews_completed: int = 0


def stable_pipeline_id(pipeline: PodcastPipelineInput) -> str:
    """Hash the business request without machine-specific execution configuration."""
    logical_input = {
        "series": [
            {
                "key": series.key,
                "name": series.name,
                "file_prefix": series.file_prefix,
            }
            for series in sorted(pipeline.series, key=lambda value: value.key)
        ],
        "episodes": [
            {
                "series_key": episode.series_key,
                "number": episode.number,
                "slug": episode.slug,
                "title": episode.title,
                "focus": episode.focus,
                "seeds": sorted(episode.seeds),
                "frontier": episode.frontier,
            }
            for episode in sorted(pipeline.episodes, key=lambda value: value.key)
        ],
        "source_context_hashes": sorted(pipeline.source_context_hashes),
    }
    encoded = json.dumps(logical_input, sort_keys=True, separators=(",", ":")).encode()
    return f"podcast-pipeline-{hashlib.sha256(encoded).hexdigest()[:12]}"
