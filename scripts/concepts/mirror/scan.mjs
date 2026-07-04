// Read-only vault scanning: basename index for the ambiguity + wikilink
// resolution checks, owned-folder inventory, sync-conflict and leftover-temp
// detection. NOTHING in this module mutates the filesystem.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parseNote } from "./normalize.mjs";
import { canonicalWikilinkTarget } from "./normalize.mjs";

export const TEMP_MARKER = ".concepts-tmp-";
export const SYNC_CONFLICT_MARKER = ".sync-conflict-";

// Never descend into Syncthing metadata, Obsidian config, or hidden dirs.
const SKIPPED_DIR_RE = /^\./;

/**
 * Walk the vault (read-only) and index every markdown note's normalized
 * basename -> [relative paths]. Used for the vault-wide basename ambiguity
 * scan and for wikilink resolution.
 */
export async function buildBasenameIndex(vaultRoot) {
  const index = new Map();
  async function walk(dir, rel) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch (err) {
      throw new Error(`vault scan failed at ${rel || "."}: ${err.code ?? err.message}`);
    }
    for (const entry of entries) {
      const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (SKIPPED_DIR_RE.test(entry.name)) continue;
        await walk(path.join(dir, entry.name), entryRel);
      } else if (entry.name.endsWith(".md")) {
        const key = canonicalWikilinkTarget(entry.name.replace(/\.md$/, ""));
        if (!index.has(key)) index.set(key, []);
        index.get(key).push(entryRel);
      }
    }
  }
  await walk(vaultRoot, "");
  return index;
}

/**
 * Inventory the owned folder. Returns:
 *   notes:        [{ file, raw, parsed|null, parseError|null, conceptId|null,
 *                    frontmatterHash|null }]
 *   syncConflicts: relative paths of *.sync-conflict-* files
 *   leftoverTemps: relative paths of *.concepts-tmp-* files
 * A missing owned folder is a valid empty inventory (bootstrap case).
 */
export async function scanOwnedFolder(ownedDir) {
  let entries;
  try {
    entries = await readdir(ownedDir, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") return { notes: [], syncConflicts: [], leftoverTemps: [] };
    throw err;
  }
  const notes = [];
  const syncConflicts = [];
  const leftoverTemps = [];
  for (const entry of entries.filter((e) => e.isFile()).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.includes(TEMP_MARKER)) {
      leftoverTemps.push(entry.name);
      continue;
    }
    if (entry.name.includes(SYNC_CONFLICT_MARKER)) {
      syncConflicts.push(entry.name);
      continue;
    }
    if (!entry.name.endsWith(".md")) continue;
    const raw = await readFile(path.join(ownedDir, entry.name), "utf8");
    let parsed = null;
    let parseError = null;
    try {
      parsed = parseNote(raw);
    } catch (err) {
      parseError = err.message;
    }
    notes.push({
      file: entry.name,
      raw,
      parsed,
      parseError,
      conceptId: parsed?.frontmatter?.["concept-id"] ?? null,
      frontmatterHash: parsed?.frontmatter?.["content-hash"] ?? null,
    });
  }
  return { notes, syncConflicts, leftoverTemps };
}
