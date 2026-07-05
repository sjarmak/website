// Audit home resolution for the R14 LLM-bio audit.
//
// Reports live OUTSIDE the repo, in an audits/ subdir of the same
// out-of-repo pipeline home the concepts pipeline uses (default
// ~/.concepts-pipeline, overridable via CONCEPTS_PIPELINE_HOME). Reusing
// resolvePipelineHome keeps the in-repo-path rejection: `git add -A` can
// never sweep an audit report into a commit.

import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { resolvePipelineHome } from "../../concepts/lib/pipeline-home.mjs";

export const AUDITS_SUBDIR = "audits";

// Resolve <pipeline-home>/audits without touching the filesystem. Throws if
// the pipeline home resolves inside the repo root.
export function resolveAuditHome(env = process.env) {
  return path.join(resolvePipelineHome(env), AUDITS_SUBDIR);
}

// Resolve and create the audits dir if missing. Creation is logged.
export async function ensureAuditHome(env = process.env, { log = console.error } = {}) {
  const dir = resolveAuditHome(env);
  try {
    await access(dir);
  } catch {
    await mkdir(dir, { recursive: true });
    log(`[audit] created audit home: ${dir}`);
  }
  return dir;
}
