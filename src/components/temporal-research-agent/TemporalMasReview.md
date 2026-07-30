# Multi-Agent Orchestration — Literature Review

## Scope & method

This review synthesizes 5 completed episode deep dives from
the fixture-backed recovery run.

## Landscape

### Episode 1: Foundations & Topologies

What multi-agent orchestration is and why or when it helps versus a single agent. Cover orchestrator-worker, hierarchical, swarm, blackboard, and pipeline topologies.

### Episode 2: Patterns & Frameworks

Planning, decomposition, routing, handoffs, debate, voting, and the frameworks and interoperability protocols that encode those patterns.

### Episode 3: Memory in Multi-Agent Systems

Shared versus per-agent memory, blackboards and ledgers, shared knowledge graphs, workflow memory, and durable team substrates.

### Episode 4: Enterprise & Production

Production reliability and failure modes, observability, evaluation, guardrails, cross-agent security, cost, latency, and human oversight.

### Episode 5: Frontier & Open Problems

Causal failure attribution, verified coordination, cost-bounded orchestration, durable team memory, calibrated consensus, learned topology, and trace standards.

## Cross-cutting themes

Evidence provenance, explicit stage boundaries, and inspectable artifacts recur
across the completed episodes.

## Open problems & the frontier

The production path still requires provider-specific retry and idempotency
contracts for expensive or mutating external calls.

## Practical implications

Temporal can resume orchestration after Worker loss while preserving the
business sequence that creates each deliverable.

## References

- **SciX:** [Large Language Model based Multi-Agents: A Survey of Progress and Challenges](https://ui.adsabs.harvard.edu/abs/2024arXiv240201680G/abstract)
- **Code Intelligence Digest:** [Magentic-One: A Generalist Multi-Agent System](https://arxiv.org/abs/2411.04468)
- **SciX:** [AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation](https://ui.adsabs.harvard.edu/abs/2023arXiv230808155W/abstract)
- **Code Intelligence Digest:** [Model Context Protocol](https://modelcontextprotocol.io/)
- **SciX:** [Agent Workflow Memory](https://ui.adsabs.harvard.edu/abs/2024arXiv240907429Z/abstract)
- **Code Intelligence Digest:** [Magentic-One progress ledger](https://arxiv.org/abs/2411.04468)
- **SciX:** [Why Do Multi-Agent LLM Systems Fail?](https://ui.adsabs.harvard.edu/abs/2025arXiv250313657C/abstract)
- **Code Intelligence Digest:** [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- **SciX:** [TraceFix: Verified Coordination Protocols for Language Agents](https://ui.adsabs.harvard.edu/abs/2026arXiv260507935X/abstract)
- **Code Intelligence Digest:** [OpenTelemetry semantic conventions for generative AI](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
