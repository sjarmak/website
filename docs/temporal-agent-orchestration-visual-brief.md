# Temporal + Gas City visual systems brief

This brief is for the agent iterating on the Temporal agent-orchestration blog
post and its illustrations. It describes the actual failure boundaries, what
shadow mode means, where Temporal makes a promise durable, and which guarantees
remain the application's responsibility.

The central idea is that Gas City already made the work durable in Beads;
Temporal makes selected procedures around that work durable.

## Core conceptual model

There are three different things, and the diagrams must not blur them:

1. **Beads is the durable work ledger.** It owns task identity, status,
   dependencies, claims, generations, artifacts, review facts, outcomes, and
   receipts.
2. **Temporal is the durable procedure ledger.** Its Event History records
   which procedural steps occurred, what is running, what is waiting, which
   retry is next, and whether an exact acknowledgement has arrived.
3. **Agents and external systems perform effects.** Coding agents, shell
   commands, Git, GitHub, mail, tests, and database reads run in Activities.
   They remain nondeterministic and fallible.

A promise is only truly durable if it is represented in one of the two durable
records and can be re-driven after a crash. Before Temporal, many promises
existed only in process memory, a controller tick, a tmux session, a route
field, a mail message, or the expectation that a later repair scan would infer
what happened.

The shortest accurate framing is:

> Beads remembered the work. Temporal remembers the procedure around the work.
> Neither makes the coding agent deterministic, and neither automatically
> makes an external effect exactly once.

## What the pre-Temporal flow looked like

The simplified path was:

```text
Formula dependency becomes ready in Beads
  -> controller/order scans for readiness
  -> worker claims the bead
  -> dispatcher routes and wakes a session
  -> agent starts and performs work
  -> agent writes artifacts or pushes a branch
  -> completion is recorded in Beads
  -> controller/reaper advances dependent work
  -> mail or a nudge tells the Mayor
  -> Mayor verifies the result
```

This appears linear, but it was actually distributed across:

- Beads/Dolt transactions;
- controller reconciliation ticks;
- order schedules;
- dispatch and pool-demand logic;
- tmux and provider sessions;
- worker-local state;
- Git remotes and filesystem artifacts;
- mail and session nudges;
- orphan reapers and repair scans.

No single component owned the entire sequence. Every arrow between those
components was a possible fracture point.

### The important distinction

Beads could usually tell us facts such as:

- the task exists;
- it was claimed;
- an artifact exists;
- the branch was pushed;
- the task is closed.

It could not, by itself, preserve the exact procedure:

- whether an agent had already been launched;
- whether retrying would launch a second one;
- whether a notification was still owed;
- whether the current completion came from the current generation;
- whether step two was allowed to start;
- whether a human acknowledgement was still pending;
- what safe action should happen after a process crashed halfway through a
  handoff.

Gas City repaired many of these situations through Nondeterministic
Idempotence: a fresh agent or scan inspected durable facts and found another
valid route forward. That is valuable, but it is outcome-level recovery.
Temporal adds procedure-level recovery when the exact sequence itself is part
of the promise.

## The precise failure windows

### 1. Readiness existed, but delivery of that readiness was weak

A formula step could become ready in Beads, but starting its execution depended
on a later scan, hook, or controller tick.

The failure window was:

```text
Beads says "ready"
  -> process intends to dispatch it
  x process dies, misses the event, or loses its routing state
  -> no durable owner remains responsible for delivery
```

A later scan might rediscover the work, but only if the scan knew the right
query and the relevant fields were still intact.

The Temporal-backed path makes the state transition and a pending delivery
event one Beads transaction. A reconciler repeatedly reads that outbox and
uses Temporal Signal-With-Start with a stable Workflow ID.

If the reconciler dies after Temporal accepts the event but before the outbox
is acknowledged, it delivers the event again. Stable Workflow identity and
event-ID deduplication make that redelivery safe.

What Temporal does not do here:

- It does not make the bridge crash window disappear.
- It does not make a bad event identity correct.
- It does not remove the need for a level-triggered reconciler.

The improvement is that the remaining crash window becomes a safe redelivery
window.

### 2. A claim could be recorded without a reliably attached agent

Claiming work and launching or attaching the agent were separate effects.

Two opposite failures were possible:

```text
Claim recorded
  x crash before agent starts
  -> stranded claim with no worker
```

or:

```text
Agent starts
  x crash before session identity is recorded
  -> retry starts a second agent
```

These must be visualized as two adjacent failure windows. The current article's
handoff and recovery diagrams partially conflate them.

The Temporal path uses:

- a stable Workflow and Activity identity;
- a generation-fenced Beads claim;
- a claim token;
- start-or-attach session semantics;
- heartbeat checkpoints after attachment;
- the same session identity on retry.

Crucially, a heartbeat is not the creation-idempotency boundary. A Worker can
die before the first heartbeat. The session resolver must independently use
stable identity to find the already-created session instead of launching
another one.

The visual should therefore show:

```text
Stable execution identity
  -> fenced claim
  -> start OR find existing session
  -> persist/heartbeat attached session
```

Do not draw "heartbeat" as the mechanism that prevents duplicate launch. It
only helps resume after the session has been safely identified.

### 3. An old agent could finish after a newer generation had started

A task can be retried or reclaimed. The original agent may later wake up and
report completion.

Without a generation fence, the late completion can accidentally mutate the
current work:

```text
Generation 1 agent stalls
  -> generation 2 is claimed
  -> generation 1 reports success late
  x old result closes or advances generation 2
```

The Temporal integration carries the exact work ID, generation, Workflow
identity, and claim token through the Activity. Beads accepts completion only
if all those values still match the canonical claim.

Temporal records which attempt produced the result, but Beads remains the
authority that rejects stale writes.

This is an important "two locks" image:

- Temporal knows the procedural attempt.
- Beads enforces whether that attempt still has authority.

### 4. A real external effect could succeed before completion was recorded

We observed a particularly concrete handoff orphan:

```text
Remove bead from its current route
  -> push branch to origin
  x worker dies
  -> record completion and next route never happens
```

The resulting state was pathological:

- the branch existed on origin;
- the bead was not marked done;
- its route was empty;
- the pool demand probe could not find it;
- the orphan sweep also skipped it because it depended on the same route
  field.

Two completed-and-pushed beads remained stranded for roughly twenty hours.

Temporal can retain responsibility for retrying the Activity after the Worker
dies. But the external effect must be idempotent. Temporal Activities are at
least once; another Activity attempt may run after the push already succeeded.

The truthful visual is:

```text
Activity attempt 1:
  clear route -> idempotent push succeeds -> Worker dies

Temporal Event History:
  Activity not completed -> retry required

Activity attempt 2:
  same idempotency key -> find existing pushed branch
  -> record fenced completion -> advance route once
```

Do not draw Temporal as making `git push` execute exactly once. The
application's idempotent push and completion logic make the retry converge to
one result.

### 5. Completed work could fail to reach the coordinator

A closed bead was not the same thing as a delivered result.

Before OutcomeReady, the handoff often depended on mail, a nudge, or a
coordinator noticing a state change. These were attention signals, not an
acknowledged delivery protocol.

Failure variants included:

- the work completed but no notification was created;
- mail writing failed because concurrent writers contended on the local mail
  store;
- a message was queued but never handled;
- the coordinator restarted and lost its in-memory context;
- repeated messages looked like repeated executions;
- a message was marked read without a durable disposition;
- the source remained open even though it had a valid verified result, so
  "closed" was not a sufficient discovery rule.

OutcomeReady separates work completion from result delivery:

```text
Canonical terminal or verified result
  -> OutcomeReady envelope and outbox record
  -> stable CoordinatorOutcomeWorkflow
  -> delivery Activity
  -> durable wait
  -> redelivery timer while unacknowledged
  -> coordinator verifies evidence
  -> exact acknowledgement Signal
  -> canonical acknowledged receipt in Beads
```

The Outcome Workflow cannot complete merely because mail was sent. It completes
only after an acknowledgement matching the exact:

- store;
- outcome;
- work item;
- producer generation and token;
- delivery cycle;
- coordinator fence.

This is where Temporal adds one of its clearest promises: "keep this verified
result pending until the correct coordinator explicitly acknowledges this
exact delivery."

### 6. Correlation could point at the wrong execution or work object

We found cases where:

- metadata named a Temporal Workflow/Run that did not exist;
- an observer treated a formula step as though it were the source task;
- a valid child result was confused with whether the parent root should close;
- result evidence existed, but its relationship to the work graph was
  ambiguous.

Temporal provides stable Workflow/Run identity, Memo, Search Attributes, and
parent/child history. It does not automatically make the application's
correlation correct.

The integration must carry typed identities:

```text
city/store
root
step
generation
Workflow ID
Run ID
claim token
artifact references
```

The blog should show parent, step, and outcome as distinct objects. A completed
step may yield a valid result while the source root remains open or blocked.

### 7. Some terminal paths produced no result envelope

Different completion paths existed:

- direct worker completion;
- formula step completion;
- project lead verification;
- maintenance order completion;
- Temporal completion.

Some were covered by result production; others were not. A result could be
terminal and canonical yet still remain silent.

The repair was not "put all work in Temporal." It was to define a shared
OutcomeReady contract and compatibility adapters for each producer boundary,
plus an independent all-store scan that asks:

```text
Is there terminal or verified work with no corresponding outcome?
Did any store fail to answer the scan?
```

That watchdog deliberately remains outside Temporal. A reliability monitor
must be able to report when the Temporal-backed result path itself becomes
silent.

### 8. Closing acknowledged work could create another apparent outcome

Finalizing a source record creates another canonical transition. A naive
producer can rediscover that close as a new missing result and create a
recursive notification cycle.

The corrected finalization path atomically:

- verifies the existing acknowledged outcome;
- binds the operation to the pre-close generation;
- closes the source;
- preserves the acknowledged outbox and receipt byte-for-byte;
- records that the closing transition is not a new outcome.

This is an application contract, not something Event History invents
automatically.

### 9. Scheduled processes could fail without owning recovery

Some controller and maintenance processes could report failure, but no durable
procedure remained responsible for the next safe action.

A process supervisor can restart a process. It cannot answer:

- Did the previous attempt already perform the external effect?
- Which gate had passed?
- Was the system waiting on a human?
- Should it retry, reconcile, compensate, or stop?
- Which exact attempt owns the next action?

Temporal Event History can preserve those procedural decisions. But we also
learned not every schedule benefits from this machinery. A job doing 44 seconds
of work every two hours, with no long-lived state or event wait, is essentially
cron plus a lock.

The blog should not imply Temporal replaced the order system. We adopted it
only where a crash can interrupt a meaningful multi-step promise.

## What running Temporal in shadow means

Shadow is an explicit safety mode, not vague observation.

For Temporal-driven Beads execution, shadow mode:

- starts the Worker;
- polls the real Workflow and Activity task queues;
- registers the real Workflow shape;
- binds the real Activity name to a fail-closed shadow worker;
- gives reconciliation an empty ready-event source;
- does not connect the path to the canonical Beads mutation adapter;
- rejects any agent Activity before it can claim work or launch an agent.

So the infrastructure is alive, but the mutation bridge is physically blocked.

A useful visual is a transparent barrier:

```text
Temporal server and Worker: running
Task queues: polled
Workflow definitions: registered
Replay and deployment wiring: exercised

------------ shadow barrier ------------

Beads claim: blocked
Agent launch: blocked
Canonical completion: blocked
```

There are two independent mode switches:

| Beads mode | Outcome mode | Meaning |
|---|---|---|
| `shadow` | `shadow` | Temporal infrastructure runs, but neither agent execution nor result delivery mutates canonical state. |
| `shadow` | `canary` | Current continuous boundary: OutcomeReady delivery is active, but Temporal cannot claim production work or launch agents. |
| `canary` | `canary` | Only for a separately authorized bounded tuple with exact graph IDs, hashes, rollback assets, and failsafe. It is not general production activation. |

The word "shadow" should not imply that live mutation semantics have been
proven. It proves fail-closed wiring, polling, registration, replay
compatibility, and observation. A bounded canary is still required to prove
the external effects.

## Where the promises become durable

| Promise | Before | Temporal-backed mechanism | Still required from Gas City/application |
|---|---|---|---|
| A ready transition will be delivered | Later scan or controller tick | Transactional outbox plus Signal-With-Start | Level-triggered reconciliation |
| Redelivery will not start a second orchestration | Informal deduplication | Stable Workflow ID and event-ID deduplication | Canonical generation fence |
| Procedure survives Worker loss | Process-local state and repair inference | Event History and replay | Deterministic, version-safe Workflow code |
| Retry reuses one agent session | Session state could be lost before recording | Start-or-attach plus heartbeat checkpoint | Idempotent session resolution before first heartbeat |
| Late completion cannot overwrite newer work | Status checks varied by path | Exact attempt retained in history | Beads generation and claim-token enforcement |
| Dependent work waits for prior completion | Controller scans dependencies | Recorded Activity completion and parent/child topology | Beads remains dependency authority |
| A result remains owed until handled | Mail or coordinator attention | Outcome Workflow, durable timer, redelivery | Correct notifier and typed envelope |
| Acknowledgement is exact and inspectable | Read message or coordinator memory | Fence-bound acknowledgement Signal | Human evidence verification and canonical Beads receipt |
| External effects converge under retry | Often bespoke or absent | Temporal schedules retries | Stable idempotency key or destination-level deduplication |
| Recovery gates survive restarts | Runbook and human memory | Workflow wait, Update, and verified state transition | Human authorization and independent postcondition checks |

The highest-leverage abstraction is the explicit distinction between:

- **durable facts** in Beads;
- **durable procedure** in Temporal;
- **idempotent effects** in Activities.

Most illustration confusion disappears once those are shown as separate
layers.

## The latest canary shows where Temporal does not help

The latest two-step canary successfully proved:

- step one executed exactly once;
- step two did not start before step one completed;
- the Worker was deliberately interrupted mid-episode;
- replay/retry resumed the episode;
- one artifact was written per step;
- both generation-fenced Beads completions succeeded.

Then the OutcomeReady boundary failed.

The ready event used the runtime city identity `gas-city`. The canonical Beads
store identity was `city:ds-research`. The envelope builder incorrectly
derived:

```text
store_ref = city:gas-city
```

while the Outcome worker was configured to accept:

```text
store_ref = city:ds-research
```

Temporal durably preserved and retried the wrong envelope. Every delivery
attempt failed with the same explicit mismatch. It did not infer the intended
store identity or repair the contract.

This should be visualized as:

```text
Step 1 Workflow -- green --+
                           +-- successful Beads completions
Step 2 Workflow -- green --+
                                  |
                                  v
                        Outcome adapter
                   runtime city != canonical store
                                  x
                     Outcome delivery rejected
                                  ^
                                  | durable retry every 15m
                                  +-------------------------
```

Place the red failure marker on the application adapter between canonical work
and the Outcome Workflow, not on the Temporal server.

This is a strong illustration of "durable wrongness":

> Temporal can make a procedure durable. If the procedure contains the wrong
> identity or policy, Temporal will preserve and retry that mistake faithfully.

The canary was rolled back and contained. Its evidence remains preserved rather
than being rewritten into a success.

## What Temporal does not solve

The blog should explicitly say Temporal does not:

- make agents deterministic;
- determine whether code or evidence is correct;
- replace Beads as the work record;
- make Activities execute exactly once;
- make GitHub, Slack, mail, or filesystem effects idempotent;
- repair corrupt Beads/Dolt state;
- invent correct store, root, step, or Workflow correlation;
- guarantee that an external Signal will ever be emitted;
- replace level-triggered reconciliation;
- detect every missing OutcomeReady producer from inside the same delivery
  path;
- authorize pushes, merges, publication, or destructive recovery;
- make every cron-like task worth converting into a Workflow;
- eliminate replay/versioning obligations when Workflow code changes;
- make a single-node deployment survive loss of the whole host.

A particularly important rule is:

> Signals advance; queries repair.

An event can wake a Workflow quickly, but canonical state must remain queryable
so reconciliation can repair a signal that was missed or never emitted.

## Recommended illustration set

### 1. The scattered promise -- main before diagram

Use five swimlanes:

1. Beads ledger
2. Controller/orders/reapers
3. Dispatcher and sessions
4. Agent plus Git/filesystem
5. Mail and Mayor

Draw the ordinary flow left to right. Put fracture symbols on the edges, not
inside the components:

- ready but not delivered;
- claim but no agent;
- agent but no recorded session;
- push but no completion;
- stale completion from an old generation;
- completion but no notification;
- notification but no acknowledgement.

Caption:

> The facts survived in several stores, but no single durable execution owned
> the arrows between them.

### 2. Two durable records, one nondeterministic workshop

Use three columns:

- Beads: work facts
- Temporal: procedure history
- Activities: agents and external effects

Show bidirectional verification between Beads and Activities, but keep Event
History separate from task facts.

Caption:

> Beads says what is true about the work. Temporal says where the procedure is.
> Activities touch the unpredictable world.

### 3. Two adjacent crash windows

Zoom tightly into:

```text
Ready transition -> Workflow start -> fenced claim -> start-or-attach -> heartbeat
```

Mark:

- crash after Temporal accepts the ready event but before outbox
  acknowledgement;
- crash after session creation but before first heartbeat.

Show the separate protection for each:

- Signal-With-Start and event deduplication;
- stable start-or-attach identity.

This should correct the current tendency to present heartbeat as the
duplicate-launch protection.

### 4. Worker dies, promise survives

Use a timeline with three persistent rows:

- Temporal Event History;
- Beads claim/generation;
- agent session.

Then use two temporary Worker boxes:

```text
Worker A -> schedules Activity -> attaches agent -> dies
Event History persists
Beads fence persists
Agent session persists
Worker B -> replays -> reattaches -> one fenced completion
```

Do not draw the agent as replayed. Only the deterministic Workflow state is
replayed.

### 5. Finished is not acknowledged

Use a circular but terminating OutcomeReady flow:

```text
Verified result
  -> outbox pending
  -> Outcome Workflow
  -> delivery cycle
  -> Mayor verifies
  -> exact acknowledgement
  -> Beads acknowledged receipt
  -> Workflow completes
```

Show the redelivery loop only between delivery and waiting for acknowledgement.
Place the independent all-store watchdog outside the circle.

Caption:

> Delivery may repeat. The outcome identity does not. Completion requires an
> exact acknowledged receipt.

### 6. Shadow is a glass wall

Show the Worker and task queues operating normally above a translucent
barrier. Below it, gray out:

- claim;
- launch agent;
- complete Beads;
- external mutation.

Beside it, show OutcomeReady crossing through a separately opened gate in the
current `shadow/canary` mode.

This makes the current deployment boundary understandable immediately.

### 7. Temporal helps / application still owns

A boundary diagram should include more than the current two-column list.

Inside Temporal:

- Event History;
- deterministic ordering;
- durable waits and timers;
- retry scheduling;
- cancellation;
- acknowledgement state.

At the boundary:

- Activities;
- stable identity;
- idempotency keys;
- generation fences;
- typed receipts.

Outside Temporal:

- agent correctness;
- GitHub/mail/filesystem behavior;
- acceptance tests and review;
- Beads integrity;
- human authorization;
- independent watchdogs.

The boundary row is important. Idempotency and fences are not purely Temporal
guarantees, but they are how Temporal's at-least-once execution becomes safe.

### 8. Durable wrongness -- latest canary

Show the two-step episode succeeding, followed by the store-identity mismatch
and a visible retry loop.

This is likely the most memorable "what it didn't fix" illustration because it
demonstrates that the system was observable and safely contained without
pretending the end-to-end integration passed.

## Visual grammar

Use a consistent legend:

- Double outline: durable record
- Solid thick arrow: atomic transaction
- Dashed arrow: at-least-once delivery or reconciliation
- Circular dashed arrow: retry/redelivery
- Lightning bolt on an edge: crash window
- Lock/tag: stable identity or generation fence
- Hourglass: durable wait/timer
- Gray translucent barrier: shadow mode
- Human/checkmark: evidence-based acknowledgement
- Red edge, not red component: an integration contract failed between systems

Avoid:

- drawing Temporal as a box around the entire city;
- putting the agent inside deterministic Workflow replay;
- labeling Activities "exactly once";
- suggesting a sent message equals acknowledgement;
- showing Temporal and Beads as competing databases;
- showing the latest two-step canary as end-to-end green;
- using raw hashes and internal IDs in reader-facing art.

## Working sources

- Article:
  `src/components/temporal-agent-orchestration/Article.mdx`
- Existing figure component:
  `src/components/temporal-agent-orchestration/ConceptFigure.astro`
- Gas City architecture context:
  `/home/ds/gas-city/docs/Temporal/Temporal_GasCity_Integration_Context.md`
- Current publication handoff:
  `/home/ds/gas-city/docs/Temporal/README.md`
- Latest contained canary evidence:
  `/home/ds/gas-city/.gc/preflights/dr-ngmd.5-fresh-20260801T0334Z/abort-evidence.md`

