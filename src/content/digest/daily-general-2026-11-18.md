---
title: Cheap sub-agents set the safety ceiling for Claude Code and Codex
cadence: daily
track: general
origin: auto
date: 2026-11-18
summary: A new paper plants a forged record and finds Claude Code and Codex
  repeat it when a cheaper sub-agent does the reading (up to 553 of 900 trials),
  though the orchestrator alone almost never does. Companion papers parse
  143,209 coding-agent trajectories and pre-register what counts as a real gain
  for a finance agent, while HN argues over open-sourcing AI code,
  agent-hackable hardware, and a hiring thread where AI now appears in 51.6% of
  postings. The feed stopped ingesting early November 16, so items run November
  12 to 16.
topics:
  - multi-agent
  - agent-security
  - agent-evaluation
  - agent-research
  - ai-labor
  - llm-architecture
  - agent-tooling
unresolvedFacets:
  - agent-research
  - llm-architecture
audioUrl: /media/digests/daily-general-2026-11-18.mp3
durationSec: 702
items:
  - title: "Only as Safe as the Weakest Agent: A Break That Appears Only When the
      System Is Multi-Agent"
    url: https://arxiv.org/abs/2611.17520
    source: arXiv cs.MA
    category: research
  - title: Interpreting Coding Agents Through Their Behavioral Trajectories
    url: https://arxiv.org/abs/2611.17440
    source: arXiv cs.SE
    category: research
  - title: Can You Trust Your Finance Agent? Drift, Diagnosis and Auditable
      Intervention on One Shipped Financial Research Agent
    url: https://arxiv.org/abs/2611.17939
    source: arXiv cs.CL
    category: research
  - title: All AI-generated code should be Open Source
    url: https://jakub.jankiewicz.org/blog/ai-code-open-source/
    source: Jakub Jankiewicz (via Hacker News)
    category: tech_articles
  - title: Your Agent Will Pick the Hackable One
    url: https://geoffstearns.com/blog/your-agent-will-pick-the-hackable-one/
    source: Geoff Stearns (via Hacker News)
    category: tech_articles
  - title: '"Who is Hiring?" postings stuck near 12-year lows as AI reaches half of
      all jobs'
    url: https://www.hntrends.com/2026/november.html
    source: HN Hiring Trends
    category: tech_articles
  - title: Understanding Positional Embeddings in Modern LLMs
    url: https://magazine.sebastianraschka.com/p/understanding-positional-embeddings
    source: Ahead of AI (Sebastian Raschka)
    category: newsletters
  - title: datasette-agent 0.6a0
    url: https://simonwillison.net/2026/Nov/15/datasette-agent/
    source: Simon Willison's Weblog
    category: tech_articles
highlights:
  - Claude Code and Codex repeat a planted forgery in up to 553 of 900 trials
    when a cheaper sub-agent reads, versus near zero when the orchestrator reads
    itself
  - 143,209 coding-agent trajectories show agents with similar solve rates
    explore, edit and test very differently
  - A finance agent varies from 105 to 123 of 149 rubric criteria across seven
    identical runs; only the cost cut survives a pre-registered noise test
  - AI appears in 51.6% of HN Who is Hiring postings while total postings sit
    37% below last year
  - "Raschka: partial RoPE in MiniMax-M3 halves the sin/cos tables but not the
    KV cache, and is hardly worth it"
---

Planted one forged record in a folder of files, then asked Claude Code and Codex to answer questions from it: when the orchestrator model searched the store itself, it made almost no harmful revisions across more than 1,000 trials, and when the same orchestrator handed the search to a cheaper sub-agent, the failures came back at 20/180, 44/180, 75/180 and 553/900. That is the result in [Only as Safe as the Weakest Agent](https://arxiv.org/abs/2611.17520), posted on arXiv on November 12 by Keegan Wang and Anantika Mannby, and it is the paper from the past few days I would put in front of anyone running a multi-agent harness. Both tools were tested unmodified, using their own sub-agent mechanisms, plus a reference harness. The authors then simulated the delivery path across 18 models: five aggregators that were almost never unsafe on their own repeated a corrupted sub-agent's error in 751 of 757 trials. Their conclusion is blunt. A system with a strong orchestrator and cheap readers has the safety of the cheap reader, so the delegation pattern every harness is built around also sets where its safety lands. If your cost story depends on routing reads to a small model, your threat model has to assume the small model is the one being attacked.

A second cs.SE paper gives you the tooling to see that kind of difference. Ibragim Badertdinov and Alexander Golubev's [Interpreting Coding Agents Through Their Behavioral Trajectories](https://arxiv.org/abs/2611.17440) parses 143,209 execution traces from 125 agent configurations covering 117 models into high-level actions (repository search, file edits, test runs) and audits the parser against a six-model consensus on 500 events. Agents with similar solve rates explore, edit and verify code very differently, and the behavioral profile alone, with no outcomes, token counts or tool names as features, is enough to identify which agent stack produced a run across disjoint repositories and languages. Scaffold choice and reasoning effort both shift search, editing and testing behavior in systematic ways. The deterministic parser and an annotated subset are released, which makes it the most reusable artifact in this batch for anyone comparing harnesses on more than a pass rate.

The third paper is a case study, and it says so. [Can You Trust Your Finance Agent?](https://arxiv.org/abs/2611.17939) takes the untuned reference agent from the Vals Finance Agent Benchmark v2 and runs it seven identical times on 18 questions: it passes between 105 and 123 of 149 rubric criteria, and the bill swings by up to 17%. Of 20 failed trajectories, 13 trace to the agent's instructions, 3 to its tools, 4 to the model and none to its data. Blind readers from three model families agree with the authors' LLM analyzer 94% of the time, about the rate they agree with each other (93%). The interesting part is the optimization loop, judged against measured run-to-run noise under a rule written before the test set was opened: a cost objective cut spend to 0.34x baseline (95% CI 0.22 to 0.58) at unchanged accuracy, which counts as a real saving, while an accuracy objective gained 14 points on development questions and 1.5 on held-out ones (CI −5.3 to +7.2), which does not. Nine test questions is small, but the method of pre-registering what counts as an improvement is the right one to copy.

Two essays from the Hacker News front page on November 15 argued over who controls what agents write and what they touch. Jakub Jankiewicz's [All AI-generated code should be Open Source](https://jakub.jankiewicz.org/blog/ai-code-open-source/) drew 250 points and 158 comments. His case is partly ethical (models trained on open-source code and CC-licensed Stack Overflow answers, so a proprietary output amounts to "license laundering") and partly legal: purely machine-written code arguably has no human author to hold copyright, and he leans on the Monkey Selfie dispute and on Wikimedia Commons tagging purely AI-generated images as public domain. He recommends CC0 for unreviewed, prompt-only output. Geoff Stearns, writing from the hardware side in [Your Agent Will Pick the Hackable One](https://geoffstearns.com/blog/your-agent-will-pick-the-hackable-one/), predicts that agents shopping and installing on an owner's behalf will favor devices whose firmware they can change. He points to M-Vave publishing the firmware for its roughly $70 FM-1 synth under GPLv3 in October and Behringer releasing source for its KICK sampler and IGNITE sequencer within two weeks, against Chamberlain cutting Home Assistant off from MyQ in 2023. The question he leaves is who holds the signing keys, and whether the agent works for the owner or the vendor.

The labor numbers came from [HN Hiring Trends for November](https://www.hntrends.com/2026/november.html). As of November 14 the "Who is Hiring?" thread had 244 postings, down 37% from 387 at the same point last year; every thread since July has landed between 224 and 255, and August's 224 was the lowest since January 2014. AI now appears in 51.6% of postings, up from 30% two years ago, "AI agents" in 14.8%, and MCP went from 0.3% to 4.5% in a year. The headline's "half of all jobs" means half of these postings, not half the job market.

For the model side, Sebastian Raschka published [Understanding Positional Embeddings in Modern LLMs](https://magazine.sebastianraschka.com/p/understanding-positional-embeddings) on November 15, a long PyTorch walkthrough of RoPE written as the foundation for his coming 2026 architecture survey. The useful section for practitioners is the last one: MiniMax-M3 rotates only 64 of 128 features per head ("partial RoPE"), which halves the cosine and sine tables but not the KV cache, and Raschka's read of the ablations is that "partial RoPE is hardly worth it." He also covers NoPE layers, which drop explicit position signals entirely and beat RoPE on length generalization in the original small-model experiments.

Simon Willison shipped [datasette-agent 0.6a0](https://simonwillison.net/2026/Nov/15/datasette-agent/), which puts an agent prompt on the Datasette homepage with hash-mentions for tables and saved queries, so asking about `#releases` autocompletes to the table it means. It is a small release, and a clean example of scoping an agent's context through the interface the user already has.

The open question from the first paper is whether harness vendors respond. Claude Code and Codex both delegate reads to cheaper sub-agents by design, and the paper's numbers suggest the fix lives in how sub-agent output is trusted and cross-checked, not in a stronger orchestrator. Watch for whether either tool changes how it surfaces or verifies what a sub-agent reports back.

---

*Sourcing note: the item feed behind this digest stopped ingesting at 2026-11-16 09:04 UTC, so nothing published after early November 16 is covered here. Every item above is dated November 12 to 16; this issue covers those days, not November 17 or 18.*
