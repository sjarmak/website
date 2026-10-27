---
title: Anthropic's S-1 shows a $974 million Q2 operating profit and 48 percent
  of revenue sold through the clouds, as OpenAI prices GPT-6.1 Terra at $1/$5
cadence: daily
track: general
origin: auto
date: 2026-10-27
summary: Anthropic filed its S-1 on Monday, showing $11.6 billion of Q2 revenue,
  a $974 million operating profit, an 85 percent H1 gross margin, 48 percent of
  revenue flowing through Bedrock, Vertex and Azure, and a delayed frontier
  pre-training run against up to $120.5 billion of compute commitments. OpenAI
  shipped GPT-6.1 Terra as a fast computer-use model at $1/$5 per million
  tokens, Cloudflare disclosed an SGLang bug that leaked other users' KV cache
  into 155 GLM-5.3 responses, and Netflix, Recursive and OpenRouter data filled
  in how LLM systems are being run and routed.
topics:
  - ai-business
  - model-releases
  - model-pricing
  - computer-use
  - inference
  - security
  - open-weight-models
  - evaluation
unresolvedFacets:
  - inference
audioUrl: /media/digests/daily-general-2026-10-27.mp3
durationSec: 806
items:
  - title: "Anthropic S-1: $11.6B Q2 revenue, $974M operating profit, 85% H1 gross
      margin, 48% of revenue via cloud marketplaces"
    url: https://www.sec.gov/Archives/edgar/data/2130357/000162828026067168/anthropicpbc-sx1.htm
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: "GPT-6.1 Terra: a fast computer-use and vision model at $1/$5 per million
      tokens"
    url: https://openai.com/index/introducing-gpt-6-1-terra/
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: OpenAI's Ari Weinstein and James Sun on computer-use agents driving
      legacy software with no API
    url: https://a16z.simplecast.com/episodes/openai-when-ai-agents-use-computers-faster-than-you-QLF23qpt
    source: a16z Podcast
    category: podcasts
  - title: "Cloudflare: an SGLang rejection path leaked other users' KV cache into
      155 GLM-5.3 responses"
    url: https://blog.cloudflare.com/kv-cache-exposure-remediation/
    source: The Cloudflare Blog
    category: product_news
  - title: "Netflix Pensive AI: line-number error extraction under a 90-second
      deadline, eval-gated merges"
    url: https://netflixtechblog.com/making-failure-diagnosis-reliable-with-pensive-ai-6b0811a1c015
    source: Netflix TechBlog - Medium
    category: product_news
  - title: Chinese models generated 93.54 trillion OpenRouter tokens in one week,
      DeepSeek V4.1-Flash-1017 first
    url: https://www.reddit.com/r/LargeLanguageModels/comments/1xfp13g/chinese_ai_models_are_dominating_openrouters/
    source: Large Language Models (LLMs)
    category: community
  - title: "Recursive Flint: a 40B open-weight coding model with 2.5B active, built
      to run on laptops"
    url: https://devops.com/recursive-flint-puts-a-fast-agentic-coding-model-on-developers-laptops
    source: DevOps.com
    category: tech_articles
  - title: OpenAI publishes model results on Kakeya, the Exponential Time Hypothesis
      and QCD for researchers to verify
    url: https://openai.com/index/building-scientific-understanding-with-academic-communities
    source: OpenAI News
    category: product_news
highlights:
  - Anthropic revenue went from $41M in 2023 to $16.3B in H1 2026; Q2 operating
    profit was $974M
  - 48% of Anthropic's H1 revenue (about $7.8B) came through Bedrock, Vertex and
    Azure, up from 11% in 2023, with marketplace fees kept out of cost of
    revenue
  - GPT-6.1 Terra costs $1/$5 per million tokens against $2/$12 for GPT-5.6
    Terra; Artificial Analysis cost per task fell from $1.40 to $0.40
  - Cloudflare's GLM-5.3 deployment advertised a 1,048,576-token window on a
    681,280-token prefill KV pool; SGLang v0.5.22 carries the fixes
  - Open-weight models carry about 72% of roughly 165T weekly OpenRouter tokens,
    up from 28% a year earlier
---

Anthropic's [S-1](https://www.sec.gov/Archives/edgar/data/2130357/000162828026067168/anthropicpbc-sx1.htm) puts Q2 2026 revenue at $11.6 billion, up 1,368 percent from a year earlier, and Q2 operating profit at $974 million, the first profitable quarter in the company's history. It filed publicly on Monday morning for a Nasdaq listing under the ticker ANT, and the Hacker News thread passed 400 comments within a day. At roughly 350 pages the filing is mostly being read through other people's spreadsheets, and Latent Space's AINews issue collected the figures that keep coming up: revenue went from $41 million in 2023 to $16.3 billion in the first half of 2026, while gross margin swung from 37 percent in 2023 to minus 95 percent in 2024, then 40 percent in 2025 and 85 percent in H1 2026. The headline H1 net loss of $80.7 billion is an accounting effect. It includes $81.1 billion of non-cash charges tied to the convertible notes Amazon and Google bought between 2023 and 2025, which convert at $2 to $5 a share against a Series H price near $59, so the remaining $6.2 billion of principal is carried as a $108.6 billion liability.

Two disclosures matter more to anyone building on Claude than the valuation does. The first is distribution: 48 percent of H1 revenue, about $7.8 billion, came through Bedrock, Vertex and the Azure Marketplace, up from 11 percent in 2023, and the marketplace fees are booked under sales, marketing and partnerships rather than cost of revenue, so they never touch the 85 percent gross margin. One reader's summary was that the hyperscalers get paid twice, once for the compute and again for the shelf space. The second is compute. Anthropic disclosed that it recently delayed pre-training of a new frontier model, and its non-cancelable commitments include up to $120.5 billion of NVIDIA-powered capacity through SpaceXAI under agreements running into 2029, which is the mismatch Sarah Guo flagged between consumption-priced revenue and decade-long obligations. The filing also claims internal Claude usage passed monthly personnel costs (excluding stock pay) in April and that Claude wrote more than 90 percent of September's codebase contributions. With $112.4 billion in cash plus $19.3 billion in short-term investments against $141.1 billion raised, SemiAnalysis puts lifetime burn near $9.7 billion. Polymarket's expected closing price slipped only from about $2.1 trillion to $2.0 trillion after the numbers landed.

OpenAI's news the same afternoon was a price. [GPT-6.1 Terra](https://openai.com/index/introducing-gpt-6-1-terra/) ships as a fast computer-use and vision model at $1 input and $5 output per million tokens, $0.05 cached, against $2/$12 for GPT-5.6 Terra, and OpenAI claims it matches GPT-6 Astra on Agents' Last Exam at a tenth of the per-token price and more than three times the speed. Artificial Analysis has it six points up on its Intelligence Index at max effort with cost per task falling from $1.40 to $0.40, its AA-Omniscience hallucination rate dropping from 88 to 38 percent, and Terminal-Bench 4.0 up about 20 points, though its Coding Agent Index of 48 still trails Sol's 54. Skeptics say Sonnet 5.5 and Sol are better at a similar cost, and some read the launch as margin protection because OpenAI swapped default presets and cut the Pro Codex allowance from 20x to 10x alongside it. Terra also meets OpenAI's own "Critical" cyber threshold, which is worth knowing before you hand it a browser and credentials.

The longer argument for what Terra is for sits in an [a16z episode](https://a16z.simplecast.com/episodes/openai-when-ai-agents-use-computers-faster-than-you-QLF23qpt) with OpenAI's Ari Weinstein and James Sun. They describe agents already working legacy ERPs, reconciling financial data and running procurement through software that has no API, and they argue the harness around the model, including the deterministic guardrails an enterprise sets on agent behavior, matters as much as model intelligence. Their sharper claim is that computer use will extend the life of legacy software at the same time it clears room for AI-native replacements, two outcomes that pull in opposite directions for anyone deciding whether to build an integration or wait.

The most useful engineering read of the day is Cloudflare's [post-mortem on a cross-request KV cache leak](https://blog.cloudflare.com/kv-cache-exposure-remediation/) in its GLM-5.3 deployment on Workers AI. Between August 27 and September 9, 155 responses to prompts longer than 681,280 tokens contained text from other customers' requests. Cloudflare advertised a 1,048,576-token context window while the KV pool on its prefill GPUs held 681,280 tokens; the team knew about the gap and assumed SGLang would reject anything that didn't fit. SGLang did reject it, by swapping the prompt for a one-token placeholder, but in disaggregated prefill/decode mode both admission queues checked whether a request was finished rather than whether it was rejected. Prefill computed KV for the placeholder, signaled the transfer complete, and decode attended over every page it had reserved, most of them still holding earlier users' prompts. The client got an HTTP 200 with a coherent answer that arrived faster than a prefill that size should allow. Pre-launch testing had checked status codes and throughput at long context and never looked at the output. The fixes shipped across SGLang v0.5.20 to v0.5.22, the same bug had been filed upstream as issue #30233 on July 6, and Cloudflare's advice to anyone running disaggregated SGLang is to compare KV pool size against context length from the engine's startup log on every node after any change to weights, quantization or parallelism, then upgrade to v0.5.22. Its longer-term plan is page-level ownership tags, which cost under 1 percent of throughput in a summer prototype it later disabled for reliability problems, plus a formal model of the RDMA transfer protocol.

Netflix's [Pensive AI write-up](https://netflixtechblog.com/making-failure-diagnosis-reliable-with-pensive-ai-6b0811a1c015) is the counterweight: an LLM system whose reliability comes from the plumbing around the calls. Netflix runs millions of data and ML workloads a day across Titus, Spark, Trino and Druid, about 100,000 fail on peak days, and the old rule-based Pensive left roughly half of seven million classifications over three months in the unknown bucket. The new extractor numbers every log line and asks the model for only the first and last line of the error span, so the output is always two integers and the text shown to engineers comes straight from the original log, which cuts output tokens and hallucinated stack traces together. All per-log calls share one deadline inside Maestro's hard 90-second timeout, and late calls are dropped. The legacy regex rules became free reference labels for evals, logs are archived to S3 because the originals expire in seven to 30 days, and every pull request deploys to a preview environment where precision and inclusion thresholds gate the merge. Extraction now covers 100 percent of failures.

The open-weight side of the market showed up in the routing data. A [thread on r/LargeLanguageModels](https://www.reddit.com/r/LargeLanguageModels/comments/1xfp13g/chinese_ai_models_are_dominating_openrouters/) reported that Chinese models generated 93.54 trillion tokens on OpenRouter in the week of October 19 to 25, with DeepSeek V4.1-Flash-1017 ranked first, and a16z's figures put total OpenRouter volume near 165 trillion tokens a week, about 27 times last November, with open-weight models carrying roughly 72 percent of it against 28 percent a year earlier. Read next to the S-1, the split is clean: the closed labs sell through hyperscaler marketplaces, and the open models move through routers.

[Recursive's Flint](https://devops.com/recursive-flint-puts-a-fast-agentic-coding-model-on-developers-laptops) pushes the same models onto the laptop. It is a 40-billion-parameter open-weight coding model with 2.5 billion parameters active, built with Recursive's Eureka Machine research system, and DevOps.com frames it around source-code privacy and the end of per-token fees. One independent run on an M4 Pro passed 50 of 52 tasks, matching Qwen3.6-35B-A3B, at a 2.8-second median latency against 10.1 seconds and 122.6 tokens per second. It always reasons before answering, so give it at least 16K tokens of output budget or it will truncate.

OpenAI also posted [model results on the Kakeya conjecture, the Exponential Time Hypothesis and quantum chromodynamics](https://openai.com/index/building-scientific-understanding-with-academic-communities), written around how researchers can verify and extend them. It lands two days after Terence Tao opened a community hub for revising OpenAI's earlier math write-ups, and the framing has moved from announcing a result to publishing what a referee needs to check it.

Anthropic's IPO is expected around November 9, and Fable 5.5 has reportedly reached enterprise customers ahead of an expected consumer launch this week. The question the S-1 leaves open is whether revenue billed by the token can keep pace with compute contracts written through 2029, and the first public price on that question arrives in under two weeks.

*Feed note: the item mirror reports mirror mode with a last-sync timestamp of September 1, yet it held items ingested through 08:04 UTC on October 27, so the staleness field is misreporting rather than the data being old. Figures from the S-1, the Terra launch and the OpenRouter totals are as compiled in Latent Space's AINews issue of October 27, which attributes each to its original poster.*
