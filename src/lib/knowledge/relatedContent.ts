/**
 * Related-content derivation for the "Related" blocks (PRD R5).
 *
 * Every relation is DERIVED at build time from committed frontmatter through
 * the concept alias table — nothing here stores or hardcodes an edge:
 *
 * - posts   -> concepts via `tags` (drafts excluded — they are not built)
 * - projects-> concepts via `topics` + `tags`
 * - talks   -> concepts via the outputs entry with the SAME slug (mechanical
 *              filename join; a talk with no matching output resolves nothing)
 *
 * Reads fs + yaml (not astro:content) so the same module works inside the
 * Astro build and under node --test, mirroring conceptMembership.ts.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { canonicalConceptSlug, loadConcepts } from "./conceptAliases.ts";
import { parseFrontmatterBlock } from "./conceptMembership.ts";

export const POSTS_DIR = "src/content/posts";
export const PROJECTS_DIR = "src/content/projects";
export const TALKS_DIR = "src/content/talks";
export const OUTPUTS_DIR = "src/content/outputs";

/** Max related content items rendered per kind (deterministic strongest-first). */
export const RELATED_ITEM_CAP = 4;

export type RelatedKind = "essay" | "talk" | "project";

/** A content doc reduced to what related-block rendering needs. */
export interface RelatedDoc {
  kind: RelatedKind;
  /** Collection entry id (the filename slug). */
  id: string;
  title: string;
  /** Site-relative page url (talks deep-link the index entry anchor). */
  url: string;
  /** Resolved concept slugs, deduped + sorted. */
  concepts: string[];
}

export type FacetResolver = (facet: string) => string | null;

/** Alias-resolve facet strings to concept slugs: dedupe, drop unknowns, sort. */
export function resolveConcepts(
  facets: readonly string[],
  resolve: FacetResolver = canonicalConceptSlug,
): string[] {
  const slugs = new Set<string>();
  for (const facet of facets) {
    const slug = resolve(facet);
    if (slug !== null) slugs.add(slug);
  }
  return [...slugs].sort();
}

function contentSlugs(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .sort()
    .map((f) => basename(f).replace(/\.(md|mdx)$/, ""));
}

function readFrontmatter(dir: string, slug: string): Record<string, unknown> {
  const path = [join(dir, `${slug}.md`), join(dir, `${slug}.mdx`)].find(existsSync);
  if (path === undefined) throw new Error(`${dir}/${slug}: content file not found`);
  return parseFrontmatterBlock(readFileSync(path, "utf8"), `${dir}/${slug}`);
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)) : [];
}

function requireTitle(fm: Record<string, unknown>, context: string): string {
  if (typeof fm.title !== "string" || !fm.title.trim()) {
    throw new Error(`${context}: \`title\` is required`);
  }
  return fm.title;
}

/** On-site posts (essays). Drafts are excluded — they have no built page. */
export function loadPostDocs(dir: string = POSTS_DIR, resolve?: FacetResolver): RelatedDoc[] {
  const docs: RelatedDoc[] = [];
  for (const slug of contentSlugs(dir)) {
    const fm = readFrontmatter(dir, slug);
    if (fm.draft === true) continue;
    docs.push({
      kind: "essay",
      id: slug,
      title: requireTitle(fm, `posts/${slug}`),
      url: `/writing/${slug}`,
      concepts: resolveConcepts(stringList(fm.tags), resolve),
    });
  }
  return docs;
}

/** Projects: concepts from topic references + tags. */
export function loadProjectDocs(dir: string = PROJECTS_DIR, resolve?: FacetResolver): RelatedDoc[] {
  return contentSlugs(dir).map((slug) => {
    const fm = readFrontmatter(dir, slug);
    return {
      kind: "project",
      id: slug,
      title: requireTitle(fm, `projects/${slug}`),
      url: `/projects/${slug}`,
      concepts: resolveConcepts([...stringList(fm.topics), ...stringList(fm.tags)], resolve),
    };
  });
}

/**
 * Talks: joined to the outputs entry with the identical slug (talks carry no
 * facet frontmatter of their own). Talks without a matching output resolve
 * zero concepts. Url deep-links the per-talk anchor on the talks index.
 */
export function loadTalkDocs(
  talksDir: string = TALKS_DIR,
  outputsDir: string = OUTPUTS_DIR,
  resolve?: FacetResolver,
): RelatedDoc[] {
  const outputTopics = new Map<string, string[]>();
  for (const slug of contentSlugs(outputsDir)) {
    outputTopics.set(slug, stringList(readFrontmatter(outputsDir, slug).topics));
  }
  return contentSlugs(talksDir).map((slug) => {
    const fm = readFrontmatter(talksDir, slug);
    return {
      kind: "talk",
      id: slug,
      title: requireTitle(fm, `talks/${slug}`),
      url: `/talks/#${slug}`,
      concepts: resolveConcepts(outputTopics.get(slug) ?? [], resolve),
    };
  });
}

/** All related-linkable content docs that resolved at least one concept. */
export function loadRelatedDocs(): RelatedDoc[] {
  return [...loadPostDocs(), ...loadTalkDocs(), ...loadProjectDocs()].filter(
    (doc) => doc.concepts.length > 0,
  );
}

export interface RelatedExclude {
  kind: RelatedKind;
  id: string;
}

/**
 * Content docs sharing ≥1 concept with `concepts`, excluding the source doc
 * itself, ordered by shared-concept count desc then title asc, capped at
 * RELATED_ITEM_CAP per kind. Pure and deterministic.
 */
export function relatedItems(
  concepts: readonly string[],
  docs: readonly RelatedDoc[],
  exclude?: RelatedExclude,
  cap: number = RELATED_ITEM_CAP,
): RelatedDoc[] {
  const wanted = new Set(concepts);
  const scored = docs
    .filter((doc) => !(exclude !== undefined && doc.kind === exclude.kind && doc.id === exclude.id))
    .map((doc) => ({ doc, shared: doc.concepts.filter((c) => wanted.has(c)).length }))
    .filter(({ shared }) => shared > 0)
    .sort((a, b) => b.shared - a.shared || a.doc.title.localeCompare(b.doc.title));

  const perKind = new Map<RelatedKind, number>();
  const kept: RelatedDoc[] = [];
  for (const { doc } of scored) {
    const n = perKind.get(doc.kind) ?? 0;
    if (n >= cap) continue;
    perKind.set(doc.kind, n + 1);
    kept.push(doc);
  }
  return kept;
}

let labelCache: Map<string, string> | undefined;

/** Concept slug -> display label (cached read of the committed registry). */
export function conceptLabel(slug: string): string {
  labelCache ??= new Map(loadConcepts().map((c) => [c.slug, c.label]));
  const label = labelCache.get(slug);
  if (label === undefined) throw new Error(`conceptLabel: unknown concept slug "${slug}"`);
  return label;
}
