/**
 * Concept-page lastmod (PRD R4′): quantized to the WEEK FLOOR (UTC Monday
 * 00:00) of the concept's newest dated evidence — digest evidence dates, the
 * only day-resolution dates in the evidence model. The daily digest cron can
 * therefore move a concept URL's lastmod at most once per week, never en
 * masse per day; consecutive daily builds within the same week emit
 * byte-identical concept lastmods (asserted by
 * tests/concept-pages-stability.test.mjs).
 *
 * Deliberately separate from indexState.ts: lastmod is presentation metadata
 * derived from evidence, index state is a committed property — the two must
 * never share inputs.
 */
import { loadConcepts } from "../knowledge/conceptAliases.ts";
import { loadConceptAssignments } from "../knowledge/conceptAssignments.ts";
import {
  deriveConceptMembership,
  loadDigestDocs,
  loadExplorers,
} from "../knowledge/conceptMembership.ts";
import { CONCEPTS_ROUTE_PREFIX } from "./indexState.ts";

/** ISO datetime of the UTC Monday 00:00 on or before the given YYYY-MM-DD date. */
export function weekFloorUtc(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new Error(`weekFloorUtc: invalid date "${isoDate}"`);
  const daysSinceMonday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d.toISOString();
}

/** slug -> week-floored ISO lastmod; concepts without dated evidence are absent. */
export function computeConceptLastmods(
  evidence: ReadonlyMap<string, { digests: readonly { date?: string }[] }>,
): Map<string, string> {
  const lastmods = new Map<string, string>();
  for (const [slug, ev] of evidence) {
    const dates = ev.digests
      .map((d) => d.date)
      .filter((d): d is string => typeof d === "string" && d.length > 0)
      .sort();
    if (dates.length > 0) lastmods.set(slug, weekFloorUtc(dates[dates.length - 1]));
  }
  return lastmods;
}

let defaultLastmods: Map<string, string> | undefined;

function loadDefaultLastmods(): Map<string, string> {
  if (defaultLastmods === undefined) {
    const { evidence } = deriveConceptMembership({
      concepts: loadConcepts(),
      digests: loadDigestDocs(),
      explorers: loadExplorers(),
      assignments: loadConceptAssignments(),
    });
    defaultLastmods = computeConceptLastmods(evidence);
  }
  return defaultLastmods;
}

/**
 * Week-floored lastmod for a /concepts/<slug>/ pathname, or undefined for the
 * index page, unknown slugs, and concepts without dated evidence. Memoized
 * per process (the sitemap serializer calls it once per concept URL).
 */
export function conceptLastmodForPath(pathname: string): string | undefined {
  const normalized = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  if (!normalized.startsWith(`${CONCEPTS_ROUTE_PREFIX}/`)) return undefined;
  const slug = normalized.slice(CONCEPTS_ROUTE_PREFIX.length + 1);
  return loadDefaultLastmods().get(slug);
}
