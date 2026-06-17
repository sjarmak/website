---
title: Coding Agent Workflows
status: active
domain: ai-agents
summary: Coding standards, agent roles, skills, and multi-step workflows that read the same whether you drive Claude Code, Codex, Amp, or anything that reads an AGENTS.md.
role: Creator
repo: https://github.com/sjarmak/coding-agent-workflows
architecture: https://sjarmak.github.io/coding-agent-workflows/
tech: [JavaScript, Agents]
order: 11
topics: [agents, code-intelligence]
tags: [agents, workflows]
---

This is two repos with a lineage. The skills were born in `agent-workflows`, a skill factory for Claude Code: 28 orchestration skills across research (diverge, brainstorm with shape-uniqueness enforcement), decision-making (converge debates, premortems), prototyping (parallel implementations in isolated worktrees, hybrid recombination), debugging (bisect), and execution (focus, scaffold, PRD-driven parallel builds), each a phased markdown spec that spawns independent agents and has the model synthesize the results. Everything in it is coupled to Claude Code's Skill and Agent machinery, which is fine for proving patterns and wrong for sharing them.

`agentic-coding-practices` is the consolidation. One agent-neutral source tree holds 36 rules files (a common layer plus Go, Python, Rust, and TypeScript tiers), 14 agent role definitions, 23 skills, and 6 workflow procedures, and a render step generates every target shape from it: a thin 82-line `AGENTS.md` index, a 1,400-line `AGENTS.full.md` any agent can read section-by-section on demand, a native `.claude/` config, and a native `.codex/` config. A manifest scopes each artifact: universal content renders everywhere, while skills that genuinely need subagent infrastructure stay Claude-only rather than pretending to portability. Outputs are pre-rendered and committed, so installing is a copy, not a build.

The structural ideas matter more than the inventory. Rules and skills are split by kind of knowledge: rules say what good looks like and which anti-patterns to flag (the anti-slop rule carries 13 detectable code-erosion signatures with names from the SlopCodeBench rubric), skills say how to operationalize a practice in a given harness. Context is layered with a one-fact-one-layer discipline (bundle, project AGENTS.md, per-area tribal-knowledge maps, session memory) so a fact lives in exactly one place and the always-loaded footprint stays near 80 lines. And the consolidation added the practices the skill factory never needed internally: codebase onboarding, architecture decision records, test-first enforcement, a slop-check skill for code erosion, and a writing-voice guard for prose, the same one this page was written under.

The portability claim is the point of the whole exercise: the standards read the same whether the agent driving is Claude Code, Codex, or anything else that can open an AGENTS.md, and a content change propagates to every target in one render rather than four hand-synced copies.
