# Code Intel Digest — Multi-Agent Orchestration, Episode 2: Patterns & Frameworks

**Episode date:** 2026-06-08
**Series:** Multi-Agent Orchestration (2 of 5)
**Data through:** SciX primary sources + industry sources
**Target runtime:** ~20 minutes (~3,000 words spoken)
**Segments:** 6 + cold open + outro

---

## COLD OPEN

Picture two engineers building the same customer-service bot. Same set of agents, same underlying model, same tasks. The only thing they do differently is how the agents talk to each other. One of them serializes every message between agents down to plain text — a photo of a cracked phone screen becomes the words "the screen is cracked." The other keeps the image intact and passes it along. Then they run the benchmark. The text-only version completes thirty-two percent of tasks. The image-preserving version completes fifty-two. Twenty points of difference, and the model never changed. The wiring changed.

That experiment comes from a twenty twenty-six study called M-M-A-2-A, and it is the whole point of this episode in a single number. In multi-agent systems, the pattern you choose — how control and information move between agents — is not a deployment detail. It is the program.

---

## INTRO

Welcome back to the Multi-Agent Orchestration deep dive. This is episode two of five, and it's about vocabulary and tooling. Last time we set the stage. Today we get specific about the small set of coordination patterns that every multi-agent system is built from, and the frameworks that encode them.

Here's the claim we're going to defend. Multi-agent orchestration is not a grab-bag of clever tricks. It is a tiny vocabulary of patterns — four of them, mostly — that every framework re-implements in its own dialect. Planning and decomposition. Routing and handoffs. Debate and voting. And role specialization. Once you can name those four, the parade of frameworks — AutoGen, MetaGPT, CAMEL, ChatDev, AgentVerse, and the vendor toolkits like LangGraph and CrewAI — stops looking like chaos and starts looking like a handful of ideas wearing different costumes. We'll also cover the connective tissue: the interop protocols, MCP and A2A, that let agents and tools find each other at all. Let's start with the oldest pattern in the book.

---

## SEGMENT 1 — Role specialization: the org chart as program

The oldest pattern in this corpus is role specialization: you give each agent a job — architect, developer, tester — and you let the org chart do the coordinating. The founding move came from CAMEL, a twenty twenty-three paper by Guohao Li and colleagues. CAMEL introduced what they called inception, or role-play, prompting: an A-I user and an A-I assistant prompt each other into staying on task, so the conversation doesn't drift the way a single chatbot talking to itself tends to.

From there the pattern hardened fast. MetaGPT, from Sirui Hong and collaborators, took role-play and gave it bureaucracy — in a good way. MetaGPT encodes Standard Operating Procedures and routes everything through a shared message pool, so the role agents publish structured artifacts — product requirement docs, designs, actual code — instead of just chatting. The architect doesn't tell the developer what to build in prose; it hands over a design document. ChatDev, from Chen Qian and team, organized a whole virtual software company as a chat-chain: a sequence of phase-scoped, two-agent dialogues, design then code then test. And AgentVerse, from Weize Chen and colleagues, went the other direction and studied what emerges when role agents work as an unscripted group — the collaborative behaviors you don't design but get anyway.

If you want one mental model to hold all of these, take it from Junwei Wang and colleagues' twenty twenty-four survey of agents in software engineering: every agent is perception, memory, and action. That's it. A role is just a particular configuration of those three modules pointed at a particular job.

Now the dissent. Baking the org chart in is a choice, and it might be the wrong default. A twenty twenty-six system called OneManCompany, from a team led by Yang, argues the organization should be a separate concern from what each agent knows. It packages skills, tools, and config into portable identities it calls Talents, recruited on demand from a Talent Market. Fixed crews give way to dynamically recruited workforces. The contest there is hand-designed topology versus market-recruited topology.

The concrete takeaway: when you reach for role specialization, ask whether your roles are stable enough to hardcode. If the task mix shifts week to week, a fixed org chart becomes a liability, and a recruit-on-demand model may serve you better.

---

## SEGMENT 2 — Planning and decomposition: the orchestrator pattern

The second pattern is planning and decomposition, and the cleanest reference architecture for it is Magentic-One, from Adam Fourney and colleagues at Microsoft Research, twenty twenty-four. The shape is orchestrator-worker. A lead agent maintains two things: a task ledger, which is the plan, and a progress ledger, which is the running state of who's done what. It dispatches to specialized workers — a web surfer, a coder, a file navigator — and, crucially, when it gets stuck, it re-plans. The ledger isn't written once; it's revised as the work reveals what the plan got wrong.

That re-planning loop is the heart of the pattern. A single LLM call has one context window and one shot. An orchestrator gets to decompose a goal into sub-tasks, watch them play out, and adjust. The promise is longer-horizon work than a monolith can manage.

There's a refinement worth naming. The basic orchestrator runs sub-tasks in a chat sequence, one after another, even when they don't depend on each other. DynTaskMAS, from a team led by Yu in twenty twenty-five, pushes decomposition toward an asynchronous task-graph, so independent sub-tasks run in parallel instead of waiting in line. If your sub-tasks are genuinely independent, a sequence is just latency you chose to pay.

Here's the deeper point, and it's the load-bearing idea of the whole episode. The topology — the shape of who talks to whom — is itself a performance lever, not an afterthought. Zhou and colleagues, in a twenty twenty-five paper on multi-agent design, show that when you jointly optimize prompts and topologies, the topology is a first-class variable. And the most vivid demonstration is a system called SOEN-101, also published as FlowGen, from a team led by Lu in twenty twenty-four. They took the exact same role agents — requirement engineer, architect, developer, tester, scrum master — and wired them into three different software-process topologies: Waterfall, test-driven development, and Scrum. Same agents, same model. The Scrum wiring produced different code quality than the Waterfall wiring. The communication pattern was the variable.

So the takeaway: the org chart is literally the program. When you're decomposing a task, treat the topology — sequential versus graph, who reports to whom — as a thing you tune and measure, not a thing you inherit from whatever the framework's tutorial happened to use.

---

## SEGMENT 3 — Routing and handoffs: the information topology

The third pattern is routing — passing control, and context, to a specialist — and it's the one the vendors have converged on as the primitive. The research anchor for dynamic routing is DyLAN, from a team led by Liu in twenty twenty-three, short for Dynamic L-L-M-powered Agent Network. The idea is that agents get activated and connected based on the task in front of them, rather than wired in a fixed graph ahead of time. The network reshapes itself per query.

But the sharpest reframing of routing comes back to that cold-open study, M-M-A-2-A, from a team led by S in twenty twenty-six. Their insight is that routing isn't just about which agent gets control. It's about the information topology of the network: which evidence reaches which agent, at what fidelity, at the moment a decision gets made. Their failure pattern has a name worth keeping — the text-bottleneck pipeline. You serialize every inter-agent message to text, and in doing so you throw away everything that wasn't words: the image, the tone, the spatial layout. The downstream agent decides on a degraded copy of reality.

The contrast here is the most important nuance in the episode, so stay with me. Richer is not universally better. M-M-A-2-A includes a case they label defect zero-zero-six, where the high-fidelity image actually hurt. A crisp defect characterization led the agent to over-act — it moved to initiate a replacement — when company policy required escalating to a human instead. The lossy text baseline, working with less, happened to get it right. The lesson is genuinely counterintuitive: higher-fidelity inputs can narrow the correct decision space when the right answer depends on a procedural constraint, not on perception. More information made the agent more confident and more wrong.

The takeaway: treat routing as a first-order design variable. Decide deliberately which evidence reaches which agent and at what fidelity — and don't assume more is always better. Where the answer hinges on policy rather than perception, a richer signal can mislead.

---

## SEGMENT 4 — Debate and voting: cheaper disagreement

The fourth pattern is debate, and it has a clear origin: Yilun Du and colleagues, twenty twenty-three. The setup is almost embarrassingly simple. You run multiple LLM instances. They each propose an answer, then they read each other's answers, critique them, and revise — across several rounds. Du and team showed that this back-and-forth measurably improves factuality and reasoning. Disagreement, structured properly, catches errors a single pass misses. It's the multi-agent version of "show your work to a skeptical colleague."

The catch is cost, and it's a brutal one. Naive debate is all-to-all: every agent reads every other agent's full output, every round. The token count scales badly — quadratically in the number of agents, multiplied by the number of rounds. Debate gets expensive faster than almost any other pattern.

Which is where the standing rebuttal comes in. Li and colleagues, in a twenty twenty-four paper on multi-agent debate with sparse communication topology, showed you don't need everyone talking to everyone. If you thin out the communication graph — let each agent see only a few neighbors instead of all of them — you preserve most of the reasoning benefit at a fraction of the token cost. The dense, all-to-all default turns out to be wasteful. The signal survives a sparser network.

There's a quieter contrast lurking here too. Debate improves reasoning, but it's worth being honest that not every aggregation problem is a reasoning problem. The M-M-A-2-A error analysis found that eighty-three percent of its remaining failures originated in the reasoning layer — in shallow knowledge retrieval — not in the coordination layer. More agents arguing doesn't fix an agent that simply doesn't know the fact. Debate sharpens reasoning; it doesn't manufacture knowledge that was never retrieved.

The takeaway: debate is a real tool for factuality and reasoning, but reach for the sparse topology, not the dense one, and gate it by task criticality. Don't pay all-to-all token costs on tasks where a single confident pass would do — and don't expect debate to rescue a retrieval problem.

---

## SEGMENT 5 — Frameworks: where the vocabulary ships

So we have four patterns. Now, the frameworks — because frameworks exist to make composing those patterns cheap. In the research corpus, the foundational one is AutoGen, from Qingyun Wu and colleagues, twenty twenty-three, built around the abstraction of conversable agents — agents whose primary interface is sending each other messages. With roughly six hundred citations, it's the single most influential framework paper in this space. MetaGPT, CAMEL, ChatDev, AgentVerse, and Magentic-One all live in this research lineage too; we've met them already.

A strong newer anchor is OpenHands — originally OpenDevin — from a team led by Wang, twenty twenty-four. It's a generalist code-agent platform with explicit multi-agent coordination and sandboxed execution. Think of it as the bridge from patterns to systems developers actually run: not a paper diagram, but a thing you can point at a repository.

Now the external, vendor frameworks — and these you cite by name and documentation, not by paper. LangGraph, from LangChain, models your system as a graph of typed state-graph nodes and edges, with checkpointing and human-in-the-loop interrupts built in. CrewAI gives you role-based crews — you can stand up a working crew in well under twenty lines of code. And OpenAI's Swarm, which was a late-twenty-twenty-four experiment, made handoffs the core primitive: one agent explicitly hands the conversation to another. Swarm got productionized in early twenty twenty-five as the OpenAI Agents SDK, with guardrails and tracing added.

Here's the contrast worth airing — a clean "research graduates into vendor product" beat. In October twenty twenty-five, Microsoft introduced the Microsoft Agent Framework, which absorbs AutoGen. AutoGen — the most-cited framework in the academic corpus — is now officially in maintenance mode. That's the tension in miniature: the patterns the open research vocabulary pioneered are being re-implemented and locked into proprietary vendor SDKs. The ideas stay open; the encodings of them increasingly don't.

The takeaway: pick the pattern before the framework. Decompose your problem into the four primitives first — decomposition, routing, debate, role specialization — and only then pick the tool whose dialect fits. And for anything heading to production, watch the vendor consolidation, because that's where the research vocabulary is actually shipping now.

---

## SEGMENT 6 — Interop protocols: how agents and tools find each other

A pattern is worthless if your agents can't actually reach each other or their tools. That's the connective tissue, and the stack has converged on a small set of protocols. The first is MCP, the Model Context Protocol, which standardizes how an agent invokes a tool — a client-server arrangement over J-S-O-N remote procedure calls. The corpus anchor is Hou and colleagues' twenty twenty-five landscape-and-security survey of MCP, which is worth flagging precisely because it's as much about the security threat surface as the design. Standardizing tool access also standardizes the attack surface.

The second is A2A, Agent-to-Agent, originally from Google and now stewarded by the Linux Foundation as of twenty twenty-five. Where MCP is agent-to-tool, A2A is agent-to-agent: collaborative task execution. Its nice idea is the Agent Card — a J-S-O-N capability descriptor that an agent publishes at a well-known U-R-L, literally a path called dot-well-known slash agent-card dot json. Another agent can fetch that card and learn what this one can do, and exchange typed message parts with it. It's a business card for software. There are others circling — ACP, from IBM, is RESTful multipart messaging; ANP targets decentralized agent marketplaces; and MPAC, from a team led by Qian in twenty twenty-six, sits above all of these as a multi-principal coordination layer.

So which do you adopt, and when? Here the best guidance comes from a survey that's worth naming even though it's outside our core corpus: Ehtesham, Singh, Gupta, and Kumar's twenty twenty-five Survey of Agent Interoperability Protocols, covering MCP, ACP, A2A, and ANP. They propose a phased roadmap, and it's sensible: adopt MCP first, for tool access, because that's the immediate, concrete win. Then layer in ACP or A2A for inter-agent messaging once you actually have multiple agents that need to discover and talk to each other. Don't reach for the inter-agent protocol before you have the inter-agent problem.

One small, practical note from the M-M-A-2-A thread that ties this whole episode together. A2A Agent Cards already carry fields called input-modes and output-modes — declarations of what fidelity of information an agent can send and receive. Today those fields are under-used discovery metadata. But they're exactly the lever for avoiding the text-bottleneck failure: an agent could check whether the next one can even accept an image before it bothers degrading reality into words.

The takeaway: use the converged protocols, in order. MCP for tools first, A2A Agent Cards for inter-agent capability declaration second — and lean on those input-mode and output-mode fields, because the metadata to prevent your worst routing failure is already in the spec.

---

## OUTRO

So, to recap. Four patterns: decomposition, routing, debate, and role specialization. Every framework — AutoGen, MetaGPT, CAMEL, ChatDev, LangGraph, CrewAI, the OpenAI Agents SDK — is a particular encoding of those four. The topology is the program: SOEN-101 proved it with Waterfall versus Scrum, and M-M-A-2-A proved that a routing choice alone can swing accuracy twenty points. And the connective tissue is converging on MCP for tools and A2A for agents.

The one thing to watch: the Microsoft Agent Framework absorbing AutoGen into maintenance mode — the research vocabulary hardening into vendor SDKs. The one concrete action: before you pick a framework, write down which of the four patterns your task actually needs. Pick the pattern first. Next episode, we get into failure modes — why these systems break. See you there.

---

## Citations

| # | Title | Author/Org | Year | bibcode/URL |
|---|-------|-----------|------|-------------|
| 1 | MMA2A — modality-native routing; two-layer requirement (CrossModal-CS) | S et al. | 2026 | 2026arXiv260412213S |
| 2 | Multi-Agent Design: Optimizing Prompts and Topologies | Zhou et al. | 2025 | 2025arXiv250202533Z |
| 3 | SOEN-101 / FlowGen — software-process topologies → code quality | Lu et al. | 2024 | 2024arXiv240315852L |
| 4 | CAMEL — Communicative Agents for Mind Exploration (inception/role-play) | Li et al. | 2023 | 2023arXiv230317760L |
| 5 | MetaGPT — Meta Programming for a Multi-Agent Collaborative Framework | Hong et al. | 2023 | 2023arXiv230800352H |
| 6 | ChatDev — Communicative Agents for Software Development (chat-chain) | Qian et al. | 2023 | 2023arXiv230707924Q |
| 7 | AgentVerse — Multi-Agent Collaboration & Emergent Behaviors | Chen et al. | 2023 | 2023arXiv230810848C |
| 8 | Agents in Software Engineering (perception/memory/action) | Wang et al. | 2024 | 2024arXiv240909030W |
| 9 | Magentic-One — Generalist Multi-Agent System (orchestrator-worker, task ledger) | Fourney et al. | 2024 | 2024arXiv241104468F |
| 10 | DynTaskMAS — Dynamic Task-Graph LLM-MAS (async parallel) | Yu et al. | 2025 | 2025arXiv250307675Y |
| 11 | DyLAN — Dynamic LLM-Powered Agent Network (topology/routing) | Liu et al. | 2023 | 2023arXiv231002170L |
| 12 | Improving Factuality & Reasoning through Multiagent Debate (origin) | Du et al. | 2023 | 2023arXiv230514325D |
| 13 | Multi-Agent Debate with Sparse Communication Topology (cost) | Li et al. | 2024 | 2024arXiv240611776L |
| 14 | AutoGen — Multi-Agent Conversation (conversable agents) | Wu et al. | 2023 | 2023arXiv230808155W |
| 15 | OpenHands / OpenDevin — generalist code-agent platform | Wang et al. | 2024 | 2024arXiv240716741W |
| 16 | OneManCompany — Talent Market; org above team | Yang et al. | 2026 | 2026arXiv260422446Y |
| 17 | Model Context Protocol (MCP): Landscape & Security Threats | Hou et al. | 2025 | 2025arXiv250323278H |
| 18 | MPAC — Multi-Principal Agent Coordination Protocol | Qian et al. | 2026 | 2026arXiv260409744Q |
| 19 | LLM-based Multi-Agents: A Survey of Progress and Challenges | Guo et al. | 2024 | 2024arXiv240201680G |
| 20 | Beyond Individual Intelligence — LIFE taxonomy | Q et al. | 2026 | 2026arXiv260514892Q |
| 21 | A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, ANP | Ehtesham, Singh, Gupta, Kumar | 2025 | arXiv:2505.02279 |
| 22 | LangGraph (typed StateGraph, checkpointing, HITL) | LangChain | 2025 | https://www.langchain.com/langgraph |
| 23 | CrewAI (role-based crews) | CrewAI Inc. | 2025 | https://github.com/crewAIInc/crewAI |
| 24 | OpenAI Swarm → Agents SDK (handoffs primitive) | OpenAI | 2025 | https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf ; https://morphllm.com/openai-swarm |
| 25 | Microsoft Agent Framework (AutoGen now maintenance mode) | Microsoft | 2025 | https://devblogs.microsoft.com/foundry/introducing-microsoft-agent-framework-the-open-source-engine-for-agentic-ai-apps/ |

---
*Generated for the Multi-Agent Orchestration deep-dive series from SciX primary sources + industry sources.*
