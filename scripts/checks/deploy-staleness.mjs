#!/usr/bin/env node
// R19a deploy-staleness gate — the digest cron asserts deploy freshness BEFORE
// generating, so a red-CI streak (autoDeployTrigger: checksPass silently
// freezes Render deploys) becomes a refused, loudly-explained run instead of a
// growing pile of never-deployed issues.
//
// Deployed marker: the newest digest issue date visible in the LIVE sitemap
// (default https://www.sjarmak.ai/sitemap-0.xml) — the date embedded in each
// /digest/<slug>/ loc, and the <lastmod> where present (R3 emits lastmod from
// the same slug date; pre-R3 deploys carry locs only, so the loc date keeps
// this check working across that boundary). Deterministic and day-precise,
// and it moves daily while the pipeline is healthy. There is deliberately NO
// build timestamp anywhere in dist/ (R3's double-build byte-identical
// guarantee), so this is the cleanest build-identifying value the live site
// exposes.
//
// Local marker: the newest issue date under src/content/digest (slug dates,
// frontmatter `date:` fallback).
//
// STALE means: localNewest − deployedNewest > threshold (default 48h) — the
// repo has digest content the deploy never picked up. Stale ⇒ loud message +
// alert marker in <pipeline-home>/alerts/ + exit 2 (run.sh refuses
// generation). Env DIGEST_FORCE=1 downgrades stale to a loud warning (marker
// still written, exit 0) so a deliberate run can proceed.
//
// OFFLINE-SAFE: a fetch failure, non-200, or unparseable sitemap is a
// warn-and-proceed (exit 0) — the check itself must never hard-block a run.
//
// Usage:
//   node scripts/checks/deploy-staleness.mjs [--sitemap-url <url> | --sitemap-file <path>]
//     [--digest-dir <dir>] [--threshold-hours <n>]
//
// Exit codes: 0 fresh / warn-and-proceed / DIGEST_FORCE override; 2 stale
// (refuse generation); 1 internal error.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";
import { writeAlertMarker } from "./lib/alerts.mjs";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, "..", "..");

export const DEFAULT_SITEMAP_URL = "https://www.sjarmak.ai/sitemap-0.xml";
export const DEFAULT_DIGEST_DIR = path.join(REPO_ROOT, "src", "content", "digest");
export const DEFAULT_THRESHOLD_HOURS = 48;
const FETCH_TIMEOUT_MS = 15_000;
const MARKER_KIND = "deploy-stale";
const DATE_RE = /(\d{4}-\d{2}-\d{2})/;

// Newest deployed digest issue date (ms since epoch) in a sitemap XML string:
// per /digest/ URL, the slug date in the <loc> and the <lastmod> (if any),
// whichever is newer. Null when the sitemap shows no dateable digest URL.
export function newestDigestLastmod(xml) {
  let newest = null;
  const consider = (t) => {
    if (t !== undefined && !Number.isNaN(t) && (newest === null || t > newest)) newest = t;
  };
  for (const [, block] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!loc || !new URL(loc).pathname.startsWith("/digest/")) continue;
    const slugDate = new URL(loc).pathname.match(DATE_RE)?.[1];
    if (slugDate) consider(Date.parse(`${slugDate}T00:00:00.000Z`));
    const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
    if (lastmod) consider(Date.parse(lastmod));
  }
  return newest;
}

// Newest issue date (ms) across the local digest collection: slug date first,
// frontmatter `date:` fallback. Null when the dir has no dateable issues.
export async function newestLocalDigestDate(digestDir) {
  let newest = null;
  for (const name of await readdir(digestDir)) {
    if (!name.endsWith(".md")) continue;
    let date = name.match(DATE_RE)?.[1];
    if (!date) {
      const text = await readFile(path.join(digestDir, name), "utf8");
      date = text.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1];
    }
    if (!date) continue;
    const t = Date.parse(`${date}T00:00:00.000Z`);
    if (!Number.isNaN(t) && (newest === null || t > newest)) newest = t;
  }
  return newest;
}

function day(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

async function loadSitemap({ sitemapFile, sitemapUrl }) {
  if (sitemapFile) return readFile(sitemapFile, "utf8");
  const res = await fetch(sitemapUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${sitemapUrl} responded ${res.status}`);
  return res.text();
}

async function main() {
  const { values } = parseArgs({
    options: {
      "sitemap-url": { type: "string", default: DEFAULT_SITEMAP_URL },
      "sitemap-file": { type: "string" },
      "digest-dir": { type: "string", default: DEFAULT_DIGEST_DIR },
      "threshold-hours": { type: "string", default: String(DEFAULT_THRESHOLD_HOURS) },
    },
  });
  const thresholdHours = Number(values["threshold-hours"]);
  if (!Number.isFinite(thresholdHours) || thresholdHours <= 0) {
    throw new Error(`--threshold-hours must be a positive number, got "${values["threshold-hours"]}"`);
  }

  // Network / parse problems are warnings, never blocks (offline-safe).
  let xml;
  try {
    xml = await loadSitemap({
      sitemapFile: values["sitemap-file"],
      sitemapUrl: values["sitemap-url"],
    });
  } catch (err) {
    console.error(
      `[deploy-staleness] WARNING: could not read the live sitemap (${err.message}) — ` +
        `cannot assess deploy freshness, proceeding (offline-safe)`,
    );
    return;
  }

  const deployed = newestDigestLastmod(xml);
  if (deployed === null) {
    console.error(
      "[deploy-staleness] WARNING: no dateable /digest/ URL found in the sitemap — " +
        "cannot assess deploy freshness, proceeding",
    );
    return;
  }

  const local = await newestLocalDigestDate(values["digest-dir"]);
  if (local === null) {
    console.error(
      `[deploy-staleness] WARNING: no dateable digest issues under ${values["digest-dir"]} — proceeding`,
    );
    return;
  }

  const gapHours = (local - deployed) / 3_600_000;
  if (gapHours <= thresholdHours) {
    console.log(
      `[deploy-staleness] OK — deploy is fresh (deployed newest digest ${day(deployed)}, ` +
        `local newest ${day(local)}, gap ${gapHours.toFixed(0)}h ≤ ${thresholdHours}h)`,
    );
    return;
  }

  const detail =
    `STALE DEPLOY: local digest content (${day(local)}) is ${gapHours.toFixed(0)}h ahead of the ` +
    `live site's newest deployed digest (${day(deployed)}) — threshold ${thresholdHours}h.\n` +
    `Pushes are likely landing while deploys are blocked (red CI under autoDeployTrigger: ` +
    `checksPass). Check: gh run list --limit 5. Override for one run: DIGEST_FORCE=1.`;
  const marker = await writeAlertMarker(MARKER_KIND, detail);

  if (process.env.DIGEST_FORCE === "1") {
    console.error(`[deploy-staleness] ${detail}`);
    console.error(
      `[deploy-staleness] DIGEST_FORCE=1 — proceeding despite the stale deploy (marker: ${marker})`,
    );
    return;
  }

  console.error(`[deploy-staleness] ${detail}`);
  console.error(`[deploy-staleness] marker: ${marker}`);
  console.error("[deploy-staleness] REFUSING generation (exit 2).");
  process.exit(2);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`[deploy-staleness] FAILED: ${err.message}`);
    process.exit(1);
  });
}
