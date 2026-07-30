import pytest

from durable_research.podcast_preset import (
    phase_e_demo,
    phase_e_pipeline,
    phase_e_selection,
)


def test_full_preset_preserves_both_series_and_all_ten_episodes(tmp_path) -> None:
    pipeline = phase_e_pipeline(str(tmp_path))

    assert [series.key for series in pipeline.series] == ["mas", "code"]
    assert len(pipeline.episodes) == 10
    assert {episode.series_key for episode in pipeline.episodes} == {"mas", "code"}
    assert sum(episode.frontier for episode in pipeline.episodes) == 2
    assert sum(len(episode.seeds) for episode in pipeline.episodes) == 83
    assert "records-management" in pipeline.episodes[2].focus
    assert "CodeScaleBench" in pipeline.episodes[8].focus
    assert pipeline.source_context_root is not None
    assert len(pipeline.source_context_hashes) == 2
    assert pipeline.minimum_completed_episodes == 10


def test_demo_preset_runs_one_episode_per_series_through_the_same_contract(tmp_path) -> None:
    pipeline = phase_e_demo(
        str(tmp_path),
        activity_delay_seconds=5,
        fail_once_episode="mas-ep4",
    )

    assert [episode.key for episode in pipeline.episodes] == ["mas-ep4", "code-ep4"]
    assert pipeline.minimum_completed_episodes == 2
    assert pipeline.activity_delay_seconds == 5
    assert pipeline.fail_once_episode == "mas-ep4"
    assert pipeline.fixture_path is not None


def test_selection_preset_supports_one_episode_end_to_end(tmp_path) -> None:
    pipeline = phase_e_selection(
        str(tmp_path),
        episode_keys=("mas-ep4",),
    )

    assert [series.key for series in pipeline.series] == ["mas"]
    assert [episode.key for episode in pipeline.episodes] == ["mas-ep4"]
    assert pipeline.minimum_completed_episodes == 1
    assert pipeline.max_parallel_episodes == 1
    assert len(pipeline.source_context_hashes) == 1


def test_selection_preset_rejects_unknown_episode_keys(tmp_path) -> None:
    with pytest.raises(ValueError, match="unknown episode keys: mas-ep99"):
        phase_e_selection(
            str(tmp_path),
            episode_keys=("mas-ep99",),
        )
