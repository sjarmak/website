# Multi-Agent Orchestration — Literature Review

## Scope & method

Multi-agent orchestration concerns the control of systems in which several language-model agents divide work, exchange information, use tools, update shared or private state, and combine their outputs. The relevant unit of analysis is the execution trajectory: the path from a user request through decomposition, delegation, communication, tool use, policy enforcement, verification, and termination. This scope includes architectures and coordination protocols, communication topology, agent memory, reliability, security, observability, governance, evaluation, and resource allocation.

The review synthesizes the supplied scholarly bibliography with production reports and documentation. Guo et al.’s survey provides the broadest early taxonomy of LLM-based multi-agent systems (`2024arXiv240201680G`). Framework papers such as AutoGen, MetaGPT, CAMEL, ChatDev, AgentVerse, and Magentic-One provide concrete architectural patterns (`2023arXiv230808155W`; `2023arXiv230800352H`; `2023arXiv230317760L`; `2023arXiv230707924Q`; `2023arXiv230810848C`; `2024arXiv241104468F`). Later work supplies narrower evidence on failure modes, memory, security, tracing, governance, and cost.

Evidence quality varies by question. Peer-reviewed papers and benchmarks make architectures and systems comparable, but typically simplify users, tool failures, permissions, and organizational constraints. Vendor reports expose operational mechanisms and measurements from real deployments, though they describe selected workloads and rarely disclose enough detail for independent replication. Anthropic’s multi-agent research report, for example, documents a production orchestrator-worker system and a roughly fifteen-fold token multiplier relative to ordinary chat, but those findings do not establish a universal cost ratio for multi-agent systems ([Anthropic, “How we built our multi-agent research system”](https://www.anthropic.com/engineering/multi-agent-research-system)). Framework documentation is useful for understanding available controls; it is weaker evidence that those controls produce reliable outcomes.

The underlying bibliography was assembled through lexical and hybrid retrieval while its dense index was unavailable. Recall is therefore uncertain, especially for older distributed-systems research, classical blackboard architectures, ACL/FIPA communication protocols, and production incident reports. Several cited 2026 papers are recent and have limited citation histories. Conclusions based on them should be treated as frontier claims rather than settled results.

## Landscape

### Coordination architectures

Early LLM multi-agent systems established a small set of recurring coordination patterns. AutoGen models agents as conversable components that exchange messages and may invoke tools or humans (`2023arXiv230808155W`). CAMEL uses role-playing and inception prompts to sustain cooperative interactions (`2023arXiv230317760L`). MetaGPT assigns specialized roles and coordinates them through structured artifacts and a shared message environment (`2023arXiv230800352H`). ChatDev applies a staged “chat chain” to software development, while AgentVerse investigates collaborative and emergent behavior among role-defined agents (`2023arXiv230707924Q`; `2023arXiv230810848C`).

These systems differ in implementation, yet most can be described through four variables:

1. **Control topology:** centralized, hierarchical, decentralized, or dynamically assembled.
2. **Task allocation:** fixed roles, planner assignment, bidding or routing, or self-organization.
3. **Communication topology:** broadcast, pairwise exchange, shared workspace, debate, or sparse graph.
4. **State organization:** transcript-only context, private memories, shared memory, external artifacts, or an explicit task graph.

Centralized orchestrator-worker designs give one agent responsibility for decomposition, delegation, and synthesis. Magentic-One is a prominent reference architecture in this family (`2024arXiv241104468F`). Anthropic’s production research system similarly uses a lead agent to spawn parallel research workers, steer their searches, and synthesize their findings. This structure supports global budgets, consistent policies, and legible traces. Its central planner can become a latency bottleneck, carry an incorrect premise into every branch, or terminate the run on the basis of incomplete worker reports.

Hierarchical systems introduce intermediate coordinators, which can bound context and scale delegation. A hierarchical language-agent architecture has been studied for real-time human–AI coordination, where latency makes unconstrained deliberation impractical (`2023arXiv231215224L`). Dynamic systems such as DyLAN select or connect agents according to the problem, while DynTaskMAS represents work through an evolving task graph and asynchronous parallel execution (`2023arXiv231002170L`; `2025arXiv250307675Y`). These approaches aim to avoid paying for a fixed team on every request.

Decentralized systems distribute planning and communication. S-Agents investigates self-organizing behavior, and AgentNet frames coordination as an evolutionary decentralized process (`2024arXiv240204578C`; `2025arXiv250400587Y`). Decentralization can improve fault isolation and remove a single orchestration bottleneck. It complicates global termination, access control, causal reconstruction, and enforcement of a shared resource budget. The practical choice depends on task decomposability and fault assumptions rather than agent count alone.

Communication topology is itself an optimization variable. Multi-agent debate originally showed that exchanging critiques can improve factuality and reasoning in some settings (`2023arXiv230514325D`). ReConcile uses round-table discussion among diverse models, and work on divergent thinking uses debate to broaden candidate solutions (`2023arXiv230913007C`; `2023arXiv230519118L`). Sparse-topology debate studies whether similar benefits can be retained with fewer communication edges (`2024arXiv240611776L`). Broader topology research finds that prompt design, routing, and graph structure jointly affect performance (`2025arXiv250202533Z`). Cayley-graph optimization extends this inquiry toward scalable communication structures (`2026arXiv260409703L`).

Debate results do not justify a general rule that more discussion improves decisions. Repeated exchanges consume tokens, amplify shared misconceptions, and can converge through social influence rather than evidence. Byzantine-robust aggregation work makes the missing assumptions explicit: a system must specify how many participants may be faulty, what information they share, and which aggregation method remains valid under those conditions (`2026arXiv260509076L`). Conformal social-choice work likewise addresses confidently wrong consensus (`2026arXiv260407667F`). Agreement among agents derived from the same base model, prompts, retrieval corpus, and memory provides weak evidence of independence.

### Orchestration as execution control

Recent work increasingly treats coordination as an architectural layer with explicit protocols rather than an emergent property of conversation (`2026arXiv260503310N`). A production orchestrator must control several operations:

- Convert a request into bounded tasks with completion criteria.
- Assign tools, credentials, context, and budgets to each worker.
- Preserve provenance across messages and artifacts.
- Track dependencies and retries.
- Resolve conflicts without erasing dissent.
- Enforce authorization at the moment of action.
- Determine whether the requested environmental effect occurred.
- Stop on success, exhaustion, policy rejection, or unrecoverable failure.

MAST, a taxonomy derived from multi-agent execution traces, groups observed failures into specification and system-design failures, inter-agent misalignment, and verification or termination failures (`2025arXiv250313657C`). These classes reveal why final-answer grading is insufficient. A fluent answer may hide duplicated searches, conflicting assumptions, unauthorized operations, malformed handoffs, or a declaration of success before an external write completes.

Reliability compounds across dependent steps. Under a simplified independent-failure model, ten steps that each succeed with probability 0.95 yield an end-to-end success probability of approximately \(0.95^{10} \approx 0.60\). Correlated failures can dominate this calculation because several agents may inherit the same faulty plan or stale evidence. Architectural treatments of agentic AI consequently place state, control flow, recovery, and validation inside the reliability model (`2025arXiv251209458N`).

Termination requires executable predicates. Suitable predicates include a record existing with specified fields, a deployment returning a healthy status, every material claim being supported by retrieved evidence, or a message having the approved recipient and content. Completion of the conversational graph is merely a state transition. Acceptance-test-driven evaluation formalizes this distinction by expressing enterprise requirements as checks over the full workflow (`2026arXiv260602755L`).

## Cross-cutting themes

### Memory as coordination infrastructure

Agent memory and orchestration are tightly coupled because coordination depends on what each participant can observe, retain, and change. Memory determines whether agents share a task model, repeat completed work, recover after interruption, or contaminate later tasks with stale state.

The literature spans several memory arrangements. Generative Agents popularized memory streams that store experience for later retrieval and reflection (`2023arXiv230403442P`). Agent Workflow Memory stores reusable procedural knowledge about successful workflows (`2024arXiv240907429Z`). Multi-agent systems add questions of ownership, synchronization, provenance, and consistency. iAgents studies collaboration under information asymmetry, where useful coordination depends on communicating information held by different participants (`2024arXiv240614928L`). Decentralized generative agents use an adaptive hierarchical knowledge graph as shared structure (`2025arXiv250205453Y`). SHIMI proposes a semantic hierarchical memory index using Merkle-DAG and CRDT mechanisms for collective memory synchronization (`2025arXiv250406135H`). Work on decentralized memory extends this toward self-evolving teams with persistent collective state (`2026arXiv260522721H`).

A blackboard architecture externalizes shared state into a workspace that agents can inspect and update. ARIADNE combines a blackboard with Monte Carlo tree search, illustrating how shared artifacts can support explicit search rather than a single accumulating transcript (`2026arXiv260502431W`). Earlier stigmergic systems provide an analogous mechanism: virtual environmental traces coordinate agents without direct pairwise messaging (`2022arXiv221208484J`; `2022arXiv220213456T`).

Shared memory reduces repeated retrieval and supports asynchronous work, but it also creates a propagation channel. Prompt Infection demonstrates that malicious instructions can move from one model’s output into another model’s context (`2024arXiv241007283L`). A research worker may summarize a compromised webpage; its summary enters team memory; another agent treats the summary as trusted internal guidance; and a privileged tool becomes the eventual target. ACIArena studies cascading injection across agents, while LCGuard examines risks associated with sharing lower-level key-value representations (`2026arXiv260407775A`; `2026arXiv260522786A`).

Memory records therefore need provenance, trust labels, namespaces, write permissions, retention limits, and task or tenant isolation. Observations should remain distinguishable from inferences and instructions. Retrieved text should retain its external status after summarization. Persistent procedural memory should have versioning and rollback because a poisoned “successful workflow” can affect many later runs. Shared-memory design is consequently part of the security and governance model.

Memory also shapes collective behavior. Research on social conventions and agent individuality suggests that repeated interactions can produce persistent conventions or differentiated roles (`2024arXiv241008948F`; `2024Entrp..26.1092T`). Project Sid investigates many-agent simulations in which institutional structures develop at scale (`2024arXiv241100114A`). Such findings are suggestive for organizational agents, though simulated societies provide limited evidence for enterprise correctness. Persistent conventions can improve coordination while also entrenching bias. “Aligned Agents, Biased Swarm” directly examines bias amplification at the collective level (`2026arXiv260408963L`).

### Security, governance, and human authority

Every orchestration edge is a trust boundary. Peer messages, retrieved documents, connector content, shared memory, and tool results can contain errors or adversarial instructions. Trust must follow validated evidence and enforceable policy rather than the apparent role of the sender.

Layered controls correspond to stages of the execution graph. Retrieval controls can constrain sources and label imported content. Pre-action authorization can inspect the actor, target, purpose, operation, and data classification. Execution can use isolated environments and short-lived, narrowly scoped credentials. Post-action checks can compare the observed effect with the approved intent. Agent Security Bench supplies attacks and defenses for tool-using agents, while τ-bench evaluates user-agent-tool interactions under domain policies (`2024arXiv241002644Z`; [τ-bench](https://arxiv.org/abs/2406.12045)). Relevant adversarial cases include indirect prompt injection, poisoned handoffs, privilege escalation, cross-tenant disclosure, deceptive tool output, reward hacking, and approval bypass.

Least privilege requires action-level and target-aware authorization. Permission to query a customer platform does not imply access to every customer record or permission to transmit results through any channel. Model Context Protocol research identifies security risks in the rapidly expanding tool-integration layer (`2025arXiv250323278H`). Multi-principal coordination protocols further raise questions about whose authority an agent represents when several users or organizations have conflicting interests (`2026arXiv260409744Q`).

Several projects propose runtime safeguards. AGrail adapts its guardrail as new risks appear (`2025arXiv250211448L`). Governance by Construction embeds policy-as-code and human checkpoints into the architecture (`2026arXiv260520874S`). Meta’s LlamaFirewall separates prompt-injection detection, agent-alignment checking, and code-risk scanning ([Meta, *LlamaFirewall*](https://arxiv.org/pdf/2505.03574)). Adaptive safeguards offer coverage against behavioral drift, but their updates require evaluation, approval, versioning, and rollback. Otherwise adaptation becomes another uncontrolled mutation of the system.

Human oversight is most valuable at consequential transitions: payments, deletions, permission changes, regulated decisions, public communication, and actions supported by conflicting evidence. LangGraph can pause proposed tool calls so an operator may approve, edit, or reject them ([LangGraph human-in-the-loop controls](https://docs.langchain.com/oss/python/langchain/human-in-the-loop)). Review interfaces should show the proposed action, target, evidence, policy rationale, uncertainty, and likely effect. Operational teams should measure approval latency, edit and rejection rates, reviewer disagreement, and incidents that passed review. Excessive prompts create fatigue and encourage rubber-stamping.

### Observability, evaluation, and economics

A useful multi-agent trace records prompt and model versions; agent identities and delegation edges; message provenance; tool arguments, outputs, and side effects; state and memory changes; retries and timeouts; authorization decisions; budgets; human interventions; verification evidence; and termination causes. Parent-child spans preserve delegation structure, correlation identifiers connect retries and asynchronous branches, and artifact hashes link claims to evidence. CodeTracer studies traceable agent states, while LangSmith exposes traces across models, tools, and application steps (`2026arXiv260411641L`; [LangSmith observability](https://www.langchain.com/langsmith/observability)).

Evaluation should cover components, complete trajectories, and the live system. Component tests validate routers, schemas, memory isolation, retrieval, and policies. Trajectory tests execute retries, handoffs, and side effects. Live evaluation measures drift, incidents, escalation, latency, cost, and user outcomes. A production scorecard should report end-to-end completion, tool correctness, policy adherence, adversarial resistance, evidence quality, calibration, recovery, tail latency, and token, tool, and reviewer cost as separate dimensions. Composite success rates conceal trade-offs between speed, safety, breadth, and expense.

Multi-agent orchestration can consume substantially more inference than a single-agent workflow. Anthropic reports roughly fifteen times the tokens of a typical chat interaction for its research system, with parallel workers improving breadth while adding duplicated search and synthesis overhead. CascadeDebate studies cost-aware cascades that reserve expensive deliberation for selected cases (`2026arXiv260412262C`). Practical systems need limits on tokens, tool calls, delegations, retries, concurrency, elapsed time, and human review. They can begin with a narrow workflow or smaller model and escalate when uncertainty, task value, or policy warrants additional resources.

## Open problems & the frontier

**Causal failure attribution.** Current traces can show that a run failed without identifying which earlier decision made the failure likely. Research is needed on counterfactual replay, causal links between memory writes and actions, and attribution across asynchronous branches. Replay must capture nondeterministic model calls, changing external services, credentials, and time-dependent data.

**Verified coordination protocols.** TraceFix proposes repairing coordination protocols with TLA+, suggesting a path toward checking invariants such as bounded delegation, eventual termination, and single authorization of a side effect (`2026arXiv260507935X`). The hard problem is connecting symbolic protocol guarantees to probabilistic agents that may emit malformed or deceptive messages.

**Information-flow control.** Provenance labels often disappear during summarization. A stronger system would track security and tenancy labels through retrieval, transformation, memory, and output, preventing a low-trust source from authorizing a high-impact action. This must operate across natural language, structured tool data, embeddings, and shared caches.

**Calibrated consensus.** Voting needs mechanisms that account for shared models, evidence overlap, strategic behavior, and unequal competence. Byzantine robustness and conformal social choice offer initial tools (`2026arXiv260509076L`; `2026arXiv260407667F`). Future evaluations should vary the number of faulty agents, correlation of errors, visibility of other votes, and quality of independent evidence.

**Dynamic topology and budgeting.** Static teams spend resources even when tasks are simple. Learned planners could select the number of agents, communication graph, model tier, and verification depth from predicted value and risk. They need safeguards against planners that systematically under-budget rare, high-consequence cases.

**Durable organizational memory.** Persistent team memory could preserve workflows, incidents, exceptions, and institutional knowledge across sessions. Open questions include forgetting, conflict resolution, temporal validity, access control, lineage, and protection from gradual poisoning. Memory quality should be evaluated by downstream decisions and recovery behavior rather than retrieval relevance alone.

**Optimal human checkpoints.** Existing practice relies heavily on severity categories. A more precise approach would estimate the expected harm, reversibility, uncertainty, reviewer effectiveness, and delay associated with each proposed checkpoint. The target is selective oversight that catches consequential failures without overwhelming operators.

**Replayable observability standards.** Framework-specific traces inhibit cross-system debugging and evaluation. A shared schema should represent agents, delegations, trust labels, policy decisions, budgets, memory mutations, tool effects, evidence, and human actions. It must support selective disclosure because traces can contain credentials, personal data, and proprietary prompts.

**Emergent-behavior evaluation.** Component tests may pass while collective dynamics produce loops, conformity, collusion, bias amplification, or resource exhaustion. Evaluation harnesses need variable team composition, long horizons, adversarial participants, and repeated interactions. Production incidents should become regression trajectories, creating a closed assurance loop as models, prompts, tools, policies, and data change.

## Practical implications

Production teams should begin with the smallest coordination graph that matches the task. Parallel agents are most defensible when subproblems are separable, breadth has measurable value, and the inference budget supports redundant exploration. A single agent with deterministic tools is often easier to verify for short, sequential workflows.

Each delegated task should specify scope, required evidence, available tools, credentials, budget, and an executable completion condition. Worker outputs should separate observations, inferences, actions, confidence, and unresolved issues. The orchestrator should verify the combined outcome against the original request and inspect the resulting environment after consequential tool calls.

Shared memory should be treated as a governed datastore. Teams need task and tenant namespaces, provenance-preserving schemas, controlled writes, retention rules, versioning, and tests for injection or contamination. Consensus should require independent evidence where participants share models or context.

Operational controls should include action-time authorization, short-lived credentials, recipient and target validation, bounded retries and delegation depth, and human review before irreversible or weakly supported actions. Every evaluation failure and production incident should link to a reconstructable trace and become a regression case. Re-evaluation is required whenever models, prompts, tools, permissions, memory policies, or external data sources change.

## References

- Anthropic. [“How we built our multi-agent research system.”](https://www.anthropic.com/engineering/multi-agent-research-system) 2025.
- Asif et al. *LCGuard: Safe KV Sharing in MAS.* `2026arXiv260522786A`.
- Cemri et al. *Why Do Multi-Agent LLM Systems Fail?* `2025arXiv250313657C`.
- Chang et al. *CascadeDebate: Cost-Aware LLM Cascades.* `2026arXiv260412262C`.
- Chen et al. *AgentVerse: Multi-Agent Collaboration and Emergent Behaviors.* `2023arXiv230810848C`.
- Chen et al. *ReConcile: Round-Table Consensus among Diverse LLMs.* `2023arXiv230913007C`.
- Dibia. *AutoGen Studio.* `2024arXiv240815247D`.
- Du et al. *Improving Factuality and Reasoning through Multiagent Debate.* `2023arXiv230514325D`.
- Fourney et al. *Magentic-One: A Generalist Multi-Agent System.* `2024arXiv241104468F`.
- Guo et al. *LLM-based Multi-Agents: A Survey of Progress and Challenges.* `2024arXiv240201680G`.
- Hao et al. *Self-Evolving Multi-Agent Systems via Decentralized Memory.* `2026arXiv260522721H`.
- Helmi et al. *SHIMI: Semantic Hierarchical Memory Index.* `2025arXiv250406135H`.
- Hong et al. *MetaGPT: Meta Programming for a Multi-Agent Collaborative Framework.* `2023arXiv230800352H`.
- Hou et al. *Model Context Protocol: Landscape and Security Threats.* `2025arXiv250323278H`.
- LangChain. [“LangGraph human-in-the-loop.”](https://docs.langchain.com/oss/python/langchain/human-in-the-loop)
- LangChain. [“LangSmith observability.”](https://www.langchain.com/langsmith/observability)
- Lee et al. *Prompt Infection: LLM-to-LLM Injection in Multi-Agent Systems.* `2024arXiv241007283L`.
- Lee et al. *Robust Multi-Agent LLMs under Byzantine Faults.* `2026arXiv260509076L`.
- Li et al. *CodeTracer: Traceable Agent States.* `2026arXiv260411641L`.
- Li et al. *Multi-Agent Debate with Sparse Communication Topology.* `2024arXiv240611776L`.
- Li et al. *CAMEL: Communicative Agents for Mind Exploration.* `2023arXiv230317760L`.
- Liang et al. *Acceptance-Test-Driven Evaluation Protocols.* `2026arXiv260602755L`.
- Liu et al. *DyLAN: Dynamic LLM-Powered Agent Network.* `2023arXiv231002170L`.
- Liu et al. *iAgents: Collaborative Task under Information Asymmetry.* `2024arXiv240614928L`.
- Luo et al. *AGrail: A Lifelong Agent Guardrail.* `2025arXiv250211448L`.
- Meta. [*LlamaFirewall.*](https://arxiv.org/pdf/2505.03574) 2025.
- OpenAI. [*A practical guide to building agents.*](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf) 2025.
- OpenAI. [“Agentic governance cookbook.”](https://developers.openai.com/cookbook/examples/partners/agentic_governance_guide/agentic_governance_cookbook) 2025.
- Park et al. *Generative Agents.* `2023arXiv230403442P`.
- Qian et al. *ChatDev: Communicative Agents for Software Development.* `2023arXiv230707924Q`.
- Shlomov et al. *Governance by Construction for Generalist Agents.* `2026arXiv260520874S`.
- Wang et al. *Agent Workflow Memory.* `2024arXiv240907429Z`.
- Wu et al. *AutoGen: Multi-Agent Conversation.* `2023arXiv230808155W`.
- Xia et al. *TraceFix: Repairing Agent Coordination Protocols with TLA+.* `2026arXiv260507935X`.
- Zhang et al. *Agent Security Bench.* `2024arXiv241002644Z`.
- Zhou et al. *Multi-Agent Design: Optimizing Prompts and Topologies.* `2025arXiv250202533Z`.
- Sierra. [*τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains.*](https://arxiv.org/abs/2406.12045) `2024arXiv240612045Y`.
