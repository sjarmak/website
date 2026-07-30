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

test("off-navigation walkthrough exposes every requested deliverable", () => {
  const source = readFileSync(PAGE, "utf8");

  assert.match(source, /Temporal lets us bring a research agent back to life/);
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
  for (const filename of ["workflow.py", "activities.py", "worker.py"]) {
    assert.match(
      source,
      new RegExp(`src/durable_research/${filename.replace(".", "\\.")}`),
    );
  }
  assert.doesNotMatch(source, /researchPrompt/);
  assert.match(source, /run-durable-research/);
  assert.match(source, /workstation-only/i);
  assert.match(source, /The Workflow owns durable branch state/);
  assert.match(source, /The Temporal\s+Service persists Event History/);
  assert.doesNotMatch(source, /Temporal owns/);
});

test("walkthrough links to a separate completed research product", () => {
  const source = readFileSync(PAGE, "utf8");
  const researchPage = readFileSync(RESEARCH_PAGE, "utf8");
  const report = readFileSync(
    path.join(ROOT, "public/temporal-research-agent/research-output/report.md"),
    "utf8",
  );
  const renderedReport = readFileSync(
    path.join(ROOT, "src/components/temporal-research-agent/ResearchReport.md"),
    "utf8",
  );
  const manifest = JSON.parse(
    readFileSync(
      path.join(ROOT, "public/temporal-research-agent/research-output/manifest.json"),
      "utf8",
    ),
  );

  assert.doesNotMatch(source, /<ResearchReport \/>/);
  assert.doesNotMatch(source, /id="research-output"/);
  assert.match(researchPage, /The live research product/);
  assert.match(
    researchPage,
    /live SciX and Code\s+Intelligence\s+Digest indexes/,
  );
  assert.match(researchPage, /4 completed/);
  assert.match(researchPage, /0 failed/);
  assert.match(researchPage, /48\s+retrieved records/);
  assert.match(
    researchPage,
    /24 from SciX and 24 from Code\s+Intelligence\s+Digest/,
  );
  assert.match(researchPage, /<ResearchReport \/>/);
  for (const activityName of [
    "research_angle",
    "verify_evidence",
    "synthesize_section",
    "finalize_review",
  ]) {
    assert.match(researchPage, new RegExp(activityName));
  }
  assert.match(researchPage, /Synthesized finding/);
  assert.match(
    researchPage,
    /Durability is a property of the whole research pipeline/,
  );
  assert.match(researchPage, /What Code Intelligence Digest contributed/);
  assert.match(researchPage, /Building a Durable Execution Engine with SQLite/);
  assert.match(researchPage, /Replay is not re-execution/);
  assert.equal(renderedReport.trim(), report.trim());
  assert.doesNotMatch(report, /\[tag:google\.com/);
  assert.doesNotMatch(report, /\[ads:/);
  assert.doesNotMatch(report, /\[20\d{2}arXiv/);
  assert.match(
    report,
    /\[SKILL\.nb: Selective Formalization and Gated Execution for Durable Agent Workflows\]\(https:\/\/arxiv\.org\/abs\/2606\.08049\)/,
  );
  assert.equal(manifest.completed_angles.length, 4);
  assert.equal(manifest.failed_angles.length, 0);
  assert.equal(
    manifest.branches.reduce((count, branch) => count + branch.sources.length, 0),
    48,
  );
  assert.equal(
    manifest.branches
      .flatMap((branch) => branch.sources)
      .filter((source) => source.lane === "scix").length,
    24,
  );
  assert.equal(
    manifest.branches
      .flatMap((branch) => branch.sources)
      .filter((source) => source.lane === "digest").length,
    24,
  );
  assert.equal(manifest.synthesis.tool, "synthesize_findings");
  assert.equal(manifest.synthesis.input_paper_count, 23);
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
    "public/temporal-research-agent/research-output/report.md",
    "public/temporal-research-agent/research-output/manifest.json",
    "public/temporal-research-agent/research-output/synthesis.json",
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
    "src/components/temporal-research-agent/ResearchReport.md",
    "src/pages/temporal-research-agent/research-output/index.astro",
  ]) {
    assert.equal(existsSync(path.join(ROOT, relativePath)), true, relativePath);
  }
});
