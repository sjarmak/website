---
title: "Closing: each part decides what the next one can claim"
book: the-system-around-the-model
order: 19
part: 7
kind: closing
---

The most useful result in my own retrieval work was a disagreement between two instruments. Three retrieval measurements agreed that the tool had become much better at putting relevant repository evidence in front of the agent. The paired end-to-end reward across 370 tasks moved by +0.0349, and the first interval I put around that number likely understates the uncertainty and should not be read as a bound on it, because it resampled tasks that shared 73 repositories and 20 suites. Reading that one experiment took two parts of this book. The stage decomposition from Part IV located where the change had landed, and the resampling rule from Part I decided whether the end-to-end difference was a measurement at all.

The same dependency runs through the whole sequence. Measurement comes first, then grading systems, then isolation and recovery, then retrieval and context, then human review and accountability, then work allocation and cost. That order is not a difficulty ramp. Each part decides what evidence the next one is allowed to rely on, and a defect in an earlier part does not announce itself downstream. It arrives as a clean number.

## The order is a dependency chain

Part I sits under everything else because every later practice is adopted or rejected through a comparison. A difference has to clear the local run-to-run spread, and the design has to have been capable of resolving a difference of that size, before any downstream verdict describes the system rather than the draw. Nineteen taught practices in the later parts execute a method taught in Part I. Dropping that dependency does not remove the requirement; it leaves the requirement unstated.

Part II turns those measurements into daily verdicts. A model grader, a consensus vote, and a proxy score are instruments, and Part I is how their errors are estimated. Skalse et al. ([2022](https://arxiv.org/abs/2209.13085)) established the structural reason no single one of them can be the last word. Over the set of all stochastic policies, two rewards can be mutually unhackable only when at least one of them is constant. A grading system therefore returns a verdict at an operating point under a stated distribution, and the layering exists because that verdict can be optimized against.

Part III decides whether the record those verdicts are computed over is evidence at all. Four ordinary conditions corrupt that record in ways no later statistic repairs. An agent can hold one identity that reaches both the primary data and its backups. A run can die without a durable account of which steps completed. A trace can fail to separate a tool dispatch from its external commitment, and a quarantine policy can remove the failed runs before anyone reads them.

Preservation is necessary and it is not sufficient. Zhang et al. ([2025](https://arxiv.org/abs/2505.00212)) handed already-annotated failure logs from 127 multi-agent systems to the best automated attribution methods available, and the best of those identified the decisive step 14.2 percent of the time. A preserved record supports an explanation. It does not supply one.

Part IV decides what the model saw. A failure cannot be assigned to the model until the evaluation records whether the needed evidence existed in the index, was returned, survived the context cutoff, and described the current repository state. Stale context is the sharp case, because it replaces an ordinary miss with a confident implementation against an interface that no longer exists.

Part V treats review capacity as a finite input to the system. Its allocation depends on the monitors calibrated in Part II, and its interfaces decide whether challenging a claim costs less than accepting it. A gate that cannot stop the action it names records assent and nothing else.

The decisions in Part VI can only be settled from the artifacts the earlier parts produced. A routing or scheduling policy is tested by replaying recorded arrivals with the arrival sequence held fixed, and by making a cheap rule compete for the same work. That discipline appears at both ends of the book. Kapoor et al. ([2024](https://arxiv.org/abs/2407.01502)) found that retrying the model matched more elaborate architectures on a function-level coding benchmark at a fraction of their inference cost. Chen et al. ([2016](https://arxiv.org/abs/1608.07617)) proposed cheap random sampling as the baseline a search-based method has to beat before it earns adoption.

The chain also constrains what a repair can accomplish. Compensating for a weak link with machinery from a later part is the most expensive mistake available here, and it is an easy one to make, because the later machinery is usually the cheaper thing to deploy. More samples do not repair a task distribution that omits the work the deployed system will meet. More judges do not repair a rubric whose categories two experts apply differently. More agents do not repair a retrieval boundary that treats an empty result as authoritative, and more context does not repair a run that has already lost its specification. In each case the added component is then measured by an instrument the earlier part was supposed to have fixed.

## The support is thinnest where the urgency is highest

The evidence behind these six parts is uneven, and the unevenness runs against operational urgency. Strong-graded items account for 59 percent of the evidence in Part I and 53 percent in Part IV. In Part III, the thinnest part in the book, they account for 14 percent, and in Part VI for 22 percent. Chapter 7, on containment, injection defenses, and independent verification, carries no strong-graded evidence and no research-literature item of any class; its support is incident reports and single-organization accounts.

Those are also the chapters a reader with production write access needs first. Two of Chapter 7's three practices were chosen independently by all three selection lenses while their evidence stayed at the floor. In this corpus, urgency and evidence strength were close to uncorrelated, and reporting that is better than letting chapter length imply a support the record does not have.

I would have preferred to write a Part III backed by controlled comparisons. The field has produced design arguments and incident reports instead, and wrapping them in more hedging would have hidden the same gap under more words. The thin chapters are therefore shorter, state their limit before recommending anything, and prescribe an observation rather than a number.

Two observations would change those chapters. The first is a controlled comparison of isolation designs scored against a measured incident rate rather than against a set of self-reports. The second is a recovery benchmark for agent runtimes with a published fault menu, run at several kill placements and across more than one software version. Neither is exotic. Both are within reach of a team that already operates a fleet and keeps its traces, which is the same instrumentation the procedure below asks for.

Read Part III and Part VI as design arguments carrying named failure checks. A recovery path is often credited to an architecture diagram rather than to an injected fault, and 'fault tolerant' then describes the drawing. Every prescription in those parts resolves to something a reader can run against a live system. Kill a worker between an external effect and its completion record. Remove a gate's dependency inside a contained environment and observe whether the action still reaches durable state. Replay recorded arrivals against a trivial rule and see which one wins.

A design argument that cannot be reduced to a check of that kind has not been stated precisely enough to test.

## What this book does not settle

Almost none of the numbers here are settings to adopt. No refresh cadence for a repository index appears in the literature reviewed for Chapter 12, and that is a gap in the record rather than a value withheld. There is no universal kappa threshold that converts labels into truth, no k for a release gate, no context cap, no routing cost ratio, and no re-solve cadence for a fleet. Each is a local quantity fixed by a workload, a failure cost, and a review capacity.

A second group of open questions concerns transfer. Matching topology to task shape remains unvalidated for the repository-scale coding work this book is about, and the strongest result behind it was measured on short-form question answering, mathematics, and function-level code. The compaction results come from app, office, and question-answering agents. Most of the oversight evidence predates long-horizon agents and was collected on people accepting single suggestions. No controlled result in the reviewed set shows that a dynamic dependency graph beats a well-designed fixed schedule.

A third group is unmeasured. None of the evidence behind the release-test chapter estimates the gap between a public benchmark result and production reliability, so no conversion factor is available. The stale-context result rests on 17 curated samples and two models, which establishes a direction and no effect size for another codebase. Deletion propagation through a derived memory layer is close to unmeasured across the reviewed record.

A fourth question is how long any of this stays true. Several results here are capability snapshots: the context length at which a model still performs reliably on a task family, the share of decisive steps an automated attribution method identifies, the localization accuracy of a trace reader. Those will move with model releases, and a book that reported them as constants would age badly. The structural results are the ones I expect to survive. A single run is one draw, an optimizable score can be optimized against, an identity that reaches both the primary data and its recovery material defines one failure domain, and a component that never executed cannot have caused the outcome.

What replaces the missing constants is a local measurement, and each chapter names the specific one. The recurring set is short. Measure the run-to-run spread on the workload before crediting a delta. Measure the effective context length of the weakest task that has to work reliably, and the contribution of each retrieval lane on the operated corpus. Measure class-specific grader rates at the deployed threshold, and the queue volume a monitor's false-positive rate produces at the actual base rate. Report the cost of an accepted result rather than the token bill.

The companion catalog indexes all 192 practices, arranged under the chapter whose mechanism each one extends. Read the chapter first, then look beneath it for the variant that fits your constraint. A compact entry cannot repeat the chapter’s full treatment of the mechanism, the evidence class, and the failure boundary, and that reasoning is what decides whether a variant transfers. Entries marked as thin-support asides are leads for investigation, kept out of the taught set because their support does not justify a recommendation.

## What to run first

The sequence below composes the closing procedures of several chapters into one pass through a system you already operate. It fits inside a week, and it produces the records the rest of the book depends on. Run the steps in order, because the later ones consume what the earlier ones preserve.

1. Take the most recent comparison you made on the strength of one number. Rerun both arms at least three times on the same items, keep the per-item record, and read the spread before reading the difference. A delta that stays smaller than the measured spread stays uncredited.

2. Add the inexpensive arm you skipped. Run the base model directly, then with one retry under a failure signal the deployed system can observe. Report accuracy and cost as two coordinates, and store the pricing snapshot beside the token counts.

3. Inventory one live agent identity from the running process rather than from the architecture diagram. Enumerate every destructive action it can reach without a fresh human decision, follow the delegation edges, and check whether one credential reaches both the primary data and its recovery path. Then attempt the prohibited write under the ordinary identity and require the denial from the enforcing system.

4. Verify one recent completion claim against the workspace or the system of record. Compare the revisions, rerun the relevant check, and keep the attempt identity with the result. Any discrepancy becomes the first test case for the resume and review path.

5. Read the last twenty failed runs end to end and annotate the first upstream failure in each. The first question the trace cannot answer is an instrumentation defect. Add the missing state reference, ordering relation, or identity, then version the schema and keep the old runs decodable.

6. Write the promotion rule before the next release comparison. Record the success floor, the cost ceiling, the repeat count, and the condition under which the mechanism counts as having actually run. Then run the comparison against a stored baseline on the same task versions.

Each step leaves an artifact the next decision can be challenged against. A distribution replaces a score. Two coordinates replace one. A denial issued by an enforcing layer replaces an assurance about permissions, and a diff with a rerun replaces a completion claim. A labeled failure corpus and a threshold fixed in advance replace a recollection of how the last release went.

None of those artifacts certifies that a system is reliable. They make the next reliability claim checkable by someone who did not make it. Begin with step one this week, on the comparison you are currently most confident about, and keep the per-item record even when the rerun agrees with you.

## Sources and evidence

No evidence is introduced here. Each identifier below is carried by the chapter named, and the class and strength come from that chapter's record.

- lit/strong: Skalse, Howe, Krasheninnikov & Krueger (2022). Defining and Characterizing Reward Hacking. NeurIPS 2022. arXiv:2209.13085. Chapter 6, `layer-signals-beyond-single-proxy`.
- lit/strong: Zhang, S., et al. (2025). Which Agent Causes Task Failures and When? On Automated Failure Attribution of LLM Multi-Agent Systems. ICML 2025. arXiv:2505.00212. Chapter 10, `keep-humans-in-failure-attribution`.
- lit/directional: Kapoor, Stroebl, Siegel, Nadgir & Narayanan (2024). AI Agents That Matter. arXiv:2407.01502. Chapter 2, `report-cost-accuracy-pareto`.
- explorer/strong: Chen, J., et al. (2016). Sampling as a Baseline Optimizer for Search-Based Software Engineering. arXiv:1608.07617. Chapter 18, `replay-traces-before-policy-changes`.

The part-level and chapter-level evidence shares restated above come from the structure of record, which recomputed them from the catalog: Part I 19 of 32 strong, Part III 4 of 29, Part IV 20 of 38, Part VI 6 of 27, and Chapter 7 at zero strong items with no literature item of any class.
