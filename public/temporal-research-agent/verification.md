# Verification record

Verified on 2026-07-29 and 2026-07-30 in
`/home/ds/temporal_devrel/presentation/temporal-literature-review`.
The existing local Temporal development server was healthy at
`localhost:7233`.

## Toolchain

```text
Temporal CLI     1.8.0
Temporal Server  1.31.2
Temporal UI      2.50.1
Python           3.11.15
temporalio       1.31.0
mcp              1.29.0
uv               0.11.2
```

## Static and automated checks

Commands:

```bash
uv run pytest -q
uv run ruff check .
uv run mypy src
```

Result:

```text
67 passed
84.64% branch-aware coverage
All checks passed
Success: no issues found in 15 source files
```

The Workflow tests used `WorkflowEnvironment.start_time_skipping()`. The
compact-history test decoded all Event History payloads, found the external
artifact path, and did not find the 20 KB source-body sentinel. External-call
tests verify stable request IDs, journal reuse, and provider idempotency-key
forwarding.

## Temporal Python best-practice audit

Audited on 2026-07-30 against Temporal's official Python guidance for
deterministic Workflow sandboxing, async Activity safety, idempotency,
heartbeats, timeouts, testing, and graceful Worker shutdown.

The audit retained the deterministic Workflow and compact-history boundary,
then made three implementation changes:

- synchronous filesystem and request-journal work now runs through
  `asyncio.to_thread` instead of blocking the Worker's async event loop;
- live MCP retrieval emits heartbeats throughout the external wait, not only
  during the recorded demo delay;
- the Worker now has a 30-second graceful shutdown window, while the recovery
  demonstration still uses `SIGKILL` to prove crash recovery.

New tests exercise the off-thread fixture read and repeated live-retrieval
heartbeats. The remaining production considerations, including shared artifact
storage, provider-side deduplication, Activity-specific retry policies, Worker
Versioning, and Continue-As-New for long histories, are explicit in the
README rather than presented as capabilities of this workstation demo.

## Agent skill lifecycle and recovery

Commands:

```bash
RESEARCH_SKILL_DIR="$HOME/.agents/skills/run-durable-research" \
  ./tests/e2e_agent_skill.sh
uv run --with pyyaml python \
  /home/ds/.codex-homes/codex-2/skills/.system/skill-creator/scripts/quick_validate.py \
  skills/run-durable-research
uvx --from skillager-linter skillager-lint skills/run-durable-research
```

Verified run:

```text
Workflow ID       agent-skill-e2e-1785413365
Run ID            019fb2ed-f387-77b2-be61-a20d2273876b
First server      PID 574789
Restarted server  PID 577040, same SQLite database
Killed Worker     PID 575074
Replacement       PID 577146
Caller            exited immediately after start
Initial status    RUNNING
Final status      COMPLETED
Angles            4 completed, 0 failed
```

The test script called the bundled skill from `/tmp`, outside the project
directory, through its shared installation symlink. The doctor first rejected
the healthy Temporal Service because it had no Workflow or Activity Worker
pollers. The test then stopped the first Worker and Temporal development
server after the start caller exited, restarted the server from the same
SQLite database, started a replacement Worker, and retrieved the original
Workflow by Workflow ID and Run ID from a fresh process. The structural
validator and skillager linter reported no findings.

## Injected Activity retry

Command:

```bash
uv run durable-research-start \
  --artifacts .demo/retry-artifacts \
  --fail-once tool-reliability \
  --workflow-id temporal-lit-review-retry-20260729
```

Observed:

```text
Workflow ID  temporal-lit-review-retry-20260729
Run ID       019fb09c-e634-7a29-9f24-81bede7cdb5b
Result       COMPLETED
Angles       4 completed, 0 failed
```

The JSON Event History contained `injected transient failure for
tool-reliability` followed by attempt 2.

## Manual Worker kill and restart

The first manual run established the failure behavior before it was packaged
as a script:

```text
Workflow ID       temporal-lit-review-kill-20260729
Run ID            019fb09d-29db-7e97-92e8-dee00064cce1
Killed Worker     3178555@ds-5090
Replacement       3191070@ds-5090
Run time          48.96s
Status            COMPLETED
Angles            4 completed, 0 failed
History events    65
```

Before the kill, `temporal workflow describe` reported two pending
`research_angle` Activities, attempt 1, with current heartbeat details and
`LastWorkerIdentity 3178555@ds-5090`. The completed history showed attempt 2
on the replacement Worker.

## Packaged recovery demo

Command:

```bash
./demo/recovery-demo.sh
```

Verified run:

```text
Server            private 127.0.0.1:7723, per-run SQLite database
Workflow ID       temporal-lit-review-live-demo-1785376131
Run ID            019fb0b5-d076-7651-b1ac-fb5073e57767
Killed Worker     3681714@ds-5090
Replacement       3682436@ds-5090
Run time          51.23s
Status            COMPLETED
Angles            4 completed, 0 failed
History events    65
History size      54,273 bytes
```

The script waited for two started Activities with heartbeat details before
sending `SIGKILL`. It started and stopped its own Temporal server, Workers, and
client. Event History recorded heartbeat timeouts for both first attempts and
attempt 2 on the replacement Worker.

After replacing the shell-specific timeout wrapper with the Temporal CLI's
`--command-timeout`, the final script ran again successfully:

```text
Workflow ID       temporal-lit-review-live-demo-1785376301
Run ID            019fb0b8-664c-76e9-ba0a-f5b407e03865
Killed Worker     3740852@ds-5090
Replacement       3741439@ds-5090
Status            COMPLETED
Angles            4 completed, 0 failed
```

## Recorded demo

Commands:

```bash
./demo/capture.sh
./demo/render.sh
```

Accepted take:

```text
Workflow ID       temporal-lit-review-live-demo-1785377848
Run ID            019fb0d0-0308-71f4-9b31-f232d2dd838a
Killed Worker     703127@ds-5090
Replacement       704325@ds-5090
Status            COMPLETED
Angles            4 completed, 0 failed
Heartbeat retries 2 Activity starts at attempt 2
Recording gate    8/8 checks passed
Video             51.80s, H.264, 1920x1080, yuv420p
Temporal Web      16.23s source capture
Caption layout    dedicated 600px right panel
Editorial beats  4 freezes, 2 zooms, 1 highlight box
Highlight stroke 3 source pixels
Animated zoom    1.5s ease to 1.25x on completion
Evidence holds   8s kill, 8s completion, 7s overview, 10s retry
Summary card     10s, existing research code vs. Temporal additions
```

Temporal Web first shows the completed Workflow and result. It then sorts
Event History ascending, where events 7 and 10 show the two `research_angle`
Activity starts at attempt 2. The edit pauses and zooms that frame, with a
separate caption panel and a tighter crop around rows 4–12. Completion is also
held while the full pane eases over 1.5 seconds into a moderate 1.25× zoom
around status and the replacement Worker identity. Neither frame has a box or
dark overlay. The final card contains only the existing-code and
Temporal-added capability summary. The recording manifest stores the Workflow
and run IDs with SHA-256 hashes for the MP4 and preview GIF.

## Three clean reference runs

```text
temporal-lit-review-clean-20260729-1  COMPLETED
temporal-lit-review-clean-20260729-2  COMPLETED
temporal-lit-review-clean-20260729-3  COMPLETED
```

Each run completed all four angles and recorded 65 history events.

## Live-provider smoke test

The SciX stdio MCP server returned two keyword results for `fault tolerant
autonomous agents recovery`. The first result was `Crab: A Semantics-Aware
Checkpoint/Restore Runtime for Agent Sandboxes`
(`2026arXiv260428138W`).

The Code Intelligence Digest stdio MCP server returned two semantic results
for `durable execution Temporal agents workflow recovery`. The first was
`Building a Durable Execution Engine with SQLite`.

A complete live `research_angle` Activity then queried both providers for the
`durable-execution` angle, normalized six SciX papers and six digest items,
wrote all 12 evidence artifacts, and returned a compact branch index.

Both local MCP transports and current indexes were reachable on the
verification date. Fixture mode remains the presentation default.

## Source provenance

The complete before source was:

```text
/home/ds/projects/code-intelligence-digest/research/phaseE_workflow.js
SHA-256 68cee4a169b053f42cf63ebd7e0620297db55aca8deb371bb79952e7a2e9cf29
```

`before/phaseE_workflow.excerpt.js` matches source lines 83–122 byte for byte
after its three-line provenance header.
