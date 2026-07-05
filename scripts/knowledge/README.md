# Knowledge pipeline

Builds the committed data behind the site's research **libraries** and thematic
**explorers**, and runs the daily check that folds new digest papers into them.

## Data sources (committed JSON, snapshot-at-author-time)

| File | Built by | Source of truth |
|------|----------|-----------------|
| `src/data/knowledge/libraries.json` | `build_libraries.py` | NASA ADS biblib (live pull) |
| `src/data/knowledge/explorers.json` | `build_explorers.py` | `src/data/knowledge/explorers/<id>.json` (in-repo) |
| `src/data/knowledge/paper-synthesis.json` | hand/agent-edited | SciX MCP full text |
| `src/data/knowledge/embeddings.json` | `build_embeddings.py` | the above (needs the brainstorm venv) |
| `src/data/knowledge/threads.json` | `build_data.py` | editorial (`LIT_GLOSS` + `THREADS` in that file) |
| `src/data/knowledge/lit-papers.json`, `citation-edges.json` | `refresh_scix_data.py` | live scix corpus via the scix CLI |

## Research threads

`build_data.py` holds the editorial layer for the research **threads** — which
papers belong to each thread, the reading order, the framing prose, and a
one-line gloss per external paper (`LIT_GLOSS`). Edit it in place and re-run to
regenerate `threads.json`.

The per-paper mechanical metadata (title, author, year, citation count) and the
co-citation graph edges are **not** hand-maintained — `refresh_scix_data.py`
fetches them from the live scix corpus via the scix CLI (`get_paper` +
`citation_similarity`, both DB-only, no embedding model). The `abstract` field in
`lit-papers.json` is the editorial gloss, preserved verbatim; only mechanical
fields refresh. Run on the host where scix is installed and the prod DB is
reachable:

```bash
# `scix` on PATH, or point SCIX_CLI at the scix interpreter:
SCIX_CLI='/home/ds/projects/scix_experiments/.venv/bin/python -m scix.cli' \
  python3 scripts/knowledge/refresh_scix_data.py
```

It is idempotent, retains a curated paper's prior snapshot metadata if that
bibcode is briefly absent from the local mirror (with a warning), and aborts
non-zero **without touching the committed JSON** if scix is unreachable — so the
site always builds from the last good snapshot. Commit the regenerated JSON.
DB-free unit tests: `python -m pytest scripts/knowledge/test_refresh_scix_data.py`.

Explorers are **self-contained in this repo**: each explorer's canonical source is
`src/data/knowledge/explorers/<id>.json` (ordered by `explorers/_order.json`).
`build_explorers.py` validates them, recomputes `paperCount`/`themeCount`, and
assembles the combined `explorers.json` the site imports. There is no external
`lit_explorers` dependency.

## Daily knowledge-sync check

After the specialized daily digest publishes, decide whether the papers it cited
belong in the libraries and explorers.

```bash
scripts/knowledge/sync-knowledge.sh                  # today's daily digest
scripts/knowledge/sync-knowledge.sh --date 2026-06-14
```

What it does:

1. `sync_candidates.py` — deterministic prep. Reads the digest frontmatter, keeps
   the `research` items, extracts each paper's arXiv id / bibcode, and precomputes
   which libraries/explorers already hold it. Writes `.knowledge-sync/<date>/`.
   Exits cleanly (no-op) when there is nothing to consider.
2. The classifying agent (`sync-knowledge.md`, run via `claude-auto -p`) resolves
   each paper, judges its fit (model decision, conservative), and:
   - **Libraries → proposals only.** Writes `library-proposals.json`. **Nothing is
     written to NASA ADS here.** Needs only the abstract, so it proceeds immediately.
   - **Explorers → full-text-grounded, or deferred.** An explorer entry's 4-part
     synthesis must be grounded in the paper's *body* via `mcp__scix__read_paper`.
     SciX ingests fresh arXiv papers a few days behind ADS, so when full text is not
     yet available the paper is **deferred** to `src/data/knowledge/explorer-pending.json`
     (with its abstract-based explorer/branch classification) instead of being added
     on weaker grounding. Each run first **backfills** the pending queue — retrying
     `read_paper` and adding papers whose full text has since appeared — then
     processes today's candidates. Entries older than 14 days are dropped.
   - When a paper is added, the agent appends it to the matching `explorers/<id>.json`
     with per-branch notes + synthesis and reruns `build_explorers.py`.
3. The orchestrator commits the explorer + pending-queue changes **locally** (never
   pushes). Library proposals stay in the gitignored `.knowledge-sync/` dir for review.

### Approving library additions

Review (and trim) `.knowledge-sync/<date>/library-proposals.json`, then:

```bash
python3 scripts/knowledge/apply_library_proposals.py --date 2026-06-14            # dry run
python3 scripts/knowledge/apply_library_proposals.py --date 2026-06-14 --apply    # write to ADS
```

`--apply` is the only step that writes to NASA ADS. It adds the bibcodes to the
target libraries and refreshes `libraries.json`; commit that to publish.

### Scheduling (optional)

Runs at 07:15, after the 06:00 daily and 06:45 daily-general digests publish and
before the Monday 07:30 weekly. `KNOWLEDGE_SYNC_PUSH=1` makes it push its explorer
commits (mirrors the digest runner's `DIGEST_PUSH`); omit it to keep runs local for
review. Library proposals are never auto-applied — the ADS write always stays manual.

```cron
15 7 * * * PATH=/home/ds/.local/bin:/home/ds/.nvm/versions/node/v22.22.2/bin:/usr/local/bin:/usr/bin:/bin KNOWLEDGE_SYNC_PUSH=1 /home/ds/projects/website/scripts/knowledge/sync-knowledge.sh >> /home/ds/.knowledge-sync-cron.log 2>&1
```

After many explorer additions, regenerate embeddings with `build_embeddings.py`
(needs the brainstorm venv) so new papers get semantic neighbors.
