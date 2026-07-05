// R19b one-commit digest reversal lever: proves that flipping DIGEST_NOINDEX
// (src/lib/register.ts) deindexes the ENTIRE digest surface — every /digest/*
// page carries `noindex, follow`, the sitemap drops all digest URLs — while
// the register-drift check stays green.
//
// The build runs with DIGEST_NOINDEX_BUILD=1, register.ts's documented test
// seam: `DIGEST_NOINDEX = DIGEST_NOINDEX_LEVER || env`, so the env branch
// takes the IDENTICAL downstream path as the committed one-line flip (mutating
// the shared source mid-run would race the parallel test processes that
// import it). The committed default (the "flip back" state) is asserted at
// source level here and behaviorally by the register-dist suite over dist/.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { withBuildLock } from "./fixtures/build-lock.mjs";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUILD_CONFIG = path.join("tests", "fixtures", "astro.stability.config.mjs");
const LEVER_ENV = { DIGEST_NOINDEX_BUILD: "1" };

test("committed lever default is false (the flip-back state)", async () => {
  const source = await readFile(path.join(REPO_ROOT, "src", "lib", "register.ts"), "utf8");
  assert.match(
    source,
    /^const DIGEST_NOINDEX_LEVER = false;$/m,
    "the one-line lever must be committed in its default (indexed) state",
  );
});

test("flipped lever deindexes all digest pages, empties them from the sitemap, drift stays green", async (t) => {
  const scratch = await mkdtemp(path.join(os.tmpdir(), "digest-noindex-lever-"));
  const outDir = path.join(scratch, "dist");
  t.after(() => rm(scratch, { recursive: true, force: true }));

  await withBuildLock(REPO_ROOT, () =>
    execFileP("npx", ["astro", "build", "--config", BUILD_CONFIG], {
      cwd: REPO_ROOT,
      env: { ...process.env, ...LEVER_ENV, STABILITY_OUT_DIR: outDir },
      maxBuffer: 64 * 1024 * 1024,
    }),
  );

  // Every rendered digest page — index, archive, and all issues — is
  // noindex,follow (follow: link equity keeps flowing; pages leave the index).
  const digestPages = await listHtml(path.join(outDir, "digest"));
  assert.ok(digestPages.length > 10, `expected the full digest surface, got ${digestPages.length}`);
  for (const rel of digestPages) {
    const html = await readFile(path.join(outDir, "digest", rel), "utf8");
    assert.match(
      html,
      /<meta name="robots" content="noindex, follow"\s*\/?>/,
      `digest/${rel} must be noindex,follow under the flipped lever`,
    );
    assert.doesNotMatch(html, /noindex, nofollow/, `digest/${rel} must keep follow semantics`);
  }
  assert.ok(
    digestPages.includes(path.join("archive", "index.html")),
    "the digest archive page is part of the deindexed surface",
  );

  // Control: the rest of the site is untouched.
  const home = await readFile(path.join(outDir, "index.html"), "utf8");
  assert.doesNotMatch(home, /<meta name="robots"/, "homepage must stay indexable");

  // Sitemap: zero digest URLs.
  const sitemap = await readFile(path.join(outDir, "sitemap-0.xml"), "utf8");
  assert.doesNotMatch(sitemap, /\/digest\//, "no /digest/ URL may remain in the sitemap");
  assert.match(sitemap, /<loc>https:\/\/sjarmak\.ai\/<\/loc>/, "sitemap still carries the site");

  // Register-drift check over the flipped dist, with the same lever state:
  // green — the flip is a hygiene-consistent state, not an exemption.
  await assert.doesNotReject(
    execFileP("node", ["scripts/checks/register-drift.mjs", "--dist", outDir], {
      cwd: REPO_ROOT,
      env: { ...process.env, ...LEVER_ENV },
      maxBuffer: 16 * 1024 * 1024,
    }),
    "register-drift must stay green after the flip",
  );
});

async function listHtml(dir, base = dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listHtml(abs, base)));
    else if (entry.name.endsWith(".html")) out.push(path.relative(base, abs));
  }
  return out.sort();
}
