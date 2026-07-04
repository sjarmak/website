#!/usr/bin/env node
// Stage 1 of the vault-to-site pull: opt-in candidate scan.
// MANUAL-INVOCATION-ONLY and unscheduled — no cron path invokes this, and
// tests/concepts-pull.test.mjs greps to keep it structurally unschedulable.
//
// Scans the INJECTED vault root (--vault-root or CONCEPTS_VAULT_ROOT — there
// is no default) for notes carrying the opt-in frontmatter marker or living
// in the export folder (scripts/concepts/pull/config.mjs). Everything else in
// the vault is invisible. Paths matching scripts/concepts/exclusions.json are
// hard-excluded even when marked.
//
// Writes ONLY to the pipeline home (outside the repo — pipeline-home.mjs
// rejects in-repo homes): state/pull-candidates.json for the LLM stage plus a
// human-readable review/pull-preview.md. Nothing under src/ or any committed
// path is touched; committed changes happen only via apply.mjs.
//
// Usage:
//   node scripts/concepts/pull/prep.mjs --vault-root <dir>

import path from "node:path";
import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { ensurePipelineHome } from "../lib/pipeline-home.mjs";
import { loadExclusions } from "../lib/exclusions.mjs";
import {
  EXIT_NOOP,
  EXPORT_FOLDER_NAME,
  OPT_IN_KEY,
  OPT_IN_VALUE,
  PULL_CANDIDATES_FILENAME,
  PULL_PREVIEW_FILENAME,
  resolveVaultRoot,
} from "./config.mjs";
import { scanVault } from "./vault-scan.mjs";

const PREVIEW_CONTEXT_CHARS = 240;

function renderPreview(candidates) {
  const lines = [
    "# Pull candidates — review preview",
    "",
    `Opt-in rule: frontmatter \`${OPT_IN_KEY}: ${OPT_IN_VALUE}\` or a path under \`${EXPORT_FOLDER_NAME}/\`.`,
    "The excerpt below is the context the LLM stage will use to propose takeaways.",
    "This file lives in the pipeline home and is never committed.",
    "",
  ];
  for (const c of candidates) {
    const excerpt = c.body.slice(0, PREVIEW_CONTEXT_CHARS).replace(/\s+/g, " ").trim();
    lines.push(
      `## ${c.title}`,
      "",
      `- id: \`vault:${c.id}\``,
      `- opted in via: ${c.via}`,
      `- proposed-takeaway context: ${excerpt}${c.body.length > PREVIEW_CONTEXT_CHARS ? " …" : ""}`,
      "",
    );
  }
  return lines.join("\n");
}

async function main() {
  const { values } = parseArgs({
    options: {
      "vault-root": { type: "string" },
    },
  });
  const vaultRoot = resolveVaultRoot(values["vault-root"]);

  const home = await ensurePipelineHome();
  const patterns = await loadExclusions();
  const candidates = await scanVault(vaultRoot, patterns);

  if (candidates.length === 0) {
    console.log("[pull-prep] no opted-in notes found — nothing to do");
    return EXIT_NOOP;
  }

  const candidatesPath = path.join(home.stateDir, PULL_CANDIDATES_FILENAME);
  await writeFile(
    candidatesPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), candidates }, null, 2) + "\n",
    "utf8",
  );

  const previewPath = path.join(home.reviewDir, PULL_PREVIEW_FILENAME);
  await writeFile(previewPath, renderPreview(candidates), "utf8");

  console.log(
    `[pull-prep] ${candidates.length} candidate(s) -> ${candidatesPath}; preview -> ${previewPath}`,
  );
  console.log("[pull-prep] next: node scripts/concepts/pull/assign.mjs (manual)");
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(`[pull-prep] ${err.message}`);
    process.exit(1);
  },
);
