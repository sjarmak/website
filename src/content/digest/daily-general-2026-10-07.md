---
title: 722 proofs from a model nobody can run, Le Chonk, and EmbeddingGemma 2
cadence: daily
track: general
origin: auto
date: 2026-10-07
summary: OpenAI published 722 math manuscripts from an unreleased internal model
  at about three hours of compute per result, while Mistral Large 4 and Google's
  EmbeddingGemma 2 shipped the same morning. JetBrains and CodeRabbit both argue
  that review, not generation, is where the work piles up, Nathan Lambert takes
  apart the open-weights cyber debate, and Stack Overflow's survey finds daily
  AI use with lagging trust.
topics:
  - open-models
  - model-releases
  - evaluation
  - agentic-coding
  - code-review
  - ai-security
  - information-retrieval
  - developer-productivity
audioUrl: /media/digests/daily-general-2026-10-07.mp3
durationSec: 849
items:
  - title: "[AINews] Quasi-Riemann-Hypothesis: OpenAI publishes 722 math papers
      solving 90 of the top 500 open math problems"
    url: https://www.latent.space/p/ainews-quasi-riemann-hypothesis-openai
    source: Latent Space
    category: tech_articles
  - title: 'Mistral Large 4: "Le Chonk"'
    url: https://mistral.ai/news/mistral-large-4/
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: llm-mistral 0.16
    url: https://simonwillison.net/2026/Oct/6/llm-mistral/
    source: Simon Willison's Weblog
    category: tech_articles
  - title: "EmbeddingGemma 2: an open, lightweight multimodal embedding model"
    url: https://deepmind.google/blog/embeddinggemma-2-an-open-lightweight-multimodal-embedding-model/
    source: Google DeepMind Blog
    category: product_news
  - title: EmbeddingGemma 2 on Qdrant
    url: https://qdrant.tech/blog/embeddinggemma-2/
    source: Qdrant Blog
    category: tech_articles
  - title: The Cyber Risk Discourse is Broken
    url: https://www.interconnects.ai/p/the-cyber-risk-discourse-is-broken
    source: Newsletter Misc
    category: newsletters
  - title: South Korea says AI agents appear to have been used to hack the country's
      banks
    url: https://www.reuters.com/world/south-koreas-lee-says-ai-appears-have-been-used-bank-hacks-2026-10-06/
    source: "Hacker News: Front Page"
    category: community
  - title: Our Framework for Reviewing AI-Generated Code
    url: https://blog.jetbrains.com/research/2026/10/review-ai-generated/
    source: JetBrains Company Blog
    category: product_news
  - title: "CodeRabbit Security benchmark: agentic vulnerability detection"
    url: https://coderabbit.ai/blog/security-agent-benchmarks
    source: CodeRabbit Blog
    category: product_news
  - title: The results of the 2026 Developer Survey are here
    url: https://stackoverflow.blog/2026/10/06/the-results-of-the-2026-developer-survey-are-here/
    source: Stack Overflow Blog
    category: tech_articles
  - title: "State of Devs 2026: developers are exhausted"
    url: https://2026.stateofdevs.com/en-US/
    source: "Hacker News: Front Page"
    category: community
  - title: OpenTPU – An open-source AI accelerator, developed by AI
    url: https://github.com/FeSens/openTPU
    source: "Hacker News: Front Page"
    category: community
highlights:
  - OpenAI released 722 math manuscripts in 372 result families from an
    unreleased model, averaging about three hours of compute each versus 88
    hours for Navier-Stokes
  - Mistral Large 4 is 1.05T total / 49B active, API now, weights promised end
    of October; AA Intelligence Index 38, cyber lead disputed as fewer refusals
  - "EmbeddingGemma 2: 740M Apache 2.0 omni embedding model, modular encoders,
    Matryoshka down to 128 dims, day-zero llama.cpp/vLLM/Ollama"
  - JetBrains frames AI code review as trust calibration, not diffing;
    CodeRabbit's vendor benchmark reports 86.7% vs 40% detection across four
    agents
  - "Lambert: documented AI-assisted attacks came from closed APIs, so banning
    open weights implies banning public frontier APIs too"
---

722 manuscripts, grouped into 372 families of results, drawn from an evaluation of roughly 4,000 research problems, at an average of about three hours of ChatGPT Pro thinking compute per result. That is what OpenAI pushed to a public GitHub repo on October 6 from an internal model it is not releasing, and [the AINews recap](https://www.latent.space/p/ainews-quasi-riemann-hypothesis-openai) is the best single map of the reaction. Result 003 in the collection is a proof of what the authors call the Quasi-Riemann Hypothesis, and Levent Alpöge, who works on the competing Navier-Stokes effort at Anthropic, called the release "the most significant moment in mathematical history" before adding qualifications. The compute framing is the part a practitioner should hold onto: the Navier-Stokes result earlier this year took 88 hours and 10,000 agents, and these came in at three hours apiece. One analysis puts about 20% of the results as disproofs or counterexamples, which cuts against the story that AI mathematics is brute-force search over proof space. Will Depue expects some results not to survive scrutiny and built citedbyagi.com to track which human papers the release cites, and OpenAI says it consulted the Institute for Advanced Study's advisory group on mathematics and AI before publishing. François Chollet asked the question that outlasts the day: do gains in verifiable domains like math and code generalize, or do non-verifiable domains stay bottlenecked on human data?

[Mistral Large 4](https://mistral.ai/news/mistral-large-4/), nicknamed "Le Chonk", shipped the same morning and would have led any other issue. The model is a granular mixture of experts with 1.05T total parameters, 49B active, and a 1.6B vision encoder, natively multimodal, available through the API now with open weights promised for the end of October. It was pre- and post-trained on about 3,800 Grace Blackwell GPUs in Europe, Guillaume Lample says the RL run is "still in flight and shows no sign of saturation", and a larger model is already training. Pricing is $1.36 per million input tokens and $4.18 output, $0.14 for cached input, with 50% off for the first two weeks; Vals and Artificial Analysis list a 512K context while OpenRouter lists 1M with up to 256K output. The independent numbers are mixed in an instructive way. Artificial Analysis scores it 38 on its Intelligence Index, level with GPT-6 Luna at max effort and the highest score for a model from outside the US and China, but still behind GLM-5.3 and even GLM-5.3-Flash, at $1.13 per task, more than four times the cost of open models at similar intelligence. Vals ranks it first among open-weight models on HLAB and ninth among open models overall, and a blind Surge coding review placed it second behind only Opus 5. Its Cyber Index score of 50 and 82% on CyberGym-E2E-AA drew the sharpest dispute: Cline attributes the lead largely to fewer refusals, noting Opus 5.5 and Astra had about 40% of tasks blocked by their own safety filters. Clément Delangue pointed out that it is not open-weight until the weights ship, Mistral warned that many reported failures come from not setting reasoning effort to high, and Simon Willison had [llm-mistral 0.16](https://simonwillison.net/2026/Oct/6/llm-mistral/) out with reasoning support by evening. Three separate front-page Hacker News threads carried the launch.

Google's day was embeddings. [EmbeddingGemma 2](https://deepmind.google/blog/embeddinggemma-2-an-open-lightweight-multimodal-embedding-model/) is DeepMind's first natively multimodal open embedding model, built on Gemma 4 and released under Apache 2.0, mapping text, code, images, video and audio into one 768-dimensional space. The design is modular: a 270M text encoder, 170M vision, 300M audio, shipped as a 740M omni model plus 440M text-plus-vision, 570M text-plus-audio and 270M text-only variants, with Matryoshka truncation down to 512, 256 or 128 dimensions, an 8K context, and a claimed 14-point gain on MTEB Code. Active memory runs 191 to 567MB depending on which encoders you load, and a single pass handles up to 5.5 minutes of audio or 58 video frames. Day-zero support landed in llama.cpp (PR #30054 merged), vLLM, Ollama and Unsloth, and a WebGPU demo runs queries in 20 to 70 milliseconds in the browser. [Qdrant's early-access writeup](https://qdrant.tech/blog/embeddinggemma-2/) makes the operational point: the model travels light but at 10 million documents the full-size float32 vectors alone take 30.7GB of RAM, so the truncation and quantization options are where the savings live. Google's [developer guide](https://developers.googleblog.com/embeddinggemma-2-the-developer-guide/) adds the deployment notes worth reading before you index anything: disable unused encoders, L2-renormalize truncated vectors, and use bfloat16 or float32 rather than float16. Simon Willison [singled out the license](https://simonwillison.net/2026/Oct/6/hn-49983751/), and the r/LocalLLaMA thread was the most active local-model post of the day. The same AINews recap also notes Nano Banana 2.1 at $0.034 per image, down from $0.134 for the prior Pro model, and OpenAI's Decisions API entering public beta at $0.10 per million input tokens with no output charge.

Two posts from opposite ends of the tooling market agree that review, not generation, is where the work piles up. JetBrains' Human-AI eXperience team, with Lund University, published [a framework for reviewing AI-generated code](https://blog.jetbrains.com/research/2026/10/review-ai-generated/) ahead of its ESEM 2026 paper, built from four workshops with 17 practitioners and a 43-person survey. The core claim is that reviewing a multi-file LLM change is a trust-calibration problem rather than a diffing problem: a model presents the straightforward authentication logic and the stretch database migration with identical confidence, so the rational response is to read every line, and that does not scale. The proposed workflow has three levels, an overview that substitutes for being able to ask the author what they were thinking, file-level risk stratification before the reviewer reads a single line, and snippet-level chunk decomposition with reasoning linked to each chunk. The post notes GitHub now reports Copilot-assisted review accounts for more than a fifth of reviews on the platform, and names CodeRabbit's walkthroughs, Claude Code's severity-tagged reviewer agents and Graphite's stacked PRs as partial analogues, none of which impose overview-before-files-before-lines. On the vendor side, [CodeRabbit published a vulnerability benchmark](https://coderabbit.ai/blog/security-agent-benchmarks) for its Security product: 100 known vulnerabilities from the GitHub Advisory Database and OSV across 94 repositories, 11 languages and 11 vulnerability families (12 critical, 50 high, 38 medium), with the advisory, CVE, file, target lines and patch withheld and no network access. Detection credit requires matching the labeled mechanism at an accepted location and explaining exploitability. The reported detection rates are CodeRabbit 86.7%, Devin 73.3%, the Codex Security Plugin 62.0% and Claude Security 40.0%, with the usual caveats that this is a vendor-run "internal comparative development slice" on public repositories that any model may have seen in training. The methodological note worth borrowing is that mixed-model pipelines beat any single model, and a weak model cannot be rescued by a strong harness.

Nathan Lambert argues in [The Cyber Risk Discourse is Broken](https://www.interconnects.ai/p/the-cyber-risk-discourse-is-broken) that the open-weights debate has locked into a lose-lose shape. His evidence point is that the publicly documented AI-assisted attacks to date have come from closed models through their APIs, so "Open Dangerous, Closed Safe" may be closer to "Open Unsafe, Closed Unsafe", and if you think the latest open-weight models need banning to slow cyber diffusion you probably also need to make public frontier APIs illegal. He adds that air-gapped government networks can only deploy open weights, that Chinese companies register every major release with their government along with evaluations, and that the Anthropic report on GLM-5.3 did reasonable technical work while skipping the cross-cutting questions. The essay landed on a day thick with context: Anthropic expanded its Cyber Verification Program to give verified defenders access to Mythos 5.1, Opus 5.5 and Sonnet 5.5 with new tiers for authorized offensive work, Arvind Narayanan argued that weeks without GLM-5.3 incidents should lower risk estimates, and Reuters reported that [South Korea's president said AI agents appear to have been used to hack the country's banks](https://www.reuters.com/world/south-koreas-lee-says-ai-appears-have-been-used-bank-hacks-2026-10-06/).

Stack Overflow released [the 2026 Developer Survey results](https://stackoverflow.blog/2026/10/06/the-results-of-the-2026-developer-survey-are-here/), and the companion podcast with analyst Erin Yepis frames the three findings that matter: daily use of AI coding assistants is now the overwhelming norm while trust in the output lags, well-organized documentation has become the verifiable context developers reach for against hallucinated answers, and the community is shifting from posting to passive consumption. [State of Devs 2026](https://2026.stateofdevs.com/en-US/) from Devographics landed the same evening with the headline that developers are exhausted, and Baldur Bjarnason's "Software developers are not okay" resurfaced alongside it on Hacker News. The Stack Overflow documentation finding and the JetBrains trust-calibration framework describe the same gap from two sides: the tools generate faster than humans can verify, and the verification scaffolding has not been built.

The loudest Hacker News thread of the day, at 266 points, was [OpenTPU](https://github.com/FeSens/openTPU), a repository presenting an open-source AI accelerator whose design the authors say was developed by AI; a second submission of the same repo ran under the title "AI is now capable of developing its own inference hardware". Treat it as a claim to inspect rather than a result, but the fact that the community is now evaluating agent-designed silicon RTL the way it evaluated agent-written web apps a year ago is the signal. In the same vein, Mitchell Hashimoto published OSC 7501, a terminal spec that lets programs report their own status, noting that over 250 agent orchestrators currently rely on heuristics to tell when a tool like Claude Code is working or blocked.

What to watch: whether the 722 manuscripts hold up as mathematicians work through them and citedbyagi.com fills in, whether Mistral's weights actually ship at the end of October and where they land against GLM-5.3 once anyone can run them, and whether any IDE vendor builds the overview-first review surface JetBrains just specified.

*Feed note: the copilot's mirror_status reported a last sync of 2026-09-01, but every item in this issue was ingested at 08:00 UTC on 2026-10-07, so the status table is stale rather than the data.*
