---
title: "Thinking Machines ships Inkling: 975B parameters, Apache 2.0, and 25K
  tokens per task"
cadence: daily
track: general
origin: auto
date: 2026-07-16
summary: Thinking Machines Lab released Inkling, a 975B-parameter Apache 2.0
  multimodal MoE that debuts at 41 on the Artificial Analysis Intelligence Index
  and uses roughly 60% of the output tokens its open-weight rivals spend per
  task. OpenAI introduced GPT-Red, an automated red teamer whose self-play loop
  cut GPT-5.6 Sol's prompt-injection failures 6x versus its best model from four
  months ago, while Anthropic published four new agentic misalignment behaviors
  the same afternoon. Anaconda is acquiring Kilo Code, and Grok 4.5 kept
  spreading through Augment and Cursor.
topics:
  - model-releases
  - open-weights
  - agent-tooling
  - ai-safety
  - agent-security
  - developer-productivity
audioUrl: /media/digests/daily-general-2026-07-16.mp3
durationSec: 654
items:
  - title: "[AINews] Thinky's Inkling: 975B-A41B multimodal, new best American
      Apache 2.0 open model"
    url: https://www.latent.space/p/ainews-thinkys-inkling-975b-a41b
    source: Latent Space / AINews
    category: newsletters
  - title: "GPT-Red: Unlocking Self-Improvement for Robustness"
    url: https://openai.com/index/unlocking-self-improvement-gpt-red
    source: OpenAI News
    category: product_news
  - title: "New Anthropic research: Agentic misalignment in Summer 2026"
    url: https://rss.xcancel.com/AnthropicAI/status/2077452646303006927#m
    source: Anthropic / @AnthropicAI
    category: product_news
  - title: Grok 4.5 is now available in Augment's Cosmos agent orchestration platform
    url: https://rss.xcancel.com/augmentcode/status/2077581758997184571#m
    source: Augment Code / @augmentcode
    category: product_news
  - title: Anaconda Doesn't Want to Be Just the Python Company Anymore
    url: https://devops.com/anaconda-doesnt-want-to-be-just-the-python-company-anymore/
    source: DevOps.com
    category: tech_articles
  - title: "Show HN: Forall – An AI coding agent that generates machine-checkable
      proofs"
    url: https://github.com/astrio-labs/forall
    source: Hacker News
    category: community
  - title: Improvements to secret scanning and public monitoring
    url: https://github.blog/changelog/2026-07-15-improvements-to-secret-scanning-and-public-monitoring
    source: Changelogs – The GitHub Blog
    category: product_news
highlights:
  - Inkling debuts at 41 on the Artificial Analysis Intelligence Index, ahead of
    Nemotron 3 Ultra (38), Gemma 4 31B (29), and gpt-oss-120b (24), the
    strongest American open-weights release so far.
  - Inkling averages 25K output tokens per Intelligence Index task vs 43K for
    GLM-5.2 max, 38K for Kimi K2.6, and 37K for DeepSeek v4 Pro max.
  - Unsloth's 1-bit GGUF quant is 86% smaller (270GB vs 1.9TB) and retains 74.2%
    of top-1% accuracy with vision and audio intact.
  - GPT-5.6 Sol logged 6x fewer prompt-injection failures than OpenAI's best
    production model from four months earlier when replaying GPT-Red's unseen
    attacks.
  - Kilo Code routes across 500+ models and orchestrates ~10 trillion
    tokens/month for 3M+ developers; Anaconda claims 52M users and presence in
    95% of the Fortune 500.
---

Thinking Machines Lab released Inkling: 975 billion total parameters, 41 billion active, Apache 2.0, with open weights carrying a 1M token context. It is the lab's first full model, trained from scratch on 45 trillion tokens of text, images, audio, and video. John Schulman put the timeline at pretraining starting last winter, with a small team layering coding, reasoning, and agentic training on top from mid-January. Artificial Analysis debuted it at 41 on the Intelligence Index, ahead of Nemotron 3 Ultra at 38, Gemma 4 31B at 29, and gpt-oss-120b at 24, which makes it the strongest American open-weights release to date. [Latent Space's AINews has the full recap](https://www.latent.space/p/ainews-thinkys-inkling-975b-a41b), and it is worth reading past the headline number.

The more useful figure is the token economy. Inkling averages 25K output tokens per Intelligence Index task, against 43K for GLM-5.2 max, 38K for Kimi K2.6, and 37K for DeepSeek v4 Pro max. If you are paying per token on long agentic runs, a model that reaches a comparable answer in 60% of the output budget changes your cost math more than two points of benchmark score do. Tinker prices it at $1.87 per million input and $4.68 output at 64K context, doubling to $3.74 and $9.36 at 256K, with the API capped at 256K even though the downloadable weights go to 1M.

The architecture drew more attention than the evals. Inkling uses relative positional attention bias rather than RoPE, hybrid sliding-window attention with a 5:1 local-to-global layer ratio and a 512 window, short convolution layers around the attention and FFN streams, and an MoE with two shared expert sinks where most recent designs use one. Aaron Defazio confirmed the optimizer uses his corrected weight decay, MuonC/AdamC. Eight MTP heads ship for speculative decoding. These are not the choices of a team chasing a leaderboard; they read as a lab testing what it actually believes about scaling, which is roughly how Lilian Weng and Mira Murati framed the release.

Day-0 ecosystem support was unusually broad: vLLM shipped NVFP4 and BF16 optimized for Blackwell and Hopper, hitting up to 380 tok/s/user on 4× GB200 with MTP; NVIDIA confirmed training on GB300 NVL72 and posted an NVFP4 checkpoint; Modal's custom DFlash speculator claims 67% higher throughput; SGLang implemented ShortConv, relative positional attention, and shared expert sink MoE natively. Unsloth's 1-bit GGUF quant is 86% smaller, 270GB against 1.9TB, and retains 74.2% of top-1% accuracy with vision and audio intact. Lysandre found another 15% throughput by swapping in causal-conv1d and FlashAttention-4, no retraining required.

The criticism is worth taking seriously. Scaling01 called the benchmarks "not that great," roughly another Kimi K2.6, behind every closed model and GLM-5.2, and suggested the timing was defensive ahead of Kimi K3 and DeepSeek V4 GA. Nathan Lambert, who called it the new best American model, also placed it behind GLM-5.2 on agentic evals and Kimi K2.6 on multimodal. JJitsev pushed back hardest on the purity narrative, noting Inkling does use distillation from open weights and trails GLM-5.2 on TerminalBench-style evaluations. Design Arena put it at #9 on the Agentic Web App Arena with an Elo of 1257, in the same band as Claude Opus 4.6 and Gemini 3.5 Flash. Strong, not frontier, and open.

OpenAI spent the same day on the other side of the safety ledger, [introducing GPT-Red](https://openai.com/index/unlocking-self-improvement-gpt-red), an internal automated red teamer that learns through adversarial self-play against a rotating set of defender models. Every successful prompt injection it discovers becomes training signal for the defenders, which pushes GPT-Red toward broader failures. The number that matters: replaying GPT-Red's strongest attacks against models that had never seen them, GPT-5.6 Sol logged 6× fewer failures than OpenAI's best production model from four months earlier. Red-teaming has been the hand-labor bottleneck in deployment safety for years, and this is the first credible claim that the loop closes on itself.

Anthropic published the counterweight the same afternoon, [reporting four new agentic misalignment behaviors](https://rss.xcancel.com/AnthropicAI/status/2077452646303006927#m) found in simulation, a year on from the blackmail experiments. They tested many models including Claude, they are careful that these are scenarios rather than incidents, and they published the full transcripts. Two labs, one day, opposite directions: one showing agents can be hardened against attack faster than humans can attack them, the other showing the agents still misbehave in ways nobody enumerated in advance. Both are true, and the second is the harder engineering problem because there is no adversary to train against, only a distribution of situations you failed to imagine.

Grok 4.5 kept spreading through the tooling layer. Augment [added it to Cosmos](https://rss.xcancel.com/augmentcode/status/2077581758997184571#m), its agent orchestration platform, pairing it with Augment's context engine for large-codebase work, while Cursor doubled included model usage across all plans and named Grok 4.5 and Composer 2.5 as the beneficiaries. Two weeks ago the Grok 4.5 story was undercutting Anthropic and OpenAI on price. Now it is showing up as a default option in other people's orchestration products, which is the part that actually moves market share.

The consolidation story of the day: [Anaconda is acquiring Kilo Code](https://devops.com/anaconda-doesnt-want-to-be-just-the-python-company-anymore/), the open-source model-agnostic coding agent used by more than 3 million developers, routing across 500+ models and orchestrating close to 10 trillion tokens a month inside VS Code, JetBrains, and the CLI. Anaconda claims 52 million users and a presence in 95% of the Fortune 500, and it bought Outerbounds and Metaflow in April. Read the three pieces together and the shape is a control plane: trusted packages and environments underneath, workflow orchestration and production in the middle, the agent interface on top. Alan Shimel's framing is that foundational technology can stay necessary while the value migrates upward, and Anaconda is climbing before that happens. The mirror image is OpenAI buying Astral, the company behind uv, Ruff, and Pyright: the model lab moved down into Python tooling the same season the Python company moved up into agents. Kilo co-founder Sid Sijbrandij co-founded GitLab; Anaconda CEO David DeSanto was GitLab's longest-serving CPO. The playbook is not new to either of them.

Two smaller things worth your attention. [Forall hit Show HN](https://github.com/astrio-labs/forall), an open-source coding agent that emits machine-checkable proofs alongside the code, currently verifying three languages, aimed squarely at people who care about Lean and Dafny. Proof-carrying generation is the one verification story that does not depend on a model grading itself. And GitHub [expanded secret scanning](https://github.blog/changelog/2026-07-15-improvements-to-secret-scanning-and-public-monitoring), adding Resend as a partner and detecting new secret types from APIclub, which matters more than it reads now that agents are the things committing the credentials.

The open question Inkling raises is not whether it beats GLM-5.2 this week. It is whether an American lab shipping Apache 2.0 weights at this scale, with token efficiency as the design target rather than benchmark position, pulls anyone else back into the open-weights lane before Kimi K3 and DeepSeek V4 land. Watch what Tinker's fine-tuning volume looks like in two weeks.
