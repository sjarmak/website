# Baseline comparison design

Working document, 2026-08-01. Not a public artifact. Read `metrics-spec.md`
first; this document assumes its verdicts.

## The claim this is trying to support, and the one it can actually support

The plan wants "the pre-Temporal reconciler over the same window", supported by
four retroactively computable metrics. That framing does not survive contact
with the data.

Of the four, one has both a before and an after. The other three are computable
and one-sided:

| Metric | Before side | After side | Comparison possible? |
|---|---|---|---|
| Stranded claims | Yes, `events` back to April plus 26 recorded completion recoveries | Yes | **Yes** |
| Duplicate agent sessions | No such field on the old path | 4 pairs, all singletons | No, and the after side is uninterpretable anyway |
| Unacknowledged completed outcomes | No retained series | No retained series | No |
| Delivered to acknowledged | The concept did not exist | n = 43 | No, the before value is undefined, not zero |

So the defensible sentence is: **one metric has a before and an after, and it is
stranded claims.** Saying "four are computable retroactively, so a real
before-and-after is possible" implies four comparisons and delivers one.

The rest of this document designs that one comparison properly, then states what
would have to change for the others.

## The anchor data point

The old side has one incident recorded with a duration attached. Two work items
completed, their branches pushed to origin, and the worker died before recording
completion and the next route. The branch existed, the item was not marked done,
its route field was empty, and both the demand probe and the orphan sweep keyed
on that same empty route field. Neither could see the work. The items sat for
roughly twenty hours.

Its evidentiary value is specific and worth being precise about. It is a
**worked example of the failure mode**, showing that a completed-and-pushed item
could be invisible to both detectors simultaneously because they shared a
predicate. It is not a data point in a distribution. n = 1, the duration came
from a human noticing, and there is no systematic record of how many other
stranding episodes lasted how long. Two items in one incident is not n = 2
either; they failed together for one reason, so the independent unit is the
incident.

Use it as the illustration. Do not average it with anything.

## Defining the window boundary

### The event that separates the eras

The boundary is the first `CoordinatorOutcomeWorkflow` execution that delivered
a real outcome, because that is when a Temporal-owned procedure first took
responsibility for a completion path in this deployment. It is not the first
commit in the integration branch, not the first canary, and not when the worker
process started, since all three precede any change in observable behaviour.

### Why this boundary is harder than it looks

Two problems, both of which have to be stated wherever the comparison is.

**The boundary is not a switch, it is a partial overlay.** With
`TEMPORAL_BEADS_MODE=shadow`, the old path still owns agent mutation. The
post-boundary window is not "the system after Temporal". It is "the system with
the old path still running agent work, plus Temporal owning result delivery".
The canonical unit under study, work-item-to-agent orchestration, has not
changed hands at all. It is a bounded canary in shadow. A stranded-claim
comparison across this boundary therefore measures the old reconciler on both
sides of the line for the metric that matters most.

That is close to fatal for the naive framing, and it is better said out loud
than discovered by a reviewer. What the comparison can honestly examine is
whether outcome delivery moving to a durable procedure changed the rate at which
completions went unrecorded, which is a narrower and true question.

**The retention asymmetry.** The work store reaches back to April. Event History
reaches back 24 hours. Any comparison that needs both sources is limited to the
last day on the Temporal side, which is not enough for anything. Design the
comparison to use the work store on both sides, and treat Event History as
illustration only.

### The boundary, fixed

The earliest recorded outcome delivery across all stores is
**2026-07-31T11:47:31Z**, in `gc`. The other two stores with outcome records
follow the same day (`gascity` 13:38Z, `website` 18:02Z). The boundary is
therefore **2026-07-31**.

That date settles an important fact about the shape of the comparison: the post
window is one to two days wide, against a pre window of roughly two weeks. The
two arms are not comparable in length, and the shorter one is the one carrying
the claim.

### Proposed windows

Given the boundary and the recorded-recovery span (2026-07-18 to 2026-08-01),
the honest windows are short and badly unequal, and both facts have to be
reported.

- **Pre window:** 2026-07-18 to 2026-07-31.
- **Post window:** 2026-07-31 to 2026-08-02.

Run with explicit bounds so the windows are in the artifact rather than in
someone's memory:

```bash
node docs/metrics/beads-metrics.mjs --label pre  --window-start 2026-07-18 --window-end 2026-07-31
node docs/metrics/beads-metrics.mjs --label post --window-start 2026-07-31 --window-end 2026-08-02
```

Start is inclusive, end is exclusive. Both bounds go in the output document.

A wider pre window is available (the store reaches back to April) and it makes
the confound worse, not better, because the further back it reaches the less the
work resembles the post window. State the trade rather than silently picking the
window that flatters the result. The pre-registration discipline that matters
here: **choose the windows before computing the metric, write them down, and if
they change afterwards, say why.**

## What the naive comparison actually returns

Worth running before designing anything, because the result decides the tone of
everything after it. Running the two windows above and dividing recorded
recoveries by claims:

| Window | Claims | Recoveries | Rate | 95% Wilson interval |
|---|---:|---:|---:|---|
| pre, 2026-07-18 to 07-31 | 495 | 16 | 3.23% | 2.00% to 5.19% |
| post, 2026-07-31 to 08-02 | 63 | 10 | 15.87% | 8.86% to 26.81% |

The naive comparison says the post-Temporal window is **five times worse**, and
the intervals do not overlap.

That number is not real, and the reason it is not real is the entire argument
for this document existing. Three defects produce it, and each one would have
been invisible in a summary table.

**The numerator and denominator count different populations.** Recoveries are
filtered by `gc.completion_recovered_at`, which stamps when the repair sweep
ran. Claims are filtered by the claim event's `created_at`. A repair recorded on
2026-08-01 routinely belongs to a claim made two weeks earlier. Dividing one by
the other is a ratio of two different cohorts, and it inflates whichever window
happens to contain the sweep's catch-up work. This is a defect in the ratio, not
in either measurement.

**The post window is censored.** Two days of claims have had two days to be
repaired, and the pre window has had two weeks. Short windows over-represent
recent repair activity for the same reason a young cohort over-represents early
events.

**The post window contains the canary.** Deliberate canary episodes, the
store-identity mismatch, and the operator attention that came with both are
concentrated in exactly those two days. The post window is the least
representative two days in the entire record.

The correct conclusion from the table above is not "Temporal made stranding
worse". It is that **this comparison, computed the obvious way, produces a
confident wrong answer**, and a version of it would have shipped if the number
had happened to point the other way. Everything below is the design that avoids
that.

## The comparison, done properly

### Cohort matching, which the current extractor does not do

The first fix is structural and has to happen before any rate is computed. A
claim and its repair must be assigned to the **same** window, and the window
must be chosen by the claim, not by the repair.

Concretely: partition claims by claim time, then ask of each claim whether it
was ever repaired, at any later date. A claim from 2026-07-20 that was repaired
on 2026-08-01 belongs to the pre cohort, and its repair belongs there with it.

`beads-metrics.mjs` does not currently join these. It reports recoveries from
`issues.metadata` filtered by `gc.completion_recovered_at`, and claims from
`events` filtered by claim time, as two independent sections. That is correct
for describing each separately and wrong for dividing one by the other, and the
extractor should not be asked to produce the ratio until the join exists. The
join needs the recovered work item's identity carried alongside its claim event,
which is available (both sides key on the issue) and is simply not implemented.

**Until that join exists, do not compute a stranding rate at all.** Report the
two populations separately, as the extractor already does.

### What to compute, once cohorts are matched

Per window, per store:

1. Claims opened in window (the denominator, fixed by claim time).
2. Of those claims, how many were ever recorded as repaired (the numerator,
   following each claim forward regardless of when the repair happened).
3. Of those claims, how many still have no terminal close as of the read.
4. Claim-to-close distribution, as counts and quantiles.

### What to report

Counts against populations, with the window on the same line. Not a percentage
improvement.

```
pre  (2026-07-18 to 2026-07-31):  R_pre  repaired / C_pre  claims opened
post (2026-07-31 to 2026-08-02):  R_post repaired / C_post claims opened
```

If a rate is unavoidable, report it as a proportion with a Wilson interval
(`wilsonInterval()` in `lib/stats.mjs`) so the width sits next to the point
estimate. The intervals in the naive table above are the argument for this: 63
claims produce an interval eighteen percentage points wide, and a number that
wide should never be written as a single figure.

### The censoring correction that most people skip

A claim opened near the end of a window has had less time to be closed, so it is
more likely to appear as "no terminal close" for reasons that have nothing to do
with stranding. If the post window is shorter than the pre window, this biases
the post period toward looking worse; if the comparison is run soon after the
boundary, it biases toward looking better on the pre side.

Two ways to handle it, either acceptable if stated:

- **Truncate the observation.** Count a claim as stranded only if it stayed open
  longer than a fixed horizon T, and exclude claims opened within T of the
  window end. With a median claim-to-close of roughly 400 to 650 seconds across
  stores, T of 24 hours is generous and still excludes very little.
- **Report it as survival.** Fraction still open at T hours after claim, per
  window. This uses the late claims instead of discarding them and is the more
  honest treatment when n is small enough that discarding hurts.

`beads-metrics.mjs` computes the inputs for both; neither is implemented as a
verdict, deliberately, because choosing T is a judgment that should be visible
in the document rather than buried in a default.

The awkward arithmetic with the windows as they stand: a post window of two days
and a T of 24 hours discards half the post arm, leaving roughly 30 claims. A
smaller T keeps more claims and admits more short-lived open work that was never
stranded. There is no setting of T that makes 63 claims into an adequate sample,
which is the point rather than a reason to keep tuning T.

## Confounds

Ranked by how much damage each does to the comparison.

### 1. The canonical unit did not change hands (severe)

Already stated above and repeated here because it is the one that decides
whether the comparison means anything. Agent mutation is in shadow. The old
reconciler is still running the work items on both sides of the boundary. A
difference in stranded claims across the boundary is therefore *not* evidence
that Temporalizing bead-to-agent orchestration reduced stranding, because that
conversion is not in production. At most it is evidence about the outcome
delivery path.

Anyone presenting a before-and-after has to say which unit they mean, in the
same breath, every time.

### 2. Sample size (severe)

The populations available:

| Quantity | n |
|---|---:|
| `BeadOrchestrationWorkflow` executions, ever | 3 |
| (work item, generation) pairs with a recorded session | 4 |
| Acknowledged outcome pairs | 43 |
| Recorded completion recoveries, all stores, all time | 26 |
| Claims, all stores, all time | 854 |
| Days of Temporal-path data | ~1 |

Only the claim population is large, and it spans both eras with the same
reconciler running the work.

**What n would be needed.** The observed overall recovery rate is 26 recoveries
against 854 claims, or 3.04%. For a two-proportion test at alpha 0.05 and 80%
power, detecting a halving of that rate (3.04% to 1.52%) needs **1,511 claims
per arm, 3,022 in total**. Detecting a halving of a 1% rate needs 4,673 per arm.
Computed with `requiredNPerArm()` in `lib/stats.mjs`; re-run it against the
observed pre-window rate once the boundary date is fixed, since the illustrative
figure above pools both eras.

Against 854 claims accumulated since April across four stores, the comparison is
roughly a factor of four short in total, and worse per arm because the post
window is the shorter of the two. At the observed rate of work that is several
more months of accumulation before a halving would be detectable, and a smaller
true effect would need proportionally more.

The consequence is not that the measurement is worthless. It is that the
deliverable is a **measurement design plus a described failure mode**, not a
demonstrated improvement, and the article should say that in those words. A
correctly designed measurement that reports "n is a factor of four short, here
is the number required" is a stronger artifact than a percentage from 26 events.

### 3. Changing work mix (moderate to severe)

The four stores hold different kinds of work and their claim-to-close
distributions differ by an order of magnitude at the tail (max 2,309 s in
`website`, 4,215,521 s in `gascity_dashboard`). If the mix of stores or the mix
of work types shifted across the boundary, a difference in aggregate stranding
follows from the mix alone.

Mitigation: compute per store and report per store. Never pool across stores
into one number. If a pooled figure is wanted, it needs standardisation against
a fixed work mix, and with these n values the standardised estimate will have an
interval wide enough that reporting the per-store counts is more informative
anyway.

### 4. Changing agent versions and prompts (moderate, unmeasurable)

The coding agents doing the work changed across the window, as did their
prompts, the city's own orchestration code, and the rate at which work was
dispatched. None of this is versioned against the metric. An agent that got
better at finishing cleanly would reduce stranding with no help from Temporal.

There is no mitigation available retroactively. It goes in the limitations
paragraph, named specifically rather than as generic caution.

### 5. Detector changes (moderate)

The stranding measure depends on the sweep that records
`gc.completion_recovery_reason`. If that sweep's coverage changed during the
window, the recovery count changes without the underlying stranding changing.
Every one of the 26 recoveries carries the same reason, `checkpoint grace
expired`, which is consistent with a single stable detector, and that is
evidence but not proof.

Check before comparing: confirm the sweep's predicate and grace period were
unchanged across both windows. If they changed, the metric is not comparable and
the comparison should be abandoned rather than footnoted.

### 6. The observer is the operator (mild, worth naming)

The same person who built the integration decided when to run canaries, when to
return workers to shadow, and when to investigate a stuck item. Post-boundary
work received more attention than pre-boundary work. Attention reduces
stranding.

### 7. Window length asymmetry (severe, and it is the one that bit)

The pre window is roughly two weeks and the post window is two days. Every
quantity that accumulates with time (repairs recorded, claims closed, sweeps
run) is unequally sampled between the arms, and the direction of the resulting
bias depends on which quantity sits in the numerator. The worked example above
is this confound producing a five-fold spurious effect with non-overlapping
confidence intervals, which is what a severe confound looks like when nothing
warns you about it.

The only clean mitigation is to wait until the post window is as long as the pre
window, which is also what the sample-size calculation asks for. Truncating the
pre window to two days instead would balance the arms and leave both too small
to say anything.

## What to actually publish

Given the above, the defensible artifact is:

1. **The failure mode, with the twenty-hour incident as a worked example.** Two
   detectors sharing one predicate, and a completed item invisible to both. This
   is qualitative, specific, and true, and it is the strongest thing available.
2. **The claim and recovery populations**, per store, with windows stated, as
   counts. These are real, verified, and reproducible.
3. **The retry-cadence distribution** (n = 92, median 15.0 minutes) as the one
   quantitative distribution that is properly measured, clearly labelled as
   retry backoff on a wrong envelope rather than recovery.
4. **An explicit statement that the improvement is not yet measurable**, with
   the required-n calculation attached. This converts a gap into a result.
5. **The failed comparison itself**, if the article has room for it. Running the
   obvious before-and-after produces a five-fold apparent regression with
   non-overlapping confidence intervals, and all of it is cohort mismatch,
   censoring and window asymmetry. It is a concrete demonstration that the
   measurement was designed rather than assumed, and it costs one table. The
   reviewer asked for quantitative effectiveness evidence; showing why the
   available quantity does not support a claim is a more precise answer than a
   number that would not survive the follow-up question.

What not to publish: any percentage improvement, any per-1000 rate computed from
26 events, any stranding rate at all until the claim-to-repair cohort join
exists, any duplicate-session comparison, and any sentence implying the
bead-to-agent conversion is running in production.

## Making the other three comparable

Each needs a live-city change, and all three belong to Stephanie rather than to
this deliverable.

| Metric | Change required | Retroactive? |
|---|---|---|
| Duplicate sessions | Append-only session-binding record (work ID, generation, session, `bound_at`) written by **both** paths | No. Starts accumulating from the day it ships, and needs the old path instrumented too or there is still no before side |
| Silent outcomes | Surfacer writes a row on every scan including zero-finding scans, so a denominator exists | No |
| Delivered to acknowledged | Nothing makes this comparable. The old path had no envelope | Never |
| Recovery time | Scripted worker kill against the long-running server, history captured same day | No, and it expires in 24 hours each time |

The first two would give a real before-and-after in roughly the time it takes to
accumulate the required n, which the calculation above puts at longer than the
project has been running. That is the finding, and it should be reported as one.
