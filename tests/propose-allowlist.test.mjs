// The allowlist proposal script (PRD R4′) recomputes the ≥5-dated-evidence
// candidates and prints proposed diffs WITHOUT touching the committed
// allowlist — a human applies changes by editing the file in a commit.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import {
  DATED_EVIDENCE_FLOOR,
  countDatedEvidence,
  computeCandidates,
} from "../scripts/knowledge/propose_concept_allowlist.mjs";
import { loadConceptAllowlist, CONCEPTS_ALLOWLIST_PATH } from "../src/lib/concepts/indexState.ts";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(REPO_ROOT, "scripts", "knowledge", "propose_concept_allowlist.mjs");

test("countDatedEvidence counts dated digests + papers with a year", () => {
  const evidence = {
    digests: [{ date: "2026-01-01" }, { date: "" }, {}],
    papers: [{ year: 2024 }, {}],
  };
  assert.equal(countDatedEvidence(evidence), 2);
});

test("the floor is 5 and every candidate clears it", () => {
  assert.equal(DATED_EVIDENCE_FLOOR, 5);
  const candidates = computeCandidates();
  assert.ok(candidates.length > 0);
  for (const c of candidates) {
    assert.ok(c.dated >= DATED_EVIDENCE_FLOOR, `${c.slug} (${c.dated}) clears the floor`);
  }
});

test("running the script proposes diffs but leaves the allowlist byte-identical", async () => {
  const allowlistPath = path.join(REPO_ROOT, CONCEPTS_ALLOWLIST_PATH);
  const before = readFileSync(allowlistPath);

  const { stdout } = await execFileP("node", [SCRIPT], { cwd: REPO_ROOT });

  const after = readFileSync(allowlistPath);
  assert.ok(before.equals(after), "the proposal script must NEVER write the allowlist");

  // it reports against the committed list and says so explicitly
  assert.match(stdout, /\[propose-allowlist\] \d+ candidate\(s\) at >=5 dated evidence/);
  assert.match(stdout, /no files written/);
  for (const slug of loadConceptAllowlist()) {
    assert.ok(stdout.includes(slug), `output covers committed slug ${slug}`);
  }
});
