# Draft answers to the reviewer's questions

Prepared 2026-08-01 for Stephanie's reference. Not a public artifact.

Each answer carries a grounding tag:

- **[verified]** checked against source or evidence records while drafting this.
- **[position]** a defensible design answer, not yet proved by a test or canary.
- **[gap]** the honest answer is that this is not covered yet. Say so plainly;
  the reviewer rated evidentiary precision as a strength, and a clean "not yet"
  costs less than a soft claim that unravels under a follow-up.

Sources used: `services/temporal-maintenance` and the reviewed worktree
`gas-city-worktrees/temporal-beads-orchestration`, `docs/Temporal/README.md`,
`docs/Temporal/Temporal_GasCity_Integration_Context.md`.

---

## Technical design

### 1. What exact unit did you Temporalize? Why that boundary rather than converting an entire formula into a Workflow?

**[verified]**

The unit is one eligible ready execution episode: a single work item becoming
ready, being claimed, executing through one agent session, and producing one
generation-fenced terminal receipt.

Before, that unit was `CityRuntime.beadReconcileTick` in `cmd/gc/city_runtime.go`
plus the session recovery and close path in `cmd/gc/session_beads.go`, at public
revision `b7805891`. One tick loaded snapshots, released orphaned assignments,
reconciled sessions, dispatched notifications, and ran a wake-up backstop. No
single component owned the sequence, so recovery meant a later scan inferring
what a dead session had been doing.

After, `BeadOrchestrationWorkflow` owns the procedure and `ExecuteBeadActivity`
owns the fenced claim, start-or-attach, heartbeat, and completion.

Not the whole formula, for two reasons. First, a formula is a compiled
dependency graph that Gas City's controller already owns, and putting it in
Temporal would make Temporal a second task database. That is the failure the
integration is specifically designed to avoid: Beads has to stay independently
inspectable and repairable when Temporal is down. Second, formula steps have
independent lifecycles. A step can complete and yield a valid result while its
source root stays open or blocked, so binding them into one Workflow lifetime
would force a false coupling.

The rule I used: start a Workflow for an execution episode, not for a stored
record.

### 2. Show the Worker-kill scenario live. Which process dies, what continues, what appears in Event History, and how do you prove no second agent began editing the worktree?

**[verified] for the assertion, [gap] for "live"**

What dies: the Worker process polling `gascity-agent-work`. Not the agent. The
agent is a separate process the Activity started through the trusted adapter,
and it keeps running with its worktree open.

What continues: three things, and the demo should show all three as rows.
Temporal Event History persists, so the procedure is recoverable. The Beads
claim and generation persist, so the fence still decides who may write. The
agent session persists, because nothing in the kill touches it.

What appears in Event History: `ActivityTaskStarted` for the original attempt,
then no completion, then a heartbeat-timeout failure, then
`ActivityTaskScheduled` for attempt two under the same Activity ID. The Activity
ID is derived from formula root, step, and generation, so it is stable across
attempts and legible in Temporal Web.

How I prove no second agent started: three independent checks.

1. The session identity recorded on the claim does not change between attempt
   one and attempt two. Asserted in
   `TestActivityWorkerRejectsTerminalSessionIdentityChange`.
2. Exactly one session is bound for the (work ID, generation) pair in the
   canonical store.
3. One terminal receipt is written, and a completion presenting a stale claim
   token fails closed. Asserted in
   `TestActivityCancellationReachesAttachedSessionAndStaleCompletionFails`.

The important caveat, and I would volunteer it: the heartbeat is not what
prevents the second launch. A Worker can die before the first heartbeat lands.
The resolver has to find the existing session by stable identity independently of
any heartbeat, which is what
`TestActivityCancellationBeforeFirstCheckpointUsesResolvedSession` and
`TestActivityWorkerCrashResumesFromHeartbeatWithoutSecondSession` cover
separately. The heartbeat is how a retry resumes progress, not how it avoids a
competitor.

This now runs, and you can be shown it rather than told about it. `demo/run.sh`
starts a local Temporal dev server, runs the reviewed `WorkerSet` with no
Workflow or Activity of its own, and kills the Worker with a real `kill -9` at
two points. Observed on the run of 2026-08-01, both arms green, exit 0:

- Same Activity identity across both attempts,
  `formula/demo-root/edit-file.author/g1`, with `final attempt = 2`, so Temporal
  demonstrably retried.
- Arm 1, killed mid-work: `resolver calls = 1`, and the orphaned agent kept
  writing after its Worker died, 37 entries after the kill, 36 of them after its
  stdout pipe broke. That is the reason the boundary is shaped this way.
- Arm 2, killed before any checkpoint: `resolver calls = 2, session creations =
  1`. This is the decisive one. It is the only arm where the retry has to ask
  the resolver again, and the resolver returned the existing session.
- Both arms: one session, one receipt, and a completion presenting the stale
  claim token rejected with `stale bead generation or claim token`.

Volunteer the arm 1 limitation before it is found: arm 1 cannot detect a broken
resolver, because its retry resumes from the checkpoint and never re-resolves.
Sabotaging the resolver to mint a fresh session on every call leaves arm 1 fully
green. Only arm 2 catches it. The claim is earned by both arms, not either.

A full passing run is recorded at `demo/recording/worker-kill.cast`, 41.7
seconds. If they ask to see it in the conversation, play it; if they ask you to
run it, run it. Both work.

The limits to state without being asked: the store is a file-backed adapter
rather than Dolt, the agent is a fixture process rather than a coding agent, and
this is one host. All three are in the demo README. What the run does prove is
the boundary, on real Temporal, with a real signal.

### 3. What failure domain does start-or-attach actually cover? Can a retry on another host locate the original agent session, or does recovery require host or Task Queue affinity?

**[verified] for the proved domain, [gap] for cross-host**

Proved domain: Worker process loss on the same host. That is what the canary and
the failure-matrix tests exercise.

Not proved: host loss. The deployment is single node today. The agent executor
resolves sessions by shelling out to a local executable
(`exec.CommandContext` in `command_agent_executor.go`), so whether a retry on a
second host can find the original session depends entirely on whether that
adapter reaches the shared control plane rather than local process state. By
design it resolves through canonical identity, so it should be
host-independent. I have not run it on a second host, so I would not claim it.

There is no deliberate Task Queue affinity. `gascity-agent-work` is a normal
shared queue. The affinity that exists today is incidental: one host runs the
worker.

I would say plainly that losing the whole host is outside what this integration
survives, and that fixing it is a deployment change plus a cross-host attach
test, not a Workflow change.

### 4. Why Signal-With-Start rather than Update-With-Start? Would synchronous Workflow-side validation simplify the outbox acknowledgement contract?

**[position]**

Signal-With-Start was chosen because the producer of a ready event is a bridge
draining a transactional outbox, and that bridge does not need a synchronous
answer. It needs a delivery that is safe to repeat. Signal-With-Start under a
stable Workflow ID gives that in one operation, and the Workflow deduplicates by
event ID.

The reviewer's point is a good one and I would concede most of it.
Update-With-Start would let the Workflow validate the event synchronously and
return acceptance, which would let the bridge acknowledge the outbox on a real
acceptance rather than on a delivery that Temporal merely received. That
collapses the crash window between "Temporal accepted the event" and "the outbox
was acknowledged" from a redelivery window into an acceptance window.

Two reasons it is not there yet. Validation currently happens Workflow-side
anyway and rejects malformed or out-of-seal events, so the acceptance signal
exists but is not returned to the caller. And the redelivery path is already
safe, so the change buys cleanliness rather than correctness. That makes it a
good candidate for the next revision, not a defect in this one.

What I would not claim: that Signal-With-Start was the better choice on the
merits. It was the choice that matched an at-least-once outbox drain, and
Update-With-Start would probably be the better fit for a validating contract.

### 5. Where are the remaining dual-write gaps between Beads and Temporal? Which transitions are transactional, which depend on reconciliation, and what is the maximum undetected gap?

**[verified]**

Two lanes, and the article already states this distinction.

Transactional: when Temporal closes the work itself, the canonical close and the
`OutcomeReady` outbox record are one Beads transaction. No gap.

Reconciled: for the completion paths Temporal does not own yet, which is most of
them while agent mutation is in shadow, a reconciler notices the terminal state
afterward and writes the record then. That is a genuine dual-write boundary.

The remaining windows, named:

1. Ready transition written, bridge dies before Signal-With-Start. Covered by
   level-triggered redelivery from the outbox.
2. Temporal accepts the event, bridge dies before acknowledging the outbox.
   Covered by redelivery plus event-ID deduplication. This is the window
   Update-With-Start would shrink.
3. Terminal state reached on a non-Temporal path, reconciler has not run yet.
   This is the largest window and it is bounded by the reconciler interval.

Maximum undetected gap: I would not give a number without measuring it. What I
can say is that it is bounded by the reconciler interval rather than unbounded,
and that the independent all-store watchdog is the thing that detects a
reconciler which has stopped running at all. The watchdog sits outside Temporal
deliberately, because a monitor that shares the failure domain of the thing it
monitors goes silent at exactly the wrong time.

Getting the real number is on the measurement plan.

### 6. What happens after the agent Activity exhausts its five attempts? Who owns recovery, how is the work represented, and how does an operator safely retry?

**[verified] for behaviour, [gap] for the operator path**

The retry policy is five maximum attempts with one-second initial interval,
coefficient 2, one-minute cap, on a 24-hour start-to-close timeout with
`WaitForCancellation: true`.

On exhaustion, the Workflow does not hang and does not silently drop the event.
It appends the event to `FailedEventIDs`, sets `LastErrorCode` to
`activity-failed`, and signals the terminal result to the maintenance parent as
`ChildWorkflowFailed`.

What that leaves behind is the important part: because the claim is
generation-fenced, a failed episode leaves no partial canonical write. The work
item is still claimed at that generation, with no terminal receipt.

Who owns recovery: Beads does, not Temporal. An operator or a reaper advances
the generation, which invalidates the old claim token and makes any late
completion from the failed attempt fail closed. A new ready transition then
starts a fresh episode under a new generation.

The gap: the structured operator surface for that (`temporal-ops`) passed
independent review with zero findings and is not installed. Today the safe retry
is the existing Beads-side generation advance, which works but is a manual
sequence rather than a typed command. I would state that rather than describe the
reviewed CLI as available.

### 7. Why are formula relationships links and signals rather than Child Workflows? Is lifecycle independence the reason, or are there scaling and ownership concerns?

**[verified] for the fact, [position] for the reasoning**

Confirmed: there is no `ExecuteChildWorkflow` in the integration at all. Formula
topology is carried as typed identity in Workflow input, Memo, and eight
registered Search Attributes (`GasCityFormulaName`, `FormulaHash`,
`FormulaVersion`, `FormulaRoot`, `FormulaStep`, `Rig`, `Bead`, `Generation`), and
terminal results are signalled to a maintenance parent.

Lifecycle independence is the primary reason. A formula step can produce a valid,
acknowledged result while its source root stays open or blocked. That is not an
edge case, it is the normal shape of review-gated work. A parent-child
relationship would force the child's completion to mean something about the
parent, and it does not.

The second reason is ownership. Gas City's controller compiles formulas and owns
control kinds such as retry, check, fanout, and workflow-finalize. If Temporal
started expressing formula structure as Child Workflows, there would be two
systems with an opinion about the graph, and they would drift.

The cost I would acknowledge: I gave up the automatic parent-child topology that
Temporal Web renders for free, and had to reconstruct that view from Search
Attributes. That is a real ergonomic loss and it is why the formula observability
code exists at all.

The place where a Child Workflow is genuinely wrong, and I would say this
explicitly: result delivery. `CoordinatorOutcomeWorkflow` must outlive its
producer, because the producer finishes and the result stays owed. That is a
stable top-level Signal-With-Start Workflow, not a child, and no
`ParentClosePolicy` produces the behaviour we need there.

### 8. What is your Workflow deployment and compatibility strategy?

**[verified]**

Layered, and `GetVersion` is the smallest layer.

1. Captured-history replay is the deployment gate. Every Workflow definition
   change replays against captured histories before it ships.
   `TestReplayPersistedWorkflowHistory` runs it, and
   `TestReplayRejectsPlantedNondeterministicWorkflow` proves the gate actually
   fails when it should, which matters more than the passing test.
2. `GetVersion` for in-history patches, where one definition must carry old and
   new command sequences while histories are open. Currently used once, for a
   formula-version change in `workflow.go`.
3. Worker Deployments for rollout and routing. At the pinned SDK `v1.46.0`,
   workers register `DeploymentOptions` / `WorkerDeploymentVersion` and
   Workflows choose pinned or auto-upgrade behaviour. We do not reconstruct the
   retired Build-ID compatibility sets.
4. Drain deploy only when no open history can reach the changed definition.

One local policy worth mentioning because it is the rule people break: a replay
fixture is never deleted or regenerated to make a breaking change pass. If the
fixture fails, the change is breaking.

One pin detail: upstream `GetVersion` docs reference
`worker.Options.PreferredVersionProvider`, which the pinned `v1.46.0` module does
not expose. We treat that as upgrade guidance rather than code, and re-run replay
on any SDK bump.

### 9. How do signals interact with Continue-As-New? How are buffered signals, duplicate event IDs, and stale acknowledgements preserved across run boundaries?

**[verified]**

`CoordinatorOutcomeWorkflow` continues as new after 100 delivery attempts in a
run, which matters because a result can stay pending across a long human
acknowledgement window.

Carried across the boundary in `ResumeState`: the cloned envelope, phase,
delivery attempts, delivery reference, coordinator fence, delivered and
acknowledged timestamps, and the Continue-As-New count. The dedup identity is the
outcome ID, which is stable across runs, so a duplicate ready signal arriving in
run two is still recognised as a duplicate.

The invariant that needed an explicit test is the acknowledgement landing exactly
at the boundary.
`TestCoordinatorOutcomeWorkflowDoesNotLoseAcknowledgementAtHistoryBoundary`
covers it, and
`TestCoordinatorOutcomeGenerationsCompleteAsDistinctWorkflowHistories` covers the
related case where a new generation must not reuse a closed run's history.

House rule the integration follows: drain signals and wait for
`workflow.AllHandlersFinished` before returning or continuing as new.
`HandlerUnfinishedPolicyAbandon` is only for a deliberate, documented terminal
policy.

Related failure worth mentioning unprompted, because it is a good bug: an earlier
inspector review found recovery signals that could be stranded during
Continue-As-New. It was found by review, not by a test, which is an argument for
the review gate rather than against it.

### 10. Which guarantees are Temporal's and which are your application fences? Draw the boundary without referring to code.

**[verified]**

Three tiers, and the middle one is the interesting one.

**Temporal owns:** Event History, deterministic ordering, durable waits and
timers, retry scheduling, cancellation delivery, and acknowledgement state.

**The boundary owns:** Activities, stable identity, idempotency keys, generation
fences, and typed receipts. This is where at-least-once execution is turned into
a safe operation. None of these are Temporal guarantees, and all of them are
required for Temporal's guarantees to be useful.

**The application owns:** whether the agent's work is correct, GitHub and mail
and filesystem behaviour, acceptance tests and review, Beads integrity, human
authorization, and the independent watchdog.

The one-sentence version: Temporal will faithfully retry whatever I told it to
do, so everything about making that retry safe is mine.

The sharpest illustration is the most recent canary. Two steps executed exactly
once, in order, survived a deliberate mid-episode Worker interruption, resumed on
replay, and wrote two generation-fenced completions. Then the outcome adapter
derived a store reference of `city:gas-city` from the runtime city identity while
the canonical store was `city:ds-research`, and every delivery attempt failed
with the same mismatch, durably, every fifteen minutes. Temporal preserved and
retried the wrong envelope perfectly. It had no way to infer the intended
identity. The failure marker belongs on my adapter, not on the server.

I would use that story to answer this question rather than a diagram.

---

## Evidence and product effectiveness

### 11. What baseline would you use to show this integration is better than the original reconciler?

**[position]**

The pre-Temporal reconciler over the same work population, measured
retroactively. Four metrics are computable from Beads history without new
instrumentation, which makes a real before-and-after possible rather than a
forward-looking promise:

- duplicate agent sessions per (work ID, generation);
- stranded claims per thousand claims, and their duration;
- completed work with no delivered result;
- time from terminal transition to acknowledged receipt.

The anchor data point on the old side is already recorded: two completed and
pushed work items stranded for roughly twenty hours, because the branch existed
on origin, the item was not marked done, its route was empty, and both the demand
probe and the orphan sweep keyed on that same empty route field. That is a
measured failure with a duration attached, and it is the right thing to put a
number against.

What I would not do is claim an improvement percentage before running it.

### 12. What failure-injection matrix did you run?

**[verified]**

Present and running in `failure_matrix_test.go` and the surrounding suites:

- duplicate delivery and worker execution across separate task queues;
- Workflow waiting for agent cancellation;
- worker set cannot restart after stop;
- replay of persisted history, and rejection of a planted nondeterministic
  Workflow;
- Temporal unavailable, with inspection and recovery entry points still
  reachable;
- a planted disabled fence failing the durable-fact oracle;
- Worker crash during the agent Activity, resuming without a second session;
- crash before the first checkpoint, resolving the existing session;
- stale generation rejected before the agent starts;
- cancellation reaching the attached session with stale completion failing
  closed.

Against the reviewer's specific list, the honest scoring:

| Injected failure | Covered? |
|---|---|
| Worker death before agent start | Yes |
| Worker death after agent start | Yes |
| Worker death during heartbeat | Yes |
| Worker death after external completion, before Activity completion | Partly. Covered in the separate guarded-mutation harness, not in this suite |
| Worker death during acknowledgement | Yes, at the acknowledgement boundary |
| Worker death during Continue-As-New | Yes, the history-boundary test |

The gap is that these run as a pass/fail suite. Turning the matrix into a scored
harness that reports completion rate under injected failure is measurement work
that has not been done.

### 13. Which claims are proven in production, which only in a bounded canary, and which remain design hypotheses?

**[verified]**

**Production, continuous:** result delivery and acknowledgement. Running with
`TEMPORAL_BEADS_MODE=shadow`, `TEMPORAL_OUTCOME_MODE=canary`. First production
reconciliation produced exactly two envelopes, both acknowledged on their first
delivery cycle. A later formula-bookkeeping close was correctly excluded as a
non-outcome. The all-store health surface stayed at zero silent outcomes and zero
store failures after the rollback guard was disarmed.

**Bounded canary only:** bead-to-agent execution. One canonical claim, one agent
execution, one hashed artifact, one generation-fenced receipt on the first
Activity attempt. Also the two-step episode that proved step ordering and
mid-episode Worker interruption recovery, and then failed at the outcome
boundary on the store-identity mismatch. Every canary ended by returning the
worker to shadow.

**Design hypothesis, not proved:** cross-host recovery; the reusable pack
boundary; the structured operator CLI, which is reviewed with zero findings and
not installed; and any claim that this generalises beyond a single-node
deployment.

I would lead with the third list. It is the shortest and it is the one that
establishes that the first two can be trusted.

### 14. What did Temporal make easier to diagnose that you could not previously distinguish?

**[verified]**

The before case: a work item completed, its branch was pushed to origin, and the
worker died before recording completion and the next route. The result was that
the branch existed, the item was not done, its route was empty, the pool demand
probe could not find it, and the orphan sweep skipped it because it keyed on the
same empty route field. Two items sat stranded for about twenty hours. Nothing in
the system could distinguish "this was never started" from "this finished and the
recording died," because both look like an unrouted open item.

The after case: the same class of failure now shows an Activity scheduled with no
completion, a next retry attempt, and a claim still fenced at a known generation.
The question "did the external effect already happen" is answered by the
idempotency key rather than inferred from branch state.

The sharper diagnostic win is the one from the failed canary. Before, a
correlation field could name a Temporal execution that did not exist, and nothing
caught it. Now the mismatch surfaces as a specific, repeating, named failure:
expected store `city:ds-research`, envelope built `city:gas-city`, retried every
fifteen minutes with the same error. That is a bug I can read off a screen
instead of reconstructing from process lists.

Framed for the panel: Temporal did not reduce the number of failures. It changed
them from ambiguous to specific.

### 15. What is the cost of the additional durability?

**[position], with [gap] on the numbers**

Conceptual cost, which I think is the largest: a contributor now has to hold
determinism rules, replay compatibility, fencing, and idempotency in their head
to change orchestration code safely. That is a real barrier and it is why the
replay gate is automated rather than documented.

Operational cost: a Temporal server, a Worker, three task queues, and a versioning
and replay discipline on every Workflow change. A self-hosted single-node
deployment adds a dependency that can itself be the outage, which is why the
integration is deliberately not required to inspect or repair Beads.

History cost: bounded by design. Compact typed identities and artifact references
go into history, never agent transcripts or logs, and `CoordinatorOutcomeWorkflow`
continues as new after 100 delivery attempts.

Latency cost: an extra hop from the outbox through the bridge into
Signal-With-Start on the dispatch path.

The gap: I do not have measured numbers for Worker RSS, history bytes per
episode, or the delivery latency delta. They are on the measurement plan, and I
would rather say that than estimate.

The judgment I would offer alongside it: the 44-second-every-two-hours
maintenance job did not justify any of this cost, and we left it as cron plus a
lock. Knowing where the cost is not worth paying is part of the answer.

---

## Developer communication

### 16. Give the explanation to a developer who has never heard of Beads or Gas City.

**[position]**

> I run a system that hands coding work to AI agents. The work items live in a
> database, so if anything crashes I still know the task exists and what it was
> for.
>
> The problem was everything around the task. An agent starts editing code. The
> process that started it dies. Now: did a retry already launch a second agent
> into the same worktree? Is this result from the current attempt or a stale one?
> Did anyone actually see the finished work? The database knew the task. It did
> not know the procedure.
>
> So I put the procedure in a Temporal Workflow and left the agent in an
> Activity. The Workflow remembers which step happened, what it is waiting on,
> and which retry is next. The agent stays as unpredictable as it needs to be.
>
> That is the whole idea. Everything else is me making retries safe for an
> Activity that spawns an hour-long process.

Zero Gas City vocabulary. If they ask what Beads is, it is a task database.

### 17. What would you remove to make this a ten-minute conference talk?

**[position]**

Remove: the Beads and Gas Town history, the SDK component map, NDI as a named
concept, the pack distribution boundary, the code reader, and every canary except
one.

Keep: the four-line failure, the ownership split, the worker-kill demo, the one
thing Temporal did not fix, and when not to use it.

The cut that hurts and should still be made: the NDI discussion. It is the most
intellectually interesting part of the article and it requires teaching a concept
from a different project before it pays off. In a talk it costs three minutes and
buys nuance the audience did not ask for yet.

The cut I would resist: the failed canary. Ten minutes of a system that worked is
less credible than nine minutes plus one honest failure.

### 18. What is the minimal sample a developer could clone and run in five minutes?

**[gap]**

It does not exist yet, and that is the most actionable item on the list.

The target, already specified: one command that starts a local Temporal dev
server and Worker, transitions one fixture work item to ready, shows the Workflow
in Temporal Web, kills the Worker during the agent Activity, restarts it, proves
the retry reattached to the same agent rather than starting a second one, writes
one terminal receipt, and prints the invariant checks.

The design decisions that make it five minutes rather than an afternoon: an
in-memory store adapter instead of Dolt, and a fake agent executable instead of a
real coding agent. The production Dolt adapter stays a documented reference, not
a prerequisite. No GitHub mutation, no Slack post, no production database.

I would say this is not built rather than describe it as if it were.

### 19. When should someone not use Temporal for an agent workflow?

**[verified]**

When the work has no durable wait, no crash exposure across a meaningful
boundary, and no coordination state. Our own negative result is the clean
example: a maintenance job doing about 44 seconds of synchronous work every two
hours, which never waited on an external event and skipped zero overlaps across
77 runs. Replay and durable waiting were never exercised. It was cron plus a
lock, and a timer with a lock and a source-of-record scan matched it with less
state and less operational surface.

The general test: if a crash mid-operation would leave you with a question you
cannot answer from your own database, the procedure deserves a durable owner. If
a crash just means you run it again next tick, it does not.

Two more cases. Do not reach for it when your work store is fragile and Temporal
would become required to repair it, because then a Temporal outage seals your
control plane shut. And do not convert every step of an existing graph engine
just because one step benefits.

### 20. How would this become a reusable Temporal tutorial or sample rather than a Gas City case study?

**[position]**

By shipping the two-column split as the artifact rather than as an aside.

The transferable tutorial is four claims and one demo: a Workflow owns durable
procedure, an Activity owns nondeterministic work, stable identity makes retries
attach to the same logical operation, and external effects stay the
application's problem. The demo is the worker kill that does not produce a second
agent.

Everything else we built (generation fences, claim tokens, session attachment,
exact coordinator acknowledgement, the independent watchdog) is hardening for one
specific property: our Activity spawns a process that edits a git worktree for an
hour and can outlive the Worker that started it. Anyone whose Activity has that
property needs the same list. Anyone whose Activity is a short idempotent call
does not, and the tutorial should say so, or it makes Temporal look like it
requires a protocol stack.

The reusable framing I would pitch: "durable orchestration for long-lived,
non-idempotent, externally-owned processes." Coding agents are the example, not
the subject. The same shape covers a long-running data migration, a video
transcode, or any Activity that starts something you cannot safely start twice.

---

## Two things to volunteer before being asked

**The heartbeat correction.** Presenting heartbeats as the duplicate-launch
protection is the most common way this design gets explained wrong, and the
current article does it in one paragraph. Saying "a Worker can die before the
first heartbeat, so the resolver has to find the session by stable identity
independently" before anyone asks demonstrates you know where your own
explanation is weakest.

**Durable wrongness.** The store-identity mismatch is the best thing in the whole
submission and it is a failure. Temporal preserved and faithfully retried a wrong
envelope forever, because the procedure it was given contained the wrong
identity. Lead with it in the "what it did not fix" section rather than burying
it. It is also the single clearest argument that we did not oversell the product,
which the reviewer already flagged as a trust signal.
