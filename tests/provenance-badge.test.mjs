// Provenance badge assertions over the BUILT site (dist/) — PRD R1 acceptance.
// Both digest branches (origin:auto → generated, origin:manual → hybrid) must
// render a badge whose wording comes from the canonical register→copy map
// (src/lib/registerCopy.ts); neither the page nor the component may carry its
// own badge phrasing. If dist/ is absent the suite builds it.

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { REGISTER_COPY } from "../src/lib/registerCopy.ts";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(REPO_ROOT, "dist");

const MANUAL_ISSUE =
  "manual-enhancing-developer-productivity-with-google-colab-cli-and-agentic-observability";
const AUTO_ISSUE = "daily-2026-06-09";

function page(rel) {
  return readFileSync(path.join(DIST, rel, "index.html"), "utf8");
}

// The badge element for a given register, or null. Matches the class as a
// substring because Astro scoped styles decorate the element with extra
// attributes/classes.
function badgeOf(html, register) {
  const re = new RegExp(
    `<p[^>]*class="[^"]*provenance-badge[^"]*"[^>]*data-register="${register}"[^>]*>[\\s\\S]*?</p>`,
  );
  const m = html.match(re);
  return m ? m[0] : null;
}

before(async () => {
  if (!existsSync(path.join(DIST, "index.html"))) {
    await execFileP("npm", ["run", "build"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 });
  }
});

// --------------------------------------------- auto issue → generated badge

test("an origin:auto issue renders the generated badge text from the canonical map", () => {
  const badge = badgeOf(page(path.join("digest", AUTO_ISSUE)), "generated");
  assert.ok(badge, "auto issue must render a provenance badge with data-register=generated");
  assert.ok(
    badge.includes(REGISTER_COPY.generated.badgeCopy),
    `badge must carry the map's generated badgeCopy; got: ${badge}`,
  );
});

test("the generated badge links the colophon (href attribute only — the route lands in a parallel unit)", () => {
  const badge = badgeOf(page(path.join("digest", AUTO_ISSUE)), "generated");
  assert.match(badge, /<a[^>]*href="\/colophon"/);
});

// --------------------------------------------- manual issue → hybrid badge

test("an origin:manual issue renders the hybrid (hand-curated) badge text from the canonical map", () => {
  const badge = badgeOf(page(path.join("digest", MANUAL_ISSUE)), "hybrid");
  assert.ok(badge, "manual issue must render a provenance badge with data-register=hybrid");
  assert.ok(
    badge.includes(REGISTER_COPY.hybrid.badgeCopy),
    `badge must carry the map's hybrid badgeCopy; got: ${badge}`,
  );
  assert.match(badge, /hand-curated/i, "the hand-curated meaning must survive in the badge");
});

// --------------------------------------------- single source of wording

test("neither the page nor the component hardcodes badge wording beyond map lookups", () => {
  const componentSrc = readFileSync(
    path.join(REPO_ROOT, "src", "components", "ProvenanceBadge.astro"),
    "utf8",
  );
  const pageSrc = readFileSync(
    path.join(REPO_ROOT, "src", "pages", "digest", "[slug].astro"),
    "utf8",
  );
  assert.match(componentSrc, /REGISTER_COPY/, "component must consume the canonical map");
  for (const [name, src] of [
    ["ProvenanceBadge.astro", componentSrc],
    ["digest/[slug].astro", pageSrc],
  ]) {
    for (const phrase of [
      /hand-curated/i,
      /compiled by/i,
      /automated research pipeline/i,
      /pipeline-assisted/i,
    ]) {
      assert.doesNotMatch(src, phrase, `${name} must not hardcode badge phrasing (${phrase})`);
    }
  }
});

// --------------------------------------------- layout otherwise unchanged

// A rendered type-stamp element (markup-anchored: matches the class attribute,
// never the class name inside inlined CSS).
const STAMP_EL = /<div[^>]*class="[^"]*type-stamp[^"]*"/;

test("digest layout survives around the badge (kicker, title, sections, single badge)", () => {
  for (const [issue, register] of [
    [AUTO_ISSUE, "generated"],
    [MANUAL_ISSUE, "hybrid"],
  ]) {
    const html = page(path.join("digest", issue));
    assert.match(html, /class="kicker"/, `${issue}: kicker still renders`);
    assert.match(html, /(Daily|Weekly|Monthly) digest/, `${issue}: cadence label still renders`);
    assert.match(html, /<h1[^>]*>/, `${issue}: title still renders`);
    assert.match(html, /class="lead measure"/, `${issue}: summary lead still renders`);
    assert.match(html, /All digests/, `${issue}: back link still renders`);
    const count = html.match(/data-register="/g)?.length ?? 0;
    assert.equal(count, 1, `${issue}: exactly one badge, got ${count}`);
    assert.match(html, new RegExp(`data-register="${register}"`));
  }
});

// -------------------------------------- single provenance surface per page

test("issue pages carry exactly one provenance surface (badge, no layout stamp); stamps survive elsewhere", () => {
  // Digest issues: the badge IS the provenance surface — the generic layout
  // stamp is suppressed (BaseLayout stamp={false}) so the page never renders
  // two provenance surfaces.
  for (const [issue, register] of [
    [AUTO_ISSUE, "generated"],
    [MANUAL_ISSUE, "hybrid"],
  ]) {
    const html = page(path.join("digest", issue));
    assert.ok(badgeOf(html, register), `${issue}: badge must render`);
    assert.doesNotMatch(html, STAMP_EL, `${issue}: layout type stamp must be suppressed`);
  }
  // Pages with no badge keep their normal stamps: the digest index/archive and
  // a non-digest generated page.
  for (const rel of ["digest", path.join("digest", "archive"), path.join("library", "explorers", "agentic-information-retrieval")]) {
    const html = page(rel);
    assert.match(html, STAMP_EL, `${rel}: layout type stamp must still render`);
    assert.match(html, /data-register="generated"/, `${rel}: stamp must carry its register`);
    assert.doesNotMatch(html, /provenance-badge/, `${rel}: no badge renders here`);
  }
});
