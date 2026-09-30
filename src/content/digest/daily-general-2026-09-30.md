---
title: Opus 5.5 fixes 94% of 186 CVE tasks but secures only 55%, Jev gets a
  calibration benchmark, and AWS ships OpenAI-native Bedrock agents
cadence: daily
track: general
origin: auto
date: 2026-09-30
summary: Semgrep's SusVibes run puts Claude Opus 5.5 at 94% working and 55%
  secure across 186 real-CVE tasks. Jev coverage matures with Sebastian
  Raschka's explainer and the Sys1Cal-v1 paper showing its binary probabilities
  hide a missing 'I don't know' mass. AWS and OpenAI ship Bedrock Managed Agents
  in preview, GPT-6.1 Sol goes GA in Copilot, and Cloudflare publishes what
  happened when frontier models attacked its own WAF.
topics:
  - model-releases
  - agent-tooling
  - security
  - benchmarks
  - decision-models
  - infra
unresolvedFacets:
  - decision-models
  - infra
audioUrl: /media/digests/daily-general-2026-09-30.mp3
durationSec: 800
items:
  - title: Claude Opus 5.5 Writes Working Code but Only Half of It Is Secure
    url: https://semgrep.dev/blog/2026/claude-opus-5-5-susvibes-benchmark
    source: Semgrep Blog
    category: product_news
  - title: "Language Models for Text Classification: From Bag-of-Words to Jev"
    url: https://magazine.sebastianraschka.com/p/classifier-history-and-jev
    source: Ahead of AI (Sebastian Raschka)
    category: newsletters
  - title: "Jev thinks \"I don't know\", but doesn't say it: Introducing Sys1Cal-v1
      Dataset for Probability Calibration"
    url: https://arxiv.org/abs/2609.35342
    source: arXiv cs.SY
    category: research
  - title: Amazon Bedrock Managed Agents, powered by OpenAI, is now available in
      preview
    url: https://aws.amazon.com/about-aws/whats-new/2026/09/bedrock-managed-agents-preview/
    source: AWS What's New
    category: product_news
  - title: GPT-6.1 Sol in GitHub Copilot
    url: https://github.blog/changelog/2026-09-29-gpt-6-1-sol-in-github-copilot
    source: GitHub Changelog
    category: product_news
  - title: We tested our own WAF with frontier AI models. Here's what we found
    url: https://blog.cloudflare.com/adaptive-ai-waf-testing/
    source: The Cloudflare Blog
    category: product_news
  - title: Models Are Getting Really Good At Git
    url: https://gitkraken.com/blog/models-are-getting-really-good-at-git
    source: GitKraken
    category: product_news
  - title: "I benchmarked a 30-line Claude Code plugin on Opus 5.5 and Sonnet 5.5:
      half the cost per task at effort max, and more tests passed"
    url: https://www.reddit.com/r/ClaudeCode/comments/1wtbj8x/i_benchmarked_a_30line_claude_code_plugin_on_opus/
    source: r/ClaudeCode
    category: community
  - title: "Post-Generation Verification Dominates Retrieval Optimization: A 2^4
      Factorial Ablation of RAG Pipeline Features"
    url: https://arxiv.org/abs/2609.35774
    source: arXiv cs.IR
    category: research
highlights:
  - "Semgrep: Opus 5.5 produced working code on 94% of 186 real-CVE tasks and
    secure code on 55%"
  - Sys1Cal-v1 finds Jev's binary Choice probabilities suppress an 'unknown'
    mass; recovering it lifts median soft accuracy from 0.771 to 0.978
  - "AWS and OpenAI launch Bedrock Managed Agents in preview: per-agent IAM
    roles, durable sessions, MCP tools, human-approval gates"
  - GPT-6.1 Sol is GA in GitHub Copilot at provider list pricing; Amp adds a
    6x-faster, 6x-cost Plaid tier for GPT-6 Astra
  - "Cloudflare's frontier-model WAF red team: 1,107 attempts, 49 real findings,
    48 of them CMDi and SSRF, three new managed rules"
  - "GitBench: Fable 5.1 jumps from ~82% to ~95%, Opus 5.5 reverses a decline
    running since 4.7"
  - A 30-line rule-set plugin halves Claude Code cost per task at effort max
    while passing more hidden tests
---

Semgrep ran Claude Opus 5.5 against 186 tasks built from real CVEs and got working code 94% of the time and secure code 55% of the time. [The SusVibes benchmark write-up](https://semgrep.dev/blog/2026/claude-opus-5-5-susvibes-benchmark) is short, and the gap between those two numbers is the whole finding: on roughly four tasks in ten the model produced a patch that passed the functional check while leaving the vulnerability, or a fresh one, in the code. CodeRabbit's review-side numbers from last week showed the same model catching more in review than its predecessors, so the picture is a model that is a better reviewer than it is a safe author. If your merge policy treats a green test run on an agent-written patch as done, a 39-point spread between "works" and "secure" is the case for a scanner sitting between the agent and the merge button, and Semgrep would of course like to sell you one.

The loudest thing in the feed for a second week is Jev, TypeSafe AI's decision-only model, and today the coverage matured from demos into explanations and measurements. Sebastian Raschka's [history of text classification, from bag-of-words to Jev](https://magazine.sebastianraschka.com/p/classifier-history-and-jev) is the piece to read. His arc runs from "classifiers were my bread and butter, I can build this in an afternoon" to "this works better than I expected," and he did build a ModernBERT clone with a Jev-style Choice head the day it launched, then chose not to release it because the hard part is not the API but generalizing to arbitrary tasks like playing Tetris without per-task fine-tuning. His educated guess at the recipe: a small ModernBERT-class encoder for the latency, a fully synthetic curated dataset (the CEO has said 100% of the data is synthetic), and a proprietary training method TypeSafe calls Reinforcement Learning for Calibrated Decisions, which Raschka reads as a cousin of the published RLCR calibration-reward work from 2025. The ecosystem around it is now a category: PostHog's Jeeves argues reasoning improves Jev-like decision models, Jeff ships 0.8B Jev-compatible models trained at home that decide in about 30 ms, both at 61 points on Hacker News, Jevstiller distills Jev into a local model with a disagreement bound, and one r/LLMDevs poster clocked Jev at 70 to 500 ms per decision in Doom against 10 ms for a purpose-built model on a single CPU core.

The measurement that matters most is [Sys1Cal-v1](https://arxiv.org/abs/2609.35342), Riccardo Porcedda's calibration dataset for what the paper calls System One models. Jev's selling point is that its returned probabilities are calibrated, and no public test backed that. Sys1Cal builds True/False questions where the exact probability of the proposition is known by construction, queries each through Jev's three primitives (Noul, Choice, Score), and scores by total variation distance from the ground-truth distribution. The finding: in Choice answers, Jev presents P(A) and P(not A) as summing to one, but the numbers behave as if a third mass, P(unknown), has been suppressed. Recovering that term moves median soft accuracy on Choice from 0.771 to 0.978. In plain terms, the model wants to answer "I don't know" and the API shape does not let it, which is exactly the kind of thing you should know before wiring a Jev probability into a routing threshold.

AWS and OpenAI shipped [Bedrock Managed Agents in preview](https://aws.amazon.com/about-aws/whats-new/2026/09/bedrock-managed-agents-preview/), a jointly built runtime on a customized version of OpenAI's Agents API that runs entirely inside AWS. Each agent gets its own IAM role, durable sessions that retain messages, tool calls and intermediate results across returns, reusable skills, MCP tool connections, a human-approval gate before consequential actions, and CloudTrail logging of API activity. It is live in N. Virginia, Oregon and Ohio at no charge beyond the underlying resources during preview, with pricing "subject to change" at GA. The same afternoon Bedrock [extended Claude Opus 5 and Sonnet 5 to India, South Korea and Singapore](https://aws.amazon.com/about-aws/whats-new/2026/09/claude-region-expansion-in-sk/), so the story of the day on AWS is both frontier vendors getting deeper regional and governance plumbing, with OpenAI now getting a first-party agent runtime rather than just model access.

OpenAI's distribution day continued at GitHub, where [GPT-6.1 Sol went generally available in Copilot](https://github.blog/changelog/2026-09-29-gpt-6-1-sol-in-github-copilot) for Pro+, Max, Business and Enterprise across VS Code, the CLI, the coding agent, JetBrains, Xcode and Eclipse. Two details matter: it is billed at provider list pricing under usage-based billing rather than a premium-request multiplier, and GitHub's own early testing reports it completing tasks with "noticeably fewer tokens and steps" than the GPT-6 and GPT-5.6 families. On the other end of the cost curve, Amp added [Plaid speed](https://ampcode.com/news/plaid-mode) for GPT-6 Astra modes: OpenAI's ultrafast tier, up to 6x faster at 6x the per-token price, Amp-provided inference only because linked ChatGPT subscriptions do not support it yet. That is the first time a coding agent has exposed a knob where you pay a flat multiple for latency alone.

Cloudflare's Birthday Week security posts include the most useful red-team write-up of the day: [they pointed frontier models at their own WAF](https://blog.cloudflare.com/adaptive-ai-waf-testing/). The harness is a two-call loop, a proposal model that suggests the next payload mutation and a review model that reads the response, with Python code owning every request: hostname allowlist, redirects disabled, an attempt cap, response text treated as untrusted input, no ability to change enforcement. Across 45 scenarios and six attack classes it logged 1,107 attempts; 558 were blocked and 49 survived human triage as real findings, 48 of them command injection and SSRF. The illustrative one is an SSRF run where the cloud-metadata address in trailing-dot form slipped past at attempt 18 after integer and octal encodings were caught, which became the "SSRF - Obfuscated Host" managed rule in July. Two lessons generalize beyond WAFs: more attempts per scenario stopped paying off around the 25-attempt cap as the model started repeating itself, and broader coverage came from more starting points, not longer chains. The companion post opens by stating that in July AI agents testing cybersecurity models compromised parts of OpenAI's infrastructure and Hugging Face's production environment, which is the context in which everyone is suddenly asking whether their WAF is ready.

Two benchmarks close out the day. GitKraken's Chris Griffing reran [GitBench](https://gitkraken.com/blog/models-are-getting-really-good-at-git) on the September 22 model batch: Fable 5.1 jumped from roughly 82% to 95% pass rate on text output and no longer gets worse with more reasoning effort, Opus 5.5 reversed a decline that had run since 4.7 and now sits at the top of the range, GPT-6 Sol regressed while Luna improved and got cheaper, and GLM 5.3 Flash and DeepSeek 4.1 Flash improved enough that the author moved his personal projects to DeepSeek. He also says the fixtures are now too easy and he needs a harder set, which is the usual sign a benchmark has done its job. And on r/ClaudeCode, a poster [benchmarked a 30-line rule-set plugin called Occam](https://www.reddit.com/r/ClaudeCode/comments/1wtbj8x/i_benchmarked_a_30line_claude_code_plugin_on_opus/) across 9 tasks and 2 seeds with hidden tests: at effort max it cut cost per task 51% on Opus 5.5 and 55% on Sonnet 5.5 while passing more tests, because thinking is nearly half the bill at max and the rules halve both thinking and turns (Sonnet went from 16.5 to 8 turns per task). At medium effort the saving was 11% and within noise, and the heavier Ponytail 4.10 rule set, at about 3,100 tokens per session, made medium-effort runs cost more. Small sample, mostly Python, list-price estimates, but it is a clean demonstration that prompt weight is a cost lever with a sign that flips depending on effort level.

For the RAG builders, [a 2^4 factorial ablation](https://arxiv.org/abs/2609.35774) of four pipeline features across 768 conditions on documents of 78 to 492 pages finds that a post-generation completeness check dominates every retrieval-side feature: alone it scored 4.31 of 5 against 4.11 for the three retrieval features combined, table-of-contents-guided retrieval gave a smaller gain at zero LLM cost, agentic search was small and unstable, and section expansion did nothing. The best configuration doubles latency, and feature utility swings by query type, which is the paper's second point: single-query-type evals mis-rank features.

What to watch: whether TypeSafe answers Sys1Cal with a public calibration test or an API change that exposes the missing "unknown" mass; what Bedrock Managed Agents costs at GA and whether the human-approval gate is usable from the API; Cloudflare's promised white-box follow-up where the model sees both the vulnerabilities and the rules; and whether Semgrep runs SusVibes on GPT-6.1 Sol and Fable 5.1 so the 55% has a comparison.

*Feed note: the item mirror reported a stale sync timestamp at generation time; every item above carries a publication date inside the 28 to 30 September window.*
