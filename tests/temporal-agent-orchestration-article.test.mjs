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
  assert.match(article, /<AnnotatedCode \/>/);
  assert.doesNotMatch(article, /assignment|homework|evaluation criteria/i);
  assert.doesNotMatch(header, /temporal-agent-orchestration/);
});

test("the essay embeds complete syntax-colored Go files with inline explanations", () => {
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
  assert.match(reader, /explanation\.hidden = !expanded/);
  assert.match(reader, /href=\{sample\.rawPath\}/);
  assert.match(reader, /download=\{sample\.filename\}/);
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
