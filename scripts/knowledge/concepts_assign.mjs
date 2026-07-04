#!/usr/bin/env node
// Stage 2 of the concepts backfill: LLM canonicalization/assignment pass.
// On-demand and unscheduled — no cron path invokes this.
//
// Reads state/backfill-candidates.json from the pipeline home, asks the model
// (versioned prompt template, prompts/concepts-assign.v<N>.md) to decide each
// candidate, then mechanically validates the decisions:
//   - "assign" to an EXISTING concept slug -> proposed assignment rows in
//     review/backfill-assignments.json (immutable ids only; awaiting
//     concepts_validate.mjs)
//   - "alias" / "new-concept"              -> proposals appended to the shared
//     inbox (scripts/concepts/lib/inbox.mjs) — never the repo
// Nothing under the repo is written by this stage.
//
// The LLM invocation is injectable: --llm-cmd or CONCEPTS_LLM_CMD overrides
// the default `claude-auto -p` (the repo's headless-claude pattern; see
// scripts/digest/run.sh). The command runs via `sh -c`, receives the prompt
// on stdin, and must print the decisions JSON on stdout. A failed or killed
// command aborts BEFORE any write.
//
// Usage:
//   node scripts/knowledge/concepts_assign.mjs [--llm-cmd CMD] [--prompt FILE] [--concepts-dir D]

import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { ensurePipelineHome } from "../concepts/lib/pipeline-home.mjs";
import { appendProposal } from "../concepts/lib/inbox.mjs";
import { loadConcepts } from "../../src/lib/knowledge/conceptAliases.ts";
import {
  ASSIGNABLE_KINDS,
  ASSIGNMENTS_FILENAME,
  CANDIDATES_FILENAME,
  DEFAULT_CONCEPTS_DIR,
  readJson,
  writeJson,
} from "./concepts_common.mjs";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PROMPT = path.join(MODULE_DIR, "prompts", "concepts-assign.v1.md");
const DEFAULT_LLM_CMD = "claude-auto -p";
const ACTIONS = new Set(["assign", "alias", "new-concept"]);

function promptVersion(promptPath) {
  const match = path.basename(promptPath).match(/\.v(\d+)\.md$/);
  if (!match) {
    throw new Error(`prompt template ${promptPath} is not versioned — expected a .v<N>.md filename`);
  }
  return `v${match[1]}`;
}

// Run the (injectable) LLM command: prompt on stdin, decisions JSON on stdout.
function runLlm(llmCmd, prompt) {
  const result = spawnSync("sh", ["-c", llmCmd], {
    input: prompt,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error) throw new Error(`LLM command failed to start: ${result.error.message}`);
  if (result.signal) throw new Error(`LLM command killed by signal ${result.signal} — aborting, nothing written`);
  if (result.status !== 0) {
    throw new Error(`LLM command exited ${result.status} — aborting, nothing written\n${result.stderr ?? ""}`);
  }
  return result.stdout;
}

// LLMs routinely wrap JSON in a markdown fence despite instructions; strip a
// single outer fence, then parse strictly — anything else is a hard error.
function parseDecisions(stdout) {
  const text = stdout.trim().replace(/^```(?:json)?\s*\n([\s\S]*?)\n```$/m, "$1");
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`LLM output is not valid JSON (${err.message}) — aborting, nothing written`);
  }
  if (!Array.isArray(parsed.decisions)) throw new Error("LLM output missing `decisions` array");
  return parsed.decisions;
}

// Structural validation only — the semantic choices are the model's (ZFC).
function validateDecisions(decisions, candidates, conceptSlugs) {
  const byFacet = new Map(candidates.map((c) => [c.facet, c]));
  const decided = new Set();
  for (const d of decisions) {
    const ctx = `decision for facet ${JSON.stringify(d.facet)}`;
    if (typeof d.facet !== "string" || !byFacet.has(d.facet)) throw new Error(`${ctx}: unknown candidate facet`);
    if (decided.has(d.facet)) throw new Error(`${ctx}: duplicate decision`);
    decided.add(d.facet);
    if (!ACTIONS.has(d.action)) throw new Error(`${ctx}: unknown action ${JSON.stringify(d.action)}`);
    if (d.action === "assign" || d.action === "alias") {
      if (!conceptSlugs.has(d.concept)) {
        throw new Error(`${ctx}: ${JSON.stringify(d.concept)} is not in the controlled vocabulary`);
      }
    }
    if (d.action === "assign") {
      const candidate = byFacet.get(d.facet);
      if (!candidate.sources.some((s) => ASSIGNABLE_KINDS.has(s.kind))) {
        throw new Error(`${ctx}: no digest/thread source — explorer-only facets must be alias or new-concept`);
      }
    }
    if (d.action === "new-concept") {
      if (typeof d.label !== "string" || !d.label.trim()) throw new Error(`${ctx}: new-concept requires a label`);
      if (typeof d.definition !== "string" || !d.definition.trim()) {
        throw new Error(`${ctx}: new-concept requires a definition`);
      }
    }
  }
  for (const facet of byFacet.keys()) {
    if (!decided.has(facet)) throw new Error(`no decision for candidate facet ${JSON.stringify(facet)}`);
  }
}

// Expand assign decisions into immutable-id assignment rows.
function assignmentRows(decisions, candidates) {
  const byFacet = new Map(candidates.map((c) => [c.facet, c]));
  const rows = [];
  for (const d of decisions) {
    if (d.action !== "assign") continue;
    for (const source of byFacet.get(d.facet).sources) {
      if (!ASSIGNABLE_KINDS.has(source.kind)) continue;
      rows.push({ id: `${source.kind}:${source.id}`, concept: d.concept, facet: d.facet });
    }
  }
  return rows.sort((a, b) => a.id.localeCompare(b.id) || a.concept.localeCompare(b.concept));
}

async function main() {
  const { values } = parseArgs({
    options: {
      "llm-cmd": { type: "string" },
      prompt: { type: "string", default: DEFAULT_PROMPT },
      "concepts-dir": { type: "string", default: DEFAULT_CONCEPTS_DIR },
    },
  });
  const llmCmd = values["llm-cmd"] ?? process.env.CONCEPTS_LLM_CMD?.trim() ?? DEFAULT_LLM_CMD;
  const version = promptVersion(values.prompt);

  const home = await ensurePipelineHome();
  const candidatesPath = path.join(home.stateDir, CANDIDATES_FILENAME);
  let candidatesFile;
  try {
    candidatesFile = await readJson(candidatesPath);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    throw new Error(`no candidates at ${candidatesPath} — run concepts_prep.mjs first`);
  }
  const { candidates, stats } = candidatesFile;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error(`${candidatesPath}: no candidates — run concepts_prep.mjs first`);
  }

  const concepts = loadConcepts(values["concepts-dir"]);
  const vocabulary = concepts.map(({ slug, label, aliases, definition }) => ({ slug, label, aliases, definition }));
  const template = await readFile(values.prompt, "utf8");
  const prompt = template
    .replaceAll("{{VOCABULARY_JSON}}", JSON.stringify(vocabulary, null, 2))
    .replaceAll("{{CANDIDATES_JSON}}", JSON.stringify(candidates, null, 2));

  console.log(`[concepts-assign] ${candidates.length} candidate(s), prompt ${version}, via: ${llmCmd}`);
  const decisions = parseDecisions(runLlm(llmCmd, prompt));
  validateDecisions(decisions, candidates, new Set(concepts.map((c) => c.slug)));

  // All validation passed — only now write (pipeline home only, never the repo).
  const assignments = assignmentRows(decisions, candidates);
  const counts = {
    assign: decisions.filter((d) => d.action === "assign").length,
    alias: decisions.filter((d) => d.action === "alias").length,
    newConcept: decisions.filter((d) => d.action === "new-concept").length,
    assignments: assignments.length,
  };
  const assignmentsPath = path.join(home.reviewDir, ASSIGNMENTS_FILENAME);
  await writeJson(assignmentsPath, {
    generatedAt: new Date().toISOString(),
    promptVersion: version,
    facetResolution: { resolved: stats.facetsResolved, total: stats.facetsSeen },
    counts,
    assignments,
  });

  const byFacet = new Map(candidates.map((c) => [c.facet, c]));
  for (const d of decisions) {
    if (d.action === "assign") continue;
    await appendProposal(home.inboxPath, {
      source: "backfill",
      kind: d.action === "alias" ? "alias" : "new-concept",
      payload: {
        facet: d.facet,
        ...(d.action === "alias" ? { concept: d.concept } : { label: d.label, definition: d.definition }),
        ...(d.topic !== undefined ? { topic: d.topic } : {}),
        reason: d.reason ?? "",
        variants: byFacet.get(d.facet).variants,
        sources: byFacet.get(d.facet).sources,
      },
    });
  }

  console.log(
    `[concepts-assign] ${counts.assignments} assignment row(s) -> ${assignmentsPath}; ` +
      `${counts.alias} alias + ${counts.newConcept} new-concept proposal(s) -> ${home.inboxPath}`,
  );
  console.log("[concepts-assign] next: node scripts/knowledge/concepts_validate.mjs (then --apply)");
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(`[concepts-assign] ${err.message}`);
    process.exit(1);
  },
);
