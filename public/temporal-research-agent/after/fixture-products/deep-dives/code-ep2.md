# Techniques: Lexical → Neural → Graph — Deep Dive

**Series:** Code Retrieval & Enterprise Codebases

## The core framing

The technique ladder from lexical retrieval through code embeddings, graph retrieval, late interaction, and hybrid reranking.

## Why it matters

The retrieved evidence shows why this episode belongs in the series and where
the implementation and evaluation boundaries sit.

## The mechanism and technical substance

- **SciX:** GraphCodeBERT incorporates data-flow relationships into code representations. ([GraphCodeBERT: Pre-training Code Representations with Data Flow](https://ui.adsabs.harvard.edu/abs/2020arXiv200908366G/abstract))
- **Code Intelligence Digest:** Late interaction retains token-level matching while precomputing document representations. ([ColBERT: Efficient and Effective Passage Search via Contextualized Late Interaction](https://arxiv.org/abs/2004.12832))

## Tensions, contrasts, and dissent

The sources distinguish architectural mechanisms from production claims and
retain differences between scholarly evidence and engineering reports.

## Evidence & evaluation

The research Activity persisted 2 source records with content
hashes and provider provenance before this document was written.

## Practical takeaways

Treat the episode as a sequence of evidence-backed decisions rather than one
opaque model call.

## Key sources

- **SciX:** [GraphCodeBERT: Pre-training Code Representations with Data Flow](https://ui.adsabs.harvard.edu/abs/2020arXiv200908366G/abstract)
- **Code Intelligence Digest:** [ColBERT: Efficient and Effective Passage Search via Contextualized Late Interaction](https://arxiv.org/abs/2004.12832)
