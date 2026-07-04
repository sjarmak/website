// Register gate on the digest publish path (PRD R3, cron failure channel).
// Same temp-mini-repo harness as digest-concept-gate.test.mjs: publish-digest
// runs with cwd set to a throwaway git repo, so the real collection and
// heartbeat are never touched.
//
// The register check is a HARD refusal in BOTH modes (cron and interactive) —
// it validates the producer's own output, unlike the mode-split concept gate.

import { test } from "node:test";
import assert from "node:assert/strict";
import { access, cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";
import { validateDigestRegisters } from "../scripts/checks/validate-digest-registers.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLISH_SCRIPT = path.join(REPO_ROOT, "scripts", "digest", "publish-digest.mjs");
const HEARTBEAT_REL = path.join("src", "data", "knowledge", "concept-sync-status.json");

async function makeTempRepo(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "register-gate-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  const repo = path.join(root, "repo");
  const home = path.join(root, "pipeline-home");
  await mkdir(path.join(repo, "src", "content", "digest"), { recursive: true });
  await mkdir(path.join(repo, "src", "data", "knowledge"), { recursive: true });
  await cp(path.join(REPO_ROOT, "src", "content", "concepts"), path.join(repo, "src", "content", "concepts"), {
    recursive: true,
  });
  await cp(path.join(REPO_ROOT, HEARTBEAT_REL), path.join(repo, HEARTBEAT_REL));

  const git = spawnSync("git", ["init", "-q"], { cwd: repo, encoding: "utf8" });
  assert.equal(git.status, 0, `git init failed: ${git.stderr}`);
  return { root, repo, home };
}

// A real cron-shaped spec: the same shape run.sh's generation agent hands the
// publisher (title/cadence/track/origin/date/summary/topics/items/body).
function cronSpec(overrides = {}) {
  return {
    title: "Code intelligence daily — fixture",
    cadence: "daily",
    track: "specialized",
    origin: "auto",
    date: "2026-07-03",
    summary: "Fixture issue exercising the register publish gate.",
    topics: ["agentic-coding"],
    items: [
      {
        title: "A fixture item",
        url: "https://example.com/fixture-item",
        source: "Example Feed",
      },
    ],
    highlights: ["Fixture highlight."],
    body: "Fixture newsletter body.\n",
    ...overrides,
  };
}

async function runPublish(t, spec, { cron }) {
  const { root, repo, home } = await makeTempRepo(t);
  const specPath = path.join(root, "spec.json");
  await writeFile(specPath, JSON.stringify(spec), "utf8");
  const env = {
    ...process.env,
    CONCEPTS_PIPELINE_HOME: home,
    ...(cron ? { DIGEST_CRON: "1" } : {}),
  };
  if (!cron) delete env.DIGEST_CRON;
  const result = spawnSync(process.execPath, [PUBLISH_SCRIPT, "--spec", specPath], {
    cwd: repo,
    env,
    encoding: "utf8",
  });
  return { result, repo };
}

for (const cron of [true, false]) {
  const mode = cron ? "cron (DIGEST_CRON=1)" : "interactive";

  test(`a real cron-shaped fixture publishes in ${mode} mode with the derived register in frontmatter`, async (t) => {
    const { result, repo } = await runPublish(t, cronSpec(), { cron });
    assert.equal(result.status, 0, `publish failed: ${result.stderr}`);
    const md = await readFile(path.join(repo, "src", "content", "digest", "daily-2026-07-03.md"), "utf8");
    const fm = YAML.parse(md.match(/^---\n([\s\S]*?)\n---/)[1]);
    assert.equal(fm.origin, "auto");
    assert.equal(fm.register, "generated");
  });

  test(`a register/origin mismatch is REFUSED in ${mode} mode with nothing written`, async (t) => {
    const { result, repo } = await runPublish(t, cronSpec({ register: "authored" }), { cron });
    assert.notEqual(result.status, 0, "publish must refuse a schema-violating issue");
    assert.match(result.stderr, /register must derive from origin/);
    await assert.rejects(
      access(path.join(repo, "src", "content", "digest", "daily-2026-07-03.md")),
      /ENOENT/,
      "no entry may be written on refusal",
    );
  });
}

test("a manual spec derives register=hybrid", async (t) => {
  const { result, repo } = await runPublish(
    t,
    cronSpec({ origin: "manual", slug: "manual-fixture" }),
    { cron: false },
  );
  assert.equal(result.status, 0, `publish failed: ${result.stderr}`);
  const md = await readFile(path.join(repo, "src", "content", "digest", "manual-fixture.md"), "utf8");
  const fm = YAML.parse(md.match(/^---\n([\s\S]*?)\n---/)[1]);
  assert.equal(fm.register, "hybrid");
});

test("an enum-outside register value is rejected by the spec schema", async (t) => {
  const { result } = await runPublish(t, cronSpec({ register: "curated" }), { cron: true });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /register/);
});

// ---------------------------------------- run.sh local validator (backstop)

test("validate-digest-registers passes the committed collection and flags drift", async (t) => {
  // the real collection must be clean (this is what run.sh executes pre-commit)
  const real = await validateDigestRegisters();
  assert.deepEqual(real.problems, []);
  assert.ok(real.checked >= 50, `expected >=50 entries, got ${real.checked}`);

  // a drifted entry (register contradicts origin) is flagged
  const dir = await mkdtemp(path.join(os.tmpdir(), "digest-registers-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(
    path.join(dir, "daily-2026-07-03.md"),
    `---\ntitle: Drifted\ncadence: daily\norigin: auto\nregister: authored\ndate: 2026-07-03\nsummary: s\n---\n\nBody.\n`,
    "utf8",
  );
  const drifted = await validateDigestRegisters({ contentDir: dir });
  assert.equal(drifted.problems.length, 1);
  assert.match(drifted.problems[0], /contradicts origin/);

  // an enum-outside register is flagged
  await writeFile(
    path.join(dir, "daily-2026-07-03.md"),
    `---\ntitle: Drifted\ncadence: daily\norigin: auto\nregister: curated\ndate: 2026-07-03\nsummary: s\n---\n\nBody.\n`,
    "utf8",
  );
  const badEnum = await validateDigestRegisters({ contentDir: dir });
  assert.equal(badEnum.problems.length, 1);
  assert.match(badEnum.problems[0], /outside the closed enum/);
});
