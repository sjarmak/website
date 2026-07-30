# Assignment alignment record

This file is an internal coverage check. It is not linked from the landing
page or included as a section in the PDF.

## Objective

The historical code sample is the complete
[`phaseE_workflow.js`](before/phaseE_workflow.js) from Code Intelligence
Digest. The Python replacement preserves its two series, ten episode briefs,
research-to-deep-dive-to-script sequence, and two final literature reviews.

The rewrite uses Temporal's Python SDK. The recorded explanation targets a
developer audience and fits a 10–15 minute presentation.

## Conversion requirements

| Requirement | Evidence |
|---|---|
| Identify state, retry, timeout, and durability needs | README sections “What a process failure meant before Temporal” and “Design considerations and tradeoffs” |
| Implement a Workflow | `PodcastResearchWorkflow` owns episode order, bounded concurrency, completion policy, progress, series fan-in, and manifest scheduling |
| Implement Activities | Five Activities own MCP retrieval, writer calls, heartbeats, clock reads, artifact I/O, and manifest generation |
| Implement a Worker | `podcast_worker.py` registers the faithful Workflow and five Activities on `temporal-podcast-research` |
| Use a supported SDK | Python SDK |
| Make it testable | 89 tests with 81.90% branch-aware coverage, strict MyPy, and Ruff |
| Make it resilient | Real Worker-kill run, two Heartbeat Timeouts, two attempt-2 starts, same Workflow ID and Run ID, completed outputs |

## Presentation questions

| Question | Covered in |
|---|---|
| What was the original problem? | Deck slides 2–4, README original-code and failure sections |
| How did the code work before? | Complete annotated JavaScript, business-input reader, prompt-contract reader |
| What challenges existed? | Process-local cursor, ambiguous artifact recovery, external-call duplication window |
| How does Temporal improve it? | Workflow/Activity boundary, durable retries and timers, progress Query, Event History |
| What tradeoffs were made? | README table, deck slides 6 and 9, report sections 3 and 7 |
| How would it be taught? | README “How I would teach the migration” and `talk.md` |

## Deliverables

| Deliverable | Location |
|---|---|
| Before code | `before/phaseE_workflow.js` |
| After Workflow | `src/durable_research/podcast_workflow.py` |
| After Activities | `src/durable_research/podcast_activities.py` |
| After Worker | `src/durable_research/podcast_worker.py` |
| Preserved business inputs | `src/durable_research/podcast_preset.py` |
| Preserved prompt contracts | `src/durable_research/podcast_prompts.py` |
| README | `README.md` |
| Presentation deck | `deck.html` |
| Recorded walkthrough | `demo/out/temporal-literature-review-demo.mp4` |
| Temporal Web evidence | `deck-assets/activity-attempt-two.png` and exported Event History |
| Research products | `before/products/` and `after/fixture-products/` |
| Email attachment | `submission/Stephanie-Jarmak-Temporal-Homework-Report.pdf` |

## Review checks

- Technical depth: deterministic Workflow code, five Activity boundaries,
  retries, timeouts, heartbeats, typed progress, external idempotency analysis,
  artifact boundary, Worker replacement, and Event History evidence.
- Clarity: the same episode sequence appears in the before source, after code,
  architecture diagram, video, deck, README, and PDF.
- Developer empathy: the package shows complete source, raw downloads,
  click-to-expand explanations, actual outputs, limits, and likely production
  questions.
- Code quality: frozen typed dataclasses, strict MyPy, Ruff, branch-aware
  coverage above 80 percent, Workflow tests, Activity tests, and real recovery
  verification.

## Runtime limitation

The live MCP path depends on the configured workstation. The public site
contains reviewable source and captured evidence and does not present the live
integration as a public runnable release.
