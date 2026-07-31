---
title: "Usable context budgets, consolidated-spec restarts, and file-based tool output"
book: engineering-reliable-coding-agents
order: 13
part: 4
kind: chapter
number: 13
---

Guidance I had placed in a system prompt was still inside the context window twenty turns later, and it appeared nowhere in the model's stated reasoning. Across 1,705 visible thinking blocks in 199 traces from my own trace-diagnostics corpus, that instruction showed up zero times. Visible reasoning is an incomplete observation of model state, so its absence from those blocks does not prove that the instruction had no influence. It does show that material sitting inside the context window is not thereby material the run is using. The benchmark record shows the same gap in a different form.

Only about half of the 17 models tested by Hsieh et al. ([2024](https://arxiv.org/abs/2404.06654)) retained satisfactory performance at 32,000 tokens, even though every model in that comparison advertised a window of at least that size. Their benchmark, RULER, combined 13 task types, including retrieval and aggregation problems. Rando et al. ([2025](https://arxiv.org/abs/2505.07897)) then evaluated realistic repository issues and found a sharper failure at the scale vendors had begun to advertise. Claude 3.5 Sonnet fell from 29 percent to 3 percent as the supplied context grew toward one million tokens, and Qwen2.5 fell from 70.2 percent to 40 percent. Both studies measured competence under load. Every input still fit inside the advertised capacity.

The practices for assembling that context are far less settled than the measurement problem is. I ranked ten candidate context-assembly practices three separate times: once by how much each would change an engineering decision, once by how much of the problem each covers, and once by how teachable each is. The three rankings agreed on one practice out of the ten. Five were selected by exactly one ranking, and three were selected by none. I read that spread as evidence that the field has not converged, so every prescription in this chapter is either measured locally or labeled a convention.

The advertised window describes a capacity limit. The usable length is a measurement made on the work the model must perform. Once that working limit is under control, three assembly decisions follow. A run that has lost its specification should restart from a consolidated version of the settled requirements. Bulk tool output should live outside the active window in retrievable files. A standing repository context file should be tested against no file before its permanent cost is accepted.

## Measure the context the model can use

I use **effective context length** to mean the largest assembled context at which a model still meets a specified reliability threshold on a defined workload. The number is specific to a model, configuration, workload, and engineering threshold. A model can accept 128,000 tokens, retrieve one fact at that length, and still have a much shorter effective context for changing code that depends on relations among several files.

The measurement begins with task shape. A production coding agent may need to retrieve a declaration from one file and connect it to a call site in another. It may also need to incorporate a test failure from a third file and preserve an instruction supplied near the start of the run. A single hidden fact embedded in filler tests only part of that work. I include several-document retrieval, multi-step aggregation, instruction retention, and long-code reasoning in proportion to how often each operation appears in the actual workload.

The distinction is visible across the benchmark record. RULER found that an advertised window often exceeded the length at which performance remained satisfactory. Leng et al. ([2024](https://arxiv.org/abs/2411.03538)) then swept 20 models from 2,000 to 128,000 tokens on retrieval-augmented generation. Accuracy saturated at a model-specific context size, around 64,000 tokens for most of the 2024-era frontier models in that study. Beyond that point, additional material produced family-specific behaviors that included refusals, repetition, and neglected instructions.

Code changes depend more on relations between units than fact retrieval does. Li et al. ([2025](https://arxiv.org/abs/2503.04359)) built LONGCODEU, a long-code understanding benchmark covering nine models and eight tasks, and found substantial degradation beyond 32,000 tokens, far below the claimed windows of 128,000 to one million tokens. Understanding relations between code units was the weakest aspect. LongCodeBench, the benchmark behind the million-token declines quoted above, evaluated issue answering and bug fixing rather than document retrieval. A successful long-document question-answering result is therefore not a basis for setting a coding agent's context budget.

These studies do not establish a universal ceiling. Their claims are bounded by the model generations, prompts, tasks, and scoring rules they used. The durable result is the repeated gap between capacity and competence, plus a protocol for measuring that gap. The knee of the curve will move as models change. It may also move in opposite directions for retrieval and code modification within the same release.

![Across incomparable metrics, RULER is about half-satisfactory at 32k, long-context RAG saturates near 64k, LONGCODEU degrades beyond 32k, and toward 1M Claude 3.5 Sonnet falls 29% to 3% while Qwen2.5 falls 70.2% to 40%.](/book-figures/ch13-capacity-competence.svg)

Each study locates a decline within its tested or advertised window. Different tasks and metrics prevent direct comparison, and the evidence establishes no universal ceiling.

I qualify a model by constructing context-size strata around the range I might deploy. A practical first pass might use a small condition, two intermediate conditions, and one condition near the advertised limit. The exact token values depend on the model and workload. Each stratum contains the same task families and, where possible, the same underlying tasks with controlled additions to context. This separates a length effect from a change in task difficulty.

For repository work, I build each item from a fixed repository state and a known evidence set. The small-context arm receives the minimum material needed to solve the task. Larger arms add realistic neighboring files, test output, prior discussion, generated summaries, or tool schemas in a recorded order. The model gets the same task and permissions in every arm. I pin the model version, decoding settings, harness version, prompts, tool surface, and evaluator so that context size remains the deliberate change.

Each stratum is a measured comparison, so Chapter 1's requirements apply to it. Every stratum needs repeated independent runs, and items should be paired across strata wherever the design permits. One run per stratum cannot estimate run-to-run variance, so it cannot establish that an apparent knee is a property of the model rather than of that draw.

Four outcome measures should stay separate. Retrieval accuracy records whether the required evidence was found. Task correctness records whether the answer or code change is right. Reliability records how often that result is reproduced across repeated runs. Cost records the tokens, calls, and tool use consumed.

Latency and usability may matter operationally, but neither can substitute for correctness. A longer context can reduce retrieval calls and still lower the probability of a correct patch.

I plot the outcome distribution by context-size stratum and reject any threshold based on one passing run. The saturation point is the region in which adding context stops improving the relevant outcome. The operational knee may occur earlier, at the point at which the marginal gain becomes too small to justify cost or variance. A decline may be gradual, abrupt, or limited to one task family. Those shapes imply different caps.

Suppose retrieval accuracy rises through the intermediate strata and then remains flat, while code-change success begins to fall earlier. The retrieval curve alone would permit a larger budget. The coding workload would not. I set the production budget from the weakest task that must perform reliably, then place retrieval limits and harness caps below its measured knee. The margin allows for token-count estimation error, task variation, and fixed context that grows during execution.

The margin depends on engineering consequence. A workload with cheap retries and deterministic verification may operate close to the knee. A production change with expensive failure and weak verification needs more distance. I record the threshold, uncertainty, and consequence that justified the margin so the cap can be reviewed when conditions change.

Several mechanisms can produce the observed decline. Additional tokens add material the model must separate from the relations it needs to reconstruct, especially when multiple files contain similar names or competing versions of a fact. Position affects whether instructions and evidence influence later generation. Repeated material can induce repetition, and conflicting material can cause a model to follow a stale instruction or refuse the task. A model may also spend more of its generation restating or reconciling the prompt, leaving less useful work within output and tool budgets.

Token count alone therefore does not diagnose failure. I retain traces from each stratum and classify the first consequential divergence. Relevant classes include retrieval misses, incorrect symbol relations, forgotten constraints, repetition, and harness truncation. The curve shows where performance weakens. The trace identifies the component to change.

This distinction prevents a common apparatus error. If the harness silently clips messages at its own cap, truncation may cause the measured decline. If the evaluator sees only the final answer, an instruction-following failure can be misclassified as missing knowledge. If larger contexts contain more stale repository state, length is confounded with freshness. I inspect the exact assembled prompt, record its token allocation by source, and preserve any truncation decision with the run.

The budget also changes during a tool-using run. A starting prompt well below the cap may cross the measured knee after test logs, searches, edits, and corrections. Qualification includes static prompts and representative trajectories or replayed context growth. I measure both the initial assembly and the maximum context reached before compaction or restart. A cap on retrieval at time zero does not control later accumulation.

Every consequential model, workload, or harness change requires requalification. A new model can move the knee or change the dominant failure mode. A harness can add standing context that consumes margin before work begins. I preserve the old strata, add cases shaped by the change, and compare curves, because an unchanged average can conceal a shorter effective length offset by better short-context performance. If noise obscures the knee, the power analysis from Chapter 1 determines whether to add tasks or narrow the claim.

Synthetic tasks remain valuable because they isolate positional recall, aggregation, and distractor effects. They transfer only approximately to repository work. Realistic tasks entangle retrieval, reasoning, tool use, and verification, which makes mechanism attribution harder but deployment relevance higher. I use synthetic probes to explain a failure and repository-shaped trials to set the budget. Neither result establishes the other's threshold without measurement.

The final configuration specifies a maximum initial assembly, per-source retrieval limits, a reserve for tool output and corrections, and an action when the reserve is exhausted. It records the workload and model version that justified those values. A run can stay inside its measured context budget and still fail when its specification is fragmented or superseded.

## Restart from the specification the work has become

A model reads the first version of a requirement, fills in an ambiguity, and begins to build around that interpretation. Three turns later, the user corrects the assumption. The correction appears in the transcript, but the plan, file selection, and partial implementation still encode the earlier choice. Each subsequent message asks the model to repair work whose internal structure keeps reproducing the misunderstanding.

This failure can look like stubbornness or insufficient reasoning. The more useful explanation is commitment under an incrementally revealed specification. The state of the task no longer lives in one authoritative description. It is distributed across the initial request, later qualifications, rejected proposals, tool observations, and the model's own claims about what was decided. Recovering the current specification requires distinguishing accepted decisions from abandoned ones before the next action can even be chosen.

Laban et al. ([2025](https://arxiv.org/abs/2505.06120)) simulated more than 200,000 conversations across 15 models and compared instructions delivered together with instructions distributed over several turns. Sharding the instructions produced an average performance drop of 39 percent relative to the single-turn condition. Models showed slightly lower aptitude, but much higher unreliability. They made assumptions early, committed to them, and frequently failed to recover when later turns supplied the missing constraints.

The experiment used simulated conversational generation tasks. Coding agents operating tools, receiving compiler feedback, or changing persistent files were outside its scope. Tests and environment errors can correct some early assumptions, but partial code can entrench others. I use the 39 percent as evidence for the commitment mechanism; its effect size does not transfer directly to coding teams.

That figure is also an average taken across models and across the generation tasks in the study, not a per-conversation quantity. The spread over individual conversations is not recoverable from it. An average of that size is compatible with a few catastrophic conversations and many unaffected ones, and those two distributions imply different operational responses.

The trace corpus described at the start of this chapter shows a related failure without strengthening the causal claim. Guidance delivered once, twenty turns earlier, remained inside the window and appeared in none of the visible reasoning. Initial delivery is therefore not evidence that a long-running agent is still governing its work by the same instruction.

The practical response is periodic consolidation. When requirements emerge through discussion, I rewrite the accepted decisions, constraints, definitions, interfaces, and unresolved questions into one coherent specification. The new document identifies itself as authoritative and supersedes earlier proposals on the same subjects. It represents the current agreement and omits turn-by-turn chronology.

Consolidation is selective because a transcript contains different kinds of state. Settled requirements belong in the specification, and open questions retain their unresolved status. Environment observations such as test failures, command output, modified files, and deployed state belong in a separate execution record. A rationale belongs with a decision when losing it would make the constraint look arbitrary or invite reversal.

The distinction between specification and observation controls what a restart may discard. Suppose a run has established that an API must remain backward compatible, selected a migration sequence, edited several files, and discovered that a test fixture depends on an undocumented field. The compatibility requirement and migration sequence belong in the consolidated specification. The edited-file list, diff, test command, failure output, and fixture discovery belong in the handoff state. Combining all of them into prose makes it difficult to tell which statements command future behavior and which report what happened.

I restart when the run's behavior shows that appended corrections no longer change its governing interpretation. Evidence includes repeatedly proposing a rejected interface, editing files chosen under an obsolete plan, explaining a current failure with a superseded assumption, or spending successive turns reconciling its own summaries. A rising token count can indicate rising risk, but it does not determine the restart. A shorter run can become incoherent after one consequential misunderstanding, but a longer run can remain stable if its decisions were restated.

The restart package has three parts. First is the consolidated specification, containing only settled requirements and genuinely unresolved questions. Second is an execution handoff that names repository state, completed changes, current failures, verification already run, and raw artifacts available for inspection. Third is a starting instruction that tells the new run which source is authoritative and what action should occur next.

That package should be generated from inspectable state. I use the current diff, test results, issue record, and relevant files as ground truth. If a prior claim conflicts with the repository, the repository state is authoritative and the discrepancy stays visible. A consolidated specification built from an inaccurate summary produces a cleaner version of the same error.

Restarting loses conversational nuance, discarded alternatives, and some tacit information about how the work reached its present form. It can repeat exploration and freeze a provisional design too early. I consolidate only settled specification. If two designs remain plausible, the document records both, the evidence for each, and the unresolved decision. The technique is harmful when summarization silently converts ambiguity into authority.

Environment feedback also resists consolidation into a static requirement. A failing test may be obsolete, flaky, misconfigured, or decisive. A compiler error is an observation from a particular repository state. The restarted run needs the raw output or a retrievable reference, the command that produced it, and the state against which it ran. A polished sentence could remove the uncertainty the next investigation must resolve.

Versioning prevents authoritative specifications from competing. Each consolidation has an identity, supersedes a named prior version, and remains visible to the run. Concurrent workers submit changes through one owner or merge procedure, because requirements that govern all workers need an ordering rule.

A failing run should not be asked to decide alone that its interpretation is correct enough to preserve. The restart boundary is a control-plane decision informed by the trace, repository state, verification, and user decisions. The model can draft the consolidation, but an inspectable comparison must show what it retained, changed, marked unresolved, or omitted. High-consequence requirements warrant human review before the new run treats the document as authoritative.

The choice is between continuing from entangled state and paying to reconstruct clean state. Appending one more correction is cheap when the run has incorporated prior corrections and its working representation remains coherent. Restarting is cheaper when every new turn must fight decisions embedded in the trajectory. The 39 percent result explains why repeated repair messages can fail even when the model can solve the fully specified task. When that pattern appears, the rule is to restart from a consolidated statement of the settled requirements and to carry the environment evidence separately, as raw observations rather than as conclusions.

## Put bulk output behind a pointer

In my agent fleet, a snapshot of the shared skill catalog once traveled between sessions through an environment variable. The snapshot drifted as sessions inherited, transformed, and re-emitted it. Moving the same context surface to a fingerprinted file made the snapshot atomic per session and allowed every reload to validate its identity. The incident shows that turning transient text into a named artifact can make ownership, validation, and retrieval explicit, without showing that files improve model performance.

The evidence for file-based tool output is limited: two practitioner-directional accounts and zero strong results. I teach it as a convention because it is the cheapest concrete change I know for controlling raw-output bloat. Long terminal sessions, search results, test logs, tool responses, and pre-compaction history are written to session-scoped files. The active context keeps a short description, a stable pointer, and enough metadata for the agent to decide whether loading more is worth the cost.

This design changes where state lives. Without externalization, a tool response lives only in the message history owned by the running conversation. Truncation can delete it, and summarization replaces it with a lossy interpretation. With a session file, the raw bytes live in an artifact owned by the run. The context contains an index entry such as the command, time, status, byte or token size, content fingerprint, and file location.

Retrieval then becomes incremental. An agent can inspect the last lines of a failing build, search the file for a symbol or error code, or load a bounded range around a match. After a context reset, the restarted run can search the history file rather than depend on a summary made before anyone knew which detail would matter. Bulk evidence remains available without occupying the working window on every turn.

The pointer must state the cost before the content is loaded. My memory system follows this rule. An index call reports the expected token cost, and only a subsequent content call loads the material. Injected lessons cite their evidence while leaving raw traces unloaded. The agent can choose a short excerpt when the full log would consume too much of the working window.

Cursor's engineering blog ([2026](https://cursor.com/blog/dynamic-context-discovery)) reported writing long tool output to a file the agent can read back, and reduced forced summaries at the context limit. The Hightouch team, in an interview published by Amplify Partners ([2026](https://www.amplifypartners.com/blog-posts/how-hightouch-built-their-long-running-agent-harness)), described buffering large tool results the same way and reported that it kept the working window on reasoning rather than raw data. Letting the model choose when to buffer output worked better for that team than a coded decision tree. These reports supply implementation direction without a controlled comparison. Model-selected buffering remains probabilistic, and a different model or prompt may make worse choices.

A safe interface needs deterministic protections around that probabilistic choice. Maximum inline sizes, file-write failures, retention limits, and access controls belong to the harness. The model may choose among tail, search, range read, or full load within those constraints. A failed artifact write returns an explicit error and leaves no claim that the output was preserved.

A pointer must also stay resolvable after a restart. A pointer derived only from a temporary process path may expire before the next run can use it. I associate files with a run identity and tool-call identity, preserve their order, and record whether the underlying content is complete or truncated. Concurrent calls write separate artifacts and publish their pointers atomically so that one worker cannot overwrite another's evidence.

Security policy follows the data. Terminal output may contain credentials, proprietary source, personal data, or production identifiers. Moving it out of the prompt can reduce incidental exposure to later turns, but it also creates a retained artifact that needs permissions, redaction rules, encryption where appropriate, and a deletion policy. A file path must not become a way for the model to read outside the session's authorized scope. Deletion and pointer validity are one decision rather than two, because a retention rule that removes an artifact also invalidates every pointer to it held in an older transcript.

Files are an implementation choice, not necessarily the final abstraction. An object store, content-addressed artifact service, or trace database may provide stronger retention and concurrency semantics. Files are attractive early because shell tools already know how to search and range-read them, their failure modes are visible, and they avoid committing to a more elaborate interface before the access patterns are known. The durable requirement is retrievable raw evidence behind a costed pointer.

Externalizing output solves only one source of growth. The agent's plans, speculative explanations, corrections, and repeated reasoning still accumulate in the active window. A run that writes every log to disk can still lose its specification or fill its context with abandoned approaches. Explicit compaction and the restart rule remain necessary.

The convention also creates retrieval failure modes. An agent may never follow the pointer, search for the wrong term, or load an excerpt that omits the decisive line. A stale index can point to deleted content. A summary can misdescribe the artifact and discourage retrieval. I preserve the raw file, validate the pointer, expose search and range operations, and trace what was actually loaded.

The practical test begins with operations. The agent must recover a detail after context reset, preserve distinct outputs from concurrent calls, connect each excerpt to its raw artifact, and report failed writes. Once those mechanics work, task-level evaluation can ask whether the convention reduces cost or improves completion on workloads with large outputs.

That comparison faces the resolution problem from Chapter 1. A difference smaller than the run-to-run spread is not beyond reach, but resolving it requires enough paired runs. I size the comparison against the smallest cost or completion change that would alter the decision, and credit the convention from the interval around the paired difference rather than from one pair of totals. Its current justification is inspectable loss and ownership. Outcome improvement remains unmeasured.

## Test the standing context file against no file

Gloaguen et al. ([2026](https://arxiv.org/abs/2602.11988)) asked whether the repository context files that coding teams were already writing improved task success. Across the tested agents and models, the answer was no. The files increased inference cost by roughly 20 percent, and the agents followed their instructions. The central evaluation is a null result from one study, which means it should change the default assumption without being treated as a universal verdict.

Instruction adherence and task completion measure different effects. A file can successfully cause an agent to run a command, follow a naming rule, or avoid a directory while leaving the final task score unchanged. It can also consume context, provoke extra tool calls, or direct attention toward an overview the model did not need. Observing that the file was read and followed establishes treatment delivery without establishing benefit.

The null result needs the power analysis from Chapter 1. Failure to detect a task-success improvement can mean the true average effect is small, the tested mix contains positive and negative effects that cancel, or the experiment could not resolve the effect it sought. The study's measured cost is still part of the result, as is its evidence that instructions influenced behavior. What it cannot show is that every repository, instruction class, model, or safety outcome will reproduce the same balance.

The local decision comes from a no-file baseline. The comparison is a paired design: the same representative tasks, repository states, model configuration, tools, harness, and evaluator run with and without the context file. Pairing removes task variation from the difference as far as the apparatus permits. Repeated runs remain necessary where model variance is material.

Before running the comparison, I record the task-success metric, cost measures, model and harness versions, decoding settings, context file revision, task set, and decision threshold. This discipline prevents a disappointing result from being rescued after the fact by whichever secondary measure moved. I still retain diagnostic measures such as instruction adherence, tool calls, latency, and failure class, because they explain the observed difference.

Inference cost includes more than the file's input tokens. An instruction may cause extra searches, builds, reviews, or explanations. Conversely, a concise repository-specific command can avoid failed exploration and reduce total work even though it adds permanent context. I record input and output tokens, calls, tool execution, and completion cost for each pair. The cost of completed work is the quantity to evaluate. File size alone is incomplete. A single aggregate cost is also one draw, so a roughly 20 percent gap deserves the same repeated measurement as a score.

Representative tasks should exercise the constraints the file claims to support. If every test item concerns a small isolated function, the evaluation says little about instructions for migrations, generated code, deployment checks, or concurrent edits. I include ordinary tasks, tasks that encounter unusual repository rules, and tasks where violating a rule would create a consequential failure. Expected use governs the mix.

A single all-or-nothing comparison can hide which content is responsible for any effect. Where the task budget permits, I ablate instruction categories separately. One condition might retain only build and test commands, another only failure-prevention constraints, and another the broad architecture overview. This isolates categories imperfectly because instructions can interact, but it is more informative than concluding that the entire file helps or does not help.

Gloaguen et al. (2026) found that agents followed the instructions while task success did not generally improve, which gives constraint-type content a plausible role. It does not prove that any constraint earns permanent inclusion. A repository-specific rule such as "do not regenerate this checked-in directory by hand" has a direct failure class and can be tested on tasks that encounter the directory. A page of architecture description may duplicate information that repository search would retrieve only when needed.

I therefore restrict the default file to unusual constraints and failure-prevention rules. Common language conventions, framework summaries, and directory tours face a high bar because the model can often infer or retrieve them. A permanent instruction costs tokens on every task, including tasks for which it is irrelevant. The file should contain what a capable agent is likely to get wrong and cannot cheaply discover from the repository at the moment of need.

One of my repositories uses its context file as a failure-mode ledger. Each prohibition names the incident class it prevents. That form connects a rule to a concrete repository need and makes deletion possible when the underlying hazard disappears. This narrative case illustrates maintenance practice and supplies no measured improvement in completion.

The content found in practice is broader. Chatlatanagulchai et al. ([2025](https://arxiv.org/abs/2511.12884)) examined 2,303 context files from 1,925 repositories. They found implementation details in 69.9 percent of files, architecture information in 67.7 percent, and build or run guidance in 62.3 percent. Security and performance guidance each appeared in 14.5 percent of the files in that mining study.

Those percentages describe the content maintainers wrote. The security and performance gap is a review prompt, because coding agents can execute commands and change production-relevant code. It asks whether the local file omits safeguards the workload actually requires. It supplies no evidence that adding generic security or performance text will improve outcomes.

A file kept after the with-and-without comparison should be maintained like configuration. Every instruction has an owner, a reason for existing, and a review path. Changes arrive as small diffs so reviewers can see which behavior is intended to change. A large generated rewrite makes stale claims and contradictions difficult to detect.

Chatlatanagulchai et al. (2025) also found that context files already evolve through frequent small additions. That observation is compatible with configuration-like maintenance, but it does not establish the quality of those changes. An addition can record a discovered failure, duplicate an existing rule, or preserve an obsolete workaround. Commit frequency is not correctness.

Staleness is especially dangerous because a context file is authoritative by placement. An old build command does not merely fail to help. It can cause the agent to modify generated output, skip a required check, or interpret current structure through an obsolete architecture. A broad overview decays whenever files move. A constraint tied to a removed failure mode can continue to shape every run after its justification has disappeared.

I have seen this drift in my own agent-facing documents. A review-checker file accumulated 35 rules while its header and the skill that wrapped it still claimed 29. A skill-library README carried three mutually inconsistent counts at once. Both documents are mine, and neither had any mechanism that could have noticed. These cases do not measure the effect on task success, but they show that documents consumed by agents can become self-contradictory when nothing checks their claims.

Some claims can be checked mechanically. Another of my knowledge maps stores a source hash so that a change to the files it describes makes drift detectable. Counts can be computed, paths can be validated, commands can be run in a clean environment, and generated sections can carry fingerprints. Semantic claims still require review, but deterministic checks reduce the surface on which reviewers must rely on memory.

Ownership should be specific enough to trigger action when the build system, structure, or release process changes. I attach sections to people or components that can verify them and define events that require review. Context assembly also records identity and precedence for requirements repeated across system prompts, repository files, task descriptions, and tool documentation. A maintenance check detects contradictory instructions before execution.

The controlled comparison against no file should be read by instruction category and failure consequence as well as by the aggregate mean. A file that has no measurable task-success benefit may still prevent a rare destructive action that the task suite is underpowered to observe. That claim needs a concrete threat model, a compliance test, and an explicit cost decision. A general completion benchmark cannot establish or dismiss safety value when its metric omits the relevant failure.

Correctness, reliability, cost, and usability remain separate columns in the decision record. After the initial paired comparison, I keep the no-file condition available, because a model release, harness change, or major file revision can change both adherence and cost. The old result belongs to the configuration that produced it.

When the comparison is inconclusive, adherence evidence cannot stand in for the missing outcome. I report the interval the evaluation can support, inspect whether the tasks exercised the file's claims, and decide whether a larger test is warranted. The file can remain provisional for a concrete safety reason, but the exception and its cost should be explicit. An underpowered null cannot prove uselessness, just as instruction compliance cannot prove benefit.

The best standing file is often shorter after measurement. Rules with no concrete need, duplicated repository descriptions, stale counts, and content better served by on-demand retrieval can be removed. What remains is a reviewed configuration surface whose permanent token cost is attached to an observed failure or a measured outcome. That is a narrower claim than 'context files help', and one a repository can test.

## A week-one context protocol

The companion catalog carries narrower techniques for systems that need them. It covers placing load-bearing evidence near a context edge, testing semantic rather than verbatim recall, allowing an agent to compact at task milestones, and pricing compression by completed work rather than token reduction. It also describes minimizing always-loaded context and auditing the assembled prompt as an inspectable artifact. Each technique changes a different part of the context path, but none removes the need to measure the whole path on the production workload.

In the first week, I choose one task family shaped like production and run it at several context sizes. I include relevant multi-document material, realistic distractors, and the relations that the agent must reconstruct. I plot correctness and reliability alongside cost, inspect the traces around the decline, and set the harness cap below the measured knee for the weakest required task. The cap records its model, workload, margin, and review trigger.

For one long run that has visibly lost its specification, I stop adding repair messages. I consolidate the accepted decisions and remaining questions into one authoritative specification, inspect repository state and verification output, and restart from that package. Environment feedback stays separate as raw observations or retrievable artifacts. The new run can then distinguish what it must obey from what it must investigate.

I route bulk tool output to session-scoped files and keep costed pointers in the active context. The first operational checks are recovery after reset, distinct preservation under concurrent calls, explicit handling of failed writes, and traceability from excerpts to raw output. This is a convention under directional evidence, so I do not credit it with an outcome improvement until a local comparison shows one.

Finally, I run the repository context file against no file on the same tasks. I record task success, adherence, inference cost, tool use, and the file revision. The roughly 20-percent cost increase from one study is a warning that requires local measurement. The paired comparison decides whether the file earns its cost, and category-level tests decide which instructions remain.

What survives between sessions, and in what form, is Chapter 14's subject.

## Sources and evidence

### Budget to measured effective context

- lit/strong: Hsieh, C.-P., et al. (2024), "RULER: What's the Real Context Size of Your Long-Context Language Models?" COLM 2024, arXiv:2404.06654.
- lit/strong: Leng, Q., et al. (2024), "Long Context RAG Performance of Large Language Models," Databricks Mosaic Research, arXiv:2411.03538.
- lit/strong: Li, J., et al. (2025), "LONGCODEU: Benchmarking Long-Context Language Models on Long Code Understanding," arXiv:2503.04359.
- lit/strong: Rando, S., et al. (2025), "LongCodeBench: Evaluating Coding LLMs at 1M Context Windows," arXiv:2505.07897.
- Corroboration: none on record.

### Consolidate the specification and restart lost runs

- lit/strong: Laban, P., et al. (2025), "LLMs Get Lost In Multi-Turn Conversation," arXiv:2505.06120.
- Corroboration, narrative only: the author's trace-diagnostics corpus showed that guidance delivered in the system prompt twenty turns earlier was absent from the visible reasoning: 0% across 1,705 thinking blocks in 199 traces. The literature result, not this case, carries the claim.

### Persist transient context as files

- practitioner/directional: ["Dynamic Context Discovery in Coding Agents"](https://cursor.com/blog/dynamic-context-discovery), Cursor engineering blog, 2026-01-07.
- practitioner/directional: ["How Hightouch built their long-running agent harness"](https://www.amplifypartners.com/blog-posts/how-hightouch-built-their-long-running-agent-harness), Amplify Partners engineering interview, 2026-01-20.
- Corroboration, narrative only: the author's memory system exposes token cost before loading content, and the author's agent fleet stopped a drifting skill-catalog snapshot by moving it to a fingerprinted, session-atomic file validated on reload.

### Measure context files and maintain them like configuration

- lit/null-result: Gloaguen, T., Mündler, N., Müller, M., Raychev, V., Vechev, M. (2026), "Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?" arXiv:2602.11988.
- lit/strong: Chatlatanagulchai, W., et al. (2025), "Agent READMEs: An Empirical Study of Context Files for Agentic Coding," arXiv:2511.12884.
- Corroboration, narrative only: the author's systems include a context file maintained as a failure-mode ledger and a knowledge map with a machine-checkable source hash; contrary cases include a review-checker whose live rule count disagreed with its header and wrapper, and a skill-library README with three inconsistent counts.

Author-system cases in this chapter are narrative illustration, not evidence.
