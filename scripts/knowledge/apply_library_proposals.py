#!/usr/bin/env python3
"""Apply approved knowledge-sync library proposals to NASA ADS biblib.

This is the ONLY step in the knowledge-sync flow that writes to NASA ADS, and it
is run by a human after reviewing (and optionally trimming) the proposals file the
daily agent produced. It defaults to a dry run; pass --apply to actually add the
documents. After a successful apply it refreshes the committed libraries.json
snapshot so the site reflects the new membership.

Proposals are grouped by target ADS library and added with the biblib
documents endpoint:
  POST /v1/biblib/documents/{adsLibraryId}   body {"bibcode": [...], "action": "add"}

Auth: ADS_API_TOKEN from .env (same token build_libraries.py uses).

Usage:
  apply_library_proposals.py [--date YYYY-MM-DD] [--file PATH] [--apply]
"""

import argparse
import json
import os
import subprocess
import sys
import urllib.request
from collections import defaultdict
from datetime import date as date_cls

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
BIBLIB = "https://api.adsabs.harvard.edu/v1/biblib"


def token() -> str:
    env = os.path.join(ROOT, ".env")
    for line in open(env):
        if line.startswith("ADS_API_TOKEN="):
            return line.split("=", 1)[1].strip().strip("\"'")
    sys.exit("ADS_API_TOKEN not found in .env")


def add_documents(ads_library_id: str, bibcodes: list[str], tok: str) -> dict:
    body = json.dumps({"bibcode": bibcodes, "action": "add"}).encode()
    req = urllib.request.Request(
        f"{BIBLIB}/documents/{ads_library_id}",
        data=body,
        method="POST",
        headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=date_cls.today().isoformat())
    ap.add_argument("--file", default=None, help="proposals JSON (default .knowledge-sync/<date>/library-proposals.json)")
    ap.add_argument("--apply", action="store_true", help="actually write to ADS (default: dry run)")
    args = ap.parse_args()

    path = args.file or os.path.join(ROOT, ".knowledge-sync", args.date, "library-proposals.json")
    if not os.path.exists(path):
        print(f"no proposals file at {path} — nothing to apply")
        return 0

    proposals = json.load(open(path)).get("proposals", [])
    if not proposals:
        print("no proposals to apply")
        return 0

    # Group bibcodes by target ADS library; dedupe within a group.
    by_lib: dict[str, dict] = defaultdict(lambda: {"name": "", "bibcodes": []})
    skipped = []
    for p in proposals:
        ads_id, bib = p.get("adsLibraryId"), p.get("bibcode")
        if not ads_id or not bib:
            skipped.append(p)
            continue
        grp = by_lib[ads_id]
        grp["name"] = p.get("targetLibraryName", "")
        if bib not in grp["bibcodes"]:
            grp["bibcodes"].append(bib)

    print(f"{'APPLYING' if args.apply else 'DRY RUN'} — {len(proposals)} proposal(s) "
          f"across {len(by_lib)} librar(ies)\n")
    for ads_id, grp in by_lib.items():
        print(f"  {grp['name']} ({ads_id}): +{len(grp['bibcodes'])} -> {', '.join(grp['bibcodes'])}")
    if skipped:
        print(f"\n  skipped {len(skipped)} proposal(s) missing adsLibraryId/bibcode")

    if not args.apply:
        print("\nDry run — re-run with --apply to write to NASA ADS.")
        return 0

    tok = token()
    failures = 0
    for ads_id, grp in by_lib.items():
        try:
            resp = add_documents(ads_id, grp["bibcodes"], tok)
            print(f"  added {resp.get('number_added', '?')} to {grp['name']}")
        except Exception as exc:  # noqa: BLE001 — surface the failure, do not swallow
            failures += 1
            print(f"  FAILED {grp['name']} ({ads_id}): {exc}", file=sys.stderr)

    if failures:
        print(f"\n{failures} librar(ies) failed — NOT refreshing snapshot.", file=sys.stderr)
        return 1

    print("\nrefreshing libraries.json snapshot...")
    subprocess.run([sys.executable, os.path.join(HERE, "build_libraries.py")], check=True)
    print("done. Commit the updated src/data/knowledge/libraries.json to publish.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
