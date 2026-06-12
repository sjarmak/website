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
#   OPENAI_API_KEY  (required — used by tts-render.mjs)
#   DIGEST_PUSH=1   (optional — push after commit; default off so you can validate first)
#   CLAUDE_FLAGS    (optional — override the claude -p permission flags; see README)
#   CLAUDE_BIN      (optional — claude binary/router; default claude-auto)
#   WEBSITE_DIR     (optional — defaults to this repo)
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
  *) echo "usage: run.sh <daily|weekly|daily-general|weekly-general|curated <items.json>>" >&2; exit 2 ;;
esac

# Window start as an ISO date, for MCP `since` filters in the templates.
case "$CADENCE" in
  daily)  SINCE="$(date -d '2 days ago' +%F)" ;;
  weekly) SINCE="$(date -d '7 days ago' +%F)" ;;
esac

WEBSITE_DIR="${WEBSITE_DIR:-/home/ds/projects/website}"
DIGEST_REPO="${DIGEST_REPO:-/home/ds/projects/code-intelligence-digest}"
cd "$WEBSITE_DIR"

# Keep the OpenAI key out of crontab: source it from the digest app's env if unset.
if [ -z "${OPENAI_API_KEY:-}" ] && [ -f "$DIGEST_REPO/.env.local" ]; then
  OPENAI_API_KEY="$(grep -E '^OPENAI_API_KEY=' "$DIGEST_REPO/.env.local" | head -1 \
    | sed -E 's/^OPENAI_API_KEY=//; s/^"//; s/"$//; s/^'\''//; s/'\''$//')"
  export OPENAI_API_KEY
fi
: "${OPENAI_API_KEY:?OPENAI_API_KEY must be set, or present in \$DIGEST_REPO/.env.local}"

DATE="$(date +%F)"
WORK="$(mktemp -d)"

# Repeat guard: list every URL featured in this track's recent issues so the
# generator avoids re-featuring them, and arm the matching publish-time check.
# Curated runs are hand-picked and exempt.
if [ "$MODE" != "curated" ]; then
  case "$CADENCE" in
    daily)  REPEAT_GUARD_DAYS=7 ;;
    weekly) REPEAT_GUARD_DAYS=28 ;;
  esac
  node scripts/digest/recent-coverage.mjs --cadence "$CADENCE" --track "$TRACK" \
    --days "$REPEAT_GUARD_DAYS" --before "$DATE" > "$WORK/recent-coverage.md"
  export DIGEST_REPEAT_GUARD_DAYS="$REPEAT_GUARD_DAYS"
fi

LOG_DIR="$WEBSITE_DIR/.digest-runs"
mkdir -p "$LOG_DIR"
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
  -e "s|{{WINDOW}}|${WINDOW}|g" \
  -e "s|{{WORD_TARGET}}|${WORD_TARGET}|g" \
  -e "s|{{MINUTES}}|${MINUTES}|g" \
  -e "s|{{ITEM_RANGE}}|${ITEM_RANGE}|g" \
  -e "s|{{DATE}}|${DATE}|g" \
  -e "s|{{WORK}}|${WORK}|g" \
  -e "s|{{ITEMS_FILE}}|${ITEMS_FILE}|g" \
  -e "s|{{WEBSITE_DIR}}|${WEBSITE_DIR}|g" \
  "$TEMPLATE")"

CLAUDE_FLAGS="${CLAUDE_FLAGS:---permission-mode acceptEdits --allowedTools Bash,Write,Read,Edit,mcp__code-intel-copilot__search_items,mcp__code-intel-copilot__semantic_search_items,mcp__code-intel-copilot__aggregate_items,mcp__code-intel-copilot__get_item,mcp__code-intel-copilot__mirror_status}"

CLAUDE_BIN="${CLAUDE_BIN:-claude-auto}"

echo "[digest] ${MODE} ${DATE} — generating (work=${WORK}, via ${CLAUDE_BIN})" | tee "$LOG"
# shellcheck disable=SC2086
"$CLAUDE_BIN" -p "$PROMPT" $CLAUDE_FLAGS 2>&1 | tee -a "$LOG"

git add src/content/digest public/media/digests 2>/dev/null || true
if git diff --cached --quiet; then
  echo "[digest] nothing new to commit — agent may have written a 'quiet day' issue or failed; see $LOG" | tee -a "$LOG"
else
  git commit -q -m "content(digest): ${MODE} ${DATE}"
  echo "[digest] committed locally" | tee -a "$LOG"
  if [ "${DIGEST_PUSH:-0}" = "1" ]; then
    git pull --rebase --autostash && git push
    echo "[digest] pushed — site will rebuild" | tee -a "$LOG"
  else
    echo "[digest] DIGEST_PUSH!=1, not pushing (validate, then enable)" | tee -a "$LOG"
  fi
fi

rm -rf "$WORK"
