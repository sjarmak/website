# Multi-Agent Orchestration — Literature Review

## Scope & method

This review synthesizes 1 completed episode deep dives from
the fixture-backed recovery run.

## Landscape

### Episode 4: Enterprise & Production

Production reliability and failure modes, observability, evaluation, guardrails, cross-agent security, cost, latency, and human oversight.

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

- **SciX:** [Why Do Multi-Agent LLM Systems Fail?](https://ui.adsabs.harvard.edu/abs/2025arXiv250313657C/abstract)
- **Code Intelligence Digest:** [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
