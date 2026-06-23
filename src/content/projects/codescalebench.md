---
title: CodeScaleBench
status: active
domain: research
summary: A benchmark suite for evaluating how AI coding agents use external context-retrieval tools on realistic developer tasks in large, enterprise-scale codebases.
role: Creator
repo: https://github.com/sjarmak/CodeScaleBench
architecture: https://sjarmak.github.io/CodeScaleBench-Public/
links:
  - label: Draft Paper
    url: https://www.sjarmak.ai/papers/codescalebench-draft.pdf
  - label: Sourcegraph Blog
    url: https://sourcegraph.com/blog/codescalebench-testing-coding-agents-on-large-codebases-and-multi-repo-software-engineering-tasks
  - label: Enterprise Report
    url: https://sourcegraph.com/resources/ebooks/code-scale-bench-report
  - label: Tessl Blog
    url: https://tessl.io/blog/coding-agent-failure-patterns-large-codebases/
tech: [C++, Evaluation, Retrieval]
featured: true
featuredOrder: 3
order: 5
topics: [evaluation, retrieval, code-intelligence, agents]
tags: [benchmark, evals]
---

CodeScaleBench evaluates how AI coding agents (model plus scaffolding plus tools, not bare LLMs) use context-retrieval tooling on realistic developer tasks in large, often multi-repo codebases: roughly 275 validated tasks across nine kinds of developer work, from fix and refactor through cross-repo investigation, security, and debugging, comparing a no-MCP baseline against Sourcegraph MCP, Deep Search, and other augmentations. Tasks run as hermetic sandboxes, each carrying its own verifier bundle, with results landing in an auditable per-task tree of scores, traces, timing, and cost.

The scoring stance is deterministic verifier first, LLM judge second. The verifier score is the record and the judge only annotates, because a judge-dependent score inherits the judge's measured ~10% self-preference bias. Before any agent result counts, every task must pass a calibration triad: score at most 0.1 on a null answer, at least 0.9 on the golden answer, and at most 0.5 on an adversarial keyword dump. That triad is the strongest anti-broken-verifier defense in the system, and it gates publication rather than corpus membership.

Most of the operational design traces to a specific failure. A relative results path that silently split outputs across worktrees became an invariant (absolute path or exit 1); batch-end-only validation that dropped per-task accountability became "write a validation result even on crash"; 27 near-duplicate runner scripts drifting apart became one parameterized harness with CI rejecting new duplicates; infinite retries on a broken task became a circuit breaker at three attempts with quarantine. A post-run pipeline now validates and quarantines rate-limited results automatically, where it used to depend on an operator remembering to run a script.

Throughput is a deliberate tradeoff: cloud sandboxes run a batch of a couple hundred tasks in about fifteen minutes of wall clock, local Docker is free and takes hours, and pre-built base images cut per-task builds from minutes to seconds. The repo itself runs dual remotes, a private main holding raw traces and a sanitized public mirror fed through a fail-closed export that re-scans every published file for secrets before anything ships. The open questions that matter most right now are editorial rather than engineering: which task count is canonical, and whether heuristically scored results belong in headline aggregates.
