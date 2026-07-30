# Code Intel Digest — Multi-Agent Orchestration, Episode 1: Foundations & Topologies

**Episode date:** 2026-06-08
**Series:** Multi-Agent Orchestration (1 of 5)
**Data through:** SciX primary sources + industry sources
**Target runtime:** ~20 minutes (~3,000 words spoken)
**Segments:** 6 + cold open + outro

---

## COLD OPEN

Picture a research team that beats its best solo performer by ninety percent. That actually happened. Last June, Anthropic published how they built their multi-agent research system, and on their internal research evaluation, the multi-agent version beat single-agent Claude Opus 4 by ninety point two percent. Sounds like a slam dunk for "more agents are better," right? Here's the twist. When they looked at what actually drove that win, token usage alone explained about eighty percent of the performance variance. In plain terms, the system won mostly because it spent roughly fifteen times more tokens than a normal chat, fanning the work out across parallel subagents. Anthropic's own conclusion was blunt: "the economics only work for high-value research." So the headline isn't "more agents win." It's "more agents can win, at a steep price, when the task is worth it." That tension is this whole episode.

## INTRO

Welcome to Code Intel Digest. This is a five-episode deep dive on multi-agent orchestration, and this is episode one: foundations and topologies. Over the series we'll get into memory, reliability, security, and production engineering. But today is about the bedrock. What is a multi-agent system, really? When does adding agents help, when does it hurt, and when is a single agent just flat-out the right call? Then we'll walk the topology zoo: orchestrator-worker, hierarchical, swarm, blackboard, and pipeline. By the end you'll have the core vocabulary and a decision framework, not just a pile of cool-sounding patterns. One honesty note up front: a lot of the sharpest 2026 papers we'll cite are brand new, with essentially no citations yet, so treat them as emerging vocabulary, not settled fact. The load-bearing claims lean on older, well-cited work and on production write-ups. Let's go.

## SEGMENT 1 — Is More Agents Actually Better?

Here's the question that should haunt this entire episode: is more agents actually better? The honest answer, backed by the newest research, is it depends, and usually less than the hype implies. Start with the framing. A multi-agent system is fundamentally a topology, a graph that dictates how agents are organized and how information gets routed. That's the lens used by a 2026 system called ATOM, from Zhao and colleagues. The art of orchestration is choosing that graph so that what we'll call collaborative synergy outweighs coordination overhead. When it does, you get superhuman results. When it doesn't, congratulations, you've built a slower, more expensive, more error-prone single agent.

Now the evidence that should make you cautious. Li and colleagues, in a 2026 paper called "Scaling Behavior of Single LLM-Driven Multi-Agent Systems," built a framework specifically to isolate one variable: the effect of just adding more agents, separated from changing the model or feeding in different knowledge. What they found is that multi-agent performance does not scale monotonically with agent count. It follows diminishing returns, governed by that trade-off between collaborative synergy and coordination overhead. And here's the subtle, important part. They traced the degradation to coordination overhead itself, not merely to long-context failure. The agents talking to each other is the cost. Their phrasing is the thesis statement for this entire series: collective intelligence is, quote, "an emergent property contingent on strategic interaction design rather than a guaranteed outcome of agent plurality."

So why does this matter right now? Because practitioners are shipping multi-agent systems into production today, and the default instinct, more agents, denser communication, everyone talks to everyone, is frequently exactly wrong. Single agents do hit real ceilings: limited reasoning depth, bounded expertise, degradation on long-horizon tasks. The intuitive fix is to add agents to divide labor and cross-check. But plurality alone buys you nothing.

The takeaway: default to a single agent. Reach for multi-agent only when the task is genuinely parallelizable, high-value, and exceeds what one agent's reasoning can do in a single pass. That roughly fifteen-times token premium is real money, and it's the price of admission, not a guarantee of return.

## SEGMENT 2 — The Topology Zoo, Part One: Orchestrator-Worker and Hierarchical

If a multi-agent system is a graph, then a topology has three knobs. Who talks to whom, that's the edges. Who decides, centralized orchestrator versus decentralized peers. And what they share, private messages versus a common workspace. Every named pattern is just a point in that space. Let's start with the two most production-relevant shapes.

First, orchestrator-worker, also called supervisor. A lead agent decomposes the task, spins up workers, and integrates their results. This is the dominant production pattern, full stop. The reference architecture is Magentic-One, from Fourney and colleagues in 2024, where an Orchestrator maintains a task ledger and directs specialist agents. Anthropic's research system is the industrial instance of this: a lead Opus agent plans and launches three to five parallel Sonnet subagents, plus a separate citation pass. And there's a smarter version. That ATOM system from Zhao and colleagues makes orchestration adaptive. It uses a "nucleus-electron" structure, keeping a stable, offline-learned backbone, the nucleus, and dynamically activating query-conditioned worker agents, the electrons, only when difficulty actually warrants it, saving up to thirty percent of tokens.

Second, hierarchical. Supervisors of supervisors, layered delegation. And here's the part people miss: the motivation is not just compute fan-out. It's organizational efficiency. Guo and colleagues, in a 2024 paper titled "Embodied LLM Agents Learn to Cooperate in Organized Teams," found something counterintuitive. Flat LLM teams over-report and over-comply. They produce information redundancy and confusion, agents drowning each other in chatter. When the researchers imposed prompt-based organizational structure with designated leadership, team efficiency went up and communication cost went down. So hierarchy isn't a box on an org chart for its own sake. It's a lever to suppress chatter.

The contrast worth holding onto: orchestrator-worker is about decomposing and integrating, one boss, many hands. Hierarchical is about controlling communication volume as teams grow, layered bosses to stop everyone shouting at once. They look similar on a whiteboard, but they solve different problems.

The takeaway: if your task needs a planner who farms out work and stitches it back together, reach for orchestrator-worker, and strongly consider making it adaptive rather than fixed. If you've got a chatty flat team that confuses itself, impose hierarchy and designated leadership before you add a single additional agent.

## SEGMENT 3 — The Topology Zoo, Part Two: Swarm, Blackboard, and Pipeline

Now the other three shapes, and a fun historical thread: several of these are nineteen-eighties ideas re-instantiated on language models.

First, swarm, or decentralized. No central controller. Coordination emerges from local interactions between peers. S-Agents, from Chen and colleagues in 2024, self-organizes agents into a tree-of-agents for open environments. AgentNet, from Yang and colleagues in 2025, is a decentralized, evolutionary coordination scheme where agents adapt their connections to each other over time. The lineage here is genuinely old. Marvin Minsky's "The Society of Mind" from nineteen eighty-six, and stigmergic, pheromone-style coordination borrowed from biology. These are ancient ideas wearing new clothes.

Second, blackboard, or shared workspace. Instead of messaging each other directly, agents read and write to a common structured memory. ARIADNE, from Wei and colleagues in 2026, drives a Monte Carlo Tree Search over a shared blackboard. The classic ancestor is Hearsay-Two, the speech-understanding system from Erman, Hayes-Roth, Lesser, and Reddy in nineteen eighty, and Nii's blackboard-systems surveys from nineteen eighty-six. Again, a forty-year-old architecture finding fresh life on LLMs.

Third, pipeline. Agents arranged in a fixed sequence, each transforming the previous output. Generator, then critic, then refiner. It's simple, it's debuggable, it's low-overhead. And it's the right default when the task decomposes cleanly and the stages don't need to negotiate with each other.

Here's the unifying idea that ties the whole zoo together. Nechepurenko and colleagues, in a 2026 paper, argue you should treat coordination as a first-class architectural layer, not as an emergent side effect of clever prompting. And if you want the full map, Huang and colleagues in 2026 published a two-dimensional design-pattern framework, which is the right place to go for "show me all the patterns at once."

The contrast: swarm and blackboard both decentralize, but differently. Swarm decentralizes control, no boss. Blackboard decentralizes communication, everyone talks through shared state instead of point-to-point. Pipeline does neither, it's the boring, reliable workhorse.

The takeaway: match the shape to the task. Clean, sequential decomposition wants a pipeline. Shared, evolving state that many agents inspect wants a blackboard. Genuinely open, emergent environments are where swarm earns its keep. And whichever you pick, design the coordination on purpose.

## SEGMENT 4 — Two Scaling Laws, Opposite Headlines

This is the segment I've been waiting for, because it's a head-to-head between two papers with seemingly opposite conclusions, and reconciling them is the real payoff.

In the pessimist's corner: Li and colleagues, that 2026 SIMAS work we covered earlier. Performance does not scale monotonically. Diminishing returns. More agents often hurt. And critically, that degradation generalizes across interaction architectures, including structured debate topologies, so you can't just debate your way out of it.

In the optimist's corner: Qian and colleagues, 2024, "Scaling Large Language Model-based Multi-Agent Collaboration," the work known as MacNet. They organized over one thousand agents as a directed acyclic graph and found a collaborative scaling law. Overall performance follows a logistic growth curve as agents scale, and what they call collaborative emergence appears earlier than the neural-scaling emergence you'd get from just growing the model. So one paper says adding agents hits a wall, the other says it follows a clean growth curve up past a thousand agents.

Here's the resolution: they're not actually contradictory. The regime you land in is decided by three things. Task type, base-model capability, and interaction design. SIMAS itself reports that effective multi-agent systems require a sufficiently capable base model, and that task type critically modulates the optimal agent count. And MacNet's other load-bearing finding sharpens the lesson even further: irregular topologies outperform regular ones. Chains, stars, trees, fully-connected graphs, all the tidy shapes, get beaten by messier, irregular ones. So "add more agents" was never the right frame. "Design the right graph, for this task, with a capable enough model" is.

A second tension nested inside this: static versus adaptive topologies. ATOM names what it calls the "average-complexity trap." Static dense topologies over-provision on easy queries and under-provision on hard ones. ATOM's case study is vivid. For a simple arithmetic problem, it instantiates a two-agent chain, a Mathematical Analyst handing off to a Math Solver. For a multi-step financial problem, it expands and recruits a Programming Expert. Meanwhile a rigid baseline generates the exact same three-agent topology regardless of how hard the query is.

The takeaway: stop asking "how many agents." Ask "what graph, for what task, on what model." And prefer adaptive graphs that scale their size with difficulty over static dense ones that pay full price on every query.

## SEGMENT 5 — Structure Dictates Failure, and How to Diagnose It Early

Here's a deeper tension, and honestly the most engineering-forward idea in the episode. Topologies are not interchangeable, and the structure you pick dictates how the system fails.

Parks and colleagues, in a 2026 paper called "Predictive Maps of Multi-Agent Reasoning," make this concrete. They derive closed-form spectra, three mathematical quantities of the communication operator, and map them onto three distinct failure modes. The point is that you can run this diagnostic before you deploy, instead of finding out in production. And the numbers are striking. They validated on a twelve-step state-tracking task using Qwen2.5-7B over one hundred trials. The condition number turned out to be a perfect rank-order predictor of how robust the system is to perturbation, a Spearman correlation of one point zero. The spectral gap partially predicts whether agents reach consensus, correlation around zero point five. And the spectral radius is perfectly inverted with cumulative error drift, a correlation of negative one point zero. Perfect inversion. That reframes "pick a topology" from a matter of taste into a matter of engineering.

Now, the honest caveat, because this is brand-new work with essentially no citations yet. Treat those perfect correlations as a promising signal on one task with one small model, not as a universal law. But the direction is what matters: structure is predictive of failure.

For the failure vocabulary itself, the reference is the MAST taxonomy from Cemri and colleagues in 2025, "Why Do Multi-Agent LLM Systems Fail?" It catalogs the why, grouping breakdowns into specification failures, coordination failures, and verification failures. That gives us named demons to hunt: coordination overhead, error propagation where one agent's mistake compounds down the chain, and what I'll call confidently-wrong consensus, where the group agrees on something false. Anthropic independently observed those compounding errors across agent steps in their production system. And Zhou and colleagues in 2025 separately documented that topology drives performance, so this isn't one lab's pet theory.

The takeaway: diagnose before you deploy. Know whether your chosen graph amplifies error drift or converges toward consensus, and instrument explicitly for the MAST failure modes. A topology you can't observe is a topology you can't trust.

## SEGMENT 6 — The Practitioner's Decision Framework

Let's pull it all into something you can actually use on Monday morning. Seven points.

One. Default to a single agent. Multi-agent is the exception, justified only when the task is parallelizable, high-value, and beyond one agent's reasoning depth. Remember the price tag: roughly fifteen times the tokens of a normal chat, and Anthropic's verdict that the economics only work for high-value research.

Two. Match the topology to the task. Clean decomposition wants a pipeline. A planner that farms out and integrates wants orchestrator-worker. A chatty flat team that confuses itself wants hierarchy and designated leadership, that's the Guo 2024 lesson. Shared evolving state wants a blackboard.

Three. Prefer adaptive graphs over static dense ones. The average-complexity trap from ATOM is expensive. Let agent count scale with difficulty.

Four. Treat coordination as an explicit architectural layer, the Nechepurenko 2026 point, not an emergent accident of prompting.

Five. Diagnose before you deploy. Structure predicts failure mode, per Parks 2026. Know whether your graph drifts or converges.

Six. Instrument for the named failure modes in MAST: coordination overhead, error propagation, confidently-wrong consensus. If you can't see them, you can't catch them.

Seven. Watch the open questions. Whether irregular topologies, the MacNet finding, become standard practice. Whether the two scaling laws get cleanly reconciled. And whether the 2026 spectral and adaptive methods hold up as citations accrue, because right now they're promising hypotheses, not proven law.

The contrast to keep front of mind: the field's loudest instinct is "more agents, more communication." The research consensus is closer to "fewer agents, smarter structure, explicit coordination." Qian's thousand-agent scaling law is real, but it lives on irregular graphs with capable models, not on naively throwing bodies at the problem.

The takeaway: orchestration is graph design, not headcount. Pick the smallest graph that clears the bar, make its coordination explicit, and instrument it so you can see it fail.

## OUTRO

So that's the foundation. A multi-agent system is a topology, a graph with three knobs: who talks to whom, who decides, and what they share. More agents is not automatically better, Li's non-monotonic curve versus Qian's logistic one, reconciled by task, model, and design. We walked the zoo: orchestrator-worker, hierarchical, swarm, blackboard, pipeline. And we learned that structure dictates failure, so you can diagnose it early. The one thing to watch: whether 2026's adaptive and spectral methods survive contact with real citations. Your one concrete action this week: before you add a second agent to anything, write down the graph and ask whether a single agent already clears the bar. Next episode, memory. See you then.

## Citations

| # | Title | Author/Org | Year | bibcode/URL |
|---|---|---|---|---|
| 1 | How we built our multi-agent research system | Anthropic | 2025 | https://www.anthropic.com/engineering/multi-agent-research-system |
| 2 | ATOM (adaptive nucleus-electron orchestrator; average-complexity trap) | Zhao et al. | 2026 | 2026arXiv260526178Z |
| 3 | Scaling Behavior of Single LLM-Driven Multi-Agent Systems (SIMAS) | Li et al. | 2026 | 2026arXiv260600655L |
| 4 | Magentic-One: A Generalist Multi-Agent System | Fourney et al. | 2024 | 2024arXiv241104468F |
| 5 | Embodied LLM Agents Learn to Cooperate in Organized Teams | Guo et al. | 2024 | 2024arXiv240312482G |
| 6 | S-Agents: Self-organizing Agents | Chen et al. | 2024 | 2024arXiv240204578C |
| 7 | AgentNet: Decentralized Evolutionary Coordination | Yang et al. | 2025 | 2025arXiv250400587Y |
| 8 | ARIADNE: Blackboard-Driven MCTS | Wei et al. | 2026 | 2026arXiv260502431W |
| 9 | Coordination as an Architectural Layer for LLM-MAS | Nechepurenko et al. | 2026 | 2026arXiv260503310N |
| 10 | A Two-Dimensional Framework for AI Agent Design Patterns | Huang et al. | 2026 | 2026arXiv260513850H |
| 11 | Scaling Large Language Model-based Multi-Agent Collaboration (MacNet) | Qian et al. | 2024 | 2024arXiv240607155Q |
| 12 | Predictive Maps of Multi-Agent Reasoning | Parks et al. | 2026 | 2026arXiv260511453P |
| 13 | Why Do Multi-Agent LLM Systems Fail? (MAST) | Cemri et al. | 2025 | 2025arXiv250313657C |
| 14 | Multi-Agent Design: Optimizing Prompts and Topologies | Zhou et al. | 2025 | 2025arXiv250202533Z |
| 15 | LLM-based Multi-Agents: A Survey of Progress and Challenges | Guo et al. | 2024 | 2024arXiv240201680G |
| 16 | The Society of Mind | Marvin Minsky | 1986 | (book; no bibcode) |
| 17 | Hearsay-II speech-understanding / blackboard architecture | Erman, Hayes-Roth, Lesser & Reddy | 1980 | (no bibcode) |
| 18 | Blackboard systems surveys | Nii | 1986 | (no bibcode) |

---
*Generated for the Multi-Agent Orchestration deep-dive series from SciX primary sources + industry sources.*
