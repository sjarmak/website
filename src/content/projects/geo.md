---
title: "GEO: Generative Engine Optimization"
status: active
domain: research
summary: Measuring how LLM-powered tools discover, recommend, and describe products. GEO is the AI equivalent of SEO.
role: Creator
repo: https://github.com/sjarmak/geo
tech: [Evaluation, Retrieval, LLM]
order: 14
topics: [evaluation, retrieval]
tags: [evals, geo]
---

GEO asks what SEO asks, aimed at language models: when a developer asks an LLM what tool to use, does your product come up, how prominently, and is what the model says about it true. The corpus is 322 base prompts across five categories tracing the developer purchase journey (category search, comparison, alternative search, use case, problem framing), expanding to 577 with persona and phrasing variants, each mapped to one of 23 expected-outcome scenarios and checked against six known misrepresentations of the product.

Scoring is layered cheap-to-expensive. Presence and structural prominence (first-mention offset, list rank, share of voice against a locked competitor set) are deterministic string-and-offset work, reproducible and far cheaper than judges, which makes them the iteration layer. A deterministic recommendation proxy then separates endorsements from incidental mentions: a response counts as a recommendation only when the brand lands in the top three of a list or co-occurs in a sentence with a cue word like "recommend" or "go-to." The semantic layer, an LLM judge scoring sentiment, accuracy, completeness, and competitive framing, is opt-in and paid, and gated on judge reliability (Krippendorff alpha of at least 0.67 against a frozen gold set) before its numbers count.

The baseline run, asking Claude about Sourcegraph and its competitors, put numbers under the anxiety: 1,610 responses (322 prompts, five repetitions each) produced a 38.8% recommendation rate against a 55.1% mention rate, and the gap concentrates brutally by category. Comparison prompts recommend at 65.3%; problem-framing prompts sit at 13.2% and use-case prompts at 8.1%. The content-gap analysis of those weak categories found that 89% of failing prompts got zero mentions across all five repetitions, with the model reaching for grep, ripgrep, or security scanners instead, and the dominant pattern is symptom-first phrasing that the model answers with process advice without ever surfacing the tool category.

The statistics get the same care as the prompts. A power-analysis pilot measured within-prompt variance and found a design effect near 2x naive estimates, which set the repetition counts, and a regression harness treats model updates as deployments: snapshots compare via two-proportion z-tests against pre-registered effect-size thresholds and classify drift as pass, warn, or fail, so a quiet model release that erodes your share of voice surfaces as a failing check instead of a feeling.
