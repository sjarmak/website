---
title: The day the US government switched off Fable 5
cadence: daily
track: general
origin: auto
date: 2026-06-13
summary: "An overnight US export-control directive forced Anthropic to disable
  Fable 5 and Mythos 5 for every customer, and Devin, Cosmos, and Replit
  scrambled to fall back to Opus 4.8. Around it: Xiaomi's open-weights MiMo Code
  claiming 200-plus-step coherence, GitHub's production numbers on smarter
  subagent delegation, WebMCP entering Chrome origin trials, and Semgrep on
  benchmarking AI vuln detection."
topics:
  - model-releases
  - ai-policy
  - agent-tooling
  - open-weights
  - web-standards
  - security-tooling
audioUrl: /media/digests/daily-general-2026-06-13.mp3
durationSec: 503
items:
  - title: US government export-control directive forces Anthropic to suspend Fable
      5 and Mythos 5
    url: https://rss.xcancel.com/AnthropicAI/status/2065597531644743999#m
    source: Anthropic / @AnthropicAI
    category: product_news
  - title: Xiaomi's open-source MiMo Code claims to beat Claude Code on 200+ step
      tasks
    url: https://venturebeat.com/technology/xiaomis-new-open-source-agentic-ai-coding-harness-mimo-code-beats-claude-code-at-ultra-long-200-step-tasks
    source: VentureBeat
    category: ai_dev
  - title: How we made GitHub Copilot CLI more selective about delegation
    url: https://github.blog/ai-and-ml/how-we-made-github-copilot-cli-more-selective-about-delegation/
    source: The GitHub Blog
    category: product_news
  - title: WebMCP standard proposal for agentic web actuation now in Chrome origin
      trials
    url: https://www.infoq.com/news/2026/06/webmcp-web-agent-standard-chrome/
    source: InfoQ
    category: tech_articles
  - title: "3.5x more true positives: how we benchmark AI-powered detection"
    url: https://semgrep.dev/blog/2026/35x-more-true-positives-how-we-benchmark-ai-powered-detection
    source: Semgrep Blog
    category: product_news
  - title: "The Future Codebase: after the PR and code review die, does Git need to
      die next?"
    url: https://rss.xcancel.com/swyx/status/2065559864559145420#m
    source: swyx / @swyx
    category: community
  - title: Replit's Amjad Masad refuses to build a token-consumption leaderboard
    url: https://rss.xcancel.com/amasad/status/2065597793998422308#m
    source: Amjad Masad / @amasad
    category: community
highlights:
  - A US export-control directive citing national security forced Anthropic to
    disable Fable 5 and Mythos 5 for every customer overnight; Devin, Augment's
    Cosmos, and Replit fell back to Opus 4.8 within hours.
  - GitHub's smarter subagent delegation cut tool failures per session 23% and
    P95 wait time 5% in production, with no quality regression — the win came
    from the main agent delegating less, not faster model calls.
  - Xiaomi shipped open-weights MiMo Code claiming it beats Claude Code on 200+
    step tasks, and WebMCP entered Chrome 149 origin trials to replace DOM
    scraping with site-declared agent tools.
---

Just after midnight Pacific, Anthropic disabled Claude Fable 5 and Mythos 5 for every customer on earth. Simon Willison had a script hitting the API every minute to measure how long he'd keep access; it cut out, and he posted the timestamp. The reason, per [Anthropic's own statement](https://rss.xcancel.com/AnthropicAI/status/2065597531644743999#m), is an export-control directive: the US government, citing national security authorities, ordered access suspended for any foreign national, inside or outside the country, including Anthropic's own foreign-national employees. Compliance meant pulling the models for everyone rather than building per-user gating overnight. "We believe this is a misunderstanding and are working to restore access as soon as possible," the company wrote.

The downstream scramble told you how deep these models had already gotten into production. Within two hours [Cognition removed Fable 5 from Devin](https://rss.xcancel.com/cognition/status/2065466791430615516#m), keeping Opus 4.8 and GPT-5.5 in the picker. [Augment Code pulled it from Cosmos](https://rss.xcancel.com/augmentcode/status/2065619637342203947#m) and silently failed pre-configured sessions back to Opus 4.8 at Opus pricing. Replit followed. Reddit's coding subs filled with memorial threads, refund requests, and refrains of "RIP" inside a single overnight window for a model that had been generally available for three days. Two questions hang over the next week and neither is answered yet: whether "misunderstanding" means this gets walked back fast, and what it signals to every non-US shop that a frontier vendor's flagship can vanish on a government's say-so. Gergely Orosz already drew the line in public: suddenly the investment in non-US labs "doesn't look all that wasted."

That second question is the backdrop for the day's other launch. VentureBeat reports Xiaomi shipped [MiMo Code](https://venturebeat.com/technology/xiaomis-new-open-source-agentic-ai-coding-harness-mimo-code-beats-claude-code-at-ultra-long-200-step-tasks), an open-source agentic coding harness with weights, that it claims beats Claude Code on ultra-long tasks of 200-plus steps. The number to watch there is horizon length, not a single SWE-bench point: long-horizon planning is exactly where most harnesses degrade, looping or losing the thread past a few dozen steps, and an open release that holds coherence over 200 is the kind of thing teams fork rather than admire. Pair it with the access shock above and the open-weights pitch writes itself for anyone who can't bet their roadmap on a single American API.

On the harness-engineering side, GitHub published real numbers on a problem every agent builder is hitting: when to delegate to a subagent and when not to. Their post on [smarter subagent delegation in Copilot CLI](https://github.blog/ai-and-ml/how-we-made-github-copilot-cli-more-selective-about-delegation/) is refreshingly concrete. Eager delegation was spinning up exploration agents for tasks the main agent already had context to finish, then idling while subagents re-searched the repo and tripped over stale file paths. The fix was a tighter orchestration policy: start with the narrowest effective path, escalate only when complexity creates real leverage, and treat subagents as a parallelism tool rather than a pause button. In a production A/B test that cut tool failures per session 23%, search-tool failures 27%, and P95 wait time 5%, with no quality regression. The lesson generalizes past Copilot: more agents is not better orchestration, and the win came from the main agent doing less handing-off, not from faster model calls.

Google moved the agent story in a different direction. WebMCP is [entering origin trials in Chrome 149](https://www.infoq.com/news/2026/06/webmcp-web-agent-standard-chrome/), a proposed standard that lets a site expose tools, JavaScript functions and HTML forms, directly to in-browser AI agents. The point is to kill DOM scraping and screenshot-reading as the way agents act on the web. Instead of guessing at a checkout button's selector, an agent calls a declared tool the site author published. It's the browser-native cousin of MCP, and if it sticks it reshapes how web automation gets built, away from brittle Playwright-style scripts and toward sites advertising their own agent surface. Origin trials are early, but a shipping Chrome flag is a stronger signal than another spec doc.

Security tooling got a useful reality check from Semgrep, which published [how it benchmarks AI-powered vulnerability detection](https://semgrep.dev/blog/2026/35x-more-true-positives-how-we-benchmark-ai-powered-detection) and what current models actually score. Their headline is 3.5x more true positives over their prior approach, but the more valuable part for practitioners is the methodology: how they separate real findings from the confident-but-wrong noise that makes most "AI found a vuln" claims useless in a CI gate. If you're evaluating an AI scanner, the false-positive denominator is the number that decides whether your engineers start ignoring the tool by week two.

Two voices worth reading framed where the work is heading. swyx floated a deliberately provocative thesis: after the PR dies and code review dies, [maybe Git needs to die next](https://rss.xcancel.com/swyx/status/2065559864559145420#m), with 20-40% of code spend going to merge-conflict management that he argues is cargo-culted from a pre-agent workflow. Humans collaborating on a Notion or Linear doc don't do line-by-line merges; the future codebase, in his telling, might look more like a database than a tree of .git objects, less efficient but more scalable. You don't have to buy it to notice version control is one of the few parts of the stack agents haven't reorganized yet. And Replit's Amjad Masad used the moment to [refuse a token-consumption leaderboard](https://rss.xcancel.com/amasad/status/2065597793998422308#m) enterprise customers had asked for, arguing the "tokenmaxxing" craze rewards burning tokens over shipping outcomes. With the field still digesting last week's DeepSeek-versus-Anthropic token-volume numbers, a vendor publicly declining to optimize for tokens is its own data point.

What to watch: whether Anthropic restores Fable and Mythos in days or whether the export-control framing hardens into something durable. The first outcome is a logistics hiccup. The second changes how anyone outside the US sources frontier capability, and MiMo Code won't be the last open-weights release positioned to catch that.
