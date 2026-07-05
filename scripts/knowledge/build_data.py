#!/usr/bin/env python3
"""Emit the curated knowledge-hub thread data, and hold the editorial layer.

This module owns the *editorial* curation: which papers belong to which thread,
the reading order, the framing prose, and the one-line gloss for each external
paper (``LIT_GLOSS``). It emits ``threads.json`` directly. The *mechanical*
snapshots — ``lit-papers.json`` (per-paper title/author/year/citation count) and
``citation-edges.json`` (co-citation graph lane) — are regenerated from the live
scix corpus by the sibling ``refresh_scix_data.py``, which imports ``LIT_GLOSS``
and ``HER_EMBEDDINGS_PAPER`` from here. Her own papers live in papers.json.

The curation below is editorial and meant to be edited in place; re-run this
script after editing to regenerate threads.json, then run refresh_scix_data.py
to refresh the mechanical snapshots.

Outputs (src/data/knowledge/):
  threads.json        the four threads with curation + reading order
"""

import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "src", "data", "knowledge"))

# ---- editorial gloss for each external literature paper ----
# bibcode -> a one-line editorial take tying the paper to the thread narrative.
# This is NOT the paper's real abstract; it is curation, edited in place. The
# mechanical fields (title, author, year, citation count) are fetched fresh by
# refresh_scix_data.py, which uses these keys as the external-paper set. Order
# is preserved into lit-papers.json, so keep it grouped by thread.
LIT_GLOSS = {
    # navigable-science
    "2020arXiv200407180C": "Citation-informed transformer embeddings for scientific documents; the lineage behind SPECTER2, one of the embedding models used in SciX.",
    "2020arXiv200302320H": "A comprehensive introduction to knowledge graphs; the structural backbone for representing scientific knowledge beyond ranked lists.",
    "2020arXiv200410964G": "Domain-adaptive pretraining; the argument for domain-specific scientific models like INDUS over generic embeddings.",
    "2024ASPC..535..119G": "A domain language model for the NASA ADS corpus; co-cited with the SciX embeddings work.",
    "2022arXiv221200744G": "STS fine-tuning of astroBERT over the ADS literature.",
    "2023arXiv230213971T": "Open foundation models; co-cited with the SciX embeddings work as the general-model backdrop.",
    "2023arXiv230308774O": "Frontier general model; co-cited with the SciX embeddings work.",
    # reliable-agents
    "2024arXiv240716741W": "An open platform for AI software-developer agents; a reference architecture for agents that act on real codebases.",
    "2024arXiv240510467L": "A catalogue of architectural patterns for foundation-model agents; vocabulary for reasoning about reliability.",
    "2026arXiv260408906Z": "Empirical study of where agentic frameworks (CrewAI, AutoGen) break; directly about reliability failure modes.",
    "2025arXiv250108243P": "Engineering a production multi-agent system for autonomous operations; a real deployment case study.",
    "2024arXiv240902977L": "A survey of LLM agents across the software-engineering lifecycle.",
    # agent-memory
    "2026arXiv260407487L": "Building task-relevant context from an agent's own experience via contrastive reflection; a memory/context-engineering approach.",
    "2026arXiv260407791F": "A graph-structured tool memory jointly optimized with policy for self-evolving agents.",
    # evaluating-agents
    "2024arXiv240202047S": "Whether code models know when they are right; calibration as an honest-evaluation signal.",
    "2024arXiv240600515J": "A broad survey of code-generation LLMs and how they are measured.",
    "2023arXiv231114904J": "Data quality for code generators; what goes in shapes what the benchmark sees come out.",
    "2024arXiv241220367W": "RL for code generation; moving evaluation from static benchmarks toward outcome signals.",
}

# Her ADS bibcode for "Experimenting with LLMs and vector embeddings in NASA SciX";
# the source node for the co-citation graph lane (edges built in refresh_scix_data.py).
HER_EMBEDDINGS_PAPER = "2023arXiv231214211B"

# ---- threads ----
# onSite items reference real content: {collection, slug}. paper items reference
# bibcodes (her own papers in papers.json, or LIT_GLOSS). reading_order lists
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
        concepts=["retrieval", "embeddings", "scientific-search"],
        ads_libraries=["Scientific Search & SciX"],
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
        ads_libraries=["Coding Agents"],
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
        ads_libraries=["Benchmarks", "Code Generation & Retrieval"],
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
    write("threads.json", {"count": len(THREADS), "threads": THREADS})


if __name__ == "__main__":
    main()
