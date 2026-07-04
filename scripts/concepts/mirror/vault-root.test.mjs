import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { REPO_ROOT } from "../lib/pipeline-home.mjs";
import {
  DEFAULT_OWNED_FOLDER,
  VaultConfigError,
  VaultUnreachableError,
  assertVaultReachable,
  resolveOwnedFolderName,
  resolveVaultRoot,
} from "./vault-root.mjs";

test("missing vault root is a hard error — there is NO default", () => {
  assert.throws(() => resolveVaultRoot({ env: {} }), VaultConfigError);
  assert.throws(() => resolveVaultRoot({ env: { CONCEPTS_VAULT_ROOT: "  " } }), /no default vault location/);
});

test("cli value wins over env; both resolve to absolute paths", () => {
  const dir = path.join(os.tmpdir(), "some-vault");
  assert.equal(resolveVaultRoot({ env: { CONCEPTS_VAULT_ROOT: "/elsewhere" }, cliValue: dir }), dir);
  assert.equal(resolveVaultRoot({ env: { CONCEPTS_VAULT_ROOT: dir } }), dir);
});

test("vault root inside the repo is rejected", () => {
  assert.throws(
    () => resolveVaultRoot({ env: {}, cliValue: path.join(REPO_ROOT, "vault") }),
    /inside the repo root/,
  );
});

test("unreachable vault is a distinct, typed failure", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "concepts-vaultroot-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await assertVaultReachable(dir); // exists: fine
  await assert.rejects(assertVaultReachable(path.join(dir, "gone")), VaultUnreachableError);
});

test("owned folder name must be a single, visible path segment", () => {
  assert.equal(resolveOwnedFolderName({ env: {} }), DEFAULT_OWNED_FOLDER);
  assert.equal(resolveOwnedFolderName({ env: {}, cliValue: "My Concepts" }), "My Concepts");
  assert.throws(() => resolveOwnedFolderName({ env: {}, cliValue: "a/b" }), VaultConfigError);
  assert.throws(() => resolveOwnedFolderName({ env: {}, cliValue: ".." }), VaultConfigError);
  assert.throws(() => resolveOwnedFolderName({ env: {}, cliValue: ".hidden" }), VaultConfigError);
  assert.throws(() => resolveOwnedFolderName({ env: {}, cliValue: "" }), VaultConfigError);
});
