---
title: Opus 5 lands at half Fable's price and the evals immediately split
cadence: daily
track: general
origin: auto
date: 2026-07-25
summary: "Anthropic shipped Claude Opus 5 at an Epoch Capabilities Index of 159
  against Fable 5's 161, for half the price, and the first independent evals
  disagree sharply about what it's for. CodeRabbit's bench puts it as a
  precision lane with worse coverage and four times the nitpicks; Cognition
  explains the inverted effort curve on FrontierCode as a scope penalty for
  unprompted refactoring. Elsewhere: UK AISI and CAISI publish a joint cyber
  assessment of Kimi K3, OpenAI issues a holding statement on the Hugging Face
  incident, and spec-driven development gets called dead."
topics:
  - model-releases
  - agent-tooling
  - benchmarks
  - code-review
  - ai-security
  - context-engineering
audioUrl: /media/digests/daily-general-2026-07-25.mp3
durationSec: 788
items:
  - title: Opus 5
    url: https://news.smol.ai/issues/26-07-24-opus-5/
    source: AINews with Smol.ai
    category: tech_articles
  - title: "Opus 5 for code review: Cleaner actionable comments, noisier overall"
    url: https://coderabbit.ai/blog/opus-5-model-review
    source: CodeRabbit Blog
    category: product_news
  - title: "Cognition on the Opus 5 FrontierCode results: a scope criterion
      penalizes unprompted refactoring"
    url: https://rss.xcancel.com/cl571128/status/2080783750456311836#m
    source: Cognition / @cognition
    category: product_news
  - title: "Quoting Boris Cherny: Opus 5 is our least prompt injectable model yet"
    url: https://simonwillison.net/2026/Jul/25/boris-cherny/#atom-everything
    source: Simon Willison's Weblog
    category: tech_articles
  - title: The new rules of context engineering for Claude 5 generation models
    url: https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models
    source: Anthropic
    category: product_news
  - title: UK AISI / CAISI Preliminary Assessment of Kimi K3's Cyber Capabilities
    url: https://www.nist.gov/news-events/news/2026/07/uk-aisi-caisi-preliminary-assessment-kimi-k3s-cyber-capabilities
    source: NIST
    category: tech_articles
  - title: OpenAI statement on the Hugging Face incident
    url: https://rss.xcancel.com/OpenAI/status/2080815626113954288#m
    source: OpenAI / @OpenAI
    category: product_news
  - title: "Spec-driven development hasn't stuck: Kiro and GitHub Workflows both bet
      on it"
    url: https://rss.xcancel.com/GergelyOrosz/status/2080917955404062887#m
    source: Gergely Orosz / @GergelyOrosz
    category: community
  - title: Etched raises $300M Series C at a $10.3B valuation
    url: https://rss.xcancel.com/amasad/status/2080864869130416320#m
    source: Amjad Masad / @amasad
    category: community
highlights:
  - "Opus 5 posts an Epoch Capabilities Index of 159 against Fable 5's 161 at
    half the price, ties Fable on CursorBench (66.7 vs 66.5), and takes #1 on
    the Artificial Analysis intelligence leaderboard."
  - "CodeRabbit's bench: Opus 5 x-high gets 39.3% actionable precision vs a
    35.2% baseline, but catches 55.2% of known bugs vs 61.1%, and produces 92
    nitpicks vs 23."
  - "Cognition: FrontierCode grades merge-ability, and its scope verifier
    penalizes unprompted refactoring, which is why Opus 5 scores worse at higher
    reasoning effort."
  - Boris Cherny says Opus 5 is Anthropic's least prompt-injectable model yet,
    buried in the system card and absent from every leaderboard.
  - UK AISI and CAISI publish a joint capability trendline for U.S. vs PRC
    models pinned to Kimi K3's release.
---

Claude Opus 5 shipped yesterday at an Epoch Capabilities Index of 159, two points under Fable 5's 161, for half of Fable's price. Within about a day the coding-tool vendors had published four incompatible verdicts on what it's actually good at, which is a more useful signal than the headline number.

[AINews tracked the launch](https://news.smol.ai/issues/26-07-24-opus-5/) through the benchmark scrutiny and the first anecdotes: parity with Fable 5 on software-engineering benchmarks, an odd result where the model scored better at medium effort than at high effort on FrontierCode, and early praise for browser control and agentic tool use. Cursor put it at 66.7 on CursorBench against Fable 5's 66.5 at default effort, and noted it works with Zero Data Retention, which Fable does not. Cognition made it available in Devin the same afternoon, GitHub shipped it in Copilot, and by evening it sat at #1 on the Artificial Analysis intelligence leaderboard. Boris Cherny [pointed past the eval scores entirely](https://simonwillison.net/2026/Jul/25/boris-cherny/#atom-everything): "Opus 5 is our least prompt injectable model yet. It is a bit buried in the system card, but across PI evals and red teaming, Opus 5 is very hard to prompt inject successfully." If you run agents against untrusted web content, that sentence is worth more than two ECI points.

## CodeRabbit's numbers argue Opus 5 is a specialist, not an upgrade

[CodeRabbit put it on their code-review bench](https://coderabbit.ai/blog/opus-5-model-review), roughly 100 error patterns drawn from verified issues in real open-source pull requests, three runs per configuration, and came back with an awkward result. At x-high effort Opus 5 produced a cleaner actionable stream than their production baseline, 39.3% precision against 35.2%, while catching fewer of the known bugs, 55.2% against 61.1%. It generated 92 nitpicks where the baseline generated 23, and once you count every post-pipeline comment its precision drops below baseline, 28.6% against 32.8%. It also reads about 50% more and writes about 65% more per review call: roughly 60.5k input and 9.5k output tokens, against roughly 40.5k and 5.8k for the GPT-5.6 lanes doing the same job in the same runs.

The category breakdown is where the operational guidance lives. Opus 5 is strongest on configuration errors and code quality, weaker on logic errors and API misuse, and clearly weakest on race conditions. CodeRabbit's verdict is that it belongs as a precision lane inside a routed ensemble rather than as the safety net on a correctness-heavy change, and that it makes a better builder than reviewer: one of their engineers called it "less anxious" than earlier Opus models, with much better design judgment than 4.8 when coordinating hundreds of background agents, still slower and less efficient than Fable 5.

## The medium-beats-high anomaly is a scope penalty

Cognition, who build FrontierCode, [explained the inverted effort curve](https://rss.xcancel.com/cl571128/status/2080783750456311836#m). The benchmark grades merge-ability rather than correctness alone, and one of its verifiers is a scope criterion that penalizes modifications beyond what the task requires. They see the effect across every frontier model they evaluate; it is most pronounced in Opus 5, which at higher reasoning effort shows a stronger tendency to refactor code unprompted. Give the model more room to think and it starts rewriting things nobody asked it to rewrite. Whether that reads as a defect depends entirely on whether a human reviews the diff before it merges. On Cognition's own numbers Opus 5 scores 63.6% on FrontierCode 1.1 with a 69.6% pass rate on Extended, close to Fable 5 at half the cost, with particular strength on hard debugging and root-cause work.

Anthropic published [context-engineering guidance for the Claude 5 generation](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models) alongside the release. Per CodeRabbit's readout of what changed: effort is now the primary control, with thinking on by default and disable-able only at high effort or below; task and effort budgets can change per turn, mid-conversation, without invalidating the cache; and the context window moves to 1M tokens as both default and maximum, with performance claimed to hold across it. That last one is a direct answer to the 200k-token degradation CodeRabbit reported on Opus 4.8. The recommended shape is a complete task specification up front, longer autonomous sessions, and multi-agent writer-verifier patterns.

## Two governments put a number on Kimi K3's cyber capability

Away from the launch, UK AISI and CAISI published [a preliminary joint assessment of Kimi K3's cyber capabilities](https://www.nist.gov/news-events/news/2026/07/uk-aisi-caisi-preliminary-assessment-kimi-k3s-cyber-capabilities) through NIST, plotting aggregate capability of the most capable U.S. and PRC models over time with 95% confidence intervals, on a scale where a 400-point move means a 10x change in the odds of solving a task. Publishing a two-country capability trendline against a specific Chinese open-weight release is a new posture for both institutes, and it arrived days after a widely shared demonstration claiming [K3 found a working exploit in a current Redis server](https://twitter.com/fried_rice/status/2080059356322918777) reached 199 points on Hacker News.

OpenAI [broke its silence on the Hugging Face incident](https://rss.xcancel.com/OpenAI/status/2080815626113954288#m) with a holding statement: the review is ongoing with external advisors and oversight from its Safety and Security Committee, and a technical report is promised "in the coming weeks." The company calls the incident "unprecedented" and "an important moment for AI safety." What the statement omits is the interesting part. No cause, no scope, no date.

## Spec-driven development didn't stick, and nobody is quite sure why

Gergely Orosz [called it this morning](https://rss.xcancel.com/GergelyOrosz/status/2080917955404062887#m): AWS's Kiro and GitHub Workflows both bet on the write-the-spec-first shape, and it hasn't stuck, with a diagnosis from dexhorthy on why not. Read that against the Opus 5 guidance above, which recommends a complete task specification up front. The two aren't in conflict so much as operating at different timescales; a spec that lives for one agent session is a prompt, and a spec that lives for a quarter is a document somebody has to maintain. The tools bet on the second and practitioners keep reaching for the first.

On the silicon side, Etched raised $300M in Series C at a $10.3B valuation from Sequoia, Andreessen Horowitz, Jane Street, Argo, and SK Hynix, with the stated mission to "run the world's inference." Amjad Masad [flagged it](https://rss.xcancel.com/amasad/status/2080864869130416320#m) with a jab at the VCs who passed on the early rounds.

The number to watch here isn't the two-point ECI gap. It's whether "precision lane in a routed ensemble" becomes the normal way teams buy frontier models. CodeRabbit is already running GPT-5.6 Sol at the recall end and evaluating Opus 5 at the precision end inside one product. If that's the direction, the useful benchmark stops being which model ranks first and becomes which pair of models covers the other's misses.
