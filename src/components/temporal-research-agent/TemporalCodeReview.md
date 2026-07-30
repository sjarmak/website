# Code Retrieval & Enterprise Codebases — Literature Review

## Scope & method

This review synthesizes 5 completed episode deep dives from
the fixture-backed recovery run.

## Landscape

### Episode 1: Why Code Isn't Text IR

How structure, symbols, references, and the natural-language intent gap distinguish code retrieval from text information retrieval.

### Episode 2: Techniques: Lexical → Neural → Graph

The technique ladder from lexical retrieval through code embeddings, graph retrieval, late interaction, and hybrid reranking.

### Episode 3: Repository-Scale & Code Graphs

Cross-file and repository retrieval, static-analysis guidance, code property graphs, knowledge graphs, and agentic codebase navigation.

### Episode 4: The Unique Challenges of Large Enterprise Codebases

Monorepos, polyglot dependencies, access-control boundaries, stale code, tribal knowledge, build complexity, and honest evaluation.

### Episode 5: Frontier & Open Problems

Access-aware retrieval, contamination-proof evaluation, scalable symbolic-semantic indexes, staleness, polyglot dependencies, build graphs, and incremental indexing.

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

- **SciX:** [CodeSearchNet Challenge: Evaluating the State of Semantic Code Search](https://ui.adsabs.harvard.edu/abs/2019arXiv190909436H/abstract)
- **Code Intelligence Digest:** [CodeSearchNet](https://github.com/github/CodeSearchNet)
- **SciX:** [GraphCodeBERT: Pre-training Code Representations with Data Flow](https://ui.adsabs.harvard.edu/abs/2020arXiv200908366G/abstract)
- **Code Intelligence Digest:** [ColBERT: Efficient and Effective Passage Search via Contextualized Late Interaction](https://arxiv.org/abs/2004.12832)
- **SciX:** [RepoCoder: Repository-Level Code Completion Through Iterative Retrieval and Generation](https://ui.adsabs.harvard.edu/abs/2023arXiv230312570Z/abstract)
- **Code Intelligence Digest:** [SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering](https://arxiv.org/abs/2405.15793)
- **SciX:** [RepoQA: Evaluating Long Context Code Understanding](https://ui.adsabs.harvard.edu/abs/2024arXiv240606025L/abstract)
- **Code Intelligence Digest:** [SCIP: a code intelligence protocol](https://github.com/sourcegraph/scip)
- **SciX:** [AOCI: A Symbolic and Semantic Index for Agentic Code Intelligence](https://ui.adsabs.harvard.edu/abs/2026arXiv260502421L/abstract)
- **Code Intelligence Digest:** [Zoekt: fast trigram-based code search](https://github.com/sourcegraph/zoekt)
