# Code Retrieval & Enterprise Codebases — Literature Review

## Scope & method

This review synthesizes 1 completed episode deep dives from
the fixture-backed recovery run.

## Landscape

### Episode 4: The Unique Challenges of Large Enterprise Codebases

Monorepos, polyglot dependencies, access-control boundaries, stale code, tribal knowledge, build complexity, and honest evaluation.

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

- **SciX:** [RepoQA: Evaluating Long Context Code Understanding](https://ui.adsabs.harvard.edu/abs/2024arXiv240606025L/abstract)
- **Code Intelligence Digest:** [SCIP: a code intelligence protocol](https://github.com/sourcegraph/scip)
