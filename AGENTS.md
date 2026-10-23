# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd prime` for full workflow context.

> **Architecture in one line:** Issues live in a local Dolt database
> (`.beads/dolt/`); cross-machine sync uses `bd dolt push/pull` (a
> git-compatible protocol), stored under `refs/dolt/data` on your git
> remote — separate from `refs/heads/*` where your code lives.
> `.beads/issues.jsonl` is a passive export, not the wire protocol.
>
> See [SYNC_CONCEPTS.md](https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md)
> for the one-screen overview and anti-patterns (don't treat JSONL as the
> source of truth; don't `bd import` during normal operation; don't
> reach for third-party Dolt hosting before trying the default).

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work atomically
bd close <id>         # Complete work
bd dolt push          # Push beads data to remote
```

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

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:7510c1e2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds. The binding gate is now CI (`.github/workflows/ci.yml`: `astro check` + `astro build`).
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
