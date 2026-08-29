import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isActiveOnSiteReferenceId, onSiteReferenceId } from "../src/lib/knowledge/onSiteReferences.ts";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const THREADS_PATH = path.join(REPO_ROOT, "src", "data", "knowledge", "threads.json");
const threads = JSON.parse(readFileSync(THREADS_PATH, "utf8")).threads;

function contentEntryExists(collection, slug) {
  const base = path.join(REPO_ROOT, "src", "content", collection);
  return [
    path.join(base, `${slug}.md`),
    path.join(base, `${slug}.mdx`),
    path.join(base, slug, "index.md"),
    path.join(base, slug, "index.mdx"),
  ].some((candidate) => existsSync(candidate));
}

test("knowledge thread on-site references resolve to content entries", () => {
  const missing = [];

  for (const thread of threads) {
    for (const ref of thread.on_site ?? []) {
      const id = onSiteReferenceId(ref);
      if (!isActiveOnSiteReferenceId(id)) continue;
      if (!contentEntryExists(ref.collection, ref.slug)) {
        missing.push(`${thread.id}: ${id}`);
      }
    }
  }

  assert.deepEqual(missing, []);
});
