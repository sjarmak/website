import json

import pytest

from durable_research.agent_contract import load_review_request


def test_load_review_request_resolves_paths_and_builds_live_servers(
    tmp_path, monkeypatch
) -> None:
    request_path = tmp_path / "requests" / "review.json"
    request_path.parent.mkdir()
    request_path.write_text(
        json.dumps(
            {
                "topic": "Durability for repository research agents",
                "mode": "live",
                "artifact_root": "../artifacts",
                "angles": [
                    {
                        "key": "recovery",
                        "question": "Which failure boundaries matter?",
                        "scix_query": "durable agents failure recovery",
                        "digest_query": "repository research agent recovery",
                    },
                    {
                        "key": "evidence",
                        "question": "How should evidence be retained?",
                        "scix_query": "research provenance evidence retention",
                        "digest_query": "code research provenance artifacts",
                    },
                ],
                "minimum_completed_angles": 1,
                "max_parallel_angles": 2,
            }
        )
    )
    monkeypatch.setenv("SCIX_PYTHON", "/opt/scix/python")
    monkeypatch.setenv("SCIX_CWD", "/srv/scix")
    monkeypatch.setenv("DIGEST_COMMAND", "digest-mcp")
    monkeypatch.setenv("DIGEST_CWD", "/srv/digest")
    monkeypatch.setenv("DIGEST_SERVER", "/srv/digest/server.ts")
    monkeypatch.setenv("QDRANT_URL", "http://qdrant.test:6333")

    review = load_review_request(request_path)

    assert review.topic == "Durability for repository research agents"
    assert review.artifact_root == str((tmp_path / "artifacts").resolve())
    assert tuple(angle.key for angle in review.angles) == ("recovery", "evidence")
    assert review.minimum_completed_angles == 1
    assert review.scix_server is not None
    assert review.scix_server.command == "/opt/scix/python"
    assert review.scix_server.cwd == "/srv/scix"
    assert review.scix_server.env["QDRANT_URL"] == "http://qdrant.test:6333"
    assert review.digest_server is not None
    assert review.digest_server.command == "digest-mcp"


def test_load_review_request_resolves_fixture_relative_to_request(tmp_path) -> None:
    fixture_path = tmp_path / "evidence.json"
    fixture_path.write_text("{}")
    request_path = tmp_path / "review.json"
    request_path.write_text(
        json.dumps(
            {
                "topic": "Fixture review",
                "mode": "fixture",
                "artifact_root": "out",
                "fixture_path": "evidence.json",
                "angles": [
                    {
                        "key": "one",
                        "question": "What happened?",
                        "scix_query": "scholarly query",
                        "digest_query": "engineering query",
                    }
                ],
            }
        )
    )

    review = load_review_request(request_path)

    assert review.fixture_path == str(fixture_path.resolve())
    assert review.scix_server is None
    assert review.digest_server is None


@pytest.mark.parametrize(
    ("payload", "message"),
    [
        ({"unexpected": True}, "unknown request fields"),
        ({"mode": "remote"}, "mode"),
        ({"angles": "not-a-list"}, "angles"),
        ({"angles": [{"key": "missing-fields"}]}, "angle fields"),
        ({"mode": "fixture"}, "fixture_path"),
    ],
)
def test_load_review_request_rejects_invalid_contract(tmp_path, payload, message) -> None:
    base = {
        "topic": "Invalid request",
        "mode": "live",
        "artifact_root": "out",
        "angles": [
            {
                "key": "one",
                "question": "Question?",
                "scix_query": "papers",
                "digest_query": "posts",
            }
        ],
    }
    base.update(payload)
    request_path = tmp_path / "invalid.json"
    request_path.write_text(json.dumps(base))

    with pytest.raises(ValueError, match=message):
        load_review_request(request_path)
