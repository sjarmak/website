The most useful result in my retrieval work was a disagreement between two instruments. Three retrieval measures agreed that the tool had become much better at placing relevant repository evidence in front of the agent. The paired end-to-end reward across 370 tasks moved by +0.0349.

The first interval I reported around that difference likely understates the uncertainty and should not be read as a valid bound. It resampled tasks as though they were independent even though they came from 73 repositories and 20 suites.

Interpreting that experiment required two parts of this monograph. The stage decomposition from Part IV located where the improvement occurred. The resampling rule from Part I determined whether the end-to-end difference had been measured adequately at all.

The dependency chain introduced at the beginning therefore returns as the conclusion. A defect in an earlier layer rarely announces itself downstream. It arrives as a clean score, a confident verdict, or a plausible artifact.

## Each layer determines what the next may trust

Part I sits beneath the rest of the monograph because every later practice is adopted or rejected through a comparison. Before a difference can describe the system rather than one draw from it, the evaluation must measure local run-to-run variation and be capable of resolving an effect large enough to matter.

Nineteen practices developed in later parts execute a method introduced in Part I. Removing that dependency does not remove the requirement. It leaves the requirement unstated.

Part II turns measurements into operating verdicts. A model grader, consensus vote, and proxy score are all instruments, and Part I supplies the methods for estimating their errors. Skalse et al. ([2022](https://arxiv.org/abs/2209.13085)) establish the structural reason none can be the final authority. Across all stochastic policies, two rewards can be mutually unhackable only when at least one is constant.

A grading system therefore produces a verdict at an operating point under a stated distribution. Layering is necessary because any nonconstant verdict can become an optimization target.

Part III asks whether the record underlying those verdicts is evidence at all. Four ordinary failures can corrupt that record in ways no later statistic repairs:

- One identity can reach both primary data and its recovery material.
- A run can die without a durable account of completed work.
- A trace can fail to distinguish tool dispatch from external commitment.
- A quarantine policy can remove failed runs before anyone examines them.

Preserving the record is necessary and insufficient. Zhang et al. ([2025](https://arxiv.org/abs/2505.00212)) gave expert-annotated failure logs from 127 multi-agent systems to the strongest automated attribution methods they evaluated. The best method identified the decisive step in 14.2 percent of cases.

A complete trace supports a causal explanation. It does not generate one automatically.

Part IV determines what evidence reached the model. A failure should not be assigned to model reasoning until the evaluation records whether the required evidence:

- existed in the searchable corpus;
- was present in the current index;
- was returned by retrieval;
- survived ranking and context selection; and
- described the repository state being modified.

Stale context is the sharpest case. It converts an ordinary absence of evidence into a confident implementation against an interface that no longer exists.

Part V treats human review capacity as a finite system resource. Its allocation depends on monitors calibrated in Part II. Its interfaces determine whether challenging a claim costs less than accepting it. Its gates depend on the authority and evidence preserved in Part III.

A gate that cannot change the execution path records assent and nothing more.

Part VI depends on artifacts produced by every earlier part. Routing and scheduling policies are evaluated by replaying recorded arrivals while holding demand fixed and forcing sophisticated policies to compete against cheap alternatives.

That discipline appears at both ends of the monograph. Kapoor et al. ([2024](https://arxiv.org/abs/2407.01502)) found that retrying a model matched more elaborate architectures on a function-level coding benchmark at a fraction of their inference cost. Chen et al. ([2016](https://arxiv.org/abs/1608.07617)) proposed inexpensive random sampling as the baseline a search-based method should beat before earning adoption.

The dependency chain also limits what a repair can accomplish. Compensating for an earlier defect with machinery from a later part is among the most expensive mistakes available here, and it is easy to make because the later component is often easier to deploy.

More samples do not repair a task distribution that excludes production work. More judges do not repair a rubric that experts apply inconsistently. More agents do not repair a retrieval boundary that treats an empty result as authoritative. More context does not repair a run that has lost its governing specification.

In each case, the added machinery is evaluated using the instrument the earlier layer was supposed to repair.

## Operational urgency outruns the evidence

Evidence strength varies substantially across the six parts, and the pattern runs against operational urgency.

Strong-graded items account for 59 percent of the evidence in Part I and 53 percent in Part IV. They account for 14 percent in Part III, the thinnest part of the monograph, and 22 percent in Part VI. Chapter 7, covering containment, injection defenses, and independent verification, has no strong-graded evidence item and no direct scholarly evidence item. Its support comes from incident reports and accounts from individual organizations.

Those are also among the practices a reader with production write access may need first.

Two of Chapter 7’s three practices were selected independently by all three prioritization lenses while their evidence remained at the floor. Among the 52 practices ranked by the consequence lens, Spearman's rho between urgency rank and the presence of at least one strong evidence item was -0.004. The near-zero relationship is specific to that selected set and operational definition; it is not an estimate for the full field. Reporting the mismatch prevents chapter length or prescriptive language from implying support the record does not contain.

The available Part III corpus contains incident reports and architectural arguments rather than controlled comparisons. Additional repeated caveats would not change that evidence state. The methods section therefore establishes the general legend once, while the chapters retain the limitations that materially narrow a claim.

The thin chapters therefore follow three rules:

1. State the evidence limit before presenting the practice.
2. Avoid prescribing a numerical target the sources cannot support.
3. Reduce the recommendation to an observation a reader can make against a running system.

Two studies would materially change those chapters.

The first is a controlled comparison of isolation designs scored against measured incidents rather than self-reported confidence or demonstrations.

The second is a recovery benchmark for agent runtimes with a published fault menu, several kill placements, recurring failures, and recovery across more than one software version.

Neither experiment is exotic. Both are within reach of teams that already operate agent fleets and preserve their traces, which is the same instrumentation the operating protocol below requires.

Part III should therefore be read as a design argument carrying named failure checks. Part VI is more transfer-heavy still: it combines adjacent multi-agent results with observatory, compute-cluster, and search-based software-engineering research. Its scheduling and topology proposals are executable research questions for coding-agent fleets, not established production effects.

The prescriptions in those parts resolve to executable observations:

- Kill a worker between external commitment and the durable completion record.
- Remove a gate dependency in a contained environment and observe whether the action still reaches durable state.
- Attempt a prohibited write with the ordinary identity and require denial from the enforcement layer.
- Replay identical arrivals under a candidate scheduler and a trivial baseline.
- Verify that a configured multi-agent mechanism actually entered the execution path.

A design argument that cannot be reduced to a check of this kind has not yet been stated precisely enough to test.

## What remains local or unresolved

Almost none of the numerical values in this monograph are settings to adopt.

The reviewed literature provides no universal refresh cadence for a repository index. That is a gap in the evidence, not a value withheld. There is no universal kappa threshold that turns labels into truth, no universal repeat count for a release gate, no context limit, no routing cost ratio, and no fleet re-solve cadence.

Each is a local quantity determined by:

- the operated workload;
- the consequence of failure;
- the available review capacity;
- the deployment configuration; and
- the smallest difference that would change the engineering decision.

A second group of open questions concerns transfer.

Matching topology to task shape remains unvalidated for the long-horizon repository work this monograph addresses. The strongest supporting result was measured on short-form question answering, mathematics, and function-level code.

The compaction results come from app, office, and question-answering agents rather than coding agents. Most oversight evidence predates long-running agents and concerns people accepting individual suggestions. No controlled result in the reviewed set shows that a dynamic dependency graph outperforms a well-designed fixed schedule for repository work.

A third group remains largely unmeasured.

No evidence item behind the release-test chapter estimates the gap between a public benchmark score and production reliability, so no conversion factor is available.

The stale-context result rests on 17 curated examples and two models. It establishes the direction of the failure without estimating its magnitude in another codebase.

Propagation of deletion through summaries, embeddings, caches, and graph edges remains close to unmeasured across the reviewed memory literature.

A fourth question is how long any capability result remains current.

Several measurements in this monograph are snapshots:

- the context length at which a model remains reliable on one workload;
- the fraction of decisive steps an attribution method identifies;
- the localization accuracy of a trace reader;
- the cost-performance frontier of a model pool; and
- the failure rate of a particular grader at one threshold.

These values will move with models, harnesses, and workloads. They are reported as dated measurements rather than durable constants.

The structural findings are more likely to persist:

- One run is one draw.
- An optimizable score can be optimized against.
- An identity that reaches both primary data and its recovery material defines one failure domain.
- A stale artifact can remain fluent after losing authority.
- A component that never executed cannot have caused the outcome.
- A person without evidence or intervention power does not control the action.
- A schedule computed for obsolete state is not operationally optimal.

Local measurement replaces the missing constants. Each chapter names the observation its decision requires. The recurring set is small:

- Measure run-to-run variation before crediting a delta.
- Measure the effective context length of the weakest task that must remain reliable.
- Measure the unique contribution and failure state of each retrieval lane.
- Measure class-specific grader rates at the deployed threshold.
- Convert monitor false-positive rates into expected queue volume at the actual base rate.
- Measure cost per accepted result rather than model-call cost alone.
- Preserve the configuration, policy version, and evidence behind each result.

The companion catalog indexes all 192 practices beneath the chapter whose mechanism each extends. Read the chapter before selecting a variant. A compact catalog entry cannot reproduce the chapter’s treatment of evidence class, causal boundary, operating assumptions, and failure mode. That reasoning determines whether the variant transfers.

Entries marked as limited-support notes are leads for investigation. They remain outside the developed set because the evidence does not justify presenting them as recommendations.

## Run the dependency chain once

The following sequence combines the closing procedures from several chapters into one pass through an existing system. It is designed to produce the records on which later decisions depend.

Run the steps in order. Each one creates evidence consumed by the next.

### Reopen one comparison you trusted too quickly

Choose the most recent decision made largely from one aggregate number. Rerun both conditions at least three times on the same items. Preserve the per-item outcomes and inspect the run-to-run spread before interpreting the mean difference.

A delta that remains smaller than the measured spread remains uncredited.

The output is a distribution and a paired record rather than one score.

### Add the inexpensive baseline you omitted

Run the base model directly. Then run it with one retry using a failure signal the deployed system can actually observe.

Report quality and cost as separate coordinates. Preserve the model, harness, prompt, pricing snapshot, token counts, tool use, and retry condition.

The output is a comparison capable of showing whether added architecture beats a cheap alternative.

### Audit one live capability boundary

Begin from the running process rather than the architecture diagram. Enumerate every destructive action the ordinary identity can reach without a new human decision. Follow delegated services, credential-minting paths, mounted filesystems, and policy-changing endpoints.

Determine whether one reachable identity can affect both primary data and the material required to recover it.

Attempt one prohibited operation with the ordinary identity and require the denial from the enforcement layer. When a narrow escalation path exists, verify that it permits the intended operation while adjacent destructive actions remain denied.

The output is an observed capability boundary rather than an assurance about permissions.

### Verify one completion claim against state

Choose one recent claim that an agent completed work. Compare the starting and ending revisions or read the relevant system of record. Inspect the artifact and rerun the check that would make the claim true.

Preserve the attempt identity, workspace identity, command, result, and any discrepancy.

The output is an independently observed state transition rather than a self-report.

### Read twenty failed runs end to end

Include apparent successes whose verification was skipped. Assign one primary label to each case: the first upstream failure that materially changed its path to success.

Do not force attribution when the trace lacks the required evidence.

The first ordinary causal question the trace cannot answer becomes an instrumentation defect. Add the missing state reference, event boundary, ordering relation, attempt identity, or outcome field. Version the schema and keep earlier traces decodable.

The output is a seed failure corpus and a trace schema shaped by real investigations.

### Fix the next promotion rule before running it

Before comparing the next release, model, topology, router, or scheduling policy, record:

- the success floor;
- the cost ceiling;
- the repeat count;
- the task-set and baseline versions;
- the mechanism condition proving the treatment ran; and
- any class-specific or fault-containment guard.

Run both configurations on the same task versions and preserve the per-case evidence.

The output is a decision that can be reproduced without relying on memory of how the result felt.

Each step replaces an assertion with an artifact:

- A distribution replaces a score.
- A cost-quality pair replaces one aggregate.
- An enforcement-layer denial replaces a statement about permissions.
- A diff and rerun replace a completion claim.
- A labeled failure corpus replaces anecdotes about what usually goes wrong.
- A threshold fixed in advance replaces a retrospective explanation for promotion.

None of these artifacts certifies that the system is reliable. They make the next reliability claim challengeable by someone who did not produce it.

Begin with the comparison you are currently most confident about. Keep the per-item record even when the rerun agrees with you.

## Sources and evidence

No evidence is introduced here. Each identifier below is carried by the chapter named, and the evidence grouping comes from that chapter’s record.

- Strong evidence: Skalse, Howe, Krasheninnikov & Krueger (2022). Defining and Characterizing Reward Hacking. NeurIPS 2022. arXiv:2209.13085. Chapter 6, `layer-signals-beyond-single-proxy`.
- Strong evidence: Zhang, S., et al. (2025). Which Agent Causes Task Failures and When? On Automated Failure Attribution of LLM Multi-Agent Systems. ICML 2025. arXiv:2505.00212. Chapter 10, `keep-humans-in-failure-attribution`.
- Directional evidence: Kapoor, Stroebl, Siegel, Nadgir & Narayanan (2024). AI Agents That Matter. arXiv:2407.01502. Chapter 2, `report-cost-accuracy-pareto`.
- Strong evidence: Chen, J., et al. (2016). Sampling as a Baseline Optimizer for Search-Based Software Engineering. arXiv:1608.07617. Chapter 18, `replay-traces-before-policy-changes`.

The part-level and chapter-level evidence shares restated above were recomputed from the companion catalog: Part I has 19 of 32 items grouped as strong, Part III has 4 of 29, Part IV has 20 of 38, and Part VI has 6 of 27. Chapter 7 has no strong or direct scholarly evidence item.
