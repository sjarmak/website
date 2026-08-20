---
title: Asana cleared five years of engineering work for $12K, and JetBrains
  counted why it costs that much
cadence: daily
track: general
origin: auto
date: 2026-08-20
summary: "Asana finished a test-system migration scoped at five engineer-years
  in two weeks for about $12,000 with Codex, and the story hit the Hacker News
  front page this morning. JetBrains published the counterpoint: a traced agent
  burned 163 dotnet builds across 2,513 tool calls guessing at refactorings it
  had no way to invoke, and handing it Rider's refactoring engine cut cost per
  solved task from $0.52 to $0.19. Cursor moved cloud agents onto event triggers
  and isolated subagent VMs, DeepSeek open-sourced its agent runtime, and
  Dynatrace bought Arize."
topics:
  - agent-tooling
  - coding-agents
  - developer-tools
  - agent-harnesses
  - agent-skills
  - cost-per-task
  - model-releases
unresolvedFacets:
  - developer-tools
  - agent-harnesses
  - cost-per-task
audioUrl: /media/digests/daily-general-2026-08-20.mp3
durationSec: 713
items:
  - title: Asana cleared 5 years of engineering work in 2 weeks with Codex
    url: https://openai.com/index/asana
    source: OpenAI News
    category: product_news
  - title: Rider Hands AI Agents The Keys To Its Refactoring Engine For Safer,
      Faster, And Cheaper Results
    url: https://blog.jetbrains.com/dotnet/2026/08/19/rider-refactoring-code-skill/
    source: JetBrains Blog
    category: product_news
  - title: "Cursor cloud agents: event triggers, /goal, and subagents on isolated VMs"
    url: https://rss.xcancel.com/cursor_ai/status/2090136956101414982#m
    source: Cursor / @cursor_ai
    category: product_news
  - title: The Open-Sourcing of DeepSeek Harness Opens the Door to Modular,
      Unbundled AI Agent Infrastructure
    url: https://www.infoq.com/news/2026/08/deep-seek-harness/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global
    source: InfoQ
    category: tech_articles
  - title: "[AINews] Death of Params: Z.ai CEO Jie Tang on GLM 5.3 and the new
      Post-training Scaling Law"
    url: https://www.latent.space/p/ainews-death-of-params-zai-ceo-jie
    source: AINews
    category: newsletters
  - title: Offering Zero Data Retention for frontier models
    url: https://openai.com/index/our-commitment-to-zero-data-retention
    source: OpenAI News
    category: product_news
  - title: Dynatrace Acquires Arize as AI Agents Deepen the Observability Challenge
    url: https://devops.com/dynatrace-acquires-arize-as-ai-agents-deepen-the-observability-challenge/?utm_source=tldrit
    source: DevOps.com
    category: ai_dev
  - title: "New in Air: Claude Subscriptions, Multiproject View, and Improved
      Markdown"
    url: https://blog.jetbrains.com/air/2026/08/new-in-air-claude-subscriptions-multiproject-view-and-improved-markdown/
    source: JetBrains Blog
    category: product_news
highlights:
  - Asana replaced an outdated testing system in two weeks for roughly $12,000
    with Codex, work its engineers had scoped at five years.
  - "JetBrains traced gpt-5.5 through 15 C# refactoring tasks: 2,513 tool calls,
    163 dotnet builds, zero structural refactorings, because the agent had none
    to call."
  - Rider 2026.2.1's bundled refactoring-code skill cut median task time from
    157.9s to 26.6s and cost per solved task from $0.52 to $0.19.
  - Cursor cloud agents now trigger on PRs, Slack threads, and schedules, hold a
    long-lived /goal, and run subagents on isolated per-project VMs.
  - DeepSeek open-sourced dsh, a micro-kernel agent runtime with modular plugins
    and an append-only execution event log.
  - Dynatrace acquired Arize, pulling LLM evaluation and tracing into a
    general-purpose APM stack.
---

Asana spent roughly $12,000 and two weeks of wall clock to finish a test-system replacement its own engineers had scoped at five years. OpenAI [published the account](https://openai.com/index/asana) two days ago, and it climbed the Hacker News front page this morning, which is the kind of second-wave attention that separates a customer story from a case study nobody reads. The work was a migration: rip out an outdated testing system, land the replacement across the codebase. That shape matters, because migrations are exactly the class of work where the cost has always been headcount-months of mechanical edits rather than a hard design problem, and where a fleet of Codex sessions running in parallel changes the arithmetic instead of the difficulty.

The sharpest counterpoint of the day comes from JetBrains, which went and measured where those agent-hours actually go. Rider's .NET team [traced gpt-5.5 through the Codex CLI](https://blog.jetbrains.com/dotnet/2026/08/19/rider-refactoring-code-skill/) on fifteen C# refactoring tasks and counted every tool call. Across 2,513 calls the agent piped text into interactive commands 468 times, shelled out to `git` 422 times and `sed` 392 times, ran `dotnet build` 163 times, and performed a structural refactoring operation exactly zero times, because it had none to call. The builds were not verification. The agent was compiling to discover what its own last edit had broken, using the compiler as a very slow oracle for a guess a resolved syntax tree would have answered for free. Rider 2026.2.1 ships a bundled skill, `refactoring-code`, that hands the agent eight real operations: rename, extract method, extract interface, extract base class, change signature, move type, reorganize namespaces, safe delete. Same model, same prompts, roughly ten runs per task. `dotnet build` calls fell from 163 to 3, total tool calls from 2,513 to 926, median task time from 157.9 seconds to 26.6, and cost per solved task from $0.52 to $0.19. The starkest single case, extracting a base class, went from 337 seconds and 24 calls to 20 seconds and three. `sed` is still the agent's most-used tool, which is the useful part of the result: ordinary edits stay in text, and only the changes whose consequences ripple past what the agent can see get routed to the engine.

Cursor spent its [08-19 release](https://rss.xcancel.com/cursor_ai/status/2090136956101414982#m) on the other half of that problem, which is what an agent does when nobody is watching it. Cloud agents now pick up work from events rather than prompts: they subscribe to the PRs they open and drive them to completion, watch a Slack thread, or run on a schedule. A new `/goal` gives an agent a long-lived objective it holds until the objective is met instead of until the context runs out. Subagents get their own virtual machines with isolated copies of the project, so a parent can have one verify its changes in a clean environment or swarm several independent fixes without them stepping on each other. Any skill can be pinned as a Custom Mode, an always-on skill for the session. The smallest change is the one long-session users will feel first: steering now waits for the next tool call instead of cutting the agent off mid-action.

Underneath all of this, the harness itself is coming unbundled from the model. DeepSeek shipped a developer preview of [DeepSeek Harness](https://www.infoq.com/news/2026/08/deep-seek-harness/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global) (`dsh`), an open-source execution runtime with a micro-kernel core, modular plugins per functional unit, and an append-only event log of everything the agent did. The event log is the part worth arguing about. Replayable, appendable execution history is what makes an agent run debuggable after the fact, and it is the piece most closed harnesses treat as telemetry rather than a first-class artifact. InfoQ's read is that adoption hinges on whether the plugin API stays stable, which is the correct thing to be skeptical about in a developer preview.

On the model side, AINews leads with Z.ai CEO Jie Tang on GLM 5.3 and what the issue calls [the death of params](https://www.latent.space/p/ainews-death-of-params-zai-ceo-jie): the argument that the scaling law worth tracking now lives in post-training rather than parameter count. GLM 5.3 has been accumulating third-party evidence for about a week, and a lab CEO putting a scaling story behind it is the sort of framing that tends to set how the next quarter of open-weight releases get pitched.

Two governance items you should not skip. OpenAI [reaffirmed Zero Data Retention](https://openai.com/index/our-commitment-to-zero-data-retention) for eligible API customers on frontier models and previewed Private Safety Processing, a scheme meant to run safety checks across related interactions without OpenAI staff seeing the underlying content. That tension is real and structural: longer-horizon autonomous work makes cross-interaction risk detection more useful at exactly the moment enterprises are least willing to hand over the interactions. And Dynatrace [acquired Arize](https://devops.com/dynatrace-acquires-arize-as-ai-agents-deepen-the-observability-challenge/?utm_source=tldrit), folding LLM evaluation and tracing into a general-purpose APM stack. Agent observability had been a separate product category for about two years; this is the first serious signal that it will be a feature of the monitoring you already pay for.

Smaller, but it changes a bill: JetBrains Air now [runs on an existing Claude Pro, Max, or Team subscription](https://blog.jetbrains.com/air/2026/08/new-in-air-claude-subscriptions-multiproject-view-and-improved-markdown/), with usage counted against the subscription quota instead of API credits, alongside a multiproject view. Subscription-quota billing inside a third-party IDE has been the friction point for anyone who wanted to try a non-Anthropic surface without a second metered account.

What to watch: whether anyone reproduces the Asana arithmetic on a codebase they did not get help migrating, and whether the Rider result generalizes past C#. The refactoring skill wins because ReSharper already has a resolved syntax tree to hand over. Every language with a real language server has the same asset sitting unused behind an LSP that agents currently talk to, if at all, as a linter.
