import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { BUILD_MARKER } from "../scripts/test/build-marker.mjs";

const ENSURE_BUILT = path.resolve("scripts/test/ensure-built.mjs");

const STUB = `
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
const [mode, marker] = process.argv.slice(2);
appendFileSync("calls", \`marker-present=\${existsSync("dist/" + marker)}\\n\`);
mkdirSync("dist", { recursive: true });
if (mode === "fail") {
  writeFileSync("dist/index.html", "half");
  process.exit(3);
}
writeFileSync("dist/index.html", "complete");
`;

async function sandbox(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "ensure-built-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, "stub-build.mjs"), STUB);
  const run = (mode) =>
    spawnSync(
      process.execPath,
      [ENSURE_BUILT, process.execPath, "stub-build.mjs", mode, BUILD_MARKER],
      { cwd: root, encoding: "utf8" },
    );
  const calls = async () =>
    existsSync(path.join(root, "calls"))
      ? (await readFile(path.join(root, "calls"), "utf8")).trim().split("\n")
      : [];
  const marker = path.join(root, "dist", BUILD_MARKER);
  return { root, run, calls, marker };
}

test("a missing marker triggers one build that writes the marker only after it succeeds", async (t) => {
  const box = await sandbox(t);

  const first = box.run("ok");
  assert.equal(first.status, 0, first.stderr);
  assert.deepEqual(await box.calls(), ["marker-present=false"]);
  assert.ok(existsSync(box.marker));

  const second = box.run("ok");
  assert.equal(second.status, 0, second.stderr);
  assert.deepEqual(await box.calls(), ["marker-present=false"]);
});

test("a failing build leaves no marker and exits non-zero", async (t) => {
  const box = await sandbox(t);

  const result = box.run("fail");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /build failed/);
  assert.equal(existsSync(box.marker), false);
  assert.equal(await readFile(path.join(box.root, "dist", "index.html"), "utf8"), "half");

  const retry = box.run("fail");
  assert.notEqual(retry.status, 0);
  assert.equal((await box.calls()).length, 2);
});

test("a partial dist without a marker is rebuilt", async (t) => {
  const box = await sandbox(t);
  await mkdir(path.join(box.root, "dist"));
  await writeFile(path.join(box.root, "dist", "index.html"), "half");

  const result = box.run("ok");
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(await box.calls(), ["marker-present=false"]);
  assert.equal(await readFile(path.join(box.root, "dist", "index.html"), "utf8"), "complete");
  assert.ok(existsSync(box.marker));
});
