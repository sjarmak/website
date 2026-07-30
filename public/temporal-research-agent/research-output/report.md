# What durable execution changes about an agent research pipeline

## SciX synthesis scaffold

SciX `synthesize_findings` mechanically grouped 23 retrieved papers into an auditable writing outline. The cited findings by research question follow this scaffold.

### Background

- Pioneer Agent: Continual Improvement of Small Language Models in Production (2026) [2026arXiv260409791A], assigned by community fallthrough.
- Evaluating LLM Agents on Automated Software Analysis Tasks (2026) [2026arXiv260411270P], assigned by community fallthrough.
- Tools Fail: Detecting Silent Errors in Faulty Tools (2024) [2024arXiv240619228S], assigned by community fallthrough.
- Towards Message Brokers for Generative AI: Survey, Challenges, and Opportunities (2023) [2023arXiv231214647S], assigned by community fallthrough.

### Methods

- Beyond Task Completion: Revealing Corrupt Success in LLM Agents through Procedure-Aware Evaluation (2026) [2026arXiv260303116C], assigned by citation count fallback.
- PROV-AGENT: Unified Provenance for Tracking AI Agent Interactions in Agentic Workflows (2025) [2025arXiv250802866S], assigned by citation count fallback.
- TRANSOM: An Efficient Fault-Tolerant System for Training LLMs (2023) [2023arXiv231010046W], assigned by citation count fallback.
- Gemini: A Family of Highly Capable Multimodal Models (2023) [2023arXiv231211805G], assigned by citation count fallback.

### Results

- Autonomous Agents Coordinating Distributed Discovery Through Emergent Artifact Exchange (2026) [2026arXiv260314312W], assigned by citation count fallback.
- Architectures for Building Agentic AI (2025) [2025arXiv251209458N], assigned by citation count fallback.
- Enhancing Survivability in Power IoT Systems Based on Compliance Checks (2025) [2025cits.conf..174Z], assigned by citation count fallback.
- Goal-Oriented Modeling in Fault Tolerant Service-Oriented Multi-Agent Systems (2024) [2024cmps.conf..242T], assigned by citation count fallback.

### Open Questions

- COMPOSITE-Stem (2026) [2026arXiv260409836W], assigned by citation count fallback.
- AI Identification: An Integrated Framework for Sustainable Governance in Digital Enterprises (2026) [2026arXiv260410473G], assigned by citation count fallback.
- Crab: A Semantics-Aware Checkpoint/Restore Runtime for Agent Sandboxes (2026) [2026arXiv260428138W], assigned by citation count fallback.
- Organization-Level Identification in the Power IoT System (2025) [2025cits.conf..175G], assigned by citation count fallback.

Unattributed working-set papers: 2026arXiv260508545K, 2026arXiv260523311Y, 2026arXiv260601365L, 2026arXiv260601416B, 2026arXiv260609863A, 2026arXiv260708740Q, 2026arXiv260710608C.

## Durable Execution

**Question:** What state must survive process failure in an agent research pipeline?

### Synthesized findings

- [SciX] When a structured tool agent fails mid-execution, the runtime faces a dilemma: replaying the entire task is safe but wasteful, while restoring from a ... [2026arXiv260523311Y]
- [SciX] Autonomous agents act through sandboxed containers and microVMs whose state spans filesystems, processes, and runtime artifacts. Checkpoint and restor... [2026arXiv260428138W]
- [SciX] Large language models (LLMs) with hundreds of billions or trillions of parameters, represented by chatGPT, have achieved profound impact on various fi... [2023arXiv231010046W]
- [SciX] This study proposes a survivability enhancement technique for Power IoT based on checkpoint fault tolerance technology. It aims to improve system surv... [2025cits.conf..174Z]
- [SciX] In today's digital world, Generative Artificial Intelligence (GenAI) such as Large Language Models (LLMs) is becoming increasingly prevalent, extendin... [2023arXiv231214647S]
- [SciX] This study proposes a survivability enhancement technique for Power IoT based on checkpoint fault tolerance technology. It aims to improve system surv... [2025cits.conf..175G]
- [Code Intelligence Digest] Article URL: https://www.morling.dev/blog/building-durable-execution-engine-with-sqlite/ Comments URL: https://news.ycombinator.com/item?id=45992316 Points: 145 # Comments: 46 [tag:google.com,2005:reader/item/0000000b03013b10]
- [Code Intelligence Digest] PLC Solved Durable Execution in the 1980s. AI Is Just Rediscovering It. In the 1980s, PLC-based control systems were already solving what modern distributed systems now call “durable execution.” I [tag:google.com,2005:reader/item/0000000b3cb67afe]
- [Code Intelligence Digest] arXiv:2605.28607v1 Announce Type: cross Abstract: Modern information systems require autonomous agents capable of navigating complex workflows, yet current methodologies often struggle with the transition from structured metadata parsing to general environmental perception. While the integration of MLLMs has enabled agents to interact directly with GUIs, existing approaches typically treat task [tag:google.com,2005:reader/item/0000000b7e782cbd]
- [Code Intelligence Digest] arXiv:2606.08049v1 Announce Type: new Abstract: AI agents increasingly turn past experience into reusable artifacts such as code, workflows, and procedural memories. Reuse can improve efficiency, but it also creates a lifecycle reliability problem: artifacts that succeed once may fail under environment drift, underspecified tasks, or changing task distributions, especially in web automation. We [tag:google.com,2005:reader/item/0000000b860c448c]
- [Code Intelligence Digest] Despite the potential of language model-based agents to solve real-world tasks such as web navigation, current methods still struggle with long-horizon tasks with complex action trajectories. In contrast, humans can flexibly solve complex tasks by learning reusable task workflows from past experiences and using them to guide future actions. To build agents that can similarly benefit from this proc [ads:2024arXiv240907429Z]
- [Code Intelligence Digest] arXiv:2605.10057v1 Announce Type: cross Abstract: Compositional spatiotemporal reasoning often requires a system to invoke multiple heterogeneous specialists, such as geometric, temporal, topological, and trajectory agents. A central question is how such a system should route among specialists when execution does not simply succeed or fail, but fails in qualitatively different ways. Existing too [tag:google.com,2005:reader/item/0000000b740fdfdc]

### Sources

- [SciX] [2026arXiv260523311Y] DART: Semantic Recoverability for Structured Tool Agents. 2026arXiv260523311Y
- [SciX] [2026arXiv260428138W] Crab: A Semantics-Aware Checkpoint/Restore Runtime for Agent Sandboxes. 2026arXiv260428138W
- [SciX] [2023arXiv231010046W] TRANSOM: An Efficient Fault-Tolerant System for Training LLMs. 2023arXiv231010046W
- [SciX] [2025cits.conf..174Z] Enhancing Survivability in Power IoT Systems Based on Compliance Checks. 2025cits.conf..174Z
- [SciX] [2023arXiv231214647S] Towards Message Brokers for Generative AI: Survey, Challenges, and Opportunities. 2023arXiv231214647S
- [SciX] [2025cits.conf..175G] Organization-Level Identification in the Power IoT System. 2025cits.conf..175G
- [Code Intelligence Digest] [tag:google.com,2005:reader/item/0000000b03013b10] Building a Durable Execution Engine with SQLite. https://www.morling.dev/blog/building-durable-execution-engine-with-sqlite/
- [Code Intelligence Digest] [tag:google.com,2005:reader/item/0000000b3cb67afe] Durable Execution. https://www.reddit.com/r/LLMDevs/comments/1r80a04/durable_execution/
- [Code Intelligence Digest] [tag:google.com,2005:reader/item/0000000b7e782cbd] Adaptive Multimodal Agents-Based Framework for Automatic Workflow Execution. https://arxiv.org/abs/2605.28607
- [Code Intelligence Digest] [tag:google.com,2005:reader/item/0000000b860c448c] SKILL.nb: Selective Formalization and Gated Execution for Durable Agent Workflows. https://arxiv.org/abs/2606.08049
- [Code Intelligence Digest] [ads:2024arXiv240907429Z] Agent Workflow Memory. https://ui.adsabs.harvard.edu/abs/2024arXiv240907429Z
- [Code Intelligence Digest] [tag:google.com,2005:reader/item/0000000b740fdfdc] Route by State, Recover from Trace: STAR with Failure-Aware Markov Routing for Multi-Agent Spatiotemporal Reasoning. https://arxiv.org/abs/2605.10057

## Tool Reliability

**Question:** How should unreliable tool and retrieval calls be retried and observed?

### Synthesized findings

- [SciX] Tool-using multi-agent large language model (LLM) systems spend computation through model tokens, tool calls, retries, and code execution before produ... [2026arXiv260601365L]
- [SciX] Tool-augmented large language model (LLM) agents rely on orchestration layers that coordinate planning, retrieval, tool invocation, validation, memory... [2026arXiv260601416B]
- [SciX] Tools have become a mainstay of LLMs, allowing them to retrieve knowledge not in their weights, to perform tasks on the web, and even to control robot... [2024arXiv240619228S]
- [SciX] Multi-agent systems are examples of complex distributed systems enabling dynamic adaptation in providing their services. By establishing on-the-fly co... [2024cmps.conf..242T]
- [SciX] Numerous software analysis tools exist today, yet applying them to diverse open-source projects remains challenging due to environment setup, dependen... [2026arXiv260411270P]
- [SciX] This chapter argues that the reliability of agentic and generative AI is chiefly an architectural property. We define agentic systems as goal-directed... [2025arXiv251209458N]
- [Code Intelligence Digest] arXiv:2601.06112v1 Announce Type: new Abstract: Existing benchmarks for tool-using LLM agents primarily report single-run success rates and miss reliability properties required in production. We introduce \textbf{ReliabilityBench}, a benchmark for evaluating agent reliability across three dimensions: (i) consistency under repeated execution using $\mathrm{pass}^k$, (ii) robustness to semanticall [tag:google.com,2005:reader/item/0000000b23c3fca2]
- [Code Intelligence Digest] Multi-agent systems powered by large language models (LLMs) are transforming enterprise automation, yet systematic evaluation methodologies for assessing tool-use reliability remain underdeveloped. We introduce a comprehensive diagnostic framework that leverages big data analytics to evaluate procedural reliability in intelligent agent systems, addressing critical needs for SME-centric deployment [ads:2026arXiv260116280H]
- [Code Intelligence Digest] Agentic AI transforms observability by using autonomous agents to analyze telemetry, detect issues, and execute fixes— [tag:google.com,2005:reader/item/0000000b0c2c37b0]
- [Code Intelligence Digest] arXiv:2605.06890v3 Announce Type: replace-cross Abstract: AI agents are promising for high-stakes enterprise workflows, but dependable deployment remains limited because tool-use failures are difficult to diagnose and control. Agents may skip required tool calls, invoke tools unnecessarily, or take actions whose consequence becomes visible only after execution. Existing observability methods are [tag:google.com,2005:reader/item/0000000b855a1cfe]
- [Code Intelligence Digest] hey everyone, been lurking but finally posting cause i'm hitting a wall with our ai projects. like, last thursday i was up till 2 am debugging why our chatbot started hallucinating responses – had to sift through logs endlesly and it just felt like guessing. observability for llm stuff is kinda a mess, right? not just logs but token usage, latency, quality scores. tools i've tried a [tag:google.com,2005:reader/item/0000000b3431807c]
- [Code Intelligence Digest] arXiv:2605.06890v2 Announce Type: replace-cross Abstract: AI agents are promising for high-stakes enterprise workflows, but dependable deployment remains limited because tool-use failures are difficult to diagnose and control. Agents may skip required tool calls, invoke tools unnecessarily, or take actions whose consequence becomes visible only after execution. Existing observability methods are [tag:google.com,2005:reader/item/0000000b7ad78059]

### Sources

- [SciX] [2026arXiv260601365L] Early Diagnosis of Wasted Computation in Multi-Agent LLM Systems via Failure-Aware Observability. 2026arXiv260601365L
- [SciX] [2026arXiv260601416B] Self-Healing Agentic Orchestrators for Reliable Tool-Augmented Large Language Model Systems. 2026arXiv260601416B
- [SciX] [2024arXiv240619228S] Tools Fail: Detecting Silent Errors in Faulty Tools. 2024arXiv240619228S
- [SciX] [2024cmps.conf..242T] Goal-Oriented Modeling in Fault Tolerant Service-Oriented Multi-Agent Systems. 2024cmps.conf..242T
- [SciX] [2026arXiv260411270P] Evaluating LLM Agents on Automated Software Analysis Tasks. 2026arXiv260411270P
- [SciX] [2025arXiv251209458N] Architectures for Building Agentic AI. 2025arXiv251209458N
- [Code Intelligence Digest] [tag:google.com,2005:reader/item/0000000b23c3fca2] ReliabilityBench: Evaluating LLM Agent Reliability Under Production-Like Stress Conditions. https://arxiv.org/abs/2601.06112
- [Code Intelligence Digest] [ads:2026arXiv260116280H] When Agents Fail to Act: A Diagnostic Framework for Tool Invocation Reliability in Multi-Agent LLM Systems. https://ui.adsabs.harvard.edu/abs/2026arXiv260116280H
- [Code Intelligence Digest] [tag:google.com,2005:reader/item/0000000b0c2c37b0] Agentic AI in Observability Platforms: Empowering Autonomous SRE . https://devops.com/agentic-ai-in-observability-platforms-empowering-autonomous-sre/
- [Code Intelligence Digest] [tag:google.com,2005:reader/item/0000000b855a1cfe] Beyond the Black Box: Interpretability of Agentic AI Tool Use. https://arxiv.org/abs/2605.06890
- [Code Intelligence Digest] [tag:google.com,2005:reader/item/0000000b3431807c] agent observability – what tools work?. https://www.reddit.com/r/LLMDevs/comments/1qwfrpx/agent_observability_what_tools_work/
- [Code Intelligence Digest] [tag:google.com,2005:reader/item/0000000b7ad78059] Beyond the Black Box: Interpretability of Agentic AI Tool Use. https://arxiv.org/abs/2605.06890

## State And Memory

**Question:** Where is the boundary between orchestration state and research artifacts?

### Synthesized findings

- [SciX] We present ScienceClaw + Infinite, a framework for autonomous scientific investigation in which independent agents conduct research without central co... [2026arXiv260314312W]
- [SciX] AI agents hold growing promise for accelerating scientific discovery; yet, a lack of frontier evaluations hinders adoption into real workflows. Expert... [2026arXiv260409836W]
- [SciX] Large Language Models (LLMs) and other foundation models are increasingly used as the core of AI agents. In agentic workflows, these agents plan tasks... [2025arXiv250802866S]
- [SciX] As artificial intelligence (AI) systems grow more powerful, autonomous, and embedded in critical infrastructure, their identification and traceability... [2026arXiv260410473G]
- [SciX] Large language model (LLM) applications increasingly use explicit workflows for tool use, retrieval, branching, checkpointing, and human approval. Exi... [2026arXiv260708740Q]
- [SciX] Numerous software analysis tools exist today, yet applying them to diverse open-source projects remains challenging due to environment setup, dependen... [2026arXiv260411270P]
- [Code Intelligence Digest] arXiv:2504.12612v2 Announce Type: replace-cross Abstract: Provenance is the chronological history of things, resonating with the fundamental pursuit to uncover origins, trace connections, and situate entities within the flow of space and time. As artificial intelligence advances towards autonomous agents capable of interactive collaboration on complex tasks, the provenance of generated content b [tag:google.com,2005:reader/item/0000000b6d5863eb]
- [Code Intelligence Digest] arXiv:2604.21936v1 Announce Type: new Abstract: Medical imaging research is increasingly shifting from controlled benchmark evaluation toward real-world clinical deployment. In such settings, applying analytical methods extends beyond model design to require dataset-aware workflow configuration and provenance tracking. Two requirements therefore become central: \textbf{adaptability}, the ability [tag:google.com,2005:reader/item/0000000b6a617a98]
- [Code Intelligence Digest] arXiv:2603.21692v1 Announce Type: cross Abstract: As AI agents transition from human-supervised copilots to autonomous platform infrastructure, the ability to analyze their reasoning behavior across populations of investigations becomes a pressing infrastructure requirement. Existing operational tooling addresses adjacent needs effectively: state checkpoint systems enable fault tolerance; observ [tag:google.com,2005:reader/item/0000000b539ddc79]
- [Code Intelligence Digest] As AI agents transition from human-supervised copilots to autonomous platform infrastructure, the ability to analyze their reasoning behavior across populations of investigations becomes a pressing infrastructure requirement. Existing operational tooling addresses adjacent needs effectively: state checkpoint systems enable fault tolerance; observability platforms provide execution traces for debug [ads:2026arXiv260321692V]
- [Code Intelligence Digest] arXiv:2603.21692v2 Announce Type: replace Abstract: As AI agents transition from human-supervised copilots to autonomous platform infrastructure, the ability to analyze their reasoning behavior across populations of investigations becomes a pressing infrastructure requirement. Existing operational tooling addresses adjacent needs effectively: state checkpoint systems enable fault tolerance; obse [tag:google.com,2005:reader/item/0000000b61265c46]
- [Code Intelligence Digest] Despite the growing capabilities of autonomous agents powered by large language models (LLMs), their adoption in high-stakes domains remains limited. A key barrier is security: the inherently nondeterministic behavior of LLM agents defies static auditing approaches that have historically underpinned software assurance. Existing security methods, such as proxy-level input filtering and model glassb [ads:2026arXiv260210133A]

### Sources

- [SciX] [2026arXiv260314312W] Autonomous Agents Coordinating Distributed Discovery Through Emergent Artifact Exchange. 2026arXiv260314312W
- [SciX] [2026arXiv260409836W] COMPOSITE-Stem. 2026arXiv260409836W
- [SciX] [2025arXiv250802866S] PROV-AGENT: Unified Provenance for Tracking AI Agent Interactions in Agentic Workflows. 2025arXiv250802866S
- [SciX] [2026arXiv260410473G] AI Identification: An Integrated Framework for Sustainable Governance in Digital Enterprises. 2026arXiv260410473G
- [SciX] [2026arXiv260708740Q] Workflow as Knowledge: Semantic Persistence for LLM-Mediated Workflows. 2026arXiv260708740Q
- [SciX] [2026arXiv260411270P] Evaluating LLM Agents on Automated Software Analysis Tasks. 2026arXiv260411270P
- [Code Intelligence Digest] [tag:google.com,2005:reader/item/0000000b6d5863eb] Chronology of Multi-Agent Interactions for Provenance of Evolving Information. https://arxiv.org/abs/2504.12612
- [Code Intelligence Digest] [tag:google.com,2005:reader/item/0000000b6a617a98] An Artifact-based Agent Framework for Adaptive and Reproducible Medical Image Processing. https://arxiv.org/abs/2604.21936
- [Code Intelligence Digest] [tag:google.com,2005:reader/item/0000000b539ddc79] Reasoning Provenance for Autonomous AI Agents: Structured Behavioral Analytics Beyond State Checkpoints and Execution Traces. https://arxiv.org/abs/2603.21692
- [Code Intelligence Digest] [ads:2026arXiv260321692V] Reasoning Provenance for Autonomous AI Agents: Structured Behavioral Analytics Beyond State Checkpoints and Execution Traces. https://ui.adsabs.harvard.edu/abs/2026arXiv260321692V
- [Code Intelligence Digest] [tag:google.com,2005:reader/item/0000000b61265c46] Reasoning Provenance for Autonomous AI Agents: Structured Behavioral Analytics Beyond State Checkpoints and Execution Traces. https://arxiv.org/abs/2603.21692
- [Code Intelligence Digest] [ads:2026arXiv260210133A] AgentTrace: A Structured Logging Framework for Agent System Observability. https://ui.adsabs.harvard.edu/abs/2026arXiv260210133A

## Evaluation

**Question:** How do we test that recovery preserves correctness rather than only completion?

### Synthesized findings

- [SciX] Memory is becoming a core component of long-horizon AI agents, allowing agents to reuse past experience when operating web browsers, software tools, a... [2026arXiv260710608C]
- [SciX] LLM agents can fail silently by asserting task completion when the environment state shows otherwise. We study this failure mode, false success, acros... [2026arXiv260609863A]
- [SciX] Small language models are attractive for production deployment due to their low cost, fast inference, and ease of specialization. However, adapting th... [2026arXiv260409791A]
- [SciX] Large Language Model (LLM)-based agents are increasingly adopted in high-stakes settings, but current benchmarks evaluate mainly whether a task was co... [2026arXiv260303116C]
- [SciX] This report introduces a new family of multimodal models, Gemini, that exhibit remarkable capabilities across image, audio, video, and text understand... [2023arXiv231211805G]
- [SciX] Agent benchmarks typically report only final outcomes: pass or fail. This threatens evaluation credibility in three ways. First, scores may be inflate... [2026arXiv260508545K]
- [Code Intelligence Digest] When we started running agents in real workflows, the hardest incidents were not the ones that failed loudly. They were the ones we could not reproduce. A bad outcome happens in production. You run the same workflow again. It “works”. That is not recovery. It is the system changing underneath you. A few patterns kept repeating: The world changes between at [tag:google.com,2005:reader/item/0000000b36a181ab]
- [Code Intelligence Digest] When multi-agent systems (MAS) fail, identifying where the decisive error occurred is the first step for automated recovery to an earlier state. Error attribution remains a fundamental challenge due to the long interaction traces that large language model-based MAS generate. This paper presents a framework for error attribution based on conformal prediction (CP) which provides finite-sample, distr [ads:2026arXiv260506788F]
- [Code Intelligence Digest] arXiv:2603.21357v1 Announce Type: new Abstract: LLM agents fail on the majority of real-world tasks -- GPT-4o succeeds on fewer than 15% of WebArena navigation tasks and below 55% pass@1 on ToolBench (Zhou et al., 2024; Qin et al., 2024) -- yet every failed trajectory is routinely discarded, wasting the dominant source of collected experience. We introduce AgentHER, a framework that recovers thi [tag:google.com,2005:reader/item/0000000b539d25c4]
- [Code Intelligence Digest] arXiv:2605.06788v1 Announce Type: cross Abstract: When multi-agent systems (MAS) fail, identifying where the decisive error occurred is the first step for automated recovery to an earlier state. Error attribution remains a fundamental challenge due to the long interaction traces that large language model-based MAS generate. This paper presents a framework for error attribution based on conformal [tag:google.com,2005:reader/item/0000000b735bd9b2]
- [Code Intelligence Digest] arXiv:2601.15322v2 Announce Type: replace Abstract: LLM agents struggle with regulatory audit replay: when asked to reproduce a flagged transaction decision with identical inputs, many deployments fail to return consistent results. We introduce the Determinism-Faithfulness Assurance Harness (DFAH), a framework for measuring trajectory determinism, decision determinism, and evidence-conditioned f [tag:google.com,2005:reader/item/0000000b4a981d78]
- [Code Intelligence Digest] software engineers have had regression tests and release gates forever. AI agent teams are shipping without equivalent tooling and catching failures from user complaints instead of tests. built replayd to close this gap. failed agent run becomes a regression test. replay before every deploy. if the failure returns after a prompt, model, or tool change, exit 1 blocks the deploy. [tag:google.com,2005:reader/item/0000000b804b9386]

### Sources

- [SciX] [2026arXiv260710608C] The Compliance Trap: Diagnosing How AI Agents Consume Conflicting Memory. 2026arXiv260710608C
- [SciX] [2026arXiv260609863A] From Confident Closing to Silent Failure: Characterizing False Success in LLM Agents. 2026arXiv260609863A
- [SciX] [2026arXiv260409791A] Pioneer Agent: Continual Improvement of Small Language Models in Production. 2026arXiv260409791A
- [SciX] [2026arXiv260303116C] Beyond Task Completion: Revealing Corrupt Success in LLM Agents through Procedure-Aware Evaluation. 2026arXiv260303116C
- [SciX] [2023arXiv231211805G] Gemini: A Family of Highly Capable Multimodal Models. 2023arXiv231211805G
- [SciX] [2026arXiv260508545K] Log analysis is necessary for credible evaluation of AI agents. 2026arXiv260508545K
- [Code Intelligence Digest] [tag:google.com,2005:reader/item/0000000b36a181ab] Replay is not re-execution. The reproducibility gap in production agents. https://www.reddit.com/r/LLMDevs/comments/1r0fzyc/replay_is_not_reexecution_the_reproducibility_gap/
- [Code Intelligence Digest] [ads:2026arXiv260506788F] Conformal Agent Error Attribution. https://ui.adsabs.harvard.edu/abs/2026arXiv260506788F
- [Code Intelligence Digest] [tag:google.com,2005:reader/item/0000000b539d25c4] AgentHER: Hindsight Experience Replay for LLM Agent Trajectory Relabeling. https://arxiv.org/abs/2603.21357
- [Code Intelligence Digest] [tag:google.com,2005:reader/item/0000000b735bd9b2] Conformal Agent Error Attribution. https://arxiv.org/abs/2605.06788
- [Code Intelligence Digest] [tag:google.com,2005:reader/item/0000000b4a981d78] Replayable Financial Agents: A Determinism-Faithfulness Assurance Harness for Tool-Using LLM Agents. https://arxiv.org/abs/2601.15322
- [Code Intelligence Digest] [tag:google.com,2005:reader/item/0000000b804b9386] CI/CD for AI agents , open source SDK that turns failed runs into regression tests. https://www.reddit.com/r/SoftwareEngineering/comments/1tsgh7s/cicd_for_ai_agents_open_source_sdk_that_turns/
