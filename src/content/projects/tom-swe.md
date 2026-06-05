---
title: ToM-SWE
status: active
domain: ai-agents
summary: A theory-of-mind agent for Claude Code that learns your coding preferences, interaction style, and project patterns across sessions.
role: Creator
repo: https://github.com/sjarmak/tom-swe
tech: [TypeScript, Agents, Memory]
order: 6
topics: [agents, agent-memory]
tags: [agents, memory]
---

ToM-SWE observes how you use Claude Code and builds a model of your preferences over time. When it detects ambiguity in a tool call, it consults your preference history and gives the agent context to act the way you would, without you repeating yourself. Built on a three-tier memory system, based on the ToM-SWE paper.
