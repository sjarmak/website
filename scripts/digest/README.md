# Digest pipeline

Generates a navigable, filterable library of digest **newsletters + podcasts** on the
site (`/digest`). Two producers, one library:

- **Automated** — a local cron runs `claude -p` against the `code-intel-copilot` MCP,
  selects the freshest on-topic items, writes a newsletter + podcast, renders audio, and
  publishes. Daily (~12 min) and weekly (~45 min).
- **Manual** — items you hand-pick in the code-intelligence-digest app publish through the
  same `publish-digest.mjs` spec, so they land in the same library. (See `sjai-vuh`.)

Topics it favors: agentic coding, evals, multi-agent orchestration, agent memory, retrieval.

## Pieces

| File | Role |
|------|------|
| `generate.md` | The prompt `claude -p` runs (runner fills `{{MODE}}` etc.). |
| `tts-render.mjs` | Transcript → chunked OpenAI TTS → single MP3 in `public/media/digests/`. |
| `publish-digest.mjs` | Validate an issue spec → write the `digest` collection entry + stage. |
| `run.sh` | Cron entry point: generate → commit → (optionally) push. |

The website side (collection, `/digest` pages, RSS) is already in the repo.

## Prerequisites

- **`OPENAI_API_KEY`** — required (TTS). The digest repo already uses OpenAI for embeddings.
- **`ffmpeg`** — recommended. Without it `tts-render.mjs` falls back to binary MP3 concat
  (works, but can have minor seam glitches). `sudo apt install ffmpeg`.
- **`claude` CLI** (`~/.local/bin/claude`) with the `code-intel-copilot` MCP — already
  configured in `~/.claude.json`, so `claude -p` reaches it from any cwd.
- **git push credentials** for this repo (only needed once you enable `DIGEST_PUSH=1`).

## Step 0 — validate before scheduling (do this first)

The one unproven link is whether headless `claude -p` runs the MCP + Bash tools without
prompting. Validate manually, with push OFF:

```bash
cd /home/ds/projects/website
OPENAI_API_KEY=sk-... DIGEST_PUSH=0 scripts/digest/run.sh daily
```

Then check:
- `src/content/digest/daily-<date>.md` was written and reads well.
- `public/media/digests/daily-<date>.mp3` plays.
- `npx astro build` parses it; `npx astro dev` → open `/digest`.

If `claude -p` stops to ask for tool permission, tune `CLAUDE_FLAGS` (e.g. an
`--allowedTools` allowlist covering `Bash` and the `mcp__code-intel-copilot__*` tools, or a
run-scoped settings file). Do **not** use a blanket skip-permissions flag.

## Schedule (after step 0 passes)

`crontab -e` — daily 06:00, weekly Mon 06:00:

```cron
0 6 * * *  OPENAI_API_KEY=sk-... DIGEST_PUSH=1 /home/ds/projects/website/scripts/digest/run.sh daily  >> /home/ds/.digest-cron.log 2>&1
0 6 * * 1  OPENAI_API_KEY=sk-... DIGEST_PUSH=1 /home/ds/projects/website/scripts/digest/run.sh weekly >> /home/ds/.digest-cron.log 2>&1
```

Per-run logs land in `.digest-runs/`. Flip `DIGEST_PUSH=1` only when you're happy letting
each run publish to the live site automatically.

## Manual publish (ad-hoc)

```bash
node scripts/digest/publish-digest.mjs --spec issue.json   # add --commit to commit
```

`issue.json` matches the schema in `publish-digest.mjs` (`title`, `cadence`, `date`,
`summary`, `topics`, `items`, `highlights`, `bodyFile` or `body`, optional `audioFile`).
