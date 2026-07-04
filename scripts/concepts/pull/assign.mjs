#!/usr/bin/env node
// Stage 2 of the vault-to-site pull: LLM edge-proposal pass.
// MANUAL-INVOCATION-ONLY and unscheduled — no cron path invokes this.
//
// Reads state/pull-candidates.json from the pipeline home and asks the model
// (versioned prompt, prompts/pull-assign.v<N>.md) to propose
// vault:<id> -> {concept, takeaway} edges against the EXISTING controlled
// vocabulary only. The LLM invocation is injectable: --llm-cmd or
// CONCEPTS_PULL_LLM_CMD (same pattern as scripts/knowledge/concepts_assign.mjs);
// the command runs via `sh -c`, receives the prompt on stdin, and must print
// the edges JSON on stdout. A failed command aborts BEFORE any write.
//
// Output is schema-validated; takeaways then pass the mechanical guards
// (guards.mjs): length cap, >8-contiguous-word quote check against the note
// body, and the injection boundary (URLs, markdown links, instruction-like
// lines). Violations are REJECTED to review/pull-rejected.json — they never
// reach the apply payload. Accepted edges go to review/pull-edges.json,
// awaiting the human-confirmed apply step.
//
// Writes ONLY to the pipeline home. Nothing under src/ or any committed path.
//
// Usage:
//   node scripts/concepts/pull/assign.mjs [--llm-cmd CMD] [--prompt FILE] [--concepts-dir D]

import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { ensurePipelineHome } from "../lib/pipeline-home.mjs";
import { loadConcepts } from "../../../src/lib/knowledge/conceptAliases.ts";
import { findTakeawayViolation } from "./guards.mjs";
import {
  PULL_CANDIDATES_FILENAME,
  PULL_EDGES_FILENAME,
  PULL_REJECTED_FILENAME,
} from "./config.mjs";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PROMPT = path.join(MODULE_DIR, "prompts", "pull-assign.v1.md");
const DEFAULT_CONCEPTS_DIR = path.resolve(MODULE_DIR, "..", "..", "..", "src", "content", "concepts");
const DEFAULT_LLM_CMD = "claude-auto -p";

function promptVersion(promptPath) {
  const match = path.basename(promptPath).match(/\.v(\d+)\.md$/);
  if (!match) {
    throw new Error(`prompt template ${promptPath} is not versioned — expected a .v<N>.md filename`);
  }
  return `v${match[1]}`;
}

// Run the (injectable) LLM command: prompt on stdin, edges JSON on stdout.
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
function parseEdges(stdout) {
  const text = stdout.trim().replace(/^```(?:json)?\s*\n([\s\S]*?)\n```$/m, "$1");
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`LLM output is not valid JSON (${err.message}) — aborting, nothing written`);
  }
  if (!Array.isArray(parsed.edges)) throw new Error("LLM output missing `edges` array");
  return parsed.edges;
}

// Structural schema validation — hard abort on any violation (the semantic
// takeaway-content guards run per-edge afterwards and reject, not abort).
function validateEdgeShape(edges, candidatesById, conceptSlugs) {
  const seen = new Set();
  for (const edge of edges) {
    const ctx = `edge for id ${JSON.stringify(edge.id)}`;
    if (typeof edge.id !== "string" || !candidatesById.has(edge.id)) {
      throw new Error(`${ctx}: unknown candidate id`);
    }
    if (typeof edge.concept !== "string" || !conceptSlugs.has(edge.concept)) {
      throw new Error(
        `${ctx}: ${JSON.stringify(edge.concept)} is not in the existing controlled vocabulary`,
      );
    }
    const pair = `${edge.id}~${edge.concept}`;
    if (seen.has(pair)) throw new Error(`${ctx}: duplicate edge for concept ${edge.concept}`);
    seen.add(pair);
    if (typeof edge.takeaway !== "string") throw new Error(`${ctx}: takeaway must be a string`);
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      "llm-cmd": { type: "string" },
      prompt: { type: "string", default: DEFAULT_PROMPT },
      "concepts-dir": { type: "string", default: DEFAULT_CONCEPTS_DIR },
    },
  });
  const llmCmd = values["llm-cmd"] ?? process.env.CONCEPTS_PULL_LLM_CMD?.trim() ?? DEFAULT_LLM_CMD;
  const version = promptVersion(values.prompt);

  const home = await ensurePipelineHome();
  const candidatesPath = path.join(home.stateDir, PULL_CANDIDATES_FILENAME);
  let candidatesFile;
  try {
    candidatesFile = JSON.parse(await readFile(candidatesPath, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    throw new Error(`no candidates at ${candidatesPath} — run scripts/concepts/pull/prep.mjs first`);
  }
  const candidates = candidatesFile.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error(`${candidatesPath}: no candidates — run scripts/concepts/pull/prep.mjs first`);
  }
  const candidatesById = new Map(candidates.map((c) => [c.id, c]));

  const concepts = loadConcepts(values["concepts-dir"]);
  const vocabulary = concepts.map(({ slug, label, aliases, definition }) => ({ slug, label, aliases, definition }));
  const promptInput = candidates.map(({ id, title, body }) => ({ id, title, body }));
  const template = await readFile(values.prompt, "utf8");
  const prompt = template
    .replaceAll("{{VOCABULARY_JSON}}", JSON.stringify(vocabulary, null, 2))
    .replaceAll("{{CANDIDATES_JSON}}", JSON.stringify(promptInput, null, 2));

  console.log(`[pull-assign] ${candidates.length} candidate(s), prompt ${version}, via: ${llmCmd}`);
  const edges = parseEdges(runLlm(llmCmd, prompt));
  validateEdgeShape(edges, candidatesById, new Set(concepts.map((c) => c.slug)));

  // Injection boundary: guard every takeaway against the source note body.
  // Violations are rejected to review — never stripped-and-kept, never applied.
  const accepted = [];
  const rejected = [];
  for (const edge of edges) {
    const candidate = candidatesById.get(edge.id);
    const edgeId = `vault:${edge.id}~${edge.concept}`;
    const violation = findTakeawayViolation(edge.takeaway, candidate.body);
    if (violation !== null) {
      rejected.push({ edgeId, vaultId: edge.id, concept: edge.concept, takeaway: edge.takeaway, reason: violation });
    } else {
      accepted.push({ edgeId, vaultId: edge.id, concept: edge.concept, takeaway: edge.takeaway });
    }
  }

  // All validation passed — only now write (pipeline home only, never the repo).
  const generatedAt = new Date().toISOString();
  const edgesPath = path.join(home.reviewDir, PULL_EDGES_FILENAME);
  await writeFile(
    edgesPath,
    JSON.stringify({ generatedAt, promptVersion: version, edges: accepted }, null, 2) + "\n",
    "utf8",
  );
  const rejectedPath = path.join(home.reviewDir, PULL_REJECTED_FILENAME);
  await writeFile(
    rejectedPath,
    JSON.stringify({ generatedAt, promptVersion: version, rejected }, null, 2) + "\n",
    "utf8",
  );

  console.log(
    `[pull-assign] ${accepted.length} edge(s) -> ${edgesPath}; ${rejected.length} rejected -> ${rejectedPath}`,
  );
  console.log("[pull-assign] next: node scripts/concepts/pull/apply.mjs --vault-root <dir> (manual, per-edge confirm)");
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(`[pull-assign] ${err.message}`);
    process.exit(1);
  },
);
