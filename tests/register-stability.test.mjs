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

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STABILITY_CONFIG = path.join("tests", "fixtures", "astro.stability.config.mjs");
const FIXTURE_ENTRY = path.join(REPO_ROOT, "src", "content", "digest", "daily-2098-01-09.md");

// Far-future slug so the fixture can never collide with a real issue.
function fixtureIssue({ topics, items, highlights }) {
  return [
    "---",
    "title: Stability fixture issue",
    "cadence: daily",
    "track: specialized",
    "origin: auto",
    "date: 2098-01-09",
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
  items: [{ title: "Item one (2098-01-07)", url: "https://example.com/a-2098-01-07" }],
  highlights: ["First highlight."],
});

// Shifted: more facets (incl. unresolvable ones), different item dates/URLs,
// extra highlight — everything a daily cron run plausibly varies.
const VARIANT_B = fixtureIssue({
  topics: ["agentic-coding", "evals", "zzz-shifted-facet-one", "zzz-shifted-facet-two"],
  items: [
    { title: "Item one (2098-01-08)", url: "https://example.com/b-2098-01-08" },
    { title: "Item two (2098-01-09)", url: "https://example.com/b-2098-01-09" },
  ],
  highlights: ["First highlight.", "Second highlight."],
});

async function buildTo(outDir) {
  await execFileP("npx", ["astro", "build", "--config", STABILITY_CONFIG], {
    cwd: REPO_ROOT,
    env: { ...process.env, STABILITY_OUT_DIR: outDir },
    maxBuffer: 64 * 1024 * 1024,
  });
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
    /<url><loc>https:\/\/sjarmak\.ai\/digest\/daily-2098-01-09\/<\/loc><lastmod>2098-01-09T00:00:00\.000Z<\/lastmod><priority>0\.3<\/priority><\/url>/,
  );

  // register metas: identical page set, identical values
  const registersA = await collectRegisters(outA);
  const registersB = await collectRegisters(outB);
  assert.deepEqual(registersB, registersA);
  assert.equal(registersA[path.join("digest", "daily-2098-01-09", "index.html")], "generated");
  assert.ok(!Object.values(registersA).includes("<missing>"), "every rendered page carries a register");
});
