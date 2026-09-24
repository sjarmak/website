---
title: Worms in the AI package ecosystem, Opus 5.5's price war, and a harness from AWS
cadence: daily
track: general
origin: auto
date: 2026-09-24
summary: Credential-stealing MemOS builds hit npm and PyPI and hunt publish
  tokens; Opus 5.5 goes default at AINews as everyone cuts prices 40-50%; 3,729
  podcast episodes score Claude Code vs Codex; GPT-6 Astra drives a car;
  AGENTS.md may be telemetry-gated; Google's Antigravity SDK runs local models;
  AWS ships a Strands harness; and a paper prices the collaboration tax.
topics:
  - ai-security
  - model-releases
  - ai-economics
  - agentic-coding
  - agent-tooling
  - open-models
  - multi-agent-orchestration
  - ai-for-science
audioUrl: /media/digests/daily-general-2026-09-24.mp3
durationSec: 724
items:
  - title: "The AI Ecosystem Has Worms Now: Inside the MemTensor Compromise"
    url: https://semgrep.dev/blog/2026/the-ai-ecosystem-has-worms-now-inside-the-memtensor-compromise
    source: Semgrep Blog
    category: product_news
  - title: "[AINews] Claude Opus 5.5, the new default model for AINews, and
      everybody cuts prices 40-50%"
    url: https://www.latent.space/p/ainews-claude-opus-55-the-new-default
    source: Newsletter Misc
    category: newsletters
  - title: 60 days of Claude Code vs Codex sentiment changing (3,729 podcast episodes)
    url: https://www.reddit.com/r/ClaudeCode/comments/1woisav/60_days_of_claude_code_vs_codex_sentiment/
    source: ClaudeCode
    category: podcasts
  - title: GPT-6 Astra has gained the ability to drive a car
    url: https://drivingbench.com/
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: Claude Code reads AGENTS.md only when telemetry is on
    url: https://blog.szypowi.cz/p/claude-code-reads-agents.md-only-when-telemetry-is-on/
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: Introducing Support for Local AI Models in the Antigravity SDK
    url: https://developers.googleblog.com/introducing-support-for-local-ai-models-in-the-antigravity-sdk/
    source: Google Developers Blog
    category: product_news
  - title: AWS Adds Harness to Open Source SDK for Building AI Agents
    url: https://devops.com/aws-adds-harness-to-open-source-sdk-for-building-ai-agents/
    source: DevOps.com
    category: tech_articles
  - title: "The Collaboration Tax: How Much LLM Multi-Agent Systems Pay to Coordinate"
    url: https://arxiv.org/abs/2608.22152
    source: cs.CL updates on arXiv.org
    category: research
highlights:
  - Malicious MemOS builds on npm and PyPI fire on import, not install, and go
    straight for publish tokens
  - Opus 5.5 becomes AINews' default as vendors cut prices 40-50% and users
    report it cheaper at medium than Fable 5.1 at high
  - Across 3,729 podcast episodes Codex leads head-to-heads 68-47 but Claude
    Code holds higher net sentiment (+36% vs +25%)
  - A front-page post claims Claude Code's AGENTS.md fallback only works with
    telemetry on
  - AWS's Strands harness offloads tool results out of context, cutting tokens
    up to 28%
---

On September 23, 2026, someone published credential-stealing builds of MemTensor's MemOS packages to npm and PyPI. Semgrep's writeup, [The AI Ecosystem Has Worms Now: Inside the MemTensor Compromise](https://semgrep.dev/blog/2026/the-ai-ecosystem-has-worms-now-inside-the-memtensor-compromise), explains why install-time scanners saw nothing: neither build runs on install. Both wire the payload into code paths that run anyway, and on the Python side that means the moment your code imports the library. The first thing the payload hunts for is publish tokens, so a compromised developer becomes the next publisher. That is what makes it a worm rather than a one-off infostealer. Semgrep followed up today with [Malware Detection and Response Automation](https://semgrep.dev/blog/2026/introducing-malware-detection-and-response-automation). Two DevOps.com pieces from the same window fit alongside it: Tom Smith on how [your AI coding assistant has the keys to the repo](https://devops.com/your-ai-coding-assistant-has-the-keys-to-the-repo-z-ai-just-showed-why-that-matters/), using Z.ai as the example, and Cycode [extending its supply-chain coverage to the packages developers download](https://devops.com/cycode-extends-devsecops-reach-to-software-packages-developers-download/). If an agent memory library sits in your dependency tree, pin it, check the installed hash, and rotate any publish token that was on the machine.

## Opus 5.5 becomes AINews' default and everyone cuts prices

Yesterday's issue covered Simon Willison's day-one read on Opus 5.5, Sol and Luna, and CodeRabbit's review-bot comparison. Day two is about money. AINews [made Opus 5.5 its default model](https://www.latent.space/p/ainews-claude-opus-55-the-new-default) and built the issue around one observation: everybody cut prices 40 to 50 percent. The rollout kept spreading in the last day. [GitHub Copilot](https://github.blog/changelog/2026-09-22-claude-opus-5-5-is-now-available-in-github-copilot) now offers it, [AWS GovCloud](https://aws.amazon.com/about-aws/whats-new/2026/09/claude-opus-5-5-aws-govcloud/) has it and notes it uses fewer tokens than Opus 5, and the AI Daily Brief spent an episode on [Opus 5.5 vs GPT-6 Sol and Luna](https://podcasters.spotify.com/pod/show/nlw/episodes/Opus-5-5-vs-GPT-6-Sol-and-Luna-e3pa5c4). The community measurements are the useful part. One r/ClaudeCode user ran an extended test to see whether the new model could replace their Opus 4.6 coder agents and found [Opus 5.5 at medium effort cheaper and faster than Opus 4.6 or Fable 5.1 at high](https://www.reddit.com/r/ClaudeCode/comments/1wocoug/opus_55_at_medium_is_cheaper_and_faster_than/). Another A/B tested Opus 5 against Opus 5.5 for writing tells over 20 replies each: em dashes fell from 98 to 0, verbless fragments from 24 to 0, and reflexive denials from 19 to 5. On the economics, Marginal Revolution says [the price of intelligence is falling rapidly](https://marginalrevolution.com/marginalrevolution/2026/09/the-price-of-intelligence-is-falling.html) and jyn.dev asks what changes when [tokens are too cheap to meter](https://jyn.dev/tokens-too-cheap-to-meter/). A 40 percent cut on a model that also uses fewer tokens per task is more than 40 percent off an agentic bill.

## Sixty days of podcast sentiment: Claude Code vs Codex

A Pod Engine user [ran 3,729 podcast episodes through a classifier](https://www.reddit.com/r/ClaudeCode/comments/1woisav/60_days_of_claude_code_vs_codex_sentiment/) to track how hosts talk about Claude Code and Codex from July 24 to September 23. Codex was mentioned more (2,182 mentions across 1,072 shows against 1,547 across 942), but Claude Code's net sentiment ran higher, +36 percent against +25, with praise at 47 percent against 36 and criticism at 11 percent for both. In 215 head-to-head episodes, Codex won 68, Claude Code 47, and 100 landed on "both" or "depends." After Astra shipped on September 3 the head-to-heads swung to Codex 23 to 8. The split is by task: hosts credit Codex on harness and speed, Claude Code on design work (28 against 16 percent) and long agentic runs (19 against 10). Claire Vo on How I AI summed up the Codex shift as "not annoying anymore." Opus 5.5 already appears in 121 episodes across 109 shows since September 22. Classification was done with Gemini Flash Lite, so treat the percentages as direction, not a survey.

## GPT-6 Astra drives a car, and Claude finds an enzyme

Two Hacker News front-page items today came from outside the coding loop. [Drivingbench.com](https://drivingbench.com/) went up with the claim that GPT-6 Astra has gained the ability to drive a car, 175 points and 149 comments. Anthropic separately announced that [Claude discovered a novel enzyme system with CRISPR-like repeats](https://www.anthropic.com/news/claude-discovers-novel-enzyme-system), 114 comments. Both are here for the signal. Neither post, as it reached the feed, includes the detail needed to reproduce the claim.

## Claude Code reads AGENTS.md only when telemetry is on

A post that climbed the front page says [Claude Code reads AGENTS.md only when telemetry is on](https://blog.szypowi.cz/p/claude-code-reads-agents.md-only-when-telemetry-is-on/), 88 points and 25 comments. Claude Code added AGENTS.md as a fallback in 2.1.277 last week, and DevOps.com covered it on Monday as [cutting instruction file sprawl](https://devops.com/claude-code-adds-agents-md-fallback-cutting-instruction-file-sprawl/). If the post holds up, the fallback is gated on a telemetry setting. Until Anthropic responds, keep CLAUDE.md as the source of truth and treat AGENTS.md as best effort.

## Google's Antigravity SDK runs local models, and Gemini 3.8 speaks

Google's developers blog announced [local model support in the Antigravity SDK](https://developers.googleblog.com/introducing-support-for-local-ai-models-in-the-antigravity-sdk/): agentic workflows run offline on Gemma 4 26B A4B via LiteRT, with a hybrid mode that keeps a cloud model as planner and pushes token-heavy jobs such as code auditing and patching to the on-device model. It also accepts any OpenAI-compatible server, so Ollama and vLLM work as drop-ins. Same day, DeepMind shipped [Gemini 3.8 text-to-speech](https://deepmind.google/blog/say-hello-to-gemini-38-text-to-speech/), which Simon Willison tried in a [TTS playground](https://simonwillison.net/2026/Sep/23/gemini-tts-playground/) with the gemini-3.8-flash-tts and flash-lite-tts models, and published a note on [secure server-side memory for Private AI Compute](https://deepmind.google/blog/advancing-private-ai-compute-with-secure-server-side-memory/). The pattern across all three: keep the expensive model for planning and move bulk tokens somewhere cheaper or more private.

## AWS puts a harness in Strands

Mike Vizard reports that [AWS added a harness to the open-source Strands SDK](https://devops.com/aws-adds-harness-to-open-source-sdk-for-building-ai-agents/): a fully assembled agent with shell, file and web tools, skills loaded automatically, long-term memory across runs, resumable by session ID, and a built-in helper agent that takes delegated subtasks with a checklist. A context-window feature offloads bulky tool results to files and caches, which Marc Brooker says cuts tokens by up to 28 percent. AWS said it has no plans to donate Strands to a consortium. The harness is the product now. Around it in the last day: Amp's [one runner, many worktrees](https://ampcode.com/news/one-runner-many-worktrees), Copilot for JetBrains 1.18 with [AI-assisted tool approvals, Codex plan review and org-shared skills](https://github.blog/changelog/2026-09-22-new-features-and-improvements-in-copilot-for-jetbrains), [more ways to request and configure Copilot code review](https://github.blog/changelog/2026-09-23-copilot-code-review-more-ways-to-request-and-configure-reviews), GitLab on [cutting code per agentic flow by 45 percent](https://about.gitlab.com/blog/how-gitlab-reduced-code-per-agentic-flow-ratio/) by moving Flow definitions from YAML into LangGraph, and claude.dev on [making claude.ai 3x faster in two weeks](https://claude.dev/blog/how-we-made-claude-ai-faster/).

## Research: the collaboration tax

Weixiang Sun and colleagues posted a second version of [The Collaboration Tax: How Much LLM Multi-Agent Systems Pay to Coordinate](https://arxiv.org/abs/2608.22152). They model the loss from splitting a task across agents as the team-decentralisation loss of a two-player cooperative game with private information, which gives you a number to estimate before building the multi-agent version. The Strands harness and the GitLab post both raise that question without answering it. Read it next to [Delegated Misalignment](https://arxiv.org/abs/2609.27900) on how multi-agent structures amplify safety risk and [Agora](https://arxiv.org/abs/2609.18094), which uses git as shared memory for research agents. The Jev pile also grew today: [Jev in 25 lines of Python](https://www.nobodywho.ai/posts/jev-in-25-lines/) took 140 points on HN, Alex Molas argues [Jev can't be calibrated](https://www.alexmolas.com/2026/09/23/jev-cant-be-calibrated.html), and Tenuo wrote up [typed decisions, scoped authority](https://tenuo.ai/blog/jev-scoped-authority).

## What to watch

Whether the MemTensor payload reached downstream packages through stolen publish tokens. Whether Anthropic confirms or fixes the AGENTS.md telemetry gate. And whether the Opus 5.5 price cut shows up in weekly-limit reports, or gets absorbed by the larger runs people start once it is cheap.

_Feed note: the code-intel mirror reported its last sync as September 1 and flagged itself stale, yet its items ran through today. Item dates are as the feed reported them._
