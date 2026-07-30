# Durable literature review with Temporal, SciX, and Code Intel Digest

This project rewrites a literature-review pipeline we had already run with
Claude and SciX as a Python Temporal application. It gives us a real before
and after, a Worker-kill demo, and a workstation-only fixture path that does
not depend on an LLM key or a healthy research index.

The research question used in the demo is: **What does durable execution
change about an agent research pipeline?**

## Why this was the right workflow to rewrite

The original
[`phaseE_workflow.js`](before/phaseE_workflow.excerpt.js) coordinated research,
deep dives, scripts, and two final literature reviews. It produced real work,
including the Code Intelligence Digest reviews on multi-agent orchestration
and code retrieval. Its orchestration lived in one client process, however.
A process exit between search, synthesis, and file writes left recovery to the
operator.

Literature review gives Temporal several useful failure boundaries:

- SciX searches a scholarly corpus. The Code Intelligence Digest searches
  field reports, engineering posts, and community discussion.
- Search calls can time out, return partial evidence, or succeed before the
  Worker dies.
- Several research angles can run concurrently while final synthesis waits
  for a minimum useful set.
- Full paper and post payloads are too large for Workflow history.
- Citations and files must survive retries without silent overwrite.

The
[Braintrust deep-research cookbook](https://github.com/braintrustdata/braintrust-cookbook/blob/main/examples/TemporalDeepResearch/TemporalDeepResearch.mdx)
uses a similar shape: specialized Activities, parallel search, partial-result
recovery, and report synthesis. This version starts from our own prior
workflow and uses our two research systems.

## Before and after

The before code expressed the happy-path dependency graph:

```javascript
phase('Research')
await pipeline(
  EPS,
  (it) => agent(/* research with SciX */),
  (research, it) => agent(/* write deep dive */),
  (_deepDive, it) => agent(/* write script */),
)

phase('Synthesis')
await parallel(/* write final literature reviews */)
```

The Temporal Workflow records the orchestration as durable state:

```python
@workflow.run
async def run(self, review: ReviewInput) -> ReviewResult:
    for batch in bounded_batches(review.angles):
        results = await asyncio.gather(
            *(self._run_branch(request) for request in batch)
        )

    if completed < review.minimum_completed_angles:
        raise ApplicationError(..., non_retryable=True)

    return await workflow.execute_activity(
        "finalize_review",
        FinalizeRequest(...),
        retry_policy=retry_policy,
        start_to_close_timeout=timedelta(minutes=2),
    )
```

The full implementation is in
[`workflow.py`](src/durable_research/workflow.py). Its code schedules work,
tracks progress, applies retry policy, and chooses whether enough branches
succeeded. It does not call MCP servers, read the clock, or touch the
filesystem.

Every interaction with the outside world runs in an Activity:

| Activity | Nondeterministic work | Compact result |
|---|---|---|
| `research_angle` | SciX MCP, Digest MCP, fixture reads, evidence writes | source IDs, hashes, artifact references |
| `verify_evidence` | artifact reads and SHA-256 checks | verified source references |
| `synthesize_section` | evidence reads and one cited findings section per research angle | section reference |
| `finalize_review` | SciX `synthesize_findings`, section reads, report and manifest writes | report and manifest references |

See [`activities.py`](src/durable_research/activities.py). Temporal's
[Workflow documentation](https://docs.temporal.io/workflows) explains why
network calls, LLM calls, and file I/O belong in Activities: Workflow code is
replayed and must make the same decisions from the same Event History.
[Activities](https://docs.temporal.io/activities) may run nondeterministic
code and should be idempotent.

## What happens when the Worker dies

The recovery demo slows the retrieval Activities to eight seconds and emits
heartbeats. It starts a Worker and a Workflow, waits until Temporal reports
two started Activities, kills that exact Worker PID with `SIGKILL`, and starts
a replacement Worker.

Temporal keeps the Workflow open. After the heartbeat timeout, the replacement
Worker receives new Activity attempts. The client that started the Workflow
keeps waiting on the same Workflow ID and run ID. The final report contains
all four research angles.

## Pipeline outcome

After recording the fixture-backed recovery demo, we ran a separate Workflow
against the live SciX and Code Intelligence Digest indexes. It completed all
four research angles, failed none, and retained 48 retrieved records: 24 from
SciX and 24 from Code Intelligence Digest.

The Activity pipeline searches both providers, verifies persisted evidence
hashes, writes a cited section for each angle, and then calls SciX
`synthesize_findings` over the combined scholarly working set. That final
mechanical synthesis grouped 23 distinct SciX bibcodes into an auditable
writing scaffold before `finalize_review` wrote the report and provenance
manifest:

- [Read the research output](/temporal-research-agent/research-output/)
- [Raw Markdown report](/temporal-research-agent/research-output/report.md)
- [Provenance manifest](/temporal-research-agent/research-output/manifest.json)
- [SciX synthesis output](/temporal-research-agent/research-output/synthesis.json)

The research product answers four questions about durable agent pipelines. It
finds that orchestration decisions must survive process loss, unreliable tools
need separately retryable and observable boundaries, large evidence should
stay outside Workflow History, and recovery tests must check output
correctness rather than completion alone. The manifest connects each finding
to its SciX or Code Intelligence Digest lane, source locator, content hash,
retrieval timestamp, stored evidence artifact, external-call request ID, and
source lane.

The video remains a separate fixture-backed run with one SciX-shaped and one
Digest-shaped record per angle. That deterministic run proves that the
Workflow, Activities, retries, artifact writes, report, and provenance survive
a Worker failure without making the recording depend on local index health.
The live report linked above is the research product; the fixture report is
only recording evidence.

On the configured workstation, the internal recovery harness is:

```bash
./demo/recovery-demo.sh
```

The script refuses to perform the kill until the server reports a nonzero
pending-Activity count and a heartbeat. It also prints the Worker identities
recorded in Event History. It owns a private dev server at
`127.0.0.1:7723`, a private UI at <http://127.0.0.1:8723>, and a per-run
SQLite database under `.demo/`; cleanup stops every process it starts. The
rehearsal evidence is recorded in [`verification.md`](verification.md). This
internal reproduction command requires the script, local services, source
repositories, and captured run on our configured workstation.

## Watch the recording and inspect its capture recipe

The recorded demo shows both sides of the same run: the terminal captures the
exact Worker PID killed during live Activities, then Temporal Web shows the
completed Workflow, Activity attempts, and Event History.

- [Full demo recording](demo/out/temporal-literature-review-demo.mp4)
- [10-second preview](demo/out/temporal-literature-review-teaser.gif)
- [Recording manifest](demo/out/recording-manifest.json)
- [Capture, evidence, and rendering notes](demo/README.md)

The following internal commands recapture and render the assets on the
configured workstation:

```bash
./demo/capture.sh
./demo/render.sh
```

`capture.sh` exports Event History and rejects the take unless the killed and
replacement Worker PIDs differ, the retry was caused by a heartbeat timeout,
the replacement records Activity attempt 2, all four angles complete, and
both terminal and Temporal Web footage exist. `render.sh` produces an offline
1920×1080 H.264 MP4 and a looping preview GIF. Captions occupy a dedicated
right-side panel. The failure frame uses one three-pixel border. Completion
eases from the full pane into a moderate 1.25× zoom over 1.5 seconds. Retry
evidence uses a tighter crop with no overlay, and the proof frames hold for
8–10 seconds. The Temporal Web overview holds for seven seconds. The final
ten-second card summarizes what the research code already provided and what
Temporal adds.

## Run it on the configured workstation

This section records our local setup. The fixture files are bundled with this
project; the complete package and demo harness remain an internal,
workstation-only distribution.

Requirements:

- Python 3.11 or newer
- [`uv`](https://docs.astral.sh/uv/)
- [Temporal CLI](https://docs.temporal.io/cli)
- `jq` for the recovery script's final Event History check

Install the environment:

```bash
uv sync --group dev
```

Start the Temporal development server:

```bash
temporal server start-dev
```

Start a Worker:

```bash
uv run durable-research-worker
```

Start an offline fixture run from a third terminal:

```bash
uv run durable-research-start \
  --artifacts artifacts \
  --workflow-id literature-review-demo
```

Open <http://localhost:8233> to inspect the Workflow, Activity attempts, and
Event History. The report and provenance manifest appear under:

```text
artifacts/review-56ec9b0ec0d8/
├── branches/
├── evidence/
├── sections/
├── manifest.json
└── report.md
```

Fixture mode exercises the complete Temporal and artifact path with fixed
SciX-shaped and Digest-shaped evidence. It is the recommended presentation
mode because Wi-Fi, embedding startup, and index health cannot break the
demo.

## Call it from any agent on this workstation

The workstation-local reusable skill lives at
[`run-durable-research` skill](skills/run-durable-research/SKILL.md). Its bundled
client starts a Workflow and exits once Temporal accepts it. Later agent
processes can query progress or fetch the result with the returned Workflow
and Run IDs.

Install the repo-owned skill in the shared agent directory:

```bash
ln -s \
  "$(pwd)/skills/run-durable-research" \
  "$HOME/.agents/skills/run-durable-research"
```

Check the configured Temporal Service and both Worker pollers:

```bash
~/.agents/skills/run-durable-research/scripts/doctor
```

Create a JSON request using the
[request schema](skills/run-durable-research/references/request-schema.md),
then use the same thin client from any working directory on this machine:

```bash
research_skill="$HOME/.agents/skills/run-durable-research"

"${research_skill}/scripts/research" start /absolute/path/to/request.json
"${research_skill}/scripts/research" status WORKFLOW_ID --run-id RUN_ID
"${research_skill}/scripts/research" result WORKFLOW_ID --run-id RUN_ID
"${research_skill}/scripts/research" wait WORKFLOW_ID --run-id RUN_ID
```

`start` is detached. `result` returns immediately and exits 2 while the run is
open. `wait` attaches when the current agent should remain until completion.
The response includes a Temporal Web URL, and completed results contain
references to the report and provenance manifest beneath the request's
`artifact_root`.

The skill delegates every research step to the Python application. The
Workflow keeps the branch graph, retries, progress, and result identity
durable. Activities run SciX, Digest, and artifact I/O; future model calls
would also run in Activities.
The verified skill recovery run in
[`verification.md`](verification.md) survived the starting caller exit, a
Worker replacement, and a persisted local Temporal Service restart.

## Use the workstation-only live MCP integration

The live path launches both stdio MCP servers from the retrieval Activity:

```bash
uv run durable-research-start \
  --mode live \
  --artifacts artifacts-live \
  --workflow-id literature-review-live
```

The workstation defaults match the current projects:

```text
SCIX_PYTHON=/home/ds/projects/scix_experiments/.venv/bin/python
SCIX_CWD=/home/ds/projects/scix_experiments
DIGEST_COMMAND=npx
DIGEST_SERVER=/home/ds/projects/code-intelligence-digest/src/mcp/server.ts
DIGEST_CWD=/home/ds/projects/code-intelligence-digest
QDRANT_URL=http://127.0.0.1:6633
```

These paths document the implementation that produced the evidence. The SciX
and Digest repositories, their indexes and databases, and their service
configuration are not bundled with this example. Changing environment
variables alone does not make live mode reproducible on another computer.
`QDRANT_URL` is set in the SciX server configuration in
[`preset.py`](src/durable_research/preset.py).

The scholarly and field-evidence lanes answer different questions. SciX is
the place to establish prior work, named systems, evaluation methods, and
citation lineage. The digest is the place to see what practitioners are
building and struggling with now. A final claim can cite one lane or compare
both, while the manifest retains the source and retrieval lane.

## Design considerations and tradeoffs

This is an intentionally small, inspectable Temporal application. The choices
that make the demo reliable also define where a production implementation
would need to evolve.

| Consideration | Choice in this sample | Benefit and tradeoff |
|---|---|---|
| Workflow and Activity boundary | The Workflow owns branch order, concurrency, the completion threshold, and finalization. Activities own MCP calls, time, and artifact I/O. | Workflow replay stays deterministic. Three Activities per branch create more History events, but retrieval, verification, and synthesis can retry independently. |
| Async Activities and blocking I/O | MCP transport remains asynchronous; filesystem and request-journal operations run through `asyncio.to_thread`. Live retrieval heartbeats throughout the MCP wait. | One Worker can make concurrent MCP calls without blocking its event loop, and cancellation or Worker loss is detected through the 30-second Heartbeat Timeout. Any new library added to an async Activity must receive the same blocking-I/O audit. |
| Partial results | A failed branch becomes a typed result, and finalization requires a configurable minimum number of completed angles. | A transiently unavailable source lane need not discard useful research. Consumers must still inspect `failed_angles`; completion does not imply that every requested angle succeeded. |
| External-call deduplication | A stable logical request ID and write-once response journal suppress retries after the response is stored. | Read-only searches are safe to repeat. External-call deduplication still has a crash window between provider success and journal persistence; paid or mutating providers must honor the key or supply a transactional equivalent. |
| Artifact durability | Full evidence, sections, report, and manifest live outside Event History; only compact references and hashes cross the Workflow boundary. | History remains small and replayable. The bundled filesystem store is workstation-local, not protected by the Temporal Service, and would need shared durable object storage or a database for multi-host Workers. |
| Retry policy | The demo uses three attempts with 100 ms initial backoff and a five-second cap. | Failures are visible quickly in a short presentation. A production Worker should use Activity-specific policies, especially slower backoff and rate-limit handling for paid APIs or MCP providers. |
| Activity names | Workflow code schedules Activities by registered string name. | The Workflow module imports only deterministic models and remains isolated from I/O modules. The cost is less call-site type checking than direct function references, so registration and integration tests protect the name contract. |
| Worker deployment and versioning | One Worker hosts the Workflow and Activities, with a 30-second graceful shutdown window. The kill demo deliberately uses `SIGKILL`, which bypasses graceful shutdown. | The package is easy to understand and the recovery boundary is real. Production deployment would normally separate or tune Workers under load and use [Worker Versioning](https://docs.temporal.io/develop/python/workers/run-worker-process#run-a-versioned-worker) before changing replay-sensitive Workflow code. |
| History growth | Four bounded branches complete in one Workflow Execution. | No Continue-As-New complexity is needed for this short run. An open-ended review with many branches, signals, or repeated refreshes should use [Continue-As-New](https://docs.temporal.io/develop/python/continue-as-new) before Event History becomes large. |
| Fixture versus live evidence | The recording uses fixed evidence; live mode uses workstation-only SciX and Digest MCP servers. | The failure demo is reproducible on the configured workstation. The recorded report demonstrates orchestration and provenance, not the freshness or quality of a live literature search. |

These choices follow Temporal's Python guidance on
[deterministic Workflow sandboxing](https://docs.temporal.io/develop/python/best-practices/python-sdk-sandbox),
[async Activity safety](https://docs.temporal.io/develop/python/best-practices/python-sdk-sync-vs-async),
[Activity idempotency](https://docs.temporal.io/develop/python/best-practices/error-handling#make-activities-idempotent),
[heartbeats](https://docs.temporal.io/encyclopedia/detecting-activity-failures#activity-heartbeat),
and [graceful Worker shutdown](https://docs.temporal.io/develop/python/workers/run-worker-process#shut-down-a-worker).

## Retry and idempotency behavior

Pass `--fail-once` to make one retrieval Activity fail on its first attempt:

```bash
uv run durable-research-start \
  --fail-once tool-reliability \
  --workflow-id literature-review-retry-demo
```

The Workflow applies an exponential retry policy with three attempts. A
branch that still fails becomes a typed partial result. Finalization proceeds
when at least three of the four angles complete.

Activities have at-least-once execution semantics. A Worker can finish an MCP
or LLM call and die before Temporal records completion, so the call can run
again. This sample now assigns each logical external request a stable ID and
stores successful responses in a durable request journal. A retry after that
journal write reuses the response instead of calling the MCP again. The same
ID is carried into source provenance and can be forwarded as a provider
idempotency key when a provider accepts one.

Local artifacts remain replay-safe in two ways:

- Evidence uses content-addressed paths.
- Named report and manifest writes accept an identical replay and reject
  different content at the same path.

Neither current MCP tool accepts an idempotency key. If a Worker dies after a
server answers but before the journal write, that read-only lookup can still
run again. A paid or mutating provider must honor the stable request ID, or
provide an equivalent transactional deduplication boundary, to close that
last window. The Temporal Service persists Workflow Event History; it cannot
make an external side effect transactional on its own.

## History and artifact boundary

The Workflow receives typed dataclasses and returns `SourceRef`,
`BranchResult`, and `ReviewResult` objects. Full summaries and raw MCP payloads
go to the artifact store. Event History contains IDs, hashes, statuses, and
paths.

[`test_workflow_history_contains_refs_not_large_evidence`](tests/test_workflow.py)
writes a 20 KB sentinel source and decodes every history payload. The test
asserts that the artifact path appears in history and the source body does
not. This keeps replay inputs small and leaves source inspection possible
through the manifest.

## Tests

```bash
uv run pytest
uv run ruff check .
uv run mypy src
```

The test suite covers stable logical IDs, bounded input validation,
content-addressed writes, conflicting replay detection, fixture retrieval,
citation verification, partial branch failure, the progress query, and
decoded Event History. Workflow tests use the Python SDK's
[`WorkflowEnvironment.start_time_skipping()`](https://python.temporal.io/temporalio.testing.WorkflowEnvironment.html).

The current verified result is 69 passing tests with 84.58% branch-aware
coverage. The published walkthrough supports inspection of the source and
captured evidence. Running either the demo or live MCP integration still
requires the configured workstation.
