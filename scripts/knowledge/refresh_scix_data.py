#!/usr/bin/env python3
"""Refresh lit-papers.json + citation-edges.json from the live scix corpus.

Mechanical companion to ``build_data.py``. The *editorial* layer — which papers
matter, their one-line glosses, and the threads — lives in ``build_data.py`` as
``LIT_GLOSS`` / ``THREADS``. Here we fetch the *volatile mechanical* metadata
(title, first author, year, citation count) and the co-citation edges from scix
via its CLI, so the snapshots stay current without hand-editing constants.

The ``abstract`` field is the editorial gloss (a one-line take tying the paper to
the thread narrative), NOT the paper's real abstract; it is preserved verbatim
and only the mechanical fields are refreshed.

Run on the host where scix is installed and the prod DB is reachable. Override
the CLI command with ``SCIX_CLI`` (default ``scix``); e.g. ``SCIX_CLI='python -m
scix.cli'``. Both tools used here (``get_paper``, ``citation_similarity``) are
DB-only, so no embedding model is loaded.

Failure policy (deliberately no error-swallowing):
  * scix unreachable / nonzero exit / unparseable output -> raise, write nothing,
    exit non-zero. The committed snapshots are left untouched so the site still
    builds (it reads the committed JSON, never scix).
  * a curated bibcode legitimately absent from the local mirror (a *successful*
    call returning no paper) -> retain its prior snapshot metadata + warn.
"""

from __future__ import annotations

import html
import json
import os
import shlex
import subprocess
import sys
from collections.abc import Callable, Mapping
from typing import Any

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "src", "data", "knowledge"))

# The scix tools are fast DB queries, but each call is a cold `python -m scix.cli`
# start; the timeout guards the trust boundary (a hung prod DB / dead proxy) and
# is generous enough for the import cost. Matches build_libraries.py's convention.
_CLI_TIMEOUT_S = 120
_STDERR_PREVIEW_CHARS = 200
# citation_similarity ranks by score with a default limit of 20; request well
# past the curated node count so a ranking cutoff can never silently drop an edge
# to a lit-papers node (build_edges filters to nodes anyway).
_SIMILARITY_LIMIT = 200

sys.path.insert(0, HERE)  # sibling import regardless of cwd / invocation
from build_data import HER_EMBEDDINGS_PAPER, LIT_GLOSS  # noqa: E402


class ScixUnavailable(RuntimeError):
    """The scix CLI could not be run or returned an unusable result (hard fail)."""


class RefreshError(RuntimeError):
    """The corpus data is inconsistent with the editorial layer (hard fail)."""


# ---- pure core (injected fetch; no IO, unit-testable without a DB) ----

def _require_papers(result: Mapping[str, Any]) -> list[Any]:
    """Return the tool's ``papers`` list; a *missing* key is a contract violation.

    A successful call with ``papers: []`` (paper absent from the mirror) is a
    legitimate empty result; a response with no ``papers`` key at all means the
    CLI shape changed — surface it rather than silently treating it as absence.
    """
    if "papers" not in result:
        raise ScixUnavailable(f"scix result missing 'papers' key (got {sorted(result)[:5]})")
    return result["papers"] or []


def _lit_entry(bibcode: str, gloss: str, paper: Mapping[str, Any]) -> dict[str, Any]:
    """Map a ``get_paper`` paper (snake_case) to the site's camelCase shape.

    ADS titles/authors are HTML-entity-encoded (``&amp;``, ``&lt;`` ...); the site
    renders them as text, so decode them here — same convention as the sibling
    ``build_libraries.py`` / ``build_explorers.py`` builders.
    """
    return {
        "bibcode": bibcode,
        "title": html.unescape(paper["title"]),
        "firstAuthor": html.unescape(paper["first_author"]),
        "year": paper["year"],
        "citationCount": paper["citation_count"],
        "abstract": gloss,
    }


def build_lit_papers(
    gloss: Mapping[str, str],
    fetch: Callable[[str], Mapping[str, Any]],
    prior_by_bibcode: Mapping[str, dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[str]]:
    """Build the lit-papers list, preserving ``gloss`` insertion order.

    ``fetch(bibcode)`` returns the parsed ``get_paper`` JSON; it may raise
    ``ScixUnavailable`` (propagated, aborting the run). A successful call with an
    empty ``papers`` list means the paper is absent from the local mirror.
    """
    papers: list[dict[str, Any]] = []
    skip_warnings: list[str] = []
    for bibcode, g in gloss.items():
        got = _require_papers(fetch(bibcode))
        if got:
            papers.append(_lit_entry(bibcode, g, got[0]))
            continue
        prior = prior_by_bibcode.get(bibcode)
        if prior is None:
            raise RefreshError(
                f"{bibcode} is absent from the local mirror and has no prior "
                "snapshot entry to fall back on; the editorial layer references a "
                "paper the corpus cannot resolve."
            )
        skip_warnings.append(
            f"{bibcode} absent from local mirror; retained prior snapshot metadata"
        )
        papers.append({**prior, "abstract": g})  # refresh gloss, keep mechanical
    return papers, skip_warnings


def build_edges(
    source_bibcode: str,
    fetch_similar: Callable[[str], Mapping[str, Any]],
    node_bibcodes: set[str],
) -> list[dict[str, Any]]:
    """Co-citation edges, filtered to targets that exist as lit-papers nodes.

    ``citation_similarity`` returns a ranked, unbounded list; keeping only
    targets present in ``node_bibcodes`` guarantees the graph lane never points
    at a node it lacks. Sorted by target for a deterministic snapshot.
    """
    edges = [
        {
            "source": source_bibcode,
            "target": p["bibcode"],
            "kind": "co_citation",
            "overlap": p["overlap_count"],
        }
        for p in _require_papers(fetch_similar(source_bibcode))
        if p["bibcode"] in node_bibcodes
    ]
    edges.sort(key=lambda e: e["target"])
    return edges


# ---- IO layer (the CLI subprocess + snapshot read/write) ----

def _run_cli(args: list[str]) -> dict[str, Any]:
    cmd = shlex.split(os.environ.get("SCIX_CLI", "scix")) + args
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=_CLI_TIMEOUT_S)
    except FileNotFoundError as exc:
        raise ScixUnavailable(
            f"scix CLI not found ({cmd[0]!r}); install scix or set SCIX_CLI"
        ) from exc
    except subprocess.TimeoutExpired as exc:
        raise ScixUnavailable(f"`{' '.join(cmd)}` timed out after {_CLI_TIMEOUT_S}s") from exc
    if proc.returncode != 0:
        raise ScixUnavailable(
            f"`{' '.join(cmd)}` failed ({proc.returncode}): "
            f"{proc.stderr.strip()[:_STDERR_PREVIEW_CHARS]}"
        )
    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        raise ScixUnavailable(f"unparseable JSON from `{' '.join(cmd)}`: {exc}") from exc


def _load_prior(name: str) -> dict[str, Any]:
    path = os.path.join(OUT, name)
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError as exc:
        raise RefreshError(f"committed snapshot {name} is corrupt: {exc}") from exc


def _write(name: str, obj: dict[str, Any]) -> None:
    path = os.path.join(OUT, name)
    with open(path, "w") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
    print(f"wrote {name} ({os.path.getsize(path)} bytes)")


def main() -> int:
    prior_lit = _load_prior("lit-papers.json")
    prior_by_bibcode = {p["bibcode"]: p for p in prior_lit.get("papers", [])}

    papers, skip_warnings = build_lit_papers(
        LIT_GLOSS,
        lambda b: _run_cli(["get_paper", b]),
        prior_by_bibcode,
    )
    edges = build_edges(
        HER_EMBEDDINGS_PAPER,
        lambda b: _run_cli(["citation_similarity", b, "--limit", str(_SIMILARITY_LIMIT)]),
        set(LIT_GLOSS),
    )

    for w in skip_warnings:
        print(f"WARNING: {w}", file=sys.stderr)

    _write(
        "lit-papers.json",
        {"source": "scix CLI get_paper (abstract = editorial gloss)", "count": len(papers), "papers": papers},
    )
    _write(
        "citation-edges.json",
        {"source": "scix CLI citation_similarity (co_citation)", "edges": edges},
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ScixUnavailable, RefreshError) as exc:
        print(f"refresh aborted: {exc}", file=sys.stderr)
        print("committed snapshots left untouched (the site builds from them).", file=sys.stderr)
        raise SystemExit(1) from None
