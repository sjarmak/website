import { before, test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_PATH = path.join(
  REPO_ROOT,
  "src",
  "data",
  "knowledge",
  "explorers",
  "thirty-papers.json",
);
const BUILD_SOURCE = path.join(REPO_ROOT, "src", "lib", "knowledge", "build.ts");
const PAGE_SOURCE = path.join(
  REPO_ROOT,
  "src",
  "pages",
  "library",
  "explorers",
  "[id].astro",
);
const DIST_PAGE = path.join(
  REPO_ROOT,
  "dist",
  "library",
  "explorers",
  "thirty-papers",
  "index.html",
);

const explorer = JSON.parse(readFileSync(DATA_PATH, "utf8"));

test("the source collection is preserved as 27 unique readings in seven arcs", () => {
  assert.equal(explorer.id, "thirty-papers");
  assert.equal(explorer.paperCount, 27);
  assert.equal(explorer.papers.length, 27);
  assert.equal(explorer.themeCount, 7);
  assert.equal(explorer.sections.length, 7);
  assert.equal(new Set(explorer.papers.map((paper) => paper.title)).size, 27);
  assert.equal(
    explorer.sections.reduce((total, section) => total + section.count, 0),
    27,
  );
});

test("every reading has a valid source, one known arc, and complete study notes", () => {
  const sectionKeys = new Set(explorer.sections.map((section) => section.key));
  const arxivPapers = explorer.papers.filter((paper) => paper.arxiv);

  assert.equal(arxivPapers.length, 18);
  assert.equal(explorer.source.url, "https://30papers.com/");
  assert.match(explorer.source.note, /rumou?red/i);

  for (const paper of explorer.papers) {
    assert.equal(paper.branches.length, 1, `${paper.title}: branch count`);
    assert.ok(sectionKeys.has(paper.branches[0]), `${paper.title}: unknown branch`);
    assert.ok(paper.arxiv || paper.url, `${paper.title}: missing external source`);
    assert.equal(paper.notes.length, 1, `${paper.title}: study note count`);
    assert.ok(paper.notes[0].takeaway.length >= 40, `${paper.title}: thin takeaway`);
    assert.ok(paper.notes[0].why.length >= 40, `${paper.title}: thin rationale`);
  }
});

test("the knowledge builder appends the dedicated explorer data", () => {
  const source = readFileSync(BUILD_SOURCE, "utf8");
  assert.match(source, /explorers\/thirty-papers\.json/);
  assert.match(source, /thirtyPapersData/);
});

test("the explorer page exposes source provenance and accessible search controls", () => {
  const source = readFileSync(PAGE_SOURCE, "utf8");
  assert.match(source, /data-source-credit/);
  assert.match(source, /data-paper-search/);
  assert.match(source, /aria-controls="themes"/);
  assert.match(source, /data-result-count/);
  assert.match(source, /data-empty-state/);
});

before(async () => {
  if (!existsSync(DIST_PAGE)) {
    await execFileP("npm", ["run", "build"], {
      cwd: REPO_ROOT,
      maxBuffer: 64 * 1024 * 1024,
    });
  }
});

test("the built explorer renders all readings and links back to 30papers.com", () => {
  const html = readFileSync(DIST_PAGE, "utf8");
  assert.equal([...html.matchAll(/<li[^>]*data-paper-row/g)].length, 27);
  assert.match(html, /href="https:\/\/30papers\.com\/"/);
  assert.match(html, /Open 30papers\.com/);
  assert.match(html, /data-paper-search/);
  assert.match(html, /data-result-count[^>]*>\s*27 readings shown/);
});
