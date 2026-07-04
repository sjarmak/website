#!/usr/bin/env node
// R14 LLM-bio audit — MANUAL-RUN ONLY. Never wire into CI or cron (the digest
// cron files a monthly REMINDER bead via audit-reminder.mjs; it must never
// run this script). See scripts/audit/README.md for the flatness definition,
// the kill criterion, and the Search Console lane (the primary evidence lane
// — this script is the fragile secondary).
//
// Usage:
//   node scripts/audit/llm-bio-audit.mjs [--endpoints id,id] [--timeout ms] [--date YYYY-MM-DD]
//
// Env:
//   CONCEPTS_PIPELINE_HOME   out-of-repo home; reports land in <home>/audits/
//   AUDIT_ENDPOINTS          default endpoint subset (comma-separated ids)
//   PERPLEXITY_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY,
//   BRAVE_SEARCH_API_KEY     per-lane keys; an absent key skips that lane
//                            (recorded "unavailable") — keys are NEVER committed
//
// Exit 0 covers a fully-unavailable run: recording "no lanes reachable" is a
// valid audit result (the honest no-keys baseline). Non-zero only for
// structural failures (bad args, in-repo home, unwritable reports).

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseArgs } from "node:util";
import { ensureAuditHome } from "./lib/audit-home.mjs";
import { DEFAULT_TIMEOUT_MS, runLane, selectEndpoints } from "./lib/endpoints.mjs";
import { buildReport, renderMarkdown } from "./lib/report.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

function reportBasename(dateArg, auditDir) {
  const date = dateArg || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`--date must be YYYY-MM-DD, got "${date}"`);
  const plain = `audit-${date}`;
  if (!existsSync(path.join(auditDir, `${plain}.json`))) return plain;
  // A report for this date already exists — keep it, suffix the new one.
  const hms = new Date().toISOString().slice(11, 19).replaceAll(":", "");
  return `${plain}-${hms}`;
}

async function main() {
  const { values } = parseArgs({
    options: {
      endpoints: { type: "string" },
      timeout: { type: "string" },
      date: { type: "string" },
    },
  });

  const timeoutMs = values.timeout ? Number(values.timeout) : DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error(`--timeout must be a positive number of ms, got "${values.timeout}"`);
  }

  const endpointArg = values.endpoints ?? process.env.AUDIT_ENDPOINTS ?? "";
  const ids = endpointArg.split(",").map((s) => s.trim()).filter(Boolean);
  const endpoints = selectEndpoints(ids);

  const questionsRaw = JSON.parse(await readFile(path.join(SCRIPT_DIR, "questions.json"), "utf8"));
  const { site, questions } = questionsRaw;
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("questions.json has no questions");
  }

  const auditDir = await ensureAuditHome();

  console.error(`[audit] running ${endpoints.length} lane(s) × ${questions.length} question(s)`);
  const lanes = [];
  for (const endpoint of endpoints) {
    const lane = await runLane(endpoint, questions, { timeoutMs });
    console.error(`[audit] lane ${lane.id}: ${lane.status}${lane.reason ? ` (${lane.reason})` : ""}`);
    lanes.push(lane);
  }

  const report = buildReport({ site, questions, lanes });
  const base = reportBasename(values.date, auditDir);
  const jsonPath = path.join(auditDir, `${base}.json`);
  const mdPath = path.join(auditDir, `${base}.md`);
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(mdPath, renderMarkdown(report), "utf8");

  const { summary } = report;
  console.error(
    `[audit] lanes available: ${summary.lanesAvailable}/${summary.lanesConfigured}; ` +
      `sjarmak.ai URLs: ${summary.sjarmakUrlsCited}; /concepts/*: ${summary.conceptUrlsCited}; ` +
      `flat: ${summary.flat === null ? "indeterminate" : summary.flat}`,
  );
  console.log(jsonPath);
  console.log(mdPath);
}

main().catch((err) => {
  console.error(`[audit] FAILED: ${err.message}`);
  process.exit(1);
});
