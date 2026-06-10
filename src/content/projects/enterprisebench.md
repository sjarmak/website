---
title: EnterpriseBench
status: active
domain: research
summary: A benchmark for evaluating how well coding agents understand and navigate code across large, distributed enterprise codebases.
role: Creator
repo: https://github.com/sjarmak/EnterpriseBench
tech: [Python, Evaluation, Agents]
featured: true
featuredOrder: 4
order: 2
topics: [evaluation, agents, code-intelligence]
tags: [benchmark, evals]
---

EnterpriseBench measures how well coding agents find and comprehend the right code across large, distributed codebases: context-retrieval quality, not code generation. Agents are dropped into Docker sandboxes containing one to five real, SHA-pinned OSS repos connected by genuine dependency chains (Kubernetes, gRPC, Flask, Envoy, Grafana) and asked to do realistic enterprise work — trace an error across repo boundaries, map a support ticket to code, audit a dependency upgrade, produce an incident report. Tool access is the controlled independent variable: every task can run as baseline (filesystem only), MCP-only, or hybrid, which makes the repo an experimental apparatus rather than just a task suite. The corpus is around 112 tasks across 7 enterprise-workflow suites and 10 task types.

Verification lives in one centralized library: nine stateless artifact-validator plugins and weighted checkpoints whose scores combine as the minimum of a deterministic verifier and an LLM judge, so the judge can cap a score but never inflate one. The rule, learned from its predecessor CodeScaleBench accumulating 549 per-task verifier copies, is no copies, ever. The verifiers themselves are tested by mutation: every checkpoint runs against an empty workspace (any credit is a hard failure), a garbage workspace, and a gold workspace built mechanically from the curated solution (a zero is a false-negative flag). The first sweep over one 52-task suite found zero false positives and six genuine findings, including verifiers that scored zero against their own curated solutions.

A score only counts if the run was valid. The harness classifies every run as VALID, FALLBACK, or INVALID, so an agent that never started (a permissions error, a failed MCP handshake) records an infrastructure failure rather than a fake 0.0 that would bias the MCP-versus-baseline comparison toward whichever mode is flakier. Everything in the sandbox is pinned (base images by registry digest, the agent CLI by version, Node by tarball checksum), so two runs months apart compare like with like.

The honest gap is stated in the repo: the calibration stratum of easy tasks where MCP should show no advantage sits at roughly half its 15% target, and until it is backfilled, every headline delta carries an asterisk. When MCP-mode runs score higher, the open question is how much is the tool and how much is a corpus shaped to favor it.
