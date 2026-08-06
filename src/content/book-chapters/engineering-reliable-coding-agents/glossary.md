---
title: "Glossary"
book: engineering-reliable-coding-agents
order: 20
part: 0
kind: glossary
---

**Ablation.** A comparison that removes, disables, or weakens one component while holding the rest of the evaluated system as constant as the design permits.

**Arrival trace.** An ordered record of work entering a system, including time, eligibility, resources, decisions, outcomes, and later review signals. It supports counterfactual scheduling replay.

**Blast radius.** The resources and effects that one identity, process, or failure can reach before a new authorization decision is required.

**Calibration.** Measurement of how an instrument's outputs relate to a reference outcome under stated conditions. Agreement is one calibration result; it is not correctness by itself.

**Compaction.** Replacement of a larger execution history or context with a smaller derived representation. Compaction is lossy unless the source remains available.

**Compliance theater.** A review or approval step that records assent but lacks the information or authority needed to change the consequential execution path.

**Corroborating evidence.** A case report, practitioner account, or convergent observation that establishes plausibility without estimating prevalence.

**Directional evidence.** Evidence that supports a mechanism, threat model, comparison design, or direction of effect without establishing the complete recommendation, magnitude, or broad transfer.

**Durable execution.** Execution whose control state survives worker or process loss so incomplete work can be resumed from recorded progress.

**Effective context length.** The longest tested context at which the weakest required task still meets its declared performance criterion. It can be shorter than the advertised token capacity.

**Evaluation harness.** The code, configuration, tools, permissions, prompts, task versions, and graders that turn a system under test into recorded outcomes.

**Fail-open gate.** A gate whose error, timeout, or missing evidence permits work to continue. A fail-closed gate blocks or escalates instead.

**First upstream failure.** The earliest event in the observed causal chain that the available trace can support as necessary to the downstream failure.

**Grounding.** Connection of a claim or decision to evidence outside the producing model's self-report, such as repository state, tool output, execution results, or independent review.

**Idempotency key.** A stable identity attached to an external effect so a repeated delivery can return or reconcile the original result instead of repeating the effect.

**Independence key.** An identifier that groups sources or records sharing one originating incident or claim, preventing repeated retellings from being counted as independent corroboration.

**Indirect prompt injection.** Instructions embedded in retrieved or tool-supplied content that attempt to redirect an agent beyond the authority or purpose of the retrieval.

**Inter-rater reliability.** The reproducibility of labels assigned by different reviewers. Cohen's kappa applies to two raters; Fleiss's kappa extends the calculation to more than two.

**Local artifact.** A record from an author-operated system used as an illustration or local measurement. It is not independent external evidence.

**Minimum detectable effect.** The smallest effect an evaluation design has a stated probability of detecting at its chosen error rates and sample structure.

**Monitorability tax.** The additional state, instrumentation, and review work required to make a more complex architecture diagnosable.

**Null or conflicting evidence.** A result that did not support the expected effect or that materially limits another claim.

**Operating point.** The threshold, workload, prevalence, and cost conditions under which a grader, monitor, or gate produces its reported error tradeoff.

**Paired design.** A comparison in which both systems receive the same evaluation items and analysis uses the within-item difference.

**pass@k.** The probability that at least one of (k) sampled attempts succeeds under an oracle capable of recognizing success.

**pass^k.** The probability that all (k) attempts succeed. It measures consistency rather than sampled coverage.

**Power analysis.** Calculation of the sample size or detectable effect implied by the variance, decision threshold, and chosen false-positive and false-negative rates.

**Proxy.** A measurable signal used in place of the outcome an engineering decision ultimately values.

**Quality assessment.** The review step that assigns an evidence group to a scoped source claim. The group applies to the claim, not the venue or paper as a whole.

**Recall@k.** The fraction of relevant items recovered among the first (k) results, relative to the relevant set defined by the evaluation.

**Reciprocal-rank fusion.** A rank-combination method that adds a decreasing score based on each result's position in multiple retrieval lists.

**Replay harness.** A system that re-executes recorded tasks, arrivals, or events against a candidate policy while preserving the comparison boundary.

**Saturation point.** The tested point after which additional context, samples, components, or compute no longer produce a decision-relevant gain.

**Strong evidence.** An on-claim controlled comparison, validated benchmark result, or comparably specific measurement within stated conditions.

**Temporal holdout.** Evaluation material created after the training or development cutoff relevant to the evaluated system and kept outside adaptation.

**Typed knowledge graph.** A graph whose nodes and edges carry explicit semantic types, provenance, and revision identity rather than only untyped similarity.
