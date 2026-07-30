import pytest

from durable_research.models import (
    Angle,
    McpServer,
    ReviewInput,
    SourceRef,
    stable_review_id,
)


def test_mcp_server_rejects_an_empty_idempotency_argument() -> None:
    with pytest.raises(ValueError, match="idempotency_key_argument"):
        McpServer(command="server", idempotency_key_argument="")


def test_review_identity_is_stable_across_angle_order_and_runtime_paths() -> None:
    first = ReviewInput(
        topic="Durability in agent systems",
        angles=(
            Angle("recovery", "How do agents recover?", "agent recovery", "agent recovery"),
            Angle("memory", "How is memory persisted?", "agent memory", "agent memory"),
        ),
        artifact_root="/tmp/run-a",
    )
    second = ReviewInput(
        topic=first.topic,
        angles=tuple(reversed(first.angles)),
        artifact_root="/different/machine",
    )

    assert stable_review_id(first) == stable_review_id(second)
    assert stable_review_id(first).startswith("review-")


def test_source_ref_is_compact_and_does_not_hold_source_body() -> None:
    source = SourceRef(
        source_id="paper-1",
        lane="scix",
        title="A paper",
        locator="arxiv:1234.5678",
        retrieved_at="2026-07-29T12:00:00Z",
        content_hash="abc",
        artifact_ref="evidence/paper-1.json",
    )

    assert "full_text" not in source.__dict__
    assert len(repr(source)) < 300


def test_review_input_rejects_duplicate_angle_keys() -> None:
    duplicate = Angle("same", "Question", "papers", "posts")

    try:
        ReviewInput(topic="Topic", angles=(duplicate, duplicate), artifact_root="/tmp")
    except ValueError as error:
        assert "unique" in str(error)
    else:
        raise AssertionError("duplicate angle keys should fail")


@pytest.mark.parametrize("key", ("../escape", "has/slash", "UPPER", "space key", ""))
def test_review_input_rejects_unsafe_angle_keys(key) -> None:
    with pytest.raises(ValueError, match="lowercase"):
        ReviewInput(
            topic="Topic",
            angles=(Angle(key, "Question", "papers", "posts"),),
            artifact_root="/tmp",
        )


@pytest.mark.parametrize(
    ("changes", "message"),
    [
        ({"topic": " "}, "topic"),
        ({"angles": ()}, "at least one"),
        ({"minimum_completed_angles": 2}, "cannot exceed"),
        ({"minimum_completed_angles": 0}, "positive"),
        ({"max_parallel_angles": 0}, "positive"),
        ({"activity_retry_attempts": 0}, "positive"),
    ],
)
def test_review_input_validates_workflow_bounds(changes, message) -> None:
    values = {
        "topic": "Topic",
        "angles": (Angle("one", "Question", "papers", "posts"),),
        "artifact_root": "/tmp",
    }
    values.update(changes)

    with pytest.raises(ValueError, match=message):
        ReviewInput(**values)
