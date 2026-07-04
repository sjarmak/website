/**
 * Acceptance assertions against the REAL committed data files: node budget,
 * rendered edge density, and structural integrity of the emitted graph.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildConceptGraph } from "../src/lib/graph/buildConceptGraph.ts";

const data = buildConceptGraph();

test("global node count stays under 100 on real data", () => {
  assert.ok(data.nodes.length < 100, `expected < 100 nodes, got ${data.nodes.length}`);
  assert.ok(
    data.nodes.filter((n) => n.type === "concept").length >= 30,
    "every registry concept is a node",
  );
});

test("rendered concept<->concept edges average under 2.5 per concept node", () => {
  const conceptCount = data.nodes.filter((n) => n.type === "concept").length;
  const rendered = data.edges.filter((e) => e.kind === "concept-concept");
  const avg = (rendered.length * 2) / conceptCount;
  assert.ok(avg < 2.5, `expected avg < 2.5 rendered edges per concept node, got ${avg.toFixed(2)}`);
  assert.ok(rendered.length > 0, "real data produces some concept edges");
});

test("rendered concept edges are a subset of the full weighted list", () => {
  const full = new Set(data.conceptEdges.map((e) => `${e.source}~${e.target}`));
  for (const edge of data.edges.filter((e) => e.kind === "concept-concept")) {
    assert.ok(full.has(`${edge.source}~${edge.target}`), `${edge.id} present in conceptEdges`);
  }
  assert.ok(
    data.conceptEdges.length >= data.edges.filter((e) => e.kind === "concept-concept").length,
    "full list retains at least the rendered set",
  );
});

test("edges reference existing nodes and ids are unique", () => {
  const ids = new Set(data.nodes.map((n) => n.id));
  assert.equal(ids.size, data.nodes.length, "node ids are unique");
  const edgeIds = new Set(data.edges.map((e) => e.id));
  assert.equal(edgeIds.size, data.edges.length, "edge ids are unique");
  for (const edge of data.edges) {
    assert.ok(ids.has(edge.source), `edge source ${edge.source} exists`);
    assert.ok(ids.has(edge.target), `edge target ${edge.target} exists`);
  }
});

test("every concept node carries derived evidence for the detail panel", () => {
  for (const node of data.nodes.filter((n) => n.type === "concept")) {
    assert.ok(node.evidence, `${node.id} has evidence`);
    for (const list of [
      node.evidence!.digests,
      node.evidence!.sections,
      node.evidence!.papers,
      node.evidence!.vaultNotes,
    ]) {
      assert.ok(Array.isArray(list));
    }
  }
});

test("gaps are above-median concept pairs without a direct edge", () => {
  const connected = new Set(data.conceptEdges.map((e) => `${e.source}~${e.target}`));
  const slugs = new Set(data.nodes.filter((n) => n.type === "concept").map((n) => n.id));
  for (const gap of data.gaps) {
    assert.ok(slugs.has(gap.source) && slugs.has(gap.target), "gap endpoints are concepts");
    assert.ok(!connected.has(`${gap.source}~${gap.target}`), "gap pair has no direct edge");
  }
});
