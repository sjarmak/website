// nav-swap (PRD R7′) assertions over the BUILT site (dist/): Digest leaves the
// primary header nav for the footer; Lab enters the primary nav pointing at
// /prototypes; every other header item keeps its label and order; no route
// that was nav-reachable before the swap is orphaned. If dist/ is absent the
// suite builds it (npm run build); in the ordered CI pipeline the build has
// already run.

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(REPO_ROOT, "dist");

// Base header nav (branch point prd-build/two-register) with the single R7′
// swap applied in place: Digest→/digest (slot 3) becomes Lab→/prototypes.
const EXPECTED_HEADER = [
  { label: "Work", href: "/work" },
  { label: "Library", href: "/library" },
  { label: "Lab", href: "/prototypes" },
  { label: "Writing", href: "/writing" },
  { label: "Talks", href: "/talks" },
  { label: "CV", href: "/cv" },
  { label: "Art", href: "/art" },
  { label: "Games", href: "/games" },
];

// Every route reachable from the base build's header nav must stay reachable
// from header ∪ footer after the swap.
const PREVIOUSLY_NAV_REACHABLE = [
  "/work",
  "/library",
  "/digest",
  "/writing",
  "/talks",
  "/cv",
  "/art",
  "/games",
];

let home;

before(async () => {
  if (!existsSync(path.join(DIST, "index.html"))) {
    await execFileP("npm", ["run", "build"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 });
  }
  home = readFileSync(path.join(DIST, "index.html"), "utf8");
});

function section(html, startRe, endTag) {
  const start = html.search(startRe);
  assert.notEqual(start, -1, `section ${startRe} present`);
  const end = html.indexOf(endTag, start);
  assert.notEqual(end, -1, `section ${startRe} closed by ${endTag}`);
  return html.slice(start, end + endTag.length);
}

function headerNav(html) {
  return section(html, /<nav[^>]*aria-label="Primary"[^>]*>/, "</nav>");
}

function footer(html) {
  return section(html, /<footer class="site-footer"/, "</footer>");
}

function navItems(navHtml) {
  return [...navHtml.matchAll(/<a\s+href="([^"]*)"[^>]*>([^<]*)<\/a>/g)].map((m) => ({
    href: m[1],
    label: m[2].trim(),
  }));
}

// ------------------------------------------------------------- header nav

test("header nav includes Lab → /prototypes", () => {
  const items = navItems(headerNav(home));
  assert.deepEqual(
    items.find((i) => i.label === "Lab"),
    { href: "/prototypes", label: "Lab" },
  );
});

test("header nav excludes Digest (label and href)", () => {
  const items = navItems(headerNav(home));
  assert.equal(items.some((i) => i.label === "Digest"), false);
  assert.equal(items.some((i) => i.href.startsWith("/digest")), false);
});

test("every other header item unchanged in label and order (base list, swap in place)", () => {
  assert.deepEqual(navItems(headerNav(home)), EXPECTED_HEADER);
});

// ---------------------------------------------------------------- footer

test("footer links /digest", () => {
  const items = navItems(footer(home));
  assert.deepEqual(
    items.find((i) => i.href === "/digest"),
    { href: "/digest", label: "Digest" },
  );
});

// ------------------------------------------------------------- no orphans

test("all previously-nav-reachable routes reachable via header or footer", () => {
  const reachable = new Set(
    [...navItems(headerNav(home)), ...navItems(footer(home))].map((i) => i.href),
  );
  for (const route of PREVIOUSLY_NAV_REACHABLE) {
    assert.equal(reachable.has(route), true, `${route} reachable from header/footer`);
  }
});

// ------------------------------------------------- homepage hero untouched

test("hero and homepage content untouched", () => {
  // Astro adds scoped-style data-astro-cid-* attributes; match around them.
  assert.match(home, /Stephanie Jarmak — information scientist and AI agent advocate/);
  assert.match(home, /I work on <strong[^>]*>multi-agent orchestration<\/strong>/);
  assert.match(home, /<a class="btn" href="\/work"[^>]*>See the work<\/a>/);
  assert.match(home, /<a class="btn btn--ghost" href="\/projects\/explorer"[^>]*>Explore the graph<\/a>/);
});
