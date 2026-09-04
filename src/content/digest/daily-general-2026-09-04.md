---
title: GPT-6 Astra ships at 99.9% on ARC-AGI-3 and $50 per million output
  tokens, Nvidia buys Hugging Face
cadence: daily
track: general
origin: auto
date: 2026-09-04
summary: OpenAI rolled out GPT-6 Astra on September 3 with state-of-the-art
  claims across coding, computer use and math, $10/$50 per million token
  pricing, and a system card that admits lower chain-of-thought monitorability;
  Artificial Analysis, ARC Prize, Cognition and Latent Space each measured
  something different. Nvidia announced it will acquire Hugging Face, ifm.ai
  released K2 Horizon as an open frontier model, DeepMind shipped WeatherNext 3
  with hourly forecasts queryable from BigQuery, and OpenAI, Claude and Grok
  went down simultaneously two hours before the launch.
topics:
  - model-releases
  - benchmarks
  - open-weights
  - infrastructure
  - agent-tooling
  - platform-policy
unresolvedFacets:
  - platform-policy
audioUrl: /media/digests/daily-general-2026-09-04.mp3
durationSec: 692
items:
  - title: GPT-6 Astra
    url: https://openai.com/index/gpt-6-astra/
    source: OpenAI
    category: product_news
  - title: "GPT-6 Astra: an automated AI Engineer you can hire for <$6 an hour"
    url: https://www.latent.space/p/astra
    source: Latent Space
    category: newsletters
  - title: Nvidia to Acquire Hugging Face
    url: https://blogs.nvidia.com/blog/nvidia-to-acquire-hugging-face/
    source: NVIDIA Blog
    category: tech_articles
  - title: "K2 Horizon: Frontier Performance, Radically Open"
    url: https://ifm.ai/blog/k2/
    source: ifm.ai
    category: tech_articles
  - title: Introducing WeatherNext 3, our most advanced and accurate global weather
      AI model
    url: https://deepmind.google/blog/introducing-weathernext-3-our-most-advanced-and-accurate-global-weather-ai-model
    source: Google DeepMind Blog
    category: product_news
  - title: "Ask HN: Why are OpenAI, Claude, and Grok simultaneously down?"
    url: https://news.ycombinator.com/item?id=49551096
    source: Hacker News
    category: community
  - title: Grep beats LSP? Why coding agents ignore your fancier tools
    url: https://www.agentconnect.md/blog/grep-beat-lsp-harness/
    source: agentconnect.md
    category: tech_articles
  - title: "Shopify Introduces Gisting: Compressing LLM System Prompts into Learned
      Tokens"
    url: https://www.infoq.com/news/2026/09/spotify-gisting-llm-performance/
    source: InfoQ
    category: tech_articles
  - title: "Google Antigravity TOS: 3rd party usage can get Google account suspended"
    url: https://twitter.com/GergelyOrosz/status/2095453567955968398
    source: Gergely Orosz
    category: community
highlights:
  - "GPT-6 Astra: $10/$50 per million tokens, 99.9% ARC-AGI-3 with a provider
    adapter harness (63% standard), Coding Agent Index 67 vs Fable 5.1's 70 at a
    fifth of Opus 5's tokens"
  - Latent Space priced Astra at under $6/hour across 20B+ preview tokens; the
    system card reports lower chain-of-thought monitorability
  - Nvidia will acquire Hugging Face; ifm.ai's K2 Horizon and Qwen 3.8 27B on
    Cerebras at 1,500 tok/s gave open weights a strong day
  - WeatherNext 3 forecasts hourly from raw observations, up to 50% lower
    precipitation error, queryable via BigQuery
  - OpenAI, Claude and Grok were down simultaneously on September 3; GitHub
    deprecates four Copilot models on October 2
---

99.9% on ARC-AGI-3. That is the number OpenAI put on the slide when [GPT-6 Astra](https://openai.com/index/gpt-6-astra/) rolled out on September 3, and it is the number the rest of the day argued about. The launch post lists state-of-the-art results on FrontierMath Tier 4, TerminalBench 4.0, Agents' Last Exam, AutomationBench, ScreenSpot Pro, Terminal-Bench Science 0.1 and HealthBench Pro, and a system card that names Astra the first broadly deployed OpenAI model to reach the Critical level of cybersecurity capability under the Preparedness Framework. Access goes to a limited set of organizations first, then to ChatGPT Plus, Pro, Business and Enterprise, the API and AWS over the coming days. Pricing is $10 per million input tokens and $50 per million output on standard, doubled on the fast tier for up to 2.5x the speed. The Responses API picks up async function calling, mid-turn steering, and reasoning-effort changes that do not break the cache, and Codex gains the ability to ask a question while continuing to work.

The independent numbers are less tidy than the slide. Artificial Analysis scored Astra 67 on its Coding Agent Index, level with Opus 5 and Fable 5 and three points behind Fable 5.1, while using a fifth of the tokens of Opus 5 at xhigh and one third of GPT-5.6 Sol's in the Codex harness. On the Intelligence Index it lands at 61, equal to Sol and five points under Fable 5.1, and because the per-token price is 2.5x higher it comes out roughly 75% more expensive per task than its predecessor at max effort. ARC Prize reported 63% on ARC-AGI-3 under the standard harness and 99% with a provider adapter that preserves opaque reasoning state across turns, and Chollet said ARC-AGI-4 arrives in Q1 2027 because this one saturated twice as fast as he expected. Cognition measured Astra within 0.4 points of Fable 5 on FrontierCode 1.1 at 64% lower cost and is shipping it in Devin. The safety material drew its own thread: the system card reports lower chain-of-thought monitorability alongside the alignment gains, and a LessWrong post asking how concerned to be about Astra's recurrent architecture sat on the Hacker News front page most of the afternoon. Tuesday's Path to Astra post had pre-announced the safeguards; the launch is what those safeguards were for.

The practitioner read that matters most came from [Latent Space, which spent more than 20 billion Astra tokens during the preview](https://www.latent.space/p/astra) and priced the result at under $6 an hour: 33 tokens per second against the $50 output rate. The list of things it did unattended is the useful part. It picked and trained models, labelled data and then ran active learning on the labels, kept pipelines saturated, read its own logs, deployed and debugged whole systems in one pass, and fanned out and evaluated subagents running other vendors' models, holding coherence across billions of tokens in a single thread. The caveat is in the same paragraph: run it at Ultra with wide parallelism and $6 an hour becomes a distant memory, because the model is good at spawning work. swyx's summary the next morning was that this is the first OpenAI launch in a year received better than a Claude launch, with 36 million views and 164 thousand likes in the first nine hours, delayed blog post and influencer-first access complaints included.

Astra was not the only structural news. [Nvidia announced it will acquire Hugging Face](https://blogs.nvidia.com/blog/nvidia-to-acquire-hugging-face/), which puts the default host for open weights, datasets and the transformers library inside the company that sells the hardware those weights run on. Nvidia has been Hugging Face's infrastructure partner for years, so the operational change may be small at first; the governance question of who decides what stays free on the Hub is the one to watch, and it landed on the same morning that [ifm.ai released K2 Horizon](https://ifm.ai/blog/k2/) under a "frontier performance, radically open" banner. Open weights had a good day on the serving side too: Qwen 3.8 27B went live on Cerebras at 1,500 tokens per second, the highest-voted AI item on Hacker News after the Astra post itself.

[WeatherNext 3](https://deepmind.google/blog/introducing-weathernext-3-our-most-advanced-and-accurate-global-weather-ai-model) from DeepMind and Google Research is a different kind of model release. It trains directly on raw weather station observations and real-time satellite data, issues a fresh global forecast every hour instead of the six-hour cadence conventional numerical models are compute-bound to, and claims up to a 50% reduction in precipitation error, with the largest gains in regions where forecasts have historically been weakest. It now powers weather in Search, the Gemini app and Maps, and the forecasts are queryable from BigQuery, Earth Engine and GCS, which makes it the first frontier weather model most developers can hit with a SQL statement.

Two hours before the Astra post went up, [OpenAI, Claude and Grok were down at the same time](https://news.ycombinator.com/item?id=49551096). Anthropic's status page logged elevated errors across multiple models, ChatGPT served a 404, and the Ask HN thread collected 64 comments guessing at a shared upstream cause. No shared cause was posted. If your agents call two of those three providers for redundancy, the last day was the test of whether that redundancy was real.

On the tooling side, a post asking [why coding agents reach for grep over LSP](https://www.agentconnect.md/blog/grep-beat-lsp-harness/) hit 65 points and 40 comments overnight, and the argument is about harness design rather than model preference: the agent uses the tool whose output it can read in one call, and a language-server round trip that returns structured references loses to a text search that returns lines with context. Anyone shipping an MCP server for code navigation should read the comments before adding another verb. Shopify, meanwhile, described [gisting](https://www.infoq.com/news/2026/09/spotify-gisting-llm-performance/), compressing long system prompts into a small set of learned gist tokens so the prompt is paid for once at training time instead of on every request, an approach that trades a fine-tune for prefix cost and only pays off when the prompt is stable and the volume is high.

Two platform-policy items close it out. Gergely Orosz surfaced a clause in [Google Antigravity's terms of service](https://twitter.com/GergelyOrosz/status/2095453567955968398) under which third-party usage of the product can get your Google account suspended, not just your Antigravity access, which is a different blast radius from any other coding-agent EULA. And GitHub set October 2 as the deprecation date for Gemini 3.5 Flash, Gemini 3.6 Flash, Kimi K2.7 Code and Claude Opus 4.7 across every Copilot surface, so any pinned model policy in an enterprise config has four weeks to move.

What to watch: whether Astra's general-availability latency holds the 33 tokens per second that makes the $6-an-hour math work, whether the monitorability drop the system card admits shows up in the Devin and Codex incident reports over the next month, and what Nvidia says about Hub pricing once the deal closes.
