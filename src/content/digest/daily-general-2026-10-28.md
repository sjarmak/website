---
title: Anthropic outgrew Git at 30,000 merges a day, and code review is next
cadence: daily
track: general
origin: auto
date: 2026-10-28
summary: Anthropic moved its monorepo off Git onto Scion, a server-side,
  content-addressed source control system, after merges climbed from 2,500 to
  30,000 a day. The same agent-driven volume shows up in Jellyfish's pull
  request data and rising on-call pages, while PROBE and SecPRBench find that
  agents still miss most of the bugs and vulnerabilities humans would catch.
topics:
  - agent-tooling
  - code-review
  - ai-security
  - evaluation
  - model-releases
  - developer-productivity
audioUrl: /media/digests/daily-general-2026-10-28.mp3
durationSec: 758
items:
  - title: Anthropic moves its monorepo off Git to Scion, a custom source control
      system
    url: https://www.infoq.com/news/2026/10/anthropic-source-control/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global
    source: InfoQ
    category: tech_articles
  - title: "Report: Claude Code exceeds GitHub Copilot for merging pull requests"
    url: https://devops.com/report-claude-code-exceeds-github-copilot-for-merging-pull-requests
    source: DevOps.com
    category: tech_articles
  - title: "AI SRE: what is it, how could it change on-call, and does it work?"
    url: https://newsletter.pragmaticengineer.com/p/ai-sre
    source: Pragmatic Engineer
    category: newsletters
  - title: "PROBE: frontier agents find under 21% of maintainer-fixed bugs"
    url: https://arxiv.org/abs/2610.35987
    source: cs.SE updates on arXiv.org
    category: research
  - title: "SecPRBench: can agentic code review catch vulnerabilities before they
      are merged?"
    url: https://arxiv.org/abs/2610.33509
    source: cs.SE updates on arXiv.org
    category: research
  - title: AWS uses AI agents to triage Linux kernel CVEs for EC2
    url: https://www.infoq.com/news/2026/10/aws-ai-agents-linux-kernel-cves/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global
    source: InfoQ
    category: tech_articles
  - title: GitHub Copilot supports server-to-server authentication
    url: https://github.blog/changelog/2026-10-27-github-copilot-supports-server-to-server-authentication
    source: Changelogs – The GitHub Blog
    category: product_news
  - title: "Genie 4: a new generation of world simulation"
    url: https://deepmind.google/blog/genie-4-a-new-generation-of-world-simulation/
    source: Google DeepMind Blog
    category: product_news
highlights:
  - "Anthropic replaced Git with Scion: Spanner changesets, Cloud Storage blobs,
    Rust client and server, built by seven engineers"
  - "Jellyfish: Claude Code is the AI tool most often used to merge PRs (31%),
    ahead of Copilot (23%), across 100 million September pull requests"
  - AI SRE tools triage and silence pages; autonomous remediation still is not
    happening
  - "PROBE: frontier agents stay under 21% recall and 9% precision on 2,457 real
    maintainer-fixed bugs"
  - "SecPRBench: security review recall ranges 32.5% to 78.1%, and 68% of misses
    name the right file with the wrong mechanism"
  - AWS triages EC2 kernel CVEs with a filter, an AI agent and human review;
    GitHub previews workload identity for Copilot SDK agents
---

In May, Anthropic merged about 2,500 code changes a day. By September it was merging more than 30,000, and Git was the first piece of infrastructure to give out. InfoQ's [write-up of the migration](https://www.infoq.com/news/2026/10/anthropic-source-control/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global) describes the replacement: Scion, a source control system that moves repository operations to the server, keeps content-addressed data behind tiered caches built for agent and CI traffic, and gives up Git's offline independence so clients hold far less local data. Gergely Orosz's [interview with the team](https://newsletter.pragmaticengineer.com/p/the-pulse-anthropic-builds-its-own) a few days earlier supplies the numbers behind the decision. The monorepo's working copy is 25GB, CI alone ran 25 million checkouts a day, and roughly 3,000 staff each run 10 to 15 Claude agents in parallel. Anthropic had scaled Git the usual way, with hundreds of mirrors behind a primary, and that stopped working once the repository outgrew the mirrors' disks.

The design is simple on purpose. Server nodes hold the full repository, changesets live in Spanner, blobs sit in Cloud Storage, and both client and server are written in Rust. Because stored data never changes, the caches absorb most of the load; the team told Orosz that no component has needed to autoscale yet, even with merge volume up more than tenfold this year. Seven engineers built it, along with a code review system called Antique (Go backend, React frontend), since leaving Git also meant leaving GitHub's review flow. The monorepo is now entirely off Git and Scion stays closed source. Google and Meta left Git years ago at headcounts in the tens of thousands; Anthropic hit the same wall with a few thousand people because, by Orosz's estimate, its agent-driven output resembles that of a 35,000 to 70,000 person engineering org.

Across the wider industry, the share of merged work coming from agents is getting easier to measure. Jellyfish [analyzed 100 million pull requests](https://devops.com/report-claude-code-exceeds-github-copilot-for-merging-pull-requests) opened in September by 276,000 developers and found Claude Code was the AI tool most often used to merge pull requests, at 31 percent, with GitHub Copilot second at 23 percent. It is one vendor's dataset, but at that size the ordering is hard to dismiss.

More merges mean more deploys, and the Pragmatic Engineer's [deep dive on AI SRE](https://newsletter.pragmaticengineer.com/p/ai-sre), by Orosz and Jessica Salmon, starts from that arithmetic: incident rate equals change rate times the probability that a change breaks something. Almost every company they spoke with has seen PR frequency double in a year, and Rootly's data shows pages rising, with out-of-hours pages nearly doubled. What vendors (Rootly, incident.io and ResolveAI) and in-house teams (OpenAI's Sevbot, an effort at ING) actually ship is much narrower than the 2025 Build demo in which an Azure agent found a root cause and pushed the fix unattended. They fan out investigation agents steered from Slack, give them a context layer of knowledge graph and memory, verify hypotheses with adversarial agents and a mix of models, and run evals and backtests because accuracy turns out to be specific to each team. Autonomous remediation still isn't happening, while triaging and silencing low-value pages is becoming routine. The warning for on-call engineers is that fewer pages will reach them and the ones that do will be the hard ones, with less practice behind them. Orosz discloses an investment in incident.io. The same day, a Hacker News post titled "[AI promised less work. I've never worked more](https://oioannou.com/blog/ai-promised-less-work/)" drew 222 points and 201 comments.

If agents write most of the code, the next question is whether they can find the bugs in it, and two new arXiv papers give unflattering answers. [PROBE](https://arxiv.org/abs/2610.35987), from a team that includes Martin Vechev, collects all 2,457 bugs that maintainers fixed over 18 months in 20 GitHub repositories and asks frontier coding agents to find them. Every agent stayed below 21 percent recall and 9 percent precision against that set, and moving to stronger models raised recall from 8 to 17 percent without improving precision at all. LLM and human evaluators still judged 85 percent of the agents' findings to be valid, so the agents are reporting real bugs, just not the ones maintainers chose to fix. Their distributions of findings also look alike from one agent to the next and unlike what humans fix, a shared blind spot that pairing two vendors' models on review won't cover.

[SecPRBench](https://arxiv.org/abs/2610.33509), from Lingming Zhang and co-authors, narrows the question to security review and uses the real bug-introducing commits instead of reconstructing them from later fixes: 265 tasks from nine systems including Firefox, V8 and OpenSSL. Recall across eight frontier models ran from 32.5 to 78.1 percent, with Grok 4.6 and GPT-6 sol on top. In 68 percent of misses the agent was already reporting on the file that held the flaw and argued for a different mechanism. The labs' security harnesses pull in opposite directions; OpenAI's Codex Security lowered recall by 8.3 points, mostly by abstaining, while Anthropic's Defending Code harness raised it by 7.7 points at a higher cost.

AWS showed what this looks like in production. The team that maintains the Linux kernel for EC2 [described its CVE process](https://www.infoq.com/news/2026/10/aws-ai-agents-linux-kernel-cves/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global) as an automated filter, then an AI agent, then human review, and used the same write-up to argue it must move to newer LTS kernels because older branches keep collecting fixes that are never backported. The agent reads at volume and a person signs off, the same split the AI SRE vendors landed on.

GitHub put [server-to-server authentication for Copilot](https://github.blog/changelog/2026-10-27-github-copilot-supports-server-to-server-authentication) into public preview, so services and agents built on the Copilot SDK can act for an organization through an installed GitHub App instead of borrowing a signed-in user's credentials. Background agents running under a workload-owned identity leave a cleaner audit trail than a personal token copied into a CI secret. Google DeepMind also released [Genie 4](https://deepmind.google/blog/genie-4-a-new-generation-of-world-simulation/), its next world model, pitched as real-time simulation with higher realism; the feed carried only the announcement line, so specifics wait for a closer read.

Scion is closed, and most companies whose merge rate jumps tenfold will not have seven engineers to spare for rebuilding source control, so the open infrastructure question is whether GitHub, GitLab or a newcomer ships a server-side, cache-first answer for agent-scale repositories. On the review side, PROBE gives a clean number to track: precision stayed flat as models got stronger. If the next generation moves it, review starts to scale with generation; if it doesn't, the bottleneck Anthropic just cleared in source control reappears in code review, and nobody has built the equivalent of Scion for that yet.

*Feed note: the item mirror reports mirror mode with a last-sync timestamp of September 1 (82,005 minutes stale), yet it held items ingested on the morning of October 28 (UTC), so the staleness field is misreporting rather than the data being old. Scion's architecture and figures come from Anthropic's engineering post as quoted in the Pragmatic Engineer's October 22 interview; InfoQ's October 27 write-up is the in-window source. Genie 4 appeared in the feed with a one-line summary only.*
