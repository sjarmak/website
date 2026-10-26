---
title: Token prices fell up to 80 percent in two months, Gheist dumped CI
  secrets through 13,500 branches, and JetBrains shipped ThinkRail
cadence: daily
track: general
origin: auto
date: 2026-10-26
summary: Max Woolf's tally of nine OpenAI and Anthropic pricing moves since July
  30 framed the weekend, with IBM's CEO calling open weights 90 percent as good
  at a tenth of the cost while Kimi Code and UltraCode users burned five-hour
  quotas in minutes. Wiz detailed Gheist, a stolen-token campaign that planted
  more than 13,500 secret-dumping workflow branches, JetBrains released the
  ThinkRail agent IDE, Google's Data Agent Kit went GA with IAM-enforced
  read-only guardrails, and a 2015 CNN beat GPT-6 Astra and Fable 5.1 at
  skin-lesion diagnosis.
topics:
  - model-pricing
  - open-weight-models
  - security
  - supply-chain
  - developer-tooling
  - mcp
  - evaluation
  - agents
unresolvedFacets:
  - supply-chain
audioUrl: /media/digests/daily-general-2026-10-26.mp3
durationSec: 783
items:
  - title: OpenAI and Anthropic made nine pricing moves in two months, GPT-5.6 Luna
      down 80 percent
    url: https://minimaxir.com/2026/10/cheap-llms/
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: "TheSequence: cheap intelligence meets Meta's $34.9B quarter of capex and
      SpaceXSI's $16.44B"
    url: https://thesequence.substack.com/p/the-sequence-radar-issue-958-last
    source: Newsletter Misc
    category: newsletters
  - title: A 2015 CNN beats GPT-6 Astra and Fable 5.1 at skin-lesion diagnosis, 62
      percent to 42
    url: https://lynchlab.net/llm-skin-cancer
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: "JetBrains ThinkRail: an Apache-2.0 IDE for the pi agent with a worktree
      per task"
    url: https://github.com/JetBrains/thinkrail
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: Google Data Agent Kit GA splits guardrails between an advisory skill and
      an IAM deny on non-read-only MCP tools
    url: https://www.infoq.com/news/2026/10/data-agent-kit-ga/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global
    source: InfoQ
    category: tech_articles
  - title: "MCP-Injector: realistic tool faults cut agent task scores 60 percent,
      and gpt-oss 120B is no more resilient than 20B"
    url: https://arxiv.org/abs/2610.32555
    source: cs.SE updates on arXiv.org
    category: research
  - title: "Wiz: Gheist planted 13,500+ secret-dumping workflow branches across 850+
      accounts with stolen GitHub tokens"
    url: https://www.wiz.io/blog/gheist-attempted-scaled-abuse-of-stolen-github-tokens-stumbles
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: r/opensource bans LLM-built projects and the fight spreads to r/ClaudeCode
    url: https://www.reddit.com/r/ClaudeCode/comments/1xf64wq/claude_projects_are_unwelcomed_on_ropensource/
    source: ClaudeCode
    category: community
highlights:
  - GPT-5.6 Luna went from $1/$6 to $0.20/$1.20 per million tokens; Opus 5.5
    landed at $4/$20 against Opus 5's $5/$25
  - A $19 Kimi Code plan hit its 5-hour limit after $1.37 of API-rate usage;
    UltraCode spent a 5x window in ten minutes on 200+ agents
  - Inception v3 named the right skin lesion first 62 percent of the time
    against 42 percent for GPT-6 Astra and Fable 5.1
  - "Gheist: 13,500+ ci-sync branches, 850+ accounts; GitHub's approval hold
    stopped every public-repo payload but not private ones"
  - MCP faults drawn from 57,240 real issue threads cut task scores from 8.08 to
    3.23; the 120B model was no more resilient
---

Between July 30 and September 29, OpenAI and Anthropic made nine pricing moves, launches included, and the sharpest took GPT-5.6 Luna from $1 to $0.20 per million input tokens and from $6 to $1.20 per million output. Max Woolf tabulated the full run on [minimaxir](https://minimaxir.com/2026/10/cheap-llms/), and the post drew 97 points and 119 comments on Hacker News over the weekend. Opus 5.5 arrived on September 22 at $4 input and $20 output against Opus 5's $5 and $25, GPT-6 Luna came in at $0.10 and $0.50, and GPT-6.1 Sol followed a week later at $2 and $10 with cache reads halved to $0.10. Woolf's line is that "no one cuts prices by 80% unless there is some externality in play," and the externalities the post lists are the expected ones: switching costs near zero, DeepSeek V4 Flash at $0.14 per million input tokens, Kimi K3.1 Pro priced at half of Opus 5.5 with similar benchmark scores, and about 29 providers serving DeepSeek V4.1 Flash on OpenRouter, which drags the open-weight price toward marginal cost. Anthropic's own account of the Opus 5.5 price is that the model needs less compute to serve than Opus 5.

The enterprise version of the argument hit the front page the same night. On IBM's Q3 earnings call, as [The Register reported](https://www.theregister.com/systems/2026/10/22/ibm-ceo-says-open-weight-models-are-now-irresistibly-good-and-cheap-on-prem/5304640), Arvind Krishna said open-weight models are "now 90 percent as effective" as the frontier at 10 to 25 percent of the token cost, and that most businesses can stand up useful on-prem AI in two or three racks.

List prices are falling; the subscription quotas users actually hit are moving the other way. An [Ask HN post](https://news.ycombinator.com/item?id=50222093) from Saturday logged a $19 Kimi Code plan running K3.1 Pro through the official CLI on two small-repository tasks. Neither finished, and the 5-hour quota was gone within minutes after 1.59 million tokens, 1.18 million of them cached input, which prices out at $1.37 on Kimi's published API rates. On r/ClaudeCode a user reported that [UltraCode at extra-high effort](https://www.reddit.com/r/ClaudeCode/comments/1xf5zig/holy_cowultracode_over_200_agents_does_this_mode/) fanned out to more than 200 agents and spent a five-hour window on a 5x plan in ten minutes. Woolf points to the same pattern at OpenAI, which halved the usage allowance on its $200-a-month Codex tier. Cheaper tokens and tighter plans can both be true if tokens per task are climbing faster than price per token is falling, and agent fan-out at that scale suggests they are.

TheSequence's Sunday radar, [Cheap Intelligence, Expensive Ambitions](https://thesequence.substack.com/p/the-sequence-radar-issue-958-last), sets the capital side next to the price side. Meta's quarterly revenue rose 26 percent to $64.6 billion while capital spending reached $34.9 billion and free cash flow went to negative $2.1 billion. SpaceX's AI division, renamed SpaceXSI, booked $7.56 billion of quarterly revenue, more than Starlink's $5.25 billion, on $16.44 billion of capex, with the Cursor acquisition and Grok counted in the growth. Legora raised $550 million at an $8.8 billion valuation on more than $200 million in ARR, and the newsletter's observation about it is the one worth keeping: "A token may be getting cheaper; a lawyer's afternoon remains a valuable reference price." A vendor that prices against the work instead of the token keeps the spread, which is the bet underneath every application company raising money while model prices fall. The editorial ends on the open question: "Everyone can have a growth story. They still need to agree on whose margin it is."

The loudest thread of the weekend, at 248 points and 118 comments, was a small study that cuts against IBM's 90-percent claim for at least one task. Magnus Lynch fine-tuned Inception v3, a 2015 Google architecture, on 68,011 ISIC images and [tested it against GPT-6 Astra and Claude Fable 5.1](https://lynchlab.net/llm-skin-cancer) on 200 biopsy-proven lesions from MILK10k. The CNN put the correct diagnosis first on 62 percent of them; both frontier models managed 42 percent. The triage numbers show the gap more clearly. Asked which lesions were safe to discharge, the two LLMs released only 32 and 22 of the 100 benign ones, a level of caution that amounts to declining to triage, while the CNN released 76. At its preset threshold the CNN also discharged 18 of the 30 melanomas, worse than either LLM, but tuned to the LLMs' level of caution it discharged one or two. Lynch lists the limits up front: 30 melanomas is a small sample, each model ran once, and MILK10k is public, so the LLMs may have seen it. For a narrow classification task, benchmark the small specialist model before assuming the frontier API wins.

JetBrains released [ThinkRail](https://github.com/JetBrains/thinkrail), an Apache-2.0 desktop and browser IDE built around the open-source pi coding agent, and the repository was at 2.2k stars when it reached 122 points on Hacker News. Each task gets its own git worktree and branch, so parallel agents never touch the main checkout, and the workspace follows that branch's pull request, CI checks and review decisions through to merge. A workspace can run several pi sessions at once, each on its own model with a live token and cost display. Specs live as a graph of SPEC.md files beside the code that the agent reads and edits through dedicated spec tools, and any MCP call to a tool not marked read-only waits for confirmation. ThinkRail has no accounts of its own; models come through JetBrains AI sign-in or whatever provider pi is configured for.

That read-only annotation is turning into the line agent platforms enforce. Google's Data Agent Kit went GA with MCP tools for more than 15 Data Cloud services and 37 Apache-2.0 skills, installable into Claude Code, Codex, Cursor, Antigravity and VS Code-compatible editors, and [InfoQ's Steef-Jan Wiggers](https://www.infoq.com/news/2026/10/data-agent-kit-ga/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global) separates its two guardrails carefully. The `accidental-data-loss-prevention` skill tells the agent it "MUST obtain explicit user consent" before a DROP TABLE, a TRUNCATE, or a DELETE without a WHERE clause, which is a request the model is free to ignore. The enforced version is an IAM deny on `mcp.googleapis.com/tools.call`, conditioned on the tool's `isReadOnly` attribute being false and set at the organization, folder or project level, so it holds whatever the agent decides. Blocked tools still appear in `tools/list`, which means the agent can see capabilities it cannot use. Ankit Dongre of viaSocket supplies the caveat: "MCP access is the easy part. The production boundary is permission scope plus repeat-safe execution," because neither IAM nor a dry run tells you whether a write that timed out actually committed.

A paper in arXiv's cs.SE listing measures what happens on the far side of that timeout. Its authors built [MCP-Injector](https://arxiv.org/abs/2610.32555), fault-injection middleware for the MCP tool-call path, and calibrated the fault mix against 57,240 issue and pull-request threads from 1,774 open-source MCP repositories. In a 1,350-cell experiment crossing gpt-oss 20B and 120B with three agent stacks (a custom plan-and-execute loop, the OpenAI Agents SDK and LangChain), realistic faults cut the task-completion score by 60 percent, from 8.08 to 3.23 out of 10. The 120B model kept no larger share of its fault-free score (p = 0.96), and its completion rate under faults was 91.1 percent against the 20B's 95.6 percent. The stacks differed more than the models did, which puts the fix in the framework's error handling instead of a model upgrade.

Wiz Research published its account of [Gheist](https://www.wiz.io/blog/gheist-attempted-scaled-abuse-of-stolen-github-tokens-stumbles), a campaign it has tracked since September 15 that uses stolen GitHub tokens to plant secret-dumping workflows in every repository a token can reach. By October 24 Wiz had recovered more than 13,500 planted branches across more than 850 compromised accounts. Each infection is a `ci-sync-` branch holding a single `.github/workflows/sync-check.yml` committed as `ci: sync config`, which dumps the environment and the full secrets context base32-encoded, since GitHub masks a secret only when it prints verbatim. An environment matrix pulls in environment-scoped secrets, often production credentials, and the tool downloads the log through the API and deletes the run seconds later. There is no command-and-control server to block, because the exfiltration channel is GitHub's own API. GitHub's approval hold on workflow runs in public repositories, in place since July 28, stopped every public-repo payload ("The control worked, and the malicious payloads never ran"). The hold does not cover private repositories or GitHub Enterprise Server, and there the runs completed and CloudTrail showed organizations' AWS roles assumed from attacker branches. Wiz traces the tokens to infostealer logs and earlier supply-chain compromises, March's Trivy incident among them. The Railway compromise covered here yesterday pointed the same way, and Wiz's advice is concrete: hunt for `ci-sync-` branches and runs deleted within a minute of finishing, rotate every secret the repository could reach ("Deleting the run or the branch doesn't undo the exposure"), and scope OIDC trust policies to protected branches or environments.

The community fight of the weekend started when r/opensource's moderators posted a ban under the title "Your tokens aren't valuable: No more AI," which the Hacker News submission summarized as covering solo projects and projects built with LLMs. The argument spread to r/foss, r/SubredditDrama and [r/ClaudeCode](https://www.reddit.com/r/ClaudeCode/comments/1xf64wq/claude_projects_are_unwelcomed_on_ropensource/), where the poster says users who push back are being warned or banned. The policy is blunt, but its premise follows from the price story at the top of this issue: producing a project has never been cheaper, and the hours a stranger spends reviewing it cost what they always did.

What to watch: Kimi K3.1 Pro at half of Opus 5.5's price is the open-weight number the closed labs have not answered, and Woolf expects the next cuts to arrive with the next model launches. With Wiz's data showing what runs when nobody approves a workflow, watch whether GitHub extends its approval hold to private repositories. And an explainer on shattered.io describes [Microsoft Decision-1](https://shattered.io/microsoft-decision-1-qwen3-5-9b-model-2026/) as a 9B model built on Qwen3.5; the feed has no Microsoft post confirming it yet, so wait for the primary source before building on it.

*Feed note: the item mirror reports mirror mode with a last-sync timestamp of September 1, yet it held items ingested through 06:31 UTC on October 26, so the staleness field is misreporting rather than the data being old. The window covers a weekend in which lab and vendor feeds were close to silent, which is why most of today's items reached the field through the Hacker News front page.*
