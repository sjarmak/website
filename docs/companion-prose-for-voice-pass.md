# Companion page prose pending voice pass

Every visitor-facing sentence on the companion page
(`src/pages/temporal-agent-orchestration/index.astro`) and in the figure text
it renders (`ConceptFigure.astro`), verbatim, grouped by where it sits. The
page prose below was first extracted into
`article-prose-for-voice-pass.md` §6 with the 2026-08-01 de-slop pass; this
doc supersedes that section for the companion page and adds the figure text
that landed with the 2026-08-01 visual-brief build. A slop pass ran over all
of it. The voice pass is still owed on all of it.

Figure text appears on both pages wherever a figure is shared with the
article, so an edit to a heading, caption, or fallback item lands in both
places.

---

## Metadata

**Retitled 2026-08-01** (superseded the line below it was extracted from):

> How I made Gas City's agent orchestration durable with Temporal

> A short walkthrough of what I Temporalized, how the system recovers from Worker failure, and where Temporal's guarantees stop.

> A short companion to the full Gas City case study: what I Temporalized, what the Worker-kill demo proves, and where the guarantees stop.

## Tabs

> Full article

> Annotated code

---

## The problem

> A crash loses the procedure, not the task

(Reviewer's four lines, close to verbatim:)

> An agent is editing code. Its coordinator crashes before recording the handoff. The task record survives. The procedure does not. Temporal makes that procedure durable without making the agent deterministic.

> I run a system that hands tracked work to coding agents. Work items live in a durable store, so a crash never loses the task. A crash used to lose everything around the task, starting with three questions a restart could not answer.

> Did this claim already start an agent?

> Does this result belong to the current attempt or a stale one?

> Has anyone acknowledged this exact outcome?

> Put the unpredictable agent inside an Activity. Put the promises around it in a Workflow.

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

## 01 What was converted

> The unit converted is one ready work item becoming one agent execution and one fenced receipt.

> Before, that unit was a controller tick, `CityRuntime.beadReconcileTick`, plus a separate recovery scan that inferred what a dead session had been doing.

> After, `BeadOrchestrationWorkflow` owns the procedure and `ExecuteBeadActivity` owns the fenced claim, start-or-attach, heartbeat, and completion, split across two task queues: `gascity-bead-orchestration` for the procedure and `gascity-agent-work` for the agent itself.

> The status has two halves and they belong together. This work-item-to-agent unit is proved by a bounded canary and runs in shadow. The part running continuously in production is result delivery and acknowledgement, the same boundary applied a second time.

### Figure: shadow (new 2026-08-01, also on the article)

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

---

## 02 Before and after

> The excerpts below are the entry points of each side, rendered from the same versioned files the code browser annotates in full.

> Before: one process-owned tick

> After: one durable owner

> One process owned the call stack. When it died, the next process could only run another tick against persisted facts.

> The procedure has one durable owner. A replacement Worker replays the recorded history and continues from the boundary.

> Open the annotated before code

> Open all annotated files

> The canonical record for tasks, claims, artifacts, and receipts. Inspectable and repairable without Temporal.

> Owns ordering, durable waits, retries, cancellation, and which safe step comes next.

> Owns the agent process and every other nondeterministic effect, behind a fenced claim.

> Polls both task queues and executes the registered code. The one process allowed to die.

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

---

## 03 Who owns what

> Three tiers. The middle one is where at-least-once execution becomes a safe operation.

> Temporal owns: Event History, deterministic ordering, durable waits and timers, retry scheduling, cancellation delivery, and acknowledgement state.

> The boundary owns: stable identity, idempotency keys, claim fences, and typed receipts. None of these are Temporal guarantees, and all of them are required for Temporal's guarantees to be useful.

> The application owns: whether the agent's work is correct, external side effects, review, store integrity, human authorization, and the independent watchdog.

> Temporal faithfully retries whatever it was told to do, so everything about making that retry safe belongs to the application.

### Figure: ownership (amended 2026-08-01, also on the article)

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

## 04 The Worker dies on camera

> One run, start to finish, with nothing staged. The kill signal is real and it lands twice, at two different points.

> The full recording keeps real timing, including the pause where Temporal notices the dead Worker.

> Download the recording

> At eight seconds the first Worker dies mid-execution, and the agent it started is still alive. That line is the whole reason the boundary is shaped this way. The eighteen seconds that follow are Temporal working out that the Worker is gone. Detection takes real time, and the recording keeps all of it.

> The second kill lands before any checkpoint exists, which makes it the decisive arm. The retry has to ask the session resolver again, and the resolver returns the session that already exists instead of creating a second one. The first arm resumes from its checkpoint and never asks again, so it cannot demonstrate duplicate prevention on its own.

> A heartbeat does not keep a retry from becoming a second agent. A Worker can die before the first heartbeat ever lands. The resolver finds the existing session by stable identity, and the heartbeat only lets the retry resume progress.

> The demo runs on one host against a local dev server, with a file-backed store and a fixture process in place of a coding agent. It proves the boundary, on real Temporal, with a real signal.

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

## 05 What the evidence proves

> Continuous in production

> Result delivery and acknowledgement. Finished outcomes are delivered, redelivered while unacknowledged, and closed only by an exact acknowledgement receipt.

> Bounded canary only

> Work-item-to-agent execution: one claim, one agent execution, one fenced receipt, and recovery from a mid-episode Worker interruption. Every canary ended by returning the worker to shadow.

> Design hypothesis

> Cross-host recovery, the reusable pack boundary, and any claim that this generalizes beyond a single-node deployment.

> The full test map, forty-five Go test files and a replay gate that has to fail when it should, is in the article.

### Figure: workshop (amended 2026-08-01, also on the article)

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

## 06 What it did not fix, and what it cost

> Temporal gives the procedure a durable owner. It does not make external effects exactly once. A Worker can die after an external call succeeds and before the completion is recorded, and the Activity may run again.

> The sharpest limit showed up in the latest canary. Two steps executed exactly once, survived a deliberate mid-episode Worker interruption, and then failed at the outcome boundary, where an application adapter derived the wrong store identity and Temporal faithfully retried the wrong envelope every fifteen minutes. The failure marker belongs on the adapter. Temporal preserved exactly what it was given, which is the job.

> A contributor now has to hold determinism rules, replay compatibility, fencing, and idempotency in their head to change orchestration code safely, and the deployment gains a server, a Worker, and a versioning discipline on every Workflow change. That is the real cost, and it is larger than the infrastructure.

> A maintenance job that does forty-four seconds of synchronous work every two hours did not justify any of that, and it stayed cron plus a lock. If a crash mid-operation leaves a question your own database cannot answer, the procedure deserves a durable owner. If a crash just means running it again next tick, it does not.

### Figure: wrongness (new 2026-08-01, companion only)

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

## 07 Go deeper

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
