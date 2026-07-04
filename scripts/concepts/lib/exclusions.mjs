// Loader for the concepts pipeline exclusion list.
//
// The patterns live in scripts/concepts/exclusions.json — data, not code — so
// the excluded set can be extended without code review. Every future vault
// walker must consult this list before touching a path.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

export const EXCLUSIONS_PATH = path.resolve(MODULE_DIR, "..", "exclusions.json");

// Returns the frozen array of exclusion patterns. Throws on missing file or
// malformed data — an unloadable exclusion list must halt the pipeline, never
// degrade into "no exclusions".
export async function loadExclusions(filePath = EXCLUSIONS_PATH) {
  const text = await readFile(filePath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`${filePath}: malformed exclusions JSON (${err.message})`);
  }
  if (!Array.isArray(parsed.patterns) || parsed.patterns.length === 0) {
    throw new Error(`${filePath}: "patterns" must be a non-empty array`);
  }
  for (const pattern of parsed.patterns) {
    if (typeof pattern !== "string" || pattern.trim() === "") {
      throw new Error(`${filePath}: every pattern must be a non-empty string, got ${JSON.stringify(pattern)}`);
    }
  }
  return Object.freeze([...parsed.patterns]);
}
