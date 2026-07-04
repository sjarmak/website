// Exemplar-per-register assertions over the BUILT site (dist/) — PRD R3
// acceptance. If dist/ is absent the suite builds it (npm run build); in the
// ordered CI pipeline the build has already run.

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { checkRegisterDrift } from "../scripts/checks/register-drift.mjs";
import { NOINDEX_ROUTE_PREFIXES } from "../src/lib/register.ts";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(REPO_ROOT, "dist");

const MANUAL_ISSUE =
  "manual-enhancing-developer-productivity-with-google-colab-cli-and-agentic-observability";
const AUTO_ISSUE = "daily-2026-06-09";

function page(rel) {
  return readFileSync(path.join(DIST, rel, "index.html"), "utf8");
}

function registerOf(html) {
  const m = html.match(/<meta name="site-register" content="([^"]*)"/);
  return m ? m[1] : null;
}

function hasNoindex(html) {
  return /<meta name="robots" content="[^"]*noindex[^"]*"/.test(html);
}

let sitemap;

before(async () => {
  if (!existsSync(path.join(DIST, "index.html"))) {
    await execFileP("npm", ["run", "build"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 });
  }
  sitemap = readFileSync(path.join(DIST, "sitemap-0.xml"), "utf8");
});

// ------------------------------------------------- exemplars per register

test("homepage declares register=authored", () => {
  assert.equal(registerOf(page(".")), "authored");
});

test("edge case: an origin:manual digest issue renders register=hybrid AND keeps its hand-curated kicker", () => {
  const html = page(path.join("digest", MANUAL_ISSUE));
  assert.equal(registerOf(html), "hybrid");
  assert.match(html, /hand-curated/);
});

test("an origin:auto digest issue renders register=generated", () => {
  assert.equal(registerOf(page(path.join("digest", AUTO_ISSUE))), "generated");
});

test("edge case: a machine-built explorer (learning) page is NOT authored", () => {
  const html = page(path.join("library", "explorers", "agentic-information-retrieval"));
  assert.equal(registerOf(html), "generated");
  assert.notEqual(registerOf(html), "authored");
});

test("library page declares register=reference", () => {
  assert.equal(registerOf(page("library")), "reference");
});

test("prototypes pages declare register=lab", () => {
  assert.equal(registerOf(page("prototypes")), "lab");
  assert.equal(registerOf(page(path.join("prototypes", "starmap"))), "lab");
});

// ------------------------------------------------- sitemap + noindex hygiene

test("prototypes INDEX is crawlable and in the sitemap", () => {
  const html = page("prototypes");
  assert.equal(hasNoindex(html), false, "prototypes index must not be noindexed");
  assert.ok(sitemap.includes("<loc>https://sjarmak.ai/prototypes/</loc>"));
});

test("every experiment page is noindexed and absent from the sitemap", () => {
  // one built exemplar per canonical prefix ([slug] routes via a known slug)
  const exemplars = {
    "/prototypes/concepts": "prototypes/concepts",
    "/prototypes/graph-time": "prototypes/graph-time",
    "/prototypes/paths": "prototypes/paths",
    "/prototypes/questions": "prototypes/questions",
    "/prototypes/receipts": "prototypes/receipts",
    "/prototypes/research-atlas": "prototypes/research-atlas",
    "/prototypes/starmap": "prototypes/starmap",
  };
  assert.deepEqual(Object.keys(exemplars).sort(), [...NOINDEX_ROUTE_PREFIXES].sort());
  for (const [prefix, rel] of Object.entries(exemplars)) {
    assert.equal(hasNoindex(page(rel)), true, `${prefix} must carry robots noindex`);
    assert.equal(
      sitemap.includes(`<loc>https://sjarmak.ai${prefix}/`),
      false,
      `${prefix} must not appear in the sitemap`,
    );
  }
  // nested dynamic route under a noindexed prefix
  const nested = page(path.join("prototypes", "paths", "science-to-agents"));
  assert.equal(hasNoindex(nested), true);
});

test("digest URLs carry lastmod (dated slugs) and lowered priority", () => {
  assert.match(
    sitemap,
    new RegExp(
      `<url><loc>https://sjarmak\\.ai/digest/${AUTO_ISSUE}/</loc><lastmod>2026-06-09T00:00:00\\.000Z</lastmod><priority>0\\.3</priority></url>`,
    ),
  );
  assert.match(sitemap, /<url><loc>https:\/\/sjarmak\.ai\/digest\/<\/loc><priority>0\.3<\/priority><\/url>/);
});

test("sitemap layout is the pinned 3.7.3 shape (index -> sitemap-0)", () => {
  const index = readFileSync(path.join(DIST, "sitemap-index.xml"), "utf8");
  const locs = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(locs, ["https://sjarmak.ai/sitemap-0.xml"]);
  assert.equal(existsSync(path.join(DIST, "sitemap-1.xml")), false);
  assert.equal(existsSync(path.join(DIST, "sitemap.xml")), false);
});

// ------------------------------------------------- full drift check, live dist

test("register drift check reports zero violations on the real build", async () => {
  const result = await checkRegisterDrift();
  assert.deepEqual(result.violations, []);
  assert.ok(result.pages >= 100, `expected >=100 rendered pages, got ${result.pages}`);
  assert.ok(result.sitemapUrls >= 100, `expected >=100 sitemap URLs, got ${result.sitemapUrls}`);
});
