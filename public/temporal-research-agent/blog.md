# We rewrote our literature-review agent as a Temporal Workflow

Our original literature-review pipeline worked. It coordinated ten episode
research branches, asked Claude to use SciX for scholarly retrieval, wrote
deep dives and podcast scripts, and fanned those results into two final
reviews.

It also trusted one client process to stay alive.

That trade was reasonable for an internal research run. It became the reason
to choose this project for a Temporal rewrite. Research pipelines have a
useful mix of expensive calls, parallel work, partial results, large
artifacts, and long gaps between “the side effect happened” and “the
orchestrator knows it happened.”

We kept an exact excerpt of the
[original JavaScript workflow](before/phaseE_workflow.excerpt.js) and rebuilt
its research shape with the Temporal Python SDK.

## The prior workflow was real

The source workflow predates this demo. It produced literature reviews on
multi-agent orchestration and code retrieval. A related SciX run expanded a
93-paper seed into roughly 130 papers across parallel research waves.

The original orchestration was concise:

```javascript
await pipeline(
  EPS,
  (episode) => agent(/* research */),
  (research, episode) => agent(/* deep dive */),
  (deepDive, episode) => agent(/* script */),
)

await parallel(/* two literature reviews */)
```

That code says what should happen. Recovery depends on what the process had
already written when it stopped. A crash after retrieval can repeat the
retrieval. A crash after a file write can leave the client unsure whether to
write again. A failed branch can strand useful results from the other
branches.

The rewrite gives those states names and records the transitions.

## Two evidence lanes make the example useful

The research Activity queries SciX and the Code Intelligence Digest.

SciX supplies the scholarly lane: papers, bibcodes, prior systems, evaluation
methods, and citation context. The digest supplies the field-evidence lane:
engineering articles, releases, community discussion, and the problems
practitioners report while a topic is moving.

The distinction matters for a topic such as durable agent execution. A paper
can tell us how agent failures are classified. A recent engineering post can
show which retry or checkpoint pattern teams are implementing. The report
can compare the two without pretending they carry the same evidentiary
weight.

Each source records its lane, stable ID, title, locator, retrieval time,
content hash, and artifact path. The full MCP response stays outside Temporal
history.

## The Workflow holds decisions

The
[`LiteratureReviewWorkflow`](src/durable_research/workflow.py) owns the
dependency graph:

1. Split four research angles into bounded batches.
2. Run each batch concurrently.
3. Collect typed failures instead of discarding the successful branches.
4. Require three completed angles.
5. Schedule final report assembly.

It also exposes a query with the current phase and completed, running, and
failed counts.

The Workflow contains no MCP client, filesystem call, wall-clock read, or
model invocation. Temporal reconstructs Workflow state by replaying Event
History, so the code must make the same decisions from the same recorded
events. The [Temporal Workflow guide](https://docs.temporal.io/workflows)
lists network calls, database queries, LLM invocations, and file I/O as work
for Activities.

## Activities hold the uncertain work

The rewrite has four Activity types:

- `research_angle` calls the two MCP servers or reads offline fixtures, then
  writes the returned evidence.
- `verify_evidence` reopens each artifact and checks its SHA-256 against the
  source reference.
- `synthesize_section` reads verified evidence and writes one cited section.
  A production model call belongs at this boundary.
- `finalize_review` joins the completed sections and writes the report and
  provenance manifest.

Temporal permits nondeterministic Activity code and recommends idempotent
implementations. Its [Activity guide](https://docs.temporal.io/activities)
also makes the retry boundary explicit: a failed attempt starts again from
its initial state unless the Activity uses heartbeat details as a checkpoint.

Our retrieval Activity emits heartbeats during the slow demo path. It has a
start-to-close timeout, a heartbeat timeout, and an exponential retry policy.
Section synthesis and finalization have separate timeouts and attempts. A
search outage does not rerun successful section writes from another branch.

## We killed the Worker

The live rehearsal uses fixed fixture evidence so the failure on screen comes
from the system we are demonstrating. The script starts two slow retrieval
Activities, waits until Temporal shows both heartbeats, and sends `SIGKILL` to
the exact Worker PID shown in the server.

At that moment the client remains blocked on the original Workflow run.
Temporal reports two pending Activities, both tied to the dead Worker.

The script starts a replacement Worker. Once the heartbeat timeout expires,
Temporal dispatches new attempts. The Workflow continues through evidence
verification, section synthesis, and finalization. All four sections appear
in the report.

The verified rehearsal completed under one Workflow ID and run ID while Event
History recorded both Worker identities. We also ran an injected Activity
failure that succeeded on attempt two and three consecutive clean runs. The
commands and identifiers are in [`verification.md`](verification.md).

The [recorded demo](demo/out/temporal-literature-review-demo.mp4) follows that
same run from the terminal into Temporal Web. The browser segment shows the
completed Workflow, Activity attempts, and Event History. It is evidence from
the recorded run, not a separate staged example.

The recording preserves evidence from a workstation-only demo harness. Live
mode depends on our local SciX and Code Intelligence Digest repositories,
indexes, and services. Readers can inspect the before and after source, Event
History, report, manifest, and recording. Reproducing the live MCP run
requires the same local infrastructure.

## Event History indexes the run

A literature review can retrieve hundreds of abstracts and full-text
sections. Returning those bodies from every Activity would make Workflow
history a second document store.

This implementation writes raw evidence under a content-addressed path and
returns a compact `SourceRef`. The reference has enough data to inspect and
verify the source without carrying its body through every Workflow replay.

The test suite checks the boundary directly. One Workflow test writes a
20 KB sentinel document, fetches Event History, decodes its payloads, and
asserts that the path is present while the sentinel body is absent.

The final manifest connects the report section to every source reference and
artifact hash. History explains how the run progressed; the artifact store
holds what the run found.

## External calls retain an at-least-once edge

An Activity can call an LLM successfully and lose its Worker before the
completion event reaches Temporal. The next attempt can call the LLM again.
That is the at-least-once edge of the design.

The sample now gives every logical external call a stable request ID. Before
calling an MCP server, the Activity checks a durable response journal. After
a successful response is journaled, retries reuse it, and the request ID
travels with the source provenance. The same contract can forward that ID to
a provider as an idempotency key.

The current SciX and Digest tools are read-only and do not accept such a key.
A Worker death after the server responds but before the journal write can
still repeat the lookup. That is harmless to correctness here, although it
repeats computation. A paid model call or external mutation needs a provider
that honors the key, or an equivalent transactional deduplication boundary,
to close the final gap.

File operations are replay-safe too. Evidence paths include a content hash.
Stable report and manifest paths accept identical content and raise a
conflict if a retry produces different content.

This boundary belongs in the demo: durable orchestration does not imply
exactly-once external effects.

## The Workflow became a reusable agent skill

We also packaged the client as `run-durable-research`, a skill available to
any agent on our workstation. Starting research returns a Workflow ID and Run
ID, then the caller can exit. A later agent process can query progress, wait,
or retrieve the cited report and provenance manifest using those identifiers.

The skill stays thin. The Workflow owns the durable branch graph and progress.
The Temporal Service persists its Event History and schedules execution.
Activities perform SciX, Digest, artifact I/O, and any future model call. The
verified recovery run survived the starting caller's exit, a persisted local
Temporal Service restart, and a Worker replacement before a fresh process
retrieved the result.

## What changed

The Python version replaces implicit progress and process-local scheduling
with replayable orchestration, named Activity boundaries, bounded concurrency,
retry policy, partial-result rules, content-addressed evidence, a provenance
manifest, and a queryable progress snapshot.

The workstation-only fixture mode runs the same Workflow and Activities
without an LLM key. Live mode starts our local SciX and Digest stdio MCP
servers from the retrieval Activity. That split keeps the recorded failure
test dependable while leaving the integration path real.

The most useful next addition is an LLM-backed `synthesize_section` Activity
with a provider-enforced idempotency key and a structured claim-to-source
result. The durable graph, request journal, retry boundary, evidence store,
agent skill, and failure demo are already in place.
