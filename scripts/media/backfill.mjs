#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdtemp, rename, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { r2ConfigFromEnv, verifyTimeoutMs } from "./config.mjs";
import { assertMediaKey, contentTypeFor, publicUrlForKey } from "./keys.mjs";
import { createR2Store, putImmutable } from "./store.mjs";
import { verifyPublicMedia } from "./verify.mjs";

const MEDIA_PREFIX = "public/media/";
const REGULAR_FILE_MODES = new Set(["100644", "100755"]);
const USAGE =
  "usage: backfill.mjs --manifest <file.json> [--ref media] [--key <key>]... [--verify-base <url>] [--dry-run]";

const log = (line) => console.error(`[backfill] ${line}`);

class UsageError extends Error {}

export function parseTreeListing(output) {
  const objects = [];
  for (const entry of output.split("\0").filter(Boolean)) {
    const match = /^(\d{6}) (\w+) ([0-9a-f]{40,64}) +(\d+|-)\t(.+)$/s.exec(entry);
    if (!match) throw new Error(`unrecognized git ls-tree line: ${JSON.stringify(entry)}`);
    const [, mode, type, blob, size, file] = match;
    if (!file.startsWith(MEDIA_PREFIX)) throw new Error(`${file} is outside public/media`);
    const key = file.slice(MEDIA_PREFIX.length);
    if (key.split("/").some((segment) => segment.startsWith(".tmp-"))) continue;
    if (type !== "blob" || !REGULAR_FILE_MODES.has(mode)) {
      throw new Error(`${file} is not a regular file (mode ${mode}, ${type})`);
    }
    assertMediaKey(key);
    contentTypeFor(key);
    objects.push({ key, blob, bytes: Number(size) });
  }
  return objects;
}

function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr.trim()}`);
  return result.stdout;
}

async function exportBlob({ blob, bytes }, file) {
  const child = spawn("git", ["cat-file", "blob", blob], { stdio: ["ignore", "pipe", "pipe"] });
  let stderr = "";
  child.stderr.on("data", (chunk) => (stderr += chunk));
  const exited = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });
  await pipeline(child.stdout, createWriteStream(file));
  const code = await exited;
  if (code !== 0) throw new Error(`git cat-file blob ${blob} failed: ${stderr.trim()}`);
  const written = (await stat(file)).size;
  if (written !== bytes) throw new Error(`git cat-file blob ${blob} wrote ${written} bytes, expected ${bytes}`);
}

async function writeManifest(file, manifest) {
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await rename(tmp, file);
}

function selectObjects(objects, keys, ref) {
  if (keys.length === 0) return objects;
  const byKey = new Map(objects.map((object) => [object.key, object]));
  const missing = keys.filter((key) => !byKey.has(key));
  if (missing.length > 0) throw new UsageError(`not on ${ref}: ${missing.join(", ")}`);
  return keys.map((key) => byKey.get(key));
}

function summarize(objects, ref) {
  const byExtension = new Map();
  for (const { key, bytes } of objects) {
    const ext = path.extname(key).toLowerCase();
    const current = byExtension.get(ext) ?? { count: 0, bytes: 0 };
    byExtension.set(ext, { count: current.count + 1, bytes: current.bytes + bytes });
  }
  const total = objects.reduce((sum, { bytes }) => sum + bytes, 0);
  return [
    `${objects.length} objects, ${total} bytes from ${ref}`,
    ...[...byExtension].sort().map(([ext, { count, bytes }]) => `  ${ext}: ${count} objects, ${bytes} bytes`),
  ].join("\n");
}

async function backfillOne({ store, object, file, verifyBase, env }) {
  try {
    await exportBlob(object, file);
    const put = await putImmutable(store, { key: object.key, file });
    if (!verifyBase) return put;
    const url = publicUrlForKey(verifyBase, object.key);
    await verifyPublicMedia({ url, file, deadline: Date.now() + verifyTimeoutMs(env), log });
    return { ...put, verifiedUrl: url };
  } catch (err) {
    return { key: object.key, bytes: object.bytes, status: "failed", error: err.message };
  } finally {
    await rm(file, { force: true });
  }
}

async function backfill({ ref, manifest, keys, verifyBase, dryRun }, env) {
  const commit = git(["rev-parse", "--verify", `${ref}^{commit}`]).trim();
  const listing = git(["ls-tree", "-r", "-l", "-z", commit, "--", MEDIA_PREFIX.slice(0, -1)]);
  const objects = selectObjects(parseTreeListing(listing), keys, ref);
  if (dryRun) {
    console.log(summarize(objects, ref));
    return 0;
  }
  const store = createR2Store(r2ConfigFromEnv(env));
  const tmp = await mkdtemp(path.join(os.tmpdir(), "media-backfill-"));
  const results = [];
  try {
    for (const object of objects) {
      const result = await backfillOne({ store, object, file: path.join(tmp, "object"), verifyBase, env });
      results.push(result);
      log(`${result.status} ${object.key}${result.error ? `: ${result.error}` : ""}`);
      await writeManifest(manifest, { ref, commit, writtenAt: new Date().toISOString(), objects: results });
    }
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
  const failed = results.filter((result) => result.status === "failed").length;
  console.log(`${results.length - failed} of ${results.length} objects are in ${store.label}; manifest at ${manifest}`);
  return failed === 0 ? 0 : 1;
}

function parseCli(argv) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      options: {
        ref: { type: "string", default: "media" },
        manifest: { type: "string" },
        key: { type: "string", multiple: true, default: [] },
        "verify-base": { type: "string" },
        "dry-run": { type: "boolean", default: false },
      },
    }).values;
  } catch (err) {
    throw new UsageError(`${err.message}\n${USAGE}`);
  }
  if (!parsed["dry-run"] && !parsed.manifest) throw new UsageError(USAGE);
  return {
    ref: parsed.ref,
    manifest: parsed.manifest && path.resolve(parsed.manifest),
    keys: parsed.key.map(assertMediaKey),
    verifyBase: parsed["verify-base"],
    dryRun: parsed["dry-run"],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  Promise.resolve()
    .then(() => backfill(parseCli(process.argv.slice(2)), process.env))
    .then(
      (code) => process.exit(code),
      (err) => {
        console.error(`[backfill] ${err.message}`);
        process.exit(2);
      },
    );
}
