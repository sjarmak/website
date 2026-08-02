import { before, test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileP = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const SLUG = "engineering-reliable-coding-agents";

before(async () => {
  // Build only when the artifact is missing; an unconditional build here raced
  // the other dist suites' builds under node --test's parallel execution.
  if (!existsSync(path.join(DIST, "index.html"))) {
    await execFileP("npm", ["run", "build"], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
  }
});

function explorer() {
  return readFileSync(path.join(DIST, "books", SLUG, "explore", "index.html"), "utf8");
}

test("the explorer ships a complete server-rendered reference index", () => {
  const html = explorer();
  assert.match(html, /data-book-view="references"/);
  assert.match(html, /data-book-reference-index/);
  assert.equal((html.match(/data-book-reference=/g) ?? []).length, 334);
  assert.equal((html.match(/data-reference-location=/g) ?? []).length, 403);
  assert.match(html, />334 references</);
  assert.match(html, />311 papers</);
  assert.doesNotMatch(html, /w3\.org\/1998\/Math/);
});

test("reference rows expose external sources and exact internal backlinks", () => {
  const html = explorer();
  assert.match(html, /href="https:\/\/arxiv\.org\/abs\/2411\.00640"/);
  assert.match(
    html,
    new RegExp(`href="/books/${SLUG}/variance-power-paired-comparisons#sources-and-evidence"`),
  );
  assert.match(
    html,
    new RegExp(`href="/books/${SLUG}/companion#report-correlation-aware-standard-errors"`),
  );
});

test("the existing structural graph remains unchanged", () => {
  const html = explorer();
  const payload = html.match(/<script type="application\/json" data-book-graph-data>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(payload);
  const data = JSON.parse(payload);
  assert.equal(data.nodes.length, 217);
  assert.equal(data.edges.length, 216);
});
