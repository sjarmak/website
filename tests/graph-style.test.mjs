// Unit tests for the shared graph styling table and chip derivation.
// Run with `npm test` (node --test; Node >=22.18 strips TS types natively,
// and graph-style.ts has only type-only imports, so it loads directly).

import test from "node:test";
import assert from "node:assert/strict";

import {
  NODE_TYPE_STYLES,
  deriveFilterChips,
  colorFor,
  buildStylesheet,
} from "../src/scripts/graph-style.ts";

const ALL_NODE_TYPES = ["project", "topic", "output", "concept", "vaultNote"];

function graphDataWith(types) {
  return {
    nodes: types.map((type, i) => ({
      id: `n${i}`,
      type,
      label: `Node ${i}`,
      summary: "",
      links: [],
      weight: 1,
    })),
    edges: [],
  };
}

test("NODE_TYPE_STYLES covers every NodeType with a cssToken and shape", () => {
  assert.deepEqual(Object.keys(NODE_TYPE_STYLES).sort(), [...ALL_NODE_TYPES].sort());
  for (const type of ALL_NODE_TYPES) {
    const entry = NODE_TYPE_STYLES[type];
    assert.match(entry.cssToken, /^--graph-node-/, `${type} has a --graph-node-* token`);
    assert.equal(typeof entry.shape, "string");
    assert.ok(entry.shape.length > 0, `${type} has a shape`);
    assert.ok(entry.label.length > 0, `${type} has a chip label`);
  }
  assert.equal(NODE_TYPE_STYLES.concept.cssToken, "--graph-node-concept");
  assert.equal(NODE_TYPE_STYLES.vaultNote.cssToken, "--graph-node-note");
});

test("deriveFilterChips: data with 2 types yields exactly 2 chips", () => {
  const chips = deriveFilterChips(graphDataWith(["project", "topic", "project"]));
  assert.equal(chips.length, 2);
  assert.deepEqual(chips, [
    { type: "project", label: "Projects" },
    { type: "topic", label: "Topics" },
  ]);
});

test("deriveFilterChips: only types present in the data produce chips", () => {
  assert.deepEqual(deriveFilterChips(graphDataWith([])), []);
  const chips = deriveFilterChips(graphDataWith(["vaultNote", "concept", "output"]));
  assert.deepEqual(
    chips.map((c) => c.type),
    ["output", "concept", "vaultNote"],
    "chips follow canonical table order, filtered to present types",
  );
});

test("colorFor resolves each type through its table token", () => {
  const tokens = {};
  for (const type of ALL_NODE_TYPES) {
    tokens[NODE_TYPE_STYLES[type].cssToken] = `color-${type}`;
  }
  for (const type of ALL_NODE_TYPES) {
    assert.equal(colorFor(type, tokens), `color-${type}`);
  }
});

test("buildStylesheet emits a shape rule per node type from the table", () => {
  const sheet = buildStylesheet({});
  for (const type of ALL_NODE_TYPES) {
    const rule = sheet.find(
      (r) => r.selector === `node[type="${type}"]` && r.style.shape !== undefined,
    );
    assert.ok(rule, `shape rule for ${type}`);
    assert.equal(rule.style.shape, NODE_TYPE_STYLES[type].shape);
  }
});
