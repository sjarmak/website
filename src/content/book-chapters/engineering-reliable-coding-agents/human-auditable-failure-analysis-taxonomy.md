---
title: "Human-auditable failure analysis and taxonomy development"
book: engineering-reliable-coding-agents
order: 10
part: 3
kind: chapter
number: 10
---

In a peer-reviewed study, Zhang et al. ([2025](https://arxiv.org/abs/2505.00212)) collected expert-annotated failure logs from 127 multi-agent systems, in which several model-driven workers hand work to each other. They then handed the attribution problem to the best automated methods they could evaluate. The delegation failed in two distinct ways. The best method named the responsible agent in 53.5 percent of cases, but identified the decisive step in only 14.2 percent. Some of the evaluated methods performed below random.

Every one of those logs already existed before the attribution problem was posed. A record of what happened is necessary, as Chapter 9 established, but it does not settle why a run failed. A transcript can contain every command and message and still be consistent with several competing causal explanations. One worker may make an early planning error, another may act correctly on corrupted state, and a third may expose the defect when verification finally runs. Assigning the failure to the last visible error would confuse detection with cause.

Attribution is the scarce capability in this sequence. Logging preserves the evidence. Attribution is the claim that one particular action changed the run's prospects, and that claim controls what engineers instrument, which component they repair, whether a benchmark item remains valid, and sometimes who becomes accountable for the result. Under a weak attribution process, a complete trace becomes a precise record of the wrong explanation.

Three practices follow. I derive the initial failure taxonomy by reading my own traces. I keep a person responsible for consequential causal assignments, and I shape the trace so that person can audit the evidence. Automation can organize the work after those conditions exist. It cannot be assumed to create them.

## Build the taxonomy from the failures you can inspect

My starting protocol has limited evidentiary support. Its evidence base is one directional observational study and one practitioner-authored method, and neither is a controlled result showing that the procedure improves an agent system. I still use it because it specifies an auditable way to turn local traces into measurement categories. The method comes from Orosz and Husain ([2025](https://newsletter.pragmaticengineer.com/p/evals)), and the trace count it recommends, at least one hundred, is an unmeasured protocol recommendation.

I begin with traces from the system and workload I operate. I select for diversity across task type, outcome, model version, repository area, duration, tool use, and any operating condition likely to change the path through the system. Apparent successes belong in the sample when verification was skipped or the result depended on an unexplained retry. Excluding them would define failure as whatever the existing evaluator already noticed, which is the blind spot the review is meant to find.

For each trace, I read from the initial request to the terminal state and write open-ended notes. The annotation records the first upstream failure that materially changed the available path to success. It does not catalog every later error. A run that starts from an incorrect plan, edits the wrong module, invokes a test from the wrong directory, and then misreads the failure can produce four visible defects. If the plan directed all subsequent work toward the wrong module, the planning error is the first upstream failure.

This choice follows the causal structure of an agent run. State passes from one step into the next through messages, files, tool outputs, summaries, and control decisions. An early error changes the evidence and options available downstream. Later steps can therefore be locally reasonable and globally ineffective. Counting every symptom as an independent failure inflates the categories produced by long runs and overweights systems that continue after their prospects have already collapsed.

The first-upstream rule also forces a useful counterfactual question. If this step had been correct while the preceding record stayed the same, could the later failure still have occurred by the observed path? A clear 'no' makes the step a plausible causal boundary. A 'yes' means I have probably annotated a symptom, or that the trace lacks enough state to decide. I preserve the uncertainty and leave the causal label unresolved.

![A planning error is the first upstream failure linking four visible defects, while a counterfactual test distinguishes a plausible causal boundary from a symptom.](/book-figures/ch10-first-upstream-failure.svg)

The counterfactual holds the preceding record constant and asks only whether the observed path could still produce the later failure.

After the open read, I cluster the notes into roughly five to ten themes. The labels should describe failures that call for distinct measurement or investigation surfaces. Planning, retrieval, execution, tool use, self-diagnosis, verification, and environment handling may emerge, but I do not impose those categories before reading. A local pipeline may instead reveal failures around identity propagation, stale workspace state, permission boundaries, retry ordering, or task ambiguity.

Phase labels are worth the trouble because they narrow where evidence must be collected. A planning failure asks whether the system represented the goal, constraints, and dependencies before acting. An execution failure asks whether a valid plan became the intended commands and edits. A self-diagnosis failure asks whether the system interpreted observed state correctly after an action. Combining them into 'reasoning failure' produces a broad count with little guidance about which part of the trace is deficient.

Generic metric packages often begin with categories convenient for the evaluator. They count tool errors because tool errors are easy to parse, or grade final answers because final answers are easy to present to a judge. The resulting dashboard can be internally consistent while missing the upstream decisions that generated the measured events. A taxonomy derived from traces starts with the failure process and only later asks which measurements can represent it.

Published phase-aligned classifications provide a useful comparison. Lu et al. ([2025](https://arxiv.org/abs/2508.13143)) classified failures by phase across 34 programmable tasks executed by off-the-shelf frameworks operating near 50 percent completion.

Those results do not establish base rates for frontier coding agents. The reported distribution describes that study's tasks, systems, and operating point. A production repository with different permissions, tools, review gates, and task duration can concentrate failure elsewhere.

I saw this mismatch in my own trial-annotation pipeline, a system for classifying failures in experimental agent runs. An early taxonomy omitted failure modes that dominated the project's own traces even though public taxonomies covered adjacent classes. The third revision grew from annotation of the local corpus and separated categories along more dimensions. That experience is narrative illustration only. It does not show that the resulting categories are complete, and the published export cannot independently reproduce the category counts because its manifest records no annotations.

I analyze a complete case. It keeps the request, relevant starting state, trace, terminal outcome, verification result, and annotation together. When several retries belong to one attempt, I preserve their order and identity so a later successful retry does not erase the original failure. If the system forks work, I retain the parent-child relation. Without that relation, an error imported from another branch can appear to originate where it was first observed.

Category boundaries will blur on long, multi-phase work. A retrieval failure can induce a bad plan, while an environment defect can make correct execution look like faulty reasoning. I allow multiple descriptive tags when they preserve useful context, but keep one first-upstream assignment for frequency analysis. The distinction prevents the taxonomy from pretending that causation is always singular while still making the primary count interpretable.

Disagreement is evidence about the taxonomy. If two qualified reviewers repeatedly split the same cases between planning and retrieval, the category definitions may depend on state the trace does not expose. If they agree on the events but disagree on the counterfactual, the causal rule needs a sharper boundary. I revise the label definitions and preserve the original annotations so the change remains visible.

The initial pass over roughly one hundred traces is intensive by design, and reading them end to end is slow work. The pass discovers categories, tests whether the recorded evidence can support them, and exposes which distinctions require domain expertise. It cannot establish a stable low-frequency rate with the precision that a larger sample and a **power analysis** would demand. A class frequency counted from one run per task also inherits the run-to-run variation Chapter 1 describes, so two nearby frequencies can reorder under repetition.

The product of that pass is a defensible measurement vocabulary and a labeled seed corpus. Estimating the system's failure distribution requires a separate sampling design.

Once those categories stabilize, the scale-out path returns to Chapter 5. I validate an LLM-as-judge on a held-out expert-labeled, stratified sample under the same rubric, then use it to extend the labels only within the operating range its errors support. That validation is tied to the label definitions in force when it ran, so revising a category definition invalidates the agreement estimate for that category. Human review remains concentrated on new categories, ambiguous cases, consequential failures, and strata where the judge performs poorly. A pre-built judge applied before the manual pass would merely automate someone else's taxonomy.

Frequency then informs priority without deciding it alone. I count the first-upstream assignments by phase and class, examine uncertainty, and compare the mass with the cost of each failure. A frequent recoverable tool error may deserve less attention than a rare attribution error that invalidates an evaluation. The distribution shows where failures concentrate, but engineering judgment still decides which of them are worth repairing.

Several narrower techniques remain in the companion catalog. Constraint-violation logs can localize a failure when a task has explicit invariants, and trajectory canonicalization can make structural comparisons possible across runs. A separate entry recommends catching environment errors before execution because they can consume disproportionate effort. These methods can sharpen a local taxonomy, but none removes the need to discover which categories the operated system actually produces.

## Keep causal assignment under human control

Attribution becomes consequential when its answer changes an action. An engineer may rewrite a prompt, repair a tool adapter, remove a benchmark task, retrain a model, or change an on-call report according to the assigned cause. The same label can also affect accountability when several people or services own different parts of the run. In those cases, an automated guess is not a harmless summary.

I separate triage from verdict. Triage ranks cases or candidate steps for investigation. A verdict records the responsible action and decisive step with enough evidence that another reviewer can challenge the assignment. Automated methods can make triage cheaper even when their error rates make them unsuitable for verdicts.

The opening result sets the present limit. The 53.5 percent agent-level accuracy leaves nearly half of responsible-agent assignments wrong, and the 14.2 percent step-level accuracy misses the point at which most failures became decisive.

Those figures do not establish a general automation ceiling. They belong to one annotated dataset of multi-agent failures. Single-agent coding traces may be easier, other workloads may be harder, and later methods may improve on both numbers. The reported percentages should not be converted into a staffing ratio.

Ma et al. ([2025](https://arxiv.org/abs/2509.08682)) later reached 36.2 percent step-level accuracy on the same benchmark family, against under 15 percent for prior methods. Counterfactually validated fixes derived from that analysis raised task success by an average of 22.4 percent, but the source does not state whether the gain is absolute or relative. That improvement suggests that causal structure can narrow the search more effectively than an undifferentiated reading of the transcript. The method still assigned most decisive steps incorrectly.

The fixes were evaluated on the benchmarks that defined the attribution task, and the method required a bespoke causal-discovery algorithm for interaction data whose behavior changes over time. That result supports a candidate generator for a reviewer. It does not justify silently storing the model's assignment as the postmortem cause.

A human verdict needs a reconstructable chain. I ask which state changed, which action changed it, which later components consumed it, and what observation eventually exposed the damage. The record must separate the actor that introduced a defect from the actor that detected it. It must also distinguish a component that passed on invalid state from one that had enough information and authority to reject that state.

Consider a run in which a planner selects an obsolete interface, a coding worker implements it faithfully, and a verifier reports an integration failure. The verifier owns the detection. The planner is the first candidate for causal responsibility, provided the current interface was available in the planner's evidence and no later gate was explicitly responsible for checking it. If the repository index supplied stale documentation, responsibility can move again. The trace alone cannot choose among these accounts unless it records what each step received and what obligation each step owned.

I therefore write attribution as a structured claim. The claim names the first upstream action, the state transition it caused, the downstream dependency that carried the error, the evidence supporting the assignment, and plausible alternatives considered. It also records confidence and the reviewer. This format does not make the judgment objective, but it exposes where judgment entered. A postmortem that names a 'root cause' without naming the state transition behind it is a summary rather than an attribution.

Counterfactual reasoning checks an attribution without proving it. I ask whether replacing the candidate action with a correct action, while holding earlier state fixed, would have prevented the observed failure path. Several steps may satisfy that condition because later checks could also have recovered the run. The decisive step is the earliest point at which the relevant error entered or an owned opportunity to stop it was irretrievably missed under the taxonomy's rule.

That definition requires an explicit ownership model. A verifier that was not asked to check interface currency should not inherit responsibility merely because it could have caught the error. But a release gate whose declared contract includes that check has a meaningful missed intervention. Postmortems become arbitrary when they infer obligations from hindsight and ignore the contracts operating during the run.

Retries complicate the assignment. A failed first attempt can alter files, caches, rate limits, conversation state, or the evidence presented to the next attempt. The retry that succeeds may depend on those changes, while the retry that fails may be responding to damage introduced earlier. I preserve attempt identity and state boundaries so reviewers can distinguish repeated decisions from decisions made in a changed world.

Concurrency adds another ambiguity. Two workers may read the same starting state, make individually valid changes, and conflict only when their outputs merge. Neither branch contains a unilateral causal defect. The failure belongs to the coordination rule, merge order, or missing conflict check, depending on which contract was violated. When a transcript is sorted by completion time, the worker whose result arrived last can appear responsible for a conflict it did not cause.

Before blaming an agent, I rule out the evaluator and execution environment. A broken dependency, stale fixture, permission mismatch, nondeterministic test, or malformed task can make a correct action look defective. Differential testing compares the same candidate under a controlled change in agent, harness, or environment and asks whether the failure follows the candidate. The companion catalog carries this as a separate diagnostic control, because attribution without apparatus checks can convert measurement error into a model failure.

Human control does not mean every person reads every trace from the beginning. An automated system can rank likely decisive steps, group similar incidents, retrieve related cases, and prefill the observed events. It can also flag assignments that conflict with the recorded state transition. The reviewer remains responsible for accepting, revising, or abstaining, and the stored record distinguishes the proposal from the signed attribution.

I used the same authority boundary in my own internal benchmark curation, a process for deciding which generated software tasks were sound enough to evaluate. Candidate decisions retained an explicit provisional label until a project lead signed off. The pipeline that generated and checked the tasks could assemble evidence, but it could not finalize the attribution of a defect to the task or the system. This methodology example supplies no accuracy evidence.

The review threshold should follow consequence. A low-stakes transient failure can retain an automated tentative label for aggregate triage. A failure that changes remediation, removes an evaluation item, alters a reported result, or assigns organizational responsibility needs a named human decision. When the evidence cannot distinguish competing causes, the correct verdict is unresolved, accompanied by the missing observation that would have separated them.

Aggregating several automated readers does not make the attribution more reliable. The companion catalog describes independent attribution judges as an aside, and agreement among several weak or dependent readers does not establish causation. It also treats consistency across repeated runs as a risk signal, another aside that can prioritize unstable cases without explaining them. Both can decide where a person looks first. Neither should decide what the person must conclude.

Repeated local categories can eventually reveal a structural problem. When the same failure class survives prompt patches and model upgrades, the remedy is structural, and Chapter 17 develops that redesign question. Here I stop at diagnosis, because the trace evidence establishes recurrence alone.

## Design the record for a skeptical reader

Deshpande et al. ([2025](https://arxiv.org/abs/2505.08638)) reported that the best evaluated long-context model correctly localized issues in 11 percent of 148 expert-annotated traces. Those traces were benchmark-derived but ecologically valid, and they were more complex than short synthetic sequences built to isolate one error. Reasoning, tool calls, outputs, retries, and state changes appeared in the same record. A large context window could hold the transcript, but holding the transcript did not make the decisive event legible.

![Responsible-agent attribution is 53.5%; decisive-step attribution is 14.2% earlier, below 15% for prior methods, and 36.2% later; the top long-context model localizes 11% of 148 traces, and some methods underperform random.](/book-figures/ch10-attribution-accuracy.svg)

Results span distinct tasks and benchmarks; the first two use one annotated multi-agent-failure dataset. These capability snapshots cannot set a general automation ceiling.

That result is a snapshot of model capability. Scores will change as models and trace readers improve, and the benchmark cannot establish performance on every production workload. I take the more durable design consequence from the structure of the task. A record built for human audit should expose the units a causal investigation needs. Raw chronological text forces every reader, human or model, to reconstruct those units before diagnosis can begin.

Chapter 9's typed event stream supplied replay and recovery. Human audit adds a different requirement. A reviewer must be able to follow step boundaries, decisions, inputs, state transitions, retries, and outcomes without inferring their identity from prose. The same event stream can serve both purposes when its schema records semantic boundaries. Timestamps on messages alone do not preserve them.

At minimum, I preserve a run identifier, task identity, model and configuration versions, initial state reference, and ordered step identifiers. Each step records the actor, input references, decision or intended action, tool request, tool response, resulting state reference, verification outcome, and terminal status. Retries point to the attempt they repeat and state why the controller retried. Forks and joins retain parentage and ordering constraints.

A tool response, file digest, exit status, or test result is an observation. A model statement that the response means a dependency is missing is an interpretation. Storing both under a generic message field makes later readers treat the interpretation as if the environment had emitted it. Typed events let the reviewer compare the claim with the recorded observation.

Decision records need enough input to replay the choice. A label such as 'selected tool A' captures an outcome but omits the alternatives, constraints, and evidence available at the time. I store the relevant input references, the chosen action, rejected alternatives when the system represented them, and the rule or model version that selected among them. Replay means re-running or reevaluating the decision against the same recorded inputs. Asking a model to invent a retrospective rationale is a different operation.

Some inputs cannot be stored in full. Repository snapshots, retrieved documents, and tool outputs may be large, sensitive, or mutable. The trace can retain content-addressed references, access-controlled snapshots, or a precise query with the returned item identities. A pointer to 'current repository state' is inadequate because the state will change before the review. The preservation policy must balance reproducibility against confidentiality, storage cost, and retention obligations.

Step boundaries should correspond to ownership and state changes visible to the control plane. A single step containing plan generation, three tool calls, an edit, and verification is too coarse for attribution. Splitting every token or streaming fragment produces the opposite failure. The reviewer then sees thousands of events with no decision boundary. I use the smallest unit at which an actor received a defined input and produced an action or state transition that another component consumed.

Tool calls require more than names and final outputs. The record includes normalized arguments, execution environment identity, start and finish status, timeout or cancellation, side-effect summary, and links to resulting artifacts. A command can fail after partially modifying state. Recording only its nonzero exit status hides the files or processes left behind for the retry.

Ordering requires explicit semantics when work overlaps. Wall-clock timestamps help investigate latency, but clock order does not establish causal order across concurrent workers. Parent identifiers, message sequence numbers, versioned state references, and join events show which observations were available to which decision. If two steps race to update the same artifact, the trace should identify the accepted version and the rule that rejected or merged the other.

Identity also needs stability across resumed work. A display name such as 'coder' can refer to different model versions or sessions. The audit record connects a logical role to a particular execution instance, configuration, permission set, and parent run. That distinction lets a reviewer tell whether a changed outcome came from a new decision, a new actor, or state carried across a restart.

The interface should support competing explanations. I want a reviewer to move from an annotated failure to the exact upstream event, inspect the input state, follow affected descendants, and compare a neighboring successful run. Filtering by actor or event type helps, but the default view should preserve causal context around each selection. A viewer that hides retries or collapses repeated tool output can produce a convenient summary at the cost of the evidence under dispute.

My own evaluation tool, CodeProbe ([public repository](https://github.com/sjarmak/codeprobe)), publishes complete transcripts and preserves quarantined runs in a separate area. Its successor adds a side-by-side trace browser for audited comparisons. Those choices illustrate preservation and review practice. They do not establish that the schema is optimal, and publication by itself does not prevent mistaken conclusions.

Quarantined runs are worth storing because evaluation pipelines often remove timeouts, rate limits, infrastructure failures, and malformed outputs before analysis. Some exclusions are methodologically justified, but deletion prevents a later reviewer from distinguishing an agent failure from an apparatus failure. I preserve the raw run, exclusion reason, decision owner, and any replacement attempt. Aggregate reporting can then follow the declared policy without erasing the cases that test it.

Structured traces also improve privacy review because sensitive fields become identifiable. Credentials, personal data, proprietary source, and private model reasoning may require redaction or restricted access. Blanket retention creates a security liability, but blanket deletion destroys auditability. Field-level rules can restrict access, encrypt retained data, and irreversibly redact secrets. The record then distinguishes evidence withheld by policy from evidence the system never captured.

The trace schema must record its own version. Adding a field changes what can be inferred from later runs, while renaming an event can break comparisons with the existing failure corpus. A missing field has three possible meanings: the event did not happen, the recorder omitted it, or an older schema stored it differently. I make those states explicit in the decoder and migration logic.

Instrumentation can itself change system behavior. Synchronous logging adds latency, large payloads can alter token budgets, and capturing tool output can affect memory pressure or rate limits. Asynchronous emission can reorder events or lose the final buffer during a crash. I measure the overhead, assign a durability requirement to each event class, and record missing events as trace failures. A gap must remain visible in the reconstructed record. Changing the instrumentation between two arms also changes the apparatus, which Chapter 1 requires to be held fixed across a paired comparison.

The practitioner evidence for this practice is anecdotal. In one organization's account, reviews had been based on competing opinions until the system recorded decisions, inputs, retries, and outcomes. The structured record then made failures repeatable and arguments factual. A second practitioner independently described event-sourced, replayable traces. Both are self-reported accounts. They show plausible operational use but supply no controlled improvement or universal schema.

Logging does not repair an agent. It makes proposed explanations testable against preserved events and makes repeated failure paths comparable. A repair still requires a separate intervention and an evaluation that shows the intervention changed the intended outcome. This distinction prevents observability work from being credited with reliability gains it has only made possible to measure.

The schema should evolve from failed questions. Common gaps concern the state a worker saw, inherited retry side effects, the branch chosen at a merge, or the evidence behind a decision. I record the unanswered question as an instrumentation defect. The next schema version adds the smallest event or relation that would answer it. This process ties auditability to real investigations and limits speculative completeness.

Trajectory shape can provide an early cue while a run is still active. The companion catalog describes monitoring duration, variance, tool-call count, or other shape changes, because failed trajectories can run longer and vary more. Such a signal can preserve a suspicious run or request review sooner. It cannot identify the cause without the structured events that explain what happened inside the shape.

## Turn failed runs into an operating record

I start with the last twenty failed runs and read each one end to end. My notes remain open-ended, and each case receives only its first upstream failure as the primary assignment. I include apparent successes whose verification was skipped, because an unverified outcome cannot supply clean evidence of success. The small batch reveals whether the trace can answer ordinary causal questions before a larger annotation effort depends on it.

I then grow the note pile toward one hundred diverse traces and cluster it into five to ten classes. The resulting distribution determines which classes deserve measurement first, while cost and consequence govern the final priority. A named human signs any attribution that changes remediation, accountability, task validity, or the interpretation of an evaluation. Automated readers can order the queue and propose candidate steps.

The first unanswerable question changes the trace schema. I add the missing state reference, boundary, identity, ordering relation, or outcome field, then preserve the schema version with subsequent runs. That response treats failed analysis as evidence about the observability system. A review should be able to state both what happened and which parts remain uncertain.

The failure corpus remains an operating asset after Part III. Chapter 14 will use it to tune compaction policy, because compression should preserve the evidence that past investigations found decisive. Part IV now turns to the evidence available when the model acts: retrieval, context budgets, and memory. Chapter 11 begins by measuring repository retrieval, the first step in deciding which parts of a codebase enter that evidence.

## Sources and evidence

The evidence class and strength on each entry below come from its catalog record. Author-system cases in this chapter are narrative illustration and are not part of the evidence base.

### Derive the failure taxonomy from your own traces

- lit/directional: Lu, R., Li, Y., Huo, Y. (2025), "Exploring Autonomous Agents: A Closer Look at Why They Fail When Completing Tasks," arXiv:2508.13143. (Phase-aligned classification; ~50% completion base rate on 34 programmable tasks with off-the-shelf frameworks; NOT a base rate for real enterprise repos.)
- practitioner/directional: "A pragmatic guide to LLM evals for devs", Gergely Orosz with Hamel Husain, Pragmatic Engineer newsletter, 2025-12-02, https://newsletter.pragmaticengineer.com/p/evals. (Open coding on 100+ traces, first upstream failure, axial coding into 5-10 themes, prioritize by frequency.)

### Keep humans in failure attribution

- lit/strong: Zhang, S., et al. (2025), "Which Agent Causes Task Failures and When? On Automated Failure Attribution of LLM Multi-Agent Systems," ICML 2025, arXiv:2505.00212. (Who&When: expert-annotated failure logs from 127 multi-agent systems; 53.5% agent-level and 14.2% step-level for the best automated method; some methods below random.)
- lit/directional: Ma, G., et al. (2025), "Automatic Failure Attribution and Critical Step Prediction Method for Multi-Agent Systems Based on Causal Inference," arXiv:2509.08682 (CDC-MAS). (36.2% step-level against under 15% for prior methods; counterfactually validated fixes worth an average 22.4% task success.)

### Design traces for human audit

- lit/strong: Deshpande, D., et al. (2025), "TRAIL: Trace Reasoning and Agentic Issue Localization," Patronus AI, arXiv:2505.08638. (Best evaluated model localized issues in 11% of 148 expert-annotated traces; a 2025 capability snapshot.)
- practitioner/anecdotal: "What actually broke when we put AI agents into real production workflows", /u/saurabhjain1592, r/LLMDevs, 2026-01-08 (independently corroborated by a second practitioner account of event sourcing with replayable traces, r/programming, 2025-11-26).

### Author artifact cited inline

- Not an evidence item: CodeProbe, the author's task-mining evaluation tool, [public repository](https://github.com/sjarmak/codeprobe). Named inline for the published transcripts and quarantined runs described above, which are narrative illustration.
