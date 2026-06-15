#!/usr/bin/env python3
"""Assemble the thematic explorers into the committed combined JSON.

The explorers are now self-contained in this repo. Each explorer's canonical
source lives in src/data/knowledge/explorers/<id>.json (one file per explorer,
hand- and agent-editable). This script reads those source files in the order
listed in explorers/_order.json, validates their shape, recomputes derived
counts (so they stay honest as papers are added), and assembles the combined
artifact the site imports.

Previously this pulled from the external /home/ds/projects/lit_explorers repo;
that dependency has been removed — the per-explorer source files ARE the source
of truth. Run this after editing any explorers/<id>.json.

Output: src/data/knowledge/explorers.json
"""

import html
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
KN = os.path.normpath(os.path.join(HERE, "..", "..", "src", "data", "knowledge"))
SRCDIR = os.path.join(KN, "explorers")
ORDER_FILE = os.path.join(SRCDIR, "_order.json")

REQUIRED_KEYS = ("id", "title", "learningSlug", "homepage", "papers", "sections")


def unescape(value):
    """Decode HTML entities in every string field (idempotent on plain text).

    The site renders these strings as text. Source files are stored already
    decoded; this stays as a defensive pass so prose pasted with entities
    (&mdash;, &rarr;, &amp; ...) still renders correctly.
    """
    if isinstance(value, str):
        return html.unescape(value)
    if isinstance(value, list):
        return [unescape(v) for v in value]
    if isinstance(value, dict):
        return {k: unescape(v) for k, v in value.items()}
    return value


def validate(exp: dict, path: str) -> None:
    """Fail loudly on a malformed explorer source file."""
    missing = [k for k in REQUIRED_KEYS if k not in exp]
    if missing:
        raise ValueError(f"{path}: missing required keys {missing}")
    if not isinstance(exp["papers"], list) or not isinstance(exp["sections"], list):
        raise ValueError(f"{path}: 'papers' and 'sections' must be lists")
    for i, p in enumerate(exp["papers"]):
        if not p.get("title"):
            raise ValueError(f"{path}: papers[{i}] has no title")
        for j, n in enumerate(p.get("notes") or []):
            extra = set(n) - {"branch", "takeaway", "why"}
            if extra:
                raise ValueError(
                    f"{path}: papers[{i}].notes[{j}] has unexpected keys {extra}; "
                    "expected branch/takeaway/why"
                )


def load_explorer(eid: str) -> dict:
    path = os.path.join(SRCDIR, f"{eid}.json")
    with open(path, encoding="utf-8") as f:
        exp = json.load(f)
    validate(exp, path)
    # Recompute derived counts so they stay consistent as papers/themes change.
    exp["paperCount"] = len(exp["papers"])
    exp["themeCount"] = len(exp["sections"])
    return exp


def main() -> None:
    with open(ORDER_FILE, encoding="utf-8") as f:
        order = json.load(f)
    explorers = []
    for eid in order:
        exp = load_explorer(eid)
        explorers.append(exp)
        print(
            f"  {eid:<26} {exp['paperCount']} papers · {exp['themeCount']} themes "
            f"· {len(exp.get('opportunities') or [])} opportunities"
        )
    path = os.path.join(KN, "explorers.json")
    with open(path, "w") as f:
        json.dump(unescape({"source": "explorers", "explorers": explorers}), f, ensure_ascii=False)
    print(f"wrote explorers.json ({os.path.getsize(path)} bytes, {len(explorers)} explorers)")


if __name__ == "__main__":
    main()
