from __future__ import annotations

import asyncio
import hashlib
import json
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

from durable_research.artifacts import ArtifactStore
from durable_research.mcp_client import call_tool
from durable_research.models import McpServer

ExternalCaller = Callable[[McpServer, str, dict[str, Any]], Awaitable[Any]]


class ExternalCallJournalConflict(RuntimeError):
    """Raised when a durable request journal does not match its logical request."""


@dataclass(frozen=True)
class JournaledCallResult:
    request_id: str
    journal_ref: str
    response: Any
    cache_hit: bool


async def journaled_call_tool(
    *,
    store: ArtifactStore,
    review_id: str,
    operation: str,
    server: McpServer,
    tool: str,
    arguments: dict[str, Any],
    caller: ExternalCaller = call_tool,
) -> JournaledCallResult:
    """Reuse a persisted response and propagate a stable provider key when supported."""
    request = {
        "version": 1,
        "review_id": review_id,
        "operation": operation,
        "tool": tool,
        "arguments": arguments,
    }
    request_id = _request_id(request)
    journal_ref = f"{review_id}/requests/{request_id}.json"
    try:
        envelope = await asyncio.to_thread(store.read_json, journal_ref)
    except FileNotFoundError:
        envelope = None
    if envelope is not None:
        if not isinstance(envelope, dict) or envelope.get("request") != request:
            raise ExternalCallJournalConflict(
                f"request journal does not match logical request: {journal_ref}"
            )
        return JournaledCallResult(
            request_id=request_id,
            journal_ref=journal_ref,
            response=envelope.get("response"),
            cache_hit=True,
        )

    outgoing = dict(arguments)
    idempotency_argument = server.idempotency_key_argument
    if idempotency_argument is not None:
        if idempotency_argument in outgoing:
            raise ValueError(
                f"arguments already contain provider idempotency key: {idempotency_argument}"
            )
        outgoing[idempotency_argument] = request_id
    response = await caller(server, tool, outgoing)
    await asyncio.to_thread(
        store.put_named_text,
        journal_ref,
        json.dumps(
            {
                "request_id": request_id,
                "request": request,
                "response": response,
            },
            indent=2,
            sort_keys=True,
            ensure_ascii=False,
        )
        + "\n",
    )
    return JournaledCallResult(
        request_id=request_id,
        journal_ref=journal_ref,
        response=response,
        cache_hit=False,
    )


def _request_id(request: dict[str, Any]) -> str:
    encoded = json.dumps(
        request,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode()
    return f"request-{hashlib.sha256(encoded).hexdigest()[:20]}"
