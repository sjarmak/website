---
title: SciX Agent
status: active
domain: ai-agents
summary: An agentic research assistant over the NASA SciX / ADS corpus, bridging AI agents with scholarly search infrastructure.
role: Creator
repo: https://github.com/sjarmak/scix-agent
architecture: https://sjarmak.github.io/scix-agent/
links:
  - label: Visualizations
    url: https://www.sjarmak.ai/scix-viz/
tech: [Python, Agents, MCP, Retrieval]
featured: true
featuredOrder: 1
order: 10
topics: [agents, retrieval]
tags: [scix, agents]
---

SciX Agent connects agentic workflows to the NASA Science Explorer corpus, letting an agent search, read, and reason over the scholarly literature the way a researcher would. Behind the agent sits a retrieval platform: 32.4 million papers spanning 1800–2026, 299 million citation edges at 99.6% resolution, full-corpus 768-dimensional embeddings, and 14.9 million full-text bodies, all in a single PostgreSQL instance with pgvector on one workstation. The pinned decision is one database and no separate vector engine: transactional joins across vectors, metadata, and a ~50K-entity knowledge graph in one system, accepted at the cost of running 32 million vectors well past the comfort zone of an HNSW index.

A query fans out across parallel lanes (lexical over titles and abstracts, BM25 over full-text bodies, dense retrieval over the embeddings) and fuses results with reciprocal rank fusion. Agents reach all of it through an MCP server capped at 15 tools, because a premortem flagged that much past that point agent tool-selection accuracy degrades; a 28-tool surface was consolidated down with mode multiplexing, and the old names survive as deprecated aliases.

Negative results are kept as evidence rather than discarded. Binary quantization would halve storage but measured a greater-than-40% nDCG@10 loss on scientific text, so it is banned without an explicit recall gate. On the 50-query citation-grounded eval, no reranker beat the RRF baseline by a statistically significant margin — MiniLM led at +0.05 nDCG@10 (not significant) while the NASA domain ranker regressed — so reranking ships off by default pending a stronger, judge-validated gold set. The gold set itself (citation-based ground truth, team-authored queries) is the system's weakest link, and a judge-validation program anchored to human TREC relevance judgments exists to replace it. Operational lessons are encoded the same way: an UNLOGGED-table write optimization once cost 32 million embeddings to a routine Postgres restart, and every migration since carries explicit persistence assertions.

The question driving current work is latency attribution: whether vector search is even 20% of an agent loop's wall clock, which decides whether the next move is a faster index or better retrieval lanes.
