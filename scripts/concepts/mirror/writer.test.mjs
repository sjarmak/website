import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ensureOwnedFolder, journaledWrite } from "./writer.mjs";

async function ownedDir(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "concepts-writer-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const owned = path.join(dir, "sjarmak-ai Concepts");
  await ensureOwnedFolder(owned, { log: () => {} });
  return owned;
}

test("journaled write lands the final file with no temp residue", async (t) => {
  const owned = await ownedDir(t);
  const bytes = await journaledWrite(owned, "Lorem Ipsum.md", "content\n");
  assert.equal(bytes, 8);
  assert.equal(await readFile(path.join(owned, "Lorem Ipsum.md"), "utf8"), "content\n");
  assert.deepEqual(await readdir(owned), ["Lorem Ipsum.md"], "temp journal must be gone after commit");
});

test("filenames that would escape the owned folder are rejected before any write", async (t) => {
  const owned = await ownedDir(t);
  for (const name of ["../escape.md", "..", "sub/nested.md", `..${path.sep}up.md`, ""]) {
    await assert.rejects(journaledWrite(owned, name, "x"), /outside the owned folder/, JSON.stringify(name));
  }
  // Absolute path smuggled as a "filename".
  const outside = path.join(path.dirname(owned), "outside.md");
  await assert.rejects(journaledWrite(owned, outside, "x"), /outside the owned folder/);
  assert.deepEqual(await readdir(owned), [], "no write may have happened");
  assert.deepEqual(
    (await readdir(path.dirname(owned))).sort(),
    [path.basename(owned)],
    "nothing escaped into the parent",
  );
});

test("overwrite goes through a fresh temp journal (wx) each time", async (t) => {
  const owned = await ownedDir(t);
  await journaledWrite(owned, "Note.md", "v1\n");
  await journaledWrite(owned, "Note.md", "v2\n");
  assert.equal(await readFile(path.join(owned, "Note.md"), "utf8"), "v2\n");
  assert.deepEqual(await readdir(owned), ["Note.md"]);
});
