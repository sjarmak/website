import base64
import json
from datetime import timedelta

import pytest
from temporalio import activity
from temporalio.client import Client
from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker

from durable_research.podcast_models import (
    DeepDiveRequest,
    EpisodeRequest,
    EpisodeResult,
    ManifestRequest,
    PodcastEpisode,
    PodcastPipelineInput,
    PodcastPipelineResult,
    PodcastSeries,
    PodcastSourceRef,
    ScriptRequest,
    SeriesReviewRequest,
    SeriesReviewResult,
)
from durable_research.podcast_workflow import PodcastResearchWorkflow


def pipeline_input(tmp_path) -> PodcastPipelineInput:
    return PodcastPipelineInput(
        series=(PodcastSeries("mas", "Multi-Agent Orchestration", "mas"),),
        episodes=(
            PodcastEpisode("mas", 1, "works", "Works", "Works"),
            PodcastEpisode("mas", 2, "also-works", "Also Works", "Also works"),
        ),
        artifact_root=str(tmp_path),
        minimum_completed_episodes=2,
        max_parallel_episodes=2,
        activity_retry_attempts=1,
    )


@activity.defn(name="research_episode")
async def stub_research(request: EpisodeRequest) -> EpisodeResult:
    return EpisodeResult(
        episode_key=request.episode.key,
        series_key=request.episode.series_key,
        status="researched",
        research_ref=f"research/{request.episode.key}.md",
        evidence_ref=f"evidence/{request.episode.key}.json",
        sources=(
            PodcastSourceRef(
                source_id="source-1",
                lane="scix",
                title="Source",
                locator="2026TEST",
                retrieved_at="2026-07-30T00:00:00Z",
                content_hash="abc",
                artifact_ref="evidence/source-1.json",
            ),
        ),
    )


@activity.defn(name="write_deep_dive")
async def stub_deep_dive(request: DeepDiveRequest) -> EpisodeResult:
    return EpisodeResult(
        **{
            **request.episode_result.__dict__,
            "status": "deep_dive_complete",
            "deep_dive_ref": f"deep-dives/{request.episode_result.episode_key}.md",
        }
    )


@activity.defn(name="write_podcast_script")
async def stub_script(request: ScriptRequest) -> EpisodeResult:
    return EpisodeResult(
        **{
            **request.episode_result.__dict__,
            "status": "complete",
            "script_ref": f"scripts/{request.episode_result.episode_key}.md",
        }
    )


@activity.defn(name="write_series_review")
async def stub_series_review(request: SeriesReviewRequest) -> SeriesReviewResult:
    return SeriesReviewResult(
        series_key=request.series.key,
        report_ref=f"reviews/{request.series.key}.md",
        episode_keys=tuple(result.episode_key for result in request.episodes),
    )


@activity.defn(name="write_pipeline_manifest")
async def stub_manifest(request: ManifestRequest) -> PodcastPipelineResult:
    completed = tuple(
        result.episode_key for result in request.episodes if result.status == "complete"
    )
    failed = tuple(
        result.episode_key for result in request.episodes if result.status == "failed"
    )
    return PodcastPipelineResult(
        pipeline_id=request.pipeline_id,
        manifest_ref=f"{request.pipeline_id}/manifest.json",
        completed_episode_keys=completed,
        failed_episode_keys=failed,
        series_reviews=request.series_reviews,
    )


ACTIVITIES = [
    stub_research,
    stub_deep_dive,
    stub_script,
    stub_series_review,
    stub_manifest,
]


@pytest.mark.asyncio
async def test_workflow_runs_the_historical_stage_order_and_exposes_progress(tmp_path) -> None:
    async with await WorkflowEnvironment.start_time_skipping() as env:
        task_queue = "test-podcast-workflow"
        async with Worker(
            env.client,
            task_queue=task_queue,
            workflows=[PodcastResearchWorkflow],
            activities=ACTIVITIES,
        ):
            handle = await env.client.start_workflow(
                PodcastResearchWorkflow.run,
                pipeline_input(tmp_path),
                id="podcast-workflow-test",
                task_queue=task_queue,
                execution_timeout=timedelta(seconds=30),
            )
            result = await handle.result()
            progress = await handle.query(PodcastResearchWorkflow.progress)
            history = await _history_json(env.client, "podcast-workflow-test")

    assert result.completed_episode_keys == ("mas-ep1", "mas-ep2")
    assert result.failed_episode_keys == ()
    assert result.series_reviews[0].episode_keys == ("mas-ep1", "mas-ep2")
    assert progress.phase == "complete"
    assert progress.completed == 2
    assert progress.failed == 0
    assert history.index("research_episode") < history.index("write_deep_dive")
    assert history.index("write_deep_dive") < history.index("write_podcast_script")
    assert history.index("write_podcast_script") < history.index("write_series_review")


@pytest.mark.asyncio
async def test_workflow_history_contains_artifact_refs_not_document_bodies(tmp_path) -> None:
    sentinel = "FULL-PODCAST-SCRIPT-" + ("x" * 20_000)

    @activity.defn(name="write_podcast_script")
    async def storing_script(request: ScriptRequest) -> EpisodeResult:
        path = tmp_path / f"{request.episode_result.episode_key}.md"
        path.write_text(sentinel)
        return EpisodeResult(
            **{
                **request.episode_result.__dict__,
                "status": "complete",
                "script_ref": str(path),
            }
        )

    activities = [
        stub_research,
        stub_deep_dive,
        storing_script,
        stub_series_review,
        stub_manifest,
    ]
    async with await WorkflowEnvironment.start_time_skipping() as env:
        task_queue = "test-podcast-compact-history"
        async with Worker(
            env.client,
            task_queue=task_queue,
            workflows=[PodcastResearchWorkflow],
            activities=activities,
        ):
            await env.client.execute_workflow(
                PodcastResearchWorkflow.run,
                pipeline_input(tmp_path),
                id="podcast-compact-history",
                task_queue=task_queue,
            )
            history = await _history_json(env.client, "podcast-compact-history")

    assert sentinel not in history
    assert "mas-ep1.md" in history


async def _history_json(client: Client, workflow_id: str) -> str:
    handle = client.get_workflow_handle(workflow_id)
    history = json.loads((await handle.fetch_history()).to_json())
    decoded_payloads: list[str] = []

    def visit(value: object) -> None:
        if isinstance(value, dict):
            for key, child in value.items():
                if key == "data" and isinstance(child, str):
                    try:
                        decoded_payloads.append(base64.b64decode(child).decode(errors="replace"))
                    except ValueError:
                        pass
                else:
                    visit(child)
        elif isinstance(value, list):
            for child in value:
                visit(child)

    visit(history)
    return json.dumps(history) + "\n" + "\n".join(decoded_payloads)
