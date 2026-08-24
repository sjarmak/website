import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(
  ROOT,
  "src/data/books/engineering-reliable-coding-agents/coupling",
);

const readJson = (name) => JSON.parse(readFileSync(path.join(DATA, name), "utf8"));

test("vendored coupling data preserves the provisional release manifest", () => {
  const release = readJson("release.json");
  const manifest = readJson("manifest.json");

  assert.deepEqual(release, {
    companionVersion: "1.1.0",
    manuscriptVersion: "1.0.0",
    status: "provisional",
    sourceCommit: "637d867f4ebd17f2b1b5c5996bbfd98c9c8d2d07",
    recordsWithSupportedEdges: 116,
    noneObservedRecords: 90,
  });
  assert.equal(manifest.record_count, 206);
  assert.equal(manifest.supported_edge_count, 126);
  assert.equal(manifest.hypothesized_edge_count, 4);
  assert.equal(manifest.review_queue_count, 112);
  assert.equal(
    release.recordsWithSupportedEdges + release.noneObservedRecords,
    manifest.record_count,
  );
});

test("the matrix, graph, common causes, and backlog retain their complete shapes", () => {
  const matrix = readJson("coupling-matrix.json");
  const graph = readJson("coupling-graph.json");
  const commonCauses = readJson("common-causes.json");
  const backlog = readJson("experiment-backlog.json");

  assert.equal(matrix.cells.length, 36);
  assert.equal(graph.nodes.length, 6);
  assert.equal(graph.edges.length, 16);
  assert.equal(commonCauses.length, 10);
  assert.equal(backlog.experiments.length, 8);
  assert.equal(backlog.experiments[0].experiment_id, "FI-02-stale-repository-state");
  assert.equal(backlog.experiments[2].experiment_id, "FI-01-compaction-context-loss");
});
