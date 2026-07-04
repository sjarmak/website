// Pipeline home resolution for the concepts pipeline.
//
// The pipeline home holds review queues, conflict records, state, and the
// proposal inbox. It lives OUTSIDE the repo (default ~/.concepts-pipeline) so
// `git add -A` can never sweep proposal payloads into a commit. Resolution
// rejects any path inside the repo root outright.
//
// Module use:
//   import { resolvePipelineHome, ensurePipelineHome } from "./pipeline-home.mjs";
//   const home = await ensurePipelineHome();   // { root, reviewDir, ..., inboxPath }
//
// Override the location with CONCEPTS_PIPELINE_HOME.

import { access, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

// scripts/concepts/lib -> repo root. Deterministic and worktree-safe (each
// git worktree carries its own copy of this file at the same depth).
export const REPO_ROOT = path.resolve(MODULE_DIR, "..", "..", "..");

export const DEFAULT_PIPELINE_HOME = path.join(os.homedir(), ".concepts-pipeline");
export const SUBDIR_NAMES = ["review", "conflicts", "state"];
export const INBOX_FILENAME = "inbox.jsonl";

function isInside(parent, child) {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

// Resolve the pipeline home to an absolute path. Throws if the result lands
// inside the repo root — the caller gets an error, not a silent relocation.
export function resolvePipelineHome(env = process.env) {
  const raw = env.CONCEPTS_PIPELINE_HOME?.trim() || DEFAULT_PIPELINE_HOME;
  const resolved = path.resolve(raw);
  if (isInside(REPO_ROOT, resolved)) {
    throw new Error(
      `CONCEPTS_PIPELINE_HOME resolves to ${resolved}, which is inside the repo ` +
        `root ${REPO_ROOT}. The pipeline home must live outside the repo so ` +
        `\`git add -A\` can never reach proposal data. Point it somewhere else ` +
        `(default: ${DEFAULT_PIPELINE_HOME}).`,
    );
  }
  return resolved;
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

// Resolve the home and create any missing pieces (root, review/, conflicts/,
// state/, inbox.jsonl). Creation is logged — never silent.
export async function ensurePipelineHome(env = process.env, { log = console.error } = {}) {
  const root = resolvePipelineHome(env);
  const created = [];

  for (const dir of [root, ...SUBDIR_NAMES.map((name) => path.join(root, name))]) {
    if (!(await exists(dir))) {
      await mkdir(dir, { recursive: true });
      created.push(dir);
    }
  }

  const inboxPath = path.join(root, INBOX_FILENAME);
  if (!(await exists(inboxPath))) {
    await writeFile(inboxPath, "", { flag: "wx" });
    created.push(inboxPath);
  }

  if (created.length > 0) {
    log(`[concepts] created pipeline home resources: ${created.join(", ")}`);
  }

  return {
    root,
    reviewDir: path.join(root, "review"),
    conflictsDir: path.join(root, "conflicts"),
    stateDir: path.join(root, "state"),
    inboxPath,
    created,
  };
}
