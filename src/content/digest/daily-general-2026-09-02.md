---
title: Fable 5.1 cuts cached tokens 4x, and OpenAI pre-announces a Critical
  cyber threshold
cadence: daily
track: general
origin: auto
date: 2026-09-02
summary: "Anthropic shipped Claude Fable 5.1 and Mythos 5.1 yesterday evening,
  and every harness vendor reported back the same night: Cursor at 73.4% on
  CursorBench 3.2, Amp running it unattended for hours, and Devin 54% cheaper on
  a 4x cached-token price cut. OpenAI published Path to Astra, pre-announcing
  the first model to cross the Critical cybersecurity threshold in its
  Preparedness Framework. Against that, MultiNet 2.0 put frontier reasoning
  models in trivial 2D mazes and got 6 solves out of 150 runs."
topics:
  - model-releases
  - agent-tooling
  - inference-economics
  - benchmarks
  - ai-safety
  - code-review
audioUrl: /media/digests/daily-general-2026-09-02.mp3
durationSec: 720
items:
  - title: Claude Fable 5.1 and Claude Mythos 5.1
    url: https://www.anthropic.com/claude-fable-and-mythos-5-1
    source: Anthropic
    category: product_news
  - title: "Path to Astra: critical capabilities and frontier safeguards"
    url: https://openai.com/index/path-to-astra
    source: OpenAI News
    category: product_news
  - title: The efficient frontier of LLM inference
    url: https://www.baseten.co/blog/the-efficient-frontier-of-llm-inference/
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: Copilot code review can now approve pull requests
    url: https://github.blog/changelog/2026-09-01-copilot-code-review-can-now-approve-pull-requests
    source: Changelogs – The GitHub Blog
    category: product_news
  - title: OpenClaw 2.0 Releases with Simplified Setup and Collaborative Agents
    url: https://www.infoq.com/news/2026/09/openclaw-2-release/
    source: InfoQ
    category: tech_articles
  - title: I used Fable to rewrite 65kLoC of Go in Rust. It cost $400
    url: https://iurii.net/en/blog/posts/software-engineering/i-used-fable-to-rewrite-65kloc-to-rust/
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: We put frontier reasoning models in simple 2D mazes. They solved 6/150.
    url: https://www.reddit.com/r/LLMDevs/comments/1w4h8f8/we_put_frontier_reasoning_models_in_simple_2d/
    source: LLMDevs
    category: community
  - title: Agentic video understanding comes to Gemini Flash models, using up to 88%
      fewer tokens
    url: https://rss.xcancel.com/GoogleDeepMind/status/2094840179676660097#m
    source: Google DeepMind / @GoogleDeepMind
    category: product_news
  - title: Codex bundles LibreOffice
    url: https://simonwillison.net/2026/Sep/1/codex-libreoffice/
    source: Simon Willison's Weblog
    category: tech_articles
highlights:
  - Fable 5.1 cut cached-token price 4x; since >95% of coding-task tokens are
    cache reads, Devin's cost dropped 54% even though uncached prices rose.
  - Cursor scored Fable 5.1 at 73.4% on CursorBench 3.2 at max effort, its
    highest recorded, citing self-verification.
  - OpenAI's Path to Astra pre-announces the first model to meet the Critical
    cybersecurity threshold under its Preparedness Framework, ahead of release.
  - Copilot code review can now approve pull requests (public preview, off by
    default), with approval assessments appearing in every review regardless.
  - "MultiNet 2.0: frontier reasoning models solved 6 of 150 runs in 2D mazes
    that are trivial for humans."
  - A 65kLoC Go-to-Rust rewrite driven by Fable cost $400.
---

Cognition put a price on Claude Fable 5.1 within hours of the launch: cached tokens got 4x cheaper, and because more than 95% of the tokens in a real coding task are cache reads, Fable-level intelligence inside Devin now costs 54% less than it did the day before, undercutting Opus even though the uncached prices went up. Anthropic shipped [Claude Fable 5.1 and Claude Mythos 5.1](https://www.anthropic.com/claude-fable-and-mythos-5-1) around 18:00 UTC on September 1, and by the end of the evening the harness vendors had all published their own numbers.

Cursor measured it at 73.4% on CursorBench 3.2 at max effort, the highest score it has recorded, and singled out self-verification as the thing that changed: the model checks its own work well enough to carry a hard task start to finish. Amp moved it into ultra mode and described the same property in operational terms, with runs going for hours unattended. Told that key presses felt laggy in their iOS app, it came back two hours later with a side-by-side video of the old and new builds typing the same sentence in a simulator. Cognition's Fusion harness, which pairs a frontier planner with a cheap executor, now matches standalone Fable 5.1 on FrontierCode at 47% lower cost. AWS listed the model on the same day. The Hacker News thread ran past 490 comments. Simon Willison [got his best SVG pelican](https://rss.xcancel.com/simonw/status/2094938927727804684#m) out of any Anthropic model at Max thinking level, and paid $3.30 for it, which is the counterweight to all the cost-reduction talk: the cache discount is real, and max-effort single shots are still expensive.

OpenAI spent the same day on a different problem. [Path to Astra](https://openai.com/index/path-to-astra) documents the first OpenAI model to meet the Critical cybersecurity capability threshold under its Preparedness Framework, published ahead of the model's release rather than alongside it. The interesting part is procedural. A lab is now pre-announcing that an unreleased model crosses its own top-severity line in offensive security, and describing the safeguards before anyone can test the claim. Whether the safeguards hold is an empirical question nobody outside OpenAI can answer yet, and it will be worth watching who gets access to try.

Baseten's [efficient frontier of LLM inference](https://www.baseten.co/blog/the-efficient-frontier-of-llm-inference/) landed on the HN front page the same night, and reads as the technical companion to the Devin pricing note. The economics of running these models are being renegotiated at the cache and batching layer rather than at the parameter count, which is why a caching change moved Devin's cost more than any model swap this year did.

Two items on what agents are allowed to do without a human. GitHub shipped [Copilot code review approving pull requests](https://github.blog/changelog/2026-09-01-copilot-code-review-can-now-approve-pull-requests), in public preview across Pro through Enterprise. Every review now carries an approval assessment in the overview comment, and admins can authorize Copilot to actually sign off. It is off by default and configurable per enterprise, org, and repo, which is the right default, though the assessment showing up in every review normalizes the judgment well before anyone flips the switch. Separately, [OpenClaw 2.0](https://www.infoq.com/news/2026/09/openclaw-2-release/) rewrote installation, browser interface, memory, skills, automations, plugins, security, and collaboration in one release. The project went viral in late August with a maintainer burden to match; a 2.0 that touches every subsystem at once is a bet that the surge is durable.

The most useful field report of the day is a cost receipt. Someone [rewrote 65,000 lines of Go into Rust using Fable](https://iurii.net/en/blog/posts/software-engineering/i-used-fable-to-rewrite-65kloc-to-rust/) and spent $400 doing it. Two years ago the interesting number in a port like that was whether it compiled. Now it is the dollar figure, and $400 for 65kLoC across two languages with different memory models is cheap enough that the decision stops being about budget and starts being about whether anyone can review the output.

Counterweight, from the same window: MultiNet 2.0 [put frontier reasoning models in 2D mazes](https://www.reddit.com/r/LLMDevs/comments/1w4h8f8/we_put_frontier_reasoning_models_in_simple_2d/) and got 6 solves out of 150 runs. The mazes are trivial for a person. What they require is perceiving, acting, and tracking progress across many steps, and that loop is where the models fall apart. Set that beside Amp's two-hour unattended runs and the picture is narrow rather than contradictory: long-horizon competence in a codebase, with files and tests and compiler errors as external state, does not transfer to long-horizon competence in a bare interactive environment where the model has to hold the state itself.

Google DeepMind brought [agentic video understanding](https://rss.xcancel.com/GoogleDeepMind/status/2094840179676660097#m) to Gemini 3.7 Flash, 3.6 Flash, and 3.5 Flash-Lite, with the model reasoning across transcript, audio, and frames and adjusting frame rate to pull only the moments it needs, for up to 88% fewer tokens on long recordings. And Simon Willison found that the ChatGPT desktop app, formerly Codex, [ships a full headless LibreOffice](https://simonwillison.net/2026/Sep/1/codex-libreoffice/) inside a 1.7GB runtime in `~/.cache`, alongside full Python and Node installs plus Poppler and git binaries, with skills that tell the agent how to invoke them. That is a coding agent acquiring a document-processing toolchain on the client, and it tells you where OpenAI thinks the work happens.

The thing to watch this week is whether the Fable cache discount holds its shape once uncached-heavy workloads hit it. Devin's 54% assumes the 95% cache-read ratio of an established coding session. Agents that read broadly and cache poorly, which is most retrieval-heavy work, may find the new pricing worse than the old.
