# Companion page prose pending voice pass

Every visitor-facing sentence on the companion page
(`src/pages/temporal-agent-orchestration/index.astro`) and in the figure text
it renders (`ConceptFigure.astro`), verbatim, grouped by where it sits. The
page prose below was first extracted into
`article-prose-for-voice-pass.md` §6 with the 2026-08-01 de-slop pass; this
doc supersedes that section for the companion page and adds the figure text
that landed with the 2026-08-01 visual-brief build. A slop pass ran over all
of it. The voice pass is still owed on all of it.

**Amended 2026-08-01, reviewer compression pass.** The page was restructured
to five sections (problem, What I Temporalized, demo, evidence, limits) with
a ledger-and-links first viewport, the demo moved ahead of the boundary
explanation, and four figures moved behind detail disclosures. Lines marked
**(new)** were authored in that pass and have had a slop pass but no voice
pass. Lines marked **(amended)** changed wording in that pass. Everything
else is carried over unchanged. Figure text did not change; two figures
render in a new page position.

Figure text appears on both pages wherever a figure is shared with the
article, so an edit to a heading, caption, or fallback item lands in both
places.

---

## Metadata

> How I made Gas City's agent orchestration durable with Temporal

Intro **(amended)** — the reviewer's four lines moved up from the problem
section into the first viewport:

> An agent is editing code. Its coordinator crashes before recording the handoff. The task record survives. The procedure does not. Temporal makes that procedure durable without making the agent deterministic.

> A short companion to the full Gas City case study: what I Temporalized, what the Worker-kill demo proves, and where the guarantees stop.

## First viewport: lede, ledger, links

Lede (carried over from the problem section):

> Put the unpredictable agent inside an Activity. Put the promises around it in a Workflow.

Ledger **(new; labels and shape are the reviewer's recommended top)**:

> Temporalized: One ready task → one agent execution → one fenced receipt.

> Proved: Recovery from a real Worker kill without starting a second agent.

> Running today: Durable result delivery and acknowledgement.

> Not proved: Cross-host recovery.

Links **(new labels; replace the old two-tab nav)**:

> Watch the Worker-kill demo

> Read the full article

> Inspect the annotated code

---

## The problem

> A crash loses the procedure, not the task

> I run a system that hands tracked work to coding agents. Work items live in a durable store, so a crash never loses the task. A crash used to lose everything around the task, starting with three questions a restart could not answer.

> Did this claim already start an agent?

> Does this result belong to the current attempt or a stale one?

> Has anyone acknowledged this exact outcome?

**(new; the reviewer's core-judgment line, close to verbatim)**:

> The task state was already durable. What was missing was a durable owner for the procedure.

### Figure: legend (new 2026-08-01, reviewer follow-up; renders on both pages before the first diagram)

Heading:

> How to read these diagrams

Swatch labels:

> structural connection

> a message crosses a boundary

> repeatable motion, direction of travel

> broken integration contract

> crash window on the edge it hits

> durable record

> identity fence

> durable wait

> shadow wall

> acknowledgement

Fallback list:

> A solid edge is a structural connection; a dashed edge is a message crossing a boundary.

> Moving dashes mark repeatable motion, and they travel in the direction the message moves.

> A broken edge is a failed integration contract between healthy components.

> A bolt is a crash window on the edge it interrupts.

> A double outline is a durable record; a lock is an identity fence; an hourglass is a durable wait.

> A translucent wall is shadow mode, and a check is an acknowledgement.

Caption:

> One grammar across every diagram. Anything moving is repeatable; still dashed edges are inspection, not traffic.

### Figure: scattered (new 2026-08-01)

Heading:

> One task, five owners, seven crash windows

Caption (verbatim from the visual brief):

> The facts survived in several stores, but no single durable execution owned the arrows between them.

Fallback list:

> A step becomes ready in the Beads ledger, but delivery depends on a later scan; a crash here leaves the ready work with no durable owner.

> A controller scan tick finds the step and records a claim back in Beads; a crash after the claim strands a claim with no agent.

> The dispatcher wakes a session and the agent starts; a crash before the session is recorded lets a retry launch a second agent.

> The agent pushes a branch to Git; a crash before completion is recorded leaves pushed work invisible to the repair scans.

> An agent from an old generation can report success late, and its stale completion can overwrite the current attempt.

> Completion lands in the Beads ledger, but creating a notification is a separate step that can silently never happen.

> A mail nudge reaches the Mayor, but nothing durable keeps the result owed until an acknowledgement is recorded.

> Only the Beads boxes are durable records; every arrow between the subsystems lived in process memory.

---

## 01 What I Temporalized

Heading **(amended; was "What was converted")**:

> What I Temporalized

Unit declaration **(amended; translated before named, per the reviewer)**:

> I converted one unit: one ready task becoming one agent execution and one receipt that only the current attempt can submit. The guard on that receipt is called a generation fence, and it is what keeps a stale attempt from overwriting the current one.

Before/after paragraph **(amended; the Task Queue sentence now claims later
isolation, not current independent scaling)**:

> Before, that unit was a controller tick, `CityRuntime.beadReconcileTick`, plus a separate recovery scan that inferred what a dead session had been doing. After, `BeadOrchestrationWorkflow` owns the procedure and `ExecuteBeadActivity` owns the fenced claim, start-or-attach, heartbeat, and completion. The two run on separate Task Queues, `gascity-bead-orchestration` for the procedure and `gascity-agent-work` for the agent, so orchestration and agent execution can later be isolated or scaled independently.

Code panes (carried over):

> Before: one process-owned tick

> After: one durable owner

> One process owned the call stack. When it died, the next process could only run another tick against persisted facts.

> The procedure has one durable owner. A replacement Worker replays the recorded history and continues from the boundary.

> Open the annotated before code

> Open all annotated files

Architecture cards (carried over):

> The canonical record for tasks, claims, artifacts, and receipts. Inspectable and repairable without Temporal.

> Owns ordering, durable waits, retries, cancellation, and which safe step comes next.

> Owns the agent process and every other nondeterministic effect, behind a fenced claim.

> Polls both task queues and executes the registered code. The one process allowed to die.

Tiers intro and tiers (carried over from the old "Who owns what" section):

> Three tiers. The middle one is where at-least-once execution becomes a safe operation.

> Temporal owns: Event History, deterministic ordering, durable waits and timers, retry scheduling, cancellation delivery, and acknowledgement state.

> The boundary owns: stable identity, idempotency keys, claim fences, and typed receipts. None of these are Temporal guarantees, and all of them are required for Temporal's guarantees to be useful.

> The application owns: whether the agent's work is correct, external side effects, review, store integrity, human authorization, and the independent watchdog.

> Temporal faithfully retries whatever it was told to do. It will not make a badly identified or non-idempotent operation safe on its own.

Disclosure summary **(new)**:

> The full ownership diagram

### Figure: handoff (amended 2026-08-01, also on the article)

Heading (unchanged):

> A crash between claim and launch is survivable

Caption:

> Neither crash window closes; both become boring. Redelivery lands on the same stable Workflow ID, and the retried attach finds the same session by identity instead of launching a second agent.

Fallback list:

> One Beads transaction writes the ready transition and its delivery event together.

> Signal-With-Start opens or signals the Workflow under a stable Workflow ID.

> Crash window one sits before the outbox acknowledgement: if the bridge dies after Temporal accepts the event, the event is delivered again and the Workflow ignores an event ID it has already processed.

> The Workflow records a generation-fenced Beads claim carrying a claim token.

> Start-or-attach creates the agent session or finds the existing one by stable identity.

> Crash window two sits before the first heartbeat: if the Worker dies after the session is created, the retry re-enters start-or-attach and the resolver finds the already-created session by identity.

> Heartbeats carry progress after attachment; the duplicate-launch guard is the stable identity, not the heartbeat.

### Figure: ownership (amended 2026-08-01, also on the article; now behind a disclosure)

Heading (unchanged):

> Who owns what

Caption:

> Beads says what is true about the work. Temporal says where the procedure is. Activities touch the unpredictable world. Fenced completion checks travel both ways between Beads and Activities.

Fallback list:

> The Beads work record is a durable record owning mutable task facts, claims, dependencies, artifacts, outcomes, and receipts.

> The Temporal Workflow is a durable record owning Event History, deterministic decisions, waits, retries, cancellation, signals, and progress; Event History stays separate from task facts.

> Temporal Activities contain agent processes, tests, reviews, external calls, heartbeats, and fences, and are not a durable record.

> Fenced completion checks flow both ways between Beads and Activities: Activities report completions carrying the generation and claim token, and Beads accepts only a completion that still matches the canonical claim.

---

## 02 The Worker dies on camera

Sub-head **(amended; superseded "One run, start to finish, with nothing
staged. The kill signal is real and it lands twice, at two different
points.")**:

> Two recordings, and nothing in either is staged. Each is a split screen: the run on the left, and on the right independent panes that measure for themselves rather than trusting the run's own narration.

Before-world block **(new; sub-head, intro, figcaption, numbers)**:

> First, without Temporal

> The coordinator here is the before-world's reconcile loop: it claims the work, launches the agent, and holds the procedure in process memory. The kill lands mid-wait. The restart can only infer.

> The right panes are where it goes wrong: two agent processes for one work item, then a stale receipt over the current one. Download the recording.

> kill -9 the coordinator: the agent survives and keeps editing. restart the coordinator: the claim looks stale; a second agent launches, two for one task. first agent finishes: its late receipt overwrites the current one; nothing fences it.

(Before-cast player marker labels:)

> The coordinator claims; the agent starts

> kill -9: the coordinator is gone

> Restart, with an empty memory

> A second agent for the same task

> The stale receipt lands on top

> The same kill, with Temporal

> The full recording keeps real timing, including the pause where Temporal notices the dead Worker.

> Download the recording

**(amended; the processes-pane sentence is new, the rest carried over)**:

> At eight seconds the first Worker dies mid-execution, and the agent it started is still alive. The processes pane measures it as it happens: the Worker count drops to zero and the agent count does not. That line is the whole reason the boundary is shaped this way. The eighteen seconds that follow are Temporal working out that the Worker is gone. Detection takes real time, and the recording keeps all of it.

> The second kill lands before any checkpoint exists, which makes it the decisive arm. The retry has to ask the session resolver again, and the resolver returns the session that already exists instead of creating a second one. The first arm resumes from its checkpoint and never asks again, so it cannot demonstrate duplicate prevention on its own.

> A heartbeat does not keep a retry from becoming a second agent. A Worker can die before the first heartbeat ever lands. The resolver finds the existing session by stable identity, and the heartbeat only lets the retry resume progress.

Evidence disclosures **(new; summaries, image caption and alt, evidence
intro, link labels)**:

> Temporal's own record of the retry

> The Event History the run left behind, read from the dev server's database: the Activity's second attempt starts after the Worker dies, and the workflow completes on that attempt. Worker identity and queue names are the only edits, masked before capture.

> Temporal Web UI event history for the pre-checkpoint arm: nineteen events from Workflow Execution Started through Activity Task Started with attempt 2 to Workflow Execution Completed.

> The run evidence, downloadable

> Both gates write their evidence before anything quotes it. The reports, Temporal's between-attempt samples, the store receipts, and the agent worklogs are all here.

> The invariant report, both arms

> Retry-gap samples from the decisive arm

> Agent session events: one created, then attached

> The before-world gate report

> The before-world store, stale receipt on top

> One worktree file, edited by two sessions

> Run provenance

**(amended; the final sentence is new)**:

> The demo runs on one host against a local dev server, with a file-backed store and a fixture process in place of a coding agent. It proves the boundary, on real Temporal, with a real signal. The before-world arm drives the same fixture agent over the same protocol; only the coordinator differs.

(Player marker labels:)

> Arm 1 starts

> kill -9: Worker one is gone

> Temporal retries; workflow completed

> Arm 2 starts

> kill -9 before any checkpoint

> Retry re-resolves; workflow completed

### Figure: recovery (amended 2026-08-01, also on the article)

Heading (unchanged, pinned by tests):

> One agent session survives Worker loss

Caption:

> Replay restores deterministic Workflow state only; stable identity finds the running session, and the generation fence admits one completion.

Fallback list:

> Three rows run unbroken across the timeline: the durable Temporal Event History, the durable Beads claim and generation fence, and the live agent session.

> Worker A, a temporary process, schedules the Activity and attaches the agent session.

> Worker A dies. The agent session keeps running under the Worker gap; it is never replayed, and both durable rows persist.

> Worker B replays only the deterministic Workflow state from the Event History.

> Worker B resolves the same session by stable identity and claim token, which holds even if no heartbeat was ever recorded.

> Worker B reattaches, and Beads accepts one generation-fenced completion.

---

## 03 What the evidence proves

> Continuous in production

**(amended; "an exact acknowledgement receipt" read as an exactly-once claim)**:

> Result delivery and acknowledgement. Finished outcomes are delivered, redelivered while unacknowledged, and closed only by an acknowledgement matched to the exact outcome generation and agent session.

> Bounded canary only

> Work-item-to-agent execution: one claim, one agent execution, one fenced receipt, and recovery from a mid-episode Worker interruption. Every canary ended by returning the worker to shadow.

> Design hypothesis

> Cross-host recovery, the reusable pack boundary, and any claim that this generalizes beyond a single-node deployment.

Sub-heading **(new; replaces the glass-wall headline, which stays inside the
shadow figure)**:

> What runs today

Status paragraph **(amended; "This" became "The" after the move, and the
independent-controls sentence is new)**:

> The status has two halves and they belong together. The work-item-to-agent unit is proved by a bounded canary and runs in shadow. The part running continuously in production is result delivery and acknowledgement, the same boundary applied a second time. Both have independent rollout controls.

Disclosure summary **(new)**:

> The full delivery flow

> The full test map, forty-five Go test files and a replay gate that has to fail when it should, is in the article.

### Figure: shadow (new 2026-08-01, also on the article; now beside the evidence)

Heading:

> Shadow is a glass wall with one opened gate

Caption:

> Shadow proves the Temporal wiring, physically blocks every canonical mutation at the wall, and opens one separate gate so result delivery and acknowledgement run continuously in production.

Fallback list:

> Above the wall, the Temporal server and Worker run, task queues are polled, Workflow definitions are registered, and replay and deployment wiring is exercised.

> Below the wall, the Beads claim, agent launch, canonical Beads completion, and external mutation are blocked by the fail-closed shadow worker.

> One gate in the wall is separately opened: OutcomeReady delivery crosses it, waits durably, and redelivers until the mayor verifies evidence and acknowledges.

> Beads mode and Outcome mode are independent switches; Beads shadow with Outcome canary is the current boundary.

> Setting both switches to canary is reserved for a bounded, separately authorized run, never general activation.

### Figure: workshop (amended 2026-08-01, also on the article; now behind a disclosure)

Heading (unchanged):

> How finished work reaches an exact acknowledgement

Caption:

> Delivery may repeat; the outcome identity does not. Completion requires an exact acknowledged receipt, and an independent watchdog outside Temporal reports finished work that never produced an outcome.

Fallback list:

> Agents, formulas, and orders update work.

> The Beads work record stores canonical work facts as a durable record.

> A verified result is ready for delivery.

> The OutcomeReady outbox stores a durable completed-result record awaiting acknowledgement.

> The Temporal Outcome Workflow delivers the result, waits on a durable timer, and redelivers only between delivery and that wait while acknowledgement is missing.

> The Mayor verifies evidence.

> An exact acknowledgement binds the result generation and agent session.

> The Beads acknowledged receipt becomes the canonical durable record.

> An independent all-store watchdog outside Temporal scans every store for terminal or verified work with no outcome, so it reports even when the delivery path itself goes silent.

---

## 04 What it did not fix, and what it cost

> Temporal gives the procedure a durable owner. It does not make external effects exactly once. A Worker can die after an external call succeeds and before the completion is recorded, and the Activity may run again.

Canary paragraph **(amended; compressed per the reviewer, step-by-step moved
to the wrongness figure)**:

> The sharpest limit showed up in the latest canary. The agent work completed correctly, but an application adapter placed the wrong store identity in the outcome envelope, and Temporal faithfully retried the wrong envelope every fifteen minutes. The failure marker belongs on the adapter. Temporal preserved exactly what it was given, which is the job. I rolled the canary back with the failure evidence intact.

Disclosure summary **(new)**:

> The failure, step by step

> A contributor now has to hold determinism rules, replay compatibility, fencing, and idempotency in their head to change orchestration code safely, and the deployment gains a server, a Worker, and a versioning discipline on every Workflow change. That is the real cost, and it is larger than the infrastructure.

> A maintenance job that does forty-four seconds of synchronous work every two hours did not justify any of that, and it stayed cron plus a lock. If a crash mid-operation leaves a question your own database cannot answer, the procedure deserves a durable owner. If a crash just means running it again next tick, it does not.

### Figure: wrongness (new 2026-08-01, companion only; now behind a disclosure)

Heading:

> A wrong identity is preserved as durably as a right one

Caption:

> Temporal preserves and retries the procedure it is given; a wrong identity inside the procedure is preserved just as durably. The canary was rolled back with its evidence intact, not rewritten into a success.

Fallback list:

> Step 1 Workflow and Step 2 Workflow both complete in the bounded canary.

> The Beads work record accepts two generation-fenced completions.

> The outcome adapter builds the OutcomeReady envelope with the runtime city identity instead of the canonical store identity.

> The delivery contract into the Temporal Outcome Workflow breaks on the mismatch, and every delivery attempt is rejected.

> A durable timer retries the same wrong envelope on schedule; Temporal preserves the mistake exactly as it was given.

> The canary was rolled back and contained; its evidence stays preserved instead of being rewritten into a success.

### Figure: boundary (reworked 2026-08-01, also on the article)

Heading (unchanged):

> What Temporal owns, and what it leaves behind

Caption:

> Idempotency keys and fences are not Temporal guarantees. They are the boundary work that turns at-least-once execution into one safe result.

Fallback list:

> Temporal owns Event History, deterministic ordering, durable waits and timers, retry scheduling, cancellation, and acknowledgement state.

> The boundary owns Activities, stable identity, idempotency keys, generation fences, and typed receipts; this is where at-least-once Activity attempts converge to one result.

> The application owns agent correctness, GitHub, mail, and filesystem behavior, acceptance tests and review, Beads integrity, human authorization, and independent watchdogs.

---

## Glossary (new 2026-08-01; renders on the companion before Go deeper and at the article's end)

Head:

> Glossary

> The vocabulary this page leans on, grouped by where it comes from. Open the group you need.

Group titles and intros:

> Gas City terms: The agent-orchestration system this case study happened in.

> Temporal terms: The durable-execution system the procedure now lives in.

> Distributed-systems terms: The general ideas both systems are built from.

Gas City entries:

> Gas City: The system that hands tracked work to coding agents and keeps a durable record of what happened to each item. Everything on this page is about making one of its procedures survive a crash.

> Beads: The durable store of work facts: tasks, claims, artifacts, and receipts. It is why a crash never loses the task itself; what a crash used to lose was everything in flight around the task.

> Bead (work item): One tracked piece of work, like a ticket in an issue tracker. The name comes from Beads, the store that holds them.

> Mayor: The coordinating agent. When work finishes, the Mayor verifies the evidence and sends the acknowledgement that lets a result count as delivered.

> Session: One live agent working on one work item. A session can outlive the process that launched it, which is the fact the whole demo turns on.

> Generation: The attempt number for a work item. Retry the work and the generation goes up; anything still running from an earlier generation is stale.

> Generation fence: The guard that makes staleness harmless: a receipt only lands if it carries the current generation. Without it a slow old attempt can overwrite the new one, which is exactly what the before-Temporal recording shows happening.

> Claim token: Proof that one attempt owns a task right now. A completion carrying an old token is refused, the way a hotel key stops working once the desk reissues the room.

> Formula: A reusable recipe for a kind of work. The demo's work item runs a single formula step so the procedure around it stays small enough to watch.

> OutcomeReady: The record that a finished result is owed to someone. It stays open, and delivery repeats, until an acknowledgement matching the exact outcome closes it. See outbox.

> Shadow mode: Everything wired for real, nothing allowed to change canonical state. The Temporal side runs and is watched while a fail-closed guard blocks every mutation; one gate is opened separately so result delivery runs for real.

> Canary: A bounded, separately authorized live run used to prove one path, then rolled back. Every canary here ended by returning the worker to shadow.

Temporal entries:

> Temporal: A durable-execution system. It records every decision a procedure makes, so when the process running that procedure dies, another process picks it up exactly where it stopped.

> Workflow: The procedure, written as code that must be deterministic. Every step it takes is recorded to the Event History, and that record is what survives a crash.

> Activity: A step that touches the unpredictable world: launching a process, calling a network, writing a file. Activities are retried rather than replayed, so they have to be safe to run more than once. See at-least-once.

> Worker: The process that executes Workflow and Activity code. It is deliberately disposable: the demo kills one twice and nothing durable is lost.

> Event History: The append-only record of everything the Workflow decided and observed. It lives on the Temporal server, not in the Worker, which is why the Worker is allowed to die.

> Replay: How a replacement Worker catches up: it re-runs the Workflow code against the recorded history and arrives at the same state without redoing any real-world work.

> Task Queue: A named queue Workers poll for work. Separate queues let different kinds of work be isolated or scaled independently later.

> Heartbeat: An Activity's periodic sign of life, which can carry a small checkpoint. It speeds up noticing a dead Worker; it is not what prevents a duplicate agent, because a Worker can die before the first heartbeat ever lands.

> Durable timer: A wait that survives crashes. Redeliver in fifteen minutes holds even if every process restarts in between; the hourglass in the diagrams marks one.

> Signal-With-Start: One message that reaches a Workflow if it exists and starts it first if it does not. With a stable Workflow ID, delivering the same message again is safe.

Distributed-systems entries:

> Durable: Written somewhere that outlives the process: a database, a file, a server-side history. The task state was already durable before Temporal; the procedure around it was not.

> At-least-once: The delivery promise real systems can keep: a step happens, and after a crash it may happen again. The repeats are the price of never losing the step; the boundary work is what makes the repeats safe.

> Exactly-once: The promise nobody can keep for external effects. A process can die after an external call succeeds and before recording that it did, so the call may run again. Systems approximate exactly-once by pairing at-least-once with idempotency and fences.

> Idempotency: Doing a thing twice has the same effect as doing it once. An idempotency key is how a second attempt gets recognized as a repeat instead of a new request.

> Fencing: Refusing actions from stale actors. A fencing value goes up with every new attempt, and the store rejects anything carrying an older value; the generation fence is this idea applied to receipts.

> Determinism: Same inputs, same decisions, every time. Replay only works because the Workflow is deterministic: fed the same history, it must make the same choices.

> Orphaned process: A child process that keeps running after its parent dies. The coding agent orphaned by a dead Worker is not a defect here; it is the property the boundary is designed around.

> Outbox: Record that a message is owed in the same durable store as the work itself, then deliver from that record. Delivery can crash and repeat without the promise being lost; OutcomeReady is an outbox.

> Watchdog: An independent checker that looks for work the main path forgot. It matters because a delivery pipeline that died silently looks identical to one with nothing to deliver.

---

## Go deeper

> The full article

> The history, the failed canary, the test map, and how the boundary was chosen.

> The annotated code

> The complete before and after source, annotated section by section, with linked upstream provenance.

---

## Not repeated here

The `siblings` and `orchestrator` figures render only on the article and were
not changed by the 2026-08-01 build. The in-diagram SVG labels and the
screen-reader `<desc>` paragraphs live in `ConceptFigure.astro`; they follow
the same register as the fallback lists above and change with them.
