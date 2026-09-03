---
title: Muse Spark 1.3 and Gemini 3.8 Flash land hours apart, Fable 5.1 tops
  CursorBench, and GitHub trims its agent harness
cadence: daily
track: general
origin: auto
date: 2026-09-03
summary: Meta ships Muse Spark 1.3 with a 90-percent training-opt-in discount
  and open weights promised; Google releases Gemini 3.8 Flash and a gated Flash
  Cyber model; Cursor and Devin publish Fable 5.1 numbers; GitHub and
  FrontierHarness put the cost of agent harnesses under the microscope; Simon
  Willison diffs the Fable 5.1 system prompt; Rachel Laycock argues for review
  by exception.
topics:
  - model-releases
  - coding-agents
  - agent-harness-cost
  - security
  - code-review
  - system-prompts
unresolvedFacets:
  - agent-harness-cost
  - system-prompts
audioUrl: /media/digests/daily-general-2026-09-03.mp3
durationSec: 865
items:
  - title: Introducing Muse Spark 1.3
    url: https://research.meta.ai/blog/introducing-muse-spark-1-3
    source: Meta
    category: product_news
  - title: Gemini 3.8 Flash and 3.8 Flash Cyber
    url: https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/
    source: Google
    category: product_news
  - title: "Claude Fable 5.1 is now available in Cursor: 73.4% on CursorBench 3.2 at
      max effort"
    url: https://rss.xcancel.com/cursor_ai/status/2094852929282879596#m
    source: Cursor
    category: product_news
  - title: Cursor cloud agents can now run on your own infrastructure, with
      auto-scaling machine pools
    url: https://rss.xcancel.com/cursor_ai/status/2095257412781396114#m
    source: Cursor
    category: product_news
  - title: How we make AI coding more cost efficient without sacrificing task quality
    url: https://github.blog/ai-and-ml/github-copilot/how-we-make-ai-coding-more-cost-efficient-without-sacrificing-task-quality/
    source: The GitHub Blog
    category: ai_dev
  - title: "FrontierHarness Eval: 9 harnesses, same model, cost per pass varies 17x"
    url: https://frontierharness.org/
    source: FrontierHarness
    category: community
  - title: Aisle discovered six curl CVEs after OpenAI and Anthropic found zero
    url: https://aisle.com/blog/aisle-discovered-six-curl-cves-after-openai-and-anthropic-found-zero
    source: Aisle
    category: community
  - title: Claude's new system prompt really doesn't want to reproduce song lyrics
    url: https://simonwillison.net/2026/Sep/2/claudes-new-system-prompt/
    source: Simon Willison
    category: tech_articles
  - title: Maybe We Shouldn't Be Reviewing All This Code
    url: https://martinfowler.com/rachels-ramblings/code-review.html
    source: martinfowler.com
    category: tech_articles
highlights:
  - Muse Spark 1.3 benchmarks in the same band as GPT-5.6 Sol and Opus 5, with a
    90-percent-plus discount for training opt-in and open weights promised
  - Gemini 3.8 Flash Cyber posts 86.2% on CyberGym and 47.2% on CWE-Bench
    patching; access is gated through Google's Fairwind program
  - Fable 5.1 scores 73.4% on CursorBench 3.2; Devin Fusion claims 10 to 25
    percent savings by pairing it with a cheaper executor
  - GitHub's harness changes cut Copilot agent cost 2 to 5 percent apiece by
    removing work the model never needed, and RTK-style output trimming made
    tasks more expensive in its tests
  - FrontierHarness finds a 17x cost-per-pass spread across nine harnesses on
    the same model
  - "Rachel Laycock: review architectural changes, security boundaries, and
    large blast radius by exception; shift the rest of the judgment left"
---

Meta's Muse Spark 1.3 is priced more than 90 percent lower if you let Meta train on your traffic. That tier, and Mark Zuckerberg's line that the model ships "frontier performance almost too cheap to meter," set the tone for yesterday afternoon more than any benchmark table did. Google had released Gemini 3.8 Flash and a cybersecurity variant about four hours earlier, so two labs pushed frontier-class coding models out within the same afternoon. The rest of the last day or two was about what those models cost to run: Cursor and Devin published their Fable 5.1 numbers, GitHub explained how it trims agent bills without touching the model, and an independent eval found a 17x cost spread across nine harnesses running the same model.

## Muse Spark 1.3: frontier numbers, a training-data discount, open weights promised

Meta's research post, ["Introducing Muse Spark 1.3"](https://research.meta.ai/blog/introducing-muse-spark-1-3), went up at 19:25 UTC yesterday, and the [developer model page](https://developer.meta.com/ai/models/muse-spark/) drew 92 points and 34 comments on Hacker News within hours. Shengjia Zhao introduced it as the strongest model in the Spark line for agentic and coding work, with the emphasis on longer-horizon tasks and steadier compliance with complex instructions. Zuckerberg's post called it "the biggest jump we've made so far on coding and agentic work," pointed people at Muse Code and the API, and said Muse Spark open weights are "coming soon" alongside a follow-up model he teased without naming.

The benchmark table Meta published places 1.3 above Spark 1.2 and in the same band as GPT-5.6 Sol and Opus 5 on agent, long-context, and coding evaluations. AINews, which made this its lead story, notes Artificial Analysis now ranks it third on its intelligence index and that the comparison is to Opus, not Fable. The figure that drew the most technical attention in the r/LocalLlama thread was MRCR at 512k to 1M tokens: 98.1 percent, which if it holds up is an unusually strong long-context retrieval result. Commenters also speculated the model is trillion-parameter scale, which would make the promised weights a compliance option for organizations rather than something to run at home. The pricing model is the part worth reading twice: standard rates for private traffic, and a discount of more than 90 percent if you opt in to letting Meta train on your usage. Muse Code, the coding agent this model now powers, left beta on Tuesday and was covered in Tuesday's issue.

## Gemini 3.8 Flash and 3.8 Flash Cyber

Google's [announcement post](https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/) describes 3.8 Flash as its most intelligent model so far, with the gains over 3.7 Flash concentrated in software engineering, agentic tasks, and multi-step reasoning. It is rolling out in Antigravity, through the API in Google AI Studio and Android Studio, and in the Gemini app and AI Mode for Pro and Ultra subscribers. The cybersecurity variant is the more unusual release. DeepMind's [companion post on proactive cyber defense](https://deepmind.google/blog/proactive-cyber-defense-for-governments-and-enterprises/) describes 3.8 Flash Cyber as frontier-level at vulnerability detection and automated patching while keeping Flash-tier speed and pricing. The numbers Sundar Pichai cited, as relayed by AINews: 86.2 percent on CyberGym, 47.2 percent on CWE-Bench for patching, and above 70 percent on an internal vulnerability-discovery benchmark spanning 20 languages. DeepMind's thread adds that the model produced 2.6 times as many valid fixes on Chrome codebases and can land fixes in minutes inside an organization's own cloud.

Access to the Cyber model is gated. Google is calling the program Fairwind and describing it as trusted access for national cyber authorities and essential-service providers such as telecom and energy operators. On the general model, the community reaction was fast and price-focused. An r/LLMDevs post claimed 3.8 Flash is [five times cheaper and twice as fast as Opus 5 for similar intelligence](https://www.reddit.com/r/LLMDevs/comments/1w5hucz/gemini_38_flash_is_5x_cheaper_and_2x_faster_than/), and an r/vibecoding user reported switching after hitting Codex's weekly limit two days into a $200 plan. The counterweight in AINews's recap came from Theo (@theo) and Corey Quinn (@QuinnyPig), who pointed at Google's harness ergonomics and at account bans that can reach from a Gmail identity into the Google Cloud account attached to it.

## Fable 5.1 lands in Cursor and Devin

Anthropic's Fable 5.1 announcement was in yesterday's issue; the follow-on data came from the tool vendors on Tuesday. [Cursor](https://rss.xcancel.com/cursor_ai/status/2094852929282879596#m) says it is the most capable model it has run on CursorBench 3.2, scoring 73.4 percent at max effort, and singled out the model's habit of verifying its own work as the reason it can carry hard tasks from start to finish. Cognition's [Devin post](https://devin.ai/blog/fable-5-1) pairs Fable 5.1's planning with a cheaper executor in what it calls Devin Fusion and claims 10 to 25 percent savings on real work. Enterprises can turn on Fable 5 and 5.1 with zero data retention under a limited-time exemption while Anthropic rolls out its Enterprise Frontier Safeguards, so that switch has a clock on it. CodeRabbit published its own model review the same day. The cost math cuts both ways: AINews summarized the pricing change as a 75 percent cache price cut against roughly 70 percent more output tokens, which is why the vendor-level savings claims matter more than the rate card.

## Cursor moves cloud agents onto your machines

Cursor's other announcement came late yesterday: [cloud agents can now run on infrastructure you manage](https://rss.xcancel.com/cursor_ai/status/2095257412781396114#m), including pools of machines that scale with demand, while the agent loop itself stays in Cursor. The point is access to internal services and specialized hardware that a hosted sandbox cannot reach. Supported providers at launch are AWS Lambda, Coder, Cloudflare, Daytona, E2B, Modal, Namespace, and Vercel, with details in the [self-hosted machines post](https://cursor.com/blog/self-hosted-machines). Read alongside the Fusion and ZDR notes above, the vendor pitch is converging: keep the orchestration in the product, push the expensive or sensitive parts onto the customer's footprint.

## GitHub: the local-metric trap in agent cost

Erik Kristensen's post on the GitHub blog, ["How we make AI coding more cost efficient without sacrificing task quality"](https://github.blog/ai-and-ml/github-copilot/how-we-make-ai-coding-more-cost-efficient-without-sacrificing-task-quality/), is the most useful engineering write-up of the last day or two. The framing sentence: token count of individual interactions is not a meaningful measure of efficiency. GitHub tested RTK, a utility that shortens shell output before the agent reads it, and found that in its harness the model reopened or reran commands to recover what was cut, so tasks used more tokens overall. The four changes that shipped are modest on their own. Removing line-number prefixes from the file viewer, which current edit tools no longer use, cut inference cost about 5 percent offline and about 3 percent per user online. A selective compressor leaves cat, git diff, and arbitrary script output untouched and compresses only install, build, test, and progress noise, and it tracks how often the agent goes back for the original as a signal that it cut too much. A meta-prompting loop halved the task-tool prompt, but the first online run serialized independent sub-agents until a regression test and a one-sentence fix ("Independent agents can run in parallel; consider side effects") restored the behavior; the shipped prompt saves about 1,300 tokens per turn and 2.9 percent of cost per active hour. Batching completion notifications so the agent gets background results without a retrieval turn saved another 2.3 percent. A tighter file-tool instruction set that helped Copilot code review raised costs in the CLI and was not shipped. The closing line is the thesis: none of these changes made the model smarter; they removed work the model never needed to do.

## Same model, nine harnesses, 17x cost spread

[FrontierHarness Eval](https://frontierharness.org/) surfaced on Hacker News yesterday with the claim that nine harnesses running the same model differ by 17x in cost per passing task. That is GitHub's argument measured from outside: the scaffold is now where the money goes. ByteDance Seed's HarnessDev paper, posted to arXiv on Tuesday and summarized in AINews, scores models on building and then improving their own harness from a weak seed, with execution-token cost part of the objective. Across six creator models and 2,207 held-out tasks, the generated harnesses still lag mature human-built ones on code, search, and research, and match or beat them on writing and ML experimentation. Self-improving harnesses help, unevenly, and the gains only partly transfer.

## Aisle says it found six curl CVEs where OpenAI and Anthropic found none

Aisle's post, ["Aisle discovered six curl CVEs after OpenAI and Anthropic found zero"](https://aisle.com/blog/aisle-discovered-six-curl-cves-after-openai-and-anthropic-found-zero), reached 72 points and 23 comments on Hacker News yesterday. The headline claim is a direct comparison on one of the most heavily audited codebases in open source, published the same afternoon Google launched a model whose pitch is autonomous vulnerability discovery. The score only means something if each tool saw the same curl revisions under the same time and token budget, so check what Aisle compared before repeating the number.

## Simon Willison on the Fable 5.1 system prompt

[Simon Willison's notes on the published Fable 5.1 system prompt](https://simonwillison.net/2026/Sep/2/claudes-new-system-prompt/) find that most of the diff from Fable 5 is about copyright. The new prompt bars reproducing song lyrics, poems, and book passages (pre-1929 works excepted), days after Sony Music Publishing and Warner Chappell sued Anthropic, and extends the ban to copyrighted characters and logos rendered as SVG or code, with a "skateboarding axolotl" offered as the substitute for Sonic. It also tells Claude to avoid the words "genuinely," "honestly," and "straightforward," and replaces the old end-conversation warning procedure with an instruction that Claude "needn't apologize" and should not become "increasingly submissive," though Claude itself says the end-conversation rules live in unpublished feature blocks. Two smaller firsts: the prompt now links to non-Anthropic sites (dancesafe.org, tripsit.me, psychonautwiki.org), and it states a reliable knowledge cutoff of June 2026 with the current date injected near the end so the rest of the prompt caches. Willison built a repo, simonw/claude-system-prompts, with back-dated synthetic commits for every published version, and had GPT-5.6 Luna write the diff summaries because he did not trust Claude to summarize its own prompt. Fable 5.1 built the tooling.

## Rachel Laycock: review by exception

Over at martinfowler.com, Rachel Laycock's ["Maybe We Shouldn't Be Reviewing All This Code"](https://martinfowler.com/rachels-ramblings/code-review.html) answers Brian Houck of DX with numbers first: Meta's significant lines of code per human-landed diff rose 106 percent in a year, and DX's median PR size rose 64 percent. Her argument is that line-by-line review was a proxy for judgment applied late, and the proxy no longer scales. She wants that judgment shifted left into pairing, design sessions, fitness functions, and automated lint and security gates, with human review reserved for architectural changes, security boundaries, and anything with a large blast radius. "We need engineers to understand systems, not diffs." An AI reviewer standing in for the human, in her framing, is automating the ceremony rather than the judgment, which makes it a pointed companion to GitHub's approval-capable Copilot review covered here yesterday.

## What to watch

Meta's open-weights release and the follow-up model Zuckerberg teased; whether Fairwind opens beyond national cyber authorities and utilities; the end date of Cognition's ZDR exemption once Anthropic's Enterprise Frontier Safeguards ship; and whether curl's maintainers respond to Aisle's six-CVE claim. The pricing conversation has moved from model rate cards to harness design, and the two most concrete pieces of evidence in the last day or two, GitHub's A/B tests and an outside eval, agree on the shape of the problem.

*Sourcing note: the code-intel mirror reported its last production sync at 2026-09-01 12:00 UTC, about 47 hours before this issue was generated. The local ingest it reads from ran through 2026-09-03 07:21 UTC, and every item above was checked against that store.*
