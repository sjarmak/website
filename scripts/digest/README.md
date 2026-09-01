# Digest pipeline

Generates a navigable, filterable library of digest **newsletters + podcasts** on the
site (`/digest`). Two producers, one library:

- **Automated** — a local cron runs `claude-auto -p` (multi-account router) against the `code-intel-copilot` MCP,
  selects items, writes a newsletter + podcast, renders audio, and publishes. Daily
  (~12 min) and weekly (~45 min), each in two tracks:
  - **specialized** (`daily`, `weekly`) — deep on the site's core topics, ranked: agentic
    coding, evals, multi-agent orchestration, agent reliability (durable execution, Temporal
    and similar workflow engines, enterprise agent deployment), semantic governance &
    agentic analytics (semantic/metrics layers, governed definitions, schema linking,
    policy-aware query compilation), retrieval.
  - **general** (`daily-general`, `weekly-general`) — field-wide roundup selected by
    social signal (cross-source convergence) and utility; model launches and tooling
    announcements lead rather than getting filtered as "announcements".
- **Manual** — items you hand-pick in the code-intelligence-digest app publish through the
  same `publish-digest.mjs` spec, so they land in the same library. (See `sjai-vuh`.)

## Pieces

| File | Role |
|------|------|
| `generate.md` | Specialized-track prompt (runner fills `{{CADENCE}}`, `{{SLUG}}`, etc.). |
| `generate-general.md` | General-track prompt: recency sweep + convergence ranking, no topic whitelist. |
| `tts-render.mjs` | Transcript → chunked **local Kokoro TTS** (voice `am_onyx`, speed 0.85, fully offline) → one MP3 in the media-branch worktree. |
| `kokoro-render.py` | Python half of the renderer: runs inside the Kokoro venv, WAV per chunk. |
| `setup-kokoro.sh` | One-time venv setup for the local TTS (`~/.venvs/kokoro-tts`). |
| `publish-digest.mjs` | Validate an issue spec → write the `digest` collection entry + stage. |
| `recent-coverage.mjs` | Repeat guard: list item URLs from recent same-cadence/track issues. |
| `run.sh` | Cron entry point: generate → commit → (optionally) push. |

### Repeat guard

Auto runs are stateless, so a loud post used to re-qualify day after day. Now `run.sh`
writes `recent-coverage.md` (item URLs from the last 7 days of dailies / 28 days of
weeklies, same cadence + track) into the work dir; the generate prompts forbid featuring
a listed URL, and `publish-digest.mjs` hard-rejects repeats when `DIGEST_REPEAT_GUARD_DAYS`
is set (run.sh sets it for all non-curated modes). URL matching is exact after light
normalization (fragment, `utm_*` params, trailing slash). Curated and manual publishes
are exempt.

The website side (collection, `/digest` pages, RSS) is already in the repo.

## Prerequisites

- **Kokoro venv** — run `scripts/digest/setup-kokoro.sh` once (installs Kokoro-82M + CPU
  torch into `~/.venvs/kokoro-tts`; override with `KOKORO_VENV`). TTS is fully local and
  offline — no API key, no per-render cost. The first-ever render downloads the model
  weights into the Hugging Face cache.
- **`ffmpeg`** — required. `tts-render.mjs` uses it to concat the WAV chunks and encode
  the MP3 (24 kHz mono, 160k). `sudo apt install ffmpeg`.
- **`claude-auto`** (`~/.local/bin/claude-auto`) — picks the least-loaded Claude account
  from `~/.claude-usage/usage_cache.json` (kept fresh by the `claude-refresh-all` cron) and
  launches via `claude-account`, so one capped account doesn't kill the run. Every account
  home in `~/.claude-homes/` carries the `code-intel-copilot` MCP. Override with
  `CLAUDE_BIN=claude` to pin the default account.
- **git push credentials** for this repo (only needed once you enable `DIGEST_PUSH=1`).
- **Media worktree** — check out the `media` branch beside the site:

  ```bash
  git worktree add /home/ds/projects/website-media media
  ```

  `run.sh` exports its `public/media` directory as `WEBSITE_MEDIA_ROOT`, commits
  audio on `media`, then commits page content on `main`. Override the worktree
  location with `WEBSITE_MEDIA_DIR`.

## Step 0 — validate before scheduling (do this first)

The one unproven link is whether headless `claude -p` runs the MCP + Bash tools without
prompting. Validate manually, with push OFF:

```bash
cd /home/ds/projects/website
DIGEST_PUSH=0 scripts/digest/run.sh daily
```

Then check:
- `src/content/digest/daily-<date>.md` was written and reads well.
- `/home/ds/projects/website-media/public/media/digests/daily-<date>.mp3` plays.
- `npx astro build` parses it; `npx astro dev` → open `/digest`.

If `claude -p` stops to ask for tool permission, tune `CLAUDE_FLAGS` (e.g. an
`--allowedTools` allowlist covering `Bash` and the `mcp__code-intel-copilot__*` tools, or a
run-scoped settings file). Do **not** use a blanket skip-permissions flag.

## Schedule (after step 0 passes)

`crontab -e` — runs are staggered so two jobs never commit/push concurrently:

```cron
0  6 * * *  DIGEST_PUSH=1 /home/ds/projects/website/scripts/digest/run.sh daily          >> /home/ds/.digest-cron.log 2>&1
45 6 * * *  DIGEST_PUSH=1 /home/ds/projects/website/scripts/digest/run.sh daily-general  >> /home/ds/.digest-cron.log 2>&1
30 7 * * 1  DIGEST_PUSH=1 /home/ds/projects/website/scripts/digest/run.sh weekly         >> /home/ds/.digest-cron.log 2>&1
0  9 * * 1  DIGEST_PUSH=1 /home/ds/projects/website/scripts/digest/run.sh weekly-general >> /home/ds/.digest-cron.log 2>&1
```

Per-run logs land in `.digest-runs/`. Flip `DIGEST_PUSH=1` only when you're happy letting
each run publish to the live site automatically.

## Manual publish (ad-hoc)

```bash
WEBSITE_MEDIA_ROOT=/home/ds/projects/website-media/public/media \
  node scripts/digest/publish-digest.mjs --spec issue.json
```

`issue.json` matches the schema in `publish-digest.mjs` (`title`, `cadence`, `date`,
`summary`, `topics`, `items`, `highlights`, `bodyFile` or `body`, optional `audioFile`).
