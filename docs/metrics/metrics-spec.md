# Measurement spec

Working document, 2026-08-01. Not a public artifact. Every "computable today"
claim below names the column or command it rests on, and was run read-only
against the live store and the live Temporal server while this was written.

## What this document is for

Section 4 of `temporal-submission-split.md` proposes eight metrics and marks
five of them available today. That table is wrong in three places, and one of
the errors would publish a number that an inspection of the machine contradicts.
This spec replaces it. Each metric gets a definition precise enough to
implement, the data source, the computation, a verdict, and the instrumentation
it would need if the verdict is no.

## Status the numbers sit inside

Both facts, stated together, because either one alone misdescribes the system:

1. The canonical sample, work-item-to-agent orchestration, is proved by a
   bounded canary and runs in SHADOW mode.
2. The part running continuously in production is result delivery and
   acknowledgement, with `TEMPORAL_BEADS_MODE=shadow` and
   `TEMPORAL_OUTCOME_MODE=canary`.

Verified on the running workers, and visible in the workflow population: 58
`CoordinatorOutcomeWorkflow` executions against 3 `BeadOrchestrationWorkflow`
executions.

## Data sources

| Source | What it is | Access | Retention |
|---|---|---|---|
| Work store | Dolt SQL server holding four databases: `gc`, `gascity`, `gascity_dashboard`, `website` | Network client on the loopback listener recorded in the store's `sql-server.info` | Full history since 2026-04 |
| `events` table | One row per mutation, with `actor` and indexed `created_at`. `new_value` is `longtext` holding `{"id","status","metadata"}` | Same | Same |
| `issues.metadata` | `json` column. All Temporal and outcome state lives here under dotted keys, never in dedicated tables | Same | Current value only, overwritten in place |
| Temporal Event History | `maintenance` namespace on the local server | `temporal workflow list` / `workflow show` | **24 hours, archival disabled** |
| Watchdog audit | Append-only JSONL at `.gc/runtime/coordinator-outcome-surfacer.jsonl` under the city root | File read | Rotates at 1 MB |

Three properties of these sources drive most of the verdicts below.

**The work store is the only real archive.** It reaches back to April. Both
other sources are windows: Event History is one day wide by configuration, and
the audit file is a census of what was standing when a fingerprint last changed.

**`issues.metadata` holds current state, not history.** A field like
`gc.temporal.session_id` is a scalar overwritten in place. A query against it
returns exactly one value by construction and can never show a second. Anything
that needs a sequence has to come from `events`.

**`events.new_value` is `longtext`, not `json`.** `JSON_EXTRACT` fails on it
directly. Every query casts with `CAST(new_value AS JSON)` and pre-filters empty
strings with a `LIKE` guard, because the cast errors on the empty rows.

## Read-only enforcement

No script in this directory can send a write to the store. Stated precisely,
because the distinction matters: the guard runs in the client, so it constrains
this code, not the database. It is not a security boundary. The database-side
control is the credential, and these scripts should be run with a read-only
grant regardless.

- `lib/readonly.mjs` allows a statement to begin only with `SELECT`, `SHOW`,
  `DESCRIBE`, `DESC`, `EXPLAIN` or `WITH`; rejects mutating SQL keywords matched
  on word boundaries; rejects statement chaining so a second statement cannot
  ride along after a semicolon; and applies a default-deny allowlist over every
  `dolt_*` identifier.
- That last rule is the load-bearing one, and it replaced a denylist. Dolt
  mutates from inside a `SELECT`, so `SELECT dolt_purge_dropped_databases()`
  satisfies every other rule. An audit found four such escapes past the earlier
  denylist (`dolt_undrop`, `dolt_purge_dropped_databases`, `dolt_stash`,
  `dolt_remote`), one of them irreversibly destructive. Enumerating a vendor's
  mutating procedures is wrong by construction: it passes whatever the vendor
  adds next. The allowlist names the read-only surfaces instead, so an unknown
  `dolt_*` identifier is denied by default. `metrics.test.mjs` carries all four
  escapes as regression cases plus an invented future procedure name.
- `lib/dolt-client.mjs` connects to the already-running server as a network
  client and never opens the store directory. Running `dolt sql` inside a
  directory a live server holds can wedge the multi-agent system using it.
- The statement is passed as one argv element to a process spawned without a
  shell, so there is no interpolation layer to smuggle through.
- `temporal-metrics.mjs` allowlists three read commands (`workflow list`,
  `workflow show`, `operator namespace describe`) and has no code path that
  builds a start, signal, reset, terminate or delete command.
- `surfacer-audit-metrics.mjs` reads the watchdog's audit file and never invokes
  the watchdog binary, which is wired to notify and would send mail into a live
  system just to produce a count.

Every script exits 2 on an unreachable source and emits no numbers. An
unreachable store is never reported as a zero.

## Scrubbing

Work IDs, outcome IDs, store references, session identities, UUIDs, long hex
digests and absolute home paths are removed on the way out of every extractor,
so a raw run is safe to paste. The one permitted long identifier is the public
gascity revision `b78058917bc65846db89e1c3b25dc17269822483`.

One cost worth knowing before reading scrubbed output: the flagship failure
message renders as `outcome store ref "<store-ref>" does not match configured
store ref "<store-ref>"`, because both refs collapse to the same placeholder.
The scrubbed artifact proves the failure happened 88 times; it cannot show what
the mismatch was. Reader-facing prose has to name the two identities in words.
Where a breakdown by store is needed, `Pseudonymizer` assigns stable labels
(`store-a`, `store-b`) instead, because scrubbing a map key collapses every
store into one bucket.

---

# The eight metrics

## 1. Duplicate agent-session rate

**Definition.** Count of distinct agent sessions bound to a single (work item,
generation) pair. The failure it targets is a retry launching a second agent
into a worktree an existing agent already holds.

**Source.** `events.new_value`, extracting
`$.metadata."gc.temporal.session_id"` and `$.metadata."gc.temporal.generation"`,
grouped per issue and generation. Not `issues.metadata`, which holds one scalar
session overwritten in place and therefore returns 1 by construction.

**Computation.** `sessionsPerWorkGeneration()` in `beads-metrics.mjs`.

**Computable today: yes. Interpretable: no.**

Measured: 4 (work item, generation) pairs carry a recorded session, every one
with exactly 1 session. Zero pairs with more than one.

That zero is not evidence, for two independent reasons.

The failure being measured is a failure to record. A second agent launched by a
worker that then died would not necessarily write any session binding at all. An
observed count of one is equally consistent with no duplicate and with a
duplicate that was never recorded. The metric can only see duplicates that
survived long enough to be written down, which is close to the complement of the
population of interest.

There is also no before side. `gc.temporal.session_id` does not exist on the
pre-Temporal path. The nearest analog, `gc.session_name`, appears in 235 events
and likewise yields no work item with more than one distinct session, and it
fails for the same recording reason.

**Do not report a change in this number.** The row in the plan table should read
"computable, not interpretable".

**What would make it real.** An append-only session-binding record written by
both paths, one row per bind, carrying work ID, generation, session identity and
`bound_at`. A scalar field overwritten in place cannot express a duplicate no
matter how it is queried. That is a change to a live city and belongs to
Stephanie, not to this deliverable.

## 2. Stranded-claim rate

**Definition.** Two distinct measures, which the plan's single row conflates.

- *2a, claim-to-terminal duration.* Elapsed wall time from a `claimed` event to
  the first subsequent `closed` event on the same work item, plus the count of
  claims with no terminal close at all.
- *2b, recorded completion recoveries.* Work items whose completion the old path
  failed to record when it happened and a later sweep had to repair, carrying
  `gc.completion_recovered_at`, `gc.completion_recovery_reason` and
  `gc.completion_recovery_attempts`.

**Source.** For 2a, the `events` table, `claimed` joined to the earliest later
`closed` per issue. For 2b, `issues.metadata`.

**Computation.** `claimDurations()` and `completionRecoveries()` in
`beads-metrics.mjs`.

**Computable today: yes.** This is the only metric with a genuine before side.

Measured populations, all four stores, full store history:

| Store | Claims | With terminal close | No terminal close | Median claim-to-close |
|---|---:|---:|---:|---:|
| `gc` | 63 | 43 | 20 | 430 s |
| `gascity` | 609 | 551 | 58 | 633 s |
| `gascity_dashboard` | 152 | 138 | 14 | 402.5 s |
| `website` | 30 | 25 | 5 | 389 s |

Recorded completion recoveries, every one with reason `checkpoint grace
expired`: `gc` 16, `gascity` 9, `website` 1, `gascity_dashboard` 0. Total 26,
spanning 2026-07-18 to 2026-08-01.

**Read 2a carefully.** Claim-to-close is a distribution shape, not a stranding
measure. Its upper tail mixes work that genuinely took four days with work that
finished and was not recorded, and nothing in the two timestamps separates them.
The maxima (339,467 s in `gc`, 4,215,521 s in `gascity_dashboard`) are almost
certainly the second kind, but "almost certainly" is not a measurement.

**2b is the clean signal**, and it is the pre-Temporal path reporting its own
stranding in its own words. Its limitation is the shape of the record: it stamps
when the repair happened, not when the stranding began, so it yields a count and
a reason, never a duration. The twenty-hour incident is a duration only because
it was written down by a human at the time.

**Do not divide 2b by 2a.** They count different cohorts. 2b filters on
`gc.completion_recovered_at`, the time the repair sweep ran; 2a filters on claim
time. A repair recorded today routinely belongs to a claim made two weeks ago,
so the ratio assigns a numerator and a denominator from different populations.
Computed over the two windows in `baseline.md` this produces a five-fold
apparent regression with non-overlapping confidence intervals, none of it real.
The extractor deliberately reports the two as separate sections and does not
offer the ratio.

**Do not compute "per 1000 claims" either.** With 26 recoveries against 854
claims, scaling to a per-thousand rate invites a comparison the sample cannot
support. Report counts against their population.

**What the join would need.** Follow each claim forward to ask whether that work
item was ever repaired, assigning both to the window the claim opened in. Both
sides key on the issue, so the data supports it; it is not implemented.

## 3. Unacknowledged completed outcomes

**Definition.** Work items that reached a terminal or verified state with no
outcome envelope, meaning a completed piece of work whose result was never
delivered to anyone.

**Source.** The all-store watchdog's audit JSONL. `FindSilentOutcomes` in the
outcome store is a point-in-time scan that persists nothing itself, so the audit
file is the only durable trace.

**Computation.** `surfacer-audit-metrics.mjs`.

**Emitted per scan. Not retained as a series. Not a rate.**

The plan's entry, "already emitted, currently 0", is contradicted by a file on
disk. Measured now:

- 90 audit lines, resolving to **39 distinct findings** (38 silent-outcome, 1
  malformed candidate) across 3 stores.
- Reasons: `terminal without outcome envelope` 62 lines, `verified without
  outcome envelope` 26 lines, malformed 2 lines.
- Transition timestamps span 2026-07-31T00:51:24Z to 2026-08-01T14:23:57Z.

Lines exceed findings because a fingerprint change re-appends the entire current
finding set, so one work item recurs across lines while it stays standing.
Reporting 90 would inflate the count by a factor of 2.3. Report distinct
findings.

**Why it cannot become a rate.** The audit's append returns early when the
finding-set fingerprint is unchanged, and its encoding guard writes nothing when
the finding set is empty. A scan that found nothing leaves no record that it
ran. There is no denominator, no per-interval history, and no way to reconstruct
either. The file also rotates at 1 MB, so a long-running deployment silently
loses its oldest lines.

**What "currently 0" probably was.** A single store at a single moment, which is
a true and much smaller sentence than the one in the plan. The reviewer rated
evidentiary precision as a strength. A number that unravels on inspection costs
more than the gap it papers over.

**What would make it a rate.** The surfacer must write a row on every scan
including zero-finding scans, which means changing both the fingerprint dedup
and the empty-set guard. Live-city change, not this deliverable's to make.

## 4. Recovery time after Worker termination

**Definition.** Elapsed time from an Activity attempt failing or timing out to
the next attempt on the same Activity, on the agent-orchestration path.

**Source.** Temporal Event History, `maintenance` namespace.

**Computable today: no. This is a hard blocker, and the plan's "Yes, from
Temporal directly" is false as stated.**

Three independent reasons, each sufficient on its own.

**There is no data.** Across all 74 histories on the server,
`BeadOrchestrationWorkflow` shows 3 Activity tasks scheduled, 3 started, 3
completed, 0 failed, 0 timed out. Every attempt succeeded on its first try.
There is no interval to measure. The number is absent, not zero.

**The substrate expires.** `Config.WorkflowExecutionRetentionTtl` is `24h0m0s`
and `Config.HistoryArchivalState` is `Disabled`. Closed histories are deleted
after a day. Event History cannot answer any question about a window older than
24 hours, which rules it out as a retroactive source permanently, not just now.

**The worker-kill tests cannot supply it either.** They run against
`testsuite.StartDevServer` (an ephemeral per-test server) and the in-memory
`NewTestWorkflowEnvironment` / `NewTestActivityEnvironment`. Those histories are
never written to the long-running server. The one captured history fixture in
the implementation tree is a 20-event clean happy path with no failure and no
retry.

**What is computable, and is not this.** The failure-to-next-attempt gap on the
*outcome delivery* path, which is metric 4b below. It is real, it is good
evidence, and it measures something else entirely.

**What would make it real.** A scripted kill against the long-running server
during a `BeadOrchestrationWorkflow` Activity, with the history captured the
same day. That is the recorded demo the talk needs anyway, so the measurement
and the demo are one piece of work.

## 4b. Retry cadence on a durably wrong envelope (unlisted, and the best evidence found)

**Definition.** Seconds from an `ActivityTaskFailed` to the next Activity
attempt in the same history, plus the census of failure messages.

**Source.** Temporal Event History, and the committed snapshot at
`fixtures/history-2026-08-01/`.

**Computation.** `analyzeHistories()` in `temporal-metrics.mjs`.

**Computable today: yes, and snapshotted, which matters because 24-hour
retention would otherwise have deleted it.**

Measured over 74 histories:

- 95 `ActivityTaskFailed`, 11 `ActivityTaskTimedOut`.
- By workflow type: `CoordinatorOutcomeWorkflow` 94, `DoltRecoveryWorkflow` 1,
  `BeadOrchestrationWorkflow` 0.
- Dominant message, 88 occurrences: an outcome store reference derived from
  runtime city identity not matching the configured canonical store reference.
- Gap distribution, n = 92: min 30.0 s, median 900.03 s, mean 866.1 s, max
  1391.6 s.

A median of 900.03 seconds is 15.0005 minutes. That is a measured distribution
confirming the "retried faithfully every fifteen minutes" claim, which until now
rested on an operator's recollection.

**Two definitional cautions.**

The gap is measured between events in the same history without asserting both
belong to the same Activity, because the snapshot drops the `scheduledEventId`
linkage. The 30.0 s minimum is the visible cost of that: it is a different
Activity scheduled shortly after an unrelated failure, not a fast retry.
Measuring to the next `ActivityTaskStarted` instead gives n = 92, min 763.6 s,
median 915.1 s, max 1451.7 s, and the tighter minimum shows the conflation is
confined to the lower tail. The median is stable across both definitions, which
is the number the claim rests on.

The 15-minute Event History cadence and the roughly 40-second outcome-delivery
event burst visible in the work store are different mechanisms. Merging them
into one "retry interval" would be wrong.

**What this measures.** Retry backoff on a wrong envelope. Not recovery.
Nothing was repaired between attempts; the same wrong identity was presented
again, durably, on schedule.

## 5. Human interventions per completed work item

**Definition.** Coordinator dispositions per delivered outcome: how often a
person had to act for a completed item to reach a terminal, acknowledged state.

**Source.** None.

**Computable today: no.** There is no disposition counter. Acknowledgement is
recorded as a timestamp (`gc.coordinator_outcome.acknowledged_at`), which
records that an acknowledgement happened and not what kind it was, whether it
was prompted, or whether anything was retried by hand first. The plan's "Partly,
needs a disposition counter" is correct and is the only row in the table that
already states its own gap accurately.

**What would make it real.** A typed disposition on the outcome record
(acknowledged, corrected, escalated, abandoned) written at acknowledgement time.
Additive to the outcome store, and it needs a before-side equivalent to be worth
anything comparatively, which does not exist and cannot be backfilled.

## 6. Completion rate under injected failure

**Definition.** Fraction of injected-failure scenarios that reach a correct
terminal state, reported as a score rather than a pass/fail gate.

**Source.** The failure matrix and surrounding suites in the implementation
tree.

**Computable today: no, and this is harness work rather than a data gap.** The
scenarios exist and pass. They run as a boolean suite, so the artifact is "the
suite is green", not a completion rate. Turning it into a scored harness is a
build, and it produces a forward-looking number with no retroactive equivalent:
the pre-Temporal path has no failure-injection suite to score.

**What would make it real.** Run each scenario N times, record terminal-state
correctness per run, and report per-scenario completion with a confidence
interval. `wilsonInterval()` in `lib/stats.mjs` exists for that. Worth doing for
the forward claim; it will never produce a before-and-after.

## 7. Time from verified outcome to exact acknowledgement

**Definition.** Seconds from `gc.coordinator_outcome.delivered_at` to
`gc.coordinator_outcome.acknowledged_at` on the same outcome record. Both are
RFC3339Nano strings in `issues.metadata`.

**Computation.** `deliveryLatency()` in `beads-metrics.mjs`.

**Computable today: yes, and it is the cleanest number in the set. After-only.**

| Store | Delivered | Acknowledged | Pending | Median | Max |
|---|---:|---:|---:|---:|---:|
| `gc` | 28 | 16 | 12 | 162.1 s | 2104.4 s |
| `gascity` | 17 | 12 | 5 | 1080.3 s | 1672.2 s |
| `website` | 16 | 15 | 1 | 234.8 s | 502.0 s |
| `gascity_dashboard` | 0 | 0 | 0 | n/a | n/a |

n = 43 acknowledged pairs, 61 delivered, 18 still pending. Zero negative
intervals.

**There is no before side, and not because the data is missing.** The
pre-Temporal path had no delivery record and no acknowledgement record. It had
no concept of an outcome envelope at all. This metric describes the current
path; it cannot measure an improvement, and presenting it beside a blank column
would imply the old value was zero rather than undefined.

**Sample caution.** n = 43 spans one day of one deployment, with 18 outcomes
still unacknowledged. Those 18 are not censored at random: an outcome pending
now is more likely to be a slow one, so the median over acknowledged pairs is
biased low. Report it as a description of observed acknowledgements over a named
window, not as an expected latency.

## 8. Added infrastructure and latency cost

**Definition.** Worker resident memory, Event History bytes per episode, and
the delivery latency delta introduced by the outbox-to-bridge-to-Workflow hop.

**Source.** None collected.

**Computable today: no.** No process metrics are recorded, no history size is
sampled, and there is no instrumented dispatch path with and without the hop, so
there is no delta to compute. History bytes per episode is the one piece that
could be approximated from the snapshot, but the snapshot deliberately strips
payload bodies, so what it would measure is the size of the scrubbed artifact
rather than the size of the history.

**What would make it real.** Sample worker RSS on an interval; record
`historySizeBytes` from `workflow describe` at episode close; time the dispatch
path at both ends of the bridge. All three are additive collection, none is
retroactive, and the answer arrives no earlier than the day collection starts.

---

# Corrected plan table

Replacing section 4 of `temporal-submission-split.md`:

| Metric | Available today? |
|---|---|
| Duplicate agent-session rate | Computable, **not interpretable**. No before-side field, and an observed zero is absence of recording |
| Stranded-claim rate | **Yes.** The only metric with a real before and after |
| Unacknowledged completed outcomes | **Emitted per scan, not retained as a series.** The standing audit holds 39 distinct findings, not 0 |
| Recovery time after Worker termination | **No.** 24h retention, archival disabled, zero Activity failures on the agent path |
| Retry cadence on a durably wrong envelope | **Yes**, n = 92, median 15.0 min. Unlisted in the original plan and the strongest quantitative artifact available |
| Human interventions per completed work item | No. Needs a disposition counter |
| Completion rate under injected failure | No. Needs a scored harness |
| Time from verified outcome to acknowledgement | **Yes, after-only.** n = 43, one day, no before side |
| Added infrastructure and latency cost | No. Needs collection |

The sentence "Four of these are computable retroactively, which means a real
before-and-after is possible" should name the one metric that has both sides:
stranded claims. Three others are computable and have no before side, which is a
different claim.

---

# Running the extractors

```bash
# Work store. Requires the sql-server to be running; fails loudly if not.
node docs/metrics/beads-metrics.mjs
node docs/metrics/beads-metrics.mjs --window-start 2026-07-01 --window-end 2026-07-25 --label pre

# Temporal, from the committed snapshot. Reproducible.
node docs/metrics/temporal-metrics.mjs --from-snapshot docs/metrics/fixtures/history-2026-08-01

# Temporal, live. Capture on the same command or the reading is gone tomorrow.
node docs/metrics/temporal-metrics.mjs --snapshot docs/metrics/fixtures/history-$(date +%F)

# Watchdog audit census.
node docs/metrics/surfacer-audit-metrics.mjs

# Tests. Hermetic, fixture-based, no live connection.
node --test docs/metrics/metrics.test.mjs
```

Pass `--raw` to `beads-metrics.mjs` only for local inspection. Raw output
carries work IDs and store references and must not be pasted anywhere.
