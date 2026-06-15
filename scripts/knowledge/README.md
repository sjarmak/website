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
2. The classifying agent (`sync-knowledge.md`, run via `claude-auto -p`) judges each
   paper's fit (model decision, conservative) and:
   - **Libraries → proposals only.** Writes `library-proposals.json`. **Nothing is
     written to NASA ADS here.**
   - **Explorers → applied directly.** Appends the paper to the matching
     `explorers/<id>.json` with per-branch notes, adds a full-text-grounded 4-part
     synthesis to `paper-synthesis.json`, and reruns `build_explorers.py`.
3. The orchestrator commits the explorer changes **locally** (never pushes). Library
   proposals stay in the gitignored `.knowledge-sync/` dir for review.

### Approving library additions

Review (and trim) `.knowledge-sync/<date>/library-proposals.json`, then:

```bash
python3 scripts/knowledge/apply_library_proposals.py --date 2026-06-14            # dry run
python3 scripts/knowledge/apply_library_proposals.py --date 2026-06-14 --apply    # write to ADS
```

`--apply` is the only step that writes to NASA ADS. It adds the bibcodes to the
target libraries and refreshes `libraries.json`; commit that to publish.

### Scheduling (optional)

Run after the 06:00 specialized daily digest. Add to crontab once validated:

```cron
15 7 * * *  cd /home/ds/projects/website && scripts/knowledge/sync-knowledge.sh >> .knowledge-sync/cron.log 2>&1
```

The explorer commit is local-only by design — review the diff and push yourself,
same as the digest pipeline. After many explorer additions, regenerate embeddings
with `build_embeddings.py` (needs the brainstorm venv) so new papers get semantic
neighbors.
