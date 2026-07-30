import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = path.join(ROOT, "src/pages/temporal-research-agent/index.astro");
const RESEARCH_PAGE = path.join(
  ROOT,
  "src/pages/temporal-research-agent/research-output/index.astro",
);
const README_PAGE = path.join(
  ROOT,
  "src/pages/temporal-research-agent/readme.astro",
);

test("off-navigation walkthrough exposes the faithful assignment package", () => {
  const source = readFileSync(PAGE, "utf8");

  assert.match(source, /Temporal brings a research pipeline back to life/);
  assert.match(source, /noindex=\{true\}/);
  assert.match(source, /temporal-literature-review-demo\.mp4/);
  assert.doesNotMatch(source, /52 seconds\./);
  assert.match(source, /Open the deck/);
  assert.match(source, /Read the README/);
  assert.match(source, /Read the research output/);
  assert.match(source, /href=\{`\$\{root\}\/research-output`\}/);
  assert.doesNotMatch(source, /href="#research-output"/);
  assert.doesNotMatch(source, /Read the blog/);
  assert.equal(
    existsSync(path.join(ROOT, "src/pages/temporal-research-agent/blog.astro")),
    false,
  );
  const config = readFileSync(path.join(ROOT, "astro.config.mjs"), "utf8");
  assert.match(
    config,
    /"\/temporal-research-agent\/blog": "\/temporal-research-agent\/readme"/,
  );
  assert.match(source, /Before source/);
  assert.match(source, /After source/);
  for (const slug of [
    "before",
    "inputs",
    "prompts",
    "workflow",
    "activities",
    "worker",
  ]) {
    assert.match(source, new RegExp(`\\$\\{root\\}/code/${slug}`));
  }
  assert.match(
    source,
    /href="https:\/\/www\.sjarmak\.ai\/projects\/code-intelligence-digest"/,
  );
  assert.match(
    source,
    /href="https:\/\/www\.sjarmak\.ai\/projects\/scix-agent"/,
  );
  assert.match(source, /researchPrompt/);
  assert.match(source, /write_deep_dive/);
  assert.match(source, /write_podcast_script/);
  assert.match(source, /run-durable-research/);
  assert.match(source, /configured workstation/i);
  assert.match(source, /A Temporal\s+Workflow owns episode order/);
  assert.match(source, /Temporal Activities own MCP calls/);
  assert.doesNotMatch(source, /Temporal owns/);
});

test("walkthrough links to the original and Temporal-produced research products", () => {
  const source = readFileSync(PAGE, "utf8");
  const researchPage = readFileSync(RESEARCH_PAGE, "utf8");
  const masReview = readFileSync(
    path.join(
      ROOT,
      "src/components/temporal-research-agent/TemporalMasReview.md",
    ),
    "utf8",
  );
  const codeReview = readFileSync(
    path.join(
      ROOT,
      "src/components/temporal-research-agent/TemporalCodeReview.md",
    ),
    "utf8",
  );
  const manifest = JSON.parse(
    readFileSync(
      path.join(
        ROOT,
        "public/temporal-research-agent/after/fixture-products/manifest.json",
      ),
      "utf8",
    ),
  );

  assert.doesNotMatch(source, /<TemporalMasReview \/>/);
  assert.doesNotMatch(source, /id="research-output"/);
  assert.match(researchPage, /All ten episode branches completed/);
  assert.match(researchPage, /10 complete/);
  assert.match(researchPage, /20 records/);
  assert.match(researchPage, /32 documents/);
  assert.match(researchPage, /Original long-form review/);
  assert.match(researchPage, /Temporal fixture review/);
  assert.match(researchPage, /<TemporalMasReview \/>/);
  assert.match(researchPage, /<TemporalCodeReview \/>/);
  for (const activityName of [
    "research_episode",
    "write_deep_dive",
    "write_podcast_script",
    "write_series_review",
    "write_pipeline_manifest",
  ]) {
    assert.match(researchPage, new RegExp(activityName));
  }
  assert.match(masReview, /Code Intelligence Digest/);
  assert.match(masReview, /SciX/);
  assert.match(codeReview, /Code Intelligence Digest/);
  assert.match(codeReview, /SciX/);
  assert.equal(manifest.completed_episode_keys.length, 10);
  assert.equal(manifest.failed_episode_keys.length, 0);
  assert.equal(manifest.series_reviews.length, 2);
  assert.equal(
    manifest.episodes.reduce(
      (count, episode) => count + episode.sources.length,
      0,
    ),
    20,
  );
});

test("assignment and internal verification links stay off the landing page", () => {
  const source = readFileSync(PAGE, "utf8");

  assert.doesNotMatch(source, /Assignment fit/);
  assert.doesNotMatch(source, /Evidence for each evaluation criterion/);
  assert.doesNotMatch(source, /Open the brief alignment/);
  assert.doesNotMatch(source, /Open the verification record/);
  assert.doesNotMatch(source, /Open the 12-minute talk plan/);
});

test("README explains the original failure and complete business sequence", () => {
  const readme = readFileSync(
    path.join(ROOT, "src/components/temporal-research-agent/Readme.md"),
    "utf8",
  );

  assert.match(
    readme,
    /This project reimplements an existing research pipeline as a Python\s+application built on Temporal\./,
  );
  assert.match(readme, /killing a Worker\s+mid-Activity/);
  assert.match(readme, /ten podcast episodes/);
  assert.match(readme, /research, a deep dive, and a podcast/);
  assert.match(readme, /replacement Worker/);
  assert.match(readme, /same Workflow ID and Run ID/);
  assert.match(readme, /What a process failure meant before Temporal/);
  assert.match(readme, /async def run_pipeline\(\)/);
  assert.match(readme, /Design considerations and tradeoffs/);
  assert.match(readme, /How I would teach the migration/);
  assert.doesNotMatch(readme, /It gives us a real before and after/);
  for (const slug of [
    "before",
    "inputs",
    "prompts",
    "workflow",
    "activities",
    "worker",
  ]) {
    assert.match(readme, new RegExp(`/temporal-research-agent/code/${slug}/`));
  }
});

test("README tables use a readable thin grid and scroll on narrow screens", () => {
  const route = readFileSync(README_PAGE, "utf8");

  assert.match(
    route,
    /:global\(\.tra-document \.prose table\)[\s\S]*border: var\(--border-hairline\)/,
  );
  assert.match(
    route,
    /:global\(\.tra-document \.prose th\),[\s\S]*:global\(\.tra-document \.prose td\)[\s\S]*border: var\(--border-hairline\)/,
  );
  assert.match(route, /overflow-x: auto/);
  assert.match(route, /background: var\(--color-bg-subtle\)/);
});

test("each evidence screenshot opens in an accessible full-view dialog", () => {
  const source = readFileSync(PAGE, "utf8");

  assert.equal((source.match(/data-expand-image\s/g) ?? []).length, 3);
  assert.match(source, /<dialog[^>]+id="evidence-viewer"/);
  assert.match(source, /showModal\(\)/);
  assert.match(source, /data-close-viewer/);
});

test("walkthrough stays out of navigation and the sitemap", () => {
  const header = readFileSync(
    path.join(ROOT, "src/components/nav/Header.astro"),
    "utf8",
  );
  const sitemap = readFileSync(path.join(ROOT, "astro.config.mjs"), "utf8");

  assert.doesNotMatch(header, /temporal-research-agent/);
  assert.match(sitemap, /temporal-research-agent/);
});

test("packaged media, deck, faithful code, and products exist", () => {
  for (const relativePath of [
    "public/temporal-research-agent/deck.html",
    "public/temporal-research-agent/deck-assets/worker-killed.png",
    "public/temporal-research-agent/deck-assets/workflow-completed.png",
    "public/temporal-research-agent/deck-assets/activity-attempt-two.png",
    "public/temporal-research-agent/demo/out/temporal-literature-review-demo.mp4",
    "public/temporal-research-agent/demo/out/run-artifacts/history.json",
    "public/temporal-research-agent/before/phaseE_workflow.js",
    "public/temporal-research-agent/before/products/multiagent-orchestration/20-literature-review.md",
    "public/temporal-research-agent/before/products/code-retrieval/20-literature-review.md",
    "public/temporal-research-agent/after/fixture-products/manifest.json",
    "public/temporal-research-agent/after/fixture-products/reviews/mas-literature-review.md",
    "public/temporal-research-agent/after/fixture-products/reviews/code-literature-review.md",
    "public/temporal-research-agent/src/durable_research/podcast_preset.py",
    "public/temporal-research-agent/src/durable_research/podcast_prompts.py",
    "public/temporal-research-agent/src/durable_research/podcast_workflow.py",
    "public/temporal-research-agent/src/durable_research/podcast_activities.py",
    "public/temporal-research-agent/src/durable_research/podcast_worker.py",
    "public/temporal-research-agent/tests/test_podcast_workflow.py",
    "public/temporal-research-agent/README.md",
    "src/components/temporal-research-agent/Readme.md",
    "src/components/temporal-research-agent/TemporalMasReview.md",
    "src/components/temporal-research-agent/TemporalCodeReview.md",
    "src/pages/temporal-research-agent/research-output/index.astro",
  ]) {
    assert.equal(existsSync(path.join(ROOT, relativePath)), true, relativePath);
  }
});
