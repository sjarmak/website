#!/usr/bin/env python3
"""Extract the research papers a digest cited, for the daily knowledge-sync check.

Deterministic prep step (no model judgment here — that is the agent's job): read
a published digest's frontmatter, keep the `research` items, pull each paper's
arXiv id / ADS bibcode out of its URL, and precompute which of our libraries /
explorers already contain it (mechanical id match). Also emits a compact view of
the library + explorer targets so the classifying agent does not have to load the
full data files just to see what exists.

Outputs into .knowledge-sync/<date>/:
  candidates.json  — research papers from the digest, with `alreadyIn` precomputed
  context.json     — library + explorer targets (id, name/title, description, branches)

Exit code 3 (and no files written) when the digest has no new research papers to
consider, so the orchestrator can skip cleanly.

Usage:
  sync_candidates.py [--date YYYY-MM-DD] [--mode daily] [--out DIR]
"""

import argparse
import json
import os
import re
import sys
import urllib.parse
from datetime import date as date_cls

import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
KN = os.path.join(ROOT, "src", "data", "knowledge")
DIGEST_DIR = os.path.join(ROOT, "src", "content", "digest")


def parse_frontmatter(path: str) -> dict:
    text = open(path, encoding="utf-8").read()
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        raise ValueError(f"{path}: no YAML frontmatter found")
    return yaml.safe_load(m.group(1)) or {}


def ids_from_url(url: str) -> dict:
    """Pull an arXiv id and/or ADS bibcode out of a digest item URL."""
    out: dict = {"arxiv": None, "bibcode": None}
    u = url.strip()
    m = re.search(r"arxiv\.org/(?:abs|html|pdf)/([^?#v]+)", u, re.I)
    if m:
        out["arxiv"] = m.group(1).rstrip("/")
    m = re.search(r"ui\.adsabs\.harvard\.edu/abs/([^/?#]+)", u, re.I)
    if m:
        out["bibcode"] = urllib.parse.unquote(m.group(1))
    return out


def load_membership() -> dict:
    """Map every arXiv id / bibcode we already track to the targets holding it."""
    lib_index: dict[str, set] = {}
    exp_index: dict[str, set] = {}

    def add(index: dict, key: str | None, target: str) -> None:
        if key:
            index.setdefault(key, set()).add(target)

    libs = json.load(open(os.path.join(KN, "libraries.json")))["libraries"]
    for L in libs:
        for p in L["papers"]:
            add(lib_index, p.get("bibcode"), L["id"])
            add(lib_index, p.get("arxiv"), L["id"])

    explorers = json.load(open(os.path.join(KN, "explorers.json")))["explorers"]
    for e in explorers:
        for p in e["papers"]:
            add(exp_index, p.get("bibcode"), e["id"])
            add(exp_index, p.get("arxiv"), e["id"])

    return {"lib_index": lib_index, "exp_index": exp_index, "libs": libs, "explorers": explorers}


def build_context(libs: list[dict], explorers: list[dict]) -> dict:
    return {
        "libraries": [
            {"id": L["id"], "name": L["name"], "description": L.get("description", ""),
             "adsLibraryId": L.get("adsLibraryId")}
            for L in libs
        ],
        "explorers": [
            {"id": e["id"], "title": e["title"],
             "branches": [{"key": s.get("key"), "label": s.get("label"), "summary": s.get("summary", "")}
                          for s in e.get("sections", [])]}
            for e in explorers
        ],
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=date_cls.today().isoformat())
    ap.add_argument("--mode", default="daily", help="digest mode prefix, e.g. daily / weekly")
    ap.add_argument("--out", default=None, help="output dir (default .knowledge-sync/<date>)")
    args = ap.parse_args()

    digest_path = os.path.join(DIGEST_DIR, f"{args.mode}-{args.date}.md")
    if not os.path.exists(digest_path):
        # Not an error: the digest may simply not have published yet. Treat as a
        # clean skip (exit 3) so the cron-driven orchestrator no-ops quietly.
        print(f"no digest at {digest_path} — nothing to consider")
        return 3

    fm = parse_frontmatter(digest_path)
    mem = load_membership()
    lib_index, exp_index = mem["lib_index"], mem["exp_index"]

    candidates = []
    for item in fm.get("items") or []:
        if item.get("category") != "research":
            continue
        ids = ids_from_url(item.get("url", ""))
        keys = [k for k in (ids["arxiv"], ids["bibcode"]) if k]
        already_libs = sorted({t for k in keys for t in lib_index.get(k, ())})
        already_exps = sorted({t for k in keys for t in exp_index.get(k, ())})
        candidates.append({
            "title": item.get("title", "").strip(),
            "url": item.get("url", ""),
            "source": item.get("source", ""),
            "arxiv": ids["arxiv"],
            "bibcode": ids["bibcode"],
            "alreadyInLibraries": already_libs,
            "alreadyInExplorers": already_exps,
        })

    if not candidates:
        print(f"{args.mode}-{args.date}: no research items to consider")
        return 3

    out_dir = args.out or os.path.join(ROOT, ".knowledge-sync", args.date)
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "candidates.json"), "w") as f:
        json.dump({"date": args.date, "mode": args.mode, "digest": os.path.relpath(digest_path, ROOT),
                   "candidates": candidates}, f, ensure_ascii=False, indent=2)
        f.write("\n")
    with open(os.path.join(out_dir, "context.json"), "w") as f:
        json.dump(build_context(mem["libs"], mem["explorers"]), f, ensure_ascii=False, indent=2)
        f.write("\n")

    fresh = [c for c in candidates if not c["alreadyInLibraries"] or not c["alreadyInExplorers"]]
    print(f"{args.mode}-{args.date}: {len(candidates)} research items "
          f"({len(fresh)} not yet fully filed) -> {os.path.relpath(out_dir, ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
