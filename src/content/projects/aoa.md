---
title: Agent Oriented Architecture Toolkit
status: active
domain: tooling
summary: Measures whether a repository actually works for AI coding agents by running an agent against tasks mined from its own git history and scoring what it did, instead of checking for the presence of files like AGENTS.md.
role: Creator
repo: https://github.com/sjarmak/agent-oriented-architecture
architecture: https://sjarmak.github.io/agent-oriented-architecture/
tech: [Rust, Evaluation, Agents]
order: 24
topics: [evaluation, agents, code-intelligence]
tags: [benchmark, evals, agents]
---

`aoa audit` reads a repository and prints a ranked, tiered punch list with a measured cost per item, without touching a single tracked file. That restraint is the design: most "is my repo ready for AI agents?" tools check for the presence of an AGENTS.md or a CODEOWNERS file, and none of them run an agent, so none can tell whether the structure they reward actually helps. Agent Oriented Architecture runs a coding agent against real tasks mined from a repository's own git history and reads what it did, how it searched, which files it read, what it edited. The read-only side, `observe`, `audit`, `lint-context`, and `eval`, installs telemetry, ranks that punch list, enforces a context-file token budget, and scores recorded runs; the repository-mutating side, `migrate`, applies reversible one-commit-per-fix cleanups and stays dry-run by default until the measurement earns otherwise.

Every run is scored on four axes: retrieval locality (how many tool calls to the first relevant file), edit locality (patch size against the smallest and largest accepted human fix), invariant discoverability (were the constraints reachable before editing), and mutation surface (how many files an edit could reach through the symbol graph). That graph comes from `aoa-scip-graph`, which indexes a repo via SCIP when available and falls back to AST or line-scan otherwise, tiering its own confidence. The tiering is load-bearing, not cosmetic: a degraded or empty index lowers a record's weight, never raises the mutation-surface score, and disqualifies that repo from voting on whether a migration is worth trusting.

That vote is the real gate. Before `migrate` is trusted on a given codebase, `aoa-falsify` runs the deciding experiment across at least five held-out repos: does migrating the repository improve agent success more than simply swapping the harness does? A tie defaults to leaving the repository alone, because the repository is the most expensive layer to get wrong. Six independent, mutually blind premortem reviews of this design each broke the gate a different way: non-comparable cross-agent measurement, silent dependency drift, under-powered sampling, snapshot staleness, an unvalidated tie-break. Five of the six scored their failure 12 out of 12 on the registry's severity-times-likelihood scale. Six lenses converging on the same weak point by six different roads was the signal that a one-shot boolean gate was the project's central risk, which is why it now runs hardened with a robust, abstaining, or monitored verdict rather than a single true/false.

The project turns the same scrutiny on itself. An adversarial pass checked its own draft report against a 32-million-paper scholarly corpus over NASA ADS and SciX, and flagged the report's own headline claim, that context files can cut agent success by more than 20%, as untraceable to any real source; it also caught one genuinely hallucinated citation and one real paper cited under the wrong arXiv ID and year. Built solo over two weeks, 135 commits, 32,000 lines of Rust across 16 workspace crates, 643 tests, and downstream of [CodeProbe](/projects/codeprobe): `aoa-bench` loads codeprobe-mined task directories directly, and `aoa-codeprobe-shim` parses codeprobe's own agent transcripts into Agent Oriented Architecture's native trace format, so the same contamination-resistant task corpus feeds both.
