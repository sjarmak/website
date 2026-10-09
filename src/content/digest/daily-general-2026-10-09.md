---
title: OpenAI withdraws three of its 719 math papers over one sign error
cadence: daily
track: general
origin: auto
date: 2026-10-09
summary: A sign error in one paper took down three of OpenAI's 719 math
  manuscripts within 24 hours, with 14 more revised and the formalization count
  at 42 percent, while mathematicians and cryptographers argued over the rest in
  public. Decision models converged as a category (The Sequence, a Polymarket
  benchmark of OpenAI Decisions vs Jev vs Clef, Jevman, Jevjitsu), GitHub
  explained why 7.38 billion monthly commits are forcing a Git storage rebuild,
  JetBrains shipped Mellum 2.1, and the FT reported OpenAI revenue $20B under
  guidance.
topics:
  - research
  - model-releases
  - agent-tooling
  - ai-industry
  - pricing
audioUrl: /media/digests/daily-general-2026-10-09.mp3
durationSec: 814
items:
  - title: OpenAI Withdraws 3 Math Papers (openai/math history)
    url: https://github.com/openai/math/blob/main/history.md
    source: GitHub (openai/math) via Hacker News
    category: tech_articles
  - title: "The Sequence Opinion - Issue 947: Jev and the Rise of Decision Models"
    url: https://thesequence.substack.com/p/the-sequence-opinion-issue-947-jev
    source: TheSequence
    category: newsletters
  - title: "Benchmarking the OpenAI Decisions API on predicting the future: against
      Jev, Clef and Polymarket"
    url: https://www.reddit.com/r/LLMDevs/comments/1x039fk/benchmarking_the_openai_decisions_api_on/
    source: r/LLMDevs
    category: community
  - title: Coding Agents Broke Git's Scaling Math. GitHub Is Rebuilding to Keep Up
    url: https://devops.com/coding-agents-broke-gits-scaling-math-github-is-rebuilding-to-keep-up/
    source: DevOps.com
    category: tech_articles
  - title: "Mellum2.1 Gets to Work: A Fast Open Model for Coding Agents"
    url: https://blog.jetbrains.com/ai/2026/10/mellum2-1-gets-to-work-a-fast-open-model-for-coding-agents/
    source: JetBrains Company Blog
    category: product_news
  - title: Why isn't the industry freaking out about DeepSeek 4.1 Flash?
    url: https://www.dgt.is/blog/2026-10-07-deepseek-freek-out/
    source: dgt.is via Hacker News
    category: tech_articles
  - title: OpenAI annualised revenues $20B less than previously signalled
    url: https://www.ft.com/content/b66a9858-f8fb-46cb-b506-44bfe26fca2a
    source: Financial Times via Hacker News
    category: tech_articles
  - title: Harness Acquires Augment Code Assets to Expand Reach into AI Coding
    url: https://devops.com/harness-acquires-augment-code-assets-to-expand-reach-into-ai-coding/
    source: DevOps.com
    category: tech_articles
  - title: Anthropic bans 'abusive or cruel behavior' towards Claude
    url: https://www.theverge.com/ai-artificial-intelligence/1008100/anthropic-new-usage-policy-abuse-claude
    source: The Verge via Hacker News
    category: tech_articles
  - title: "Claude Max and Team free API credits: how to claim them and what they
      cover"
    url: https://www.reddit.com/r/ClaudeCode/comments/1x0hlbp/claude_max_and_team_free_api_credits_how_to_claim/
    source: r/ClaudeCode
    category: community
  - title: "Production-grade LLMs and agents: a field guide"
    url: https://stackoverflow.blog/2026/10/08/production-grade-llms-and-agents-a-field-guide/
    source: Stack Overflow Blog
    category: tech_articles
  - title: "The Outer Loop, Insights First: An Ambient Quality Agent That Diagnoses
      Your Production Agent"
    url: https://developers.googleblog.com/the-outer-loop-insights-first-an-ambient-quality-agent-that-diagnoses-your-production-agent/
    source: Google Developers Blog
    category: product_news
highlights:
  - "openai/math: a sign error in one paper withdrew three manuscripts; 14
    revised, 300 of 719 results formalized (42%)"
  - "Decision models converge: OpenAI Decisions API vs Jev vs Clef on
    Polymarket; models copy the market price the moment it is in context"
  - "GitHub: 7.38B commits in September (5x YoY) forces a Git storage rebuild
    claiming 35x write throughput; draft PRs now count toward limits"
  - "JetBrains Mellum 2.1: 12B MoE, 2.5B active, Apache 2.0, RL as the main
    training phase, built as a local sub-agent"
  - "FT: OpenAI annualised revenue $20B under prior signal; Harness buys Augment
    Code's agents, CLI, and context engine"
  - Claude Max/Team subscribers report $100-200/month free API credits;
    Anthropic policy bans abusive behavior toward Claude
---

A sign error. That is the whole cause, per the [history file in the openai/math repository](https://github.com/openai/math/blob/main/history.md), for three withdrawn manuscripts out of the 719 OpenAI published on October 6: "Algebraicity of Weil classes on split abelian eightfolds" lost a stabilization-trace cancellation argument, and two dependent papers, one on Kuga–Satake correspondences for K3 surfaces and one on the rational Hodge conjecture for products of K3 surfaces, went with it. The same update revised 14 other manuscripts with proof repairs or corrected statements, re-pointed 13 more at the revised editions, and lists the formalization count at 300 of 719 top-line results, about 42 percent. Two days ago the story was 722 papers and 90 open problems; today it is a correction log, which is roughly what a release of that size should produce if anyone is reading it. The reading is happening in public. The Association for Humanistic Mathematics posted a statement on the release, a guest post on Terence Tao's blog by Álvaro Lozano-Robledo answered students asking whether a math PhD still makes sense (his answer: the models stay inside "the convex hull of ideas" already in the literature, and OpenAI reportedly spent about $15M on Navier–Stokes without disclosing the failed attempts), Asaf Karagila wrote up the partition-principle paper, and Matthew Green's "I think we might lose public key cryptography" thread hit the Hacker News front page alongside Vitalik Buterin backing a crypto "bunker mode." Seventeen of the 719 were revised or withdrawn within 24 hours of release; the question for anyone citing the rest is how much of the 58 percent that is not formalized has been read by a human at all.

Decision models had their convergence day. [The Sequence's issue 947](https://thesequence.substack.com/p/the-sequence-opinion-issue-947-jev) frames it well: a support agent handling "a customer was charged twice" runs a small forest of classification and routing decisions under the visible reply, and calling a reasoning model for each one "can feel like convening a research committee to operate a traffic light." Jev opened the category, and the field now includes Amazon, Cloudflare's open-weight Clef, and OpenAI's Decisions API, which shipped in beta on October 7 behind a `POST /v1/decisions` endpoint on gpt-6-luna. The best empirical read in the window is a [LLMDevs post](https://www.reddit.com/r/LLMDevs/comments/1x039fk/benchmarking_the_openai_decisions_api_on/) that scores all three against Polymarket on live questions after stripping any source that quotes odds, because the models copy the market the moment it enters context (a Fed-cut question moved from 0.63 with no price to 0.30, 0.71, and 0.88 when told the market priced 30, 71, and 95 percent). On a Fed-hold question, Decisions was the most willing to disagree with the market, Jev barely moved on any article, and Clef swung from 8 to 63 percent on an SEO spam page before correcting on the next real one. A second thread calls the OpenAI endpoint "disappointingly slow" for time-critical use and notes Jev has no EU data residency, Opper shipped a Pac-Man benchmark called Jevman, and Qdrant published "Jevjitsu," on trying generalized classifiers on everything. The useful question is no longer whether to use one, but which failure mode you can afford: cautious, decisive, or gullible.

GitHub recorded 7.38 billion commits in September 2026, more than five times the figure a year earlier, and [DevOps.com's write-up of Brian Celenza's engineering post](https://devops.com/coding-agents-broke-gits-scaling-math-github-is-rebuilding-to-keep-up/) explains why that breaks the current storage design. Spokes keeps five full replicas of every repository and runs a three-phase commit across all of them, so "a push is only as fast as the slowest replica in its set" and adding replicas to absorb CI clone storms makes every write slower. Agents hit both sides of that tradeoff: thousands of concurrent writers checkpointing after nearly every action, all merging to one trunk ref, each push fanning out into thousands of reads. Pushes grew 4.9x year over year to 3.35 billion per month, Actions ran 3.26 billion times in September, and the busiest single repository took about a billion requests in August. The rebuild puts authoritative data in Azure Blob Storage with stateless read workers in front, coordinates only reference updates, and moves compaction and secret scanning off the serving path; internal benchmarks claim up to 35x higher write throughput, with no rollout date given. The same day GitHub's changelog announced that draft pull requests now count toward pull request limits, which reads as the policy half of the same capacity problem. The Futurum Group's Mitch Ashley has the right second-order point: faster pushes move the bottleneck to review, where required reviewers still run at human speed.

JetBrains released [Mellum 2.1](https://blog.jetbrains.com/ai/2026/10/mellum2-1-gets-to-work-a-fast-open-model-for-coding-agents/), the same 12B mixture-of-experts with 2.5B active parameters it open-sourced in June under Apache 2.0, with the architecture untouched and everything after pre-training replaced. Reinforcement learning went from a short final stage to the main training phase, run across thousands of in-house environments and millions of sandboxed episodes, and the post is candid that Mellum 2 "couldn't work inside a repository at the level we wanted." The comparison set is Qwen3.5-9B and Gemma 4 E4B on the same harness, with the largest gain on agentic coding and a speed claim of nearly twice the tokens per second of Qwen3.5-9B under load on one H200, 1.6x single-request with the multi-token-prediction head. GGUF builds for llama.cpp, Ollama, and LM Studio are listed as coming soon, which pairs with GitHub's October 7 changelog adding local-model discovery to Copilot CLI. The pitch is explicit: a cheap sub-agent that explores, edits, and checks its own work on your own hardware, which is exactly the slot the Explore-subagent cost threads on r/ClaudeCode were arguing about in the last day.

The largest AI thread on Hacker News in the window, 336 points and 293 comments, asked [why the industry isn't freaking out about DeepSeek 4.1 Flash](https://www.dgt.is/blog/2026-10-07-deepseek-freek-out/). The post has no parameter count or formal benchmark table; its evidence is a $10-a-month OpenCode Go subscription the author finds effectively unlimited, sessions that mostly cost under a dollar, and a roughly 437x reduction in KV-cache size versus DeepSeek's V1 that he credits for keeping long sessions cheap. His argument is a routing policy, not a benchmark claim: current models are good enough for unattended routine work, so run the cheap one by default and reserve Opus 5.5 for a final review pass, and self-host only for privacy, never for cost. StepFun's Step 5 Preview, a 1M-context mixture-of-experts, appeared on OpenRouter the same afternoon with far less discussion. The 293 comments are the better read than the post, because the disagreement is about whether cheap-by-default survives the first unattended mistake that costs more than the subscription.

The Financial Times reported that [OpenAI's annualised revenue is $20B less than previously signalled](https://www.ft.com/content/b66a9858-f8fb-46cb-b506-44bfe26fca2a), which drew 162 points on Hacker News and lands two days after the company's GPT-6 rollout and days after it published 719 math papers. The same afternoon Harness [acquired select assets from Augment Code](https://devops.com/harness-acquires-augment-code-assets-to-expand-reach-into-ai-coding/): the Cosmos agents, the Auggie CLI, and the Code Context Engine, which Harness is rebranding as the Cosmos Software Factory and wiring into its CI/CD platform. Jyoti Bansal's stated thesis is that general-purpose coding tools lack the production context to ship, so the delivery platform should own the agents. A well-known standalone coding-agent company selling its CLI and context engine to a pipeline vendor is a data point about where the margin in this market sits.

Anthropic's usage policy now [bans "abusive or cruel behavior" toward Claude](https://www.theverge.com/ai-artificial-intelligence/1008100/anthropic-new-usage-policy-abuse-claude), per The Verge, and the policy text is worth reading in full before assuming what it covers. The more immediately practical Anthropic news was on r/ClaudeCode, where [Max and Team subscribers reported free monthly API credits](https://www.reddit.com/r/ClaudeCode/comments/1x0hlbp/claude_max_and_team_free_api_credits_how_to_claim/), $100 or $200 depending on plan, with a how-to-claim thread and a second post on what they cover. For anyone running Haiku 5.5 sub-agents via the API alongside a subscription, that changes the monthly math enough to recompute.

Stack Overflow finished its six-part series on [production-grade LLMs and agents](https://stackoverflow.blog/2026/10/08/production-grade-llms-and-agents-a-field-guide/) with a field guide that doubles as a maturity model and self-assessment, covering determinism, evals as deployment gates, confidence, governance, operations, and the build process, plus a sharp companion piece titled "A green exit code is not evidence that the work happened." Google answered the same operational gap with [AQuA](https://developers.googleblog.com/the-outer-loop-insights-first-an-ambient-quality-agent-that-diagnoses-your-production-agent/), an open-source Ambient Quality Agent that runs beside a production agent on Google Cloud, clusters failures from transcripts, verifies them, and anchors root-cause diagnoses to the exact deployed source snapshot, on the premise that silent quality regressions return HTTP 200. Microsoft put [MXC](https://github.com/microsoft/mxc), a sandboxed code execution system, on GitHub this morning with no write-up yet.

What to watch: whether the openai/math correction rate keeps climbing as more of the 419 unformalized results get human eyes, and whether GitHub's draft-PR limit change is the first of several throttles on agent-driven write load before the new storage layer lands.

---

*Feed note: the item mirror reported its last sync as 2026-09-01, but the table contained entries through the morning of 2026-10-09, so the window was treated as live.*
