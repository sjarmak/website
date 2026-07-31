import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = path.join(
  ROOT,
  "src/pages/temporal-agent-orchestration/index.astro",
);
const ARTICLE = path.join(
  ROOT,
  "src/components/temporal-agent-orchestration/Article.mdx",
);
const READER = path.join(
  ROOT,
  "src/components/temporal-agent-orchestration/AnnotatedCode.astro",
);
const FIGURES = path.join(
  ROOT,
  "src/components/temporal-agent-orchestration/ConceptFigure.astro",
);
const SAMPLES = path.join(
  ROOT,
  "src/data/temporal-agent-orchestration-code-samples.ts",
);

test("the agent-orchestration essay is a direct off-navigation article", () => {
  assert.equal(existsSync(PAGE), true);
  assert.equal(existsSync(ARTICLE), true);

  const page = readFileSync(PAGE, "utf8");
  const article = readFileSync(ARTICLE, "utf8");
  const header = readFileSync(
    path.join(ROOT, "src/components/nav/Header.astro"),
    "utf8",
  );

  assert.match(page, /<Article \/>/);
  assert.match(page, /noindex=\{true\}/);
  assert.match(page, /type="article"/);
  assert.match(article, /An agent started\. The coordinator died\./);
  assert.match(article, /<AnnotatedCode mode="before" \/>/);
  assert.match(article, /<AnnotatedCode mode="after" \/>/);
  assert.ok(
    article.indexOf('<AnnotatedCode mode="before" />') <
      article.indexOf('<AnnotatedCode mode="after" />'),
    "the before source must appear before the Temporal implementation",
  );
  assert.doesNotMatch(article, /assignment|homework|evaluation criteria/i);
  assert.doesNotMatch(header, /temporal-agent-orchestration/);
});

test("the essay shows versioned pre-Temporal code excerpts with provenance", () => {
  const reader = readFileSync(READER, "utf8");
  const samples = readFileSync(SAMPLES, "utf8");

  for (const filename of [
    "city_runtime_excerpt.go",
    "session_recovery_excerpt.go",
  ]) {
    assert.match(samples, new RegExp(filename.replaceAll(".", "\\.")));
    assert.equal(
      existsSync(
        path.join(
          ROOT,
          "public/temporal-agent-orchestration/code/before",
          filename,
        ),
      ),
      true,
      filename,
    );
  }

  assert.match(samples, /b78058917bc65846db89e1c3b25dc17269822483/);
  assert.match(samples, /cmd\/gc\/city_runtime\.go/);
  assert.match(samples, /cmd\/gc\/session_beads\.go/);
  assert.match(reader, /mode === "before"/);
  assert.match(reader, /Before Temporal/);
  assert.match(reader, /Versioned before code/);
  assert.match(reader, /sample\.sourceUrl/);
  assert.match(reader, /View original source/);
  assert.match(reader, /These are selected excerpts, not standalone Go files/);
});

test("the essay embeds syntax-colored Go source with selectable explanations", () => {
  assert.equal(existsSync(READER), true);
  assert.equal(existsSync(SAMPLES), true);

  const reader = readFileSync(READER, "utf8");
  const samples = readFileSync(SAMPLES, "utf8");

  for (const filename of [
    "bridge.go",
    "workflow.go",
    "activity.go",
    "command_agent_executor.go",
    "workers.go",
  ]) {
    assert.match(samples, new RegExp(filename.replaceAll(".", "\\.")));
    assert.equal(
      existsSync(
        path.join(
          ROOT,
          "public/temporal-agent-orchestration/code",
          filename,
        ),
      ),
      true,
      filename,
    );
  }

  assert.match(reader, /codeToHtml/);
  assert.match(reader, /lang: "go"/);
  assert.match(reader, /one-light/);
  assert.match(reader, /one-dark-pro/);
  assert.match(reader, /data-code-file/);
  assert.match(reader, /data-code-section/);
  assert.match(reader, /role="button"/);
  assert.match(reader, /tabindex="0"/);
  assert.match(reader, /aria-expanded="false"/);
  assert.match(reader, /What this section does/);
  assert.match(reader, /Why it matters for Temporal/);
  assert.match(reader, /event\.key === "Enter"/);
  assert.match(reader, /event\.key === " "/);
  assert.match(reader, /data-code-inspector/);
  assert.match(reader, /data-code-explanation/);
  assert.match(reader, /explanation\.hidden = explanation !== selected/);
  assert.match(reader, /href=\{sample\.rawPath\}/);
  assert.match(reader, /download=\{sample\.filename\}/);
});

test("selected code explanations open in a right-hand inspector on wide screens", () => {
  const reader = readFileSync(READER, "utf8");

  assert.match(reader, /annotated-code__stage/);
  assert.match(
    reader,
    /\.annotated-code__stage\[data-inspector-open="true"\][\s\S]*grid-template-columns:[\s\S]*minmax\(18rem, 0\.8fr\)/,
  );
  assert.match(reader, /\.annotated-code__inspector[\s\S]*position: sticky/);
  assert.match(reader, /dataset\.inspectorOpen = String/);
  assert.match(
    reader,
    /@media \(max-width: 900px\)[\s\S]*\.annotated-code__stage\[data-inspector-open="true"\][\s\S]*grid-template-columns: minmax\(0, 1fr\)/,
  );
});

test("every embedded source file is completely and contiguously annotated", async () => {
  const moduleText = readFileSync(SAMPLES, "utf8");
  assert.match(moduleText, /Non-contiguous annotations/);
  assert.match(moduleText, /annotations end at/);

  const reader = readFileSync(READER, "utf8");
  assert.match(reader, /lines\.slice\(section\.start - 1, section\.end\)/);
  assert.match(reader, /set:html=\{section\.html\}/);
});

test("the embedded reader retains the established responsive and accessible treatment", () => {
  const reader = readFileSync(READER, "utf8");
  const page = readFileSync(PAGE, "utf8");

  assert.match(reader, /@media \(max-width: 800px\)/);
  assert.match(reader, /@media \(max-width: 520px\)/);
  assert.match(reader, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(reader, /focus-visible/);
  assert.match(reader, /color: var\(--shiki-dark\) !important/);
  assert.match(reader, /font-style: var\(--shiki-dark-font-style, inherit\)/);
  assert.match(page, /width: min\(100% - 2 \* var\(--space-m\), 78rem\)/);
  assert.match(page, /max-width: var\(--measure\)/);
});

test("each full file starts as a bounded preview and can expand or collapse", () => {
  const reader = readFileSync(READER, "utf8");

  assert.match(reader, /data-file-expanded="false"/);
  assert.match(reader, /data-file-toggle/);
  assert.match(reader, /Show full file/);
  assert.match(reader, /Collapse file/);
  assert.match(reader, /aria-expanded="false"/);
  assert.match(reader, /panel\.dataset\.fileExpanded = String\(expanded\)/);
  assert.doesNotMatch(reader, /setFileExpanded\(panel, true\)/);
  assert.match(
    reader,
    /\.annotated-code__panel\[data-file-expanded="false"\][\s\S]*\.annotated-code__file-frame[\s\S]*max-height: 24rem[\s\S]*overflow: hidden/,
  );
});

test("long source lines wrap inside the article instead of widening the page", () => {
  const reader = readFileSync(READER, "utf8");
  const page = readFileSync(PAGE, "utf8");

  assert.match(
    reader,
    /\.annotated-code \{[\s\S]*width: 100%[\s\S]*max-width: 78rem/,
  );
  assert.match(page, /\.temporal-agent-article__body \{[\s\S]*max-width: none/);
  assert.match(reader, /\.annotated-code__panel[\s\S]*min-width: 0/);
  assert.match(reader, /\.annotated-code__source[\s\S]*overflow-x: hidden/);
  assert.match(
    reader,
    /\.annotated-code__source :global\(\.line\)[\s\S]*white-space: pre-wrap[\s\S]*overflow-wrap: anywhere/,
  );
  assert.doesNotMatch(reader, /min-width: max-content/);
  assert.doesNotMatch(reader, /translateX\(-50%\)/);
});

test("the essay teaches the orchestrator, ownership boundary, and recovery path visually", () => {
  assert.equal(existsSync(FIGURES), true);

  const article = readFileSync(ARTICLE, "utf8");
  const figures = readFileSync(FIGURES, "utf8");

  assert.match(article, /import ConceptFigure from "\.\/ConceptFigure\.astro"/);
  assert.match(article, /<ConceptFigure kind="orchestrator"/);
  assert.match(article, /<ConceptFigure kind="ownership"/);
  assert.match(article, /<ConceptFigure kind="recovery"/);

  assert.match(figures, /The existing multi-agent orchestrator/);
  assert.match(figures, /Who owns what after the move/);
  assert.match(figures, /One agent session survives Worker loss/);
  assert.match(figures, /<figcaption>/);
  assert.match(figures, /aria-labelledby=\{titleId\}/);
  assert.match(figures, /@media \(max-width: 720px\)/);
  assert.match(figures, /min-width: 0/);
  assert.doesNotMatch(figures, /overflow-x: auto/);
});
