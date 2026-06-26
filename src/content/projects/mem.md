---
title: mem
status: active
domain: research
summary: Build and benchmark agentic memory using a multi-agent orchestrator's own work traces as the evaluation corpus, where every unit of work has a verifiable outcome.
role: Creator
repo: https://github.com/sjarmak/mem
architecture: https://sjarmak.github.io/mem/
tech: [TypeScript, Evaluation, Agent memory]
featured: true
featuredOrder: 6
order: 21
topics: [agent-memory, agents, evaluation]
tags: [benchmark, memory, evals]
---

Across 5,977 closed work records in the orchestrator's issue store, exactly one carries an external reference, about 14 carry a PR number, and about 7 carry a commit SHA. That audit, run against a corpus everyone had assumed was outcome-labeled, killed the project's original headline metric and forced its largest architectural pivot. `mem` is the story of building an agentic-memory benchmark on a multi-agent orchestrator's real work exhaust, discovering which parts of that exhaust actually exist, and reshaping the evaluation to measure only what the data can support.

The bet is that an orchestrator's continuous stream of real work (each unit with a work item, an assigned agent session, and a full transcript) beats single-agent session prose as a memory corpus. The system is two halves joined by a narrow seam: a TypeScript pipeline that ingests work records, resolves each to its agent transcript, parses deterministic build/test/lint failures out of those transcripts, and stores everything in SQLite with full-text search; and a Python harness that runs agents with and without memory over that corpus. Python never opens the database; it shells to the `mem` CLI through a versioned JSON envelope, so retrieval and failure-signature logic exist exactly once.

Memory fires on failure rather than on every turn. When an agent hits a build or test error, retrieval keys on a rig-agnostic signature (tool, file, line, error class) and injects a distilled lesson with a citation, never the raw prior trace. The eval contract is temporal leave-one-out, computed once and independently re-audited per run, and every guard raises instead of filtering, because a dead run beats a silently invalid number. Gameability is handled in the metric itself: returning the whole store gets recall 1.0, so every lift run measures injected-context volume and retrieval precision as required guards.

With the outcome oracle dead at the data layer, the headline became an ablation curve: the agent is its own control across an information ladder from no memory through retrieved memory to an oracle payload, scored by a deterministic did-it-avoid-the-known-error check plus a self-hosted LLM judge. The machinery now exists end to end. What remains is the first full grid run, and with it the empirical question that decides the project's shape: whether failures recur across the fleet often enough for failure-triggered memory to matter at all.
