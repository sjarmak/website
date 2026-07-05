// Assertions over the BUILT project pages: the "Related" block renders
// exactly when topic/tag->concept edges derive, concept chips are plain text
// (no /concepts/ pages exist on this site — any such href would 404), and
// related items are real links. Expected values are computed from committed
// source through the same derivation the pages use — never hardcoded slugs.
// If dist/ is absent the suite builds it.

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import {
  conceptLabel,
  loadProjectDocs,
  loadRelatedDocs,
  loadTalkDocs,
  relatedItems,
} from "../src/lib/knowledge/relatedContent.ts";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(REPO_ROOT, "dist");

// Markup-only marker: the class attribute of a rendered block (scoped class
// gets appended), NOT the ".related-block" selector text of inlined CSS.
const BLOCK_MARKER = 'class="related-block';
const CHIP_MARKER = '<span class="tag related-block__concept';

function page(rel) {
  return readFileSync(path.join(DIST, rel, "index.html"), "utf8");
}

function count(html, needle) {
  return html.split(needle).length - 1;
}

before(async () => {
  if (!existsSync(path.join(DIST, "index.html"))) {
    await execFileP("npm", ["run", "build"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 });
  }
});

test("projects: related block renders exactly when concept edges derive", () => {
  const projects = loadProjectDocs();
  assert.ok(projects.length > 0);
  const withEdges = projects.filter((p) => p.concepts.length > 0);
  const without = projects.filter((p) => p.concepts.length === 0);
  assert.ok(withEdges.length > 0, "expected at least one project with concept edges");
  assert.ok(
    without.some((p) => p.id === "embertide"),
    "expected embertide to be an edge-less exemplar",
  );

  const docs = loadRelatedDocs();
  let sawRelatedLink = false;
  for (const project of projects) {
    const rel = path.join("projects", project.id);
    const html = page(rel);

    // No /concepts/ pages exist — no project page may link there.
    assert.equal(count(html, 'href="/concepts/'), 0, `${rel}: /concepts/ href would 404`);

    if (project.concepts.length === 0) {
      assert.equal(count(html, BLOCK_MARKER), 0, `${rel}: empty related block`);
      continue;
    }

    assert.ok(count(html, BLOCK_MARKER) > 0, `${rel}: expected a related block`);

    // Concept chips: plain-text spans, one per derived concept, never anchors.
    assert.equal(count(html, CHIP_MARKER), project.concepts.length, `${rel}: chip count`);
    assert.equal(count(html, '<a class="tag related-block__concept'), 0, `${rel}: chip is a link`);
    for (const slug of project.concepts) {
      assert.ok(
        html.includes(`>${conceptLabel(slug)}</span>`),
        `${rel}: missing plain-text label for ${slug}`,
      );
    }

    // Related items render as real links to their derived urls.
    for (const item of relatedItems(project.concepts, docs, {
      kind: "project",
      id: project.id,
    })) {
      assert.ok(html.includes(`href="${item.url}"`), `${rel}: missing item link ${item.url}`);
      sawRelatedLink = true;
    }
  }
  assert.ok(sawRelatedLink, "expected at least one project page with a real related link");
});

test("talks index: every talk carries its deep-link anchor (target of /talks/#<id>)", () => {
  const html = page("talks");
  const talks = loadTalkDocs();
  assert.ok(talks.length > 0);
  for (const talk of talks) {
    assert.ok(html.includes(`id="${talk.id}"`), `talks: missing anchor id ${talk.id}`);
  }
});
