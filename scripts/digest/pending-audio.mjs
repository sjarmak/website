import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const PENDING_SUBDIR = path.join(".digest-runs", "pending-audio");
const RECORD_SUFFIX = ".json";
const SLUG = /^[a-z0-9-]+$/;

const recordSchema = z
  .object({
    slug: z.string().regex(SLUG),
    key: z.string().min(1),
    audioUrl: z.string().startsWith("/media/"),
    durationSec: z.number().int().positive().optional(),
    file: z.string().min(1),
    sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
    bytes: z.number().int().positive().optional(),
    backend: z.enum(["git", "r2"]),
    reason: z.string().min(1),
    check: z.string().optional(),
    updatedAt: z.iso.datetime(),
  })
  .strict();

export const pendingDir = (root = process.cwd()) => path.join(root, PENDING_SUBDIR);

function recordPath(slug, root) {
  if (!SLUG.test(slug)) throw new Error(`invalid digest slug: ${JSON.stringify(slug)}`);
  return path.join(pendingDir(root), `${slug}${RECORD_SUFFIX}`);
}

export async function writePending(record, { root } = {}) {
  const valid = recordSchema.parse(record);
  const target = recordPath(valid.slug, root);
  const temp = `${target}.${process.pid}.tmp`;
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(temp, `${JSON.stringify(valid, null, 2)}\n`, "utf8");
  await rename(temp, target);
  return target;
}

const describeIssues = (error) =>
  error.issues.map((issue) => `${issue.path.join(".") || "(record)"}: ${issue.message}`).join("; ");

function parseRecordFile(name, raw) {
  const slug = name.slice(0, -RECORD_SUFFIX.length);
  if (!SLUG.test(slug)) return { reason: "the file name is not a digest slug" };
  const invalid = (reason) => ({ reason, slug });
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    return invalid(`not valid JSON (${err.message})`);
  }
  const parsed = recordSchema.safeParse(data);
  if (!parsed.success) return invalid(`not a pending-audio record (${describeIssues(parsed.error)})`);
  if (parsed.data.slug !== slug) return invalid(`its slug ${parsed.data.slug} does not match the file name`);
  return { record: parsed.data };
}

async function readRecordFile(dir, name) {
  const file = path.join(dir, name);
  try {
    return { file, ...parseRecordFile(name, await readFile(file, "utf8")) };
  } catch (err) {
    if (err.code === "ENOENT") return null;
    return { file, reason: `unreadable (${err.message})` };
  }
}

export async function listPending({ root } = {}) {
  const dir = pendingDir(root);
  let names;
  try {
    names = await readdir(dir);
  } catch (err) {
    if (err.code === "ENOENT") return { records: [], invalid: [] };
    throw err;
  }
  const outcomes = await Promise.all(
    names.filter((name) => name.endsWith(RECORD_SUFFIX)).sort().map((name) => readRecordFile(dir, name)),
  );
  const present = outcomes.filter(Boolean);
  return {
    records: present.filter((outcome) => outcome.record).map((outcome) => outcome.record),
    invalid: present.filter((outcome) => !outcome.record).map(({ file, reason, slug }) => ({ file, reason, slug })),
  };
}

export async function removePending(slug, { root } = {}) {
  await rm(recordPath(slug, root), { force: true });
}

export async function dropPending(slug, { root } = {}) {
  const file = recordPath(slug, root);
  let raw;
  try {
    raw = await readFile(file, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return { file, raw: null };
    throw err;
  }
  await rm(file);
  return { file, raw };
}

export function retryCommand(backend, env = process.env, websiteDir = process.cwd()) {
  const mediaDir =
    backend === "git" && env.WEBSITE_MEDIA_ROOT
      ? ` WEBSITE_MEDIA_DIR=${path.dirname(path.dirname(env.WEBSITE_MEDIA_ROOT))}`
      : "";
  return `MEDIA_BACKEND=${backend}${mediaDir} DIGEST_PUSH=1 ${path.join(websiteDir, "scripts", "digest", "run.sh")} attach-pending`;
}

export function dropCommand(slug, websiteDir = process.cwd()) {
  return `cd ${websiteDir} && flock ${path.join(".digest-runs", "run.lock")} node scripts/digest/audio-gate.mjs drop --slug ${slug}`;
}
