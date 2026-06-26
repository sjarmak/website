---
title: mcp-ax
status: active
domain: research
summary: An MCP tool agentic-experience evaluation framework, measuring how usable MCP tools actually are for agents.
role: Creator
repo: https://github.com/sjarmak/mg-ax
architecture: https://sjarmak.github.io/mg-ax/
tech: [Python, Evaluation, MCP]
order: 13
topics: [evaluation, agents]
tags: [evals, mcp]
---

mcp-ax evaluates MCP tools the way an agent experiences them: can a model pick the right tool, call it correctly on the first try, and recover when it returns nothing. The pipeline has four stages behind one CLI. Lint runs static checks over a tool manifest against a registry of AX-keyed rules with citation evidence from the MCP evaluation literature, covering failure modes like descriptions that omit parameter semantics, confusable sibling tools, and empty results returned as errors. Trace executes scenarios against the tool with a pinned test agent, replaying from recorded cassettes by default and running live under hard budget caps (the smoke tier is $0.20 and 60 seconds, with a hard exit on overrun). Claim extracts eleven deterministic metrics per scenario from cached traces at zero cost, byte-equal on re-run; report renders findings, patches, and a regression delta in a PR-comment shape under 40 lines.

The load-bearing decision is patches over scores. A converge debate settled it: the default output is actionable findings and fix suggestions for the tool's author, with no scalar usability score anywhere in the core schema, and CI enforces the absence of aggregation fields. Regression tracking comes instead from an author-declared baseline, a frozen snapshot of metrics and claims that can only be updated by acknowledging each changed claim by ID with a reason. There is no force flag anywhere in the tool.

Trusting the harness is its own problem, handled two ways. A sentinel pack of six synthetic tools with known ground-truth defects (missing required parameter, ambiguous name, oversized description, undocumented coupling) runs as a CI gate with a variance target under 0.5 across five re-runs. And the test agent's prompt is de-framed: words like evaluate, rubric, score, and rank are banned from it, enforced by lint, so the agent uses the tool naturally instead of performing an evaluation.

The first real-world subject was Sourcegraph's Deep Search tool, run across eight scenarios: five fully accomplished, one partial, two failed, with polling friction in seven of the eight and an overall usability read of 3.4 out of 5 across comprehension, confidence, friction, composition, and trust calibration. The main standing risk is cassette rot, since recorded traces drift as upstream tools ship description changes; a freshness check in CI and manual re-recording are the current answer, with no auto-refresh policy yet.
