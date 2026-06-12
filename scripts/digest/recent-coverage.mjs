#!/usr/bin/env node
// Repeat guard data source: collect every item URL featured in recently
// published digest issues of a given cadence + track.
//
// Used two ways:
//   - CLI (from run.sh): prints a markdown do-not-repeat list the generation
//     agent reads before selecting items.
//   - Module (from publish-digest.mjs): enforces the guard mechanically when
//     DIGEST_REPEAT_GUARD_DAYS is set.
//
// Usage:
//   node scripts/digest/recent-coverage.mjs --cadence daily --track general \
//     --days 7 --before 2026-06-13 [--content-dir src/content/digest]

import { readFile, readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import YAML from "yaml";

// Exact-URL matching with light normalization: drop the fragment, tracking
// params, and a trailing slash. Hosts are case-insensitive (URL lowercases
// them); paths stay case-sensitive.
export function normalizeUrl(raw) {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    for (const key of [...u.searchParams.keys()]) {
      if (/^utm_/i.test(key)) u.searchParams.delete(key);
    }
    u.pathname = u.pathname.replace(/\/$/, "");
    return u.toString().replace(/\?$/, "");
  } catch {
    return raw.trim().replace(/\/$/, "");
  }
}

// Item URLs from issues matching cadence + track with a date in
// [before - days, before). `before` is exclusive so re-publishing the same
// day's issue never collides with itself.
export async function collectRecentCoverage({ contentDir, cadence, track, days, before }) {
  const cutoff = new Date(`${before}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const since = cutoff.toISOString().slice(0, 10);

  const covered = [];
  for (const file of await readdir(contentDir)) {
    if (!file.endsWith(".md")) continue;
    const text = await readFile(path.join(contentDir, file), "utf8");
    const fmMatch = text.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) continue;
    let fm;
    try {
      fm = YAML.parse(fmMatch[1]);
    } catch {
      continue;
    }
    const date = typeof fm?.date === "string" ? fm.date : fm?.date?.toISOString?.().slice(0, 10);
    if (fm?.cadence !== cadence || (fm?.track ?? "specialized") !== track) continue;
    if (!date || date < since || date >= before) continue;
    for (const item of fm.items ?? []) {
      if (!item?.url) continue;
      covered.push({
        url: item.url,
        normalized: normalizeUrl(item.url),
        title: item.title ?? "",
        slug: file.replace(/\.md$/, ""),
        date,
      });
    }
  }
  covered.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return covered;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) args[argv[i].slice(2)] = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { cadence, track, days, before } = args;
  if (!cadence || !track || !days || !before) {
    throw new Error("usage: recent-coverage.mjs --cadence <daily|weekly> --track <specialized|general> --days <n> --before <YYYY-MM-DD>");
  }
  const covered = await collectRecentCoverage({
    contentDir: args["content-dir"] ?? "src/content/digest",
    cadence,
    track,
    days: Number(days),
    before,
  });

  const lines = [
    `# Already covered — URLs featured in ${cadence}/${track} issues in the ${days} days before ${before}.`,
    `# Do NOT feature any of these again. Publishing rejects specs that repeat one.`,
    "",
  ];
  if (covered.length === 0) {
    lines.push("(none — no recent coverage to avoid)");
  } else {
    for (const c of covered) {
      lines.push(`- ${c.url} — "${c.title}" (${c.slug})`);
    }
  }
  process.stdout.write(lines.join("\n") + "\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`[recent-coverage] ${err.message}`);
    process.exit(1);
  });
}
