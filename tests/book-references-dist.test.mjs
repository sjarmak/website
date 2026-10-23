import { before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireDist } from "./helpers/require-dist.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const SLUG = "engineering-reliable-coding-agents";

before(() => requireDist());

function explorer() {
  return readFileSync(path.join(DIST, "books", SLUG, "explore", "index.html"), "utf8");
}

test("the explorer ships a complete server-rendered reference index", () => {
  const html = explorer();
  assert.match(html, /data-book-view="references"/);
  assert.match(html, /data-book-reference-index/);
  assert.equal((html.match(/data-book-reference=/g) ?? []).length, 397);
  assert.equal((html.match(/data-reference-location=/g) ?? []).length, 481);
  assert.match(html, />397 references</);
  assert.match(html, />333 papers</);
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

test("the structural graph reflects the complete current catalog", () => {
  const html = explorer();
  const payload = html.match(/<script type="application\/json" data-book-graph-data>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(payload);
  const data = JSON.parse(payload);
  assert.equal(data.nodes.length, 232);
  assert.equal(data.edges.length, 231);
});
