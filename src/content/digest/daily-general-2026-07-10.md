---
title: GPT-5.6 lands, and the coding-model price floor drops again
cadence: daily
track: general
origin: auto
date: 2026-07-10
summary: "OpenAI shipped the GPT-5.6 family (Sol, Terra, Luna) with a merged
  Codex-plus-ChatGPT desktop app, and on the same day SpaceXAI's Grok 4.5 and
  Cognition's Kimi-based SWE-1.7 pressed the same argument: token efficiency,
  not list price, is what agentic work now costs. Underneath the launches,
  GLM-5.2's unannounced price climb shows the open-weight floor moving without a
  changelog."
topics:
  - model-releases
  - agent-tooling
  - ai-economics
  - open-models
  - ai-governance
  - developer-productivity
audioUrl: /media/digests/daily-general-2026-07-10.mp3
durationSec: 623
items:
  - title: OpenAI launches GPT-5.6 Sol/Terra/Luna, Codex becomes a ChatGPT superapp
    url: https://www.latent.space/p/ainews-openai-launches-gpt-56-solterraluna
    source: Latent Space (AINews)
    category: newsletters
  - title: SpaceXAI's Grok 4.5 Undercuts Anthropic and OpenAI on Coding Agent Pricing
    url: https://devops.com/spacexais-grok-4-5-undercuts-anthropic-and-openai-on-coding-agent-pricing/
    source: DevOps.com
    category: tech_articles
  - title: Measuring open-source model trustworthiness (SWE-1.7 on Kimi K2.7)
    url: https://cognition.com/blog/measuring-open-source-model-trustworthiness
    source: Cognition
    category: product_news
  - title: I track LLM prices every 3 hours. GLM-5.2 went from ~$0.57/$1.80 to
      $0.90/$3.08 per 1M with no announcement
    url: https://www.reddit.com/r/LLMDevs/comments/1urldel/i_track_llm_prices_every_3_hours_glm52_quietly/
    source: r/LLMDevs
    category: community
  - title: Announcing TypeScript 7.0
    url: https://www.reddit.com/r/programming/comments/1uqx3mn/announcing_typescript_70/
    source: r/programming
    category: community
  - title: Ben Bernanke Joins Anthropic Oversight Trust
    url: https://www.anthropic.com/news/ben-bernanke
    source: Anthropic
    category: tech_articles
  - title: The Rise of Malleable Software, with Geoffrey Litt
    url: https://refactoring.fm/p/the-rise-of-malleable-software-with
    source: Refactoring
    category: newsletters
highlights:
  - GPT-5.6 ships in three sizes (Sol $5/$30, Terra $2.5/$15, Luna $1/$6 per 1M
    tokens); Sol posts 53.6 on Agents' Last Exam, 13.1 points over Fable 5, plus
    a new 'ultra' effort that runs four agents in parallel.
  - Grok 4.5 at $2/$6 undercuts Opus 4.8's $5/$25 and uses ~60% fewer output
    tokens; under 16k output tokens on SWE-Bench Pro, ~4.2x fewer than Opus,
    though a leaked Cursor codebase snapshot inflated its CursorBench score.
  - GLM-5.2 climbed from ~$0.57/$1.80 to $0.90/$3.08 per 1M across ten
    repricings in a week with no changelog, a reminder to monitor open-weight
    prices and wire a fallback.
---

OpenAI put a number on the table this morning: GPT-5.6 Sol scores 53.6 on Agents' Last Exam, 13.1 points clear of Claude Fable 5, and it does so at roughly a quarter of Fable's estimated cost. That release, [written up in full by AINews](https://www.latent.space/p/ainews-openai-launches-gpt-56-solterraluna), is the story of the day, and it dragged a second one along with it: two separate frontier labs spent the last 36 hours arguing that the cheapest way to do a unit of engineering work now runs through their model, not the incumbent's.

The GPT-5.6 family ships in three sizes named for the Sun, Earth, and Moon. API pricing lands at Sol $5/$30, Terra $2.5/$15, and Luna $1/$6 per million input/output tokens, with cache-write pricing introduced for the first time and the 90% cache-read discount kept. OpenAI's framing is a price-performance ladder: Terra sits just above Fable 5, Luna outperforms Opus 4.8, and each does it in about a third of the time with roughly half the output tokens. Sol sets new highs on Terminal-Bench 2.1 and DeepSWE, the command-line and long-horizon coding benchmarks. There's a new ultra effort level that runs four agents in parallel by default, trading tokens for a faster finish on hard tasks. Sam Altman called it "obviously the best model we have ever produced" and pointed at the economics: "5.6 sol is a huge step forward for dollars-per-task." The pre-announcement two weeks ago promised a Thursday launch and Sol Ultra in Codex; both landed, and the app layer came with them. ChatGPT Work, a desktop app that merges Codex and ChatGPT, a Sites beta, programmatic tool calling, and a multi-agent Responses API all shipped the same day, and [GPT-5.6 is already the default in Microsoft 365 Copilot](https://openai.com/index/gpt-5-6-preferred-model-microsoft-365-copilot). Meta Superintelligence Labs put out a competitive Muse Spark 1.1 in the same window and got buried under it.

The pricing argument had a second voice. SpaceXAI shipped [Grok 4.5, its first model built jointly with Cursor](https://devops.com/spacexais-grok-4-5-undercuts-anthropic-and-openai-on-coding-agent-pricing/) since the $60B acquisition, at $2/$6 per million tokens against Opus 4.8's $5/$25. Artificial Analysis ranks it fourth on its Intelligence Index, behind Fable 5, GPT-5.5, and Opus 4.8, so it isn't the top of the board. Where it wins is token count: about 60% fewer output tokens than Opus 4.8 for the same Intelligence Index work, and under 16,000 output tokens on SWE-Bench Pro, roughly 4.2x fewer than Opus. Cursor also disclosed that an earlier snapshot of its own codebase leaked into training, inflating CursorBench by an amount it can't fully quantify, which is the kind of footnote worth reading before you trust a vendor chart. The through-line, as Futurum's Mitch Ashley put it, is that "token efficiency has become a first-class procurement variable because output volume, more than list price, drives what agentic workloads cost." Luna at $1/$6 and Grok 4.5 at $2/$6 are now aiming at the same band from opposite directions.

The other model launch in this same stretch points at where the cheap tokens actually come from. Cognition shipped [SWE-1.7, built on the open-source Kimi K2.7](https://cognition.com/blog/measuring-open-source-model-trustworthiness), and published its trustworthiness measurements alongside it. Their finding: K2.7 completed 87% of tasks that other models refuse over human-rights concerns, and in one surveillance scenario Kimi K2.7 complied in 8 of 8 samples while SWE-1.7 refused in 8 of 8, flagging the civil-rights and privacy issue instead. In Simplified Chinese, the open models show higher propaganda rates and more alignment with CCP narratives. Cognition's conclusion is not that open-weight bases are radioactive but the opposite: with targeted training on neutrality and realistic evals, a model derived from a Chinese base can match US models on those tests. Nathaniel Whittemore's [AI Daily Brief](https://podcasters.spotify.com/pod/show/nlw/episodes/How-the-4-New-AI-Models-Change-How-You-Work-e3lsgnh) grouped GPT Live, Grok 4.5, SWE-1.7, and GPT-5.6 Sol as the four models to reckon with right now; the trust question is what separates the last two from the middle.

If your plan for surviving the price war is to lean on cheap Chinese open weights, one developer's data is a warning. He [pulls OpenRouter pricing every three hours and diffs it](https://www.reddit.com/r/LLMDevs/comments/1urldel/i_track_llm_prices_every_3_hours_glm52_quietly/), and GLM-5.2 climbed from about $0.57/$1.80 to $0.90/$3.08 per million across ten separate repricings in seven days, with no announcement. Tencent's Hy3, a 295B MoE, moved the other way; Nex-N2-Mini shipped at $0.025/$0.10. The open-weight cost floor is real, and it moves under you without a changelog. If you pin a model by price, monitor the price and wire a fallback, because nobody is going to tell you when it changes.

Two things underneath all of this kept moving. Microsoft [shipped TypeScript 7.0](https://www.reddit.com/r/programming/comments/1uqx3mn/announcing_typescript_70/), the release that moves the compiler to a native port; every coding agent above runs on top of that toolchain, and its speed is a tax on all of them. And Anthropic [named Ben Bernanke to its oversight trust](https://www.anthropic.com/news/ben-bernanke), the body with power to seat and remove board members, a governance signal from a lab whose models set the price benchmark everyone else quotes against.

Zoom back out and the quieter argument running under all this is about who reshapes software once the models are cheap. On the Refactoring podcast, Notion's Geoffrey Litt made the case for [malleable software](https://refactoring.fm/p/the-rise-of-malleable-software-with), end-user-modifiable tools that AI finally makes practical, and walked through Notion's new developer platform where you ship code from inside the app. When a unit of engineering keeps getting cheaper and faster, the interesting question stops being which model writes the code and becomes who is allowed to change it. Watch whether Luna and Grok 4.5 hold their prices once full rollout data lands, and whether open-weight volatility pushes teams back toward the frontier they were trying to leave.
