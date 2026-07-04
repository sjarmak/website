// Configuration constants for the vault-to-site pull pipeline
// (scripts/concepts/pull/{prep,assign,apply}.mjs).
//
// Manual-invocation-only: no cron flag, no scheduler path, and nothing under
// scripts/digest or scripts/knowledge references these entrypoints — a test
// (tests/concepts-pull.test.mjs) greps to keep it that way.

// Opt-in frontmatter marker. A vault note is visible to the pipeline ONLY if
// its frontmatter carries `site-graph: opt-in` (key and value configurable
// here, in one place) or it lives under the export folder below. Everything
// else in the vault is invisible.
export const OPT_IN_KEY = "site-graph";
export const OPT_IN_VALUE = "opt-in";

// Alternative opt-in: any note under a folder with this exact segment name.
export const EXPORT_FOLDER_NAME = "site-export";

// Pipeline-home file names (state/ holds machine state, review/ holds
// human-facing material — see scripts/concepts/lib/pipeline-home.mjs).
export const PULL_CANDIDATES_FILENAME = "pull-candidates.json";
export const PULL_PREVIEW_FILENAME = "pull-preview.md";
export const PULL_EDGES_FILENAME = "pull-edges.json";
export const PULL_REJECTED_FILENAME = "pull-rejected.json";
export const PULL_APPLIED_MANIFEST_FILENAME = "pull-applied-manifest.json";

// Takeaway guard limits (see guards.mjs).
export const TAKEAWAY_MAX_CHARS = 300;
export const MAX_QUOTED_WORDS = 8;

// Clean no-op exit code — same convention as the backfill pipeline
// (scripts/knowledge/concepts_common.mjs EXIT_NOOP).
export const EXIT_NOOP = 3;

// Resolve the injected vault root. NO default — the pipeline must never guess
// at a real vault location; tests inject synthetic fixture vaults.
export function resolveVaultRoot(cliValue, env = process.env) {
  const raw = cliValue?.trim() || env.CONCEPTS_VAULT_ROOT?.trim();
  if (!raw) {
    throw new Error(
      "no vault root: pass --vault-root <dir> or set CONCEPTS_VAULT_ROOT. " +
        "There is deliberately no default.",
    );
  }
  return raw;
}
