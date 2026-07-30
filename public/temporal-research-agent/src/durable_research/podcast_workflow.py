from __future__ import annotations

import asyncio
from datetime import timedelta
from typing import cast

from temporalio import workflow
from temporalio.common import RetryPolicy
from temporalio.exceptions import ActivityError, ApplicationError

with workflow.unsafe.imports_passed_through():
    from durable_research.podcast_models import (
        DeepDiveRequest,
        EpisodeRequest,
        EpisodeResult,
        ManifestRequest,
        PodcastPipelineInput,
        PodcastPipelineResult,
        PodcastProgress,
        PodcastSeries,
        ScriptRequest,
        SeriesReviewRequest,
        SeriesReviewResult,
        stable_pipeline_id,
    )


@workflow.defn
class PodcastResearchWorkflow:
    """Durably execute the business stages from the historical phaseE workflow."""

    def __init__(self) -> None:
        self._progress = PodcastProgress("waiting", 0, 0, 0, 0)

    @workflow.query
    def progress(self) -> PodcastProgress:
        return self._progress

    @workflow.run
    async def run(self, pipeline: PodcastPipelineInput) -> PodcastPipelineResult:
        pipeline_id = stable_pipeline_id(pipeline)
        total = len(pipeline.episodes)
        self._progress = PodcastProgress("episodes", total, 0, 0, 0)
        episode_results: list[EpisodeResult] = []

        for offset in range(0, total, pipeline.max_parallel_episodes):
            batch = pipeline.episodes[offset : offset + pipeline.max_parallel_episodes]
            self._progress = PodcastProgress(
                "episodes",
                total,
                len(batch),
                self._progress.completed,
                self._progress.failed,
            )
            results = await asyncio.gather(
                *(
                    self._run_episode(
                        EpisodeRequest(
                            pipeline_id=pipeline_id,
                            pipeline=pipeline,
                            episode=episode,
                        )
                    )
                    for episode in batch
                )
            )
            episode_results.extend(results)
            completed = sum(result.status == "complete" for result in episode_results)
            failed = sum(result.status == "failed" for result in episode_results)
            self._progress = PodcastProgress("episodes", total, 0, completed, failed)

        completed = sum(result.status == "complete" for result in episode_results)
        if completed < pipeline.minimum_completed_episodes:
            raise ApplicationError(
                (
                    f"only {completed} of {pipeline.minimum_completed_episodes} "
                    "required episodes completed"
                ),
                non_retryable=True,
            )

        self._progress = PodcastProgress(
            "series-reviews",
            total,
            len(pipeline.series),
            completed,
            len(episode_results) - completed,
        )
        series_reviews = await asyncio.gather(
            *(
                self._write_series_review(pipeline, series, tuple(episode_results))
                for series in pipeline.series
                if any(
                    result.status == "complete" and result.series_key == series.key
                    for result in episode_results
                )
            )
        )
        self._progress = PodcastProgress(
            "manifest",
            total,
            1,
            completed,
            len(episode_results) - completed,
            len(series_reviews),
        )
        result = await workflow.execute_activity(
            "write_pipeline_manifest",
            ManifestRequest(
                pipeline_id,
                pipeline,
                tuple(episode_results),
                tuple(series_reviews),
            ),
            result_type=PodcastPipelineResult,
            start_to_close_timeout=timedelta(minutes=2),
            retry_policy=self._retry_policy(pipeline),
        )
        self._progress = PodcastProgress(
            "complete",
            total,
            0,
            len(result.completed_episode_keys),
            len(result.failed_episode_keys),
            len(result.series_reviews),
        )
        return cast(PodcastPipelineResult, result)

    async def _run_episode(self, request: EpisodeRequest) -> EpisodeResult:
        try:
            researched = await workflow.execute_activity(
                "research_episode",
                request,
                result_type=EpisodeResult,
                start_to_close_timeout=timedelta(minutes=5),
                heartbeat_timeout=timedelta(seconds=30),
                retry_policy=self._retry_policy(request.pipeline),
            )
            deep_dive = await workflow.execute_activity(
                "write_deep_dive",
                DeepDiveRequest(request.pipeline, request.episode, researched),
                result_type=EpisodeResult,
                start_to_close_timeout=timedelta(minutes=10),
                heartbeat_timeout=timedelta(seconds=30),
                retry_policy=self._retry_policy(request.pipeline),
            )
            return cast(
                EpisodeResult,
                await workflow.execute_activity(
                    "write_podcast_script",
                    ScriptRequest(request.pipeline, request.episode, deep_dive),
                    result_type=EpisodeResult,
                    start_to_close_timeout=timedelta(minutes=10),
                    heartbeat_timeout=timedelta(seconds=30),
                    retry_policy=self._retry_policy(request.pipeline),
                ),
            )
        except ActivityError as error:
            return EpisodeResult(
                episode_key=request.episode.key,
                series_key=request.episode.series_key,
                status="failed",
                error=str(error.cause or error),
            )

    async def _write_series_review(
        self,
        pipeline: PodcastPipelineInput,
        series: PodcastSeries,
        episode_results: tuple[EpisodeResult, ...],
    ) -> SeriesReviewResult:
        completed = tuple(
            result
            for result in episode_results
            if result.status == "complete" and result.series_key == series.key
        )
        return cast(
            SeriesReviewResult,
            await workflow.execute_activity(
                "write_series_review",
                SeriesReviewRequest(pipeline, series, completed),
                result_type=SeriesReviewResult,
                start_to_close_timeout=timedelta(minutes=10),
                heartbeat_timeout=timedelta(seconds=30),
                retry_policy=self._retry_policy(pipeline),
            ),
        )

    @staticmethod
    def _retry_policy(pipeline: PodcastPipelineInput) -> RetryPolicy:
        return RetryPolicy(
            initial_interval=timedelta(milliseconds=100),
            backoff_coefficient=2,
            maximum_interval=timedelta(seconds=5),
            maximum_attempts=pipeline.activity_retry_attempts,
        )
