// End-to-end mirror runs against a SYNTHETIC fixture vault (schema-generated,
// lorem content — never derived from real notes). The vault root is always
// injected through the fixture sandbox env; no real path appears here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, stat, unlink, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import { buildFixtureSandbox, FIXTURE_VAULT_NOTE } from "../scripts/concepts/mirror/fixture.mjs";
import { REPO_ROOT } from "../scripts/concepts/lib/pipeline-home.mjs";
import { contentHash, parseNote } from "../scripts/concepts/mirror/normalize.mjs";
import { stateFilePath } from "../scripts/concepts/mirror/state.mjs";

const run = promisify(execFile);
const RUNNER = path.join(REPO_ROOT, "scripts", "concepts", "mirror", "run-mirror.mjs");
const MACHINE = "fixture-machine";
const NOW = "2026-07-04T00:00:00.000Z";
const FOLDER = "sjarmak-ai Concepts";

async function sandbox(t, opts) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "concepts-mirror-e2e-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const sb = await buildFixtureSandbox(dir, opts);
  return { dir, ...sb, ownedDir: path.join(sb.vaultRoot, FOLDER) };
}

async function runMirrorCli(sb, args = []) {
  const env = { ...process.env, ...sb.env };
  try {
    const { stdout, stderr } = await run(
      process.execPath,
      [RUNNER, "--machine", MACHINE, "--now", NOW, ...args],
      { env, cwd: REPO_ROOT },
    );
    return { code: 0, out: stdout + stderr };
  } catch (err) {
    return { code: err.code, out: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
}

/** Snapshot mtime+inode+size of every file under a tree. */
async function fsSnapshot(root) {
  const snapshot = new Map();
  async function walk(dir, rel) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(path.join(dir, entry.name), entryRel);
      else {
        const s = await stat(path.join(dir, entry.name));
        snapshot.set(entryRel, `${s.ino}:${s.mtimeMs}:${s.size}`);
      }
    }
  }
  await walk(root, "");
  return snapshot;
}

async function latestConflictReport(pipelineHome) {
  const dir = path.join(pipelineHome, "conflicts");
  const files = (await readdir(dir)).filter((f) => f.startsWith("mirror-")).sort();
  assert.ok(files.length > 0, "a conflict report is written every run");
  return JSON.parse(await readFile(path.join(dir, files[files.length - 1]), "utf8"));
}

test("missing vault root is a hard usage error (exit 2), never a default", async (t) => {
  const sb = await sandbox(t);
  delete sb.env.CONCEPTS_VAULT_ROOT;
  const { code, out } = await runMirrorCli(sb, ["--write"]);
  assert.equal(code, 2, out);
  assert.match(out, /no default vault location/);
});

test("dry-run is the default: no writes, plan only", async (t) => {
  const sb = await sandbox(t);
  const before = await fsSnapshot(sb.vaultRoot);
  const { code, out } = await runMirrorCli(sb);
  assert.equal(code, 0, out);
  assert.match(out, /dry-run: would write/);
  assert.deepEqual(await fsSnapshot(sb.vaultRoot), before, "dry-run must not touch the vault");
});

test("--write without CONCEPTS_MIRROR_CONFIRM=1 is refused before any write", async (t) => {
  const sb = await sandbox(t, { confirm: false });
  const before = await fsSnapshot(sb.vaultRoot);
  const { code, out } = await runMirrorCli(sb, ["--write"]);
  assert.equal(code, 2, out);
  assert.match(out, /CONCEPTS_MIRROR_CONFIRM=1/);
  assert.deepEqual(await fsSnapshot(sb.vaultRoot), before);
});

test("bootstrap write + idempotence: second run writes zero bytes", async (t) => {
  const sb = await sandbox(t);
  const first = await runMirrorCli(sb, ["--write"]);
  assert.equal(first.code, 0, first.out);
  assert.match(first.out, /2 written/);

  const files = (await readdir(sb.ownedDir)).sort();
  assert.deepEqual(files, ["Dolor Sit.md", "Lorem Ipsum.md"]);
  const note = parseNote(await readFile(path.join(sb.ownedDir, "Lorem Ipsum.md"), "utf8"));
  assert.equal(note.frontmatter["concept-id"], "lorem-ipsum");
  assert.equal(note.frontmatter["content-hash"], contentHash(note.managed), "frontmatter hash binds the region");
  assert.equal((await readdir(sb.ownedDir)).filter((f) => f.includes(".concepts-tmp-")).length, 0);

  // Idempotence: mtime/inode/size scan across the WHOLE fixture vault.
  const before = await fsSnapshot(sb.vaultRoot);
  const second = await runMirrorCli(sb, ["--write"]);
  assert.equal(second.code, 0, second.out);
  assert.match(second.out, /0 written/);
  assert.deepEqual(await fsSnapshot(sb.vaultRoot), before, "unchanged concepts must write zero bytes");
});

test("human edit inside the managed region: skip + reference-only conflict entry", async (t) => {
  const sb = await sandbox(t);
  await runMirrorCli(sb, ["--write"]);
  const notePath = path.join(sb.ownedDir, "Lorem Ipsum.md");
  const edited = (await readFile(notePath, "utf8")).replace(
    "## Papers",
    "## Papers\n\n- my private annotation SENTINEL-EDIT",
  );
  await writeFile(notePath, edited, "utf8");
  const editedStat = await stat(notePath);

  const { code, out } = await runMirrorCli(sb, ["--write"]);
  assert.equal(code, 0, out, "fail-the-note-not-the-run");
  const report = await latestConflictReport(sb.pipelineHome);
  const entry = report.entries.find((e) => e.type === "human-edit");
  assert.ok(entry, "human edit must be surfaced");
  assert.equal(entry.path, path.join(FOLDER, "Lorem Ipsum.md"));
  assert.ok(entry.expectedHash && entry.actualHash && entry.expectedHash !== entry.actualHash);
  assert.ok(Number.isInteger(entry.beginLine) && Number.isInteger(entry.endLine));
  // Reference-only: the report must NEVER quote note content.
  assert.ok(!JSON.stringify(report).includes("SENTINEL-EDIT"), "conflict entries must not contain note content");

  const after = await stat(notePath);
  assert.equal(after.mtimeMs, editedStat.mtimeMs, "the edited note must not be overwritten");
});

test("simulated Obsidian link rewrite re-converges: no conflict, no rewrite", async (t) => {
  const sb = await sandbox(t);
  await runMirrorCli(sb, ["--write"]);
  const notePath = path.join(sb.ownedDir, "Lorem Ipsum.md");
  // Obsidian-style rewrite after a move/rename: path inserted + alias added.
  const rewritten = (await readFile(notePath, "utf8")).replace(
    `[[${FIXTURE_VAULT_NOTE}]]`,
    `[[Archive/${FIXTURE_VAULT_NOTE}|${FIXTURE_VAULT_NOTE}]]`,
  );
  await writeFile(notePath, rewritten, "utf8");
  const rewrittenStat = await stat(notePath);

  const { code, out } = await runMirrorCli(sb, ["--write"]);
  assert.equal(code, 0, out);
  const report = await latestConflictReport(sb.pipelineHome);
  assert.equal(report.entries.filter((e) => e.type === "human-edit").length, 0, "link rewrite is not a human edit");
  const after = await stat(notePath);
  assert.equal(after.mtimeMs, rewrittenStat.mtimeMs, "re-converged note must not be rewritten");
});

test("state-file deletion with notes present: terminal, zero writes; --rebuild-state recovers", async (t) => {
  const sb = await sandbox(t);
  await runMirrorCli(sb, ["--write"]);
  const statePath = stateFilePath(path.join(sb.pipelineHome, "state"), MACHINE);
  await unlink(statePath); // simulate cache loss (test-owned temp file)

  const before = await fsSnapshot(sb.vaultRoot);
  for (const args of [["--write"], []]) {
    const { code, out } = await runMirrorCli(sb, args);
    assert.equal(code, 1, `terminal in ${args.includes("--write") ? "write" : "dry-run"} mode too\n${out}`);
    assert.match(out, /TERMINAL/);
    assert.match(out, /--rebuild-state/);
  }
  assert.deepEqual(await fsSnapshot(sb.vaultRoot), before, "terminal state must write zero bytes");

  // Explicit human rebuild: baseline re-derived from note frontmatter.
  const rebuilt = await runMirrorCli(sb, ["--write", "--rebuild-state"]);
  assert.equal(rebuilt.code, 0, rebuilt.out);
  assert.match(rebuilt.out, /baseline rebuilt from note frontmatter \(2 notes\)/);
  const state = JSON.parse(await readFile(statePath, "utf8"));
  const note = parseNote(await readFile(path.join(sb.ownedDir, "Lorem Ipsum.md"), "utf8"));
  assert.equal(state.notes["lorem-ipsum"].contentHash, note.frontmatter["content-hash"]);
  assert.deepEqual(await fsSnapshot(sb.vaultRoot), before, "rebuild converges without rewriting notes");

  const normal = await runMirrorCli(sb, ["--write"]);
  assert.equal(normal.code, 0, normal.out);
});

test("basename collision with a non-mirror note: flagged, never renamed", async (t) => {
  const sb = await sandbox(t);
  const foreign = path.join(sb.vaultRoot, "Notes", "Lorem Ipsum.md");
  await writeFile(foreign, "Her own pre-existing note (lorem).\n", "utf8");

  const { code, out } = await runMirrorCli(sb, ["--write"]);
  assert.equal(code, 0, out);
  const report = await latestConflictReport(sb.pipelineHome);
  const entry = report.entries.find((e) => e.type === "basename-collision");
  assert.ok(entry, "collision must be surfaced");
  assert.deepEqual(entry.paths, ["Notes/Lorem Ipsum.md"]);
  assert.equal(await readFile(foreign, "utf8"), "Her own pre-existing note (lorem).\n", "foreign note untouched");
  assert.ok((await readdir(path.join(sb.vaultRoot, "Notes"))).includes("Lorem Ipsum.md"), "no rename");
});

test("dangling generated wikilink fails that note only", async (t) => {
  const sb = await sandbox(t);
  // Remove the vault note the lorem-ipsum evidence links to.
  await rm(path.join(sb.vaultRoot, "Notes", `${FIXTURE_VAULT_NOTE}.md`));

  const { code, out } = await runMirrorCli(sb, ["--write"]);
  assert.equal(code, 0, out, "the run itself succeeds");
  const files = (await readdir(sb.ownedDir)).sort();
  assert.deepEqual(files, ["Dolor Sit.md"], "only the note with the dangling link is skipped");
  const report = await latestConflictReport(sb.pipelineHome);
  const entry = report.entries.find((e) => e.type === "dangling-wikilink");
  assert.equal(entry.conceptId, "lorem-ipsum");
  assert.equal(entry.target, FIXTURE_VAULT_NOTE);
});

test("sync-conflict files are surfaced, never merged or deleted", async (t) => {
  const sb = await sandbox(t);
  await runMirrorCli(sb, ["--write"]);
  const conflictName = "Lorem Ipsum.sync-conflict-20260704-000000-AAAAAAA.md";
  await writeFile(path.join(sb.ownedDir, conflictName), "syncthing conflict copy\n", "utf8");

  const { code, out } = await runMirrorCli(sb, ["--write"]);
  assert.equal(code, 0, out);
  const report = await latestConflictReport(sb.pipelineHome);
  const entry = report.entries.find((e) => e.type === "sync-conflict-file");
  assert.equal(entry.path, path.join(FOLDER, conflictName));
  assert.ok((await readdir(sb.ownedDir)).includes(conflictName), "conflict file must survive the run");
});

test("leftover temp files are quarantined into the report and block that note's write", async (t) => {
  const sb = await sandbox(t);
  await runMirrorCli(sb, ["--write"]);
  const tempName = "Lorem Ipsum.md.concepts-tmp-999-dead";
  await writeFile(path.join(sb.ownedDir, tempName), "interrupted journal\n", "utf8");
  // Force a content change so the note WOULD be written without the temp.
  const assignments = JSON.parse(await readFile(sb.data.assignmentsPath, "utf8"));
  delete assignments["digest:daily-0002"];
  await writeFile(sb.data.assignmentsPath, JSON.stringify(assignments), "utf8");

  const { code, out } = await runMirrorCli(sb, ["--write"]);
  assert.equal(code, 0, out);
  const report = await latestConflictReport(sb.pipelineHome);
  assert.ok(report.entries.some((e) => e.type === "leftover-temp" && e.path.endsWith(tempName)));
  assert.equal(await readFile(path.join(sb.ownedDir, tempName), "utf8"), "interrupted journal\n", "temp preserved");
  assert.match(
    await readFile(path.join(sb.ownedDir, "Lorem Ipsum.md"), "utf8"),
    /daily-0002/,
    "note with a leftover journal must not be rewritten this run",
  );
});

test("unreachable vault root exits non-zero", async (t) => {
  const sb = await sandbox(t);
  sb.env.CONCEPTS_VAULT_ROOT = path.join(sb.dir, "vault-not-mounted");
  const { code, out } = await runMirrorCli(sb, ["--write"]);
  assert.equal(code, 1, out);
  assert.match(out, /not reachable/);
});

test("--top-n limits mirrored notes to the highest-evidence concepts", async (t) => {
  const sb = await sandbox(t);
  const { code, out } = await runMirrorCli(sb, ["--write", "--top-n", "1"]);
  assert.equal(code, 0, out);
  assert.deepEqual((await readdir(sb.ownedDir)).sort(), ["Lorem Ipsum.md"]);
});
