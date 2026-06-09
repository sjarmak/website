#!/usr/bin/env bash
# Local-cron runner for the digest pipeline. Generates one issue via `claude -p`
# (which reaches the code-intel-copilot MCP from ~/.claude.json), then commits and
# — only when DIGEST_PUSH=1 — pushes so the site rebuilds.
#
#   scripts/digest/run.sh daily
#   scripts/digest/run.sh weekly
#
# Env:
#   OPENAI_API_KEY  (required — used by tts-render.mjs)
#   DIGEST_PUSH=1   (optional — push after commit; default off so you can validate first)
#   CLAUDE_FLAGS    (optional — override the claude -p permission flags; see README)
#   WEBSITE_DIR     (optional — defaults to this repo)
set -euo pipefail

MODE="${1:-}"
case "$MODE" in
  daily)  WINDOW="the last ~36 hours"; WORD_TARGET=1800; MINUTES=12; ITEM_RANGE="5-7" ;;
  weekly) WINDOW="the last 7 days";    WORD_TARGET=6750; MINUTES=45; ITEM_RANGE="12-15" ;;
  *) echo "usage: run.sh <daily|weekly>" >&2; exit 2 ;;
esac

WEBSITE_DIR="${WEBSITE_DIR:-/home/ds/projects/website}"
cd "$WEBSITE_DIR"
: "${OPENAI_API_KEY:?OPENAI_API_KEY must be set (tts-render.mjs needs it)}"

DATE="$(date +%F)"
WORK="$(mktemp -d)"
LOG_DIR="$WEBSITE_DIR/.digest-runs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/${MODE}-$(date +%Y%m%d-%H%M%S).log"

PROMPT="$(sed \
  -e "s|{{MODE}}|${MODE}|g" \
  -e "s|{{WINDOW}}|${WINDOW}|g" \
  -e "s|{{WORD_TARGET}}|${WORD_TARGET}|g" \
  -e "s|{{MINUTES}}|${MINUTES}|g" \
  -e "s|{{ITEM_RANGE}}|${ITEM_RANGE}|g" \
  -e "s|{{DATE}}|${DATE}|g" \
  -e "s|{{WORK}}|${WORK}|g" \
  -e "s|{{WEBSITE_DIR}}|${WEBSITE_DIR}|g" \
  scripts/digest/generate.md)"

CLAUDE_FLAGS="${CLAUDE_FLAGS:---permission-mode acceptEdits}"

echo "[digest] ${MODE} ${DATE} — generating (work=${WORK})" | tee "$LOG"
# shellcheck disable=SC2086
claude -p "$PROMPT" $CLAUDE_FLAGS 2>&1 | tee -a "$LOG"

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
