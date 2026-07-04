import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  DEFAULT_PIPELINE_HOME,
  INBOX_FILENAME,
  REPO_ROOT,
  SUBDIR_NAMES,
  ensurePipelineHome,
  resolvePipelineHome,
} from "./pipeline-home.mjs";

function isUnder(parent, child) {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

test("default resolution is ~/.concepts-pipeline, never under the repo root", () => {
  const resolved = resolvePipelineHome({});
  assert.equal(resolved, DEFAULT_PIPELINE_HOME);
  assert.ok(!isUnder(REPO_ROOT, resolved), `${resolved} must not be under ${REPO_ROOT}`);
});

test("env override to an outside dir resolves to that dir", () => {
  const outside = path.join(os.tmpdir(), "concepts-home-test");
  const resolved = resolvePipelineHome({ CONCEPTS_PIPELINE_HOME: outside });
  assert.equal(resolved, outside);
  assert.ok(!isUnder(REPO_ROOT, resolved));
});

test("env pointing inside the repo is rejected with an error", () => {
  for (const inside of [REPO_ROOT, path.join(REPO_ROOT, "state"), path.join(REPO_ROOT, "scripts", "concepts")]) {
    assert.throws(
      () => resolvePipelineHome({ CONCEPTS_PIPELINE_HOME: inside }),
      /inside the repo/,
      `expected rejection for ${inside}`,
    );
  }
});

test("relative env value resolving inside the repo (cwd=repo) is rejected", (t) => {
  const prevCwd = process.cwd();
  process.chdir(REPO_ROOT);
  t.after(() => process.chdir(prevCwd));
  assert.throws(() => resolvePipelineHome({ CONCEPTS_PIPELINE_HOME: "./pipeline-home" }), /inside the repo/);
});

test("blank env value falls back to the default", () => {
  assert.equal(resolvePipelineHome({ CONCEPTS_PIPELINE_HOME: "  " }), DEFAULT_PIPELINE_HOME);
});

test("ensurePipelineHome creates subdirs + inbox with a log line, idempotently", async (t) => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), "concepts-home-"));
  t.after(() => rm(tmp, { recursive: true, force: true }));
  const home = path.join(tmp, "pipeline-home");
  const env = { CONCEPTS_PIPELINE_HOME: home };

  const logged = [];
  const first = await ensurePipelineHome(env, { log: (line) => logged.push(line) });

  assert.equal(first.root, home);
  assert.equal(first.inboxPath, path.join(home, INBOX_FILENAME));
  for (const name of SUBDIR_NAMES) {
    const dir = path.join(home, name);
    assert.ok((await stat(dir)).isDirectory(), `${dir} must exist`);
  }
  assert.ok((await stat(first.inboxPath)).isFile());
  assert.equal(first.created.length, 1 + SUBDIR_NAMES.length + 1);
  assert.equal(logged.length, 1, "creation must be logged");
  assert.match(logged[0], /created pipeline home/);

  const second = await ensurePipelineHome(env, { log: (line) => logged.push(line) });
  assert.deepEqual(second.created, []);
  assert.equal(logged.length, 1, "no log line when nothing was created");
});
