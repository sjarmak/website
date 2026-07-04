// Vault root + owned-folder resolution for the concepts mirror.
//
// The vault root is ALWAYS injected — env CONCEPTS_VAULT_ROOT or --vault-root.
// There is deliberately NO default: a missing vault root is a hard usage
// error, never a fallback to some real path. Resolution also rejects any
// path inside the repo (the mirror writes into a vault, never into git).
//
// The owned folder is the single subfolder of the vault root the mirror may
// write into. Its name is configurable (CONCEPTS_MIRROR_FOLDER / --folder);
// the placeholder default is "sjarmak-ai Concepts".

import { stat } from "node:fs/promises";
import path from "node:path";
import { REPO_ROOT } from "../lib/pipeline-home.mjs";

export const DEFAULT_OWNED_FOLDER = "sjarmak-ai Concepts";

/** Error class for "the vault is configured but not reachable right now". */
export class VaultUnreachableError extends Error {}

/** Error class for missing/invalid configuration (usage errors, exit 2). */
export class VaultConfigError extends Error {}

function isInside(parent, child) {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/**
 * Resolve the vault root from --vault-root (cliValue) or CONCEPTS_VAULT_ROOT.
 * Throws VaultConfigError when absent or inside the repo. Does NOT touch the
 * filesystem — reachability is a separate check so callers can distinguish
 * "not configured" (usage error) from "configured but unreachable".
 */
export function resolveVaultRoot({ env = process.env, cliValue } = {}) {
  const raw = (cliValue ?? env.CONCEPTS_VAULT_ROOT ?? "").trim();
  if (!raw) {
    throw new VaultConfigError(
      "vault root is required: pass --vault-root <path> or set CONCEPTS_VAULT_ROOT. " +
        "There is no default vault location.",
    );
  }
  const resolved = path.resolve(raw);
  if (isInside(REPO_ROOT, resolved)) {
    throw new VaultConfigError(
      `vault root ${resolved} is inside the repo root ${REPO_ROOT}; the mirror writes ` +
        "into an Obsidian vault, never into the repository tree.",
    );
  }
  return resolved;
}

/** Assert the resolved vault root exists and is a directory. */
export async function assertVaultReachable(vaultRoot) {
  let info;
  try {
    info = await stat(vaultRoot);
  } catch (err) {
    throw new VaultUnreachableError(
      `vault root ${vaultRoot} is not reachable: ${err.code ?? err.message}`,
    );
  }
  if (!info.isDirectory()) {
    throw new VaultUnreachableError(`vault root ${vaultRoot} is not a directory`);
  }
}

/**
 * Resolve the owned-folder NAME (a single path segment inside the vault
 * root). Separators and traversal are rejected so the writer can never be
 * pointed outside its one subfolder.
 */
export function resolveOwnedFolderName({ env = process.env, cliValue } = {}) {
  const raw = (cliValue ?? env.CONCEPTS_MIRROR_FOLDER ?? DEFAULT_OWNED_FOLDER).trim();
  if (!raw) throw new VaultConfigError("owned folder name must be non-empty");
  if (raw.includes("/") || raw.includes("\\") || raw === "." || raw === "..") {
    throw new VaultConfigError(
      `owned folder name ${JSON.stringify(raw)} must be a single path segment`,
    );
  }
  if (raw.startsWith(".")) {
    throw new VaultConfigError(
      `owned folder name ${JSON.stringify(raw)} must not be hidden (dot-prefixed)`,
    );
  }
  return raw;
}
