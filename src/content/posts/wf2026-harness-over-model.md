---
title: "A harness swings an agent 20 points on a fixed model"
date: 2026-07-03
description: "WF2026 field notes on harness engineering: Etsy's HarnessBench, Anthropic's tokens-should-have-jobs strategies, DSPy's program-don't-prompt case, and the manager-agent pattern."
tags: [ai-engineering, agents, harness-engineering, field-notes, wf2026]
draft: false
---

> **Automated field notes** from AI Engineer World's Fair 2026, agent-distilled from auto-captioned recordings; names and quotes are approximate. Method and source links in the [overview](/writing/wf2026-field-notes).

HarnessBench holds 106 tasks and one model constant and varies only the harness around it. In Aditya Bhargava's Etsy talk, scores across harnesses ranged from 52.4% to 76.2%, a swing of more than 20 points with not a single weight changed, and the effect grew larger as the model got weaker. His conclusion runs against the "models are so good, keep the harness simple" mood: investing in the harness is what lets weaker, local, open-weight models compete with frontier ones, and leaning on ever-better proprietary models is a dependency you choose.

The number matters because 20 points is roughly the gap the industry usually attributes to a model generation. If the scaffolding around a fixed model moves scores that much, then a meaningful share of what gets marketed as model progress is actually harness progress, and harness progress is something you can own.

## Tokens are not fungible

The sharpest version of this argument came from Anthropic's platform team, in a talk titled "Tokens Should Have Jobs." The default lever when an agent underperforms is a bigger budget, which implicitly treats every token as interchangeable execution. Instead they split the budget into roles: an executor plus tokens doing a different job, which they call a strategy. Three were demonstrated: **advise** (a second agent validates each step the executor takes), **grade** (a rubric-scoring agent loops the executor until the output passes), and **dream** (an agent reads transcripts after the fact and writes learnings to memory for the next round).

The benchmark arc is worth retelling in full. One-shot execution on a financial-analysis task hit 15% at about 39K tokens. Holding the budget constant at ~600K, pure execution rose to 76%, but the advise strategy hit 89% on the same spend, and when they rescored on perfect-run pass rate, the standard that matters when anything under 100% is a failure, execution managed roughly 42% against 75% for the best strategies. Their cost framing generalizes beyond agents: true cost is budget divided by pass rate, so a cheap strategy you must run three times costs more than an expensive one that lands first try.

## Program against evals, not vibes

DSPy's maintainers made the structural version of the case: treat an AI task as a function with a declared contract (typed inputs and outputs plus instructions, which they call a signature), keep hard constraints in code, and define what good looks like with evals, then let optimizers rework everything inside the contract. New techniques drop in as roughly one line without touching the signature, and optimizers have climbed the stack from few-shot examples to instruction tuning to optimizing the harness code itself. The enterprise payoff they cited: Shopify cut costs about 550× by downshifting to a cheaper model while the business logic stayed constant, because nothing outside the contract had to change.

Their tagline holds up as a design principle: hold your prompts, models, and code accountable to the problem you need them to solve. The three constants they claim have survived since 2022, specs, code, and evals, are the same three artifacts every other credible talk kept circling.

## The manager agent replaces the terminal farm

Peter Steinberger's OpenClaw talk declared the twenty-terminal workflow dead. Juggling parallel agent sessions by hand makes you the scheduler, the router, and the memory; the replacement is one persistent manager agent that delegates to workers, coordinates them, and wakes on triggers, so that what reaches the human is a finished PR with a diff and a running build rather than a stream of intermediate output. His bottleneck analysis explains why: the constraint moved from tokens to compute to human attention, the one resource you cannot buy more of, so deciding where attention goes is now the core engineering skill.

Garry Tan's YC keynote gave the organizational rendering of the same idea: agents as a managed workforce of markdown skill files, a resolver table as the org chart, trigger evals as performance reviews, and the discipline of never doing one-off work; if you did a task once, skillify it so the next occurrence is free. His sharpest line drew the boundary that most harness bugs cross: judgment and vague intent belong in latent space, steered by markdown, while storage, logic, and anything resembling an 800-seat clustering job belongs in deterministic code, and most failures come from putting work on the wrong side.

What none of these talks fully answered is where harness investment saturates. Etsy's 20-point swing was measured against weak baselines, Anthropic's strategies were tuned on one benchmark family, and the skeptics elsewhere at the conference argued that [harness engineering has a ceiling that only the model can raise](/writing/wf2026-autoresearch-and-skeptics). What can be said with the evidence in hand: the harness is the highest-leverage layer you control, and nobody yet knows how high it goes.
