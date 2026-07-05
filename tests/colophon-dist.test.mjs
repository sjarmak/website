// R2 acceptance over the BUILT site (dist/): the whole-pipeline colophon is
// indexable reference material with valid TechArticle JSON-LD, documents all
// six machine-layer systems, contains zero placeholder affordances, and is
// linked from the digest index. If dist/ is absent the suite builds it (same
// pattern as tests/register-dist.test.mjs).

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { checkLinks } from "../scripts/checks/concepts-link-integrity.mjs";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(REPO_ROOT, "dist");

let html;
let digestIndexHtml;
let sitemap;

before(async () => {
  if (!existsSync(path.join(DIST, "index.html"))) {
    await execFileP("npm", ["run", "build"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 });
  }
  html = readFileSync(path.join(DIST, "colophon", "index.html"), "utf8");
  digestIndexHtml = readFileSync(path.join(DIST, "digest", "index.html"), "utf8");
  sitemap = readFileSync(path.join(DIST, "sitemap-0.xml"), "utf8");
});

// ------------------------------------------------- register + indexability

test("colophon declares register=reference", () => {
  const m = html.match(/<meta name="site-register" content="([^"]*)"/);
  assert.ok(m, "site-register meta must be present");
  assert.equal(m[1], "reference");
});

test("colophon is indexable: no robots noindex, present in the sitemap", () => {
  assert.equal(/<meta name="robots" content="[^"]*noindex[^"]*"/.test(html), false);
  assert.ok(
    sitemap.includes("<loc>https://sjarmak.ai/colophon/</loc>"),
    "/colophon/ must be listed in sitemap-0.xml",
  );
});

// ------------------------------------------------- TechArticle JSON-LD

function parseJsonLdBlocks(pageHtml) {
  return [...pageHtml.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(
    (m) => JSON.parse(m[1]),
  );
}

test("colophon carries valid TechArticle JSON-LD with required fields", () => {
  const blocks = parseJsonLdBlocks(html);
  const article = blocks.find((b) => b["@type"] === "TechArticle");
  assert.ok(article, "a TechArticle JSON-LD block must be present and parseable");

  assert.equal(article["@context"], "https://schema.org");
  assert.equal(typeof article.headline, "string");
  assert.ok(article.headline.length > 0, "headline required");
  assert.equal(typeof article.description, "string");
  assert.ok(article.description.length > 0, "description required");

  // author as a Person reference
  assert.equal(article.author["@type"], "Person");
  assert.equal(article.author.name, "Stephanie Jarmak");
  assert.equal(article.author.url, "https://sjarmak.ai");

  assert.match(article.datePublished, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(article.dateModified, /^\d{4}-\d{2}-\d{2}$/);
});

// ------------------------------------------------- the six documented systems

test("colophon documents all six machine-layer systems (section headings)", () => {
  const headings = [
    "Daily digest generation",
    "Text-to-speech",
    "Knowledge sync",
    "Concepts registry and graph",
    "Embeddings and retrieval lanes",
    "Sync heartbeat",
  ];
  for (const heading of headings) {
    assert.match(html, new RegExp(`<h2[^>]*>${heading}</h2>`), `missing section heading: ${heading}`);
  }
});

test("each system section links its public surface", () => {
  for (const href of ["/digest", "/digest/archive", "/library", "/prototypes/concepts"]) {
    assert.ok(html.includes(`href="${href}"`), `colophon must link ${href}`);
  }
});

// ------------------------------------------------- completeness (R11 does not exist yet)

test("colophon reads complete: zero placeholder or dangling-affordance text", () => {
  // strip head metas/scripts so we assert over the rendered body prose
  const body = html.slice(html.indexOf("<body"));
  for (const banned of [/coming soon/i, /\bTODO\b/i, /\bTBD\b/i, /placeholder/i, /lorem ipsum/i]) {
    assert.doesNotMatch(body, banned, `placeholder text ${banned} must not appear`);
  }
});

// ------------------------------------------------- link integrity + digest index link

test("every href on the built colophon page resolves", () => {
  const { checked, failures } = checkLinks(html, DIST);
  assert.deepEqual(failures, []);
  assert.ok(checked > 0, "the colophon page must contain links to check");
});

test("digest index links the colophon", () => {
  assert.ok(digestIndexHtml.includes('href="/colophon"'), "digest index must link /colophon");
});
