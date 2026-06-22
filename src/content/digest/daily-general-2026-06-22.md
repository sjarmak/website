---
title: GLM 5.2 edges past Sonnet on 1,000 coding tasks as Claude's error rates spike
cadence: daily
track: general
origin: auto
date: 2026-06-22
summary: "Open-weight models pulled even with the frontier in the last day: GLM
  5.2 finished ahead of Sonnet 4.6 on Tessl's ~1,000-task coding-agent benchmark
  at lower cost, landing the same day Anthropic posted an elevated-error-rates
  incident across its whole lineup. Elsewhere, NVIDIA's SpatialClaw makes code
  the action interface for spatial reasoning, skills became the unit
  practitioners argue about, and Samsung rolled ChatGPT Enterprise and Codex out
  worldwide."
topics:
  - open-models
  - benchmarks
  - model-reliability
  - agent-tooling
  - agent-skills
  - enterprise-adoption
audioUrl: /media/digests/daily-general-2026-06-22.mp3
durationSec: 570
items:
  - title: "Open models are making Sonnet comparisons a lot less ridiculous (Tessl
      benchmark: GLM 5.2 91.9 vs Sonnet 4.6 90.8)"
    url: https://www.reddit.com/r/ClaudeCode/comments/1ublrv9/open_models_are_making_sonnet_comparisons_a_lot/
    source: ClaudeCode
    category: community
  - title: "Claude: Elevated Error Rates for Opus 4.8, Opus 4.7, Opus 4.6, and
      Sonnet 4.6"
    url: https://status.claude.com/incidents/lv35v0q9nsj2
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: NVIDIA Research Bets on Code, Not Tool Calls, to Fix AI Spatial Reasoning
      (SpatialClaw)
    url: https://devops.com/nvidia-research-bets-on-code-not-tool-calls-to-fix-ai-spatial-reasoning/
    source: DevOps.com
    category: tech_articles
  - title: You're probably using Agent Skills wrong
    url: https://notes.ansonbiggs.com/youre-probably-using-agent-skills-wrong/
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: Samsung Electronics brings ChatGPT and Codex to employees
    url: https://openai.com/index/samsung-electronics-chatgpt-codex-deployment
    source: OpenAI News
    category: product_news
  - title: "Show HN: Recall – fully-local project memory for Claude Code"
    url: https://github.com/raiyanyahya/recall
    source: Hacker News - Newest
    category: community
highlights:
  - GLM 5.2 scored 91.9 to Sonnet 4.6's 90.8 across ~1,000 coding-agent tasks on
    Tessl's public benchmark, at lower cost per task; an eval against Opus is
    next.
  - Anthropic posted an elevated-error-rates incident spanning Opus 4.8/4.7/4.6
    and Sonnet 4.6 the same day, with r/ClaudeCode reporting 529s and
    usage-limit glitches.
  - NVIDIA's SpatialClaw reports 59.9% average across 20 spatial benchmarks
    (+11.2 pts), training-free and holding across six VLM backbones from 26B to
    397B params.
---

GLM 5.2 scored 91.9 on Tessl's coding-agent benchmark this weekend. Sonnet 4.6 scored 90.8, at a slightly higher cost per task. That is the whole story of the last day in one line: the open-weight floor has risen to the point where the comparison is no longer lopsided, and it landed in the same window that Anthropic spent fielding elevated error rates.

Tessl ran GLM 5.2, MiniMax M3, Kimi K2.7-code, Qwen 3.7-Plus, and Sonnet 4.6 across [nearly 1,000 coding-agent scenarios](https://www.reddit.com/r/ClaudeCode/comments/1ublrv9/open_models_are_making_sonnet_comparisons_a_lot/) built from skills in its registry, scored both with and without the relevant skill loaded, with the dataset published on Hugging Face. GLM 5.2 finished first overall at 91.9 and $0.289 per task, ahead of Sonnet's 90.8 at $0.296; MiniMax M3 came in at 91.4 and was the cheapest of the leaders at $0.207. The gap at the top wasn't task completion, where almost everything finished the work, but instruction following, whether the model did the job the way it was asked. Tessl says it is now running the same eval against Opus, which is the number to watch. This did not arrive in isolation: an essay arguing [there is minimal downside to switching off Claude to open weights](https://www.marble.onl/posts/cancel_claude.html) hit the Hacker News front page the same day, and Z.ai [open-sourced a frontier coding model](https://startupfortune.com/chinas-zai-open-sourced-a-frontier-coding-model-the-same-day-washington-banned-its-american-rival/) as Washington moved to ban its American rival, extending the GLM-5.2 surge of recent days.

The timing was unkind to Anthropic, which posted an [incident for elevated error rates](https://status.claude.com/incidents/lv35v0q9nsj2) across Opus 4.8, Opus 4.7, Opus 4.6, and Sonnet 4.6. r/ClaudeCode filled in the texture: 529 Overloaded responses, "Service Busy" banners, and threads asking whether usage limits were miscounting, several noting that the previous day's supposed fix hadn't held. None of this is existential, and capacity incidents pass. But a reliability wobble reads differently when a credible open-weight option costs the same and runs on hardware you control, and that is the context every "should I switch" thread is now arguing inside.

Away from the model leaderboard, NVIDIA Research put out [SpatialClaw](https://devops.com/nvidia-research-bets-on-code-not-tool-calls-to-fix-ai-spatial-reasoning/), an open-source framework that changes how an agent reasons about physical space. Instead of locking the agent into a fixed set of structured tool calls, it lets a vision-language model write Python one cell at a time in a persistent Jupyter kernel preloaded with perception primitives, SAM3 for segmentation and Depth-Anything-3 for 3D reconstruction, alongside NumPy, SciPy, and Matplotlib. Each cell builds on the last, the agent inspects the evidence it has gathered, then revises before committing to an answer. NVIDIA reports 59.9% average accuracy across 20 spatial benchmarks, an 11.2-point jump over the prior best, holding with the same prompt and hyperparameters across six VLM backbones from 26B to 397B parameters. It is training-free, so it bolts onto an existing model rather than requiring a retrain. The argument underneath it is the same one SpatialClaw's name nods at: for reasoning that needs to look at intermediate results, code as the action interface beats a rigid menu of tools.

Skills, meanwhile, are becoming the unit people argue about. "[You're probably using Agent Skills wrong](https://notes.ansonbiggs.com/youre-probably-using-agent-skills-wrong/)" reached the front page, and it is not an isolated take: the Tessl benchmark above was constructed from a skills registry and scored skills on and off, and newsletter coverage of agents writing and optimizing their own skills landed alongside it. The through-line is that a skill is now the portable container for agent capability, the thing you version and benchmark, not a one-off prompt you paste in.

Adoption kept moving on the enterprise side. Samsung Electronics is [deploying ChatGPT Enterprise and Codex to employees worldwide](https://openai.com/index/samsung-electronics-chatgpt-codex-deployment), which OpenAI describes as one of its largest enterprise rollouts to date. Set that against the open-weight cost curve and you get the shape of the market: large organizations standardizing on a managed vendor for the support and compliance story, while the floor under self-hosted coding models keeps rising for everyone who would rather own the stack.

On that own-the-stack note, the loudest small project of the day was [Recall](https://github.com/raiyanyahya/recall), a Show HN for fully-local project memory for Claude Code, 82 points and 60 comments by morning. It follows the recent neuron-db in the same direction: keep an agent's persistent memory on your own disk rather than a hosted service. Local-first memory and local-first models are pulling the same way.

What to watch next: Tessl's Opus run, and whether the open-weight numbers stay this close once the harder eval lands. If GLM holds against Opus the way it held against Sonnet, the "should I switch" threads stop being hypothetical.
