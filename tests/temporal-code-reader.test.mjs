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

test("annotated reader exposes all six complete source samples", () => {
  assert.equal(existsSync(ROUTE), true);
  assert.equal(existsSync(SAMPLES), true);

  const samples = readFileSync(SAMPLES, "utf8");
  for (const slug of [
    "before",
    "inputs",
    "prompts",
    "workflow",
    "activities",
    "worker",
  ]) {
    assert.match(samples, new RegExp(`slug: "${slug}"`));
  }
  for (const filename of [
    "phaseE_workflow.js",
    "podcast_preset.py",
    "podcast_prompts.py",
    "podcast_workflow.py",
    "podcast_activities.py",
    "podcast_worker.py",
  ]) {
    assert.match(samples, new RegExp(filename.replace(".", "\\.")));
  }
});

test("reader renders the full file as click-to-expand semantic sections", () => {
  const route = readFileSync(ROUTE, "utf8");

  assert.match(route, /codeToHtml/);
  assert.match(
    route,
    /<section[\s\S]*class="code-reader__segment"[\s\S]*data-code-section/,
  );
  assert.match(
    route,
    /class="code-reader__source-trigger"[\s\S]*role="button"[\s\S]*tabindex="0"[\s\S]*aria-expanded="false"/,
  );
  assert.match(
    route,
    /<div[\s\S]*class="code-reader__source"[\s\S]*set:html=\{section\.html\}/,
  );
  assert.match(route, /What this section does/);
  assert.match(route, /Why it matters for Temporal/);
  assert.match(route, /Click any line section to open its explanation/);
  assert.match(route, /code-reader__explanation/);
  assert.match(route, /explanation\.hidden = !expanded/);
  assert.match(route, /event\.key === "Enter"/);
  assert.match(route, /event\.key === " "/);
  assert.doesNotMatch(route, /Mouse over, focus, or tap/);
  assert.doesNotMatch(route, /<details/);
  assert.match(route, /github-light-high-contrast/);
  assert.match(route, /github-dark-high-contrast/);
  // Shiki emits the light color as the default and only the dark color as a
  // variable; there is no --shiki-light to assert on.
  assert.match(route, /there is no --shiki-light/);
  assert.match(route, /color: var\(--shiki-dark\) !important/);
});

test("each reader links to its stable raw downloadable source", () => {
  const route = readFileSync(ROUTE, "utf8");
  const samples = readFileSync(SAMPLES, "utf8");

  assert.match(route, /href=\{sample\.rawPath\}/);
  assert.match(route, /download=\{sample\.filename\}/);
  assert.match(route, /Download raw/);
  assert.match(samples, /\/before\/phaseE_workflow\.js/);
  assert.match(samples, /\/src\/durable_research\/podcast_preset\.py/);
  assert.match(samples, /\/src\/durable_research\/podcast_prompts\.py/);
  assert.match(samples, /\/src\/durable_research\/podcast_workflow\.py/);
  assert.match(samples, /\/src\/durable_research\/podcast_activities\.py/);
  assert.match(samples, /\/src\/durable_research\/podcast_worker\.py/);
});
