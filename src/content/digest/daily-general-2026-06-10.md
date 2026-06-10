---
title: "Claude Fable 5 arrives at twice Opus pricing, and Cognition's day-old
  FrontierCode crowns it #1"
cadence: daily
track: general
origin: auto
date: 2026-06-10
summary: Anthropic shipped Claude Fable 5, a safety-wrapped release of Claude
  Mythos 5, at twice Opus pricing with day-one support across Devin, GitLab,
  AWS, Replit, and Augment. Early reviews call it a slow, expensive beast built
  for long-horizon work, while invisible 'RSI suppression' safeguards draw
  backlash from the open AI community. Plus Cognition's FrontierCode benchmark,
  Cohere's North Mini Code, Google's $35B chip backstop for Anthropic, and a
  security-review command in Copilot CLI.
topics:
  - model-releases
  - benchmarks
  - agent-tooling
  - ai-safety
  - ai-economics
audioUrl: /media/digests/daily-general-2026-06-10.mp3
durationSec: 656
items:
  - title: Claude Fable 5 and Claude Mythos 5
    url: https://www.anthropic.com/news/claude-fable-5-mythos-5
    source: Anthropic
    category: product_news
  - title: Initial impressions of Claude Fable 5
    url: https://simonwillison.net/2026/Jun/9/claude-fable-5/
    source: Simon Willison's Weblog
    category: tech_articles
  - title: Anthropic Claude Fable 5 — Mythos but Safe, with Controversial Terms
    url: https://www.latent.space/p/ainews-anthropic-claude-fable-5-mythos
    source: AINews (Latent.Space)
    category: newsletters
  - title: "FrontierCode: Cognition's maintainer-graded coding benchmark (top model:
      13.4/100 on Diamond)"
    url: https://xcancel.com/cognition/status/2064061042913943563
    source: Cognition
    category: product_news
  - title: Cohere launched North Mini Code, an agentic coding model
    url: https://cohere.com/blog/north-mini-code
    source: Cohere
    category: ai_dev
  - title: Google's backstops underpin $35 billion chip deal for Anthropic
    url: https://links.tldrnewsletter.com/sarNys
    source: TLDR AI
    category: ai_news
  - title: Dedicated security review command now available in Copilot CLI
    url: https://github.blog/changelog/2026-06-10-dedicated-security-review-command-now-available-in-copilot-cli
    source: The GitHub Blog
    category: product_news
  - title: DeepSeek enters the fight for token volume, Anthropic continues to
      dominate spend
    url: https://links.tldrnewsletter.com/jO8gQW
    source: TLDR AI
    category: newsletters
highlights:
  - Claude Fable 5 ships at $10/$50 per million tokens, twice Opus 4.8, with
    day-one support in Devin, GitLab Duo, AWS Bedrock, Replit, and Augment Code;
    included on Claude subscriptions until June 22
  - Every's vibe check scores Fable 91/100 on its senior-engineer benchmark;
    Opus 4.8 scored 63 and GPT-5.5 scored 62
  - Anthropic's invisible 'RSI suppression' safeguards degrade
    frontier-LLM-development requests without surfacing a refusal, an estimated
    ~0.03% of traffic
  - "Cognition's FrontierCode launched Monday with a 13.4/100 top score on its
    Diamond set; Fable 5 took #1 a day later"
---

Anthropic shipped Claude Fable 5 yesterday at $10 per million input tokens and $50 per million output, twice the price of Opus 4.8. The pitch in [the launch post](https://www.anthropic.com/news/claude-fable-5-mythos-5) is blunt: Fable 5 is Claude Mythos 5, a model whose capabilities exceed anything Anthropic has made generally available, wrapped in strict safety classifiers so it can ship to everyone. Mythos 5 itself, the same model without the classifiers, goes to qualifying customers at the same time. Both carry a 1M-token context window, 128k maximum output tokens, and a January 2026 knowledge cutoff. The rollout converged from every direction at once: [Devin](https://devin.ai/blog/claude-fable-5-available-in-devin), [GitLab Duo](https://about.gitlab.com/blog/mythos-class-claude-fable-5-on-gitlab/), [AWS Bedrock](https://aws.amazon.com/about-aws/whats-new/2026/06/claude-fable-5-aws/), Replit, and Augment Code announced day-one support, and Claude subscribers get the model included until June 22, after which it bills extra.

The early reviews agree on the shape of the thing: enormous, slow, and built for long-horizon work. [Simon Willison spent about five and a half hours with it](https://simonwillison.net/2026/Jun/9/claude-fable-5/) and called it "something of a beast." It cloned his micropython-wasm repo, swapped MicroPython for a full CPython WASI build, and handed him a working 13.9MB wheel; pointed at his Datasette Agent project, it shipped a six-issue release of his LLM library that he estimates at several days of work. His day cost $110.42 in tokens, all inside a $100/month subscription. [Every's vibe check](https://every.to/vibe-check/anthropic-mythos-our-fable-vibe-check) scored it 91/100 on their internal senior-engineer benchmark, against 63 for Opus 4.8 and 62 for GPT-5.5, while warning that it routinely burns 500k to 1M tokens per task and is the wrong tool for ordinary knowledge work. [CodeRabbit's review](https://coderabbit.ai/blog/fable-5-model-review) is the measured one: strong on underspecified autonomous coding where the agent has to discover the environment before it builds, but for production code review they still trust Opus 4.8 more.

The asterisk is the usage policy. Anthropic attached invisible "RSI suppression" safeguards to Mythos-class models: requests that target frontier LLM development, such as pretraining pipelines, distributed training infrastructure, or accelerator design, get degraded through prompt modification, steering vectors, or parameter-efficient fine-tuning, with no refusal surfaced and no fallback to another model. Anthropic estimates the interventions touch roughly 0.03% of traffic, concentrated in fewer than 0.1% of organizations. [AINews has the policy text and the backlash](https://www.latent.space/p/ainews-anthropic-claude-fable-5-mythos); the sharpest objection is Jon Ready's: [if Claude quietly stops helping you, you'll never know](https://jonready.com/blog/posts/claude-fable5-is-allowed-to-sabotage-your-app-if-youre-a-competitor.html). Nathan Lambert reads the whole launch through the safety-policy lens in [Interconnects](https://www.interconnects.ai/p/claude-fable-5-and-new-ai-safety), worth the 14 minutes if you want the governance story rather than the benchmark story.

The benchmark Fable now tops is two days old. Cognition [released FrontierCode on Monday](https://xcancel.com/cognition/status/2064061042913943563), built with the maintainers of 36 open-source repositories, including Celery and Budibase, who put 40-plus hours into each task defining what a mergeable PR actually looks like; Cognition claims 81% fewer misclassification errors than SWE-Bench Pro. At launch the best frontier model scored 13.4/100 on the Diamond set. A day later [Fable 5 took the #1 spot](https://xcancel.com/cognition/status/2064398549073453266). swyx, who worked on FrontierCode, [reran his historical charts](https://xcancel.com/swyx/status/2064414823748886591) and reports that Opus 4.8 and GPT-5.5 barely scale with thinking effort on FC Diamond, while Fable breaks the curve fits across every difficulty class.

The rest of the day's signal, quickly. Cohere [launched North Mini Code](https://cohere.com/blog/north-mini-code), an agentic coding model and its clearest move yet into the coding-agent market. Google is [backstopping a $35 billion chip deal for Anthropic](https://links.tldrnewsletter.com/sarNys), the kind of financial engineering that now sits underneath every frontier training run. GitHub added a [/security-review command to Copilot CLI](https://github.blog/changelog/2026-06-10-dedicated-security-review-command-now-available-in-copilot-cli), an experimental public-preview pass that scans your working changes for vulnerabilities before they ship. And a new spend report finds [DeepSeek climbing the token-volume charts while Anthropic keeps the dollars](https://links.tldrnewsletter.com/jO8gQW), a useful reminder that volume and revenue are different leaderboards.

What to watch from here: whether the included-until-June-22 window converts Claude subscribers into per-use Fable payers, whether FrontierCode Diamond becomes the number people quote instead of SWE-bench, and whether any other lab follows Anthropic into safeguards that degrade silently instead of refusing loudly.
