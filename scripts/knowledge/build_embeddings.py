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
  concepts        : "concept:<slug>"         (registry: src/content/concepts)

Output: src/data/knowledge/embeddings.json
  { model, dim, normalized: true, toolchain, vectors: { id: [float, ...] } }
Vectors are L2-normalized so the TS side can use a plain dot product.
`toolchain` pins the model name and key library versions used for the bake.

Recompute rides the backfill/registry-apply step, NOT any cron/sync path.
Run with the brainstorm venv (has sentence-transformers):
  <brainstorm>/.venv/bin/python3 scripts/knowledge/build_embeddings.py
"""

import glob
import json
import os
import platform
import re
import sys
from importlib import metadata

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
KN = os.path.join(ROOT, "src", "data", "knowledge")
CONTENT = os.path.join(ROOT, "src", "content")

MODEL = "sentence-transformers/all-mpnet-base-v2"

# Libraries whose versions pin the bake (recorded in embeddings.json metadata).
TOOLCHAIN_LIBRARIES = ("sentence-transformers", "torch", "transformers", "numpy")

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


def concept_nodes(concepts_dir: str = os.path.join(CONTENT, "concepts")) -> dict:
    """One `concept:<slug>` node per registry entry, embedded from label + definition.

    Unlike the best-effort content collections, `label` and `definition` are
    required registry fields (conceptAliases.ts enforces the same), so a missing
    one is a hard error — every concept MUST get a vector.
    """
    nodes = {}
    for path in sorted(
        glob.glob(os.path.join(concepts_dir, "*.md"))
        + glob.glob(os.path.join(concepts_dir, "*.mdx"))
    ):
        slug = os.path.splitext(os.path.basename(path))[0]
        with open(path) as f:
            text = f.read()
        m = FM_RE.search(text)
        block = m.group(1) if m else ""
        label = fm_value(block, "label")
        definition = fm_value(block, "definition")
        if not label or not definition:
            raise ValueError(f"concept:{slug}: label and definition are required frontmatter fields")
        nodes[f"concept:{slug}"] = f"{label}. {definition}"
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


def collect_nodes() -> dict:
    """Every node to embed: on-site content, papers, and registry concepts."""
    return {**content_nodes(), **paper_nodes(), **concept_nodes()}


def toolchain_versions() -> dict:
    """Pin the bake: python plus installed versions of the model libraries."""
    versions = {"python": platform.python_version()}
    for lib in TOOLCHAIN_LIBRARIES:
        try:
            versions[lib.replace("-", "_")] = metadata.version(lib)
        except metadata.PackageNotFoundError:
            continue  # not installed => not part of this bake
    return versions


def bake(nodes: dict, encode, model_name: str, toolchain: dict) -> dict:
    """Pure bake core: encode blurbs, validate shape, return the output dict.

    ``encode`` is injected (texts -> rows of floats) so tests never load a model.
    """
    if not nodes:
        raise ValueError("no nodes to embed")
    ids = sorted(nodes)
    vecs = [[float(x) for x in row] for row in encode([nodes[i] for i in ids])]
    if len(vecs) != len(ids):
        raise ValueError(f"encoder returned {len(vecs)} rows for {len(ids)} texts")
    dim = len(vecs[0])
    if dim == 0 or any(len(v) != dim for v in vecs):
        raise ValueError("encoder returned empty or ragged rows (inconsistent dim)")
    return {
        "model": model_name.split("/")[-1],
        "dim": dim,
        "normalized": True,
        "toolchain": toolchain,
        "note": "General-purpose sentence model, baked at build time. No runtime embedding/LLM endpoint.",
        "vectors": {i: [round(x, 5) for x in v] for i, v in zip(ids, vecs)},
    }


def main():
    nodes = collect_nodes()
    print(f"embedding {len(nodes)} nodes...")

    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        sys.exit("sentence-transformers not available — run with the brainstorm venv python")

    model = SentenceTransformer(MODEL)

    def encode(texts):
        return model.encode(texts, normalize_embeddings=True, batch_size=32, show_progress_bar=False)

    out = bake(nodes, encode, model_name=MODEL, toolchain=toolchain_versions())
    path = os.path.join(KN, "embeddings.json")
    with open(path, "w") as f:
        json.dump(out, f)
    print(f"wrote embeddings.json ({os.path.getsize(path)} bytes, dim={out['dim']})")


if __name__ == "__main__":
    main()
