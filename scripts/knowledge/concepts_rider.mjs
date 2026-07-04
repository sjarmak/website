#!/usr/bin/env node
// Deterministic concepts rider for the knowledge sync (no LLM involved).
//
// Runs at the end of every scripts/knowledge/sync-knowledge.sh cycle (EXIT
// trap). Recomputes which explorer sections map to which concepts via the
// alias table, tracks section identity across runs by paper-membership
// overlap, proposes genuinely new sections to the shared inbox, and stamps
// the committed heartbeat on EVERY outcome — success, clean no-op, failure,
// and flag-disabled — so a wedged or disabled rider is visibly stale within
// one sync cycle.
//
// Env contract:
//   CONCEPTS_RIDER=1            enable the compute path (default off: the run
//                               only records flags.riderEnabled=false)
//   CONCEPTS_PIPELINE_HOME      pipeline home (state dir + proposal inbox);
//                               see scripts/concepts/lib/pipeline-home.mjs
//   CONCEPTS_HEARTBEAT_PATH     heartbeat override (tests); default is the
//                               committed src/data/knowledge/concept-sync-status.json
//   CONCEPTS_EXPLORERS_PATH     explorers.json override (tests/fixtures)
//
// Exit codes: 0 = ok / clean no-op / disabled, 1 = failure (heartbeat still
// records the failure before exiting).

import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { ensurePipelineHome, REPO_ROOT } from "../concepts/lib/pipeline-home.mjs";
import { appendProposal, backlogStats, readProposals } from "../concepts/lib/inbox.mjs";
import {
  HEARTBEAT_PATH,
  facetResolutionRate,
  updateHeartbeat,
} from "../concepts/lib/heartbeat.mjs";
import {
  CONCEPTS_DIR,
  buildConceptIndex,
  loadConcepts,
  normalizeFacet,
} from "../../src/lib/knowledge/conceptAliases.ts";

export const STEP_NAME = "knowledge-sync-rider";
export const SNAPSHOT_FILENAME = "explorer-sections.json";
export const MEMBERSHIP_FILENAME = "concept-membership.json";
export const OVERLAP_THRESHOLD = 0.8;
export const DEFAULT_EXPLORERS_PATH = path.join(REPO_ROOT, "src", "data", "knowledge", "explorers.json");

function heartbeatPath(env) {
  return env.CONCEPTS_HEARTBEAT_PATH?.trim() || HEARTBEAT_PATH;
}

function explorersPath(env) {
  return env.CONCEPTS_EXPLORERS_PATH?.trim() || DEFAULT_EXPLORERS_PATH;
}

// Load and structurally validate explorers.json. The rider consumes only
// {explorers[].id, sections[].key/label/summary, papers[].bibcode/branches};
// drift in those fields must fail loudly, not degrade.
export async function loadExplorers(filePath) {
  const text = await readFile(filePath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`${filePath}: malformed explorers JSON (${err.message})`);
  }
  if (!Array.isArray(parsed?.explorers)) {
    throw new Error(`${filePath}: "explorers" must be an array`);
  }
  parsed.explorers.forEach((explorer, i) => {
    if (typeof explorer?.id !== "string" || explorer.id === "") {
      throw new Error(`${filePath}: explorers[${i}].id must be a non-empty string`);
    }
    if (!Array.isArray(explorer.sections)) {
      throw new Error(`${filePath}: explorers[${i}] (${explorer.id}): "sections" must be an array`);
    }
    for (const section of explorer.sections) {
      if (typeof section?.key !== "string" || typeof section?.label !== "string") {
        throw new Error(`${filePath}: explorer ${explorer.id}: every section needs string key + label`);
      }
    }
    if (!Array.isArray(explorer.papers)) {
      throw new Error(`${filePath}: explorers[${i}] (${explorer.id}): "papers" must be an array`);
    }
    for (const paper of explorer.papers) {
      if (!Array.isArray(paper?.branches) || paperId(paper) === null) {
        throw new Error(
          `${filePath}: explorer ${explorer.id}: every paper needs a branches array ` +
            `and at least one identity field (bibcode/arxiv/url/title)`,
        );
      }
    }
  });
  return parsed.explorers;
}

// Stable membership identity for a paper. bibcode is preferred but is null
// for non-ADS items (blog posts etc.), so fall back through arxiv/url/title —
// every committed paper carries at least a title.
export function paperId(paper) {
  for (const field of ["bibcode", "arxiv", "url", "title"]) {
    const value = paper?.[field];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return null;
}

// Concept mapping for one section: normalized key first, then normalized label.
export function resolveSectionConcept(section, conceptIndex) {
  return conceptIndex.get(normalizeFacet(section.key)) ?? conceptIndex.get(normalizeFacet(section.label)) ?? null;
}

// Fraction of the CURRENT section's papers present in the prior section.
// Containment (not Jaccard) so a straight rename scores 1.0 and a split child
// (fully contained in its former parent) also scores 1.0.
export function overlapRatio(currentPapers, priorPapers) {
  if (currentPapers.size === 0) return 0;
  let shared = 0;
  for (const bibcode of currentPapers) {
    if (priorPapers.has(bibcode)) shared += 1;
  }
  return shared / currentPapers.size;
}

// Flatten explorers into section records: identity, concept mapping, papers.
export function computeSections(explorers, conceptIndex) {
  const sections = [];
  for (const explorer of explorers) {
    const papersByBranch = new Map(explorer.sections.map((s) => [s.key, new Set()]));
    for (const paper of explorer.papers) {
      for (const branch of paper.branches) {
        papersByBranch.get(branch)?.add(paperId(paper));
      }
    }
    for (const section of explorer.sections) {
      sections.push({
        explorerId: explorer.id,
        key: section.key,
        label: section.label,
        summary: typeof section.summary === "string" ? section.summary : "",
        concept: resolveSectionConcept(section, conceptIndex),
        papers: [...papersByBranch.get(section.key)].sort(),
      });
    }
  }
  return sections;
}

// Classify current sections against the prior snapshot. A section is the SAME
// section as a prior one (same explorer) when its key matches (membership
// churn on a stable key is not a new section) or when its paper overlap
// reaches the threshold (rename/split — slug equality deliberately not
// required). New = no concept mapping AND no prior match.
export function classifySections(currentSections, priorSections) {
  const priorByExplorer = new Map();
  for (const prior of priorSections) {
    if (!priorByExplorer.has(prior.explorerId)) priorByExplorer.set(prior.explorerId, []);
    priorByExplorer.get(prior.explorerId).push({ ...prior, paperSet: new Set(prior.papers) });
  }

  const mapped = [];
  const reconciled = [];
  const fresh = [];
  for (const section of currentSections) {
    if (section.concept !== null) {
      mapped.push(section);
      continue;
    }
    const candidates = priorByExplorer.get(section.explorerId) ?? [];
    const paperSet = new Set(section.papers);
    const match = candidates.find(
      (prior) => prior.key === section.key || overlapRatio(paperSet, prior.paperSet) >= OVERLAP_THRESHOLD,
    );
    if (match) {
      reconciled.push({ section, priorKey: match.key });
    } else {
      fresh.push(section);
    }
  }
  return { mapped, reconciled, fresh };
}

async function readSnapshot(snapshotPath) {
  let text;
  try {
    text = await readFile(snapshotPath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`${snapshotPath}: malformed snapshot JSON (${err.message})`);
  }
  if (!Array.isArray(parsed?.sections)) {
    throw new Error(`${snapshotPath}: "sections" must be an array`);
  }
  return parsed.sections;
}

async function writeState(filePath, body, now) {
  await writeFile(filePath, JSON.stringify({ version: 1, updatedAt: now.toISOString(), ...body }, null, 2) + "\n", "utf8");
}

// The full enabled+disabled rider pass. Throws on failure (the CLI wrapper
// records the failure heartbeat); returns a summary otherwise.
export async function runRider({ env = process.env, now = new Date(), log = console.error } = {}) {
  const hbPath = heartbeatPath(env);

  if (env.CONCEPTS_RIDER !== "1") {
    await updateHeartbeat(hbPath, { steps: { [STEP_NAME]: now.toISOString() }, flags: { riderEnabled: false } }, { now, log });
    log(`[concepts-rider] CONCEPTS_RIDER!=1 — disabled state recorded in heartbeat, nothing else touched`);
    return { outcome: "disabled", proposals: 0 };
  }

  const explorers = await loadExplorers(explorersPath(env));
  const conceptIndex = buildConceptIndex(loadConcepts(path.join(REPO_ROOT, CONCEPTS_DIR)));
  const sections = computeSections(explorers, conceptIndex);

  const home = await ensurePipelineHome(env, { log });
  const snapshotPath = path.join(home.stateDir, SNAPSHOT_FILENAME);
  const priorSections = await readSnapshot(snapshotPath);
  const bootstrap = priorSections === null;

  let proposals = [];
  let mapped = sections.filter((s) => s.concept !== null);
  if (bootstrap) {
    // First run: no baseline to diff against. Proposing here would flood the
    // shared inbox with every unmapped section at once, so snapshot only.
    log(`[concepts-rider] no prior snapshot at ${snapshotPath} — bootstrap run, snapshot written, no proposals`);
  } else {
    const classified = classifySections(sections, priorSections);
    mapped = classified.mapped;
    proposals = classified.fresh;
    for (const { section, priorKey } of classified.reconciled) {
      if (priorKey !== section.key) {
        log(`[concepts-rider] reconciled ${section.explorerId}/${priorKey} -> ${section.key} (>=${OVERLAP_THRESHOLD * 100}% paper overlap)`);
      }
    }
    for (const section of proposals) {
      await appendProposal(home.inboxPath, {
        source: STEP_NAME,
        kind: "new-explorer-section",
        payload: {
          explorerId: section.explorerId,
          sectionKey: section.key,
          label: section.label,
          summary: section.summary,
          paperCount: section.papers.length,
        },
      }, { now });
      log(`[concepts-rider] NEW section ${section.explorerId}/${section.key} — proposal appended to inbox`);
    }
  }

  await writeState(snapshotPath, { sections }, now);
  await writeState(path.join(home.stateDir, MEMBERSHIP_FILENAME), {
    memberships: mapped.map((s) => ({
      concept: s.concept,
      explorerId: s.explorerId,
      sectionKey: s.key,
      paperCount: s.papers.length,
    })),
  }, now);

  const backlog = backlogStats(await readProposals(home.inboxPath), { now });
  await updateHeartbeat(hbPath, {
    steps: { [STEP_NAME]: now.toISOString() },
    flags: { riderEnabled: true, riderOk: true },
    backlog: { count: backlog.count, oldestAgeSeconds: backlog.oldestAgeSeconds },
    facetResolution: {
      resolved: mapped.length,
      total: sections.length,
      rate: facetResolutionRate(mapped.length, sections.length),
    },
  }, { now, log });

  const outcome = bootstrap ? "bootstrap" : proposals.length === 0 ? "noop" : "ok";
  log(`[concepts-rider] ${outcome}: ${sections.length} sections, ${mapped.length} concept-mapped, ${proposals.length} proposal(s)`);
  return { outcome, proposals: proposals.length };
}

// Failure heartbeat: riderEnabled stays true (the run was attempted), riderOk
// flips false. Kept independent of the failed work so it succeeds even when
// explorers.json or the pipeline home is the broken piece.
export async function recordRiderFailure({ env = process.env, now = new Date(), log = console.error } = {}) {
  await updateHeartbeat(heartbeatPath(env), {
    steps: { [STEP_NAME]: now.toISOString() },
    flags: { riderEnabled: true, riderOk: false },
  }, { now, log });
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  try {
    await runRider();
  } catch (err) {
    console.error(`[concepts-rider] FAILED: ${err instanceof Error ? err.message : String(err)}`);
    try {
      await recordRiderFailure({});
    } catch (hbErr) {
      console.error(`[concepts-rider] heartbeat write also failed: ${hbErr instanceof Error ? hbErr.message : String(hbErr)}`);
    }
    process.exit(1);
  }
}
