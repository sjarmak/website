In one CodeProbe rerun ([public repository](https://github.com/sjarmak/codeprobe)), I changed an agent’s preamble to correct a retrieval behavior I had already diagnosed. The patch reduced cost while leaving the motivating failure intact.

On the affected task family, cost fell by 28 percent, while the primary reward difference was +0.0048 with a t statistic of 0.27, indistinguishable from noise in that comparison. The wall-clock prediction failed in both direction and magnitude. I had predicted a 40 percent reduction, but elapsed time increased by 3.9 percent. The agent still accepted a false-negative retrieval result and constructed its answer around missing evidence.

The patch changed the wrong variable. The preamble instructed the agent to synthesize for coverage, but the execution path still treated an empty tool result as authoritative. That coupling belonged to the harness rather than to the sentence-level wording of the prompt.

Prompt changes are cheap, visible, and easy to isolate in an experiment. Structural changes alter component boundaries: which worker retrieves evidence, which worker interprets it, what crosses the handoff, and which component can reject the result. They are more expensive to implement and harder to evaluate because several causal paths may move together. They are also sometimes the only intervention aimed at the point where the failure is produced.

## Move from prompt changes to structural repair only after persistence

A failure class does not become persistent merely because it occurred more than once. I call a class persistent only after a paired comparison across model versions, with repeated trials, shows that it survives. One successful run on the newer model proves no more than one failed run on the older one.

Chapter 1’s variance discipline still applies when the proposed treatment is a model upgrade. Analyze paired per-item differences rather than comparing two aggregate scores.

Once persistence is established, Chapter 10’s taxonomy and first-upstream-failure method locate the earliest supported cause. That location constrains the repair. If retrieval produced an incomplete candidate set, adding a stronger instruction for the final writer to cite sources attacks the last visible symptom. The relevant repair belongs where the candidate set is formed, checked, or handed off.

The companion catalog states the broader rule as repairing the supported root cause rather than the final visible error. Its evidence is thin, so I use it here only as a diagnostic reminder.

Cemri et al. ([2025](https://arxiv.org/abs/2503.13657)) developed MAST, a taxonomy of failures in multi-agent language-model systems. They reported limited gains from prompt improvements on persistent classes and stronger results from interventions such as redesigned verification topology and modular roles while retaining the same underlying model.

The evaluated systems included benchmark frameworks such as AG2 and ChatDev rather than production deployments. The findings therefore establish plausible structural interventions within those frameworks, not portable recipes for arbitrary agent systems.

Kim et al. ([2026](https://arxiv.org/abs/2602.09937)) provide a stronger cross-version result in another domain. Across the capability tiers evaluated in OpenRCA, dominant failure modes in cloud root-cause analysis remained present. Prompt engineering did not eliminate communication failures, while richer communication protocols reduced them by as much as 15 percentage points.

That is evidence that an architectural failure can survive a more capable model. It does not establish a coding-agent failure rate or show that prompt engineering is generally ineffective.

The OpenRCA result separates two failure mechanisms. Protocol enrichment addressed communication failures, whereas hallucinated interpretation required another intervention. A structured handoff cannot repair a worker that invents the meaning of accurate evidence, and a stronger verifier cannot recover evidence no upstream component retrieved.

“Change the structure” is therefore not a remedy. It is an instruction to revisit the causal boundary that produced the observed class.

A **multi-agent system** consists of several model-driven workers coordinating on one task. Its **topology** determines which workers exchange observations, where decisions converge, and which component owns shared state. Topology is distinct from implementation. Two programs can use the same queue library while exposing different communication structures, and two runtimes can implement the same topology.

Role specialization is one possible structural intervention. It assigns workers different responsibilities, evidence access, and acceptance conditions instead of asking each worker to perform the complete task.

In the opening retrieval case, specialization could separate candidate discovery from evidence adjudication. The retrieval worker would return candidates together with explicit coverage information. An adjudicator would decide whether an empty result supported a negative conclusion before the writer could treat absence of results as absence of evidence.

The specialization is justified only because it creates a boundary at which the false-negative claim becomes visible and rejectable. Adding personas without changing evidence or authority does nothing.

Structured handoffs can address the same coupling:

```text
query: exact request issued to the retriever
candidates: identifiers returned
coverage_checks: alternate queries and their results
claim: sender's interpretation
status: supported | incomplete | failed
```

The schema does not make the interpretation correct. It keeps evidence, interpretation, and completion status separate. An incomplete search can no longer become indistinguishable from a supported negative result unless another component explicitly makes that conversion.

During failure, the status must remain `failed` or `incomplete`. Converting it to an empty success recreates the original defect behind a cleaner interface.

The structural boundary may also be a verification loop rather than another worker. One agent can produce an artifact, run a deterministic check, inspect the failure, and revise. An independent reviewer becomes useful when:

- the producer is poorly positioned to detect its own mistake;
- the reviewer needs independent evidence access;
- verification policy should remain isolated from generation; or
- the consequence warrants a separate decision owner.

Role specialization describes distinct responsibilities, not necessarily distinct model instances.

The first structural question is therefore:

> Which decision requires an independent state or authority boundary?

The number of agents follows from that answer. Sometimes no additional worker is needed. Sometimes one verifier is enough. Five workers sharing the same incomplete evidence can amplify confidence without changing the failure path.

Accounts grouped under “harness engineering” describe teams accumulating capability in execution boundaries, verification loops, repository instructions, rollback paths, and approval controls rather than in prompts alone. Böckeler ([2026](https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html)) analyzes vendor-reported practice from the OpenAI Codex team. Jain ([2026](https://www.reddit.com/r/devops/comments/1touxz4/)) writes from practitioner experience rather than a controlled evaluation.

Neither source supplies enough verification detail to estimate an effect. They describe where practitioners report making repairs. Cemri et al. and Kim et al. carry the evidentiary claim that some persistent classes responded to structural intervention.

My trace data adds a caution about what prompt evidence can establish. Across 1,705 visible thinking blocks from 199 traces, agents never named the two dominant tools in their written reasoning. Sixty-five explicit intentions to find references produced no use of the purpose-built reference tool.

Zero mentions did not imply zero prompt influence. In a later 17-run experiment, deliberation-style preambles changed tool selection on matching tasks while scores remained 4.0 versus 4.0.

These observations separate two effects. Prompt steering may improve selection efficiency without improving task success. The target retrieval failure in my rerun still survived. Another wording change was therefore not the primary repair. The system needed a boundary that checked retrieval coverage before synthesis trusted the result.

Structural repair carries costs. Splitting work introduces:

- handoff failures;
- additional tokens and latency;
- more state identities;
- more opportunities for stale or conflicting evidence;
- false rejection by verifiers; and
- loss of context at specialist boundaries.

A protocol may omit the field later needed for diagnosis, while a specialist may lose information a generalist would have retained. Representing topology in configuration may make revision easier, but that companion proposal has thin support and an unmeasured maintenance burden.

The repair criterion is causal and comparative:

1. Change the smallest boundary capable of interrupting the observed failure path.
2. Preserve the failure evidence through that boundary.
3. Replay the same cases under paired repeated trials.
4. Measure whether the target class moved.
5. Inspect which new classes appeared.

If the class does not change, the new structure added coordination without repairing the cause.

## Require fan-out to beat the live single-agent baseline

Every proposal to add debate, delegation, or parallel workers needs a live single-agent control.

**Fan-out** assigns one task, or parts of it, to several workers whose outputs must later be selected or combined. **Delegation** transfers responsibility for a defined unit of work to another worker. Neither mechanism deserves credit merely because the configuration makes it available.

The golden set from Chapter 4 supplies the comparison. Replay the current single-agent workflow and the proposed team on the same versioned tasks and executable oracles. Record the promotion rule before the first run. Use the same number of repeated trials in both arms and score reliability through pass^k where that metric matches the deployment semantics.

The multi-agent treatment advances only when it clears both the success requirement and the relevant cost limit. Chapter 2’s Pareto discipline rejects a quality gain whose operating cost makes the workflow unusable.

The gate does not presume that fan-out will fail. Work with independent branches, high error costs, or reasoning demands beyond one reliable trajectory may clear it. Those properties make fan-out plausible. They do not remove the need to measure whether coordination and aggregation consume the expected benefit.

Chun et al. ([2025](https://arxiv.org/abs/2503.12029)) compared debate configurations with task baselines and reported the inference cost of the debate variants themselves. They did not compare debate with a single-model baseline on cost and identified that comparison as an open question. Debate therefore receives no presumed efficiency benefit.

Li et al. ([2026](https://arxiv.org/abs/2606.00655)) provide a controlled cost result from SIMAS. Their multi-agent configurations used roughly 15 times as many tokens, returns were non-monotonic as agents were added, and debate sometimes underperformed self-correction.

These are strong results within the tested tasks and configurations. They do not supply a universal exchange rate for another worker. Token premiums depend on prompt length, number of rounds, context sharing, model mix, and duplicated work.

A strong source synthesis across several studies supports the general need for a gate, but no standardized experiment settles it. Other directional syntheses cover heterogeneous and homogeneous teams, consensus systems, and scaling networks: Tian et al. ([2025](https://arxiv.org/abs/2509.23537)), Kumar et al. ([2026](https://arxiv.org/abs/2604.13120)), Bertalanič et al. ([2026](https://arxiv.org/abs/2605.00914)), and Qian et al. ([2024](https://arxiv.org/abs/2406.07155)).

Because those syntheses overlap in their underlying sources and were not retained as strong controlled evidence, I use them only for direction. The operational decision still comes from reproducing the comparison on the target workload.

Aggregation belongs inside the treatment definition. Chapter 5 described an exploratory plurality-vote oracle gap of up to 32.3 percentage points from Bertalanič et al. A correct answer existed among the candidates, but the vote selected another answer. That establishes a failure mode rather than its frequency elsewhere.

It is enough to separate two outcomes:

- at least one worker produced a correct candidate; and
- the system returned the correct candidate.

Suppose five workers review a code change. Three repeat the same shallow diagnosis, one identifies a real race condition, and one reports an unrelated issue. Plurality voting selects the shallow diagnosis even though the candidate set contains the critical finding.

A synthesis worker may recover the minority report, but it can also suppress it when all findings arrive as undifferentiated prose. The evaluation must therefore:

- score the final system output;
- retain candidate-level results;
- record the aggregation decision; and
- report whether the aggregator discarded an oracle-correct candidate.

The same requirement applies to debate. Later turns can make workers converge by exposing them to one early answer even when independent reasoning never resolves the problem. If independent judgment is the reason for adding reviewers, the treatment must preserve that independence long enough to test it.

Blind review lanes, in which reviewers do not see the producing worker’s identity or conclusion, are a thinly supported companion option. They reduce one obvious coupling path but are not an established remedy for correlated errors.

Cost measurement must include the full topology:

- planner input and output;
- worker context and generation;
- inter-worker messages;
- retries;
- failed branches;
- synthesis;
- verification; and
- the final response.

Measure latency separately from total computation. Parallel execution may reduce wall-clock time while increasing tokens and monetary cost. That trade may be justified for a high-consequence incident and unacceptable for routine maintenance.

Chapter 18 develops routing and cost engineering in more detail. The minimum requirement here is to choose the cost axis that matters, measure it end to end, and record the acceptable increase before seeing the treatment result. A ceiling selected afterward can always be adjusted to preserve the favored architecture.

One validity check comes before any outcome comparison: the multi-agent mechanism must actually execute.

In my repository-scale benchmark, I configured a lean-subagent treatment across four arms and roughly 200 trials, including investigation tasks, and observed zero subagent spawns. The result showed that the treatment never entered the causal path. It did not show that subagents were ineffective.

Configuration is not behavior. A system may expose a delegation tool while the planner never invokes it. It may dispatch workers and ignore their responses. It may ask several workers questions that do not meaningfully partition the task. All can be labeled “multi-agent” while operating as an effectively single-agent system.

I therefore instrument the treatment at three levels:

1. **Configuration:** which topology and tools were available.
2. **Execution:** delegations, messages, worker completions, retries, and aggregation decisions.
3. **Outcome:** how those events contributed to the final result and cost.

A run enters the multi-agent comparison only when the trace shows that the defining coordination behavior occurred.

That eligibility rule must be declared before execution. Writing it afterward selects runs based on observed behavior or outcome. Declared in advance, it distinguishes noncompliance from architectural failure.

The distinction guides diagnosis:

- No delegation means the planner or tool boundary failed to activate the treatment.
- Useful branches discarded by aggregation indicate a convergence failure.
- Identical branch errors from shared context indicate a common upstream dependency.
- Divergent correct candidates with a wrong final answer indicate a selection failure.
- Expensive duplicate work with no gain indicates a decomposition failure.

The single-agent baseline must remain live as models change. A topology that once improved performance may become unnecessary when a stronger model absorbs the relevant capability. It may also become more valuable when the stronger model becomes a better planner while specialists remain inexpensive.

Replaying both configurations for each consequential release turns that shift into a measured comparison. Without the single-agent arm, improving team scores may conceal that the simpler system improved faster.

A compact promotion record can contain:

```text
golden_set_version: repository-maintenance-2026-07

single_agent:
  pass^k:
  total_tokens:
  elapsed_time:
  failures_by_class:

multi_agent:
  pass^k:
  total_tokens:
  elapsed_time:
  failures_by_class:

mechanism_check:
  delegations_observed:
  branches_consumed:
  aggregator_used:

aggregation_check:
  correct_candidates_retained_or_discarded:

promotion_rule:
  success_floor:
  cost_ceiling:

decision:
  promote | retain baseline | redesign treatment
```

This gate answers whether to divide the work. Topology selection answers how. A multi-agent design that cannot clear the gate should return to structural diagnosis. The next experiment may require a narrower specialist boundary, a different aggregator, or no additional worker.

## Choose topology by task shape and fault propagation

Jia et al. ([2026](https://arxiv.org/abs/2602.19843)) injected synthetic faults into three multi-agent architectures in MAS-FIRE. Closed-loop architectures neutralized more than 40 percent of faults that caused the linear pipeline to collapse, and stronger foundation models did not uniformly produce greater robustness.

The faults were synthetic and the comparison covered three architectures. The result does not establish a general preference for closed loops. It does show that message routes and feedback paths can determine whether a local error remains local or becomes a system failure.

A **pipeline** passes work through a fixed sequence of stages. It fits tasks that decompose into stable ordered transformations, such as:

```text
retrieve candidate files
    -> extract relevant regions
        -> generate patch
            -> run tests
```

Its advantage is inspectability. State moves in one direction, and each transition has a defined producer and consumer. Its weakness is the same property. An early omission can flow through every later stage without any component returning to the source.

Pipelines also compress meaning at each handoff. If retrieval emits only file excerpts, the patch stage may never learn that coverage was uncertain. A status field can preserve that uncertainty, but it does not create a return route. When downstream evidence can invalidate an upstream decision, the task no longer has a purely linear structure even if its implementation remains a sequence of functions.

An **orchestrator-worker topology** assigns one component responsibility for planning, dispatch, and integration while workers perform bounded tasks. It fits work whose decomposition depends on the initial state but whose branches can be evaluated separately.

A repository migration may require the orchestrator to identify affected packages, send independent compatibility checks to workers, and combine the findings into an ordered plan.

The orchestrator owns global task state. Workers should receive enough evidence for their assignments without inheriting the complete history by default. Their outputs return through a defined convergence point where conflicts and missing work can be detected.

Failure of the orchestrator has a larger blast radius than failure of one worker. Durable state, stable identities, and replay at that boundary therefore matter more to reliability than adding another worker.

A **hierarchy** or explicit leadership structure extends this arrangement when a flat team would exchange too many messages or when subproblems require their own coordination. A lead assigns work to subordinate groups and accepts bounded summaries rather than allowing every worker to communicate with every other worker.

This can reduce message growth. It also introduces information loss and concentrates authority. A hierarchy earns its cost only when the lead measurably reduces communication and integration burden without suppressing critical evidence. Titles assigned to the agents establish nothing.

A **blackboard** is shared evolving state that workers read and update. It fits tasks whose next useful action depends on discoveries made by any participant, such as an incident investigation in which logs, hypotheses, eliminated causes, and requested checks change throughout the run.

The blackboard externalizes state that would otherwise be scattered across pairwise conversations. It also creates concurrency obligations. Updates require identities, versions, conflict rules, provenance, and a distinction between an untested hypothesis and an established observation.

Consider a security review of a large change:

- A pipeline fits fixed analyzers followed by one synthesis step.
- An orchestrator-worker design fits a planner dividing the diff by attack surface and assigning bounded reviews.
- A hierarchy becomes plausible when package leads coordinate their own specialist groups.
- A blackboard fits an exploratory investigation in which one discovery should redirect every other reviewer.

These topologies can be combined. An orchestrator may dispatch pipelines. A hierarchy may use a blackboard for cross-group evidence while keeping control messages within leadership paths.

The relevant architectural properties are ownership of each state transition and the participants able to observe, challenge, or revise it; a configuration label alone does not establish either property.

Zhao et al. ([2026](https://arxiv.org/abs/2605.26178)) provide strong experimental evidence from ATOM that topology is a first-order variable and that adapting it to task difficulty can outperform one average design. Their evaluation used five-agent teams with two open models across MMLU, GSM8K, HumanEval, AQuA, MultiArith, and SVAMP.

Those are short-form question-answering, mathematics, and code benchmarks. The study supports difficulty-conditioned orchestration within that scope.

Topology-to-task matching remains unvalidated for long-horizon repository work, where files persist, tools have side effects, branches remain partially complete, tests are expensive, and concurrent edits conflict. I therefore use the topology menu as an engineering hypothesis to test rather than importing a benchmark conclusion.

Two directional research lines expand the vocabulary without resolving the transfer. Huang and Zhou ([2026](https://arxiv.org/abs/2605.13850)) organize agent design patterns along two dimensions. Shang ([2026](https://arxiv.org/abs/2604.08206)) relates blackboard coordination to a global workspace in Theater of Mind. Both provide exploratory support without a quantitative claim here.

An active-blackboard variant that schedules contributors for diversity remains a thinly supported companion idea rather than an established practice.

Fault propagation provides a practical topology test.

In a pipeline, a retrieval error may contaminate every downstream artifact. In an orchestrator-worker system, the same error may remain local when the orchestrator compares workers against independent evidence, or become global when it broadcasts one corrupted premise to all of them.

In a hierarchy, a lead’s inaccurate summary can erase correct subordinate findings. On a blackboard, an unsupported claim can spread through repeated reads unless provenance and status remain attached.

![Fault propagation depends on collaboration topology, ranging from downstream contamination in pipelines to contained local errors when shared systems preserve provenance and state labels.](/book-figures/ch17-topology-faults.svg)

Containment is conditional. A shared corrupted premise, an inaccurate lead summary, or repeated reads of an unqualified claim can turn a local error into a global one.

Observation routes are therefore part of correctness. Record:

- which workers see raw tool output;
- which receive only summaries;
- whether a downstream component can request new upstream evidence;
- whether workers see others’ tentative conclusions before forming their own;
- where contradictory results converge; and
- which component can mark shared state disputed or invalid.

These properties govern error correlation, recovery, and attribution even when every worker uses the same model and prompt.

Runtime oversight can represent the topology as an interaction graph whose nodes are workers and artifacts and whose edges are messages or state transitions. That representation is a thinly supported companion idea and has not been validated as a monitoring standard. It remains a useful inspection tool because it exposes unreachable reviewers, unexpected broadcasts, and missing convergence paths.

Topology should be tested through faults, not inferred from diagrams.

For a pipeline:

- remove or corrupt one stage output;
- verify that downstream work stops or marks the state incomplete;
- test whether the pipeline can widen or restart upstream.

For an orchestrator-worker system:

- delay one worker;
- inject contradictory findings;
- corrupt one worker’s input;
- verify that the orchestrator distinguishes missing, late, and conflicting evidence.

For a hierarchy:

- insert a critical minority finding at a subordinate level;
- verify that it survives summarization;
- test whether the lead can request source evidence.

For a blackboard:

- submit conflicting updates;
- verify that provenance and ordering remain attached;
- preserve unresolved status rather than allowing last-write-wins to manufacture agreement.

The strongest evidence here, from Jia et al., concerns synthetic injected faults. Naturally occurring production faults lie outside that result, and the injected fault distribution determines what the comparison can show.

The reported closed-loop advantage supplies a reason to run local fault tests. It does not remove their necessity.

The acceptable topology is the simplest one that:

- preserves the evidence the task requires;
- contains representative faults;
- exposes incomplete and disputed state;
- keeps aggregation failures observable; and
- clears the live single-agent gate on the target workload.

## Dispatch only work whose dependencies are satisfied

In a narrative reconstruction from my workflow harness, six planned work items initially appeared ready to run together. A pre-dispatch overlap check showed that four touched the same adapter file and its test. The schedule therefore became two waves. Three items could run in parallel, including two disjoint changes and one low-risk item from the colliding group. The remaining three ran sequentially in increasing risk order.

The scheduler selected a maximum independent set of nonconflicting work. Maximizing the number of simultaneous workers was not the objective.

The work-item identities, overlap matrix, and dispatch log from that sweep were not preserved, so the example illustrates the scheduling decision without providing an auditable result. The evidence for dynamic task graphs is also directional. The example cannot strengthen it.

A **dependency graph** represents units of work as nodes and prerequisites or conflicts as edges. It becomes a **task graph** when the runtime uses those records to decide which nodes are eligible for dispatch. A node becomes ready only when its prerequisites have completed successfully and its declared resources do not conflict with another running node. Independent work need not wait behind an unrelated serial step.

Execution can also change which work exists. A repository investigation may begin with one node that locates the affected adapter, then create package-specific repair nodes only after the adapter is identified. A failed compatibility check may add a migration node and block integration. A fixed schedule must either predict those branches in advance or leave workers idle while a central planner reconstructs dependencies from messages.

Dynamic dispatch does not mean unconstrained autonomy. The runtime performs a mechanical transition from `blocked` to `ready` when explicit conditions become true. Semantic decisions, such as whether a test failure warrants a new task, still require a model or person to propose the node and its dependencies. The scheduler validates that record and executes it under policy.

Yu et al. ([2025](https://arxiv.org/abs/2503.07675)) provide the only direct systems report attached to this practice, at directional strength. DynTaskMAS contains no controlled comparison between dynamic and fixed scheduling. The study compared parallel with serial execution on one seven-agent travel-planning workload. It did not compare a dynamic schedule with a fixed parallel schedule or isolate the task graph from the asynchronous execution engine.

The reported improvement therefore shows only that parallel execution outperformed serial execution in that setting. It does not show that dynamic scheduling outperformed a well-designed fixed schedule.

Rose et al. ([2026](https://arxiv.org/abs/2605.15132)) in APWA, Luo et al. ([2025](https://arxiv.org/abs/2502.13965)) in Autellix, and Masters et al. ([2025](https://arxiv.org/abs/2510.02557)) in the Manager Agent research challenge provide separate directional examples of related planning and scheduling architectures. None replicates a dynamic-versus-fixed comparison.

No controlled result in the cited evidence establishes that a dynamic dependency graph improves repository work relative to a fixed schedule.

The narrower systems argument applies when dependencies vary during execution. If independent branches exist, their prerequisites are observable, and their durations are uncertain, an explicit graph can expose safe concurrency without forcing unrelated work through one serial queue. If the workflow is short, fixed, and inexpensive, a graph scheduler may add persistence and recovery complexity without creating useful parallelism.

Dependency accuracy is the central risk. A missing edge can dispatch two workers that edit the same file, migrate the same schema, or invalidate each other’s assumptions. A false edge serializes work that could safely overlap.

File overlap is only one conflict signal. Work may also conflict through:

- generated artifacts;
- shared test fixtures;
- database schemas;
- deployment environments;
- locks or leases;
- external services;
- mutable caches; or
- logical invariants spanning disjoint files.

Each node therefore needs enough state to support both scheduling and recovery:

```text
node_id: stable logical identity
inputs: immutable artifact versions
depends_on: prerequisite nodes that must succeed
conflicts_with: resources or nodes that cannot overlap
owner: currently assigned worker
attempt: retry identity
status: blocked | ready | running | succeeded | failed
outputs: versioned artifacts and supporting evidence
```

The attempt identity prevents a late response from an expired worker from overwriting a successful retry. Immutable input versions reveal when a ready node was planned against stale state. Versioned outputs allow downstream nodes to distinguish attempts that produced different artifacts.

These requirements come from the execution topology. Drawing the graph supplies none of them.

In my workflow harness, notification-driven dispatch ends the coordinating turn after work is assigned and resumes it when completion events arrive. This avoids a polling loop that consumes attention while no state has changed. Mechanical parallel-set detection checks dependency layers, blocking edges, and overlapping file paths.

Those rules illustrate the mechanism. They do not provide comparative performance evidence.

A per-step time limit contains a slow or failed worker only when expiration produces and propagates a real failure. Treating a timeout as success destroys the evidence of failure and may release downstream nodes without their required inputs. The schedule then appears healthy because it erased the event needed to diagnose it.

Dispatch should fail closed:

```text
worker exceeds time limit
    -> attempt fails visibly
    -> dependent nodes remain blocked
    -> retry, escalation, or cancellation policy runs
```

Retries require the same discipline. A retry creates a new attempt for the same logical node rather than a second independent task. The scheduler must either establish that repeated execution is idempotent or isolate side effects before trying again. Otherwise a timeout can produce duplicate comments, partial writes, or two workers claiming the same resource.

Dynamic graphs are most useful when they expose decisions that were previously implicit. The runtime should be able to explain:

- why a node remains blocked;
- which successful output released it;
- which conflict prevents concurrent execution;
- which attempt currently owns it;
- which input version it was planned against; and
- why a failure created, removed, or blocked another node.

If those answers cannot be reconstructed, the graph has become another hidden coordinator rather than an observable allocation mechanism.

## Promote topology from a recorded comparison

A structural redesign should end in a reproducible allocation decision. A diagram and a promising demonstration are not enough. The following protocol is narrow enough to apply to an existing workflow while preserving the distinctions developed in this chapter.

### Select one persistent failure class

Use repeated paired runs across the current and upgraded model configurations. Preserve the first-upstream-failure assignment from Chapter 10.

Do not begin from a broad objective such as “improve collaboration.” Name the failure class whose path the structural change is expected to interrupt.

### Draw the current causal path

Mark:

- where evidence originates;
- where interpretation occurs;
- where state becomes durable;
- where authority changes hands;
- where verification occurs; and
- where the final decision converges.

Identify the smallest boundary at which the target failure could have become observable and stoppable.

### Preserve the live single-agent baseline

Replay the existing single-agent workflow on the current golden set. Record:

- pass^k or the selected reliability measure;
- the chosen cost axis;
- elapsed time;
- tool and model use;
- failures by class; and
- the complete configuration identity.

Keep this baseline executable for later model releases. A topology should not receive permanent credit from a comparison against an obsolete single-agent system.

### Specify one structural treatment

The treatment may be:

- a deterministic verification loop;
- a specialized role;
- a structured handoff;
- a different communication topology;
- a new aggregation rule; or
- a dependency-aware dispatcher.

State which boundary changes and which causal path the change is expected to interrupt. Avoid combining several architectural changes unless the experiment is explicitly evaluating the combined system.

### Record the promotion rule before execution

The rule should include:

- a task-success floor;
- a reliability requirement;
- a cost ceiling;
- a latency limit where relevant;
- a mechanism condition; and
- any required fault-containment result.

A mechanism condition might require at least one delegated result to be consumed by the aggregator or require the scheduler to dispatch at least one pair of independent nodes concurrently. When candidates are voted on or synthesized, add a check for whether an oracle-correct candidate was retained or discarded.

### Inject a representative fault

Choose a fault matched to the proposed structure:

- For a pipeline, corrupt or omit an upstream artifact.
- For an orchestrator, delay one worker or return contradictory findings.
- For a hierarchy, place a critical result in a minority branch.
- For a blackboard, submit conflicting updates and inspect ordering and provenance.
- For a task graph, omit a dependency, introduce a false conflict, expire a worker attempt, or return a late completion.

Verify that incomplete or disputed state remains visible and that downstream work does not proceed as though the missing evidence existed.

### Run paired repeated trials

Run baseline and treatment on the same task versions. Keep the model, harness, permissions, evaluator, and execution environment fixed except for the declared structural change.

Report separately:

- correctness;
- reliability;
- latency;
- total computation;
- monetary or token cost;
- coordination failures;
- usability or review burden; and
- target failure-class frequency.

Inspect traces to confirm that delegation, scheduling, coordination, and aggregation actually occurred. A configured mechanism that never enters the execution path has not been evaluated.

### Promote, retain, or redesign

Promote only when the treatment clears the recorded success, reliability, cost, mechanism, and fault-containment conditions.

Retain the baseline when additional structure does not earn its coordination cost.

Redesign when the trace shows that the treatment changed a boundary but left the target failure path intact. The next experiment may require a narrower specialist role, another handoff field, a different aggregation rule, a corrected dependency model, or no additional worker.

The resulting record should be understandable without trusting the architecture’s name. Promotion depends on whether the observed execution supports the claimed benefit, not on whether the design can be described as dynamic, hierarchical, multi-agent, or dependency-aware.

## Sources and evidence

- Bertalanič, et al. 2026. *The Cost of Consensus*. arXiv:2605.00914. Exploratory evidence on aggregation failure; Chapter 5 carries the reported oracle-gap result.
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

### Author-system illustration cited inline

- Not an evidence item: CodeProbe, the author's task-mining evaluation tool, [public repository](https://github.com/sjarmak/codeprobe). Named inline for the preamble rerun described in the opening, which is narrative illustration.
