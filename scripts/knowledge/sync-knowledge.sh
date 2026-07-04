#!/usr/bin/env bash
# Daily knowledge-sync check. After the specialized daily digest publishes, decide
# whether the papers it cited belong in the curated NASA ADS/SciX libraries and the
# thematic explorers:
#   - library additions  -> written as PROPOSALS for human review (nothing touches
#     ADS here; apply later with apply_library_proposals.py)
#   - explorer additions -> applied directly to the in-repo explorer source files +
#     grounded synthesis, then committed LOCALLY (never pushed)
#
#   scripts/knowledge/sync-knowledge.sh                 # today's daily digest
#   scripts/knowledge/sync-knowledge.sh --date 2026-06-14
#   scripts/knowledge/sync-knowledge.sh --mode weekly --date 2026-06-15
#
# Env mirrors the digest runner:
#   CLAUDE_BIN     (default claude-auto — least-loaded-account router)
#   CLAUDE_FLAGS   (override the claude -p permission flags)
#   WEBSITE_DIR    (default this repo)
set -euo pipefail

MODE="daily"
DATE="$(date +%F)"
while [ $# -gt 0 ]; do
  case "$1" in
    --mode) MODE="$2"; shift 2 ;;
    --date) DATE="$2"; shift 2 ;;
    *) echo "usage: sync-knowledge.sh [--mode daily] [--date YYYY-MM-DD]" >&2; exit 2 ;;
  esac
done

WEBSITE_DIR="${WEBSITE_DIR:-/home/ds/projects/website}"
cd "$WEBSITE_DIR"

SYNC_DIR="$WEBSITE_DIR/.knowledge-sync/$DATE"
mkdir -p "$SYNC_DIR"
LOG="$SYNC_DIR/run-$(date +%Y%m%d-%H%M%S).log"

# Concepts rider (deterministic, no LLM; scripts/knowledge/concepts_rider.mjs).
# Installed as an EXIT trap so it runs at the end of EVERY sync cycle — full
# run, no-candidates no-op, or failure — keeping the committed heartbeat fresh
# each cycle. The CONCEPTS_RIDER flag (default off) is read by the rider
# itself: disabled runs still stamp the heartbeat with the disabled state.
# A rider failure is reported in the summary but NEVER changes the sync's own
# exit status ($sync_rc is captured on entry and restored via exit).
run_concepts_rider() {
  local sync_rc=$?
  set +e
  node scripts/knowledge/concepts_rider.mjs 2>&1 | tee -a "$LOG"
  local rider_rc=${PIPESTATUS[0]}
  if [ "$rider_rc" -ne 0 ]; then
    echo "[knowledge-sync] concepts rider FAILED (exit $rider_rc) — sync steps unaffected" | tee -a "$LOG"
  else
    echo "[knowledge-sync] concepts rider done" | tee -a "$LOG"
  fi
  # Commit the heartbeat refresh, pathspec-scoped: if an earlier commit step
  # failed and left unrelated content staged (e.g. explorers.json), a bare
  # `git commit` would sweep it in under this message. `git commit -- <path>`
  # commits ONLY the heartbeat and leaves other staged content staged.
  local hb_file="src/data/knowledge/concept-sync-status.json"
  if ! git diff --quiet HEAD -- "$hb_file" 2>/dev/null; then
    git commit -q -m "chore(concepts): rider heartbeat ${MODE} ${DATE}" -- "$hb_file" || true
    if [ "${KNOWLEDGE_SYNC_PUSH:-0}" = "1" ]; then
      { git pull --rebase --autostash && git push; } \
        || echo "[knowledge-sync] heartbeat push failed (commit stays local)" | tee -a "$LOG"
    fi
  fi
  exit "$sync_rc"
}
trap run_concepts_rider EXIT

# Deterministic prep: extract the digest's research items + targets/membership.
# Exit 3 means "nothing to consider" — a clean no-op, not a failure.
set +e
python3 scripts/knowledge/sync_candidates.py --date "$DATE" --mode "$MODE" --out "$SYNC_DIR" 2>&1 | tee "$LOG"
PREP=${PIPESTATUS[0]}
set -e
if [ "$PREP" = "3" ]; then
  echo "[knowledge-sync] no research candidates for ${MODE}-${DATE} — nothing to do" | tee -a "$LOG"
  exit 0
fi
[ "$PREP" = "0" ] || { echo "[knowledge-sync] candidate extraction failed (exit $PREP)" | tee -a "$LOG"; exit "$PREP"; }

PROMPT="$(sed \
  -e "s|{{DATE}}|${DATE}|g" \
  -e "s|{{SYNC_DIR}}|${SYNC_DIR}|g" \
  -e "s|{{WEBSITE_DIR}}|${WEBSITE_DIR}|g" \
  "scripts/knowledge/sync-knowledge.md")"

CLAUDE_FLAGS="${CLAUDE_FLAGS:---permission-mode acceptEdits --allowedTools Bash,Write,Read,Edit,mcp__scix__get_paper,mcp__scix__read_paper,mcp__scix__search}"
CLAUDE_BIN="${CLAUDE_BIN:-claude-auto}"

echo "[knowledge-sync] ${MODE} ${DATE} — classifying (via ${CLAUDE_BIN})" | tee -a "$LOG"
# shellcheck disable=SC2086
"$CLAUDE_BIN" -p "$PROMPT" $CLAUDE_FLAGS 2>&1 | tee -a "$LOG"

# Explorer edits are the only committed output; library proposals stay in the
# gitignored sync dir until the human approves and runs the apply step.
git add src/data/knowledge/explorers src/data/knowledge/explorers.json \
        src/data/knowledge/paper-synthesis.json src/data/knowledge/explorer-pending.json 2>/dev/null || true
if git diff --cached --quiet; then
  echo "[knowledge-sync] no explorer changes to commit (see $SYNC_DIR/report.md)" | tee -a "$LOG"
else
  git commit -q -m "content(knowledge): explorer sync ${MODE} ${DATE}"
  # Mirrors the digest runner's DIGEST_PUSH: default off so a manual run stays
  # local for review; the cron sets KNOWLEDGE_SYNC_PUSH=1 to publish.
  if [ "${KNOWLEDGE_SYNC_PUSH:-0}" = "1" ]; then
    git pull --rebase --autostash && git push
    echo "[knowledge-sync] committed and pushed explorer updates — site will rebuild" | tee -a "$LOG"
  else
    echo "[knowledge-sync] committed explorer updates locally (KNOWLEDGE_SYNC_PUSH!=1, not pushing)" | tee -a "$LOG"
  fi
fi

if [ -f "$SYNC_DIR/library-proposals.json" ]; then
  N=$(python3 -c "import json,sys;print(len(json.load(open('$SYNC_DIR/library-proposals.json')).get('proposals',[])))" 2>/dev/null || echo "?")
  echo "[knowledge-sync] ${N} library proposal(s) await review: $SYNC_DIR/library-proposals.json" | tee -a "$LOG"
  echo "[knowledge-sync] review, then: python3 scripts/knowledge/apply_library_proposals.py --date ${DATE} --apply" | tee -a "$LOG"
fi
echo "[knowledge-sync] report: $SYNC_DIR/report.md" | tee -a "$LOG"
