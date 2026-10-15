import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const PENDING_SUBDIR = path.join(".digest-runs", "pending-audio");
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
    failedAt: z.iso.datetime(),
  })
  .strict();

export const pendingDir = (root = process.cwd()) => path.join(root, PENDING_SUBDIR);

function recordPath(slug, root) {
  if (!SLUG.test(slug)) throw new Error(`invalid digest slug: ${JSON.stringify(slug)}`);
  return path.join(pendingDir(root), `${slug}.json`);
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

export async function readPending(slug, { root } = {}) {
  const file = recordPath(slug, root);
  let raw;
  try {
    raw = await readFile(file, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
  const parsed = recordSchema.safeParse(JSON.parse(raw));
  if (!parsed.success || parsed.data.slug !== slug) {
    const detail = parsed.success ? `slug ${parsed.data.slug} does not match the file name` : parsed.error.message;
    throw new Error(`pending audio record ${file} is malformed: ${detail}`);
  }
  return parsed.data;
}

export async function listPending({ root } = {}) {
  let names;
  try {
    names = await readdir(pendingDir(root));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
  const slugs = names.filter((name) => name.endsWith(".json")).map((name) => name.slice(0, -".json".length));
  const records = await Promise.all(slugs.sort().map((slug) => readPending(slug, { root })));
  return records.filter(Boolean);
}

export async function removePending(slug, { root } = {}) {
  await rm(recordPath(slug, root), { force: true });
}

export function retryCommand(backend, env = process.env, websiteDir = process.cwd()) {
  const mediaDir =
    backend === "git" && env.WEBSITE_MEDIA_ROOT
      ? ` WEBSITE_MEDIA_DIR=${path.dirname(path.dirname(env.WEBSITE_MEDIA_ROOT))}`
      : "";
  return `MEDIA_BACKEND=${backend}${mediaDir} DIGEST_PUSH=1 ${path.join(websiteDir, "scripts", "digest", "run.sh")} attach-pending`;
}
