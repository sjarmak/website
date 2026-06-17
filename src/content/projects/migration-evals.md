---
title: Migration Evals
status: active
domain: research
summary: A tiered-oracle funnel for evaluating automated code migrations end to end, Java 8 to 17, Python 2 to 3, with a pluggable ecosystem.
role: Creator
repo: https://github.com/sjarmak/migration-evals
architecture: https://sjarmak.github.io/migration-evals/
tech: [Python, Evaluation, Migration]
order: 12
topics: [evaluation, code-intelligence]
tags: [evals, migration]
---

A trial in migration-evals cascades through oracle tiers ordered cheapest-first: a $0.001 local check that the patch parses and applies, a $0.01 compile in a Docker sandbox, $0.03 for the test suite, and a $0.08 LLM judge at the end, short-circuiting on the first failure. Inference cost dominates infrastructure cost by 70–170x, so the funnel is the cost model: at expected failure rates only about 42% of trials ever reach the judge, putting a 1,000-repo, 3-model evaluation around $185. The scope is deliberately narrow: the framework grades batch-change diffs an agent already produced (Java 8→17, Go import rewrites, base-image bumps) against the contract of repo, base commit, and patch, and says nothing about whether the agent picked the right thing to change. That's SWE-bench's domain.

What separates it from a generic harness is the scientific-integrity layer. Every result carries SHA256 stamps of the oracle spec, recipe spec, and pre-registered hypotheses, and a publication gate refuses stale stamps, fabricated verdicts, and threshold violations; the gate is the only path to an externally quotable number. Funnel verdicts are correlated against a gold anchor mined from real OSS pull requests, using merge plus 30-day survival as the acceptance label, and the eval declares itself broken when that correlation drops below its floor. Reports bucket pass rates by repo-creation date versus model training cutoff, with a two-proportion z-test behind the contamination tripwire, and the judge tier can require agreement from both a Claude and a non-Claude judge, with Cohen's kappa against hand-labeled overlap catching unreliable pairs before that strictness corrupts headline numbers.

Everything replays offline. Each adapter (sandbox, judge, changeset provider) has a file-backed cassette stand-in, so the full 729-test suite and the smoke config run with no API keys, no Docker, and no network in about 20 seconds. The sharp edge that surfaced in review: cassette misses used to replay success defaults, so a typo'd fixture path produced an all-green run. Misses now stamp every fabricated envelope and the publication gate refuses any result carrying the stamp anywhere, so fixtures stay ergonomic but can never be published.

The tracker is deliberately idle: remaining work is parked behind external gates, like the 50 agent-authored PRs that have to merge and age 30 days before retroactive scoring of historical changesets earns its way in.
