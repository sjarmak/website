#!/usr/bin/env node
// Concept-allowlist candidate proposal (PRD R4′). Recomputes the
// ≥5-dated-evidence candidates from live data and prints the proposed diff
// against the COMMITTED allowlist (src/data/concepts-allowlist.json).
//
// This script NEVER writes the allowlist. Index state is a committed
// property; a human reviews the printed diff (strike-window semantics, R18)
// and applies it by editing the file in a commit. The evidence floor lives
// here and ONLY here — never in the build.
//
//   node scripts/knowledge/propose_concept_allowlist.mjs
//
// "Dated evidence" = digest evidence entries carrying a date + paper evidence
// entries carrying a year (verified against the 2026-07-04 R18 sitting data:
// exactly the 19 approved slugs sit at or above the floor).

import { pathToFileURL } from "node:url";
import { loadConcepts } from "../../src/lib/knowledge/conceptAliases.ts";
import { loadConceptAssignments } from "../../src/lib/knowledge/conceptAssignments.ts";
import {
  deriveConceptMembership,
  loadDigestDocs,
  loadExplorers,
} from "../../src/lib/knowledge/conceptMembership.ts";
import { loadConceptAllowlist } from "../../src/lib/concepts/indexState.ts";

export const DATED_EVIDENCE_FLOOR = 5;

/** Count a concept's dated evidence: dated digests + papers with a year. */
export function countDatedEvidence(evidence) {
  const datedDigests = evidence.digests.filter(
    (d) => typeof d.date === "string" && d.date.length > 0,
  ).length;
  const datedPapers = evidence.papers.filter((p) => typeof p.year === "number").length;
  return datedDigests + datedPapers;
}

/** Recompute the candidate list (slug + count, count desc) from live inputs. */
export function computeCandidates() {
  const { evidence } = deriveConceptMembership({
    concepts: loadConcepts(),
    digests: loadDigestDocs(),
    explorers: loadExplorers(),
    assignments: loadConceptAssignments(),
  });
  return [...evidence.entries()]
    .map(([slug, ev]) => ({ slug, dated: countDatedEvidence(ev) }))
    .filter((c) => c.dated >= DATED_EVIDENCE_FLOOR)
    .sort((a, b) => b.dated - a.dated || a.slug.localeCompare(b.slug));
}

function main() {
  const candidates = computeCandidates();
  const candidateSlugs = new Set(candidates.map((c) => c.slug));
  const committed = new Set(loadConceptAllowlist());

  const additions = candidates.filter((c) => !committed.has(c.slug));
  const removals = [...committed].filter((slug) => !candidateSlugs.has(slug)).sort();

  console.log(
    `[propose-allowlist] ${candidates.length} candidate(s) at >=${DATED_EVIDENCE_FLOOR} dated evidence; ` +
      `${committed.size} slug(s) committed`,
  );
  for (const c of candidates) {
    const mark = committed.has(c.slug) ? " " : "+";
    console.log(`  ${mark} ${c.slug} (${c.dated})`);
  }

  if (additions.length === 0 && removals.length === 0) {
    console.log("[propose-allowlist] no changes proposed — allowlist matches the candidate set");
  } else {
    if (additions.length > 0) {
      console.log(`[propose-allowlist] proposed ADDITIONS (edit the file to apply):`);
      for (const c of additions) console.log(`  + ${c.slug} (${c.dated} dated evidence)`);
    }
    if (removals.length > 0) {
      console.log(`[propose-allowlist] committed slugs now BELOW the floor (human call to strike):`);
      for (const slug of removals) console.log(`  - ${slug}`);
    }
  }
  console.log(
    "[propose-allowlist] no files written — apply by editing src/data/concepts-allowlist.json in a commit",
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
