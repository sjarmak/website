---
title: "GEO: Generative Engine Optimization"
status: active
domain: research
summary: Measuring how LLM-powered tools discover, recommend, and describe products. GEO is the AI equivalent of SEO.
role: Creator
repo: https://github.com/sjarmak/geo
architecture: https://sjarmak.github.io/geo-architecture/
tech: [Evaluation, Retrieval, LLM]
order: 14
topics: [evaluation, retrieval]
tags: [evals, geo]
---

GEO asks what SEO asks, aimed at language models: when a developer asks an LLM what tool to use, does your product come up, how prominently, and is what the model says about it true. The corpus is 322 base prompts across five categories tracing the developer purchase journey (category search, comparison, alternative search, use case, problem framing), expanding to 577 with persona, phrasing, and agent-prompt variants, each mapped to one of 23 expected-outcome scenarios and checked against six known misrepresentations of the product.

Scoring is layered cheap-to-expensive. Presence and structural prominence (first-mention offset, list rank, share of voice against a locked competitor set) are deterministic string-and-offset work, reproducible and far cheaper than judges, which makes them the iteration layer. The semantic layer, an LLM judge scoring sentiment, accuracy, completeness, and competitive framing, is opt-in and paid, run only once the deterministic pass has narrowed where a closer read is worth paying for.

The baseline run asked Claude about Sourcegraph and its competitors and put numbers on the question: across 526 responses, Sourcegraph surfaced at a 61.5% mention rate with a 26.9% share of voice against a locked competitor set where rivals like ripgrep and ack drew their own mentions. The same run counted how often the model's description tripped one of the six known misrepresentations, so the record is not just whether the tool comes up but whether what the model says about it holds.

The next layer is statistical rather than lexical: treating model updates as deployments, so a snapshot that erodes your share of voice against pre-registered thresholds surfaces as a failing check instead of a feeling. That regression harness, with two-proportion z-tests and the power analysis that would size its repetition counts, is the part still to build; the deterministic scoring and the baseline are in place today.
