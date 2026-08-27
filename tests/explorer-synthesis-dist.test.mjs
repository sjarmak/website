// Assertions over the BUILT explorer pages for two joins that are easy to
// break silently:
//
//   1. A section summary written as several paragraphs must render as several
//      <p> elements. [id].astro used to emit the whole summary as one <p>, so a
//      multi-paragraph theme introduction rendered as a wall with the blank
//      lines collapsed and nothing failed.
//   2. Full-text synthesis is keyed by whichever identifier a paper carries.
//      The join was bibcode-only, which silently dropped every synthesis
//      written for a conference paper with no ADS record (PVLDB, CIDR) or for
//      a released artifact keyed by url.
//
// Expected values are read from the committed JSON the pages render.

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(REPO_ROOT, "dist");
const DATA = path.join(REPO_ROOT, "src", "data", "knowledge");

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function explorerSources() {
  const combined = readJson(path.join(DATA, "explorers.json")).explorers;
  const thirty = readJson(path.join(DATA, "explorers", "thirty-papers.json"));
  return [...combined, thirty];
}

function page(id) {
  return readFileSync(path.join(DIST, "library", "explorers", id, "index.html"), "utf8");
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

function paragraphs(summary) {
  return summary.split(/\n{2,}/).filter((p) => p.trim());
}

before(async () => {
  if (!existsSync(path.join(DIST, "index.html"))) {
    await execFileP("npm", ["run", "build"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 });
  }
});

test("section summaries: every authored paragraph gets its own <p>", () => {
  let sawMultiParagraph = false;

  for (const explorer of explorerSources()) {
    const html = page(explorer.id);
    const rendered = new Set(
      [...html.matchAll(/<p class="theme__summary measure"[^>]*>([\s\S]*?)<\/p>/g)].map((m) =>
        m[1].trim(),
      ),
    );
    const expected = explorer.sections.flatMap((s) => paragraphs(s.summary ?? ""));
    if (explorer.sections.some((s) => paragraphs(s.summary ?? "").length > 1)) {
      sawMultiParagraph = true;
    }

    assert.equal(
      rendered.size,
      new Set(expected.map((p) => escapeText(p.trim()))).size,
      `${explorer.id}: summary paragraph count`,
    );
    for (const para of expected) {
      assert.ok(
        rendered.has(escapeText(para.trim())),
        `${explorer.id}: unrendered summary paragraph: ${para.slice(0, 60)}`,
      );
    }
  }

  assert.ok(sawMultiParagraph, "expected at least one multi-paragraph section summary");
});

test("paper synthesis: joins on bibcode, arXiv id or url, and reaches the page", () => {
  const synthesis = readJson(path.join(DATA, "paper-synthesis.json")).synthesis;
  const FIELDS = ["plainAbstract", "motivation", "methodology", "results"];
  let joined = 0;
  let joinedOnNonBibcode = 0;

  for (const explorer of explorerSources()) {
    const html = page(explorer.id);
    for (const paper of explorer.papers) {
      const refs = [paper.bibcode, paper.arxiv, paper.url].filter(Boolean);
      const key = refs.find((r) => synthesis[r]);
      if (!key) continue;
      joined += 1;
      if (key !== paper.bibcode) joinedOnNonBibcode += 1;

      for (const field of FIELDS) {
        const body = synthesis[key][field];
        if (!body?.trim()) continue;
        assert.ok(
          html.includes(escapeText(body.trim())),
          `${explorer.id}: ${paper.title.slice(0, 50)}: ${field} did not reach the page`,
        );
      }
    }
  }

  assert.ok(joined > 0, "expected at least one paper to join a synthesis");
  assert.ok(
    joinedOnNonBibcode > 0,
    "expected at least one synthesis keyed by something other than a bibcode; " +
      "without one this test cannot catch a regression to a bibcode-only join",
  );
});
