---
title: Auggie's Rebuild Halved Cost Per Task, and Pi Is Underneath It
cadence: daily
track: general
origin: auto
date: 2026-08-17
summary: Augment Code rebuilt the Auggie CLI harness on Pi and reported $1.27
  per task against Claude Code's $2.70 at the same SWE-bench Pro pass rate,
  crediting a four-tool surface; Fred Schott's Flue 2 shipped on the same Pi
  base with React-style agent hooks. A Reddit paged-memory harness claims 81%
  cheaper sessions with correctness going up, GitHub Copilot added per-turn
  model switching with no record of which model wrote which line, and an arXiv
  team corrected its own AI-development cost ratio from 19.4x to 9.9x after two
  invisible pricing errors.
topics:
  - agent-harnesses
  - cost-per-task
  - context-management
  - model-releases
  - agent-tooling
  - evaluation-methodology
unresolvedFacets:
  - agent-harnesses
  - cost-per-task
  - evaluation-methodology
audioUrl: /media/digests/daily-general-2026-08-17.mp3
durationSec: 757
items:
  - title: We rebuilt the Auggie CLI harness from the ground up and cut cost per
      task by 53% at the same quality
    url: https://rss.xcancel.com/augmentcode/status/2088375653225955710#m
    source: Augment Code / @augmentcode
    category: product_news
  - title: "React for Agents: Astro Creator Brings Hooks to his Meta-Harness, Flue"
    url: https://www.latent.space/p/flue-2
    source: Latent.Space
    category: newsletters
  - title: Built a paged-memory harness for Claude Code — 81% cheaper on long
      sessions, MIT, open source
    url: https://www.reddit.com/r/ClaudeCode/comments/1vqg5l0/built_a_pagedmemory_harness_for_claude_code_81/
    source: r/ClaudeCode
    category: community
  - title: GitHub Copilot's Latest Update Bets on Model Choice, Not Model Loyalty
    url: https://devops.com/github-copilots-latest-update-bets-on-model-choice-not-model-loyalty/
    source: DevOps.com
    category: tech_articles
  - title: "The Sequence Radar Issue 915: The Cursor Acquisition, New Grok and GLM
      Models, Anthropic's Latest Deal, and River AI"
    url: https://thesequence.substack.com/p/the-sequence-radar-issue-915-last
    source: TheSequence
    category: newsletters
  - title: GLM-5.3 delivers Opus 4.8-level cybersecurity results at a fraction of
      the cost
    url: https://semgrep.dev/blog/2026/glm-53-delivers-opus-48-level-cybersecurity-results-at-a-fraction-of-the-cost
    source: Semgrep Blog
    category: product_news
  - title: Ontology-Grounded Project Memory for Coding Agents
    url: https://arxiv.org/abs/2608.13662
    source: arXiv cs.SE
    category: research
  - title: "Building AI-Intensive Software with AI: Early Results and a Cautionary
      Tale on Measuring Development Cost"
    url: https://arxiv.org/abs/2608.13730
    source: arXiv cs.SE
    category: research
highlights:
  - Augment Code's rebuilt Auggie CLI reports $1.27/task against Claude Code's
    $2.70 at the same SWE-bench Pro pass rate, from cutting the toolset to one
    bash plus three file tools.
  - Both Auggie's rebuild and Fred Schott's Flue 2 sit on Pi, Mario Zechner's
    minimal open-source harness, two days apart.
  - A paged-memory Claude Code harness reports 81% aggregate cost reduction with
    100% task correctness against 92% for stock, and 17/17 on a 30-plus-turn
    recall probe.
  - "Per-turn model switching in VS Code 1.133 leaves no record of which model
    wrote which line: model choice as a runtime dependency with no field in the
    build record."
  - MOOSEDev's ontology-grounded memory returned 0.98-1.00 of the expected
    answer set on supersession, set-completeness, and negation questions where
    vector top-k surfaced 6-27%, at equivalent token cost.
  - An AI-development cost ratio reported at 19.4x corrected to 9.9x after
    flat-rate subscription per-token inference and wrong regional labor rates
    were caught.
---

$1.27 per task against $2.70. That is Augment Code's [rebuilt Auggie CLI harness](https://rss.xcancel.com/augmentcode/status/2088375653225955710#m) versus Claude Code on SWE-bench Pro at the same pass rate, and the lever they credit is not a stronger model or a cleverer planner. They cut the toolset down to one bash tool plus three file tools, on the argument that a wide specialized toolset charges schema tokens on every call and orchestration overhead on every turn, so a narrow surface compounds in your favor across a long run. They did not write the loop themselves either. They forked Pi, Mario Zechner's minimal open-source coding harness, and wired their context engine in as an extension.

Pi turned up again a day later underneath something that looks nothing like a vendor CLI. Fred Schott, creator of Astro, shipped the first stable release of [Flue 2](https://www.latent.space/p/flue-2) and told Latent Space the React comparison is the whole design: a Flue agent is a JavaScript function that re-renders on every turn, meaning before every model call, with 16 built-in hooks including `useSkill()`, `useTool()`, and `useSubagent()`. Flue 1 shipped file-based routing ported straight from web frameworks, and the bigger customers killed that idea fast, because their whole company is one agent and they do not care about routes. What they wanted was composition, which is what sent Schott from Next.js metaphors back to React ones. His framing of the substrate is the part worth arguing with: "Our early bet was that the harness is actually not a feature, but it's fundamental to what you think an agent is. There is no agent without a harness." Flue relates to Pi roughly the way Astro relates to Vite, which makes Pi the second load-bearing appearance of the same 200-line-ish abstraction in two days.

The cheapest thing in the window came from a stranger on Reddit rather than a vendor. Someone published a [paged-memory harness for Claude Code](https://www.reddit.com/r/ClaudeCode/comments/1vqg5l0/built_a_pagedmemory_harness_for_claude_code_81/) that treats context as managed virtual memory: a small resident file holding rules and current task state stays in context permanently, and everything else lives in plain markdown on disk, paged in one line at a time when the live conversation touches it and faulted in full only when the agent actually needs the body. Head-to-head against stock Claude Code across 120 cells, same model and same pass/fail checks with only the memory strategy varying, they report 63% cheaper on short sessions, 72% on medium, 84% on long, 81% in aggregate, with 100% task correctness against 92% for stock and 17 out of 17 on a recall probe where a fact dictated early gets checked 30-plus turns later. It is v1 and MIT licensed, and the author says the findings doc is written to separate what is confirmed from what is not, which is a better disclosure posture than most vendor benchmark posts manage.

GitHub's answer to the same pressure is to stop trying to be the best model and start being the switchboard. The [Copilot changelog](https://devops.com/github-copilots-latest-update-bets-on-model-choice-not-model-loyalty/) added Kimi K3 across Pro through Enterprise alongside MAI-Code-1.1-Flash, neither replacing anything, and VS Code 1.133 now lets you swap models inside a Claude session on a per-turn basis without restarting or losing context. Copilot CLI took the heaviest set: a `/tasks` command for managing subagents from the terminal, queued prompts while an agent is mid-task, `--plan` combined with `--mode autopilot` in headless mode for scheduled jobs where nobody is watching, and `/rewind` to undo changes without leaning on git. Mitch Ashley of The Futurum Group names the cost buried in the convenience: per-turn switching removes the restart and the record of which model wrote which line, so model choice becomes "a runtime dependency with no field in the build record." Anyone building agent provenance should read that as a requirement, not a complaint.

The money side moved in the same direction, toward owning the whole column rather than one layer of it. [TheSequence's roundup](https://thesequence.substack.com/p/the-sequence-radar-issue-915-last) puts SpaceX's $60B all-stock acquisition of Anysphere as closed, about 389 million Class A shares issued, Cursor now a wholly owned subsidiary inside the SpaceXAI division that also ships Grok 4.6 into Cursor, Grok Build, and GitHub Copilot. Anthropic is reportedly in talks to buy Decart for roughly $6B, which would pull chip-efficiency work and world models into its inference org. River AI, two months old and founded by former xAI co-founder Igor Babuschkin, raised $1.1B across seed and Series A with strategic money from NVIDIA and AMD Ventures on the opposite thesis: train on your own data and rewards, own the resulting model, rent nothing. The release in that roundup most likely to touch your pipeline is NVIDIA's NeMo Switchyard, an open-source routing library that sends each step of an agent workflow to the cheapest capable model, shipped next to a 30B Nemotron 3.5 Lightning MoE with 3B active parameters and a 1M context window under OpenMDW-1.1.

Cheap-and-good keeps getting easier to verify from outside. Semgrep ran GLM-5.3 through their own cybersecurity benchmark and reported [Opus 4.8-level results at a fraction of the cost](https://semgrep.dev/blog/2026/glm-53-delivers-opus-48-level-cybersecurity-results-at-a-fraction-of-the-cost), which matters more than the vendor tagline given that Z.ai built GLM-5.3 entirely through post-training on the same 743B base as GLM-5.2. Post-training on a frozen base now closes enough of the gap to show up in a third-party security eval.

Two arXiv papers landed on the same axis. [Ontology-Grounded Project Memory for Coding Agents](https://arxiv.org/abs/2608.13662) puts architectural decisions, constraints, and rationales into a knowledge graph with lifecycle status, provenance, and supersession links, exposed to agents over MCP. Against a production vector-memory tool on 835 typed records, it returned essentially the full expected answer set (0.98 to 1.00) on supersession, set-completeness, and negation questions where top-k retrieval surfaced 6% to 27%, at roughly equivalent token cost and relevance recall. Those three question types are exactly where "what did we decide and what replaced it" lives, and they are exactly where embedding similarity has no purchase. The other paper is a correction of its own headline. A six-person team instrumented an academic term of AI-heavy development with a three-layer cost model and [first reported a 19.4x cost ratio](https://arxiv.org/abs/2608.13730), then found two independent errors, inferring per-token cost under a flat-rate subscription and pricing the human counterfactual at the wrong regional labor rates, that had together inflated the number about 2x. The corrected figure is 9.9x. They publish the correction as the finding, on the grounds that both mistakes are invisible in the final number and probably common.

Which is the frame to carry into every cost claim above, including the good ones. Two harness rebuilds, a paged-memory experiment, and a routing library all measured savings against a baseline they chose themselves. Watch whether anyone publishes a cost-per-task methodology that survives someone else's audit, and watch whether Pi keeps accumulating dependents fast enough to become the layer nobody rewrites.
