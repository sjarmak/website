// Unit tests for the island's deep-link node resolution (?node=...).
import test from "node:test";
import assert from "node:assert/strict";
import { resolveNodeParam } from "../src/scripts/graph-deeplink.ts";

const CONCEPT_GRAPH = new Map([
  ["agent-memory", { type: "concept" }],
  ["evaluation", { type: "concept" }],
  ["topic:agent-memory", { type: "topic" }],
  ["vault:2026-06-01-note", { type: "vaultNote" }],
]);

test("exact node id resolves to itself", () => {
  assert.equal(resolveNodeParam("agent-memory", CONCEPT_GRAPH), "agent-memory");
  assert.equal(resolveNodeParam("topic:agent-memory", CONCEPT_GRAPH), "topic:agent-memory");
  assert.equal(resolveNodeParam("vault:2026-06-01-note", CONCEPT_GRAPH), "vault:2026-06-01-note");
});

test("concept:<slug> resolves to the bare concept node id", () => {
  assert.equal(resolveNodeParam("concept:agent-memory", CONCEPT_GRAPH), "agent-memory");
  assert.equal(resolveNodeParam("concept:evaluation", CONCEPT_GRAPH), "evaluation");
});

test("concept:<slug> for an unknown slug resolves to null", () => {
  assert.equal(resolveNodeParam("concept:not-a-concept", CONCEPT_GRAPH), null);
});

test("unknown params resolve to null", () => {
  assert.equal(resolveNodeParam("nope", CONCEPT_GRAPH), null);
  assert.equal(resolveNodeParam("", CONCEPT_GRAPH), null);
});

// /projects/explorer guard: its topic node ids are BARE slugs, which can
// collide with concept slugs. The concept: prefix must NOT select them.
test("concept: prefix never selects a non-concept node with the same slug", () => {
  const projectsGraph = new Map([
    ["agent-memory", { type: "topic" }],
    ["scix-cli", { type: "project" }],
  ]);
  assert.equal(resolveNodeParam("concept:agent-memory", projectsGraph), null);
  assert.equal(resolveNodeParam("concept:scix-cli", projectsGraph), null);
  // exact-id behavior on /projects/explorer is untouched
  assert.equal(resolveNodeParam("agent-memory", projectsGraph), "agent-memory");
});
