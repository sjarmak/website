---
title: mem
status: active
domain: research
summary: Build and benchmark agentic memory using a multi-agent orchestrator's own work traces as the evaluation corpus, where every unit of work has a verifiable outcome.
role: Creator
repo: https://github.com/sjarmak/mem
tech: [TypeScript, Evaluation, Agent memory]
featured: true
featuredOrder: 6
order: 21
topics: [agent-memory, agents, evaluation]
tags: [benchmark, memory, evals]
---

Most agentic-memory work learns from a single agent's session prose. A multi-agent orchestrator produces something richer: a continuous stream of real work where every unit has a verifiable outcome (work item closed, PR merged, CI green or red) and a full trace of how it got there. `mem` turns that exhaust into a benchmark, asking whether retained, retrieved memory measurably improves future agent work, and which retention and retrieval strategies win.
