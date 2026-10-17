---
title: Anthropic's $16.8bn quarter, Goodfire says neurons are clean, Muse Spark Open
cadence: daily
track: general
origin: auto
date: 2026-10-16
summary: Anthropic tells investors Q3 revenue hit $16.8bn at $1.70 per compute
  dollar; Goodfire's Cammarata claims polysemanticity dissolves under agentic
  analysis; Meta ships Muse Spark Open weights; Modal passes $1B ARR on
  sandboxes; GitHub agentic autofix goes GA; Netflix benchmarks JetBrains code
  intelligence in Claude Code and Codex; JPMorgan blocks outside agents;
  prompt-cache pauses double session cost; CodeHealth predicts agent review
  spend.
topics:
  - anthropic
  - interpretability
  - open-weights
  - agent-infrastructure
  - code-security
  - coding-agents
  - agent-payments
  - prompt-caching
  - code-review
unresolvedFacets:
  - anthropic
  - interpretability
  - agent-infrastructure
  - code-security
  - agent-payments
  - prompt-caching
audioUrl: /media/digests/daily-general-2026-10-16.mp3
durationSec: 826
items:
  - title: Anthropic tells investors quarterly revenue up nearly 50% to $16.8bn
      ahead of IPO
    url: https://simonwillison.net/2026/Oct/15/anthropic-tells-investors/
    source: Simon Willison's Weblog
    category: tech_articles
  - title: "[AINews] Agents disprove Polysemanticity; greatly improve
      Interpretability & Alignment"
    url: https://www.latent.space/p/ainews-agents-disprove-polysemanticity
    source: Newsletter Misc
    category: newsletters
  - title: Muse Spark Open
    url: https://research.meta.ai/blog/muse-spark-open
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: "[AINews] Modal's $1B ARR, $16B Series D makes it NYC's newest AI Infra
      Decacorn"
    url: https://www.latent.space/p/ainews-modals-1b-arr-16b-series-d
    source: Newsletter Misc
    category: newsletters
  - title: Agentic autofix for code scanning alerts general availability
    url: https://github.blog/changelog/2026-10-15-agentic-autofix-for-code-scanning-alerts-general-availability
    source: Changelogs – The GitHub Blog
    category: product_news
  - title: How Netflix Made AI Coding Agents More Efficient with JetBrains IDE
      Intelligence
    url: https://blog.jetbrains.com/ai/2026/10/how-netflix-made-ai-coding-agents-more-efficient/
    source: JetBrains Company Blog
    category: product_news
  - title: JPMorgan blocks outside AI agents from directly accessing customer accounts
    url: https://www.cnbc.com/2026/10/13/jpmorgan-ai-agents-account-access.html?utm_source=tldrfintech
    source: TLDR
    category: ai_dev
  - title: Three 6-minute pauses double the input cost of a 20-turn Claude Sonnet
      5.5 agent session
    url: https://www.reddit.com/r/LLMDevs/comments/1x6mlt5/three_6minute_pauses_double_the_input_cost_of_a/
    source: LLMDevs
    category: community
  - title: "CodeHealth Predicts the Token Cost of Agentic Code Review: A
      Pre-Registered Study of 465 Agent-Authored Pull Requests"
    url: https://arxiv.org/abs/2610.21914
    source: cs.SE updates on arXiv.org
    category: research
highlights:
  - Anthropic booked $16.8bn in Q3, earning $1.70 per $1 of compute at an 11%
    adjusted operating margin, and cut distillation revenue that had reached
    5-7% of the total
  - Goodfire's Nick Cammarata claims 90% of Qwen-32B neurons have one job and
    can be read directly, a result that would sideline much of the
    sparse-autoencoder tooling built since 2023
  - Muse Spark Open scores 39 on the Artificial Analysis index, first among US
    open-weight models, but ranks last of nine on the agentic evals
  - Modal's Sandboxes product alone is at a $300M run rate, with nearly 3
    billion sandboxes spun up for agent-written code
  - GitHub's agentic autofix reruns CodeQL before opening a draft PR, batching
    up to 25 alerts
  - Netflix measured 20-30% token and time savings in Claude Code and Codex from
    JetBrains' headless index, up to 65% on navigation tasks
  - A six-minute pause past Anthropic's five-minute cache TTL rewrites the whole
    context at 25x the read price on Sonnet 5.5
---

$16.8bn in one quarter. That is what Anthropic told investors it booked for July through September, up from $11.5bn in the second quarter and about $4.8bn in the first, according to the FT report that [Simon Willison took apart line by line](https://simonwillison.net/2026/Oct/15/anthropic-tells-investors/). Two details matter more than the headline. Anthropic earned $1.70 for every $1 spent on compute in the third quarter, with adjusted operating margins of 11%, which is the first time the unit economics have been stated this plainly. And distillation, meaning rival labs training on Claude outputs through heavy API use, was 5 to 7 percent of revenue before Anthropic cut it back "materially" in Q3. Willison's napkin math: if distillation was 5% of Q2, unnamed other labs spent over half a billion dollars in a single quarter distilling Anthropic's models. The annualized run-rate framing that used to dominate these communications is gone; these are plain quarterly figures ahead of an IPO. The AI Daily Brief led its Thursday episode with the revenue surge, alongside CoreWeave's debt troubles.

The loudest thing on the timeline was not a model. Nick Cammarata at Goodfire published an essay titled "Neural Networks Are Already Clean", and [AINews made it the title story](https://www.latent.space/p/ainews-agents-disprove-polysemanticity) over an open-weight release from Meta. The working theory: polysemanticity and superposition, the tangled neurons that pushed the field toward sparse autoencoders and other "unfolding" models, mostly dissolve under agentic analysis. The figure circulating is that 90% of neurons in Qwen-32B have one job and can be studied directly, without a second model to decompose them. Cammarata's thread drew 319K views in a day. Deedy Das called it "one of the most important results in AI, period", and roon said it may be remembered as "a major moment in scientific history" and that alignment could become normal science. A one-day-old essay deserves the caution any one-day-old essay deserves. The field spent three years building tooling on the premise that neurons are entangled, and the strongest version of this result would mean much of that machinery was solving a problem agents can work around. Watch for replication on a model that is not Qwen-32B, and for whether "one job" survives the adversarial probing that found polysemanticity in the first place.

The release AINews bumped was real. [Meta published the weights of Muse Spark Open](https://research.meta.ai/blog/muse-spark-open), an 816B-total, 42B-active mixture-of-experts model with a 1M-token context that takes text, image, video and audio input, and [it landed on Amazon SageMaker JumpStart the same day](https://aws.amazon.com/about-aws/whats-new/2026/01/muse-spark-open-on-sagemaker-jumpstart/). From the AINews architecture recap: 62 decoder layers, all MoE, 256 experts per layer with 8 active per token, hybrid attention with 46 layers on a 2,048-token sliding window and 16 attending to full context, and no shared experts, which makes it the only major US open model built that way. Artificial Analysis scores it 39 on its Intelligence Index, first among US open-weight models but behind GLM-5.3 at 45 and Kimi K3 at 44, and the whole gap to GLM-5.3 comes from the four agentic evaluations, where Muse Spark Open ranks last of the nine highest-scoring open models. It uses 40k output tokens per index task, the fewest in that group. Launch pricing on Together, Fireworks and Baseten is $1.25 per million input tokens and $4.25 output. BF16 weights are about 1.6TB; the NVFP4 checkpoint, which quantizes only the experts, comes to about 530GB and runs on 8× H200 or two 512GB M5 Ultra Mac Studios. The license requires "Built with Muse Spark Open" attribution and a separate agreement for model-as-a-service businesses above $20M in revenue. Nathan Lambert called the license trash in the same breath as saying the release cuts the US–China open-model gap by about half. Several posters put it at roughly Muse Spark 1.2 level, weaker than Meta's closed Spark 1.3.

Modal crossed $1B in annualized run rate and raised a $750M Series D at a $15.75B valuation led by Accel, [per AINews](https://www.latent.space/p/ainews-modals-1b-arr-16b-series-d). Usage has tripled since the Series C and the company says it has grown more than 15x year over year. The number agent builders should note is the one Erik Bernhardsson put in his fundraise post: Sandboxes, launched in 2023 when people started using LLMs to generate code, is a $300M run-rate product on its own, close to 3 billion sandboxes spun up, scaling to a million concurrent. Running untrusted agent-written code in isolation is now a business large enough to have its own decacorn.

GitHub and GitLab both shipped agent plumbing in the last day. [Agentic autofix for code scanning alerts went generally available](https://github.blog/changelog/2026-10-15-agentic-autofix-for-code-scanning-alerts-general-availability): assign a CodeQL alert to Copilot and it explores the relevant files, proposes a fix, reruns CodeQL to confirm the alert closes, iterates if needed, then opens a draft pull request with the validation steps written out. You can batch up to 25 alerts into one PR or drive it from the REST API by setting assignees to copilot-swe-agent[bot]. It works on default-branch alerts only, needs an enterprise admin to enable a new policy, and bills AI Credits against the Code Security budget plus Actions minutes. The same changelog day brought AI Scan for pull requests to GA. GitLab's launch list was [its MCP server going GA](https://about.gitlab.com/blog/mcp-server-ga/), a Secrets Manager GA, and governed code review for agent-authored merge requests. The CodeQL rerun before the PR opens is the part worth copying into any agent you run against security findings; a fix that is not re-verified by the scanner that found the problem is a guess.

Netflix published numbers on what a deterministic index does for a coding agent. The team [plugged JetBrains' headless code-intelligence engine](https://blog.jetbrains.com/ai/2026/10/how-netflix-made-ai-coding-agents-more-efficient/), the one behind IntelliJ IDEA, into Claude Code and Codex. The problem is JARs: JVM libraries ship compiled, so an agent unzips archives it guesses are relevant, decompiles class files, and greps through an incomplete view. Netflix built the daemon and CLI JetBrains had not shipped, a GraalVM executable whose session manager keeps each project's index warm in a long-lived server so a second call skips indexing entirely. The benchmark ran on an internal Spring Boot 4 service and the open-source DGS Framework, with Claude Code on Opus 5 and Sonnet 5 and Codex on GPT-5.6 Sol at medium and high effort, July through August. Agents were typically 20–30% more efficient on tokens and time, up to about 65% on code-navigation tasks for the strongest model at high effort, 10–30% on end-to-end feature and refactor tasks, and correctness held or improved in every run. The gains were largest for the most expensive configurations, which is where they matter. JetBrains' Aleksey Stukalov argues the LSP's cursor-position primitive is the wrong abstraction for agents: "Agents need a code engine, not a virtual editor." Netflix plans the same benchmark for Python, TypeScript and Go.

The banks drew a line. [JPMorgan blocked outside AI agents from directly accessing customer accounts](https://www.cnbc.com/2026/10/13/jpmorgan-ai-agents-account-access.html?utm_source=tldrfintech), and Jamie Dimon warned customers about "liability transfer" when an agent acts on their behalf. Separately, CNBC reported that [Bank of America hired 1,000 contractors to patch software flaws exposed by Anthropic's Mythos](https://www.cnbc.com/2026/10/14/anthropic-mythos-bank-of-america-hiring-cost.html), which is a remediation bill with a model's name on it. Both stories reached this feed as headlines only, so the mechanism of JPMorgan's block is not in hand. The a16z podcast's [episode on agents spending your money](https://a16z.simplecast.com/episodes/when-ai-agents-start-spending-your-money-alex-rampell-terry-angelos-YowGFPLh) dropped the same morning, which is the other half of the argument: wallets want to be the default agent credential, and the account holder has just said no to the direct route.

A cost post worth running against your own logs. [A worked example on r/LLMDevs](https://www.reddit.com/r/LLMDevs/comments/1x6mlt5/three_6minute_pauses_double_the_input_cost_of_a/) prices a 20-turn Claude Sonnet 5.5 agent session at list rates. When the user replies within five minutes every turn, input cost is $0.138. When the user steps away for six minutes before turns 6, 11 and 16, the same tokens cost $0.282. The prompt cache is the only difference: Anthropic's default TTL is five minutes, every hit resets it, and once it lapses the next call rewrites the entire context at $2.50 per million instead of reading it at $0.10, a 25x gap on Sonnet 5.5. With 100k tokens of context, one expired cache costs $0.25 where a read would have cost a cent. Per-call logs hide this, because the gap sits between two rows. The fixes are cheap: log cache_read_input_tokens and cache_creation_input_tokens next to the seconds since the previous call; switch to the one-hour TTL if users pause mid-task, which costs 2x base on writes instead of 1.25x and drops this session to $0.198; and keep timestamps and request IDs out of the system prompt where they bust the prefix. OpenAI keeps cached prefixes at least 30 minutes on GPT-5.6 and later, so the same pause costs nothing there.

One pre-registered paper closes the loop on code quality and agent spend. [CodeHealth predicts the token cost of agentic code review](https://arxiv.org/abs/2610.21914), from Heander, Borg, Söderberg and Rydenfält, ran a frozen five-agent review-and-fix pipeline over 465 agent-authored PRs from 246 repositories, with three different LLMs. For all three, each CodeHealth point was associated with 3.5% to 6.1% lower token cost, confidence intervals excluding zero, and CodeHealth was unrelated to PR footprint, so size does not explain it. The cost lives in the review stage, where agents iterated more on unhealthy code without writing more comments. Adjusting for the size of the scored files absorbed the association, which the authors read as mediation by file size. The practical reading: refactoring pays off in agent review cost when it changes structure and file size, not when it moves the score.

What to watch. Two security disclosures arrived as headlines: Noma Labs on [data exfiltration through the preview pane in Claude Code Desktop](https://noma.security/noma-labs/sneakpeek-how-the-preview-pane-in-claude-code-desktop-can-exfiltrate-your-data), and Signals Corps on [prompt injection found in HTTP headers across 217M web responses](https://www.signalscorps.com/blog/prompt-injection-in-http-headers/). The New Stack reports that [reviewers found a race in the page-cache patch Torvalds posted with Claude Code](https://thenewstack.io/torvalds-claude-code-kernel/), a day after that patch series made the rounds. And the Cammarata claim is the one to check back on: if neurons really are clean under agentic inspection, the next month of interpretability papers will look nothing like the last three years.

*Feed note: the code-intel mirror reported its last sync timestamp as 2026-09-01, but items in this issue carry ingest times through the morning of 2026-10-16, so the status field appears stale rather than the data.*
