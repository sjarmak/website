---
title: Skills describe behavior; nothing decides what's allowed to become an action
cadence: daily
track: general
origin: auto
date: 2026-08-31
summary: "Two independent r/ClaudeCode threads on August 27 described the same
  shift: Opus 5 acts on an incomplete spec instead of asking, and a five-line
  pre-context block gives the asking back. A paper the same day gives that gap a
  formal name, Borrowed Authority, and shows a typed policy layer inside the
  Skill artifact rejecting 60 of 60 attacks. Plus AsymSpec's split-context
  speculative decoding, two gateways for agent search and inference, a portable
  context-handoff format, and foreign keys landing in Aurora DSQL."
topics:
  - agent-tooling
  - agent-safety
  - coding-agents
  - inference-cost
  - context-management
  - infrastructure
unresolvedFacets:
  - inference-cost
audioUrl: /media/digests/daily-general-2026-08-31.mp3
durationSec: 671
items:
  - title: Opus 5 doesn't wait for you. Here's the pre-context that stops it running
      ahead.
    url: https://www.reddit.com/r/ClaudeCode/comments/1w06gq0/opus_5_doesnt_wait_for_you_heres_the_precontext/
    source: ClaudeCode
    category: community
  - title: "Auto-Policy, not Auto-Skill: Compiled Agent Skills for the Physical World"
    url: https://arxiv.org/abs/2608.25091
    source: cs.AI updates on arXiv.org
    category: research
  - title: "AsymSpec: Context-Asymmetric Speculative Decoding for Agentic LLMs"
    url: https://arxiv.org/abs/2608.26004
    source: cs.AI updates on arXiv.org
    category: research
  - title: "Show HN: Telem – Route agent web search across providers and inspect the
      traces"
    url: https://telem.ai/
    source: Hacker News
    category: community
  - title: "Show HN: We built open OpenRouter that turns usage into a better model"
    url: https://github.com/experientiallabs/experiential
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: "I built a context-compaction experiment: how much of an agent's working
      state can survive?"
    url: https://www.reddit.com/r/LLMDevs/comments/1w0cdch/i_built_a_contextcompaction_experiment_how_much/
    source: LLMDevs
    category: community
  - title: Amazon Aurora DSQL now supports foreign key constraints
    url: https://aws.amazon.com/about-aws/whats-new/2026/08/aurora-dsql-foreign-key-constraints/
    source: AWS What's New
    category: product_news
highlights:
  - "Two independent r/ClaudeCode threads on Aug 27 report the same Opus 5
    change: it acts on an underspecified prompt instead of clarifying, and a
    five-line pre-context block restores the asking."
  - "Auto-Policy, not Auto-Skill names the attack class Borrowed Authority: the
    Skills format gives a receiving agent no typed way to reject an inter-agent
    permission claim. Edge Skillguard rejected 60/60 requests across five
    variants without blocking benign traffic."
  - AsymSpec splits speculative decoding's shared-context assumption, running
    the drafter on compressed context while the verifier keeps the full one.
  - "Telem and Experiential both bet the interesting agent failures now live in
    the plumbing: which provider served the evidence, and whether the failure
    was retrieval or reasoning."
  - Aurora DSQL added foreign key constraints on active-active multi-region
    tables, removing a standing reason to keep a single-region database
    alongside it.
---

Five lines pasted at the top of a session, and the complaint goes away. That is the claim in an [r/ClaudeCode post from August 27](https://www.reddit.com/r/ClaudeCode/comments/1w06gq0/opus_5_doesnt_wait_for_you_heres_the_precontext/), and the lines themselves are unremarkable: ask me when the task is underspecified, state your approach in two or three sentences and wait for confirmation, don't write tests I didn't ask for, don't refactor outside the files I named, stop when a decision has more than one reasonable answer. The author's diagnosis is worth more than the block. Opus 5 isn't worse than 4.8, they argue, it is more willing to act on an incomplete spec, and the token burn people blame on the model is largely the cost of it inventing the constraints you never supplied. By their account the "state your approach and wait" line does more work than the other four combined, because the model will plan out loud on request and simply won't volunteer it. A [second r/ClaudeCode thread](https://www.reddit.com/r/ClaudeCode/comments/1w0agjt/claude_is_going_to_drive_me_to_drink/) the same evening made the same observation without the analysis: the model "alternates between autonomously running a 40 hour experiment in response to a simple question and asking for my permission to update a doc that's clearly stale. There is no middle ground." Two independent posts, one day, describing an autonomy default that shifted without a changelog entry naming it.

That gap between what an agent is told and what it is permitted to do has a formal version. Zhonghao Zhan and Hamed Haddadi published [Auto-Policy, not Auto-Skill](https://arxiv.org/abs/2608.25091) on August 27, and their framing is the sharpest thing in the window: a Skill describes how an agent should behave, a Policy decides which behavior is allowed to become an action, and today's format covers the first with markdown and scripts while leaving the second entirely to the model. Generating more Skills therefore scales the gap rather than the safety. They name the resulting attack class Borrowed Authority: the Skills format gives a receiving agent no typed way to reject an inter-agent permission claim, so a malicious or misused Skill can drive real actuation just by attaching one. Their answer, Edge Skillguard, puts a typed authority layer inside the Skill artifact rather than in a workflow engine between tools, with guards that check world state and sensor evidence before an action fires. On a live edge control-plane testbed it rejected 60 of 60 borrowed-authority requests across five attack variants without blocking benign traffic, and the result held at 5x scale and across hosts over a Tailscale mesh. Anyone shipping a skills directory into a system that can move money or open a door should read the threat model even if the edge-robotics setting isn't theirs.

Cost showed up from a different angle in [AsymSpec](https://arxiv.org/abs/2608.26004), posted August 26. Speculative decoding is the standard lossless way to cut generation latency, and it assumes the drafter and the verifier see an identical context. Agentic pipelines break that assumption constantly, because the usual response to context growth across retrieval, tool calls, and multi-turn history is to compress the input, which costs accuracy. AsymSpec decouples the two: the drafter runs on the compressed context while the verifier keeps the full one, so the compression buys speed without the accuracy tax landing on the final output. It is a small structural idea aimed squarely at the part of the agent bill that grows fastest.

Two tools shipped the same week attack the layer underneath. [Telem](https://telem.ai/) routes agent web search across Exa, Parallel, Tavily, Brave, and SerpAPI behind one interface and traces the results with quality metrics, and the pitch is diagnostic rather than economic: when an agent run goes wrong, the traces tell you whether it was a retrieval failure or a reasoning failure. That distinction is currently guesswork in most harnesses. [Experiential](https://github.com/experientiallabs/experiential), a Rust model gateway posted to Hacker News on August 27, does the analogous job for inference, putting self-hosted, open-weight, and frontier models behind one config and feeding usage back as training signal. Both are the same bet: the interesting failures now live in the plumbing between the model and its evidence, and you cannot debug what you cannot see.

Context portability got a scrappier treatment in [MemHandoff](https://www.reddit.com/r/LLMDevs/comments/1w0cdch/i_built_a_contextcompaction_experiment_how_much/), an experiment posted to r/LLMDevs on August 28. The setup is one question stated plainly: take a long agent conversation, compress it, hand the result to a different agent, and see whether it can continue. The output is a portable `.ctx` package that tries to preserve decisions, constraints, failed approaches, task state, and artifacts. Failed approaches is the field most compaction schemes drop and the one that costs the most when it's missing, since the successor agent will cheerfully re-run every dead end its predecessor already eliminated.

On the infrastructure side, [Amazon Aurora DSQL added foreign key constraints](https://aws.amazon.com/about-aws/whats-new/2026/08/aurora-dsql-foreign-key-constraints/) on August 27, for new and existing tables. Distributed SQL engines have historically shipped without referential integrity because enforcing it across regions is expensive, and the workaround has been to push the check into application code, where it drifts. Getting FKs on an active-active multi-region Postgres-compatible engine removes a real reason teams kept a single-region database around.

The thread to watch is whether the Skills format grows a typed permission layer or whether every harness keeps reimplementing one privately. Anthropic's auto mode, Edge Skillguard's typed guards, and a Reddit user's five-line pre-context block are three answers to the same question at three very different levels of rigor, and right now the five-line block is the one most people are actually running.

---

*Feed note: the item mirror this issue draws from last ingested on 2026-08-28 at 02:01 UTC and has not refreshed since, so the pool here ends on August 27–28 rather than covering August 29–31. Every item above is dated to its actual publication date. Treat the absence of anything newer as a pipeline gap, not a quiet field.*
