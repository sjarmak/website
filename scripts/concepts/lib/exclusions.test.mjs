import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { EXCLUSIONS_PATH, loadExclusions } from "./exclusions.mjs";

test("committed exclusions file contains the hard-excluded vault patterns", async () => {
  const patterns = await loadExclusions();
  assert.equal(path.basename(EXCLUSIONS_PATH), "exclusions.json");
  for (const required of [".claude/", ".claudian/", ".stfolder", ".stignore", "*.sync-conflict-*"]) {
    assert.ok(patterns.includes(required), `missing required exclusion: ${required}`);
  }
  assert.ok(Object.isFrozen(patterns));
});

test("loader rejects malformed or empty exclusion data", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "concepts-excl-"));
  t.after(() => rm(dir, { recursive: true, force: true }));

  const empty = path.join(dir, "empty.json");
  await writeFile(empty, JSON.stringify({ patterns: [] }));
  await assert.rejects(loadExclusions(empty), /non-empty array/);

  const badEntry = path.join(dir, "bad-entry.json");
  await writeFile(badEntry, JSON.stringify({ patterns: [".claude/", 42] }));
  await assert.rejects(loadExclusions(badEntry), /non-empty string/);

  const notJson = path.join(dir, "not.json");
  await writeFile(notJson, "{nope");
  await assert.rejects(loadExclusions(notJson), /malformed exclusions JSON/);

  await assert.rejects(loadExclusions(path.join(dir, "missing.json")), { code: "ENOENT" });
});
