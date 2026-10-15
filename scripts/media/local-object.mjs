import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";

import { assertMediaKey } from "./keys.mjs";

const MAX_OBJECT_BYTES = 1024 ** 3;
const STAGING_DIR = ".tmp-staging";

export async function readLocalObject(file) {
  const body = await readFile(file);
  if (body.length === 0) throw new Error(`${file} is empty`);
  if (body.length > MAX_OBJECT_BYTES) throw new Error(`${file} is larger than ${MAX_OBJECT_BYTES} bytes`);
  return { body, bytes: body.length, sha256: createHash("sha256").update(body).digest("hex") };
}

export async function installLocalObject(source, root, key) {
  const target = path.join(root, assertMediaKey(key));
  if (path.resolve(source) === path.resolve(target)) return target;
  const staging = path.join(root, STAGING_DIR);
  const temp = path.join(staging, `${path.basename(target)}.${process.pid}`);
  await mkdir(staging, { recursive: true });
  await mkdir(path.dirname(target), { recursive: true });
  try {
    await copyFile(source, temp);
    await rename(temp, target);
  } catch (err) {
    await rm(temp, { force: true });
    throw err;
  }
  return target;
}
