---
title: Livedocs
status: active
domain: tooling
summary: Keep docs in sync with code. Livedocs extracts structural claims from source into per-repo SQLite databases that AI agents query over MCP, no expensive grep-and-read cycles.
role: Creator
repo: https://github.com/sjarmak/livedocs
tech: [Go, MCP, tree-sitter]
order: 4
topics: [code-intelligence, agents, retrieval]
tags: [mcp, code-intel]
---

Livedocs extracts symbols and relationships with tree-sitter, mines tribal knowledge (ownership, rationale, invariants) from git history and CODEOWNERS, stores it as structured claims in per-repo SQLite, serves it to agents over the Model Context Protocol, and detects documentation drift.
