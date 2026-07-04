#!/usr/bin/env node
// Aging alarm for the concepts proposal inbox.
//
// When the oldest pending proposal exceeds the age threshold, files a beads
// issue via `bd create`. The issue title/description reference COUNTS AND AGES
// ONLY — proposal payload text never leaves the pipeline home.
//
// Usage:
//   node scripts/concepts/lib/aging-alarm.mjs [--dry-run]
//     [--threshold-hours <n=48>] [--inbox <path>] [--now <iso>]
//
// --dry-run prints the exact bd command instead of running it.

import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { resolvePipelineHome, INBOX_FILENAME } from "./pipeline-home.mjs";
import { readProposals, backlogStats } from "./inbox.mjs";

export const DEFAULT_THRESHOLD_HOURS = 48;

// Build the bd create argv from counts and ages only. Payload text must never
// flow into this function.
export function buildAlarmCommand({ count, oldestAgeHours, thresholdHours }) {
  const plural = count === 1 ? "proposal" : "proposals";
  const title = `concepts-pipeline: ${count} ${plural} waiting past ${thresholdHours}h`;
  const description =
    `The concepts proposal inbox holds ${count} pending ${plural}; the oldest has ` +
    `been waiting ${oldestAgeHours}h (threshold ${thresholdHours}h). Drain the ` +
    `inbox via the concepts review flow. This alarm reports counts only; ` +
    `proposal contents stay in the pipeline home.`;
  return ["bd", "create", title, "-d", description, "-p", "2"];
}

export function shellQuote(argv) {
  return argv.map((arg) => (/^[A-Za-z0-9_\-./:]+$/.test(arg) ? arg : `'${arg.replaceAll("'", `'\\''`)}'`)).join(" ");
}

function parseArgs(argv) {
  const args = { "threshold-hours": String(DEFAULT_THRESHOLD_HOURS) };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") {
      args["dry-run"] = true;
    } else if (argv[i].startsWith("--")) {
      args[argv[i].slice(2)] = argv[++i];
    } else {
      throw new Error(`unexpected argument: ${argv[i]}`);
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const thresholdHours = Number(args["threshold-hours"]);
  if (!Number.isFinite(thresholdHours) || thresholdHours <= 0) {
    throw new Error(`--threshold-hours must be a positive number, got ${args["threshold-hours"]}`);
  }
  const now = args.now ? new Date(args.now) : new Date();
  if (Number.isNaN(now.getTime())) {
    throw new Error(`--now must be an ISO timestamp, got ${args.now}`);
  }
  const inboxPath = args.inbox ?? path.join(resolvePipelineHome(), INBOX_FILENAME);

  const entries = await readProposals(inboxPath);
  const { count, oldestAgeSeconds } = backlogStats(entries, { now });
  const thresholdSeconds = thresholdHours * 3600;

  if (count === 0 || oldestAgeSeconds <= thresholdSeconds) {
    console.error(
      `[concepts-alarm] backlog ok: ${count} pending, oldest age ` +
        `${oldestAgeSeconds === null ? "n/a" : `${Math.floor(oldestAgeSeconds / 3600)}h`} ` +
        `(threshold ${thresholdHours}h)`,
    );
    return;
  }

  const oldestAgeHours = Math.floor(oldestAgeSeconds / 3600);
  const command = buildAlarmCommand({ count, oldestAgeHours, thresholdHours });

  if (args["dry-run"]) {
    console.error(`[concepts-alarm] dry-run: backlog aged past threshold; would run:`);
    process.stdout.write(shellQuote(command) + "\n");
    return;
  }

  const result = spawnSync(command[0], command.slice(1), { stdio: "inherit" });
  if (result.error) {
    throw new Error(`failed to run bd: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`bd create exited with status ${result.status}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`[concepts-alarm] ${err.message}`);
    process.exit(1);
  });
}
