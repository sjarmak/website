---
title: Nvidia licensed Poolside's model factory for $6B and hired 109 of its people
cadence: daily
track: general
origin: auto
date: 2026-08-21
summary: "Nvidia paid $6B to license Poolside's model factory, invested $1B at a
  $12B pre-money valuation, and hired 109 employees from a research org that
  numbered under 115; the founders stayed and the letter to investors blames a
  lost 40,000-GB300 cluster. GitHub's August 17 postmortem puts a number on why:
  monthly commits went from 1.4 billion in April to 2.9 billion now, and both
  August incidents were capacity failures rather than bad deploys. Plus a
  build.rs compromise in the 244M-download arrayref crate, a guest-to-host
  escape in isolated-vm, Devin in Slack, GitLab's Flow Creator agent, and Bun
  1.4."
topics:
  - ai-infrastructure
  - agent-security
  - agent-tooling
  - developer-productivity
  - agent-reliability
  - ai-economics
audioUrl: /media/digests/daily-general-2026-08-21.mp3
durationSec: 834
items:
  - title: "[AINews] Poolside gets $12B reverse-execuhire to NVIDIA; founders stay
      for $1B, employees go for $6B, Infraco scaling to 7GW neocloud"
    url: https://www.latent.space/p/ainews-poolside-gets-12b-reverse
    source: Newsletter Misc
    category: newsletters
  - title: The August 17 outage, and the work ahead
    url: https://github.blog/news-insights/company-news/the-august-17-outage-and-the-work-ahead/
    source: The GitHub Blog
    category: product_news
  - title: Rust crates arrayref & append-only-vec compromised via malicious
      proc-macro1 dependency
    url: https://semgrep.dev/blog/2026/rust-crates-arrayref-append-only-vec-compromised-proc-macro1
    source: Semgrep Blog
    category: product_news
  - title: npm v12 Shuts Down a Popular Malware Trick — But the Threat Isn't Going
      Away
    url: https://devops.com/npm-v12-shuts-down-a-popular-malware-trick-but-the-threat-isnt-going-away/
    source: DevOps.com
    category: tech_articles
  - title: Critical Flaw in isolated-vm Can Lead to Sandbox Escape, RCE Threat
    url: https://devops.com/critical-flaw-in-isolated-vm-can-lead-to-sandbox-escape-rce-threat/
    source: DevOps.com
    category: tech_articles
  - title: Introducing Slack Code in Devin
    url: https://rss.xcancel.com/cognition/status/2090509362494050656#m
    source: Cognition / @cognition
    category: product_news
  - title: Build custom flows in minutes with the Flow Creator agent
    url: https://about.gitlab.com/blog/flow-creator-agent/
    source: GitLab Blog (GitLab Duo etc.)
    category: product_news
  - title: A shot-scraper-style JSON API on Bun 1.4's new Bun.WebView
    url: https://simonwillison.net/2026/Aug/20/bun-webview-json-api/
    source: Simon Willison's Weblog
    category: tech_articles
highlights:
  - Nvidia licensed Poolside's model factory for $6B and hired 109 people from a
    research org Eiso Kant sized at under 115; the founders stayed behind with a
    $1B investment at $12B pre-money.
  - "Poolside's letter to investors: a six-week window to raise $2B for a
    40,000-GB300 cluster closed without the money, and they lost the cluster."
  - GitHub's August 17 outage ran 7h47m and was a capacity failure, not a bad
    deploy; monthly commits went from 1.4B in April to 2.9B, and Azure now
    carries ~58% of platform load, up from 12% in May.
  - The arrayref crate (244M downloads) was compromised by one dependency line
    on proc-macro1, a proc-macro2 typosquat, with the payload in build.rs so
    compiling is enough to run it.
  - Endor Labs escalated a transferList TOCTOU in isolated-vm from a single
    ivm.Reference to host control-flow hijack; patched in 7.0.1 and 6.2.0.
  - Bun 1.4 is the first stable release after the Zig-to-Rust rewrite, and
    Bun.WebView drives a full Chrome in a 192-256MB container.
---

Nvidia paid $6 billion to license Poolside's model factory and hired 109 of its employees, then put another $1 billion into the company at a $12 billion pre-money valuation. Fewer than 70 people built Poolside's model, and fewer than 115 across engineering and research touched the effort at all, by Eiso Kant's own count on a podcast last month, so 109 is close to every technical person who was there. The founders stayed. [AINews filed it under reverse-execuhire](https://www.latent.space/p/ainews-poolside-gets-12b-reverse), because the Windsurf-Google and Scale-Meta deals ran the other direction: the executives left, and the employees held the remaining company.

The letter to investors explains the economics better than the deal structure does. "At the end of last year, we had a 6 week window in which to raise $2 billion dollars to pay for a 40,000 GB300 cluster coming online in January. We didn't close it in time, and we lost the cluster." The founders put the cost of matching today's frontier at 10,000 to 20,000 GB300s, and next year's frontier at more than an order of magnitude beyond that, with the binding constraint no longer capital alone but physical datacenter space and contracted compute. Poolside Infrastructure Company, spun out in January, is still building a 1.2GW site in Texas, and it hired a new CEO two months ago and a CFO three days ago. The founders' stated thesis is that open models will commoditize human-level capability while superintelligence stays scarce, and that the durable revenue sits in experiment-bound problems rather than intelligence-bound ones. What the remaining entity actually does, they say they aren't ready to describe.

GitHub published [its account of the August 17 outage](https://github.blog/news-insights/company-news/the-august-17-outage-and-the-work-ahead/), which ran 7 hours and 47 minutes across github.com, auth, Actions, the API, pull requests, issues, and Copilot. Neither that incident nor the August 6 Actions failure came from a code or config change; both were capacity failures, a critical component in the Central US datacenter that did not scale as traffic hit a new peak. The number that reframes it: monthly commits went from 1.4 billion in April to 2.9 billion now. GitHub has added more than 3 million CPU cores and 120 petabytes of high-speed storage since, and Azure now carries roughly 58% of platform load and half of all Git operations, up from 12% in May. Recovery was slowed by a client-side retry loop in Copilot services that added traffic during restoration, which is why the two concrete fixes named are consistent retry limits with retry budgets across service-to-service calls, and a review of low-priority CPU and memory alerts. If you run agents against the GitHub API at volume, your own retry policy is now part of GitHub's blast radius.

Two supply-chain stories landed on the same day and point in opposite directions. Semgrep documented that [the Rust crates arrayref and append-only-vec were compromised](https://semgrep.dev/blog/2026/rust-crates-arrayref-append-only-vec-compromised-proc-macro1) by a single added dependency line pointing at proc-macro1, a typosquat of proc-macro2. The payload lives in build.rs, so compiling anything that depends on arrayref, which has 244 million downloads, downloads and executes it. A second lookalike, proc-macro-en, was published under "daveroundy" impersonating the real maintainer "droundy," which suggests the campaign was still spreading when it was caught. Meanwhile npm v12 stopped running lifecycle scripts automatically at install, closing the postinstall path attackers have leaned on for years. Checkmarx's Darren Meyer, [quoted in DevOps.com](https://devops.com/npm-v12-shuts-down-a-popular-malware-trick-but-the-threat-isnt-going-away/), expects the cost to shift rather than vanish: most lifecycle scripts are benign, developers under deadline will approve them without reading, and malicious behavior moves into code that runs at import time instead. His practical advice is to set an allowScripts policy jointly with engineering and make strict-allow-scripts the configured default, rather than telling everyone to pass --ignore-scripts and declare it handled.

The sandbox layer took a hit too. Endor Labs found a type confusion in isolated-vm's ExternalCopy handling of the transferList option, [reported by DevOps.com](https://devops.com/critical-flaw-in-isolated-vm-can-lead-to-sandbox-escape-rce-threat/) and tracked as GHSA-864f-rcv7-6rh4. The constructor walks the transfer list twice, validating on the first pass and transferring on the second without revalidating, so a stateful getter can hand a genuine ArrayBuffer to the check and something else to the use. Starting from a single ivm.Reference, the ordinary way a host exposes anything to a sandbox, the researchers escalated to hijacking the host's control flow. The V8 Isolate boundary held; the memory-unsafe C++ glue carrying data across it did not. isolated-vm does over a million downloads a week and is the sandbox of record for n8n, Mastra, Sim.ai, Activepieces, Fly.io, and Algolia's crawler. Patches are in 7.0.1 and 6.2.0.

On the product side, Cognition [launched Slack Code in Devin](https://rss.xcancel.com/cognition/status/2090509362494050656#m) as a Slack launch partner, with Devin creating dedicated code channels rather than sprawling a thread, replying with video recordings of tested changes, and consolidating feedback instead of answering every message. Cognition published a separate note on tuning Devin's Slack etiquette, which is a real design problem: an agent that responds to everything in a shared channel is worse than one that responds to nothing. Watch whether the code channel becomes the review surface or just another place PR notifications pile up.

GitLab 19.3 shipped a [Flow Creator agent](https://about.gitlab.com/blog/flow-creator-agent/) that writes Custom Flow definitions from a plain-language description, removing the Flow Registry YAML schema as a prerequisite for authoring automation. The engineering underneath it is worth copying: the agent re-reads the Flow Registry docs before every response rather than answering from training, applies rules encoding failure patterns seen in real flows, and runs a pre-output checklist before generating any YAML. The named failure modes are specific, including a missing project_id so the flow targets nothing, human-in-the-loop gates that pass without pausing, sends_response_to pointed somewhere nobody reads, and missing stopping instructions so the agent works past completion. Authoring stays open; enabling a flow still requires Maintainer, and every flow runs under a scoped service account bounded by the permissions of whoever triggered it.

Bun 1.4 landed as the first stable release since the Zig-to-Rust rewrite, adding 1,517 tests from the Node.js suite, fixing over 2,900 issues, cutting idle CPU 5x and memory up to 35%, and starting 50% faster on Linux. Simon Willison went straight for Bun.WebView, which puts browser automation in Bun core through macOS WebKit or a local Chromium over the Chrome DevTools Protocol, and [had Claude Code build a shot-scraper-style JSON API on it](https://simonwillison.net/2026/Aug/20/bun-webview-json-api/) to find out what it costs to run. Answer, measured with cgroups: 192MB to 256MB of container memory to drive a full Chrome against complex pages. That is a cheap enough per-instance footprint to change how you'd budget a fleet of browser-using agents.

Two things to watch over the next few days. Whether anything at all emerges from the OpenRouter stealth endpoint that surfaced on Hacker News, which is usually how a frontier release announces itself early. And whether Nvidia's licensing-plus-hiring structure gets copied, because it is a cleaner way to buy a research team than an acquisition, and there are several model labs currently short a cluster.
