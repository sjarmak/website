// Dark-ship verification for the vault pull: the production build (real repo
// data, zero vault: assignments) contains zero vaultNote nodes.
//
// Asserts over the real built output in dist/. If dist/ is absent the test
// builds it (npm run build) — in the ordered CI pipeline the build has
// already run, so this normally reuses the existing output.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(REPO_ROOT, "dist");

function htmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFiles(abs));
    else if (entry.isFile() && entry.name.endsWith(".html")) out.push(abs);
  }
  return out;
}

const GRAPH_DATA_RE = /<script type="application\/json" data-graph-data[^>]*>([\s\S]*?)<\/script>/g;

test("production build contains zero vaultNote nodes", async () => {
  if (!existsSync(path.join(DIST, "index.html"))) {
    await execFileP("npm", ["run", "build"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 });
  }

  let graphsFound = 0;
  const offenders = [];
  for (const file of htmlFiles(DIST)) {
    const html = readFileSync(file, "utf8");
    for (const match of html.matchAll(GRAPH_DATA_RE)) {
      graphsFound += 1;
      const data = JSON.parse(match[1]);
      for (const node of data.nodes ?? []) {
        if (node.type === "vaultNote") offenders.push({ file: path.relative(DIST, file), id: node.id });
      }
    }
  }

  // Guard against validation theater: the graph pages must actually be there.
  assert.ok(graphsFound >= 1, "no embedded data-graph-data payloads found in dist/ — did the build change?");
  assert.deepEqual(offenders, [], "vaultNote nodes leaked into the production graph");
});

test("committed concept-assignments.json ships with an empty vault: opt-in set", () => {
  const assignments = JSON.parse(
    readFileSync(path.join(REPO_ROOT, "src", "data", "knowledge", "concept-assignments.json"), "utf8"),
  );
  const vaultKeys = Object.keys(assignments).filter((k) => k.startsWith("vault:"));
  assert.deepEqual(vaultKeys, [], "vault: assignments must stay empty while the pull ships dark");
});
