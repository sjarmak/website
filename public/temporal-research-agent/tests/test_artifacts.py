import json

import pytest

from durable_research.artifacts import ArtifactConflict, ArtifactStore


def test_artifact_writes_are_idempotent_and_content_addressed(tmp_path) -> None:
    store = ArtifactStore(tmp_path)
    payload = {"title": "Durable execution", "body": "large evidence body"}

    first = store.put_json("review-1", "evidence", payload)
    second = store.put_json("review-1", "evidence", payload)

    assert first == second
    assert json.loads((tmp_path / first.path).read_text()) == payload
    assert first.content_hash in first.path


def test_named_artifact_rejects_conflicting_replay(tmp_path) -> None:
    store = ArtifactStore(tmp_path)
    store.put_named_text("review-1/report.md", "first")

    with pytest.raises(ArtifactConflict):
        store.put_named_text("review-1/report.md", "different")


@pytest.mark.parametrize("path", ("../escape.txt", "review/../../escape.txt"))
def test_artifact_store_rejects_paths_outside_root(tmp_path, path) -> None:
    store = ArtifactStore(tmp_path / "artifacts")

    with pytest.raises(ValueError, match="outside artifact root"):
        store.put_named_text(path, "blocked")

    assert not (tmp_path / "escape.txt").exists()
