// Assertions over the BUILT related-link surfaces (PRD R5). Expected values
// are computed from committed source through the same derivation the pages
// use — never hardcoded slugs. If dist/ is absent the suite builds it.

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { canonicalConceptSlug } from "../src/lib/knowledge/conceptAliases.ts";
import { loadDigestDocs } from "../src/lib/knowledge/conceptMembership.ts";
import {
  loadPostDocs,
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

test("posts: related block renders exactly when tag->concept edges exist", () => {
  const posts = loadPostDocs();
  assert.ok(posts.length > 0);
  const docs = loadRelatedDocs();
  for (const post of posts) {
    const html = page(path.join("writing", post.id));
    if (post.concepts.length === 0) {
      assert.equal(count(html, BLOCK_MARKER), 0, `writing/${post.id}: empty related block`);
      continue;
    }
    assert.ok(count(html, BLOCK_MARKER) > 0, `writing/${post.id}: expected a related block`);
    for (const slug of post.concepts) {
      assert.ok(
        html.includes(`href="/concepts/${slug}/"`),
        `writing/${post.id}: missing concept link ${slug}`,
      );
    }
    for (const item of relatedItems(post.concepts, docs, { kind: "essay", id: post.id })) {
      assert.ok(html.includes(`href="${item.url}"`), `writing/${post.id}: missing item ${item.url}`);
    }
  }
});

test("projects: related block renders exactly when topic/tag->concept edges exist", () => {
  const projects = loadProjectDocs();
  assert.ok(projects.length > 0);
  const withEdges = projects.filter((p) => p.concepts.length > 0);
  const without = projects.filter((p) => p.concepts.length === 0);
  assert.ok(withEdges.length > 0, "expected at least one project with concept edges");
  assert.ok(without.length > 0, "expected at least one project without edges (no-empty-block exemplar)");
  for (const project of projects) {
    const html = page(path.join("projects", project.id));
    if (project.concepts.length === 0) {
      assert.equal(count(html, BLOCK_MARKER), 0, `projects/${project.id}: empty related block`);
      continue;
    }
    assert.ok(count(html, BLOCK_MARKER) > 0, `projects/${project.id}: expected a related block`);
    for (const slug of project.concepts) {
      assert.ok(
        html.includes(`href="/concepts/${slug}/"`),
        `projects/${project.id}: missing concept link ${slug}`,
      );
    }
  }
});

test("talks index: one related-concepts line per talk with derived edges, anchors for all", () => {
  const talks = loadTalkDocs();
  const withEdges = talks.filter((t) => t.concepts.length > 0);
  assert.ok(withEdges.length > 0, "expected at least one talk joined to an outputs entry");
  const html = page("talks");
  assert.equal(
    count(html, 'class="related-block related-block--line'),
    withEdges.length,
    "talks index: line count must equal derived talk edge count",
  );
  for (const talk of withEdges) {
    for (const slug of talk.concepts) {
      assert.ok(html.includes(`href="/concepts/${slug}/"`), `talks: missing concept link ${slug}`);
    }
  }
  // Every talk article carries its deep-link anchor (target of /talks/#<id>).
  for (const talk of talks) {
    assert.ok(html.includes(`id="${talk.id}"`), `talks: missing anchor id ${talk.id}`);
  }
});

test("digest chips: resolvable facets link to concept pages, unresolvable stay plain", () => {
  // register-stability.test.mjs writes a transient fixture issue into
  // src/content/digest while suites run in parallel; only assert over issues
  // that were part of the committed build (their dist page exists).
  const digests = loadDigestDocs().filter((d) =>
    existsSync(path.join(DIST, "digest", d.slug, "index.html")),
  );
  assert.ok(digests.length > 0);
  let sawResolvable = false;
  let sawUnresolvable = false;
  for (const digest of digests) {
    const html = page(path.join("digest", digest.slug));
    const resolved = digest.facets
      .map((f) => canonicalConceptSlug(f))
      .filter((s) => s !== null);
    assert.equal(
      count(html, 'class="tag digest__topic-link'),
      resolved.length,
      `digest/${digest.slug}: chip link count != resolvable facet count`,
    );
    for (const slug of resolved) {
      sawResolvable = true;
      assert.ok(
        new RegExp(`<a class="tag digest__topic-link[^"]*" href="/concepts/${slug}/"`).test(html),
        `digest/${digest.slug}: facet chip for ${slug} must link its concept page`,
      );
    }
    for (const facet of digest.facets) {
      if (canonicalConceptSlug(facet) !== null) continue;
      sawUnresolvable = true;
      const label = facet.replace(/-/g, " ");
      assert.ok(
        new RegExp(`<span class="tag[^"]*"[^>]*>${label}</span>`).test(html),
        `digest/${digest.slug}: unresolvable facet "${facet}" must stay a plain span`,
      );
    }
    // Digest pages never render a related block (chips only).
    assert.equal(count(html, BLOCK_MARKER), 0, `digest/${digest.slug}: unexpected related block`);
  }
  assert.ok(sawResolvable, "corpus should contain at least one resolvable facet");
  assert.ok(sawUnresolvable, "corpus should contain at least one unresolvable facet");
});
