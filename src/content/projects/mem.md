---
title: mem
status: active
domain: research
summary: Build and benchmark agentic memory using a multi-agent orchestrator's own work traces as the evaluation corpus, where every unit of work carries a real lifecycle outcome and a full trace.
role: Creator
repo: https://github.com/sjarmak/mem
architecture: https://sjarmak.github.io/mem/
tech: [TypeScript, Python, Evaluation, Agent memory]
featured: true
featuredOrder: 6
order: 21
topics: [agents, evaluation]
tags: [benchmark, memory, evals]
---

The corpus everyone assumed was outcome-labeled turned out to be direct-to-main. Across 6,691 work records from a multi-agent orchestrator running over eighteen project rigs, every record that names a base branch names `main`, and only about one in six thousand carries a pull-request reference. The obvious success label — did this agent's work merge, did CI pass — is therefore inapplicable by construction, not missing by accident. That property, found by auditing the corpus instead of trusting the assumption, reshaped the whole evaluation design. `mem` builds an agentic-memory benchmark on a multi-agent orchestrator's real work exhaust, and grounds its labels in what that exhaust actually contains rather than in a single-repo PR workflow that never happened.

The bet is that an orchestrator's continuous stream of real work — each unit a work item, an assigned agent session, and a full transcript — beats single-agent session prose as a memory corpus, because the labels come from work that actually happened. The system is two halves joined by a narrow seam. A TypeScript pipeline ingests the work records, resolves each to its agent transcript, parses deterministic build/test/lint failures out of those traces, distills prior resolutions into cited lessons, and stores everything in SQLite with full-text search — 874 transcripts resolved, git provenance backfilled across roughly four-fifths of the corpus so a record can be replayed as a checkout. A Python harness replays held-out tasks with and without memory over that store and never opens the database directly; it shells to the `mem` CLI through a versioned JSON envelope, so retrieval and failure-signature logic exist exactly once. The extraction split is strict by design: mechanical signal — exit states, `file:line` errors — is read in code, and semantic signal is left to a model. Memory fires on failure rather than on every turn: a build or test error keys retrieval on a rig-agnostic signature and injects a distilled lesson with a citation, never the raw prior trace.

With the merged-PR oracle ruled out, the project built the oracle the workflow does support — a git-native signal that dates the branch tip at each session's close and takes the surviving in-window commits as that session's landed work — and made the headline an ablation curve, where the agent is its own control across an information ladder from no memory, through retrieved memory, to an oracle payload. Each rung is scored by a deterministic did-it-avoid-the-known-error check plus a self-hosted LLM judge. The eval contract is temporal leave-one-out, recomputed and independently re-audited per run; every guard raises instead of silently filtering, because a dead run beats an invalid number; and because returning the whole store trivially scores perfect recall, every run measures injected-context volume and retrieval precision as first-class guards so over-injection can't fake a win. Competitive memory systems — mem0, A-MEM, Graphiti, a filesystem baseline, a deterministic lexical arm, and the failure-triggered `ours` — all run behind one uniform interface on Harbor, under the same leak guard.

The work now runs on two tracks. On the real corpus, commit-message linkage recovered hundreds of sound work-to-landed-commit oracles, making the substrate materially more credible than the early binary-oracle pool; the remaining lever is upstream, capturing each session's true base commit so more tasks replay cleanly. On a parallel synthetic-world track, where every fact, distractor, and supersession is authored in code and seed-reproducible, the harness reaches the regime it was built for — memory-dependent sequences where a real arm finally stops matching the oracle once confusion and staleness metrics activate. The question that decides the project's shape is the one bridging them: whether a result on authored worlds generalizes to real city work, which is why a real fail-to-pass corpus is being built to calibrate the synthetic shapes against it.
