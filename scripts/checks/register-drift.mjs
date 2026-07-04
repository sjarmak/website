#!/usr/bin/env node
// Register drift check (PRD R3) — post-build assertion that the two-register
// architecture's mechanical hygiene holds in dist/. Runs at the end of
// `npm run build` (the human-pushed-code failure channel; the digest cron's
// own channel is publish-digest.mjs + run.sh's local validation).
//
// HARD FAILURES (each reported with its channel letter):
//   (a) sitemap/noindex contradiction — any noindexed URL present in the
//       sitemap, or any URL under a canonical noindex route prefix
//       (src/lib/register.ts NOINDEX_ROUTE_PREFIXES) whose page is missing the
//       robots noindex meta (the exact drift observed pre-adoption: 5/7
//       prototype pages silently lost noindex).
//   (b) any rendered page missing the <meta name="site-register"> declaration.
//   (c) any register value outside the closed enum (membership asserted,
//       never presence-only).
//   (d) unexpected dist sitemap layout. @astrojs/sitemap is PINNED at 3.7.3,
//       which emits exactly sitemap-index.xml referencing exactly
//       sitemap-0.xml. Anything else (flat sitemap.xml, extra chunks) means
//       the pinned version's contract changed — re-assert deliberately.
//
// WEAKENING REQUIRES A BEAD: any diff that relaxes a criterion in this file
// (removing a channel, widening the enum, skipping paths) MUST be accompanied
// by a bd bead naming the relaxed criterion and why. Do not weaken silently.
//
// Verbatim public/ copies (pre-built games, scix-viz exports) are not Astro
// pages and are skipped mechanically: any dist path that also exists under
// public/ is a copied asset, not a rendered page.

import { readFile, readdir, access } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";
import { REGISTERS, NOINDEX_ROUTE_PREFIXES, isNoindexPath } from "../../src/lib/register.ts";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, "..", "..");
const SITE_ORIGIN = "https://sjarmak.ai";

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function listHtmlFiles(dir, base = dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listHtmlFiles(abs, base)));
    else if (entry.name.endsWith(".html")) out.push(path.relative(base, abs));
  }
  return out;
}

// dist/foo/index.html -> /foo/ ; dist/404.html -> /404.html
function relHtmlToPathname(rel) {
  const posix = rel.split(path.sep).join("/");
  if (posix === "index.html") return "/";
  if (posix.endsWith("/index.html")) return `/${posix.slice(0, -"index.html".length)}`;
  return `/${posix}`;
}

function extractMeta(html, name) {
  // matches <meta name="X" content="Y"> with either attribute order
  const re = new RegExp(
    `<meta\\s+(?:name=["']${name}["']\\s+content=["']([^"']*)["']|content=["']([^"']*)["']\\s+name=["']${name}["'])`,
    "i",
  );
  const m = html.match(re);
  return m ? (m[1] ?? m[2]) : null;
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

// Core check, exported for tests. Returns { violations, pages, sitemapUrls }.
export async function checkRegisterDrift({
  distDir = path.join(REPO_ROOT, "dist"),
  publicDir = path.join(REPO_ROOT, "public"),
  siteOrigin = SITE_ORIGIN,
} = {}) {
  const violations = [];

  // ---- (d) sitemap layout: pinned @astrojs/sitemap 3.7.3 emits exactly
  // sitemap-index.xml -> sitemap-0.xml, flat, no extra chunks.
  const indexPath = path.join(distDir, "sitemap-index.xml");
  const chunkPath = path.join(distDir, "sitemap-0.xml");
  let sitemapUrls = [];
  if (!(await exists(indexPath))) {
    violations.push("(d) dist/sitemap-index.xml is missing — sitemap layout changed");
  } else {
    const indexLocs = extractLocs(await readFile(indexPath, "utf8"));
    if (indexLocs.length !== 1 || !indexLocs[0].endsWith("/sitemap-0.xml")) {
      violations.push(
        `(d) sitemap-index.xml must reference exactly sitemap-0.xml; got [${indexLocs.join(", ")}]`,
      );
    }
  }
  if (!(await exists(chunkPath))) {
    violations.push("(d) dist/sitemap-0.xml is missing — sitemap layout changed");
  } else {
    sitemapUrls = extractLocs(await readFile(chunkPath, "utf8"));
  }
  if (await exists(path.join(distDir, "sitemap-1.xml"))) {
    violations.push("(d) unexpected sitemap-1.xml chunk — sitemap layout changed");
  }
  if (await exists(path.join(distDir, "sitemap.xml"))) {
    violations.push("(d) unexpected flat sitemap.xml — sitemap layout changed");
  }

  const sitemapPathnames = new Set(
    sitemapUrls.map((u) => {
      const url = new URL(u);
      if (url.origin !== siteOrigin) {
        violations.push(`(d) sitemap URL ${u} is not on ${siteOrigin}`);
      }
      return url.pathname;
    }),
  );

  // ---- per-page metas
  const relFiles = await listHtmlFiles(distDir);
  const noindexedPathnames = new Set();
  const registers = new Map(); // pathname -> register
  let pages = 0;
  for (const rel of relFiles) {
    // verbatim public/ copy (games, scix-viz, ...) — not a rendered page
    if (await exists(path.join(publicDir, rel))) continue;
    pages += 1;
    const pathname = relHtmlToPathname(rel);
    const html = await readFile(path.join(distDir, rel), "utf8");

    const register = extractMeta(html, "site-register");
    if (register === null) {
      violations.push(`(b) ${pathname} is missing <meta name="site-register">`);
    } else if (!REGISTERS.includes(register)) {
      violations.push(
        `(c) ${pathname} declares register "${register}" outside the closed enum [${REGISTERS.join(", ")}]`,
      );
    } else {
      registers.set(pathname, register);
    }

    const robots = extractMeta(html, "robots");
    const noindexed = robots !== null && /noindex/i.test(robots);
    if (noindexed) noindexedPathnames.add(pathname);

    // (a) canonical noindex list vs actual robots meta — the observed drift mode
    if (isNoindexPath(pathname) && !noindexed) {
      violations.push(
        `(a) ${pathname} falls under a canonical noindex route prefix but has no robots noindex meta`,
      );
    }
  }

  // ---- (a) no noindexed URL may appear in the sitemap
  for (const pathname of noindexedPathnames) {
    if (sitemapPathnames.has(pathname)) {
      violations.push(`(a) noindexed URL ${pathname} is present in the sitemap`);
    }
  }
  for (const prefixPath of sitemapPathnames) {
    if (isNoindexPath(prefixPath)) {
      violations.push(
        `(a) sitemap contains ${prefixPath}, which is under a canonical noindex route prefix`,
      );
    }
  }

  return { violations, pages, sitemapUrls: sitemapUrls.length, registers, noindexRoutePrefixes: NOINDEX_ROUTE_PREFIXES };
}

async function main() {
  const { values } = parseArgs({
    options: {
      dist: { type: "string" },
      public: { type: "string" },
    },
  });
  const result = await checkRegisterDrift({
    ...(values.dist ? { distDir: path.resolve(values.dist) } : {}),
    ...(values.public ? { publicDir: path.resolve(values.public) } : {}),
  });
  if (result.violations.length > 0) {
    console.error(`[register-drift] FAIL — ${result.violations.length} violation(s):`);
    for (const v of result.violations) console.error(`  ${v}`);
    process.exit(1);
  }
  console.log(
    `[register-drift] OK — ${result.pages} rendered page(s) carry a valid register; ` +
      `${result.sitemapUrls} sitemap URL(s), none noindexed`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`[register-drift] ${err.message}`);
    process.exit(1);
  });
}
