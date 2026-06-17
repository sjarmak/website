---
title: Cross-Repo Invariant Verifier
status: active
domain: ai-agents
summary: A background agent that checks organization-wide code invariants across every repository indexed by Sourcegraph, triggered by PR events and a weekly cron.
role: Creator
repo: https://github.com/sjarmak/background-agents
architecture: https://sjarmak.github.io/background-agents/
tech: [TypeScript, Agents, MCP]
order: 8
topics: [agents, code-intelligence]
tags: [agents, mcp]
---

Some rules hold within one repository and break across many: every service must call the auth library's init before serving, no project may depend on both database clients, every gRPC call sets a timeout. This verifier declares such invariants in a small JSON file (schema-capped at 20; each with an ID, severity, search pattern, and assertion like must_contain or must_not_exist) and checks them against every repository indexed by Sourcegraph, on pull-request events and a weekly cron, posting results as an idempotent PR comment or a Slack summary.

The first invariant in the file is a canary that must always fire: it searches for a string guaranteed to exist somewhere in the index, and if it comes back empty, the problem is the pipeline, not the code, so the run exits with an infrastructure-error code instead of a green check. That three-way exit contract (pass, violations found, infrastructure failure) runs through the whole design: result truncation at the 500-match cap raises an error rather than silently under-reporting, and a Sourcegraph outage can never be mistaken for a clean sweep. Each invariant runs in isolation with bounded concurrency, so one broken rule never blocks the rest.

The hardening arc came from an adversarial stress test: five attack agents were pointed at the design, and their findings became the P0 fixes. JSON extraction from agent output silently failed on multi-line responses, disabling the whole system while appearing healthy. The exit logic counted failures but not errors, so an unreachable Sourcegraph made the gate fail open. And a PR author could edit the invariants file in the same PR being checked, approving their own violation; the workflow now pins the rules and agent instructions to the base branch, at the accepted cost of a two-PR dance when a rule legitimately needs to change.

Two backends share one client interface: a deterministic GraphQL path (the CI default, no agent involved, free) and an opt-in MCP path where a Claude agent drives Sourcegraph search tools, capped at a dozen turns, useful where assertion logic outgrows declarative patterns. Keeping the deterministic path as the production spine and the agent as the escape hatch is the design's quiet thesis about background agents generally: reach for model judgment only where mechanism stops being enough.
