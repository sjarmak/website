// Failure-channel fixtures for scripts/checks/register-drift.mjs — each of the
// four hard-fail channels (a)-(d) demonstrated against a minimal fixture dist,
// plus closed-enum unit assertions for the register module and copy map.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { checkRegisterDrift } from "../scripts/checks/register-drift.mjs";
import {
  REGISTERS,
  isRegister,
  isNoindexPath,
  registerFromDigestOrigin,
} from "../src/lib/register.ts";
import { REGISTER_COPY } from "../src/lib/registerCopy.ts";

const ORIGIN = "https://sjarmak.ai";

function htmlPage({ register = "authored", noindex = false } = {}) {
  return [
    "<!doctype html><html><head>",
    register === null ? "" : `<meta name="site-register" content="${register}" />`,
    noindex ? '<meta name="robots" content="noindex, nofollow" />' : "",
    "</head><body>ok</body></html>",
  ].join("\n");
}

function sitemapIndex(locs = [`${ORIGIN}/sitemap-0.xml`]) {
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex>${locs
    .map((l) => `<sitemap><loc>${l}</loc></sitemap>`)
    .join("")}</sitemapindex>`;
}

function sitemapChunk(pathnames) {
  return `<?xml version="1.0" encoding="UTF-8"?><urlset>${pathnames
    .map((p) => `<url><loc>${ORIGIN}${p}</loc></url>`)
    .join("")}</urlset>`;
}

// Build a fixture dist: pages = { "/": {...}, "/foo/": {...} }, sitemap lists
// the given pathnames. Returns { distDir, publicDir } (publicDir empty).
async function makeFixtureDist(t, { pages, sitemapPathnames, indexLocs, extraFiles = {} }) {
  const root = await mkdtemp(path.join(os.tmpdir(), "register-drift-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const distDir = path.join(root, "dist");
  const publicDir = path.join(root, "public");
  await mkdir(publicDir, { recursive: true });
  for (const [pathname, opts] of Object.entries(pages)) {
    const rel = pathname === "/" ? "index.html" : path.join(pathname.slice(1), "index.html");
    const abs = path.join(distDir, rel);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, htmlPage(opts), "utf8");
  }
  await writeFile(path.join(distDir, "sitemap-index.xml"), sitemapIndex(indexLocs), "utf8");
  await writeFile(path.join(distDir, "sitemap-0.xml"), sitemapChunk(sitemapPathnames), "utf8");
  for (const [rel, content] of Object.entries(extraFiles)) {
    await writeFile(path.join(distDir, rel), content, "utf8");
  }
  return { distDir, publicDir };
}

const CLEAN = {
  pages: {
    "/": { register: "authored" },
    "/prototypes/": { register: "lab" },
    "/prototypes/starmap/": { register: "lab", noindex: true },
  },
  sitemapPathnames: ["/", "/prototypes/"],
};

test("clean fixture dist passes with zero violations", async (t) => {
  const dirs = await makeFixtureDist(t, CLEAN);
  const result = await checkRegisterDrift(dirs);
  assert.deepEqual(result.violations, []);
  assert.equal(result.pages, 3);
});

test("(a) a noindexed URL present in the sitemap hard-fails", async (t) => {
  const dirs = await makeFixtureDist(t, {
    ...CLEAN,
    sitemapPathnames: ["/", "/prototypes/", "/prototypes/starmap/"],
  });
  const result = await checkRegisterDrift(dirs);
  assert.ok(
    result.violations.some((v) => v.startsWith("(a)") && v.includes("/prototypes/starmap/")),
    `expected an (a) violation, got: ${result.violations.join(" | ")}`,
  );
});

test("(a) a canonical-noindex-prefix page that LOST its robots meta hard-fails (the observed drift)", async (t) => {
  const dirs = await makeFixtureDist(t, {
    ...CLEAN,
    pages: { ...CLEAN.pages, "/prototypes/starmap/": { register: "lab", noindex: false } },
  });
  const result = await checkRegisterDrift(dirs);
  assert.ok(
    result.violations.some(
      (v) => v.startsWith("(a)") && v.includes("no robots noindex"),
    ),
    `expected an (a) lost-noindex violation, got: ${result.violations.join(" | ")}`,
  );
});

test("(b) a page missing the register meta hard-fails", async (t) => {
  const dirs = await makeFixtureDist(t, {
    ...CLEAN,
    pages: { ...CLEAN.pages, "/about/": { register: null } },
  });
  const result = await checkRegisterDrift(dirs);
  assert.ok(
    result.violations.some((v) => v.startsWith("(b)") && v.includes("/about/")),
    `expected a (b) violation, got: ${result.violations.join(" | ")}`,
  );
});

test("(c) a register value outside the closed enum hard-fails (membership, not presence)", async (t) => {
  const dirs = await makeFixtureDist(t, {
    ...CLEAN,
    pages: { ...CLEAN.pages, "/about/": { register: "curated" } },
  });
  const result = await checkRegisterDrift(dirs);
  assert.ok(
    result.violations.some((v) => v.startsWith("(c)") && v.includes('"curated"')),
    `expected a (c) violation, got: ${result.violations.join(" | ")}`,
  );
});

test("(d) an unexpected sitemap layout hard-fails: extra chunk, flat sitemap, wrong index", async (t) => {
  const extraChunk = await makeFixtureDist(t, {
    ...CLEAN,
    extraFiles: { "sitemap-1.xml": sitemapChunk(["/"]) },
  });
  let result = await checkRegisterDrift(extraChunk);
  assert.ok(result.violations.some((v) => v.startsWith("(d)") && v.includes("sitemap-1.xml")));

  const flat = await makeFixtureDist(t, {
    ...CLEAN,
    extraFiles: { "sitemap.xml": sitemapChunk(["/"]) },
  });
  result = await checkRegisterDrift(flat);
  assert.ok(result.violations.some((v) => v.startsWith("(d)") && v.includes("flat sitemap.xml")));

  const wrongIndex = await makeFixtureDist(t, {
    ...CLEAN,
    indexLocs: [`${ORIGIN}/sitemap-0.xml`, `${ORIGIN}/sitemap-9.xml`],
  });
  result = await checkRegisterDrift(wrongIndex);
  assert.ok(
    result.violations.some((v) => v.startsWith("(d)") && v.includes("exactly sitemap-0.xml")),
  );
});

// ------------------------------------------------------------ enum + copy map

test("register enum is closed: membership asserted, unknown values rejected", () => {
  assert.deepEqual(REGISTERS, ["authored", "generated", "hybrid", "reference", "lab"]);
  for (const r of REGISTERS) assert.equal(isRegister(r), true);
  for (const bad of ["curated", "AUTHORED", "", null, undefined, 3]) {
    assert.equal(isRegister(bad), false, `"${bad}" must be rejected`);
  }
});

test("digest origin derivation: manual→hybrid, auto→generated", () => {
  assert.equal(registerFromDigestOrigin("manual"), "hybrid");
  assert.equal(registerFromDigestOrigin("auto"), "generated");
});

test("noindex path predicate: experiments match (incl. nested), lab index does not", () => {
  assert.equal(isNoindexPath("/prototypes/starmap/"), true);
  assert.equal(isNoindexPath("/prototypes/paths/science-to-agents/"), true);
  assert.equal(isNoindexPath("/prototypes/"), false);
  assert.equal(isNoindexPath("/"), false);
  assert.equal(isNoindexPath("/digest/daily-2026-06-09/"), false);
});

test("canonical copy map covers exactly the enum, with the R16 shape", () => {
  assert.deepEqual(Object.keys(REGISTER_COPY).sort(), [...REGISTERS].sort());
  for (const [register, copy] of Object.entries(REGISTER_COPY)) {
    assert.equal(typeof copy.label, "string");
    assert.ok(copy.label.length > 0, `${register} label non-empty`);
    assert.equal(typeof copy.badgeCopy, "string");
    assert.ok(["header", "footer-quiet"].includes(copy.stampPlacement));
  }
  // R16: the personal register is never loudly co-labeled
  assert.equal(REGISTER_COPY.authored.stampPlacement, "footer-quiet");
});
