// Assertions over the BUILT explorer pages: every note string a section
// carries in committed data (themes / gaps / questions) reaches its page.
// Expected values are read from the committed JSON the pages render, never
// hardcoded. Regression guard for sjai-6nvv: `questions` was declared in
// types.ts and carried through build_explorers.py, but [id].astro rendered
// only themes and gaps, so all 33 of memory-design's questions were built
// into the data and dropped silently at render time.
// If dist/ is absent the suite builds it.

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(REPO_ROOT, "dist");
const DATA = path.join(REPO_ROOT, "src", "data", "knowledge");

// Section list fields, paired with the toggle label [id].astro renders them under.
const NOTE_FIELDS = [
  ["themes", "Key threads"],
  ["gaps", "Open gaps"],
  ["questions", "Open questions"],
];

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

// Explorers as the pages get them: the built bundle plus thirty-papers, which
// src/lib/knowledge/build.ts imports from its own file.
function explorerSources() {
  const combined = readJson(path.join(DATA, "explorers.json")).explorers;
  const thirty = readJson(path.join(DATA, "explorers", "thirty-papers.json"));
  return [...combined, thirty];
}

// Astro escapes &, <, >, " and ' in text nodes; non-ASCII passes through.
function escapeText(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function page(id) {
  return readFileSync(path.join(DIST, "library", "explorers", id, "index.html"), "utf8");
}

// Astro appends a data-astro-cid-* attribute to every element it scopes, so
// anchor on the class and the label rather than a literal tag string.
function toggleCount(html, label) {
  return (html.match(new RegExp(`<summary class="note__toggle"[^>]*>${label}</summary>`, "g")) ?? [])
    .length;
}

function renderedNoteItems(html) {
  const items = new Set();
  for (const match of html.matchAll(/<li class="measure"[^>]*>([\s\S]*?)<\/li>/g)) {
    items.add(match[1].trim());
  }
  return items;
}

before(async () => {
  if (!existsSync(path.join(DIST, "index.html"))) {
    await execFileP("npm", ["run", "build"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 });
  }
});

test("every explorer page is covered by a committed source", () => {
  const built = readdirSync(path.join(DIST, "library", "explorers"), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  const known = explorerSources()
    .map((e) => e.id)
    .sort();
  assert.ok(built.length > 0, "expected built explorer pages");
  assert.deepEqual(built, known, "built explorer pages and committed sources disagree");
});

test("section notes: every authored string renders under its own toggle", () => {
  let sawQuestions = false;
  for (const explorer of explorerSources()) {
    const html = page(explorer.id);
    const rendered = renderedNoteItems(html);
    assert.ok(explorer.sections.length > 0, `${explorer.id}: no sections`);

    for (const [field, label] of NOTE_FIELDS) {
      const withField = explorer.sections.filter((s) => (s[field] ?? []).length > 0);
      assert.equal(
        toggleCount(html, label),
        withField.length,
        `${explorer.id}: ${label} toggle count`,
      );
      for (const section of withField) {
        if (field === "questions") sawQuestions = true;
        for (const item of section[field]) {
          assert.ok(
            rendered.has(escapeText(item)),
            `${explorer.id}/${section.key}: unrendered ${field} entry: ${item.slice(0, 60)}`,
          );
        }
      }
    }
  }
  assert.ok(sawQuestions, "expected at least one section carrying questions");
});
