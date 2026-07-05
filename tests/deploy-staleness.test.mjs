// R19a deploy-staleness gate (scripts/checks/deploy-staleness.mjs): refuses
// (exit 2 + loud message + pipeline-home marker) against a stale fixture,
// honors the DIGEST_FORCE=1 override, and warns-and-proceeds (exit 0) on
// network failure or an unparseable sitemap — the check itself never
// hard-blocks a run. All fixtures are injected via --sitemap-file/--sitemap-url
// and --digest-dir; no test touches the real site.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import { REPO_ROOT } from "../scripts/concepts/lib/pipeline-home.mjs";

const run = promisify(execFile);
const CHECK = path.join(REPO_ROOT, "scripts", "checks", "deploy-staleness.mjs");

function sitemapXml(digestDates) {
  const urls = [
    `<url><loc>https://sjarmak.ai/</loc></url>`,
    `<url><loc>https://sjarmak.ai/writing/</loc><lastmod>2026-01-01T00:00:00.000Z</lastmod></url>`,
    ...digestDates.map(
      (d) =>
        `<url><loc>https://sjarmak.ai/digest/daily-${d}/</loc>` +
        `<lastmod>${d}T00:00:00.000Z</lastmod><priority>0.3</priority></url>`,
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?><urlset>${urls.join("")}</urlset>`;
}

async function sandbox(t, { deployedDates, localDates, extraLocalFiles = {} }) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "deploy-staleness-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const home = path.join(dir, "home");
  const digestDir = path.join(dir, "digest");
  await mkdir(home, { recursive: true });
  await mkdir(digestDir, { recursive: true });
  const sitemapFile = path.join(dir, "sitemap-0.xml");
  await writeFile(sitemapFile, sitemapXml(deployedDates));
  for (const d of localDates) {
    await writeFile(path.join(digestDir, `daily-${d}.md`), `---\ndate: ${d}\n---\nbody\n`);
  }
  for (const [name, body] of Object.entries(extraLocalFiles)) {
    await writeFile(path.join(digestDir, name), body);
  }
  return { dir, home, digestDir, sitemapFile, alertsDir: path.join(home, "alerts") };
}

async function runCheck(args, env) {
  const base = { ...process.env };
  delete base.DIGEST_FORCE;
  try {
    const { stdout, stderr } = await run("node", [CHECK, ...args], { env: { ...base, ...env } });
    return { code: 0, stdout, stderr };
  } catch (err) {
    return { code: err.code, stdout: err.stdout ?? "", stderr: err.stderr ?? "" };
  }
}

async function staleMarkers(alertsDir) {
  try {
    return (await readdir(alertsDir)).filter((n) => n.startsWith("deploy-stale-"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

test("stale deploy: exit 2, loud message naming both dates, marker in pipeline home", async (t) => {
  const s = await sandbox(t, {
    deployedDates: ["2026-06-19", "2026-06-20"],
    localDates: ["2026-06-20", "2026-07-03"],
  });
  const { code, stderr } = await runCheck(
    ["--sitemap-file", s.sitemapFile, "--digest-dir", s.digestDir],
    { CONCEPTS_PIPELINE_HOME: s.home },
  );
  assert.equal(code, 2, stderr);
  assert.match(stderr, /STALE DEPLOY/);
  assert.match(stderr, /2026-07-03/);
  assert.match(stderr, /2026-06-20/);
  assert.match(stderr, /REFUSING generation/);
  assert.match(stderr, /DIGEST_FORCE=1/);
  const markers = await staleMarkers(s.alertsDir);
  assert.equal(markers.length, 1);
  assert.match(await readFile(path.join(s.alertsDir, markers[0]), "utf8"), /STALE DEPLOY/);
});

test("DIGEST_FORCE=1 override: proceeds (exit 0) with a loud warning, marker still written", async (t) => {
  const s = await sandbox(t, {
    deployedDates: ["2026-06-20"],
    localDates: ["2026-07-03"],
  });
  const { code, stderr } = await runCheck(
    ["--sitemap-file", s.sitemapFile, "--digest-dir", s.digestDir],
    { CONCEPTS_PIPELINE_HOME: s.home, DIGEST_FORCE: "1" },
  );
  assert.equal(code, 0, stderr);
  assert.match(stderr, /STALE DEPLOY/);
  assert.match(stderr, /DIGEST_FORCE=1 — proceeding despite the stale deploy/);
  assert.equal((await staleMarkers(s.alertsDir)).length, 1, "override still leaves the marker");
});

test("fresh deploy (gap within threshold): exit 0, no marker", async (t) => {
  const s = await sandbox(t, {
    deployedDates: ["2026-07-02"],
    localDates: ["2026-07-03"],
  });
  const { code, stdout } = await runCheck(
    ["--sitemap-file", s.sitemapFile, "--digest-dir", s.digestDir],
    { CONCEPTS_PIPELINE_HOME: s.home },
  );
  assert.equal(code, 0, stdout);
  assert.match(stdout, /OK — deploy is fresh/);
  assert.deepEqual(await staleMarkers(s.alertsDir), []);
});

test("custom --threshold-hours tightens the gate", async (t) => {
  const s = await sandbox(t, {
    deployedDates: ["2026-07-02"],
    localDates: ["2026-07-03"], // 24h gap: fresh at 48h, stale at 12h
  });
  const { code, stderr } = await runCheck(
    ["--sitemap-file", s.sitemapFile, "--digest-dir", s.digestDir, "--threshold-hours", "12"],
    { CONCEPTS_PIPELINE_HOME: s.home },
  );
  assert.equal(code, 2, stderr);
  assert.match(stderr, /threshold 12h/);
});

test("network failure: warn-and-proceed (exit 0), never a hard block, no marker", async (t) => {
  const s = await sandbox(t, { deployedDates: [], localDates: ["2026-07-03"] });
  const { code, stderr } = await runCheck(
    // Closed port — connection refused, exercising the fetch failure path.
    ["--sitemap-url", "http://127.0.0.1:9/sitemap-0.xml", "--digest-dir", s.digestDir],
    { CONCEPTS_PIPELINE_HOME: s.home },
  );
  assert.equal(code, 0, stderr);
  assert.match(stderr, /WARNING: could not read the live sitemap/);
  assert.match(stderr, /proceeding \(offline-safe\)/);
  assert.deepEqual(await staleMarkers(s.alertsDir), []);
});

test("sitemap without any dateable digest URL: warn-and-proceed (exit 0)", async (t) => {
  const s = await sandbox(t, { deployedDates: [], localDates: ["2026-07-03"] });
  const { code, stderr } = await runCheck(
    ["--sitemap-file", s.sitemapFile, "--digest-dir", s.digestDir],
    { CONCEPTS_PIPELINE_HOME: s.home },
  );
  assert.equal(code, 0, stderr);
  assert.match(stderr, /no dateable \/digest\/ URL found/);
});

test("pre-R3 sitemap (digest locs without lastmod): slug dates still detect staleness", async (t) => {
  const s = await sandbox(t, { deployedDates: [], localDates: ["2026-07-03"] });
  const preR3 = path.join(s.dir, "sitemap-pre-r3.xml");
  await writeFile(
    preR3,
    `<?xml version="1.0" encoding="UTF-8"?><urlset>` +
      `<url><loc>https://sjarmak.ai/digest/weekly-general-2026-06-20/</loc></url>` +
      `<url><loc>https://sjarmak.ai/projects/code-intelligence-digest/</loc></url>` +
      `</urlset>`,
  );
  const { code, stderr } = await runCheck(
    ["--sitemap-file", preR3, "--digest-dir", s.digestDir],
    { CONCEPTS_PIPELINE_HOME: s.home },
  );
  assert.equal(code, 2, stderr);
  assert.match(stderr, /STALE DEPLOY/);
  assert.match(stderr, /2026-06-20/);
});

test("undateable slug falls back to frontmatter date", async (t) => {
  const s = await sandbox(t, {
    deployedDates: ["2026-06-20"],
    localDates: [],
    extraLocalFiles: {
      "manual-special-issue.md": '---\ntitle: x\ndate: "2026-07-03"\n---\nbody\n',
    },
  });
  const { code, stderr } = await runCheck(
    ["--sitemap-file", s.sitemapFile, "--digest-dir", s.digestDir],
    { CONCEPTS_PIPELINE_HOME: s.home },
  );
  assert.equal(code, 2, stderr);
  assert.match(stderr, /2026-07-03/);
});
