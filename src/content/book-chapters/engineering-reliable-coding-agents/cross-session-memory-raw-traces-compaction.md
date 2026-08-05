---
title: "Cross-session memory, raw traces, and compaction policies"
book: engineering-reliable-coding-agents
order: 14
part: 4
kind: chapter
number: 14
---

One of my memory systems rebuilds its entire derived layer whenever the schema version changes. Nothing in that layer is migrated in place. Three append-only tables containing lessons, memory events, and provenance events cross the rebuild boundary through mechanical export and import. Everything else is regenerated from the work record that produced it.

The arrangement is deliberately inconvenient. I have no comparative evidence that it outperforms a system that rewrites its memory incrementally.

The reason for accepting that inconvenience has been measured elsewhere. Zhang ([2026](https://arxiv.org/abs/2605.12978)) studied memories that language models update continuously and found that they degrade. A production account of Slack’s context management describes the same general pattern. The Agentic Context Engineering synthesis ([2025](https://arxiv.org/abs/2510.04618)) names two degradation modes: context collapse and brevity bias.

Each rewriting pass optimizes a representation already produced by earlier optimization. Deletion and distortion can therefore accumulate without any explicit destructive operation. Routine maintenance gradually damages the evidence.

I treat the complete chronological record of a session’s inputs, actions, outputs, and state changes as the source record for cross-session memory. I call it the raw, or episodic, trace. Every representation derived from that trace must remain rebuildable. Observed query and task failures, rather than anticipated ones, determine when the storage and retrieval layers deserve additional complexity.

Six items support the chapter's three design entries; two are strong, and five are syntheses rather than controlled experiments. The contested storage recommendation has no strong supporting item. The evidence defines architectures and measurement decisions, but supplies no defensible retention period, retrieval threshold, or compression ratio.

## Keep the source record rebuildable

Continuous rewriting can leave the latest memory without evidence that earlier versions contained. Support for this mechanism comes from one explorer-class study retained as strong by the evidence audit, one directional synthesis, and the Slack production account described above. The directional synthesis, Agentic Context Engineering (2025), reports no quantitative result and therefore supports only the direction of the practice. No controlled comparison of storage architectures is available.

I separate the immutable source record from every summary, profile, or extracted fact derived from it. Material removed during an earlier rewrite cannot be reconstructed from the latest version. Another pass may produce a better summary of what remains, but it has no observation from which to recover what disappeared.

The system has crossed a recovery boundary without recording that it did so. Treating each rewrite as the new authoritative state hides the loss behind a successful update.

An immutable raw layer changes that failure mode. The recorder appends original session events and does not ask a model to revise them. A separate process reads those events and produces summaries, profiles, or extracted facts. I call that output the **distillate**: a derived representation constructed from the source record for a stated retrieval purpose.

When the distillate omits relevant material, the omission becomes a retrieval or consolidation defect that can be repaired from preserved evidence.

The architecture has two ownership rules:

- The recorder owns fidelity to what happened, including ordering, identity, and state references.
- The distiller owns one interpretation of that record for a declared retrieval purpose.

A summary may state what the system believed about a user. The trace records which event produced that belief, when it arrived, and which later event contradicted it. Combining those roles in one mutable record turns an inference into history.

Rebuildability follows from this separation. Every derived item carries provenance to:

- the source events that produced it;
- the version of the extraction or summarization rule;
- the schema under which it was stored; and
- any source material excluded by policy.

When the schema changes, the system builds a new derived store from the raw record. It does not ask a model to translate each old conclusion into a new one in place. Parallel rebuilds also allow an operator to compare the old and new distillates before switching readers to the new version.

```text
recorder
    -> inputs + actions + outputs + state changes
        -> chronological raw, or episodic, trace
           [source record: ordering + identity + state references]
                |
                v
distiller
    -> stated retrieval purpose
        -> derived store
            -> provenance to source events
            -> extraction or summarization version
            -> schema version

schema changes
    -> raw record
        -> new derived store

earlier rewrite removes material
    -> later rewrite cannot reconstruct it
```

The underlying artifact is the replayable trace from Chapter 9, used for another purpose. For recovery, the trace reconstructs execution after a crash. For memory, it reconstructs a representation after that representation proves incomplete or wrong.

The requirements overlap, but memory adds retrieval patterns, retention policy, user correction, supersession, and deletion obligations that execution replay alone does not resolve.

Consider a coding agent that learns three facts during a repository investigation:

1. An interface was renamed.
2. A compatibility wrapper remains for one release.
3. One service still calls the wrapper during rollback.

A concise summary may preserve the rename and wrapper while omitting the rollback dependency as a low-frequency detail.

Weeks later, an incident task asks whether the wrapper can be removed. A query against the summary returns a confident but incomplete answer. When the raw trace remains available, the system can:

- retrieve the original observation;
- rebuild the derived facts under a schema that represents rollback dependencies; or
- state that the current distillate does not cover the question.

Without the trace, the only available repair is another model-generated inference over already reduced evidence.

Continuous rewriting also collapses time. Suppose one session records Priya as the owner of a service, and a later session records that ownership moved to Luis. A later task asks who approved a decision between those dates. A profile optimized for the current owner may erase Priya entirely.

Preserving both events allows the derived layer to represent succession, validity intervals, or uncertainty over time.

The companion catalog develops this temporal design separately. Work on temporal knowledge-graph memory from Kim et al. ([2024](https://arxiv.org/abs/2408.05861)) contributes directional support. The recommendation to record two time axes, one for when a claim was true and another for when the system learned it, is practitioner-weighted rather than a measured result of that work.

The raw event sequence supplies the observations. The derived schema still decides whether a claim is current, obsolete, disputed, or historically valid.

Immutability does not imply public access or indefinite retention. Raw traces may contain credentials, personal information, proprietary code, and conclusions later shown to be false. Their value as recovery material increases the harm of unauthorized access.

I therefore treat the raw layer as sensitive source material:

- writers receive append-only authority;
- readers cross an audited access boundary;
- retained data is encrypted where appropriate;
- sensitive fields follow explicit redaction rules; and
- every event belongs to a stated retention policy.

Deletion must follow provenance in the reverse direction. If a user or policy requires removal of a raw event, every summary, profile, embedding, cache entry, and graph edge derived from it becomes suspect. Removing only the transcript leaves the more convenient copies intact.

The system therefore needs a mechanical path to:

1. identify affected derivatives;
2. invalidate them;
3. remove unauthorized cached representations; and
4. rebuild the remaining store from authorized source material.

Forgetting is part of the architecture, and it is the least-measured part of the memory stack in the available evidence. A system may demonstrate successful retrieval of retained facts without testing whether deleted or superseded facts still reach generation through a summary, cache, embedding, or profile.

Deletion propagation and stale-claim retrieval should therefore be measured separately from task completion. A task can succeed while a deleted fact continues shaping the answer.

Retention also has a boundary that the recovery argument cannot override. Some systems cannot lawfully or safely preserve complete traces. Others should not preserve them because the likely harm exceeds their diagnostic value.

The raw layer may therefore require:

- field-level redaction;
- shorter retention windows;
- content-addressed references to separately governed artifacts;
- deliberate noncollection; or
- irreversible deletion of selected event classes.

The design requirement is not universal retention. It is that each loss be explicit and testable. A record already compressed by a model cannot serve as the raw recovery boundary.

*Companion-site aside, thin support:* Persisting the repository regions an agent has already explored may reduce repeated discovery across sessions. The idea rests on one directional source from Pan et al. ([2025](https://arxiv.org/abs/2507.19942)). Whether it reduces redundant retrieval without preserving stale interpretations requires local measurement.

*Companion-site aside, thin support:* Durable project state survived crashes and context loss in the long-horizon engineering system evaluated by Chen ([2026](https://arxiv.org/abs/2604.13018)). This provides directional support for handing artifact references between agents. No controlled comparison with transcript-summary handoff is available, so any fidelity advantage remains an inference. The receiving agent must still verify artifact identity, version, and permissions.

## Add memory infrastructure only for measured retrieval failures

At an architecture review for a new agent project, the proposed design already included a vector database and a knowledge graph. The query log was empty. Nobody had yet asked the system a question, but the retrieval architecture had already been chosen.

The case against that default is directional, practitioner-weighted, and contested. It draws on three explorer syntheses and no strong evidence item. Menschikov ([2025](https://arxiv.org/abs/2506.17001)) compared knowledge-graph memory with lighter substrates in a personal-AI setting. Wolff and Bennati ([2026](https://arxiv.org/abs/2601.07978)) compared cost and accuracy, although the evidence audit classifies the result as directional and records no quantitative finding behind it. Yang ([2026](https://arxiv.org/abs/2602.05665)) surveyed graph-based agent memory and serves as a counterweight to the position taken here rather than direct support for it.

A practitioner argument that knowledge graphs are the wrong abstraction for agent memory accompanies those sources without a study behind it. Together they establish a presumption in favor of simpler infrastructure. They do not establish that relational storage is best across workloads.

I begin with the corpus the agent actually records:

- session events;
- tool observations;
- decisions;
- outcomes; and
- provenance connecting derived facts to those events.

A relational database can store these records with stable identities, explicit time fields, transactional deletion, and access controls. Full-text search provides an inspectable first retrieval path. The operator can see the query, matched terms, filters, and returned records without first interpreting a learned similarity score or model-generated relation.

This starting point is deliberately modest. It handles:

- exact identifiers;
- quoted phrases;
- error messages;
- names and paths;
- structured filters;
- time-bounded queries; and
- lexical combinations over those fields.

It also exposes its failures clearly.

Suppose a user asks for “the outage caused by stale ownership data,” while the trace says that “the on-call mapping lagged the transfer.” Lexical retrieval may miss the relationship. Repeated misses of this kind provide evidence for a semantic lane.

Vector retrieval addresses lexical mismatch by comparing learned representations of the query and stored text. It may be justified when:

- users repeatedly describe the same event in different language;
- terminology varies across teams;
- names change over time; or
- the useful passage shares a concept but few tokens with the query.

It also introduces an embedding model whose version, chunking policy, and source selection affect the representation. The additional index needs its own update, provenance, access-control, and deletion path. I assess those costs against observed lexical failures rather than anticipated ones.

A knowledge graph answers a different class of question. It represents entities and relationships, allowing traversal such as:

> Which services depend on a library owned by a team whose runbook changed after an incident?

When relationships are the retrieval target and multi-hop questions recur, the schema and maintenance burden may be justified. Similarity search is not a reliable substitute for explicit traversal when the answer depends on a sequence of named relations.

The graph obtains those relations through an extraction pipeline. A model or parser reads an event or summary, identifies entities, resolves identities, and emits edges. Each step can:

- invent an entity;
- merge distinct entities;
- split one entity into several;
- assign an unsupported relationship; or
- attach a relationship to the wrong time interval.

The graph can then return a mechanically valid traversal over semantically incorrect edges. Structured presentation may make the answer appear better supported than the underlying evidence warrants.

High-degree entities create another scaling problem. Common concepts such as production, a central platform team, or a widely used library can become hubs connected to much of the store. Traversal through those hubs expands quickly and returns weakly related paths.

Operating the graph then requires:

- relation constraints;
- temporal filters;
- traversal budgets;
- edge-confidence policy;
- identity reconciliation; and
- pruning or correction of weak relationships.

Graph construction becomes an ongoing information-quality program rather than a one-time schema decision.

The two additions address different failures:

- A vector index addresses recurring lexical mismatch.
- A graph addresses recurring relational traversal.

A workload may need both, but combining them compounds provenance, synchronization, access-control, deletion, and rebuild obligations. The architecture record should name which representative queries each component answers and which observed failure made the simpler system inadequate.

The decision resembles Chapter 12’s repository-index choice, but the corpus differs. Chapter 12 addressed indexing a repository whose entities already exist in source code. Here the corpus is the agent’s own experience, and extraction may create entities and relationships absent from the original event.

That difference raises the cost of opaque derivation errors.

Claims of local deployment need the same scrutiny. A framework may store its database on a workstation while sending extraction or embedding requests to a remote service. Another may require a cloud model key for its default path even though the storage package is open source.

I inspect the effective dependency graph, including:

- model calls;
- embedding services;
- telemetry;
- background synchronization;
- credential flows; and
- remote administration.

The location of the database alone does not establish that the memory system is local.

Governance may determine the preferred substrate before retrieval quality does. A relational event store may fit existing backup, residency, audit, row-level access, and deletion controls. A managed vector service may satisfy those obligations with less operational effort elsewhere. A graph can expose sensitive relationships that no individual source event revealed.

Storage cost alone cannot compare systems that create different privacy and accountability surfaces.

The evaluation should keep correctness, performance, and governance separate. A full-text query that returns no relevant event has a retrieval-correctness failure even if it finishes in milliseconds. A graph query that finds the correct path but expands too slowly has a performance failure. A semantically useful vector result that cannot be traced to an authorized source has a governance failure.

Calling all three “memory quality” conceals which component must change.

Before adding infrastructure, I construct a small query set containing:

- ordinary exact lookups;
- paraphrased requests;
- time-bounded questions;
- deletion and supersession checks;
- provenance checks; and
- the relational questions motivating the proposed graph.

For each query, I record:

- whether the relevant evidence was retrieved;
- which irrelevant records displaced it;
- how the result traces to source events;
- latency and cost;
- whether access controls held; and
- whether deleted or superseded material appeared.

The set comes from real tasks and failures and is written before candidate stores are compared. Choosing examples after seeing which store handled them would favor that store, just as Chapter 2’s task-exclusion rules must be fixed before outcomes are inspected.

The decision remains reversible while the raw source layer stays independent. A vector index can be regenerated from authorized trace segments. A graph can be rebuilt under a revised extraction schema and compared with its predecessor. If either becomes necessary, it joins the derived layer without replacing the source record.

The recovery boundary remains intact while retrieval becomes more specialized.

A simple store can become a false economy. Repeated lexical misses can force users to restate questions, cause agents to proceed without prior evidence, and consume review time. Repeated manual joins can conceal relationships the workload depends on. The presumption for simplicity expires when measured query failures and operational constraints show that the initial path cannot support the work.

The opposite failure is easier to overlook because the system appears sophisticated. A graph built for anticipated questions can make entity reconciliation, schema maintenance, and edge pruning the dominant memory workload before any production query uses traversal. A vector lane can retain embeddings derived from source text that has since been deleted or superseded.

Those maintenance costs belong in the same decision record as the retrieval gains.

Scheduled consolidation into typed, pruned records can reduce query-time work once the types correspond to recurring retrieval needs. Scheduling changes when interpretation happens. It does not change the evidence boundary. Every consolidated item still requires source provenance and a rebuild path.

Running consolidation on a timer before the types have stabilized merely moves speculative extraction into a batch process.

Product and decision context may also deserve separation from repository search. Dillon ([2026](https://arxiv.org/abs/2605.08112)) measured coding-agent compliance when recorded product, design, and engineering decisions were available. That evidence is directional. Extending the idea to runbooks, ownership changes, rejected designs, and incident lessons is an inference, although those records answer questions repository structure cannot.

Such material should retain explicit source and time semantics. Code search should remain scoped to the repository rather than becoming an undifferentiated memory store.

*Companion-site aside, thin support:* Memory portability favors exportable events, explicit schemas, and provenance another system can audit. The support from Munirathinam ([2026](https://arxiv.org/abs/2606.01138)) is anecdotal. A portability claim should therefore be tested by exporting and importing an actual corpus. A feature statement in product documentation is not a portability test.

## Let observed failures determine what compaction preserves

A reviewer opens a failed trace annotated under Chapter 10’s protocol and finds that the first upstream error followed a condensed-history update. **Compaction** replaces working history with a shorter representation so a run can remain inside its context budget. When a fixed summarization prompt is treated as routine maintenance, its failure profile remains unmeasured.

One policy may preserve goals while dropping constraints. Another may retain decisions while obscuring the tool observations that supported them. A third may preserve every apparent dependency and fill the effective context window with obsolete branches.

The evidence for treating compaction as a tunable component rests on one strong study, from Kang et al. ([2025](https://arxiv.org/abs/2510.00615)), covering app, office, and question-answering agents. It includes no coding-agent benchmark, so transfer to repository work remains an inference. The study supports treating each compaction policy as a candidate component whose omissions, distortions, and distractions should be measured through downstream tasks rather than assumed away.

Chapter 10 asks the reader to build a corpus of roughly one hundred diverse traces, cluster them into five to ten failure classes, and assign the first upstream failure in each run. Those counts are unmeasured starting recommendations. For compaction failures, I add a context label only when the preserved trace supports it.

The label records whether necessary evidence was:

- omitted;
- retained with altered meaning; or
- present but obscured by irrelevant history.

It also identifies the compaction-policy version and points to the source events that should have survived or been removed.

This label is an attribution judgment rather than a direct measurement. Chapter 10 requires a named human to approve any attribution that changes remediation or the interpretation of an evaluation. Revising the compaction policy is such a decision.

The label also prevents a common attribution error. A task may fail after compaction even when compaction played no causal role. The repository may have changed, a tool may have timed out, or the agent may have ignored evidence that remained available. I revise the policy only when the trace supports a counterfactual claim: a different representation of the same prior history could plausibly have changed the relevant decision.

The initial policies are therefore hypotheses. Before a local failure corpus exists, I can define structural rules such as preserving:

- the current goal;
- unresolved constraints;
- artifact identities;
- decision provenance;
- contradictory observations; and
- uncertainty about external state.

I cannot know their relative value for a particular workload. The early system should preserve the raw trace, record which policy produced each condensed history, and avoid presenting an untested prompt as optimized.

Once failures accumulate, I change one policy element at a time. A revision might preserve the exact observation supporting an unresolved dependency, distinguish superseded claims from deleted claims, or remove completed exploratory branches after their artifacts have been recorded.

I then run paired repeats on the same tasks using the discipline from Chapter 1. The comparison measures task correctness and the context consumed. Token count remains a resource measure rather than the primary outcome.

A comparison between two compaction policies inherits the run-to-run variation Chapter 1 describes. One run under each policy supplies one draw from each condition. A difference that remains smaller than the measured spread should not justify replacing the incumbent.

The compatibility-wrapper example provides a concrete policy test. The raw trace records that one service still calls the wrapper during rollback. The compacted history drops that observation. The agent recommends removing the wrapper, and the reviewer assigns missing context as the first upstream cause of the error.

I revise one rule so that unresolved rollback dependencies retain their supporting observations, then rebuild the condensed history from the same raw trace. Paired runs on the same removal task test whether the agent now preserves the wrapper and uses the retained evidence.

I accept the revision only when task success improves without introducing distraction failures in neighboring cases. Otherwise the rule remains a hypothesis.

Kang et al. reported peak-token reductions of 26 to 54 percent alongside improved task success across three app, office, and question-answering benchmarks. They also reported gains of up to 46 percent for small-model agents after distracting context was removed. Under those experimental conditions, less context coincided with better task performance.

Those figures do not establish an expected token reduction or success gain for coding agents.

The study covers app, office, and question-answering benchmarks rather than coding agents. Transfer to repository work remains an inference.

A plausible mechanism is the effort required to discriminate among records. A model presented with every prior attempt must determine which constraints remain active, which observations are stale, and which abandoned branches still matter. Irrelevant history competes with useful evidence, while repetition can make an obsolete plan appear current. Removing that material can improve correctness while reducing inference cost.

Compression creates the inverse failure. A short history may omit a rare constraint because it appeared once or consumed few tokens. Frequency is a poor proxy for importance when one low-salience fact determines whether a destructive operation is allowed. The failure corpus reveals which details became decisive in real investigations, allowing the policy to preserve evidence according to function rather than prominence.

Task correctness remains too coarse for diagnosis. I inspect whether the compacted context:

- retained the decisive observation;
- preserved its qualifications;
- distinguished current from superseded information; and
- removed material that no longer affected the task.

A successful run can conceal damaged memory when the model guesses correctly or recovers through another tool call. A failed run can contain a sound compacted history that the model then misuses. Keeping those cases separate prevents the compactor from absorbing every downstream error.

Policy versions must remain replayable. The same raw trace should produce the same condensed representation under a named policy and model configuration. When nondeterminism prevents exact reproduction, the rebuild should record that variation explicitly.

Retries also need a declared rule. The system records whether a retry reuses the existing compacted state or regenerates it from the raw trace. Otherwise a successful retry can conceal that the two attempts received different histories.

Once a policy stabilizes across new failures and held-aside traces from the same workload, its examples may support training or distilling a smaller compaction model. That step changes latency and cost while introducing another source of semantic drift.

The smaller model’s outputs and downstream task results should therefore be compared with the accepted policy. A route back to the larger compactor should remain available for cases outside the smaller model’s validated range.

The tuning loop cannot begin on the first day because no local failure evidence exists. Borrowed rules can provide an initial safety hypothesis, while preserved raw traces make mistakes recoverable by allowing the derived representation to be rebuilt.

Optimization begins only after the traces show which omissions, distortions, and distractions caused consequential errors. This dependence on Chapter 10’s failure corpus is why compaction tuning follows the broader retrieval and context architecture rather than preceding it.

## Build memory in reversible stages

Storage and retention decisions take effect from the first session. Compaction-policy optimization waits for the failure corpus from Chapter 10. The sequence below separates controls required immediately from those that depend on observed failures.

From the first run, I preserve every permitted raw trace in inexpensive immutable storage. Every summary, profile, extracted fact, embedding, and graph edge is marked as derived. Provenance, schema versions, and policy versions are recorded before the derived layer becomes operationally important.

Retention limits and deletion propagation are tested as part of the architecture. A recovery boundary that violates its governance boundary cannot remain in service.

I begin retrieval with a relational event store and full-text search. This is a presumption drawn from contested, directional evidence rather than a measured conclusion. Local query failures determine whether the system needs more.

Before adding another retrieval component, I write down the representative queries and observed failures that would justify it:

- recurring lexical mismatch may justify a vector lane;
- recurring relational traversal may justify a graph.

Operating cost, remote dependencies, provenance, deletion behavior, and access control belong in the same decision.

Initial compaction rules remain explicit hypotheses, and every condensed history stays reproducible from the raw trace. Once the Chapter 10 corpus contains failures attributed to context omission, distortion, or distraction, I revise the policy against those cases and remeasure task correctness through paired runs.

Token reduction is useful for capacity planning. It cannot substitute for evidence that the agent made better decisions.

Review capacity is finite and does not increase automatically with fleet size. Part V turns to the people who remain accountable for this work and to the interfaces, review policies, and escalation paths built around their limited attention.

## Sources and evidence

### Preserve raw traces and distill separately

- explorer/strong for the degradation mechanism: "Useful Memories Become Faulty When Continuously Updated by LLMs" (Zhang 2026), arXiv:2605.12978. The study measures degradation under repeated LLM memory updates; it does not compare immutable-source and rebuildable-distillate architectures.
- practitioner/corroborating: Slack production context management (InfoQ 2026-04). The account supports operational plausibility without extending the strong result.
- explorer/directional: Agentic Context Engineering, arXiv:2510.04618. Direction only.
- Corroboration (narrative only): the author's memory system rebuilds its derived layer on schema changes and mechanically carries three append-only event tables across rebuilds.

### Use a light store by default

- explorer/directional: PersonalAI KG comparison (Menschikov), arXiv:2506.17001, with a contested practitioner thread named in the same synthesis. Direction only.
- explorer/directional: Cost-and-Accuracy study (Wolff & Bennati 2026), arXiv:2601.07978. Direction only.
- explorer/directional (boundary citation): Graph-based Agent Memory survey (Yang 2026), arXiv:2602.05665. Cited as the counterweight, not support.
- Corroboration: none on record.

### Optimize compaction from failures

- lit/strong for the measured failure-driven compression comparison: Kang, M., et al. (2025), "ACON: Optimizing Context Compression for Long-horizon LLM Agents," arXiv:2510.00615 (Microsoft). The study tests failure-guided compression on app, office, and question-answering benchmarks; transfer to coding agents remains directional.
- Corroboration: none on record.

### Companion-catalog records named inline

These are not part of this chapter's three taught entries. Each is named in the prose so a reader can follow the aside to its source, at the strength the record carries.

- explorer/directional: Temporal KG memory (Kim et al.), arXiv:2408.05861, carried by the companion record on modeling time explicitly. Supports the two-time-axes aside only.
- lit/directional: Prometheus (Pan, H., et al. 2025), arXiv:2507.19942, carried by the companion record on persisting explored context. No figure quoted here.
- explorer/directional: AiScientist long-horizon engineering (Chen 2026), arXiv:2604.13018, carried by the companion record on durable artifact handoff.
- explorer/anecdotal: memorywire (Munirathinam 2026), arXiv:2606.01138, carried by the companion record on memory portability.
- explorer/directional: Product context and coding-agent decision compliance (Dillon 2026), arXiv:2605.08112, carried by the companion record on the tribal-knowledge substrate. Its compliance figure is not used in the prose.
