#!/usr/bin/env python3
"""Bake semantic embeddings for every knowledge-hub node.

The semantic lane uses a general-purpose sentence-similarity model
(all-mpnet-base-v2, 768-dim). We bake the vectors ONCE here and commit them; the
site reads them at build time (never ships them to the browser) and computes
cosine similarity in TypeScript. Nothing runs at query time, so the page never
exposes an embedding or LLM endpoint. Swap MODEL below for another general model
(e.g. bge-base-en-v1.5) and rerun to re-bake.

Node id scheme (MUST match src/lib/knowledge):
  on-site content : "<collection>:<slug>"   (slug = markdown filename stem)
  papers          : "paper:<bibcode>"        (her ADS papers AND lit papers)

Output: src/data/knowledge/embeddings.json
  { model, dim, normalized: true, vectors: { id: [float, ...] } }
Vectors are L2-normalized so the TS side can use a plain dot product.

Run with the brainstorm venv (has sentence-transformers):
  <brainstorm>/.venv/bin/python3 scripts/knowledge/build_embeddings.py
"""

import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
KN = os.path.join(ROOT, "src", "data", "knowledge")
CONTENT = os.path.join(ROOT, "src", "content")

# Collections whose items can appear as hub nodes.
COLLECTIONS = ["projects", "writing", "talks", "learning", "topics", "publications"]

FM_RE = re.compile(r"^---\s*\n(.*?)\n---", re.DOTALL)


def fm_value(block: str, key: str) -> str:
    """Pull a single-line scalar from a YAML frontmatter block (best-effort)."""
    m = re.search(rf"^{key}:\s*(.+)$", block, re.MULTILINE)
    if not m:
        return ""
    val = m.group(1).strip()
    if val and val[0] in "\"'" and val[-1] == val[0]:
        val = val[1:-1]
    return val


def content_nodes() -> dict:
    nodes = {}
    for col in COLLECTIONS:
        for path in glob.glob(os.path.join(CONTENT, col, "*.md")) + glob.glob(
            os.path.join(CONTENT, col, "*.mdx")
        ):
            slug = os.path.splitext(os.path.basename(path))[0]
            with open(path) as f:
                text = f.read()
            m = FM_RE.search(text)
            block = m.group(1) if m else ""
            title = fm_value(block, "title")
            summary = fm_value(block, "summary") or fm_value(block, "description")
            blurb = ". ".join(x for x in (title, summary) if x)
            if blurb:
                nodes[f"{col}:{slug}"] = blurb
    return nodes


def add_papers(nodes: dict, papers: list) -> None:
    for p in papers:
        bib = p.get("bibcode")
        if not bib or f"paper:{bib}" in nodes:
            continue
        blurb = ". ".join(x for x in (p.get("title", ""), p.get("abstract", "")) if x)
        if blurb:
            nodes[f"paper:{bib}"] = blurb


def paper_nodes() -> dict:
    nodes: dict = {}
    for fname in ("papers.json", "lit-papers.json"):
        path = os.path.join(KN, fname)
        if os.path.exists(path):
            add_papers(nodes, json.load(open(path)).get("papers", []))
    # ADS biblib libraries
    libs_path = os.path.join(KN, "libraries.json")
    if os.path.exists(libs_path):
        for lib in json.load(open(libs_path)).get("libraries", []):
            add_papers(nodes, lib.get("papers", []))
    # thematic explorer papers
    exp_path = os.path.join(KN, "explorers.json")
    if os.path.exists(exp_path):
        for exp in json.load(open(exp_path)).get("explorers", []):
            add_papers(nodes, exp.get("papers", []))
    return nodes


def main():
    nodes = {**content_nodes(), **paper_nodes()}
    ids = sorted(nodes)
    texts = [nodes[i] for i in ids]
    print(f"embedding {len(ids)} nodes...")

    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        sys.exit("sentence-transformers not available — run with the brainstorm venv python")

    MODEL = "sentence-transformers/all-mpnet-base-v2"
    model = SentenceTransformer(MODEL)
    vecs = model.encode(texts, normalize_embeddings=True, batch_size=32, show_progress_bar=False)

    vectors = {i: [round(float(x), 5) for x in vecs[n]] for n, i in enumerate(ids)}
    out = {
        "model": MODEL.split("/")[-1],
        "dim": int(vecs.shape[1]),
        "normalized": True,
        "note": "General-purpose sentence model, baked at build time. No runtime embedding/LLM endpoint.",
        "vectors": vectors,
    }
    path = os.path.join(KN, "embeddings.json")
    with open(path, "w") as f:
        json.dump(out, f)
    print(f"wrote embeddings.json ({os.path.getsize(path)} bytes, dim={out['dim']})")


if __name__ == "__main__":
    main()
