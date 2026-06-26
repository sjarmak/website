---
title: CodeProbe
status: active
domain: tooling
summary: Benchmarks AI coding agents against your own codebase by mining evaluation tasks from its git history, so the suite can't be contaminated by training data.
role: Creator
repo: https://github.com/sjarmak/codeprobe
architecture: https://sjarmak.github.io/codeprobe/
tech: [Python, Evaluation, Agents]
featured: true
featuredOrder: 5
order: 15
topics: [evaluation, agents, code-intelligence]
tags: [benchmark, evals]
---

A task in CodeProbe is a directory: `task.md` with instructions mined from a real merged pull request, `metadata.json` declaring how it gets scored, `ground_truth.json` holding the answer key, and a self-contained verifier. An eval run executes agents such as Claude Code, Copilot, and Codex against a set of these inside pooled git worktrees, with and without MCP tools, and reports quality, cost, and speed per configuration. Public benchmarks like SWE-bench and HumanEval run on fixed task sets a model may already have trained on; because these tasks come from your own repository's history, the suite can't be contaminated.

Ground truth requires consensus. Three backends (Sourcegraph, AST analysis, grep) extract the answer independently, and only tasks where at least two agree above a pairwise file-level F1 of 0.8 ship; the rest are quarantined with a divergence report. Consensus also neutralizes a tautology: if ground truth were mined through the same tool the agent can call, the agent scores 1.0 by querying the answer key, and the eval reports tool value that is actually measurement bias. Aggregate-time bias detection flags whatever residue remains.

Scorer honesty is enforced as a CI gate rather than left to review-time judgment. Recall-only scoring turned out to be a honeypot: on one task an agent shipped roughly 300 files against an 80-file answer key and scored a perfect 1.0. The default became oracle-overlap F1 (the same dump scores 0.41 and fails), every result declares which rubric produced its number, and a lint suite AST-scans the scoring package for four classes of verifier dishonesty: undeclared scorer families, quiet recall fallbacks, hardcoded thresholds, and bare excepts that grade a scorer bug as an agent failure. A verdict field separates agent failure from verifier-infrastructure failure, with the verifier re-run against a clean checkout plus the agent's diff, and every adapter declares the provenance of its cost data rather than degrading silently.

The behavioral findings have been as useful as the rankings. A cross-rig cost audit showed MCP overhead was payload bloat inflating cache-creation tokens, not call count, and a three-arm A/B found that mechanically blocking retrieval tools cut output tokens 53% and held reward within noise, where a polite preamble instruction had changed nothing. Tool availability shapes agent behavior more than instructions do.
