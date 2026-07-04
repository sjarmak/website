// Double-build stability guarantee (PRD R3): derived digest data must never
// change register or index state. Builds the site twice against SHIFTED
// fixture digest data (different facet counts, item dates, highlights — same
// slug and issue date) into isolated outDirs and asserts byte-identical
// sitemaps and identical register metas across every rendered page.
//
// This is what keeps the daily cron from ever flipping a page's index state:
// lastmod derives from the slug date (never build time), sitemap membership
// derives from the committed noindex list, register derives from origin.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile, access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { STABILITY_FIXTURE_FILES } from "./fixtures/stability-fixture-paths.mjs";
import { withBuildLock } from "./fixtures/build-lock.mjs";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STABILITY_CONFIG = path.join("tests", "fixtures", "astro.stability.config.mjs");
// Fixture filenames live in tests/fixtures/stability-fixture-paths.mjs so the
// digest-dir-asserting tests (which may run in a PARALLEL test process) can
// tolerate their transient presence.
const FIXTURE_ENTRY = path.join(REPO_ROOT, "src", "content", "digest", STABILITY_FIXTURE_FILES[0]);

// Far-PAST slug so the fixture can never collide with a real issue AND never
// becomes any concept's newest dated evidence — concept-page lastmod is the
// week floor of the newest evidence date (PRD R4′), so a far-future fixture
// would legitimately move concept lastmods across builds and break the
// byte-identical guarantee this test asserts.
function fixtureIssue({ topics, items, highlights }) {
  return [
    "---",
    "title: Stability fixture issue",
    "cadence: daily",
    "track: specialized",
    "origin: auto",
    "date: 2001-01-09",
    "summary: Fixture issue for the double-build stability test.",
    "topics:",
    ...topics.map((t) => `  - ${t}`),
    "items:",
    ...items.flatMap((i) => [`  - title: ${i.title}`, `    url: ${i.url}`]),
    "highlights:",
    ...highlights.map((h) => `  - ${h}`),
    "---",
    "",
    "Stability fixture body.",
    "",
  ].join("\n");
}

const VARIANT_A = fixtureIssue({
  topics: ["agentic-coding"],
  items: [{ title: "Item one (2001-01-07)", url: "https://example.com/a-2001-01-07" }],
  highlights: ["First highlight."],
});

// Shifted: more facets (incl. unresolvable ones), different item dates/URLs,
// extra highlight — everything a daily cron run plausibly varies.
const VARIANT_B = fixtureIssue({
  topics: ["agentic-coding", "evals", "zzz-shifted-facet-one", "zzz-shifted-facet-two"],
  items: [
    { title: "Item one (2001-01-08)", url: "https://example.com/b-2001-01-08" },
    { title: "Item two (2001-01-09)", url: "https://example.com/b-2001-01-09" },
  ],
  highlights: ["First highlight.", "Second highlight."],
});

async function buildTo(outDir) {
  // Serialized against other full-build tests (digest-noindex-lever): parallel
  // astro builds collide on the shared ./.astro staging dir.
  await withBuildLock(REPO_ROOT, () =>
    execFileP("npx", ["astro", "build", "--config", STABILITY_CONFIG], {
      cwd: REPO_ROOT,
      env: { ...process.env, STABILITY_OUT_DIR: outDir },
      maxBuffer: 64 * 1024 * 1024,
    }),
  );
}

async function listHtml(dir, base = dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listHtml(abs, base)));
    else if (entry.name.endsWith(".html")) out.push(path.relative(base, abs));
  }
  return out.sort();
}

async function collectRegisters(dir) {
  const map = {};
  for (const rel of await listHtml(dir)) {
    // verbatim public/ copies carry no register meta by design
    try {
      await access(path.join(REPO_ROOT, "public", rel));
      continue;
    } catch {
      /* not a public copy — a rendered page */
    }
    const html = await readFile(path.join(dir, rel), "utf8");
    const m = html.match(/<meta name="site-register" content="([^"]*)"/);
    map[rel] = m ? m[1] : "<missing>";
  }
  return map;
}

test("double build against shifted fixture digest data yields byte-identical sitemaps and identical register metas", async (t) => {
  const scratch = await mkdtemp(path.join(os.tmpdir(), "register-stability-"));
  const outA = path.join(scratch, "dist-a");
  const outB = path.join(scratch, "dist-b");
  t.after(async () => {
    await rm(scratch, { recursive: true, force: true });
    await rm(FIXTURE_ENTRY, { force: true });
  });

  await writeFile(FIXTURE_ENTRY, VARIANT_A, "utf8");
  await buildTo(outA);
  await writeFile(FIXTURE_ENTRY, VARIANT_B, "utf8");
  await buildTo(outB);

  // sitemaps: byte-identical
  for (const name of ["sitemap-index.xml", "sitemap-0.xml"]) {
    const a = await readFile(path.join(outA, name));
    const b = await readFile(path.join(outB, name));
    assert.ok(a.equals(b), `${name} must be byte-identical across shifted-data builds`);
  }

  // the fixture URL is present with slug-derived lastmod and lowered priority
  const sitemap = await readFile(path.join(outA, "sitemap-0.xml"), "utf8");
  assert.match(
    sitemap,
    /<url><loc>https:\/\/sjarmak\.ai\/digest\/daily-2001-01-09\/<\/loc><lastmod>2001-01-09T00:00:00\.000Z<\/lastmod><priority>0\.3<\/priority><\/url>/,
  );

  // register metas: identical page set, identical values
  const registersA = await collectRegisters(outA);
  const registersB = await collectRegisters(outB);
  assert.deepEqual(registersB, registersA);
  assert.equal(registersA[path.join("digest", "daily-2001-01-09", "index.html")], "generated");
  assert.ok(!Object.values(registersA).includes("<missing>"), "every rendered page carries a register");
});

// ---------------------------------------------------------------- PRD R4′
// Concept-page index state is a COMMITTED property: shifted evidence data
// must never flip it, and concept lastmod (week floor of the newest dated
// evidence) must be stable across consecutive-day data within a week. This
// double-build test lives in this file ON PURPOSE: both stability tests
// write fixtures into src/content/digest, and tests within one file run
// sequentially while separate files may run in parallel.

const CONCEPT_FIXTURE_ENTRY = path.join(REPO_ROOT, "src", "content", "digest", STABILITY_FIXTURE_FILES[1]);

// Same slug both builds (the digest URL's lastmod derives from the slug);
// the frontmatter date — the concept-evidence date — shifts by ONE DAY
// within the same ISO week (2098-01-06 is a Monday). Far-future so the
// fixture IS the newest dated evidence for its concept, exercising the
// week-floor path rather than being shadowed by real data.
function conceptFixtureIssue(date) {
  return [
    "---",
    "title: Concept stability fixture issue",
    "cadence: daily",
    "track: specialized",
    "origin: auto",
    `date: ${date}`,
    "summary: Fixture issue for the concept index-state stability test.",
    "topics:",
    "  - agentic-coding",
    "items:",
    "  - title: Fixture item",
    "    url: https://example.com/concept-fixture",
    "highlights:",
    "  - Fixture highlight.",
    "---",
    "",
    "Concept stability fixture body.",
    "",
  ].join("\n");
}

async function collectConceptIndexMetas(dir) {
  const map = {};
  const conceptsDir = path.join(dir, "concepts");
  for (const rel of await listHtml(conceptsDir, conceptsDir)) {
    const html = await readFile(path.join(conceptsDir, rel), "utf8");
    map[rel] = {
      register: html.match(/<meta name="site-register" content="([^"]*)"/)?.[1] ?? "<missing>",
      noindex: /<meta name="robots" content="[^"]*noindex[^"]*"/.test(html),
      definedTerm: html.includes('"@type":"DefinedTerm"'),
    };
  }
  return map;
}

test("double build with evidence shifted a day within one week yields identical index metas + sitemap; concept lastmod is week-floored", async (t) => {
  const scratch = await mkdtemp(path.join(os.tmpdir(), "concept-stability-"));
  const outA = path.join(scratch, "dist-a");
  const outB = path.join(scratch, "dist-b");
  t.after(async () => {
    await rm(scratch, { recursive: true, force: true });
    await rm(CONCEPT_FIXTURE_ENTRY, { force: true });
  });

  await writeFile(CONCEPT_FIXTURE_ENTRY, conceptFixtureIssue("2098-01-08"), "utf8");
  await buildTo(outA);
  await writeFile(CONCEPT_FIXTURE_ENTRY, conceptFixtureIssue("2098-01-09"), "utf8");
  await buildTo(outB);

  // sitemaps: byte-identical — a consecutive-day evidence shift within the
  // same week moves NO concept lastmod and flips NO index state
  for (const name of ["sitemap-index.xml", "sitemap-0.xml"]) {
    const a = await readFile(path.join(outA, name));
    const b = await readFile(path.join(outB, name));
    assert.ok(a.equals(b), `${name} must be byte-identical across within-week evidence shifts`);
  }

  // the fixture is agentic-coding's newest dated evidence in both builds;
  // its concept URL carries the WEEK FLOOR (Monday), not the daily date
  const sitemap = await readFile(path.join(outA, "sitemap-0.xml"), "utf8");
  assert.match(
    sitemap,
    /<url><loc>https:\/\/sjarmak\.ai\/concepts\/agentic-coding\/<\/loc><lastmod>2098-01-06T00:00:00\.000Z<\/lastmod><\/url>/,
  );

  // per-page index metas across every /concepts/* page: identical
  const metasA = await collectConceptIndexMetas(outA);
  const metasB = await collectConceptIndexMetas(outB);
  assert.deepEqual(metasB, metasA);
  const allowlisted = metasA[path.join("agentic-coding", "index.html")];
  assert.deepEqual(allowlisted, { register: "reference", noindex: false, definedTerm: true });
  const belowFloor = metasA[path.join("scientific-search", "index.html")];
  assert.deepEqual(belowFloor, { register: "reference", noindex: true, definedTerm: false });
});
