import pytest

from durable_research.podcast_models import (
    PodcastEpisode,
    PodcastPipelineInput,
    PodcastSeries,
    stable_pipeline_id,
)


def _series() -> tuple[PodcastSeries, ...]:
    return (
        PodcastSeries("mas", "Multi-Agent Orchestration", "multiagent-orchestration"),
        PodcastSeries("code", "Code Retrieval & Enterprise Codebases", "code-retrieval"),
    )


def _episodes() -> tuple[PodcastEpisode, ...]:
    return (
        PodcastEpisode(
            series_key="mas",
            number=1,
            slug="foundations",
            title="Foundations & Topologies",
            focus="Define the topology vocabulary.",
            seeds=("2024arXiv240201680G",),
        ),
        PodcastEpisode(
            series_key="code",
            number=1,
            slug="why-code-isnt-text",
            title="Why Code Isn't Text IR",
            focus="Explain why structure changes retrieval.",
            seeds=("2019arXiv190909436H",),
        ),
    )


def test_pipeline_identity_is_stable_across_runtime_paths() -> None:
    first = PodcastPipelineInput(
        series=_series(),
        episodes=_episodes(),
        artifact_root="/tmp/one",
        minimum_completed_episodes=2,
    )
    second = PodcastPipelineInput(
        series=tuple(reversed(_series())),
        episodes=tuple(reversed(_episodes())),
        artifact_root="/different/machine",
        minimum_completed_episodes=2,
    )

    assert stable_pipeline_id(first) == stable_pipeline_id(second)
    assert stable_pipeline_id(first).startswith("podcast-pipeline-")


def test_episode_key_preserves_the_historical_series_and_number_contract() -> None:
    episode = _episodes()[0]

    assert episode.key == "mas-ep1"


def test_pipeline_rejects_an_episode_with_an_unknown_series() -> None:
    invalid = PodcastEpisode(
        series_key="missing",
        number=1,
        slug="episode",
        title="Episode",
        focus="Focus",
    )

    with pytest.raises(ValueError, match="unknown series"):
        PodcastPipelineInput(
            series=_series(),
            episodes=(invalid,),
            artifact_root="/tmp",
        )


@pytest.mark.parametrize(
    ("change", "message"),
    [
        ({"episodes": ()}, "at least one episode"),
        ({"max_parallel_episodes": 0}, "max_parallel_episodes"),
        ({"activity_retry_attempts": 0}, "activity_retry_attempts"),
        ({"minimum_completed_episodes": 3}, "cannot exceed"),
        ({"activity_delay_seconds": -1}, "activity_delay_seconds"),
    ],
)
def test_pipeline_validates_execution_bounds(change, message) -> None:
    values = {
        "series": _series(),
        "episodes": _episodes(),
        "artifact_root": "/tmp",
        "minimum_completed_episodes": 2,
    }
    values.update(change)

    with pytest.raises(ValueError, match=message):
        PodcastPipelineInput(**values)


def test_pipeline_rejects_duplicate_episode_keys() -> None:
    episode = _episodes()[0]

    with pytest.raises(ValueError, match="episode keys must be unique"):
        PodcastPipelineInput(
            series=_series(),
            episodes=(episode, episode),
            artifact_root="/tmp",
        )
