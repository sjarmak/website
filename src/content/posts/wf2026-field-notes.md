---
title: "WF2026 field notes: the argument moved off the model"
date: 2026-07-03
description: "Automated field notes from AI Engineer World's Fair 2026: three mainstage days and an 80-talk online track, distilled into five themes. The field stopped arguing about model quality and started arguing about everything around it."
tags: [ai-engineering, agents, field-notes, wf2026]
draft: false
---

> **Automated field notes.** Agents built these notes: transcripts pulled from the auto-generated captions of the WF2026 recordings, summarized talk by talk into my notes vault, then distilled into these essays. Quotes are close paraphrases of what was said on stage, and speaker names are approximate wherever captions garbled them. Read them as a fast map of the conference, not as a transcript of record.

Three mainstage recordings totaling roughly 263,000 words of captions, plus an [80-talk online track](https://www.youtube.com/playlist?list=PLcfpQ4tk2k0V1LNigteMgExP1rb4Hy8wn), came out of the AI Engineer World's Fair 2026 (Moscone West, June 29 to July 2). I ran the whole set through an agent pipeline and ended up with 206 talk notes. Reading across them, one shift is unmistakable: almost nobody argued about model quality. The arguments were about the harness, the loop, retrieval, evals, verification, memory, and the organization wrapped around all of it, and the stated bottleneck in talk after talk was reliability, not capability.

The frame that dominated was the "software factory," the fully autonomous idea-to-ship-to-monitor loop, and the most interesting sessions were the ones contesting it: HumanLayer arguing that no amount of harness engineering fixes what is really a model-training limitation, Microsoft's voice team arguing the LLM should never drive, and a debate stage dedicated to whether loops are the core unit of engineering or hype outrunning discipline.

Five themes carried the weight, and each gets its own essay.

[**A harness swings an agent 20 points on a fixed model**](/writing/wf2026-harness-over-model). Etsy held the model constant and varied only the harness across 106 tasks; scores ranged from 52.4% to 76.2%. Anthropic showed that giving tokens distinct jobs beats spending the same budget on undifferentiated execution, and DSPy made the case for programming against evals instead of prompting against vibes.

[**Most of the agent bill is input tokens**](/writing/wf2026-token-economy). Tesco measured ~90% of AI coding cost as input, built a local hybrid code index, and cut tokens 94% on their benchmark. Artificial Analysis showed token prices falling 5-10× a year while cost per task rises. Salesforce offered the most practical rubric of the conference for choosing among CLI, MCP, and skills.

[**Retrieval is the bottleneck, not reasoning**](/writing/wf2026-retrieval-bottleneck). Mixedbread quantified the gap between what models could answer with perfect documents and what they actually retrieve. Jina reframed search itself as test-time compute and let an agent redesign retrieval pipelines overnight. Neo4j and cognee made the knowledge-substrate case.

[**Evals are the new CI**](/writing/wf2026-evals-are-the-new-ci). Meta, Arize, Weights & Biases, and Sonar converged on the same architecture from different directions: evals as an always-on production service with a three-layer judge stack, rule-based to LLM to agent-as-a-judge.

[**Self-improving loops set records without inventing anything new**](/writing/wf2026-autoresearch-and-skeptics). Weco's agent set seven records on OpenAI's Parameter Golf; Prime Intellect found that record-setting agents produced no genuinely novel optimizers; GEPA doubled the gains of 25,000 RL rollouts with one round of reflection on three data points. The skeptics' counterargument, that maintainability is not RL-verifiable and someone still has to read the code, is the sharpest critique of the year.

The notes behind these essays live in my vault as one file per talk, with per-talk YouTube links in the three source recordings: [Software Factories](https://www.youtube.com/watch?v=htM02KMNZnk), [Autoresearch & Keynotes](https://www.youtube.com/watch?v=4sX_He5c4sI), and [Harness Engineering](https://www.youtube.com/watch?v=I2cbIws9j10). There is also a [30-minute podcast episode](/digest) distilling the takeaways I care most about, given that most of what I build lives exactly where this conference pointed: harnesses, retrieval, and token budgets.

What I keep turning over after the read-through is the tension the conference never resolved: the optimists are building factories on the assumption that verification scales with generation, and the skeptics have early evidence it does not. Which side wins determines whether next year's conference is about bigger loops or better brakes.
