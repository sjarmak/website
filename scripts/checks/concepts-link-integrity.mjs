#!/usr/bin/env node
// Link-integrity check for the built concepts page.
//
//   npm run build && node scripts/checks/concepts-link-integrity.mjs
//
// Parses the BUILT page (default dist/prototypes/concepts/index.html),
// extracts every href, and asserts:
//   - internal links (starting with "/") map to a file in dist/
//     (route -> dist path: trailing slash or extensionless routes resolve to
//     <route>/index.html, then <route>.html; paths with an extension resolve
//     to the literal file),
//   - fragment-only links (#id) point at an id present in the page,
//   - external links are well-formed http(s) URLs (no fetching).
//
// Usage:
//   node scripts/checks/concepts-link-integrity.mjs [--dist DIR] [--page REL_HTML_PATH]

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, "..", "..");

const HREF_RE = /href="([^"]*)"/g;
const ID_RE = /\sid="([^"]*)"/g;

/** Map an internal route (no query/fragment) to candidate dist file paths. */
export function routeToDistCandidates(route) {
  const clean = route.replace(/\/+$/, "");
  if (clean === "") return ["index.html"];
  const rel = clean.replace(/^\//, "");
  if (/\.[a-z0-9]+$/i.test(rel)) return [rel];
  return [path.join(rel, "index.html"), `${rel}.html`];
}

/** Check every href in the page HTML. Returns a list of failure strings. */
export function checkLinks(html, distDir) {
  const ids = new Set([...html.matchAll(ID_RE)].map((m) => m[1]));
  const failures = [];
  const seen = new Set();

  for (const match of html.matchAll(HREF_RE)) {
    const href = match[1];
    if (href === "" || seen.has(href)) continue;
    seen.add(href);

    if (href.startsWith("#")) {
      const id = href.slice(1);
      if (!ids.has(id)) failures.push(`fragment ${href}: no element with id "${id}" in the page`);
      continue;
    }

    if (href.startsWith("/")) {
      const [route] = href.split("#")[0].split("?");
      const candidates = routeToDistCandidates(route);
      if (!candidates.some((c) => existsSync(path.join(distDir, c)))) {
        failures.push(`internal ${href}: none of [${candidates.join(", ")}] exist in dist/`);
      }
      continue;
    }

    // External: must be a well-formed absolute URL (no fetching).
    let url;
    try {
      url = new URL(href);
    } catch {
      failures.push(`external ${href}: not a parseable URL`);
      continue;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:" && url.protocol !== "mailto:") {
      failures.push(`external ${href}: unexpected protocol ${url.protocol}`);
    }
  }

  return { failures, checked: seen.size };
}

function main() {
  const { values } = parseArgs({
    options: {
      dist: { type: "string", default: path.join(REPO_ROOT, "dist") },
      page: { type: "string", default: path.join("prototypes", "concepts", "index.html") },
    },
  });

  const distDir = path.resolve(values.dist);
  const pagePath = path.join(distDir, values.page);
  if (!existsSync(pagePath)) {
    console.error(`[links] built page not found: ${pagePath} — run npm run build first`);
    return 1;
  }

  const html = readFileSync(pagePath, "utf8");
  const { failures, checked } = checkLinks(html, distDir);

  if (failures.length > 0) {
    for (const failure of failures) console.error(`[links] BROKEN: ${failure}`);
    console.error(`[links] ${failures.length} broken link(s) out of ${checked} checked in ${values.page}`);
    return 1;
  }

  console.log(`[links] OK: ${checked} link(s) checked in ${values.page}, all resolve`);
  return 0;
}

// Run only as a CLI; the test imports checkLinks/routeToDistCandidates directly.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
