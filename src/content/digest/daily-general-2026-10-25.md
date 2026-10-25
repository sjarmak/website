---
title: Claude Duet asks before it pays, Argon tunes Google's ADK overnight, and
  the Brotli hole reaches Python
cadence: daily
track: general
origin: auto
date: 2026-10-25
summary: Anthropic's Claude Duet preview put a confirmation gate on messages,
  payments, signatures and deletes, and the agent-safety shape it formalizes
  shows up across today's feed. Google merged two optimizations from an 11-hour
  unattended Gemini 4 Argon run on its own ADK, DoorDash published the cost and
  approval numbers for agent-driven feature flag cleanup, and the Node.js Brotli
  RCE expanded into HTTP2Shell with Python packages now in scope.
topics:
  - agents
  - security
  - developer-tooling
  - code-optimization
  - supply-chain
  - research
unresolvedFacets:
  - code-optimization
  - supply-chain
audioUrl: /media/digests/daily-general-2026-10-25.mp3
durationSec: 673
items:
  - title: Claude Duet stops to ask before it sends, pays, signs or deletes
    url: https://claude.com/resources/articles/claude-duet?utm_source=tldrit
    source: TLDR - Topics
    category: newsletters
  - title: Gemini 4 Argon ran 11 hours unattended on Google's ADK and merged two
      optimizations
    url: https://www.infoq.com/news/2026/10/google-argon-optimizes-adk/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global
    source: InfoQ
    category: tech_articles
  - title: Node2Shell becomes HTTP2Shell as the Brotli RCE reaches Python packages
    url: https://www.aikido.dev/blog/python-packages-vulnerable-node2shell-brotli-cve-2026-111497
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: Railway's connected GitHub accounts were compromised
    url: https://www.reddit.com/r/devops/comments/1xdnaf8/railways_connected_github_accounts_were/
    source: Devops
    category: community
  - title: DoorDash agents cleaned up stale feature flags at $4.79 and 13.8 minutes
      each, 45 of 50 approved
    url: https://arxiv.org/abs/2610.31351
    source: cs.MA updates on arXiv.org
    category: research
  - title: GitHub is rebuilding Git infrastructure for agent-scale load
    url: https://github.blog/engineering/architecture-optimization/the-bridge-to-agent-scale-git-infrastructure/?utm_source=tldrit
    source: TLDR - Topics
    category: ai_dev
  - title: Terence Tao opens a community hub for revising OpenAI's math write-ups
    url: https://terrytao.wordpress.com/2026/10/24/oai-math-revised-a-community-hub-for-revising-openais-math-write-ups/
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: checkmate plugin reports pass rate 86.7% to 98.3% with output tokens halved
    url: https://www.reddit.com/r/ClaudeCode/comments/1xe34m5/i_built_checkmate_a_claude_code_plugin_that_makes/
    source: ClaudeCode
    category: community
highlights:
  - "Claude Duet's confirmation gate covers four action classes: send, pay,
    sign, delete; DNS changes and merges to main are none of them"
  - "Argon on ADK: 2 merged optimizations from an 11-hour run, 40% lower
    session-prep overhead, 21% faster cold import"
  - Brotli CVE-2026-111497 now spans Node.js and Python; the fix moved from
    patch Node to inventory every Brotli decoder
  - "DoorDash: 56,000 flags, 623 repos, 1,659 stale; agent cleanup at $4.79 and
    13.8 min per flag, 90% engineer-approved"
  - "Railway and PingCAP: two vendor-side compromises touching source control in
    two days"
---

Anthropic's new agent stops and asks before it sends a message, spends money, signs anything, or deletes anything. That gate is the detail practitioners fixed on after [Claude Duet](https://claude.com/resources/articles/claude-duet?utm_source=tldrit) was previewed on October 22, and it is why the story kept circulating for two more days across TLDR, AlphaSignal, AI Daily Brief, Elvis Saravia's [AI Agents Weekly](https://nlp.elvissaravia.com/p/ai-agents-weekly-claude-duet-kimi) and r/ClaudeCode. Horizon AI framed Duet as Anthropic's answer to Meta Muse and OpenAI Dots, which is the competitive read. The operational read is narrower and more useful: the agent runs on its own up to the point where an action leaves the sandbox and touches a person, a wallet, a contract, or data it cannot restore, then hands control back. The shape will be familiar to anyone who followed the Commerce.com storefront work and Anthropic's supplies-buying agent covered here on the 22nd and 23rd. Duet moves that confirmation gate into a general-purpose product. The question to ask of it is whether four categories cover the consequential actions in your environment, because changing a DNS record or merging to main is none of them.

Google ran Gemini 4 Argon unattended against its Agent Development Kit for 11 hours and merged two of the optimizations it proposed. [InfoQ's write-up](https://www.infoq.com/news/2026/10/google-argon-optimizes-adk/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global) by Sergio De Simone has the numbers: in-memory session-preparation overhead down about 40 percent in long sessions, cold package import time down 21 percent, on a roughly 200,000-line Python codebase. Two accepted changes from an 11-hour run is the figure to hold onto. It says the acceptance bar was a measured speedup on a real workload, not a plausible-looking diff, and that most of what the model tried did not clear it. Argon went GA on October 13, so this is an early account of the model working on code Google itself maintains. The same day on arXiv, Zhe Ye, Udaya Ghai, Zhizhen Qin, Dawn Song and Soonho Kong posted [Agentic Verified Optimization of Real-World Software](https://arxiv.org/abs/2610.30188), which, going by the title, is the academic version of the same problem: let an agent change performance-sensitive code and prove the change preserves behavior.

The Brotli decoder flaw in Node.js, CVE-2026-111497, which this digest covered on the 23rd through Semgrep's patch-now post, is no longer a Node story. Aikido's analysis reached the Hacker News front page at 83 points and 38 comments with the finding that [Python packages are vulnerable too](https://www.aikido.dev/blog/python-packages-vulnerable-node2shell-brotli-cve-2026-111497), and the submission title puts it directly: Node2Shell evolves to HTTP2Shell, blast radius affects many HTTP libs and apps. A parallel r/programming thread calls the same bug [Broccoli2Shell](https://www.reddit.com/r/programming/comments/1xe7dp8/broccoli2shell_brotli_decoder_rce_cve2026111497/) and lists Node.js, Python, and more as affected. The inventory question changes accordingly. The fix is no longer patch Node; it is find every runtime, library, and vendored binary in your estate that carries a Brotli decoder, and most teams do not have that list. Craft Better Software counted [seven security incidents in 48 hours](https://craftbettersoftware.com/p/7-security-incidents-in-48-hours) on the 23rd, and Latent Space titled its roundup for the same day Black October.

Two of those incidents touched source control from the vendor side. On r/devops, a thread reports that [Railway's connected GitHub accounts were compromised](https://www.reddit.com/r/devops/comments/1xdnaf8/railways_connected_github_accounts_were/). The poster's practical point is the one to carry: GitHub's API does not let you fully audit what an integration has touched, so when an integration with repository access is compromised, the defensible posture is to assume compromise and rotate rather than try to prove a negative from incomplete logs. This morning InfoQ added that a [PingCAP breach exposed customer records and source code](https://www.infoq.com/news/2026/10/pingcap-cloud-data-breach/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global). If you have granted a platform write access to your repositories in exchange for deploy convenience, this is the day to list those grants.

DoorDash has more than 56,000 feature flags across 623 repositories, 1,659 of them stale as of May, and engineers estimated one to two hours of manual work to remove each. A new [arXiv paper](https://arxiv.org/abs/2610.31351) by Atharv Chandratre and Jai Datar describes the multi-agent LLM system they built to do it: query live rollout data over MCP, process the Jira ticket, open the pull request, end to end. On 50 stale flags it produced engineer-approved removal PRs for 45, at an average of $4.79 and 13.8 minutes per flag. They note that rule-based cleanup tools had already failed on their codebases, which is the usual reason this chore never gets done: the gated code is slightly different every time. Run the arithmetic forward and the full backlog of 1,659 flags is roughly $8,000 of inference against somewhere between 1,700 and 3,300 engineer-hours. That is the kind of ratio that gets a tool funded, and the paper's lessons-learned section is written for teams who want to build the same thing.

GitHub's engineering blog, for its part, is describing how it is [rebuilding Git infrastructure for AI agents](https://github.blog/engineering/architecture-optimization/the-bridge-to-agent-scale-git-infrastructure/?utm_source=tldrit), under the framing of a bridge to agent scale. Read it next to the DoorDash and Argon stories above. An agent that opens a reviewed PR every 14 minutes, or runs 11 hours of edit-build-benchmark loops against a 200,000-line repository, is a traffic pattern Git hosting was not designed around, and GitHub is now provisioning for it as the default rather than the exception.

Terence Tao opened [oai-math-revised](https://terrytao.wordpress.com/2026/10/24/oai-math-revised-a-community-hub-for-revising-openais-math-write-ups/), a community hub for revising OpenAI's math write-ups. A working mathematician setting up a venue where people correct and rewrite model-produced mathematics tells you where the output sits: good enough to be worth revising, not good enough to publish unedited. Latent Space's [AI Is Getting Good at Math. Here's Why.](https://latent.space/p/ai-is-getting-good-at-math/) from the 23rd is the companion piece on how it got there.

On r/ClaudeCode, a developer published [checkmate](https://www.reddit.com/r/ClaudeCode/comments/1xe34m5/i_built_checkmate_a_claude_code_plugin_that_makes/), a Claude Code plugin they report moved their task pass rate from 86.7 percent to 98.3 percent while halving output tokens. Those are self-reported, single-user numbers. The direction matches the trace-analysis tool covered here on the 21st, which found one agent spending 35 percent of its I/O re-verifying itself: structure the verification and you cut both the failures and the tokens.

What to watch. Two items landed on Hacker News in the small hours and have not had time to be checked. A GitHub repository claims that [five Qwen3.8-27B models match Fable 5 using the GVS5H harness](https://github.com/slee-persis/GVS5H), at 50 points and 9 comments when the feed caught it; treat that as unverified until someone reproduces it. Cerebras posted an account of [how it deploys trillion-parameter frontier models](https://www.cerebras.ai/blog/how-we-deploy-trillion-parameter-frontier-models-on-cerebras) on its hardware. For the weekend, Sebastian Raschka released a [full video course on building a reasoning model](https://magazine.sebastianraschka.com/p/building-reasoning-models). And expect the HTTP2Shell affected list to keep growing through Monday.

*Feed note: the item mirror reported itself in mirror mode with a last-sync timestamp of September 1, yet it contained items published through the morning of October 25, so the staleness field appears to be misreporting rather than the data being stale. Everything above traces to an item in the feed.*
