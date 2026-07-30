# Code Intel Digest — Multi-Agent Orchestration, Episode 3: Memory in Multi-Agent Systems

**Episode date:** 2026-06-08
**Series:** Multi-Agent Orchestration (3 of 5)
**Data through:** SciX primary sources + industry sources
**Target runtime:** ~20 minutes (~3,000 words spoken)
**Segments:** 6 + cold open + outro

---

## COLD OPEN

Take two agents that are good at their jobs and wire them into a loop. The first one's output becomes the second one's input, and the second one's output feeds right back into the first. Intuition says you have just built a perpetual reasoning machine, a closed circuit of thought that never has to stop. Free competence, forever. That is not what happens. In the paper called "Theater of Mind" for large language models, Shang and colleagues describe exactly this setup and report that the system rapidly descends into a state of cognitive stagnation. The two agents start agreeing with each other for the sake of agreeing. They flatter. They build an echo chamber. One of them hallucinates and the other one nods along and amplifies it, and the whole thing degenerates into mutually reinforcing confidence about nothing. The loop does not produce thought. It produces sycophancy. And the reason it fails is the subject of this entire episode. It is a memory problem. There is no shared substrate worth writing to, and no governance over what gets written.

---

## INTRO

Welcome back to the Multi-Agent Orchestration series. In episode one we mapped topologies and how agents are wired together. In episode two we walked through coordination patterns and the frameworks that implement them. Today we go down a layer, to the thing all of that sits on top of: memory. And this is the episode where this series fuses with our other show, the Agentic Memory Research Frontier. Here is the distinction that organizes everything. The single-agent memory question is, how does one agent remember across turns and across sessions? That is the agentic-memory series. The multi-agent memory question is different and harder. What is the shared substrate a whole team writes to, who governs it, and how do conventions and identity precipitate out of it? Over six segments we will cover why a team has no shared mind by default, the full stack of shared substrate from KV caches up to institutional norms, the fix for passive blackboards, consolidation made executable, the live shared-versus-specialized debate, and what actually works in production. Let us get into it.

---

## SEGMENT 1 — A team has no shared mind by default

Start with the thing that is easy to forget once you have a clever orchestration diagram on the whiteboard. A multi-agent system has no shared mind. There is no team consciousness that just exists. Each agent, in the framing from the "Theater of Mind" paper by Shang and colleagues, is a bounded-input bounded-output box. It sits dormant until something prompts it, it computes a localized response, and then it goes right back to being passive. Nothing persists in it between calls that the team can see. So coordination is not a property the system has. Coordination has to be manufactured, out of whatever substrate the agents can actually read from and write to.

Now here is the trap, and almost every production team walks into it. The obvious substrate is a passive shared message pool. Every agent posts its messages into a common space, and every agent reads from that space. This is a real and respected lineage. MetaGPT, from Hong and colleagues in twenty twenty-three, formalized the shared message pool as a core abstraction. And it descends from something older still, the classic blackboard architecture that Craig wrote up in his book Blackboard Systems back in nineteen eighty-eight, a shared structure that specialist modules read from and write to. So this is not a naive idea. It is the canonical idea.

And it is exactly what fails in the closed loop from the cold open. The agents poll a passive structure. Nothing is pushing them to engage critically with what is there. So they converge on social conformity over critical engagement. They agree because agreeing is the path of least resistance when you are just reading a pool and adding to it. The loop dies, not from a bug, but from the structure of the substrate itself.

Here is the contrast worth holding onto. The problem is not that the agents share memory. Sharing is necessary. The problem is that the sharing is passive. A bulletin board nobody is required to react to is not coordination, it is a pile of notes. The takeaway for this segment: when you build a multi-agent system, your first design decision is not the topology and it is not the framework, it is the shared substrate, because that substrate is the only place a team mind can live, and a passive one will quietly rot the whole system from the inside.

---

## SEGMENT 2 — The full stack of shared substrate

So if shared substrate is the thing, let us be precise about what it actually is, because team memory is not one thing. It is a stack of tiers, from raw attention state at the bottom up to institutional norms at the top. Five tiers, and each one is a real research line.

At the very bottom is substrate-level memory, sharing the literal attention state rather than text. DroidSpeak, from Liu and colleagues in twenty twenty-four, shows that when your agents are all built on the same base model, you can share the key-value caches across them and cut the cost of cross-model communication. That is shared memory in its most literal, lowest-latency form. You are not passing words between agents, you are passing the computed attention itself. And the safety counterweight arrived right behind it. LCGuard, from Asif and colleagues in twenty twenty-six, treats those shared key-value representations as an attack surface that has to be guarded, because anything you share is also something that can be poisoned.

One tier up is the ledger or blackboard, the shared scratchpad of the current task. Magentic-One, from Fourney and colleagues in twenty twenty-four, has its orchestrator maintain a task and progress ledger that the workers read and the orchestrator rewrites. ARIADNE, from Wei and colleagues in twenty twenty-six, drives Monte Carlo tree search over a shared blackboard. This is the working-state tier, and it is also exactly the tier that "Theater of Mind" indicts as passive and stagnation-prone.

The third tier is the knowledge graph, structured collective memory. Yang and colleagues in twenty twenty-five built decentralized generative agents that maintain a shared, adaptive, hierarchical knowledge graph as collective memory, so structured facts persist and compose across agents instead of living as loose text. SHIMI, from Helmi and colleagues in twenty twenty-five, builds a semantic hierarchical memory index and synchronizes it across nodes with a Merkle-DAG plus CRDT scheme, so the shared store converges without any central coordinator.

The fourth tier is workflow or procedural memory, reusable how-to. And the fifth tier, at the top, is institutional memory, norms and identity. We are going to give both of those their own treatment, the workflow tier in segment four and the institutional tier in segment six, because they are where the most interesting recent work lives. The takeaway here: when someone says shared memory, ask which tier. KV cache, ledger, knowledge graph, workflow, or institution. They are not interchangeable, and a serious system uses several of them at once.

---

## SEGMENT 3 — From blackboard to global workspace

Now the fix. If a passive blackboard degenerates, what replaces it? The "Theater of Mind" paper by Shang and colleagues has a proposal, and its section is literally titled, From Blackboard to the Global Workspace. They port Baars' Global Workspace Theory, a theory of consciousness from nineteen ninety-seven, into a multi-agent architecture, and they call the result Global Workspace Agents.

Here is the mechanism, and it is concrete. Instead of agents polling a passive pool, there is a central broadcast hub. Every time the shared state updates, the hub pushes that update to all connected agents as an event-driven activation signal. The sharing becomes active. You do not read the board when you happen to look at it, the board reaches out and pokes you. That alone changes the dynamics, because now every agent is reacting to the freshest state rather than to a stale snapshot it pulled whenever.

But broadcast alone does not break an echo chamber, so there is a second piece, and this is the clever one. An entropy-based intrinsic drive. The system measures the semantic diversity of what the agents are producing. When that diversity collapses, when the swarm is converging toward a single cluster, the same answer over and over, the drive raises the generation temperature to mechanically re-inject variety and break the deadlock. It is a thermostat for groupthink. When the team starts agreeing too much, the system literally heats it up until the agents diverge again.

And the third piece is the memory design, which is where this rejoins the agentic-memory series directly. Memory is bifurcated into two layers. A short-term high-speed cache that overwrites itself with a dense semantic summary the moment it exceeds a token budget. And a long-term vector archive that permanently stores what the paper calls structured experiential knowledge, critical algorithmic decisions, and generalized heuristic lessons. Hold onto that split, short-term overwrites, long-term permanently archives, because that is the consolidation operation from our agentic-memory series, realized inside a running team. It is the difference between scratch paper and the permanent record.

Now the contrast. The Magentic-One ledger and the ARIADNE blackboard we mentioned earlier sit on the passive side of this exact line. They are not wrong, they are vulnerable. The takeaway: if you use a ledger or a blackboard, do not let writes be passive. Make them broadcast or notify, and build in an explicit diversity check that can break a deadlock, because without one, a shared workspace is just a faster road to the same echo chamber.

---

## SEGMENT 4 — Consolidation, made executable, and the workflow tier

Let us make the consolidation idea executable, because the cleanest crossover from the agentic-memory series is a single recent system. Auto-Dreamer, from Ye and colleagues in twenty twenty-six. It invokes Complementary Learning Systems theory by name, the McClelland, McNaughton and O'Reilly framework from nineteen ninety-five, the brain's split between a fast hippocampal learner and a slow cortical consolidator. And Auto-Dreamer uses it to decouple fast per-session memory acquisition from slow cross-session consolidation.

Here is how it works. There is a learned offline consolidator. It treats a region of memory as read-only evidence, it inspects the provenance-linked trajectories that produced it, and it synthesizes a compact replacement that supersedes the original. It is the team librarian who comes in after hours, reads the sprawling pile of session notes, and rewrites them into one tight, reusable record. And the numbers are the argument. On ScienceWorld, Auto-Dreamer is up seven points with a memory bank that is twelve times smaller. Twelve times smaller and better. And it transfers to ALFWorld and to WebArena without retraining. That is direct evidence that aggressive consolidation makes the shared record simultaneously smaller and more reusable. Acquire fast, consolidate slow, and schedule the consolidation deliberately.

Now the workflow tier, because consolidation is what turns one-off trajectories into reusable how-to. Agent Workflow Memory, from Wang and colleagues in twenty twenty-four, was the seed. It distilled reusable procedural routines out of past trajectories, so an agent could remember not just facts but procedures. Its successor takes that idea team-scale. SkillClaw, from Ma and colleagues in twenty twenty-six, makes workflow memory a shared, synchronized repository across a multi-user agent ecosystem. Cross-user trajectories get aggregated, an autonomous component they call an evolver turns recurring patterns into refined skills, and the repository syncs across users so improvements discovered in one context propagate system-wide. The vivid problem it kills is the one every coding crew knows. Similar workflows, the same tool patterns, the same failure modes, getting repeatedly rediscovered across users, over and over, because nobody captured them once in a place everyone shares.

And there is a governance layer that ties this off. Unified Context Evolution, UCE, from Zhu and colleagues in twenty twenty-six, gives the cleanest taxonomy of what should live in shared memory. A typed library of evolvable context units split into four types, Memory, Strategy, Workflow, and Skill. Each one is generated from trajectories, retrieved at decision time, quality-scored through repeated use, and pruned when it stops being valuable. The results: ALFWorld goes from seventy-five point four percent to ninety-six point three, WebShop from forty-five point one to sixty-one point three, and the typed library transfers across different actor backbones without retraining, which tells you the gains live in the curated memory, not the model. The takeaway: type your shared memory, score it through use, and prune it. Capture a workflow once and share it. That is records-management discipline applied to a team substrate, and it is the difference between a library and a junk drawer.

---

## SEGMENT 5 — Shared for all, or one harness per task

Here is where the field is genuinely split, and I want to be honest that this is unsettled. Almost everything we have covered pushes toward one shared substrate for the whole team. UCE, SkillClaw, SHIMI, the shared knowledge graphs, all of them say, build one governed store and let the team converge on it. There is a real contrarian counterweight, and it is worth taking seriously.

The counterweight is a paper from Pan and colleagues in twenty twenty-six with a title that is also its thesis. M-star, Every Task Deserves Its Own Memory Harness. Their argument is that a memory system optimized for one purpose fails to transfer to another. The structure that makes a web-navigation memory good is not the structure that makes a scientific-reasoning memory good, and forcing both into one shared schema compromises both. So instead of one substrate, M-star uses reflective code evolution to auto-discover a task-specialized memory program. Concretely, it generates a schema, the storage logic, and the workflow instructions, as actual Python, tuned to the task in front of it. The memory system is not a fixed design you reuse, it is a program the system writes for each task.

So you have a live axis with two poles. Shared team substrate, where the whole point is that improvements propagate and transfer across contexts. Versus per-task specialization, where the whole point is that a memory system tuned to one job will beat a generic one. And this is not resolved. It is a real design decision you have to make, not a settled best practice you can look up.

How do you actually choose? The discriminator is transfer. If the value of your system comes from agents reusing each other's learnings across many similar tasks, a coding crew that keeps hitting variations of the same problems, lean shared, the UCE and SkillClaw direction, because the propagation is the whole payoff. If instead each task is genuinely idiosyncratic, with memory needs that do not generalize, the M-star per-task-harness argument is the case to weigh, because a shared store would just average everything into mush. And it is worth noting Hao and colleagues' twenty twenty-six work on self-evolving multi-agent systems via decentralized memory sits right on this seam, studying exactly the shared-versus-per-agent persistent-state question. The takeaway: decide shared-versus-specialized deliberately and up front, on the transfer question, because retrofitting from one to the other is a substrate rewrite, not a tweak.

---

## SEGMENT 6 — Conventions, identity, and the production filesystem

Now the top of the stack, and the closing argument. Where do conventions and identity actually come from? The romantic answer is that they emerge for free, that if you just put enough agents together at scale, norms and culture self-assemble. The research says that is false, and the evidence is brutal.

Generative Agents, from Park and colleagues in twenty twenty-three, established the anchor, the memory-stream-plus-reflection architecture that crosses straight over from the agentic-memory series. Project Sid, from Altera in twenty twenty-four, scales that to many-agent civilization simulations with genuine institutional memory, laws, roles, and culture that persist beyond any one agent. That is the tier where conventions and identity live, the institutional tier. But here is the rebuttal to emergence-for-free, and it is the load-bearing finding of the segment. The Parsonian governance audit of the OpenClaw ecosystem, from Ruan and colleagues in twenty twenty-six. OpenClaw is enormous, two hundred fifty thousand plus GitHub stars, seven hundred seventy thousand plus registered agents, two million plus monthly users. And the audit found at most nineteen percent governance coverage, and zero of twelve inter-pillar coordination pathways functional. Their phrase: technical infrastructure but no active governance, no coordination layer, and no normative grounding. A city with roads but no traffic law. Scale gave it infrastructure and gave it nothing that makes infrastructure into an institution.

So conventions do not precipitate out of raw scale. They precipitate out of a substrate that is governed. Which brings us to the production anchor, because Anthropic's managed-agents memory platform is the pragmatic instantiation of this whole episode. Up to eight memory stores per session, each mounted as a directory and manipulated with plain file tools, read, write, edit, glob, grep. No special memory API, just files. The platform is explicitly built for long-running agents that improve across sessions and share what they have learned with each other. And the pattern they recommend is a blackboard and a ledger built entirely out of file conventions. A common read-only directory holding brand and project context that every agent reads. Per-agent private directories for isolated learnings. A project-level read-write directory for shared status, decisions, and task history. And the file-hygiene rule is the exact one from the agentic-memory series, many small focused files, around a hundred kilobytes or twenty-five thousand tokens each, over a few sprawling ones. The takeaway: use the filesystem as your blackboard convention, govern the shared directory deliberately, and govern it before you scale, because the OpenClaw audit is what ungoverned scale looks like.

---

## OUTRO

So, to recap. A team has no shared mind by default, you manufacture one out of a substrate, and a passive substrate rots into an echo chamber. The substrate is a stack, KV cache, ledger, knowledge graph, workflow, institution. The fix for passivity is active broadcast plus a diversity drive plus bifurcated memory. Consolidation is the executable operation that keeps the shared record small and reusable, twelve times smaller in Auto-Dreamer's case. Shared-versus-specialized is genuinely unsolved, decide it on transfer. And conventions never emerge for free, you have to govern the substrate. One thing to watch: whether the M-star per-task-harness camp or the one-shared-substrate camp wins the transfer argument over the next year. One concrete action: go look at whatever your agents write to right now, and ask whether anything is broadcasting it, consolidating it, or governing it. If the answer is no on all three, you have a passive blackboard, and you already know how that story ends.

---

## Citations

| # | Title | Author/Org | Year | bibcode/URL |
|---|---|---|---|---|
| 1 | "Theater of Mind" for LLMs: Global Workspace Theory | Shang et al. | 2026 | 2026arXiv260408206S |
| 2 | Auto-Dreamer (CLS fast-acquire / slow-consolidate) | Ye et al. | 2026 | 2026arXiv260520616Y |
| 3 | Unified Context Evolution (UCE) | Zhu et al. | 2026 | 2026arXiv260602304Z |
| 4 | SkillClaw (shared synchronized workflow-memory repo) | Ma et al. | 2026 | 2026arXiv260408377M |
| 5 | M-star: Every Task Deserves Its Own Memory Harness | Pan et al. | 2026 | 2026arXiv260411811P |
| 6 | Governance by Design / Parsonian institutional architecture (OpenClaw audit) | Ruan et al. | 2026 | 2026arXiv260411337R |
| 7 | Self-Evolving MAS via Decentralized Memory | Hao et al. | 2026 | 2026arXiv260522721H |
| 8 | SHIMI: Semantic Hierarchical Memory Index (Merkle-DAG + CRDT) | Helmi et al. | 2025 | 2025arXiv250406135H |
| 9 | DroidSpeak: KV-Cache Sharing for Cross-LLM Communication | Liu et al. | 2024 | 2024arXiv241102820L |
| 10 | LCGuard: Safe KV Sharing in MAS | Asif et al. | 2026 | 2026arXiv260522786A |
| 11 | Agent Workflow Memory | Wang et al. | 2024 | 2024arXiv240907429Z |
| 12 | Magentic-One: Generalist Multi-Agent System (orchestrator ledger) | Fourney et al. | 2024 | 2024arXiv241104468F |
| 13 | ARIADNE: Blackboard-Driven MCTS | Wei et al. | 2026 | 2026arXiv260502431W |
| 14 | Decentralized Generative Agents with Adaptive Hierarchical KG | Yang et al. | 2025 | 2025arXiv250205453Y |
| 15 | Generative Agents (memory stream + reflection) | Park et al. | 2023 | 2023arXiv230403442P |
| 16 | Project Sid: Many-Agent Simulations toward AI Civilization | Altera | 2024 | 2024arXiv241100114A |
| 17 | MetaGPT (shared message pool) | Hong et al. | 2023 | 2023arXiv230800352H |
| 18 | Topology & Memory of Consensus among LLM Agents | Mehdizadeh et al. | 2026 | 2026arXiv260604197M |
| 19 | Blackboard Systems | Craig | 1988 | (book; no bibcode) |
| 20 | Global Workspace Theory | Baars | 1997 | (classic; no bibcode) |
| 21 | Complementary Learning Systems | McClelland, McNaughton & O'Reilly | 1995 | (classic; no bibcode) |
| 22 | The Social System (AGIL framework) | Parsons | 1951 | (classic; no bibcode) |
| 23 | Claude managed-agents memory | Anthropic | 2025 | https://platform.claude.com/docs/en/managed-agents/memory ; https://claude.com/blog/claude-managed-agents-memory |

---
*Generated for the Multi-Agent Orchestration deep-dive series from SciX primary sources + industry sources.*
