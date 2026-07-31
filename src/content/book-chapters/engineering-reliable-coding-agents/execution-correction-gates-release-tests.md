---
title: "Execution-based evaluation, correction gates, and release tests"
book: engineering-reliable-coding-agents
order: 4
part: 2
kind: chapter
number: 4
---

Mehta ([2026](https://arxiv.org/abs/2603.25764)) analyzed 1,750 coding-agent trajectories across 50 tasks and four models, and found a sharp separation between finishing and being correct. One model submitted work in 100 percent of its trials but resolved only 44 percent of the tasks when an external oracle checked the result. The silent semantic failures were often confident and consistent across repeated runs. Most of the models also changed code that was already correct. The scope of that study is directional: one author, a limited task sample, and no controlled estimate of failure rates across coding agents.

![Across 1,750 trajectories covering 50 tasks and four models, one model submitted work in 100% of its trials but resolved only 44% under an external oracle.](/book-figures/ch04-submission-resolution.svg)

One author's analysis of 1,750 coding-agent trajectories across 50 tasks and four models provides directional evidence without a controlled failure-rate estimate across coding agents.

Submission, consistency, and self-assessment all come from the process being evaluated. A model can repeatedly produce the same wrong patch, describe it with stable confidence, and end its turn cleanly. Those signals describe the trajectory, but they cannot establish that the repository changed from failing to working. Acceptance requires an observable state transition owned by a system outside the inference that proposed the change.

The support for this chapter is thin. The actions below therefore ask readers to execute and measure work on their own systems rather than adopt a reported threshold. Six evidence items support the three taught entries. Five come from explorer-class synthesis, and one comes from a controlled experiment. One of the three entries has no strong evidence item at all.

The practical unit is a gate that can refuse propagation. Candidate work runs under explicit constraints, the resulting evidence enters any correction attempt, and a compact set of real tasks is replayed whenever the system changes. Four adjacent controls sit in the companion catalog rather than here. An agent that submits on nearly every trial needs verified resolution scored separately from submission, with abstention probes among its tasks. A tool whose failure returns a plausible success string needs explicit detection of silent tool errors. A loop that keeps retrying needs a turn budget. A gate whose per-candidate verification cost governs how often it can run needs that cost in the accounting.

## Make execution decide whether work moves

Two explorer-class directional items support execution-gated evaluation, and neither is a controlled result. AgentForge, from Kumar et al. ([2026](https://arxiv.org/abs/2604.13120)), describes an execution-grounded evaluator that runs candidate work in resource-bounded, network-isolated sandboxes and gates propagation on the execution result. SWE-bench, from Jimenez et al. ([2023](https://arxiv.org/abs/2310.06770)), establishes executable repository repair as an evaluation form. The AgentForge preprint is unrefereed, rests on a single configuration, and reports one sample from each agent. Its headline number also conflicts with the published range for that setup and has not been independently replicated. I therefore omit the number.

Those limits constrain what the evidence establishes, and the mechanism is still worth testing. Run the artifact in a constrained environment, and let the observed result determine whether it can proceed.

A plausible patch is only text until a repository accepts it. It may compile and fail a type check, pass the visible test and fail a broader suite, produce the wrong output, or depend on undeclared state left in the working directory. Reading the patch identifies some of these defects. Executing it produces a result from the system the change is supposed to affect.

The gate changes the acceptance question. A confidence score asks the process that produced an answer to characterize that answer. An execution check asks a compiler, test runner, package builder, schema validator, or deployment probe whether a specified transition occurred. The result is an oracle only for the behavior the check observes. A passing unit test does not establish safe deployment, and a successful build does not establish semantic correctness. The observation is informative because it is produced causally downstream of the candidate artifact.

The architecture has three owners. The agent owns a proposed change. A sandbox controller owns the environment and the authority to start a run. A release controller owns the downstream state and changes it only after the sandbox returns an admissible result. Separating those roles prevents the producer from converting a claim of success into release state by writing a status field or selecting which checks to report.

A sandbox needs enough isolation to make its result interpretable. Start each run from a known repository snapshot, and mount only the inputs the task permits. Bound wall-clock time, CPU, memory, processes, and disk. Deny network access unless the task explicitly requires a named endpoint. Capture standard output, standard error, the exit status, resource termination, and declared artifacts, then dispose of the environment after the verdict. Reusing a mutable workspace is cheaper, but it allows one attempt to seed the next through generated files, caches, installed dependencies, or running processes.

Network isolation serves measurement as well as security. An unrestricted candidate can fetch an undeclared dependency, consult a changing service, upload material, or pass because a remote cache happened to hold the needed state. When a task genuinely depends on a network service, the evaluator should expose a controlled substitute or record the service version and its responses. Otherwise the same artifact can receive different verdicts for reasons unrelated to its behavior.

Resource bounds make nontermination an explicit outcome. A process killed after a declared limit belongs in a category distinct from a failed assertion and from an ordinary completion. The gate should record which bound fired. Parallel tests can trigger the memory bound, and a surviving child process can trigger the process or wall-clock bound.

The acceptance contract should be readable without inspecting the controller:

```text
command:       verify-change
expected:      exit status 0
required:      reports/test-results.json
               build/package.tar.gz
artifact rule: each required file exists and is non-empty
timeout:       12 minutes
network:       denied
```

The task definition fixes the command before the candidate encounters a failure. The expected condition names something more specific than 'works correctly'. The artifact rules remove a common ambiguity. A wrapper can exit successfully after skipping the operation that should have produced the evidence.

Exit status alone is often too weak. A test runner can return zero after discovering no tests, a report generator can write an empty file, and a shell pipeline can discard the failure status of an earlier command. A green exit status tells us that the process ended, not that it did the work. The controller should therefore validate the structure it relies on: an expected test count where that count is stable, a parseable result file, a package containing the required members, or a deployment probe tied to the candidate version. These checks are mechanical and require no guess about patch semantics.

Environment failure must remain distinguishable from candidate failure. If the sandbox image cannot be pulled, the verifier binary is absent, or the runner loses its workspace, rejecting the candidate as incorrect corrupts the score. If the gate passes when verification could not start, it corrupts release state. The correct outcome is an infrastructure error that blocks propagation and can be retried without crediting or blaming the candidate. Those errors should still be counted, because a run set thinned by repeated infrastructure failures no longer represents the intended sample of attempts.

State should move monotonically through the gate. A candidate begins unverified, receives an immutable run record, and becomes eligible for the next stage only when that record satisfies the contract. A later modification creates a new candidate identity and invalidates the prior verdict. When a verdict is keyed only to a branch name or a task identifier, changed work inherits evidence produced for different bytes.

In my own agent-workflow system, I reject any acceptance criterion that says only that a result 'works correctly', and the rejection happens at decomposition, before work begins. Each criterion has to name a command and an exit condition. An end-of-turn lifecycle check then inspects whether the declared output files exist and contain data. The check fires deterministically on every turn, but a model judges the filesystem and only advises. Refusal requires a command hook whose non-zero exit ends the turn. This example shows how a gate can begin in the task contract. It supplies no evidence for the general claim.

My own repository-scale benchmark suite uses a deterministic verifier as the primary scorer for every task. Additional judgment layers can surface suspicious trajectories, but they cannot replace or override the execution verdict. This design preserves one stable state transition even when the optional analysis changes.

Execution does not fit every task. Architecture proposals, interface critiques, threat models, and underspecified behavioral changes may have no executable oracle. Those tasks need a separate calibrated judgment lane, and Chapter 5 develops it.

Executable checks have a coverage boundary of their own. They can show that a candidate compiled, passed a selected suite, produced the required artifacts, and stayed inside its resource envelope. They cannot show that untested inputs, longer operating periods, or a different production topology will behave the same way. The narrowest downstream claim justified by the run is the one to record: test-eligible, build-eligible, or deployment-eligible.

The run record also supplies the input that correction requires. A failed command, an assertion diff, a resource termination, or an absent artifact gives the next attempt information that was unavailable when the candidate was produced. Without that new information, another pass through the model is repetition presented as diagnosis.

## Let failed runs change the next attempt

A retry that begins from the same prompt, the same evidence, and the same workspace state receives no new information about what went wrong. Sampling can produce a different answer without addressing the error. The model may repeat the premise that caused the failure, replace a correct intermediate step, or elaborate the same mistaken conclusion. Calling the second pass 'reflection' does not change the information available to it.

Huang et al. ([2023](https://arxiv.org/abs/2310.01798)) evaluated intrinsic self-correction on reasoning tasks with 2023-era models, and found that it often failed and sometimes reduced performance. When reliable external feedback was supplied, correction improved. This strong result concerns an earlier model generation and cannot estimate the behavior of every current coding system. Newer models may change the magnitude.

The safe operational default remains asymmetric. Another attempt is justified after an external result has changed the evidence, and not before.

An external result is produced outside the inference that generated the candidate. A test assertion, a compiler diagnostic, a tool response, a verifier verdict, or a deployment probe qualifies. A second model-generated critique does not qualify merely because it arrived in another call. Unless that critique has access to independent observations, it is another inference over substantially the same record.

The distinction concerns information. Suppose an agent changes a parser because it believes empty fields should be discarded. Re-reading the issue may reinforce that interpretation. A failing test showing that an empty field must keep its position introduces a counterexample. The next attempt can revise one specific assumption instead of searching an unconstrained space of possible mistakes.

This closes the loop the sandbox opened:

```text
candidate
    -> sandbox run
        -> pass: eligible for downstream gate
        -> fail: immutable result returned to correction step
            -> revised candidate
                -> new sandbox run
```

The correction step does not edit a verdict. It consumes the prior candidate and its run record, then emits a new candidate with a new identity. That separation preserves the history needed to distinguish recovery from repeated failure. It also prevents a revision from inheriting a passing result attached to earlier bytes.

The feedback should carry enough detail to discriminate the failed path without filling the next attempt with unrelated output. A useful package identifies the command, the exit status, the failed check, the relevant diagnostic, any resource termination, and the candidate version that produced it. When a test report is large, retain the complete report as an artifact and present a mechanically selected excerpt with a pointer to it. The full evidence then remains available when the excerpt omits the decisive line.

Selection should stay mechanical wherever possible. When a model decides which failures another model sees, it can drop evidence that contradicts its diagnosis or overweight a familiar error. Test frameworks already expose failed case names, assertion diffs, stack traces, and structured result records. Use those fields before asking another inference to summarize them.

The deployed system has to have access to the signal. Chapter 2 required the retry baseline to use a failure signal available in deployment; otherwise the experimental retry arm receives information the product will not have. Here the qualification becomes concrete. A retry is externally informed only when the signal comes from a tool or an observation the deployed loop can obtain at that point in its lifecycle.

This rule prevents a subtle comparison error. An evaluator may show the retry arm the hidden reference test that rejected a patch while the production agent sees only public tests. The experiment then measures correction under privileged supervision and says nothing about the deployed retry policy. Hidden checks can still decide the final score. Their diagnostics should enter the correction prompt only when production has an equivalent channel.

External feedback also has authority boundaries. A unit-test failure can justify another code attempt. A package-registry outage says little about the candidate and belongs in infrastructure handling. A deployment probe run against the wrong version can direct the model to 'fix' code that was never exercised. The controller must classify the observation as belonging to the candidate, the environment, or the evaluator before it spends another attempt.

Reliable feedback can still be incomplete. One failing test may expose a symptom and leave the cause ambiguous. A compiler diagnostic can point at a generated file when the source configuration caused the defect. The next attempt should use the signal to constrain a diagnosis before patching. Execution improves the correction loop by adding observations, but an observation need not contain the remedy.

Faulty feedback creates a directed failure mode. A mistaken expected value, a nondeterministic test, a stale fixture, or a verifier attached to the wrong artifact can move successive revisions farther from correct behavior. The loop can then produce apparently disciplined convergence around a bad oracle. Preserve the raw run record and the candidate lineage so an operator can audit whether the correction loop followed valid evidence.

Retry limits remain necessary even when every iteration receives a real signal. A sequence of different failing tests can consume an unbounded budget, and each patch can create a new failure surface. Stop conditions should distinguish a fixed attempt limit, repeated identical failures, infrastructure errors, and exhaustion of the gate's resource budget. Another attempt is justified only when the system has learned something that could change the outcome.

Correction belongs to the evaluation architecture rather than to any personality attributed to the model. The model proposes revisions. The surrounding system determines whether the evidence changed, whether the next attempt may run, and whether the resulting artifact can propagate. That division keeps working when the model, the prompt, or the correction language changes.

## Turn repeated trials into a release test

Support for the repeated-trial metric comes from one source. τ-bench, from Yao et al. ([2024](https://arxiv.org/abs/2406.12045)), is a public benchmark of interactive, multi-turn tool-use tasks with executable oracles, scored across repeated trials. The paper introduced pass^k and measured it. It did not measure two parts of the practice this chapter recommends: selecting a team's own tasks, and replaying them for each release. Those two elements are transfers from benchmark design into release engineering, and they reach beyond the measured finding.

The transfer begins with the workload set established at the end of Chapter 3. The golden set is a compact group of completed tasks whose initial repository states can be reconstructed and whose outcomes have unambiguous executable checks. For each task, keep the original request, the starting state, the allowed tools, the sandbox contract, and the verifier together as one versioned case. A merged patch can help reconstruct the expected behavior, but it should not appear in the agent's context.

Real tasks are preferable because they preserve local constraints that public suites cannot know. A repository may require generated files to stay synchronized, forbid a dependency, run a custom migration check, or treat a particular warning as release-blocking. Those details decide whether work is acceptable in that repository. A general coding score does not encode them.

The set should stay small enough to run repeatedly and to inspect when it changes. Its purpose is release discrimination across a controlled sample. Each case should represent a failure that would be costly if it reappeared, a workflow the system performs often, or an interaction whose state is hard to infer from a static answer. Ten nearly identical formatting fixes add less information than a smaller set spanning localization, modification, testing, and recovery.

Interactive work belongs in the set when the deployed system uses tools across turns. A static final patch does not show whether the agent read the right file, preserved state after a failed command, recovered from a tool error, or applied a later observation to an earlier plan. Replaying the trajectory under the same tool and turn constraints exposes sequencing and recovery failures that answer accuracy cannot observe.

Each case needs a stable identity and immutable versions. Changing the prompt, the starting repository, the tool contract, or the verifier changes the case, and that change should be stored as a new version. Rewriting history beneath prior scores can produce apparent improvement by removing a difficult test or exposing more of the solution.

Run each case more than once under the same release candidate. The repeated-trial statistics from Chapter 1 govern the experimental design and do not need rebuilding here. For release control, pass^k reports whether all k of k trials passed. An agent that succeeds intermittently is penalized, because a single failed trajectory breaks the sequence.

Those repeats describe the release candidate only when the configuration stays pinned across the whole sequence. Chapter 1's apparatus record, including the model version and the decoding settings, applies to every trial. Pinning does not by itself make the trials independent. Shared caches, mutable services, and provider-side incidents can correlate them, and that dependence changes which analysis the sequence supports.

That property matches unattended use better than selecting the best run. A best-of-k result records whether at least one trajectory succeeded when several were available. Pass^k records whether every trajectory in the required sequence succeeded. Neither metric is universally correct. The release test should use the one whose failure semantics resemble deployment, and a workflow that must complete reliably without supervision has the stronger reason to use pass^k.

```text
same k trials
    |
    +-> pass^k
    |     all k of k trials passed
    |     one failed trajectory breaks the sequence
    |
    +-> best-of-k
          at least one trajectory succeeded
          several were available

use failure semantics that resemble deployment

workflow must complete reliably without supervision
    -> stronger reason to use pass^k
```

The value of k comes from release policy rather than from the benchmark. A larger k makes intermittent failure easier to observe and makes the gate more expensive to satisfy. It also raises run cost and can let a small amount of evaluator noise dominate promotion. Choose k from the operational consequence of one failed run, the variance observed in pilot repeats, and the budget available for each release candidate.

The size of the set interacts with that choice. Under a strict all-trials rule, the probability that at least one case fails from evaluator noise alone grows with the number of cases, which is the multiplicity problem Chapter 1 assigns to claims spanning many tasks. A gate covering a large set therefore needs either a low per-case noise rate or an explicit rule for how many case failures block promotion.

The comparison unit is a fully specified system release. Record the model identifier, the prompt version, the tool definitions, the orchestration code, the sandbox image, the task-set version, the retry policy, and the verifier version. A change to any of them can change the trajectory distribution. A result labeled only by model name erases the components most teams alter between releases.

A release record can be mechanically small:

```text
release:         candidate-2026-07-28
system_digest:   6f5c...
task_set:        golden-07
repeats:         k
baseline:        production-previous
case_verdicts:   stored run records
promotion_rule:  recorded before execution
```

The digest binds the result to the evaluated configuration. The case verdicts link directly to the sandbox evidence. The promotion rule is written down before the first comparison. Otherwise the same observed regression can be accepted for a favored release and rejected for another.

Compare the candidate with a stored baseline using the same task versions and the same execution policy. Report per-case outcomes and run-to-run spread alongside the aggregate release verdict. A pooled pass^k value can conceal a complete regression on one critical task behind stable performance elsewhere, and a case-only view can be dominated by one noisy verifier. Both levels are needed to locate the change and to decide whether the promotion rule has been met.

The candidate and the baseline run the same cases, which makes the per-case outcomes paired by construction. Chapter 1's paired analysis therefore applies to them, and treating the two releases as independent samples discards a pairing the design already provides.

The baseline should stay executable. A table copied from a prior report is not sufficient, because environment images disappear, dependencies move, and tool services change behavior. Re-running a sample from the stored baseline separates candidate drift from evaluator drift. When the old release also fails under the new infrastructure, the comparison has lost its fixed reference and should block until the cause is understood.

My own search-visibility measurement project treats a model update as a deployment. It replays a fixed prompt corpus against the stored model-version baseline and combines a statistical comparison with an absolute change threshold, producing pass, warning, or failure exit states for continuous integration. The two controls serve different purposes. One suppresses sampling noise, and the other prevents a statistically detectable but operationally trivial change from deciding promotion. This illustration supplies no evidence for either threshold.

CodeProbe ([public repository](https://github.com/sjarmak/codeprobe)) applies a smaller consecutive-verdict gate. It blocks a release tag unless the two newest full-mode acceptance verdicts both pass. Those verdicts come from successive acceptance-loop iterations rather than from repeated trials of one pinned candidate. The rule is therefore an acceptance-iteration-history check and not a pass^k measurement. The local requirement of two consecutive passes is not a recommendation for another workload.

Golden sets decay even when their files do not change. Production work moves to new frameworks, repositories acquire new checks, tool interfaces change, and models can become adapted to repeatedly exposed cases. A set that once represented costly failures may end up measuring a narrow historical workflow. Treat it as production test data, with ownership, review, and retirement criteria.

Maintenance should preserve longitudinal meaning. Add a case when a production failure reveals a missing class of behavior. Silently replacing the old set makes its score incomparable with prior releases. Run an overlap period when feasible, report results on the shared cases, and establish a new baseline for the revised set. Retire a case when its workload no longer exists or its oracle no longer expresses the current contract.

Public benchmark results can inform case design and reveal task forms worth reproducing locally. They do not establish production reliability for a particular repository, tool policy, or release process. None of the evidence items supporting this entry measures the size of that public-to-production gap. I therefore cannot supply a conversion factor. The local release test answers a smaller question. Did this fully specified system preserve acceptable behavior on a controlled sample of local work?

SWE-bench provides directional support for executable software tasks. MultiAgentBench, from Zhu ([2025](https://arxiv.org/abs/2503.01935)), does the same for broader interaction-centered evaluation. Neither adds a measured result for the own-task or per-release transfer. Their architectural contribution is to put an environment, tools, state, and an outcome check inside the evaluated unit rather than scoring final-answer text alone.

Once the set runs as part of release, a failure should trigger diagnosis before any threshold revision. Inspect whether the candidate changed, the case changed, or the evaluator changed. Route valid candidate failures through the external-feedback correction loop, then rerun the entire required sequence for the revised candidate. Reusing the passing trials from before a modification would attach evidence to a system that no longer exists.

## Build the first gate this week

Start with five to ten tasks drawn from merged work, not from a generic capability suite. Choose tasks whose starting states can be reconstructed and whose acceptable outcomes can be checked without interpretation. The set can be small because its first job is to establish a release path that produces trustworthy records. Coverage can grow when production failures reveal what the initial sample missed.

Wrap each task in a sandboxed run. Write down the command the controller will execute, the exit condition it will accept, and the artifacts that must exist afterward. Bound the resources, isolate the network, and preserve the run record. Run the current production system first. Its observed result under the same evaluator becomes the baseline, and it replaces any remembered claim about the previous release.

Feed a failed run back into the retry loop with the candidate identity and the raw evidence intact. Refuse a revision that proceeds only from re-reading the original request. Every changed candidate returns to a clean sandbox and receives a new verdict. Infrastructure failure stays blocking without becoming a candidate failure.

Replay the set whenever the model, the prompt, the tools, or the orchestration changes. Score pass^k across the chosen repeats, retain the per-case distribution, and compare it with the stored baseline. Record the promotion threshold before the first candidate comparison. When the gate turns out to be too strict, change the policy as a versioned decision and establish a new comparison. Editing the threshold around an observed result invalidates the gate.

Place tasks with no executable check in a separate pile. They are not lesser tasks, and forcing them through a weak proxy would only make the gate look more complete than it is. Chapter 5 takes up the calibrated judgment lane they require.

## Sources and evidence

The evidence class and strength on each entry below come from its catalog record. Author-system cases in this chapter are narrative illustration and are not part of the evidence base.

### Motivating observation and companion entry

- lit/directional: Mehta, A. (2026). Confident and Wrong: Silent Semantic Failures in Coding Agents. arXiv:2603.25764. Analysis of 1,750 trajectories across 50 tasks and four models; single-author, limited-sample observational finding. Supports the untaught companion entry on scoring verified resolution separately from submission.

### `ground-evaluation-in-execution`

- explorer/directional: AgentForge (Kumar et al. 2026, arXiv:2604.13120). Execution-grounded evaluation in resource-bounded, network-isolated sandboxes, with propagation gated on execution results. Unrefereed preprint; single configuration; one sample per agent.
- explorer/directional: SWE-bench (arXiv:2310.06770), from Jimenez et al. 2023. Direction only; no figure carried.

### `gate-self-correction-on-external-feedback`

- lit/strong: Huang, J., et al. (2023). Large Language Models Cannot Self-Correct Reasoning Yet. ICLR 2024. arXiv:2310.01798.

### `golden-set-pass-k`

- explorer/strong: τ-bench (Yao, Shinn, Razavi & Narasimhan 2024, arXiv:2406.12045). Introduces and measures pass^k on interactive, multi-turn tool-use tasks with executable oracles. Using a team's own tasks and replaying the set per release are transfers beyond the measured findings.
- explorer/directional: SWE-bench (arXiv:2310.06770). Direction only.
- explorer/directional: MultiAgentBench (Zhu 2025, arXiv:2503.01935). Direction only.

### Author artifact cited inline

- Not an evidence item: CodeProbe, the author's task-mining evaluation tool, [public repository](https://github.com/sjarmak/codeprobe). Named inline for the consecutive-release acceptance gate described above, which is narrative illustration.
