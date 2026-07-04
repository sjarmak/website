// Concept-resolution gate for the digest publish path.
//
// Resolves an issue's topic facets against the committed concept alias table
// (src/content/concepts via conceptAliases.ts) with mode-split polarity:
//   - cron/headless (DIGEST_CRON=1, set by run.sh): warn and publish. The
//     unresolved facets are recorded in the entry's frontmatter and proposed
//     to the shared concepts inbox — never invented inline, never blocks the
//     3 a.m. run.
//   - interactive (no flag): hard-fail when the facets resolve to ZERO
//     concepts — the operator is present, so fix the facets before publishing.
//
// On every publish the overall digest facet-resolution rate (across all
// issues) is re-measured and written to the committed heartbeat.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { canonicalConceptSlug } from "../../src/lib/knowledge/conceptAliases.ts";
import { ensurePipelineHome } from "../concepts/lib/pipeline-home.mjs";
import { appendProposal } from "../concepts/lib/inbox.mjs";
import { updateHeartbeat, facetResolutionRate } from "../concepts/lib/heartbeat.mjs";

// cwd-relative like publish-digest's CONTENT_DIR — both scripts run from the
// repo root (or a test's temp repo).
export const HEARTBEAT_REL_PATH = "src/data/knowledge/concept-sync-status.json";

export function isCronMode(env = process.env) {
  return env.DIGEST_CRON === "1";
}

// Resolve the issue's facets. Returns { resolved, unresolvedFacets }.
// Interactive mode throws when a non-empty facet list resolves to zero
// concepts; an empty list has nothing to resolve and always passes.
export function evaluateConceptGate(topics, { cron, log = console.error } = {}) {
  const resolved = [];
  const unresolvedFacets = [];
  for (const facet of topics) {
    const slug = canonicalConceptSlug(facet);
    if (slug === null) unresolvedFacets.push(facet);
    else resolved.push(slug);
  }

  if (topics.length > 0 && resolved.length === 0) {
    const detail = unresolvedFacets.map((f) => `  ${f}`).join("\n");
    if (!cron) {
      throw new Error(
        `concept gate: none of the issue's topics resolve to a concept:\n${detail}\n` +
          `Map each facet to a concept slug/alias in src/content/concepts (or fix the ` +
          `spelling) and re-run. Cron runs (DIGEST_CRON=1) warn instead and file inbox proposals.`
      );
    }
    log(`[concept-gate] WARNING: zero of ${topics.length} topic facet(s) resolve to a concept:\n${detail}`);
  } else if (unresolvedFacets.length > 0) {
    log(`[concept-gate] WARNING: ${unresolvedFacets.length} unresolved topic facet(s): ${unresolvedFacets.join(", ")}`);
  }

  return { resolved, unresolvedFacets };
}

// Append one alias/new-concept proposal per unresolved facet to the shared
// inbox in the pipeline home (outside the repo). Returns the written entries.
export async function proposeUnresolvedFacets(unresolvedFacets, { issueSlug, date }, env = process.env) {
  const { inboxPath } = await ensurePipelineHome(env);
  const entries = [];
  for (const facet of unresolvedFacets) {
    entries.push(
      await appendProposal(inboxPath, {
        source: "digest-publish-gate",
        kind: "concept",
        payload: { facet, issueSlug, date },
      })
    );
  }
  return entries;
}

// Overall facet-resolution rate across ALL digest issues: every `topics`
// entry in every issue's frontmatter, resolved via the committed alias table.
// Same tolerant frontmatter scan as recent-coverage.mjs — a malformed issue
// is skipped, not fatal.
export async function measureFacetResolution(contentDir) {
  let resolved = 0;
  let total = 0;
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
    const topics = Array.isArray(fm?.topics) ? fm.topics : [];
    for (const facet of topics) {
      if (typeof facet !== "string") continue;
      total += 1;
      if (canonicalConceptSlug(facet) !== null) resolved += 1;
    }
  }
  return { resolved, total, rate: facetResolutionRate(resolved, total) };
}

// Re-measure and write the heartbeat. Returns the heartbeat path so the
// caller stages it alongside the digest entry — the heartbeat update is part
// of the publish output.
export async function recordFacetResolution(contentDir, heartbeatPath = HEARTBEAT_REL_PATH, { now = new Date() } = {}) {
  const facetResolution = await measureFacetResolution(contentDir);
  await updateHeartbeat(heartbeatPath, {
    steps: { "digest-publish": now.toISOString() },
    facetResolution,
  }, { now });
  return heartbeatPath;
}

// Post-write side effects: inbox proposals (cron only) and the heartbeat
// refresh (both modes). These run AFTER the digest entry is on disk, so a
// failure here must NEVER abort the publish — in either mode it degrades to
// a loud warning and the publish completes exactly as it would have pre-gate
// (the stale heartbeat plus the warning in the run log then surface the
// problem). The interactive hard gate stays where it belongs: BEFORE any
// write, in evaluateConceptGate.
//
// Returns the extra paths to stage alongside the entry (the heartbeat, when
// its update succeeded).
export async function runPostPublishSideEffects(
  { cron, unresolvedFacets, issueSlug, date, contentDir },
  { log = console.error, env = process.env } = {},
) {
  const staged = [];
  if (cron && unresolvedFacets.length > 0) {
    try {
      await proposeUnresolvedFacets(unresolvedFacets, { issueSlug, date }, env);
    } catch (err) {
      log(
        `[concept-gate] WARNING: failed to file inbox proposals for ${issueSlug} (${err.message}) — ` +
          `publish continues; re-file them from the entry's unresolvedFacets frontmatter`,
      );
    }
  }
  try {
    staged.push(await recordFacetResolution(contentDir));
  } catch (err) {
    log(
      `[concept-gate] WARNING: heartbeat facet-resolution update failed (${err.message}) — ` +
        `publish continues; the heartbeat is now stale`,
    );
  }
  return staged;
}
