#!/usr/bin/env node
// Canary check: verify no vault-distinctive token leaks into the repo tree
// or the built site.
//
// The canary file lives in the PIPELINE HOME (outside the repo, never
// committed) and holds only salted hashes — the tokens themselves are never
// stored anywhere in this repo, its history, or its artifacts.
//
// SETUP (Stephanie, one time per machine — tokens are read from stdin so
// they never hit shell history or argv):
//
//     node scripts/concepts/canary-check.mjs --setup
//     <type or paste one distinctive vault token/phrase per line, Ctrl-D>
//
// CHECKS:
//     node scripts/concepts/canary-check.mjs --staged        # pre-commit
//     node scripts/concepts/canary-check.mjs --dist [dir]    # post-build
//     node scripts/concepts/canary-check.mjs --paths <dir>   # arbitrary tree
//
// Matching hashes every normalized 1–3-word n-gram of the scanned text with
// the canary salt and compares against the stored hash set. On a match the
// output names the FILE and the match count — never the matched text.

import { execFile } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { ensurePipelineHome } from "./lib/pipeline-home.mjs";

const run = promisify(execFile);

export const CANARY_FILENAME = "canary.json";
export const CANARY_VERSION = 1;
const MAX_NGRAM = 3;
const BINARY_EXT_RE = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|mp[34]|webm|pdf|zip|gz|br|wasm)$/i;

export function canaryPath(homeRoot) {
  return path.join(homeRoot, CANARY_FILENAME);
}

// Token normalization mirrors the scanner's word extraction exactly, so a
// token hashed at setup time matches the n-grams produced at scan time.
export function normalizeToken(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9'-]+/u)
    .filter(Boolean)
    .join(" ");
}

export function hashToken(salt, token) {
  return createHash("sha256").update(`${salt}\0${normalizeToken(token)}`, "utf8").digest("hex");
}

/** Build the canary file content from raw token lines. */
export function buildCanary(tokens, salt = randomBytes(16).toString("hex")) {
  const cleaned = [...new Set(tokens.map(normalizeToken).filter((t) => t.length > 0))];
  if (cleaned.length === 0) throw new Error("no tokens provided — nothing to protect");
  for (const token of cleaned) {
    if (token.split(" ").length > MAX_NGRAM) {
      throw new Error(`token has more than ${MAX_NGRAM} words; the scanner only matches 1–${MAX_NGRAM}-grams`);
    }
  }
  return { version: CANARY_VERSION, salt, hashes: cleaned.map((t) => hashToken(salt, t)).sort() };
}

/** Count salted-hash matches of the text's 1–3-gram tokens. */
export function countMatches(text, { salt, hashes }) {
  const hashSet = new Set(hashes);
  const words = text.toLowerCase().split(/[^a-z0-9'-]+/u).filter(Boolean);
  let matches = 0;
  const seen = new Set();
  for (let i = 0; i < words.length; i += 1) {
    for (let n = 1; n <= MAX_NGRAM && i + n <= words.length; n += 1) {
      const gram = words.slice(i, i + n).join(" ");
      if (seen.has(gram)) continue;
      seen.add(gram);
      if (hashSet.has(hashToken(salt, gram))) matches += 1;
    }
  }
  return matches;
}

async function readCanary(env) {
  const home = await ensurePipelineHome(env);
  try {
    const canary = JSON.parse(await readFile(canaryPath(home.root), "utf8"));
    if (canary.version !== CANARY_VERSION || typeof canary.salt !== "string" || !Array.isArray(canary.hashes)) {
      throw new Error(`canary file ${canaryPath(home.root)} has an unrecognized shape`);
    }
    return canary;
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

async function* walkFiles(dir, rel = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      yield* walkFiles(path.join(dir, entry.name), entryRel);
    } else if (entry.isFile() && !BINARY_EXT_RE.test(entry.name)) {
      const fullPath = path.join(dir, entry.name);
      yield { rel: entryRel, read: () => readFile(fullPath, "utf8") };
    }
  }
}

async function* stagedFiles(cwd) {
  const { stdout } = await run("git", ["diff", "--cached", "--name-only", "--diff-filter=d", "-z"], { cwd });
  for (const rel of stdout.split("\0").filter(Boolean)) {
    if (BINARY_EXT_RE.test(rel)) continue;
    yield {
      rel,
      read: async () => (await run("git", ["show", `:${rel}`], { cwd, maxBuffer: 64 * 1024 * 1024 })).stdout,
    };
  }
}

export async function scanFiles(fileIterator, canary, { log = console.error } = {}) {
  const offenders = [];
  for await (const file of fileIterator) {
    let text;
    try {
      text = await file.read();
    } catch (err) {
      log(`[canary] skipping unreadable ${file.rel}: ${err.code ?? err.message}`);
      continue;
    }
    const matches = countMatches(text, canary);
    if (matches > 0) offenders.push({ path: file.rel, matches });
  }
  return offenders;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const [mode, arg] = process.argv.slice(2);
  const env = process.env;

  if (mode === "--setup") {
    const home = await ensurePipelineHome(env);
    const tokens = (await readStdin()).split("\n");
    const canary = buildCanary(tokens);
    await writeFile(canaryPath(home.root), `${JSON.stringify(canary, null, 2)}\n`, { mode: 0o600 });
    console.error(`[canary] wrote ${canary.hashes.length} salted hash(es) to ${canaryPath(home.root)}`);
    console.error("[canary] the canary file lives outside the repo and must never be committed.");
    return 0;
  }

  if (mode !== "--staged" && mode !== "--dist" && mode !== "--paths") {
    console.error("usage: canary-check.mjs --setup | --staged | --dist [dir] | --paths <dir>");
    return 2;
  }

  const canary = await readCanary(env);
  if (canary === null) {
    console.error("[canary] no canary file in the pipeline home — nothing to check (run --setup to create one)");
    return 0;
  }

  let files;
  if (mode === "--staged") {
    files = stagedFiles(process.cwd());
  } else {
    const dir = path.resolve(arg ?? (mode === "--dist" ? "dist" : undefined) ?? "");
    if (!arg && mode === "--paths") {
      console.error("usage: canary-check.mjs --paths <dir>");
      return 2;
    }
    files = walkFiles(dir);
  }

  const offenders = await scanFiles(files, canary);
  if (offenders.length > 0) {
    for (const o of offenders) {
      console.error(`[canary] FAIL ${o.path}: ${o.matches} canary token match(es)`);
    }
    console.error(`[canary] ${offenders.length} file(s) contain vault-distinctive tokens — do not commit/publish.`);
    return 1;
  }
  console.error(`[canary] clean (${canary.hashes.length} token hash(es) checked)`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  process.exit(await main());
}
