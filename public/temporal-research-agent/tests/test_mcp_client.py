from types import SimpleNamespace

from durable_research.mcp_client import _decode_content


def test_decode_content_handles_json_text_and_empty_results() -> None:
    assert _decode_content([SimpleNamespace(text='{"results": [1]}')]) == {"results": [1]}
    assert _decode_content([SimpleNamespace(text="plain response")]) == {"text": "plain response"}
    assert _decode_content([]) == []
