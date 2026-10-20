---
title: MiniMax M3.1 Flash and Mercury 3 push the open-weight price floor down;
  Cloudflare cuts its reviewer bill 68%
cadence: daily
track: general
origin: auto
date: 2026-10-20
summary: MiniMax's M3.1 Flash ($0.15/M input, weights Oct 23) and Inception's
  diffusion-based Mercury 3 (1,000+ tok/s) landed the same day; Cloudflare
  explains how it took its AI code reviewer from $2.46 to $0.77 per review;
  Meta's 1,300-line Thin Orchestrator; Opus 5.5 finishes Baldur's Gate 3 for
  $712; DHS bars DeepSeek from federal civilian systems; JetBrains charts
  developer delegation doubling in a year.
topics:
  - open-weight models
  - diffusion LLMs
  - inference cost
  - agent harnesses
  - AI policy
  - developer sentiment
  - GitHub Copilot
unresolvedFacets:
  - diffusion LLMs
  - inference cost
  - agent harnesses
  - developer sentiment
  - GitHub Copilot
audioUrl: /media/digests/daily-general-2026-10-20.mp3
durationSec: 846
items:
  - title: "MiniMax M3.1 Flash: Space Bunny revealed, $0.15/M input, weights October
      23"
    url: https://www.minimax.io/blog/minimax-m31f
    source: MiniMax
    category: tech_articles
  - title: "Inception's Mercury 3: a diffusion LLM claiming 1,000+ tok/s and quality
      past GPT-6 Luna"
    url: https://www.inceptionlabs.ai/blog/introducing-mercury-3
    source: Inception Labs
    category: tech_articles
  - title: "AINews: not much happened today (DeepSeek, MiniMax, Mercury, Dean Ball
      on distillation)"
    url: https://www.latent.space/p/ainews-not-much-happened-today-f09
    source: Latent Space
    category: newsletters
  - title: "Cloudflare: cutting the AI code reviewer bill 68% with cache
      breakpoints, tool removal and Sonnet 5.5"
    url: https://blog.cloudflare.com/obsessive-inference-optimization/
    source: The Cloudflare Blog
    category: product_news
  - title: "Meta: The Thin Orchestrator, a 1,300-line router over 14 specialist
      subagents"
    url: https://engineering.fb.com/2026/10/19/ml-applications/thin-orchestrator-ai-agent-architecture/
    source: Facebook Engineering
    category: product_news
  - title: "Meta: Inside Prometheus, the gigawatt-scale cluster behind Muse Wonder"
    url: https://engineering.fb.com/2026/10/19/data-center-engineering/inside-prometheus-meta-gigawatt-scale-supercluster/
    source: Facebook Engineering
    category: product_news
  - title: "Opus 5.5 beat Baldur's Gate 3 unattended: $712, 39 hours, 99 sessions,
      zero compactions"
    url: https://www.reddit.com/r/ClaudeCode/comments/1x9ue4y/after_712_and_39_hours_opus_55_beat_baldurs_gate/
    source: r/ClaudeCode
    category: community
  - title: DHS bars DeepSeek from U.S. federal civilian agency IT systems
    url: https://www.reuters.com/technology/us-banning-chinese-ai-deepseek-government-agency-it-systems-2026-10-19/
    source: Reuters
    category: tech_articles
  - title: "JetBrains: developers ready to delegate app logic to AI went from 18% to
      50% in a year"
    url: https://blog.jetbrains.com/research/2026/10/dynamics-of-sentiment-and-attitudes-toward-ai-among-developers/
    source: JetBrains Company Blog
    category: product_news
  - title: Simon Willison on Jeremy Scheff's "My obituary for programming"
    url: https://simonwillison.net/2026/Oct/19/my-obituary-for-programming/
    source: Simon Willison's Weblog
    category: tech_articles
  - title: GitHub Copilot deprecates GPT-5.5, GPT-5.4, Gemini 3.7 Flash and Grok 4.5
      on October 19
    url: https://github.blog/changelog/2026-10-19-github-copilot-models-deprecated-on-october-19-2026
    source: Changelogs – The GitHub Blog
    category: product_news
highlights:
  - "MiniMax M3.1 Flash: $0.15/$0.60 per M tokens, AA Intelligence Index 42,
    hallucination rate 93% on AA-Omniscience, weights October 23"
  - Mercury 3 is a diffusion LLM 40x the size of Mercury 1, claiming 1,000+
    tok/s and quality above GPT-6 Luna and Haiku 5.5
  - "Cloudflare's AI reviewer: $2.46 to $0.77 per review; the first request hit
    cache only 14 to 26% of the time until a cache breakpoint was moved"
  - "Meta's Thin Orchestrator: 1,300 lines, 14 subagents, only the delegation
    step uses an LLM; column onboarding from 3 to 4 days to under an hour"
  - "Opus 5.5 finished Baldur's Gate 3: 20,809 tool calls, 2.2B cached input
    tokens vs 3.5M output, 99 sessions with zero compactions"
  - DHS barred DeepSeek from federal civilian agency systems days after V4.1
    Flash became the open-weight value leader
  - "JetBrains: 37% of heavy agent users now expect AI to fully replace
    developers, up from 8% of all developers in 2024"
---

MiniMax says the stealth model that sat at the top of usage leaderboards under the name "Space Bunny" was an early build of [M3.1 Flash](https://www.minimax.io/blog/minimax-m31f), which it released yesterday at $0.15 per million input tokens and $0.60 per million output, with cache reads at $0.015. The claimed numbers are DeepSWE 74%, Automation-Bench 62% and BabyVision 91%, at a third the cost and three times the speed of M3. Weights land October 23; until then it is free for a limited time on OpenRouter, OpenCode, Cline and Ollama Cloud. Artificial Analysis scores it 42 on its Intelligence Index, level with GLM-5.3-Flash and three points behind the DeepSeek V4.1 Flash update that led the weekend's issues, at about $0.22 per task. The number to watch is the hallucination rate, 93% on AA-Omniscience, because the model attempts nearly every question rather than abstaining. The Hacker News thread ran to 176 points and 51 comments after a reader worked around what looked like a shadowban on the minimax.io domain, which is its own small story about how release news travels now.

Inception's [Mercury 3](https://www.inceptionlabs.ai/blog/introducing-mercury-3) landed the same afternoon and is the more interesting architecture bet. It is a diffusion language model rather than an autoregressive one, and Inception claims it beats GPT-6 Luna and Haiku 5.5 on quality while generating at over 1,000 tokens per second. It is 40 times the size of Mercury 1; one estimate in the thread puts that north of 280B parameters if Mercury 1 was around 7B, which Inception has not confirmed. Baseten is serving it with a 1M-token context. Diffusion at this scale has been a research claim for two years and a shipping product for about a day, so the test is whether the speed holds on long agentic traces where autoregressive models keep their edge in step-by-step tool use. [AINews](https://www.latent.space/p/ainews-not-much-happened-today-f09) summed up the three releases (DeepSeek, MiniMax, Mercury) under the headline "not much happened today," which is accurate about frontier-lab silence and wrong about open-weight pricing: a 1M-context MoE at $0.30 input and a Flash-tier model at $0.15 is the lowest the floor has ever been.

[Cloudflare](https://blog.cloudflare.com/obsessive-inference-optimization/) published the most useful operations post of the day. Its internal AI code reviewer cost $1.19 per review in April and $2.46 by the end of August, with no architectural change in between. The culprit was context: 16.6 LLM calls per review, 72k tokens written to cache and 1.08M read back per session, and a first request that hit a cached prefix only 14% to 26% of the time because OpenCode v1 put the one cache breakpoint after a block that mixed the shared agent prompt with the per-job working directory and date. Splitting that block at a marker so the shared half gets its own breakpoint, removing a tool sub-reviewers were not allowed to call but tried in 57% to 76% of sessions, reading files in parallel, skipping reviewers with nothing new on re-reviews, and moving every Sonnet reviewer to 5.5 (which used 47% to 62% fewer tokens at the same per-token price) took the average review to $0.77 and the median wall time from 4m09s to 1m32s. Model and effort changes accounted for $1.06 of the $1.67 saved; code changes for $0.65. The quality section is the part to read twice. Code quality at high effort posts 40% fewer critical findings than in August, but authors now act on 59% of them versus 34% before, and blinded cross-provider judges found inflated-severity findings fell 70% while important findings per review held at 0.28 to 0.30. Performance review at medium effort did lose real findings, about one important issue every 24 full-tier reviews, so that reviewer is moving to high. Two checks for anyone running agents at volume: whether each session's first request actually reads from cache, and whether your reviewers still find real problems at the effort level you are paying for.

Meta's engineering blog made the complementary architectural argument in [The Thin Orchestrator](https://engineering.fb.com/2026/10/19/ml-applications/thin-orchestrator-ai-agent-architecture/). A 1,300-line router dispatches 20+ workflows to 14 specialist subagents and does zero domain work itself: it classifies intent, gathers fields, checks for duplicates, runs a reliability gate, delegates, and surfaces results, and only the delegation step involves model reasoning. The team got there after a single agent loaded with every schema, codegen rule and routing pattern for 10+ data sources started cross-contaminating conventions between subsystems; an alternative single-agent design hit 70% to 80% success only with a hand-written system prompt per task and 10% to 20% without one. Column onboarding that took three to four days by hand now takes under an hour, and about two-thirds of changes land without significant human edits. New use cases are new workflow templates sequencing the same 14 agents, not new agents. A companion post on [Prometheus](https://engineering.fb.com/2026/10/19/data-center-engineering/inside-prometheus-meta-gigawatt-scale-supercluster/), the gigawatt-scale cluster that trained Muse Wonder, reports 85%+ pretraining goodput and roughly 47K GPU-hours mean time between interruptions.

The harness story the community actually talked about was a Reddit post: [Opus 5.5 finished Baldur's Gate 3](https://www.reddit.com/r/ClaudeCode/comments/1x9ue4y/after_712_and_39_hours_opus_55_beat_baldurs_gate/) with nobody at the controls, over nine days, 39 hours of play and $712. The setup is Claude Code in print mode with every built-in tool disabled and a Python MCP server talking over TCP to a Lua mod that reports only what the party can perceive through the engine's own sight checks. The work was in memory: 99 fresh sessions with a median of 24 minutes and zero compactions, each starting from a character sheet, a playthrough summary and the prior session's handoff file; 1,075 memory calls of which only 155 were reads; a keeper pass at low effort folding each session log into curated notes that reached 23k words and 67 situational rules. The author caught his own route tools leaking a hidden walkway, fixed it, and re-ran the Faith-Leap trial from screenshots alone: 36 minutes, 674 tool calls, $24, eleven reloads. Totals were 20,809 tool calls with about 12% failing, and 2.2 billion cached input tokens against 3.5 million output. He is turning the scenarios into a benchmark any MCP client can play, with Codex and Gemini wired up and not yet run.

On policy, the Department of Homeland Security [barred DeepSeek](https://www.reuters.com/technology/us-banning-chinese-ai-deepseek-government-agency-it-systems-2026-10-19/) from federal civilian agency IT systems, with the order posted to the Federal Register's public inspection desk and the Hacker News thread reaching 130 points and 117 comments. It lands days after DeepSeek's V4.1 Flash became the open-weight value leader, and in the same AINews issue that recorded Dean Ball, now at OpenAI, saying distillation plays a bigger role in Chinese labs' benchmark proximity than he had realized. Expect the order to be cited in every procurement conversation about open weights for the rest of the quarter.

[JetBrains](https://blog.jetbrains.com/research/2026/10/dynamics-of-sentiment-and-attitudes-toward-ai-among-developers/) put numbers on how far delegation has moved in a year. Developers ready to hand application logic to AI went from 18% in mid-2025 to 50% in mid-2026; test writing from 50% to 75%; refactoring from 38% to 60%. Code review (43% ready) and debugging (54% still holding out) remain the lines most will not cross. The belief that AI will eventually replace human developers entirely rose from 8% in 2024 to nearly a quarter, and to 37% among heavy agent users. [Simon Willison](https://simonwillison.net/2026/Oct/19/my-obituary-for-programming/) linked Jeremy Scheff's "My obituary for programming" with the cleanest framing of the split: if you thrive on shipping working systems, agents are the gift that keeps on giving; if solving the puzzles was the job, the loss is real. The same split showed up unprompted on r/vibecoding in a post titled "Vibe coding didn't make me a developer. It made me a manager of code I can't read."

Housekeeping for Copilot users: GitHub [deprecated](https://github.blog/changelog/2026-10-19-github-copilot-models-deprecated-on-october-19-2026) GPT-5.5, GPT-5.4, GPT-5.4 mini, GPT-5 mini, Gemini 3.7 Flash and Grok 4.5 across Chat, inline edits, agent mode and completions yesterday, pointing to GPT-6.1 Sol, GPT-6 Luna, Gemini 3.8 Flash and Grok 4.7. Enterprise admins may need to enable the replacements in model policy, and the same day GitHub shipped GET and PATCH endpoints for those policies at the enterprise, team, app and org levels.

What to watch: MiniMax's weights on October 23, whether anyone reproduces Mercury 3's 1,000 tokens per second on a real coding trace, and whether Cloudflare's finding that medium effort loses real findings in performance review holds up outside Cloudflare.

*Feed note: the item mirror reported a stale sync timestamp at run time, but every item above was ingested this morning (October 20). Treat the status flag as a reporting glitch, not missing data.*
