# Talk notes: Temporal brings a research pipeline back to life

Target: 11–13 minutes, followed by questions.

## Slide 1: Temporal assignment

I started with an existing Code Intelligence Digest pipeline that used SciX
for scholarly retrieval. The program had already produced ten podcast episodes
across two research series.

I will show the original pipeline, the Python implementation built with
Temporal Workflows and Activities, and a recovery test where I kill the Worker
while two research Activities are running.

## Slide 2: What I will show

The walkthrough has three parts.

First, I will establish the original product and failure boundary. Second, I
will show where the business sequence moved into a Temporal Workflow, where
external work moved into Activities, and how the Worker registers both. Third,
I will play the recorded Worker-kill test and inspect its Event History.

The README uses the same sequence so someone can revisit the migration without
the presentation.

## Slide 3: The original problem

The input contains two series and ten episode briefs. Each episode has a title,
focus, seed papers, and sometimes a frontier flag.

Each branch produces three documents in order: research, a technical deep
dive, and a podcast script. Two literature reviews wait for the episode work.
The original program also wrote ten new-bibcode files, so the complete product
graph contains 32 documents.

The Node process owned the active phase and in-flight promises. Files written
before an exit survived, but no durable cursor identified the last completed
stage. An operator had to inspect the directory and decide which calls were
safe to repeat.

A direct Python rewrite with `asyncio.gather()` would keep the same
process-level failure boundary.

## Slide 4: Before and after

The JavaScript source uses `pipeline()` to sequence research, deep-dive
writing, and script writing. It uses `parallel()` for the two final reviews.
That dependency graph is the business logic I needed to preserve.

The Python Workflow schedules the same stages as `research_episode`,
`write_deep_dive`, and `write_podcast_script` Activities. It then fans
completed episodes into `write_series_review`.

The slide shows excerpts for readability. The case study includes the complete
124-line JavaScript source, the ten typed episode inputs, the prompt contracts,
and every Python source file.

## Slide 5: Temporal Workflow

The Temporal Workflow owns episode order, bounded concurrency, completion
policy, series-review fan-in, and queryable progress.

The Workflow code only makes deterministic orchestration decisions. Network
calls, model calls, clock reads, environment access, and artifact I/O stay
outside it. Temporal records these decisions in Event History so a replacement
Worker can replay them.

The full run keeps ten bounded episode branches in one Workflow Execution. A
larger or continuously refreshed catalog could use Child Workflows or
Continue-As-New.

## Slide 6: Temporal Activities and Temporal Worker

The `research_episode` Activity chooses fixture or live evidence, calls SciX
and Code Intelligence Digest on the live path, emits heartbeats, and writes
evidence to artifact storage. The other Activities write deep dives, podcast
scripts, series reviews, and the final manifest.

The Worker connects to Temporal, polls the task queue, and registers the
Workflow plus all five Activities. Another Worker with the same registrations
can continue the execution after the first process disappears.

## Slide 7: Resilience and tradeoffs

The sample uses three Activity attempts with bounded exponential backoff,
stage-specific Start-to-Close Timeouts, and a 30-second Heartbeat Timeout for
long calls.

Live MCP responses use stable logical request IDs and a response journal. Once
a response is stored, a retry can reuse it. The remaining gap is a crash after
provider success and before journal persistence. The current searches are
read-only. Paid or mutating providers must enforce the same idempotency key.

Large research evidence and generated documents stay in artifact storage.
Event History carries compact inputs, statuses, hashes, and artifact paths.

## Slide 8: Recorded recovery

Play the recording.

Two representative episode branches are already running
`research_episode`. The recovery script verifies the pending Activities and
their heartbeat data before killing the Worker process.

A replacement Worker polls the same task queue. After the Heartbeat Timeouts,
it receives attempt 2. Research, deep dives, scripts, both series reviews, and
the manifest finish under the same Workflow Execution.

## Slide 9: Testability and proof

Temporal Web shows both `research_episode` Activities starting on attempt 2
under the replacement Worker. The result retains the original Workflow ID and
Run ID and contains both completed episode keys and both review references.

The source uses frozen typed dataclasses at Workflow boundaries and keeps I/O
dependencies out of Workflow imports. The package passes 89 tests, 81.9
percent branch-aware coverage, Ruff, and strict MyPy.

The short recording runs two representative episodes. A separate fixture run
executes all ten episodes through the same Workflow and Activity code.

## Slide 10: What changed

The existing code provided ten episode briefs and prompts, the
research-to-deep-dive-to-script sequence, and two series literature reviews.

Adding Temporal provides durable Workflow progress, Activity retries after
failure, queryable progress, and Event History.

## Likely questions

### Why make each writing stage a separate Activity?

Research, deep-dive writing, and script writing have different latency, cost,
and failure modes. Separate Activities let each stage retry without repeating
completed earlier work. They also make timeout and task-queue policy easier to
tune.

### Why use one Workflow instead of a Child Workflow per episode?

Ten short, bounded branches fit comfortably in one execution and make the
sample easier to inspect. Child Workflows become attractive when episodes need
independent lifecycle operations, separate retention, or a much larger
catalog.

### Does Temporal guarantee that an MCP or model call runs once?

No. Activities have at-least-once execution. The application needs
idempotency. This sample journals read-only MCP responses and uses stable
artifact paths. Paid or mutating providers still need a provider-enforced key
or a transactional boundary.

### What survives if the Temporal Service fails?

The recording tests Worker loss. Temporal Service durability depends on the
deployment and its persistence layer. Temporal Cloud or a production
self-hosted cluster provides that service-level durability. The local
development server in the demo is a development topology.

### Why are the documents outside Event History?

Research evidence and scripts are large. Event History should carry the
orchestration facts needed for replay. The manifest links those facts to
content hashes and artifact paths.

### How faithful is the rewrite?

The public package includes the full historical JavaScript, the two series,
all ten episode briefs, the original editorial requirements, five Temporal
Activities, and the original output filenames. The short video runs two
representative episodes; the full fixture run executes all ten.

### Why use fixtures in the recording?

The recording tests durability. Fixed evidence isolates that test from
workstation index health, provider latency, and model variability. The live
Activity path uses the same Workflow contract.

### What changes require Workflow versioning?

Activity implementation changes can often ship without changing replay
decisions. Changes to Workflow control flow, Activity scheduling, or
deterministic branching need Worker Versioning and compatibility planning for
open executions.
