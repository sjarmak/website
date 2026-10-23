import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { git, REPO_ROOT, runProcess } from "./helpers/digest-sandbox.mjs";

const RUN_DATE = "2026-10-23";
const STATUS = "src/data/models/refresh-status.json";
const STUB = path.join(REPO_ROOT, "tests", "helpers", "stub-models-agent.mjs");

function identify(repo) {
  git(repo, "config", "user.email", "sandbox@example.invalid");
  git(repo, "config", "user.name", "Models Sandbox");
  git(repo, "config", "commit.gpgsign", "false");
}

async function makeSandbox(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "models-run-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const seed = path.join(root, "seed");
  for (const dir of ["scripts/models", "src/data/models", "src/lib/models"]) {
    await cp(path.join(REPO_ROOT, dir), path.join(seed, dir), { recursive: true });
  }
  for (const file of ["package.json", "package-lock.json"]) await cp(path.join(REPO_ROOT, file), path.join(seed, file));
  await writeFile(path.join(seed, ".gitignore"), "node_modules\n.models-runs/\n");
  git(root, "init", "-q", "--bare", "-b", "main", "origin.git");
  git(seed, "init", "-q", "-b", "main");
  identify(seed);
  git(seed, "add", "-A");
  git(seed, "commit", "-q", "-m", "seed");
  git(seed, "push", "-q", path.join(root, "origin.git"), "main");
  const primary = path.join(root, "primary");
  git(root, "clone", "-q", path.join(root, "origin.git"), primary);
  identify(primary);
  const job = path.join(root, "job");
  git(primary, "worktree", "add", "-q", "-b", "models-daily", job, "origin/main");
  await symlink(path.join(REPO_ROOT, "node_modules"), path.join(job, "node_modules"));
  const lock = await readFile(path.join(job, "package-lock.json"));
  await mkdir(path.join(job, ".models-runs"));
  await writeFile(path.join(job, ".models-runs", "package-lock.sha256"), `${createHash("sha256").update(lock).digest("hex")}\n`);
  const catalog = path.join(root, "catalog");
  await mkdir(path.join(catalog, "lib"), { recursive: true });
  await writeFile(path.join(catalog, "lib", "models.ts"), "export const ids = ['claude-opus-5-5'];\n");
  git(catalog, "init", "-q", "-b", "main");
  identify(catalog);
  git(catalog, "add", "-A");
  git(catalog, "commit", "-q", "-m", "catalog");
  return { root, primary, job, catalog, origin: path.join(root, "origin.git") };
}

function runJob(sandbox, env = {}) {
  const base = { ...process.env };
  for (const name of Object.keys(base)) if (name.startsWith("MODELS_") || name === "CLAUDE_CONFIG_DIR") delete base[name];
  return runProcess("bash", [path.join(sandbox.job, "scripts", "models", "run.sh")], {
    cwd: sandbox.root,
    env: {
      ...base,
      MODELS_WEBSITE_DIR: sandbox.job,
      MODELS_RUN_DATE: RUN_DATE,
      MODELS_CATALOG_REPO: sandbox.catalog,
      MODELS_CATALOG_FILES: "lib/models.ts",
      MODELS_GATES_CMD: "true",
      MODELS_LIVEBENCH_URL: "http://127.0.0.1:9",
      MODELS_TBENCH_URL: "http://127.0.0.1:9/leaderboard-read",
      MODELS_FEED_TIMEOUT_SEC: "5",
      CLAUDE_BIN: STUB,
      ...env,
    },
  }).done;
}

const status = async (sandbox) => JSON.parse(await readFile(path.join(sandbox.job, STATUS), "utf8"));
const changedFiles = (repo) => git(repo, "show", "--name-only", "--format=", "HEAD").split("\n").filter(Boolean);
const verdicts = JSON.stringify([{ model: "claude-opus-5.5", verdict: "in-catalog", citations: ["claude-opus-5-5"], reason: "listed" }]);

test("a changed run publishes data and status, and a repeat run records no change", async (t) => {
  const sandbox = await makeSandbox(t);
  const feeds = await serveFeeds(t);
  const first = await runJob(sandbox, { ...feeds.env, MODELS_PUSH: "1", STUB_VERDICTS: verdicts });
  assert.equal(first.status, 0, first.stdout + first.stderr);
  assert.equal(git(sandbox.origin, "log", "-1", "--format=%s", "main"), `content(models): daily refresh ${RUN_DATE}`);
  assert.match(git(sandbox.origin, "log", "-1", "--format=%b", "main"), /^Why: /);
  const published = await status(sandbox);
  assert.equal(published.outcome, "published");
  assert.equal(published.lastSuccess, published.lastAttempt);
  assert.match(published.catalogCommit, /^[0-9a-f]{40}$/);
  const eligibility = JSON.parse(await readFile(path.join(sandbox.job, "src/data/models/omni-eligibility.json"), "utf8"));
  assert.equal(eligibility.find((e) => e.model === "claude-opus-5.5").verdict, "in-catalog");

  const second = await runJob(sandbox, { ...feeds.env, MODELS_PUSH: "1", STUB_VERDICTS: verdicts });
  assert.equal(second.status, 0, second.stdout + second.stderr);
  assert.equal(git(sandbox.origin, "log", "-1", "--format=%s", "main"), `chore(models): refresh found no change on ${RUN_DATE}`);
  assert.deepEqual(changedFiles(sandbox.job), [STATUS]);
  assert.equal((await status(sandbox)).outcome, "no-change");
});

test("failing gates exit 6, leave every data row alone and commit only the failed status", async (t) => {
  const sandbox = await makeSandbox(t);
  const before = git(sandbox.job, "rev-parse", "HEAD");
  const prior = await status(sandbox);
  const run = await runJob(sandbox, { MODELS_GATES_CMD: "false", STUB_VERDICTS: verdicts });
  assert.equal(run.status, 6, run.stdout + run.stderr);
  assert.equal(git(sandbox.job, "rev-list", "--count", `${before}..HEAD`), "1");
  assert.deepEqual(changedFiles(sandbox.job), [STATUS]);
  assert.equal(git(sandbox.job, "status", "--porcelain"), "");
  const failed = await status(sandbox);
  assert.deepEqual([failed.outcome, failed.failedStage, failed.exitCode, failed.lastSuccess], ["failed", "gates", 6, prior.lastSuccess]);
  assert.equal(git(sandbox.origin, "rev-parse", "main"), before);
});

test("an agent failure exits 4 and a missing catalog file exits 3, each recording the stage", async (t) => {
  const sandbox = await makeSandbox(t);
  const prior = (await status(sandbox)).sources.find((s) => s.source === "omni-catalog");
  const agent = await runJob(sandbox, { STUB_FAIL_PHASE: "eligibility" });
  assert.equal(agent.status, 4, agent.stdout + agent.stderr);
  assert.equal((await status(sandbox)).failedStage, "eligibility");
  const catalog = await runJob(sandbox, { MODELS_CATALOG_FILES: "lib/missing.ts" });
  assert.equal(catalog.status, 3, catalog.stdout + catalog.stderr);
  const recorded = await status(sandbox);
  assert.equal(recorded.failedStage, "catalog");
  assert.deepEqual(recorded.sources.find((s) => s.source === "omni-catalog"), {
    source: "omni-catalog",
    status: "failed",
    checked: recorded.lastAttempt,
    lastOk: prior?.lastOk ?? null,
  });
});

test("a malformed research proposal exits 5", async (t) => {
  const sandbox = await makeSandbox(t);
  const run = await runJob(sandbox, { STUB_RESEARCH: JSON.stringify({ runDate: "1999-01-01" }) });
  assert.equal(run.status, 5, run.stdout + run.stderr);
  assert.equal((await status(sandbox)).failedStage, "research-proposals");
});

test("the account picker routes both agents to its account's config, and a refusal fails the research stage", async (t) => {
  const sandbox = await makeSandbox(t);
  const homes = path.join(sandbox.root, "homes");
  await mkdir(path.join(homes, "account2", ".claude"), { recursive: true });
  await writeFile(path.join(homes, "account2", ".claude", ".credentials.json"), "{}\n");
  const picker = path.join(sandbox.root, "picker.sh");
  await writeFile(picker, "#!/usr/bin/env bash\n[ -z \"$PICKER_REFUSE\" ] || exit 75\necho 2\n", { mode: 0o755 });
  const feeds = await serveFeeds(t);
  const routed = await runJob(sandbox, { ...feeds.env, MODELS_ACCOUNT_PICKER: picker, MODELS_ACCOUNT_HOMES: homes, STUB_VERDICTS: verdicts });
  assert.equal(routed.status, 0, routed.stdout + routed.stderr);
  const config = path.join(homes, "account2", ".claude");
  assert.match(routed.stdout, new RegExp(`research config ${config}`));
  assert.match(routed.stdout, new RegExp(`eligibility config ${config}`));
  const refused = await runJob(sandbox, { MODELS_ACCOUNT_PICKER: picker, MODELS_ACCOUNT_HOMES: homes, PICKER_REFUSE: "1" });
  assert.equal(refused.status, 4, refused.stdout + refused.stderr);
  assert.match(refused.stdout, /account picker refused the launch/);
  assert.equal((await status(sandbox)).failedStage, "research");
});

test("the job refuses the primary checkout, a push from another base, and a held lock", async (t) => {
  const sandbox = await makeSandbox(t);
  const primary = await runJob(sandbox, { MODELS_WEBSITE_DIR: sandbox.primary });
  assert.equal(primary.status, 2);
  assert.match(primary.stderr, /primary checkout/);
  const push = await runJob(sandbox, { MODELS_PUSH: "1", MODELS_BASE_REF: "models-daily" });
  assert.equal(push.status, 2);
  assert.match(push.stderr, /MODELS_BASE_REF must be origin\/main/);
  const holder = runProcess("flock", [path.join(sandbox.job, ".models-runs", "run.lock"), "sleep", "5"], { cwd: sandbox.root, env: process.env });
  await new Promise((resolve) => setTimeout(resolve, 300));
  const busy = await runJob(sandbox, { MODELS_LOCK_WAIT_SEC: "0" });
  assert.equal(busy.status, 75);
  holder.child.kill();
  await holder.done;
});

const TBENCH_BODY = { package: "terminal-bench/terminal-bench", name: "4-0-0" };
const boardRow = (agent, model, effort, accuracy) => ({
  metadata: { agent_display: { label: agent }, model_display: { label: model }, reasoning_effort: effort, date: "2026-10-20" },
  metrics: { accuracy },
  status: "display",
});

const QUESTION_SET_TABLE = [
  "model,theory_of_mind,zebra_puzzle,spatial,logic_with_navigation,consecutive_events,tablejoin,tablereformat,paraphrase,simplify,story_generation,summarize",
  "grok-4.7-xhigh,84.0,86.0,96.0,66.0,85.727,44.923,100.0,78.05,69.967,74.917,78.167",
].join("\n");
const QUESTION_SET_CATEGORIES = JSON.stringify({
  Reasoning: ["theory_of_mind", "zebra_puzzle", "spatial", "logic_with_navigation"],
  "Data Analysis": ["consecutive_events", "tablejoin", "tablereformat"],
  IF: ["paraphrase", "simplify", "story_generation", "summarize"],
});

async function serveFeeds(t, { questionSet = true } = {}) {
  const posted = [];
  const server = createServer((req, res) => {
    const send = (code, body, type = "text/plain") => {
      res.writeHead(code, { "content-type": type });
      res.end(body);
    };
    if (req.method === "POST" && req.url === "/leaderboard-read") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        posted.push(JSON.parse(body));
        send(200, JSON.stringify({ leaderboard: { ...TBENCH_BODY, title: "Terminal-Bench 4.0" }, rows: [boardRow("Claude Code", "Claude Opus 5", "xhigh", 55)] }), "application/json");
      });
      return;
    }
    if (req.url === "/") return send(200, '<script src="/static/js/main.0a1b2c.js"></script>', "text/html");
    if (req.url === "/static/js/main.0a1b2c.js") return send(200, 'const v1=["2026-06-25","2026-04-02"],_e=["20261014"];');
    if (questionSet && req.url === "/v1/table_2026_06_25.csv") return send(200, `${QUESTION_SET_TABLE}\n`);
    if (questionSet && req.url === "/v1/categories_2026_06_25.json") return send(200, QUESTION_SET_CATEGORIES, "application/json");
    const data = /^\/data\/20261014\/(table\.csv|categories\.json|cost\.csv|notes\.json)$/.exec(req.url ?? "");
    if (data) return send(200, data[1].endsWith(".csv") ? "model,score\nx,1\n" : "{}");
    send(404, "missing");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { posted, env: { MODELS_LIVEBENCH_URL: base, MODELS_TBENCH_URL: `${base}/leaderboard-read` } };
}

const observation = (extra) => ({ version: "4.0, tbench.ai official harness", sourceUrl: "https://www.tbench.ai/leaderboard", retrieved: RUN_DATE, evidence: "leaderboard row", ...extra });
const feedSources = (s) => s.sources.filter((x) => x.source.endsWith("-feed")).map((x) => [x.source, x.status]);

test("the job saves both feeds for the agents, then checks Terminal-Bench rows and LiveBench releases against them", async (t) => {
  const sandbox = await makeSandbox(t);
  const feeds = await serveFeeds(t);
  const research = {
    observations: [
      observation({ model: "claude-opus-5", benchmark: "terminal-bench-4", score: 55, agent: "Claude Code", effort: "xhigh" }),
      observation({ model: "claude-opus-5.5", benchmark: "terminal-bench-4", score: 61.2, agent: "Terminus 2", effort: "high" }),
      {
        model: "claude-opus-5.5",
        benchmark: "livebench-data-analysis",
        score: 70.1,
        version: "2026-06-25 question set",
        sourceUrl: "https://livebench.ai/data/20261014/table.csv",
        retrieved: RUN_DATE,
        evidence: "table row",
      },
    ],
  };
  const run = await runJob(sandbox, { ...feeds.env, STUB_RESEARCH: JSON.stringify(research), STUB_VERDICTS: verdicts });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.deepEqual(feeds.posted, [TBENCH_BODY]);
  assert.match(run.stdout, /research feeds 20261014 terminal-bench\/terminal-bench 4-0-0/);
  const recorded = await status(sandbox);
  assert.deepEqual(feedSources(recorded), [["livebench-feed", "ok"], ["terminal-bench-feed", "ok"]]);
  assert.deepEqual([recorded.accepted, recorded.rejected], [2, 2]);
  assert.match(recorded.notices.join(" "), /LiveBench published release 2026-10-14, which the composite does not use/);
  const observations = JSON.parse(await readFile(path.join(sandbox.job, "src/data/models/observations.json"), "utf8"));
  const accepted = observations.find((o) => o.model === "claude-opus-5" && o.benchmark === "terminal-bench-4");
  assert.deepEqual([accepted.score, accepted.note], [55, "agent Claude Code, effort xhigh, leaderboard terminal-bench/terminal-bench 4-0-0"]);
  const log = await readFile(path.join(sandbox.job, ".models-runs", `${RUN_DATE}.log`), "utf8");
  assert.match(log, /REJECT observation claude-opus-5\.5 \| no terminal-bench\/terminal-bench 4-0-0 row for Claude Opus 5\.5 with agent Terminus 2/);
  assert.match(log, /REJECT observation claude-opus-5\.5 \| a livebench-data-analysis score must cite the 2026-06-25 question set table https:\/\/livebench\.ai\/v1\/table_2026_06_25\.csv/);
});

test("unreachable feeds are recorded as failed sources, change no rows, and exit 8 after publishing what validated", async (t) => {
  const sandbox = await makeSandbox(t);
  const research = { observations: [observation({ model: "claude-opus-5", benchmark: "terminal-bench-4", score: 55, agent: "Claude Code", effort: "xhigh" })] };
  const before = await readFile(path.join(sandbox.job, "src/data/models/observations.json"), "utf8");
  const run = await runJob(sandbox, { STUB_RESEARCH: JSON.stringify(research), STUB_VERDICTS: verdicts });
  assert.equal(run.status, 8, run.stdout + run.stderr);
  assert.match(run.stdout, /research feeds none none/);
  assert.match(run.stdout, /these sources failed this run and their rows stay as they were: livebench-feed terminal-bench-feed/);
  const recorded = await status(sandbox);
  assert.deepEqual(feedSources(recorded), [["livebench-feed", "failed"], ["terminal-bench-feed", "failed"]]);
  assert.deepEqual(recorded.notices, []);
  assert.equal(await readFile(path.join(sandbox.job, "src/data/models/observations.json"), "utf8"), before);
  const log = await readFile(path.join(sandbox.job, ".models-runs", `${RUN_DATE}.log`), "utf8");
  assert.match(log, /REJECT observation claude-opus-5 \| the terminal-bench\/terminal-bench 4-0-0 leaderboard was not fetched this run/);
});

test("a research agent that rewrites its copy of a feed cannot vouch for its own row", async (t) => {
  const sandbox = await makeSandbox(t);
  const feeds = await serveFeeds(t);
  const forged = { leaderboard: { ...TBENCH_BODY }, rows: [boardRow("Forge", "Claude Opus 5.5", "max", 99)] };
  const research = { observations: [observation({ model: "claude-opus-5.5", benchmark: "terminal-bench-4", score: 99, agent: "Forge", effort: "max" })] };
  const before = await readFile(path.join(sandbox.job, "src/data/models/observations.json"), "utf8");
  const run = await runJob(sandbox, { ...feeds.env, STUB_FORGE_BOARD: JSON.stringify(forged), STUB_RESEARCH: JSON.stringify(research), STUB_VERDICTS: verdicts });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.equal(await readFile(path.join(sandbox.job, "src/data/models/observations.json"), "utf8"), before);
  const log = await readFile(path.join(sandbox.job, ".models-runs", `${RUN_DATE}.log`), "utf8");
  assert.match(log, /REJECT observation claude-opus-5\.5 \| no terminal-bench\/terminal-bench 4-0-0 row for Claude Opus 5\.5 with agent Forge/);
});

const livebenchClaim = (extra) => ({
  model: "grok-4.7",
  benchmark: "livebench-reasoning",
  version: "2026-06-25 question set",
  sourceRow: "grok-4.7-xhigh",
  sourceUrl: "https://livebench.ai/v1/table_2026_06_25.csv",
  retrieved: RUN_DATE,
  evidence: "question set table row",
  ...extra,
});

test("the job saves the pinned LiveBench question set and accepts a score only as the sealed table's own category mean, whatever the agent's copy says", async (t) => {
  const sandbox = await makeSandbox(t);
  const feeds = await serveFeeds(t);
  const research = { observations: [livebenchClaim({ score: 83 }), livebenchClaim({ benchmark: "livebench-data-analysis", score: 77.2 })] };
  const forged = QUESTION_SET_TABLE.replace("85.727,44.923", "86.627,44.923");
  const run = await runJob(sandbox, { ...feeds.env, STUB_FORGE_QUESTION_SET: forged, STUB_RESEARCH: JSON.stringify(research), STUB_VERDICTS: verdicts });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.match(run.stdout, /research question sets 2026_06_25/);
  assert.deepEqual(feedSources(await status(sandbox)), [["livebench-feed", "ok"], ["terminal-bench-feed", "ok"]]);
  const observations = JSON.parse(await readFile(path.join(sandbox.job, "src/data/models/observations.json"), "utf8"));
  const reasoning = observations.find((o) => o.model === "grok-4.7" && o.benchmark === "livebench-reasoning");
  assert.deepEqual([reasoning.score, reasoning.note], [83, "LiveBench row grok-4.7-xhigh, 2026-06-25 question set"]);
  const log = await readFile(path.join(sandbox.job, ".models-runs", `${RUN_DATE}.log`), "utf8");
  assert.match(log, /REJECT observation grok-4\.7 \| LiveBench row grok-4\.7-xhigh averages 76\.9 on Data Analysis, not 77\.2/);
});

test("a pinned LiveBench question set that cannot be fetched fails the LiveBench feed and changes no LiveBench row", async (t) => {
  const sandbox = await makeSandbox(t);
  const feeds = await serveFeeds(t, { questionSet: false });
  const before = await readFile(path.join(sandbox.job, "src/data/models/observations.json"), "utf8");
  const run = await runJob(sandbox, { ...feeds.env, STUB_RESEARCH: JSON.stringify({ observations: [livebenchClaim({ score: 83 })] }), STUB_VERDICTS: verdicts });
  assert.equal(run.status, 8, run.stdout + run.stderr);
  assert.match(run.stdout, /feed http:\/\/127\.0\.0\.1:\d+\/v1\/table_2026_06_25\.csv answered HTTP 404/);
  assert.match(run.stdout, /research feeds none terminal-bench\/terminal-bench 4-0-0/);
  assert.match(run.stdout, /research question sets none/);
  assert.deepEqual(feedSources(await status(sandbox)), [["livebench-feed", "failed"], ["terminal-bench-feed", "ok"]]);
  assert.equal(await readFile(path.join(sandbox.job, "src/data/models/observations.json"), "utf8"), before);
  const log = await readFile(path.join(sandbox.job, ".models-runs", `${RUN_DATE}.log`), "utf8");
  assert.match(log, /REJECT observation grok-4\.7 \| the LiveBench 2026-06-25 question set table was not fetched this run/);
});
