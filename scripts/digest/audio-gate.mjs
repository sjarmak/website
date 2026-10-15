#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { attachEntryAudio, readEntryAudio, stripEntryAudio } from "./entry-audio.mjs";
import { localMediaPath } from "./media-location.mjs";
import { dropCommand, dropPending, listPending, removePending, retryCommand, writePending } from "./pending-audio.mjs";
import { mediaBackend, publicBase, r2ConfigFromEnv, verifyTimeoutMs } from "../media/config.mjs";
import { isSiteMediaUrl, keyFromSiteUrl, publicUrlForKey, siteUrlForKey } from "../media/keys.mjs";
import { readLocalObject } from "../media/local-object.mjs";
import { ConflictError, createR2Store, putImmutable } from "../media/store.mjs";
import { verifyPublicMedia } from "../media/verify.mjs";

const CONTENT_DIR = "src/content/digest";
const VERIFIED = "verified";
const USAGE =
  "usage: audio-gate.mjs <drain [--slug <slug>] [--wait-sec <seconds>]|verify-staged|settle|status|drop --slug <slug>>";
const OPTIONS = {
  drain: { slug: { type: "string" }, "wait-sec": { type: "string" } },
  drop: { slug: { type: "string" } },
};

const log = (line) => console.error(`[audio] ${line}`);
const entryPath = (slug) => path.join(CONTENT_DIR, `${slug}.md`);

async function readPendingRecords() {
  const { records, invalid } = await listPending();
  for (const { file, reason } of invalid) log(`skipping ${file}: ${reason}`);
  return records;
}

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

function makeContext(env, waitMs = verifyTimeoutMs(env)) {
  const backend = mediaBackend(env);
  return {
    env,
    backend,
    base: publicBase(env),
    deadline: Date.now() + waitMs,
    store: backend === "r2" ? createR2Store(r2ConfigFromEnv(env)) : null,
  };
}

function waitMsFrom(raw, env) {
  if (raw === undefined) return verifyTimeoutMs(env);
  if (!/^[1-9][0-9]*$/.test(raw)) {
    throw new Error(`--wait-sec must be a positive whole number of seconds, got ${JSON.stringify(raw)}`);
  }
  return Number(raw) * 1000;
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
      if (err instanceof ConflictError) return { ok: false, local, check: "conflict", reason: err.message };
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

function recordProblem(ctx, record) {
  let expected;
  try {
    expected = localMediaPath(record.key, ctx.env);
  } catch (err) {
    return err.message;
  }
  if (path.resolve(record.file) !== expected) {
    return `${record.file} is not where the ${ctx.backend} backend keeps ${record.key} (${expected})`;
  }
  if (record.audioUrl !== siteUrlForKey(record.key)) {
    return `audioUrl ${record.audioUrl} is not the site URL of ${record.key}`;
  }
  return null;
}

async function checkRecord(ctx, record, file, md) {
  const problem = recordProblem(ctx, record);
  if (problem) return { ok: false, check: "record", reason: problem };
  if (md === null) return { ok: false, check: "entry", reason: `${file} does not exist; publish the issue text first` };
  return makeLive(ctx, record);
}

async function drainOne(ctx, record) {
  const file = entryPath(record.slug);
  const md = await readIfPresent(file);
  if (record.check === VERIFIED && md !== null && readEntryAudio(md).audioUrl === record.audioUrl) {
    log(`${record.slug}: audio already verified and attached to ${file}`);
    return true;
  }
  const outcome = await checkRecord(ctx, record, file, md);
  const updatedAt = new Date().toISOString();
  if (!outcome.ok) {
    await writePending({ ...record, reason: outcome.reason, check: outcome.check, updatedAt });
    log(`${record.slug}: still pending (${outcome.check}: ${outcome.reason})`);
    return false;
  }
  await stage(file, attachEntryAudio(md, { audioUrl: record.audioUrl, durationSec: record.durationSec }));
  const reason = `verified at its public URL and attached to ${file}; cleared once that is committed`;
  await writePending({ ...record, reason, check: VERIFIED, updatedAt });
  log(`${record.slug}: audio verified at its public URL and attached to ${file}`);
  return true;
}

async function drain(env, { slug, "wait-sec": waitSec }) {
  const ctx = makeContext(env, waitMsFrom(waitSec, env));
  const records = (await readPendingRecords()).filter((record) => !slug || record.slug === slug);
  if (records.length === 0) {
    log("no pending audio to attach");
    return 0;
  }
  const results = await Promise.allSettled(records.map((record) => drainOne(ctx, record)));
  const crashed = results.find((result) => result.status === "rejected");
  if (crashed) throw crashed.reason;
  return results.every((result) => result.value) ? 0 : 1;
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
    updatedAt: new Date().toISOString(),
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
  for (const record of await readPendingRecords()) {
    if (record.check !== VERIFIED) continue;
    const committed = committedEntry(entryPath(record.slug));
    if (committed !== null && readEntryAudio(committed).audioUrl === record.audioUrl) {
      await removePending(record.slug);
      log(`${record.slug}: attached audio is committed; cleared its pending record`);
    }
  }
  return 0;
}

function remedy(record, env, url) {
  const retry = retryCommand(mediaBackend(env), env);
  if (record.check === "conflict") {
    return [
      `  published audio is unchanged: ${url} still serves the earlier upload`,
      "  fix:    give the issue a new slug and publish it again",
      `          or keep the published audio with ${dropCommand(record.slug)}`,
    ];
  }
  if (record.check === "entry") {
    return [
      `  fix:    publish the issue text, then run ${retry}`,
      `          or stop waiting for this audio with ${dropCommand(record.slug)}`,
    ];
  }
  if (record.check === "record") {
    return [`  fix:    ${dropCommand(record.slug)}`, "          or re-publish the issue, which rewrites this record"];
  }
  return [`  retry:  ${retry}`];
}

function headline(record) {
  if (record.check === "conflict") {
    return `R2 already holds different audio under ${record.key}, so this audio cannot be published there`;
  }
  return "the issue is published without a player until its audio verifies";
}

export function describePending(record, env = process.env) {
  const url = publicUrlForKey(publicBase(env), record.key);
  return [
    `[audio] PENDING ${record.slug}: ${headline(record)}`,
    `  url:    ${url}`,
    `  check:  ${record.check ?? "unknown"}`,
    `  reason: ${record.reason}`,
    `  file:   ${record.file}`,
    ...remedy(record, env, url),
  ].join("\n");
}

function describeInvalid({ file, reason, slug }) {
  return [
    `[audio] UNREADABLE ${file}: every run skips this pending-audio record until it is repaired or removed`,
    `  reason: ${reason}`,
    `  fix:    ${slug ? dropCommand(slug) : `rm -- ${file}`}`,
  ].join("\n");
}

async function status(env) {
  const { records, invalid } = await listPending();
  if (records.length === 0 && invalid.length === 0) {
    log("no pending audio");
    return 0;
  }
  for (const record of records) console.error(describePending(record, env));
  for (const bad of invalid) console.error(describeInvalid(bad));
  return 1;
}

async function drop({ slug }) {
  const { file, raw } = await dropPending(slug);
  if (raw === null) {
    log(`no pending audio record for ${slug} at ${file}`);
    return 1;
  }
  console.log(`[audio] dropped ${file}; it held:\n${raw.trimEnd()}`);
  console.log("[audio] the audio file and any uploaded copy are untouched; the issue stays published without a player");
  return 0;
}

function parseOptions(command, rest) {
  const options = OPTIONS[command] ?? {};
  let values;
  try {
    ({ values } = parseArgs({ args: rest, options, strict: true }));
  } catch {
    throw new Error(USAGE);
  }
  if (command === "drop" && !values.slug) throw new Error(USAGE);
  return values;
}

async function main(argv, env) {
  const [command, ...rest] = argv;
  const options = parseOptions(command, rest);
  switch (command) {
    case "drain":
      return drain(env, options);
    case "verify-staged":
      return verifyStaged(env);
    case "settle":
      return settle();
    case "status":
      return status(env);
    case "drop":
      return drop(options);
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
