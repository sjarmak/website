---
title: Appeals court upholds Anthropic supply chain risk ruling as Akamai signs
  $11.6B compute deal
cadence: daily
track: general
origin: auto
date: 2026-09-26
summary: A U.S. appeals court upheld the Pentagon's supply chain risk
  designation of Anthropic on the same day Akamai announced an $11.6 billion,
  seven-year CPU capacity deal with the lab. Docker shipped Cloud Sandboxes for
  24-hour agent runs, Devin and GitHub Copilot both moved deeper into Teams and
  Slack, and two arXiv papers plus InfoQ converged on the agent harness as the
  unit of cost. Community posts measured a 1.4x faster Claude meter drain in a
  weekday UTC band and found code-index tools save far less than they claim.
topics:
  - policy-and-regulation
  - infrastructure
  - model-releases
  - agent-tooling
  - agent-harness
  - benchmarks
  - usage-limits
unresolvedFacets:
  - policy-and-regulation
audioUrl: /media/digests/daily-general-2026-09-26.mp3
durationSec: 786
items:
  - title: U.S. appeals court upholds designation of Anthropic as supply chain risk
    url: https://www.cnbc.com/2026/09/25/pentagon-anthropic-ai-risk-appeals-court.html
    source: CNBC via Hacker News
    category: tech_articles
  - title: Akamai announces $11.6 billion multi-year agreement with Anthropic
    url: https://www.akamai.com/newsroom/press-release/akamai-announces-11-6-billion-multi-year-agreement-with-anthropic-to-support-growing-demand
    source: Akamai via TLDR
    category: newsletters
  - title: "[AINews] The Future of Latent Space"
    url: https://www.latent.space/p/ainews-the-future-of-latent-space
    source: Latent Space
    category: newsletters
  - title: "Introducing Docker Cloud Sandboxes: start on your laptop, finish in the
      cloud"
    url: https://www.docker.com/blog/introducing-cloud-sandboxes-start-on-your-laptop-finish-in-the-cloud/
    source: Docker via TLDR
    category: newsletters
  - title: Devin now works across Microsoft Teams and Microsoft 365
    url: https://devin.ai/blog/microsoft-teams-and-microsoft-365
    source: Cognition via TLDR
    category: newsletters
  - title: Updates to GitHub Copilot for Slack and Microsoft Teams
    url: https://github.blog/changelog/2026-09-25-updates-to-github-copilot-for-slack-and-microsoft-teams
    source: GitHub Changelog
    category: product_news
  - title: "Control the Harness, Control the Cost: Routing and Governing AI Coding
      Agents in the Enterprise"
    url: https://arxiv.org/abs/2609.28919
    source: arXiv cs.AI
    category: research
  - title: "Grow the Harness, Not the Context: From Strategy-Free Scaffolds to
      Reusable Specialist Agents"
    url: https://arxiv.org/abs/2609.26760
    source: arXiv cs.SE
    category: research
  - title: Agents can now set up your website's security with Turnstile Spin
    url: https://blog.cloudflare.com/turnstile-spin/
    source: Cloudflare Blog
    category: product_news
  - title: I measured the Claude 5-hour meter around the clock. It drains 1.4x
      faster from 12:00 to 18:00 UTC on weekdays.
    url: https://www.reddit.com/r/ClaudeCode/comments/1wpv1gz/i_measured_the_claude_5hour_meter_around_the/
    source: r/ClaudeCode
    category: community
  - title: "I benchmarked repowise, CodeGraph, Serena, Graphify, code-review-graph,
      cocoindex and codebase-memory-mcp: the 60-90% token-saving claims didn't
      hold up"
    url: https://www.reddit.com/r/LLMDevs/comments/1wp1szf/i_benchmarked_repowise_codegraph_serena_graphify/
    source: r/LLMDevs
    category: community
highlights:
  - Appeals court upholds DoD supply chain risk designation of Anthropic; bars
    Pentagon business partners from using Claude, further appeal likely
  - Akamai signs $11.6B seven-year CPU capacity deal with Anthropic, expandable
    to $20B, with a warrant for up to 5% of Akamai stock
  - Opus 5.5 leads SimpleBench at 88.4%; Terminal-Bench-Science peaks at xhigh
    effort (62%) and drops at max (59%)
  - "Docker Cloud Sandboxes: 24-hour microVM agent runs, one-command
    laptop-to-cloud handoff, $0.07 to $1.12 per hour"
  - "Two arXiv harness papers: routing recovers 14 to 21% of enterprise model
    spend; learned harnesses cut LLM calls 76 to 92%"
  - Controlled measurement finds the Claude 5-hour meter drains 1.4x faster on
    weekdays 12:00 to 18:00 UTC
---

A U.S. appeals court panel on September 25 upheld the Department of Defense's designation of Anthropic as a supply chain risk, which bars any company doing business with the Pentagon from using Claude in that work. [CNBC's report](https://www.cnbc.com/2026/09/25/pentagon-anthropic-ai-risk-appeals-court.html) drew 173 points and 212 comments on Hacker News within hours, and the thread is where the mechanics got argued out. The designation traces back to contract negotiations in which Anthropic insisted on terms blocking autonomous military use without human oversight; the DoD rejected the terms and reached for 41 U.S.C. § 4713, the procurement statute that lets it declare a supply chain risk on an "exigency" finding. Anthropic's position is that a vendor setting license terms is ordinary commerce, not sabotage. The panel read the statute broadly enough to cover a vendor whose conditions might be exercised later, the judges were not unanimous, and further appeal looks likely. For anyone selling into the defense supply chain, or building on Claude and selling to someone who does, the practical question is whether "doing business with the DoD" reaches subcontractors two hops out. The ruling does not settle that, and the comment thread is split on it.

The same day, Anthropic's infrastructure story went the other direction. [Akamai announced an $11.6 billion, seven-year agreement](https://www.akamai.com/newsroom/press-release/akamai-announces-11-6-billion-multi-year-agreement-with-anthropic-to-support-growing-demand) to supply Anthropic with distributed CPU capacity across its points of presence, expandable to $20 billion, with about $5.5 billion in capital expenditure on Akamai's side and $1.7 billion of that landing in 2026 for supply chain components and memory. The deal comes with a warrant for up to 5 percent of Akamai's common stock, roughly 7.7 million shares at $111.33, with 2 percent vesting now and the rest tied to expansion. Read the two stories together: a lab locked out of one of the largest procurement channels in the country is simultaneously signing one of the largest edge-compute commitments a CDN has ever taken on. The CPU-not-GPU framing is the part worth watching, since it suggests a lot of inference-adjacent work (routing, caching, tool execution, classifiers like Jev) is being pushed toward the edge rather than onto accelerator clusters.

Swyx's [AINews issue for the day](https://www.latent.space/p/ainews-the-future-of-latent-space) calls it a quiet day and uses the space for housekeeping, but the recap carries the sharpest benchmark numbers of the week on the Opus 5.5 rollout. Opus 5.5 now leads SimpleBench at 88.4 percent. On Terminal-Bench-Science it climbs from 24 percent at low reasoning effort to 62 percent at xhigh, then drops to 59 percent at max, and Theo's advice to avoid "max" because it imposes a minimum reasoning budget is the kind of thing that changes a config file. GPT-6 Astra and Opus 5.5 lead Fable 5.1 by roughly 20 points on that benchmark; the best model from outside those two labs is Qwen3.8 Max at 12 percent. Gemini 3.8 Flash posts 89.2 percent on ARC-AGI v2 at $0.40 per task and is free in Cline. The Jev-as-a-Judge paper prices Jev at $0.044 per thousand judgments at 152 milliseconds median latency, about 277 times cheaper than GPT-6, within 3 points on RewardBench and HaluEval but 14.5 points behind on JudgeBench, and a cascade that escalates low-confidence calls to Astra keeps 99 percent of accuracy at 57 percent of the cost. The housekeeping matters too: AINews is merging with the Latent Space Discord's job-to-be-done, the network is exploring a move to Beehiiv, and sponsorships reopen. The daily hand-written recap that half the field skims each morning is changing shape.

Docker shipped [Cloud Sandboxes](https://www.docker.com/blog/introducing-cloud-sandboxes-start-on-your-laptop-finish-in-the-cloud/), microVM environments on Docker-managed compute where a coding agent can run for up to 24 hours without your laptop staying open. The handoff is one command, `sbx move my-project --to cloud`, which snapshots the sandbox filesystem and recreates it on the other side, and it works in both directions. Pre-built kits cover Claude Code, Codex, Copilot, Antigravity, OpenCode, and Hermes, with a kit spec for anything else. Pricing is per hour by size, from $0.07 for one vCPU and 2 GB to $1.12 for 16 vCPU and 32 GB, paused sandboxes cost nothing, volumes and egress are free, and new accounts get $250 in credit. The default runtime is one hour, so long jobs need the limit raised explicitly. This lands a week after Cloudflare's Worker Previews and Claude Code's cloud sessions leaving research preview, and the pattern across all three is the same: the unit of agent work is becoming a portable, resumable filesystem rather than a terminal session.

Agents kept moving into chat clients. [Devin now runs inside Microsoft Teams](https://devin.ai/blog/microsoft-teams-and-microsoft-365), where it can be mentioned in channels, DMs, and group chats, monitor a channel and start work on an alert or bug report, and post interactive cards for approvals. Six Microsoft 365 MCP connections ship with it: mail and contacts, calendar, OneDrive and SharePoint, To Do, Teams messaging, and directory lookup, all on delegated per-user permissions with no application-level grants and write access off by default. GitHub matched the move with a [changelog for Copilot in Slack and Teams](https://github.blog/changelog/2026-09-25-updates-to-github-copilot-for-slack-and-microsoft-teams): Slack files and message links become context, Teams inline images and forwarded messages do too, Copilot checks for similar issues before creating a new one, and a superseded session can no longer keep acting in a repository after you switch. That last fix reads like it came from an incident. Both launches are public preview or GA for business tiers and count against existing entitlements.

On the research side, two harness papers landed on arXiv the same morning and they argue the same point from opposite ends. [Control the Harness, Control the Cost](https://arxiv.org/abs/2609.28919) treats the coding-agent harness (Claude Code, Codex, and eighteen others it maps) as the thing that picks the price on the sheet and the volume bought at it, then builds a router where Jev labels each prompt against a bring-your-own taxonomy and moves work only at cache-safe points: session start, side lanes, subagent launch. Repricing about 10,000 real sessions, the authors find a crossover where on long tool-heavy sessions the top-priced model costs less than the next tier down, and in an emulated 10,000-seat enterprise the router recovers 14 to 21 percent of model spend at Anthropic's September 21 list prices, $3.3 to $5.0 million a year. The companion, [Grow the Harness, Not the Context](https://arxiv.org/abs/2609.26760), learns the harness itself from failure traces, moving recurring control decisions out of the prompt and into code, and cuts LLM calls 76 to 92 percent on BrowseComp-Plus and WebArena-Verified while holding 45 percent success on WebArena even with a 4B model, where plain tool-calling falls to 6.7 percent. InfoQ's [explainer on building a harness two ways](https://www.infoq.com/articles/agent-harness-build-one/) rounds out the convergence.

Cloudflare's [Turnstile Spin](https://blog.cloudflare.com/turnstile-spin/) is a small launch with a telling shape: an agent-mediated installer for its CAPTCHA replacement that creates the widget, embeds it, wires Siteverify into your backend, repairs broken installs, and migrates from other CAPTCHA providers. You start it from the dashboard, from Wrangler, or by pasting a public skill URL into whatever agent you already run. Turnstile handles about three billion verifications on a typical weekday and 23,000 accounts created a widget in one recent week, so the "skill URL as product surface" idea is being tested at real volume.

Two community posts earned their place on evidence rather than volume. A [ClaudeCode user measured the five-hour meter around the clock](https://www.reddit.com/r/ClaudeCode/comments/1wpv1gz/i_measured_the_claude_5hour_meter_around_the/) by sending identical requests at different hours and reading the utilization headers: on weekdays between 12:00 and 18:00 UTC the same request consumes about 1.4 times more of the window, across input, output, and thinking tokens, on Opus and Fable, on Pro and Max. Anthropic said in May it had removed the peak-hours reduction for Claude Code, and the poster can find nothing since describing time-of-day weighting. After last week's run of usage-meter threads, this is the first one with a controlled method. And on r/LLMDevs, the [repowise author benchmarked seven code-index tools](https://www.reddit.com/r/LLMDevs/comments/1wp1szf/i_benchmarked_repowise_codegraph_serena_graphify/) against a no-tools baseline over 48 SWE-bench Django questions and 261 runs: nobody hit the 60 to 90 percent token-saving claims, the best was about 32 percent, CodeGraph a real second at 24 percent, and under Claude Code most tools were barely called at all because MCP schemas load on demand while Codex mounts them up front. A compiler-graded call-graph check found more than a third of one leader's edges on syft do not exist. The disclosure is upfront and the harness, raw data, and preregistration are public, which is more than the vendor claims it tests offer.

What to watch: whether Anthropic petitions for en banc review or the Supreme Court, and how quickly primes and subs start writing Claude out of DoD-adjacent contracts; OpenAI DevDay next week, which swyx flags as the reason today was calm; and whether Anthropic answers the time-of-day meter question with a number or with silence.
