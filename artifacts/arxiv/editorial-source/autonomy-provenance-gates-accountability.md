I built a human-approval queue to hold decisions an agent was not permitted to make. The architecture appeared conservative: the agent could prepare an action, but execution stopped at a human-only boundary.

An audit found paths around that boundary. Some scripts failed open when a required component was missing, and command construction reached execution without the validation the gate was supposed to enforce. The system could report that approval existed while allowing an action to bypass the person. The conservative appearance of the apparatus had concealed a material difference between policy and execution.

The chapter's four entries rest on seven evidence items, two of them strong. The accountability literature represented here consists largely of surveys, frameworks, and position papers, with one practitioner account and little production-grounded measurement. The practices are therefore testable defaults rather than universal policy; the entries on gate effectiveness and alignment between accountability and control have no strong supporting item.

The failed queue illustrates the broader problem. An autonomy policy constrains nothing unless the system enforces the boundary it names. A provenance label changes nothing unless it changes what a reviewer can learn or do. A human gate controls nothing unless the person can alter the execution path. An accountability assignment prevents nothing unless the named person has authority over the outcome.

These are separate design objects, but they fail in the same way when the operational path differs from the policy description.

Agent systems acquire more kinds of authority as they grow. One may restart a service, propose a migration, merge documentation, rotate a credential, or delete a branch. Calling the system “autonomous” collapses those different powers into one word. That word says nothing about reversibility, blast radius, available evidence, ownership of state, or the ability to interrupt execution.

The useful unit is the transfer of control for one action class. Each transfer has:

- an initiator;
- a proposed action;
- an approving or executing party;
- an artifact supporting the decision; and
- a recorded outcome.

Once those elements are explicit, autonomy can be calibrated from observations, provenance can travel with the artifact, and the gate can be tested as an executable control. Accountability can then be assigned to a role that actually holds authority.

## Widen authority one action class at a time

An autonomy ladder widens control one rung at a time for a defined action class. Each class keeps its own approval, modification, and outcome record. A **promotion threshold** is the criterion for moving that action to a wider rung.

One practitioner article, Priya C ([2026](https://devops.com/when-should-a-devops-agent-act-without-human-approval/)), proposes roughly 95 percent unmodified approvals as a starting policy. It reports no measurement supporting that cutoff. The number has no claim to universality.

A team should instead define the performance difference that would justify wider authority, gather enough observations to detect that difference, and retain the underlying counts. The protocol here rests on one directional practitioner source and one strong controlled study concerning reviewer comprehension.

The ladder needs separate rails because action classes expose different risks. A service restart changes transient process state and can often be reversed with another restart. A credential rotation changes distributed configuration, invalidates clients, and may lock operators out of recovery. A branch deletion changes repository state. A proposed text edit changes only an artifact that still requires merge.

Hundreds of clean service restarts establish nothing about whether the same system can rotate credentials safely.

```text
defined action class
    -> its own approval + modification + outcome record
        -> measured evidence
            -> widen authority one rung at a time

service restart rail              credential rotation rail
transient process state           distributed configuration
another restart may reverse       invalidates clients
clean restarts may widen rung     may block recovery access
        |                                  ^
        +-> establish nothing about -------+

permanent approval floor
    -> human authorization remains mandatory
    -> irreversible actions stay above
    -> high-blast-radius actions stay above

routine success does not remove the floor
```

My operator policy makes this separation explicit. Service restarts are pre-approved. Destructive operations such as recursive deletion, force-push, and branch deletion require renewed confirmation every time. The policy is durable configuration, so a new session inherits the same boundary. This illustrates the shape of an action-specific policy; it is not evidence that these classifications suit another system.

A transfer-of-control record documents every decision to let the system act, require approval, or return control to a person. For each action class, it should preserve:

- the proposed action;
- the autonomy rung in force;
- the reviewer’s decision;
- any human modification;
- the observed outcome; and
- later reversal or incident evidence.

Outcome correctness requires an action-specific definition. For a restart, “the command exited zero” is insufficient if the service never became healthy. For a patch, “merged” is insufficient if production failure caused an immediate revert.

Approval measures are proportions over repeated observations:

```text
approval rate
    = approved proposals / reviewed proposals

unmodified approval rate
    = proposals approved without human change / reviewed proposals

modification rate
    = proposals changed by a human / reviewed proposals
```

The denominators must refer to the same action class and autonomy rung. Combining restarts with schema changes can produce a stable aggregate while both underlying rates move in opposite directions. Excluding rejected or timed-out proposals makes the system look more acceptable by removing the transfers that failed. Recording only executed actions introduces survivorship bias because abandoned proposals disappear before the outcome record is built.

Part I established why an observed proportion is not the underlying property. Nine unmodified approvals among ten proposals and ninety among one hundred both produce 90 percent, but the first estimate is much less precise. The interval method depends on the analysis plan; the operational conclusion does not. A small-\(n\) percentage should not transfer authority merely because it crossed a displayed threshold.

The sampling unit also matters. A series of transfers reviewed by one person measures the reviewer-system pair as much as the system itself. A track record collected under one model version, prompt set, or harness revision describes that configuration. Changing any of them reopens the question the record was intended to settle.

Promotion also requires a power analysis. The team first defines the smallest change that would reverse the decision, such as the smallest increase in post-action failures that would make a wider rung unacceptable. It then estimates how many observations are needed to detect that change at the chosen error rates.

Rare, high-consequence failures may require more observations than the deployment can plausibly accumulate. In that case, the action cannot earn wider autonomy from its local record, even when every observed outcome has been clean.

Approval alone omits information captured by modification. A reviewer may approve every database query only after correcting its time window, tenant filter, or target environment. Approval is then 100 percent, even though autonomous execution would repeatedly reproduce a material error.

The modification record should retain what changed. Correcting punctuation and changing a production target have different implications. Modifications can be classified for analysis when the categories and inter-rater reliability procedure are fixed before the rates are examined.

Outcome correctness is a third measure because approval can reflect reviewer behavior rather than system quality. Reviewers under queue pressure may approve familiar actions quickly or reserve comments for severe defects. A rising unmodified approval rate combined with a rising rollback rate argues against promotion. Delayed outcomes must also remain attached to the original transfer, or failures discovered after the review window will be counted as successes.

Chen et al. ([2025](https://arxiv.org/abs/2507.08149)) complicate a capability-only account of automation. In their controlled study, limited understanding of agent behavior constrained willingness to adopt higher automation even as capability increased. Capability alone did not determine the limit.

The verification surface is therefore part of the autonomy mechanism. A reviewer needs:

- a behavior summary;
- the relevant artifact or diff;
- the intended state transition;
- the observed state transition; and
- the evidence connecting the proposed action to the stated objective.

When those artifacts do not support comprehension, even an accurate system may fail to earn legitimate authority.

Comprehension should be tested at the rung under consideration. Ask reviewers to predict affected resources, identify the rollback path, and locate the evidence behind the system’s claim before revealing the answer. Record where their understanding diverges from execution. No universal quiz score follows from this design.

The companion entry `require-comprehension-before-merge` makes the explain-back check explicit. An independent checker should evaluate the generating system’s work.

Some action classes remain above a permanent approval floor, below which human authorization is never removed. Irreversible and high-blast-radius actions belong there when the consequence of a mistaken transfer exceeds what the observed record can justify. The floor is not a trust ramp and does not disappear after routine successes.

Least privilege should still constrain the executing identity so that a mistaken approval cannot authorize effects beyond the operation being reviewed.

Most teams should keep most consequential actions below full autonomy today because the supporting evidence remains thin and action-specific. The companion entry `set-autonomy-defaults-per-task-type` can initialize a policy table, but it cannot create a track record or replace the ladder.

The executable decision is narrower:

1. Define one action class.
2. Define a correct outcome and the material difference that would reverse the policy.
3. Record every proposed transfer, including rejection and timeout.
4. Estimate uncertainty.
5. Test reviewer comprehension.
6. Widen authority by one rung only when the observations support it.

Two companion entries sit beside this practice. `measure-oversight-with-decomposed-metrics` separates overreliance from underreliance and classifies review interactions before counting coverage. The evidence for `attach-reliance-disclaimers` supports only its inclusion as a marked design option.

## Put provenance where review happens

Tang et al. ([2024](https://arxiv.org/abs/2405.16081)) observed 28 developers in a laboratory study and found that they were unreliable at recognizing machine-generated code without assistance. When told that the code was generated, participants searched and verified more, and their repair performance improved. Cognitive workload also increased.

This study provides the strong evidence for provenance disclosure in this chapter. It used short code fragments under laboratory conditions.

A provenance label records how an artifact was produced and presents that record where the artifact is reviewed. It may be a pull-request label, a structured commit trailer, or an editor marker.

Recognition is the wrong task on which to spend reviewer attention. Machine-generated code has no stable visual signature. Asking reviewers to infer its origin consumes attention before they inspect its behavior and produces selective scrutiny: obvious generations receive extra review while plausible generations pass as ordinary work.

Attaching provenance at the review surface makes origin an input to the decision rather than a detection task.

The study suggests a specific mechanism. Disclosure caused participants to search and verify more, giving them additional evidence for repair. The label did not establish that the code was defective and performed no verification itself. Its value depended on the behavior it produced in a reviewer who had the tools and time to investigate.

A common misuse ignores that dependence. A warning badge can become a substitute for testing, as though declaring machine authorship discharged the maintainer’s responsibility. It can also become a weak liability transfer in which the system announces risk while giving the reviewer no practical way to inspect it.

A useful label connects to:

- the generation context;
- the proposed diff or artifact;
- the tests and verification results;
- later human modifications; and
- the role answerable for integration.

None of those artifacts is thereby proven correct.

The disclosure boundary needs a defined object. One pull request may contain human-written scaffolding, generated implementation, generated tests, and later human repairs. A request-level label is simple but loses that composition. A marker on every line is more precise but noisy and dependent on editor and diff support. Commit trailers provide a durable repository unit, although squashing, copying, and cherry-picking can detach the trailer from the code it described.

There is no universal granularity. The team should identify the review decision the label is meant to influence and choose the smallest unit whose provenance survives the repository workflow.

Test that survival through:

- rebases;
- cherry-picks;
- squash merges;
- file moves;
- copied patches; and
- partial adoption of generated work.

A provenance control that disappears during the ordinary merge path creates a confident but incomplete history.

My authorship-measurement project illustrates why provenance counts must remain narrow. I measured a 14.5 percent trailer-signed floor, a lower bound on visible trailer-marked authorship, because every detected trailer was treated as a true positive. The figure says nothing about total agent contribution and cannot be averaged with an inferred share.

A preregistered replication could not estimate the share of agent-authored code beyond commits carrying the trailer. I therefore discard the earlier exploratory range and report only the directly observed trailer-marked floor.

Provenance is also distinct from answerability. In my maintainer practice, an adoption pull request can preserve a contributor’s commits while stating:

```text
Supersedes #X
Credit: original fix by @X (commit preserved with original authorship)
```

The original author remains attached to the work. The maintainer who adopts and submits it becomes answerable for the integration decision. Both facts survive in the artifact.

The format establishes attribution rather than correctness. It removes the need for a later reviewer to infer who produced the change and who accepted responsibility for putting it forward.

Persistent provenance also supports incident reconstruction. A reviewer investigating a regression can ask whether the failure arose during generation, human modification, integration, or a later environmental change. That distinction is harder when provenance exists only in an editor and disappears before merge.

The companion entry `record-steps-in-hash-chained-ledger` describes one tamper-evident history mechanism. The argument here does not depend on that implementation.

Tang et al.’s measured workload cost limits the recommendation. Increased cognitive effort may be acceptable when a marker directs attention to occasional generated work. In a codebase where nearly every change carries the label, constant exposure may tax reviewers and lose salience.

Large diffs, persistent queues, and experienced teams may respond differently over time. Local evaluation should therefore measure reviewer behavior and repair, not label coverage alone.

Useful observations include whether reviewers:

- open referenced files;
- inspect or run tests;
- search documentation;
- change the proposed code;
- detect seeded defects; and
- report excessive workload.

Compare equivalent review artifacts with and without disclosure under the actual tools and queue constraints. Using the same artifacts removes change difficulty from the comparison, as Chapter 1 recommends for paired designs.

The experimental unit is the reviewer-artifact pair, not the artifact alone. The design must state:

- how reviewers are assigned to conditions;
- whether any reviewer sees the same artifact twice;
- how condition order is counterbalanced;
- which defects count; and
- how cognitive workload is measured.

The study provides no production threshold to copy.

If disclosure increases activity without improving repair, the marker may be producing ritual rather than evidence. If repair improves while queue delay or abandonment rises sharply, the team has found a real tradeoff between scrutiny and capacity. Either result is more useful than a policy requiring an “AI-generated” badge everywhere.

The relevant question is whether provenance changes verification in the deployed review environment.

The companion entry `write-an-agent-contribution-policy` covers repository rules for disclosure, attribution, and accepted contribution paths. A policy can standardize the wire format. It cannot make the marker effective. Effectiveness remains an observed relationship among the label, verification surface, reviewer behavior, and repair outcome.

## Prove that a gate can change execution

Human gates have only directional support in this chapter and no strong evidence item. Sterz et al. ([2024](https://arxiv.org/abs/2404.04059)) propose an interdisciplinary framework for effective human oversight but provide no empirical validation of a universal test. Green ([2022](https://arxiv.org/abs/2109.05067)) compared 41 government oversight policies with findings from human-computer interaction research and concluded that the human functions prescribed by those policies were generally not performable.

These sources justify an audit structure and a burden of proof. Whether a particular gate works remains unresolved until the deploying team tests it.

In a workflow diagram, the word “gate” implies causal control. In execution, an approval step may only record that someone clicked before an action the person and the click could not alter.

**Compliance theater** is a control whose visible form satisfies the policy description while its execution path does not mitigate the named risk. A **fail-open gate** stops enforcing its boundary when a dependency, validation step, or error path fails.

The interdisciplinary framework identifies four conditions for effective oversight:

- **Causal power:** the person can stop or change the consequential action.
- **Epistemic access:** the person can obtain the evidence needed to understand the decision before it takes effect.
- **Self-control:** the person can exercise judgment rather than follow a compelled path.
- **Fitting intentions:** the person intends and is prepared to perform the assigned oversight function.

Evaluate those conditions against an execution trace rather than the policy document. For every named gate, follow the proposed action through approval, mutation, dispatch, and durable state change. Inject the failures the gate claims to handle. Observe whether the reviewer receives the required evidence, whether rejection blocks every path, and whether a modified action requires renewed approval.

| Condition | Question for the running gate | Observation to collect | Failure implication |
| --- | --- | --- | --- |
| Causal power | Can the person stop or alter this exact action? | Rejection, cancellation, edit, and timeout traces | The click records assent but does not control execution |
| Epistemic access | Can the person inspect the relevant inputs, artifact, target, and consequences before deciding? | Missing context, inaccessible logs, and reconstruction errors | Approval rests on incomplete state |
| Self-control | Can the person decide without a forced default or impossible queue constraint? | Default acceptance, time pressure, and override use | The workflow substitutes acquiescence for judgment |
| Fitting intentions | Is the role expected and prepared to inspect the named risk? | Review actions, escalation behavior, and interviews | The role is ceremonial or aimed at another risk |

The acceptance criteria must be system-specific. One team may require a deployment approver to cancel a queued release before the first production mutation and to see the exact artifact digest being deployed. Another may require a migration reviewer to revise the plan while withholding direct execution authority.

Name the claimed oversight function, build a trace capable of falsifying it, and decide in advance what observation would establish control.

Removing a dependency from a gate is itself a state change, so this failure test belongs in a contained environment. Chapter 7 supplies that boundary. Auditing a production gate by allowing its negative result to mutate production converts a test into an incident.

My approval queue failed this audit. Missing components allowed scripts to bypass the path that should have waited for a person. Unvalidated command construction weakened the connection between the reviewed proposal and the executed command. The existence of the queue did not establish causal power.

The failure is useful contrary evidence precisely because the queue was designed to preserve human-only decisions.

Another of my systems used a reproduction-before-mutation hook intended to require a reproducible failure before code could change. When a required binary was missing, the hook stopped enforcing the gate. The project documented the fail-open behavior rather than counting installation of the hook as coverage.

The case does not estimate how often gates fail this way. It shows how one environmental dependency can erase a governance boundary.

Mechanical and attentional gates fail differently.

A **mechanical gate** uses execution state to block an action until a condition holds, such as a verified signature or explicit `--apply` flag. It may enforce a condition that does not establish the property for which the gate receives credit.

An **attentional gate** presents evidence to a person and requires a decision, such as review of a diff and its supporting checks. It may obtain a click without scrutiny.

Agent memory is neither. A remembered instruction has no independent causal path to enforcement.

My approval-gate configuration contains seven action-class rows. Each identifies the gate as mechanical or attentional, names an owner, and avoids reliance on agent memory. Mutating commands dry-run by default and require `--apply`, placing a mechanical boundary between inspection and state change.

This is a design example, not evidence that seven rows, that flag name, or those classifications improve outcomes elsewhere.

More elaborate gates require the same audit. In pull request 1558 of my orchestration system, the review surface recorded:

```text
Latest review attempt: 6
Quality score: 950/1000, threshold 850
```

The attempt count and score are verified properties of that artifact. The gate was intended to concentrate human attention after repeated model review, and degradation of the gate was treated as an incident.

The claimed attention saving remains unmeasured because maintainer time, scrutiny depth, and escaped-defect rate were not recorded.

Optimizer and model-review gates depend on the same distinction. A threshold may mechanically block execution while providing no assurance that its score tracks the failure a person cares about. The companion entries `treat-objective-weights-as-reviewed-policy` and `gate-optimizer-output-behind-human-review` address those policy surfaces.

Their presence does not remove the need to test whether rejection changes system state and whether the reviewer can interrogate the score.

Green’s analysis places the burden of proof on the institution deploying the automation. The team should justify why automation is appropriate for the action and demonstrate that reviewers can perform the function assigned to them.

When a reviewer cannot see the relevant evidence or cannot stop the action, attaching their name legitimizes the decision without reducing its risk. Accountability then moves toward the person with the least practical control.

That negative conclusion is bounded. Code review can offer unusually strong epistemic access because a reviewer can inspect an exact diff, run tests, examine history, and delay merge. Government-benefit decisions, live vehicle intervention, and repository changes do not create the same verification problem.

The gate must be tested in its own domain. These sources establish no universal conclusion about either human incapacity or human benefit.

Chapter 7 also showed why a control cannot be accepted merely because the harness reports that it ran. The governance extension asks whether a person can independently inspect the relevant state and interrupt the path that changes it. An override button without an independent signal provides nominal authority without usable control.

Three companion entries sit beside this practice: `separate-control-from-oversight`, `write-an-oversight-card`, and `keep-override-authority-real`. Each rests on one evidence item and can help distinguish control before action, observation after action, stated reviewer duties, and override paths.

None establishes that a particular gate works. That requires a trace showing that the reviewer had the evidence, authority, and execution path needed to change the outcome.

## Assign responsibility only where control exists

Cavalcante Siebert et al. ([2023](https://arxiv.org/abs/2112.01298)) provide a conceptual bridge from responsibility theory to engineering practice: responsibility should be commensurate with the ability and authority to control an outcome. Suryana et al. (2025) operationalized related questions in another domain through interviews with 103 users of partially automated driving systems, identifying gaps between expected and actual behavior and inconsistent adherence to operating protocols.

These are two directional literature items, and this practice has no strong supporting evidence item. Organizational-accountability research for agent systems is thin and recent. The sources support a defensible audit method. They provide no compliance threshold and no estimate of failure rates in software delivery.

After an incident, organizations often assign responsibility to the engineer who approved the action, monitored the system, or happened to be on call. That assignment may be administratively clear while remaining causally false. When the person lacked authority to halt the action, access to the relevant state, tools to change it, or time to intervene, responsibility has followed proximity rather than control.

The resulting responsibility gap produces blame without creating a path that could have prevented the failure.

The control check begins before an incident. For every role named as accountable, identify the exact state transitions that role can:

- authorize;
- alter;
- stop; or
- reverse.

Test those powers using the role’s deployed identity rather than an administrator’s demonstration. Record the information available at decision time, the tools through which intervention occurs, and the interval during which intervention remains effective.

Authority, access, tooling, and time are separate requirements. An engineer may have permission to cancel a deployment while lacking access to the tenant, model trace, or configuration needed to know that cancellation is warranted. A rollback command may exist while an irreversible external action commits before the reviewer has time to evaluate the evidence.

A role has control only when those elements combine into an effective intervention path.

When responsibility exceeds control, the organization has two coherent options:

1. Repair the role by granting the required authority, access, tooling, and time, subject to least privilege.
2. Move responsibility to the role that already holds those controls.

Leaving the responsibility label in place while operational control remains elsewhere preserves the gap by design.

The check should include the identity that executes the action. In my enterprise data-access service, mutations are unavailable, requests use the caller’s identity, and the audit log records that person. The agent cannot silently accumulate authority beyond what its operator already holds.

This design aligns execution and identity more closely than a shared privileged service account. Access justification and caller understanding remain separate checks.

Identity passthrough also carries a cost. It improves attribution and limits silent privilege expansion, but it can reduce availability when the caller lacks a permission that a service account previously supplied. The system should first determine which authority the action genuinely requires, then measure:

- authorization failures;
- escalation requests;
- escalation completion time;
- unauthorized access attempts; and
- cases in which the agent requests authority broader than the task requires.

Provenance answers a neighboring but different question. It records who or what contributed to an artifact and how that contribution moved through the workflow. Accountability identifies the person or institution answerable for the decision to accept and deploy it.

The adoption pull-request format shown earlier preserves original authorship while transferring answerability for integration to the maintainer. Conflating the two roles would either erase contribution history or blame a contributor for a deployment decision they did not control.

The literature on meaningful human control offers two additional concepts: **tracking** and **tracing**.

Tracking asks whether system behavior follows the relevant and justified reasons or expectations of the people affected by it. Tracing asks whether a capable and aware person can be connected to the decision and its control path.

These concepts become operational only after the team translates them into observable behavior for its own system.

Suryana et al. applied tracking and tracing through interviews with 103 users of Tesla Autopilot and Full Self-Driving features. The interviews revealed expectation-reality gaps and inconsistent adherence to operating protocols. This evidence comes from driving rather than software delivery; its transferable contribution is the interview method for revealing an operational control model different from the one described in design documents.

For an agent that prepares production changes, a tracking interview might ask:

- What do users believe the agent may modify?
- Which constraints do they expect it to preserve?
- What evidence do they expect to stop execution?
- When do they believe human approval is required?
- What do they believe happens after rejection?

Those answers should be compared with policy and with actual execution traces.

A tracing interview might ask:

- Who can explain this action?
- Who could have changed or stopped it at each stage?
- Which identity executed it?
- Who could reverse it?
- Where should a user escalate when behavior diverges?
- What happens if that person is unavailable?

Compare the answers across operators, reviewers, system owners, and affected users. Inconsistent answers are evidence that the operational responsibility model is not shared.

The audit identifies distinct failures rather than producing one certification score. A shared credential may erase the responsible identity even when the system tracks user expectations well. A complete decision history may coexist with systematic misunderstanding about when the system will act. Combining both into one “meaningful control” score would hide the repair each problem requires.

Operational definitions must therefore remain local. A deployment system may define a traceable decision through:

- the artifact digest;
- approver identity;
- execution identity;
- target environment;
- authorization token; and
- rollback authority.

A data-access agent may require:

- caller identity;
- query purpose;
- source authorization;
- returned-field records; and
- a durable record of disclosure.

A partially automated vehicle has different timing, embodiment, and safety constraints. The questions about authority, awareness, and intervention transfer across domains. The measured rates and exact controls do not.

Collective work complicates responsibility without removing it. Models propose actions, tools execute them, reviewers approve them, platform teams configure permissions, and managers allocate review capacity. The companion entry `rebuild-collective-accountability` addresses how those contributions form an institutional account, while `scale-review-capacity-to-experience` addresses review planning by contributor experience.

Neither should diffuse answerability so widely that no role owns a state transition it can actually stop.

## Audit the path from policy to execution

Run four checks against one defined action class and one real repository workflow.

### Test the autonomy transfer

Define:

- the action class;
- the current autonomy rung;
- a correct outcome;
- the material difference that would justify wider authority; and
- the failures that would prevent promotion.

Record every proposed transfer, including rejected, modified, timed-out, abandoned, and executed proposals. Do not combine action classes or autonomy rungs, and do not build the record from executed actions alone.

Calculate uncertainty around approval, modification, and outcome rates. Test whether reviewers understand the affected state, evidence, and rollback path. Widen authority by one rung only when those observations support the change.

### Test whether provenance survives review and integration

Choose the smallest provenance unit that can survive the repository workflow while still representing the review decision it is intended to affect.

Exercise that marker through:

- rebases;
- cherry-picks;
- squash merges;
- file moves;
- copied patches;
- partial adoption; and
- later human modification.

Verify that a reviewer can distinguish generation, human revision, and integration responsibility after each transformation.

Keep the count semantics narrow. The 14.5 percent trailer-signed floor described earlier is a lower bound on visible trailer-marked authorship. It must not be combined with an inferred contribution share.

### Test the gate as a failure experiment

Run the gate audit in a contained environment. Name the action, gate, and decision owner, then capture the complete execution trace.

Remove or fail each gate dependency in turn. Exercise:

- approval;
- rejection;
- modification;
- cancellation;
- timeout;
- missing validation;
- missing binaries or services;
- stale approval tokens; and
- attempts to execute through alternate paths.

Inspect the evidence available to the reviewer and verify the durable state produced by each decision. A rejected action must fail to execute through every path. A modified action must receive renewed review when the modification changes the authorized state transition.

Interview the assigned reviewer about the risk they believe they are checking, then compare that account with the actual execution path. Repair or remove a gate that cannot demonstrate causal power and epistemic access. Decide explicitly how queue pressure, defaults, incentives, and emergency procedures will preserve self-control and fitting intentions.

### Audit accountability in two passes

#### Pass one: verify operational control

For each role named as accountable, select a real action and test the role’s deployed permissions.

Exercise whether the role can:

- reject the action;
- alter its scope;
- stop execution;
- inspect the relevant evidence;
- initiate recovery; and
- reverse the result where reversal is part of the claimed control.

Record the state transitions outside that role’s authority, the information it cannot access, the tools it lacks, and the point after which intervention becomes ineffective.

Where control is missing, either repair the role within least-privilege constraints or reassign responsibility to the role that holds the necessary authority.

#### Pass two: compare the stated and experienced control models

Interview actual users, operators, reviewers, and owners using tracking and tracing questions. Compare their justified expectations with policy and execution traces.

Record as separate findings:

- expectation mismatches;
- protocol deviations;
- actions without a traceable execution identity;
- reviewers who cannot explain the decision they approved;
- roles assigned responsibility without intervention power;
- ineffective escalation routes; and
- delays that allowed the action to become irreversible before review.

Repeat the first pass whenever permissions, action classes, execution paths, or recovery mechanisms change. Repeat the second when the user population, operating protocol, interface, or escalation policy changes.

Measure the findings that carry operational weight, such as:

- untraceable actions;
- failed stops;
- unauthorized execution paths;
- expectation mismatches;
- dead-end escalations;
- stale approvals;
- interventions that arrive too late; and
- time lost before someone with effective control becomes involved.

Do not adopt a pass rate borrowed from another system. Decide in advance which failures invalidate the accountability claim and preserve the identities, traces, interviews, and execution evidence required to reproduce that decision.

## Sources and evidence

Support is thin across the chapter: four developed practices carry seven evidence items, of which two are strong and five directional; six are scholarly sources and one is a practitioner source. `audit-human-gates-for-effectiveness` and `align-accountability-with-actual-control` carry no strong evidence item.

### graduate-autonomy-per-action-track-record

- Directional evidence: "When Should a DevOps Agent Act Without Human Approval?", Bala Priya C, DevOps.com, 2026-05-11, [article](https://devops.com/when-should-a-devops-agent-act-without-human-approval/). Supports action-type autonomy promotion at roughly 95% unmodified approval, permanent approval floors for irreversible or high-blast-radius actions, and decision-ready gates with timeout plans. The protocol comes from one practitioner article; the threshold is stated, not measured.
- Strong evidence: Chen, V., Talwalkar, A., Brennan, R., Neubig, G. (2025). Code with Me or for Me? How Increasing AI Automation Transforms Developer Workflows. arXiv:2507.08149. In the controlled study, users' failure to understand agent behavior, not capability, limited broader adoption.
- Corroboration (narrative only): a demoted author-distilled field note about a 2025 lights-off agent factory failure, the operator policy, and an essay describing per-action autonomy with a batched morning decision ledger. The field note is not independent support.

### label-ai-provenance

- Strong evidence: Tang, N., Chen, M., Ning, Z., Bansal, A., Huang, Y., McMillan, C., Li, T. J.-J. (2024). A Study on Developer Behaviors for Validating and Repairing LLM-Generated Code Using Eye Tracking and IDE Actions. arXiv:2405.16081. Supports improved repair performance and greater verification effort with provenance disclosure; recognition without disclosure was unreliable. Limited by a small laboratory sample and code chunks of tens of lines; the attention cost may not scale to constant exposure.
- Corroboration: none on record.

### audit-human-gates-for-effectiveness

- Directional evidence: Sterz, S., et al. (2024). On the Quest for Effectiveness in Human Oversight: Interdisciplinary Perspectives. ACM FAccT 2024. arXiv:2404.04059. Supports four conditions for effective oversight persons; gates failing any condition are compliance theater. The framework is motivated by EU AI Act Article 14, not empirically validated.
- Directional evidence: Green, B. (2022). The Flaws of Policies Requiring Human Oversight of Government Algorithms. Computer Law & Security Review 45, 105681. arXiv:2109.05067. Compares 41 policies with the human-computer interaction record and shifts the burden of proof to the deploying institution. The negative claim transfers only where reviewers lack real verification surfaces; code review differs in verifiability.
- Corroboration (narrative only, contrary): the human-approval queue audit found fail-open scripts and unvalidated command construction, while the reproduction-before-mutation hook stops enforcing when a required binary is absent.

### align-accountability-with-actual-control

- Directional evidence: Cavalcante Siebert, L., et al. (2023). Meaningful human control: actionable properties for AI system development. AI and Ethics 3, 241-255. arXiv:2112.01298. Supports responsibility commensurate with ability and authority to control, the framework's third actionable property.
- Directional evidence: Suryana, L. E., Nordhoff, S., Calvert, S., Zgonnikov, A., van Arem, B. (2025). Meaningful human control of partially automated driving systems: Insights from interviews with Tesla users. Transportation Research Part F 113, 213-236. Applies tracking and tracing criteria to 103 users to localize expectation-reality gaps and inconsistent protocol adherence. The method requires case-specific operationalization, yields failure localization rather than a compliance score, and is evidenced here in the driving domain. No arXiv identifier or DOI is carried in the catalog record, so the inline citation is unlinked.
