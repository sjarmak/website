// Unit tests for src/lib/knowledge/relatedContent.ts: facet->concept
// resolution, fixture-driven loaders, and the related-items intersection.

import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  conceptLabel,
  loadPostDocs,
  loadProjectDocs,
  loadRelatedDocs,
  loadTalkDocs,
  relatedItems,
  resolveConcepts,
  type RelatedDoc,
} from "../src/lib/knowledge/relatedContent.ts";

const FIXTURES = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "related-content",
);

// Deterministic resolver: the tiny vocabulary the fixtures use.
const VOCAB: Record<string, string> = {
  agents: "ai-agents",
  evals: "evaluation",
  retrieval: "information-retrieval",
  "code-intelligence": "code-intelligence",
};
const resolve = (facet: string): string | null => VOCAB[facet] ?? null;

test("resolveConcepts: aliases resolve, unknowns drop, output deduped + sorted", () => {
  assert.deepEqual(resolveConcepts(["evals", "agents", "nonsense", "evals"], resolve), [
    "ai-agents",
    "evaluation",
  ]);
  assert.deepEqual(resolveConcepts([], resolve), []);
});

test("resolveConcepts: default resolver uses the committed registry aliases", () => {
  assert.deepEqual(resolveConcepts(["agents", "not-a-real-facet"]), ["ai-agents"]);
});

test("loadPostDocs: skips drafts, resolves tags, builds /writing urls", () => {
  const docs = loadPostDocs(path.join(FIXTURES, "posts"), resolve);
  assert.deepEqual(
    docs.map((d) => d.id),
    ["alpha", "beta"],
  );
  const alpha = docs[0];
  assert.equal(alpha.kind, "essay");
  assert.equal(alpha.url, "/writing/alpha");
  assert.deepEqual(alpha.concepts, ["ai-agents", "evaluation"]);
});

test("loadProjectDocs: concepts from topics + tags", () => {
  const docs = loadProjectDocs(path.join(FIXTURES, "projects"), resolve);
  const one = docs.find((d) => d.id === "proj-one")!;
  assert.equal(one.kind, "project");
  assert.equal(one.url, "/projects/proj-one");
  assert.deepEqual(one.concepts, ["ai-agents", "evaluation"]);
  const plain = docs.find((d) => d.id === "proj-plain")!;
  assert.deepEqual(plain.concepts, []);
});

test("loadTalkDocs: joins outputs by identical slug; unjoined talks resolve nothing", () => {
  const docs = loadTalkDocs(path.join(FIXTURES, "talks"), path.join(FIXTURES, "outputs"), resolve);
  const joined = docs.find((d) => d.id === "joined-talk")!;
  assert.equal(joined.url, "/talks/#joined-talk");
  assert.deepEqual(joined.concepts, ["ai-agents", "code-intelligence"]);
  const lonely = docs.find((d) => d.id === "lonely-talk")!;
  assert.deepEqual(lonely.concepts, []);
});

test("relatedItems: shared-concept intersection, self-exclusion, order, per-kind cap", () => {
  const doc = (
    kind: RelatedDoc["kind"],
    id: string,
    concepts: string[],
    title = id,
  ): RelatedDoc => ({
    kind,
    id,
    title,
    url: `/${kind}/${id}`,
    concepts,
  });
  const docs = [
    doc("essay", "self", ["a", "b"]),
    doc("essay", "both", ["a", "b"], "Z two shared"),
    doc("essay", "one", ["a"], "A one shared"),
    doc("talk", "talk-hit", ["b"]),
    doc("project", "miss", ["c"]),
  ];
  const got = relatedItems(["a", "b"], docs, { kind: "essay", id: "self" });
  // overlap desc first, then title asc; no self, no zero-overlap docs.
  assert.deepEqual(
    got.map((d) => d.id),
    ["both", "one", "talk-hit"],
  );

  // Per-kind cap: five one-shared essays, cap 2 keeps the first two by title.
  const many = ["e1", "e2", "e3", "e4", "e5"].map((id) => doc("essay", id, ["a"]));
  const capped = relatedItems(["a"], many, undefined, 2);
  assert.deepEqual(
    capped.map((d) => d.id),
    ["e1", "e2"],
  );
});

test("real data: committed projects derive edges; software-factory talk joins its output", () => {
  const projects = loadProjectDocs();
  assert.ok(projects.length > 0);
  assert.ok(
    projects.some((p) => p.concepts.length > 0),
    "expected at least one project with concept edges",
  );
  assert.ok(
    projects.some((p) => p.concepts.length === 0),
    "expected at least one edge-less project",
  );

  const talk = loadTalkDocs().find((d) => d.id === "building-a-software-factory");
  assert.ok(talk, "expected talks/building-a-software-factory to load");
  assert.deepEqual(talk!.concepts, ["ai-agents", "code-intelligence"]);

  // loadRelatedDocs only carries docs with edges.
  const rel = loadRelatedDocs();
  assert.ok(rel.length > 0);
  for (const doc of rel) {
    assert.ok(doc.concepts.length >= 1);
  }
});

test("conceptLabel: registry labels resolve; unknown slug throws", () => {
  assert.equal(conceptLabel("ai-agents"), "AI agents");
  assert.throws(() => conceptLabel("not-a-concept"), /unknown concept slug/);
});
