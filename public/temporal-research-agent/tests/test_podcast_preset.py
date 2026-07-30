from durable_research.podcast_preset import phase_e_demo, phase_e_pipeline


def test_full_preset_preserves_both_series_and_all_ten_episodes(tmp_path) -> None:
    pipeline = phase_e_pipeline(str(tmp_path))

    assert [series.key for series in pipeline.series] == ["mas", "code"]
    assert len(pipeline.episodes) == 10
    assert {episode.series_key for episode in pipeline.episodes} == {"mas", "code"}
    assert sum(episode.frontier for episode in pipeline.episodes) == 2
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
