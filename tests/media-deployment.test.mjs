import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import YAML from "yaml";

import { forbiddenMediaPaths, parseNameStatus } from "../scripts/checks/media-guard.mjs";
import { git, runNode } from "./helpers/digest-sandbox.mjs";

const blueprint = YAML.parse(await readFile("render.yaml", "utf8"));
const ZERO_SHA = "0".repeat(40);

test("Render isolates the media archive from ordinary site deploys", () => {
  const site = blueprint.services.find((service) => service.name === "sjarmak-ai");
  const media = blueprint.services.find(
    (service) => service.name === "sjarmak-ai-media",
  );

  assert.ok(site, "main site service is missing");
  assert.ok(media, "media service is missing");
  assert.equal(media.branch, "media");
  assert.equal(media.runtime, "static");
  assert.equal(media.staticPublishPath, "./public/media");
  assert.deepEqual(media.buildFilter.paths, ["public/media/**"]);
});

test("existing /media URLs are served by the isolated media service", () => {
  const site = blueprint.services.find((service) => service.name === "sjarmak-ai");
  const mediaRoute = site.routes?.find((route) => route.source === "/media/*");

  assert.deepEqual(mediaRoute, {
    type: "rewrite",
    source: "/media/*",
    destination: "https://sjarmak-ai-media.onrender.com/*",
  });
});

test("the media guard flags added or rewritten files under public/media and nothing else", () => {
  const listing = [
    "A", "public/media/digests/daily-2026-10-16.mp3",
    "M", "public/media/digests/daily-2026-10-15.mp3",
    "T", "public/media/video/talk.mp4",
    "A", "src/content/digest/daily-2026-10-16.md",
    "A", "public/mediakit/logo.png",
    "A", "public/media",
    "A", "public/media.bak",
    "",
  ].join("\0");
  const entries = parseNameStatus(listing);
  assert.equal(entries.length, 7);
  assert.deepEqual(forbiddenMediaPaths(entries), [
    "public/media",
    "public/media/digests/daily-2026-10-15.mp3",
    "public/media/digests/daily-2026-10-16.mp3",
    "public/media/video/talk.mp4",
  ]);
  assert.deepEqual(forbiddenMediaPaths(parseNameStatus("")), []);
  assert.throws(() => parseNameStatus("A\0"), /malformed/);
});

async function guardRepo(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "media-guard-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "sandbox@example.invalid");
  git(root, "config", "user.name", "Guard Sandbox");
  const commit = async (files, message) => {
    for (const [file, body] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(root, file)), { recursive: true });
      await writeFile(path.join(root, file), body);
    }
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", message);
    return git(root, "rev-parse", "HEAD");
  };
  const guard = (base, head) =>
    runNode("scripts/checks/media-guard.mjs", ["--base", base, "--head", head], { cwd: root, env: process.env }).done;
  return { root, commit, guard };
}

test("the media guard fails a push that commits new media and passes content-only pushes", async (t) => {
  const repo = await guardRepo(t);
  const root = await repo.commit({ "README.md": "site\n" }, "baseline");
  const media = await repo.commit({ "public/media/digests/daily-2026-10-16.mp3": "ID3" }, "commit audio");
  const content = await repo.commit({ "src/content/digest/daily-2026-10-16.md": "---\n---\n" }, "content");
  git(repo.root, "rm", "-q", "public/media/digests/daily-2026-10-16.mp3");
  git(repo.root, "commit", "-q", "-m", "drop audio");
  const removal = git(repo.root, "rev-parse", "HEAD");

  const blocked = await repo.guard(root, media);
  assert.equal(blocked.status, 1);
  assert.match(blocked.stderr, /public\/media\/digests\/daily-2026-10-16\.mp3/);
  assert.match(blocked.stderr, /does not belong in the site build/);

  assert.equal((await repo.guard(root, content)).status, 1);
  assert.equal((await repo.guard(media, content)).status, 0);
  assert.equal((await repo.guard(content, removal)).status, 0);
  assert.equal((await repo.guard(ZERO_SHA, content)).status, 0);
  assert.equal((await repo.guard("", media)).status, 1);
});

test("the media guard fails a push that puts a symlink at public/media itself", async (t) => {
  const repo = await guardRepo(t);
  const base = await repo.commit({ "public/robots.txt": "", "archive/a.mp3": "ID3" }, "baseline");
  await symlink("../archive", path.join(repo.root, "public", "media"));
  git(repo.root, "add", "-A");
  git(repo.root, "commit", "-q", "-m", "link the archive into the build");
  const linked = git(repo.root, "rev-parse", "HEAD");
  const result = await repo.guard(base, linked);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /^ {2}public\/media$/m);
});

test("the media guard checks a first push against the empty tree", async (t) => {
  const repo = await guardRepo(t);
  const clean = await repo.commit({ "README.md": "site\n" }, "baseline");
  assert.equal((await repo.guard(ZERO_SHA, clean)).status, 0);

  const other = await guardRepo(t);
  const dirty = await other.commit({ "public/media/a.mp3": "ID3" }, "first commit carries audio");
  const result = await other.guard(ZERO_SHA, dirty);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /public\/media\/a\.mp3/);
});
