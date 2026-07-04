// Concept entries flow through the retrieval lanes: a concept:<slug> doc built
// from the real registry (label + definition — the same blurb the embeddings
// bake uses) is returned by BM25, the semantic lane, and their RRF fusion, and
// resolves to a KnowledgeNode of kind "concept".
import assert from "node:assert/strict";
import { test } from "node:test";
import { loadConcepts } from "../src/lib/knowledge/conceptAliases.ts";
import { buildBm25, bm25Query, rrf, semanticQuery, tokenize } from "../src/lib/knowledge/retrieval.ts";
import type { KnowledgeNode } from "../src/lib/knowledge/types.ts";

const evaluation = loadConcepts().find((c) => c.slug === "evaluation");
assert.ok(evaluation, "registry must contain the evaluation concept");

/** The same blurb shape build_embeddings.py bakes: `<label>. <definition>`. */
const conceptText = `${evaluation.label}. ${evaluation.definition}`;

const fixtureNodes: KnowledgeNode[] = [
  {
    id: "concept:evaluation",
    kind: "concept",
    title: evaluation.label,
    url: "/library",
    text: conceptText,
    meta: "Concept",
    external: false,
  },
  {
    id: "paper:2020arXiv1A",
    kind: "paper",
    title: "Asteroid regolith dynamics",
    url: "https://example.test/a",
    text: "Asteroid regolith dynamics. Granular flow on small-body surfaces under microgravity.",
    meta: "2020",
    external: true,
  },
  {
    id: "projects:embertide",
    kind: "project",
    title: "Embertide",
    url: "/projects/embertide",
    text: "Embertide. A narrative deck-building game about tending fires.",
    meta: "Project",
    external: false,
  },
];

const byId = new Map(fixtureNodes.map((n) => [n.id, n]));
const definitionQuery = "measuring whether AI systems work benchmark design and eval harnesses";

test("BM25 lane returns the concept for a definition-matching query", () => {
  const index = buildBm25(fixtureNodes.map((n) => ({ id: n.id, tokens: tokenize(n.text) })));
  const ranked = bm25Query(index, tokenize(definitionQuery), "");
  assert.ok(ranked.length > 0, "definition query matched nothing");
  assert.equal(ranked[0].id, "concept:evaluation");
});

test("semantic lane ranks concept vectors like any other id", () => {
  const vectors: Record<string, number[]> = {
    "concept:evaluation": [1, 0, 0],
    "paper:2020arXiv1A": [0, 1, 0],
    "projects:embertide": [0, 0, 1],
  };
  const queryVec = [0.98, 0.19, 0]; // ~unit vector near the concept's axis
  const ranked = semanticQuery(vectors, queryVec, "");
  assert.equal(ranked[0].id, "concept:evaluation");
  assert.ok(ranked[0].score > ranked[1].score);
});

test("RRF fusion returns a concept node for a definition-matching query", () => {
  const index = buildBm25(fixtureNodes.map((n) => ({ id: n.id, tokens: tokenize(n.text) })));
  const lexical = bm25Query(index, tokenize(definitionQuery), "");
  const semantic = semanticQuery(
    {
      "concept:evaluation": [1, 0, 0],
      "paper:2020arXiv1A": [0, 1, 0],
      "projects:embertide": [0, 0, 1],
    },
    [0.98, 0.19, 0],
    "",
  );
  const fused = rrf([semantic, lexical]);
  const top = byId.get(fused[0].id);
  assert.ok(top, "fused top result must resolve to a fixture node");
  assert.equal(top.kind, "concept");
  assert.equal(top.id, "concept:evaluation");
});

test("semanticQuery excludes the query node itself", () => {
  const vectors: Record<string, number[]> = {
    "concept:evaluation": [1, 0],
    "concept:verification": [0, 1],
  };
  const ranked = semanticQuery(vectors, vectors["concept:evaluation"], "concept:evaluation");
  assert.deepEqual(ranked.map((r) => r.id), ["concept:verification"]);
});
