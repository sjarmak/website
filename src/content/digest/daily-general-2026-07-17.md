---
title: Kimi K3 Prices Like Sonnet, and Everyone Wants the Agent's Terminal
cadence: daily
track: general
origin: auto
date: 2026-07-17
summary: "Moonshot's Kimi K3 launches at Sonnet-tier pricing and tops the
  Frontend Code arena, days after xAI open-sourced its Grok Build CLI following
  a data-upload scandal. Meanwhile GitLab, JetBrains, and Vercel all push agent
  tooling deeper into the terminal and IDE in the same week, and two companies
  (Oak, Cloudflare) tackle the emerging problem of verifying who's really
  acting: a human or their agent."
topics:
  - model-releases
  - agent-tooling
  - security
  - dev-tools
  - funding
  - developer-identity
unresolvedFacets:
  - dev-tools
  - funding
  - developer-identity
audioUrl: /media/digests/daily-general-2026-07-17.mp3
durationSec: 606
items:
  - title: Kimi K3, and what we can still learn from the pelican benchmark
    url: https://simonwillison.net/2026/Jul/16/kimi-k3/
    source: Simon Willison's Weblog
    category: tech_articles
  - title: xai-org/grok-build, now open source
    url: https://simonwillison.net/2026/Jul/15/grok-build/
    source: Simon Willison's Weblog
    category: tech_articles
  - title: "RT by @swyx: Vercel welcomes Pete Hunt and Nick Schrock"
    url: https://rss.xcancel.com/swyx/status/2078004977294032991#m
    source: swyx / @swyx
    category: community
  - title: Bring GitLab Duo Agent Platform to your terminal
    url: https://about.gitlab.com/blog/gitlab-duo-cli-generally-available/
    source: GitLab Blog
    category: product_news
  - title: GitLab Duo Security Review spots logic flaws scanners miss
    url: https://about.gitlab.com/blog/gitlab-duo-security-review-flow/
    source: GitLab Blog
    category: product_news
  - title: When a version bump breaks your build, GitLab fixes it
    url: https://about.gitlab.com/blog/dependency-scanning-auto-remediation/
    source: GitLab Blog
    category: product_news
  - title: "WebStorm 2026.2: TypeScript 7 Support, GitHub Copilot Integration, Agent
      Skills, and More"
    url: https://blog.jetbrains.com/webstorm/2026/07/webstorm-2026-2/
    source: JetBrains Company Blog
    category: product_news
  - title: CLion 2026.2 Is Here
    url: https://blog.jetbrains.com/clion/2026/07/2026-2-release/
    source: JetBrains Company Blog
    category: product_news
  - title: "DataGrip 2026.2: AI Agent Skills, MCP Tools and CLI Commands for Data
      Source Management"
    url: https://blog.jetbrains.com/datagrip/2026/07/16/datagrip-2026-2-ai-agent-skills-mcp-tools-and-cli-commands-for-data-source-management-bundled-jdbc-drivers-and-improved-session-control/
    source: JetBrains Company Blog
    category: product_news
  - title: Backed by $60M in funding, Oak steps out of stealth to fix the identity
      mess that AI agents are making worse
    url: https://techcrunch.com/2026/07/15/backed-by-60m-in-funding-oak-steps-out-of-stealth-to-fix-the-identity-mess-that-ai-agents-are-making-worse/
    source: TechCrunch
    category: ai_dev
  - title: "Introducing Precursor: detecting agentic behavior with continuous
      client-side signals"
    url: https://blog.cloudflare.com/introducing-precursor/
    source: Cloudflare Blog
    category: ai_dev
  - title: "RT by @amasad: ~600 PRs merged in two weeks"
    url: https://rss.xcancel.com/ajaynayak/status/2077979183154872560#m
    source: Amjad Masad / @amasad
    category: community
  - title: Introducing Devin for Startups
    url: https://rss.xcancel.com/cognition/status/2077821585252028849#m
    source: Cognition / @cognition
    category: product_news
highlights:
  - Kimi K3 launches at Sonnet-tier pricing ($3/$15 per million tokens) and tops
    Arena.ai's Frontend Code arena, beating Claude Fable 5
  - xAI open-sources the entire Grok Build CLI harness after last week's
    data-upload scandal, but leaves the upload code path in place, just disabled
  - GitLab, JetBrains, and Vercel all push agent tooling deeper into the
    terminal and IDE in the same release week
  - Oak ($60M) and Cloudflare's Precursor both tackle verifying who's really
    acting when an agent holds a human's credentials
---

Moonshot AI shipped Kimi K3 yesterday: 2.8 trillion parameters, priced at $3 per million input tokens and $15 per million output, the same tier as Anthropic's Sonnet line and the most expensive model any Chinese lab has released. It's already the top-ranked model on Arena.ai's Frontend Code arena, ahead of Claude Fable 5, and Artificial Analysis measured its long-horizon knowledge-work Elo at 1547, a 732-point jump over Kimi K2.6 and second only to Fable 5 itself. Open weights land by July 27; until then it's API-only, through Moonshot directly or via OpenRouter. Simon Willison's pelican-on-a-bicycle test has drifted away from meaning much about model quality, but it still surfaced something real here: K3 ships with a single "max" reasoning effort, and burned 13,241 reasoning tokens answering a five-word prompt, a 25-cent bicycle. Whatever Moonshot optimized K3 for, cheap inference wasn't it.

That announcement landed two days after xAI's Grok Build CLI was caught uploading users' entire working directories, SSH keys and password managers included, to a Google Cloud bucket. xAI's response, out July 15: open-source the whole harness under Apache 2.0 (844,530 lines of Rust, in the same ballpark as OpenAI's 950,933-line Codex CLI), delete the retained data, and turn upload off by default. The code path that did the uploading is still sitting in the repo, just disabled. Whether "we open-sourced it" earns back the trust the original silent upload cost them is still an open question.

The fight over who owns the layer underneath these models is showing up everywhere else in developer tools too. GitLab used its 19.2 release to push agentic AI past the editor: GitLab Duo CLI is now generally available, bringing the same agentic chat that lives in the browser into the terminal, with interactive and headless modes and one shared session across CLI, web UI, and editor extensions. In the same window GitLab shipped a Security Review Flow aimed at logic flaws static scanners can't pattern-match, plus dependency auto-remediation for the version bumps that break builds — relevant given a 2025 Maven study GitLab cites, which found vulnerabilities reaching 63% of releases through transitive dependencies versus 31% through direct ones. Three posts, one argument: agentic tooling stalled at "edit this file," and GitLab wants the rest of the delivery lifecycle before someone else takes it.

JetBrains made the same case from the IDE side. WebStorm 2026.2 ships a native GitHub Copilot integration and an agent skills manager that lets you install reusable stack knowledge once and keep it across sessions, including skills imported from existing Claude Code or Codex setups. CLion 2026.2 bundles a debugger skill built specifically for AI agents. DataGrip 2026.2 adds three agent skills for database work, plus MCP tools so agents can explore and query connected data sources directly. Three flagship IDEs, one release week, the same bet: the IDE's job now includes being legible to an agent, not just to the person typing.

Vercel made the identical bet from a third angle, hiring two of web development's most recognizable names on the same day. Pete Hunt, who evangelized React inside Meta and helped power Instagram Web with it, will run Frameworks and lead Next.js. Nick Schrock, GraphQL's co-inventor, is joining to work on what Guillermo Rauch is calling Agentic Developer Experience. swyx's reaction on X, "the react avengers have assembled," spread faster than Vercel's own announcement. Read next to GitLab and JetBrains, it's the same land grab from yet another direction: the tooling underneath coding agents, not the models sitting on top of them, is where the competition is actually happening right now.

The identity problem underneath all of it got its own news cycle. Oak came out of stealth on $60 million to fix, in TechCrunch's framing, "the identity mess that AI agents are making worse," the same week Cloudflare shipped Precursor, which detects agentic behavior from continuous client-side signals instead of relying on user-agent strings that any agent can fake. Different companies are attacking adjacent slices of the same problem: once an agent can act using a human's credentials, "who is this" stops being a question you answer once at login and becomes one you have to keep asking.

Replit's Amjad Masad posted that his team merged roughly 600 PRs in two weeks running agent loops in production, calling it "the most fun I've had in years" — a real data point on what agentic development looks like once it's off the demo stage. Cognition is chasing the same adoption curve from the funding side, offering startups $65,000 in Devin credits across Cloud, Desktop, and CLI, betting that free usage now buys default choice before teams settle into a coding agent out of habit. Watch whether Kimi K3's open weights, due July 27, undercut frontier pricing once they're actually in anyone's hands, and whether GitLab, JetBrains, or Vercel's push into the terminal produces a real winner before the next model release resets the conversation again.
