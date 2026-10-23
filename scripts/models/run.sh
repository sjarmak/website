#!/usr/bin/env bash
set -euo pipefail

readonly EXIT_USAGE=2
readonly EXIT_SOURCE=3
readonly EXIT_AGENT=4
readonly EXIT_INVALID=5
readonly EXIT_GATES=6
readonly EXIT_PUBLISH=7
readonly EXIT_STALE=8
readonly EXIT_BUSY=75
readonly DATA_DIR=src/data/models
readonly STATUS_FILE=src/data/models/refresh-status.json

say() {
  printf '[models] %s\n' "$*"
}

die() {
  printf '[models] %s\n' "$2" >&2
  exit "$1"
}

require_linked_worktree() {
  local dir="$1" git_dir common_dir
  git -C "$dir" rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "$EXIT_USAGE" "MODELS_WEBSITE_DIR=$dir is not a git work tree"
  [ "$(git -C "$dir" rev-parse --show-toplevel)" = "$dir" ] || die "$EXIT_USAGE" "MODELS_WEBSITE_DIR=$dir must be the top of a work tree"
  git_dir="$(readlink -f "$(git -C "$dir" rev-parse --absolute-git-dir)")"
  common_dir="$(readlink -f "$(git -C "$dir" rev-parse --path-format=absolute --git-common-dir)")"
  [ "$git_dir" != "$common_dir" ] || die "$EXIT_USAGE" "refusing to run in the primary checkout $dir; the job resets and cleans its tree, so give it a dedicated linked worktree (git worktree add)"
}

load_catalog_config() {
  local file="${MODELS_CATALOG_CONFIG:-${XDG_CONFIG_HOME:-$HOME/.config}/models-refresh/catalog.env}"
  if [ -z "${MODELS_CATALOG_REPO:-}" ] && [ -r "$file" ]; then
    set -a
    . "$file"
    set +a
  fi
  [ -n "${MODELS_CATALOG_REPO:-}" ] && [ -n "${MODELS_CATALOG_FILES:-}" ] || die "$EXIT_USAGE" "catalog source is not configured; set MODELS_CATALOG_REPO and MODELS_CATALOG_FILES or write them to $file"
}

fetch_catalog() {
  local out="$1" ref="${MODELS_CATALOG_REF:-main}" path name
  mkdir -p "$out"
  if [[ "$MODELS_CATALOG_REPO" == /* ]]; then
    CATALOG_COMMIT="$(git -C "$MODELS_CATALOG_REPO" rev-parse --verify "$ref^{commit}")" || return 1
    for path in $MODELS_CATALOG_FILES; do
      name="${path//\//__}"
      git -C "$MODELS_CATALOG_REPO" show "$CATALOG_COMMIT:$path" >"$out/$name" || return 1
    done
  else
    CATALOG_COMMIT="$(gh api "repos/$MODELS_CATALOG_REPO/commits/$ref" --jq .sha)" || return 1
    for path in $MODELS_CATALOG_FILES; do
      name="${path//\//__}"
      gh api -H 'Accept: application/vnd.github.raw' "repos/$MODELS_CATALOG_REPO/contents/$path?ref=$CATALOG_COMMIT" >"$out/$name" || return 1
    done
  fi
  [[ "$CATALOG_COMMIT" =~ ^[0-9a-f]{40}$ ]] || return 1
  for path in "$out"/*; do
    [ -s "$path" ] || return 1
  done
}

http_get() {
  local out="$1" url="$2" code
  shift 2
  if ! code="$(curl -sS -L --max-time "$FEED_TIMEOUT_SEC" -o "$out" -w '%{http_code}' "$@" "$url")"; then
    say "feed $url could not be fetched"
    rm -f "$out"
    return 1
  fi
  if [[ ! "$code" =~ ^2[0-9][0-9]$ ]] || [ ! -s "$out" ]; then
    say "feed $url answered HTTP $code with $(wc -c <"$out" 2>/dev/null || echo 0) bytes"
    rm -f "$out"
    return 1
  fi
}

fetch_livebench() {
  local dir="$1/livebench" script release file sets pinned
  mkdir -p "$dir"
  sets="$(node scripts/models/apply.ts question-sets)" || { say "could not read the pinned livebench question sets"; return 1; }
  for pinned in $sets; do
    [[ "$pinned" =~ ^[0-9]{4}_[0-9]{2}_[0-9]{2}$ ]] || { say "livebench question set $pinned is not YYYY_MM_DD"; return 1; }
    mkdir -p "$dir/v1/$pinned"
    http_get "$dir/v1/$pinned/table.csv" "$LIVEBENCH_URL/v1/table_$pinned.csv" || return 1
    http_get "$dir/v1/$pinned/categories.json" "$LIVEBENCH_URL/v1/categories_$pinned.json" || return 1
  done
  http_get "$dir/index.html" "$LIVEBENCH_URL/" || return 1
  script="$(grep -oE 'static/js/main\.[0-9a-f]+\.js' "$dir/index.html" | head -n 1)"
  [ -n "$script" ] || { say "livebench front page names no main script"; return 1; }
  http_get "$dir/main.js" "$LIVEBENCH_URL/$script" || return 1
  release="$(grep -oE '"20[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])"' "$dir/main.js" | tr -d '"' | sort -u | tail -n 1)"
  [ -n "$release" ] || { say "livebench script names no release"; return 1; }
  for file in table.csv categories.json cost.csv notes.json; do
    http_get "$dir/$file" "$LIVEBENCH_URL/data/$release/$file" || return 1
  done
  rm -f "$dir/index.html" "$dir/main.js"
  printf '%s\n' "$release" >"$dir/release"
  say "livebench release $release"
}

fetch_terminal_bench() {
  local out="$1/terminal-bench.json"
  http_get "$out" "$TBENCH_URL" -X POST -H 'Content-Type: application/json' \
    --data '{"package":"terminal-bench/terminal-bench","name":"4-0-0"}' || return 1
  node -e 'const b=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));if(!b.leaderboard||!Array.isArray(b.rows))process.exit(1)' "$out" || {
    say "terminal-bench feed is not a leaderboard"
    rm -f "$out"
    return 1
  }
}

fetch_feeds() {
  local dir="$1"
  mkdir -p "$dir"
  if fetch_livebench "$dir"; then
    FEED_SOURCES+=(--source livebench-feed=ok)
  else
    rm -rf "${dir:?}/livebench"
    FEED_SOURCES+=(--source livebench-feed=failed)
  fi
  if fetch_terminal_bench "$dir"; then
    FEED_SOURCES+=(--source terminal-bench-feed=ok)
  else
    FEED_SOURCES+=(--source terminal-bench-feed=failed)
  fi
}

seal_evidence() {
  local sealed="$1" copy="$2"
  mkdir -p "$sealed"
  cp -R "$sealed" "$copy"
  chmod -R a-w "$sealed"
}

report_stale() {
  local stale
  stale="$(node -e 'const s=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));process.stdout.write(s.sources.filter((x)=>x.status==="failed"&&x.checked===s.lastAttempt).map((x)=>x.source).join(" "))' "$STATUS_FILE")"
  [ -n "$stale" ] || return 0
  say "published what validated, but these sources failed this run and their rows stay as they were: $stale"
  exit "$EXIT_STALE"
}

fill_prompt() {
  sed -e "s|{{RUN_DATE}}|$RUN_DATE|g" -e "s|{{CATALOG_COMMIT}}|${CATALOG_COMMIT:-}|g" -e "s|{{OUTPUT}}|$2|g" "$1"
}

pick_account() {
  local picked config
  [ -n "${MODELS_ACCOUNT_PICKER:-}" ] || return 0
  picked="$("$MODELS_ACCOUNT_PICKER")" || { say "account picker refused the launch"; return 1; }
  [[ "$picked" =~ ^[1-9]$ ]] || { say "account picker returned an invalid account"; return 1; }
  config="${MODELS_ACCOUNT_HOMES:-$HOME/.claude-homes}/account$picked/.claude"
  [ -f "$config/.credentials.json" ] || { say "account$picked has no credentials file"; return 1; }
  export CLAUDE_CONFIG_DIR="$config"
  say "agent runs on account$picked"
}

run_agent() {
  local label="$1" dir="$2" prompt="$3" tools="$4" output="$5" status=0 before
  before="$(git status --porcelain)"
  say "$label agent starting in $dir"
  (
    cd "$dir"
    pick_account || exit 1
    timeout --kill-after=60 "$AGENT_TIMEOUT_SEC" "$CLAUDE_BIN" -p "$prompt" \
      --restricted --strict-mcp-config --no-session-persistence \
      --tools "$tools" --allowedTools "$tools" --permission-mode acceptEdits
  ) || status=$?
  if [ "$status" != 0 ]; then
    say "$label agent exited $status"
    return 1
  fi
  if [ "$(git status --porcelain)" != "$before" ]; then
    say "$label agent changed files in the website tree"
    return 1
  fi
  if [ ! -s "$dir/$output" ]; then
    say "$label agent wrote no $output"
    return 1
  fi
}

restore_data() {
  git checkout -q HEAD -- "$DATA_DIR"
  git clean -fdq -- "$DATA_DIR"
}

publish() {
  local subject="$1" why="$2"
  shift 2
  git add -- "$@" || return 1
  if git diff --cached --quiet; then
    say "nothing to commit"
    return 0
  fi
  git commit -q -m "$subject" -m "Why: $why" || return 1
  say "committed $(git rev-parse --short HEAD): $subject"
  if [ "${MODELS_PUSH:-0}" = 1 ]; then
    git fetch -q origin main || return 1
    git rebase -q origin/main || { git rebase --abort; return 1; }
    git push -q origin HEAD:main || return 1
    say "pushed $(git rev-parse --short HEAD) to origin/main"
  else
    say "MODELS_PUSH is not 1, so the commit stays local"
  fi
}

record_status() {
  local outcome="$1" code="$2" stage="${3:-}"
  local args=(status --at "$STARTED_AT" --outcome "$outcome" --exit-code "$code" --catalog-commit "${CATALOG_COMMIT:-}")
  [ -z "$stage" ] || args+=(--failed-stage "$stage")
  [ ! -s "$WORK/summary.json" ] || args+=(--summary "$WORK/summary.json")
  [ "$stage" != catalog ] || args+=(--source "omni-catalog=failed")
  [ -z "${CATALOG_COMMIT:-}" ] || [ "$stage" = catalog ] || args+=(--source "omni-catalog=ok")
  args+=("${FEED_SOURCES[@]}" --feeds "$WORK/evidence/feeds")
  node scripts/models/apply.ts "${args[@]}"
}

fail() {
  local code="$1" stage="$2"
  say "run failed at stage $stage (exit $code); data rows are left as they were"
  restore_data || say "could not restore $DATA_DIR"
  if record_status failed "$code" "$stage"; then
    publish "chore(models): refresh failed at $stage on $RUN_DATE" \
      "record the failed scheduled run so the page shows the last successful refresh and the alert fires; no data rows changed" \
      "$STATUS_FILE" || say "could not commit or push the failure status"
  else
    say "could not write the failure status"
  fi
  say "log: $LOG"
  exit "$code"
}

sync_tree() {
  local lock_hash stamp="$LOG_DIR/package-lock.sha256"
  git fetch -q origin || return 1
  git reset -q --hard "$BASE_REF" || return 1
  git clean -fdq || return 1
  lock_hash="$(sha256sum package-lock.json | cut -d' ' -f1)"
  if [ ! -d node_modules ] || [ "$(cat "$stamp" 2>/dev/null)" != "$lock_hash" ]; then
    say "installing dependencies"
    npm ci --no-audit --no-fund >/dev/null || return 1
    printf '%s\n' "$lock_hash" >"$stamp"
  fi
}

main() {
  WEBSITE="${MODELS_WEBSITE_DIR:-}"
  [ -n "$WEBSITE" ] || die "$EXIT_USAGE" "MODELS_WEBSITE_DIR is required: the dedicated worktree the job may reset"
  WEBSITE="$(readlink -f "$WEBSITE")"
  require_linked_worktree "$WEBSITE"
  BASE_REF="${MODELS_BASE_REF:-origin/main}"
  if [ "${MODELS_PUSH:-0}" = 1 ] && [ "$BASE_REF" != origin/main ]; then
    die "$EXIT_USAGE" "MODELS_PUSH=1 publishes to main, so MODELS_BASE_REF must be origin/main, found $BASE_REF"
  fi
  AGENT_TIMEOUT_SEC="${MODELS_AGENT_TIMEOUT_SEC:-2700}"
  [[ "$AGENT_TIMEOUT_SEC" =~ ^[1-9][0-9]*$ ]] || die "$EXIT_USAGE" "MODELS_AGENT_TIMEOUT_SEC must be a positive whole number"
  LOCK_WAIT_SEC="${MODELS_LOCK_WAIT_SEC:-600}"
  [[ "$LOCK_WAIT_SEC" =~ ^[0-9]+$ ]] || die "$EXIT_USAGE" "MODELS_LOCK_WAIT_SEC must be whole seconds"
  RUN_DATE="${MODELS_RUN_DATE:-$(date -u +%F)}"
  [[ "$RUN_DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || die "$EXIT_USAGE" "MODELS_RUN_DATE must be YYYY-MM-DD"
  CLAUDE_BIN="${CLAUDE_BIN:-claude}"
  FEED_TIMEOUT_SEC="${MODELS_FEED_TIMEOUT_SEC:-60}"
  [[ "$FEED_TIMEOUT_SEC" =~ ^[1-9][0-9]*$ ]] || die "$EXIT_USAGE" "MODELS_FEED_TIMEOUT_SEC must be a positive whole number"
  LIVEBENCH_URL="${MODELS_LIVEBENCH_URL:-https://livebench.ai}"
  TBENCH_URL="${MODELS_TBENCH_URL:-https://ofhuhcpkvzjlejydnvyd.supabase.co/functions/v1/leaderboard-read}"
  GATES_CMD="${MODELS_GATES_CMD:-npm run check && npm run build && node --test tests/models-refresh.test.ts}"
  load_catalog_config

  LOG_DIR="$WEBSITE/.models-runs"
  mkdir -p "$LOG_DIR"
  local lock="$LOG_DIR/run.lock" status=0
  if [ "${MODELS_RUN_LOCK:-}" != "$lock" ]; then
    MODELS_RUN_LOCK="$lock" flock -o -E "$EXIT_BUSY" -w "$LOCK_WAIT_SEC" "$lock" bash "$(readlink -f "$0")" "$@" || status=$?
    [ "$status" != "$EXIT_BUSY" ] || say "another refresh still holds $lock after ${LOCK_WAIT_SEC}s" >&2
    return "$status"
  fi

  cd "$WEBSITE"
  LOG="$LOG_DIR/$RUN_DATE.log"
  exec > >(tee -a "$LOG") 2>&1
  STARTED_AT="$(date -u +%FT%TZ)"
  WORK="$(mktemp -d)"
  trap 'chmod -R u+w "$WORK" 2>/dev/null; rm -rf "$WORK"' EXIT
  CATALOG_COMMIT=""
  FEED_SOURCES=()
  say "refresh for $RUN_DATE started $STARTED_AT from $BASE_REF (log $LOG)"

  sync_tree || fail "$EXIT_SOURCE" sync
  [ -s "$STATUS_FILE" ] || die "$EXIT_USAGE" "$BASE_REF has no $STATUS_FILE"

  mkdir -p "$WORK/research" "$WORK/eligibility" "$WORK/evidence"
  node scripts/models/apply.ts reference --out "$WORK/research" || fail "$EXIT_INVALID" reference
  fetch_feeds "$WORK/evidence/feeds"
  seal_evidence "$WORK/evidence/feeds" "$WORK/research/feeds"
  run_agent research "$WORK/research" "$(fill_prompt scripts/models/refresh.md research.json)" \
    "Read,Write,Glob,Grep,WebFetch,WebSearch" research.json || fail "$EXIT_AGENT" research

  fetch_catalog "$WORK/evidence/catalog" || fail "$EXIT_SOURCE" catalog
  seal_evidence "$WORK/evidence/catalog" "$WORK/eligibility/catalog"
  say "catalog commit $CATALOG_COMMIT"
  node scripts/models/apply.ts models --research "$WORK/research/research.json" --run-date "$RUN_DATE" \
    --log "$LOG" --out "$WORK/eligibility/models.json" --feeds "$WORK/evidence/feeds" || fail "$EXIT_INVALID" research-proposals
  cp "$WORK/research/gates.json" "$WORK/eligibility/gates.json"
  run_agent eligibility "$WORK/eligibility" "$(fill_prompt scripts/models/eligibility.md eligibility.json)" \
    "Read,Write,Glob,Grep" eligibility.json || fail "$EXIT_AGENT" eligibility

  node scripts/models/apply.ts apply --research "$WORK/research/research.json" \
    --eligibility "$WORK/eligibility/eligibility.json" --catalog-dir "$WORK/evidence/catalog" \
    --catalog-commit "$CATALOG_COMMIT" --run-date "$RUN_DATE" --log "$LOG" --summary "$WORK/summary.json" \
    --feeds "$WORK/evidence/feeds" || fail "$EXIT_INVALID" apply

  local changed
  changed="$(node -e 'process.stdout.write(String(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).changed))' "$WORK/summary.json")"
  if [ "$changed" = true ]; then
    say "running the gates: $GATES_CMD"
    bash -c "$GATES_CMD" || fail "$EXIT_GATES" gates
    record_status published 0 || fail "$EXIT_PUBLISH" status
    publish "content(models): daily refresh $RUN_DATE" \
      "the scheduled refresh found new or changed evidence for the models comparison; see the run log for each accepted and rejected item" \
      "$DATA_DIR" || fail "$EXIT_PUBLISH" publish
  else
    record_status no-change 0 || fail "$EXIT_PUBLISH" status
    publish "chore(models): refresh found no change on $RUN_DATE" \
      "record that the scheduled refresh ran and every source was checked" \
      "$STATUS_FILE" || fail "$EXIT_PUBLISH" publish
  fi
  say "done; log: $LOG"
  report_stale
}

main "$@"; exit $?
