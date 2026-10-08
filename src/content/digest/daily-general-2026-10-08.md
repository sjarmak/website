---
title: Claude Haiku 5.5 lands at GPT-6 Luna's price, and Anthropic attaches API
  credits to subscriptions
cadence: daily
track: general
origin: auto
date: 2026-10-08
summary: "Anthropic released Claude Haiku 5.5 at exactly GPT-6 Luna's
  $0.10/$0.50 price up to 100K tokens, halved Sonnet 5.5 cache reads, and gave
  Max and Team subscribers monthly API credits equal to their plan, while OpenAI
  rolled GPT-6 out to every ChatGPT user. GitHub made local sandboxing for
  Copilot generally available, and Cloudflare, an arXiv paper, and a Stack
  Overflow series converged on the same lesson: put the deterministic layer
  first, because stacked LLM judges miss together."
topics:
  - model-releases
  - pricing
  - agent-tooling
  - sandboxing
  - agent-architecture
  - evals
  - developer-productivity
unresolvedFacets:
  - sandboxing
audioUrl: /media/digests/daily-general-2026-10-08.mp3
durationSec: 768
items:
  - title: Claude Haiku 5.5
    url: https://simonwillison.net/2026/Oct/7/claude-haiku-5-5/
    source: Simon Willison's Weblog
    category: tech_articles
  - title: GPT-6 and Intelligent UI for everyone
    url: https://openai.com/index/gpt-6-for-everyone
    source: OpenAI News
    category: product_news
  - title: Local sandboxing for GitHub Copilot now generally available
    url: https://github.blog/changelog/2026-10-07-local-sandboxing-for-github-copilot-now-generally-available
    source: Changelogs – The GitHub Blog
    category: product_news
  - title: Building an evidence-grounded agentic security operations harness on
      Cloudflare
    url: https://blog.cloudflare.com/agentic-security-operations/
    source: The Cloudflare Blog
    category: product_news
  - title: "Evaluate the Stack, Not the Layer: Do Deterministic and LLM Gates for
      Agent Actions Fail Independently?"
    url: https://arxiv.org/abs/2610.07359
    source: cs.AI updates on arXiv.org
    category: research
  - title: "Part 1: Make your AI agents boring: the determinism layer"
    url: https://stackoverflow.blog/2026/10/07/part-1-make-your-ai-agents-boring-the-determinism-layer/
    source: Stack Overflow Blog
    category: tech_articles
  - title: Survey Finds AI-Generated Code Increases Debugging and Failure Rates and
      Creates a Comprehension Gap
    url: https://www.infoq.com/news/2026/10/survey-complex-codebases-agents/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global
    source: InfoQ
    category: tech_articles
highlights:
  - Haiku 5.5 matches GPT-6 Luna at $0.10/$0.50 per million tokens up to 100K,
    then steps up 5x; a new tokenizer adds ~1.25x tokens on the same prompt
  - "Artificial Analysis: Intelligence Index 43 (up 26 from Haiku 4.5),
    Terminal-Bench 4.0 from 0% to 33%, but ~162k output tokens per task at max
    effort, ~3x Luna"
  - Sonnet 5.5 cache reads halved to $0.10/M; Max 5x/20x/Team subscribers get
    $100/$200/up to $500 in monthly API credits that work in third-party
    harnesses
  - GitHub Copilot local sandboxing is GA on Microsoft eXecution Container, with
    enterprise-enforced policies over files, network, and Git credentials
  - Cloudflare's security harness keeps agents out of evidence collection
    entirely after a single-agent prototype hallucinated unsupported claims
  - "arXiv: two stacked LLM judges compose to only ~1.2-1.4 independent layers
    (phi +0.43); a rule layer plus one judge reaches ~1.9-2.1"
---

Ten cents per million input tokens, fifty cents out. That is Anthropic's price for Claude Haiku 5.5, released yesterday, and it is exactly what OpenAI charges for GPT-6 Luna, the small model it shipped last month. [Simon Willison's writeup](https://simonwillison.net/2026/Oct/7/claude-haiku-5-5/) reads the fine print: the Luna match holds only up to 100,000 tokens of prompt, after which Haiku steps up 5x to $0.50 in and $2.50 out, where Luna's own step at 272,000 tokens only reaches $0.20 and $0.75. Haiku 5.5 also ships a less generous tokenizer; his token counter shows the same long prompt costing about 1.25x as many tokens as on Haiku 4.5, a hidden price rise. The model will not let you disable reasoning and defaults to medium effort. His verdict: inside 100K tokens Haiku costs the same as Luna and reports higher scores, and above 100K Luna is the better deal.

The independent numbers, collected in [AINews' launch roundup](https://www.latent.space/p/ainews-claude-haiku-55-better-than), say the comparison is earned. Artificial Analysis scores it 43 on its Intelligence Index at max effort, 26 points above Haiku 4.5, just ahead of GLM-5.3 Flash at 42, Gemini 3.8 Flash at 41 and Luna at 38, and 13 points behind Sonnet 5.5. Terminal-Bench 4.0 goes from 0% on the old Haiku to 33%. The price of that score is tokens: at max effort it spends about 162k output tokens per Index task, roughly 3x Luna, and it stays more verbose at matched scores. A pre-release safety bug has it over-refusing on AutomationBench-AA, 35% against 53 to 60% for its peers, and Anthropic says a fix is in progress. Context is now 1M tokens, up from 200k. Cursor, GitHub Copilot and Devin shipped support the same day, with Devin reporting 58.4% on FrontierCode 1.1 at roughly an eighth of Sonnet 5's cost per task.

The pricing moves around the model may matter more than the model itself. Sonnet 5.5 cache reads were halved to $0.10 per million tokens, which Anthropic says makes most long-running agent work about 20% cheaper. Max and Team subscribers now receive monthly Claude Platform API credits, $100 on Max 5x, $200 on Max 20x and up to $500 pooled on Team, equal to the subscription price, spendable on any model and inside third-party harnesses, and the API can now be set to stop rather than auto-reload when the balance runs out. The credits do not roll over. Simon reads it as Anthropic closing most of the gap with OpenAI's policy of letting Codex subscribers spend their plan on API calls, and r/ClaudeCode read the same announcement as the end of subscription-backed Agent SDK usage, since that traffic now draws from the credit pool.

OpenAI's answer, published the same day, was distribution rather than price. [GPT-6 is rolling out to every ChatGPT user worldwide](https://openai.com/index/gpt-6-for-everyone), bundled with what OpenAI calls Intelligent UI: responses that render visuals and interactive elements you can explore in place rather than as blocks of text. The post is short on mechanism. The practitioner reading is that the Luna, Sol and Astra tiering from DevDay now has a consumer default, on the day Anthropic reset the price floor beneath it.

[Local sandboxing for GitHub Copilot is generally available](https://github.blog/changelog/2026-10-07-local-sandboxing-for-github-copilot-now-generally-available) in the Copilot CLI, the Copilot app and VS Code sessions using Agent Host. It runs on Microsoft eXecution Container, which translates one sandbox policy into native OS controls on Windows, macOS and Linux. Policies limit which files and directories agent-run commands can read or write, gate internet and local-network access, fence off Git and GitHub CLI credentials, and extend to local MCP servers and language servers where supported. Enterprise-managed settings can require sandboxing and stop developers from weakening it, the policy applies regardless of which model Copilot is using, and it costs nothing extra. The same changelog batch added local model discovery to the Copilot CLI and a purpose-built model for leaked-secret detection, and Docker's new docker-agent repository hit Hacker News the same afternoon. Combined with Apple's full-disk-access change last week, the OS-level sandbox is turning into a default rather than a hardening step.

Cloudflare published the most useful architecture post of the day: [an evidence-grounded agentic security operations harness](https://blog.cloudflare.com/agentic-security-operations/) now in early beta inside Managed Defense. The first prototype gave one general-purpose agent the whole investigation, and it hallucinated claims the evidence did not support. Cloudflare names three failures: context became authority, with a detection treated as proof; scope drifted to the wrong account or time range; and failure disappeared, because a timed-out lookup read the same as "checked and not found". The fix was to take agents out of the front half entirely. Deterministic code runs versioned reconnaissance workflows and freezes a replayable snapshot, Cloudflare's open-source Clef decision model triages known noise on Workers AI, then four specialist agents run in parallel and a synthesis agent that cannot fetch new evidence combines their typed findings. Application code checks that every citation exists and supports its claim. Deeper analysis uses GPT-5.6 Cyber and Mythos through OpenAI's Daybreak Defense Network. The advisory distinguishes not checked, checked with no match, and checked with evidence of absence, and makes no recommendation when evidence is insufficient. InfoQ covered the post the same day.

A paper on arXiv puts numbers on why that structure is right. [Evaluate the Stack, Not the Layer](https://arxiv.org/abs/2610.07359), by Chenglin Yang, tests the assumption that stacked runtime gates on agent tool calls have errors that multiply. On 1,119 labelled agent actions across three corpora, with one deterministic rule layer and four LLM judges, any two judges compose to only about 1.2 to 1.4 multiplication-equivalent layers; their misses correlate, with a median phi of +0.43 across all six pairs. The rule layer plus one judge composes to 1.86 to 2.09 layers, close to independent. Solo accuracy does not predict what a layer adds: a cloud rule pack cut the rule layer's solo miss rate by 20% and added no new joint coverage. One judge tier was also served by an unrequested model version in 50 of 112 batches, which overturned a pre-declared analysis rule; the author reports both outcomes. The lesson matches Cloudflare's: the deterministic layer earns its place, and a second LLM judge buys far less than it appears to.

Stack Overflow published a three-part series on the same theme yesterday, starting with [Make your AI agents boring: the determinism layer](https://stackoverflow.blog/2026/10/07/part-1-make-your-ai-agents-boring-the-determinism-layer/) by Varun Jindal, followed by a part on evals as a deployment gate and how to detect when they drift, and a part on the confidence layer, knowing when your agent does not know. Read alongside the paper, it is a practitioner's version of the same argument.

On the cost side of all this generated code, [InfoQ reports a survey](https://www.infoq.com/news/2026/10/survey-complex-codebases-agents/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global) by Coleman Parkes for Undo, a vendor of AI root-cause analysis, finding that coding agents have sped up generation and shifted the bottleneck to debugging, code comprehension and maintenance. Read it with the sponsor in mind, but the convergence was loud: JetBrains' Gleb Malkov wrote the same day that faster developers do not make a faster team, from discovery calls with engineering organizations starting at a 16-developer agency; Swimm titled a post "We May Be Creating Legacy Code Faster Than Ever"; Criteo's engineering blog asked which skills AI cannot develop for junior engineers; and DevOps.com asked who trains the next cohort if agents take the entry-level work.

Watch three things. Artificial Analysis has not yet modelled Haiku's 5x price step above 100K tokens, so the cost-per-task numbers that decide whether it displaces Luna in agent fleets are still pending, as is the re-run after the over-refusal fix. OpenAI has not yet responded to the API-credit move. And with Copilot, Apple, and Cloudflare all shipping policy-enforced boundaries in the same fortnight, the question for anyone running agents locally is no longer whether to sandbox but which policy format wins.

*Feed note: the code-intel mirror reported its last sync as 2026-09-01, but every item in this issue was ingested at 08:05 UTC on 2026-10-08, so the staleness counter is wrong rather than the data.*
