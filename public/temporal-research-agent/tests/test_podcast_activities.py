import json

import pytest

from durable_research.podcast_activities import (
    _deduplicate_sources,
    _episode_search_queries,
    research_episode,
    write_deep_dive,
    write_pipeline_manifest,
    write_podcast_script,
    write_series_review,
)
from durable_research.podcast_models import (
    DeepDiveRequest,
    EpisodeRequest,
    ManifestRequest,
    PodcastEpisode,
    PodcastPipelineInput,
    PodcastSeries,
    ScriptRequest,
    SeriesReviewRequest,
)


@pytest.fixture
def fixture_file(tmp_path):
    path = tmp_path / "phasee.json"
    path.write_text(
        json.dumps(
            {
                "mas-ep4": {
                    "scix": [
                        {
                            "id": "2025arXiv250313657C",
                            "title": "Why Do Multi-Agent LLM Systems Fail?",
                            "locator": "2025arXiv250313657C",
                            "summary": "Failures cluster at coordination boundaries.",
                        }
                    ],
                    "digest": [
                        {
                            "id": "production-observability",
                            "title": "Tracing production agents",
                            "locator": "https://example.test/tracing",
                            "summary": "Operators need durable execution traces.",
                        }
                    ],
                }
            }
        )
    )
    return path


def pipeline(tmp_path, fixture_file) -> PodcastPipelineInput:
    return PodcastPipelineInput(
        series=(PodcastSeries("mas", "Multi-Agent Orchestration", "mas"),),
        episodes=(
            PodcastEpisode(
                "mas",
                4,
                "enterprise-and-production",
                "Enterprise & Production",
                "Reliability, failure modes, observability, and evaluation.",
                seeds=("2025arXiv250313657C",),
            ),
        ),
        artifact_root=str(tmp_path / "artifacts"),
        fixture_path=str(fixture_file),
    )


@pytest.mark.asyncio
async def test_fixture_activities_produce_every_historical_deliverable(
    tmp_path,
    fixture_file,
) -> None:
    request = pipeline(tmp_path, fixture_file)
    episode = request.episodes[0]
    episode_request = EpisodeRequest("pipeline-1", request, episode)

    researched = await research_episode(episode_request)
    deep_dive = await write_deep_dive(DeepDiveRequest(request, episode, researched))
    scripted = await write_podcast_script(ScriptRequest(request, episode, deep_dive))
    series_review = await write_series_review(
        SeriesReviewRequest(request, request.series[0], (scripted,))
    )
    result = await write_pipeline_manifest(
        ManifestRequest("pipeline-1", request, (scripted,), (series_review,))
    )

    artifact_root = tmp_path / "artifacts"
    research_text = (artifact_root / researched.research_ref).read_text()
    deep_dive_text = (artifact_root / deep_dive.deep_dive_ref).read_text()
    script_text = (artifact_root / scripted.script_ref).read_text()
    review_text = (artifact_root / series_review.report_ref).read_text()
    manifest = json.loads((artifact_root / result.manifest_ref).read_text())

    assert researched.status == "researched"
    assert {source.lane for source in researched.sources} == {"scix", "digest"}
    assert "# Enterprise & Production — Research" in research_text
    assert deep_dive.status == "deep_dive_complete"
    assert "# Enterprise & Production — Deep Dive" in deep_dive_text
    assert "## Evidence & evaluation" in deep_dive_text
    assert scripted.status == "complete"
    assert "# Code Intel Digest — Multi-Agent Orchestration, Episode 4" in script_text
    assert "## COLD OPEN" in script_text
    assert "## Citations" in script_text
    assert "# Multi-Agent Orchestration — Literature Review" in review_text
    assert manifest["completed_episode_keys"] == ["mas-ep4"]
    assert manifest["series_reviews"][0]["series_key"] == "mas"


@pytest.mark.asyncio
async def test_deep_dive_requires_researched_input(tmp_path, fixture_file) -> None:
    request = pipeline(tmp_path, fixture_file)
    episode = request.episodes[0]

    with pytest.raises(ValueError, match="expected researched"):
        await write_deep_dive(
            DeepDiveRequest(
                request,
                episode,
                episode_result=None,
            )
        )


def test_live_research_plan_runs_eight_distinct_searches_across_both_lanes(
    tmp_path,
    fixture_file,
) -> None:
    request = pipeline(tmp_path, fixture_file)
    episode = request.episodes[0]

    searches = _episode_search_queries(episode)

    assert len(searches) == 8
    assert len(set(searches)) == 8
    assert sum(lane == "scix" for lane, _ in searches) == 5
    assert sum(lane == "digest" for lane, _ in searches) == 3
    assert any("2025arXiv250313657C" in query for _, query in searches)
    assert any("evaluation" in query for _, query in searches)


def test_live_research_collapses_versioned_and_cross_index_duplicates() -> None:
    sources = [
        {
            "lane": "digest",
            "id": "digest-v1",
            "title": "Agent Workflow Memory",
            "locator": "https://arxiv.org/abs/2409.07429v1",
        },
        {
            "lane": "digest",
            "id": "digest-v3",
            "title": "Agent Workflow Memory",
            "locator": "https://arxiv.org/abs/2409.07429v3",
        },
        {
            "lane": "scix",
            "id": "2024arXiv240907429Z",
            "title": "Agent Workflow Memory",
            "locator": "https://ui.adsabs.harvard.edu/abs/2024arXiv240907429Z/abstract",
        },
        {
            "lane": "digest",
            "id": "different",
            "title": "A Different Paper",
            "locator": "https://example.test/different",
        },
    ]

    assert _deduplicate_sources(sources) == [sources[0], sources[3]]
