# Splitting the Temporal submission into two artifacts

Working plan responding to reviewer feedback received 2026-08-01. The review
verdict was a strong yes on depth. The single structural concern was packaging:
the reviewer had to learn Beads, Gas Town, Gas City, NDI, Mayor, formulas,
sessions, generations, and the pre-existing repair model before reaching the
Temporal boundary.

The fix is two artifacts with different jobs, not one artifact made shorter.

## The two artifacts

| | Deep article | Companion talk |
|---|---|---|
| Job | The engineering record. Why this boundary, what broke, what the evidence is. | Get one person to the Temporal boundary in 10 to 15 minutes. |
| Audience | A reader who wants to build something similar, or check whether the evidence holds up. | A reviewer or conference audience with no Gas City context. |
| Assumes | Nothing, but is willing to teach vocabulary as it goes. | Nothing, and never teaches Gas City vocabulary at all. |
| Gas City history | Full narrative. Beads, Gas Town, NDI, why NDI is right for the work and wrong for the promises. | 30 to 60 seconds, and only as "I run a system that hands work to coding agents." |
| Canary evidence | Every canary, including the failed one and the store-identity mismatch. | One failed canary, one line. The worker-kill demo carries the evidence weight. |
| Code | Annotated before and after, versioned, linked. | Two screens maximum: the Workflow signature and the Activity claim. |
| Status precision | Full matrix of reviewed / canaried / continuous / shadow. | Two sentences, stated once, not repeated. |
| Where it lives | `website-temporal-research`, published as a real post. | `temporal_devrel/presentation/temporalize-agent-orchestration`. |

The talk is not a summary of the article. It is a different argument built from
the same evidence. The article argues "here is a defensible boundary and here is
what it cost." The talk argues "here is one failure, and here is the smallest
thing that fixes it."

## Talk opening, verbatim

The reviewer wrote the opening for us. Use it close to as written:

> An agent is editing code. Its coordinator crashes before recording the
> handoff. The task record survives. The procedure does not. Temporal makes that
> procedure durable without making the agent deterministic.

Nothing before this. No Beads, no Gas Town, no Cabo dinner. The dinner story is
good and it belongs in the article, where a reader has chosen to spend twenty
minutes.

## Talk run of show, 13 minutes

| Time | Beat | What is on screen |
|---:|---|---|
| 0:00 | The four-line failure above. | One diagram: agent running, coordinator gone, receipt missing. |
| 0:45 | What I operate, compressed. | One line: coding agents pick up tracked work and produce branches. |
| 1:15 | Three questions a restart cannot answer. | Did a claim already start an agent? Does this result belong to the current generation? Has this outcome been acknowledged? |
| 2:15 | The boundary sentence. | Put the unpredictable agent inside an Activity. Put the promises around it in a Workflow. |
| 3:00 | Three owners. | Work facts / durable procedure / nondeterministic effects. |
| 4:00 | The unit I converted, declared. | Before: one controller tick. After: one Workflow plus one Activity. |
| 5:00 | Why a retry is not safe by default. | Start-or-attach, claim token, generation fence. |
| 6:30 | Worker-kill demo. | Live or recorded. This is the centre of the talk. |
| 9:30 | What the fence rejected. | The stale completion that failed closed. |
| 10:15 | What Temporal did not fix. | Durable wrongness: the store-identity mismatch, retried faithfully every 15 minutes. |
| 11:15 | When not to reach for this. | The 44-second cron job. |
| 12:00 | The reusable pattern, minus our hardening. | Four lines that transfer. Everything else is ours. |
| 12:45 | Close on reproduction. | One command, local dev server, no production credentials. |

For a 10-minute slot, cut the three questions to one and shorten the demo to the
kill and the reattach.

## Reviewer feedback, item by item

### 1. Smaller front door

Handled by the split above. The article keeps its current opening; the talk
never mentions Gas Town.

One change to the article as well: the piece currently spends its first six
sections on history before the Temporal boundary appears. Add a short standfirst
under the title stating the boundary in three sentences, so a reader who stops
after the first screen still leaves with the thesis. That is an addition, not a
restructure.

### 2. Declare the canonical unit

**Declared: work-item-to-agent orchestration.**

- **Before:** `CityRuntime.beadReconcileTick` in `cmd/gc/city_runtime.go`, plus
  the session recovery and close path in `cmd/gc/session_beads.go`, at public
  revision `b78058917bc65846db89e1c3b25dc17269822483`. One controller tick
  loaded snapshots, released orphaned assignments, reconciled sessions,
  dispatched notifications, and ran a wake-up backstop. Recovery was a separate
  scan inferring what a dead session had been doing.
- **After:** `BeadOrchestrationWorkflow` owns the procedure;
  `ExecuteBeadActivity` owns the fenced claim, start-or-attach, heartbeat, and
  generation-fenced completion. Two task queues:
  `gascity-bead-orchestration` and `gascity-agent-work`.

Why this and not OutcomeReady: the before code is exact, versioned, public, and
maps one to one onto the after code. OutcomeReady has no single predecessor
function. Its "before" was mail plus attention plus hope, which is an absence
rather than a code sample, and an absence is a weaker demonstration of a
transformation.

The status split then has to be stated in the same breath, every time, on the
same slide:

> The unit I converted is proved by a bounded canary and runs in shadow. The
> part running continuously in production is result delivery and
> acknowledgement, which is a second application of the same boundary.

Saying those two sentences together is what removes the diffuseness the reviewer
found. Saying either one alone is what created it.

### 3. Make the test story visible

The tests exist and they are strong. They are simply not presented. Current
state in `services/temporal-maintenance`: 45 `*_test.go` files across the
service, 18 of them in `internal/temporalbeads`, run with one command.

```bash
cd services/temporal-maintenance && make test    # go test -race ./...
```

Add a section to the article, and one backup slide to the talk, mapping the
reviewer's expected coverage to the tests that already exist:

| Expected | Test |
|---|---|
| Workflow unit tests | `workflow_test.go`, 12 cases including duplicate ready delivery, malformed events, event-limit rejection, seal enforcement |
| Activity tests | `activity_test.go`, 13 cases including claim, heartbeat, stale-generation rejection, artifact bounding |
| Duplicate-signal | `TestWorkflowDuplicateReadyDeliverySchedulesOneActivity`, `TestCoordinatorOutcomeWorkflowDeduplicatesReadySignal` |
| Stale-ack | `TestCoordinatorOutcomeActivityFailsClosedAtAcknowledgementBoundary`, `TestActivityCancellationReachesAttachedSessionAndStaleCompletionFails` |
| Cancellation | `TestWorkflowCancellationDoesNotHangWhileActivityStops`, `TestActivityCancellationBeforeFirstCheckpointUsesResolvedSession` |
| Continue-As-New | `TestCoordinatorOutcomeWorkflowContinuesAsNewWithStateAndCounters`, `TestCoordinatorOutcomeWorkflowDoesNotLoseAcknowledgementAtHistoryBoundary` |
| Replay from captured histories | `TestReplayPersistedWorkflowHistory`, `TestReplayRejectsPlantedNondeterministicWorkflow` |
| Scripted Worker-kill | `TestActivityWorkerCrashResumesFromHeartbeatWithoutSecondSession` (crash after the agent is running) and `TestActivityCancellationBeforeFirstCheckpointUsesResolvedSession` (crash before any heartbeat lands), both in `activity_test.go`. Not `restart_test.go`, which holds only `TestWaitBoundary_StateDurable` and `TestWorkflowID_Stable`. |

The gap the reviewer is actually pointing at is not coverage. It is that the
worker-kill test is asserted in Go and never shown running. The talk must show
the kill, not describe it. That is a demo deliverable, not a test deliverable.

### 4. Quantitative effectiveness evidence

This is the largest genuine gap and the clearest tie to the role. We have made
failures inspectable without measuring the improvement. Proposed measurement
plan, with data sources, in the order they can be built:

| Metric | Source | Available today? |
|---|---|---|
| Duplicate agent-session rate | Count sessions bound per (work ID, generation) in the canonical store | Yes, computable from Beads history |
| Stranded-claim rate | Claims with no terminal receipt and no live session, per 1000 claims | Yes, the orphan sweep already finds these |
| Unacknowledged completed outcomes | `silent_outcomes` from the all-store watchdog scan | Yes, already emitted, currently 0 |
| Recovery time after Worker termination | Event History: Activity failure to next attempt start | Yes, from Temporal directly |
| Human interventions per completed work item | Coordinator dispositions per outcome | Partly, needs a disposition counter |
| Completion rate under injected failure | The failure matrix, run as a scored suite rather than pass/fail | Needs harness work |
| Time from verified outcome to exact acknowledgement | `DeliveredAt` to `AcknowledgedAt` on the outcome record | Yes, both timestamps exist |
| Added infrastructure and latency cost | Worker RSS, history size per episode, delivery latency delta | Needs collection |

The comparison that matters is the pre-Temporal reconciler over the same window.
Four of these are computable retroactively from Beads history, which means a
real before-and-after is possible rather than a forward-looking promise. Start
there. The twenty-hour handoff orphan described in the visual brief is the anchor
data point: it is a measured stranded-claim duration under the old path.

### 5. Separate the pattern from our hardening

The reviewer is right that the article currently makes Temporal look like it
requires an outbox, a watchdog, generation fences, claim tokens, and a second
work store. Add an explicit two-column split, and put it in both artifacts.

**Fundamental pattern, transfers to anyone:**

- A Workflow owns durable procedure.
- An Activity owns nondeterministic work.
- Stable identity makes a retry attach to the same logical operation.
- External effects remain the application's responsibility.

**Our hardening, specific to running coding agents against a shared work store:**

- Beads generations and claim tokens.
- Agent-session attachment and start-or-attach resolution.
- Formula root and step relationships.
- Exact coordinator acknowledgement.
- The independent all-store watchdog.

The honest framing: someone orchestrating a short idempotent job needs the four
lines. We needed the second list because our Activity spawns a process that
edits a git worktree for an hour and may outlive the Worker that started it.
That is a property of the workload, not a tax Temporal charges.

## Sequencing

1. Q&A draft for the follow-up conversation (`temporal-reviewer-qa.md`, done).
2. Deck, 14 slides on the 13-beat run of show (done).
3. Worker-kill demo (done, run, and recorded). `demo/run.sh` passes both arms
   with exit 0; a full passing run is recorded at
   `demo/recording/worker-kill.cast`, 41.7 seconds, real `kill -9`, nothing
   staged. The evidence bundle under `demo/out/run-artifacts` includes the
   dev-server database, so the Event History can be walked in the Web UI rather
   than described. Runs passed against `65c2edd` and `2b5df98` hours apart; the
   service checkout is a live worktree that moves, and each run records the
   revision it built against.
4. Article: standfirst, canonical-unit declaration, test section, pattern split
   (done, pending the voice pass on `article-prose-for-voice-pass.md`).
5. Measurement: the four retroactively computable metrics, as a real
   before-and-after (spec and scripts done, the comparison itself not run).

What is left is rendering the cast to video for the deck (needs `agg`, which is
not installed and is fetched from GitHub releases, so it is a deliberate step),
embedding it on the article page, and the voice pass. The critical-path risk
that item 3 represented is retired: the invariant is recorded, and demonstrable
again on demand.

One constraint carried forward from running it: arm 1 cannot be shown alone.
Its retry resumes from a checkpoint and never re-resolves, so it stays green
against a resolver deliberately broken to mint a duplicate session. Only arm 2
demonstrates duplicate-launch prevention. This is written into the demo README,
the on-screen `verify.py` report, and the presenter notes.
