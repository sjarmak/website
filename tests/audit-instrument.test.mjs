// R14 audit instrument (scripts/audit/llm-bio-audit.mjs): offline no-keys run
// writes dated reports outside the repo; endpoint failures are recorded, never
// crashes; URL extraction + flatness math; and grep-asserted "manual-run only"
// (no CI workflow or cron entry invokes the audit — run.sh only files a
// REMINDER via audit-reminder.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import { REPO_ROOT } from "../scripts/concepts/lib/pipeline-home.mjs";
import { extractSjarmakUrls } from "../scripts/audit/lib/extract.mjs";
import { ENDPOINTS, runLane, selectEndpoints } from "../scripts/audit/lib/endpoints.mjs";
import { summarize } from "../scripts/audit/lib/report.mjs";

const run = promisify(execFile);
const AUDIT_SCRIPT = path.join(REPO_ROOT, "scripts", "audit", "llm-bio-audit.mjs");
const KEY_ENVS = ["PERPLEXITY_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "BRAVE_SEARCH_API_KEY"];

function envWithoutKeys(overrides) {
  const env = { ...process.env, ...overrides };
  for (const key of KEY_ENVS) delete env[key];
  delete env.AUDIT_ENDPOINTS;
  return env;
}

async function runAudit(args, env) {
  try {
    const { stdout, stderr } = await run("node", [AUDIT_SCRIPT, ...args], { env });
    return { code: 0, stdout, stderr };
  } catch (err) {
    return { code: err.code, stdout: err.stdout ?? "", stderr: err.stderr ?? "" };
  }
}

test("offline no-keys run: exit 0, dated JSON+md reports outside the repo, all keyed lanes unavailable, flat indeterminate", async (t) => {
  const home = await mkdtemp(path.join(os.tmpdir(), "audit-home-"));
  t.after(() => rm(home, { recursive: true, force: true }));
  const env = envWithoutKeys({ CONCEPTS_PIPELINE_HOME: home });

  // Keyed lanes only: fully offline, deterministic (no keyless network lane).
  const { code, stdout, stderr } = await runAudit(
    ["--endpoints", "perplexity,openai,anthropic,brave-search", "--date", "2026-01-15"],
    env,
  );
  assert.equal(code, 0, `a fully-unavailable run is a valid recorded run\n${stderr}`);

  const [jsonPath, mdPath] = stdout.trim().split("\n");
  assert.equal(jsonPath, path.join(home, "audits", "audit-2026-01-15.json"));
  assert.equal(mdPath, path.join(home, "audits", "audit-2026-01-15.md"));
  assert.ok(!jsonPath.startsWith(REPO_ROOT), "report must live outside the repo");

  const report = JSON.parse(await readFile(jsonPath, "utf8"));
  assert.equal(report.lanes.length, 4);
  for (const lane of report.lanes) {
    assert.equal(lane.status, "unavailable", `${lane.id} must skip without a key`);
    assert.match(lane.reason, /API_KEY not set/);
  }
  assert.equal(report.summary.lanesAvailable, 0);
  assert.equal(report.summary.conceptUrlsCited, 0);
  assert.equal(report.summary.flat, null, "zero available lanes must be indeterminate, not flat");

  const md = await readFile(mdPath, "utf8");
  assert.match(md, /# LLM bio audit/);
  assert.match(md, /Flat: indeterminate/);
  assert.match(md, /identity-who/);
});

test("pipeline home inside the repo is rejected", async (t) => {
  const env = envWithoutKeys({ CONCEPTS_PIPELINE_HOME: path.join(REPO_ROOT, ".audit-home") });
  const { code, stderr } = await runAudit(["--endpoints", "openai"], env);
  assert.notEqual(code, 0);
  assert.match(stderr, /inside the repo/);
});

test("unknown endpoint id fails fast", async (t) => {
  const home = await mkdtemp(path.join(os.tmpdir(), "audit-home-"));
  t.after(() => rm(home, { recursive: true, force: true }));
  const { code, stderr } = await runAudit(
    ["--endpoints", "bing"],
    envWithoutKeys({ CONCEPTS_PIPELINE_HOME: home }),
  );
  assert.notEqual(code, 0);
  assert.match(stderr, /unknown endpoint "bing"/);
});

test("URL extraction: sjarmak.ai hosts only, normalized, /concepts/* classified", () => {
  const text = [
    "See https://www.sjarmak.ai/concepts/agent-memory/ and http://sjarmak.ai/projects/scix.",
    "Also sjarmak.ai/concepts/evaluation (bare) and https://example.com/concepts/agent-memory.",
    "Root: https://sjarmak.ai and a repeat https://www.sjarmak.ai/concepts/agent-memory?x=1",
  ].join("\n");
  const { sjarmakUrls, conceptUrls } = extractSjarmakUrls(text, [
    "https://www.sjarmak.ai/writing/",
    "https://not-sjarmak.ai/concepts/foo",
  ]);
  assert.deepEqual(sjarmakUrls, [
    "https://www.sjarmak.ai/",
    "https://www.sjarmak.ai/concepts/agent-memory",
    "https://www.sjarmak.ai/concepts/evaluation",
    "https://www.sjarmak.ai/projects/scix",
    "https://www.sjarmak.ai/writing",
  ]);
  assert.deepEqual(conceptUrls, [
    "https://www.sjarmak.ai/concepts/agent-memory",
    "https://www.sjarmak.ai/concepts/evaluation",
  ]);
});

test("flatness math: cited concepts -> not flat; none -> flat; no lanes -> null", () => {
  const questions = [{ id: "q1" }];
  const okLane = (conceptUrls) => ({
    id: "x",
    status: "ok",
    results: [{ questionId: "q1", status: "ok", sjarmakUrls: conceptUrls, conceptUrls }],
  });
  const dead = { id: "y", status: "unavailable", reason: "no key" };

  const cited = summarize([okLane(["https://www.sjarmak.ai/concepts/evaluation"]), dead], questions);
  assert.equal(cited.flat, false);
  assert.equal(cited.conceptUrlsCited, 1);

  const flat = summarize([okLane([]), dead], questions);
  assert.equal(flat.flat, true);

  const noLanes = summarize([dead], questions);
  assert.equal(noLanes.flat, null);
  assert.match(noLanes.flatNote, /Search Console/);
});

test("a dead endpoint yields a recorded unavailable lane, never a throw", async () => {
  const duckduckgo = selectEndpoints(["duckduckgo"])[0];
  const fetchImpl = async () => {
    throw new Error("network blocked");
  };
  const lane = await runLane(duckduckgo, [{ id: "q1", text: "who is Stephanie Jarmak" }], {
    env: {},
    fetchImpl,
    timeoutMs: 500,
    log: () => {},
  });
  assert.equal(lane.status, "unavailable");
  assert.match(lane.reason, /network blocked/);
  assert.equal(lane.results[0].status, "error");
});

test("an answering endpoint records cited sjarmak.ai URLs", async () => {
  const duckduckgo = selectEndpoints(["duckduckgo"])[0];
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({
      AbstractText: "Stephanie Jarmak — see https://www.sjarmak.ai/concepts/agent-memory",
      AbstractURL: "https://www.sjarmak.ai/",
      Results: [],
      RelatedTopics: [{ FirstURL: "https://example.com/other" }],
    }),
  });
  const lane = await runLane(duckduckgo, [{ id: "q1", text: "agent memory evaluation benchmarks" }], {
    env: {},
    fetchImpl,
    timeoutMs: 500,
    log: () => {},
  });
  assert.equal(lane.status, "ok");
  assert.deepEqual(lane.results[0].sjarmakUrls, [
    "https://www.sjarmak.ai/",
    "https://www.sjarmak.ai/concepts/agent-memory",
  ]);
  assert.deepEqual(lane.results[0].conceptUrls, ["https://www.sjarmak.ai/concepts/agent-memory"]);
});

test("every keyed endpoint reads its key from env only", () => {
  for (const endpoint of ENDPOINTS) {
    if (endpoint.id === "duckduckgo") {
      assert.equal(endpoint.envKey, null);
    } else {
      assert.match(endpoint.envKey, /_API_KEY$/, `${endpoint.id} must key off an env var`);
    }
  }
});

// ---- manual-run only: grep-asserted never wired into CI or as a cron step ----

test("no CI workflow references the audit scripts", () => {
  const wfDir = path.join(REPO_ROOT, ".github", "workflows");
  for (const f of readdirSync(wfDir)) {
    const text = readFileSync(path.join(wfDir, f), "utf8");
    assert.ok(!text.includes("scripts/audit"), `${f} must not reference scripts/audit`);
    assert.ok(!text.includes("llm-bio-audit"), `${f} must not reference llm-bio-audit`);
  }
});

test("cron surfaces never run the audit; run.sh only files the reminder", () => {
  for (const surface of ["scripts/digest/run.sh", "scripts/knowledge/sync-knowledge.sh"]) {
    const text = readFileSync(path.join(REPO_ROOT, surface), "utf8");
    assert.ok(!text.includes("llm-bio-audit"), `${surface} must never run the audit itself`);
  }
  const runSh = readFileSync(path.join(REPO_ROOT, "scripts", "digest", "run.sh"), "utf8");
  assert.match(runSh, /audit-reminder\.mjs/, "run.sh must file the monthly reminder");
  assert.match(runSh, /audit-reminder\.mjs.*\|\| true/, "reminder failure must not affect the digest run");
  assert.ok(!readFileSync(path.join(REPO_ROOT, "package.json"), "utf8").includes("llm-bio-audit"),
    "no npm script may wrap the audit");
});

test("run.sh still parses (bash -n)", async () => {
  await run("bash", ["-n", path.join(REPO_ROOT, "scripts", "digest", "run.sh")]);
});
