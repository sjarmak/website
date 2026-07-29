---
title: Sixty hours against two years of review
cadence: daily
track: general
origin: auto
date: 2026-07-29
summary: Claude Mythos Preview halved the key strength of HAWK in 60 hours and
  sped up a reduced-round AES attack by 200-800x, at roughly $100k of API per
  result. The same day, 1,171 frontier-lab employees asked the U.S. government
  to build tools for deliberately pacing automated AI development, and Hugging
  Face published the forensic report on a 17,600-action autonomous agent
  intrusion. Security tooling shipped into that context from OpenAI, Semgrep,
  and GitHub.
topics:
  - ai-security
  - agent-tooling
  - ai-governance
  - security
  - evals
  - developer-productivity
audioUrl: /media/digests/daily-general-2026-07-29.mp3
durationSec: 716
items:
  - title: Discovering cryptographic weaknesses with Claude
    url: https://rss.xcancel.com/AnthropicAI/status/2082153297670992134#m
    source: Anthropic / @AnthropicAI
    category: product_news
  - title: '[AINews] Fearing RSI: OpenAI, Anthropic, GDM, Meta, Thinky cosign letter
      to "Pace" AI development, as HuggingFace details Machine-Speed Offensive
      Cyberattack'
    url: https://www.latent.space/p/ainews-fearing-rsi-openai-anthropic
    source: AINews / Latent.Space
    category: newsletters
  - title: OpenAI open-sources the Codex Security CLI
    url: https://rss.xcancel.com/OpenAI/status/2082263717916586117#m
    source: OpenAI / @OpenAI
    category: product_news
  - title: Disrupting supply chain attacks on npm and GitHub Actions
    url: https://github.blog/security/supply-chain-security/disrupting-supply-chain-attacks-on-npm-and-github-actions/
    source: The GitHub Blog
    category: product_news
  - title: "Introducing Semgrep Agentic Workflows: Automate Deep Vulnerability
      Hunting at Scale"
    url: https://semgrep.dev/blog/2026/introducing-semgrep-agentic-workflows-automate-deep-vulnerability-hunting-at-scale
    source: Semgrep Blog
    category: product_news
  - title: 'Inside Anthropic: "we still have teams with 6-8 people on average"'
    url: https://rss.xcancel.com/GergelyOrosz/status/2082133116026569019#m
    source: Gergely Orosz / @GergelyOrosz
    category: community
  - title: "Eval-driven development: Lessons from evaluating GenAI at scale"
    url: https://medium.com/airbnb-engineering/eval-driven-development-lessons-from-evaluating-genai-at-scale-e817e5ae5788?source=rss----53c7c27702d5---4
    source: Airbnb Engineering & Data Science
    category: product_news
  - title: "Ponytail Skill for Claude Code: Does It Really Cut Agent Code by 54%?"
    url: https://blog.jetbrains.com/ai/2026/07/ponytail-skill-claude-tested/
    source: JetBrains Company Blog
    category: product_news
  - title: Scientific computing in the age of agentic AI
    url: https://openai.com/index/scientific-computing-agentic-ai
    source: OpenAI News
    category: product_news
highlights:
  - HAWK survived two years of expert review; Claude Mythos Preview found an
    attack in 60 hours that halved its key strength, at roughly $100k of API per
    result.
  - 1,171 employees from substantially every frontier lab except X.ai asked the
    U.S. government to back an international effort to build tools for pacing
    automated AI development.
  - "Hugging Face's forensic report on the first autonomous agent cyberattack:
    ~17,600 actions over 4.5 days, root on 11 nodes, 136 secrets accessed,
    reconstructed with open-weight GLM 5.2 on their own infra."
  - GitHub Actions now holds unproven workflows for approval before they run,
    alongside npm publish-time malware scanning and wider Dependabot
    malicious-package alerts.
  - "Anthropic's Head of Engineering for the Claude Platform on team size: \"we
    still have teams with 6-8 people on average.\""
---

HAWK, a lattice-based digital signature scheme built to hold up against quantum computers, had survived two years of expert review. Claude Mythos Preview found a previously-unknown attack in 60 hours that cut the scheme's key strength in half. On a reduced-round version of AES, the same model found a way to speed up an existing attack by 200 to 800 times after about a week of work. [Anthropic put the API cost of each result at roughly $100,000](https://rss.xcancel.com/AnthropicAI/status/2082153297670992134#m) and said the model did most of the work autonomously, with occasional human guidance.

Neither result touches anything you run today, and Anthropic said so in the same thread: HAWK is a proposed scheme rather than a deployed one, and reduced-round AES is a cryptanalytic target rather than the cipher in your TLS stack. What the two results do establish is that a frontier model can carry expert-level cryptography research end to end, which is why the more durable artifact here may be CryptanalysisBench, built with academics at ETH Zurich, Tel Aviv University, and the University of Haifa to measure that capability directly (arXiv 2607.18538). Full papers on both attacks are public. Reaction split between reading this as a real research advance and reading the framing as oversold, and both readings survive contact with the papers.

The bigger governance story landed the same day. Over 1,000 employees of frontier labs, 1,171 by the count in [AINews's writeup](https://www.latent.space/p/ainews-fearing-rsi-openai-anthropic), cosigned a statement asking the U.S. government to support an international effort to build the technical and governance tools needed to deliberately pace automated AI development. The signers span substantially every frontier lab except X.ai. The letter's own argument is the interesting part: the labs believe they may be close to automating AI research, each one faces competitive pressure not to slow down unilaterally, and nobody currently has the instrumentation to pace a frontier even if they wanted to. It is nominally signed in personal capacity, but Dario Amodei signed it and the official OpenAI account posted it, which puts it well past a personal-capacity document.

Timing put that letter next to Hugging Face's forensic report on what it calls the first autonomous agent cyberattack. The numbers are the story: roughly 17,600 actions over four and a half days, root access across 11 nodes, cluster-admin on two clusters, 136 secrets accessed, repeated VPN enrollment, and an attempted CI compromise through GitHub App tokens and a pull request. HF's security team drew the operational conclusion that volume is what changes the defensive problem, since the successful path was buried inside thousands of failed ones and reconstructing the timeline by hand was impractical. They rebuilt it with an AI-assisted pipeline running open-weight GLM 5.2 on their own infrastructure, and that detail became the day's argument for open models in security work: during a forensic investigation you need tooling you can inspect and self-host, because closed tools could not reliably tell attacker traffic from defender traffic.

Security tooling shipped into that context all day. OpenAI [released the Codex Security CLI as open source](https://rss.xcancel.com/OpenAI/status/2082263717916586117#m) without an announcement, then confirmed it after Hacker News found the repo first. It scans repositories, tracks findings across runs, verifies fixes, and drops into CI/CD; install is `npm install @openai/codex-security`, source at github.com/openai/codex-security, and OpenAI is calling it an early release. Semgrep [launched nine pre-built Agentic Workflows](https://semgrep.dev/blog/2026/introducing-semgrep-agentic-workflows-automate-deep-vulnerability-hunting-at-scale) aimed at authentication, injection, and logic flaws, covering more than 70 CWEs across the OWASP Top 10. The pattern in both is the same: the agent is doing the hunting, and the product is the loop around it that tracks findings and confirms fixes rather than the raw detection.

GitHub moved on the supply chain in the same window, and moved further than the usual changelog. The [teardown of recent npm and Actions attacks](https://github.blog/security/supply-chain-security/disrupting-supply-chain-attacks-on-npm-and-github-actions/) shipped alongside three concrete controls: publish-time malware scanning with dual-use metadata on npm, Dependabot alerts for malicious packages across more ecosystems, and GitHub Actions now holding unproven workflows for approval before they run. That last one changes default behavior in CI for anyone accepting outside contributions, so it is worth reading before your next fork PR sits in a pending state and you go looking for the cause. It also lands two weeks after Dependabot's update cooldown, which is a coherent direction rather than a scattering of features.

Away from security, the most quoted line of the day came from The Pragmatic Engineer's inside look at Anthropic. Katelyn Lesse, Head of Engineering for the Claude Platform, [pushed back on the org-chart fantasy directly](https://rss.xcancel.com/GergelyOrosz/status/2082133116026569019#m): "One thing I've heard from some people is 'we have two humans and a bunch of agents.' I reply that this isn't where we're at: we still have teams with 6-8 people on average." Coming from the company shipping the models, that is the most credible available data point on what agentic development has actually done to team size, and the answer so far is not much.

Two pieces landed on the measurement problem underneath all of this. Airbnb published [what it learned running evaluation as a first-class engineering discipline](https://medium.com/airbnb-engineering/eval-driven-development-lessons-from-evaluating-genai-at-scale-e817e5ae5788?source=rss----53c7c27702d5---4) across its GenAI products, which is the exact question r/LLMDevs was asking the same morning under the title "How do I know if an agent change I made actually made things any better?" JetBrains kept its paired A/B benchmark series running, this time [pointing it at the Ponytail skill's claim of cutting agent code by 54%](https://blog.jetbrains.com/ai/2026/07/ponytail-skill-claude-tested/), part three of a run that tests public token-saver add-ons against the same harness. Vendor claims about prompt and skill add-ons are close to unfalsifiable without exactly this kind of paired setup, and almost nobody is building it.

OpenAI closed the day with [eight case studies on coding agents in scientific computing](https://openai.com/index/scientific-computing-agentic-ai), covering routine maintenance, targeted optimization, and full redesigns of research code. Its caveat is the one worth carrying: researchers still define the questions, verify the results, and own the code long-term. Which puts a sharp question on the week ahead. The cryptography results, the HF incident, and the pacing letter all describe agents operating at a scale where human verification is the bottleneck, and none of them say what verification looks like when the artifact is 17,600 actions long.
