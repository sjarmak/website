# Talk notes: Temporal brings a research pipeline back to life

Target: 11–13 minutes, followed by questions.

## Slide 1: The migration

I started with an existing Code Intelligence Digest pipeline that used SciX
for scholarly retrieval. I did not choose a toy order-processing example. This
program had already produced ten podcast episodes across two research series.

The test you will see is abrupt: I send `SIGKILL` to the Worker while two
research Activities are running. A replacement Worker finishes the same
Workflow Execution.

## Slide 2: The original product

The input contains two series and ten episode briefs. Each episode has a
title, focus, seed papers, and sometimes a frontier flag.

Each branch produces three documents in order: research, a technical deep
dive, and a podcast script. Two literature reviews wait for the episode work.
The original program also wrote ten new-bibcode files, so the complete product
graph contains 32 documents.

The important point is that the old code already had useful business logic.
The migration must preserve it.

## Slide 3: Before and after

The JavaScript version uses `pipeline()` to sequence the three stages and
`parallel()` for the two final reviews. That graph is sensible.

The Python replacement schedules the same stages as
`research_episode`, `write_deep_dive`, and `write_podcast_script` Activities.
The Workflow then fans completed episodes into `write_series_review`.

The full 124-line JavaScript file is included. Separate code readers show the
ten typed episode inputs and the preserved prompt contracts, so the comparison
does not hide the business rules behind ellipses.

## Slide 4: Failure before Temporal

The old client owned the active phase, the pipeline cursor, and every in-flight
promise. A process exit removed that state.

Files written before the exit survived, which created an ambiguous recovery
problem. An operator had to inspect the directory, infer the last complete
stage, and decide whether an external call was safe to repeat.

A direct Python rewrite with `asyncio.gather()` would have the same
process-level failure boundary.

## Slide 5: The determinism boundary

The Temporal Workflow owns episode order, bounded concurrency, completion
policy, series-review fan-in, and progress. These decisions replay from Event
History.

Temporal Activities own SciX and Code Intelligence Digest calls, the writer
process, clock reads, heartbeats, and artifact I/O. Those operations depend on
external state and may be retried.

The Temporal Service persists Event History and schedules tasks. Full evidence
and long documents stay in the artifact store, so Workflow payloads remain
compact.

## Slide 6: Recovery contracts

Temporal makes retry and timeout state durable. The application still chooses
the contract.

The sample uses three attempts with bounded exponential backoff,
stage-specific Start-to-Close Timeouts, and a 30-second Heartbeat Timeout for
long calls.

Live MCP responses use stable logical request IDs and a response journal.
That suppresses repeats once the response is stored. It cannot close the crash
window between provider success and journal persistence. The current searches
are read-only. Paid or mutating providers must enforce the same idempotency key.

The writer has the same at-least-once concern. Stable artifact paths prevent
duplicate files, while provider-side deduplication or a writer response journal
would prevent a repeated model charge.

## Slide 7: Recorded failure

Play the recording.

The two representative episode branches are already in
`research_episode`. The script verifies pending Activities and heartbeat data
before killing the exact Worker PID.

The replacement Worker polls the same task queue. After the Heartbeat
Timeouts, it receives attempt 2. The video then shows research, deep dives,
scripts, both series reviews, and the manifest completing.

The right-hand captions never cover the terminal or Temporal Web. The proof
frames pause long enough to read.

## Slide 8: Event History evidence

The terminal result contains the original Workflow ID and Run ID, both
completed episode keys, no failed episodes, and both review references.

Temporal Web shows the same input and output. In ascending Event History, both
`research_episode` Activities start on attempt 2 under the replacement Worker.

This demonstrates Workflow recovery rather than a new run started by a shell
script.

## Slide 9: Engineering review

The source uses frozen typed dataclasses at Workflow boundaries. Workflow
imports are isolated from I/O dependencies. The package passes 89 tests,
81.9 percent branch-aware coverage, Ruff, and strict MyPy.

For production I would add shared artifact storage, provider-enforced
idempotency for paid calls, Activity-specific retry policy, metrics, separate
task queues where capacity differs, and Worker Versioning.

Ten bounded episode branches fit in one execution. A larger or continuously
refreshed catalog would prompt a Child Workflow or Continue-As-New design.

## Slide 10: What changed

The existing code already provided ten episode briefs and prompts, the
research-to-deep-dive-to-script sequence, and two series literature reviews.

Adding Temporal provides durable Workflow progress, Activity retries after
failure, queryable state, and Event History.

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
self-hosted cluster provides that service-level durability; the local
development server in the demo is not a production topology.

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
Activity path remains in the source and uses the same Workflow contract.

### What changes require Workflow versioning?

Activity implementation changes can often ship without changing replay
decisions. Changes to Workflow control flow, Activity scheduling, or
deterministic branching need Worker Versioning and compatibility planning for
open executions.
