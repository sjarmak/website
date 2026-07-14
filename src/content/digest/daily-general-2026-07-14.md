---
title: Grok Build CLI uploaded whole repos to a Google bucket; Codex hit 7M users
cadence: daily
track: general
origin: auto
date: 2026-07-14
summary: A packet capture showed xAI's Grok Build CLI uploading entire git
  repos, and in one case a whole home directory, to a Google Cloud bucket, with
  only zero-data-retention enterprise customers exempt. Codex hit 7M users,
  adding a million in roughly a day, while Apple sued OpenAI over trade secrets
  and an analyst pegged its ad business at 90% under forecast. Plus Devin Fusion
  adopts Fable 5 at a lower cost per task than Opus 4.8, Anthropic maps Claude's
  values across models and languages, and new research follows agentic code past
  the merge.
topics:
  - coding-agents
  - agent-security
  - model-releases
  - ai-business
  - research
unresolvedFacets:
  - agent-security
audioUrl: /media/digests/daily-general-2026-07-14.mp3
durationSec: 592
items:
  - title: xAI's Grok Build CLI Uploads Git Repositories to a Google Cloud Bucket
    url: https://www.internationalcyberdigest.com/xais-grok-build-cli-uploads-entire-git-repositories-to-a-google-cloud-bucket/
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: "[AINews] Codex usage up >10x in 6 months to 7M users, +1M in the past
      ~day; did Codex overtake Claude Code??"
    url: https://www.latent.space/p/ainews-codex-usage-up-10x-in-6-months
    source: Newsletter Misc
    category: newsletters
  - title: Apple sues OpenAI, its employees claiming theft of trade secrets
    url: https://www.bbc.com/news/articles/cy8w379e091o?utm_source=tldrfintech
    source: TLDR
    category: newsletters
  - title: OpenAI's Ad Business Is on Pace to Miss Its Own Forecast by 90%, Analyst
      Says
    url: https://www.adweek.com/media/openais-ad-business-is-on-pace-to-miss-its-own-forecast-by-90-analyst-says/
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: Devin Fusion now incorporates Fable 5, at a lower cost per task than Opus
      4.8
    url: https://rss.xcancel.com/cognition/status/2076714965344342382#m
    source: Cognition / @cognition
    category: product_news
  - title: How the values Claude expresses vary across models and languages
    url: https://www.anthropic.com/research/claude-values-models-languages
    source: Anthropic / @AnthropicAI
    category: product_news
  - title: Evaluating GPT-5.6 Luna, Terra, and Sol Against GPT-5.5 for AI Code
      Security
    url: https://semgrep.dev/blog/2026/gpt-5-6-benchmarks-ai-code-security
    source: Semgrep Blog
    category: product_news
  - title: Do These Violent Delights Have Violent Ends? Measuring the Post-Merge
      Fate of Agentic Code
    url: https://arxiv.org/abs/2607.09902
    source: cs.SE updates on arXiv.org
    category: research
highlights:
  - A packet-capture gist showed Grok Build CLI shipping whole git repos (and
    one home directory) to a Google Cloud bucket; only zero-data-retention
    enterprise customers are exempt
  - Codex reached 7M users, +1M in roughly a day; the last public Claude Code
    number is 2M from February
  - "Cognition: Fable 5 in Devin Fusion costs less per task than Opus 4.8
    because it delegates instead of micromanaging"
  - Anthropic mapped Claude's expressed values onto four axes across 300K+
    conversations; personality now has measurable coordinates
---

A packet capture did the day's real reporting: xAI's Grok Build CLI [has been uploading entire git repositories to a Google Cloud bucket](https://www.internationalcyberdigest.com/xais-grok-build-cli-uploads-entire-git-repositories-to-a-google-cloud-bucket/), and in at least one intercepted session a user's whole home directory. A [gist cataloguing exactly what the CLI sends](https://gist.github.com/cereblab/dc9a40bc26120f4540e4e09b75ffb547) drew 65 points and 26 comments on Hacker News over the weekend, and by Monday [Gergely Orosz was relaying messages](https://rss.xcancel.com/GergelyOrosz/status/2076728680236138572#m) from developers whose codebases went up without their knowledge or consent. The carve-out is the damning part: only enterprise customers with zero data retention turned on are exempt, which makes everyone else, as Orosz put it, probably involuntary training data. SpaceXAI's response opened with "we care deeply about your privacy," Replit's Amjad Masad reposted the story captioned "our code," and the most useful framing in the pile is Orosz's comparison to Cursor, which indexed codebases for years without ever shipping them wholesale to a vendor bucket. New coding harnesses live or die on exactly this kind of trust, and it burns in a day.

The other number of the last day belongs to OpenAI: [Codex is at 7M users, up more than 10x in six months, with a full million added in roughly the past day](https://www.latent.space/p/ainews-codex-usage-up-10x-in-6-months). The arithmetic comes from swyx's Latent Space crew, who noticed the 7M figure landed about 24 hours after OpenAI's Tibo Sottiaux announced 6M actives. Whether Codex has overtaken Claude Code is unknowable from outside; the last public Claude Code number was 2M back in February, and Anthropic has not updated it. Last week's Codex-as-superapp reorg read as strategy. This reads as momentum, wherever the exact crossover sits.

OpenAI's Monday was rougher everywhere else. [Apple is suing OpenAI and several of its employees for theft of trade secrets](https://www.bbc.com/news/articles/cy8w379e091o?utm_source=tldrfintech), a suit Michael Spencer's AI Supremacy reads as [the end of OpenAI's run at AI wearables](https://www.ai-supremacy.com/p/openai-just-lost-the-ai-wearables-race-apple-lawsuit), and an analyst note reported by Adweek has [OpenAI's ad business pacing 90% under its own forecast](https://www.adweek.com/media/openais-ad-business-is-on-pace-to-miss-its-own-forecast-by-90-analyst-says/). A coding agent adding a million users a day while the lawyers and the ad sellers have the worst week of the quarter is a strange split screen for one company.

On the tooling side, [Cognition folded Fable 5 into Devin Fusion](https://rss.xcancel.com/cognition/status/2076714965344342382#m) and published the observation practitioners will actually use: Fable 5 runs at a lower cost per task than Opus 4.8 despite the higher sticker price, because it delegates like a competent manager, writing full specs for its sidekick models and trusting them with execution, where Opus 4.8 tends to redo work, reread referenced files, and stuff its own context window. The savings are not uniform; serial debugging still wants one model holding accumulated context across the whole trace. Fusion with Fable 5 is live as an agent preview in Devin Cloud.

Anthropic published research on [how the values Claude expresses vary across models and languages](https://www.anthropic.com/research/claude-values-models-languages), built on 300K+ anonymized conversations. The four axes it extracts (Deference vs. Caution, Warmth vs. Rigor, Depth vs. Brevity, Candor vs. Execution) turn model-personality talk into something measurable: Sonnet 4.6 skews playful and affirming, Opus 4.7 gives more candid critiques, and the same assistant leans warm in Hindi and Arabic but rigorous in Russian, where it more often asks the user for supporting evidence. Anyone routing a multi-model fleet has felt these differences; now there are named axes to argue about.

GPT-5.6 kept compounding after last Thursday's launch. [Semgrep benchmarked Luna, Terra, and Sol against GPT-5.5 on AI code security](https://semgrep.dev/blog/2026/gpt-5-6-benchmarks-ai-code-security) and landed where OpenAI's own "High" cybersecurity-capability rating pointed: the jump helps attackers and defenders about symmetrically. The three models also went [generally available on Amazon Bedrock](https://aws.amazon.com/about-aws/whats-new/2026/07/openai-gpt-sol-terra/), which matters to every team whose compliance story begins with "it has to run inside AWS."

The research pick asks what happens after the merge button. [Do These Violent Delights Have Violent Ends?](https://arxiv.org/abs/2607.09902), from Chunqiu Steven Xia and Courtney Miller, measures the post-merge fate of agentic code: prior evaluations stop at PR acceptance and review effort, treating merge as the finish line, while this work follows agent-written changes into the tree to see whether they survive, get reverted, or get rewritten. It pairs well with the 448-developer study on [where practitioners draw the line on AI autonomy](https://arxiv.org/abs/2607.00533). Merge rate was always a proxy; whether the code stays is the number teams actually care about.

swyx closed the day by [counting the frontier models due before January](https://rss.xcancel.com/swyx/status/2076727753924337706#m): GPT 6, Fable 5.5, Gemini 3.5 Pro, Grok 5, Spark 2, Kimi 3, and half a dozen more, the most multipolar the frontier has ever looked. Two things to watch this week: whether Anthropic answers the Codex numbers with a Claude Code figure of its own, and whether xAI explains the bucket.
