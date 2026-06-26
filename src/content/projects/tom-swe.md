---
title: ToM-SWE
status: active
domain: ai-agents
summary: A theory-of-mind agent for Claude Code that learns your coding preferences, interaction style, and project patterns across sessions.
role: Creator
repo: https://github.com/sjarmak/tom-swe
architecture: https://sjarmak.github.io/tom-swe/
tech: [TypeScript, Agents, Memory]
order: 6
topics: [agents, agent-memory]
tags: [agents, memory]
---

ToM-SWE implements the framework from Zhou et al. ("ToM-SWE: User Mental Modeling for Software Engineering Agents," arXiv 2510.21903) as a Claude Code plugin: a theory-of-mind layer watches how you work, builds a persistent model of your preferences in three JSON memory tiers, and feeds it back when your instructions are ambiguous, so you stop repeating yourself across sessions. The build was itself an experiment in autonomous development: a Ralph-loop agent worked through 20 user stories one commit at a time, landing about 10,300 lines of strict TypeScript, 394 tests, and zero runtime dependencies in a two-day burst, appending its learnings to a progress log after each story.

The recorded design decisions hold up. Hooks are the trigger layer so the ToM machinery fires deterministically instead of depending on the main agent remembering to consult it. Retrieval is zero-dependency BM25 over short, keyword-dense preference text rather than an embedding store, keeping the index a single JSON file a user can read and delete. Preference confidence gets +0.1 per reinforcement with 30-day exponential decay and floor-pruning, latency budgets drove the sync/async split (capture backgrounds in under 10 ms, full analysis backgrounds at session end, and the synchronous ambiguity check stays model-free to meet its 50 ms budget), and the privacy posture is real: 16 secret patterns, parameter shapes rather than contents, local-only storage.

A four-month-later audit of the repo found a gap between that design and the shipped code: no model is ever called. The "sub-agent" exists as a prompt and a config that no code instantiates. Session analysis counts tool-name frequencies and greps outcome strings for "error"; consultation string-formats suggestions from BM25 hits; the routing layer logs token counts for operations that consumed zero tokens. The paper's 86% suggestion-acceptance result came from LLM-based mental-state inference, and none of that evidence transfers to keyword heuristics. The audit also found the hook I/O contract broken against current Claude Code (the hooks read environment variables where the platform delivers a stdin JSON payload, so capture silently records nothing) and a duplicated hook-registration path.

The memory tiers, the preference math, and the test discipline survived the audit intact. The repair is now in flight as a staged agent pipeline: a spec pass that verifies the hook contracts against live documentation rather than four-month-old assumptions; three sequential implementation agents covering the stdin migration and session-identity fixes, real model invocation through headless `claude -p` with a recursion guard and a logged rather than silent heuristic fallback, and the cleanup pass (deduplication, matcher scoping, a SessionStart user-model injection hook); then parallel verification by role-clamped reviewers required to execute the built artifacts, not just read them. What ships out the other side converts a convincing scaffold into a testable hypothesis. Until then, the project is a case study in semantic judgments shipped as keyword lists: the implementation built around the hard part rather than through it.
