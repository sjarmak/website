import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  BaselineError,
  checkBaseline,
  createEmptyState,
  readState,
  rebuildBaseline,
  stateFilePath,
  writeState,
} from "./state.mjs";

const NOTES = [
  { file: "Lorem Ipsum.md", conceptId: "lorem-ipsum", frontmatterHash: "aaa" },
  { file: "Dolor Sit.md", conceptId: "dolor-sit", frontmatterHash: "bbb" },
];

test("empty owned folder needs no baseline (bootstrap)", () => {
  checkBaseline(null, []);
});

test("missing state with mirrored notes present is terminal", () => {
  assert.throws(() => checkBaseline(null, NOTES), BaselineError);
  assert.throws(() => checkBaseline(null, NOTES), /--rebuild-state/);
});

test("state disagreeing with note frontmatter is terminal (notes are authoritative)", () => {
  const state = rebuildBaseline(NOTES, "machine-a");
  checkBaseline(state, NOTES); // in agreement: fine
  const drifted = [{ ...NOTES[0], frontmatterHash: "changed" }, NOTES[1]];
  assert.throws(() => checkBaseline(state, drifted), BaselineError);
  const extraNote = [...NOTES, { file: "New.md", conceptId: "new", frontmatterHash: "ccc" }];
  assert.throws(() => checkBaseline(state, extraNote), BaselineError);
});

test("rebuildBaseline derives state purely from note frontmatter", () => {
  const state = rebuildBaseline(NOTES, "machine-a", new Date("2026-07-04T00:00:00Z"));
  assert.deepEqual(state.notes, {
    "lorem-ipsum": { file: "Lorem Ipsum.md", contentHash: "aaa" },
    "dolor-sit": { file: "Dolor Sit.md", contentHash: "bbb" },
  });
  assert.equal(state.machine, "machine-a");
});

test("state file round-trips and is bound to a machine identity", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "concepts-state-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const filePath = stateFilePath(dir, "machine-a");
  assert.equal(path.basename(filePath), "mirror-machine-a.json");

  assert.equal(await readState(filePath), null, "missing file reads as null, not an error");
  await writeState(filePath, rebuildBaseline(NOTES, "machine-a"));
  const state = await readState(filePath);
  assert.equal(state.machine, "machine-a");
  assert.equal(Object.keys(state.notes).length, 2);

  await unlink(filePath); // test cleanup of the TEST's own temp state file
  assert.equal(await readState(filePath), null);
});

test("unrecognized state shape is a baseline error, not a silent reset", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "concepts-state-bad-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const filePath = stateFilePath(dir, "machine-a");
  await writeState(filePath, { ...createEmptyState("machine-a"), version: 99 });
  await assert.rejects(readState(filePath), BaselineError);
});
