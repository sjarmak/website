// Built-output coverage for the critical reading journey. This verifies the
// artifact readers receive, including inline SVG behavior that source checks miss.

import { before, test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import {
  BOOK,
  CHAPTERS,
} from "../scripts/content/import-agent-reliability-book.mjs";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(REPO_ROOT, "dist");

function page(...segments) {
  return readFileSync(path.join(DIST, ...segments, "index.html"), "utf8");
}

function linkedCss(html) {
  return [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)]
    .map((match) => readFileSync(path.join(DIST, match[1].replace(/^\//, "")), "utf8"))
    .join("\n");
}

before(async () => {
  // Build only when the artifact is missing: three dist suites once each ran
  // an unconditional build, and node --test's parallel file execution let the
  // concurrent Astro builds delete each other's in-flight dist modules. The
  // ordered CI pipeline builds before testing, so dist normally exists.
  if (!existsSync(path.join(DIST, "index.html"))) {
    await execFileP("npm", ["run", "build"], {
      cwd: REPO_ROOT,
      maxBuffer: 64 * 1024 * 1024,
    });
  }
});

test("writing index links to the book exactly once", () => {
  const html = page("writing");
  const href = `/books/${BOOK.slug}`;
  assert.equal(html.split(`href="${href}"`).length - 1, 1);
  assert.match(html, />\s*Book\s*</);
});

test("book landing lists every entry once in reading order", () => {
  const html = page("books", BOOK.slug);
  assert.match(html, /<h1[^>]*>Engineering Reliable Coding Agents<\/h1>/);
  assert.match(html, />Evaluating and Operating the System Around the Model<\/p>/);
  assert.match(html, />\s*19 chapters · 6 parts · approximately 314 pages\s*<\/p>/);
  assert.doesNotMatch(html, /89,005 words/);
  const contents = html.slice(html.indexOf('<section class="contents'));
  let lastIndex = -1;
  for (const chapter of CHAPTERS) {
    const href = `/books/${BOOK.slug}/${chapter.slug}`;
    assert.equal(contents.split(`href="${href}"`).length - 1, 1, `${chapter.slug}: link count`);
    const index = contents.indexOf(`href="${href}"`);
    assert.ok(index > lastIndex, `${chapter.slug}: out of reading order`);
    lastIndex = index;
  }
});

test("book and chapters link to the complete companion catalog", () => {
  const href = `/books/${BOOK.slug}/companion`;
  assert.equal(page("books", BOOK.slug).split(`href="${href}"`).length - 1, 1);

  for (const chapter of CHAPTERS) {
    const chapterHref = chapter.number ? `${href}#chapter-${chapter.number}` : href;
    assert.match(
      page("books", BOOK.slug, chapter.slug),
      new RegExp(`href="${chapterHref}"`),
      `${chapter.slug}: companion link`,
    );
  }
});

test("companion route renders all practices with stable anchors and chapter navigation", () => {
  const html = page("books", BOOK.slug, "companion");
  const practiceIds = [...html.matchAll(/<h3 id="([^"]+)"/g)].map((match) => match[1]);
  const chapterIds = [...html.matchAll(/<h2 id="(chapter-\d+)"/g)].map(
    (match) => match[1],
  );

  assert.equal(html.split("<h1").length - 1, 1);
  assert.match(html, /<h1[^>]*>Companion catalog<\/h1>/);
  assert.equal(practiceIds.length, 206);
  assert.equal(new Set(practiceIds).size, 206);
  assert.equal(chapterIds.length, 19);
  assert.match(html, /href="#chapter-1"/);
  assert.match(html, /href="#never-report-a-single-run"/);
  assert.match(html, />56 developed</);
  assert.match(html, />150 companion records</);

  const visibleMarkup = html.replace(
    /<annotation encoding="application\/x-tex">[\s\S]*?<\/annotation>/g,
    "",
  );
  assert.doesNotMatch(visibleMarkup, /\\binom|\\ge/);
});

test("book and companion expose the provisional 1.1 coupling analysis", () => {
  const href = `/books/${BOOK.slug}/coupling`;
  assert.match(page("books", BOOK.slug), new RegExp(`href="${href}"`));
  assert.match(page("books", BOOK.slug, "companion"), new RegExp(`href="${href}"`));

  const html = page("books", BOOK.slug, "coupling");
  assert.equal(html.split("<h1").length - 1, 1);
  assert.match(html, /<h1[^>]*>Cross-layer coupling<\/h1>/);
  assert.match(html, /Companion 1\.1\.0/);
  assert.match(html, /Provisional/);
  assert.match(html, /Dependency chain/);
  assert.match(html, /Coupling graph/);
  assert.match(html, /24 supported common-cause/);
  assert.match(html, /data-coupling-matrix/);
  assert.match(html, /data-coupling-graph/);
  assert.match(html, /10 common-cause mechanisms/);
  assert.match(html, /8 ranked experiments/);
  assert.match(html, /112 open review items/);
});

test("all chapter routes build with one page H1 and reading-order navigation", () => {
  for (const chapter of CHAPTERS) {
    const html = page("books", BOOK.slug, chapter.slug);
    assert.equal(html.split("<h1").length - 1, 1, `${chapter.slug}: H1 count`);
    assert.match(html, new RegExp(`href="/books/${BOOK.slug}"`), `${chapter.slug}: book link`);
  }

  const middle = page("books", BOOK.slug, CHAPTERS[10].slug);
  assert.match(middle, />Previous</);
  assert.match(middle, />Next</);
});

test("figures are inline, responsive, uniquely labelled, transparent, and token-themed", () => {
  const html = page("books", BOOK.slug, "contamination-oracle-workload-validity");
  const css = linkedCss(html);
  assert.match(html, /<svg[^>]*class="bookfig"/);
  assert.doesNotMatch(html, /<img[^>]*ch03-oracle-strength/);
  assert.doesNotMatch(html, /<svg[^>]*class="bookfig"[^>]*\swidth="/);
  assert.doesNotMatch(html, /<svg[^>]*class="bookfig"[^>]*\sheight="/);
  assert.match(css, /rect\.f-bg:first-of-type:not\(\[x\]\):not\(\[y\]\)\{fill:transparent\}/);
  assert.match(css, /\.f-bg\{fill:var\(--color-bg\)\}/);
  assert.match(css, /\.f-ink\{fill:var\(--color-text\)\}/);
  assert.match(css, /\.f-accent\{fill:var\(--color-accent\)\}/);
  assert.match(css, /@media print/);

  const titleIds = [...html.matchAll(/<title id="(figtitle-[^"]+)"/g)].map((match) => match[1]);
  assert.equal(titleIds.length, 1);
  assert.equal(new Set(titleIds).size, titleIds.length);
});

test("all 19 figures are inline and carry globally unique accessible title ids", () => {
  const titleIds = [];
  let figureCount = 0;

  for (const chapter of CHAPTERS) {
    const html = page("books", BOOK.slug, chapter.slug);
    assert.doesNotMatch(html, /<img[^>]*\/book-figures\//, `${chapter.slug}: external SVG`);
    const ids = [...html.matchAll(/<title id="(figtitle-[^"]+)"/g)].map((match) => match[1]);
    figureCount += ids.length;
    titleIds.push(...ids);
  }

  assert.equal(figureCount, 19);
  assert.equal(new Set(titleIds).size, 19);
});

test("text fences scroll within the prose measure", () => {
  const html = page("books", BOOK.slug, "agent-topology-dynamic-task-allocation");
  assert.match(html, /<pre[^>]*>/);
  assert.match(html, /overflow-x:\s*auto/);
});

test("authored equations render as semantic MathML instead of raw LaTeX", () => {
  const html = page("books", BOOK.slug, "variance-power-paired-comparisons");
  assert.match(html, /<math[^>]*display="block"/);
  assert.match(html, /<annotation encoding="application\/x-tex">/);
  const visibleMarkup = html.replace(
    /<annotation encoding="application\/x-tex">[\s\S]*?<\/annotation>/g,
    "",
  );
  assert.doesNotMatch(visibleMarkup, /\\frac|\\operatorname|\\sqrt/);
});
