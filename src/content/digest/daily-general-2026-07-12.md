---
title: OpenAI claims a math proof, walks back its launch, and the model race
  turns to cost
cadence: daily
track: general
origin: auto
date: 2026-07-12
summary: OpenAI spent a day walking back the ChatGPT Work and Codex reorg,
  resetting usage limits twice and changing defaults, even as it claimed GPT-5.6
  Sol Ultra proved a 50-year-old graph-theory conjecture with 64 subagents.
  Cursor and GitHub both shipped work aimed at keeping long agent runs legible,
  and GitHub's finding that better tools made Copilot code review worse became
  the day's sharpest lesson on agent tool design. Underneath it, the model race
  has shifted to cost per token, with GPT-5.6 Luna claiming 25x savings as
  Anthropic's Fable 5 heads for deprecation.
topics:
  - model-releases
  - agent-tooling
  - agent-security
  - context-management
  - ai-economics
audioUrl: /media/digests/daily-general-2026-07-12.mp3
durationSec: 572
items:
  - title: OpenAI walks back the ChatGPT Work and Codex reorg, resets usage limits
      twice
    url: https://rss.xcancel.com/thsottiaux/status/2075641131002700120#m
    source: OpenAI / @OpenAI
    category: product_news
  - title: OpenAI says GPT-5.6 Sol Ultra proved the Cycle Double Cover Conjecture
      with 64 subagents
    url: https://rss.xcancel.com/__eknight__/status/2075643450196971805#m
    source: OpenAI / @OpenAI
    category: product_news
  - title: Cursor adds side chats, agent transcript search, and cloud-agent hooks
    url: https://rss.xcancel.com/cursor_ai/status/2075686268113916023#m
    source: Cursor / @cursor_ai
    category: product_news
  - title: Better tools made Copilot code review worse. Here's how we actually
      improved it.
    url: https://github.blog/ai-and-ml/github-copilot/better-tools-made-copilot-code-review-worse-heres-how-we-actually-improved-it/
    source: The GitHub Blog
    category: product_news
  - title: CodeQL 2.26.0 adds Kotlin 2.4.0 support and AI prompt injection detection
    url: https://github.blog/changelog/2026-07-10-codeql-2-26-0-adds-kotlin-2-4-0-support-and-ai-prompt-injection-detection
    source: Changelogs – The GitHub Blog
    category: product_news
  - title: Shared API Keys Expose AI Agents At 69% Of Enterprises, New VentureBeat
      Research Finds
    url: https://venturebeat.com/security/shared-api-keys-expose-ai-agent-fleets-venturebeat-research?utm_source=tldrit
    source: VentureBeat
    category: ai_dev
  - title: You Can't Reverse Engineer Your Way Out of the AI Supply Chain Problem
    url: https://semgrep.dev/blog/2026/ai-supply-chain-problem
    source: Semgrep Blog
    category: product_news
  - title: 'Simon Willison: the idea of "AI employees" is short-sighted'
    url: https://rss.xcancel.com/simonw/status/2075996740717871125#m
    source: Simon Willison / @simonw
    category: community
  - title: Fable 5 is leaving after July 13 and weekly limits will be cut 50%
    url: https://www.reddit.com/r/ClaudeCode/comments/1uttt60/fable_5_is_leaving_and_weekly_limits_will_be_cut/
    source: ClaudeCode
    category: community
highlights:
  - OpenAI says GPT-5.6 Sol Ultra proved a 1970s graph-theory conjecture with 64
    subagents in under an hour, then spent the same day apologizing for how it
    shipped the model.
  - GitHub found that swapping Copilot code review onto better shared tools made
    it worse; rewriting the tool instructions for a reviewer's workflow cut
    average review cost ~20% at the same quality.
  - 69% of enterprises run agent fleets on shared API keys, per new VentureBeat
    research, as CodeQL adds prompt-injection detection and Semgrep argues
    open-weight models can't be audited into trust.
  - GPT-5.6 Luna claims 25x cheaper than GPT-5.5 at top reasoning as Anthropic's
    Fable 5 heads for deprecation after July 13, and switching is being decided
    on cost, not benchmarks.
---

OpenAI says GPT-5.6 Sol Ultra proved the Cycle Double Cover Conjecture, a graph-theory problem open since the 1970s, by running 64 subagents in parallel for just under an hour, then [posted the prompt and the proof](https://rss.xcancel.com/__eknight__/status/2075643450196971805#m) for anyone to check. Whether that proof holds is now a job for mathematicians rather than marketers, and that verification is the thing to watch. The claim surfaced during the same day OpenAI spent walking back how it shipped the model. Tibor Sottiaux [posted an unusually plain apology](https://rss.xcancel.com/thsottiaux/status/2075641131002700120#m): the ChatGPT Work and Codex superapp reorg, covered here Friday, buried familiar chats and projects, nudged people toward the most expensive reasoning settings without making the cost clear, and broke some existing multi-agent workflows. The fix that shipped hours later was blunt. OpenAI reset usage limits twice in one day, changed the defaults that steered users to high compute, and reassured Codex holdouts that Codex "is here to stay." The pitch underneath the mess is real, though: OpenAI claims [GPT-5.6 Luna beats GPT-5.5 at its top reasoning setting while costing 25x less](https://rss.xcancel.com/OpenAI/status/2075686461693898868#m). On NLW's read in [the AI Daily Brief](https://podcasters.spotify.com/pod/show/nlw/episodes/ChatGPT-Just-Became-a-Work-Agent-e3lu1ln), efficiency, not raw capability, is now the axis the model race is being fought on.

Cursor shipped into the same day and aimed at the problem the superapp reorg fumbled: keeping long agent work legible. It added [side chats](https://rss.xcancel.com/cursor_ai/status/2075686268113916023#m), durable side conversations you can start without derailing the main thread and then @-mention to pull their context back in, plus [local full-text search across thousands of past agent transcripts](https://rss.xcancel.com/cursor_ai/status/2075686269825220960#m) and new cloud-agent hooks. Across both companies the through-line is the same, and it is not the model: context management is becoming the product surface.

GitHub published the sharpest agent-engineering writeup of the day, and the finding runs against instinct. [Swapping Copilot code review onto better, shared tools made it worse](https://github.blog/ai-and-ml/github-copilot/better-tools-made-copilot-code-review-worse-heres-how-we-actually-improved-it/). The team replaced code review's bespoke file tools with the same `grep`, `glob`, and `view` that power the Copilot CLI, expecting a clean upgrade, and instead measured higher cost and fewer issues caught. The tools were fine. The instructions carried the CLI's instincts: browse broadly, guess paths, accumulate context, all reasonable for an interactive coding assistant and wrong for a reviewer, who should start from the diff and read only the narrowest evidence that confirms or kills a concern. Rewriting the tool instructions for a reviewer's workflow, narrow with `grep` and `glob` first and call `view` only once the file and line range are known, flipped the regression into roughly 20% lower average review cost at the same quality. The transferable lesson: for an agent, tool descriptions are API docs, and a tool result is not a printout, it is tokens that stay in the context window and shape every later decision.

The agent-security surface got a little more instrumented in the same window, against a worse backdrop. GitHub's [CodeQL 2.26.0 added detection for AI prompt injection](https://github.blog/changelog/2026-07-10-codeql-2-26-0-adds-kotlin-2-4-0-support-and-ai-prompt-injection-detection) alongside Kotlin 2.4.0 support, so the static analyzer behind code scanning can now flag injection paths in agent code. New VentureBeat research put the exposure in numbers: [69% of enterprises are running agent fleets on shared API keys](https://venturebeat.com/security/shared-api-keys-expose-ai-agent-fleets-venturebeat-research?utm_source=tldrit), one leaked credential away from a fleet-wide compromise. And Semgrep argued you [can't reverse-engineer trust into an open-weight model](https://semgrep.dev/blog/2026/ai-supply-chain-problem) the way you can audit source, so provenance and independent auditing, not inspection, are the levers that matter. Three companies, one message: the agent supply chain is under-secured at exactly the moment fleets are scaling.

Against the "AI employees" framing that ChatGPT Work leaned on, Simon Willison [pushed back](https://rss.xcancel.com/simonw/status/2075996740717871125#m): calling these tools employees is "both disrespectful to humans and a complete misunderstanding of what these tools can do," and you "may as well start adding Excel spreadsheets to your org chart." It reads as a quip, but the point is load-bearing. Org-chart framing sets the wrong defaults for how you scope, supervise, and grant credentials to an agent, which is the exact gap the day's security numbers expose.

The model-loyalty churn cut the other way for Anthropic. Claude Code users spent the day [working out that Fable 5 leaves after July 13 and weekly limits get cut 50%](https://www.reddit.com/r/ClaudeCode/comments/1uttt60/fable_5_is_leaving_and_weekly_limits_will_be_cut/), after days of complaints that Fable and Opus 4.8 had degraded and a temporary access extension that ran through today. Part of that thread is people already pricing a move to Sol. That is the pressure to watch into next week: with Luna claiming 25x cheaper and Fable's limits tightening, near-term switching is being decided by cost per token and usage caps, not benchmark deltas, and whether OpenAI's proof claim survives outside review will say more about the ceiling than any of it.
