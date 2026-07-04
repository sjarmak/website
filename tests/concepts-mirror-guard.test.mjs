// CI guard: statically assert the vault-safety invariants of the mirror.
//   1. No forbidden real vault path appears anywhere in mirror code, tests,
//      or fixtures (the path literal is assembled at runtime so this guard
//      itself never contains it).
//   2. CONCEPTS_VAULT_ROOT never gets a non-empty default — the vault root
//      is always injected.
//   3. The mirror runtime has no delete codepath (unlink/rm/rmdir) and no
//      rename-as-delete; its only rename is the journal commit in writer.mjs.
//   4. No test reads a vault tree: tests only touch temp sandboxes, so no
//      hardcoded home-directory absolute paths may appear under tests/ or
//      scripts/concepts/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { REPO_ROOT } from "../scripts/concepts/lib/pipeline-home.mjs";

// Assembled at runtime; the literal must never exist in the tree.
const FORBIDDEN_VAULT_PATH = ["", "home", "ds", "br" + "ain"].join("/");

const MIRROR_DIR = path.join(REPO_ROOT, "scripts", "concepts", "mirror");
const SCAN_ROOTS = [
  path.join(REPO_ROOT, "scripts", "concepts"),
  path.join(REPO_ROOT, "scripts", "knowledge"),
  path.join(REPO_ROOT, "tests"),
  path.join(REPO_ROOT, "src", "lib", "knowledge"),
];

async function collectFiles(root) {
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "__pycache__") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else files.push(full);
    }
  }
  await walk(root);
  return files;
}

test("no file references the real vault path or any hardcoded /home path", async () => {
  for (const root of SCAN_ROOTS) {
    for (const file of await collectFiles(root)) {
      const text = await readFile(file, "utf8");
      const rel = path.relative(REPO_ROOT, file);
      assert.ok(!text.includes(FORBIDDEN_VAULT_PATH), `${rel} references the forbidden vault path`);
      assert.ok(!text.includes(`~${FORBIDDEN_VAULT_PATH.slice(FORBIDDEN_VAULT_PATH.lastIndexOf("/"))}`),
        `${rel} references the forbidden vault path via ~`);
    }
  }
});

test("tests never read a vault tree: no hardcoded home-dir absolute paths", async () => {
  const testsDir = path.join(REPO_ROOT, "tests");
  for (const file of await collectFiles(testsDir)) {
    const text = await readFile(file, "utf8");
    const rel = path.relative(REPO_ROOT, file);
    assert.ok(
      !/["'`]\/(home|Users)\//.test(text),
      `${rel} contains a hardcoded home-directory path literal — vault trees must never be readable from CI`,
    );
  }
});

test("CONCEPTS_VAULT_ROOT has no non-empty default anywhere", async () => {
  for (const root of SCAN_ROOTS) {
    for (const file of await collectFiles(root)) {
      const text = await readFile(file, "utf8");
      const rel = path.relative(REPO_ROOT, file);
      assert.ok(
        !/CONCEPTS_VAULT_ROOT\s*(\?\?|\|\|)\s*["'`][^"'`]+["'`]/.test(text),
        `${rel} gives CONCEPTS_VAULT_ROOT a default value — the vault root must always be injected`,
      );
      const defaultVaultConstant = "DEFAULT_" + "VAULT"; // assembled so this guard never matches itself
      assert.ok(!text.includes(defaultVaultConstant), `${rel} defines a default vault constant`);
    }
  }
});

test("mirror runtime has no delete or rename-as-delete codepath", async () => {
  const runtime = (await collectFiles(MIRROR_DIR)).filter((f) => !f.endsWith(".test.mjs"));
  assert.ok(runtime.length >= 8, "mirror runtime modules present");
  for (const file of runtime) {
    const text = await readFile(file, "utf8");
    const rel = path.relative(REPO_ROOT, file);
    for (const banned of ["unlink", "rmdir", "rmSync", " rm(", "fs.rm", "rm,"]) {
      assert.ok(!text.includes(banned), `${rel} contains a delete codepath (${banned.trim()})`);
    }
    if (path.basename(file) !== "writer.mjs") {
      assert.ok(!/\brename(Sync)?\s*\(/.test(text),
        `${rel} calls rename — the journal commit in writer.mjs is the only allowed rename`);
    }
  }
  // writer.mjs: rename appears only as the temp -> final journal commit.
  const writer = await readFile(path.join(MIRROR_DIR, "writer.mjs"), "utf8");
  const renameCalls = [...writer.matchAll(/await rename\(/g)];
  assert.equal(renameCalls.length, 1, "writer.mjs must contain exactly one rename call (the journal commit)");
  assert.match(writer, /rename\(tempPath, finalPath\)/);
});
