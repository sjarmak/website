import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROUTE = path.join(
  ROOT,
  "src/pages/temporal-research-agent/code/[slug].astro",
);
const SAMPLES = path.join(
  ROOT,
  "src/data/temporal-research-code-samples.ts",
);

test("annotated reader exposes all four complete source samples", () => {
  assert.equal(existsSync(ROUTE), true);
  assert.equal(existsSync(SAMPLES), true);

  const samples = readFileSync(SAMPLES, "utf8");
  for (const slug of ["before", "workflow", "activities", "worker"]) {
    assert.match(samples, new RegExp(`slug: "${slug}"`));
  }
  for (const filename of [
    "phaseE_workflow.excerpt.js",
    "workflow.py",
    "activities.py",
    "worker.py",
  ]) {
    assert.match(samples, new RegExp(filename.replace(".", "\\.")));
  }
});

test("reader teaches semantic sections with mouse, keyboard, and touch affordances", () => {
  const route = readFileSync(ROUTE, "utf8");

  assert.match(route, /codeToHtml/);
  assert.match(route, /class="code-reader__segment"/);
  assert.match(route, /tabindex="0"/);
  assert.match(route, /What this section does/);
  assert.match(route, /Why it matters for Temporal/);
  assert.match(route, /Mouse over, focus, or tap/);
  assert.match(route, /@media \(hover: hover\)/);
  assert.match(route, /color: var\(--shiki-light\) !important/);
  assert.match(route, /color: var\(--shiki-dark\) !important/);
});

test("each reader links to its stable raw downloadable source", () => {
  const route = readFileSync(ROUTE, "utf8");
  const samples = readFileSync(SAMPLES, "utf8");

  assert.match(route, /href=\{sample\.rawPath\}/);
  assert.match(route, /download=\{sample\.filename\}/);
  assert.match(route, /Download raw/);
  assert.match(samples, /\/before\/phaseE_workflow\.excerpt\.js/);
  assert.match(samples, /\/src\/durable_research\/workflow\.py/);
  assert.match(samples, /\/src\/durable_research\/activities\.py/);
  assert.match(samples, /\/src\/durable_research\/worker\.py/);
});
