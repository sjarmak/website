---
title: Fable is 8% of Anthropic spend and the free lunch is over
cadence: daily
track: general
origin: auto
date: 2026-08-24
summary: "Ramp billing data puts Fable 5 at 8.0% of Anthropic model spend in
  July against Opus 4.8 at 28.0%, while Anthropic's annualized revenue hit
  $65bn. Drew Breunig and Latent.Space both argue the same consequence: with
  model prices no longer falling under you, harness and routing engineering
  finally pays, and Harness-Bench shows a 23.8-point spread on identical
  weights. Two new benchmarks put numbers on the gaps, with SUSVIBES scoring
  agent code 57% functionally correct and 11.8% secure."
topics:
  - model-pricing
  - agent-harness
  - benchmarks
  - agent-security
  - ai-infrastructure
  - agent-memory
audioUrl: /media/digests/daily-general-2026-08-24.mp3
durationSec: 708
items:
  - title: Anthropic's best AI model struggles to attract users as cheaper tools
      thrive
    url: https://simonwillison.net/2026/Aug/23/anthropics-best-ai-model-struggles-to-attract-users-as-cheaper-t/
    source: Simon Willison's Weblog
    category: tech_articles
  - title: "Quoting Drew Breunig: Fable & The End of the Free Lunch"
    url: https://simonwillison.net/2026/Aug/23/drew-breunig/
    source: Simon Willison's Weblog
    category: tech_articles
  - title: The Evolution of the Agent Harness
    url: https://www.latent.space/p/attention-interface
    source: Latent.Space
    category: newsletters
  - title: Is Vibe Coding Safe? Benchmarking Vulnerability of Agent-Generated Code
      in Real-World Tasks
    url: https://arxiv.org/abs/2512.03262
    source: cs.SE updates on arXiv.org
    category: research
  - title: "DreamBench-SWE: A Multi-Session Memory-Hygiene Benchmark for Software
      Agents"
    url: https://arxiv.org/abs/2608.20664
    source: cs.AI updates on arXiv.org
    category: research
  - title: OVHcloud Raises Prices as AI Memory Demand Reprices Non-AI Infrastructure
    url: https://www.infoq.com/news/2026/08/ovhcloud-memory-price-rise/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global
    source: InfoQ
    category: tech_articles
  - title: "AgentX - InferenceXv3: Does CUDA Moat Hold up in Agentic Inferencing?"
    url: https://newsletter.semianalysis.com/p/agentx-inferencexv3-does-cuda-moat
    source: SemiAnalysis
    category: newsletters
  - title: "Cloudflare OS: Cloudflare's Open-Source Corporate AI Platform Built on a
      Capability-Based Model"
    url: https://www.infoq.com/news/2026/08/cloudflare-os-ai-platform-secure/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global
    source: InfoQ
    category: tech_articles
  - title: I directed an AI agent to build a full mobile game + platform in 6.5
      weeks. 1,347 commits, 35 spec sessions, whole backend in one day.
    url: https://www.reddit.com/r/vibecoding/comments/1vwipui/i_directed_an_ai_agent_to_build_a_full_mobile/
    source: r/vibecoding
    category: community
highlights:
  - "Ramp's July billing index: Opus 4.8 at 28.0% of Anthropic model spend,
    Fable 5 at 8.0%, Opus 5 at 3.5%; Anthropic annualized revenue $65bn, up from
    $47bn in May."
  - "Harness-Bench: one model, 106 identical tasks, scores from 52.4 to 76.2
    across different harnesses; OpenAI tripled GPT-5.6 Sol on ARC-AGI-3 from
    13.3% to 38.3% with retained reasoning and compaction alone."
  - "SUSVIBES: across 186 real feature-request tasks, SWE-Agent with Claude 4
    Sonnet was 57% functionally correct and 11.8% secure, and vulnerability
    hints did not help."
  - "DreamBench-SWE: no external memory passed 21/180, verbatim event memory
    82/180, one pinned hosted Mem0 config 97/180; memory beats no-memory, memory
    products do not separate."
  - OVHcloud raises September prices 40-87% after RAM cost 6x year-over-year, as
    suppliers shift capacity to high-bandwidth memory for AI.
---

Ramp's billing index, drawn from 70,000 companies' credit-card spend, puts Fable 5 at 8.0% of Anthropic model usage in July. Opus 4.8 takes 28.0%. Sonnet 4.6 takes 8.3%. Opus 5, which shipped July 24th, sits at 3.5%. Those numbers arrived inside an FT story on Anthropic's finances, and Simon Willison [pulled out the parts that matter](https://simonwillison.net/2026/Aug/23/anthropics-best-ai-model-struggles-to-attract-users-as-cheaper-t/): annualized revenue of $65bn for July against $47bn in May, 6,000 customers spending $100,000 a year or more, and a Q3 the company expects to book as profitable on the same accounting it used for Q2. OpenAI's annualized revenue is over $40bn and up 35% quarter-to-date on the back of GPT-5.6. The business is compounding. The frontier model is not the one most teams actually run.

Drew Breunig wrote the practitioner's version of that fact the same day, and Willison [quoted the passage worth keeping](https://simonwillison.net/2026/Aug/23/drew-breunig/): before Fable, tuning your harness or your context strategy felt like wasted effort, because a cheaper model would land in three months and paper over the problem anyway. Fable broke that assumption by being genuinely better and genuinely expensive at once, while Opus, GPT-5.6, K3, and GLM stayed good enough for most of the code. So teams started routing work by tier instead of buying the top of the menu. The free lunch was model prices falling faster than your requirements grew, and it ended.

Which makes the timing of Dan McAteer's [essay on harness evolution](https://www.latent.space/p/attention-interface) in Latent.Space useful rather than academic. His central number: Harness-Bench ran one model over 106 identical tasks in different harnesses and scored between 52.4 and 76.2, a 23.8-point spread with the weights untouched. OpenAI got a comparable result on ARC-AGI-3, tripling GPT-5.6 Sol from 13.3% to 38.3% by adding retained reasoning and compaction and nothing else. McAteer's argument is that models keep absorbing harness capabilities into their weights, so the engineering job is deletion; he cites Anthropic's Thariq Shihipar saying the team recently cut 80% of Claude Code's system prompt. What survives absorption is the human-facing part: permissions, identity, legibility, and a policy surface governing when an agent is allowed to interrupt you. He predicts every agent company ships one within a year, the way they all shipped AGENTS.md.

The security picture underneath all this routing got a harder number. SUSVIBES, [a benchmark of 186 feature-request tasks](https://arxiv.org/abs/2512.03262) taken from real open-source projects where human programmers originally committed vulnerable implementations, evaluated 12 agentic coding configurations on frontier models. SWE-Agent with Claude 4 Sonnet produced functionally correct solutions 57% of the time and secure ones 11.8% of the time. The authors then tried the obvious mitigation, appending vulnerability hints to the feature request, and it did not close the gap. Functional correctness and security are being measured as one thing by most teams and they are not one thing; the leaderboard is public and worth checking against whatever configuration you run in CI.

A second benchmark went after memory rather than security. [DreamBench-SWE](https://arxiv.org/abs/2608.20664) scores software agents on multi-session hygiene, where later tasks depend on evidence that cannot be inferred from the current session and outcomes are graded by executable hidden oracles. In the preregistered successor run, agents with no external memory passed 21 of 180 tasks, deterministic verbatim event memory passed 82, and one pinned hosted Mem0 configuration passed 97. Every memory-bearing condition beat no-memory after Holm correction, and none of them beat each other in a way the authors will defend. Read it as a floor result: memory of some kind is worth roughly four times nothing, and the differences among memory products are still inside the noise.

The cost story is not confined to tokens. OVHcloud is raising prices in September, with 2026-edition gaming servers up 87% and other recent hardware up 40 to 59%, because founder Octave Klaba says memory cost six times more in June than a year earlier as suppliers moved capacity to high-bandwidth memory for AI accelerators ([InfoQ has the details](https://www.infoq.com/news/2026/08/ovhcloud-memory-price-rise/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global), and AWS has already repriced one reserved GPU product). AI demand is now setting the price of infrastructure that has nothing to do with AI, which is a cost line that shows up in your bill whether or not you ship an agent. SemiAnalysis pushed on the supply side of the same question in [InferenceXv3](https://newsletter.semianalysis.com/p/agentx-inferencexv3-does-cuda-moat), asking whether the CUDA moat holds under agentic inference workloads, where the traffic shape is long-horizon, tool-interleaved, and cache-heavy rather than a stream of short chat completions.

Cloudflare open-sourced Cloudflare OS, its internal corporate AI platform, built on a capability-based permission model with sandboxed execution and provisioned connectors ([InfoQ's writeup](https://www.infoq.com/news/2026/08/cloudflare-os-ai-platform-secure/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global)). The design point worth noting is that it routes to a model only where a model is needed, holding token cost down by treating inference as an expensive call rather than the default execution substrate. That is the same tiering instinct Breunig described, implemented as platform policy instead of developer discipline.

For a data point from the other end of the discipline spectrum, a developer on r/vibecoding [posted the full accounting](https://www.reddit.com/r/vibecoding/comments/1vwipui/i_directed_an_ai_agent_to_build_a_full_mobile/) of directing an agent to build a mobile game and its backend platform in 6.5 weeks: 1,347 commits, 35 spec sessions, the entire backend in a single day. The workflow is specific enough to argue with, which is more than most of these posts offer. Set it next to the SUSVIBES 11.8% and you have the shape of the current moment, where throughput is real and verified safety is not.

What to watch: whether anyone publishes a routing policy with actual per-tier cost and pass-rate numbers instead of a vibe, and whether the first attention-policy surface McAteer predicts shows up as a config file or as yet another dashboard.
