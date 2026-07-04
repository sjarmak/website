/**
 * Concept-page index state (PRD R4′) — the committed allowlist IS the index
 * state. A /concepts/<slug> page is indexable iff:
 *
 *   - its slug is in src/data/concepts-allowlist.json (`slugs`), OR
 *   - its slug is approved in src/data/concepts-authored-manifest.json AND its
 *     concept file has a non-empty Markdown body (both are committed, human
 *     properties — an agent-committed body without a manifest entry never
 *     flips index state).
 *
 * Derived evidence data plays NO part here, so a build can never flip a
 * page's index state — only a commit can. The ≥5-dated-evidence floor lives
 * exclusively in scripts/knowledge/propose_concept_allowlist.mjs.
 *
 * Consumed by src/lib/register.ts (`isNoindexPath` — the single noindex
 * source of truth behind the sitemap filter AND the register-drift check),
 * the /concepts routes, and tests. Reads fs directly (no astro:content) so
 * the same module works in the Astro build, astro.config.mjs, plain node
 * scripts, and node --test.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const CONCEPTS_ALLOWLIST_PATH = "src/data/concepts-allowlist.json";
export const AUTHORED_MANIFEST_PATH = "src/data/concepts-authored-manifest.json";
export const CONCEPTS_CONTENT_DIR = "src/content/concepts";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---/;

export interface AuthoredApproval {
  approvedBy: string;
  date: string;
}

/** Load + validate the committed allowlist. Throws on any malformed entry. */
export function loadConceptAllowlist(path: string = CONCEPTS_ALLOWLIST_PATH): string[] {
  const data = JSON.parse(readFileSync(path, "utf8")) as { slugs?: unknown };
  if (!Array.isArray(data.slugs)) {
    throw new Error(`${path}: \`slugs\` must be an array`);
  }
  const seen = new Set<string>();
  for (const slug of data.slugs) {
    if (typeof slug !== "string" || !SLUG_RE.test(slug)) {
      throw new Error(`${path}: invalid slug ${JSON.stringify(slug)}`);
    }
    if (seen.has(slug)) throw new Error(`${path}: duplicate slug "${slug}"`);
    seen.add(slug);
  }
  return data.slugs as string[];
}

/** Load + validate the authored-body manifest. Throws on malformed entries. */
export function loadAuthoredManifest(
  path: string = AUTHORED_MANIFEST_PATH,
): Record<string, AuthoredApproval> {
  const data = JSON.parse(readFileSync(path, "utf8")) as { approved?: unknown };
  if (data.approved === null || typeof data.approved !== "object" || Array.isArray(data.approved)) {
    throw new Error(`${path}: \`approved\` must be an object`);
  }
  const approved = data.approved as Record<string, unknown>;
  for (const [slug, entry] of Object.entries(approved)) {
    if (!SLUG_RE.test(slug)) throw new Error(`${path}: invalid approved slug "${slug}"`);
    const record = entry as Partial<AuthoredApproval> | null;
    if (
      record === null ||
      typeof record !== "object" ||
      typeof record.approvedBy !== "string" ||
      typeof record.date !== "string"
    ) {
      throw new Error(`${path}: approved.${slug} must carry \`approvedBy\` and \`date\` strings`);
    }
  }
  return approved as Record<string, AuthoredApproval>;
}

/** True when the concept's Markdown file exists and has a non-empty body. */
export function conceptBodyIsNonEmpty(slug: string, dir: string = CONCEPTS_CONTENT_DIR): boolean {
  const path = join(dir, `${slug}.md`);
  if (!existsSync(path)) return false;
  const body = readFileSync(path, "utf8").replace(FRONTMATTER_RE, "");
  return body.trim().length > 0;
}

export interface IndexStateInputs {
  allowlist: readonly string[];
  manifest: Readonly<Record<string, AuthoredApproval>>;
  bodyIsNonEmpty: (slug: string) => boolean;
}

/** Pure core: committed allowlist OR (human-approved manifest entry AND body). */
export function computeConceptIndexable(slug: string, inputs: IndexStateInputs): boolean {
  if (inputs.allowlist.includes(slug)) return true;
  return slug in inputs.manifest && inputs.bodyIsNonEmpty(slug);
}

let defaultInputs: IndexStateInputs | undefined;

function loadDefaultInputs(): IndexStateInputs {
  defaultInputs ??= {
    allowlist: loadConceptAllowlist(),
    manifest: loadAuthoredManifest(),
    bodyIsNonEmpty: conceptBodyIsNonEmpty,
  };
  return defaultInputs;
}

/** Indexability against the committed repo state (memoized per process). */
export function isIndexableConcept(slug: string): boolean {
  return computeConceptIndexable(slug, loadDefaultInputs());
}

// ---- route mapping (consumed by register.ts / sitemap filter / drift check) ----

export const CONCEPTS_ROUTE_PREFIX = "/concepts";

/** True for /concepts and anything beneath it (expects a normalized pathname, no trailing slash). */
export function isConceptPath(normalizedPathname: string): boolean {
  return (
    normalizedPathname === CONCEPTS_ROUTE_PREFIX ||
    normalizedPathname.startsWith(`${CONCEPTS_ROUTE_PREFIX}/`)
  );
}

/**
 * Noindex decision for a normalized /concepts pathname: the index page (the
 * DefinedTermSet's stable URL) is always indexable; a concept page follows
 * the committed index state; anything deeper/unknown fails CLOSED (noindex).
 */
export function isNoindexConceptPath(normalizedPathname: string): boolean {
  if (normalizedPathname === CONCEPTS_ROUTE_PREFIX) return false;
  const rest = normalizedPathname.slice(CONCEPTS_ROUTE_PREFIX.length + 1);
  if (!SLUG_RE.test(rest)) return true;
  return !isIndexableConcept(rest);
}
