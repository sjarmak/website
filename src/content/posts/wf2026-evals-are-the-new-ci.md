---
title: "Evals are the new CI"
date: 2026-07-03
description: "WF2026 field notes on evaluation: Meta's production evals, Arize's agent-as-a-judge, Weights & Biases' nightly task suite, Sonar's multi-model verification, and who owns the verdict."
tags: [ai-engineering, evals, agents, field-notes, wf2026]
draft: false
---

> **Automated field notes** from AI Engineer World's Fair 2026, agent-distilled from auto-captioned recordings; names and quotes are approximate. Method and source links in the [overview](/writing/wf2026-field-notes).

Arize runs more than 100 million evals a month, the average team on their platform runs about 12 eval jobs, and their top teams run over 3,800 distinct evaluators. Those three numbers, from Aparna Dhinakaran's keynote, describe a capability distribution more lopsided than anything else measured at this conference, and they frame its loudest theme: as agents produce more than humans can review, evaluation stops being a pre-ship gate and becomes an always-on production service. Several speakers used the same sentence for it: evals are the new CI.

Meta's Nishant Gupta traced why the old kind stopped working. Benchmarks ask whether the model produced the right answer; agentic systems force the question of whether the system behaved correctly through planning, tool use, and recovery, which means evaluating scenarios in simulated environments rather than prompts in isolation. Their other point cuts deeper: observability is inseparable from evaluation, because agent traces are the distributed tracing of autonomous workloads and the failure mode to fear is silent drift, behavior degrading with no exception thrown anywhere.

## The judge stack has three layers

The architecture that kept reappearing stacks three kinds of judge. Deterministic rules catch what rules can catch: solved within six tool calls, no secrets in output, data flowed only where allowed. LLM-as-a-judge scores against a fixed rubric, correctness, frustration, interestingness, and holds up as long as trajectories resemble each other. The new layer is agent-as-a-judge, and Arize's launch of it, a long-running agent called Signal, reads live production traces, finds patterns rubric judges miss (repeated tool calls, inefficient trajectories), and, because it holds the full analysis in context, can open a PR proposing the fix. The judges climbed the same ladder the systems did.

Weights & Biases showed the nightly cadence in production for their Arya research agent: about 200 YAML-defined tasks, each judged by an LLM and rule checks together, run every night like a test suite, and a 73%-versus-72% delta is enough evidence to promote a change. Tasks are the unit test of the model era; the suite is small, versioned, and boring on purpose.

## Verification is a separate discipline from generation

Sonar's talks were the conference's firmest statement that checking work is not the same job as producing it. Their argument for multi-model verification is simple and slightly uncomfortable: every model has biases, so a system that verifies with the same model that generated is auditing itself, and their deployment of verification baked into the loop reported 44% fewer AI-derived outages. Amazon AGI's perception-agents talk gave the historical version: coding fell to agents first because code is verifiable, and extending agents to new domains means extending verification to them, in their case to the rendered screen itself.

Aditya Mani's talk supplied the governance principle underneath: own the verdict. An agent can gather evidence, but accountability for the judgment does not transfer, and the production systems that work keep a human owning the final call while agents feed it. Introspection's framing rounded it out; humans stop hand-building evals and instead calibrate them, which is a smaller job done at a higher altitude.

Put together, the pattern is a control loop: production traces feed judges, judges feed fixes, a human calibrates the judges and owns the verdict. What none of the talks settled is the failure mode the stack creates for itself, judges drift too, agent judges most of all, and a 3,800-evaluator team has built a second system that itself needs evaluating. The next iteration of this conference will probably have a talk titled "who judges the judges," and it will deserve the slot.
