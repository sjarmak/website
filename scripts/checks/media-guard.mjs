#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const MEDIA_PREFIX = "public/media/";
const EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";
const USAGE = "usage: media-guard.mjs --base <sha|empty> --head <sha>";

export function parseNameStatus(output) {
  const fields = output.split("\0");
  if (fields.at(-1) === "") fields.pop();
  if (fields.length % 2 !== 0) throw new Error("malformed git diff --name-status -z output");
  const entries = [];
  for (let i = 0; i < fields.length; i += 2) entries.push({ status: fields[i], path: fields[i + 1] });
  return entries;
}

export function forbiddenMediaPaths(entries) {
  return entries
    .filter(({ path }) => path.startsWith(MEDIA_PREFIX))
    .map(({ path }) => path)
    .sort();
}

function git(args, { allowFailure = false } = {}) {
  const result = spawnSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0 && !allowFailure) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr.trim()}`);
  }
  return result;
}

const hasCommit = (rev) => git(["cat-file", "-e", `${rev}^{commit}`], { allowFailure: true }).status === 0;

function fetchCommit(sha, depth) {
  git(["fetch", "--no-tags", "--quiet", `--depth=${depth}`, "origin", sha], { allowFailure: true });
}

function resolveBase(base, head) {
  if (base && !/^0+$/.test(base)) {
    if (!hasCommit(base)) fetchCommit(base, 1);
    if (hasCommit(base)) return base;
  }
  if (!hasCommit(`${head}^`)) fetchCommit(head, 2);
  return hasCommit(`${head}^`) ? `${head}^` : EMPTY_TREE;
}

function guard({ base, head }) {
  const from = resolveBase(base, head);
  const diff = git(["diff", "--name-status", "--no-renames", "-z", "--diff-filter=AMT", from, head, "--"]);
  const forbidden = forbiddenMediaPaths(parseNameStatus(diff.stdout));
  if (forbidden.length === 0) {
    console.log(`[media-guard] no files added or changed under ${MEDIA_PREFIX} between ${from} and ${head}`);
    return 0;
  }
  console.error(
    [
      `[media-guard] these changes commit files under ${MEDIA_PREFIX} (${from}..${head}):`,
      ...forbidden.map((file) => `  ${file}`),
      "Media does not belong in the site build. Digest audio ships through scripts/digest/run.sh",
      "(media branch or R2, per MEDIA_BACKEND); upload other media with scripts/media/backfill.mjs",
      "and link it by its /media/ URL.",
    ].join("\n"),
  );
  return 1;
}

function parseCli(argv) {
  const { values } = parseArgs({
    args: argv,
    options: { base: { type: "string", default: "" }, head: { type: "string" } },
  });
  if (!values.head) throw new Error(USAGE);
  return { base: values.base, head: values.head };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exit(guard(parseCli(process.argv.slice(2))));
  } catch (err) {
    console.error(`[media-guard] ${err.message}`);
    process.exit(2);
  }
}
