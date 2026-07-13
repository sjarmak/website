---
title: Frontier agents ace one task and stall across a stream of them
cadence: daily
track: general
origin: auto
date: 2026-07-13
summary: Two benchmarks posted the same day found frontier agents drop from over
  80% on isolated coding tasks to at most 38% (SWE-Milestone) and about 15%
  pass@1 (Long-Horizon-Terminal-Bench) once the work runs long, even as one team
  reported migrating a production agent to GPT-5.6 for 2.2x faster runs at 27%
  lower cost. Nathan Lambert warned a rumored White House executive order could
  make open-weight models a permanent second class, while the vibe-coding
  community spent the day auditing the performance and security debt of its own
  output.
topics:
  - agent-evals
  - coding-agents
  - open-models
  - ai-policy
  - vibe-coding
  - agent-tooling
unresolvedFacets:
  - agent-evals
  - vibe-coding
audioUrl: /media/digests/daily-general-2026-07-13.mp3
durationSec: 619
items:
  - title: "SWE-Milestone: Evaluating AI Agents on Continuous Software Evolution"
    url: https://arxiv.org/abs/2603.13428
    source: arXiv (cs.SE)
    category: research
  - title: "Long-Horizon-Terminal-Bench: Testing the Limits of Agents on
      Long-Horizon Terminal Tasks"
    url: https://arxiv.org/abs/2607.08964
    source: arXiv (cs.AI)
    category: research
  - title: 6 months to live for open models
    url: https://www.interconnects.ai/p/6-months-to-live-for-open-models
    source: Interconnects (Nathan Lambert)
    category: newsletters
  - title: "Migrating a production AI agent to GPT-5.6: 2.2x faster, 27% cheaper"
    url: https://ploy.ai/blog/migrating-a-production-ai-agent-to-gpt-5-6
    source: Ploy (via Hacker News)
    category: ai_dev
  - title: Why your vibe-coded app scores 34 on PageSpeed and what actually fixes it
    url: https://www.reddit.com/r/vibecoding/comments/1uuslmt/why_your_vibecoded_app_scores_34_on_pagespeed_and/
    source: r/vibecoding
    category: community
  - title: "Capn-hook for coding agents: don't grep the same mystery twice"
    url: https://github.com/cyrusNuevoDia/capn-hook
    source: Show HN / GitHub
    category: community
  - title: Your Agents Are Stuck In Your Org Chart
    url: https://joereis.substack.com/p/your-agents-are-stuck-in-your-org
    source: Joe Reis
    category: newsletters
highlights:
  - "SWE-Milestone: 12 frontier models across 4 frameworks fall from >80% on
    isolated tasks to at most 38% across a continuous stream of milestones."
  - "Long-Horizon-Terminal-Bench: the strongest of 15 models clears 15.2% pass@1
    on 46 tasks that average 9.9M tokens and ~85 minutes each; the mean is
    4.3%."
  - Ploy reports a production agent migrated to GPT-5.6 runs 2.2x faster at 27%
    lower cost.
  - "Nathan Lambert: a rumored White House executive order could target
    open-weight models, likely Chinese-origin weights and government use."
---

Twelve frontier models, four agent frameworks, and the same collapse: scores above 80% on isolated coding tasks fall to at most 38% once the tasks arrive as a continuous stream. That result comes from [SWE-Milestone](https://arxiv.org/abs/2603.13428), posted today, which rebuilds "milestone DAGs" out of real commit logs so an agent has to carry a codebase through a sequence of functionally cohesive goals instead of solving one ticket in a vacuum. The failure mode is error accumulation: each milestone inherits the debt and mistakes of the last, and the models that look strong on a single SWE-bench-style task struggle to keep a system coherent over time.

A second benchmark out the same day, [Long-Horizon-Terminal-Bench](https://arxiv.org/abs/2607.08964), lands in the same place from a different direction. Its 46 tasks each run hundreds of episodes, close to 9.9M tokens and roughly 85 minutes on average, and grade partial progress rather than only the final state. The strongest of 15 models tested clears 15.2% of tasks at a 0.95 reward threshold; the mean across all of them is 4.3%. Both papers measure the thing production teams actually feel, that a coding agent which nails a well-scoped change drifts badly once it has to plan, hold context, and debug across a long session. If you run agents as long-lived systems, read the two together.

The counterpoint is what the numbers look like when the work is scoped tightly. [Ploy migrated a production agent to GPT-5.6](https://ploy.ai/blog/migrating-a-production-ai-agent-to-gpt-5-6) and reported 2.2x faster runs at 27% lower cost, the first concrete production migration data on OpenAI's new frontier family since last week's launch. The distance between that and the benchmark scores is the whole game right now: constrained, well-instrumented agent workloads keep getting cheaper and faster, while open-ended autonomy stays hard.

Nathan Lambert spent the day [pointing at open-weight models](https://www.interconnects.ai/p/6-months-to-live-for-open-models) and the policy risk over them. He cites unofficial reports of White House discussions on a possible executive order governing open models, likely aimed at Chinese-origin weights and government use, and argues it would be the first regulation with real enforcement teeth applied specifically to open release. There is no official text yet, so treat the specifics as early. The stakes he lays out are not: an ecosystem that spent three years assuming open weights stay freely available is now planning around the chance that they don't.

Underneath the frontier, the vibe-coding crowd spent the last day auditing its own output. The r/vibecoding thread ["Why your vibe-coded app scores 34 on PageSpeed and what actually fixes it"](https://www.reddit.com/r/vibecoding/comments/1uuslmt/why_your_vibecoded_app_scores_34_on_pagespeed_and/) walks through the performance debt that ships by default when a model generates a whole frontend, and it landed the same day as ["Vibecoded apps are a security nightmare"](https://www.reddit.com/r/vibecoding/comments/1uuhcwi/vibecoded_apps_are_a_security_nightmare/) and a guide to un-vibe-coding an existing site. The tools that get people to a working app in an afternoon are the reason those apps are slow and leaky, and the community is starting to treat that as an engineering problem rather than a vibe.

Two Show HN launches went up in the last day aimed at exactly the weak spots those benchmarks expose. [Capn-hook](https://github.com/cyrusNuevoDia/capn-hook) gives a coding agent persistent memory so it stops re-deriving the same facts about a codebase on every run, tagline "don't grep the same mystery twice." [Peek-cli](https://github.com/puffinsoft/peek-cli) lets an agent see the browser it's driving, closing the loop between a change and its rendered result. Both are small and early, and both target the two things the long-horizon benchmarks say agents lose: memory and feedback across an extended session.

Joe Reis argues the constraint isn't only the model. In ["Your Agents Are Stuck In Your Org Chart"](https://joereis.substack.com/p/your-agents-are-stuck-in-your-org) he makes the case that agent deployments inherit the silos and handoffs of the teams that build them, so an agent scoped to one team's slice of a workflow hits the same walls a human in that seat would. It's a useful lens on the week's benchmark numbers: some of the long-horizon failure is the model, and some of it is that we keep handing agents the fragmented context our org charts produce, then acting surprised when they can't maintain a coherent picture.

What to watch: whether any lab publishes long-horizon numbers on its own models now that two public benchmarks exist to score against, and whether the open-models executive order moves from newsletter speculation to a draft anyone can read.
