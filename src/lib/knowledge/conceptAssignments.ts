/**
 * Concept assignments: immutable-id -> concept mapping over
 * src/data/knowledge/concept-assignments.json.
 *
 * Keys are immutable ids only — `paper:<bibcode>`, `digest:<slug>`,
 * `thread:<id>`, `vault:<id>`. Explorer-section slugs and digest facet
 * strings are NEVER stored as keys or foreign keys; section/facet membership
 * is derived at build time from the alias table.
 *
 * Zod-parsed here so shape drift fails CI (this module is imported by
 * scripts/knowledge/validate_concept_assignments.mjs, which runs ahead of
 * `astro check` and `astro build`).
 */
import { readFileSync } from "node:fs";
import { z } from "astro/zod";

export const CONCEPT_ASSIGNMENTS_PATH = "src/data/knowledge/concept-assignments.json";

/** Immutable-id key forms. The prefix set is closed; ids are non-empty. */
export const ASSIGNMENT_KEY_RE = /^(paper|digest|thread|vault):\S+$/;

/** Concept slugs are filenames in src/content/concepts — kebab-case. */
const CONCEPT_SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const assignmentSchema = z
  .object({
    concept: z.string().regex(CONCEPT_SLUG_RE, "concept must be a kebab-case slug"),
    takeaway: z.string().min(1).optional(),
  })
  .strict();

export const conceptAssignmentsSchema = z.record(
  z
    .string()
    .regex(
      ASSIGNMENT_KEY_RE,
      "key must be an immutable id: paper:<bibcode>, digest:<slug>, thread:<id>, or vault:<id>",
    ),
  assignmentSchema,
);

export type ConceptAssignment = z.infer<typeof assignmentSchema>;
export type ConceptAssignments = z.infer<typeof conceptAssignmentsSchema>;

/** Parse unknown data against the schema. Throws ZodError on shape drift. */
export function parseConceptAssignments(data: unknown): ConceptAssignments {
  return conceptAssignmentsSchema.parse(data);
}

/** Read + parse the committed assignments file (or an alternate path). */
export function loadConceptAssignments(path: string = CONCEPT_ASSIGNMENTS_PATH): ConceptAssignments {
  return parseConceptAssignments(JSON.parse(readFileSync(path, "utf8")));
}

/** Split an assignment key into its prefix and immutable id. */
export function splitAssignmentKey(key: string): { kind: "paper" | "digest" | "thread" | "vault"; id: string } {
  const match = key.match(/^(paper|digest|thread|vault):(.+)$/);
  if (!match) throw new Error(`invalid assignment key: "${key}"`);
  return { kind: match[1] as "paper" | "digest" | "thread" | "vault", id: match[2] };
}
