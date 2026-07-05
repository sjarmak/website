// Cross-process mutex for full `astro build` runs inside the test suite.
//
// node --test runs test FILES in parallel processes. Two concurrent astro
// builds of this repo collide: for an outDir OUTSIDE the cwd, the static
// build stages its SSR intermediates in the shared ./.astro fallback
// (astro/dist/core/build/common.js getOutDirWithinCwd) and both builds write
// the shared content-layer data store — one build's cleanup deletes chunks
// the other is importing ("Cannot find module .astro/pages/...mjs"). Every
// test that runs a full build takes this lock around the build call.
//
// mkdir is the atomic primitive; a lock older than STALE_MS is stolen so a
// crashed run can never wedge the suite.

import { mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const LOCK_DIRNAME = ".astro-build-lock";
const STALE_MS = 10 * 60 * 1000;
const POLL_MS = 250;
const TIMEOUT_MS = 5 * 60 * 1000;

export async function withBuildLock(repoRoot, fn) {
  const lockDir = path.join(repoRoot, LOCK_DIRNAME);
  const deadline = Date.now() + TIMEOUT_MS;
  for (;;) {
    try {
      await mkdir(lockDir);
      break;
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
      try {
        const s = await stat(lockDir);
        if (Date.now() - s.mtimeMs > STALE_MS) {
          await rm(lockDir, { recursive: true, force: true });
          continue;
        }
      } catch {
        continue; // holder released between mkdir and stat — retry immediately
      }
      if (Date.now() > deadline) {
        throw new Error(`timed out after ${TIMEOUT_MS}ms waiting for build lock ${lockDir}`);
      }
      await sleep(POLL_MS);
    }
  }
  try {
    return await fn();
  } finally {
    await rm(lockDir, { recursive: true, force: true });
  }
}
