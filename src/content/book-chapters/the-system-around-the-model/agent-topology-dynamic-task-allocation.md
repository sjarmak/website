---
title: "Agent topology selection and dynamic task allocation"
book: the-system-around-the-model
order: 17
part: 6
kind: chapter
number: 17
---

In one rerun of CodeProbe ([public repository](https://github.com/sjarmak/codeprobe)), I changed an agent's preamble to correct a retrieval behavior I had already diagnosed. The patch changed cost and left the failure that motivated the experiment untouched. On the task family where I had diagnosed the retrieval behavior, cost fell 28 percent, while the primary reward difference was +0.0048 with a t statistic of 0.27, not distinguishable from noise in that comparison. The wall-clock prediction failed in sign as well as magnitude. I had hypothesized a 40 percent reduction, and elapsed time increased by 3.9 percent. The agent still accepted a false-negative retrieval result and built its answer around missing evidence.

The patch moved the wrong variable. The agent had been instructed to synthesize for coverage, but the execution path still treated an empty tool result as authoritative. That coupling lived in the harness, not in the sentence-level wording of the preamble. Once a failure class survives the persistence test defined in the next section, the next available lever is structural. The relevant choice is how to divide the work, including whether to divide it at all.

Prompt changes are cheap, visible, and easy to attribute to a single experiment. Structural changes alter the boundaries between components: which worker retrieves evidence, which worker interprets it, which observations cross the boundary, and which component can reject the result. They are harder to test because several causal paths may change together. They are also sometimes the only intervention aimed at the location where the failure is produced.

## A failure class earns a structural repair only after it persists

A recurring failure is not merely an error that happened more than once. I call a failure class persistent only after a paired before-and-after comparison across model versions, with repeated trials, shows that the class survives. A single successful run on the newer model proves no more than a single failed run on the older one. The variance methods from Chapter 1 still apply when the proposed treatment is a model upgrade, and the outcome should be analyzed as paired per-item differences rather than as two aggregate scores.

Once persistence is established, the taxonomy and first-upstream-error method from Chapter 10 locate the earliest supported cause. That location constrains the repair. If a retriever returns an incomplete candidate set, improving the final writer's admonition to cite sources attacks the last visible symptom. The repair belongs where the candidate set is formed, checked, or handed off. The companion catalog states the broader rule as repairing the supported root cause rather than the last step. Its evidence is thin, and I therefore use it here only as a diagnostic reminder.

Cemri et al. ([2025](https://arxiv.org/abs/2503.13657)) built MAST, a taxonomy of failure modes in multi-agent language-model systems. They reported limited gains from prompt improvements on persistent classes, and better outcomes from changes such as verification-topology redesign and modular roles while retaining the same underlying model. The studied systems included benchmark frameworks such as AG2 and ChatDev, not production deployments. Those interventions therefore establish plausible structural remedies inside the evaluated frameworks, not portable recipes for an arbitrary agent system.

Kim et al. ([2026](https://arxiv.org/abs/2602.09937)) provide a stronger cross-version result in a different domain. Across the capability tiers their OpenRCA study evaluated, dominant failure modes in cloud root-cause analysis remained present. Prompt engineering had not removed the communication failures, but richer communication protocols reduced them by as much as 15 percentage points. That is evidence that an architectural failure can survive a stronger model.

Those results do not establish a coding-agent failure rate, and they do not show that prompt engineering is generally ineffective. The measured domain was cloud root-cause analysis. One check transfers. Before spending another round on wording, establish whether the persistent class is architectural.

The specificity of the OpenRCA result is useful. Protocol enrichment addressed communication-class failures. Hallucinated interpretation required a different architectural response. A structured message cannot repair a worker that invents the meaning of accurate evidence, and a stronger verifier cannot recover evidence that no upstream worker retrieved. 'Change the structure' is a direction to revisit causal boundaries, not a claim that one topology cures every failure.

A multi-agent system is several model-driven workers coordinating on one task, with a topology that determines which workers can exchange observations and where their outputs converge. Topology is the communication and decision structure, distinct from the implementation that happens to realize it. Two programs can use the same queue library and still have different topologies if one exposes every worker's output to every other worker while the second routes all outputs through a lead. Two implementations can also realize the same topology through different runtimes.

Role specialization is one structural intervention: assign distinct responsibilities, evidence access, and acceptance conditions to workers instead of asking every worker to perform the entire task. In the opening retrieval case, specialization could separate candidate discovery from evidence adjudication. The retrieval worker would return candidates plus explicit coverage fields, and an adjudicator would test whether an empty result was credible before the writer could treat it as absence. The specialization is justified here because it creates a boundary at which the false-negative claim becomes observable and rejectable. Adding personas alone does nothing.

Structured fields address the same coupling. Free-form messages often collapse evidence, interpretation, and confidence into one paragraph, leaving the receiver unable to tell whether a claim came from a tool result or from the sender's inference. A handoff record can keep those states separate:

```text
query: exact request issued to the retriever
candidates: identifiers returned by the retriever
coverage_checks: alternate queries and their results
claim: the sender's interpretation
status: supported | incomplete | failed
```

This schema does not make the interpretation correct. It makes an incomplete search distinguishable from a supported negative conclusion, and it gives a verifier a specific object to challenge. During failure, the status must remain `failed` or `incomplete`. Converting it to an empty success recreates the original coupling behind a cleaner interface.

The structural boundary can also be a verification loop rather than a new worker. A single agent can produce an artifact, run a deterministic check, inspect the failure, and revise. Adding an independent reviewer becomes justified when the producer is poorly positioned to detect its own error, when independent evidence access matters, or when the review policy should remain isolated from generation. Role specialization describes distinct responsibilities, not necessarily distinct model instances.

The first structural question is which decision needs an independent state boundary. The agent count follows from the answer. Sometimes the answer is none. Sometimes one additional verifier is enough. A five-worker conversation that shares the same incomplete evidence may amplify confidence without changing the failure path.

The accounts grouped under 'harness engineering' describe teams accumulating agent capability in execution boundaries, verification loops, repository instructions, and rollback or approval controls rather than in prompts alone. Böckeler ([2026](https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html)) analyzes vendor-reported practice from the OpenAI Codex team, and Jain ([2026](https://www.reddit.com/r/devops/comments/1touxz4/)) writes as a practitioner rather than reporting a controlled evaluation. Both omit the verification detail needed to estimate an effect. They describe where practitioners report making repairs, while Cemri et al. (2025) and Kim et al. (2026) carry the evidentiary claim about persistent classes and structural intervention.

My own diagnostic traces add a caution about what prompt evidence can establish. In an observational set of 1,705 thinking blocks from 199 traces, agents never named the two dominant tools in their written reasoning, and 65 explicit reference-finding intentions produced no use of the purpose-built reference tool. Zero mentions did not imply zero prompt influence. In a later 17-run experiment, deliberation-style preambles changed tool selection on matching tasks while scores remained 4.0 versus 4.0.

Those observations separate two questions that are often merged. Prompt steering may alter selection efficiency even when the task score does not move. The target failure class in my rerun still survived. The experiment therefore did not justify another wording patch as the primary repair. I needed a boundary that checked retrieval coverage before synthesis trusted the result.

Structural repair has costs. Splitting work introduces handoffs, new failure states, more tokens, and more places for stale or conflicting state to accumulate. A verifier can reject correct work, a specialist can lose context available to a generalist, and a protocol can omit the one field later needed for diagnosis. Representing roles in configuration may make topology easier to revise, but that proposal has thin support and an unmeasured maintenance cost. I treat it only as an option from the companion catalog. The evidence does not establish the practice.

The repair criterion is therefore causal and comparative. Change the smallest boundary that can interrupt the observed failure path, preserve the failure evidence through that boundary, and replay the same cases. If the class does not move, the new structure has added coordination without addressing the cause.

## Gate fan-out on a live single-agent baseline

Every proposal to add debate, delegation, or parallel workers needs a live single-agent control. Fan-out means assigning one task, or parts of it, to multiple workers whose outputs must later be selected or combined. Delegation is the act of transferring responsibility for a defined unit of work to another worker. Neither mechanism should receive credit merely because the system was configured to permit it.

The practical comparison is already available in the golden set from Chapter 4. The single-agent workflow becomes one configuration replayed against the same tasks and unambiguous oracles as the proposed team. I record the promotion threshold before the first comparison and score repeated trials with pass^k, which requires the same repeat count in both arms. The treatment advances only if it improves task success and the relevant cost measure. Chapter 2's Pareto discipline rejects a quality gain whose cost makes the workflow unusable.

The gate is a measurement. Work with genuinely independent branches, high error costs, or reasoning requirements beyond a reliable single trajectory can still clear it. Those properties make fan-out plausible, subject to a measured test of whether coordination and aggregation consume the expected benefit.

Chun et al. ([2025](https://arxiv.org/abs/2503.12029)) compared debate configurations against task baselines and reported the inference cost of the debate variants themselves. They did not measure debate against a single-model baseline on cost, and they left that comparison open. A debate treatment therefore receives no presumed inference benefit. Li et al. ([2026](https://arxiv.org/abs/2606.00655)) supply the cost side of the gate with a controlled result on scaling behavior in SIMAS. Their multi-agent configurations incurred roughly a 15-fold token premium, returns were non-monotonic as agents were added, and debate could underperform self-correction.

A strong explorer synthesis across several studies supports the general gate. No single standardized experiment does. These are strong results within the studied tasks and configurations, and they provide no universal exchange rate for adding a worker. Token premiums depend on prompt length, round count, shared context, model mix, and how much duplicated work the topology induces.

Other exploratory syntheses point in the same direction across heterogeneous and homogeneous teams, consensus systems, and scaling networks: Tian et al. ([2025](https://arxiv.org/abs/2509.23537)), Kumar et al. ([2026](https://arxiv.org/abs/2604.13120)), Bertalanic et al. ([2026](https://arxiv.org/abs/2605.00914)), and Qian et al. ([2024](https://arxiv.org/abs/2406.07155)). Because these items summarize overlapping underlying sources, and the evidence audit did not retain them as strong controlled evidence, I use them only as directional support. The gate rests on the retained Chun and SIMAS results, then asks the reader to reproduce the comparison on the actual workload.

Aggregation belongs inside the treatment definition. Chapter 5 reported an exploratory plurality-vote oracle gap of up to 32.3 percentage points, measured by Bertalanic et al. (2026). A correct answer was present among the candidates, and the voting rule selected another answer. That result establishes only a reported failure mode. Its frequency in other workloads remains unknown. It is enough to show that 'at least one agent solved it' and 'the system returned the solution' are different outcomes.

Suppose five agents inspect a code change. Three repeat the same shallow diagnosis, one finds a real race condition, and one returns an unrelated concern. Plurality voting selects the shallow diagnosis even though the candidate set contains the critical finding. A synthesis agent might recover the minority result, but it can also suppress it if all reports arrive as undifferentiated prose. The gate must score the final system output, retain candidate-level outcomes, and record whether the aggregator discarded an oracle-correct candidate.

The same requirement applies to debate. A debate protocol can make agents converge when later turns expose them to the same early answer, even if independent reasoning never resolves the issue. If independence is the reason for adding reviewers, the treatment must preserve it long enough to be tested. Blind review lanes, in which reviewers do not see the producing agent's identity, are a thinly supported companion-catalog option for reducing one obvious source of coupling. They are not an established cure for correlated errors.

Cost measurement also needs the topology's full boundary. Count the planner's tokens, worker context, messages, retries, synthesis, verification, failed branches, and the final worker call. Record latency separately from token or monetary cost, because parallel execution can reduce elapsed time while increasing total computation. A design may be rational for a high-value incident response even if it loses the cost comparison on routine maintenance. The gate makes that tradeoff explicit.

Chapter 18 develops model routing and cost engineering in more detail. For this gate, the minimum requirement is narrower. Choose the cost axis that matters to the workflow, measure it end to end, and state the acceptable increase before looking at the treatment result. A cost ceiling chosen afterward can always be made to accommodate the favored architecture.

One validity check comes before any score comparison. The multi-agent mechanism must actually run. In my own repository-scale benchmark, I configured a lean-subagent treatment across four arms and roughly 200 trials, including investigation tasks, and observed zero spawns. The result showed only that the proposed treatment never entered the execution path, rather than that subagents were ineffective.

That negative result belongs in the evaluation record because configuration is not behavior. A system may expose a delegation tool while the planner never calls it, may dispatch workers but ignore their responses, or may ask multiple workers questions that do not partition the task. Each case can produce treatment labels that say 'multi-agent' while the observed causal path remains effectively single-agent.

I therefore instrument the gate at three levels. First, the configuration record states which topology was available. Second, the execution trace records delegations, messages, worker completions, retries, and aggregation decisions. Third, the outcome record links those events to the final answer and cost. A result is eligible for the multi-agent comparison only when the trace shows that the defining coordination behavior occurred.

The eligibility condition has to be declared before the run, for the same reason Chapter 2 requires a component-usage gate to be declared before outcomes are inspected. A condition written after the trials selects on the result. Declared in advance, it distinguishes noncompliance from architectural failure. If no delegation occurs, the planner or its tool boundary is the immediate problem. If delegation occurs and branches produce useful results that the aggregator discards, the convergence point is the problem. If every branch makes the same error after receiving the same incomplete context, adding more workers has exposed a shared upstream dependency.

The baseline must remain live as models change. A team topology that once improved task success can become unnecessary when a later single model absorbs the relevant capability. It can also become more valuable if the stronger model makes a better planner while specialists remain cheap. Replaying both configurations per release turns this change into a measured comparison. Without the single-agent arm, improving team scores can conceal that the simpler system improved faster.

A compact promotion record for one workflow can therefore contain:

```text
golden_set_version: repository-maintenance-2026-07
single_agent: pass^k, total tokens, elapsed time, failures by class
multi_agent: pass^k, total tokens, elapsed time, failures by class
mechanism_check: delegations observed, branches consumed, aggregator used
aggregation_check: correct candidates retained or discarded
promotion_rule: recorded success floor and cost ceiling
decision: promote | retain baseline | redesign treatment
```

The gate answers whether to divide the work before topology selection answers how. A multi-agent design that cannot clear it should return to the structural diagnosis. The next experiment may need a narrower specialist boundary, a different aggregator, or no additional worker at all.

## Match the topology to the shape of the work

Jia et al. ([2026](https://arxiv.org/abs/2602.19843)) injected synthetic faults into three multi-agent architectures in MAS-FIRE. Closed-loop architectures neutralized more than 40 percent of injected faults that had collapsed the linear-pipeline configuration outright, and stronger foundation models did not uniformly produce greater robustness. The faults were synthetic and the comparison covered three architectures, so that evidence does not establish a general preference for closed loops. It does show that message routes and feedback paths can determine whether a local fault becomes a system failure.

A pipeline is a sequence in which each stage hands its result to the next. It fits work that decomposes into stable ordered transformations, such as retrieve candidate files, extract relevant regions, generate a patch, then run tests. The topology is easy to inspect because state moves in one direction and each transition has an identifiable producer and consumer. Its weakness is equally clear. An early omission can pass through every later stage without any component able to revisit the source.

Pipelines also create semantic compression at each handoff. If the retrieval stage emits only file excerpts, the patching stage may never see that candidate coverage was uncertain. Adding a status field helps, but it does not create a return path. When downstream evidence can invalidate an upstream decision, the task no longer has a purely linear shape, even if its implementation is written as a sequence of functions.

An orchestrator-worker topology gives one agent responsibility for planning, dispatch, and integration while workers execute bounded assignments. It fits tasks whose decomposition depends on the initial context but whose branches can be evaluated separately. A repository migration, for example, may require the orchestrator to identify affected packages, send independent compatibility checks to workers, and integrate their findings into one ordered change plan.

The orchestrator owns global task state in that design. Workers should receive enough evidence to complete their assignments, but they do not need the entire message history by default. Their results return through a defined convergence point where conflicts can be detected. Failure of the orchestrator has a larger blast radius than failure of one worker. Durable state and replay semantics at that boundary therefore do more for reliability than adding another worker.

Hierarchy or explicit leadership extends that arrangement when a flat team would exchange too many messages, or when subproblems themselves need coordination. A lead bounds communication by assigning work to subordinate groups and accepting their summaries, and workers do not all communicate with one another. This can reduce message growth, but summaries introduce information loss and leadership concentrates authority. Justifying a hierarchy requires evidence that a lead will bound message growth and integration work, regardless of the managerial titles assigned to participants.

A blackboard is shared evolving state that workers read and update during execution. It fits tasks when the next useful contribution depends on discoveries made by any participant, such as incident investigation in which logs, hypotheses, eliminated causes, and requested checks change throughout the run. The blackboard externalizes state that would otherwise be scattered across pairwise conversations. It also creates concurrency obligations: updates need identities, versions, and conflict rules, and workers need a way to distinguish an untested hypothesis from an established observation.

Consider a security review of a large change. A pipeline is appropriate if the review consists of fixed analyzers followed by one synthesis step. An orchestrator-worker design fits when an initial planner can divide the diff by attack surface and send bounded reviews to specialists. A hierarchy becomes plausible when separate package leads must coordinate their own reviewers. A blackboard fits an exploratory investigation in which one worker's discovery changes what every other worker should inspect next.

These forms are decision vocabulary and can be combined. An orchestrator may dispatch several pipelines. A hierarchy may use a blackboard for cross-group evidence while keeping control messages within leadership paths. The architectural question concerns which component owns each state transition and which agents can observe it. Configuration labels do not resolve that question.

Zhao et al. ([2026](https://arxiv.org/abs/2605.26178)) give strong experimental support in ATOM only for treating topology as a first-order variable and adapting it to task difficulty, rather than for one average design across all cases. Their evaluation used five-agent teams with two open models across MMLU, GSM8K, HumanEval, AQuA, MultiArith, and SVAMP. Those are six short-form question-answering, mathematics, and code benchmarks. The result supports difficulty-conditioned orchestration in that scope.

Topology-to-task-shape matching remains unvalidated for the repository-scale coding-agent work this book is about. Long-horizon repository tasks have persistent files, tool side effects, partially completed branches, expensive tests, and conflicts that short-form answers do not represent. I use the topology menu as an engineering hypothesis to test under those conditions. The cited benchmark does not transfer a conclusion to this setting.

Two directional lines of work broaden the design vocabulary without resolving that boundary. Huang and Zhou ([2026](https://arxiv.org/abs/2605.13850)) organize agent design patterns along two dimensions, and Shang ([2026](https://arxiv.org/abs/2604.08206)) relates blackboard coordination to a global workspace in Theater of Mind. Both provide exploratory, directional support only and contribute no quantitative claim here. An active-blackboard variant that schedules contributors for diversity is likewise a thin-support companion-catalog idea, and the evidence in this chapter does not establish it as a practice.

Fault propagation supplies a practical selection test. In a linear pipeline, a retrieval fault may contaminate every downstream artifact. In an orchestrator-worker system, the same fault may remain local if the orchestrator compares workers against independent evidence, or become global if it distributes one corrupted premise to all of them. In a hierarchy, a lead's mistaken summary can hide correct subordinate findings. On a blackboard, a false claim can spread through repeated reads unless provenance and state labels remain attached.

![Fault propagation depends on collaboration topology, ranging from downstream contamination in pipelines to contained local errors when shared systems preserve provenance and state labels.](/book-figures/ch17-topology-faults.svg)

Containment is conditional because a shared corrupted premise, a mistaken lead summary, or repeated unqualified reads can turn isolated faults into global failures.

The observation routes are therefore part of correctness. Record which worker sees raw tool output, which sees only a summary, whether a downstream verifier can request new upstream evidence, and whether a worker learns other workers' tentative conclusions before forming its own. These properties determine correlation, recovery, and blame assignment even when every agent uses the same model and prompt.

Runtime oversight can represent the system as an interaction graph whose nodes are workers and artifacts and whose edges are messages or state transitions. That representation is a thinly supported aside in the companion catalog, and it has not been evaluated as a monitoring standard. It is still a useful inspection lens, because it makes unreachable reviewers, unexpected broadcasts, and missing convergence paths visible.

A fault test should settle topology choice. Remove or corrupt one pipeline output and observe whether downstream stages stop. Test an orchestrator by delaying a worker and injecting contradictory findings. In a hierarchy, check whether a subordinate's critical minority report survives summarization. Conflicting blackboard updates should leave provenance, ordering, and unresolved status intact.

The strongest result available here comes from Jia et al. (2026) and concerns synthetic injection. Naturally occurring production faults remain outside its evidence, and the fault distribution used in the test determines what the test can show. Its closed-loop advantage supplies a reason to run those fault tests, which remain necessary. The acceptable topology is the simplest one that preserves required evidence, contains representative faults, and clears the single-agent gate on the target workload.

## Dispatch through dependencies, not a guessed sequence

In a narrative retelling from my own workflow harness, six planned work items appeared ready to run together. A pre-dispatch file-overlap check showed that four of the six touched one adapter file and its test. The schedule became two waves. Three items could run in parallel, including two disjoint changes and one low-risk item from the colliding group, while the remaining three ran sequentially in increasing risk order. The scheduler selected a maximum independent set of nonconflicting work. Maximizing simultaneous workers was not the objective.

Because the work-item identifiers, overlap matrix, and dispatch log from that sweep were not preserved, the example illustrates the scheduling decision without serving as an auditable result. The evidence for dynamic task graphs is itself directional, so the example cannot upgrade the claim.

A dependency graph represents each unit of work as a node and each prerequisite or conflict as an edge. It becomes a task graph when the runtime uses those records to decide which nodes are eligible for dispatch. A node can start when its prerequisites have completed successfully and its declared resources do not conflict with another running node. Independent nodes need not wait behind an unrelated serial step.

Execution changes what work exists. A repository investigation may begin with a single node to locate the affected adapter, and create package-specific repair nodes only after the adapter is identified. A failed compatibility check may add a migration node and block integration. A fixed schedule must guess those branches in advance or leave workers idle while a central planner reconstructs dependencies from messages.

Dynamic dispatch does not mean unconstrained autonomy. The runtime performs a mechanical transition from blocked to ready when explicit conditions become true. Semantic decisions, such as whether a test failure reveals a new task, still need a model or a person to propose the node and its dependencies. The scheduler then validates the record and executes it according to policy.

Yu et al. ([2025](https://arxiv.org/abs/2503.07675)) supply the only direct systems report attached to this practice, at directional strength. DynTaskMAS lacks a controlled comparison. The study compared parallel against serial execution on one seven-agent travel-planning workload. It did not compare a dynamic schedule against a fixed parallel schedule, and it did not isolate the task graph from its asynchronous execution engine. The reported improvement therefore shows only that parallel beat serial in that setting, and it provides no evidence that dynamic beat fixed.

Rose et al. ([2026](https://arxiv.org/abs/2605.15132)) in APWA, Luo et al. ([2025](https://arxiv.org/abs/2502.13965)) in Autellix, and Masters et al. ([2025](https://arxiv.org/abs/2510.02557)) in the Manager Agent research challenge provide separate directional examples of related planning and scheduling designs. None of them is a replication of a dynamic-versus-fixed comparison. No controlled result in the cited set establishes that a dynamic dependency graph outperforms a well-designed fixed schedule for repository work.

The prescription is instead a defensible systems decision under variable dependencies. If independent branches exist, their prerequisites are observable, and branch duration is uncertain, an explicit graph can expose safe concurrency without making unrelated work share a serial queue. If the workflow is short, fixed, and cheap, a graph scheduler may add state and recovery complexity without creating useful parallelism.

Dependency accuracy is the central risk. A missing edge can dispatch two workers that edit the same file, migrate the same schema, or invalidate each other's assumptions. A false edge serializes work that could have run independently. File overlap is only one conflict signal: generated artifacts, shared test fixtures, deployment environments, and logical invariants can couple work even when paths do not overlap.

Each node therefore needs enough state to support both scheduling and recovery:

```text
node_id: stable identity
inputs: immutable artifact versions
depends_on: successful prerequisite nodes
conflicts_with: resources or nodes that cannot overlap
owner: dispatched worker
attempt: retry identity
status: blocked | ready | running | succeeded | failed
outputs: versioned artifacts and evidence
```

The attempt identity prevents a late response from an expired worker from overwriting a successful retry. Immutable input versions reveal when a ready node was planned against stale state. Versioned outputs let downstream nodes distinguish two attempts that produced different artifacts. These implementation requirements come from the topology. The graph notation itself supplies none of them.

In my own workflow harness, notification-driven dispatch ends the coordinating turn after work is assigned and resumes it when completion events arrive. This avoids a polling loop that consumes attention while no state has changed. Mechanical parallel-set detection checks for nodes on the same dependency layer, blocking edges, and overlapping file paths. Those workflow rules illustrate the mechanism, but they do not supply comparative performance evidence.

A bounded per-step time limit contains a slow or failed worker only if expiration produces and propagates a real error. Treating expiration as success deletes evidence of failure and may release downstream nodes with missing inputs. The schedule will appear healthy precisely because it has erased the event needed to diagnose it. This is the fail-closed rule applied to dispatch.

Retries require the same care. A retry creates a new attempt on the same logical node instead of creating a second independent task. The scheduler must either prove the operation idempotent or isolate side effects before repeating it. Otherwise a transient timeout can produce duplicate comments, partial file writes, or two workers claiming ownership of the same state.

Dynamic graphs are most useful when they expose decisions that were previously implicit. The runtime can show why a node is blocked, which completed output released it, and which conflict prevents parallel dispatch. If those explanations cannot be reconstructed, the graph has become another hidden coordinator and has lost its value as an observable allocation mechanism.

## The protocol I run before promoting a topology

A structural redesign should finish as a reproducible allocation decision. A diagram and a promising demonstration cannot support promotion. The following protocol is narrow enough to run on an existing workflow while preserving the distinctions developed in this chapter.

1. Select a persistent failure class. Use repeated paired runs across the current and upgraded model, and retain the first-upstream-error record. Do not begin with a generic goal such as improving collaboration.

2. Draw the current causal path. Mark where evidence originates, where interpretation occurs, where state is persisted, and where the final decision converges. Identify the smallest boundary at which the failure could have been observed and stopped.

3. Keep the single-agent workflow intact. Replay it on the current golden set and record pass^k, the chosen cost axis, elapsed time, and failures by class. Preserve this configuration for future model releases.

4. State one structural treatment. It may be a verifier loop, a specialized role, a structured handoff, a different topology, or a dependency-aware dispatcher. Specify which state boundary changes and which failure path the change is expected to interrupt.

5. Record the promotion rule before running the comparison. Include a success floor, a cost ceiling, and a mechanism condition, for example that at least one delegated result must be consumed by the aggregator. Add an aggregation check when candidates are voted on or synthesized.

6. Inject a representative fault. For a pipeline, corrupt an upstream artifact. For an orchestrator, delay one worker or return contradictory findings. For a hierarchy, place a critical result in a minority branch. For a blackboard or task graph, issue conflicting updates and verify ordering, provenance, and failure propagation.

7. Run repeated treatment and baseline trials on the same tasks. Separate correctness, reliability, latency, total computation, and usability. Inspect traces to confirm that delegation, coordination, and aggregation actually occurred.

8. Promote, retain, or redesign. Promote only if the treatment clears the recorded success, cost, mechanism, and fault-containment conditions. Retain the baseline if extra structure does not earn its coordination cost. Redesign when the trace shows that the treatment changed a boundary but left the target failure path intact.

The resulting record should be reviewable without trusting the architecture's name. Promotion should depend on whether that record supports the claimed benefit.

## Sources and evidence

The evidence class and strength on each entry below come from its catalog record. Author-system cases in this chapter are narrative illustration and are not part of the evidence base.

- Bertalanic, et al. 2026. *The Cost of Consensus*. arXiv:2605.00914. Exploratory evidence on aggregation failure; Chapter 5 carries the reported oracle-gap result.
- Böckeler, Birgitta. 2026. "Harness Engineering." MartinFowler.com, February 17. Practitioner account based partly on vendor-reported Codex-team practice.
- Cemri, M., et al. 2025. "Why Do Multi-Agent LLM Systems Fail?" arXiv:2503.13657. MAST failure taxonomy and benchmark-framework interventions.
- Chun, Jina, et al. 2025. "Is Multi-Agent Debate the Silver Bullet?" arXiv:2503.12029. Audit-retained strong evidence on debate performance against task baselines; reports inference cost across debate variants and leaves the single-model cost comparison open.
- Huang, Jia, and Joey Tianyi Zhou. 2026. "A Two-Dimensional Framework for AI Agent Design Patterns: Cognitive Function and Execution Topology." arXiv:2605.13850. Directional taxonomy of topology choices.
- Jia, J., et al. 2026. "MAS-FIRE: Fault Injection and Reliability Evaluation for LLM-Based Multi-Agent Systems." arXiv:2602.19843. Synthetic fault injection across three architectures.
- Jain, Prateek. 2026. "Harness Engineering: The New DevOps Layer for AI Agents." r/devops, May 27. Anecdotal practitioner account.
- Kim, T., et al. 2026. "Why Do AI Agents Systematically Fail at Cloud Root Cause Analysis?" arXiv:2602.09937. OpenRCA evidence on failure persistence across capability tiers and protocol intervention.
- Kumar, et al. 2026. *AgentForge*. arXiv:2604.13120. Directional evidence on multi-agent design.
- Li, et al. 2026. *SIMAS*. arXiv:2606.00655. Audit-retained strong evidence on token cost, non-monotonic scaling, and debate versus self-correction.
- Luo, et al. 2025. *Autellix*. arXiv:2502.13965. Directional scheduling and orchestration example.
- Masters, et al. 2025. *Manager Agent research challenge*. arXiv:2510.02557. Directional planning and scheduling example.
- Qian, et al. 2024. *MacNet*. arXiv:2406.07155. Directional evidence on network scaling.
- Rose, Evan, et al. 2026. *APWA: A Distributed Architecture for Parallelizable Agentic Workflows*. arXiv:2605.15132. Directional orchestration example.
- Shang, Wenlong. 2026. *"Theater of Mind" for LLMs: A Cognitive Architecture Based on Global Workspace Theory*. arXiv:2604.08206. Directional blackboard and global-workspace design; single-author architecture proposal, not a controlled measurement.
- Tian, et al. 2025. "Beyond the Strongest LLM." arXiv:2509.23537. Directional evidence on multi-agent teams.
- Yu, Junwei, Yepeng Ding, and Hiroyuki Sato. 2025. *DynTaskMAS*. arXiv:2503.07675. Directional parallel-versus-serial result on a seven-agent travel-planning workload; no controlled dynamic-versus-fixed comparison.
- Zhao, et al. 2026. *ATOM*. arXiv:2605.26178. Audit-retained strong evidence on difficulty-conditioned topology across six short-form benchmarks.

### Author artifact cited inline

- Not an evidence item: CodeProbe, the author's task-mining evaluation tool, [public repository](https://github.com/sjarmak/codeprobe). Named inline for the preamble rerun described in the opening, which is narrative illustration.
