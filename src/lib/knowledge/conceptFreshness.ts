/**
 * Per-concept digest freshness: how many of the corpus's digest issues carry
 * this concept (alias-aware — callers pass the derived `evidence.digests`
 * list from conceptMembership), and the most recent tag date.
 *
 * No node: imports — this module is shared by the Astro build (fallback list)
 * and the client island (detail panel).
 */

export interface ConceptFreshness {
  /** Digest issues tagged with this concept (alias-aware). */
  tagged: number;
  /** Total digest issues in the corpus. */
  total: number;
  /** Most recent tag date (YYYY-MM-DD), or null when none carry a date. */
  mostRecent: string | null;
}

/** Compute freshness from a concept's derived digest evidence. */
export function computeConceptFreshness(
  digests: readonly { date?: string }[],
  totalDigests: number,
): ConceptFreshness {
  const dates = digests
    .map((d) => d.date)
    .filter((d): d is string => typeof d === "string" && d.length > 0)
    .sort();
  return {
    tagged: digests.length,
    total: totalDigests,
    mostRecent: dates.length > 0 ? dates[dates.length - 1] : null,
  };
}

/** "tagged in N of M digest issues, most recently YYYY-MM-DD" */
export function formatFreshnessLine(f: ConceptFreshness): string {
  const base = `tagged in ${f.tagged} of ${f.total} digest issues`;
  return f.tagged > 0 && f.mostRecent !== null ? `${base}, most recently ${f.mostRecent}` : base;
}
