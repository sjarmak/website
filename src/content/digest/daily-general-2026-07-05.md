---
title: Fable finds five release blockers in sqlite-utils, two days before the
  price cliff
cadence: daily
track: general
origin: auto
date: 2026-07-05
summary: Simon Willison shipped sqlite-utils 4.0rc2 mostly written by Claude
  Fable, which caught five release blockers including a data-loss bug, for an
  estimated $149.25, while r/ClaudeCode disputes whether the July 1 relaunch
  matches June's model. Plus Anthropic's native Advisor tool, Yohei Nakajima's
  AIE World's Fair recap, Lovable's $85k token bill, an agent-discovered
  superconductor claim, and a draft AI Agent Act.
topics:
  - coding-agents
  - model-releases
  - agent-tooling
  - benchmarks
  - ai-policy
audioUrl: /media/digests/daily-general-2026-07-05.mp3
durationSec: 606
items:
  - title: sqlite-utils 4.0rc2, mostly written by Claude Fable
    url: https://simonwillison.net/2026/Jul/5/sqlite-utils-fable/#atom-everything
    source: Simon Willison's Weblog
    category: tech_articles
  - title: Fable 5 is not the same model we got in June
    url: https://www.reddit.com/r/ClaudeCode/comments/1unj7v5/fable_5_is_not_the_same_model_we_got_in_june/
    source: ClaudeCode
    category: community
  - title: Anthropic has a native Advisor for Claude Code and API
    url: https://www.reddit.com/r/ClaudeCode/comments/1unl2si/anthropic_has_a_native_advisor_for_claude_code/
    source: ClaudeCode
    category: product_news
  - title: Yohei Nakajima's AIE World's Fair recap
    url: https://rss.xcancel.com/yoheinakajima/status/2073446817174520227#m
    source: swyx 🇸🇬 / @swyx
    category: community
  - title: "$85,000 in tokens later: What I learned from scaling agentic coding at
      Lovable"
    url: https://lovable.dev/blog/85000-in-tokens-later-scaling-agentic-coding-at-lovable
    source: Lovable
    category: tech_articles
  - title: Damo Academy unveils an AI agent able to discover superconductors
    url: https://www.scmp.com/tech/big-tech/article/3359335/alibabas-elements-claw-ai-agent-unearths-four-new-superconductors
    source: SCMP
    category: ai_news
  - title: GPT-5.5 Codex reasoning-token clustering may be leading to degraded
      performance
    url: https://github.com/openai/codex/issues/30364
    source: openai/codex (GitHub)
    category: ai_dev
  - title: Warner bill would create federally vetted list for secure, trustworthy AI
      agents
    url: https://cyberscoop.com/ai-agent-act-senate-draft-bill-mark-warner/
    source: CyberScoop
    category: ai_news
highlights:
  - Fable caught a data-loss bug (delete_where poisoning the connection) plus
    four more release blockers in sqlite-utils 4.0rc1; the session cost an
    estimated $149.25 unsubsidized
  - BridgeMind's BridgeBench rerun on the July 1 Fable relaunch reports
    debugging at 25.9 vs June's 86.2, while Anthropic says the vast majority of
    coding work is unaffected
  - Anthropic's Advisor tool lets a cheaper executor model consult a
    higher-intelligence model mid-generation, formalizing the tiering pattern
    practitioners hand-roll with subagents
  - "July 7: Fable moves to full API pricing even for Max subscribers"
---

Simon Willison asked Claude Fable for a final review before shipping a stable sqlite-utils 4.0, and it came back with [five release blockers](https://simonwillison.net/2026/Jul/5/sqlite-utils-fable/#atom-everything). The worst: `delete_where()` ran its DELETE outside any transaction wrapper, left the connection with an open transaction, and silently rolled back every subsequent write when the connection closed. His repro shows a delete, a new row, and an entire table vanishing on reopen. Over 37 prompts and 34 commits (+1,321/−190 across 30 files), most of them steered from his phone during a Half Moon Bay parade, Fable worked through the full report. Then GPT-5.5 at xhigh effort reviewed the diff and found two more P1 transaction bugs, which a fresh Fable session confirmed and fixed. Willison used to consider cross-model review superstitious; he now runs Anthropic's best model over OpenAI's work and vice versa as a habit, because it keeps finding real bugs. Total estimated unsubsidized cost: $149.25, almost all of it the Fable main session.

He is racing a deadline he calls the Fablepocalypse: on July 7, Fable moves to full API pricing even for Max subscribers, and he upgraded to the $200 plan specifically to spend his remaining allowance. That cutoff is the background hum of the last day on r/ClaudeCode, where quota math shares the front page with a sharper dispute: [a widely-discussed thread](https://www.reddit.com/r/ClaudeCode/comments/1unj7v5/fable_5_is_not_the_same_model_we_got_in_june/) reports BridgeMind reran BridgeBench against the July 1 relaunch (covered here when Anthropic announced the return) and measured debugging at 25.9 against June's 86.2, refactoring at 38.4 against 73.6, hallucination at 61.7 against 75.9. The thread's theory is that the added safety classifier interferes with ordinary code reasoning, not just blocked requests. Anthropic's position is that the vast majority of coding work is unaffected. Both stories can be true if the degradation concentrates in specific task shapes; Willison shipping a major release with the July model is a data point on the other side of the ledger.

Anthropic also has a native [Advisor tool](https://code.claude.com/docs/en/advisor) for Claude Code and the API, surfaced to most people by [a r/ClaudeCode post](https://www.reddit.com/r/ClaudeCode/comments/1unl2si/anthropic_has_a_native_advisor_for_claude_code/) walking the pairing table. A cheaper executor model consults a higher-intelligence advisor mid-generation at decision points: Sonnet main with Opus advisor for routine work that escalates planning, Sonnet with Fable advisor (v2.1.170+) for frontier judgment without frontier throughput, Opus with Opus when you want an independent check rather than savings. This formalizes the tiering pattern practitioners have been hand-rolling with subagents, and Willison's cost table is the argument for it: his sweep subagents cost $1.40 to $2.40 each while the main session ran $141.

[Yohei Nakajima's AIE World's Fair recap](https://rss.xcancel.com/yoheinakajima/status/2073446817174520227#m) rounds out the week the daily dispatches covered earlier: enterprises are moving low-level tasks to open-source models with routing startups seeing real demand, the local-model room was packed mostly by people trying to cut token spend, and the conference had a designated area for "token billionaires," people burning a billion tokens a week. In his private conversations, more people had switched to Hermes Agent than were actively using OpenClaw. On the relaunched Fable he heard both "butchered" and, from people he trusts, "no difference," which matches the benchmark fight above.

Lovable published [$85,000 in tokens later](https://lovable.dev/blog/85000-in-tokens-later-scaling-agentic-coding-at-lovable), lessons from scaling agentic coding internally; HN commenters spent as much time on the bill as the lessons. The token-billionaire economy is developing its own literature.

Outside the coding loop, Alibaba's Damo Academy says its [Elements Claw agent discovered four new superconductors](https://www.scmp.com/tech/big-tech/article/3359335/alibabas-elements-claw-ai-agent-unearths-four-new-superconductors), per SCMP. An agent generating and screening candidate materials that survive lab synthesis is a different claim than an agent writing CRUD endpoints, and worth reading skeptically until a paper lands.

Two smaller items. An [openai/codex issue](https://github.com/openai/codex/issues/30364) argues GPT-5.5 Codex's reasoning-token clustering may be degrading performance, users bisecting a vendor's serving behavior in public, the same instinct as the BridgeBench rerun. And Senator Warner is circulating a [draft AI Agent Act](https://cyberscoop.com/ai-agent-act-senate-draft-bill-mark-warner/) that would create a federally vetted list of secure, trustworthy AI agents; a procurement-shaped lever aimed at the agent supply chain.

What to watch: July 7. Fable at API prices is a live experiment in what frontier-model demand looks like without subscription subsidy, and if BridgeMind's relaunch numbers replicate anywhere else, the "same model, new price" framing gets harder to hold.
