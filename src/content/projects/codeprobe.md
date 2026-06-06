---
title: CodeProbe
status: active
domain: tooling
summary: Benchmarks AI coding agents against your own codebase by mining evaluation tasks from its git history, so the suite can't be contaminated by training data.
role: Creator
repo: https://github.com/sjarmak/codeprobe
tech: [Python, Evaluation, Agents]
featured: true
featuredOrder: 9
order: 15
topics: [evaluation, agents, code-intelligence]
tags: [benchmark, evals]
---

Public agent benchmarks like SWE-bench and HumanEval run on fixed task sets a model may already have trained on. CodeProbe builds the evaluation from your repository instead: it mines tasks from merged pull requests, generates short exact-match comprehension probes, and runs agents such as Claude Code, Copilot, and Codex against them with and without MCP tools, then ranks the configurations. The result is an org-specific suite that training data can't contaminate, with CSV and HTML reports and bias detection for honest MCP-versus-baseline comparison.
