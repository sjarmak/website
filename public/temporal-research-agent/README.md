# Temporal brings a research pipeline back to life

This project reimplements an existing research pipeline as a Python
application built on Temporal. We tested the change by killing a Worker
mid-Activity and observed the results.

The original JavaScript program researched ten podcast episodes across two
series. Each episode moved through research, a deep dive, and a podcast
script. Once the episode work finished, the program wrote a literature review
for each series. That business logic is preserved in the Python version.

During the recorded test, two episode branches were in their research
Activities when the Worker received `SIGKILL`. Temporal kept the Workflow
Execution open. After each 30-second Heartbeat Timeout, a replacement Worker
received Activity attempt 2. The same Workflow ID and Run ID then completed
both episode branches, both series reviews, and the final manifest.

## The code sample I started with

The source came from the
[Code Intelligence Digest](https://www.sjarmak.ai/projects/code-intelligence-digest)
project and used
[SciX](https://www.sjarmak.ai/projects/scix-agent) for scholarly research.
The [complete annotated JavaScript source](/temporal-research-agent/code/before/)
is captured in `before/phaseE_workflow.js`. Its SHA-256 matches the original
file recorded in [`before/provenance.json`](before/provenance.json).

The program defined:

- two series: Multi-Agent Orchestration and Code Retrieval & Enterprise
  Codebases;
- five episode briefs per series, including titles, focus statements, seed
  papers, and frontier flags;
- a three-stage episode path: research, deep dive, then podcast script;
- a final literature review for each series after the episode work;
- detailed prompt contracts, including 5–9 searches per episode, citation
  requirements, a 1,500–2,500 word deep dive, and an approximately
  3,000-word podcast script.

The orchestration was compact:

```javascript
phase('Research')
await pipeline(
  EPS,
  (it) => agent(researchPrompt(it), { label: `research:${it.s}-ep${it.ep}` }),
  (research, it) => agent(deepDivePrompt(it, research), {
    label: `deepdive:${it.s}-ep${it.ep}`,
  }),
  (deepDive, it) => agent(scriptPrompt(it, deepDive), {
    label: `script:${it.s}-ep${it.ep}`,
  }),
)

phase('Synthesis')
await parallel(
  writeSeriesReview('mas'),
  writeSeriesReview('code'),
)
```

The full file matters. It contains the episode briefs and prompt contracts
that make this a podcast research pipeline rather than a generic fan-out
example.

## What a process failure meant before Temporal

The JavaScript client owned the active phase, the pipeline cursor, and the
promises representing in-flight agent calls. If that process exited during
research:

- completed files remained on disk;
- in-memory knowledge of the active episode and stage disappeared;
- the program had no durable attempt record or resume point;
- an operator had to inspect files and decide what to rerun;
- a successful external call could be repeated if the process died before its
  result was recorded.

A Python translation with `asyncio.gather()` would have the same failure
boundary:

```python
async def run_episode(episode: Episode) -> None:
    research = await agent(research_prompt(episode))
    deep_dive = await agent(deep_dive_prompt(episode, research))
    await agent(script_prompt(episode, deep_dive))


async def run_pipeline() -> None:
    await asyncio.gather(*(run_episode(episode) for episode in EPISODES))
    await asyncio.gather(*(write_series_review(series) for series in SERIES))
```

The event loop can coordinate concurrent work, but it does not persist which
steps completed. Making this code recoverable would require a checkpoint
store, retry scheduler, attempt state, timeout handling, and rules for
reconciling external side effects.

## The Temporal architecture

```text
Starter
  │  starts one PodcastResearchWorkflow
  ▼
Temporal Service
  │  persists Event History and schedules tasks
  ▼
PodcastResearchWorkflow
  ├─ episode branch 1 ─ research → deep dive → script
  ├─ episode branch 2 ─ research → deep dive → script
  ├─ ... bounded to two concurrent episode branches
  ├─ series review: Multi-Agent Orchestration
  ├─ series review: Code Retrieval & Enterprise Codebases
  └─ manifest
         │
         ▼
Worker
  ├─ research_episode Activity
  ├─ write_deep_dive Activity
  ├─ write_podcast_script Activity
  ├─ write_series_review Activity
  └─ write_pipeline_manifest Activity
         │
         ▼
SciX, Code Intelligence Digest, writer process, artifact store
```

The boundaries are deliberate:

| Component | Owns | Why |
|---|---|---|
| Temporal Service | Event History, task delivery, durable timers, Workflow Execution state | A client or Worker can disappear without deleting the execution record. |
| Temporal Workflow | episode order, bounded concurrency, completion policy, series-review fan-in, progress query | These decisions replay from Event History and must stay deterministic. |
| Temporal Activities | MCP calls, writer process calls, heartbeats, clock reads, and artifact I/O | These operations depend on external state and may be retried. |
| Worker | Workflow and Activity registration, task polling, graceful shutdown | A replacement Worker can continue work from the same task queue. |
| Artifact store | evidence, research notes, deep dives, scripts, reviews, and the manifest | Large research payloads stay out of Event History. |

## How the Python version preserves the business logic

The episode and series definitions live in the annotated
[`podcast_preset.py` reader](/temporal-research-agent/code/inputs/). All ten
original episode briefs, seed papers, and frontier flags are represented as
typed dataclasses. The detailed editorial requirements live in the
[`podcast_prompts.py` reader](/temporal-research-agent/code/prompts/).

The
[`podcast_workflow.py` reader](/temporal-research-agent/code/workflow/)
shows how the Workflow retains the original dependency graph:

```python
results = await asyncio.gather(
    *(self._run_episode(EpisodeRequest(...)) for episode in batch)
)

researched = await workflow.execute_activity("research_episode", ...)
deep_dive = await workflow.execute_activity("write_deep_dive", ...)
script = await workflow.execute_activity("write_podcast_script", ...)

series_reviews = await asyncio.gather(
    *(self._write_series_review(...) for series in pipeline.series)
)
```

`asyncio.gather()` is safe here because it runs inside Temporal's Workflow
runtime. The Workflow records Activity scheduling and completion in Event
History. Replay rebuilds the same orchestration decisions without repeating
completed external work.

The Workflow also adds behavior the original program lacked:

- a queryable `PodcastProgress` state;
- a cap on concurrent episode branches;
- per-Activity Start-to-Close and Heartbeat Timeouts;
- bounded exponential Activity retries;
- typed failed-episode results;
- a minimum-completion rule before series synthesis;
- a compact final result that points to a provenance manifest.

## Activities and nondeterministic work

The
[`podcast_activities.py` reader](/temporal-research-agent/code/activities/)
contains five Activities:

| Activity | External work | Durable output |
|---|---|---|
| `research_episode` | runs eight journaled searches across SciX and Code Intelligence Digest in live mode, deduplicates results by source title, and asks the configured writer to synthesize the saved evidence; recording mode reads fixtures and uses a fixed renderer | research brief, evidence index, source IDs, hashes, and artifact references |
| `write_deep_dive` | reads the saved research and invokes the configured writer in live mode | deep-dive reference |
| `write_podcast_script` | reads the completed deep dive and invokes the writer | script reference |
| `write_series_review` | reads the completed deep dives selected for a series and invokes the writer for synthesis | series-review reference and included episode keys |
| `write_pipeline_manifest` | reads result metadata and writes the final index | compact `PodcastPipelineResult` |

Each live episode runs five SciX searches and three Code Intelligence Digest
searches. Every call uses a stable logical request ID and a write-once response
journal. Repeated attempts reuse a recorded response once it exists. A crash
can still occur after a provider succeeds and before the journal write. The
read-only search calls tolerate that duplicate. A paid or mutating provider
would need to accept the idempotency key or expose a transactional equivalent.

The research, deep-dive, script, and review Activities read their input
artifacts inside the Activity and include the contents in the writer request.
The research writer selects the on-topic evidence and collapses versioned
records instead of publishing the retrieval dump. Large research documents
and deep dives never enter Workflow History.

The writer command is also at-least-once. Its artifact path is stable, so a
retry replaces the same logical output, but the external model call can run
again. Production use should add a provider-side idempotency contract, a
request journal around the writer, or both.

## Worker registration

The [`podcast_worker.py` reader](/temporal-research-agent/code/worker/)
shows how the Worker connects to the Temporal Service, polls the
`temporal-podcast-research` task queue, and registers one Workflow with all
five Activities:

```python
worker = Worker(
    client,
    task_queue=TASK_QUEUE,
    workflows=[PodcastResearchWorkflow],
    activities=[
        research_episode,
        write_deep_dive,
        write_podcast_script,
        write_series_review,
        write_pipeline_manifest,
    ],
    graceful_shutdown_timeout=timedelta(seconds=30),
)
```

The recording uses `SIGKILL`, so the graceful-shutdown window cannot run. That
is intentional: the test exercises recovery from abrupt Worker loss.

## What the pipeline produced

The historical pipeline produced two complete research collections:

- [Multi-Agent Orchestration literature review](before/products/multiagent-orchestration/20-literature-review.md)
  and five podcast scripts;
- [Code Retrieval & Enterprise Codebases literature review](before/products/code-retrieval/20-literature-review.md)
  and five podcast scripts.

Those files establish the product created by the original JavaScript run.

### Live product run

The published live Temporal Workflow selects `mas-ep4`, “Enterprise &
Production,” from the preserved business input. That one branch is enough to
show the complete product path without spending the presentation on ten
repetitions of the same Activity graph. It produced:

- 1 synthesized research brief;
- 1 deep dive;
- 1 podcast script;
- 1 series synthesis;
- 0 failed episodes;
- 1 provenance manifest.

The completed execution is recorded in
[`workflow-run.json`](after/live-products/workflow-run.json):

```text
Workflow ID  temporal-phasee-live-one-20260730-v1
Run ID       019fb556-a19a-7eab-b90e-ace909f1e8f3
Status       COMPLETED
Episode      mas-ep4
Retrieved    29 deduplicated records
```

Read the live Temporal
[Multi-Agent Orchestration synthesis](after/live-products/reviews/mas-literature-review.md)
or [manifest](after/live-products/manifest.json). The research-output page
renders the research brief, deep dive, podcast script, and synthesis beside
the corresponding original products.

### Durability fixture

The fixture Workflow also completes all ten branches with fixed evidence and
short generated documents. That run verifies the Activity graph, artifact
sequence, and manifest without depending on local services. Its products live
under [`after/fixture-products`](after/fixture-products/). They are recovery
evidence and are not used as a writing-quality comparison.

## Recorded Worker-kill test

The recording uses two representative episode branches so the failure and
recovery fit in a short video. It does not shrink the production input: the
`full` preset still contains all ten episodes.

The recovery script:

1. starts a private Temporal development server and Worker;
2. starts one Workflow with two slow, heartbeat-emitting research Activities;
3. waits until Temporal reports both Activities as started;
4. sends `SIGKILL` to that Worker;
5. starts a replacement Worker on the same task queue;
6. waits on the original Workflow ID and Run ID;
7. exports Event History and rejects the take unless both research Activities
   reached attempt 2 on the replacement Worker.

[Watch the recording](demo/out/temporal-literature-review-demo.mp4) or inspect
the [recording manifest](demo/out/recording-manifest.json). The video shows the
terminal and Temporal Web from the same run. Captions occupy a separate panel,
the proof frames pause long enough to read, and the retry frame uses a crop
instead of an overlay.

The captured run completed:

```text
Workflow ID  temporal-phasee-demo-1785443614
Run ID       019fb4bb-817e-70cc-ad36-1857e4f10388
Status       COMPLETED
Episodes     mas-ep4, code-ep4
Failures     none
Reviews      mas, code
```

The evidence gate is implemented in
[`recording.py`](src/durable_research/recording.py), and the run metadata is in
[`demo/out/run-artifacts/run.json`](demo/out/run-artifacts/run.json).

## Local execution boundary

The website is a documentation package, not a public runnable distribution.
The live path depends on local SciX and Code Intelligence Digest repositories,
indexes, databases, MCP server configuration, and a configured writer command.
Those services are available on the workstation used for the recording and
are not bundled with the website.

The following commands document that workstation setup:

```bash
uv sync --group dev
temporal server start-dev

# terminal 2
WRITER_COMMAND=codex \
WRITER_ARGS='exec --ephemeral --ignore-rules --sandbox read-only --skip-git-repo-check -' \
uv run phasee-worker

# terminal 3: full ten-episode fixture input
uv run phasee-start --scope full --artifacts artifacts

# terminal 3: live MCP and writer path on the configured workstation
uv run phasee-start \
  --mode live \
  --episode-key mas-ep4 \
  --artifacts artifacts-live
```

Temporal Web is available from the development server and displays the
Workflow input, result, pending Activities, retries, and Event History.

`--episode-key` may be repeated to select any subset of the ten preserved
episode definitions. Omitting it and using `--scope full` runs the complete
preset. The Workflow itself contains no episode or series constants; it
derives branches and series fan-in from `PodcastPipelineInput`.

## Design considerations and tradeoffs

| Decision | Choice in this sample | Consequence |
|---|---|---|
| Workflow and Activity boundary | The Workflow owns orchestration; Activities own external calls and I/O. | Replay remains deterministic. The Activity graph creates more History events, but each expensive stage can retry independently. |
| Business-logic placement | Episode data and prompt contracts are separate typed modules; the Workflow imports only deterministic models and scheduling rules. | Reviewers can see the complete business contract. Prompt changes do not require putting I/O in Workflow code. |
| Concurrency | The input sets the cap. The full preset uses two branches; the published live example has one. Stages inside an episode remain sequential. | The sample protects local MCP and writer capacity. A deployed Worker fleet could raise the limit or route stages to separate task queues. |
| Timeouts and heartbeats | Research, writing, and review Activities heartbeat under a 30-second Heartbeat Timeout and have stage-specific Start-to-Close Timeouts. | Worker loss is detected during long calls. Timeout values must be tuned against real provider latency. |
| Retries | Activities use three attempts with bounded exponential backoff. | The demo recovers quickly. Production policies should account for rate limits, cost, and provider-specific errors. |
| Partial completion | Episode Activity failure becomes a typed result; the input defines the minimum number of completed episodes. | The domain decides whether synthesis may continue. Consumers must inspect `failed_episode_keys`. |
| Artifact boundary | Evidence and documents live outside Event History; the Workflow carries compact references and hashes. | History stays readable. The local filesystem store must become shared object storage or a database for multi-host Workers. |
| External-call idempotency | MCP responses use a request journal; artifact names are stable. | Read-only retries are acceptable. Paid or mutating calls still require a provider-enforced deduplication contract. |
| Activity names | The Workflow schedules registered string names. | The Workflow avoids importing I/O modules. Registration and integration tests protect the name contract. |
| History growth | Ten bounded episode branches fit in one Workflow Execution. | A larger or continuously refreshed catalog should use Child Workflows or Continue-As-New before History grows too large. |
| Deployment changes | One Worker hosts the sample Workflow and Activities. | Production rollout should add metrics, separate task queues where load differs, and Worker Versioning before replay-sensitive Workflow changes. |
| Fixtures | The video uses fixed evidence and short generated documents. | The failure experiment is repeatable and independent of index health. It proves orchestration recovery, not live research freshness or model quality. |

These choices follow Temporal's guidance for
[deterministic Python Workflows](https://docs.temporal.io/develop/python/core-application#develop-workflow-definition),
[Activity idempotency](https://docs.temporal.io/activity-definition#idempotency),
[Activity Heartbeats](https://docs.temporal.io/encyclopedia/detecting-activity-failures#activity-heartbeat),
[Worker shutdown](https://docs.temporal.io/develop/python/workers#shutdown),
and
[Continue-As-New](https://docs.temporal.io/develop/python/continue-as-new).

## Testing and code quality

The package uses frozen typed dataclasses at the Workflow boundary and keeps
Workflow imports isolated from Activity dependencies. The checks cover:

- all ten episode definitions and their preserved prompt requirements;
- arbitrary one-episode or multi-episode selection through the same Workflow;
- stable pipeline identity;
- Activity stage transitions and artifact writes;
- source provenance and manifest contents;
- the eight-search live research plan, source deduplication, and embedded
  research-synthesis inputs;
- the complete live product inventory and document-length contracts;
- Workflow ordering, bounded fan-out, retries, partial failure, and series
  fan-in;
- the Worker-kill evidence contract;
- the video edit contract.

The current quality gates are:

```bash
uv run pytest
uv run ruff check src tests
uv run mypy src/durable_research
```

The suite enforces branch-aware coverage above 80 percent. Ruff and strict
MyPy both pass for the application modules.

## How I would teach the migration

I would start with the original output and dependency graph, then kill the
process at the exact external-call boundary that makes recovery ambiguous.
The code comparison follows the same episode from JavaScript promises to
Workflow-scheduled Activities. Temporal Web then supplies the evidence:
one Workflow Execution, two Heartbeat Timeouts, two Activity attempt-2 starts,
and a completed result.

The final discussion stays with the engineering decisions developers need to
make in their own systems: deterministic Workflow code, Activity
idempotency, artifact durability, timeout policy, History size, and deployment
versioning.
