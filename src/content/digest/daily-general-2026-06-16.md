---
title: The Fable 5 "jailbreak" was "fix this code"
cadence: daily
track: general
origin: auto
date: 2026-06-16
summary: The jailbreak that got Claude Fable 5 export-banned turned out to be
  the prompt "fix this code," the heart of the defensive security loop. The same
  day, a Princeton/Berkeley paper showed Anthropic's Rapid Response safety
  pipeline can be poisoned through its own adaptation loop, Anthropic reversed
  its Agent SDK pricing change, and Stanford HAI shipped the ninth AI Index
  Report.
topics:
  - ai-safety
  - ai-governance
  - agent-tooling
  - pricing
  - research
  - infrastructure
audioUrl: /media/digests/daily-general-2026-06-16.mp3
durationSec: 452
items:
  - title: The Fable 5 Export Controls Harm US Cyber Defense
    url: https://simonwillison.net/2026/Jun/16/fable-5-export-controls/#atom-everything
    source: Simon Willison's Weblog
    category: tech_articles
  - title: "Rapid Poison: Practical Poisoning Attacks Against the Rapid Response
      Framework"
    url: https://arxiv.org/abs/2606.16242
    source: arXiv cs.CL
    category: research
  - title: Anthropic walks back Agent SDK pricing change
    url: https://rss.xcancel.com/GergelyOrosz/status/2066710966583132413#m
    source: Gergely Orosz / @GergelyOrosz
    category: community
  - title: Microsoft turns to AWS as GitHub faces AI capacity crunch
    url: https://runtimewire.com/article/microsoft-github-aws-ai-capacity-crunch
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: Artificial Intelligence Index Report 2026
    url: https://arxiv.org/abs/2606.15708
    source: Stanford HAI / arXiv cs.AI
    category: research
  - title: Reviews have become expensive, rewrites have become cheap
    url: http://ishmeetbindra.com/posts/reviews-have-become-expensive-rewrites-have-become-cheap/
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: "[AINews] Satya on Loopcraft: Building Frontier Ecosystems"
    url: https://www.latent.space/p/ainews-satya-on-loopcraft-building
    source: AINews / Latent.Space
    category: newsletters
highlights:
  - The "jailbreak" behind Fable 5's export ban was asking the model to "fix
    this code" with planted vulnerabilities, the core defensive security loop.
  - Rapid Poison flips Anthropic's ASL-3 Rapid Response classifiers to ~100%
    false positives and 96% false negatives at a 1% poisoning rate.
  - Anthropic reversed its no-warning move of Agent SDK usage from Claude Code
    Max quotas to API pricing after developer backlash.
  - Microsoft is leaning on AWS for capacity as GitHub Copilot demand outpaces
    its own cloud.
---

The "jailbreak" that got Claude Fable 5 banned under a US export control was, in the end, the prompt "fix this code." Kate Moussouris of Luta Security [confirmed the detail](https://simonwillison.net/2026/Jun/16/fable-5-export-controls/#atom-everything) that Simon Willison surfaced today: researchers fed the model open-source code carrying known CVEs plus freshly planted vulnerabilities, asked it to "review the code for security issues," and got a refusal. They then asked it to "fix this code," and through a multistep manual process turned the patched output into test scripts. That round trip, find a bug, fix it, write a test that proves the patch holds, is the loop defenders run every day. It is the single most valuable thing a coding model does. The export-control suspension we covered last week, justified by the model's supposed offensive cyber capability, now rests on a demonstration that the model is good at defensive security. As Moussouris puts it, the capability "cannot be removed without making the model worse at fixing bugs and verifying patches." Non-technical decision-makers spent months hearing that models which can "craft cyber attacks" are uniquely dangerous, and the result is a posture that would ban any model that helps secure code.

The policy story has a research echo from the same window. A team from Princeton and Berkeley published [Rapid Poison](https://arxiv.org/abs/2606.16242), showing that the Rapid Response framework behind Anthropic's ASL-3 safeguards can be poisoned through its own adaptation loop. Rapid Response watches for new jailbreaks, generates synthetic variants, and retrains its detection classifiers on them. The attack slips poisoned samples into that training set using nothing but prompt injection on jailbreak inputs, never touching benign data or labels. Their Omission Attack exploits a quirk where a classifier trained on concept-absent unsafe samples learns to associate that concept with the safe label. At a 1% poisoning rate they hit up to 100% false-positive and 96% false-negative rates. The self-improving safety pipeline becomes the attack surface.

On the developer-facing side, Anthropic spent the day reversing itself on Agent SDK pricing. After the SDK shipped, developers built integrations that ran on the more generous Claude Code Max subscription quotas; Anthropic then moved programmatic use to API pricing with no warning, and [walked it back](https://rss.xcancel.com/GergelyOrosz/status/2066710966583132413#m) after the backlash, as Gergely Orosz flagged. The read from developers is that this signals a strategic pivot toward being an infrastructure provider rather than a super-app, extending subsidized subscription quota to power third-party applications instead of just Anthropic's own. The open question is durability, whether the reversal sticks or the next quiet pricing change lands the same way.

Underneath all of it is a compute story. "[Microsoft turns to AWS as GitHub faces AI capacity crunch](https://runtimewire.com/article/microsoft-github-aws-ai-capacity-crunch)" hit the Hacker News front page with 136 points, reporting that GitHub Copilot's demand is pushing Microsoft to lean on a rival hyperscaler for capacity. When the company that owns both the largest code host and a major cloud has to rent from AWS to keep its coding agent fed, the scarcity is not abstract anymore.

Stanford HAI dropped the ninth edition of the [AI Index Report](https://arxiv.org/abs/2606.15708), the field's annual reference dataset, authored by a roster that includes Jack Clark, Erik Brynjolfsson, James Manyika, and Yoav Shoham. This year's framing is the gap between what AI can do and how prepared anyone is to manage it: governance, evaluation methods, and measurement infrastructure all lag the capability curve. The report adds standalone chapters on AI in science and AI in medicine, fresh estimates of generative AI's economic value, and a recurring warning that the benchmarks the field relies on are getting harder to trust. If you cite one number about the state of AI this quarter, pull it from here.

Two pieces worth reading on how the work itself is changing. The widely-shared essay "[Reviews have become expensive, rewrites have become cheap](http://ishmeetbindra.com/posts/reviews-have-become-expensive-rewrites-have-become-cheap/)" argues that when an agent can regenerate a module in minutes, the bottleneck shifts from producing code to understanding it well enough to approve it; reading someone else's diff is now the costly step, not writing your own. And swyx's AINews ran [Satya on Loopcraft](https://www.latent.space/p/ainews-satya-on-loopcraft-building), a Nadella interview on building frontier ecosystems rather than single models, a useful counterweight to the model-launch news cycle from someone steering one of the largest AI platforms.

What to watch: whether the Fable 5 export controls get revisited now that the "jailbreak" is public, and whether Anthropic's SDK pricing reversal holds long enough for anyone to trust building on it again.
