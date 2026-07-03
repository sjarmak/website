---
title: "Most of the agent bill is input tokens"
date: 2026-07-03
description: "WF2026 field notes on token economics: Tesco's 94% input cut from a local code index, Artificial Analysis on cost per task rising while prices fall, and Salesforce's CLI-vs-MCP-vs-skills rubric."
tags: [ai-engineering, agents, cost, code-intelligence, field-notes, wf2026]
draft: false
---

> **Automated field notes** from AI Engineer World's Fair 2026, agent-distilled from auto-captioned recordings; names and quotes are approximate. Method and source links in the [overview](/writing/wf2026-field-notes).

A typical coding query on Tesco's project sent 45K tokens of context when about 5K mattered. Rajkumar Sakthivel's talk built out from that one measurement: roughly 90% of AI coding cost is input, only 10% is output, so compressing output 75% saves about 8% of the bill while cutting input 94% saves about 61%. Prompt tweaks like "only show relevant code" cannot help because the cost is incurred before the model reads the instruction, and model settings govern output, the cheap side. Fix the input; that is where the money goes.

Their fix is a local index layer between the codebase and every AI tool: parse code into semantic units, run semantic and keyword search in parallel and combine them, shrink results to name plus description, track call-graph connections, and gate by relevance. The gating detail is the part worth stealing. LLM self-judging of results added 2-3 seconds per query and fixed thresholds were too crude, but a weighted formula of 50% semantic score, 30% keyword score, and 20% recency with an adaptive threshold runs in 0.4ms with no extra model calls. On their public FastAPI benchmark (53 files, 20 questions), 83K tokens per question dropped to 4.9K, a 94% cut at roughly 90% retrieval accuracy, and a real-project tally over 247 queries saved 12.4M tokens. The talk was also candid about limits: 94% is the worst case against naive full-file reads, tools like Claude Code are already smarter than that baseline, and on a 396-file mixed codebase their recall dropped to near zero.

I run a token-optimizing proxy and a code-graph index on my own machines for exactly this reason, and the numbers rhyme: the win comes from sending less, not from a smarter answer.

## Prices fall while the bill rises

Artificial Analysis brought the macro view: token prices fall 5-10× per year, and cost per task rises anyway, because the frontier keeps expanding what we ask. Simple Q&A costs fractions of a cent while agentic tasks now exceed $20, and since most agentic tokens are input, the cache-hit price, discounted 80-99% depending on provider, dominates real cost more than the list price does. Their four cost drivers make a usable checklist: token price, number of turns, verbosity, and caching. Two models at the same list price can differ substantially in effective cost purely through token efficiency, which is invisible on a pricing page and obvious on an invoice.

The selection heuristic they offered is the practical takeaway: for tasks with a quality ceiling, pick the cheapest model that clears the bar; for tasks without one, pay for intelligence. Jina's retrieval talk added the tactical version, spend cheap small-model tokens on exploration and save frontier tokens for exploitation.

## The tooling layer decides the context budget

Salesforce's Nikita Kotari gave the conference's most immediately applicable talk on where context goes. Fifty MCP tool schemas cost 15-20K tokens, roughly 60% of a working context window, before the agent has done anything. His taxonomy assigns each layer a role: a CLI is how to execute, MCP is what's available, and a skill is how to do a task, a runbook that loads only the servers a job needs, on demand.

The defense of CLIs was the crowd-pleaser and deserved to be: fifty years battle-tested, readable, composable through pipes, and reproducible, since you can copy-paste the exact command that failed at 2 a.m. His heuristic, that if an engineer could do it from a terminal the agent probably can too, matches my experience building a literature-search CLI for agents instead of wrapping the same API in MCP; the terminal version costs almost no context and produces transcripts a human can replay. The security rule he closed on belongs on a wall: enforce isolation in infrastructure, never in prompts, because prompts can be injected and infrastructure cannot.

The open question these three talks share is who ends up owning the input-reduction layer. A local index, a caching discipline, and a lean tool surface are each worth more than a model upgrade today, and all three are things the platform vendors would prefer to sell you back as managed features. Whether input optimization stays a thing you build or becomes a thing you rent will shape agent economics more than next year's price cuts.
