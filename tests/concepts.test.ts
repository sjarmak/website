import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { STABILITY_FIXTURE_FILES } from "./fixtures/stability-fixture-paths.mjs";
import {
  buildConceptIndex,
  canonicalConceptSlug,
  loadConcepts,
  type ConceptEntry,
} from "../src/lib/knowledge/conceptAliases.ts";

const DIGEST_DIR = "src/content/digest";

/** The facet drift groups the registry must collapse to one canonical slug each. */
const DRIFT_GROUPS: string[][] = [
  ["evals", "evaluation"],
  ["multi-agent", "multi-agent-orchestration", "agent-orchestration"],
  ["open-models", "open-weights", "open-weight-models"],
  ["ai-security", "agent-security"],
];

test("registry seeds between 30 and 50 entries", () => {
  const concepts = loadConcepts();
  assert.ok(
    concepts.length >= 30 && concepts.length <= 50,
    `expected 30-50 entries, got ${concepts.length}`,
  );
});

test("each drift group resolves to a single canonical concept slug", () => {
  for (const group of DRIFT_GROUPS) {
    const slugs = group.map((facet) => canonicalConceptSlug(facet));
    for (const [i, slug] of slugs.entries()) {
      assert.ok(slug !== null, `facet "${group[i]}" did not resolve to any concept`);
    }
    assert.equal(
      new Set(slugs).size,
      1,
      `drift group [${group.join(", ")}] resolved to multiple slugs: ${slugs.join(", ")}`,
    );
  }
});

test("unknown facets resolve to null", () => {
  assert.equal(canonicalConceptSlug("definitely-not-a-concept"), null);
});

test("duplicate alias across two entries throws", () => {
  const fixture: ConceptEntry[] = [
    { slug: "alpha", label: "Alpha", aliases: ["shared-alias"], definition: "a", related: [] },
    { slug: "beta", label: "Beta", aliases: ["shared-alias"], definition: "b", related: [] },
  ];
  assert.throws(() => buildConceptIndex(fixture), /duplicate concept alias "shared-alias"/);
});

test("duplicate label across two entries throws", () => {
  const fixture: ConceptEntry[] = [
    { slug: "alpha", label: "Same Label", aliases: [], definition: "a", related: [] },
    { slug: "beta", label: "Same Label", aliases: [], definition: "b", related: [] },
  ];
  assert.throws(() => buildConceptIndex(fixture), /duplicate concept alias "same-label"/);
});

test(">=90% of digest topic-facet occurrences resolve to a canonical concept", () => {
  let total = 0;
  let resolved = 0;
  const unresolved = new Map<string, number>();
  // Stability-test fixtures may transiently exist in a parallel test process;
  // their deliberately-unresolvable facets must not skew the live rate.
  const fixtureFiles = new Set(STABILITY_FIXTURE_FILES);
  for (const file of readdirSync(DIGEST_DIR).filter(
    (f) => f.endsWith(".md") && !fixtureFiles.has(f),
  )) {
    const raw = readFileSync(join(DIGEST_DIR, file), "utf8");
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    assert.ok(match, `${file}: missing frontmatter`);
    const fm = parse(match[1]) as { topics?: unknown };
    const facets = Array.isArray(fm.topics) ? fm.topics : [];
    for (const facet of facets) {
      assert.equal(typeof facet, "string", `${file}: non-string topic facet`);
      total += 1;
      if (canonicalConceptSlug(facet as string) !== null) {
        resolved += 1;
      } else {
        unresolved.set(facet as string, (unresolved.get(facet as string) ?? 0) + 1);
      }
    }
  }
  assert.ok(total > 0, "no digest topic facets found");
  const rate = resolved / total;
  const misses = [...unresolved.entries()].map(([f, n]) => `${f}(${n})`).join(", ");
  assert.ok(
    rate >= 0.9,
    `resolution ${(rate * 100).toFixed(1)}% (${resolved}/${total}) below 90%; unresolved: ${misses}`,
  );
});
