#!/usr/bin/env bash
# Local-cron runner for the digest pipeline. Generates one issue via `claude-auto -p`
# (routes to the least-loaded Claude account so a capped account doesn't kill the
# run; every account home carries the code-intel-copilot MCP), then commits and
# — only when DIGEST_PUSH=1 — pushes so the site rebuilds.
#
#   scripts/digest/run.sh daily            # specialized: site's core topics
#   scripts/digest/run.sh weekly
#   scripts/digest/run.sh daily-general    # general: field-wide roundup by social signal
#   scripts/digest/run.sh weekly-general
#   scripts/digest/run.sh curated <items.json>   # hand-picked items from the digest app
#
# Env:
#   KOKORO_VENV     (optional — Kokoro TTS venv used by tts-render.mjs; default
#                    ~/.venvs/kokoro-tts, created once by scripts/digest/setup-kokoro.sh)
#   DIGEST_PUSH=1   (optional — push after commit; default off so you can validate first)
#   CLAUDE_FLAGS    (optional — override the claude -p permission flags; see README)
#   CLAUDE_BIN      (optional — claude binary/router; default claude-auto)
#   WEBSITE_DIR     (optional — defaults to this repo)
#   WEBSITE_MEDIA_DIR (optional — media-branch worktree beside this repo)
set -euo pipefail

MODE="${1:-}"
WINDOW=""; WORD_TARGET=""; MINUTES=""; ITEM_RANGE=""; ITEMS_FILE=""
CADENCE=""; TRACK="specialized"; SINCE=""
case "$MODE" in
  daily)          CADENCE="daily";  WINDOW="the last ~36 hours"; WORD_TARGET=1800; MINUTES=12; ITEM_RANGE="5-7" ;;
  weekly)         CADENCE="weekly"; WINDOW="the last 7 days";    WORD_TARGET=6750; MINUTES=45; ITEM_RANGE="12-15" ;;
  daily-general)  CADENCE="daily";  TRACK="general"; WINDOW="the last ~36 hours"; WORD_TARGET=1800; MINUTES=12; ITEM_RANGE="6-9" ;;
  weekly-general) CADENCE="weekly"; TRACK="general"; WINDOW="the last 7 days";    WORD_TARGET=6750; MINUTES=45; ITEM_RANGE="12-18" ;;
  curated)
    WORD_TARGET=5400; MINUTES=30
    ITEMS_FILE="${2:-}"
    [ -n "$ITEMS_FILE" ] && [ -f "$ITEMS_FILE" ] || { echo "usage: run.sh curated <items.json>" >&2; exit 2; }
    ITEMS_FILE="$(readlink -f "$ITEMS_FILE")"
    ;;
  attach-pending) ;;
  *) echo "usage: run.sh <daily|weekly|daily-general|weekly-general|curated <items.json>|attach-pending>" >&2; exit 2 ;;
esac

MEDIA_BACKEND="${MEDIA_BACKEND:-git}"
case "$MEDIA_BACKEND" in
  git|r2) export MEDIA_BACKEND ;;
  *) echo "MEDIA_BACKEND must be git or r2, found: $MEDIA_BACKEND" >&2; exit 2 ;;
esac

# Issue date. DIGEST_DATE backfills a missed run under its real date instead of
# today's; the item window is then anchored to that date, not to now.
DATE="${DIGEST_DATE:-$(date +%F)}"

# Window start as an ISO date, for MCP `since` filters in the templates.
case "$CADENCE" in
  daily)  SINCE="$(date -d "$DATE -2 days" +%F)" ;;
  weekly) SINCE="$(date -d "$DATE -7 days" +%F)" ;;
esac
UNTIL="$(date -d "$DATE +1 day" +%F)"

WEBSITE_DIR="${WEBSITE_DIR:-/home/ds/projects/website}"
LOG_DIR="$WEBSITE_DIR/.digest-runs"
mkdir -p "$LOG_DIR"
LOCK_FILE="$LOG_DIR/run.lock"
LOCK_WAIT_SEC="${DIGEST_LOCK_WAIT_SEC:-3600}"
[[ "$LOCK_WAIT_SEC" =~ ^[0-9]+$ ]] || { echo "DIGEST_LOCK_WAIT_SEC must be whole seconds, found: $LOCK_WAIT_SEC" >&2; exit 2; }
if [ "${DIGEST_RUN_LOCK:-}" != "$LOCK_FILE" ]; then
  LOCK_STATUS=0
  DIGEST_RUN_LOCK="$LOCK_FILE" flock -o -E 75 -w "$LOCK_WAIT_SEC" "$LOCK_FILE" \
    bash "$(readlink -f "$0")" "$@" || LOCK_STATUS=$?
  if [ "$LOCK_STATUS" = "75" ]; then
    echo "[digest] gave up after ${LOCK_WAIT_SEC}s waiting for $LOCK_FILE; another digest run still holds it (find it with: pgrep -af scripts/digest/run.sh)" >&2
  fi
  exit "$LOCK_STATUS"
fi

if [ "$MEDIA_BACKEND" = "git" ]; then
  WEBSITE_MEDIA_DIR="${WEBSITE_MEDIA_DIR:-$(dirname "$WEBSITE_DIR")/website-media}"
  [ -d "$WEBSITE_MEDIA_DIR" ] || {
    echo "Media worktree not found at $WEBSITE_MEDIA_DIR — create it from the media branch" >&2
    exit 2
  }
  MEDIA_BRANCH="$(git -C "$WEBSITE_MEDIA_DIR" branch --show-current)"
  [ "$MEDIA_BRANCH" = "media" ] || {
    echo "Media worktree must be on branch media, found: ${MEDIA_BRANCH:-detached}" >&2
    exit 2
  }
  export WEBSITE_MEDIA_ROOT="$WEBSITE_MEDIA_DIR/public/media"
  AUDIO_DIR="$WEBSITE_MEDIA_ROOT/digests"
else
  R2_ENV_FILE="${R2_ENV_FILE:-$HOME/.config/sjarmak-media/r2.env}"
  [ -r "$R2_ENV_FILE" ] || {
    echo "MEDIA_BACKEND=r2 needs R2 credentials in $R2_ENV_FILE (see scripts/digest/README.md)" >&2
    exit 2
  }
  set -a
  . "$R2_ENV_FILE"
  set +a
  MISSING=""
  for NAME in R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET; do
    [ -n "${!NAME:-}" ] || MISSING="$MISSING $NAME"
  done
  [ -z "$MISSING" ] || { echo "$R2_ENV_FILE does not set:$MISSING" >&2; exit 2; }
  export DIGEST_SPOOL="${DIGEST_SPOOL:-$HOME/.local/share/sjarmak-media/spool}"
  AUDIO_DIR="$DIGEST_SPOOL/digests"
fi
mkdir -p "$AUDIO_DIR"
cd "$WEBSITE_DIR"

# Headless/cron marker: publish-digest's concept gate warns-and-publishes under
# DIGEST_CRON=1 (filing inbox proposals for unresolved facets) instead of the
# interactive hard-fail. Every run.sh invocation is the headless path.
export DIGEST_CRON=1

# TTS is fully local (Kokoro, voice af_heart) — fail early if the venv is missing
# rather than after the agent has already written the issue.
KOKORO_PYTHON="${KOKORO_VENV:-$HOME/.venvs/kokoro-tts}/bin/python"
[ "$MODE" = "attach-pending" ] || [ -x "$KOKORO_PYTHON" ] || { echo "Kokoro venv not found at ${KOKORO_VENV:-$HOME/.venvs/kokoro-tts} — run scripts/digest/setup-kokoro.sh" >&2; exit 2; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# Repeat guard: list every URL featured in this track's recent issues so the
# generator avoids re-featuring them, and arm the matching publish-time check.
# Curated runs are hand-picked and exempt.
if [ "$MODE" != "curated" ] && [ "$MODE" != "attach-pending" ]; then
  case "$CADENCE" in
    daily)  REPEAT_GUARD_DAYS=7 ;;
    weekly) REPEAT_GUARD_DAYS=28 ;;
  esac
  node scripts/digest/recent-coverage.mjs --cadence "$CADENCE" --track "$TRACK" \
    --days "$REPEAT_GUARD_DAYS" --before "$DATE" > "$WORK/recent-coverage.md"
  export DIGEST_REPEAT_GUARD_DAYS="$REPEAT_GUARD_DAYS"
fi

LOG="$LOG_DIR/${MODE}-$(date +%Y%m%d-%H%M%S).log"

# Curated runs read a fixed, hand-picked item set; the other modes select from
# the MCP — specialized via generate.md, general via generate-general.md.
case "$MODE" in
  curated)    TEMPLATE="scripts/digest/generate-curated.md" ;;
  *-general)  TEMPLATE="scripts/digest/generate-general.md" ;;
  *)          TEMPLATE="scripts/digest/generate.md" ;;
esac

PROMPT="$(sed \
  -e "s|{{MODE}}|${MODE}|g" \
  -e "s|{{CADENCE}}|${CADENCE}|g" \
  -e "s|{{TRACK}}|${TRACK}|g" \
  -e "s|{{SLUG}}|${MODE}-${DATE}|g" \
  -e "s|{{SINCE}}|${SINCE}|g" \
  -e "s|{{UNTIL}}|${UNTIL}|g" \
  -e "s|{{WINDOW}}|${WINDOW}|g" \
  -e "s|{{WORD_TARGET}}|${WORD_TARGET}|g" \
  -e "s|{{MINUTES}}|${MINUTES}|g" \
  -e "s|{{ITEM_RANGE}}|${ITEM_RANGE}|g" \
  -e "s|{{DATE}}|${DATE}|g" \
  -e "s|{{WORK}}|${WORK}|g" \
  -e "s|{{ITEMS_FILE}}|${ITEMS_FILE}|g" \
  -e "s|{{WEBSITE_DIR}}|${WEBSITE_DIR}|g" \
  -e "s|{{AUDIO_DIR}}|${AUDIO_DIR}|g" \
  "$TEMPLATE")"

CLAUDE_FLAGS="${CLAUDE_FLAGS:---permission-mode acceptEdits --allowedTools Bash,Write,Read,Edit,mcp__code-intel-copilot__search_items,mcp__code-intel-copilot__semantic_search_items,mcp__code-intel-copilot__aggregate_items,mcp__code-intel-copilot__get_item,mcp__code-intel-copilot__mirror_status}"

CLAUDE_BIN="${CLAUDE_BIN:-claude-auto}"

audio_gate() {
  node scripts/digest/audio-gate.mjs "$@" 2>&1 | tee -a "$LOG"
}

drain_pending() {
  local status=0
  audio_gate drain || status=$?
  [ "$status" = "0" ] || echo "[digest] pending-audio drain exited ${status}; any issue whose audio did not verify stays text-only" | tee -a "$LOG"
}

if [ "$MODE" = "attach-pending" ]; then
  COMMIT_MSG="content(digest): attach verified audio"
  echo "[digest] attach-pending — attaching audio that now verifies (backend ${MEDIA_BACKEND})" | tee "$LOG"
else
  COMMIT_MSG="content(digest): ${MODE} ${DATE}"
  echo "[digest] ${MODE} ${DATE} — generating (work=${WORK}, via ${CLAUDE_BIN}, backend ${MEDIA_BACKEND})" | tee "$LOG"
fi

if [ "$MEDIA_BACKEND" = "r2" ]; then
  drain_pending
fi

if [ "$MODE" != "attach-pending" ]; then
  # shellcheck disable=SC2086
  "$CLAUDE_BIN" -p "$PROMPT" $CLAUDE_FLAGS 2>&1 | tee -a "$LOG"
fi

git add src/content/digest 2>/dev/null || true

if [ "$MEDIA_BACKEND" = "git" ]; then
  git -C "$WEBSITE_MEDIA_DIR" add public/media/digests 2>/dev/null || true
  if ! git -C "$WEBSITE_MEDIA_DIR" diff --cached --quiet; then
    git -C "$WEBSITE_MEDIA_DIR" commit -q -m "media(digest): ${MODE} ${DATE}"
    echo "[digest] committed audio on the media branch" | tee -a "$LOG"
  fi
  if [ "${DIGEST_PUSH:-0}" = "1" ]; then
    git -C "$WEBSITE_MEDIA_DIR" pull --rebase --autostash
    git -C "$WEBSITE_MEDIA_DIR" push origin media
    echo "[digest] pushed the media branch; waiting for its audio to go live" | tee -a "$LOG"
    drain_pending
  else
    echo "[digest] DIGEST_PUSH!=1, media branch not pushed, so new audio stays pending" | tee -a "$LOG"
  fi
fi

GATE_STATUS=0
audio_gate verify-staged || GATE_STATUS=$?
if [ "$GATE_STATUS" -gt 1 ]; then
  echo "[digest] the audio check itself failed, so nothing was committed; staged changes are left in place for inspection" | tee -a "$LOG"
  exit 1
fi

if git diff --cached --quiet; then
  echo "[digest] nothing new to commit — agent may have written a 'quiet day' issue or failed; see $LOG" | tee -a "$LOG"
else
  git commit -q -m "$COMMIT_MSG"
  echo "[digest] committed site content" | tee -a "$LOG"
  if [ "${DIGEST_PUSH:-0}" = "1" ]; then
    git pull --rebase --autostash
    git push
    echo "[digest] pushed site content" | tee -a "$LOG"
  else
    echo "[digest] DIGEST_PUSH!=1, not pushing (validate, then enable)" | tee -a "$LOG"
  fi
fi

audio_gate settle
if ! audio_gate status; then
  echo "[digest] finished with audio still pending; those issues are published without a player" | tee -a "$LOG"
  exit 1
fi
[ "$GATE_STATUS" = "0" ] || exit 1
