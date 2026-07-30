from __future__ import annotations

import asyncio
from datetime import timedelta
from typing import cast

from temporalio import workflow
from temporalio.common import RetryPolicy
from temporalio.exceptions import ActivityError, ApplicationError

with workflow.unsafe.imports_passed_through():
    from durable_research.models import (
        BranchRequest,
        BranchResult,
        FinalizeRequest,
        Progress,
        ReviewInput,
        ReviewResult,
        SectionRequest,
        VerifyRequest,
        stable_review_id,
    )


@workflow.defn
class LiteratureReviewWorkflow:
    def __init__(self) -> None:
        self._progress = Progress("waiting", 0, 0, 0, 0)

    @workflow.query
    def progress(self) -> Progress:
        return self._progress

    @workflow.run
    async def run(self, review: ReviewInput) -> ReviewResult:
        review_id = stable_review_id(review)
        self._progress = Progress("research", len(review.angles), 0, 0, 0)
        branches: list[BranchResult] = []
        for offset in range(0, len(review.angles), review.max_parallel_angles):
            batch = review.angles[offset : offset + review.max_parallel_angles]
            self._progress = Progress(
                "research",
                len(review.angles),
                len(batch),
                self._progress.completed,
                self._progress.failed,
            )
            batch_results = await asyncio.gather(
                *(
                    self._run_branch(BranchRequest(review_id=review_id, review=review, angle=angle))
                    for angle in batch
                )
            )
            branches.extend(batch_results)
            completed = sum(branch.status == "complete" for branch in branches)
            failed = sum(branch.status == "failed" for branch in branches)
            self._progress = Progress("research", len(review.angles), 0, completed, failed)

        completed = sum(branch.status == "complete" for branch in branches)
        if completed < review.minimum_completed_angles:
            raise ApplicationError(
                f"only {completed} of {review.minimum_completed_angles} required angles completed",
                non_retryable=True,
            )
        self._progress = Progress(
            "finalize",
            len(review.angles),
            1,
            completed,
            len(branches) - completed,
        )
        result = await workflow.execute_activity(
            "finalize_review",
            FinalizeRequest(review_id, review, tuple(branches)),
            result_type=ReviewResult,
            start_to_close_timeout=timedelta(minutes=2),
            retry_policy=self._retry_policy(review),
        )
        self._progress = Progress(
            "complete",
            len(review.angles),
            0,
            len(result.completed_angles),
            len(result.failed_angles),
        )
        return cast(ReviewResult, result)

    async def _run_branch(self, request: BranchRequest) -> BranchResult:
        try:
            researched = await workflow.execute_activity(
                "research_angle",
                request,
                result_type=BranchResult,
                start_to_close_timeout=timedelta(minutes=5),
                heartbeat_timeout=timedelta(seconds=30),
                retry_policy=self._retry_policy(request.review),
            )
            verified = await workflow.execute_activity(
                "verify_evidence",
                VerifyRequest(request.review, researched),
                result_type=BranchResult,
                start_to_close_timeout=timedelta(minutes=1),
                retry_policy=self._retry_policy(request.review),
            )
            return cast(
                BranchResult,
                await workflow.execute_activity(
                    "synthesize_section",
                    SectionRequest(request.review, verified),
                    result_type=BranchResult,
                    start_to_close_timeout=timedelta(minutes=2),
                    retry_policy=self._retry_policy(request.review),
                ),
            )
        except ActivityError as error:
            return BranchResult(
                angle_key=request.angle.key,
                status="failed",
                error=str(error.cause or error),
            )

    @staticmethod
    def _retry_policy(review: ReviewInput) -> RetryPolicy:
        return RetryPolicy(
            initial_interval=timedelta(milliseconds=100),
            backoff_coefficient=2,
            maximum_interval=timedelta(seconds=5),
            maximum_attempts=review.activity_retry_attempts,
        )
