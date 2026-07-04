// Deep-link node resolution for the graph explorer island.
// Side-effect free so it can be unit tested under node --test.

/** The minimum node shape resolution needs. */
export interface DeepLinkNode {
  type: string;
}

export const CONCEPT_PARAM_PREFIX = "concept:";

/**
 * Resolve a `?node=` query param to a node id in the supplied graph.
 *
 * - An exact node-id match always wins (the /projects/explorer behavior,
 *   unchanged).
 * - `concept:<slug>` resolves to the bare slug ONLY when that node exists and
 *   is of type "concept". Concept node ids are bare slugs, but the same slug
 *   can name a topic node on /projects/explorer — the type check keeps the
 *   prefix inert there.
 * - Anything else resolves to null (no selection).
 */
export function resolveNodeParam(
  param: string,
  byId: ReadonlyMap<string, DeepLinkNode>,
): string | null {
  if (byId.has(param)) return param;
  if (param.startsWith(CONCEPT_PARAM_PREFIX)) {
    const slug = param.slice(CONCEPT_PARAM_PREFIX.length);
    if (byId.get(slug)?.type === "concept") return slug;
  }
  return null;
}
