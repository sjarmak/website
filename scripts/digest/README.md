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
| `tts-render.mjs` | Transcript to chunked **local Kokoro TTS** (voice `af_heart`, speed 0.85, fully offline), then one MP3 in the media-branch worktree (`git`) or the local spool (`r2`). Prints `{"file", "audioUrl", "durationSec"}`. |
| `kokoro-render.py` | Python half of the renderer: runs inside the Kokoro venv, WAV per chunk. |
| `setup-kokoro.sh` | One-time venv setup for the local TTS (`~/.venvs/kokoro-tts`). |
| `publish-digest.mjs` | Validate an issue spec, write the `digest` collection entry without a player, stage it, and queue its audio as pending. Never uploads or verifies. |
| `audio-gate.mjs` | `drain`, `verify-staged`, `settle`, `status`: the verify-before-publish gate `run.sh` drives. `drop` removes one pending record by hand. |
| `pending-audio.mjs` | Records in `.digest-runs/pending-audio/<slug>.json` for audio that has not verified yet. |
| `entry-audio.mjs` | Adds or strips `audioUrl`/`durationSec` in an entry's frontmatter without touching other bytes. |
| `recent-coverage.mjs` | Repeat guard: list item URLs from recent same-cadence/track issues. |
| `run.sh` | Cron entry point: generate, push or upload audio, verify and attach it, commit, (optionally) push. |
| `../media/*.mjs` | Media keys, R2 config, immutable uploads (`store.mjs`), public URL verification (`verify.mjs`), and the media-branch backfill (`backfill.mjs`). |

### Repeat guard

Auto runs are stateless, so a loud post used to re-qualify day after day. Now `run.sh`
writes `recent-coverage.md` (item URLs from the last 7 days of dailies / 28 days of
weeklies, same cadence + track) into the work dir; the generate prompts forbid featuring
a listed URL, and `publish-digest.mjs` hard-rejects repeats when `DIGEST_REPEAT_GUARD_DAYS`
is set (run.sh sets it for all non-curated modes). URL matching is exact after light
normalization (fragment, `utm_*` params, trailing slash). Curated and manual publishes
are exempt.

The website side (collection, `/digest` pages, RSS) is already in the repo.

## Audio publishing

An issue's page and RSS item carry `audioUrl` only after that exact public URL has
served the exact bytes. A successful push or upload is not enough. The verifier
(`scripts/media/verify.mjs`) requires, against `MEDIA_PUBLIC_BASE/<key>`:

- `HEAD` returns 200 with `Content-Type` for the extension (`audio/mpeg` for MP3) and a
  `Content-Length` equal to the local file;
- `Range: bytes=0-1023` and the last-1 KB range return 206 with the matching bytes;
- a full `GET` hashes to the local file's sha256.

It retries with backoff until the phase that called it runs out of time (see
[Timing](#timing)).

`publish-digest.mjs` never uploads or verifies. It writes the issue without a player,
records the audio in `.digest-runs/pending-audio/<slug>.json` with check `queued`, and
always reports it as `pending`. `run.sh` does the rest under its lock: it pushes the
media branch (`git`) or uploads to the bucket (`r2`), verifies the public URL, and only
then adds `audioUrl` and `durationSec` to the entry. Re-publishing an issue keeps the
player already committed for it until the new audio verifies.

### Backends (`MEDIA_BACKEND`)

- **`git`** (default, today's path). `tts-render.mjs` writes into the media worktree.
  After `run.sh` pushes the `media` branch (only with `DIGEST_PUSH=1`), it waits up to
  `MEDIA_DEPLOY_WAIT_SEC` for the Render media deploy to serve the file and attaches
  the audio if it verifies in time.
- **`r2`**. `tts-render.mjs` writes into the spool (`DIGEST_SPOOL`, default
  `~/.local/share/sjarmak-media/spool`). After the agent finishes, `run.sh` uploads the
  file to the R2 bucket under its key, verifies the public URL, and attaches the audio.
  Keys are immutable: an upload is skipped when the bucket already holds identical
  bytes, and refused with check `conflict` when it holds different ones. Uploads use
  `If-None-Match: *`, so concurrent or retried runs cannot overwrite each other.
  Switch to `r2` only after `/media/*` routes to the bucket; before that, `/media/` URLs
  still reach the media branch and every upload would stay pending.

`r2` reads credentials only from `~/.config/sjarmak-media/r2.env` (override with
`R2_ENV_FILE`); it never falls back to `~/.aws` or any `AWS_*` variable. The file holds
dotenv `NAME=value` lines as `node --env-file` reads them (an `export ` prefix, quoted
values and trailing `#` comments are accepted):

```bash
R2_ACCOUNT_ID=<32-hex Cloudflare account id>
R2_ACCESS_KEY_ID=<R2 API token access key id>
R2_SECRET_ACCESS_KEY=<R2 API token secret>
R2_BUCKET=<bucket name>
```

`run.sh` checks only that the file is readable and never sources it. `audio-gate.mjs`
is the one process that loads it, through `node --env-file`, after `run.sh` removes any
`R2_*` variables the caller exported, so the file always wins. A missing variable stops
the run with exit 2 and names the variable without printing any value. The agent
(`claude -p`) runs with all four `R2_*` variables removed from its environment, so the
credentials never enter its context; it sees only `R2_ENV_FILE`, which is a path.

That keeps the secrets out of the agent's context, not out of its reach: `r2.env` stays
readable by every process running as `ds`, the agent's Bash tool included. Keep it
`chmod 600`, with a token scoped to Object Read & Write on that one bucket, so a leaked
key can reach nothing else.

### Timing

Each drain phase has its own budget in seconds. A value that is not a positive whole
number stops the run with exit 2 before it takes the lock.

| Variable | Default | Phase |
|----------|---------|-------|
| `MEDIA_START_DRAIN_SEC` | 60 | `git`: the drain at the start of every run |
| `MEDIA_DEPLOY_WAIT_SEC` | 1200 | `git`: the drain after pushing the media branch, which waits for the Render media deploy |
| `MEDIA_VERIFY_TIMEOUT_SEC` | 300 | `r2`: the drain at the start and the upload drain after the agent; both backends: the check of staged entries before commit |

Pending records drain concurrently against the phase deadline. Audio that misses it
stays pending, its issue stays text-only, and the run carries on. A drain that fails
outright (exit 2 or more) stops the run before anything is committed.

### Pending audio

When a run ends with audio still pending, the issue is already published as text, the
audio stays recorded in `.digest-runs/pending-audio/<slug>.json`, and `run.sh` exits 1
after printing one report per record:

```
[audio] PENDING daily-2026-10-16: the issue is published without a player until its audio verifies
  url:    https://www.sjarmak.ai/media/digests/daily-2026-10-16.mp3
  check:  status
  reason: ...
  file:   ...
  retry:  MEDIA_BACKEND=git WEBSITE_MEDIA_DIR=... DIGEST_PUSH=1 /home/ds/projects/website/scripts/digest/run.sh attach-pending
```

Every run, `attach-pending` included, drains pending audio before anything else, so
the next scheduled run usually attaches it. `run.sh attach-pending` does only that
step, without generating an issue. An `audioUrl` that reaches the index any other way
(for example written by hand) is checked the same way before commit and removed if it
does not verify.

Three checks cannot clear by waiting, so their report prints `fix:` in place of
`retry:`:

- `conflict`: R2 already holds different bytes under the key, and the published audio
  is unchanged. Give the issue a new slug and publish it again, or keep the published
  audio and drop the record.
- `entry`: the issue's entry does not exist. Publish the issue text, then run
  `attach-pending`, or drop the record.
- `record`: the record's `file` or `audioUrl` does not match what its key implies, for
  example after a hand edit. Drop it, or re-publish the issue, which rewrites it.

Dropping removes the record only. The audio file and any uploaded copy stay, and the
issue stays without a player. Run it under the lock:

```bash
cd /home/ds/projects/website && flock .digest-runs/run.lock node scripts/digest/audio-gate.mjs drop --slug <slug>
```

A record that cannot be parsed is reported as `UNREADABLE`, with the command that
removes it, and every run skips it until then.

### Locking

`run.sh` takes `.digest-runs/run.lock` before touching the repo, so overlapping cron
jobs and manual runs take turns. A run that waits longer than `DIGEST_LOCK_WAIT_SEC`
(default 3600) exits 75 and names the lock.

### Moving `/media/` to R2

1. Create the bucket, attach `media.sjarmak.ai`, and write `r2.env`.
2. Copy the media branch into the bucket. The manifest records every object's sha256,
   and a rerun skips objects the bucket already holds with identical bytes:

   ```bash
   node scripts/media/backfill.mjs --dry-run
   node --env-file="$HOME/.config/sjarmak-media/r2.env" scripts/media/backfill.mjs \
     --manifest .digest-runs/backfill-manifest.json
   ```

3. Check the canary route with the same verifier (`--key` may repeat):

   ```bash
   node --env-file="$HOME/.config/sjarmak-media/r2.env" scripts/media/backfill.mjs \
     --manifest .digest-runs/canary-manifest.json \
     --key digests/daily-general-2026-10-14.mp3 --key digests/daily-2026-10-15.mp3 \
     --key digests/daily-general-2026-10-15.mp3 \
     --verify-base https://www.sjarmak.ai/media-canary
   ```

4. Point `/media/*` at the bucket in `render.yaml`, then set `MEDIA_BACKEND=r2` on the
   cron lines.
5. Rollback: drop `MEDIA_BACKEND` (back to `git`) and point `/media/*` back at
   `sjarmak-ai-media`. Audio published while on R2 lives only in the bucket and the
   spool, so commit the spool's new files into the media worktree before switching
   back.

CI (`scripts/checks/media-guard.mjs`) fails any push or pull request that adds or
changes files under `public/media/` on `main`.

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
- **Media worktree** (`git` backend only): check out the `media` branch outside the site:

  ```bash
  git worktree add /home/ds/website-worktrees/media media
  ```

  `run.sh` exports its `public/media` directory as `WEBSITE_MEDIA_ROOT`, commits
  audio on `media`, then commits page content on `main`. It looks for the worktree at
  `~/website-worktrees/media` unless `WEBSITE_MEDIA_DIR` names another one.
- **R2 credentials** (`r2` backend only): `~/.config/sjarmak-media/r2.env`, see
  [Backends](#backends-media_backend).

## Step 0 — validate before scheduling (do this first)

The one unproven link is whether headless `claude -p` runs the MCP + Bash tools without
prompting. Validate manually, with push OFF:

```bash
cd /home/ds/projects/website
DIGEST_PUSH=0 scripts/digest/run.sh daily
```

Then check:
- `src/content/digest/daily-<date>.md` was written and reads well.
- `/home/ds/website-worktrees/media/public/media/digests/daily-<date>.mp3` plays.
- The run exits 1 and lists the audio as pending: with push off, the media branch never
  reaches Render, so the issue stays text-only until a pushing run attaches it.
- `npx astro build` parses it; `npx astro dev` → open `/digest`.

If `claude -p` stops to ask for tool permission, tune `CLAUDE_FLAGS` (e.g. an
`--allowedTools` allowlist covering `Bash` and the `mcp__code-intel-copilot__*` tools, or a
run-scoped settings file). Do **not** use a blanket skip-permissions flag.

## Schedule (after step 0 passes)

`crontab -e`. Runs are staggered, and the run lock serializes any that still overlap.
Each line sets `PATH` so cron finds `node`, `claude-auto`, and `flock`:

```cron
0  6 * * *  PATH=/home/ds/.local/bin:/home/ds/.nvm/versions/node/v22.22.2/bin:/usr/local/bin:/usr/bin:/bin WEBSITE_MEDIA_DIR=/home/ds/website-worktrees/media DIGEST_PUSH=1 /home/ds/projects/website/scripts/digest/run.sh daily          >> /home/ds/.digest-cron.log 2>&1
45 6 * * *  PATH=/home/ds/.local/bin:/home/ds/.nvm/versions/node/v22.22.2/bin:/usr/local/bin:/usr/bin:/bin WEBSITE_MEDIA_DIR=/home/ds/website-worktrees/media DIGEST_PUSH=1 /home/ds/projects/website/scripts/digest/run.sh daily-general  >> /home/ds/.digest-cron.log 2>&1
30 7 * * 1  PATH=/home/ds/.local/bin:/home/ds/.nvm/versions/node/v22.22.2/bin:/usr/local/bin:/usr/bin:/bin WEBSITE_MEDIA_DIR=/home/ds/website-worktrees/media DIGEST_PUSH=1 /home/ds/projects/website/scripts/digest/run.sh weekly         >> /home/ds/.digest-cron.log 2>&1
0  9 * * 1  PATH=/home/ds/.local/bin:/home/ds/.nvm/versions/node/v22.22.2/bin:/usr/local/bin:/usr/bin:/bin WEBSITE_MEDIA_DIR=/home/ds/website-worktrees/media DIGEST_PUSH=1 /home/ds/projects/website/scripts/digest/run.sh weekly-general >> /home/ds/.digest-cron.log 2>&1
```

After the `/media/*` flip, replace `WEBSITE_MEDIA_DIR=...` with `MEDIA_BACKEND=r2` on
each line.

Per-run logs land in `.digest-runs/`. Flip `DIGEST_PUSH=1` only when you're happy letting
each run publish to the live site automatically.

## Manual publish (ad-hoc)

```bash
WEBSITE_MEDIA_ROOT=/home/ds/website-worktrees/media/public/media \
  node scripts/digest/publish-digest.mjs --spec issue.json
WEBSITE_MEDIA_DIR=/home/ds/website-worktrees/media DIGEST_PUSH=1 \
  scripts/digest/run.sh attach-pending

MEDIA_BACKEND=r2 node scripts/digest/publish-digest.mjs --spec issue.json
MEDIA_BACKEND=r2 scripts/digest/run.sh attach-pending
```

`issue.json` matches the schema in `publish-digest.mjs` (`title`, `cadence`, `date`,
`summary`, `topics`, `items`, `highlights`, `bodyFile` or `body`, optional `audioFile`).
Leave `audioUrl` out: `publish-digest.mjs` copies `audioFile` into the media worktree
or spool, writes the entry without a player, and queues the audio; `run.sh
attach-pending` with the same backend settings pushes or uploads it, verifies it, and
adds `audioUrl`. `publish-digest.mjs` needs no R2 credentials, so do not give it
`--env-file`. A spec `audioUrl` without `audioFile` is passed through with a warning
and checked again by `run.sh` before commit.
