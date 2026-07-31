---
title: "Localization funnels, repository indexes, and freshness checks"
book: engineering-reliable-coding-agents
order: 12
part: 4
kind: chapter
number: 12
---

In one of my own memory-system evaluations, run across four seeds, a task required passing a recalled value exactly as a tool argument. Retrieval keyed by the exact memory identity scored 1.0. Retrieval by token similarity surfaced superseded values and scored 0.0. Nothing in the similarity lane had failed. It returned real records, at high rank, that described a state the system had already left behind. That is an author-system case and carries no weight as evidence, but it separates two questions a retrieval score reports as one: whether a result ranks well, and whether it still describes the repository the worker is editing.

Three related design problems arise in repository work. Some tasks require a funnel that separates coarse file selection from fine edit selection. Some require typed structural relationships, because the issue text and the change site share no useful vocabulary. Every retriever, index, and cache also describes a repository state, and that state can expire while its answer remains fluent and specific.

The costs differ. A funnel adds handoffs, and an early miss then propagates through every later stage. A typed index costs construction, language coverage, storage, and query tools, followed by continuing maintenance. When identity checks are too coarse, a freshness gate can also refuse useful evidence. I treat each as an architecture decision with a measurable failure mode.

## Where staged narrowing earns its cost

Hierarchical localization is an architecture decision about where each comparison occurs and what evidence crosses the boundary between stages. Xia et al. ([2024](https://arxiv.org/abs/2407.01489)) removed tool-use autonomy from repository repair and kept three fixed phases. The first performed hierarchical localization, finding where in the repository a change belongs. Repair and patch validation followed. On SWE-bench Lite, a smaller curated subset of SWE-bench tasks, that pipeline outperformed the autonomous agents evaluated alongside it while costing a fraction as much.

Each phase received a bounded input, produced a bounded output, and handed that artifact to the next phase. The result showed that much of the value then attributed to 'agentic' behavior could be recovered by staged narrowing. An open-ended agent had been purchased for work that a fixed architecture could already perform. Later agent systems built on stronger models moved back ahead of that fixed pipeline, which limits the conclusion. The durable design is a sequence of narrowing decisions with validation between the stages, and it remains useful inside an autonomous system.

Repository structure can identify a promising region without identifying the function or statement that owns a failure. In a disconnect case, search returns a response writer, several transport adapters, and a lifecycle callback. The state change responsible for the malformed response sits behind the callback, in a different package.

The evidence that identifies the responsible package differs from the evidence that identifies the function and statement to change. A localization funnel separates those comparisons. It moves from repository structure to candidate files, then to classes, functions, or variables inside those files, and finally to concrete edit locations. Each stage should reduce the candidate set and leave an inspectable handoff.

In the disconnect case, the structure stage narrows the repository to the transport and lifecycle packages. The file handoff retains the response writer and the callback while recording why each was kept. Symbol inspection then follows the callback to the function that changes response state, and the final stage proposes a guard at that assignment. Patch validation exercises the disconnect path. If an intermediate check shows that the state owner was omitted, the funnel widens before repair begins.

The stages have asymmetric consequences. A mistaken edit location can sometimes be corrected after validation exposes a failing patch. A file omitted at the first stage is unavailable to every later stage, however capable the repair model is. The maximum recall of the whole pipeline is therefore determined at the file stage.

![The localization funnel progressively narrows repository evidence, while candidate file selection caps recall because any omitted file remains unavailable to every later inspection and edit stage.](/book-figures/ch12-localization-funnel.svg)

Inspectable handoffs expose downstream mistakes, but validation can correct a bad edit location only when the necessary file survived initial selection.

Sepidband et al. ([2026](https://arxiv.org/abs/2604.05481)) measured that asymmetry across 500 SWE-bench Verified instances and 61 context configurations. The no-file condition supplied the baseline. Adding file-level context produced 15 to 17 times the repair improvement of later localization refinements.

The same experiment found that successful repairs clustered around roughly six to ten relevant files for the model family studied. That range is useful as a diagnostic band. It does not establish a quota for other models, repositories, or issue distributions. Both figures come from one benchmark and one sweep of context configurations. They therefore describe that measured setting rather than a property of repository repair in general.

The practical implication is to invest measurement effort at the file stage before adding more elaborate reasoning after it. Chapter 11's decomposed scoring makes the diagnosis possible. If Recall@k is already low for files, a stronger patch generator is being evaluated on a corpus that excludes the answer. If file recall is high and repair still fails, more localization machinery may only move cost into a stage that is no longer limiting the system.

The funnel also constrains how context should move. A file-selection stage should not silently pass its entire search transcript downstream, because that restores the mixed-granularity problem inside a larger prompt. Its handoff should state which files were kept, why they were kept, and what uncertainty remains. The next stage can then inspect the selected files for structural candidates without inheriting every rejected hypothesis.

Inspectable handoffs create a place to validate each narrowing decision. A file set can be checked against import neighborhoods, ownership boundaries, or a second retrieval lane before the function stage starts. A function set can be checked for definitions and references before concrete lines are proposed. These checks need not be autonomous. They need to expose a miss while recovery is still possible.

Skipping a level appears cheaper because it removes a model call or a retrieval pass. Xia et al. reported the opposite. When their pipeline moved from file level directly to edit locations, both cost and performance worsened, because the fine-grained request forced the model to search too much source at once. Removing a stage increased the work inside the remaining stage. Pipeline length is therefore a poor proxy for pipeline cost.

Chang et al. ([2025](https://arxiv.org/abs/2502.15292)) trained different models for file, function, and statement localization. They found value in giving each level its own representation and its own discrimination problem. That support is directional, and it leaves the component choice open. A fixed prompt, a cheap classifier, or a stronger general model may each be appropriate at a particular stage, depending on workload and latency.

The funnel fits issue-resolution-shaped work, because those tasks decompose naturally into localize, repair, and validate. It is less persuasive for exploratory refactoring, architectural discovery, or changes whose scope emerges only after editing begins. In those workloads, an agent may need to widen the candidate set after a failed hypothesis. A rigid pipeline must provide an explicit return path, or it will keep refining the wrong corpus.

The later agent systems that moved back ahead of the fixed pipeline limit any claim that agency itself was unnecessary. Better models can search, revise, and use tools while preserving hierarchical localization. The evidence supports buying agency only after the fixed narrowing architecture has been measured, then asking which failures autonomy actually repairs. It does not support freezing the original pipeline around a changing model frontier.

The companion material treats several implementation choices separately. They include using structural retrieval as a lane beside text search, injecting stable structural anchors into context, and choosing query-time graph walks when stored expansion would grow too large. Those choices follow the architecture decision. The decision here is narrower: preserve granularity, validate the handoffs, and measure file selection as the stage that can foreclose every later success.

## The maintenance decision behind a typed index

A repair agent receives an issue saying that cancelling an export leaves later exports blocked. The change belongs in a generic state-transition helper reached through a queue consumer and a shared lifecycle component. None of those artifacts contains the language of exports or cancellation.

Exact search finds the user-facing entry point, and similarity search finds code that repeats the symptom. Neither query expresses the dependency path from that entry point to the state owner. A typed index can answer that path question, but the build decision begins with its continuing cost. If no named owner accepts that work, the projected retrieval gain has no durable system behind it.

That work includes parsing every supported language, assigning stable identities to entities, recording relationships, handling generated code and partial parses, publishing updates without exposing half-built state, and testing the query surface. Each new language or artifact type extends the obligation. Index construction is a continuing product surface, even when users see it only through search results.

The cheaper choice is often a generated repository map or skeleton placed near the front of the model's context. It can list directories, important files, top-level symbols, and ownership boundaries. Navigation then relies on cheap operations: exact search, opening definitions, finding references, and listing callers. This approach cannot answer arbitrary multi-hop queries, but it is easy to regenerate and easy to inspect. For a modest repository, a low change rate, or an occasional task, that trade can be preferable to maintaining a service.

An index becomes plausible when the workload repeatedly asks structural questions the map cannot express. The representation parses directories, files, classes, functions, and linked development artifacts into typed nodes. In the export case, invocation and reference edges connect the queue consumer to the lifecycle component and the state helper. A broader index can also record containment, import, inheritance, and definition edges.

This representation is a typed knowledge graph. A typed knowledge graph stores entities under declared kinds and records, for each relationship, how the two entities connect. The types constrain traversal and make a returned path inspectable. They also create schema and parser obligations that a similarity index does not have.

The export example can now be stated as a bounded traversal. Start at the handler named by the issue, follow invocations into the queue consumer, continue through references to the lifecycle component, and return the functions that write the blocked state. The issue and the final helper need no shared token. The graph supplies a chain that can be inspected one edge at a time.

A traversal result can also be more compact than the alternatives. A retriever can return the small subgraph around the relevant entities instead of serializing the repository or loading every file encountered during exploration. The model receives the handler, the intermediate calls, the state owner, and the edge types that connect them. Enough structure remains to explain why each candidate was returned.

Published results show why teams consider paying this cost. Chen et al. ([2025](https://arxiv.org/abs/2503.09089)) reported 92.7 percent file-level localization accuracy for LocAgent, with accuracy declining toward finer granularity. That pattern supports using the graph to protect the file stage while measuring finer stages separately. The figure describes localization rather than repair, so it cannot be read as an issue-resolution rate.

LocAgent's fine-tuned 7B and 32B models approached the reported Claude 3.5 accuracy at roughly 86 percent lower cost. Its ablations showed that the gain depended on the complete search and traversal toolset around the graph, not on the stored representation alone.

Yang et al. ([2025](https://arxiv.org/abs/2503.21710v1)) supply more direct but weaker evidence for multi-hop demand. Among the bugs their repository-aware graph successfully localized, 69.7 percent required traversal across multiple relationships. That figure comes from the first version of the paper, and the headline values changed in the later revisions. The result also comes from SWE-bench Lite. It therefore establishes direction within one benchmark and provides no frequency estimate for an arbitrary production issue.

That study also capped the repair input at the top 20 functions. The cap is part of the architecture, because a traversal system can continue finding plausible neighbors after the useful evidence has been exhausted. Passing every discovered node to the generator lets extra candidates interfere with generation. An index can improve localization while degrading the patch when no boundary separates those two stages.

Ma et al. ([2024](https://arxiv.org/abs/2406.01422)) measured this tension in LingmaAgent across a larger search budget. Its issue-resolution rate, the share of benchmark instances whose tests passed after the change, rose from 16.0 percent with no exploration iterations to 21.3 percent at 600 iterations. Exploration continued to find useful code throughout that range.

The patch-application rate, which counted whether each generated diff applied cleanly to the repository at all, peaked at 200 iterations and then declined through 600. Application was necessary but not sufficient for resolution. Fewer cleanly applied patches could therefore coexist with more resolved instances, when those that applied were more often correct. Accumulated candidates made the downstream generation task harder even while exploration still found plausible code.

![Separate axes reflect different denominators; resolution rises from 16.0% at zero iterations to 21.3% at 600 on a zero-based scale, while unquantified patch application peaks at 200 and declines through 600.](/book-figures/ch12-exploration-budget.svg)

Both rates come from one benchmark configuration. The 200-iteration application peak is configuration-specific, and the application curve carries shape without reported values.

A search budget must be evaluated against both localization and patch application. Both rates were measured in one benchmark configuration. The location of that peak is therefore a property of that configuration rather than a transferable budget.

On SWE-bench Lite, the same study reported a relative improvement of 18.5 percent against SWE-agent, an autonomous tool-using agent baseline. That comparison applies to the benchmark configuration.

Its production report separated automatic from assisted work. In-house issues were resolved automatically in 16.9 percent of cases and after manual intervention in 43.3 percent. Those values describe different levels of human involvement and cannot be combined with the benchmark result. Traversal budget, automatic resolution, and assisted resolution are separate operating quantities.

Graph depth therefore needs a budget tied to the downstream candidate limit. A traversal may stop after a fixed number of expansions, when no new edge type appears, or when the candidate set reaches the repair budget. The literature does not identify one stopping rule that dominates across repositories. A defensible local rule requires logging each expansion, the candidates admitted and pruned, and the point at which additional search stopped changing repair outcomes.

Two other experiments extend the evidence without removing the boundary. Ouyang et al. ([2024](https://arxiv.org/abs/2410.14684)) added RepoGraph, a line-granularity definition and reference graph, as a plug-in. Resolution improved in both pipeline-style and agent-style frameworks. CodexGraph, from Liu et al. ([2024](https://arxiv.org/abs/2408.03910)), offers directional support for graph queries when similarity retrieval has poor multi-hop recall. Together they support a specialist structural lane that can attach to different orchestration styles.

Line precision remains difficult. LocAgent's accuracy degraded as localization moved below files, and a graph rendered as text may not preserve distinctions that are explicit in storage. Direction, edge type, entity scope, or multiple paths can collapse into an ordering that the model misreads. Extending the graph below functions can help line-level work, but it also increases node count, serialization pressure, and the number of nearly equivalent candidates.

Query construction introduces another failure surface. A valid graph can return an irrelevant answer because the model starts from the wrong entity, chooses the wrong edge, or stops one hop early. Bounded operations such as 'find definitions', 'list callers', and 'follow imports' are easier to validate than a general graph language generated in one attempt. Routing simple entity questions to those cheap operations preserves the graph for the structural questions that require it.

The representation itself should be measured. An index might return paths, source excerpts, signatures, summaries, edge lists, or some combination. Each form changes token cost and the evidence available to the generator. A compact summary may hide the exact call that proves relevance. Raw source may obscure the path that made the source worth retrieving. Treating serialization as a first-class design choice prevents storage success from being mistaken for usable context.

In my own architecture-analysis toolkit, a typed symbol graph supports a change-propagation measure by counting files reachable from a changed entity within a bounded depth. That implementation illustrates a second use for the same structure. Impact analysis can traverse relationships that lexical similarity does not represent. This is narrative corroboration and supplies no independent evidence about an agent's repair rate.

The owner of the index must also own its correspondence to the repository. Incremental parsers fail, branches diverge, force-updated generated artifacts retain old identities, and linked issue data changes independently of code. An index that is not rechecked against repository state after those events silently answers a question about yesterday's repository. The graph's admission path must enforce that correspondence on every result.

Readers who will not fund that path should choose the repository map and fixed navigation operations explicitly. Readers who will fund it should cap candidates, budget traversal, test serialization, and measure the graph as one component of the surrounding toolset. The cost of maintaining an index is justified only while an owner can show which repository state each answer describes.

## Freshness as an admission condition

Weng et al. ([2026](https://arxiv.org/abs/2605.14478)) changed Python helper signatures in 17 curated samples and compared stale with current retrieved snippets. That small diagnostic study is the only literature support for this entry. It isolated the direction, but one staleness class and two models establish neither a general effect size nor a refresh cadence.

Under stale-only retrieval, Qwen2.5-Coder-7B-Instruct produced 15 incompatible outputs and gpt-4.1-mini produced 13. Each model received the same 17 samples, and current-only retrieval produced no such failure for either. These paired results support a narrow design decision. Retrieved code should be admitted only when the system can tie it to the current repository state.

A stale result is an active hazard, because it presents a concrete and plausible account of an API that no longer exists. High rank cannot compensate for answering from the wrong state.

The failure differs from an ordinary miss. Without retrieval, the models in the study tended to fail and did not emit calls to the obsolete signature. With stale context, they produced executable-looking code with the wrong contract. Under hidden staleness, retrieval became net-negative, because the system converted uncertainty into an incompatible implementation.

Adding current evidence changed that behavior even when stale evidence remained present. Across the tested model and condition combinations, adding valid current snippets alongside the stale ones lowered the rate of current-state-incompatible outputs by 47 to 65 percentage points relative to the stale-only condition, over the same 17 samples. Permuting the rank order produced no significant difference. For this diagnostic, the operative variable was the presence of current evidence, not whether it appeared first.

The paired result is an instance of the binary-outcome row in Chapter 1's test-selection table. Both retrieval conditions received the same 17 items, each outcome was pass or fail, and McNemar's test analyzed the discordant pairs.

The exact two-sided values were <span class="katex"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mn>6.1</mn><mo>×</mo><msup><mn>10</mn><mrow><mo>−</mo><mn>5</mn></mrow></msup></mrow><annotation encoding="application/x-tex">6.1 \times 10^{-5}</annotation></semantics></math></span> for Qwen2.5-Coder-7B-Instruct and <span class="katex"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mn>2.4</mn><mo>×</mo><msup><mn>10</mn><mrow><mo>−</mo><mn>4</mn></mrow></msup></mrow><annotation encoding="application/x-tex">2.4 \times 10^{-4}</annotation></semantics></math></span> for gpt-4.1-mini. Each value gives the probability, under the null hypothesis of no difference between the two retrieval conditions, of a discordance at least as extreme as the one observed. Those values establish a difference within the curated sample, and they do not estimate how large the effect would be in another repository.

The result does not show that stale retrievals will fail at similar rates in another codebase. It does not show that every kind of drift is equally harmful or that one refresh interval is safe. Helper-signature changes are especially direct, because stale code presents a callable contract. Other changes may produce different failure rates and different observability.

A freshness gate needs two identities: the state used to build the retrieval artifact and the state the worker is allowed to edit. A commit identity can represent a clean tree. A content hash is required when in-scope files contain uncommitted changes, because the commit alone then describes a state the model is not seeing. The retrieval response should carry the indexed identity so the caller can compare it with the working identity before exposing any snippet.

The comparison belongs at the retrieval boundary. Checking only when the index process starts leaves a race in which files change during construction or after a long query begins. A safe builder reads from a fixed snapshot, completes the index privately, and publishes the new generation atomically with its state identity. Queries then see one complete generation.

Suppose the index was built from a clean commit and a worker then edits the helper without committing it. A query returns the old signature together with the index's commit identity. The gate hashes the in-scope working file, detects the mismatch, and withholds the snippet before the generator sees it.

Live exact search can supply the current helper while a new index generation builds. The builder snapshots the edited file, publishes the completed generation with its new content identity, and repeats the original query. The caller admits the second result only when its identity matches the worker's state.

Concurrent work makes the identity choice visible. Two agents can share a base commit while editing different files. A commit-level gate may therefore admit snippets that are stale for both working trees. Hashing every file in a large repository on every query may cost too much. A practical design can pin the commit, track hashes for the files covered by the index response, and invalidate on filesystem events. Its coverage and its race window must be measured.

Caches require the same treatment. A query cache keyed only by search text can return yesterday's answer after the index has refreshed. The repository-state identity must participate in the cache key, or the cache entry must be invalidated when a new index generation publishes. Otherwise the freshness check protects the store while a faster layer bypasses it.

Retries also need a state rule. If a query fails because its index generation is stale, retrying against the same generation cannot improve the answer. The retry must wait for or request a generation built from the accepted state, then repeat the query against that generation. A timeout may bound the wait, but it should return a visible freshness failure rather than silently serving stale context.

Refusal has an operational cost. Live exact search may still work while the structural index rebuilds. The gate can therefore fall back to current, lower-capability navigation. If no current source is available, a cold miss that preserves uncertainty is preferable to a fluent answer from an obsolete state. The generator can then ask for more evidence or fail explicitly rather than working from a false API hypothesis.

No source in the literature reviewed for this chapter prescribes a universal refresh cadence. This remains a literature gap. Repository change rate, index build time, query latency, and the consequence of stale evidence can inform a local policy. They do not supply an evidence-backed interval.

An event-driven refresh can shorten the stale window for ordinary edits, although missed events and parser failures still require reconciliation. A scheduled rebuild can provide that reconciliation, but its period should be justified by measured drift and recovery cost. The system should record the age and the state-mismatch rate of rejected results as retrieval metrics.

My own session-snapshot system illustrates the strict version of this gate. It pins cryptographic hashes for all in-scope files together with the repository commit, and any drift marks the snapshot stale. The system regenerates the snapshot rather than forking it. Remotely sourced repository knowledge is excluded, because the system cannot bind it to the same hash check.

The maintenance warning also appears in my own published literature-review index, which is the least flattering example in this chapter. One index surface advertised a paper count that disagreed with the page it linked, and synchronized copies diverged further. The index continued to look authoritative after it had stopped describing its own contents. This contrary case is the maintenance cost of the prescription. A freshness policy that no one operates becomes another stale artifact.

Freshness does not decide whether a user or agent is authorized to retrieve the code. Permission policy requires its own identities, rules, and audit path. The evidence here supports rejecting obsolete repository states, but it does not establish who may see a current one.

## Decisions to make this week

On Monday, begin with Chapter 11's decomposed retrieval scores and ask whether localization is actually the bottleneck. Inspect the file results before changing the agent architecture.

File Recall@k answers whether the repair stage receives the right files at all. If the right files rarely appear, stage the narrowing and invest first in file selection, before buying more open-ended agency.

The next decision is whether repeated structural questions justify a typed index. Name its owner before approving the build, record which languages and relationships it covers, cap the candidates it can send to repair, and define how its state will be published. If no one owns freshness, write down the cheaper fallback: a generated repository map near the front of context, plus exact search, definitions, references, and bounded caller navigation.

Every index and cache should carry a commit or content identity. Compare that identity with the working tree at retrieval time, record drift as a metric, and refuse or fall back to live navigation on mismatch. A refused result is observable and recoverable. A stale result can pass silently into a plausible patch.

Chapter 13 turns from which evidence the system retrieves to how much of that evidence the model can actually use.

## Sources and evidence

The evidence class and strength on each entry below come from its catalog record. Author-system cases in this chapter are narrative illustration and are not part of the evidence base.

### Taught entry 1: staged-localization-funnel

- lit/strong: Xia, C. S., et al. (2024), "Agentless: Demystifying LLM-based Software Engineering Agents," arXiv:2407.01489.
- lit/directional: Chang, J., et al. (2025), "BugCerberus: Bridging Bug Localization and Issue Fixing," arXiv:2502.15292. (Per-hierarchy-level specialization; direction only.)
- lit/strong: Sepidband, M., Viet Pham, H., Hemmati, H. (2026), "On the Role of Fault Localization Context for LLM-Based Program Repair," arXiv:2604.05481.
- Corroboration: none on record.

### Taught entry 2: index-repository-as-knowledge-graph

- lit/strong: Chen, Z., et al. (2025), "LocAgent: Graph-Guided LLM Agents for Code Localization," arXiv:2503.09089.
- lit/directional: Yang, B., et al. (2025), "Enhancing Repository-Level Software Repair via Repository-Aware Knowledge Graphs" (KGCompass), arXiv:2503.21710. (The 69.7 percent multi-hop figure is carried from v1; later versions report different headline values, so the inline link pins v1.)
- lit/strong: Ma, Y., et al. (2024), "Alibaba LingmaAgent: Improving Automated Issue Resolution via Comprehensive Repository Exploration," arXiv:2406.01422.
- lit/directional: Liu, X., et al. (2024), "CodexGraph: Bridging Large Language Models and Code Repositories via Code Graph Databases," ICLR 2025, arXiv:2408.03910.
- lit/strong: Ouyang, S., et al. (2024), "RepoGraph: Enhancing AI Software Engineering with Repository-level Code Graph," arXiv:2410.14684.
- explorer/strong: AOCI AI-oriented code indexing (Liu 2026), arXiv:2605.02421.
- explorer/directional: MAGIS (Tao 2024), arXiv:2403.17927. Direction only.

### Taught entry 3: gate-retrieval-on-freshness

- lit/directional: Weng, H., et al. (2026), "When Retrieval Hurts Code Completion: A Diagnostic Study of Stale Repository Context," arXiv:2605.14478.
