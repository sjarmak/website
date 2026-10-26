---
title: PHP2Shell hits every PHP server as Kimi K3.1 Pro closes in on Opus 5.5
cadence: weekly
track: general
origin: auto
date: 2026-10-26
summary: Teams working with AI models found PHP2Shell, two pre-auth remote code
  execution bugs in every PHP release since 5.4, and Amazon's honeypots saw them
  exploited four days before the October 21 patch. The same 48 hours brought a
  backdoored LiteLLM release, a Node.js Brotli RCE and a CVSS 10 GitLab bug,
  while Moonshot's Kimi K3.1 Pro became the highest-scoring model yet to promise
  open weights. Anthropic's Claude Duet, GitHub's agent-scale Git work and
  Cloudflare's Rust port of TypeScript round out the week.
topics:
  - security
  - open-weights
  - model-releases
  - agent-safety
  - agent-tooling
  - infrastructure
  - evaluation
audioUrl: /media/digests/weekly-general-2026-10-26.mp3
durationSec: 2622
items:
  - title: "PHP2Shell: pre-auth RCE in every PHP release since 5.4"
    url: https://www.wiz.io/blog/php2shell-php-rce
    source: Wiz
    category: tech_articles
  - title: "Patch the Planet: global response coordination as agents uncover
      critical vulnerabilities"
    url: https://openai.com/index/coordinated-disclosure-of-critical-vulnerabilities
    source: OpenAI News
    category: product_news
  - title: Amazon Threat Intelligence identifies PHP2Shell exploitation prior to
      public disclosure in MadPot
    url: https://aws.amazon.com/blogs/security/amazon-threat-intelligence-identifies-php2shell-exploitation-prior-to-public-disclosure-in-madpot/
    source: AWS Security Blog
    category: tech_articles
  - title: Cloudflare deploys protections against php2shell vulnerability
    url: https://blog.cloudflare.com/php-vulnerabilities-waf-protection/
    source: The Cloudflare Blog
    category: product_news
  - title: After PHP2Shell, 45 client WordPress sites moved to Astro in 36 hours
      with Opus 5.5
    url: https://www.reddit.com/r/vibecoding/comments/1xd0w7u/after_php2shell_i_used_opus_55_to_convert_45/
    source: r/vibecoding
    category: community
  - title: "7 Security Incidents in 48 hours: what to patch, what to rotate"
    url: https://craftbettersoftware.com/p/7-security-incidents-in-48-hours
    source: Craft Better Software
    category: newsletters
  - title: "Broccoli2Shell: Brotli decoder RCE in Node.js, Python and more"
    url: https://broccoli2shell.com/
    source: Hacker News
    category: community
  - title: Kimi K3.1 Pro
    url: https://simonwillison.net/2026/Oct/23/kimi-k31-pro/
    source: Simon Willison
    category: tech_articles
  - title: "Podcast: Kimi K3.1 Pro, the new cyber reality, and Muse musings"
    url: https://www.interconnects.ai/p/podcast-kimi-k31-pro-the-new-cyber
    source: Interconnects
    category: podcasts
  - title: "AI Agents Weekly: Claude Duet, Kimi K3.1 Pro, MiniMax M3.1 Flash,
      Recursive Flint, DeepSeek DeepInfer"
    url: https://nlp.elvissaravia.com/p/ai-agents-weekly-claude-duet-kimi
    source: AI Agents Weekly
    category: newsletters
  - title: Introducing Claude Duet
    url: https://claude.com/resources/articles/claude-duet
    source: Anthropic
    category: newsletters
  - title: Microsoft says AI agents are like insider threats as frontier models
      can't be trusted
    url: https://techcrunch.com/2026/10/19/microsoft-says-ai-agents-are-like-insider-threats-as-frontier-models-cant-be-trusted/
    source: TechCrunch
    category: newsletters
  - title: The bridge to agent-scale Git infrastructure
    url: https://github.blog/engineering/architecture-optimization/the-bridge-to-agent-scale-git-infrastructure/
    source: The GitHub Blog
    category: product_news
  - title: "Introducing tsrs: a Port of TypeScript to Rust"
    url: https://blog.cloudflare.com/typescript-rust-port/
    source: The Cloudflare Blog
    category: product_news
  - title: Coding-Agent Benchmarks Should Match Their Users' Task Flows
    url: https://blog.jetbrains.com/research/2026/10/user-task-flow-paper/
    source: JetBrains Research
    category: product_news
  - title: Using thousands of AI agents to uncover new leads in biological data
    url: https://openai.com/index/scaling-ai-research-for-complex-biological-data
    source: OpenAI News
    category: product_news
  - title: r/opensource bans solo projects and projects using LLMs
    url: https://www.reddit.com/r/opensource/comments/1xelcuf/your_tokens_arent_valuable_no_more_ai
    source: Hacker News
    category: community
  - title: "Amazon CEO: $220 billion still can't meet AI demand"
    url: https://a16z.simplecast.com/episodes/amazon-ceo-220-billion-still-cant-meet-ai-demand-3QzhqLQK
    source: a16z Podcast
    category: podcasts
highlights:
  - "PHP2Shell: two AI-found PHP engine bugs give pre-auth RCE on WordPress,
    Drupal and Joomla, and Amazon saw exploitation four days before the patch"
  - LiteLLM 1.107.0 shipped a credential stealer, the sharpest of seven
    incidents in 48 hours aimed at the keys coding agents hold
  - Kimi K3.1 Pro scores 55 on Artificial Analysis, three behind Opus 5.5, at
    half its price, with open weights due November 4
  - Claude Duet stops before it sends, pays, signs or deletes, and Microsoft
    says to treat agents like insider threats
  - GitHub says 99.99999% of repositories now live in two places, and Cloudflare
    starts a Rust port of the TypeScript compiler
---

At 14:00 UTC on October 21, PHP shipped 8.2.35, 8.3.36, 8.4.27 and 8.5.12 to close two memory-corruption bugs that let an unauthenticated attacker run code on WordPress, Drupal and Joomla sites. Amazon's honeypots had already recorded someone exploiting them on October 17. Both bugs were found by teams working with AI models, and the rest of the week, from a backdoored LiteLLM release to an open-weight model three points behind Opus 5.5, reads differently once you know how short the gap between discovery and exploit has become.

## PHP2Shell was found with models and exploited before the fix

[Wiz's write-up of PHP2Shell](https://www.wiz.io/blog/php2shell-php-rce) covers CVE-2026-109618 and CVE-2026-109619, two flaws in how the PHP engine handles out-of-memory conditions and fatal errors, present in every release since 5.4. Wiz demonstrated pre-auth remote code execution against WordPress, Drupal and Joomla, plus a memory disclosure it compares to Heartbleed, and the post reached 176 points on Hacker News. Wiz, now part of Google Cloud, credits Gemini 4 Argon, GPT-5.6 Sol and its own Wiz Atlas for the find.

Ryan Austin at Calif found the same bugs independently through [OpenAI's Patch the Planet program](https://openai.com/index/coordinated-disclosure-of-critical-vulnerabilities), which pairs researchers using OpenAI models with maintainers and incident responders. Remediation took about two months of coordination, and OpenAI also published a Codex skill for checking exposure. Latent Space's AINews quoted Sarah Guo on the backdrop: published CVEs have gone from about 4,000 a month to 15,000 since April.

The embargo did not hold. [Amazon Threat Intelligence reports](https://aws.amazon.com/blogs/security/amazon-threat-intelligence-identifies-php2shell-exploitation-prior-to-public-disclosure-in-madpot/) that its MadPot sensors saw PHP2Shell exploitation on October 17, four days before the patch. [Cloudflare pushed WAF rules](https://blog.cloudflare.com/php-vulnerabilities-waf-protection/) to every plan including free, and Semgrep's [mod_php explainer](https://semgrep.dev/blog/2026/php2shell-php-runtime-rce) says Apache with mod_php is known exploitable today and that patching is the only real fix. The NSA told operators who could not patch to take systems offline, and Japan's prime minister posted the same advice on X on Wednesday night.

Some owners took it as a reason to leave PHP. One r/vibecoding user [moved 45 client WordPress sites to Astro in 36 hours with Opus 5.5](https://www.reddit.com/r/vibecoding/comments/1xd0w7u/after_php2shell_i_used_opus_55_to_convert_45/), a little under 50 minutes per site, and PHP 5 servers have no other path because that line gets no patch at all.

## Black October reaches the keys agents hold

Daniel Moka's [Craft Better Software tally](https://craftbettersoftware.com/p/7-security-incidents-in-48-hours) counts seven incidents in 48 hours. Self-managed GitLab had a CVSS 10.0 remote code execution bug in every version since 7.0. LiteLLM 1.107.0 shipped a credential stealer and a remote access trojan in the official release, so any machine that ran it should be treated as compromised, its reachable keys rotated and the package pinned to 1.106.2. Railway warned that an intruder may have read customer environment variables, and the tensorlake 0.5.144 npm release steals credentials, spreads to other packages and deletes your home directory once the stolen GitHub token stops working, which means cleaning the machine has to come before revoking the token. A certificate authority, eMudhra, turned out to have guessable private keys, one of which was the number 4.

Node.js shipped ten fixes, including a Brotli decoder RCE that OpenAI's Codex Security found. The [Broccoli2Shell disclosure](https://broccoli2shell.com/) shows the same decoder flaw reaching Python and other runtimes, and it drew 391 points on Hacker News, more than twice the PHP post. The patched Node lines are 26.12.1, 24.22.1 and 22.23.4.

Moka's argument is about where the keys sit. LiteLLM holds every provider key because routing between model vendors is its job, Railway holds the environment variables where most teams keep those keys, and a coding agent usually has the same keys in its environment while it reads issues, READMEs and web pages written by strangers. That is two legs of the lethal trifecta before the agent has a way out. He cites researchers from OpenAI, Anthropic and Google DeepMind who broke 12 published prompt-injection defenses at better than 90% success, so his fixes are structural: fewer tools, a container that sees only mounted folders, a hook that blocks `env` and `curl` to unknown hosts, and a network allowlist.

## Kimi K3.1 Pro brings open weights within three points of Opus 5.5

Moonshot released Kimi K3.1 Pro on October 23 and promised weights by November 4. It is a mixture-of-experts model with 2.8 trillion total parameters, 104 billion active and a one-million-token context, post-trained from K3 with far more reinforcement learning. [Simon Willison ran it](https://simonwillison.net/2026/Oct/23/kimi-k31-pro/) through the OpenAI-compatible endpoint support in LLM 0.32 and noted the price: $2 per million input tokens and $10 per million output, the same as GPT-6.1 Sol and half the price of Opus 5.5, with a Highspeed tier that runs two to three times faster at double the rate.

Artificial Analysis scores it 55, ahead of Fable 5.1, GPT-6 Astra and Gemini 4 Argon at 53 and behind only Opus 5.5 at 58, which makes it the highest-scoring model yet to promise open weights. Moonshot reports 65.7% on Terminal-Bench 4.0 against 66.4% for Opus 5.5 and 58.2% for Astra, and says its hallucination rate on its own hard benchmark fell from 23.4% to 8.3%. Per-token price is not the whole bill, though: an [Ask HN thread](https://news.ycombinator.com/item?id=50222093) reports a Kimi Code five-hour quota running out after $1.37 of usage.

The [Interconnects podcast on the release](https://www.interconnects.ai/p/podcast-kimi-k31-pro-the-new-cyber) dwells on its cyber numbers. Moonshot removed cyber training data before the open release; an uncontrolled checkpoint scored 90.5% on xdev-bench-hard at pass@3, and the shipped model scores 81.0%. In a week when models found PHP2Shell, defenders will read that remaining 81 more closely than any coding score.

Smaller open releases arrived alongside it. [AI Agents Weekly](https://nlp.elvissaravia.com/p/ai-agents-weekly-claude-duet-kimi) rounds them up: Recursive Flint is an Apache-2.0 coding model with about 40 billion total and 2.5 billion active parameters that fits in roughly 24GB and runs above 125 tokens per second on a MacBook Pro, with a claimed 74.2% on SWE-bench Verified. DeepSeek open-sourced DeepInfer, its serving stack, which pairs speculative decoding with an adaptive verification length and reports 1.5 million input tokens per second per prefill accelerator counting cache hits. MiniMax shipped M3.1 Flash as open weights too.

## Personal agents now stop before they spend

Anthropic [introduced Claude Duet](https://claude.com/resources/articles/claude-duet), a proactive personal agent that stops to ask before it sends, pays, signs or deletes anything. It lands against Meta Muse and OpenAI's Dots, and the AI Daily Brief's Sunday episode on [how its host uses AI day to day](https://podcasters.spotify.com/pod/show/nlw/episodes/How-Im-Actually-Using-AI-Right-Now-Including-Claude-Duet-e3r21ss) compares Dots and Duet in practice. PYMNTS covered Duet buying business supplies, the class of action the confirmation step exists for.

Enterprises want the same brakes in more places. [TechCrunch reports](https://techcrunch.com/2026/10/19/microsoft-says-ai-agents-are-like-insider-threats-as-frontier-models-cant-be-trusted/) that Microsoft now describes AI agents as something like insider threats because frontier models can't be trusted, which puts agents under controls security teams already run. JetBrains made [Air Governance](https://blog.jetbrains.com/blog/2026/10/22/air-governance-manage-ai-agents-access-and-spend-throughout-your-organization/) generally available on October 22, one console for which agents, models and providers teams may use and what they spend. For individual developers, an r/ClaudeCode post shows how to [add approval gates](https://www.reddit.com/r/ClaudeCode/comments/1xcc20x/how_to_add_approval_gates_in_claude_code/) with PreToolUse hooks, the same pattern Duet ships as a product.

## Git, TypeScript and benchmarks get rebuilt around agent traffic

GitHub's post on [the bridge to agent-scale Git infrastructure](https://github.blog/engineering/architecture-optimization/the-bridge-to-agent-scale-git-infrastructure/) says Git traffic grew exponentially over the past year and that 99.99999% of repositories now live in two places at once, GitHub's own data centers and Azure. The remainder are among the busiest repositories on the platform, held back by a 25ms round trip between sites, a cost an agent that fetches and pushes in a loop pays on every operation.

Cloudflare and VoidZero announced [tsrs](https://blog.cloudflare.com/typescript-rust-port/), a Rust port of the TypeScript compiler built with Max Schwenk of Owner.com in close collaboration with the TypeScript team. A faster type checker matters more when an agent runs it after every edit.

JetBrains Research argues that [coding-agent benchmarks should match their users' task flows](https://blog.jetbrains.com/research/2026/10/user-task-flow-paper/). Every SWE-Bench Pro task is a single user message, almost always a new feature or a bug fix, and the paper sets that against the first five developer messages in real JetBrains IDE sessions of three messages or more, where the work arrives as a sequence rather than a ticket.

## Research agents, moderators and capex

OpenAI, PerturbAI and Scripps Research [ran thousands of agents over mouse-brain gene-expression data](https://openai.com/index/scaling-ai-research-for-complex-biological-data). AINews reports the system, which it calls GPT-Rosalind, linked expression patterns to the published literature in 32 minutes and surfaced a hypothesis involving the gene DCTN1.

The moderators of r/opensource [banned solo projects and projects built with LLMs](https://www.reddit.com/r/opensource/comments/1xelcuf/your_tokens_arent_valuable_no_more_ai) under a post titled "your tokens aren't valuable, no more AI", and the decision reached the Hacker News front page while r/ClaudeCode users called it a rogue moderator move.

On a16z, [Andy Jassy said Amazon's $220 billion](https://a16z.simplecast.com/episodes/amazon-ceo-220-billion-still-cant-meet-ai-demand-3QzhqLQK) in capital spending still can't meet AI demand, and OpenAI said its models and Codex workflows are [coming to Google Cloud's Model Garden](https://openai.com/index/openai-models-google-cloud).

PHP 5 gets no patch, so every server still running it depends on a firewall rule someone else maintains or a migration someone has to pay for. The next Patch the Planet disclosure will show whether coordinated fixes can beat the four days Amazon's sensors measured this time, and whether the long tail of unmaintained PHP moves at all.

---

*Source note: the code-intel-copilot mirror reported stale sync metadata this run (last sync recorded 2026-09-01), but items through October 26 were present and this issue draws only on items dated October 19-26.*
