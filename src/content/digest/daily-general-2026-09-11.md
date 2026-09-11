---
title: Cognition's SWE-2 matches Fable 5.1 on FrontierCode from an open Kimi-K3 base
cadence: daily
track: general
origin: auto
date: 2026-09-11
summary: Cognition's SWE-2, post-trained on the open-weight Kimi-K3, scores
  50.0% on FrontierCode, matching Fable 5.1 at 64% lower cost, and ships free in
  Devin for a month. OpenAI opened a managed Agents API on the Codex harness
  plus full-duplex GPT-Live-1, Cursor turned its chat into a persistent
  coordinator agent, and Anthropic published its most detailed misuse report
  yet. New Uber, Pinterest and AT&T figures show why cost-sensitive workloads
  keep moving to open weights.
topics:
  - model-releases
  - agent-tooling
  - open-models
  - ai-economics
  - ai-safety
  - ai-security
  - code-review
audioUrl: /media/digests/daily-general-2026-09-11.mp3
durationSec: 768
items:
  - title: SWE-2
    url: https://cognition.com/blog/swe-2
    source: Cognition
    category: product_news
  - title: "The Pulse: tech companies move to open AI models"
    url: https://newsletter.pragmaticengineer.com/p/the-pulse-tech-companies-move-to-888
    source: The Pragmatic Engineer
    category: newsletters
  - title: Introducing the Agents API
    url: https://openai.com/index/introducing-the-agents-api
    source: OpenAI
    category: product_news
  - title: Introducing Projects
    url: https://cursor.com/blog/projects
    source: Cursor
    category: product_news
  - title: "Beyond Lexical Metrics: Sentence-Embedding Detection of Reviewer
      Habituation in AI Code Review"
    url: https://ui.adsabs.harvard.edu/abs/2026arXiv260906213Y
    source: arXiv
    category: research
  - title: A software factory needs a review gate it can trust
    url: https://coderabbit.ai/blog/software-factory-review-gate
    source: CodeRabbit
    category: product_news
  - title: Threat intelligence report, September 2026
    url: https://www.anthropic.com/threat-intelligence-report-september-2026
    source: Anthropic
    category: product_news
  - title: Anthropic's economic model of AI's effect on jobs and wages by 2030
    url: https://rss.xcancel.com/AnthropicAI/status/2097679796687769689#m
    source: Anthropic
    category: product_news
  - title: Mathematicians want proof OpenAI didn't use their work
    url: https://www.theverge.com/ai-artificial-intelligence/993263/where-does-openai-get-mathematics-training-data
    source: The Verge
    category: tech_articles
highlights:
  - SWE-2 scores 50.0% on FrontierCode, matching Fable 5.1 at 64% lower cost,
    post-trained on Kimi-K3
  - OpenAI's Agents API runs the Codex harness as a managed service for
    long-running cloud agents
  - "Cursor Projects: one persistent coordinator agent with shared memory,
    scheduled tasks and CI follow-up"
  - Pinterest runs open models at under 8% of closed-model cost; AT&T cut 56%
    for a 2% quality drop
  - Reviewer approval of agent PRs rose from 30.5% to 36.6% with exposure while
    comment metrics stayed flat
---

Cognition's SWE-2 scored 50.0% on FrontierCode, matching Fable 5.1 at 64% lower cost, and the model underneath it is Kimi-K3, the 2.8-trillion-parameter open-weight release from July. Cognition [announced SWE-2](https://cognition.com/blog/swe-2) yesterday as its closest model yet to the frontier, and the launch thread claims wins over SWE-1.7, Grok 4.6 and GPT-5.6 Sol on the same benchmark. The figure that matters more to anyone paying for agent runs is the efficiency one: on FrontierCode 1.1 Main, SWE-2 at medium effort beats SWE-1.7 while taking 58% fewer turns and costing 81% less on average, which Cognition attributes to the model learning to explore more narrowly before it edits. It is also the first Cognition model with effort levels, built on a reworked length-penalty recipe that in a single RL run made medium effort cheaper and smarter while teaching max effort to spend more tokens and turns chasing top scores.

SWE-2 is live in Devin's desktop app and CLI, free for Pro, Max and Teams subscribers for the next month. The HN thread reached 103 points, a separate Tokenstead listing putting it at 92.8 on Terminal-Bench 2.1 also made the front page, and by evening Cognition had shipped Devin Voice on top of it and brought in the Dioxus team to work on Devin's VM, computer use and testing. Before switching anything over, look at what the launch comparison leaves out: it names GPT-5.6 Sol but not GPT-6 Astra, which has been generally available since September 4.

An open base under a near-frontier coding model fits the cost story that enterprises are now telling with real figures. Gergely Orosz's [Pulse issue on companies moving to open models](https://newsletter.pragmaticengineer.com/p/the-pulse-tech-companies-move-to-888), a free re-run of last week's paid edition, puts numbers on it. Uber spent its annual AI budget in the first three months of the year, then cut cost per request by 34% and cost per session by 52%, holding spend flat since March while usage kept growing. Its levers read like a runbook for anyone operating agents at scale: open-weight models on inference providers, weekly benchmarks rebuilt from real work, cheaper models for subagents, medium effort as the default, and forced compaction above 400K tokens even on 1M-context models. Uber's own data puts the most expensive open model at $0.30 per code review, against $0.50 for the cheapest frontier model and $2.50 for the priciest. Pinterest's CEO told investors its post-trained open models cost under 8% of comparable closed models per transaction, and AT&T cut some coding costs by 56% behind a LiteLLM router while measuring a 2% quality drop. Orosz singles out Anthropic, whose prices are rising while open models and OpenAI get cheaper, citing a per-run chart that puts Opus 5 at roughly 100x the cost of GPT-5.6 Luna xhigh and DeepSeek.

OpenAI spent Thursday arguing that you shouldn't have to run your own agent loop at all. The new [Agents API](https://openai.com/index/introducing-the-agents-api) is a managed service built on the Codex harness, handling orchestration, long-running sessions and tool use for cloud agents launched through the API, and its docs page reached the HN front page within hours. GPT-Live-1 arrived in the API the same day with full-duplex voice, custom voices and telephony support, pitched as voice agents that listen while they speak and plug into whatever model and harness you already use; Twilio posted outbound-calling tutorials for it, and Devin Voice runs on it. ChatGPT Work also gained a Data agent that builds dashboards from connected company data, along with a financial-services edition that bundles Daloopa, PitchBook and LSEG News datasets and traces each figure back to the paragraph or table it came from. For platform teams the trade is plain: less harness code to maintain, and more agent state held by a vendor whose per-token prices are what the Uber figures above were measured against.

Cursor pushed its editor toward the same always-on shape. [Projects](https://cursor.com/blog/projects), in beta and rolling out since Thursday, replaces the chat-per-task habit with a coordinator agent in one persistent thread that spawns subagents, sets reminders, runs scheduled tasks, follows PRs to fix CI failures, and watches Slack for bug reports. Agents inside a project share memory and artifacts such as plans and demos, synced between your machine and the agents' computers, and Cursor models the design explicitly on Grok Bot. Augment shipped Cosmos a day earlier, a cloud agent that "notifies you the moment it needs you," and Amp now lets users pick the model and reasoning effort behind each built-in mode and put their own agents on its mode dial. Once the agent never closes its session, human review moves from the end of a task to a queue that fills overnight.

That queue is what a new [study of reviewer habituation](https://ui.adsabs.harvard.edu/abs/2026arXiv260906213Y) measures. The authors followed 400 repeat reviewers through 11,429 reviews of agent-authored pull requests in the AIDev corpus, covering Copilot Autofix, Devin, Codex CLI, Cursor and Claude Code on public repositories between January and July 2025. Approval rates climbed from 30.5% in each reviewer's early period to 36.6% in the late one, and from 27.9% to 42.8% across experience deciles, while approval of human-authored PRs in the same months and repositories showed no trend. The comments gave nothing away: lexical diversity, entropy, technical specificity and actionability all stayed flat, and the drift that sentence embeddings did detect trailed the approval shift instead of warning ahead of it. The authors can't rule out that agent code simply got better, and they have no defect data, but the operational reading holds either way: a dashboard of comment-quality metrics will not catch rubber-stamping, and per-reviewer approval rate on agent PRs is the number to track. CodeRabbit argued the adjacent point the same day, that a [software factory needs a review gate it can trust](https://coderabbit.ai/blog/software-factory-review-gate) because passing checks only vouch for the behavior they cover.

Anthropic published its [most detailed threat intelligence report](https://www.anthropic.com/threat-intelligence-report-september-2026) to date on Thursday, covering attempts to misuse Claude for cyberattacks, influence operations, surveillance, biology and weapons development. The company says it stopped every operation in the report, shared findings with authorities and other AI companies where appropriate, and picked its most sophisticated cases on purpose so other platforms can recognize the same activity; the New York Times led its coverage with the possible biological-weapons efforts Anthropic says it blocked. The report follows by one day Anthropic's assessment of four incidents in which Claude models reached real systems from misconfigured evaluations.

Anthropic's economics team also released a [scenario model](https://rss.xcancel.com/AnthropicAI/status/2097679796687769689#m) of how AI could move US growth, jobs and wages by 2030. It breaks each job into a bundle of tasks that AI can speed up, take over, leave alone or add to, lets you set your own expectations across three scenarios, and compares your answers with those of more than 10,000 surveyed Americans. Use it for arguing about assumptions rather than as a forecast to plan headcount against.

Cognition's free month ends in mid-October, which leaves time for independent harness benchmarks to test whether FrontierCode parity with Fable 5.1 survives on tasks Cognition didn't choose, and to see whether other agent companies follow it onto Kimi-K3. The Navier-Stokes provenance dispute also widened: a Bluesky post that HN headlined "Another researcher says OpenAI trained on conversations, then claimed breakthrough" drew 147 points, and [The Verge](https://www.theverge.com/ai-artificial-intelligence/993263/where-does-openai-get-mathematics-training-data) reports that mathematicians now want proof their work wasn't used. On Monday DeepSeek starts routing V4-Pro API traffic to V4.1-Flash, so any team pinned to V4-Pro gets a new model whether it tested one or not.

*Sourcing note: the code-intel mirror's hourly sync last completed on September 1, but local ingest is current through 07:47 UTC on September 11, so this issue covers the full window.*
