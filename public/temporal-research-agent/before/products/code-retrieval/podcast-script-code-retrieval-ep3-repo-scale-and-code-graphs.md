# Code Intel Digest — Code Retrieval & Enterprise Codebases, Episode 3: Repository-Scale & Code Graphs

**Episode date:** 2026-06-08
**Series:** Code Retrieval & Enterprise Codebases (3 of 5)
**Data through:** SciX primary sources + industry sources
**Target runtime:** ~20 minutes (~3,000 words spoken)
**Segments:** 6 + cold open + outro

---

## COLD OPEN

Picture an AI coding agent dropped into a repository it's never seen. It behaves like a tourist with no map. It greps for a symbol. It globs for filenames. It opens a module just to figure out what the module is for. It's trying to reconstruct an architecture that, as Haoran Jin put it in early twenty twenty-six, "exists only in the developer's mind." And here's the thing that should stop you: more searching is not more finding. Jin's team looked at seven thousand and twelve real Claude Code sessions — almost half a million messages — and found this poking around is so undirected that when they just handed the agent a formal map of the architecture up front, navigation steps dropped by thirty-three to forty-four percent. A single file is something you read. A repository is a world you have to navigate. That gap is this whole episode.

## INTRO

Welcome back to Code Intel Digest. This is the Code Retrieval and Enterprise Codebases series, and you're on episode three of five. In episodes one and two we lived inside the file and the function — embeddings, single-file completion, the retrieval primitives. Today we blow past that boundary. We're going repository-scale: cross-file and repo-level retrieval, the benchmarks that exposed how badly single-file models do when the answer lives somewhere else, dataflow and static analysis steering what you retrieve, code property graphs and full-blown code knowledge graphs, and the agents now walking these codebases on their own. There's a real fork in the road here, and the whole field is split over which way to go. Let's get into it.

## SEGMENT 1 — The Repo Is a Haystack, and Searching Harder Doesn't Help

Here's the claim that frames everything: the context an agent needs is almost never in the file it's editing. The system A-three-CodGen, from twenty twenty-three, named this cleanly. A repo-scale tool has to solve three separate problems, not one. There's local-aware retrieval — the current file. There's global-aware — every other file in the repo. And there's third-party-library-aware — the external dependencies. Three distinct targets. Treat them as one and you lose.

Now the evidence that undirected search actively hurts. Go back to Jin's twenty twenty-six study of those seven thousand and twelve sessions. Handing the agent a formal architecture descriptor didn't just cut navigation steps thirty-three to forty-four percent — the result was statistically clean, a Wilcoxon p of zero point zero zero nine, a Cohen's d of zero point nine two, which is a large effect. And it slashed behavioral variance fifty-two percent. The agents stopped flailing. They behaved consistently. The map didn't just make them faster, it made them predictable.

And the dissent comes from inside the agent camp itself. John Yang's SWE-agent team, the same year, made a genuinely uncomfortable observation: iterative search can degrade performance versus doing no search at all. Let that sit. Sometimes the agent that just acts beats the agent that keeps looking. The LoCoBench-Agent work echoes it with a twelve-turn efficiency threshold — past about twelve turns, agents show diminishing returns.

So the takeaway for segment one: stop assuming more retrieval is better. Undirected exploration is a measurable tax. Before you tune your search loop, ask whether the agent should be searching less and being handed more.

## SEGMENT 2 — Camp One: Similarity Retrieval, Done in a Loop

The first answer to the haystack problem is the obvious one — retrieve better snippets — but with a twist. The canonical move is RepoCoder, from Fengji Zhang and colleagues in twenty twenty-three. The insight: don't retrieve once. Retrieve, generate a draft, then retrieve again using that draft as your query. Because a rough first attempt at the code is actually a far better search query than the incomplete stub you started with. Each loop sharpens what gets pulled from the repo. It's elegant, it's model-agnostic, and it works.

But it inherits vector RAG's blind spot. Similarity over raw text can't see structure. It can't see that the function you need is reached through a call edge or an inheritance chain rather than through shared vocabulary.

That's where DraCo comes in — Dataflow-Guided Retrieval Augmentation, from Wei Cheng and colleagues in twenty twenty-four. This is the bridge between the two camps. Cheng's argument is blunt: import relations and text similarity are, in their words, "insufficiently relevant to completion targets." So instead they parse the private repo into code entities and link them through extended dataflow analysis into a repo-specific context graph. Then they retrieve from that graph. The numbers are modest — exact-match up three point four three percent, identifier F-one up three point two seven percent over the prior state of the art on their ReccEval Python benchmark. Modest. But the mechanism is the durable part. Static analysis steering retrieval, not replacing it.

The contrast here is cost versus blindness. Pure similarity RAG is cheap and language-agnostic — you can point it at anything. The moment you add structure, you've signed up for a static-analysis build step and language-specific extractors. DraCo's bet is that the structural signal is worth that price.

Takeaway: if you're running plain vector RAG over a repo today, the cheapest high-leverage upgrade isn't a bigger model — it's letting dataflow steer what you pull. Retrieve-generate-retrieve gets you part way; dataflow-guided retrieval closes the structural gap.

## SEGMENT 3 — Camp Two: Stop Guessing, Query a World Model

The second camp says something more radical: stop guessing with similarity at all. Build a structured model of the codebase and query it directly.

The flagship is CodexGraph, from Xiangyan Liu and colleagues in twenty twenty-four. They index the entire repo with static analysis into a graph database. Symbols become nodes. Calls, imports, inheritance become edges. And then — this is the clever part — they let the language model write graph queries to fetch exactly the code it needs. Retrieval stops being vector-similarity guessing and becomes querying a world model. You ask the graph "what calls this function," and you get an answer, not a list of things that sound similar.

A sibling approach, CodeGRAG, also twenty twenty-four, pushes structure into the model itself. It builds control-flow and data-flow graph views and trains a graph neural network "expert" to inject that structural knowledge directly. Same thesis, different injection point. And the thesis is sharp: vector RAG, they argue, "captures only syntactic relationships, missing design intent." Design intent. That's the phrase. The connective tissue of a codebase — why these modules talk to each other — is structural, and text similarity is blind to it.

Now the dissent, and it's a good one. Graphs aren't free. They cost a static-analysis build step, language-specific extractors, and ongoing index maintenance every time the code changes. Similarity RAG is cheaper and works across any language out of the box. So the graph camp's purity has a price tag, and that price is exactly why the synthesis — DraCo, CodeGRAG — uses structure to steer retrieval rather than to replace it entirely. That hybrid is most likely where the field actually lands.

Takeaway: when your agent needs to answer a multi-hop structural question — who calls this, what overrides that, where does this data flow — vector similarity will fail you, and a queryable graph index is the thing that pays off. Index, don't just embed.

## SEGMENT 4 — Code Property Graphs and the Knowledge-Graph Lineage

Let's go up a level of ambition. If you're going to build a structured model of a million-line codebase, can it even scale? QVoG, from a team led by Liu in twenty twenty-four, is the proof that it can. It uses a compressed code property graph — a CPG — with a declarative query language, and it analyzes codebases over one million lines in roughly fifteen minutes. Compare that to about nineteen minutes for CodeQL. The compression is the enabler; graph traversal made tractable at genuine industrial scale.

But raw code property graphs only capture what's in the code. The next wave argues that the most valuable context isn't in the code at all. That's the Code Digital Twin, from Xiangzhe Xu, Bo Peng and colleagues in twenty twenty-five. Their claim is that the missing ingredient is tacit knowledge — responsibility allocation, design rationale, collaboration patterns. The stuff "embedded in systems, or residing solely in developers' minds." So they build a co-evolving representation that fuses knowledge graphs, frames, and text, pulled from source, docs, and change histories, using language models plus static analysis plus actual human expertise. And that's a quiet rebuke to anyone selling a pure-automation graph pipeline: the highest-value context is precisely what static analysis cannot extract on its own.

Coming at the same target from the indexing side is AOCI — AI-Oriented Code Indexing, from twenty twenty-six. AOCI builds a symbolic-semantic blueprint that an agent reads in a single pass to grasp architecture, dependencies, and key design decisions before it does any task. One entry per code unit: a symbolic tag — think architectural coordinates — paired with semantic content. And it's maintained incrementally, so only changed entries regenerate. AOCI is the in-corpus cousin of the industrial indexers, and notice it converges with Jin's "give the agent a map first" thesis, just arriving from the other direction.

And those industrial indexers are real and old. Google's Kythe, Meta's Glean — open-sourced in December twenty twenty-four — and Sourcegraph's SCIP powering cross-repository navigation. The academic "code knowledge graph" has build-integrated ancestors that already run on monorepos.

Takeaway: at enterprise scale, a static-analysis index is the substrate. Watch the primitives — Kythe, Glean, SCIP — because that's where the academic ideas get battle-tested.

## SEGMENT 5 — Camp Three: Agents That Walk the Codebase

If the repo is a world, an agent has to move through it. SWE-agent, from John Yang and colleagues in twenty twenty-four, introduced the agent-computer interface — purpose-built navigation and edit commands instead of dumping the agent into a raw shell. OpenHands, from Xingyao Wang's team the same year, generalized that into an open agent platform.

Then the field learned something important: localization — just finding the right file — is a first-class sub-problem, not a side effect of generation. MAGIS, from Wei Tao and colleagues in twenty twenty-four, decomposes by role and dedicates an entire agent, a "Repository Custodian," to locating relevant files, kept separate from the Developer and the QA agents. And LocAgent, from Zhaoling Chen and colleagues in twenty twenty-five, makes the graph explicit: parse the codebase into a directed heterogeneous graph — files, classes, functions as nodes; imports, calls, inheritance as edges — and let the agent do multi-hop reasoning over it. The payoff is concrete: ninety-two point seven percent file-level localization accuracy, a twelve-percent lift in GitHub issue-resolution at Pass-at-ten, and they did it with a fine-tuned Qwen-two-point-five-Coder thirty-two-billion model at about eighty-six percent lower cost than proprietary state of the art.

Two more. CodePlan, from Ramakrishna Bairi and colleagues in twenty twenty-three, frames repo-wide edits as planning over a dependency graph rather than a chain of local completions — because when you change one thing, the graph tells you everything else that has to change. And ARISE, from twenty twenty-six, couples repo-level graphs with a toolset specifically for fault localization and program repair.

The tension running through all of this connects back to segment one: how much should the agent explore versus how much should you hand it? SWE-agent says search can backfire. The dissent-within-the-camp is what you hand it — a graph the agent queries live, like LocAgent, or a static blueprint it reads up front, like AOCI.

Takeaway: make localization its own component. Don't fold "find the right file" into "write the patch." MAGIS and LocAgent both prove it's a separate, measurable, optimizable step — and treating it that way is what unlocks the cheaper, smaller models.

## SEGMENT 6 — Format Theater, and How to Judge the Evidence

Let me kill a tempting subplot before you waste time on it. There's a seductive question floating around: which descriptor format does the language model prefer? S-expressions? JSON? YAML? Markdown? Jin's twenty twenty-six study tested exactly this and found no significant comprehension difference across all four. None. The model doesn't care.

What does differ is the failure mode, and that's the part worth your attention. JSON fails atomically — one missing brace and you get zero percent recovery, the whole thing is garbage. YAML is worse in a sneaky way: it silently corrupted fifty percent of injected errors, so the parse succeeds and the data is just wrong. S-expressions detected every structural-completeness error. So the productive question isn't "what does the LLM like." It's "what fails safely when the agent that writes the descriptor makes a mistake." Stop arguing about prompt formats. Pick the one that fails loudly.

Now, how should you weigh all this evidence? The benchmarks are real. RepoBench, from Tianyang Liu and colleagues, and CrossCodeEval, from Yangruibo Ding and colleagues — both twenty twenty-three — established repo-level and cross-file completion as measurable tasks, and they're the reason we know single-file models stumble when the answer's elsewhere. SWE-bench is the issue-resolution yardstick the agent camp competes on. And AOCI's evaluation is genuinely heavyweight: across four projects, three LLMs, six context conditions — twenty-one hundred and sixty evaluations — it beat every deployable baseline, second only to an oracle upper bound. On nineteen industrial tasks across five systems it introduced zero final-state defects, while three mainstream agent tools introduced defects in twelve tasks and burned four to a hundred and thirty times more tokens, p less than zero point zero zero one.

But here's the caveat the honest host names out loud: a lot of this is early. Jin's paper has a citation count of zero and twenty-four localization tasks. AOCI's industrial slice is nineteen tasks. These are young arXiv preprints. The effects are real and consistent in direction — they all point the same way — but the bars are still being set.

Takeaway: trust the direction, not yet the decimal. Design for safe failure over pretty formats, and read these numbers as strong signals from a field that's still calibrating.

## OUTRO

So that's the fork. Camp one retrieves better snippets and loops; camp two queries a structured world model; camp three sends agents to walk the code — and the smart money is on hybrids that use structure to steer retrieval and hand the agent a map before it explores. The one thing to watch: RepoGraph, from Ouyang and colleagues at ICLR twenty twenty-five, and GRACE, on multi-level multi-semantic code graphs — that's the next reading. And one concrete action this week: if you're running plain vector RAG over a repo, add a static-analysis index for the multi-hop structural questions where similarity goes blind. Index, don't just embed. Next episode, we go inside the enterprise itself. See you then.

## Citations

| # | Title | Author/Org | Year | bibcode/URL |
|---|-------|-----------|------|-------------|
| 1 | Navigation primitives / architecture descriptors (7,012 Claude Code sessions) | Jin | 2026 | 2026arXiv260413108J |
| 2 | A^3-CodGen (retrieval-scope taxonomy) | Liu et al. | 2023 | 2023arXiv231205772L |
| 3 | SWE-agent: Agent-Computer Interfaces | Yang et al. | 2024 | 2024arXiv240515793Y |
| 4 | RepoCoder: Iterative Retrieval + Generation | Zhang et al. | 2023 | 2023arXiv230312570Z |
| 5 | DraCo: Dataflow-Guided Retrieval Augmentation | Cheng et al. | 2024 | 2024arXiv240519782C |
| 6 | CodexGraph: graph-database code retrieval | Liu et al. | 2024 | 2024arXiv240803910L |
| 7 | CodeGRAG: structural GNN knowledge | Du et al. | 2024 | 2024arXiv240502355D |
| 8 | QVoG: scalable defect detection via CPG traversal (1M+ LOC) | Liu et al. | 2024 | 2024arXiv240608098L |
| 9 | Code Digital Twin: tacit knowledge for maintenance | Peng et al. | 2025 | 2025arXiv250307967P |
| 10 | AOCI: symbolic-semantic indexing for repo-scale understanding | Liu et al. | 2026 | 2026arXiv260502421L |
| 11 | OpenHands: open agent platform | Wang et al. | 2024 | 2024arXiv240716741W |
| 12 | MAGIS: role-decomposed multi-agent issue resolution | Tao et al. | 2024 | 2024arXiv240317927T |
| 13 | LocAgent: graph-guided code localization | Chen et al. | 2025 | 2025arXiv250309089C |
| 14 | CodePlan: repo-level coding with planning | Bairi et al. | 2023 | 2023arXiv230912499B |
| 15 | ARISE: repo-level graph + toolset for FL & APR | Seddik et al. | 2026 | 2026arXiv260503117S |
| 16 | RepoBench: repo-level benchmark | Liu et al. | 2023 | 2023arXiv230603091L |
| 17 | CrossCodeEval: cross-file benchmark | Ding et al. | 2023 | 2023arXiv231011248D |
| 18 | SWE-bench: issue-resolution benchmark | Jimenez et al. | 2023 | 2023arXiv231006770J |
| 19 | LibEvolutionEval: dependency-drift evaluation | Kuhar et al. | 2024 | 2024arXiv241204478K |
| 20 | Google Kythe — build-integrated semantic indexing | Google | — | https://kythe.io/docs/kythe-overview.html |
| 21 | Meta Glean — indexing code at scale | Meta | 2024 | https://engineering.fb.com/2024/12/19/developer-tools/glean-open-source-code-indexing/ |
| 22 | Sourcegraph SCIP / cross-repository code navigation | Sourcegraph | — | https://sourcegraph.com/blog/cross-repository-code-navigation |
| 23 | Why Google Stores Billions of Lines of Code in a Single Repository | Google / CACM | 2016 | https://cacm.acm.org/research/why-google-stores-billions-of-lines-of-code-in-a-single-repository/ |
| 24 | RepoGraph (referenced, next reading) | Ouyang et al. | 2025 | ICLR 2025 |
| 25 | GRACE: Multi-level Multi-semantic Code Graphs for Code Retrieval | Wang et al. | 2025 | arXiv:2509.05980 |

---
*Generated for the Code Retrieval & Enterprise Codebases deep-dive series from SciX primary sources + industry sources.*
