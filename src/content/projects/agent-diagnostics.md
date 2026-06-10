---
title: Agent Diagnostics
status: active
domain: research
summary: A behavioral taxonomy, annotation framework, and shareable dataset backend for analyzing why coding agents succeed or fail on benchmark tasks.
role: Creator
repo: https://github.com/sjarmak/agent-diagnostics
tech: [Python, Evaluation, Agents]
order: 9
topics: [evaluation, agents]
tags: [evals, diagnostics]
---

The dataset this project ships is 11,995 trials across four Claude models and 61 benchmarks, compressed to a 990 KB Parquet file. The problem it answers is that pass/fail scores hide everything worth knowing: reward hacking, flawed verifiers, lucky patches, and the behavioral failure modes that actually distinguish models. Each trial gets labeled against a behavioral taxonomy (40 categories across 11 dimensions in the current version) at a scale where humans can't label everything and a single LLM judge can't be blindly trusted.

So the annotation pipeline is tiered. Heuristic rules handle structural categories that are pure functions of extracted signals; an LLM judge reads actual trajectories for behavioral categories like reward hacking and task misunderstanding; a pure-Python classifier is trained per category so cheap inference can eventually cover what the LLM labels expensively; and an ensemble routes each category to whichever tier has earned trust. Earned is measured: a classifier serves a category only when its held-out cross-validated F1 clears 0.7, with training metrics never consulted because they flatter, and three reward-band categories are excluded from classifier training entirely, since predicting a category that is itself a function of the reward scalar is tautology dressed as machine learning.

The judge is treated as both expensive and attackable. Reward and pass/fail fields are stripped from its prompt through a shared constant pinned by a contract test, so it labels behavior rather than reverse-engineering the outcome. Trajectory content is wrapped in nonce-delimited boundaries so a forged closing tag can't inject instructions. A content-addressed cache plus the Message Batches API make a re-run over unchanged inputs issue zero API calls, and annotation errors are never cached or blended into training labels, because an error is a silent failure, not a confident negative.

Storage decisions were measured rather than assumed. JSONL is the source of truth and Parquet the export, because the stated goal is a shareable dataset; a GROUP BY over 12k rows runs 87 ms against JSONL and 0.6 ms against Parquet, a gap that is real and irrelevant at this scale, so DuckDB sits on top as a query facade and SQLite waits behind explicit promotion triggers. Trial identity is a content hash that survives re-downloads, directory moves, and re-scoring, exports are byte-deterministic so "did the data change" is a hash comparison, and the pre-built queries shipped with the dataset double as the regression suite for the data contract.

The honest caveat is recorded in the PRD rather than discovered later: many taxonomy categories were imported from the literature and have synthetic-fixture coverage but no validation against human-labeled trajectories yet. The taxonomy version flows through every artifact and the annotation primary key precisely so that future re-labeling is safe.
