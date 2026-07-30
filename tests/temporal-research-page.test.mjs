import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = path.join(ROOT, "src/pages/temporal-research-agent/index.astro");

test("off-navigation walkthrough exposes every requested deliverable", () => {
  const source = readFileSync(PAGE, "utf8");

  assert.match(source, /Temporal lets us bring a research agent back to life/);
  assert.match(source, /noindex=\{true\}/);
  assert.match(source, /temporal-literature-review-demo\.mp4/);
  assert.match(source, /Open the deck/);
  assert.match(source, /Read the README/);
  assert.doesNotMatch(source, /Read the blog/);
  assert.equal(
    existsSync(path.join(ROOT, "src/pages/temporal-research-agent/blog.astro")),
    false,
  );
  assert.match(source, /Before source/);
  assert.match(source, /After source/);
  assert.doesNotMatch(source, /researchPrompt/);
  assert.match(source, /run-durable-research/);
  assert.match(source, /workstation-only/i);
  assert.match(source, /The Workflow owns durable branch state/);
  assert.match(source, /The Temporal\s+Service persists Event History/);
  assert.doesNotMatch(source, /Temporal owns/);
});

test("brief maps evidence to all four evaluation criteria without appearing on the page", () => {
  const source = readFileSync(PAGE, "utf8");
  const brief = readFileSync(
    path.join(ROOT, "public/temporal-research-agent/brief-alignment.md"),
    "utf8",
  );

  for (const criterion of [
    "Technical depth",
    "Clarity of explanation",
    "Developer empathy",
    "Code quality",
  ]) {
    assert.match(brief, new RegExp(criterion));
  }
  assert.doesNotMatch(source, /Assignment fit/);
  assert.doesNotMatch(source, /Evidence for each evaluation criterion/);
  assert.doesNotMatch(source, /Open the brief alignment/);
  assert.doesNotMatch(source, /Open the verification record/);
  assert.doesNotMatch(source, /Open the 12-minute talk plan/);
});

test("each evidence screenshot opens in an accessible full-view dialog", () => {
  const source = readFileSync(PAGE, "utf8");

  assert.equal((source.match(/data-expand-image\s/g) ?? []).length, 3);
  assert.match(source, /<dialog[^>]+id="evidence-viewer"/);
  assert.match(source, /showModal\(\)/);
  assert.match(source, /data-close-viewer/);
});

test("walkthrough stays out of navigation and the sitemap", () => {
  const header = readFileSync(path.join(ROOT, "src/components/nav/Header.astro"), "utf8");
  const sitemap = readFileSync(path.join(ROOT, "astro.config.mjs"), "utf8");

  assert.doesNotMatch(header, /temporal-research-agent/);
  assert.match(sitemap, /temporal-research-agent/);
});

test("packaged media, deck, code, and document source exist", () => {
  for (const relativePath of [
    "public/temporal-research-agent/deck.html",
    "public/temporal-research-agent/deck-assets/worker-killed.png",
    "public/temporal-research-agent/deck-assets/workflow-completed.png",
    "public/temporal-research-agent/deck-assets/activity-attempt-two.png",
    "public/temporal-research-agent/demo/out/temporal-literature-review-demo.mp4",
    "public/temporal-research-agent/before/phaseE_workflow.excerpt.js",
    "public/temporal-research-agent/src/durable_research/workflow.py",
    "public/temporal-research-agent/src/durable_research/activities.py",
    "public/temporal-research-agent/src/durable_research/external_calls.py",
    "public/temporal-research-agent/tests/test_workflow.py",
    "public/temporal-research-agent/skills/run-durable-research/SKILL.md",
    "public/temporal-research-agent/skills/run-durable-research/scripts/research",
    "public/temporal-research-agent/blog.md",
    "public/temporal-research-agent/README.md",
    "src/components/temporal-research-agent/Readme.md",
  ]) {
    assert.equal(existsSync(path.join(ROOT, relativePath)), true, relativePath);
  }
});
