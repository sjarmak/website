---
title: Coding-agent costs now span 29x at the top of the index
cadence: daily
track: general
origin: auto
date: 2026-11-15
summary: Artificial Analysis's rebased Coding Agent Index puts Fable 5.2 and
  Opus 5.5 level at 58, with near-top task costs running from $1.51 to $44.22.
  Gemini 4 Hydrogen reached GitHub Copilot, SWE-Bench Pro V2 rebuilt 480 of 731
  tasks, an independent test found decision models trade reasoning for price,
  and Jensen Huang's resignation left Nvidia employees petitioning for his
  return.
topics:
  - model-releases
  - benchmarks
  - agent-tooling
  - coding-agents
  - industry
unresolvedFacets:
  - industry
audioUrl: /media/digests/daily-general-2026-11-15.mp3
durationSec: 700
items:
  - title: "[AINews] The No AI Slop Manifesto"
    url: https://latent.space/p/ainews-the-no-ai-slop-manifesto/
    source: Latent Space
    category: tech_articles
  - title: Gemini 4 Hydrogen in GitHub Copilot
    url: https://github.blog/changelog/2026-11-13-gemini-4-hydrogen-in-github-copilot
    source: Changelogs – The GitHub Blog
    category: product_news
  - title: "SWE-Bench Pro V2: A Cleaner, Harder-to-Game Coding Benchmark"
    url: https://arxiv.org/abs/2610.24206
    source: cs.SE updates on arXiv.org
    category: research
  - title: Do decision models actually decide better? I tested them against the LLMs
      they're built from
    url: https://www.reddit.com/r/LLMDevs/comments/1xvshe4/do_decision_models_actually_decide_better_i/
    source: LLMDevs
    category: community
  - title: "Scaling AI Agents: What We Learned From 9 Real-World Cases"
    url: https://blog.jetbrains.com/blog/2026/11/13/scaling-ai-agents-what-we-learned-from-9-real-world-cases/
    source: JetBrains Company Blog
    category: product_news
  - title: Introducing ChatGPT Wallet
    url: https://openai.com/index/introducing-chatgpt-wallet
    source: OpenAI News
    category: product_news
  - title: Nvidia employees petition to bring back Jensen Huang
    url: https://www.wired.com/story/nvidia-employees-petition-for-jensen-huangs-return/
    source: "Hacker News: Front Page"
    category: tech_articles
highlights:
  - "AA Coding Agent Index v2.1: Fable 5.2 and Opus 5.5 tie at 58; near-top cost
    per task ranges $1.51 to $44.22"
  - Fable 5.2 API price cut to $8/$40 per million tokens; llama.cpp and ggml
    reach 1.0
  - Gemini 4 Hydrogen GA across every GitHub Copilot surface, enabled by default
    for orgs
  - SWE-Bench Pro V2 repaired or retired 480 of 731 tasks; Hard split spreads
    52.9% to 98.0%
  - Decision models score 0.61 to 0.84 on reasoning vs 0.99 for the base model
    thinking, at a fraction of the cost
  - "Fin: 3x PR throughput and 54% smaller defect backlog after rebuilding
    workflow around agents"
---

The cost of a top-tier coding-agent run now spans a 29x range. Artificial Analysis rebased its Coding Agent Index to v2.1 on FrontierCode 2.0 and Terminal-Bench 4.1, and among configurations scoring 48 or better, cost per task runs from $1.51 for Codex on GPT-6.1 Sol to $44.22 for Claude Fable 5.2 at max effort. Fable 5.2 and Opus 5.5 tie at the top with 58, average scores fell 5 points on the harder suite, and GPT-6.1 Terra in Codex was the only configuration that did not drop. Latent Space's [AINews for November 14](https://latent.space/p/ainews-the-no-ai-slop-manifesto/) gathers this alongside the rest of the day's evals: Arena puts Fable 5.2 first in Agent Arena at +30.4% net improvement, with its lead widening past 16 turns, and Anthropic cut Fable's API price from $10/$50 to $8/$40 per million input/output tokens. The same issue notes llama.cpp and ggml reaching 1.0, with a new cache for frequently used experts so mixture-of-experts models larger than GPU memory run more smoothly. If you pick models by leaderboard rank alone, the Pareto data argues for pricing your effort level per task instead; Fable at medium, high, and xhigh all sit on the frontier.

Google's cheap model reached the editor the day after launch. [Gemini 4 Hydrogen is now generally available in GitHub Copilot](https://github.blog/changelog/2026-11-13-gemini-4-hydrogen-in-github-copilot) across VS Code, Visual Studio, JetBrains, Xcode, Eclipse, the CLI, the coding agent, and the SDK, billed at provider list price under usage-based billing. GitHub pitches it for fast agentic coding and tool use with better instruction following than Gemini 3.8 Flash. Early independent checks are mixed: Roboflow measured 29.3 seconds per image at high effort against 132.3 for Gemini 4 Carbon, while one 3D-modeling test found Hydrogen costing more than Argon because it loops on over-verification. Enterprise admins should note that new models are enabled by default unless the global default is off.

The benchmark most coding-agent claims lean on just got rebuilt. [SWE-Bench Pro V2](https://arxiv.org/abs/2610.24206) repaired or retired 480 of the original 731 tasks after 23 contracted engineers spent 404 hours auditing them, with each revised instruction verified by a second engineer solving from the text alone. The hardened harness restricts network access to the model endpoint and re-grades every patch in a clean container, so agents can no longer fetch the upstream fix or get credit for edits outside their patch. Frontier agents resolve up to 99.4% of the 642 V2 tasks, which says the main split is close to saturated; the 51-task Hard split still spreads systems from 52.9% to 98.0%, and that is the number to ask vendors for.

Decision models, the single-token classifiers a dozen vendors shipped since September, got a useful independent check. A developer on r/LLMDevs [tested them against the LLMs they were built from](https://www.reddit.com/r/LLMDevs/comments/1xvshe4/do_decision_models_actually_decide_better_i/) on 450 code-generated questions with known answers, five runs each. On reasoning questions, Qwen3.5-9B thinking first scored 0.99, Perplexity Decider 0.84, Elephant 1 0.69, Microsoft-Decision-1 0.63, Jev 0.61, and plain Qwen3.5-9B answering in one token 0.53. The decision training recovers some accuracy but buys mostly speed and price: Decider cost $0.009 per thousand calls against $0.77 for thinking Qwen. When the answer was present in the text, every model scored 0.94 or better, so for routing and tagging any of them will do. Code and data are public.

JetBrains published [nine case studies on scaling agents across teams](https://blog.jetbrains.com/blog/2026/11/13/scaling-ai-agents-what-we-learned-from-9-real-world-cases/), and the spread is the finding. One organization hit 95% AI adoption with no change in developer velocity. Fin set up a dedicated team to own shared skills, MCP servers, and evals, backtested its review skill against historical PRs, then had to invest in linting and CI capacity once output rose; over 16 months it reports 3x PR throughput, a 54% smaller defect backlog, and 50% lower cost per PR despite higher total AI spend. The common thread is that results came from changing builds, tests, and review around the agents, not from adding more of them.

OpenAI launched [ChatGPT Wallet](https://openai.com/index/introducing-chatgpt-wallet), which lets agents in ChatGPT Work, Codex, and dots complete purchases with user approval and existing card protections; per Latent Space's roundup, agents never see the card number, and Amex, Mastercard, and Visa are supported. Payment is the action most agent builders have kept behind a human, and a first-party rail with approval built in changes what an unattended shopping or procurement flow can look like.

The hardware side had its own shock. Jensen Huang resigned as Nvidia's CEO on November 12, and by the next morning [Nvidia employees were petitioning for his return](https://www.wired.com/story/nvidia-employees-petition-for-jensen-huangs-return/); a post from Elon Musk saying he would sign drew 208K engagements, the day's largest by far. Follow-on reporting surfaced a director who sold nearly $1B in stock weeks before the news, and the board has opened an independent investigation. For practitioners the near-term question is roadmap and pricing continuity on Blackwell and Rubin parts, and whether Nvidia's open-model and China positions survive a leadership change.

Watch for the open weights of Baidu's ERNIE 5.5 Flash (280B total, 14B active), promised before November 25, and LangChain's LangSmith announcements on November 20. And watch whether vendors start quoting the SWE-Bench Pro V2 Hard split rather than the saturated main one.

*Feed note: the source mirror reported a stale sync timestamp when this issue was generated, though items in the window run through November 15.*
