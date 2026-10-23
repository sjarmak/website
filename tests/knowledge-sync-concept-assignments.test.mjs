import assert from "node:assert/strict";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

import {
  CONCEPT_ASSIGNMENTS_REL,
  EXPLORERS_REL,
  git,
  makeDigestSandbox,
  REPO_ROOT,
  runProcess,
  sandboxEnv,
} from "./helpers/digest-sandbox.mjs";

const SYNC_SCRIPT = path.join(REPO_ROOT, "scripts", "knowledge", "sync-knowledge.sh");
const DATE = "2026-07-04";
const HEARTBEAT_REL = "src/data/knowledge/concept-sync-status.json";
const BIBCODE = "2026arXiv260700001T";
const SYNCED_EXPLORERS = {
  explorers: [
    {
      id: "agents",
      sections: [{ key: "evals", label: "Evals" }],
      papers: [{ bibcode: BIBCODE, branches: ["evals"], notes: [{ branch: "evals", takeaway: "Measured." }] }],
    },
  ],
};

async function stub(dir, name, script) {
  const file = path.join(dir, name);
  await writeFile(file, `#!/bin/sh\n${script}\n`, "utf8");
  await chmod(file, 0o755);
  return file;
}

async function syncSandbox(t, explorersAfterSync, { repoHeartbeat = false } = {}) {
  const sandbox = await makeDigestSandbox(t, { prefix: "knowledge-sync-assignments-", withScripts: true });
  const knowledge = path.join(sandbox.repo, "src", "data", "knowledge");
  await mkdir(path.join(knowledge, "explorers"), { recursive: true });
  await writeFile(path.join(knowledge, "explorers", "agents.json"), "{}\n", "utf8");
  await writeFile(path.join(knowledge, "paper-synthesis.json"), "{}\n", "utf8");
  await writeFile(path.join(knowledge, "explorer-pending.json"), "{}\n", "utf8");
  git(sandbox.repo, "add", "-A");
  git(sandbox.repo, "commit", "-q", "-m", "sync inputs");

  const stubDir = path.join(sandbox.root, "bin");
  await mkdir(stubDir);
  await stub(stubDir, "python3", "exit 0");
  const synced = path.join(sandbox.root, "synced-explorers.json");
  await writeFile(synced, explorersAfterSync, "utf8");
  const claudeBin = await stub(stubDir, "claude-stub", `cp "${synced}" "${EXPLORERS_REL}"`);

  const env = sandboxEnv(sandbox, undefined, {
    PATH: `${stubDir}${path.delimiter}${process.env.PATH}`,
    WEBSITE_DIR: sandbox.repo,
    CLAUDE_BIN: claudeBin,
    CONCEPTS_HEARTBEAT_PATH: path.join(sandbox.root, "heartbeat.json"),
    KNOWLEDGE_SYNC_PUSH: "0",
  });
  if (repoHeartbeat) delete env.CONCEPTS_HEARTBEAT_PATH;
  const head = git(sandbox.repo, "rev-parse", "HEAD");
  const run = () => runProcess("bash", [SYNC_SCRIPT, "--date", DATE], { cwd: sandbox.repo, env }).done;
  return { sandbox, head, run };
}

test("an explorer sync commits the reseeded concept assignments with the explorers", async (t) => {
  const { sandbox, run } = await syncSandbox(t, `${JSON.stringify(SYNCED_EXPLORERS)}\n`);
  const result = await run();
  assert.equal(result.status, 0, result.stdout + result.stderr);

  assert.equal(git(sandbox.repo, "log", "-1", "--format=%s"), `content(knowledge): explorer sync daily ${DATE}`);
  const committed = git(sandbox.repo, "show", "--name-only", "--format=", "HEAD").split("\n");
  assert.ok(committed.includes(EXPLORERS_REL), committed.join("\n"));
  assert.ok(committed.includes(CONCEPT_ASSIGNMENTS_REL), committed.join("\n"));
  assert.deepEqual(JSON.parse(git(sandbox.repo, "show", `HEAD:${CONCEPT_ASSIGNMENTS_REL}`)), {
    [`paper:${BIBCODE}`]: { concept: "evaluation", takeaway: "Measured." },
  });
  assert.equal(git(sandbox.repo, "status", "--porcelain", "--", CONCEPT_ASSIGNMENTS_REL), "");
});

test("a seeder failure fails the sync loudly and commits no explorer or assignment change", async (t) => {
  const { sandbox, head, run } = await syncSandbox(t, "not json\n", { repoHeartbeat: true });
  const result = await run();
  assert.equal(result.status, 1, result.stdout + result.stderr);

  assert.match(
    result.stdout,
    /\[knowledge-sync\] reseeding concept assignments failed, so explorer and concept-assignment changes were not committed/,
  );
  const changed = git(sandbox.repo, "diff", "--name-only", head, "HEAD").split("\n").filter(Boolean);
  assert.deepEqual(changed.filter((file) => file !== HEARTBEAT_REL), [], changed.join("\n"));
  assert.equal(git(sandbox.repo, "diff", "--cached", "--name-only"), "");
  assert.equal(await readFile(path.join(sandbox.repo, CONCEPT_ASSIGNMENTS_REL), "utf8"), "{}\n");
});
