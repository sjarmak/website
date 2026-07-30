# Durable literature-review agents

## Durable Execution

**Question:** What state must survive process failure in an agent research pipeline?

### Findings

- MAST attributes failures to coordination and inter-agent boundaries, motivating explicit recovery and observability rather than treating the model call as the whole system. [2025arXiv250313657C]
- Temporal persists Workflow event history so orchestration can resume after a Worker or process disappears. [temporal-durable-execution]

### Sources

- [2025arXiv250313657C] Why Do Multi-Agent LLM Systems Fail?. 2025arXiv250313657C
- [temporal-durable-execution] Temporal: Durable Execution. https://docs.temporal.io/workflows#durable-execution

## Tool Reliability

**Question:** How should unreliable tool and retrieval calls be retried and observed?

### Findings

- Replayable execution traces make tool and code-agent failures attributable instead of leaving only a final answer to inspect. [2026arXiv260411641L]
- Activities encapsulate failure-prone or nondeterministic work and can be retried independently under explicit timeout and retry policies. [temporal-activities]

### Sources

- [2026arXiv260411641L] CodeTracer. 2026arXiv260411641L
- [temporal-activities] Temporal: Activities. https://docs.temporal.io/activities

## State And Memory

**Question:** Where is the boundary between orchestration state and research artifacts?

### Findings

- Reusable workflow memory separates compact procedural state from the larger experiences and evidence from which it was learned. [2024arXiv240907429Z]
- Workflow history should carry the decisions needed for replay; large research payloads belong in an artifact store and cross history as references. [temporal-event-history]

### Sources

- [2024arXiv240907429Z] Agent Workflow Memory. 2024arXiv240907429Z
- [temporal-event-history] Temporal: Event History. https://docs.temporal.io/workflow-execution/event

## Evaluation

**Question:** How do we test that recovery preserves correctness rather than only completion?

### Findings

- Stage-level tracing distinguishes failures in writing, retrieval, and generation, which is stronger than measuring final-answer completion alone. [2026arXiv260528732D]
- A time-skipping test environment can run Workflow and Activity behavior against a real ephemeral Temporal service. [temporal-testing]

### Sources

- [2026arXiv260528732D] MemTrace. 2026arXiv260528732D
- [temporal-testing] Temporal Python SDK: Testing. https://python.temporal.io/temporalio.testing.WorkflowEnvironment.html
