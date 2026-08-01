# Article prose pending voice pass

Every sentence added to `Article.mdx` on 2026-08-01 in response to the reviewer
feedback, verbatim, grouped by where it sits. All of it is draft. Nothing here
has been through the voice filter yet. Existing article sentences are not
repeated; only new text appears below.

The one correction (the heartbeat paragraph) replaced an existing sentence, so
the removed sentence is quoted first for comparison.

---

## 1. Standfirst (blockquote, directly under the italic deck)

> I left the coding agent nondeterministic and put it inside an Activity, then moved the promises around it (did this claim already start an agent, does this result belong to the current generation, has anyone acknowledged it, which retry is next) into a Workflow.

> The unit I converted, one ready work item becoming one agent execution, is proved by a bounded canary and still runs in shadow mode.

> The part running continuously in production is result delivery and acknowledgement, which is the same boundary applied a second time.

Note: rendered as a blockquote deliberately, so the italic line under the title
keeps its display-font deck treatment. A new page-scoped blockquote rule (rule in
the margin, no plate) also picks up the existing "Put the unpredictable agent
inside an Activity" pull quote.

---

## 2. Canonical unit declaration (new `###` immediately above the before-code reader)

Heading: **The unit I converted**

> Being specific about it, because "I added Temporal to my agent system" is not a claim anyone can check.

> The unit is one ready work item becoming one agent execution and one fenced receipt.

> Before, that was a controller tick: `CityRuntime.beadReconcileTick` in `cmd/gc/city_runtime.go`, plus the session recovery and close path in `cmd/gc/session_beads.go`, at the public revision the excerpts below cite and link to.

> After, `BeadOrchestrationWorkflow` owns the procedure and `ExecuteBeadActivity` owns the fenced claim, start-or-attach, heartbeat, and generation-fenced completion, split across two task queues: `gascity-bead-orchestration` for the procedure and `gascity-agent-work` for the agent itself.

> I chose that unit over result delivery because it has an exact predecessor in public code that maps one to one onto its replacement.

> Result delivery's "before" was mail plus attention plus hope, and an absence is a weaker demonstration than a diff.

> The two halves of the status belong in the same breath, so both, every time: this bead-to-agent unit is proved by a bounded canary and runs in shadow.

> The part running continuously in production is result delivery and acknowledgement.

Note: the commit hash is deliberately absent from the prose. The article pin
suite bans any 40-character hash in `Article.mdx`; the revision lives in the code
reader, which links it.

---

## 3. Heartbeat correction (section "2. A retry accidentally starts a second agent")

Removed sentence:

> ~~The replacement reads the persisted heartbeat details, presents the same claim token, and reattaches to the existing session rather than launching a competitor.~~

Replacement (the preceding sentence, "If the Worker disappears, Temporal can
schedule another attempt.", is unchanged):

> What keeps that attempt from becoming a second agent is not the heartbeat. A Worker can die before the first heartbeat ever lands.

> The retry presents the same claim token, and the resolver finds the session already bound to that claim by its stable identity, so there is no competitor to launch.

> The persisted heartbeat details are how the new attempt picks up progress from the last checkpoint, not how it avoids starting a second agent.

---

## 4. Test section (new `##` between the after-code reader and "What's running now")

Heading: **What the tests hold down**

> None of the above is worth much on its own, so here is the suite behind it.

> It runs from one command:

(code fence: `cd services/temporal-maintenance && make test    # go test -race ./...`)

> That is 45 Go test files across the service, 18 of them in the package that holds the Temporal and Beads boundary.

> Everything in the table below runs unconditionally; a few heavier integration cases sit behind a local Temporal dev server and skip themselves when the CLI isn't on the path.

Table, column headers **What has to hold** and **Where it is asserted**:

> Workflow behavior | `workflow_test.go`, 12 cases covering duplicate ready delivery, malformed events, event-limit rejection, and seal enforcement

> Activity behavior | `activity_test.go`, 13 cases covering the fenced claim, heartbeating, stale-generation rejection, and artifact bounding

> A duplicate signal schedules one Activity

> A stale acknowledgement fails closed

> Cancellation reaches the agent and does not hang

> Continue-As-New keeps its state and its receipts

> Replay against captured histories, and the gate failing when it should

> A killed Worker resumes without a second agent session

> Replay row, right column: `TestReplayPersistedWorkflowHistory` and `TestReplayRejectsPlantedNondeterministicWorkflow`, both in `failure_matrix_test.go`

> Killed-Worker row, right column: `TestActivityWorkerCrashResumesFromHeartbeatWithoutSecondSession` for a crash after the agent is running, and `TestActivityCancellationBeforeFirstCheckpointUsesResolvedSession` for a crash before any heartbeat lands

Prose after the table:

> The second replay case is the one I care about more than the passing one.

> A replay gate that never fails is a gate that is not wired up, so the suite plants a nondeterministic Workflow and requires the gate to reject it.

> A local rule goes with it: a replay fixture is never regenerated to make a change pass.

> If the fixture fails, the change is breaking.

> The gap here is not coverage.

> A green test name is a weaker thing to show than the kill itself, so the suite is backed by a harness that runs the real Workflow and Activity against a local Temporal server and kills the Worker with a real signal at two points: once while the agent is mid-edit and a heartbeat checkpoint already exists, and once before any checkpoint lands.

> Both arms finish with one session and one receipt. The second is the one that matters, because it is the only one where the retry has to ask the resolver again, and the resolver hands back the session that already exists rather than minting a second.

> The run is recorded, forty-one seconds of it, most of which is the pause where Temporal works out that the Worker is gone.

> What this page still owes you is that recording, embedded here rather than described.

Revised twice on 2026-08-01, both times because the claim stopped being true.
First after the demo was actually run (both arms pass, exit 0, evidence under
`demo/out/run-artifacts`), which retired "asserted in Go and has never been
shown running". Then after the run was recorded to
`demo/recording/worker-kill.cast`, which retired "what I still owe is a
recording".

The sentence now claims only that the recording is not embedded on this page,
which is true and is a one-step fix: drop in `asciinema-player` (self-contained,
no network at play time) and point it at the cast. If you do that, this
paragraph needs a third revision and the honest version has no debt left in it.

> That is a demo I owe.

> These are assertions against a local test environment, which is what makes me willing to run the bead-to-agent path as a bounded canary in shadow.

> The part they let run continuously in production is result delivery and acknowledgement.

Note: the plan document's file counts (24 in the maintenance package, 45 in
`internal/temporalbeads`) were inverted. The real counts, checked against the
source tree: 45 `*_test.go` files across the whole service, 18 of them in
`internal/temporalbeads`. Case counts of 12 and 13 were correct. The plan also
attributed the two replay cases to a replay-named file; they live in
`failure_matrix_test.go`, and the table says so.

Second correction, made after checking the source tree rather than the plan: the
killed-Worker row originally pointed at `restart_test.go`, which holds
`TestWaitBoundary_StateDurable` and `TestWorkflowID_Stable` and no Worker-kill
case at all. Both cases now named in that row were verified present in
`activity_test.go`. Every test named in the table was also checked for a skip
guard; all of them run without a local Temporal dev server, which is what the
added sentence claims.

---

## 5. Pattern versus hardening (new `##` between "What Temporal did not solve" and "NDI and durable replay are complementary")

Heading: **What transfers, and what is just mine**

> Temporal does not come with a mandatory outbox, a watchdog, generation fences, claim tokens, and a second work store.

> It does not.

> Two lists, and the first one is the short one.

> The pattern, which transfers to anyone:

> A Workflow owns durable procedure.

> An Activity owns nondeterministic work.

> Stable identity makes a retry attach to the same logical operation instead of starting a new one.

> External effects stay the application's responsibility.

> My hardening, which exists because of what my Activity starts:

> Beads generations and claim tokens.

> Agent-session attachment and start-or-attach resolution.

> Formula root and step relationships.

> Exact coordinator acknowledgement.

> The independent all-store watchdog.

> Anyone orchestrating a short idempotent job needs the first list and none of the second.

> I needed the second because my Activity spawns a process that edits a git worktree for an hour and can outlive the Worker that started it.

> That is a property of the workload, not a tax Temporal charges.

Note: the phrase "the coordinator" is banned by the pin suite, so the hardening
bullet reads "Exact coordinator acknowledgement" and nothing in these sections
uses the banned form.

---

## Still open

The recovery diagram in `ConceptFigure.astro` still carries the old heartbeat
causality in three places: its `<desc>`, the step-3 sublabel "read heartbeat",
and the fourth fallback list item. Figure work was parked for this pass, so the
prose and the diagram now disagree. That is the first thing to fix when figures
reopen.

---

## 6. Companion page (all visitor-facing text, added when the page was built)

**De-slop pass applied 2026-08-01**, so the text below matches what the page
ships. Eleven patterns were removed: four colon reveals, two clefts ("what a
crash used to lose was", "what it proves is"), two binary contrasts ("is not
dead air", "what prevents a second agent is not the heartbeat"), two
throat-clearing openers ("the fix fits in two sentences", "the cost is real"),
and one faux-insight setup ("the middle one is the interesting one"). The
heartbeat correction survived as a plain negation because the denial is the
content, not a rhetorical contrast. No em dashes, no banned words. This is a
slop pass, not the voice pass; the voice pass is still owed.

The companion page at the route root. The article moved to `/article` unchanged.
The reviewer's four lines are quoted close to verbatim per the split plan and
are marked as such; they are included for completeness but originate with the
reviewer, not this pass.

### Metadata

> The procedure survives the process

> A coding-agent orchestration system, rebuilt so its promises survive a crash: the unit converted, a recorded Worker kill, and the limits that remain.

> A companion to the Gas City Temporal case study: what was converted, a recorded Worker-kill demonstration, what the evidence proves, and what it cost.

### Tabs

> Full article

> Annotated code

### The problem

> A crash loses the procedure, not the task

(Reviewer's four lines, close to verbatim:)

> An agent is editing code. Its coordinator crashes before recording the handoff. The task record survives. The procedure does not. Temporal makes that procedure durable without making the agent deterministic.

> I run a system that hands tracked work to coding agents. Work items live in a durable store, so a crash never loses the task. A crash used to lose everything around the task, starting with three questions a restart could not answer.

> Did this claim already start an agent?

> Does this result belong to the current attempt or a stale one?

> Has anyone acknowledged this exact outcome?

> Put the unpredictable agent inside an Activity. Put the promises around it in a Workflow.

### 01 What was converted

> The unit converted is one ready work item becoming one agent execution and one fenced receipt.

> Before, that unit was a controller tick, `CityRuntime.beadReconcileTick`, plus a separate recovery scan that inferred what a dead session had been doing.

> After, `BeadOrchestrationWorkflow` owns the procedure and `ExecuteBeadActivity` owns the fenced claim, start-or-attach, heartbeat, and completion, split across two task queues: `gascity-bead-orchestration` for the procedure and `gascity-agent-work` for the agent itself.

> The status has two halves and they belong together. This work-item-to-agent unit is proved by a bounded canary and runs in shadow. The part running continuously in production is result delivery and acknowledgement, the same boundary applied a second time.

### 02 Before and after

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

### 03 Who owns what

> Three tiers. The middle one is where at-least-once execution becomes a safe operation.

> Temporal owns: Event History, deterministic ordering, durable waits and timers, retry scheduling, cancellation delivery, and acknowledgement state.

> The boundary owns: stable identity, idempotency keys, claim fences, and typed receipts. None of these are Temporal guarantees, and all of them are required for Temporal's guarantees to be useful.

> The application owns: whether the agent's work is correct, external side effects, review, store integrity, human authorization, and the independent watchdog.

> Temporal faithfully retries whatever it was told to do, so everything about making that retry safe belongs to the application.

### 04 The Worker dies on camera

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

### 05 What the evidence proves

> Continuous in production

> Result delivery and acknowledgement. Finished outcomes are delivered, redelivered while unacknowledged, and closed only by an exact acknowledgement receipt.

> Bounded canary only

> Work-item-to-agent execution: one claim, one agent execution, one fenced receipt, and recovery from a mid-episode Worker interruption. Every canary ended by returning the worker to shadow.

> Design hypothesis

> Cross-host recovery, the reusable pack boundary, and any claim that this generalizes beyond a single-node deployment.

> The full test map, forty-five Go test files and a replay gate that has to fail when it should, is in the article.

### 06 What it did not fix, and what it cost

> Temporal gives the procedure a durable owner. It does not make external effects exactly once. A Worker can die after an external call succeeds and before the completion is recorded, and the Activity may run again.

> The sharpest limit showed up in the latest canary. Two steps executed exactly once, survived a deliberate mid-episode Worker interruption, and then failed at the outcome boundary, where an application adapter derived the wrong store identity and Temporal faithfully retried the wrong envelope every fifteen minutes. The failure marker belongs on the adapter. Temporal preserved exactly what it was given, which is the job.

> A contributor now has to hold determinism rules, replay compatibility, fencing, and idempotency in their head to change orchestration code safely, and the deployment gains a server, a Worker, and a versioning discipline on every Workflow change. That is the real cost, and it is larger than the infrastructure.

> A maintenance job that does forty-four seconds of synchronous work every two hours did not justify any of that, and it stayed cron plus a lock. If a crash mid-operation leaves a question your own database cannot answer, the procedure deserves a durable owner. If a crash just means running it again next tick, it does not.

### 07 Go deeper

> The full article

> The history, the failed canary, the test map, and how the boundary was chosen.

> The annotated code

> The complete before and after source, annotated section by section, with linked upstream provenance.

### Code browser index

> Complete annotated source

> Eight full files show the pre-Temporal controller and recovery path, and the Workflow, Activity, bridge, and Worker code that replaced them.

> The complete before and after source for a coding-agent orchestration boundary rebuilt with Temporal's Go SDK.

> Each reader renders the complete source with IDE-style syntax colors. Select a line section to open its explanation directly beneath the code, or download the raw file from the reader. The before excerpts cite and link the exact public upstream revision they abridge.

### Code reader (per-file)

> Versioned before code: [source label]. These selected excerpts are abridged for reading; every omission is marked in the source.

(The guide copy, "How to read this file" / "Follow the execution boundary" /
"Click any line section to open its explanation...", and the footer copy are
reused verbatim from the existing research-agent code reader, not newly
authored.)
