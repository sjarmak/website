// R19 run.sh wiring: the cron entry gained three ADDITIVE hooks — an ERR-trap
// red-CI notification, a pre-generation deploy-staleness gate, and the
// quarterly policy tripwire — without touching any existing line (the 0-
// deletions property is history-dependent and verified at commit time via
// `git diff --numstat`; this file asserts syntax + presence + ordering so a
// later edit can't silently drop a hook).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import path from "node:path";
import { REPO_ROOT } from "../scripts/concepts/lib/pipeline-home.mjs";

const run = promisify(execFile);
const RUN_SH = path.join(REPO_ROOT, "scripts", "digest", "run.sh");

test("bash -n accepts run.sh", async () => {
  await assert.doesNotReject(run("bash", ["-n", RUN_SH]));
});

test("ERR trap wires notify-red-ci for unguarded failures", async () => {
  const sh = await readFile(RUN_SH, "utf8");
  assert.match(sh, /trap 'on_digest_error "\$LINENO"' ERR/);
  assert.match(sh, /scripts\/checks\/notify-red-ci\.mjs/);
  assert.match(sh, /\|\| true\n\}/, "the alarm must never mask the original failure");
});

test("deploy-staleness gate runs BEFORE generation, refuses on stale, warns on check error", async () => {
  const sh = await readFile(RUN_SH, "utf8");
  const staleness = sh.indexOf("scripts/checks/deploy-staleness.mjs");
  const generation = sh.indexOf('"$CLAUDE_BIN" -p');
  assert.ok(staleness > 0, "staleness check must be wired");
  assert.ok(generation > 0, "generation call must exist");
  assert.ok(staleness < generation, "staleness gate must run before generation");
  assert.match(sh, /REFUSING generation/);
  assert.match(sh, /DIGEST_FORCE=1/);
  assert.match(sh, /deploy-staleness check errored \(rc=\$DEPLOY_STALENESS_RC\) — proceeding/);
});

test("quarterly policy tripwire is wired additively and failure-guarded", async () => {
  const sh = await readFile(RUN_SH, "utf8");
  assert.match(sh, /node scripts\/checks\/policy-tripwire-reminder\.mjs 2>&1 \| tee -a "\$LOG" \|\| true/);
  // The pre-existing hooks are still present (nothing was removed).
  assert.match(sh, /node scripts\/audit\/audit-reminder\.mjs 2>&1 \| tee -a "\$LOG" \|\| true/);
  assert.match(sh, /node scripts\/checks\/validate-digest-registers\.mjs 2>&1 \| tee -a "\$LOG"/);
});
