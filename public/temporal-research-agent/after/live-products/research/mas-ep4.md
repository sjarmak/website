# Enterprise & Production — Research

## Scope and method

**Artifact key:** `mas-ep4`

This brief examines the production layer of multi-agent systems: reliability, tracing, evaluation, security controls, human intervention, and resource management. It prioritizes the supplied industry engineering reports and documentation, using scholarly work for failure taxonomies, benchmarks, and emerging assurance methods. Sources were included only when their supplied record directly addressed deployed agents or a production-relevant control. Unrelated retrieval results were excluded.

A useful framing for the episode is that production quality belongs to the whole execution graph. A capable model can still participate in an unreliable system when delegation, shared context, tool permissions, termination logic, or recovery behavior is defective. Every additional agent creates another failure boundary and another place where cost, latency, or untrusted instructions can propagate.

## Key findings

- **Multi-agent failures are often coordination failures.** MAST analyzed multi-agent traces and organized failures into specification and system-design problems, inter-agent misalignment, and failures of task verification or termination (`2025arXiv250313657C`). Production monitoring therefore needs to inspect delegation and handoffs alongside individual model outputs.

- **Reliability compounds across steps.** A workflow containing many individually plausible actions can have a poor end-to-end completion rate. Tool errors, malformed state, repeated delegation, and premature declarations of success accumulate. *Architectures for Building Agentic AI* consequently treats reliability as an architectural property rather than a model-only attribute (`2025arXiv251209458N`).

- **Consensus can conceal errors.** Adding agents or votes does not guarantee correctness. Correlated models can accept the same false premise, while a faulty or adversarial participant can distort shared decisions. Research on Byzantine robustness (`2026arXiv260509076L`) makes fault assumptions, aggregation rules, and dissent handling explicit engineering concerns.

- **Tracing must reconstruct decisions, not merely count tokens.** A useful trace records prompts, messages, tool arguments and results, state transitions, retries, budgets, policy decisions, and human approvals. CodeTracer focuses on traceable agent states (`2026arXiv260411641L`), while [LangSmith observability](https://www.langchain.com/langsmith/observability) exposes execution traces for debugging and evaluation.

- **Production evaluation should resemble acceptance testing.** Aggregate benchmark scores can miss violations of business rules. Acceptance-test-driven protocols (`2026arXiv260602755L`) point toward executable criteria for complete workflows. Security needs its own suites: Agent Security Bench evaluates attacks and defenses (`2024arXiv241002644Z`), while [τ-bench](https://arxiv.org/abs/2406.12045) tests agents interacting with users and tools under domain policies.

- **Agent-to-agent communication is an attack surface.** Prompt Infection demonstrates that malicious instructions can move from one model’s output into another model’s context (`2024arXiv241007283L`). Shared memories, retrieved documents, connector results, and peer messages should all carry provenance and remain untrusted until policy checks are applied.

- **Guardrails need several enforcement points.** Input filtering alone cannot govern an agent that reads external content and later invokes privileged tools. AGrail proposes an adaptive, lifelong guardrail (`2025arXiv250211448L`); Governance by Construction adds policy-as-code and human checkpoints (`2026arXiv260520874S`). Meta’s [LlamaFirewall](https://arxiv.org/pdf/2505.03574) similarly separates prompt-injection detection, agent-alignment checks, and code-risk scanning.

- **Human oversight works best at consequential transitions.** [LangGraph’s human-in-the-loop controls](https://docs.langchain.com/oss/python/langchain/human-in-the-loop) can pause tool execution so an operator can approve, edit, or reject a proposed action. High-value checkpoints include payments, destructive mutations, permission changes, external communications, and decisions made with weak evidence.

- **Multi-agent capability carries a substantial resource premium.** Anthropic reports that its [multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) uses roughly fifteen times the tokens of ordinary chat interactions. Parallel work can reduce wall-clock time, yet it raises token consumption, concurrency demand, and the cost of duplicated searches. CascadeDebate addresses this trade-off through cost-aware model cascades (`2026arXiv260412262C`).

- **Production assurance must continue after deployment.** Behavior can drift as models, prompts, tools, permissions, and external data change. *Measuring Agents in Production* directly studies the methods used to assess deployed agents (`2025arXiv251204123P`), while adaptive runtime governance focuses on authorized agents whose behavior becomes unsafe over time (`2026arXiv260424686M`).

## Evidence and contrasts

Anthropic’s research system offers the clearest supplied production example. A lead agent decomposes a research request, delegates searches to subagents, and synthesizes their findings. The company reports gains on breadth-heavy research while also documenting compounding errors, coordination difficulty, and a large token multiplier. The lesson is operationally specific: parallelism is valuable when subproblems are separable and the result justifies the extra inference budget. Serial tasks and tightly coupled reasoning provide less opportunity to recover that cost.

OpenAI’s [practical guide to building agents](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf) emphasizes incremental orchestration, clear tool definitions, guardrails, and escalation. Its [agentic governance cookbook](https://developers.openai.com/cookbook/examples/partners/agentic_governance_guide/agentic_governance_cookbook) extends that approach into auditable controls. Together with Governance by Construction, these sources support an enforcement pattern with pre-action authorization, constrained execution, post-action verification, and recorded evidence.

Observability and evaluation solve different problems. A trace explains what happened during one run. An evaluation estimates how often a class of runs satisfies requirements. Production teams need both connected: failed acceptance tests should link to complete traces, and recurrent trace patterns should become regression cases. The minimal scorecard should separate task completion, policy compliance, tool correctness, security resistance, human-escalation quality, latency, and cost.

Static allowlists also differ from runtime governance. An agent may be entitled to use a customer-record tool while still choosing the wrong customer, leaking retrieved content into another channel, or following an instruction embedded in a webpage. Deployment-grounded security frameworks for LLM and computer-use agents (`2026arXiv260610749L`; `2026arXiv260507110C`) place controls across the full lifecycle and execution path. Least privilege, provenance labels, bounded credentials, isolated execution, and action-level policy checks are complementary measures.

## Cold-open candidates

1. **The poisoned handoff:** A research agent reads a webpage containing a hidden instruction. Its summary appears harmless enough to the orchestrator, but the injected command is copied into shared memory. A second agent treats that memory as trusted internal context and invokes a connector. Prompt Infection turns the familiar prompt-injection story into a supply-chain incident moving through the agent team.

2. **The fifteen-times bill:** A polished research answer arrives quickly because many subagents searched in parallel. The trace reveals duplicated searches, failed delegations, and roughly fifteen times the token consumption of a normal chat. Anthropic’s production report makes the central trade-off audible: the system bought breadth and speed with a much larger inference budget and a wider failure surface.

## Confirmed new sources

**`new_bibcodes`:**

- `2024arXiv240203578H` — *LLM Multi-Agent Systems: Challenges and Open Problems*
- `2025arXiv251204123P` — *Measuring Agents in Production*
- `2025arXiv251209458N` — *Architectures for Building Agentic AI*
- `2026arXiv260424686M` — *Governing What You Cannot Observe: Adaptive Runtime Governance for Autonomous AI Agents*
- `2026arXiv260507110C` — *Securing Computer-Use Agents: A Unified Architecture-Lifecycle Framework for Deployment-Grounded Reliability*
- `2026arXiv260604037L` — *Toward Pre-Deployment Assurance for Enterprise AI Agents*
- `2026arXiv260610749L` — *Toward Secure LLM Agents: Threat Surfaces, Attacks, Defenses, and Evaluation*
