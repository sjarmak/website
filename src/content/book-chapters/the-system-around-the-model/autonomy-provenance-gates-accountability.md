---
title: "Autonomy calibration, provenance, effective gates, and accountability"
book: the-system-around-the-model
order: 16
part: 5
kind: chapter
number: 16
---

I built a human-approval queue whose purpose was to hold decisions that an agent was not allowed to make. The architecture looked conservative. An agent could prepare an action, and execution waited at a human-only boundary. An audit found that some scripts failed open when a required component was absent, and that command construction reached execution without the validation the gate was supposed to enforce. The queue could therefore report the presence of an approval process while allowing a path around the person. I had built that apparatus to be the careful option, which is an uncomfortable thing to read in an audit of your own system.

The evidence for the practices in this chapter is limited. The four taught entries rest on seven evidence items, of which two are strong; six come from the research literature and one from a practitioner account. Two entries, `audit-human-gates-for-effectiveness` and `align-accountability-with-actual-control`, have no strong evidence item. The accountability literature represented here consists largely of survey, framework, and position work. Production-grounded accountability literature is thin, and the available material functions as existence proof and design catalog without measuring production outcomes. I therefore present these practices as defensible defaults to test in a particular system, and the evidence does not establish universal policy.

The failed queue is one instance of a general problem. An autonomy policy constrains nothing unless the system preserves the boundary it names. A provenance label changes nothing unless it changes what a reviewer can learn or do. A human gate controls nothing unless the person can alter the execution path. An accountability assignment prevents nothing unless the named person can affect the outcome. These are four separate design objects, and each collapses in the same way when its operational path differs from its policy description.

Agent systems acquire more action types as they grow. A system might restart a service, propose a database migration, merge a documentation change, rotate a credential, or delete a branch. Calling such a system 'autonomous' compresses those authorities into one word. That word records nothing about reversibility, blast radius, the evidence available to a reviewer, the ownership of state, or the practical ability to interrupt execution, and those are the variables that determine risk.

The useful unit is the transfer of control for one action class. Each transfer has an initiator, an action, an approving or executing party, an artifact that supports the decision, and a recorded outcome. Once those elements are explicit, observations can calibrate autonomy, provenance can be attached to the artifact, and a gate can be tested as an executable control. Accountability can then be assigned to a role that holds authority.

## Autonomy is a ladder for each action type

An autonomy ladder widens control one rung at a time for a defined action type, using its own approval, modification, and outcome record. A promotion threshold is the criterion for moving to a wider rung. A frequently cited value is roughly 95 percent unmodified approvals, meaning that a reviewer approves the proposed action without changing it. That number is a calibration starting point stated as policy in one practitioner article, Priya C ([2026](https://devops.com/when-should-a-devops-agent-act-without-human-approval/)), which reports no measurement behind the cutoff. The threshold has no claim to universality.

A team should instead decide what difference in performance would justify a wider rung, gather enough observations to detect that difference, and retain the underlying counts. This practice rests on one directional practitioner source for the protocol and one strong controlled study for the role of comprehension.

The ladder needs separate rails because action types expose different failure modes. A service restart usually changes transient process state and can often be reversed by another restart. A credential rotation changes distributed configuration, invalidates clients, and may lock operators out of the recovery path. A branch deletion changes repository state, while a proposed text edit changes only an artifact that still requires merge. Hundreds of clean restarts therefore establish nothing about the same system's ability to rotate credentials safely.

```text
defined action type
    -> its own approval + modification + outcome record
        -> measured evidence -> widen control one rung at a time

service restart rail              credential rotation rail
transient process state           distributed configuration
another restart can reverse       invalidates clients
clean restarts -> widen rung      may lock operators out
        |                                  ^
        +-> establish nothing about -------+

permanent approval floor
    -> human authorization is not removed
    -> irreversible actions stay above
    -> high-blast-radius actions stay above

routine successes -> do not lift the floor
```

My own operator policy makes this separation explicit. Service restarts are pre-approved. Destructive operations, such as recursive deletion, force-push, and branch deletion, require renewed confirmation every time. The rule is stored as durable configuration so that a new session inherits the same boundary. It illustrates the shape of such a policy and is not evidence that these categories or settings suit another environment.

A transfer-of-control record documents each decision to let the system act, require approval, or return control to a person. For one action type, the record should identify the proposed action, the rung in force, the reviewer's decision, any human modification, the observed outcome, and later reversal or incident evidence. Outcome correctness needs an operational definition tied to the action. For a restart, 'the command exited zero' is insufficient when the service never became healthy. For a patch, 'merged' is insufficient when it was reverted after a production failure.

Approval rate is a proportion over repeated observations:

```text
approval rate = approved proposals / reviewed proposals
unmodified approval rate = approved proposals with no human change / reviewed proposals
modification rate = proposals changed by a human / reviewed proposals
```

These denominators must describe the same action class and the same rung. Mixing restarts with schema changes can produce a stable aggregate while both constituent rates move in opposite directions. Excluding rejected or timed-out proposals can make the system appear more acceptable by removing the cases in which the transfer failed. Recording only executed actions produces survivorship bias, because abandoned proposals disappear before the outcome table is built.

Part I established why an observed proportion is not the property itself. Nine unmodified approvals out of ten proposals gives 90 percent, and the confidence interval around it remains wide because the sample is small. Ninety approvals out of one hundred supports a narrower estimate at the identical point estimate. The appropriate interval method depends on the analysis plan, but the operational conclusion does not depend on that choice. A rate from a small <span class="katex"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>n</mi></mrow><annotation encoding="application/x-tex">n</annotation></semantics></math></span> should not move authority because its displayed percentage crossed a line.

The sampling unit deserves the same attention Part I gave it. Transfers reviewed by one person are repeated observations of that reviewer as much as of the system, and a rate computed over them describes the pair. A track record accumulated under one model version, prompt set, or harness revision also describes that configuration, so a change to any of them reopens the question the record was meant to settle.

Promotion also requires a power analysis. The team first specifies the effect size that would change the decision, such as the smallest increase in post-action failures that would make a wider rung unacceptable. It then estimates how many observations are needed to detect that difference at the chosen error rates. Rare, high-consequence failures can require more evidence than the deployment will plausibly accumulate. In that case, the action cannot earn promotion from its local track record, even when every observed outcome has been clean.

The approval rate omits information that the modification rate records. A reviewer may approve every database query after correcting the time window, tenant filter, or target environment. The approval rate is then 100 percent, while execution without intervention would reproduce the same material error. The modification log should retain the substance of each change, because a punctuation edit and a correction to the production target have different implications. A team can classify modifications for analysis when it specifies the categories and the inter-rater reliability before examining the rate.

Outcome correctness is a third measure, because approval can reflect reviewer behavior rather than system quality. Reviewers under queue pressure may approve more quickly, rubber-stamp familiar actions, or reserve comments for severe defects. A rising unmodified approval rate alongside a rising rollback rate is evidence against promotion. The system should also report delayed outcomes, because a configuration change that fails after the review window would otherwise be counted as correct.

Chen et al. ([2025](https://arxiv.org/abs/2507.08149)) complicate a capability-only account of automation. In their controlled study, as automation increased, limited understanding of agent behavior constrained willingness to adopt higher automation, and capability alone did not explain the limit. The verification surface is therefore part of the autonomy mechanism. A reviewer needs a behavior summary, the relevant diff, the intended and observed state transition, and an explanation of why the proposed action follows from the available evidence. When those artifacts do not support comprehension, an accurate system can still fail to earn legitimate control.

Comprehension should be tested at the rung under consideration. Ask reviewers to predict the affected resources, identify the rollback path, and locate the evidence for the system's claim before revealing the answer. Record where their model diverges from execution. This is a design decision and a measurement task, and no generic quiz score follows from it. The companion catalog holds an explain-back gate under `require-comprehension-before-merge` that makes the check explicit, and an independent checker should evaluate the generating system's work.

Some action classes stay above a permanent approval floor, a boundary below which human authorization is not removed. Irreversible and high-blast-radius actions belong there when the cost of a mistaken transfer exceeds what the observed record can justify. The floor is not a trust ramp, and it does not lift because the system has accumulated routine successes. Least privilege should still constrain the executing identity, so that a mistaken approval cannot exceed the authority the action requires.

Most teams should keep most actions below full autonomy today, because the promotion evidence is thin and action-specific. A table of task-type defaults, held separately in the companion catalog under `set-autonomy-defaults-per-task-type`, can initialize policy but cannot supply a track record, and it does not replace the ladder. The executable decision is narrower. Define an action class, define the outcome and the material difference, and collect every transfer using denominators that do not exclude rejected or timed-out proposals. Calculate uncertainty, test reviewer comprehension, and widen one rung only when those observations support it.

Two further companion entries sit beside this one. `measure-oversight-with-decomposed-metrics` separates overreliance from underreliance and classifies review interactions before counting coverage. The evidence for `attach-reliance-disclaimers` supports only its use as a marked design option.

## Provenance belongs at the review surface

Tang et al. ([2024](https://arxiv.org/abs/2405.16081)) observed twenty-eight developers in a laboratory study and found them unreliable at recognizing machine-generated code without assistance. When told that the code was generated, participants searched and verified more, and their repair performance improved. Measured cognitive workload also increased. Tang and colleagues supply the strong evidence for this practice, and their experiment used short code fragments under laboratory conditions.

A provenance label records how an artifact was produced and shows that record where the artifact is reviewed. It may take the form of a pull-request label, a commit trailer placed in the structured footer of a commit message, or an editor marker.

Recognition is the wrong task to spend reviewer capacity on. Machine-generated code has no stable visual signature, and asking reviewers to infer origin consumes attention before they inspect behavior. Inference also produces selective disclosure in practice. Obvious generations attract scrutiny while plausible generations pass as ordinary work. Attaching provenance at the point of review makes origin an input rather than a detection task.

The observed behavior in that study suggests a specific mechanism. Disclosure prompted additional search and verification, which gave participants more evidence for repair. The label did not establish that the code was defective, and it performed no verification itself. Its value depended on the response it produced in a reviewer who had tools and enough time to use them.

A common misuse ignores that dependence. A warning badge can become a substitute for a test, as though declaring machine authorship discharged the maintainer's duty. It can also become a weak liability transfer, in which the system announces risk while leaving the reviewer no practical way to investigate it. A useful label connects to the generation context, the tests, the diff explanation, and the responsibility path, without asserting that any of those artifacts are correct.

The disclosure boundary needs a clear object. A whole pull request may contain human-written scaffolding, machine-generated implementation, generated tests, and later human repairs. One label at the request level is simple and loses that composition. A marker on every line is more precise, produces noise, and depends on editor and diff support. Commit-level trailers preserve a durable unit in repository history, although squashing or copying changes can separate the trailer from the code it described.

There is no universal granularity to adopt. The team should identify the review decision the label is meant to affect, then choose the smallest unit whose provenance survives the repository workflow. Test that survival through rebases, cherry-picks, squash merges, file moves, and copied patches. A provenance control that disappears during the normal merge path produces a confident but incomplete history.

My own authorship-measurement project shows why the semantics of a provenance count must stay narrow. I measured a 14.5 percent trailer-signed floor, a lower bound on visible trailer-marked authorship, because every match was treated as a true positive. That figure says nothing about total agent contribution, and it must not be averaged with an inferred share. An earlier exploratory range was superseded when a replication whose design was fixed in advance returned 'Not identified'. The estimator had targeted the agent share of authorship beyond the trailer-marked floor, and the verdict recorded that it did not identify that share under the prespecified design. Only the reliable floor survives, because the identification failure invalidates the larger estimate.

Provenance and authorship also separate from answerability. In my maintainer practice, an adoption pull request can preserve a contributor's commits verbatim while recording:

```text
Supersedes #X
Credit: original fix by @X (commit preserved with original authorship)
```

The original author remains attached to the work, and the maintainer who adopts and submits it becomes answerable for the integration decision. Both facts survive in the artifact. The format does not establish that the code is correct. It removes the need for a later reviewer to infer who wrote the change and who accepted responsibility for putting it forward.

Persistent provenance also supports incident reconstruction. A reviewer examining a regression can ask whether the failure arose in generation, in human modification, in integration, or in a later environment change. That question is harder to answer when labels exist only in an editor and disappear before merge. The companion catalog covers one tamper-evident history design under `record-steps-in-hash-chained-ledger`, and the argument here does not depend on that implementation.

The workload cost Tang and colleagues measured limits the recommendation. Higher cognitive workload may be acceptable when disclosure focuses attention on an occasional generated fragment. In a mixed codebase where the marker appears on most changes, constant exposure can tax attention and lose salience.

Those results do not establish how large diffs, sustained review queues, or experienced teams respond over time. A local evaluation should therefore measure reviewer behavior and repair outcomes rather than label coverage alone. Useful observations include whether reviewers open referenced files, run or inspect tests, search documentation, change the generated code, detect seeded defects, and report excessive workload.

Compare equivalent review tasks with and without provenance disclosure, under the actual tools and queue constraints. Assigning the same artifacts to both conditions removes the difficulty of the change from the comparison, in the way Chapter 1 describes for paired designs. A comparison drawn across different pull requests instead confounds disclosure with artifact difficulty. Pairing on the artifact alone is not sufficient, because the experimental unit is the reviewer-artifact pair. The design must therefore state how reviewers are assigned to conditions, whether anyone reviews the same artifact twice, and how condition order is counterbalanced. It must also decide which defects count and how workload will be measured, and the study supplies no production cutoff to copy.

If disclosure increases activity without improving repair, the label may be producing ritual rather than evidence. If repair improves while queue latency or abandonment rises sharply, the team has found a real tradeoff between scrutiny and capacity. Either result is more informative than a policy requiring an 'AI-generated' badge everywhere. The relevant question is whether provenance changes verification in the deployed review environment.

The companion entry `write-an-agent-contribution-policy` covers the repository rules around disclosure, attribution, and accepted contribution paths. Such a policy can keep the wire format consistent, but it cannot make the label effective. Effectiveness remains an observed relation among the marker, the verification surface, reviewer behavior, and repair.

## A gate must have causal power

A human gate has support here from two directional literature items and no strong evidence item. Sterz et al. ([2024](https://arxiv.org/abs/2404.04059)) set out an interdisciplinary framework for effective human oversight, and their paper contains no empirical validation of a universal test. Green ([2022](https://arxiv.org/abs/2109.05067)) compared 41 government oversight policies with findings from human-computer interaction research and concluded that the human functions those policies prescribed were generally not performable. These sources justify an audit structure and a burden of proof. The effectiveness of any given gate remains unresolved until the deploying team tests it.

In a workflow diagram, the word 'gate' reads as causal. In execution, an approval step may only record that a person clicked before an action that neither the person nor the click could alter. Compliance theater is a control whose visible form satisfies a policy description while its execution path does not mitigate the named risk. A fail-open gate stops enforcing its boundary when a dependency, validation step, or error path fails.

The interdisciplinary framework identifies four conditions for an effective oversight person: causal power, epistemic access, self-control, and fitting intentions. Causal power means the person can stop or change the consequential action. Epistemic access means the person can obtain the information needed to understand the decision at the time it is made. Self-control means the person can exercise judgment rather than follow a compelled path. Fitting intentions means the person actually intends to perform the assigned oversight function.

Evaluate these conditions against an execution trace. For each named gate, trace the proposed action from creation through approval, mutation, dispatch, and durable state change. Introduce the failures the gate claims to handle. Observe whether the reviewer receives the required evidence, whether rejection blocks every execution path, and whether an altered action requires renewed review.

| Condition | Question for the actual gate | Observation to collect | Failure implication |
| --- | --- | --- | --- |
| Causal power | Can this person stop or alter this exact action? | Reject, cancel, edit, and timeout traces | The click records assent but does not control execution |
| Epistemic access | Can the person inspect the relevant inputs, diff, target, and consequences before acting? | Missing context, inaccessible logs, and reviewer reconstruction errors | Approval is based on an incomplete system state |
| Self-control | Can the person choose without a forced default or an impossible queue constraint? | Default acceptance, time pressure, and override use | The workflow substitutes acquiescence for judgment |
| Fitting intentions | Is the assigned role expected and prepared to examine the named risk? | Review actions, escalation behavior, and interviews | The role is ceremonial or aimed at a different risk |

The observations need system-specific acceptance criteria. A team might decide that a deployment approver must be able to cancel a queued release before the first production mutation, and must see the exact artifact digest being deployed. Another team may require a database reviewer to alter the migration plan while prohibiting direct execution. Name the claimed function, construct a trace that could falsify it, and decide in advance what evidence would demonstrate control.

Removing a gate dependency is itself a state change, so the failure experiment belongs in an environment where the mutation it might permit is contained. Chapter 7 supplies that boundary. An audit run against production to see whether the gate holds is an experiment whose negative result is an incident.

My human-approval queue failed that test. Missing components let scripts bypass the path that was supposed to wait for a person, and unvalidated command construction weakened the relationship between the reviewed proposal and the executed command. The presence of a decision queue did not establish causal power. Its failure was useful contrary evidence, because the queue had been built specifically to preserve human-only decisions.

Another of my systems used a reproduction-before-mutation hook, a check intended to require a reproducible failure before code could be changed. When a required binary was missing, the hook stopped enforcing the gate entirely. The project documented that fail-open behavior rather than counting the hook's installation as coverage. The case does not measure how often such failures occur. It shows how an environmental dependency can erase a governance boundary.

Mechanical and attentional gates fail differently. A mechanical gate uses execution state to block an action until a condition holds, such as a verified signature or an explicit `--apply` flag. An attentional gate presents evidence to a person and requires a decision, such as reviewing a diff explanation. A mechanical gate can enforce a condition that does not establish the property the gate is credited with. An attentional gate can obtain a click without scrutiny. Agent memory is neither kind, because a remembered instruction has no independent causal path to enforcement.

In my own approval-gate configuration, seven action-class rows make that distinction explicit. Every row identifies the gate as mechanical or attentional and names an owner, and no row relies on agent memory. Mutating commands dry-run by default and require `--apply`, which puts a mechanical boundary between inspection and state change. This is a design exemplar, not evidence that seven rows, this flag name, or these classifications improve outcomes elsewhere.

A more elaborate gate does not escape the same audit. In pull request 1558 of my agent-fleet orchestration system, the review surface recorded:

```text
Latest review attempt: 6
Quality score: 950/1000, threshold 850
```

The attempt count and the scores are verified properties of that artifact. The gate was designed to concentrate human attention after repeated model review, and degradation of the gate was treated as an incident. The claimed attention saving remains a design claim, because maintainer minutes, scrutiny depth, and escaped-defect rate were not measured.

Optimizer and model-review gates depend on the same distinction. A threshold can block execution mechanically while providing no assurance that its score tracks the failure a human cares about. The companion entries `treat-objective-weights-as-reviewed-policy` and `gate-optimizer-output-behind-human-review` address those policy surfaces. Their presence does not remove the need to test whether rejection changes system state and whether the reviewer can interrogate the score.

Green's policy analysis places the burden of proof on the institution deploying the automation. A team should be able to justify why automation is appropriate for the action, and demonstrate that its reviewers can perform the function assigned to them. When the reviewer cannot see the relevant diff context or cannot stop the deploy, adding their name legitimizes the action without reducing its risk. Responsibility then diffuses toward the actor with the least practical control.

That negative conclusion is bounded. Code review can offer unusually strong epistemic access, because the reviewer can inspect a precise diff, run tests, examine history, and delay the merge. Chapter 15 describes the verification surface that makes such access practical. A government benefits decision, a live vehicle intervention, and a repository change do not present the same verification problem. The audit should test the gate in its own domain, and these cases support no universal conclusion about human incapacity or human benefit.

Chapter 7 also established why a control cannot be accepted solely because the harness attests that it ran. The governance extension asks whether a person can independently verify the relevant state and interrupt the path that changes it. A missing independent signal weakens override authority even when an override button exists.

Three companion entries sit beside this one, each resting on a single evidence item. `separate-control-from-oversight`, `write-an-oversight-card`, and `keep-override-authority-real` can help classify control before action, oversight after action, claimed reviewer duties, and override paths. None of them establishes that a particular gate works.

## Responsibility must follow control

Cavalcante Siebert et al. ([2023](https://arxiv.org/abs/2112.01298)) provide a philosophy-to-engineering bridge, a conceptual framework that makes responsibility commensurate with the ability and authority to control. Suryana et al. (2025) provide a qualitative operationalization in another domain, using interviews with 103 users of partially automated driving systems to locate expectation gaps and inconsistent protocol adherence. Together these are two directional literature items, and this practice carries no strong evidence item. Organizational accountability results for agent systems are thin and brand new. Their support reaches a defensible audit method, and they supply no compliance score and no estimate of software-delivery failure rates.

After a failure, organizations often name the engineer who approved, monitored, or happened to be on call. That assignment can be formally clear and causally false. When the person lacked authority to halt the action, access to its state, tools to change it, or time to intervene, accountability has been assigned to proximity rather than control. The resulting responsibility gap produces blame without adding a path that could have prevented the failure.

The control check begins before an incident. For every role named as accountable, identify the exact state transition that role can authorize, alter, stop, or reverse. Verify the permissions with the deployed identity rather than an administrator's demonstration. Record the information available at decision time, the tools through which intervention occurs, and the window in which an intervention remains effective.

Authority and access are distinct. An engineer may have permission to cancel a deployment but lack access to the tenant, model trace, or configuration that explains why cancellation is necessary. Tooling and time are also distinct. A working rollback command does not create control when the system commits an irreversible external action before the reviewer can evaluate it.

Missing control has two coherent remedies. The organization can repair the role by granting the necessary authority, access, tooling, and time, subject to least privilege. Otherwise it can move responsibility to the role that already holds those controls. Leaving the responsibility label in place while control sits elsewhere preserves the gap by design.

This check should include the executing identity. In my own enterprise data-access service, mutations are excluded, requests use the caller's identity, and the audit log names that person. The blast radius is capped at authority the human already holds. The design aligns action and identity more closely than a shared privileged service account, but it does not establish that every read is justified or that the caller understands the result.

Identity passthrough also has a cost. It improves attribution and prevents an agent from silently accumulating broader authority than its operator. It can reduce availability when the caller lacks a permission that an automated workflow previously obtained from a service account. The correct response is to decide which authority the action actually requires, then measure authorization failures, escalation paths, and unauthorized access attempts.

Provenance answers a neighboring question. It records who or what contributed to an artifact and how that contribution moved through the workflow. Accountability identifies the person or institution answerable for the decision to accept and deploy it. The adoption pull-request format shown earlier preserves original authorship while transferring integration answerability to the maintainer. Conflating those roles would either erase contribution history or blame a contributor for a deployment decision they did not control.

Meaningful human control supplies a way to examine that relationship after deployment. In this literature, tracking asks whether system behavior follows the relevant and justified reasons or expectations of the people affected by it. Tracing asks whether a capable, aware person can be connected to the decision and its control path. The terms become useful once a team translates them into observable behavior for its own system.

Suryana et al. applied the tracking and tracing criteria through interviews with 103 users of Tesla Autopilot and Full Self-Driving features. The interviews localized expectation-reality gaps and inconsistent adherence to operating protocols. Those results do not establish that software delivery has the same failure frequency or the same causes. They show what user interviews can reveal and a design document cannot. A deployed system may teach expectations and routines that differ from its stated control model.

For an agent that prepares production changes, a tracking interview might ask what users believe the agent will modify, which constraints they expect it to preserve, and what evidence would cause it to stop. Compare those expectations with actual traces and with policy. A tracing interview might ask who can explain a particular action, who could have changed it at each stage, and where a user would escalate when behavior diverges. Compare the answers across operators, reviewers, owners, and affected users.

The audit locates failures, but there is no scalar certification to compute. A shared credential may erase the responsible identity even when the system tracks user expectations well. A complete decision history can coexist with systematic user misunderstanding about when the system will act. Collapsing both into a single 'meaningful control' score would hide the repair each system requires.

Operational definitions must therefore remain local. A code-deployment system can define a traceable decision through artifact digest, approver identity, execution identity, and rollback authority. A data-access agent may need caller identity, query purpose, source authorization, and a record of returned fields. A partially automated vehicle has different timing, embodiment, and safety constraints. The questions about control and awareness port across domains, while the observed rates and the exact controls do not.

Collective work complicates responsibility without removing it. Models propose, tools execute, reviewers approve, platform teams configure permissions, and managers allocate review capacity. The companion entry `rebuild-collective-accountability` addresses how those contributions fit an institutional account, and `scale-review-capacity-to-experience` addresses review-load planning by contributor experience tier. Neither should be used to spread answerability so broadly that no role owns a stoppable state transition.

## Test the operational path

Run the four checks on a defined action class and repository workflow.

1. Define the action class, the outcome, and the material difference that would justify wider authority. Collect every transfer using denominators that do not exclude rejected or timed-out proposals. Do not mix action classes or rungs, and do not record only executed actions. Calculate uncertainty, test reviewer comprehension, and widen one rung only when those observations support it.

2. Choose the smallest unit whose provenance survives the repository workflow. Test that survival through rebases, cherry-picks, squash merges, file moves, and copied patches. Keep the count semantics narrow: the 14.5 percent trailer-signed floor is a lower bound on visible trailer-marked authorship and must not be averaged with an inferred share.

3. Run the gate audit as a failure experiment in a contained environment. Name the action and owner, capture the execution trace, remove each gate dependency in turn, reject and alter the action, inspect the reviewer's evidence, and verify the resulting durable state. Interview the assigned reviewer about the risk they believe they are checking, then compare that account with the system path. Repair or remove a gate that cannot demonstrate causal power and epistemic access, and decide explicitly how self-control and fitting intentions will be protected under real queue load.

4. Run the accountability audit in two passes.

   1. In the first pass, for each named accountable role, select a real action and verify authority, access, tooling, and time. Exercise reject, alter, stop, and recovery paths with that role's deployed permissions. Record which state transitions remain outside its control, then either repair the controls or reassign responsibility.

   2. In the second pass, interview actual users and operators using tracking and tracing questions. Compare justified expectations with execution traces, then identify a capable, aware person for each consequential decision. Record expectation mismatches, protocol deviations, missing identities, and escalation dead ends as separate findings.

Repeat the first pass when permissions, execution paths, or action classes change, and repeat the second when the user population or operating protocol changes. Measure the findings that carry weight in the deployment, such as untraceable actions, failed stops, expectation mismatches, and time lost before effective intervention. Do not adopt a borrowed pass rate. Decide which failures invalidate the accountability claim, and preserve the evidence needed to reproduce that decision.

## Sources and evidence

The evidence class and strength on each entry below come from its catalog record. Author-system cases in this chapter are narrative illustration and are not part of the evidence base.

Support is thin across the chapter: 4 taught entries carry 7 evidence items, of which 2 are strong and 5 directional; 6 are literature and 1 is practitioner. `audit-human-gates-for-effectiveness` and `align-accountability-with-actual-control` carry no strong evidence item.

### graduate-autonomy-per-action-track-record

- practitioner/directional: "When Should a DevOps Agent Act Without Human Approval?", Bala Priya C, DevOps.com, 2026-05-11, [article](https://devops.com/when-should-a-devops-agent-act-without-human-approval/). Supports action-type autonomy promotion at roughly 95% unmodified approval, permanent approval floors for irreversible or high-blast-radius actions, and decision-ready gates with timeout plans. The protocol comes from one practitioner article; the threshold is stated, not measured.
- lit/strong: Chen, V., Talwalkar, A., Brennan, R., Neubig, G. (2025). Code with Me or for Me? How Increasing AI Automation Transforms Developer Workflows. arXiv:2507.08149. In the controlled study, users' failure to understand agent behavior, not capability, limited broader adoption.
- Corroboration (narrative only): a demoted author-distilled field note about a 2025 lights-off agent factory failure, the operator policy, and an essay describing per-action autonomy with a batched morning decision ledger. The field note is not independent support.

### label-ai-provenance

- lit/strong: Tang, N., Chen, M., Ning, Z., Bansal, A., Huang, Y., McMillan, C., Li, T. J.-J. (2024). A Study on Developer Behaviors for Validating and Repairing LLM-Generated Code Using Eye Tracking and IDE Actions. arXiv:2405.16081. Supports improved repair performance and greater verification effort with provenance disclosure; recognition without disclosure was unreliable. Limited by a small laboratory sample and code chunks of tens of lines; the attention cost may not scale to constant exposure.
- Corroboration: none on record.

### audit-human-gates-for-effectiveness

- lit/directional: Sterz, S., et al. (2024). On the Quest for Effectiveness in Human Oversight: Interdisciplinary Perspectives. ACM FAccT 2024. arXiv:2404.04059. Supports four conditions for effective oversight persons; gates failing any condition are compliance theater. The framework is motivated by EU AI Act Article 14, not empirically validated.
- lit/directional: Green, B. (2022). The Flaws of Policies Requiring Human Oversight of Government Algorithms. Computer Law & Security Review 45, 105681. arXiv:2109.05067. Compares 41 policies with the human-computer interaction record and shifts the burden of proof to the deploying institution. The negative claim transfers only where reviewers lack real verification surfaces; code review differs in verifiability.
- Corroboration (narrative only, contrary): the human-approval queue audit found fail-open scripts and unvalidated command construction, while the reproduction-before-mutation hook stops enforcing when a required binary is absent.

### align-accountability-with-actual-control

- lit/directional: Cavalcante Siebert, L., et al. (2023). Meaningful human control: actionable properties for AI system development. AI and Ethics 3, 241-255. arXiv:2112.01298. Supports responsibility commensurate with ability and authority to control, the framework's third actionable property.
- lit/directional: Suryana, L. E., Nordhoff, S., Calvert, S., Zgonnikov, A., van Arem, B. (2025). Meaningful human control of partially automated driving systems: Insights from interviews with Tesla users. Transportation Research Part F 113, 213-236. Applies tracking and tracing criteria to 103 users to localize expectation-reality gaps and inconsistent protocol adherence. The method requires case-specific operationalization, yields failure localization rather than a compliance score, and is evidenced here in the driving domain. No arXiv identifier or DOI is carried in the catalog record, so the inline citation is unlinked.

Author-system cases in this chapter are narrative illustration, not evidence.
