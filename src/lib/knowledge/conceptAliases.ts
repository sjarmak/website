/**
 * Canonical concept vocabulary: loading, cross-entry validation, and
 * facet-string canonicalization over src/content/concepts/.
 *
 * Reads frontmatter directly (fs + yaml) rather than astro:content so the
 * same module works inside the Astro build, in node scripts
 * (scripts/knowledge/validate-concepts.mjs), and under node --test.
 */
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { parse } from "yaml";

export interface ConceptEntry {
  /** Canonical slug — the filename without extension. */
  slug: string;
  label: string;
  aliases: string[];
  definition: string;
  topic?: string;
  related: string[];
}

export const CONCEPTS_DIR = "src/content/concepts";

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

/** Normalize a facet/alias string to slug form: lowercase, hyphen-separated. */
export function normalizeFacet(facet: string): string {
  return facet
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function asStringArray(value: unknown, slug: string, field: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
    throw new Error(`concepts/${slug}: \`${field}\` must be an array of strings`);
  }
  return value as string[];
}

/** Load every concept entry from the registry directory. */
export function loadConcepts(dir: string = CONCEPTS_DIR): ConceptEntry[] {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .sort();
  return files.map((file) => {
    const slug = basename(file).replace(/\.(md|mdx)$/, "");
    const raw = readFileSync(join(dir, file), "utf8");
    const match = raw.match(FRONTMATTER_RE);
    if (!match) throw new Error(`concepts/${slug}: missing frontmatter block`);
    const fm = parse(match[1]) as Record<string, unknown>;
    if (typeof fm.label !== "string" || !fm.label.trim()) {
      throw new Error(`concepts/${slug}: \`label\` is required`);
    }
    if (typeof fm.definition !== "string" || !fm.definition.trim()) {
      throw new Error(`concepts/${slug}: \`definition\` is required`);
    }
    if (fm.topic !== undefined && typeof fm.topic !== "string") {
      throw new Error(`concepts/${slug}: \`topic\` must be a string reference`);
    }
    return {
      slug,
      label: fm.label,
      aliases: asStringArray(fm.aliases, slug, "aliases"),
      definition: fm.definition,
      topic: fm.topic as string | undefined,
      related: asStringArray(fm.related, slug, "related"),
    };
  });
}

/**
 * Build the facet -> canonical-slug index. Keys are the normalized slug,
 * label, and aliases of every entry. Throws when two entries claim the same
 * key — this is the cross-entry duplicate-alias/label gate that per-entry
 * Zod cannot express.
 */
export function buildConceptIndex(entries: readonly ConceptEntry[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const entry of entries) {
    const keys = new Set([entry.slug, normalizeFacet(entry.label), ...entry.aliases.map(normalizeFacet)]);
    for (const key of keys) {
      if (!key) throw new Error(`concepts/${entry.slug}: alias/label normalizes to an empty string`);
      const owner = index.get(key);
      if (owner !== undefined && owner !== entry.slug) {
        throw new Error(
          `duplicate concept alias "${key}": claimed by both concepts/${owner} and concepts/${entry.slug}`,
        );
      }
      index.set(key, entry.slug);
    }
  }
  return index;
}

let defaultIndex: Map<string, string> | undefined;

/**
 * Canonicalize a facet/alias string against the committed registry.
 * Returns the canonical concept slug, or null when the facet is not part of
 * the vocabulary.
 */
export function canonicalConceptSlug(facet: string): string | null {
  defaultIndex ??= buildConceptIndex(loadConcepts());
  return defaultIndex.get(normalizeFacet(facet)) ?? null;
}
