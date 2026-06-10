---
title: Code Intelligence Digest
status: active
domain: tooling
summary: Aggregates feeds and presents curated weekly and monthly digests of code intelligence, tools, and AI agents using hybrid LLM + BM25 + recency scoring.
role: Creator
repo: https://github.com/sjarmak/code-intelligence-digest
tech: [TypeScript, Retrieval, LLM]
order: 7
topics: [code-intelligence, retrieval, agents]
tags: [digest, retrieval]
---

Inoreader feeds and NASA ADS papers flow into Postgres on an hourly cron, get normalized and sorted into nine categories, and are scored with a hybrid formula: an LLM relevance judgment blended with BM25, multiplied by domain-term and watchlist boosts, then ranked with per-source diversity caps and served through a Next.js API and React UI. On top sits an agent layer (competitive intel, market briefs, content ideas) that retrieves from both Postgres and live web search, synthesizes reports, and feeds the newsletter and podcast generation published at [sjarmak.ai/digest](/digest). The hybrid scoring is also a resilience decision: BM25 grounds the ranking in domain vocabulary, and the system keeps working when the LLM is down.

The whole thing runs in a 512MB container on a free hosting tier, and much of the architecture follows from that constraint. Full-text extraction is capped at eight fetches per run because HTML parsing is memory-heavy, scoring is batched per category to bound the heap, and sync is resumable through continuation tokens with a tracked API budget, so a rate limit mid-fetch loses nothing and the next hourly run picks up where the last one stopped. Normalization carries the small corrections that make a digest trustworthy: arXiv publication dates are fixed via the arXiv API because feed readers report feed-update time instead, and tracking redirects from newsletter platforms are unwrapped to canonical URLs.

Every external dependency has a fallback: a second completion provider behind the first, a second web-search provider, pseudo-embeddings when no key is configured. A 2026 hardening pass surfaced the cost of that posture. Each fallback was individually defensible, but together they meant the system consistently preferred degrading silently over failing loudly, and a quality regression had no alarm attached anywhere. The fixes were unglamorous and specific: admin endpoints moved behind token auth with constant-time comparison, the most expensive endpoint enrolled in the existing rate limiter, subprocess inputs validated with schemas, and every silent fallback given a warning and a flag. The remaining work is making degradation visible in outputs, not just in logs.
