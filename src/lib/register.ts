// Register — the single source of truth for the two-register site architecture
// (PRD R3). Every rendered page and every content collection entry carries one
// of these CLOSED enum values; membership is asserted (never presence-only) by
// the content schema, the digest publish gate, and the post-build drift check
// (scripts/checks/register-drift.mjs).
//
// Imported by src/content.config.ts, astro.config.mjs (sitemap filter),
// BaseHead, scripts/digest/publish-digest.mjs, and the check scripts — there is
// deliberately no parallel URL-pattern side-map anywhere else.

import { isConceptPath, isNoindexConceptPath } from "./concepts/indexState.ts";

export const REGISTERS = ["authored", "generated", "hybrid", "reference", "lab"] as const;

export type Register = (typeof REGISTERS)[number];

export function isRegister(value: unknown): value is Register {
  return typeof value === "string" && (REGISTERS as readonly string[]).includes(value);
}

export type DigestOrigin = "auto" | "manual";

// Explicit origin→register mapping for the digest collection (R3): a
// hand-curated issue is hybrid (human selection, pipeline assembly); a
// cron-authored issue is generated. There is NO default — every digest entry's
// register derives from its origin, so existing frontmatter needs no rewrite
// and an entry can never claim a register its origin contradicts.
export function registerFromDigestOrigin(origin: DigestOrigin): Register {
  return origin === "manual" ? "hybrid" : "generated";
}

// --- R19b one-commit digest reversal lever ---------------------------------
// Flip THIS line to `true` in a single-line commit to deindex the entire
// digest surface: every /digest/* page gains
// `<meta name="robots" content="noindex, follow">` (BaseHead) and drops out of
// the sitemap (astro.config.mjs filter reads isNoindexPath below) in one
// deploy. Default false — the digest stays indexed at lowered priority (R3).
const DIGEST_NOINDEX_LEVER = false;

// Test seam ONLY: tests/digest-noindex-lever.test.mjs builds with
// DIGEST_NOINDEX_BUILD=1 to prove the flipped behavior without mutating this
// file mid-test-run (test files run in parallel processes). The env branch
// takes the IDENTICAL downstream path as the committed lever flip. The
// `typeof process` guard keeps this module safe for non-node bundling.
export const DIGEST_NOINDEX: boolean =
  DIGEST_NOINDEX_LEVER ||
  (typeof process !== "undefined" && process.env?.DIGEST_NOINDEX_BUILD === "1");

const DIGEST_ROUTE_PREFIX = "/digest";

function isDigestPath(normalizedPathname: string): boolean {
  return (
    normalizedPathname === DIGEST_ROUTE_PREFIX ||
    normalizedPathname.startsWith(`${DIGEST_ROUTE_PREFIX}/`)
  );
}

// True when the digest reversal lever is pulled and this pathname is a digest
// page. BaseHead consumes this to emit `noindex, follow` (follow: internal
// links keep flowing; the pages just leave the index) — the sitemap filter and
// the drift check see the same state via isNoindexPath below, so the flip can
// never leave the three surfaces disagreeing.
export function isDigestNoindexPath(pathname: string): boolean {
  return DIGEST_NOINDEX && isDigestPath(normalizePathname(pathname));
}

// Route-level noindex source of truth. These prefixes (the 7 prototype
// experiment surfaces) are noindexed AND excluded from the sitemap; the
// prototypes INDEX (/prototypes/) is intentionally absent — it is the
// crawlable lab front door. Drives BOTH the sitemap filter in astro.config.mjs
// and the register-drift check, so the two can never disagree.
export const NOINDEX_ROUTE_PREFIXES = [
  "/prototypes/concepts",
  "/prototypes/graph-time",
  "/prototypes/paths",
  "/prototypes/questions",
  "/prototypes/receipts",
  "/prototypes/research-atlas",
  "/prototypes/starmap",
] as const;

// True when a pathname falls under a noindexed route prefix (exact match or a
// nested path — "/prototypes/paths/science-to-agents/" matches
// "/prototypes/paths"; "/prototypes/" does not match anything).
//
// /concepts/* splits PER SLUG (PRD R4′), so it is handled by a function over
// the committed allowlist/manifest (src/lib/concepts/indexState.ts), not a
// route prefix: the /concepts index is always indexable, each concept page
// follows the committed index state, unknown paths fail closed. Both the
// sitemap filter and the register-drift check call THIS function, so the
// per-slug split can never drift between them.
export function isNoindexPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  if (isConceptPath(normalized)) return isNoindexConceptPath(normalized);
  if (DIGEST_NOINDEX && isDigestPath(normalized)) return true;
  return NOINDEX_ROUTE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

function normalizePathname(pathname: string): string {
  return pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
}
