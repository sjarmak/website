// Graph assembly determinism (resolves sjai-thb): the build-time knowledge
// graph must be identical regardless of collection iteration order. Before
// this fix, whichever side of a bidirectional `related:` topic pair
// getCollection yielded first won dedupeEdges, flipping topic-topic edge
// source/target/id across checkouts.

import { test } from "node:test";
import assert from "node:assert/strict";
import { assembleGraph } from "../src/lib/graph/assembleGraph.ts";

// Mirrors the real repo shape: bidirectional related: declarations
// (agents <-> retrieval and friends) that used to dedupe order-dependently.
const topics = [
  { id: "agents", data: { title: "Agents", summary: "s", weight: 2, related: [{ id: "retrieval" }, { id: "evaluation" }] } },
  { id: "retrieval", data: { title: "Retrieval", summary: "s", weight: 2, related: [{ id: "agents" }, { id: "knowledge-graphs" }] } },
  { id: "evaluation", data: { title: "Evaluation", summary: "s", related: [{ id: "agents" }] } },
  { id: "knowledge-graphs", data: { title: "Knowledge graphs", summary: "s", related: [{ id: "retrieval" }] } },
];

const projects = [
  {
    id: "proj-a",
    data: {
      title: "Project A",
      summary: "s",
      repo: "https://example.com/a",
      topics: [{ id: "agents" }],
      outputs: [{ id: "out-1" }],
    },
  },
  {
    id: "proj-b",
    data: { title: "Project B", summary: "s", topics: [{ id: "retrieval" }], outputs: [] },
  },
];

const outputs = [
  {
    id: "out-1",
    data: { title: "Output 1", url: "https://example.com/o1", kind: "paper", topics: [{ id: "evaluation" }] },
  },
];

// Deterministic pseudo-shuffle: reversed and interleaved orderings.
function reversed(arr) {
  return [...arr].reverse();
}
function interleaved(arr) {
  const out = [];
  for (let i = 0; i < arr.length; i += 2) out.push(arr[i]);
  for (let i = 1; i < arr.length; i += 2) out.push(arr[i]);
  return out;
}

test("assembleGraph output is byte-identical across shuffled input orders", () => {
  const a = assembleGraph({ projects, topics, outputs });
  const b = assembleGraph({
    projects: reversed(projects),
    topics: reversed(topics),
    outputs: reversed(outputs),
  });
  const c = assembleGraph({
    projects: interleaved(projects),
    topics: interleaved(topics),
    outputs: interleaved(outputs),
  });
  assert.equal(JSON.stringify(b), JSON.stringify(a), "reversed input order must not change the graph");
  assert.equal(JSON.stringify(c), JSON.stringify(a), "interleaved input order must not change the graph");
});

test("topic-topic edges are canonical: lexicographic endpoints, bidirectional pairs collapse to one edge", () => {
  const { edges } = assembleGraph({ projects, topics, outputs });
  const topicTopic = edges.filter((e) => e.kind === "topic-topic");
  // agents<->retrieval, agents<->evaluation, retrieval<->knowledge-graphs:
  // 5 declarations (3 of them bidirectional-duplicated) -> 3 canonical edges
  assert.deepEqual(
    topicTopic.map((e) => e.id).sort(),
    ["agents~evaluation", "agents~retrieval", "knowledge-graphs~retrieval"],
  );
  for (const e of topicTopic) {
    assert.ok(e.source < e.target, `topic-topic edge ${e.id} must have source < target`);
    assert.equal(e.id, `${e.source}~${e.target}`);
  }
});

test("directed edge kinds keep their declared direction", () => {
  const { edges } = assembleGraph({ projects, topics, outputs });
  assert.ok(edges.some((e) => e.kind === "project-topic" && e.source === "proj-a" && e.target === "agents"));
  assert.ok(edges.some((e) => e.kind === "project-output" && e.source === "proj-a" && e.target === "out-1"));
  assert.ok(edges.some((e) => e.kind === "output-topic" && e.source === "out-1" && e.target === "evaluation"));
});
