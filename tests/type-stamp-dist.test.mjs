// Sitewide type stamps (PRD R16) asserted over the BUILT site (dist/).
// If dist/ is absent the suite builds it (npm run build); in the ordered CI
// pipeline the build has already run.

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { REGISTERS } from "../src/lib/register.ts";
import { REGISTER_COPY } from "../src/lib/registerCopy.ts";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(REPO_ROOT, "dist");
const SRC = path.join(REPO_ROOT, "src");

// Same exemplars tests/register-dist.test.mjs pins for the R3 assertions.
const MANUAL_ISSUE =
  "manual-enhancing-developer-productivity-with-google-colab-cli-and-agentic-observability";
const AUTO_ISSUE = "daily-2026-06-09";
const EXPLORER_PAGE = path.join("library", "explorers", "agentic-information-retrieval");

// Digest ISSUE pages suppress the layout stamp (BaseLayout stamp={false}):
// their single provenance surface is the ProvenanceBadge, asserted in
// tests/provenance-badge.test.mjs. hybrid therefore has no stamped exemplar —
// manual digest issues are the only hybrid pages on the site.
const STAMP_EXEMPLARS = {
  authored: ".",
  generated: "digest",
  reference: "library",
  lab: path.join("prototypes", "starmap"),
};

const BADGE_EXEMPLARS = {
  generated: path.join("digest", AUTO_ISSUE),
  hybrid: path.join("digest", MANUAL_ISSUE),
};

// A rendered type-stamp element (markup-anchored: matches the class attribute,
// never the class name inside inlined CSS).
const STAMP_EL = /<div[^>]*class="[^"]*type-stamp[^"]*"/;

function page(rel) {
  return readFileSync(path.join(DIST, rel, "index.html"), "utf8");
}

// Markup-anchored placement markers: the trailing quote pins the match to the
// rendered class attribute, never to the class name inside inlined CSS.
const QUIET_STAMP = 'type-stamp--footer-quiet"';
const HEADER_STAMP = 'type-stamp--header"';

// Decode the entities Astro escapes in text nodes so built HTML can be
// compared against the raw copy map strings.
function decode(html) {
  return html
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"');
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

before(async () => {
  if (!existsSync(path.join(DIST, "index.html"))) {
    await execFileP("npm", ["run", "build"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 });
  }
});

// ------------------------------------------------- mapped copy per register

test("every register's exemplar page renders the mapped provenance copy", () => {
  // Every register is covered by one surface or the other: four registers by
  // the layout stamp, generated+hybrid digest issues by the badge alone.
  assert.deepEqual(
    [...new Set([...Object.keys(STAMP_EXEMPLARS), ...Object.keys(BADGE_EXEMPLARS)])].sort(),
    [...REGISTERS].sort(),
  );
  for (const [register, rel] of Object.entries(STAMP_EXEMPLARS)) {
    const html = decode(page(rel));
    const { label, badgeCopy } = REGISTER_COPY[register];
    assert.ok(
      html.includes(`data-register="${register}"`),
      `${rel}: stamp must carry data-register="${register}"`,
    );
    assert.ok(html.includes(label), `${rel}: stamp must render label "${label}"`);
    assert.ok(html.includes(badgeCopy), `${rel}: stamp must render badge copy "${badgeCopy}"`);
  }
  for (const [register, rel] of Object.entries(BADGE_EXEMPLARS)) {
    const html = decode(page(rel));
    assert.ok(
      html.includes(`data-register="${register}"`),
      `${rel}: badge must carry data-register="${register}"`,
    );
    assert.ok(
      html.includes(REGISTER_COPY[register].badgeCopy),
      `${rel}: badge must render the map's badge copy`,
    );
    assert.doesNotMatch(html, STAMP_EL, `${rel}: issue pages render no layout stamp`);
  }
});

test("edge case: a manual digest issue is badged hybrid, not generated or authored", () => {
  const html = decode(page(BADGE_EXEMPLARS.hybrid));
  assert.ok(html.includes(`data-register="hybrid"`));
  assert.ok(html.includes(REGISTER_COPY.hybrid.badgeCopy));
  assert.equal(html.includes(REGISTER_COPY.generated.badgeCopy), false);
  assert.equal(html.includes(REGISTER_COPY.authored.badgeCopy), false);
});

test("edge case: a machine-built learning (explorer) page is stamped generated, never authored", () => {
  const html = decode(page(EXPLORER_PAGE));
  assert.ok(html.includes(`data-register="generated"`));
  assert.ok(html.includes(REGISTER_COPY.generated.badgeCopy));
  assert.equal(html.includes(REGISTER_COPY.authored.label), false);
  assert.equal(html.includes(REGISTER_COPY.authored.badgeCopy), false);
});

test("digest issues render no stamp updated line — the badge is the single provenance surface", () => {
  // The stamp's "· updated <date>" line went with the suppressed stamp; the
  // issue's own dated byline (fullDate) remains the visible date.
  const html = page(BADGE_EXEMPLARS.generated);
  assert.doesNotMatch(html, /updated <time/);
  assert.doesNotMatch(html, STAMP_EL);
  assert.match(html, /Jun 9, 2026/);
});

// ------------------------------------------------- placement

test("authored stamp is footer-quiet: after </main> and after the site footer", () => {
  const html = page(STAMP_EXEMPLARS.authored);
  const stampAt = html.indexOf(QUIET_STAMP);
  assert.ok(stampAt >= 0, "homepage must carry a footer-quiet stamp");
  assert.equal(html.includes(HEADER_STAMP), false, "no visible header stamp on authored pages");
  assert.ok(stampAt > html.indexOf("</main>"), "stamp must sit outside <main>");
  assert.ok(stampAt > html.indexOf("</footer>"), "stamp must sit in the footer region");
});

test("homepage hero contains no stamp and is byte-identical to the base branch", () => {
  const html = page(STAMP_EXEMPLARS.authored);
  const start = html.indexOf('<section class="hero container"');
  assert.ok(start >= 0, "hero section must exist");
  const hero = html.slice(start, html.indexOf("</section>", start) + "</section>".length);
  assert.equal(hero.includes("type-stamp"), false, "hero must not be stamped");
  const baseline = readFileSync(path.join(REPO_ROOT, "tests", "fixtures", "homepage-hero.html"), "utf8");
  assert.equal(hero, baseline, "hero section must be byte-identical to the base-branch build");
});

test("machine registers stamp visibly at the top of <main>, before the h1", () => {
  // hybrid is absent: its only pages (manual digest issues) suppress the
  // stamp in favor of the badge, so no page renders a hybrid header stamp.
  for (const register of ["generated", "reference", "lab"]) {
    const html = page(STAMP_EXEMPLARS[register]);
    const stampAt = html.indexOf(HEADER_STAMP);
    assert.ok(stampAt >= 0, `${register}: must carry a header stamp`);
    assert.equal(html.includes(QUIET_STAMP), false, `${register}: no quiet stamp`);
    assert.ok(stampAt > html.indexOf("<main"), `${register}: stamp inside <main>`);
    assert.ok(stampAt < html.indexOf("</main>"), `${register}: stamp inside <main>`);
    assert.ok(stampAt < html.indexOf("<h1"), `${register}: stamp above the page h1`);
  }
});

// ------------------------------------------------- single-source greps

test("exactly one stamp component and one copy map exist in src/", () => {
  const files = walk(SRC).filter((p) => /\.(astro|ts|tsx|mjs|js)$/.test(p));
  const stampComponents = files.filter(
    (p) => p.endsWith(".astro") && readFileSync(p, "utf8").includes("type-stamp"),
  );
  assert.deepEqual(
    stampComponents.map((p) => path.relative(REPO_ROOT, p)),
    [path.join("src", "components", "TypeStamp.astro")],
    "exactly one component may render the type stamp",
  );
  const copyMaps = files.filter((p) => /const REGISTER_COPY[^=\n]*=\s*\{/.test(readFileSync(p, "utf8")));
  assert.deepEqual(
    copyMaps.map((p) => path.relative(REPO_ROOT, p)),
    [path.join("src", "lib", "registerCopy.ts")],
    "exactly one file may define the register copy map",
  );
  // No stray re-typed badge phrasing outside the map.
  const phrase = "automated research pipeline";
  const phraseFiles = files.filter((p) => readFileSync(p, "utf8").includes(phrase));
  assert.deepEqual(phraseFiles.map((p) => path.relative(REPO_ROOT, p)), [
    path.join("src", "lib", "registerCopy.ts"),
  ]);
});
