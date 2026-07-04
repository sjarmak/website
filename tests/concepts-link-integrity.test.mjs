// Link-integrity coverage: the check passes over the real built site and
// fails when pointed at a fixture page containing dead links. Runs in the
// normal `npm test` flow so the built page's evidence links stay verified
// recurrently, not just at merge time.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { checkLinks, routeToDistCandidates } from "../scripts/checks/concepts-link-integrity.mjs";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(REPO_ROOT, "scripts", "checks", "concepts-link-integrity.mjs");
const DEAD_FIXTURE_DIST = path.join(REPO_ROOT, "tests", "fixtures", "link-integrity-dead");

async function runCheck(args) {
  try {
    const { stdout, stderr } = await execFileP("node", [SCRIPT, ...args], { cwd: REPO_ROOT });
    return { code: 0, stdout, stderr };
  } catch (err) {
    return { code: err.code, stdout: err.stdout, stderr: err.stderr };
  }
}

test("route -> dist mapping covers the shapes the site emits", () => {
  assert.deepEqual(routeToDistCandidates("/"), ["index.html"]);
  assert.deepEqual(routeToDistCandidates("/digest/x/"), [path.join("digest", "x", "index.html"), path.join("digest", "x") + ".html"]);
  assert.deepEqual(routeToDistCandidates("/library/explorers/y"), [
    path.join("library", "explorers", "y", "index.html"),
    path.join("library", "explorers", "y") + ".html",
  ]);
  assert.deepEqual(routeToDistCandidates("/rss.xml"), ["rss.xml"]);
});

test("checkLinks flags dead internal links, dead fragments, and malformed externals", () => {
  const html = [
    '<h1 id="top">x</h1>',
    '<a href="/nope/">dead</a>',
    '<a href="#missing">dead frag</a>',
    '<a href="#top">ok frag</a>',
    '<a href="http://not a url">bad</a>',
    '<a href="https://example.com/fine">ok</a>',
  ].join("\n");
  const { failures } = checkLinks(html, path.join(DEAD_FIXTURE_DIST));
  assert.equal(failures.length, 3, failures.join("; "));
  assert.ok(failures.some((f) => f.startsWith("internal /nope/")));
  assert.ok(failures.some((f) => f.startsWith("fragment #missing")));
  assert.ok(failures.some((f) => f.startsWith("external http://not a url")));
});

test("script fails (exit 1) on the fixture page with a dead link", async () => {
  const result = await runCheck(["--dist", DEAD_FIXTURE_DIST]);
  assert.equal(result.code, 1, `expected failure, got: ${result.stdout} ${result.stderr}`);
  assert.match(result.stderr, /BROKEN: internal \/digest\/does-not-exist-xyz\//);
  assert.match(result.stderr, /BROKEN: fragment #missing-anchor/);
  // the good links do not produce failures
  assert.doesNotMatch(result.stderr, /real-issue/);
});

test("script passes over the real built site", async () => {
  if (!existsSync(path.join(REPO_ROOT, "dist", "index.html"))) {
    await execFileP("npm", ["run", "build"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 });
  }
  const result = await runCheck([]);
  assert.equal(result.code, 0, `link check failed:\n${result.stderr}`);
  assert.match(result.stdout, /\[links\] OK/);
});
