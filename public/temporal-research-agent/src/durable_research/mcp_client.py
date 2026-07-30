from __future__ import annotations

import json
import os
from typing import Any

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from durable_research.models import McpServer


async def call_tool(server: McpServer, tool: str, arguments: dict[str, Any]) -> Any:
    """Make one MCP call inside an Activity, never inside Workflow code."""
    environment = os.environ.copy()
    environment.update(server.env)
    parameters = StdioServerParameters(
        command=server.command,
        args=list(server.args),
        cwd=server.cwd,
        env=environment,
    )
    async with stdio_client(parameters) as (reader, writer):
        async with ClientSession(reader, writer) as session:
            await session.initialize()
            result = await session.call_tool(tool, arguments)
    if result.isError:
        text = "\n".join(block.text for block in result.content if hasattr(block, "text"))
        raise RuntimeError(f"{tool} failed: {text}")
    return _decode_content(result.content)


def _decode_content(content: Any) -> Any:
    texts = [block.text for block in content if hasattr(block, "text")]
    if not texts:
        return []
    joined = "\n".join(texts)
    try:
        return json.loads(joined)
    except json.JSONDecodeError:
        return {"text": joined}
