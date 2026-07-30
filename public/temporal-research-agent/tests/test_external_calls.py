from collections.abc import Awaitable, Callable
from typing import Any

import pytest

from durable_research.artifacts import ArtifactStore
from durable_research.external_calls import journaled_call_tool
from durable_research.models import McpServer


@pytest.mark.asyncio
async def test_successful_external_call_is_reused_from_the_request_journal(tmp_path) -> None:
    calls: list[dict[str, Any]] = []

    async def caller(
        server: McpServer,
        tool: str,
        arguments: dict[str, Any],
    ) -> Any:
        del server, tool
        calls.append(arguments)
        return {"papers": [{"id": "paper-1"}]}

    store = ArtifactStore(tmp_path)
    server = McpServer(command="scix")
    arguments = {"query": "durable agents", "limit": 6}

    first = await journaled_call_tool(
        store=store,
        review_id="review-1",
        operation="recovery-scix",
        server=server,
        tool="search",
        arguments=arguments,
        caller=caller,
    )
    second = await journaled_call_tool(
        store=store,
        review_id="review-1",
        operation="recovery-scix",
        server=server,
        tool="search",
        arguments=arguments,
        caller=caller,
    )

    assert first.response == second.response
    assert first.request_id == second.request_id
    assert first.cache_hit is False
    assert second.cache_hit is True
    assert calls == [arguments]
    assert (tmp_path / first.journal_ref).exists()


@pytest.mark.asyncio
async def test_provider_idempotency_key_uses_the_same_stable_request_id(tmp_path) -> None:
    calls: list[dict[str, Any]] = []

    async def caller(
        server: McpServer,
        tool: str,
        arguments: dict[str, Any],
    ) -> Any:
        del server, tool
        calls.append(arguments)
        return {"items": []}

    result = await journaled_call_tool(
        store=ArtifactStore(tmp_path),
        review_id="review-1",
        operation="recovery-digest",
        server=McpServer(command="digest", idempotency_key_argument="request_id"),
        tool="semantic_search_items",
        arguments={"query": "retry behavior", "limit": 6},
        caller=caller,
    )

    assert calls == [
        {
            "query": "retry behavior",
            "limit": 6,
            "request_id": result.request_id,
        }
    ]


@pytest.mark.asyncio
async def test_caller_type_accepts_the_real_async_shape(tmp_path) -> None:
    async def caller(
        server: McpServer,
        tool: str,
        arguments: dict[str, Any],
    ) -> Any:
        return {"server": server.command, "tool": tool, "arguments": arguments}

    typed_caller: Callable[
        [McpServer, str, dict[str, Any]],
        Awaitable[Any],
    ] = caller
    result = await journaled_call_tool(
        store=ArtifactStore(tmp_path),
        review_id="review-2",
        operation="angle-scix",
        server=McpServer(command="scix"),
        tool="search",
        arguments={"query": "provenance"},
        caller=typed_caller,
    )

    assert result.response["tool"] == "search"
