// Concept-page index state (PRD R4′) unit tests: the committed allowlist +
// authored-body manifest are the ONLY inputs to indexability; an
// agent-committed body without a human-approved manifest entry must never
// flip a page indexable; lastmod quantizes to the week floor.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  computeConceptIndexable,
  conceptBodyIsNonEmpty,
  isNoindexConceptPath,
  isIndexableConcept,
  loadConceptAllowlist,
  loadAuthoredManifest,
} from "../src/lib/concepts/indexState.ts";
import { computeConceptLastmods, weekFloorUtc } from "../src/lib/concepts/lastmod.ts";
import { isNoindexPath } from "../src/lib/register.ts";

// The 19 slugs approved at the 2026-07-04 R18 sitting (bead sjai-oha).
const APPROVED_19 = [
  "agent-memory",
  "agent-tooling",
  "agentic-coding",
  "ai-economics",
  "ai-for-science",
  "ai-governance",
  "ai-infrastructure",
  "ai-safety",
  "ai-security",
  "code-review",
  "evaluation",
  "information-retrieval",
  "memory-consolidation",
  "model-releases",
  "multi-agent-orchestration",
  "open-models",
  "reliability",
  "synthetic-data",
  "test-time-compute",
];

// ------------------------------------------- committed files (seed state)

test("the committed allowlist contains EXACTLY the 19 approved slugs", () => {
  assert.deepEqual([...loadConceptAllowlist()].sort(), APPROVED_19);
});

test("every allowlisted slug is a real concept entry", () => {
  const known = new Set(
    readdirSync("src/content/concepts").map((f) => f.replace(/\.(md|mdx)$/, "")),
  );
  for (const slug of loadConceptAllowlist()) {
    assert.ok(known.has(slug), `allowlisted slug "${slug}" has no concept file`);
  }
});

test("the authored-body manifest starts empty", () => {
  assert.deepEqual(loadAuthoredManifest(), {});
});

// --------------------------------- the voice-prose boundary is mechanical

function fixtureConceptDir({ body }) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "concept-body-"));
  writeFileSync(
    path.join(dir, "fixture-concept.md"),
    `---\nlabel: "Fixture"\ndefinition: "A fixture concept."\n---\n${body}`,
    "utf8",
  );
  return dir;
}

test("an agent-committed body WITHOUT a manifest entry does NOT flip indexability", (t) => {
  const dir = fixtureConceptDir({ body: "\nAgent-written prose that nobody approved.\n" });
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  assert.equal(conceptBodyIsNonEmpty("fixture-concept", dir), true, "fixture body is non-empty");
  const indexable = computeConceptIndexable("fixture-concept", {
    allowlist: [],
    manifest: {}, // no human approval
    bodyIsNonEmpty: (slug) => conceptBodyIsNonEmpty(slug, dir),
  });
  assert.equal(indexable, false, "body alone must never flip index state");
});

test("a manifest-approved non-empty body DOES flip indexability", (t) => {
  const dir = fixtureConceptDir({ body: "\nA body Stephanie wrote and approved.\n" });
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  const indexable = computeConceptIndexable("fixture-concept", {
    allowlist: [],
    manifest: { "fixture-concept": { approvedBy: "stephanie", date: "2026-07-04" } },
    bodyIsNonEmpty: (slug) => conceptBodyIsNonEmpty(slug, dir),
  });
  assert.equal(indexable, true);
});

test("a manifest entry WITHOUT a body does nothing", (t) => {
  const dir = fixtureConceptDir({ body: "\n   \n" });
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  const indexable = computeConceptIndexable("fixture-concept", {
    allowlist: [],
    manifest: { "fixture-concept": { approvedBy: "stephanie", date: "2026-07-04" } },
    bodyIsNonEmpty: (slug) => conceptBodyIsNonEmpty(slug, dir),
  });
  assert.equal(indexable, false);
});

test("allowlist membership flips indexability regardless of body", () => {
  const indexable = computeConceptIndexable("some-concept", {
    allowlist: ["some-concept"],
    manifest: {},
    bodyIsNonEmpty: () => false,
  });
  assert.equal(indexable, true);
});

// --------------------------------------- route mapping over the repo state

test("per-slug noindex split: allowlisted indexable, below-floor noindexed, unknown fails closed", () => {
  assert.equal(isIndexableConcept("evaluation"), true);
  assert.equal(isIndexableConcept("scientific-search"), false);

  assert.equal(isNoindexConceptPath("/concepts"), false, "the index page is always indexable");
  assert.equal(isNoindexConceptPath("/concepts/evaluation"), false);
  assert.equal(isNoindexConceptPath("/concepts/scientific-search"), true);
  assert.equal(isNoindexConceptPath("/concepts/no-such-concept"), true, "unknown fails closed");
  assert.equal(isNoindexConceptPath("/concepts/evaluation/nested"), true, "nested fails closed");
});

test("register.ts isNoindexPath routes /concepts/* through the committed index state", () => {
  assert.equal(isNoindexPath("/concepts/"), false);
  assert.equal(isNoindexPath("/concepts/evaluation/"), false);
  assert.equal(isNoindexPath("/concepts/scientific-search/"), true);
  // the R3 prefix behavior is untouched
  assert.equal(isNoindexPath("/prototypes/concepts/"), true);
  assert.equal(isNoindexPath("/prototypes/"), false);
});

// ------------------------------------------------------ week-floor lastmod

test("weekFloorUtc floors to the UTC Monday of the date's week", () => {
  assert.equal(weekFloorUtc("2098-01-06"), "2098-01-06T00:00:00.000Z"); // a Monday
  assert.equal(weekFloorUtc("2098-01-08"), "2098-01-06T00:00:00.000Z");
  assert.equal(weekFloorUtc("2098-01-09"), "2098-01-06T00:00:00.000Z");
  assert.equal(weekFloorUtc("2098-01-12"), "2098-01-06T00:00:00.000Z"); // the Sunday
  assert.equal(weekFloorUtc("2098-01-13"), "2098-01-13T00:00:00.000Z"); // next Monday
  assert.throws(() => weekFloorUtc("not-a-date"));
});

test("computeConceptLastmods: newest dated digest evidence, week-floored; dateless concepts absent", () => {
  const evidence = new Map([
    ["a", { digests: [{ date: "2098-01-08" }, { date: "2098-01-07" }] }],
    ["b", { digests: [{ date: "2098-01-09" }] }],
    ["c", { digests: [{}] }], // evidence without dates
    ["d", { digests: [] }],
  ]);
  const lastmods = computeConceptLastmods(evidence);
  assert.equal(lastmods.get("a"), "2098-01-06T00:00:00.000Z");
  assert.equal(lastmods.get("b"), "2098-01-06T00:00:00.000Z");
  assert.equal(lastmods.has("c"), false);
  assert.equal(lastmods.has("d"), false);
});
