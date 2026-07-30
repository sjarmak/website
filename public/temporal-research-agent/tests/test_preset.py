from durable_research.preset import durable_agents_review


def test_fixture_preset_is_self_contained(tmp_path) -> None:
    review = durable_agents_review(str(tmp_path))

    assert review.mode == "fixture"
    assert len(review.angles) == 4
    assert review.fixture_path is not None
    assert review.minimum_completed_angles == 3
    assert review.scix_server is None


def test_live_preset_connects_both_research_lanes(tmp_path) -> None:
    review = durable_agents_review(
        str(tmp_path),
        mode="live",
        activity_delay_seconds=5,
        fail_once_angle="tool-reliability",
    )

    assert review.scix_server is not None
    assert review.digest_server is not None
    assert review.activity_delay_seconds == 5
    assert review.fail_once_angle == "tool-reliability"
