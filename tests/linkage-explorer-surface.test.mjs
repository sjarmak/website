// Assertions over the BUILT /library page for the knowledge linkage explorer.
//
// The explorer is server-rendered (node list, pressed state) and hydrated from
// an inline JSON island. Three joins can break without failing the build:
//
//   1. The section stops mounting at all, because buildKnowledge() has no other
//      caller and nothing else would notice its absence.
//   2. The island's initialId disagrees with the button the server marked
//      pressed, so the panel loads showing one node while the list highlights
//      another. This is what the client script's initialId handling fixes.
//   3. The island carries a node the server never rendered a button for, or an
//      initialId with no entry in the related map, so the panel opens empty.
//
// Expected values are read from the island the page actually shipped.

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(REPO_ROOT, "dist");
const LANES = ["semantic", "lexical", "graph", "recency", "fused"];

before(async () => {
  if (!existsSync(path.join(DIST, "index.html"))) {
    await execFileP("npm", ["run", "build"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 });
  }
});

function libraryPage() {
  return readFileSync(path.join(DIST, "library", "index.html"), "utf8");
}

function island(html) {
  const m = html.match(/<script type="application\/json" data-le-data[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(m, "/library has no data-le-data island");
  return JSON.parse(m[1]);
}

test("library page mounts the knowledge linkage explorer", () => {
  const html = libraryPage();
  assert.ok(html.includes("data-linkage-explorer"), "/library does not mount the explorer");
  assert.ok(html.includes("Knowledge linkage"), "/library is missing the explorer heading");

  const data = island(html);
  assert.ok(data.nodes.length > 0, "island shipped an empty node list");
  for (const lane of LANES) {
    assert.ok(
      Object.values(data.related).some((r) => Array.isArray(r[lane])),
      `island carries no ${lane} lane`,
    );
  }
});

test("the pressed node, the island's initialId, and the related map agree", () => {
  const html = libraryPage();
  const data = island(html);

  const pressed = [
    ...html.matchAll(/<button[^>]*data-node-id="([^"]*)"[^>]*aria-pressed="true"/g),
  ].map((m) => m[1]);
  assert.equal(pressed.length, 1, "expected exactly one pressed node button");
  assert.equal(
    data.initialId,
    pressed[0],
    "island initialId disagrees with the server-pressed button, so the panel opens on the wrong node",
  );
  assert.ok(
    data.related[data.initialId],
    `initialId ${data.initialId} has no entry in the related map`,
  );
});

test("every node in the island has a rendered button", () => {
  const html = libraryPage();
  const data = island(html);

  const buttons = new Set([...html.matchAll(/data-node-id="([^"]*)"/g)].map((m) => m[1]));
  for (const node of data.nodes) {
    assert.ok(buttons.has(node.id), `island node ${node.id} has no button in the list`);
  }
});
