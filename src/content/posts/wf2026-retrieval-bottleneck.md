---
title: "Retrieval is the bottleneck, not reasoning"
date: 2026-07-03
description: "WF2026 field notes on retrieval: Mixedbread's oracle-gap measurements, Jina's search-as-test-time-compute, outcome-weighted memory, markdown-first ingestion, and the knowledge-substrate argument."
tags: [ai-engineering, retrieval, knowledge-graphs, agents, field-notes, wf2026]
draft: false
---

> **Automated field notes** from AI Engineer World's Fair 2026, agent-distilled from auto-captioned recordings; names and quotes are approximate. Method and source links in the [overview](/writing/wf2026-field-notes).

Hand a frontier model the right documents and it answers 93% of BrowseComp Plus; let it find the documents itself with default tools and it drops about 9 points. Mixedbread's Hanna Lichtenberg used that oracle gap, measured on OpenAI's fixed 100K-document benchmark and again on Databricks' Office QA Pro, to locate the bottleneck precisely: reasoning has grown exponentially while search has crawled, and what limits agents is access to the right knowledge, not the thinking applied to it.

Their diagnosis of why agents write bad queries is the memorable part. Coding agents inherit grep-and-regex keyword habits, models mimic human keyword search patterns from the web, and retrieval benchmarks built on entity-style "caveman queries" structurally reward BM25 behavior. One of their five fixes is almost free to adopt: prompt the agent to "write one concise sentence describing what you want to find" instead of "write a search query," which dodges the keyword reflex entirely. With a four-tool search harness (overview search, semantic search, metadata filtering, and grep) plus a small fine-tuned model, they recovered to within about 3 points of oracle on BrowseComp and posted an NDCG@10 of 0.4 on a congressional-documents benchmark where the prior best multi-hop agent scored 0.18.

## Search is test-time compute you already own

Han Xiao's Jina talk supplied the reframe of the conference. Test-time compute means spending more inference for better answers, and Noam Brown's old result gives it teeth, a poker bot thinking for 20 seconds matched a 100,000× scale-up in model size. Building a retrieval pipeline, embeddings plus reranker plus query expansion, is already that same trade: assembling more computation at inference time to buy relevance without a bigger model.

Then they let the loop run itself. An Opus-4.6 proposer mutated a retrieval program, one Python file per generation, over a frozen encoder it could call but never retrain; an evaluator scored each attempt; a JSONL memory carried scores, lineage, and a one-line lesson per program into the next generation. Overnight, 144 programs, no human in the loop. The finding that survived scrutiny: cheap structural recombinations transferred to new tasks, while raw spend-more-compute variants did not generalize, and the memory that made the search work also compounded its biases across the whole program family. The loop optimizes the metric you gave it, not the one you meant.

## Memory should learn from outcomes, not similarity alone

StarlightSearch's Sonam Pankaj located a dead zone in most agent stacks: observability captures every tool call and evals judge pass or fail, but that signal dies in a dashboard and never reaches the agent's context. Their fix weights memory retrieval by a learned utility score, semantic similarity to the task at hand multiplied by whether a memory historically helped or hurt outcomes, so a support agent learns "check settlement before refunding" rather than accumulating preference trivia. Tau-bench policy compliance went from 66% to 76% with utility-weighted memory and 80% once repeated lessons were compiled into skills. Cold start remains unsolved, and they said so plainly.

Sakana's Stefania Druga reached a compatible conclusion from the local-hardware direction: on an M3 Ultra running Qwen 27B, a ranked per-turn decisions ledger beat vector RAG as the recall mechanism, and when a task fit in the context window, memory of any kind added cost without adding capability.

## The substrate argument

Two talks pushed past pipelines to the data layer itself. Neo4j's Emil Eifrem argued that agent teams fail at scale because every team re-wires and re-trust-checks the same hundred databases, and proposed a shared semantic layer with three pillars: a business ontology in human vocabulary, a technical ontology mapping concepts to systems of record, and execution traces that score data-source choices so the substrate learns across agents. Thin agents on a smart substrate, instead of thick agents each hoarding wiring. cognee's Bayer engagement made the research version concrete, a biomedical corpus ingested into an explainable knowledge graph whose embeddings predict which research directions deserve attention, with validation runs against synthetic, real, and shuffled data.

At the ingestion end, Ogilvy's stack was a reminder that none of this requires a platform bill: Docling converts PDFs to markdown on a CPU, PostgreSQL holds vectors, hybrid retrieval fuses semantic and BM25 results with reciprocal-rank fusion, and guardrails live in code rather than prompts, all running with a 0.5B-parameter local model. The retrieval lanes on this site fuse BM25 and embedding scores the same way, so I can confirm the pattern's virtue from the maintenance side: every piece is inspectable when ranking goes wrong.

The unresolved question is whether outcome-weighted memory and self-tuning retrieval stay separate systems or merge. Starlight is learning what to remember, Jina is learning how to search, and Neo4j is learning which source to trust; each loop is small, but they are all the same loop, and whoever composes them first gets an agent that improves at the layer where agents actually fail.
