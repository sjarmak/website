# Agent Instructions

## Issue tracking

Work is tracked as GitHub issues in the private repository `sjarmak/website-tracker` (this repository is public, so issues do not go here). The old beads store was migrated on 2026-11-17; each imported issue ends with `Imported from bead <id>`.

- Labels: `space:sjarmak-ai`; priority `p0` (highest) to `p4`; `type:*`; `status:blocked`, `status:in-progress`, `status:deferred`; `needs-human` for work only Stephanie can do. `needs-recheck` means untouched since August 2026: confirm it still applies before working it.
- Find work: `gh issue list -R sjarmak/website-tracker --label p1`. Never mention tracker issue numbers in this public repository's commits or files.

## Shipping

- Nothing is pushed and no deploy configuration changes without Stephanie's explicit approval. The scheduled digest, models and knowledge-sync jobs (crontab on ds-5090) are the standing exception and push to `main` themselves.
- Check: `npm test && npm run check && npm run build`.
- Report only what is off-baseline: something blocked, stuck, or a decision only she can make. Ask her about launch readiness, changes to site content meaning or voice at scale, or pacing heavy work against box health.

## Non-Interactive Shell Commands

**ALWAYS use non-interactive flags** with file operations to avoid hanging on confirmation prompts.

Shell commands like `cp`, `mv`, and `rm` may be aliased to include `-i` (interactive) mode on some systems, causing the agent to hang indefinitely waiting for y/n input.

**Use these forms instead:**
```bash
# Force overwrite without prompting
cp -f source dest           # NOT: cp source dest
mv -f source dest           # NOT: mv source dest
rm -f file                  # NOT: rm file

# For recursive operations
rm -rf directory            # NOT: rm -r directory
cp -rf source dest          # NOT: cp -r source dest
```

**Other commands that may prompt:**
- `scp` - use `-o BatchMode=yes` for non-interactive
- `ssh` - use `-o BatchMode=yes` to fail instead of prompting
- `apt-get` - use `-y` flag
- `brew` - use `HOMEBREW_NO_AUTO_UPDATE=1` env var

## Radar (link watchlist)

"Add this link to our radar" / "add to the radar" means append an entry to the
`links` content collection, which powers the `/radar` page.

- **File:** `src/content/links/inbox.yaml` — a single YAML array; append one block, no `id` needed (it's derived from `title`).
- **Fields:** `title`, `url`, `category` (freeform string used verbatim as the section heading — reuse an existing one to group under it), `kind` (`tool|repo|article|paper|video|thread|other`), `note` (why it's worth a follow-up), `tags` (array), `added` (date), optional `featured`.
- **Schema:** `src/content.config.ts` (`links` collection); page `src/pages/radar.astro`; grouping helper `getLinksByCategory()` in `src/lib/collections.ts`.
- Reuse the exact spelling of an existing `category` to file under it; a new string starts a new section. Then commit + push like any content change (CI check → Render deploy).
- **Fetch the page/README before writing the `note`, `category`, or `kind` — summarize from the real content, never infer from the name, URL, or repo slug** (e.g. squeakyclean.ai is an agentic Clean-Architecture *codegen* tool, not an AI-writing tool as the name suggests).

## Models page

Standing rule for anyone editing `src/data/models` (Stephanie, 2026-10-23):

- One daily job refreshes it at 09:00 UTC and publishes: `scripts/models/run.sh`, with the prompts `scripts/models/refresh.md` (research) and `scripts/models/eligibility.md` (Omni eligibility). It commits `refresh-status.json` on every run, failed or empty, and exits nonzero on any failure.
- The active comparison shows only current versions. A superseded version moves to the history section (Fable 5 to 5.1, Sonnet 5 to 5.5, GPT-5.6 Luna to GPT-6 Luna).
- Eligibility is re-read from the current Omni catalog on every run. The catalog is evidence, not an allowlist: `in-catalog` cites the exact model, `meets-constraints` cites provider or family support and passes the page gates, `unresolved` when the evidence does not settle it, `ineligible` only with a cited reason. Publish only the verdict, its basis, the catalog commit and the date, never catalog source, paths or internal identifiers.
- Provenance is dated. Scores and prices match the exact model, version, provider and scope. Unknowns stay unknown, and scores never carry between versions.
- Rows are never deleted; a replaced value goes to `history.json`, and a failed source changes nothing.
- The scoring method does not change without her say. No paid data, no new credentials, no expanded access.
- LiveBench scores stay on the pinned question set. A score is taken only from that set's own table (`livebench.ai/v1/table_<date>.csv` with its `categories_<date>.json`), recomputed with the existing rule (category = mean of its subtests), from the exact row key with effort variants kept as separate rows. A newer LiveBench release is reported, never mapped onto the pinned categories by name; moving to it is her call. `cost.csv` is benchmark-run cost, never pricing (Stephanie via Pip, 2026-10-23).
