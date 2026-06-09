#!/usr/bin/env python3
"""Extract the lit_explorers thematic data into committed JSON.

Each explorer at /home/ds/lit_explorers embeds its data in a
<script id="data" type="application/json"> blob. We normalize the three
explorers into a common shape: papers, themed sections, a reading order, and
open opportunities. These map to the /learning explorer entries on the site.

Output: src/data/knowledge/explorers.json
"""

import html
import json
import os
import re

LIT = "/home/ds/projects/lit_explorers"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "src", "data", "knowledge"))

# All five explorers embed their data in a <script id="data"> blob in the
# committed HTML, so this script regenerates explorers.json in full.
SPECS = [
    {"file": "agentic_memory_explorer.html", "id": "agentic-memory",
     "title": "Agentic Memory Systems", "learningSlug": "agentic-memory-systems",
     "homepage": "https://sjarmak.github.io/lit_explorers/agentic_memory_explorer.html"},
    {"file": "memory_design_explorer.html", "id": "memory-design",
     "title": "Memory Design Considerations", "learningSlug": "memory-design-considerations",
     "homepage": "https://sjarmak.github.io/lit_explorers/memory_design_explorer.html"},
    {"file": "enterprise_multiagent_reliability.html", "id": "enterprise-reliability",
     "title": "Enterprise Multi-Agent Reliability", "learningSlug": "enterprise-multiagent-reliability",
     "homepage": "https://sjarmak.github.io/lit_explorers/enterprise_multiagent_reliability.html"},
    {"file": "multiagent_orchestration_explorer.html", "id": "multiagent-orchestration",
     "title": "Multi-Agent Orchestration", "learningSlug": None,
     "homepage": "https://sjarmak.github.io/lit_explorers/multiagent_orchestration_explorer.html"},
    {"file": "code_retrieval_enterprise_explorer.html", "id": "code-retrieval-enterprise",
     "title": "Code Retrieval & Enterprise Codebases", "learningSlug": None,
     "homepage": "https://sjarmak.github.io/lit_explorers/code_retrieval_enterprise_explorer.html"},
]


def unescape(value):
    """Decode HTML entities (&mdash;, &rarr;, &amp; ...) in every string field.

    The source explorer HTML stores prose with HTML entities; the site renders
    these strings as text, so they must be decoded or they show up literally.
    """
    if isinstance(value, str):
        return html.unescape(value)
    if isinstance(value, list):
        return [unescape(v) for v in value]
    if isinstance(value, dict):
        return {k: unescape(v) for k, v in value.items()}
    return value


def load_blob(path: str) -> dict:
    markup = open(path, encoding="utf-8").read()
    m = re.search(r'<script id="data" type="application/json">(.*?)</script>', markup, re.S)
    return json.loads(m.group(1))


def norm_notes(p: dict) -> list:
    """Normalize the SciX-generated per-paper notes into a common shape.

    Most explorers use {branch, k, r} (key takeaway / why it matters); the
    enterprise one uses {branch, signal, prod}. Map both onto takeaway/why.
    """
    out = []
    for n in p.get("notes") or []:
        takeaway = n.get("k") or n.get("signal") or ""
        why = n.get("r") or n.get("prod") or ""
        if takeaway or why:
            out.append({"branch": n.get("branch") or "", "takeaway": takeaway, "why": why})
    return out


def norm_paper(p: dict) -> dict:
    # papers (agentic/enterprise) vs sources (memory-design) have different keys.
    title = p.get("title", "")
    year = p.get("year")
    if not year and p.get("date"):
        year = str(p["date"])[:4]
    return {
        "bibcode": p.get("bibcode") or p.get("real_bibcode"),
        "title": title,
        "firstAuthor": p.get("first_author") or p.get("author") or "",
        "year": year,
        "citationCount": int(p.get("citation_count") or 0) if str(p.get("citation_count") or "0").isdigit() else 0,
        "arxiv": p.get("arxiv"),
        "url": p.get("url"),
        "branches": p.get("branches"),
        "notes": norm_notes(p),
    }


def norm_section(s: dict) -> dict:
    return {
        "key": s.get("key"),
        "label": s.get("label"),
        "summary": s.get("subtopic") or s.get("consideration") or "",
        "themes": s.get("themes") or [],
        "gaps": s.get("gaps") or [],
        "questions": s.get("questions") or [],
        "count": len(s.get("papers") or s.get("sources") or []),
    }


def main() -> None:
    explorers = []
    for spec in SPECS:
        d = load_blob(os.path.join(LIT, spec["file"]))
        raw_papers = d.get("papers") or d.get("sources") or []
        papers = [norm_paper(p) for p in raw_papers]
        sections = [norm_section(s) for s in (d.get("sections") or [])]
        # opportunities: explicit list, else gaps/questions rolled up from sections
        opportunities = d.get("opportunities") or []
        if not opportunities:
            for s in sections:
                opportunities.extend(s.get("gaps") or s.get("questions") or [])
        explorers.append({
            **{k: spec[k] for k in ("id", "title", "learningSlug", "homepage")},
            "paperCount": len(papers),
            "themeCount": len(sections),
            "papers": papers,
            "sections": sections,
            "reading": d.get("reading") or [],
            "opportunities": opportunities[:12],
            "practices": d.get("practices") or [],
        })
        print(f"  {spec['id']:<22} {len(papers)} papers · {len(sections)} themes · {len(opportunities)} opportunities")
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, "explorers.json")
    with open(path, "w") as f:
        json.dump(unescape({"source": "lit_explorers", "explorers": explorers}), f, ensure_ascii=False)
    print(f"wrote explorers.json ({os.path.getsize(path)} bytes)")


if __name__ == "__main__":
    main()
