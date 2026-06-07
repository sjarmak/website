#!/usr/bin/env python3
"""Emit the curated knowledge-hub data files.

Provenance: literature seeds were retrieved from Stephanie's live scix MCP
(hybrid BM25 + body-lexical + RRF fusion over the 32M-paper ADS/SciX corpus);
citation edges came from citation_similarity (co_citation). Her own papers live
in papers.json (fetched from NASA ADS). The curation below — which papers belong
to which thread, the reading order, and the framing prose — is editorial and
meant to be edited in place; re-run this script after editing to regenerate JSON.

Outputs (src/data/knowledge/):
  lit-papers.json     external literature papers referenced by threads
  citation-edges.json paper<->paper edges (graph lane)
  threads.json        the four threads with curation + reading order
"""

import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "src", "data", "knowledge"))

# ---- external literature papers (curated from scix hybrid search) ----
# Fields mirror the scix `search` result shape. abstract = abstract_snippet.
LIT_PAPERS = {
    # navigable-science
    "2020arXiv200407180C": dict(title="SPECTER: Document-level Representation Learning using Citation-informed Transformers", first_author="Cohan, Arman", year=2020, citation_count=125, abstract="Citation-informed transformer embeddings for scientific documents; the lineage behind SPECTER2, one of the embedding models used in SciX."),
    "2020arXiv200302320H": dict(title="Knowledge Graphs", first_author="Hogan, Aidan", year=2020, citation_count=118, abstract="A comprehensive introduction to knowledge graphs; the structural backbone for representing scientific knowledge beyond ranked lists."),
    "2020arXiv200410964G": dict(title="Don't Stop Pretraining: Adapt Language Models to Domains and Tasks", first_author="Gururangan, Suchin", year=2020, citation_count=463, abstract="Domain-adaptive pretraining; the argument for domain-specific scientific models like INDUS over generic embeddings."),
    "2024ASPC..535..119G": dict(title="Building astroBERT, a Language Model for Astronomy & Astrophysics", first_author="Grezes, F.", year=2024, citation_count=17, abstract="A domain language model for the NASA ADS corpus; co-cited with the SciX embeddings work."),
    "2022arXiv221200744G": dict(title="Improving astroBERT using Semantic Textual Similarity", first_author="Grezes, Felix", year=2022, citation_count=5, abstract="STS fine-tuning of astroBERT over the ADS literature."),
    "2023arXiv230213971T": dict(title="LLaMA: Open and Efficient Foundation Language Models", first_author="Touvron, Hugo", year=2023, citation_count=9291, abstract="Open foundation models; co-cited with the SciX embeddings work as the general-model backdrop."),
    "2023arXiv230308774O": dict(title="GPT-4 Technical Report", first_author="OpenAI", year=2023, citation_count=13534, abstract="Frontier general model; co-cited with the SciX embeddings work."),
    # reliable-agents
    "2024arXiv240716741W": dict(title="OpenHands: An Open Platform for AI Software Developers as Generalist Agents", first_author="Wang, Xingyao", year=2024, citation_count=92, abstract="An open platform for AI software-developer agents; a reference architecture for agents that act on real codebases."),
    "2024arXiv240510467L": dict(title="Agent Design Pattern Catalogue: Architectural Patterns for Foundation Model based Agents", first_author="Liu, Yue", year=2024, citation_count=9, abstract="A catalogue of architectural patterns for foundation-model agents; vocabulary for reasoning about reliability."),
    "2026arXiv260408906Z": dict(title="Dissecting Bug Triggers and Failure Modes in Modern Agentic Frameworks: An Empirical Study", first_author="Zhang, Xiaowen", year=2026, citation_count=0, abstract="Empirical study of where agentic frameworks (CrewAI, AutoGen) break; directly about reliability failure modes."),
    "2025arXiv250108243P": dict(title="Engineering an LLM-Powered Multi-agent Framework for Autonomous CloudOps", first_author="Parthasarathy, Kannan", year=2025, citation_count=0, abstract="Engineering a production multi-agent system for autonomous operations; a real deployment case study."),
    "2024arXiv240902977L": dict(title="Large Language Model-Based Agents for Software Engineering: A Survey", first_author="Liu, Junwei", year=2024, citation_count=40, abstract="A survey of LLM agents across the software-engineering lifecycle."),
    # agent-memory
    "2026arXiv260407487L": dict(title="CLEAR: Context Augmentation from Contrastive Learning of Experience via Agentic Reflection", first_author="Liu, Linbo", year=2026, citation_count=0, abstract="Building task-relevant context from an agent's own experience via contrastive reflection; a memory/context-engineering approach."),
    "2026arXiv260407791F": dict(title="SEARL: Joint Optimization of Policy and Tool Graph Memory for Self-Evolving Agents", first_author="Feng, Xinshun", year=2026, citation_count=0, abstract="A graph-structured tool memory jointly optimized with policy for self-evolving agents."),
    # evaluating-agents
    "2024arXiv240202047S": dict(title="Calibration and Correctness of Language Models for Code", first_author="Spiess, Claudio", year=2024, citation_count=28, abstract="Whether code models know when they are right; calibration as an honest-evaluation signal."),
    "2024arXiv240600515J": dict(title="A Survey on Large Language Models for Code Generation", first_author="Jiang, Juyong", year=2024, citation_count=155, abstract="A broad survey of code-generation LLMs and how they are measured."),
    "2023arXiv231114904J": dict(title="LLM-Assisted Code Cleaning For Training Accurate Code Generators", first_author="Jain, Naman", year=2023, citation_count=18, abstract="Data quality for code generators; what goes in shapes what the benchmark sees come out."),
    "2024arXiv241220367W": dict(title="Enhancing Code LLMs with Reinforcement Learning in Code Generation: A Survey", first_author="Wang, Junqiao", year=2024, citation_count=7, abstract="RL for code generation; moving evaluation from static benchmarks toward outcome signals."),
}

# ---- citation edges (graph lane): co-citation of the SciX embeddings paper ----
# Her ADS bibcode for "Experimenting with LLMs and vector embeddings in NASA SciX".
HER_EMBEDDINGS_PAPER = "2023arXiv231214211B"
CITATION_EDGES = [
    dict(source=HER_EMBEDDINGS_PAPER, target=t, kind="co_citation", overlap=2)
    for t in ["2024ASPC..535..119G", "2022arXiv221200744G", "2023arXiv230213971T", "2023arXiv230308774O"]
]

# ---- threads ----
# onSite items reference real content: {collection, slug}. paper items reference
# bibcodes (her own papers in papers.json, or LIT_PAPERS). reading_order lists
# bibcodes with a one-line rationale. `take` prose is a draft in first person.
THREADS = [
    dict(
        id="navigable-science",
        question="Can scientific literature be made genuinely navigable — not just searchable?",
        status="exploring",
        take=(
            "A ranked list answers one question: which documents match these keywords. It says nothing about "
            "how a field is shaped, which results build on which, where two communities are quietly disagreeing, "
            "or which corner nobody has looked at yet. The work at SciX has been about putting that structure on "
            "top of the ADS corpus, using embeddings for meaning, citation graphs for how the ideas connect, and "
            "controlled vocabularies to keep the grounding honest. What sits below is the current state of that, "
            "and the papers I read to push on it."
        ),
        concepts=["retrieval", "embeddings", "knowledge-graphs", "scientific-search"],
        ads_libraries=["Code Search", "Machine Learning"],
        explorer=None,
        on_site=[
            dict(collection="projects", slug="scix-agent"),
            dict(collection="projects", slug="lit-explorers"),
            dict(collection="projects", slug="code-intelligence-digest"),
            dict(collection="publications", slug="scix-llm-embeddings", bibcode=HER_EMBEDDINGS_PAPER),
            dict(collection="talks", slug="making-scientific-knowledge-navigable"),
        ],
        seed_papers=["2020arXiv200407180C", "2020arXiv200410964G", "2024ASPC..535..119G", "2022arXiv221200744G", "2020arXiv200302320H"],
        reading_order=[
            dict(bibcode="2020arXiv200407180C", why="Start with citation-informed document embeddings: how papers cite each other turns out to teach a model what they mean."),
            dict(bibcode="2020arXiv200410964G", why="Then the case for domain adaptation: generic models leave signal on the table in specialized corpora."),
            dict(bibcode="2024ASPC..535..119G", why="astroBERT applies that to astronomy, a domain model trained on the same ADS corpus I work in."),
            dict(bibcode=HER_EMBEDDINGS_PAPER, why="Our SciX experiments: embeddings + vector search over the live literature, and what broke."),
            dict(bibcode="2020arXiv200302320H", why="Close on knowledge graphs, the structural layer ranked retrieval can never give you."),
        ],
    ),
    dict(
        id="reliable-agents",
        question="What makes multi-agent systems reliable enough to change real production code?",
        status="exploring",
        take=(
            "Most agent demos work once. Production is the opposite problem: the same task run a thousand times, "
            "with no one watching the single run that quietly corrupts a repository. The work at Sourcegraph lives "
            "underneath that, in orchestration, verification, and blast-radius control rather than in cleverer "
            "prompts. Below is what I'm building toward reliability, sitting next to the empirical work on where "
            "agents actually break."
        ),
        concepts=["agents", "code-intelligence", "evaluation"],
        ads_libraries=["Agents"],
        explorer="enterprise-reliability",
        on_site=[
            dict(collection="projects", slug="gascity"),
            dict(collection="projects", slug="gascity-dashboard"),
            dict(collection="projects", slug="background-agents"),
            dict(collection="projects", slug="coding-agent-workflows"),
            dict(collection="writing", slug="why-agent-advocate-exists"),
            dict(collection="writing", slug="coding-agent-unpredictable-failures"),
            dict(collection="writing", slug="multi-agent-pipelines-week"),
            dict(collection="talks", slug="building-a-software-factory"),
        ],
        seed_papers=["2024arXiv240510467L", "2024arXiv240716741W", "2024arXiv240902977L", "2026arXiv260408906Z", "2025arXiv250108243P"],
        reading_order=[
            dict(bibcode="2024arXiv240510467L", why="Vocabulary first: the architectural patterns agents are built from."),
            dict(bibcode="2024arXiv240716741W", why="A concrete open platform for agents that act on real codebases."),
            dict(bibcode="2024arXiv240902977L", why="The survey view across the software-engineering lifecycle."),
            dict(bibcode="2026arXiv260408906Z", why="Then the failure modes: an empirical dissection of where agentic frameworks break."),
            dict(bibcode="2025arXiv250108243P", why="And a production deployment, where reliability stops being academic."),
        ],
    ),
    dict(
        id="agent-memory",
        question="How should agents remember across long horizons?",
        status="open",
        take=(
            "An agent with no memory re-derives the world every turn; an agent that remembers the wrong things "
            "compounds its own mistakes instead. Most of the open work sits between those two failures: what to "
            "store, when to consolidate, and what to let the system forget. I mapped that literature into an "
            "explorer of 108 papers across nine themes and a five-part podcast, so the ideas stay learnable rather "
            "than only citable. The papers below are two recent threads I'm still pulling on."
        ),
        concepts=["agent-memory", "agents", "retrieval"],
        ads_libraries=["Agent Memory"],
        explorer="agentic-memory",
        on_site=[
            dict(collection="learning", slug="agentic-memory-systems"),
            dict(collection="learning", slug="memory-design-considerations"),
            dict(collection="learning", slug="enterprise-multiagent-reliability"),
            dict(collection="projects", slug="mem"),
            dict(collection="learning", slug="podcast-am-ep1"),
        ],
        seed_papers=["2026arXiv260407487L", "2026arXiv260407791F"],
        reading_order=[
            dict(bibcode="2026arXiv260407487L", why="Memory as built from the agent's own experience, via contrastive reflection."),
            dict(bibcode="2026arXiv260407791F", why="Memory as a graph of tools, optimized jointly with the policy."),
        ],
    ),
    dict(
        id="evaluating-agents",
        question="How do we evaluate coding agents honestly, at scale?",
        status="exploring",
        take=(
            "A benchmark that looks impressive and measures nothing is worse than no benchmark, because now the "
            "number carries authority it never earned. Most coding-agent evaluations still test toy tasks, report "
            "one pass rate, and get cited as if they settled the question. The benchmarks I build target large, "
            "real software changes, and the writing next to them is mostly a long argument with the popular ones. "
            "Below is that work and the reading that keeps me honest about what good is supposed to mean."
        ),
        concepts=["evaluation", "agents", "code-intelligence"],
        ads_libraries=["Benchmarks", "CodeContextBench Literature Review"],
        explorer=None,
        on_site=[
            dict(collection="projects", slug="codescalebench"),
            dict(collection="projects", slug="enterprisebench"),
            dict(collection="projects", slug="migration-evals"),
            dict(collection="projects", slug="agent-diagnostics"),
            dict(collection="writing", slug="rethinking-coding-agent-benchmarks"),
            dict(collection="writing", slug="benchmark-large-scale-software-development"),
            dict(collection="writing", slug="coding-agent-unpredictable-failures"),
        ],
        seed_papers=["2024arXiv240600515J", "2024arXiv240202047S", "2023arXiv231114904J", "2024arXiv241220367W", "2024arXiv240902977L"],
        reading_order=[
            dict(bibcode="2024arXiv240600515J", why="The lay of the land: how code-generation models are surveyed and measured."),
            dict(bibcode="2024arXiv240202047S", why="Calibration: whether the models know when they are right, an honesty signal most benchmarks ignore."),
            dict(bibcode="2023arXiv231114904J", why="What goes into training shapes what the benchmark sees: data quality for code generators."),
            dict(bibcode="2024arXiv241220367W", why="Moving past static pass@k toward outcome-based RL signals."),
        ],
    ),
]


def write(name, obj):
    path = os.path.join(OUT, name)
    with open(path, "w") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
    print(f"wrote {name} ({os.path.getsize(path)} bytes)")


def main():
    os.makedirs(OUT, exist_ok=True)
    lit = [
        dict(
            bibcode=b,
            title=v["title"],
            firstAuthor=v["first_author"],
            year=v["year"],
            citationCount=v["citation_count"],
            abstract=v["abstract"],
        )
        for b, v in LIT_PAPERS.items()
    ]
    write("lit-papers.json", {"source": "scix MCP (hybrid search)", "count": len(lit), "papers": lit})
    write("citation-edges.json", {"source": "scix citation_similarity (co_citation)", "edges": CITATION_EDGES})
    write("threads.json", {"count": len(THREADS), "threads": THREADS})


if __name__ == "__main__":
    main()
