import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = path.join(ROOT, "src/pages/temporal-research-agent/index.astro");
const CODE_INDEX = path.join(
  ROOT,
  "src/pages/temporal-research-agent/code/index.astro",
);
const RESEARCH_PAGE = path.join(
  ROOT,
  "src/pages/temporal-research-agent/research-output/index.astro",
);
const README_PAGE = path.join(
  ROOT,
  "src/pages/temporal-research-agent/readme.astro",
);
const BLOG_PAGE = path.join(
  ROOT,
  "src/pages/temporal-research-agent/blog.astro",
);
const BLOG = path.join(
  ROOT,
  "src/components/temporal-research-agent/Blog.md",
);
const PRODUCT_PAGE = path.join(
  ROOT,
  "src/pages/temporal-research-agent/research-output/[run]/[kind]/[slug].astro",
);

test("the report landing page leads with the five project tabs", () => {
  const source = readFileSync(PAGE, "utf8");

  assert.match(source, /Temporal brings a research pipeline back to life/);
  assert.match(source, /noindex=\{true\}/);
  assert.match(source, /temporal-literature-review-demo\.mp4/);
  assert.doesNotMatch(source, /52 seconds\./);
  assert.match(source, /<span>01<\/span> Code</);
  assert.match(source, /<span>02<\/span> README</);
  assert.match(source, /<span>03<\/span> Blog</);
  assert.match(source, /<span>04<\/span> Deck</);
  assert.match(source, /<span>05<\/span> Output</);
  assert.match(source, /href=\{`\$\{root\}\/code`\}/);
  assert.match(source, /href=\{`\$\{root\}\/readme`\}/);
  assert.match(source, /href=\{`\$\{root\}\/blog`\}/);
  assert.match(source, /href=\{`\$\{root\}\/deck\.html`\}/);
  assert.match(source, /href=\{`\$\{root\}\/research-output`\}/);
  assert.doesNotMatch(source, /href="#research-output"/);
  assert.equal(existsSync(BLOG_PAGE), true);
  assert.equal(existsSync(BLOG), true);
  const config = readFileSync(path.join(ROOT, "astro.config.mjs"), "utf8");
  assert.doesNotMatch(
    config,
    /"\/temporal-research-agent\/blog": "\/temporal-research-agent\/readme"/,
  );
  assert.match(source, /Before source/);
  assert.match(source, /After source/);
  assert.match(source, /codeToHtml/);
  assert.match(source, /github-light-high-contrast/);
  assert.match(source, /github-dark-high-contrast/);
  assert.match(source, /set:html=\{beforeCode\}/);
  assert.match(source, /set:html=\{afterCode\}/);
  assert.match(source, /background: var\(--night-900\)/);
  assert.match(source, /color: var\(--shiki-dark\) !important/);
  assert.match(source, /\$\{root\}\/code\/before/);
  assert.match(source, /\$\{root\}\/code/);
  assert.match(
    source,
    /href="https:\/\/www\.sjarmak\.ai\/projects\/code-intelligence-digest"/,
  );
  assert.match(
    source,
    /href="https:\/\/www\.sjarmak\.ai\/projects\/scix-agent"/,
  );
  assert.match(source, /Stage 1: research/);
  assert.match(source, /Research ONE podcast episode/);
  assert.match(source, /write_deep_dive/);
  assert.match(source, /write_podcast_script/);
  assert.doesNotMatch(source, /run-durable-research/);
  assert.doesNotMatch(source, /Separate follow-on work/);
  assert.doesNotMatch(source, /general research Workflow/);
  assert.match(source, /configured workstation/i);
  assert.match(source, /A Temporal\s+Workflow owns episode order/);
  assert.match(source, /Temporal Activities own MCP calls/);
  assert.doesNotMatch(source, /Temporal owns/);
  for (const heading of [
    "Executive summary",
    "The code sample before Temporal",
    "The Temporal implementation",
    "Recovery proof",
    "Design choices and tradeoffs",
    "Results and verification",
  ]) {
    assert.match(source, new RegExp(heading));
  }
});

test("the blog is a standalone engineering article with expandable evidence", () => {
  const page = readFileSync(BLOG_PAGE, "utf8");
  const article = readFileSync(BLOG, "utf8");

  assert.match(
    article,
    /I killed my research pipeline mid-run\. Temporal brought it back\./,
  );
  assert.match(article, /The same Workflow ID and Run ID survived/);
  assert.match(article, /Activity retries forced me to think about idempotency/);
  assert.match(article, /temporal-phasee-demo-1785443614/);
  assert.match(article, /temporal-phasee-live-one-20260730-v1/);
  assert.doesNotMatch(article, /assignment|homework|evaluation criteria/i);
  assert.match(page, /<Blog \/>/);
  assert.match(page, /aria-current="page">Blog/);
  assert.match(page, /a:has\(img\)/);
  assert.match(page, /<dialog[^>]+id="blog-image-viewer"/);
  assert.match(page, /showModal\(\)/);
  assert.match(page, /prefers-reduced-motion/);
});

test("the Code tab opens an index of every complete annotated source file", () => {
  assert.equal(existsSync(CODE_INDEX), true);
  const source = readFileSync(CODE_INDEX, "utf8");

  assert.match(source, /Complete annotated source/);
  assert.match(source, /temporalResearchCodeSamples/);
  assert.match(source, /Open annotated source/);
  assert.match(source, /sample\.filename/);
  assert.match(source, /sample\.summary/);
  assert.match(source, /href=\{`\$\{root\}\/code\/\$\{sample\.slug\}`\}/);
});

test("research output separates publishable products from durability fixtures", () => {
  const source = readFileSync(PAGE, "utf8");
  const researchPage = readFileSync(RESEARCH_PAGE, "utf8");
  const liveManifest = JSON.parse(
    readFileSync(
      path.join(
        ROOT,
        "public/temporal-research-agent/after/live-products/manifest.json",
      ),
      "utf8",
    ),
  );

  assert.doesNotMatch(source, /<TemporalMasReview \/>/);
  assert.doesNotMatch(source, /id="research-output"/);
  assert.match(researchPage, /Publishable live Workflow run/);
  assert.match(researchPage, /Workflow run record/);
  assert.match(researchPage, /Durability fixture run/);
  assert.match(researchPage, /Original JavaScript run/);
  assert.match(researchPage, /completed_episode_keys\.length/);
  assert.match(researchPage, /Selected-run synthesis/);
  assert.match(researchPage, /Original five-episode review/);
  assert.doesNotMatch(researchPage, /Temporal fixture review/);
  assert.match(researchPage, /Research notes/);
  assert.match(researchPage, /Deep dive/);
  assert.match(researchPage, /Podcast script/);
  assert.match(researchPage, /View fixture artifacts/);
  assert.equal(existsSync(PRODUCT_PAGE), true);
  const productPage = readFileSync(PRODUCT_PAGE, "utf8");
  assert.match(productPage, /getStaticPaths/);
  assert.match(productPage, /remarkParse/);
  assert.match(productPage, /Download Markdown/);
  for (const activityName of [
    "research_episode",
    "write_deep_dive",
    "write_podcast_script",
    "write_series_review",
    "write_pipeline_manifest",
  ]) {
    assert.match(researchPage, new RegExp(activityName));
  }
  assert.deepEqual(liveManifest.completed_episode_keys, ["mas-ep4"]);
  assert.equal(liveManifest.failed_episode_keys.length, 0);
  assert.equal(liveManifest.series_reviews.length, 1);
  assert.ok(
    liveManifest.episodes.reduce(
      (count, episode) => count + episode.sources.length,
      0,
    ) >= 15,
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
  assert.match(readme, /eight journaled searches/);
  assert.match(readme, /Live product run/);
  assert.match(readme, /Durability fixture/);
  assert.match(readme, /after\/live-products\/reviews\/mas-literature-review\.md/);
  assert.match(readme, /What a process failure meant before Temporal/);
  assert.match(readme, /async def run_pipeline\(\)/);
  assert.match(readme, /Design considerations and tradeoffs/);
  assert.match(readme, /How I would teach the migration/);
  assert.doesNotMatch(readme, /It gives us a real before and after/);
  assert.doesNotMatch(readme, /Separate durable-research skill/);
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

test("each assignment evidence screenshot opens in an accessible full-view dialog", () => {
  const source = readFileSync(PAGE, "utf8");

  assert.equal((source.match(/data-expand-image\s/g) ?? []).length, 3);
  assert.match(source, /deck-assets\/workflow-completed\.png/);
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
    "public/temporal-research-agent/after/live-products/manifest.json",
    "public/temporal-research-agent/after/live-products/workflow-run.json",
    "public/temporal-research-agent/after/live-products/reviews/mas-literature-review.md",
    "public/temporal-research-agent/src/durable_research/podcast_preset.py",
    "public/temporal-research-agent/src/durable_research/podcast_prompts.py",
    "public/temporal-research-agent/src/durable_research/podcast_workflow.py",
    "public/temporal-research-agent/src/durable_research/podcast_activities.py",
    "public/temporal-research-agent/src/durable_research/podcast_worker.py",
    "public/temporal-research-agent/tests/test_podcast_workflow.py",
    "public/temporal-research-agent/README.md",
    "src/components/temporal-research-agent/Readme.md",
    "src/components/temporal-research-agent/Blog.md",
    "src/components/temporal-research-agent/TemporalMasReview.md",
    "src/components/temporal-research-agent/TemporalCodeReview.md",
    "src/pages/temporal-research-agent/research-output/index.astro",
    "src/pages/temporal-research-agent/research-output/[run]/[kind]/[slug].astro",
  ]) {
    assert.equal(existsSync(path.join(ROOT, relativePath)), true, relativePath);
  }
});

test("deck follows the site design system and keeps code token-colored", () => {
  const deck = readFileSync(
    path.join(ROOT, "public/temporal-research-agent/deck.html"),
    "utf8",
  );

  assert.match(deck, /I’ll show/);
  assert.match(deck, /The code we already had/);
  assert.match(deck, /The Python rewrite/);
  assert.match(deck, /The recovery proof/);
  assert.match(deck, /--paper-100: oklch\(96\.5% 0\.012 83\)/);
  assert.match(deck, /--ember-500: oklch\(60% 0\.16 52\)/);
  assert.match(deck, /font-family: "Literata"/);
  assert.match(deck, /font-family: "Hanken Grotesk"/);
  assert.match(deck, /class="language-javascript"/);
  assert.match(deck, /class="language-python"/);
  for (const token of [
    "tok-keyword",
    "tok-function",
    "tok-string",
    "tok-class",
    "tok-decorator",
    "tok-comment",
  ]) {
    assert.match(deck, new RegExp(`class="${token}"`));
  }
  assert.doesNotMatch(deck, /run-durable-research/);
  assert.doesNotMatch(deck, /what I would ask in review/);
  assert.equal((deck.match(/class="slide(?: |")/g) ?? []).length, 10);
});

test("annotated code readers explain the generic selection and research synthesis", () => {
  const samples = readFileSync(
    path.join(ROOT, "src/data/temporal-research-code-samples.ts"),
    "utf8",
  );

  assert.match(samples, /Arbitrary episode selection/);
  assert.match(samples, /one episode, several episodes, or the complete preset/);
  assert.match(samples, /The Workflow derives branches/);
  assert.match(samples, /Research synthesis/);
  assert.match(samples, /Do not reproduce the retrieval dump|removing off-topic/);
});
