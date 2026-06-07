#!/usr/bin/env python3
"""Pull Stephanie's curated NASA ADS biblib libraries into committed JSON.

This is the same data source the code-intelligence-digest libraries page uses
(src/lib/ads/client.ts: listLibraries / getLibraryItems). The site is static,
so we snapshot at author time and commit the result; rerun to refresh.

Auth: ADS_API_TOKEN from .env (the personal token; biblib is per-user).
Endpoints:
  GET /v1/biblib/libraries                 -> list libraries
  GET /v1/biblib/libraries/{id}?start&rows -> document bibcodes in a library
  GET /v1/search/query?q=bibcode:(...)     -> metadata for those bibcodes

Output: src/data/knowledge/libraries.json
"""

import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

BIBLIB = "https://api.adsabs.harvard.edu/v1/biblib"
SEARCH = "https://api.adsabs.harvard.edu/v1/search/query"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "src", "data", "knowledge"))
META_FIELDS = "bibcode,title,author,year,pubdate,doctype,citation_count,abstract,identifier"

# ---- site curation (display-only; does NOT modify anything on NASA ADS) ----
# The site shows a clean thematic subset of the ADS libraries. To re-sync after
# editing libraries on ADS, just rerun this script.
EXCLUDE = {"CodeContextBench Literature Review", "Oreilly", "LLM Research"}
RENAME = {
    "Agents": "Coding Agents",
    "Code Search": "Code Generation & Retrieval",
}
# display name -> (source ADS library names, description). Papers are deduped.
MERGE = {
    "Scientific Search & SciX": (
        ["SciX 2024 Bibliography", "Machine Learning"],
        "Navigating scientific literature: NASA ADS / SciX information systems, "
        "scientific language models, and fine-grained classification of research text.",
    ),
}
DESCRIPTIONS = {
    "Coding Agents": "Software-engineering agents: architectures, multi-agent coding, and how developers work with them.",
    "Benchmarks": "Evaluating coding agents and code models on real software work.",
    "Code Generation & Retrieval": "Code generation, context retrieval, and localization for coding agents.",
    "Agent Memory": "Long-horizon memory for LLM agents: storage, consolidation, and forgetting.",
}
ORDER = ["Coding Agents", "Benchmarks", "Code Generation & Retrieval", "Agent Memory", "Scientific Search & SciX"]


def slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def curate(libs: list[dict]) -> list[dict]:
    by_name = {L["name"]: L for L in libs}
    curated: list[dict] = []
    merged_sources: set[str] = set()

    for disp, (sources, desc) in MERGE.items():
        papers, seen, public = [], set(), False
        for s in sources:
            L = by_name.get(s)
            if not L:
                continue
            merged_sources.add(s)
            public = public or L["public"]
            for p in L["papers"]:
                if p["bibcode"] not in seen:
                    seen.add(p["bibcode"])
                    papers.append(p)
        papers.sort(key=lambda p: (p.get("pubdate") or ""), reverse=True)
        curated.append({"id": slug(disp), "name": disp, "description": desc,
                        "public": public, "numDocuments": len(papers), "papers": papers})

    for L in libs:
        if L["name"] in EXCLUDE or L["name"] in merged_sources:
            continue
        name = RENAME.get(L["name"], L["name"])
        curated.append({**L, "id": slug(name), "name": name,
                        "description": DESCRIPTIONS.get(name, L["description"])})

    rank = {n: i for i, n in enumerate(ORDER)}
    curated.sort(key=lambda L: rank.get(L["name"], 99))
    return curated


def token() -> str:
    env = os.path.join(HERE, "..", "..", ".env")
    for line in open(env):
        if line.startswith("ADS_API_TOKEN="):
            return line.split("=", 1)[1].strip().strip("\"'")
    sys.exit("ADS_API_TOKEN not found in .env")


def get(url: str, tok: str) -> dict:
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {tok}"})
    return json.load(urllib.request.urlopen(req, timeout=40))


def library_bibcodes(lib_id: str, total: int, tok: str) -> list[str]:
    out: list[str] = []
    rows = 200
    for start in range(0, total, rows):
        d = get(f"{BIBLIB}/libraries/{lib_id}?start={start}&rows={rows}", tok)
        docs = d.get("documents") or d.get("solr", {}).get("response", {}).get("docs", [])
        out.extend(b if isinstance(b, str) else b.get("bibcode") for b in docs)
        time.sleep(0.2)
    return [b for b in out if b]


def fetch_metadata(bibcodes: list[str], tok: str) -> dict:
    meta: dict[str, dict] = {}
    for i in range(0, len(bibcodes), 50):
        chunk = bibcodes[i : i + 50]
        q = "bibcode:(" + " OR ".join(f'"{b}"' for b in chunk) + ")"
        url = SEARCH + "?" + urllib.parse.urlencode({"q": q, "fl": META_FIELDS, "rows": len(chunk)})
        for doc in get(url, tok).get("response", {}).get("docs", []):
            ident = doc.get("identifier") or []
            arxiv = next((x.split(":", 1)[1] for x in ident if x.lower().startswith("arxiv:")), None)
            authors = doc.get("author") or []
            meta[doc["bibcode"]] = {
                "bibcode": doc["bibcode"],
                "title": (doc.get("title") or [""])[0],
                "firstAuthor": authors[0] if authors else "",
                "authorCount": len(authors),
                "year": doc.get("year"),
                "pubdate": doc.get("pubdate"),
                "doctype": doc.get("doctype"),
                "citationCount": doc.get("citation_count", 0),
                "abstract": (doc.get("abstract") or "")[:700],
                "adsUrl": f"https://ui.adsabs.harvard.edu/abs/{urllib.parse.quote(doc['bibcode'])}/abstract",
                "arxiv": arxiv,
            }
        time.sleep(0.2)
    return meta


def main() -> None:
    tok = token()
    libs = sorted(
        get(f"{BIBLIB}/libraries", tok).get("libraries", []),
        key=lambda L: -(L.get("num_documents") or 0),
    )
    out = []
    for L in libs:
        bibs = library_bibcodes(L["id"], L.get("num_documents", 0), tok)
        meta = fetch_metadata(bibs, tok)
        papers = [meta[b] for b in bibs if b in meta]
        papers.sort(key=lambda p: (p.get("pubdate") or ""), reverse=True)
        out.append({
            "id": L["id"],
            "name": L.get("name"),
            "description": (L.get("description") or "").replace("My ADS library", "").strip(),
            "public": L.get("public", False),
            "numDocuments": L.get("num_documents", 0),
            "papers": papers,
        })
        print(f"  fetched {L.get('name'):<34} {len(papers)}/{L.get('num_documents')} papers")

    curated = curate(out)
    print("\ncurated for the site:")
    for L in curated:
        print(f"  {L['name']:<32} {L['numDocuments']} papers")

    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, "libraries.json")
    with open(path, "w") as f:
        json.dump({"source": "NASA ADS biblib", "count": len(curated), "libraries": curated}, f, ensure_ascii=False)
    print(f"wrote libraries.json ({os.path.getsize(path)} bytes)")


if __name__ == "__main__":
    main()
