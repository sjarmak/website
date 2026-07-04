// Vault scanner for the pull pipeline: opt-in detection + hard exclusions.
//
// A note is a candidate ONLY if it carries the opt-in frontmatter marker
// (config.mjs OPT_IN_KEY/OPT_IN_VALUE) or lives under the export folder.
// Everything else is invisible. Paths matching scripts/concepts/exclusions.json
// are hard-excluded even when marked.
//
// Candidate ids are opaque and stable: sha256 of the vault-relative path,
// truncated. Never the note's path or title.

import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { EXPORT_FOLDER_NAME, OPT_IN_KEY, OPT_IN_VALUE } from "./config.mjs";

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

// Compile one exclusions.json pattern into a per-path-segment matcher.
//   "x/"        -> directory segment named x
//   "*a*"       -> glob against a segment
//   "x"         -> segment named x (file or directory)
function compilePattern(pattern) {
  const name = pattern.endsWith("/") ? pattern.slice(0, -1) : pattern;
  if (name.includes("*")) {
    const source = name
      .split("*")
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join(".*");
    const re = new RegExp(`^${source}$`);
    return (segment) => re.test(segment);
  }
  return (segment) => segment === name;
}

// True when any segment of the vault-relative path matches any pattern.
export function isExcluded(relPath, patterns) {
  const matchers = patterns.map(compilePattern);
  const segments = relPath.split("/").filter((s) => s !== "");
  return segments.some((segment) => matchers.some((matches) => matches(segment)));
}

// Lenient frontmatter parse: a vault note without frontmatter (or with a
// non-mapping block) is simply not marker-opted-in — never an error.
export function parseNote(raw) {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) return { frontmatter: null, body: raw };
  let frontmatter = null;
  try {
    const parsed = parseYaml(match[1]);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      frontmatter = parsed;
    }
  } catch {
    frontmatter = null;
  }
  return { frontmatter, body: raw.slice(match[0].length) };
}

// Opt-in status for a note: { optedIn, via: "marker" | "folder" | null }.
// The marker check is exact key + exact value — `site-graph: draft` is NOT
// opted in.
export function optInStatus(relPath, frontmatter) {
  if (frontmatter !== null && frontmatter[OPT_IN_KEY] === OPT_IN_VALUE) {
    return { optedIn: true, via: "marker" };
  }
  const segments = relPath.split("/").slice(0, -1);
  if (segments.includes(EXPORT_FOLDER_NAME)) {
    return { optedIn: true, via: "folder" };
  }
  return { optedIn: false, via: null };
}

// Opaque stable id for a vault note: sha256 of the vault-relative path.
export function vaultNoteId(relPath) {
  return createHash("sha256").update(relPath, "utf8").digest("hex").slice(0, 16);
}

async function walk(dir, root, patterns, out) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(root, abs).split(path.sep).join("/");
    if (isExcluded(rel, patterns)) continue;
    if (entry.isDirectory()) {
      await walk(abs, root, patterns, out);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      out.push(rel);
    }
  }
}

// Scan the injected vault root for opted-in candidates.
// Returns [{ id, relPath, title, body, via }] sorted by relPath.
export async function scanVault(vaultRoot, exclusionPatterns) {
  const root = path.resolve(vaultRoot);
  const relPaths = [];
  await walk(root, root, exclusionPatterns, relPaths);

  const candidates = [];
  for (const relPath of relPaths) {
    const raw = await readFile(path.join(root, relPath), "utf8");
    const { frontmatter, body } = parseNote(raw);
    const status = optInStatus(relPath, frontmatter);
    if (!status.optedIn) continue;
    const title =
      typeof frontmatter?.title === "string" && frontmatter.title.trim()
        ? frontmatter.title.trim()
        : path.basename(relPath, ".md");
    candidates.push({ id: vaultNoteId(relPath), relPath, title, body: body.trim(), via: status.via });
  }
  return candidates;
}
