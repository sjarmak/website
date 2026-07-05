// /now page assertions over the BUILT site (dist/) — PRD R17 acceptance.
// If dist/ is absent the suite builds it (npm run build); in the ordered CI
// pipeline the build has already run.

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
// The SAME data module the homepage Currently section and /now render from —
// a fixture change here is asserted on both built pages below.
import { affiliations } from "../src/data/site.ts";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(REPO_ROOT, "dist");

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

let nowHtml;
let homeHtml;
let aboutHtml;
let sitemap;

before(async () => {
  if (!existsSync(path.join(DIST, "index.html"))) {
    await execFileP("npm", ["run", "build"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 });
  }
  nowHtml = page("now");
  homeHtml = page(".");
  aboutHtml = page("about");
  sitemap = readFileSync(path.join(DIST, "sitemap-0.xml"), "utf8");
});

test("/now builds and declares register=authored", () => {
  assert.equal(registerOf(nowHtml), "authored");
});

test("/now is indexable (no robots noindex)", () => {
  assert.equal(hasNoindex(nowHtml), false);
});

test("/now is in the sitemap", () => {
  assert.match(sitemap, /<loc>https:\/\/sjarmak\.ai\/now\/<\/loc>/);
});

test("/now carries the last-reviewed stamp with a dated <time>", () => {
  assert.match(nowHtml, /Last reviewed/);
  assert.match(nowHtml, /<time datetime="\d{4}-\d{2}-\d{2}"/);
});

test("shared data: every affiliation renders on BOTH homepage Currently and /now", () => {
  assert.ok(affiliations.length > 0, "affiliations fixture is non-empty");
  for (const a of affiliations) {
    assert.ok(homeHtml.includes(a.role), `homepage renders role "${a.role}"`);
    assert.ok(homeHtml.includes(a.name), `homepage renders org "${a.name}"`);
    assert.ok(nowHtml.includes(a.role), `/now renders role "${a.role}"`);
    assert.ok(nowHtml.includes(a.name), `/now renders org "${a.name}"`);
  }
});

test("/now lists current projects sourced from the projects collection", () => {
  assert.match(nowHtml, /href="\/projects\/[^"]+"/);
});

test("About links to /now", () => {
  assert.match(aboutHtml, /href="\/now"/);
});
