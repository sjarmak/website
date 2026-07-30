# Brief alignment

Status: all requested deliverables are present. The live MCP runtime remains
workstation-only. The presentation uses captured evidence and does not offer
a public reproduction path.

## Objective

The prior sample is the JavaScript research pipeline preserved in
[`before/phaseE_workflow.excerpt.js`](before/phaseE_workflow.excerpt.js), with
its source path and SHA-256 in
[`before/provenance.json`](before/provenance.json). The replacement uses
Temporal's Python SDK in
[`workflow.py`](src/durable_research/workflow.py),
[`activities.py`](src/durable_research/activities.py), and
[`worker.py`](src/durable_research/worker.py).

## Conversion requirements

| Requirement | Evidence |
|---|---|
| Identify state, retry, timeout, and durability needs | Crash windows and boundary choices in [`README.md`](README.md) and [`blog.md`](blog.md) |
| Implement Worker, Workflow, and Activities | Python source under [`src/durable_research`](src/durable_research) |
| Use a supported SDK | `temporalio` Python dependency in [`pyproject.toml`](pyproject.toml) |
| Keep nondeterminism out of Workflow code | MCP, clock, heartbeat, and artifact operations live in Activities |
| Make retries safe | Content-addressed artifacts, write-once named outputs, and the request journal in [`external_calls.py`](src/durable_research/external_calls.py) |
| Test resilience | Worker-kill recording, 8/8 evidence gate, Workflow tests, Activity tests, caller-exit recovery, and Worker-replacement recovery |

## Presentation questions

The 12-minute sequence in [`talk.md`](talk.md) covers:

1. The original research problem and process-local implementation.
2. Three concrete failure windows.
3. The Workflow and Activity split.
4. Retry, timeout, partial-result, artifact, and request-journal policies.
5. The durable `run-durable-research` agent skill.
6. Worker-kill evidence in the terminal and Temporal Web.
7. Trade-offs, including at-least-once external calls and local-only MCP
   infrastructure.
8. How the code, recording, README, blog, and verification record teach the
   design to a developer audience.

The slide timings total 12 minutes, inside the requested 10–15 minute range.

## Deliverables

| Deliverable | Location |
|---|---|
| Before code | [`before/phaseE_workflow.excerpt.js`](before/phaseE_workflow.excerpt.js) |
| After code | [`src/durable_research`](src/durable_research) |
| README | [`README.md`](README.md) |
| Blog-style explanation | [`blog.md`](blog.md) |
| Presentation deck | [`deck.html`](deck.html) |
| Speaker notes | [`talk.md`](talk.md) |
| Recorded walkthrough | [`demo/out/temporal-literature-review-demo.mp4`](demo/out/temporal-literature-review-demo.mp4) |
| Run verification | [`verification.md`](verification.md) |
| Durable research skill | [`skills/run-durable-research/SKILL.md`](skills/run-durable-research/SKILL.md) |

## Evaluation criteria

- **Technical depth:** typed Workflows and Activities, bounded concurrency,
  heartbeats, timeouts, retry policy, partial results, progress Query,
  compact Event History, artifact provenance, and request journaling.
- **Clarity of explanation:** one side-by-side code slide and one failure
  boundary per subsequent section.
- **Developer empathy:** the docs name the operational cost, the
  response-before-journal gap, and the workstation-only integration boundary.
- **Code quality:** strict typing, linting, branch-aware coverage above 80%,
  Temporal test environment coverage, evidence-gate checks, and deterministic
  video rendering.

## Honest limitation

The published artifacts can be reviewed from any computer. Running the demo
or live research path requires our local Temporal setup plus the SciX and Code
Intelligence Digest repositories, indexes, databases, and service
configuration. The landing page and documents state that boundary directly.
