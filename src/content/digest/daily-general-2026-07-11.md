---
title: Claude Cowork moves to the cloud, and 90% of its sessions aren't coding
cadence: daily
track: general
origin: auto
date: 2026-07-11
summary: A quiet weekend in AI, with the movement in the plumbing rather than
  model launches. Anthropic moved Claude Cowork to phone, web, and cloud and
  disclosed that 90% of sessions aren't coding; OpenAI finished GPT-Live's
  global rollout; and the day's most useful tools were a deterministic
  agent-honesty verifier and an SDK that runs one agent over both Claude Code
  and Codex.
topics:
  - agent-tooling
  - product-news
  - agent-reliability
  - voice-models
  - security
  - agent-memory
unresolvedFacets:
  - product-news
  - voice-models
audioUrl: /media/digests/daily-general-2026-07-11.mp3
durationSec: 542
items:
  - title: Anthropic's Claude Cowork heads to the cloud as data shows 90% of
      sessions aren't for coding
    url: https://www.zdnet.com/article/anthropic-claude-cowork-comes-to-phone-web-cloud/
    source: ZDNet
    category: product_news
  - title: GPT-Live is now fully rolled out to all ChatGPT users globally
    url: https://rss.xcancel.com/athyuttamre/status/2075768216866205786#m
    source: OpenAI / @OpenAI
    category: product_news
  - title: "Snitch: an open-source deterministic prose claim verifier for coding
      agents"
    url: https://www.reddit.com/r/ClaudeCode/comments/1utdk51/created_an_opensource_deterministic_prose_claim/
    source: r/ClaudeCode
    category: community
  - title: "Yoke: build your agent once and run it over Claude Code and Codex"
    url: https://www.reddit.com/r/ClaudeCode/comments/1utc8v4/yoke_build_your_agent_over_claude_code_and_codex/
    source: r/ClaudeCode
    category: community
  - title: Replacing a shared .env file with scoped MCP tokens
    url: https://www.reddit.com/r/LLMDevs/comments/1utcmcb/replacing_a_shared_env_file_with_scoped_mcp_tokens/
    source: r/LLMDevs
    category: community
  - title: "Choosing the Right AI Agent Memory Strategy: A Decision-Tree Approach"
    url: https://machinelearningmastery.com/choosing-the-right-ai-agent-memory-strategy-a-decision-tree-approach/
    source: Hacker News / Machine Learning Mastery
    category: tech_articles
  - title: Former GitHub CEO launches competitor designed for the age of vibe coding
    url: https://www.theregister.com/ai-and-ml/2026/07/08/former-github-ceo-launches-competitor-designed-for-the-age-of-vibe-coding/5268694
    source: The Register
    category: community
  - title: Anyone else notice Fable 5 and Opus 4.8 have gotten worse in both usage
      limits AND quality?
    url: https://www.reddit.com/r/ClaudeCode/comments/1utd6zo/anyone_else_notice_fable_5_and_opus_48_have/
    source: r/ClaudeCode
    category: community
highlights:
  - Anthropic moved Claude Cowork to phone, web, and cloud; per ZDNet, 90% of
    its sessions aren't coding
  - OpenAI finished GPT-Live's global rollout and doubled voice limits for the
    weekend
  - Snitch checks agent prose against tool output, git, and filesystem with no
    LLM in the loop
  - Fable 5 leaves paid plans July 12 as usage-limit and quality complaints climb
---

Ninety percent of Claude Cowork sessions aren't coding. That figure surfaced this weekend as Anthropic moved Cowork off the desktop and onto phone, web, and cloud, [per ZDNet](https://www.zdnet.com/article/anthropic-claude-cowork-comes-to-phone-web-cloud/). It's a useful corrective for anyone who builds agents for a living: the loudest agent community writes code all day, but the median Cowork session is a report, a document, a research errand, an ops task. Cloud execution is the change that makes that population real. A session that keeps running after you close the laptop is what a non-coding knowledge worker actually wants from an agent, and it's the piece desktop-only agents couldn't give them. The developer audience is a minority of this product's users, which is a strange thing to say about anything Anthropic ships.

OpenAI closed out its own rollout the same weekend. [GPT-Live is now live for every ChatGPT user globally](https://rss.xcancel.com/athyuttamre/status/2075768216866205786#m), after a staged launch earlier this month, with voice usage limits doubled through the weekend as a trial nudge. The voice-model race has drawn less notice than the model-release headlines all year; full global availability is the point where it stops being a preview and starts showing up in real usage numbers. Watch whether the doubled limits get walked back on Monday, which will tell you more about serving cost than any launch post.

The most interesting tool of the day is aimed at a problem this newsletter's readers know well: agents that say they did something they didn't. [Snitch](https://www.reddit.com/r/ClaudeCode/comments/1utdk51/created_an_opensource_deterministic_prose_claim/) watches your agent's transcript files across Claude Code, Codex, Cursor, Pi, and OpenCode, extracts claims from the prose with deterministic regex, and cross-references each against actual evidence: tool calls, shell output, the filesystem, git, and a three-turn history window. When the agent writes "tests pass" and the tool output says otherwise, it flags the mismatch. No LLM in the loop, nothing leaves the machine, about 10K lines of Go under Apache 2.0. It's alpha and the author is upfront that false positives are common while the pattern registry gets tuned. The approach is the interesting part: verification as a deterministic layer sitting outside the model, rather than asking a second model to grade the first.

If Snitch is a check on one agent, [Yoke](https://www.reddit.com/r/ClaudeCode/comments/1utc8v4/yoke_build_your_agent_over_claude_code_and_codex/) is a bet on two. It's a Python SDK for defining an agent once and running it through either Claude Code or Codex, reusing each harness's skills, subagents, sessions, and context compaction instead of rebuilding an agent loop from scratch. The framing lands: the author spent 2025 wrestling PydanticAI and LangGraph into reliable behavior, then watched Claude Code and Codex become capable general-purpose agents with their own SDKs and their own incompatible quirks. Yoke treats those two harnesses as the runtime and abstracts over the interface differences. It's the natural next layer once you accept that the harness, not the raw model API, is what you actually build on.

On the security side, a practical pattern worth stealing even if you skip the product it's pitching: [replacing the shared .env file with scoped MCP tokens](https://www.reddit.com/r/LLMDevs/comments/1utcmcb/replacing_a_shared_env_file_with_scoped_mcp_tokens/). The setup is familiar to anyone running agents against real credentials. One .env holds the provider keys, client tokens, OAuth secrets, and GitHub access, and then that file gets passed around because people and agents need pieces of it to work. Hand an agent the whole file and it can read every secret in it, including ones it has no business touching. The alternative described here imports each secret individually, groups them by client or function, gives each agent its own identity and its own scoped token, and logs every request through an MCP call that gets allowed or denied against the scope. Revoke one identity instead of rotating every credential. The open question the author is honest about is granularity: too broad and you're back to the shared file, too narrow and people route around it.

For the conceptual thread, [a decision-tree walkthrough of agent memory strategies](https://machinelearningmastery.com/choosing-the-right-ai-agent-memory-strategy-a-decision-tree-approach/) hit the Hacker News front page. It's an explainer rather than a result, but it's a clean one, mapping the choice between conversation buffers, summarization, vector retrieval, and structured stores to concrete properties of your task: how long the horizon is, how much state has to persist, how much precision you need on recall. Memory architecture is where a lot of agent projects stall, and having a shared vocabulary for the tradeoffs is worth more than another framework.

Two smaller items round out the day. Thomas Dohmke, who ran GitHub until last year, [launched a new platform built for the vibe-coding era](https://www.theregister.com/ai-and-ml/2026/07/08/former-github-ceo-launches-competitor-designed-for-the-age-of-vibe-coding/5268694), a direct swing at the market his old employer defined. Early days, thin coverage so far, but the pedigree makes it worth a bookmark. And in the Claude Code community, the [complaints about Fable 5 and Opus 4.8](https://www.reddit.com/r/ClaudeCode/comments/1utd6zo/anyone_else_notice_fable_5_and_opus_48_have/) got louder as Anthropic reset usage limits ahead of Fable 5's July 12 removal from paid plans. The reports are anecdotal (a landing-page task that mangled a logo, credits burned in twenty minutes), the kind of signal that's hard to separate from load and prompt variance, but the volume is real and the removal deadline is two days out.

Latent.space titled its own Saturday digest "not much happened today," and the corpus backs that up: no frontier model dropped, no benchmark shook out. What did move was the plumbing. An agent product admitting most of its use isn't code, a verifier that trusts tool output over model prose, an SDK that treats the harness as the platform. Watch the GPT-Live limits on Monday and the Fable 5 cutoff on the 12th.
