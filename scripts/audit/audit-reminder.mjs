#!/usr/bin/env node
// R14 audit REMINDER — the only piece of the audit instrument the digest cron
// touches. Files at most one bead per calendar month reminding Stephanie to
// run the manual audit (scripts/audit/llm-bio-audit.mjs). It NEVER runs the
// audit itself, and the bead references counts and dates only — no report
// content leaves the pipeline home.
//
// Usage:
//   node scripts/audit/audit-reminder.mjs [--dry-run] [--now YYYY-MM-DD]
//
// Env:
//   CONCEPTS_PIPELINE_HOME  out-of-repo home (state + report counts live in <home>/audits/)
//   BD_BIN                  bd binary (default "bd"; tests point this at a stub)
//
// State: <home>/audits/reminder-state.json { lastFiledMonth, lastFiledAt }.
// State is written only after a successful filing (or a dry-run print), so a
// failed `bd create` retries on the next digest run. Rate limit: one bead per
// month, keyed on the UTC YYYY-MM of the (injectable) clock.

import { execFile } from "node:child_process";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs, promisify } from "node:util";
import { ensureAuditHome } from "./lib/audit-home.mjs";

const run = promisify(execFile);

const STATE_FILENAME = "reminder-state.json";
const REPORT_RE = /^audit-(\d{4}-\d{2}-\d{2})(?:-\d{6})?\.json$/;

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

// Counts/dates ONLY — the description must never carry report content.
function buildBdArgs({ reportCount, lastAuditDate, month }) {
  const title = `R14 audit due (${month}): run the LLM bio audit`;
  const description =
    `Monthly reminder to run the MANUAL R14 audit: node scripts/audit/llm-bio-audit.mjs ` +
    `(never CI/cron). Audit reports on file: ${reportCount}. ` +
    `Last audit: ${lastAuditDate ?? "none"}. ` +
    `Also record the Search Console lane (primary). ` +
    `Flatness + kill criterion: scripts/audit/README.md.`;
  return ["create", title, "-d", description, "-p", "2"];
}

async function main() {
  const { values } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      now: { type: "string" },
    },
  });
  const dryRun = values["dry-run"];
  const now = values.now ? new Date(`${values.now}T00:00:00Z`) : new Date();
  if (Number.isNaN(now.getTime())) throw new Error(`--now must be YYYY-MM-DD, got "${values.now}"`);
  const month = now.toISOString().slice(0, 7);

  const auditDir = await ensureAuditHome();
  const statePath = path.join(auditDir, STATE_FILENAME);
  const state = await readState(statePath);

  if (state.lastFiledMonth === month) {
    console.log(`[audit-reminder] already filed for ${month} — skipping (state: ${statePath})`);
    return;
  }

  const entries = await readdir(auditDir);
  const auditDates = entries
    .map((name) => name.match(REPORT_RE)?.[1])
    .filter(Boolean)
    .sort();
  const bdArgs = buildBdArgs({
    reportCount: auditDates.length,
    lastAuditDate: auditDates.at(-1) ?? null,
    month,
  });

  const bdBin = process.env.BD_BIN?.trim() || "bd";
  if (dryRun) {
    console.log(`[audit-reminder] dry-run: would file ${JSON.stringify([bdBin, ...bdArgs])}`);
  } else {
    const { stdout } = await run(bdBin, bdArgs);
    console.log(`[audit-reminder] filed reminder bead for ${month}: ${stdout.trim()}`);
  }

  await writeFile(
    statePath,
    `${JSON.stringify({ lastFiledMonth: month, lastFiledAt: now.toISOString(), dryRun }, null, 2)}\n`,
    "utf8",
  );
}

main().catch((err) => {
  console.error(`[audit-reminder] FAILED: ${err.message}`);
  process.exit(1);
});
