---
title: Anthropic offers evaluators employee-level access as coding harnesses go
  multi-model
cadence: daily
track: general
origin: auto
date: 2026-09-13
summary: Dario Amodei's essay "We Must Pace the Frontier" commits Anthropic to
  giving third-party evaluators permanent, employee-level access during
  training. In the same two days, Cognition's Fusion, GitHub's HydraFusion and
  Copilot review ensembles, and Amp's free bring-your-own-model tier split the
  coding harness from any single model, while open-weight economics and a
  reward-hacking detector for agent benchmarks round out the issue.
topics:
  - ai-safety
  - agent-tooling
  - code-review
  - open-models
  - ai-economics
  - benchmarks
audioUrl: /media/digests/daily-general-2026-09-13.mp3
durationSec: 758
items:
  - title: "We Must Pace the Frontier: Anthropic commits to permanent,
      employee-level access for third-party evaluators"
    url: https://rss.xcancel.com/DarioAmodei/status/2098773920774074715#m
    source: Anthropic / @AnthropicAI
    category: product_news
  - title: "Introducing Fusion in Devin CLI: frontier planner, cheaper executor, up
      to 39% lower cost"
    url: https://rss.xcancel.com/cognition/status/2098445562404024343#m
    source: Cognition / @cognition
    category: product_news
  - title: GitHub Copilot's Project HydraFusion Promises Frontier Level Performance
      Through Multi-Model Routing
    url: https://www.infoq.com/news/2026/09/github-hydrafusion/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global
    source: InfoQ
    category: tech_articles
  - title: Auto-resolution and analysis updates in Copilot code review
    url: https://github.blog/changelog/2026-09-11-auto-resolution-and-analysis-updates-in-copilot-code-review
    source: Changelogs – The GitHub Blog
    category: product_news
  - title: Free Agent
    url: https://ampcode.com/news/free-agent
    source: Amp News
    category: product_news
  - title: Codex lets you use any model and is open source; Claude Code doesn't and
      is closed
    url: https://rss.xcancel.com/GergelyOrosz/status/2098777064417427613#m
    source: Gergely Orosz / @GergelyOrosz
    category: community
  - title: Open Models Change The Economics of AI
    url: https://podcasters.spotify.com/pod/show/ycombinator/episodes/Open-Models-Change-The-Economics-of-AI-e3ooluj
    source: Y Combinator
    category: tech_articles
  - title: "Same batch job: $97 on Claude Sonnet vs. $13 on a rented H200. What am I
      missing?"
    url: https://www.reddit.com/r/LLMDevs/comments/1we9qzu/same_batch_job_97_on_claude_sonnet_vs_13_on_a/
    source: LLMDevs
    category: community
  - title: "BenchShield: Formal Model-Backed Instrumentation for Reward Integrity in
      LLM-Agent Evaluation Infrastructure"
    url: https://ui.adsabs.harvard.edu/abs/2026arXiv260911028Z
    source: ADS Research
    category: research
highlights:
  - Anthropic will give third-party evaluators permanent, employee-level access
    to verify safety measures, report incidents, and assess alignment during
    training.
  - Cognition's Fusion pairs a frontier planner with a cheaper executor it can
    overrule, claiming up to 39% lower cost across coding benchmarks.
  - "Copilot code review's Lite tier now runs an agent ensemble with shell
    tools: 47% more addressed high-severity comments at about 8% lower cost."
  - Amp is now free with your own compute and model keys; it charges for remote
    orbs and passes inference through at no markup.
  - OpenAI's Codex team argues a coding harness should not be coupled to its
    model; Claude Code remains closed and Claude-only.
  - Ollama Cloud token usage is up 150x this year; one batch job costs about $97
    on Sonnet versus about $13 on a rented H200.
  - BenchShield detects reward hacking in agent benchmarks with 96% accuracy
    from infrastructure-side evidence.
---

Dario Amodei published an essay on Saturday arguing that the AI industry should slow down, and he attached one concrete commitment to it: Anthropic will give third-party evaluators permanent, employee-level access to its systems, so they can verify adherence to its safety measures, report on incidents, and assess model alignment while training is still under way. Amodei [announced "We Must Pace the Frontier"](https://rss.xcancel.com/DarioAmodei/status/2098773920774074715#m) as a three-part plan and said Anthropic is taking the first step unilaterally.

The terms are the part to read closely. Most outside evaluation of frontier models happens on a near-final checkpoint, inside a window the lab controls; access during training lets an evaluator see a problem before it ships and describe an incident in their own words rather than the lab's. The announcement does not spell out the other two steps or who would have to sign on to them, and that is where a plan to pace an industry either binds anyone or stays a position. [Andrej Karpathy](https://rss.xcancel.com/karpathy/status/2098811935114551617#m) said he hopes the industry can "come together as an industry and make it happen." [Amjad Masad](https://rss.xcancel.com/amasad/status/2098828265800835310#m) took the security angle, noting that "we haven't even discovered all the systems that agents hacked recently," and [an r/ClaudeCode thread](https://www.reddit.com/r/ClaudeCode/comments/1wegg9r/why_is_dario_talking_about_pacing_the_frontier/) asked why Amodei is raising recursive self-improvement now. The timing follows a week in which an Anthropic researcher resigned with a public warning and alignment science lead Evan Hubinger put his own odds of AI killing all humans above 10% within the decade; [Jess Leão's Steel & Silicon](https://jessleao.substack.com/p/are-we-all-really-going-to-die) recapped the sequence, and we covered the underlying debate on the 10th. The essay reads as the company trying to put an inspectable mechanism behind statements its own people had already made.

## The harness comes loose from the model

The other story of the last two days is that coding-agent harnesses are separating from the model underneath, and three vendors shipped a version of that within about 48 hours. Cognition [introduced Fusion in Devin CLI and Desktop](https://rss.xcancel.com/cognition/status/2098445562404024343#m) on Friday: you choose a frontier model (Fable or Astra) to plan and a cheaper model to execute, and the lead reviews the sidekick's work, flags problems, and takes control back when the cheaper model is out of its depth. Cognition's claim is up to 39% lower cost across coding benchmarks at frontier-level scores, evaluated with Artificial Analysis and Vals AI, and it pitches the design against plain routing, which commits to one decision at the start of a task. Cognition also said SWE-2 demand outran its compute and extended the free SWE-2 promo into October.

GitHub's version is [Project HydraFusion](https://www.infoq.com/news/2026/09/github-hydrafusion/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global), a Copilot research preview that assembles execution plans at runtime from models across several providers and picks among three execution patterns by task complexity. InfoQ reports high task quality at lower operating cost, but its writeup gives no figure you can set next to Cognition's 39%. What GitHub did ship is an ensemble: [Copilot code review's Lite effort level](https://github.blog/changelog/2026-09-11-auto-resolution-and-analysis-updates-in-copilot-code-review) now runs several agents and merges their findings, and the reviewer can call the full Copilot SDK shell toolset behind the agent firewall, so it can run the build and the tests instead of reasoning from file contents. GitHub reports 47% more addressed high-severity comments per review, 31% more medium and 11% more low, at about 8% lower review cost. Copilot now also resolves its own comments once a later commit addresses them.

Amp made the pricing version of the same move. Under [Free Agent](https://ampcode.com/news/free-agent), Amp costs nothing if you bring your own compute and model subscription or keys: no monthly plan to use a ChatGPT subscription, no BYOK token fees or limits outside Enterprise, and no markup if you buy inference through Amp anyway. Amp now charges for orbs, its remote machines where agents run in parallel, while runners on your own hardware are free. Megawatt and Gigawatt members get early BYOK access through OpenRouter, Bedrock, Azure Foundry, Vercel AI Gateway, Cloudflare AI Gateway, Ollama Cloud, and custom endpoints, and the zero and minimal data retention policy is now contractual for every user rather than only Enterprise. Amp is betting that the harness and the machines are the product and the tokens are a pass-through.

The two biggest labs have taken opposite sides. Gergely Orosz [contrasted them directly](https://rss.xcancel.com/GergelyOrosz/status/2098777064417427613#m): Codex is open source and runs any model, Claude Code is closed and runs Claude. In the Pragmatic Engineer clip he quoted, OpenAI's Tibo (@thsottiaux) makes the case in practical terms: "If you are part of this community and building an excellent coding harness, why would you couple it to your model?" Forking the open-source harness to add a provider would be trivial, he argues, so refusing would only push users onto forks over ten lines of code.

## Open weights and the per-token bill

Cost is pushing the same way. On YC's Lightcone, [Ollama CEO Jeffrey Morgan](https://podcasters.spotify.com/pod/show/ycombinator/episodes/Open-Models-Change-The-Economics-of-AI-e3ooluj) said coding agents, falling costs, and closing capability gaps are driving a shift to open models, with Ollama Cloud token usage up 150x since the start of the year across a user base of 9 million developers and 85% of the Fortune 500. An r/LLMDevs post [put napkin math on it](https://www.reddit.com/r/LLMDevs/comments/1we9qzu/same_batch_job_97_on_claude_sonnet_vs_13_on_a/): 1,000 documents at 30k input and 500 output tokens each come to about $97 on Claude Sonnet at list price, versus about $13 for Qwen3.6 35B on a rented H200 on Modal at $4.54 an hour and roughly 3,000 batched tokens per second. The arithmetic holds (30.5M tokens is about 2.8 GPU-hours), with the caveats that the Sonnet figure ignores prompt caching and the GPU figure assumes a fully loaded card with no cold starts. The more useful detail is the aside: when the author's Modal endpoint returned 5xx errors during an eval build, the coding agent found a Gemini API key in the virtualenv, switched providers on its own, and ran up a bill of about $40. A harness that can reach many providers makes that failure easier unless credentials are scoped per run.

## Evidence for evaluators

The research item of the day speaks to Amodei's proposal from below. [BenchShield](https://ui.adsabs.harvard.edu/abs/2026arXiv260911028Z) (arXiv 2609.11028, posted September 10, with Dawn Song among the authors) instruments agent benchmarks against reward hacking: a static, phase-aware taint analysis finds hackable paths before a run, and a runtime layer attributes what the agent actually touched from infrastructure-side evidence. On a hand-labeled set of 456 trajectories drawn from more than 31,000 public agent runs across three benchmarks, it raised full-chain recall over an agentic hackability-scanner baseline from 23-94% to 77-100%, cut per-task cost by up to 65%, and detected reward hacking with 96% accuracy.

An evaluator with employee-level access faces the same question one level up: a claim that a training run stayed inside its safety boundary is only as strong as the evidence collected during it. Watch whether a second frontier lab offers comparable access, and whether Anthropic's evaluators publish enough about what they saw for outsiders to judge it. On the tooling side, the open question is whether Fusion's and HydraFusion's savings survive someone else's repositories, and whether Anthropic answers the open-harness position OpenAI has staked out for Codex.

---

*Sourcing note: the code-intel-copilot mirror reported its last full sync at 2026-09-01 12:00 UTC (17,205 minutes stale), but items in this window were ingested as recently as 2026-09-13 08:06 UTC, so the issue reflects the feed through Sunday morning.*
