# What durable execution changes about an agent research pipeline

## SciX synthesis scaffold

SciX `synthesize_findings` mechanically grouped 23 retrieved papers into an auditable writing outline. The cited findings by research question follow this scaffold.

### Background

- [Pioneer Agent: Continual Improvement of Small Language Models in Production](https://ui.adsabs.harvard.edu/abs/2026arXiv260409791A/abstract) (2026), assigned by community fallthrough.
- [Evaluating LLM Agents on Automated Software Analysis Tasks](https://ui.adsabs.harvard.edu/abs/2026arXiv260411270P/abstract) (2026), assigned by community fallthrough.
- [Tools Fail: Detecting Silent Errors in Faulty Tools](https://ui.adsabs.harvard.edu/abs/2024arXiv240619228S/abstract) (2024), assigned by community fallthrough.
- [Towards Message Brokers for Generative AI: Survey, Challenges, and Opportunities](https://ui.adsabs.harvard.edu/abs/2023arXiv231214647S/abstract) (2023), assigned by community fallthrough.

### Methods

- [Beyond Task Completion: Revealing Corrupt Success in LLM Agents through Procedure-Aware Evaluation](https://ui.adsabs.harvard.edu/abs/2026arXiv260303116C/abstract) (2026), assigned by citation count fallback.
- [PROV-AGENT: Unified Provenance for Tracking AI Agent Interactions in Agentic Workflows](https://ui.adsabs.harvard.edu/abs/2025arXiv250802866S/abstract) (2025), assigned by citation count fallback.
- [TRANSOM: An Efficient Fault-Tolerant System for Training LLMs](https://ui.adsabs.harvard.edu/abs/2023arXiv231010046W/abstract) (2023), assigned by citation count fallback.
- [Gemini: A Family of Highly Capable Multimodal Models](https://ui.adsabs.harvard.edu/abs/2023arXiv231211805G/abstract) (2023), assigned by citation count fallback.

### Results

- [Autonomous Agents Coordinating Distributed Discovery Through Emergent Artifact Exchange](https://ui.adsabs.harvard.edu/abs/2026arXiv260314312W/abstract) (2026), assigned by citation count fallback.
- [Architectures for Building Agentic AI](https://ui.adsabs.harvard.edu/abs/2025arXiv251209458N/abstract) (2025), assigned by citation count fallback.
- [Enhancing Survivability in Power IoT Systems Based on Compliance Checks](https://ui.adsabs.harvard.edu/abs/2025cits.conf..174Z/abstract) (2025), assigned by citation count fallback.
- [Goal-Oriented Modeling in Fault Tolerant Service-Oriented Multi-Agent Systems](https://ui.adsabs.harvard.edu/abs/2024cmps.conf..242T/abstract) (2024), assigned by citation count fallback.

### Open Questions

- [COMPOSITE-Stem](https://ui.adsabs.harvard.edu/abs/2026arXiv260409836W/abstract) (2026), assigned by citation count fallback.
- [AI Identification: An Integrated Framework for Sustainable Governance in Digital Enterprises](https://ui.adsabs.harvard.edu/abs/2026arXiv260410473G/abstract) (2026), assigned by citation count fallback.
- [Crab: A Semantics-Aware Checkpoint/Restore Runtime for Agent Sandboxes](https://ui.adsabs.harvard.edu/abs/2026arXiv260428138W/abstract) (2026), assigned by citation count fallback.
- [Organization-Level Identification in the Power IoT System](https://ui.adsabs.harvard.edu/abs/2025cits.conf..175G/abstract) (2025), assigned by citation count fallback.

7 working-set papers were not assigned to a scaffold section; their identifiers remain in the synthesis artifact.

## Durable Execution

**Question:** What state must survive process failure in an agent research pipeline?

### Findings

- **SciX:** When a structured tool agent fails mid-execution, the runtime faces a dilemma: replaying the entire task is safe but wasteful, while restoring from a ... ([DART: Semantic Recoverability for Structured Tool Agents](https://ui.adsabs.harvard.edu/abs/2026arXiv260523311Y/abstract))
- **SciX:** Autonomous agents act through sandboxed containers and microVMs whose state spans filesystems, processes, and runtime artifacts. Checkpoint and restor... ([Crab: A Semantics-Aware Checkpoint/Restore Runtime for Agent Sandboxes](https://ui.adsabs.harvard.edu/abs/2026arXiv260428138W/abstract))
- **SciX:** Large language models (LLMs) with hundreds of billions or trillions of parameters, represented by chatGPT, have achieved profound impact on various fi... ([TRANSOM: An Efficient Fault-Tolerant System for Training LLMs](https://ui.adsabs.harvard.edu/abs/2023arXiv231010046W/abstract))
- **SciX:** This study proposes a survivability enhancement technique for Power IoT based on checkpoint fault tolerance technology. It aims to improve system surv... ([Enhancing Survivability in Power IoT Systems Based on Compliance Checks](https://ui.adsabs.harvard.edu/abs/2025cits.conf..174Z/abstract))
- **SciX:** In today's digital world, Generative Artificial Intelligence (GenAI) such as Large Language Models (LLMs) is becoming increasingly prevalent, extendin... ([Towards Message Brokers for Generative AI: Survey, Challenges, and Opportunities](https://ui.adsabs.harvard.edu/abs/2023arXiv231214647S/abstract))
- **SciX:** This study proposes a survivability enhancement technique for Power IoT based on checkpoint fault tolerance technology. It aims to improve system surv... ([Organization-Level Identification in the Power IoT System](https://ui.adsabs.harvard.edu/abs/2025cits.conf..175G/abstract))
- **Code Intelligence Digest:** Article URL: https://www.morling.dev/blog/building-durable-execution-engine-with-sqlite/ Comments URL: https://news.ycombinator.com/item?id=45992316 Points: 145 # Comments: 46 ([Building a Durable Execution Engine with SQLite](https://www.morling.dev/blog/building-durable-execution-engine-with-sqlite/))
- **Code Intelligence Digest:** PLC Solved Durable Execution in the 1980s. AI Is Just Rediscovering It. In the 1980s, PLC-based control systems were already solving what modern distributed systems now call “durable execution.” I ([Durable Execution](https://www.reddit.com/r/LLMDevs/comments/1r80a04/durable_execution/))
- **Code Intelligence Digest:** arXiv:2605.28607v1 Announce Type: cross Abstract: Modern information systems require autonomous agents capable of navigating complex workflows, yet current methodologies often struggle with the transition from structured metadata parsing to general environmental perception. While the integration of MLLMs has enabled agents to interact directly with GUIs, existing approaches typically treat task ([Adaptive Multimodal Agents-Based Framework for Automatic Workflow Execution](https://arxiv.org/abs/2605.28607))
- **Code Intelligence Digest:** arXiv:2606.08049v1 Announce Type: new Abstract: AI agents increasingly turn past experience into reusable artifacts such as code, workflows, and procedural memories. Reuse can improve efficiency, but it also creates a lifecycle reliability problem: artifacts that succeed once may fail under environment drift, underspecified tasks, or changing task distributions, especially in web automation. We ([SKILL.nb: Selective Formalization and Gated Execution for Durable Agent Workflows](https://arxiv.org/abs/2606.08049))
- **Code Intelligence Digest:** Despite the potential of language model-based agents to solve real-world tasks such as web navigation, current methods still struggle with long-horizon tasks with complex action trajectories. In contrast, humans can flexibly solve complex tasks by learning reusable task workflows from past experiences and using them to guide future actions. To build agents that can similarly benefit from this proc ([Agent Workflow Memory](https://ui.adsabs.harvard.edu/abs/2024arXiv240907429Z))
- **Code Intelligence Digest:** arXiv:2605.10057v1 Announce Type: cross Abstract: Compositional spatiotemporal reasoning often requires a system to invoke multiple heterogeneous specialists, such as geometric, temporal, topological, and trajectory agents. A central question is how such a system should route among specialists when execution does not simply succeed or fail, but fails in qualitatively different ways. Existing too ([Route by State, Recover from Trace: STAR with Failure-Aware Markov Routing for Multi-Agent Spatiotemporal Reasoning](https://arxiv.org/abs/2605.10057))

### Sources

#### SciX

- [DART: Semantic Recoverability for Structured Tool Agents](https://ui.adsabs.harvard.edu/abs/2026arXiv260523311Y/abstract)
- [Crab: A Semantics-Aware Checkpoint/Restore Runtime for Agent Sandboxes](https://ui.adsabs.harvard.edu/abs/2026arXiv260428138W/abstract)
- [TRANSOM: An Efficient Fault-Tolerant System for Training LLMs](https://ui.adsabs.harvard.edu/abs/2023arXiv231010046W/abstract)
- [Enhancing Survivability in Power IoT Systems Based on Compliance Checks](https://ui.adsabs.harvard.edu/abs/2025cits.conf..174Z/abstract)
- [Towards Message Brokers for Generative AI: Survey, Challenges, and Opportunities](https://ui.adsabs.harvard.edu/abs/2023arXiv231214647S/abstract)
- [Organization-Level Identification in the Power IoT System](https://ui.adsabs.harvard.edu/abs/2025cits.conf..175G/abstract)

#### Code Intelligence Digest

- [Building a Durable Execution Engine with SQLite](https://www.morling.dev/blog/building-durable-execution-engine-with-sqlite/)
- [Durable Execution](https://www.reddit.com/r/LLMDevs/comments/1r80a04/durable_execution/)
- [Adaptive Multimodal Agents-Based Framework for Automatic Workflow Execution](https://arxiv.org/abs/2605.28607)
- [SKILL.nb: Selective Formalization and Gated Execution for Durable Agent Workflows](https://arxiv.org/abs/2606.08049)
- [Agent Workflow Memory](https://ui.adsabs.harvard.edu/abs/2024arXiv240907429Z)
- [Route by State, Recover from Trace: STAR with Failure-Aware Markov Routing for Multi-Agent Spatiotemporal Reasoning](https://arxiv.org/abs/2605.10057)

## Tool Reliability

**Question:** How should unreliable tool and retrieval calls be retried and observed?

### Findings

- **SciX:** Tool-using multi-agent large language model (LLM) systems spend computation through model tokens, tool calls, retries, and code execution before produ... ([Early Diagnosis of Wasted Computation in Multi-Agent LLM Systems via Failure-Aware Observability](https://ui.adsabs.harvard.edu/abs/2026arXiv260601365L/abstract))
- **SciX:** Tool-augmented large language model (LLM) agents rely on orchestration layers that coordinate planning, retrieval, tool invocation, validation, memory... ([Self-Healing Agentic Orchestrators for Reliable Tool-Augmented Large Language Model Systems](https://ui.adsabs.harvard.edu/abs/2026arXiv260601416B/abstract))
- **SciX:** Tools have become a mainstay of LLMs, allowing them to retrieve knowledge not in their weights, to perform tasks on the web, and even to control robot... ([Tools Fail: Detecting Silent Errors in Faulty Tools](https://ui.adsabs.harvard.edu/abs/2024arXiv240619228S/abstract))
- **SciX:** Multi-agent systems are examples of complex distributed systems enabling dynamic adaptation in providing their services. By establishing on-the-fly co... ([Goal-Oriented Modeling in Fault Tolerant Service-Oriented Multi-Agent Systems](https://ui.adsabs.harvard.edu/abs/2024cmps.conf..242T/abstract))
- **SciX:** Numerous software analysis tools exist today, yet applying them to diverse open-source projects remains challenging due to environment setup, dependen... ([Evaluating LLM Agents on Automated Software Analysis Tasks](https://ui.adsabs.harvard.edu/abs/2026arXiv260411270P/abstract))
- **SciX:** This chapter argues that the reliability of agentic and generative AI is chiefly an architectural property. We define agentic systems as goal-directed... ([Architectures for Building Agentic AI](https://ui.adsabs.harvard.edu/abs/2025arXiv251209458N/abstract))
- **Code Intelligence Digest:** arXiv:2601.06112v1 Announce Type: new Abstract: Existing benchmarks for tool-using LLM agents primarily report single-run success rates and miss reliability properties required in production. We introduce \textbf{ReliabilityBench}, a benchmark for evaluating agent reliability across three dimensions: (i) consistency under repeated execution using $\mathrm{pass}^k$, (ii) robustness to semanticall ([ReliabilityBench: Evaluating LLM Agent Reliability Under Production-Like Stress Conditions](https://arxiv.org/abs/2601.06112))
- **Code Intelligence Digest:** Multi-agent systems powered by large language models (LLMs) are transforming enterprise automation, yet systematic evaluation methodologies for assessing tool-use reliability remain underdeveloped. We introduce a comprehensive diagnostic framework that leverages big data analytics to evaluate procedural reliability in intelligent agent systems, addressing critical needs for SME-centric deployment ([When Agents Fail to Act: A Diagnostic Framework for Tool Invocation Reliability in Multi-Agent LLM Systems](https://ui.adsabs.harvard.edu/abs/2026arXiv260116280H))
- **Code Intelligence Digest:** Agentic AI transforms observability by using autonomous agents to analyze telemetry, detect issues, and execute fixes— ([Agentic AI in Observability Platforms: Empowering Autonomous SRE ](https://devops.com/agentic-ai-in-observability-platforms-empowering-autonomous-sre/))
- **Code Intelligence Digest:** arXiv:2605.06890v3 Announce Type: replace-cross Abstract: AI agents are promising for high-stakes enterprise workflows, but dependable deployment remains limited because tool-use failures are difficult to diagnose and control. Agents may skip required tool calls, invoke tools unnecessarily, or take actions whose consequence becomes visible only after execution. Existing observability methods are ([Beyond the Black Box: Interpretability of Agentic AI Tool Use](https://arxiv.org/abs/2605.06890))
- **Code Intelligence Digest:** hey everyone, been lurking but finally posting cause i'm hitting a wall with our ai projects. like, last thursday i was up till 2 am debugging why our chatbot started hallucinating responses – had to sift through logs endlesly and it just felt like guessing. observability for llm stuff is kinda a mess, right? not just logs but token usage, latency, quality scores. tools i've tried a ([agent observability – what tools work?](https://www.reddit.com/r/LLMDevs/comments/1qwfrpx/agent_observability_what_tools_work/))

### Sources

#### SciX

- [Early Diagnosis of Wasted Computation in Multi-Agent LLM Systems via Failure-Aware Observability](https://ui.adsabs.harvard.edu/abs/2026arXiv260601365L/abstract)
- [Self-Healing Agentic Orchestrators for Reliable Tool-Augmented Large Language Model Systems](https://ui.adsabs.harvard.edu/abs/2026arXiv260601416B/abstract)
- [Tools Fail: Detecting Silent Errors in Faulty Tools](https://ui.adsabs.harvard.edu/abs/2024arXiv240619228S/abstract)
- [Goal-Oriented Modeling in Fault Tolerant Service-Oriented Multi-Agent Systems](https://ui.adsabs.harvard.edu/abs/2024cmps.conf..242T/abstract)
- [Evaluating LLM Agents on Automated Software Analysis Tasks](https://ui.adsabs.harvard.edu/abs/2026arXiv260411270P/abstract)
- [Architectures for Building Agentic AI](https://ui.adsabs.harvard.edu/abs/2025arXiv251209458N/abstract)

#### Code Intelligence Digest

- [ReliabilityBench: Evaluating LLM Agent Reliability Under Production-Like Stress Conditions](https://arxiv.org/abs/2601.06112)
- [When Agents Fail to Act: A Diagnostic Framework for Tool Invocation Reliability in Multi-Agent LLM Systems](https://ui.adsabs.harvard.edu/abs/2026arXiv260116280H)
- [Agentic AI in Observability Platforms: Empowering Autonomous SRE ](https://devops.com/agentic-ai-in-observability-platforms-empowering-autonomous-sre/)
- [Beyond the Black Box: Interpretability of Agentic AI Tool Use](https://arxiv.org/abs/2605.06890)
- [agent observability – what tools work?](https://www.reddit.com/r/LLMDevs/comments/1qwfrpx/agent_observability_what_tools_work/)

## State And Memory

**Question:** Where is the boundary between orchestration state and research artifacts?

### Findings

- **SciX:** We present ScienceClaw + Infinite, a framework for autonomous scientific investigation in which independent agents conduct research without central co... ([Autonomous Agents Coordinating Distributed Discovery Through Emergent Artifact Exchange](https://ui.adsabs.harvard.edu/abs/2026arXiv260314312W/abstract))
- **SciX:** AI agents hold growing promise for accelerating scientific discovery; yet, a lack of frontier evaluations hinders adoption into real workflows. Expert... ([COMPOSITE-Stem](https://ui.adsabs.harvard.edu/abs/2026arXiv260409836W/abstract))
- **SciX:** Large Language Models (LLMs) and other foundation models are increasingly used as the core of AI agents. In agentic workflows, these agents plan tasks... ([PROV-AGENT: Unified Provenance for Tracking AI Agent Interactions in Agentic Workflows](https://ui.adsabs.harvard.edu/abs/2025arXiv250802866S/abstract))
- **SciX:** As artificial intelligence (AI) systems grow more powerful, autonomous, and embedded in critical infrastructure, their identification and traceability... ([AI Identification: An Integrated Framework for Sustainable Governance in Digital Enterprises](https://ui.adsabs.harvard.edu/abs/2026arXiv260410473G/abstract))
- **SciX:** Large language model (LLM) applications increasingly use explicit workflows for tool use, retrieval, branching, checkpointing, and human approval. Exi... ([Workflow as Knowledge: Semantic Persistence for LLM-Mediated Workflows](https://ui.adsabs.harvard.edu/abs/2026arXiv260708740Q/abstract))
- **SciX:** Numerous software analysis tools exist today, yet applying them to diverse open-source projects remains challenging due to environment setup, dependen... ([Evaluating LLM Agents on Automated Software Analysis Tasks](https://ui.adsabs.harvard.edu/abs/2026arXiv260411270P/abstract))
- **Code Intelligence Digest:** arXiv:2504.12612v2 Announce Type: replace-cross Abstract: Provenance is the chronological history of things, resonating with the fundamental pursuit to uncover origins, trace connections, and situate entities within the flow of space and time. As artificial intelligence advances towards autonomous agents capable of interactive collaboration on complex tasks, the provenance of generated content b ([Chronology of Multi-Agent Interactions for Provenance of Evolving Information](https://arxiv.org/abs/2504.12612))
- **Code Intelligence Digest:** arXiv:2604.21936v1 Announce Type: new Abstract: Medical imaging research is increasingly shifting from controlled benchmark evaluation toward real-world clinical deployment. In such settings, applying analytical methods extends beyond model design to require dataset-aware workflow configuration and provenance tracking. Two requirements therefore become central: \textbf{adaptability}, the ability ([An Artifact-based Agent Framework for Adaptive and Reproducible Medical Image Processing](https://arxiv.org/abs/2604.21936))
- **Code Intelligence Digest:** arXiv:2603.21692v1 Announce Type: cross Abstract: As AI agents transition from human-supervised copilots to autonomous platform infrastructure, the ability to analyze their reasoning behavior across populations of investigations becomes a pressing infrastructure requirement. Existing operational tooling addresses adjacent needs effectively: state checkpoint systems enable fault tolerance; observ ([Reasoning Provenance for Autonomous AI Agents: Structured Behavioral Analytics Beyond State Checkpoints and Execution Traces](https://arxiv.org/abs/2603.21692))
- **Code Intelligence Digest:** Despite the growing capabilities of autonomous agents powered by large language models (LLMs), their adoption in high-stakes domains remains limited. A key barrier is security: the inherently nondeterministic behavior of LLM agents defies static auditing approaches that have historically underpinned software assurance. Existing security methods, such as proxy-level input filtering and model glassb ([AgentTrace: A Structured Logging Framework for Agent System Observability](https://ui.adsabs.harvard.edu/abs/2026arXiv260210133A))

### Sources

#### SciX

- [Autonomous Agents Coordinating Distributed Discovery Through Emergent Artifact Exchange](https://ui.adsabs.harvard.edu/abs/2026arXiv260314312W/abstract)
- [COMPOSITE-Stem](https://ui.adsabs.harvard.edu/abs/2026arXiv260409836W/abstract)
- [PROV-AGENT: Unified Provenance for Tracking AI Agent Interactions in Agentic Workflows](https://ui.adsabs.harvard.edu/abs/2025arXiv250802866S/abstract)
- [AI Identification: An Integrated Framework for Sustainable Governance in Digital Enterprises](https://ui.adsabs.harvard.edu/abs/2026arXiv260410473G/abstract)
- [Workflow as Knowledge: Semantic Persistence for LLM-Mediated Workflows](https://ui.adsabs.harvard.edu/abs/2026arXiv260708740Q/abstract)
- [Evaluating LLM Agents on Automated Software Analysis Tasks](https://ui.adsabs.harvard.edu/abs/2026arXiv260411270P/abstract)

#### Code Intelligence Digest

- [Chronology of Multi-Agent Interactions for Provenance of Evolving Information](https://arxiv.org/abs/2504.12612)
- [An Artifact-based Agent Framework for Adaptive and Reproducible Medical Image Processing](https://arxiv.org/abs/2604.21936)
- [Reasoning Provenance for Autonomous AI Agents: Structured Behavioral Analytics Beyond State Checkpoints and Execution Traces](https://arxiv.org/abs/2603.21692)
- [AgentTrace: A Structured Logging Framework for Agent System Observability](https://ui.adsabs.harvard.edu/abs/2026arXiv260210133A)

## Evaluation

**Question:** How do we test that recovery preserves correctness rather than only completion?

### Findings

- **SciX:** Memory is becoming a core component of long-horizon AI agents, allowing agents to reuse past experience when operating web browsers, software tools, a... ([The Compliance Trap: Diagnosing How AI Agents Consume Conflicting Memory](https://ui.adsabs.harvard.edu/abs/2026arXiv260710608C/abstract))
- **SciX:** LLM agents can fail silently by asserting task completion when the environment state shows otherwise. We study this failure mode, false success, acros... ([From Confident Closing to Silent Failure: Characterizing False Success in LLM Agents](https://ui.adsabs.harvard.edu/abs/2026arXiv260609863A/abstract))
- **SciX:** Small language models are attractive for production deployment due to their low cost, fast inference, and ease of specialization. However, adapting th... ([Pioneer Agent: Continual Improvement of Small Language Models in Production](https://ui.adsabs.harvard.edu/abs/2026arXiv260409791A/abstract))
- **SciX:** Large Language Model (LLM)-based agents are increasingly adopted in high-stakes settings, but current benchmarks evaluate mainly whether a task was co... ([Beyond Task Completion: Revealing Corrupt Success in LLM Agents through Procedure-Aware Evaluation](https://ui.adsabs.harvard.edu/abs/2026arXiv260303116C/abstract))
- **SciX:** This report introduces a new family of multimodal models, Gemini, that exhibit remarkable capabilities across image, audio, video, and text understand... ([Gemini: A Family of Highly Capable Multimodal Models](https://ui.adsabs.harvard.edu/abs/2023arXiv231211805G/abstract))
- **SciX:** Agent benchmarks typically report only final outcomes: pass or fail. This threatens evaluation credibility in three ways. First, scores may be inflate... ([Log analysis is necessary for credible evaluation of AI agents](https://ui.adsabs.harvard.edu/abs/2026arXiv260508545K/abstract))
- **Code Intelligence Digest:** When we started running agents in real workflows, the hardest incidents were not the ones that failed loudly. They were the ones we could not reproduce. A bad outcome happens in production. You run the same workflow again. It “works”. That is not recovery. It is the system changing underneath you. A few patterns kept repeating: The world changes between at ([Replay is not re-execution. The reproducibility gap in production agents](https://www.reddit.com/r/LLMDevs/comments/1r0fzyc/replay_is_not_reexecution_the_reproducibility_gap/))
- **Code Intelligence Digest:** When multi-agent systems (MAS) fail, identifying where the decisive error occurred is the first step for automated recovery to an earlier state. Error attribution remains a fundamental challenge due to the long interaction traces that large language model-based MAS generate. This paper presents a framework for error attribution based on conformal prediction (CP) which provides finite-sample, distr ([Conformal Agent Error Attribution](https://ui.adsabs.harvard.edu/abs/2026arXiv260506788F))
- **Code Intelligence Digest:** arXiv:2603.21357v1 Announce Type: new Abstract: LLM agents fail on the majority of real-world tasks -- GPT-4o succeeds on fewer than 15% of WebArena navigation tasks and below 55% pass@1 on ToolBench (Zhou et al., 2024; Qin et al., 2024) -- yet every failed trajectory is routinely discarded, wasting the dominant source of collected experience. We introduce AgentHER, a framework that recovers thi ([AgentHER: Hindsight Experience Replay for LLM Agent Trajectory Relabeling](https://arxiv.org/abs/2603.21357))
- **Code Intelligence Digest:** arXiv:2601.15322v2 Announce Type: replace Abstract: LLM agents struggle with regulatory audit replay: when asked to reproduce a flagged transaction decision with identical inputs, many deployments fail to return consistent results. We introduce the Determinism-Faithfulness Assurance Harness (DFAH), a framework for measuring trajectory determinism, decision determinism, and evidence-conditioned f ([Replayable Financial Agents: A Determinism-Faithfulness Assurance Harness for Tool-Using LLM Agents](https://arxiv.org/abs/2601.15322))
- **Code Intelligence Digest:** software engineers have had regression tests and release gates forever. AI agent teams are shipping without equivalent tooling and catching failures from user complaints instead of tests. built replayd to close this gap. failed agent run becomes a regression test. replay before every deploy. if the failure returns after a prompt, model, or tool change, exit 1 blocks the deploy. ([CI/CD for AI agents , open source SDK that turns failed runs into regression tests](https://www.reddit.com/r/SoftwareEngineering/comments/1tsgh7s/cicd_for_ai_agents_open_source_sdk_that_turns/))

### Sources

#### SciX

- [The Compliance Trap: Diagnosing How AI Agents Consume Conflicting Memory](https://ui.adsabs.harvard.edu/abs/2026arXiv260710608C/abstract)
- [From Confident Closing to Silent Failure: Characterizing False Success in LLM Agents](https://ui.adsabs.harvard.edu/abs/2026arXiv260609863A/abstract)
- [Pioneer Agent: Continual Improvement of Small Language Models in Production](https://ui.adsabs.harvard.edu/abs/2026arXiv260409791A/abstract)
- [Beyond Task Completion: Revealing Corrupt Success in LLM Agents through Procedure-Aware Evaluation](https://ui.adsabs.harvard.edu/abs/2026arXiv260303116C/abstract)
- [Gemini: A Family of Highly Capable Multimodal Models](https://ui.adsabs.harvard.edu/abs/2023arXiv231211805G/abstract)
- [Log analysis is necessary for credible evaluation of AI agents](https://ui.adsabs.harvard.edu/abs/2026arXiv260508545K/abstract)

#### Code Intelligence Digest

- [Replay is not re-execution. The reproducibility gap in production agents](https://www.reddit.com/r/LLMDevs/comments/1r0fzyc/replay_is_not_reexecution_the_reproducibility_gap/)
- [Conformal Agent Error Attribution](https://ui.adsabs.harvard.edu/abs/2026arXiv260506788F)
- [AgentHER: Hindsight Experience Replay for LLM Agent Trajectory Relabeling](https://arxiv.org/abs/2603.21357)
- [Replayable Financial Agents: A Determinism-Faithfulness Assurance Harness for Tool-Using LLM Agents](https://arxiv.org/abs/2601.15322)
- [CI/CD for AI agents , open source SDK that turns failed runs into regression tests](https://www.reddit.com/r/SoftwareEngineering/comments/1tsgh7s/cicd_for_ai_agents_open_source_sdk_that_turns/)
