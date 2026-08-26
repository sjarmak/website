---
title: One tool call moved a SWE-bench Pro score from 28% to 50.7%
cadence: daily
track: general
origin: auto
date: 2026-08-26
summary: A reproduction attempt on Qwen's SWE-bench Pro score got 28% with a
  bash-only agent and 50.7% after adding one file-edit tool, which is the
  opening of Pascal Biese's argument that every benchmark number describes a
  model-harness-effort triple rather than a model. Semgrep published the
  counter-example the same day, benchmarking Mythos against 22 configurations of
  frontier models, open-weight models, and custom harnesses on human-reviewed
  IDOR labels. OpenAI released first results for its Jalapeno inference chip,
  and X Corp's cease-and-desist took XCancel and Nitter offline.
topics:
  - agent-harnesses
  - evals
  - benchmarks
  - model-releases
  - ai-infrastructure
  - agent-tooling
  - agent-security
unresolvedFacets:
  - agent-harnesses
audioUrl: /media/digests/daily-general-2026-08-26.mp3
durationSec: 693
items:
  - title: The Harness-Maxxing Trap
    url: https://www.llmwatch.com/p/the-harness-maxxing-trap
    source: LLM Watch
    category: ai_news
  - title: We benchmarked A LOT of models, here's how they compare to Mythos
    url: https://semgrep.dev/blog/2026/mythos-idor-benchmark
    source: Semgrep Blog
    category: product_news
  - title: Jalapeno's first results show industry-leading speed and efficiency in AI
      inference
    url: https://openai.com/index/jalapeno-first-results
    source: OpenAI News
    category: product_news
  - title: ChatGPT Work can now sign in to websites without seeing your credentials
    url: https://rss.xcancel.com/ChatGPT/status/2092366554965107164#m
    source: OpenAI / @OpenAI
    category: product_news
  - title: XCancel also down, at least for time being
    url: https://news.ycombinator.com/item?id=49440786
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: Nitter project received cease and desist
    url: https://github.com/zedeus/nitter/issues/1442
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: Diagrid Catalyst 2.0 Adds Durable and Verifiable Execution for AI Agents
    url: https://www.infoq.com/news/2026/08/diagrid-catalyst-ai-agents/
    source: InfoQ
    category: tech_articles
  - title: The Context Tax of Agentic Development
    url: https://medium.com/expedia-group-tech/the-context-tax-of-agentic-development-0bb9de03237c
    source: Expedia Group Technology
    category: product_news
  - title: Perplexity Portable Computer for local-first AI
    url: https://www.perplexity.ai/hub/blog/introducing-portable-computer-for-local-first-ai
    source: "Hacker News: Front Page"
    category: tech_articles
highlights:
  - "Same weights, different wrapper: a bash-only agent reproduced 28% on
    SWE-bench Pro where Qwen reported 53.5%, and adding one str_replace tool
    took it to 50.7%."
  - GPT-5.5 scores 83.1% in Codex and 78.0% in Terminus 2 on Terminal-Bench 2.1
    at the same effort level, so five points of apparent model capability live
    in the harness.
  - LangChain held the model fixed and moved from 52.8% to 66.5% on
    Terminal-Bench 2.0 with a pre-exit verification hook, a directory map, and a
    loop detector.
  - Semgrep benchmarked Mythos against 22 other configurations spanning frontier
    models, open-weight models, and custom harnesses on human-reviewed IDOR
    labels.
  - OpenAI plans to begin deploying its Jalapeno inference chip into its own
    compute by year-end, with Gen 2 in development and Gen 3 taking shape.
  - X Corp's cease-and-desist on 24 August took XCancel offline and hit the
    upstream Nitter project, breaking any pipeline that resolves X posts through
    a mirror.
---

A developer trying to reproduce Qwen's reported 53.5% on SWE-bench Pro got roughly 28% running the model through a bash-only agent. Adding a single file-edit tool, `str_replace`, took the same weights to 50.7%. One line in the wrapper, nearly double the score.

Pascal Biese opens [The Harness-Maxxing Trap](https://www.llmwatch.com/p/the-harness-maxxing-trap) with that GitHub issue, and it is the sharpest thing published in the last day. His argument is that a benchmark number describes a triple, model plus harness plus effort level, and that almost nobody reports it that way. The evidence he assembles is hard to wave off: the same GPT-5.5 scores 83.1% in Codex and 78.0% in Terminus 2 on Terminal-Bench 2.1 at the same effort setting, five points of apparent model capability that live entirely in the scaffolding. LangChain held the model fixed, rewrote only the wrapper, and moved their coding agent from 52.8% to 66.5% on Terminal-Bench 2.0, from outside the top thirty into the top five. The changes were a pre-exit hook forcing a verification pass, a startup step that maps the directory so the agent stops burning turns on discovery, and a loop detector. The most common failure they found was the agent writing code, re-reading it, deciding it looked fine, and never running a test.

Biese's three risks are worth reading in full, but the one with teeth for anyone selecting a model right now is procurement. A team that picks on published scores is buying a wrapper it does not have, tuned against a benchmark it does not run, and will then wire those weights into its own harness where none of the tuning carries over. He also notes that Stanford's IRIS lab has published Meta-Harness, an outer-loop search over harness code itself, which means the tuning that used to require an engineer reading traces can now run unattended against whatever metric you point it at. The second risk follows from the first: every tuned component encodes a workaround for one model's specific failure, and OpenAI's own harness team says their best components are designed to be deleted. A harness maxed against a March model can be a liability by September, right when you want to swap.

Semgrep published the counter-example on the same day. [Their Mythos benchmark writeup](https://semgrep.dev/blog/2026/mythos-idor-benchmark) runs Mythos against 22 other configurations, frontier models, open-weight models, and custom harnesses, all on one set of human-reviewed IDOR labels, precisely because "Mythos-class" has become industry shorthand for a capability tier nobody has defined. Putting models and harnesses in the same column of the same table is the right shape for this. It is also, per Biese, the only kind of number you should trust, and it is still rare enough to be notable when a vendor does it.

OpenAI spent its day on silicon. [Jalapeño's first results](https://openai.com/index/jalapeno-first-results) are out for its custom inference chip: higher throughput and lower latency in one architecture, with the efficiency claim framed as more intelligence per watt. Deployment into OpenAI's own compute starts by year-end, Gen 2 is described as deep in development, and Gen 3 is taking shape. The company was explicit about what this buys developers, faster ChatGPT responses and more responsive Codex sessions and agents, which is the part that matters if your workflow is a long agent loop where latency compounds across dozens of turns. The [companion post on the full stack behind abundant intelligence](https://openai.com/index/the-full-stack-behind-abundant-intelligence) puts it in the broader infrastructure frame. Nothing here is independently benchmarked yet, so treat the numbers as vendor-reported until someone runs their own.

The agentic-browsing story moved too. [ChatGPT Work can now sign in to websites](https://rss.xcancel.com/ChatGPT/status/2092366554965107164#m) on web and mobile using its own computer and browser, with OpenAI stating that ChatGPT never sees the username or password. The listed use cases are heavily consumer-administrative, booking a DMV appointment, submitting reimbursement paperwork, filling out permit applications, but the interesting bit for practitioners is the credential-isolation claim. If an agent can authenticate to arbitrary sites without the model ever holding the secret, the boundary has moved from "don't paste your password into the prompt" to a delegation primitive worth auditing. OpenAI also shipped an [Admin plugin for ChatGPT Work and Codex](https://openai.com/index/introducing-admin-plugin) and a $100 Business Premium seat, which is the governance and pricing scaffolding you would expect to arrive alongside.

That sign-in announcement is linked above through an XCancel mirror, and XCancel is now down. X Corp sent a cease-and-desist on Monday 24 August at 8PM EST; the operators posted that [the service is stopped until further notice](https://news.ycombinator.com/item?id=49440786) while they seek legal advice. The upstream [Nitter project received the same letter](https://github.com/zedeus/nitter/issues/1442). If you have an RSS pipeline, a research scraper, or a link archive that resolves X posts through a Nitter instance, it is breaking now, not eventually. Anyone who has been treating those mirrors as durable infrastructure for two years just learned they were a legal posture, not a protocol.

On the durability side of agent infrastructure, InfoQ covers [Diagrid Catalyst 2.0](https://www.infoq.com/news/2026/08/diagrid-catalyst-ai-agents/), which adds Dapr-based recovery, signed workflow history, and execution attestation across several agent frameworks. Signed history and attestation are the parts to notice: they address the audit question Biese flags as the thing a harness structurally cannot answer, since the harness lives inside the agent's own process and anything enforced there can be bypassed by the next team that calls your internal API directly. InfoQ's own framing is appropriately cautious, telling architects to compare it against framework-native durability and established workflow engines rather than assuming a new layer is the answer.

Expedia's engineering team published [The Context Tax of Agentic Development](https://medium.com/expedia-group-tech/the-context-tax-of-agentic-development-0bb9de03237c), whose subtitle is the whole thesis: missing context used to slow a team down, and with agents in the loop it speeds up the wrong work instead. That inverts the usual productivity framing. A human blocked on missing context stalls and asks; an agent fills the gap with a plausible guess and ships at full speed in the wrong direction. It is the same failure surface Biese's claims-processing example walks through, arriving from a different starting point.

Perplexity announced a [portable computer for local-first AI](https://www.perplexity.ai/hub/blog/introducing-portable-computer-for-local-first-ai), which lands the same week Hacker News surfaced someone running a 35B Qwen model on a Raspberry Pi as a car assistant. The local-inference hardware push keeps getting more product-shaped.

What to watch: whether anyone runs Jalapeño's numbers independently, and whether the Semgrep-style model-and-harness-in-one-table format spreads to the labs that publish leaderboard scores. Biese's read is that harness engineering stays the highest-leverage thing an agent team can do for at least six months. The open question is who publishes the triple.
