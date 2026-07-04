// Managed-region extraction, wikilink canonicalization, and content hashing
// for mirrored concept notes.
//
// The content-hash is computed over the NORMALIZED managed region: wikilink
// targets are canonicalized to their normalized basename (path stripped,
// lowercase, whitespace collapsed, display alias ignored) so Obsidian's
// automatic link rewrites — path insertion on moves, case adjustments, alias
// insertion — hash identically and re-converge instead of reading as human
// edits.

import { createHash } from "node:crypto";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

export const REGION_BEGIN = "<!-- concepts:begin -->";
export const REGION_END = "<!-- concepts:end -->";

const WIKILINK_RE = /\[\[([^\][|#]+)(#[^\][|]*)?(\|[^\][]*)?\]\]/g;

/** Canonicalize one wikilink target: basename only, lowercase, single-spaced. */
export function canonicalWikilinkTarget(target) {
  const basename = target.split("/").pop() ?? "";
  return basename.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Rewrite every wikilink in `text` to its canonical `[[target]]` form. */
export function canonicalizeWikilinks(text) {
  return text.replace(WIKILINK_RE, (_m, target) => `[[${canonicalWikilinkTarget(target)}]]`);
}

/** Normalize managed-region text for hashing: LF endings, no trailing
 *  whitespace per line, no leading/trailing blank lines, canonical links. */
export function normalizeManaged(text) {
  const lines = canonicalizeWikilinks(text.replace(/\r\n/g, "\n"))
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""));
  while (lines.length > 0 && lines[0] === "") lines.shift();
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}

/** sha256 hex over the normalized managed region. */
export function contentHash(managedText) {
  return createHash("sha256").update(normalizeManaged(managedText), "utf8").digest("hex");
}

/**
 * Split a note into { frontmatter, fmRaw, pre, managed, post, beginLine, endLine }.
 * `managed` is the text strictly between the markers; `pre`/`post` preserve
 * everything outside them (the human annotation space). Line numbers are
 * 1-based marker positions in the full file — used for reference-only
 * conflict entries. Throws when markers are missing or unbalanced.
 */
export function parseNote(raw) {
  let frontmatter = {};
  let fmRaw = "";
  let body = raw;
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (fmMatch) {
    fmRaw = fmMatch[0];
    frontmatter = parseYaml(fmMatch[1]) ?? {};
    body = raw.slice(fmMatch[0].length);
  }

  const lines = body.split("\n");
  const fmLineCount = fmRaw === "" ? 0 : fmRaw.split("\n").length - 1;
  const beginIdx = lines.findIndex((l) => l.trim() === REGION_BEGIN);
  const endIdx = lines.findIndex((l) => l.trim() === REGION_END);
  if (beginIdx === -1 || endIdx === -1 || endIdx < beginIdx) {
    throw new Error("managed-region markers missing or unbalanced");
  }
  return {
    frontmatter,
    pre: lines.slice(0, beginIdx).join("\n"),
    managed: lines.slice(beginIdx + 1, endIdx).join("\n"),
    post: lines.slice(endIdx + 1).join("\n"),
    beginLine: fmLineCount + beginIdx + 1,
    endLine: fmLineCount + endIdx + 1,
  };
}

/** Serialize frontmatter + pre + managed region + post back into note text. */
export function serializeNote({ frontmatter, pre, managed, post }) {
  const fm = `---\n${stringifyYaml(frontmatter).trimEnd()}\n---\n`;
  const preText = pre.trim() === "" ? "" : `${pre.replace(/\n+$/, "")}\n`;
  const postText = post.trim() === "" ? "" : `\n${post.replace(/^\n+/, "").replace(/\n+$/, "")}`;
  return `${fm}${preText}${REGION_BEGIN}\n${managed.replace(/\n+$/, "")}\n${REGION_END}\n${postText}${postText ? "\n" : ""}`;
}

/** Extract every wikilink target (raw, un-normalized) from generated text. */
export function extractWikilinkTargets(text) {
  const targets = [];
  for (const match of text.matchAll(WIKILINK_RE)) targets.push(match[1].trim());
  return targets;
}
