---
title: Grok 4.5 Ships as Cursor's First General-Purpose Model, and OpenAI
  Retracts SWE-Bench Pro
cadence: daily
track: general
origin: auto
date: 2026-07-09
summary: Cursor's parent SpaceXAI shipped Grok 4.5, its first model built for
  more than coding, while OpenAI retracted its own recommendation of SWE-Bench
  Pro after an audit found the eval saturated at a 70% noise ceiling. OpenAI
  also rolled out its full-duplex GPT-Live voice model, Anthropic and AE Studio
  published GRAM, a method for making dual-use knowledge deletable from models,
  and a $165k Claude API bill for porting Bun from Zig to Rust sparked debate
  over how to judge agentic rewrites.
topics:
  - model-releases
  - agent-tooling
  - benchmarks
  - ai-safety
  - vector-databases
unresolvedFacets:
  - vector-databases
audioUrl: /media/digests/daily-general-2026-07-09.mp3
durationSec: 539
items:
  - title: Grok 4.5 and Composer are two different model weight classes
    url: https://rss.xcancel.com/cursor_ai/status/2074915748544217188#m
    source: Cursor / @cursor_ai
    category: product_news
  - title: Separating signal from noise in coding evaluations
    url: https://openai.com/index/separating-signal-from-noise-coding-evaluations
    source: OpenAI News
    category: product_news
  - title: Introducing GPT-Live, a new generation of voice models
    url: https://rss.xcancel.com/OpenAI/status/2074907025537224840#m
    source: OpenAI / @OpenAI
    category: product_news
  - title: "Anthropic published research on GRAM: a technique to surgically remove
      dangerous knowledge from AI models at the weight level"
    url: https://www.reddit.com/r/ClaudeCode/comments/1urb8vk/anthropic_published_research_on_gram_a_technique/
    source: ClaudeCode
    category: community
  - title: Rewriting Bun in Rust
    url: https://bun.com/blog/bun-in-rust
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: Codex as agent provider and agentic enhancements in JetBrains IDEs
    url: https://github.blog/changelog/2026-07-07-codex-as-agent-provider-and-agentic-enhancements-in-jetbrains-ides
    source: Changelogs – The GitHub Blog
    category: product_news
  - title: Elastic's benchmark claims Qdrant is 7x slower on disk search
    url: https://x.com/qdrant_engine/status/2074892724462026919
    source: Qdrant(@qdrant_engine)
    category: product_news
  - title: AI Costs Are Surging and the Cheap Model Fix Might Not Last
    url: https://podcasters.spotify.com/pod/show/nlw/episodes/AI-Costs-Are-Surging-and-the-Cheap-Model-Fix-Might-Not-Last-e3lr0u0
    source: The AI Daily Brief
    category: podcasts
highlights:
  - OpenAI retracted its recommendation of SWE-Bench Pro after an audit found it
    saturated at a ~70% noise ceiling
  - Cursor/SpaceXAI shipped Grok 4.5, its first model built for more than
    software engineering
  - Anthropic and AE Studio's GRAM method makes dual-use model knowledge
    deletable without hurting general performance
  - A $165k Claude API bill to port Bun from Zig to Rust reignited debate over
    how to judge agentic rewrites
---

Cursor's own account settled the confusion within hours of shipping Grok 4.5: "Grok 4.5 and Composer are two different model weight classes. Composer 2.5 will remain offered, and we will release new models of this size going forward." The distinction mattered because Grok 4.5 is the first model Cursor has built with parent SpaceXAI for something other than software engineering, the first Opus-class release since the Cursor acquisition, and the obvious question was whether it would replace Composer inside the editor. It won't; the two lines serve different jobs. Cursor is running double usage on Grok 4.5 for its first week, and an independent build-off from tryai.dev put Grok 4.5, GPT-5.5, and Claude through identical app-building tasks the same day, the kind of head-to-head practitioners actually want before defaulting to a new model rather than another vendor's benchmark slide.

Speaking of benchmark slides: the bigger story for anyone evaluating coding agents is that OpenAI retracted its own recommendation. The company audited SWE-Bench Pro, one of the most cited coding evals, using model-based investigator agents alongside five independent human software engineers, and concluded the eval is saturated at roughly a 70% noise ceiling. A meaningful share of the "failed" tasks turn out to be correct solutions tripped up by hidden requirements, contradictory instructions, overly strict tests, or incomplete grading criteria, and OpenAI is now retracting its prior guidance that the field treat SWE-Bench Pro as a leading measure of frontier coding capability. Any model comparison built on those numbers needs a second look, and the audit itself, model agents plus human reviewers working in tandem, is probably a more durable takeaway than the specific score it produced.

OpenAI also shipped GPT-Live, its new voice model, fully rolled out to ChatGPT Go, Plus, and Pro plans with free-tier access following. The model runs on a full-duplex architecture, meaning it listens and speaks at the same time rather than taking strict turns, which OpenAI says improves back-and-forth pacing, timing, and live translation. For anything requiring web search or heavier reasoning, GPT-Live delegates to OpenAI's frontier model behind the scenes and folds the result back into the conversation, an architecture choice that answers the "how do you keep a voice model fast without making it dumb" question other labs have been dodging.

On the safety-research side, Anthropic and AE Studio published GRAM, Gradient-Routed Auxiliary Modules, a training method that isolates dual-use knowledge such as virology or cybersecurity into dedicated, deletable modules during pretraining rather than trying to suppress it after the fact through refusal training. A single training run produces sixteen configurations, on or off across four dual-use categories, and deleting a module matches the performance of never having trained on that data at all while leaving general capability untouched. The effect held from 50M to 5B parameters and got stronger with scale, and unlike post-hoc unlearning, it resisted recovery through fine-tuning. Anthropic is upfront that this hasn't been tested at frontier scale or shipped in any Claude model, and some dual-use capabilities may be too entangled with general knowledge to cleanly separate, but the core idea, that some knowledge should be architecturally removable rather than merely discouraged, is the kind of research that tends to show up in production models eighteen months after nobody's watching for it.

Meanwhile the actual cost of large-scale agentic coding got a rare public number attached to it. Bun's team wrote up rewriting the JavaScript runtime from Zig to Rust, and the figure that circulated alongside it, $165,000 in Claude API spend to port the codebase, drew a pointed response from Replit's Amjad Masad: "When do we stop comparing autonomous agents to hand-written code? You don't see compilers comparing to engineers hand-writing assembly." That's a fair challenge to the instinct to measure agentic rewrites against a hypothetical hand-written baseline instead of against what the rewrite actually buys a team, but $165,000 is also a real number a lot of engineering leads will want to sit with before greenlighting their own agent-driven rewrite.

The IDE layer kept consolidating around agents this week too. GitHub shipped its June VS Code Copilot roundup (versions 1.123 through 1.127), covering a smarter integrated browser, parallel agent sessions, and better usage visibility, while Codex landed as a new agent provider inside JetBrains IDEs in public preview, alongside expanded Hooks support and richer MCP server management. GitKraken separately shipped GitLens 18.2 with AI-assisted merge conflict resolution for VS Code. None of these individually is a headline, but together they mark editors settling into "pick your agent provider" as a standard menu item rather than a differentiator.

Smaller but worth knowing if you're choosing a vector database: Elastic published a benchmark claiming Qdrant runs 7x slower on disk-based vector search, and Qdrant pushed back hard, saying Elastic never enabled the two features Qdrant built specifically for that workload. With them on, Qdrant says it gets 2x the throughput, half the latency, and a third of the compute on the same network-attached storage setup Elastic tested against. Vendor benchmark disputes are their own genre at this point, but the underlying lesson, that "default configuration" benchmarks routinely understate a system's real performance, applies well beyond vector search.

Watch two threads out of today: whether China follows through on tightening overseas access to its open-weight models, the subject of this episode of The AI Daily Brief, which would remove the cheap-open-weight escape valve a lot of teams have been relying on to manage token costs; and whether other labs follow OpenAI's lead in publicly retracting a benchmark rather than letting it lose relevance without comment.
