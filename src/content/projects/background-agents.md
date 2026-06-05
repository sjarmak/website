---
title: Cross-Repo Invariant Verifier
status: active
domain: ai-agents
summary: A background agent that checks organization-wide code invariants across every repository indexed by Sourcegraph, triggered by PR events and a weekly cron.
role: Creator
repo: https://github.com/sjarmak/background-agents
tech: [TypeScript, Agents, MCP]
order: 8
topics: [agents, code-intelligence]
tags: [agents, mcp]
---

Driven by a small declarative rules file and an MCP tool, this background agent verifies cross-repo invariants on GitHub PR events and on a schedule, emitting a strict-JSON violation report posted back as a PR comment or to Slack.
