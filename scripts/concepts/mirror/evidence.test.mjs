import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildEvidence, topConcepts } from "./evidence.mjs";
import { buildFixtureData, FIXTURE_VAULT_NOTE } from "./fixture.mjs";

async function fixturePaths(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "concepts-evidence-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return buildFixtureData(dir);
}

test("joins assignments, digests, explorers, threads, and vault notes per concept", async (t) => {
  const bundles = await buildEvidence(await fixturePaths(t));

  const lorem = bundles.find((b) => b.slug === "lorem-ipsum");
  assert.equal(lorem.count, 5);
  assert.deepEqual(
    lorem.evidence.digests.map((d) => d.title),
    ["Fixture digest issue one", "Fixture digest issue two"],
  );
  assert.equal(lorem.evidence.papers[0].title, "Synthetic Paper One");
  assert.equal(lorem.evidence.papers[0].takeaway, "Synthetic paper takeaway.");
  assert.match(lorem.evidence.papers[0].url, /adsabs/);
  assert.deepEqual(lorem.evidence.vaultNotes, [{ id: FIXTURE_VAULT_NOTE, target: FIXTURE_VAULT_NOTE }]);
  // Branch "lorem" alias-resolves to lorem-ipsum via the facet index.
  assert.equal(lorem.evidence.explorerSections.length, 1);
  assert.match(lorem.evidence.explorerSections[0].url, /fixture-explorer#lorem/);

  const dolor = bundles.find((b) => b.slug === "dolor-sit");
  assert.equal(dolor.count, 3);
  assert.equal(dolor.evidence.threads[0].title, "Synthetic fixture question?");
  // Paper without an assignment takeaway falls back to explorer notes (none here).
  assert.equal(dolor.evidence.papers[0].takeaway, undefined);
});

test("ranking is deterministic and topConcepts drops zero-evidence concepts", async (t) => {
  const bundles = await buildEvidence(await fixturePaths(t));
  assert.deepEqual(
    bundles.map((b) => b.slug),
    ["lorem-ipsum", "dolor-sit", "amet-consectetur"],
  );
  assert.deepEqual(
    topConcepts(bundles, 10).map((b) => b.slug),
    ["lorem-ipsum", "dolor-sit"],
  );
  assert.deepEqual(
    topConcepts(bundles, 1).map((b) => b.slug),
    ["lorem-ipsum"],
  );
  assert.throws(() => topConcepts(bundles, 0), /positive integer/);
});

test("missing source paths are hard errors, never defaults", async () => {
  await assert.rejects(buildEvidence({}), /conceptsDir path is required/);
});
