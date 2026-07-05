#!/usr/bin/env node
// R19b quarterly policy tripwire — files at most one bead per calendar QUARTER
// reminding Stephanie to re-check Google scaled-content / site-reputation
// guidance against the digest cadence. It mirrors the R14 audit-reminder
// pattern (scripts/audit/audit-reminder.mjs): state in the pipeline home,
// injectable clock, dry-run for tests, bead text carries counts + the
// policy-check instructions ONLY — never content or URLs.
//
// The bead names the pre-built one-commit reversal lever (PRD R19b): flipping
// DIGEST_NOINDEX_LEVER to true in src/lib/register.ts deindexes every
// /digest/* page (noindex,follow + sitemap-excluded) in a single deploy.
//
// Usage:
//   node scripts/checks/policy-tripwire-reminder.mjs [--dry-run] [--now YYYY-MM-DD]
//     [--digest-dir <dir>]
//
// Env:
//   CONCEPTS_PIPELINE_HOME  out-of-repo pipeline home (state lives in <home>/state/)
//   BD_BIN                  bd binary (default "bd"; tests point this at a stub)
//
// State: <home>/state/policy-tripwire-state.json { lastFiledQuarter, lastFiledAt }.
// Written only after a successful filing (or a dry-run print), so a failed
// `bd create` retries on the next digest run. Rate limit: one bead per UTC
// calendar quarter.

import { execFile } from "node:child_process";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs, promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { ensurePipelineHome } from "../concepts/lib/pipeline-home.mjs";

const run = promisify(execFile);

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, "..", "..");
const DEFAULT_DIGEST_DIR = path.join(REPO_ROOT, "src", "content", "digest");
const STATE_FILENAME = "policy-tripwire-state.json";

// UTC calendar quarter key, e.g. "2026-Q3". (Not exported: main() runs on
// import, so consumers test this script as a subprocess, like audit-reminder.)
function quarterOf(date) {
  return `${date.getUTCFullYear()}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
}

async function readState(statePath) {
  let raw;
  try {
    raw = await readFile(statePath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
  const state = JSON.parse(raw);
  if (typeof state !== "object" || state === null) {
    throw new Error(`${statePath} is not a JSON object`);
  }
  return state;
}

// Counts + policy-check instructions ONLY — no content, no URLs.
function buildBdArgs({ issueCount, quarter }) {
  const title = `R19 policy tripwire (${quarter}): scaled-content policy vs digest cadence`;
  const description =
    `Quarterly reminder to re-check Google scaled-content and site-reputation guidance ` +
    `against the digest cadence (daily + weekly cron tracks; ${issueCount} committed issues). ` +
    `If policy risk has materialized, pull the pre-built one-commit reversal lever: flip ` +
    `DIGEST_NOINDEX_LEVER to true in src/lib/register.ts — every /digest/ page becomes ` +
    `noindex,follow and leaves the sitemap on the next deploy. ` +
    `Verify with npm run build (register-drift stays green).`;
  return ["create", title, "-d", description, "-p", "2"];
}

async function main() {
  const { values } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      now: { type: "string" },
      "digest-dir": { type: "string", default: DEFAULT_DIGEST_DIR },
    },
  });
  const dryRun = values["dry-run"];
  const now = values.now ? new Date(`${values.now}T00:00:00Z`) : new Date();
  if (Number.isNaN(now.getTime())) throw new Error(`--now must be YYYY-MM-DD, got "${values.now}"`);
  const quarter = quarterOf(now);

  const { stateDir } = await ensurePipelineHome();
  const statePath = path.join(stateDir, STATE_FILENAME);
  const state = await readState(statePath);

  if (state.lastFiledQuarter === quarter) {
    console.log(
      `[policy-tripwire] already filed for ${quarter} — skipping (state: ${statePath})`,
    );
    return;
  }

  const issueCount = (await readdir(values["digest-dir"])).filter((n) => n.endsWith(".md")).length;
  const bdArgs = buildBdArgs({ issueCount, quarter });

  const bdBin = process.env.BD_BIN?.trim() || "bd";
  if (dryRun) {
    console.log(`[policy-tripwire] dry-run: would file ${JSON.stringify([bdBin, ...bdArgs])}`);
  } else {
    const { stdout } = await run(bdBin, bdArgs);
    console.log(`[policy-tripwire] filed tripwire bead for ${quarter}: ${stdout.trim()}`);
  }

  await writeFile(
    statePath,
    `${JSON.stringify({ lastFiledQuarter: quarter, lastFiledAt: now.toISOString(), dryRun }, null, 2)}\n`,
    "utf8",
  );
}

main().catch((err) => {
  console.error(`[policy-tripwire] FAILED: ${err.message}`);
  process.exit(1);
});
