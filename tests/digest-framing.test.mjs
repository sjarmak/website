// R13 acceptance over the BUILT site (dist/): the digest index carries a
// standing framing block presenting the digest as pipeline output feeding the
// concept layer — linking /colophon and /concepts exactly once each — without
// disturbing the rest of the page. If dist/ is absent the suite builds it
// (same pattern as tests/colophon-dist.test.mjs).

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { checkLinks } from "../scripts/checks/concepts-link-integrity.mjs";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(REPO_ROOT, "dist");

let html;

before(async () => {
  if (!existsSync(path.join(DIST, "index.html"))) {
    await execFileP("npm", ["run", "build"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 });
  }
  html = readFileSync(path.join(DIST, "digest", "index.html"), "utf8");
});

function countExactHref(pageHtml, href) {
  return [...pageHtml.matchAll(new RegExp(`href="${href}"`, "g"))].length;
}

test("framing block links /colophon and /concepts exactly once each", () => {
  assert.equal(countExactHref(html, "/colophon"), 1, "digest index must link /colophon exactly once");
  assert.equal(countExactHref(html, "/concepts"), 1, "digest index must link /concepts exactly once");
});

test("framing block is one coherent paragraph containing both links", () => {
  const m = html.match(/<p class="colophon-note[^"]*"[^>]*>([\s\S]*?)<\/p>/);
  assert.ok(m, "the framing paragraph must be present");
  const block = m[1];
  assert.ok(block.includes('href="/colophon"'), "framing block must link /colophon");
  assert.ok(block.includes('href="/concepts"'), "framing block must link /concepts");
  assert.match(block, /pipeline/i, "framing block must name the pipeline");
  assert.match(block, /evidence/i, "framing block must frame issues as evidence for the concept layer");
});

test("existing digest index content is otherwise intact", () => {
  // section nav, filter bar, count line, and crosslink footer all survive
  assert.match(html, /aria-label="Digest sections"/);
  assert.match(html, /aria-label="Filter digests"/);
  assert.ok(html.includes('href="/digest/archive"'), "archive link must remain");
  assert.ok(html.includes('href="/digest/rss.xml"'), "RSS link must remain");
  assert.ok(html.includes('href="/library"'), "library crosslink must remain");
});

test("every href on the built digest index resolves", () => {
  const { checked, failures } = checkLinks(html, DIST);
  assert.deepEqual(failures, []);
  assert.ok(checked > 0, "the digest index must contain links to check");
});
