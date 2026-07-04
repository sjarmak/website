import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { loadConcepts } from "../src/lib/knowledge/conceptAliases.ts";
import {
  ASSIGNMENT_KEY_RE,
  CONCEPT_ASSIGNMENTS_PATH,
  loadConceptAssignments,
  parseConceptAssignments,
  splitAssignmentKey,
} from "../src/lib/knowledge/conceptAssignments.ts";

const VALIDATOR = "scripts/knowledge/validate_concept_assignments.mjs";
const SEEDER = "scripts/knowledge/seed_concept_assignments.mjs";

function runValidator(file?: string): { status: number | null; stderr: string } {
  const args = [VALIDATOR, ...(file ? [file] : [])];
  const result = spawnSync(process.execPath, args, { encoding: "utf8" });
  return { status: result.status, stderr: result.stderr };
}

function fixture(content: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), "concept-assignments-"));
  const path = join(dir, "fixture.json");
  writeFileSync(path, JSON.stringify(content));
  return path;
}

// ---- build-time Zod parse (shape drift fails CI) ----

test("Zod parse rejects non-immutable-id key forms", () => {
  // explorer-section slug as a key — exactly the drift the schema must block
  assert.throws(() => parseConceptAssignments({ "procedural-skills": { concept: "evaluation" } }));
  assert.throws(() => parseConceptAssignments({ "section:procedural-skills": { concept: "evaluation" } }));
  assert.throws(() => parseConceptAssignments({ "paper:": { concept: "evaluation" } }));
});

test("Zod parse rejects a missing concept field", () => {
  assert.throws(() => parseConceptAssignments({ "digest:daily-2026-06-09": {} }));
  assert.throws(() => parseConceptAssignments({ "digest:daily-2026-06-09": { takeaway: "x" } }));
});

test("Zod parse rejects unknown fields and non-slug concepts", () => {
  assert.throws(() =>
    parseConceptAssignments({ "paper:2026arXiv1B": { concept: "evaluation", section: "evals" } }),
  );
  assert.throws(() => parseConceptAssignments({ "paper:2026arXiv1B": { concept: "Not A Slug" } }));
});

test("Zod parse accepts all four immutable-id prefixes", () => {
  const parsed = parseConceptAssignments({
    "paper:2026arXiv260524117L": { concept: "evaluation", takeaway: "t" },
    "digest:daily-2026-06-09": { concept: "evaluation" },
    "thread:agentic-memory": { concept: "agent-memory" },
    "vault:some-note-id": { concept: "agent-memory" },
  });
  assert.equal(Object.keys(parsed).length, 4);
});

// ---- committed file invariants ----

test("committed file parses and holds only immutable-id keys", () => {
  const assignments = loadConceptAssignments();
  const keys = Object.keys(assignments);
  assert.ok(keys.length > 0, "committed file must not be empty");
  for (const key of keys) {
    assert.match(key, ASSIGNMENT_KEY_RE);
    const { kind } = splitAssignmentKey(key);
    assert.ok(["paper", "digest", "thread", "vault"].includes(kind));
  }
});

test("no vault entries are seeded", () => {
  const keys = Object.keys(loadConceptAssignments());
  assert.equal(keys.filter((k) => k.startsWith("vault:")).length, 0);
});

test("every committed concept value exists in the registry", () => {
  const conceptSlugs = new Set(loadConcepts().map((c) => c.slug));
  for (const [key, assignment] of Object.entries(loadConceptAssignments())) {
    assert.ok(conceptSlugs.has(assignment.concept), `${key} -> unknown concept ${assignment.concept}`);
  }
});

test("seeder is deterministic: re-run reproduces the committed file", () => {
  const dir = mkdtempSync(join(tmpdir(), "concept-assignments-seed-"));
  const out = join(dir, "reseeded.json");
  const result = spawnSync(process.execPath, [SEEDER, out], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(out, "utf8"), readFileSync(CONCEPT_ASSIGNMENTS_PATH, "utf8"));
});

// ---- validator process exit codes ----

test("validator exits 0 on the committed file", () => {
  const { status, stderr } = runValidator();
  assert.equal(status, 0, stderr);
});

test("validator exits non-zero on a nonexistent bibcode", () => {
  const { status, stderr } = runValidator(fixture({ "paper:2099zzzzNOPE....X": { concept: "evaluation" } }));
  assert.notEqual(status, 0);
  assert.match(stderr, /bibcode not found/);
});

test("validator exits non-zero on a nonexistent digest slug", () => {
  const { status, stderr } = runValidator(fixture({ "digest:daily-1999-01-01": { concept: "evaluation" } }));
  assert.notEqual(status, 0);
  assert.match(stderr, /no such entry/);
});

test("validator exits non-zero on a nonexistent concept slug", () => {
  const { status, stderr } = runValidator(
    fixture({ "digest:daily-2026-06-09": { concept: "not-a-real-concept" } }),
  );
  assert.notEqual(status, 0);
  assert.match(stderr, /nonexistent concept slug/);
});

test("validator exits non-zero on shape drift (facet string as key)", () => {
  const { status } = runValidator(fixture({ evals: { concept: "evaluation" } }));
  assert.notEqual(status, 0);
});
