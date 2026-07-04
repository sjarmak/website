// Additive-only journaled writer for the owned folder.
//
// The complete set of filesystem mutations the mirror is allowed to perform:
//   - mkdir(owned folder)
//   - writeFile(temp file inside the owned folder) + fsync
//   - rename(temp -> final note path inside the owned folder)
// There is NO delete, NO rename-as-delete, NO write outside the owned
// folder. Every target path is revalidated against the owned folder before
// the write happens.

import { mkdir, open, rename } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { TEMP_MARKER } from "./scan.mjs";

function assertInsideOwnedFolder(ownedDir, target) {
  const rel = path.relative(ownedDir, path.resolve(target));
  if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel) || rel.includes(path.sep)) {
    throw new Error(`refusing to write outside the owned folder: ${target}`);
  }
}

export async function ensureOwnedFolder(ownedDir, { log = console.error } = {}) {
  const created = await mkdir(ownedDir, { recursive: true });
  if (created) log(`[concepts-mirror] created owned folder ${ownedDir}`);
}

/**
 * Journaled write: temp name in the same directory, fsync, atomic rename to
 * the final name. Returns the bytes written.
 */
export async function journaledWrite(ownedDir, filename, content) {
  const finalPath = path.join(ownedDir, filename);
  assertInsideOwnedFolder(ownedDir, finalPath);
  const tempName = `${filename}${TEMP_MARKER}${process.pid}-${randomBytes(4).toString("hex")}`;
  const tempPath = path.join(ownedDir, tempName);
  assertInsideOwnedFolder(ownedDir, tempPath);

  const handle = await open(tempPath, "wx");
  try {
    await handle.writeFile(content, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(tempPath, finalPath);
  // Best-effort directory fsync so the rename itself is durable.
  try {
    const dirHandle = await open(ownedDir, "r");
    try {
      await dirHandle.sync();
    } finally {
      await dirHandle.close();
    }
  } catch {
    // Directory fsync is unsupported on some platforms; the rename already
    // happened, so this is durability polish, not correctness.
  }
  return Buffer.byteLength(content, "utf8");
}
