#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { attachEntryAudio, readEntryAudio, stripEntryAudio } from "./entry-audio.mjs";
import { localMediaPath } from "./media-location.mjs";
import { listPending, removePending, retryCommand, writePending } from "./pending-audio.mjs";
import { mediaBackend, publicBase, r2ConfigFromEnv, verifyTimeoutMs } from "../media/config.mjs";
import { isSiteMediaUrl, keyFromSiteUrl, publicUrlForKey } from "../media/keys.mjs";
import { readLocalObject } from "../media/local-object.mjs";
import { createR2Store, putImmutable } from "../media/store.mjs";
import { verifyPublicMedia } from "../media/verify.mjs";

const CONTENT_DIR = "src/content/digest";
const USAGE = "usage: audio-gate.mjs <drain [--slug <slug>]|verify-staged|settle|status>";

const log = (line) => console.error(`[audio] ${line}`);
const entryPath = (slug) => path.join(CONTENT_DIR, `${slug}.md`);

function git(args, { allowFailure = false } = {}) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0 && !allowFailure) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr.trim()}`);
  }
  return result;
}

function committedEntry(file) {
  const result = git(["show", `HEAD:${file}`], { allowFailure: true });
  return result.status === 0 ? result.stdout : null;
}

async function readIfPresent(file) {
  try {
    return await readFile(file, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

function makeContext(env) {
  const backend = mediaBackend(env);
  return {
    env,
    backend,
    base: publicBase(env),
    deadline: Date.now() + verifyTimeoutMs(env),
    store: backend === "r2" ? createR2Store(r2ConfigFromEnv(env)) : null,
  };
}

async function makeLive(ctx, { key, file, sha256 }) {
  let local;
  try {
    local = await readLocalObject(file);
  } catch (err) {
    return { ok: false, check: "local-file", reason: `local audio unreadable: ${err.message}` };
  }
  if (sha256 && local.sha256 !== sha256) {
    return { ok: false, local, check: "local-file", reason: `${file} changed since it was recorded (sha256 ${local.sha256})` };
  }
  if (ctx.store) {
    try {
      await putImmutable(ctx.store, { key, file });
    } catch (err) {
      return { ok: false, local, check: "upload", reason: `upload to R2 failed: ${err.message}` };
    }
  }
  try {
    await verifyPublicMedia({ url: publicUrlForKey(ctx.base, key), file, deadline: ctx.deadline, log });
  } catch (err) {
    return { ok: false, local, check: err.check ?? "verify", reason: err.message };
  }
  return { ok: true, local };
}

async function stage(file, content) {
  await writeFile(file, content, "utf8");
  git(["add", "--", file]);
}

async function drainOne(ctx, record) {
  const file = entryPath(record.slug);
  const md = await readIfPresent(file);
  const outcome = md === null
    ? { ok: false, check: "entry", reason: `${file} does not exist; publish the issue text first` }
    : await makeLive(ctx, record);
  if (!outcome.ok) {
    await writePending({ ...record, reason: outcome.reason, check: outcome.check, failedAt: new Date().toISOString() });
    log(`${record.slug}: still pending (${outcome.check}: ${outcome.reason})`);
    return false;
  }
  const attached = attachEntryAudio(md, { audioUrl: record.audioUrl, durationSec: record.durationSec });
  await stage(file, attached);
  log(`${record.slug}: audio verified at its public URL and attached to ${file}`);
  return true;
}

async function drain(env, { slug }) {
  const records = (await listPending()).filter((record) => !slug || record.slug === slug);
  if (records.length === 0) {
    log("no pending audio to attach");
    return 0;
  }
  const ctx = makeContext(env);
  let stillPending = 0;
  for (const record of records) {
    if (!(await drainOne(ctx, record))) stillPending += 1;
  }
  return stillPending === 0 ? 0 : 1;
}

function stagedEntries() {
  const out = git(["diff", "--cached", "--name-only", "--diff-filter=AM", "-z", "--", CONTENT_DIR]).stdout;
  return out.split("\0").filter((file) => file.endsWith(".md"));
}

async function verifyEntry(ctx, { slug, audioUrl, durationSec }) {
  if (!isSiteMediaUrl(audioUrl)) {
    return { ok: false, check: "url", reason: `audioUrl ${audioUrl} is not a /media/ URL, so it cannot be verified` };
  }
  let key;
  try {
    key = keyFromSiteUrl(audioUrl);
  } catch (err) {
    return { ok: false, check: "url", reason: err.message };
  }
  const file = localMediaPath(key, ctx.env);
  const outcome = await makeLive(ctx, { key, file });
  if (outcome.ok) return outcome;
  const local = outcome.local;
  const record = {
    slug,
    key,
    audioUrl,
    ...(Number.isInteger(durationSec) && durationSec > 0 ? { durationSec } : {}),
    file,
    ...(local ? { sha256: local.sha256, bytes: local.bytes } : {}),
    backend: ctx.backend,
    reason: outcome.reason,
    check: outcome.check,
    failedAt: new Date().toISOString(),
  };
  return { ...outcome, record };
}

async function verifyStaged(env) {
  const files = stagedEntries();
  const ctx = files.length > 0 ? makeContext(env) : null;
  let failures = 0;
  for (const file of files) {
    const md = await readFile(file, "utf8");
    const { audioUrl, durationSec } = readEntryAudio(md);
    if (!audioUrl) continue;
    const committed = committedEntry(file);
    if (committed !== null && readEntryAudio(committed).audioUrl === audioUrl) continue;
    const slug = path.basename(file, ".md");
    const outcome = await verifyEntry(ctx, { slug, audioUrl, durationSec });
    if (outcome.ok) {
      log(`${slug}: ${audioUrl} verified`);
      continue;
    }
    failures += 1;
    if (outcome.record) await writePending(outcome.record);
    await stage(file, stripEntryAudio(md).md);
    log(`${slug}: removed unverified audioUrl ${audioUrl} (${outcome.check}: ${outcome.reason})`);
  }
  return failures === 0 ? 0 : 1;
}

async function settle() {
  for (const record of await listPending()) {
    const committed = committedEntry(entryPath(record.slug));
    if (committed !== null && readEntryAudio(committed).audioUrl === record.audioUrl) {
      await removePending(record.slug);
      log(`${record.slug}: attached audio is committed; cleared its pending record`);
    }
  }
  return 0;
}

export function describePending(record, env = process.env) {
  return [
    `[audio] PENDING ${record.slug}: the issue is published without a player until its audio verifies`,
    `  url:    ${publicUrlForKey(publicBase(env), record.key)}`,
    `  check:  ${record.check ?? "unknown"}`,
    `  reason: ${record.reason}`,
    `  file:   ${record.file}`,
    `  retry:  ${retryCommand(mediaBackend(env), env)}`,
  ].join("\n");
}

async function status(env) {
  const records = await listPending();
  if (records.length === 0) {
    log("no pending audio");
    return 0;
  }
  for (const record of records) console.error(describePending(record, env));
  return 1;
}

function parseSlug(rest) {
  if (rest.length === 0) return undefined;
  if (rest.length === 2 && rest[0] === "--slug") return rest[1];
  throw new Error(USAGE);
}

async function main(argv, env) {
  const [command, ...rest] = argv;
  switch (command) {
    case "drain":
      return drain(env, { slug: parseSlug(rest) });
    case "verify-staged":
      return verifyStaged(env);
    case "settle":
      return settle();
    case "status":
      return status(env);
    default:
      throw new Error(USAGE);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2), process.env).then(
    (code) => process.exit(code),
    (err) => {
      console.error(`[audio-gate] ${err.message}`);
      process.exit(2);
    },
  );
}
