---
title: AI-found PHP2Shell forces a web-wide patch, litellm 1.107.0 ships a
  backdoor, OpenAI models land on Google Cloud
cadence: daily
track: general
origin: auto
date: 2026-10-22
summary: Two model-driven teams independently found the same PHP engine bugs and
  the ecosystem patched them in a coordinated release. The same day brought a
  backdoored litellm release, OpenAI models on Google Cloud, Claude Mods,
  TorchNeuron, and a code-review benchmark.
topics:
  - security
  - supply-chain
  - agent-tooling
  - model-availability
  - infra
  - ai-for-science
  - benchmarks
unresolvedFacets:
  - supply-chain
  - infra
audioUrl: /media/digests/daily-general-2026-10-22.mp3
durationSec: 732
items:
  - title: "[AINews] OpenAI's Patch the Planet program is 1 of 2 parties to discover
      PHP2Shell vulnerabilities in core PHP"
    url: https://www.latent.space/p/ainews-openais-patch-the-planet-program
    source: Latent Space
    category: tech_articles
  - title: "LiteLLM PyPI compromise: credential stealer and backdoor in 1.107.0"
    url: https://safedep.io/litellm-pypi-compromise-credential-stealer-backdoor/
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: OpenAI models coming to Google Cloud
    url: https://openai.com/index/openai-models-google-cloud
    source: OpenAI News
    category: product_news
  - title: "Survey says: you'll swap the model, but everything you build around it
      is staying put"
    url: https://stackoverflow.blog/2026/10/21/survey-says-you-ll-swap-the-model-but-everything-you-build-around-it-is-staying-put/
    source: Stack Overflow Blog
    category: tech_articles
  - title: Claude designs protein binders against scorpion neurotoxins
    url: https://www.anthropic.com/research/claude-scorpion-toxin-binder-design
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: "Claude Mods: Flipping the Harness Inside Out"
    url: https://www.latent.space/p/claude-mods
    source: Newsletter Misc
    category: newsletters
  - title: AWS announces native PyTorch support for Trainium (TorchNeuron public beta)
    url: https://aws.amazon.com/about-aws/whats-new/2026/10/aws-announce-native-pytorch-support-trainium
    source: AWS What's New
    category: product_news
  - title: "We benchmarked 21 LLMs on code review: higher reasoning effort reduced
      precision"
    url: https://www.reddit.com/r/LLMDevs/comments/1xbhxpp/we_benchmarked_21_llms_on_code_review_higher/
    source: LLMDevs
    category: community
highlights:
  - "PHP2Shell (CVE-2026-109618/109619): pre-auth RCE across PHP 5.4+, found
    independently by Calif via OpenAI's Patch the Planet and by Wiz; fixed in
    8.5.12/8.4.27/8.3.36/8.2.35"
  - litellm 1.107.0 wheels and Docker image (incl. latest tags) carry a
    credential stealer and backdoor that runs on any Python start; 1.106.2 is
    clean; rotate provider keys first
  - OpenAI frontier models and Codex workflows are coming to Google Cloud Model
    Garden; Stacklok's 520-leader survey says the lock-in fear is the layer
    around the model
  - Claude designed 318K candidate binders against scorpion neurotoxins in a
    Citrini Research experiment; OpenAI ran thousands of agents over millions of
    brain cells with Scripps
  - Claude Mods are TypeScript middleware for the Claude Code harness; six
    built-ins ship today
  - TorchNeuron public beta puts native PyTorch on Trainium a day after Google's
    TorchTPU landed in TorchTitan
  - "Ironbee's 7,980-review benchmark: higher reasoning effort raised recall for
    13 of 18 models and cut precision for 11, with no F2 gain at the top"
---

Two bugs in the PHP engine got a coordinated fix at 14:00 UTC yesterday, and the discovery story matters more than the patch. CVE-2026-109618 and CVE-2026-109619 are memory corruption in how PHP handles out-of-memory conditions and fatal errors. Researchers demonstrated pre-auth remote code execution against WordPress, Drupal and Joomla, plus a Heartbleed-style memory disclosure, and [Cloudflare](https://blog.cloudflare.com/php-vulnerabilities-waf-protection/) says every PHP release from 5.4 onward carries the flaw. [OpenAI's disclosure](https://openai.com/index/coordinated-disclosure-of-critical-vulnerabilities) credits Ryan Austin at Calif, working inside the Patch the Planet program with GPT-5.6 Sol, with finding the bugs in August. [Wiz](https://www.wiz.io/blog/php2shell-php-rce), now part of Google Cloud, found the same bugs independently using Gemini 4 Argon, GPT-5.6 Sol and its own Wiz Atlas tooling. Two teams, two model stacks, one bug class, and about two months of coordinated remediation before anything went public.

Fixed versions are PHP 8.5.12, 8.4.27, 8.3.36 and 8.2.35. [Semgrep](https://semgrep.dev/blog/2026/php2shell-php-runtime-rce) calls Apache mod_php deployments exploitable today. Cloudflare had WAF rules live before the release, free tier included, and reports early attack traffic. The NSA told operators to patch now or take systems offline. The [PHP Foundation](https://thephp.foundation/blog/2026/10/21/todays-php-security-release-and-how-were-strengthening-php-security/) used the release to describe what it is changing about PHP's security process.

Then the pushback. [Elias Taylor](https://eliastaylor.com/noexploit/) argues there is no easy exploit, and that post drew 86 points on Hacker News. [AINews](https://www.latent.space/p/ainews-openais-patch-the-planet-program), which led with the story, says the Log4Shell comparison is "up to some debate" and flags a Censys figure of roughly 1.5 million unpatched servers as uncorroborated. On the slow side, AWS rated the CVEs Important rather than Critical, and [an Amazon Linux 2023 issue](https://github.com/amazonlinux/amazon-linux-2023/issues/1148) says that classification could put the fix 20 days out. The Dutch NCSC took systems offline. Talk of a third CVE is circulating on HN with no confirmation yet.

The durable fact is the one AINews draws out: two independent groups pointed frontier models at one of the most audited runtimes on the internet and found the same decade-old bug class within weeks of each other. Expect a year of this, at least. OpenAI has already published a Codex skill for checking exposure.

Supply chain, same day. litellm 1.107.0 on PyPI and Docker shipped a credential stealer and a backdoor. [SafeDep's analysis](https://safedep.io/litellm-pypi-compromise-credential-stealer-backdoor/) covers the payload; [the r/LLMDevs PSA](https://www.reddit.com/r/LLMDevs/comments/1xbuk6l/psa_litellm_11070_on_pypi_and_docker_shipped_an/), citing Aikido, has the operational detail. Affected: every 1.107.0 wheel and the `litellm/litellm:1.107.0` image, including anything pulled through the `latest`, `main-latest` or `main-stable` tags. 1.106.2 is clean. The payload runs on any Python interpreter start through a `cook.pth` and `sitecustomize.py` hook, so `pip show` tells you nothing. The markers are `/tmp/.pc_once_72129118c59f5636c0bb` (stealer ran) and `/tmp/remote_code_loader.lock` (backdoor ran). It read `LiteLLM_CredentialsTable`, which means every provider key behind an affected proxy is exposed. Rotate from a clean machine first, rebuild second, and pin by hash and image digest from here on. The PSA author works on a competing gateway and says so.

[OpenAI announced](https://openai.com/index/openai-models-google-cloud) its frontier models and Codex workflows are coming to Google Cloud's Model Garden via the Marketplace. That is OpenAI selling through its largest rival's cloud, on the same day Google-owned Wiz co-disclosed PHP2Shell with OpenAI's bug-hunting program. AINews notes a related API change: Anthropic's API version 2026-10-21 removes temperature, top_p and top_k from Messages, new major SDKs default to it, and 2023-06-01 stays supported. Check migration behavior before you bump an SDK. The distribution news lands next to a [Stacklok survey of 520 technical leaders](https://stackoverflow.blog/2026/10/21/survey-says-you-ll-swap-the-model-but-everything-you-build-around-it-is-staying-put/) on the Stack Overflow blog: leaders already swap models freely, and the lock-in they fear is the layer they build around the model, not the model itself. Model Garden listings make the first half truer; nothing announced today touches the second.

[Anthropic](https://www.anthropic.com/research/claude-scorpion-toxin-binder-design) published work on Claude designing protein binders against scorpion neurotoxins. AlphaSignal's summary puts the count at 318,000 candidate proteins generated autonomously, and the AI Daily Brief notes the experiment was run by Citrini Research, a financial research firm rather than a wet lab. The post took 53 points and 24 comments on HN. OpenAI shipped a parallel result the same day: [thousands of agents](https://openai.com/index/scaling-ai-research-for-complex-biological-data) run with PerturbAI and Scripps Research over a dataset of millions of brain cells, looking for leads. Neither post is a drug, but the shape is consistent: large agent fleets as a screening layer in front of human biology.

On the harness side, [Dan McAteer's guest post on Latent.Space](https://www.latent.space/p/claude-mods) is the clearest description so far of Claude Mods. A mod is a Claude Code plugin of TypeScript functions running inside the harness that respond to events like a prompt, a tool call or a render, and can observe, change what gets rendered, or replace the default behavior outright. Middleware for the agent loop. Anthropic ships six built-in mods, visible under /plugin, Installed, Built-in: agents-md, diff, plugin-authoring, sec-default, telemetry and you-should-know, with only one off by default. The you-should-know example in the post catches about 45 files of uncommitted work before a session ends. McAteer's own ModSmith plugin adds a Next Steps Supervisor that fires after any turn that edited files, ran commands or made eight or more tool calls. He puts it beside ChatGPT's Intelligent UI from the October 7 GPT-6 release and Cursor's PR Routing and Approval, which reads its policy from the base branch so an agent cannot edit approval rules on its own PR. Cursor's docs still say it does not replace a full code review.

AWS opened the public beta of [TorchNeuron](https://aws.amazon.com/about-aws/whats-new/2026/10/aws-announce-native-pytorch-support-trainium), a native PyTorch backend for Trainium, alongside [Neuron 2.33](https://aws.amazon.com/about-aws/whats-new/2026/10/aws-announce-neuron-2-33-0), which runs eager mode or torch.compile on Trn2 and Trn3 and adds Neuron Observer, which detects health issues in under a second. TechCrunch called it AWS's biggest shot at Nvidia yet. With Google's TorchTPU landing in TorchTitan yesterday, both hyperscalers now pitch the same thing in the same month: your PyTorch code, their silicon, no rewrite.

Last, a benchmark from [r/LLMDevs](https://www.reddit.com/r/LLMDevs/comments/1xbhxpp/we_benchmarked_21_llms_on_code_review_higher/) worth the read. Ironbee ran 21 models across reasoning settings, three runs each, for 7,980 reviews on Martian's Code Review Bench of 50 real PRs (two expensive models got a 10-PR subset). Higher reasoning effort improved recall for 13 of 18 models and cut precision for 11, with no F2 gain for the leading models. Of 48 benchmark "false positives" they checked by hand, 13 were real issues missing from the reference answers. The best raw models landed in the same statistical group as the best of 21 dedicated review tools on F2. Code is on [GitHub](https://github.com/ironbee-ai/code-review-benchmarks). The lesson for anyone wiring a reviewer: more thinking buys recall, and you pay for it in noise.

What to watch: whether a third PHP CVE materializes, how long Amazon Linux takes, the real blast radius of the litellm keys, and whether model-found CVEs in core runtimes become a monthly cadence rather than a headline.

*Feed note: the item mirror reported a stale sync timestamp; the items above were checked individually and run through October 22.*
