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

In the Kubernetes corpus that serves as livedocs' test bed, code changes outpace documentation changes roughly 77:1, and the staleness pattern is the dangerous kind: about 70% of old documentation is still correct, which trains readers to trust the 30% that isn't. Meanwhile an AI agent that wants to understand a package burns thousands of tokens on grep-and-read cycles recovering facts the compiler already knows. Livedocs attacks both ends. It extracts claims about a codebase (exports, signatures, dependencies, interface satisfactions, plus mined tribal knowledge like ownership and invariants) into per-repo SQLite databases at roughly 30–50 tokens per claim, serves them to agents over MCP, renders them as compact Markdown package docs, and detects when human-written docs drift from what the code now says.

Extraction is tiered by trust. A tree-sitter fast path handles any registered language but may only emit predicates derivable from syntax; a Go deep extractor built on `go/types` owns type-resolution claims like interface implementations and always wins when both run, with the boundary enforced at extract time rather than by convention. Tribal miners are deterministic by default (git blame for ownership, test assertions for invariants, TODO markers), and the LLM-touching paths are opt-in, budgeted, and PII-redacted. Every tribal fact carries a provenance envelope — source quote, evidence, confidence, corroboration — so an agent can verify a claimed invariant against its source instead of laundering authority.

The project's most distinctive habit is that every major subsystem got an adversarial premortem before code, and the premortems demonstrably changed the architecture. The original design keyed identity on SCIP symbols; the premortem killed it with a concrete finding (Kubernetes' staging symlinks produce 47+ symbol variants for one logical entity), and identity became a composite key that joins trivially. The cautionary tale runs the other way too: the corroboration gate for LLM-mined facts shipped toothless, because the insert path never merged new facts against existing ones, so every fact sat at corroboration 1 forever and the gate silently filtered out 100% of mined knowledge. A production-hardening review caught it months later.

The headline numbers (about 50x context reduction, sub-30-second staleness) are design targets validated by construction and by corpus experiments against 79 Kubernetes repos, not yet by telemetry from real agent sessions. That instrumentation is the next gate the project has to earn its way through.
