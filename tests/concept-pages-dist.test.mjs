// Assertions over the BUILT /concepts/* pages (PRD R4′ + R15). If dist/ is
// absent the suite builds it (npm run build); in the ordered CI pipeline the
// build has already run.

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { loadConcepts } from "../src/lib/knowledge/conceptAliases.ts";
import { loadConceptAllowlist } from "../src/lib/concepts/indexState.ts";
import { conceptLastmodForPath } from "../src/lib/concepts/lastmod.ts";
import { REGISTER_COPY } from "../src/lib/registerCopy.ts";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(REPO_ROOT, "dist");

const TERM_SET_ID = "https://sjarmak.ai/concepts/#definedtermset";

// Allowlisted exemplar and two below-floor exemplars (one with evidence, one
// with none) — all committed content, stable by construction.
const ALLOWLISTED = "evaluation";
const BELOW_FLOOR_WITH_EVIDENCE = "mcp";
const BELOW_FLOOR_EMPTY = "scientific-search";

function page(rel) {
  return readFileSync(path.join(DIST, rel, "index.html"), "utf8");
}

function hasNoindex(html) {
  return /<meta name="robots" content="[^"]*noindex[^"]*"/.test(html);
}

function registerOf(html) {
  const m = html.match(/<meta name="site-register" content="([^"]*)"/);
  return m ? m[1] : null;
}

function ldBlocks(html) {
  return [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(
    (m) => JSON.parse(m[1]),
  );
}

// Mirror Astro's text-interpolation escaping (html-escaper).
function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("'", "&#39;")
    .replaceAll('"', "&quot;");
}

let concepts;
let allowlist;
let sitemap;

before(async () => {
  if (!existsSync(path.join(DIST, "index.html"))) {
    await execFileP("npm", ["run", "build"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 });
  }
  concepts = loadConcepts();
  allowlist = new Set(loadConceptAllowlist());
  sitemap = readFileSync(path.join(DIST, "sitemap-0.xml"), "utf8");
});

// -------------------------------------------------- all 36 routes + structure

test("every concept builds a /concepts/<slug>/ route with the specified structure", () => {
  assert.equal(concepts.length, 36, `expected 36 concepts, got ${concepts.length}`);
  for (const concept of concepts) {
    const html = page(path.join("concepts", concept.slug));

    // H1 = label
    assert.match(html, new RegExp(`<h1[^>]*>${escapeHtml(concept.label)}</h1>`));

    // Definition VERBATIM as the first rendered paragraph of the article.
    const firstParagraph = html.match(/<article[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
    assert.ok(firstParagraph, `${concept.slug}: article has a paragraph`);
    assert.equal(
      firstParagraph[1].trim(),
      escapeHtml(concept.definition),
      `${concept.slug}: definition is the first rendered paragraph`,
    );

    // Aliases
    if (concept.aliases.length > 0) {
      assert.ok(
        html.includes(`Also known as: ${escapeHtml(concept.aliases.join(", "))}`),
        `${concept.slug}: aliases rendered`,
      );
    }

    // Type stamp from the canonical copy map (register: reference).
    assert.equal(registerOf(html), "reference");
    assert.ok(html.includes(escapeHtml(REGISTER_COPY.reference.badgeCopy)), `${concept.slug}: stamp copy`);

    // R15 back-link into the explorer.
    assert.ok(
      html.includes(`/prototypes/concepts?node=concept:${concept.slug}`),
      `${concept.slug}: deep link back to the concept map`,
    );

    // Breadcrumb to the anchoring topic when present.
    if (concept.topic !== undefined) {
      assert.ok(
        html.includes(`/prototypes/concepts?node=topic:${concept.topic}`),
        `${concept.slug}: breadcrumb links the anchoring topic`,
      );
    }

    // Complete card: an evidence section never renders without items.
    for (const section of html.matchAll(/<section class="concept-page__evidence"[\s\S]*?<\/section>/g)) {
      assert.match(section[0], /<li[\s>]/, `${concept.slug}: no empty evidence section headings`);
    }
  }
});

test("the /concepts index lists all 36 concept pages", () => {
  const html = page("concepts");
  for (const concept of concepts) {
    assert.ok(html.includes(`href="/concepts/${concept.slug}/"`), `index links ${concept.slug}`);
  }
});

// ------------------------------------------------- index state split (per slug)

test("allowlisted pages are indexable + in the sitemap; all others noindexed + absent", () => {
  for (const concept of concepts) {
    const html = page(path.join("concepts", concept.slug));
    const inSitemap = sitemap.includes(`<loc>https://sjarmak.ai/concepts/${concept.slug}/</loc>`);
    if (allowlist.has(concept.slug)) {
      assert.equal(hasNoindex(html), false, `${concept.slug} is allowlisted — must be indexable`);
      assert.equal(inSitemap, true, `${concept.slug} is allowlisted — must be in the sitemap`);
    } else {
      assert.equal(hasNoindex(html), true, `${concept.slug} is below floor — must be noindexed`);
      assert.equal(inSitemap, false, `${concept.slug} is below floor — must be sitemap-absent`);
    }
  }
  assert.ok(
    sitemap.includes("<loc>https://sjarmak.ai/concepts/</loc>"),
    "the concepts index (DefinedTermSet stable URL) is in the sitemap",
  );
});

// ---------------------------------------------------------------- JSON-LD

test("an allowlisted page carries DefinedTerm (referencing the set) + BreadcrumbList", () => {
  const blocks = ldBlocks(page(path.join("concepts", ALLOWLISTED)));
  const term = blocks.find((b) => b["@type"] === "DefinedTerm");
  const crumbs = blocks.find((b) => b["@type"] === "BreadcrumbList");

  assert.ok(term, "DefinedTerm present");
  assert.equal(term.name, "Evaluation");
  assert.ok(typeof term.description === "string" && term.description.length > 0);
  assert.deepEqual(term.inDefinedTermSet, { "@id": TERM_SET_ID });
  assert.deepEqual(term.alternateName, ["evals", "benchmarks"]);

  assert.ok(crumbs, "BreadcrumbList present");
  assert.equal(crumbs.itemListElement.length, 3);
  assert.equal(crumbs.itemListElement[1].item, "https://sjarmak.ai/concepts/");
  assert.equal(crumbs.itemListElement[2].name, "Evaluation");
});

test("below-floor pages carry NO JSON-LD but render a complete compact card", () => {
  for (const slug of [BELOW_FLOOR_WITH_EVIDENCE, BELOW_FLOOR_EMPTY]) {
    const html = page(path.join("concepts", slug));
    assert.equal(ldBlocks(html).length, 0, `${slug}: no JSON-LD`);
    assert.ok(!html.includes("DefinedTerm"), `${slug}: DefinedTerm withheld`);
    // complete card: definition, related concepts, stamp, back-link all render
    const concept = concepts.find((c) => c.slug === slug);
    assert.ok(html.includes(escapeHtml(concept.definition)));
    assert.match(html, /Related concepts/);
    assert.ok(html.includes(escapeHtml(REGISTER_COPY.reference.badgeCopy)));
  }
  // the evidence-bearing below-floor page still shows its evidence
  assert.match(page(path.join("concepts", BELOW_FLOOR_WITH_EVIDENCE)), /Digest issues/);
});

test("the DefinedTermSet is emitted exactly once, at the /concepts index stable URL", () => {
  const indexBlocks = ldBlocks(page("concepts"));
  const sets = indexBlocks.filter((b) => b["@type"] === "DefinedTermSet");
  assert.equal(sets.length, 1);
  assert.equal(sets[0]["@id"], TERM_SET_ID);
  assert.equal(sets[0].hasDefinedTerm.length, allowlist.size);

  // no concept page emits its own set (their DefinedTerm only REFERENCES it)
  for (const entry of readdirSync(path.join(DIST, "concepts"), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pageSets = ldBlocks(page(path.join("concepts", entry.name))).filter(
      (b) => b["@type"] === "DefinedTermSet",
    );
    assert.equal(pageSets.length, 0, `${entry.name}: emits no DefinedTermSet of its own`);
  }
});

// ------------------------------------------------------- week-floor lastmod

test("sitemap lastmod for concept URLs is the week floor of the newest dated evidence", () => {
  for (const slug of allowlist) {
    const expected = conceptLastmodForPath(`/concepts/${slug}/`);
    const entry = sitemap.match(
      new RegExp(`<url><loc>https://sjarmak\\.ai/concepts/${slug}/</loc>(?:<lastmod>([^<]+)</lastmod>)?`),
    );
    assert.ok(entry, `${slug} has a sitemap entry`);
    assert.equal(entry[1], expected, `${slug}: lastmod matches the week floor`);
    if (expected !== undefined) {
      const day = new Date(expected).getUTCDay();
      assert.equal(day, 1, `${slug}: lastmod ${expected} is a UTC Monday`);
    }
  }
});

// --------------------------------------------------------- R15 deep links

test("explorer -> concept page deep links ship in the built prototype HTML", () => {
  const explorer = page(path.join("prototypes", "concepts"));
  for (const concept of concepts) {
    assert.ok(
      explorer.includes(`href="/concepts/${concept.slug}/"`),
      `explorer fallback links /concepts/${concept.slug}/`,
    );
  }
});
