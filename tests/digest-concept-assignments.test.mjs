import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

import {
  CONCEPT_ASSIGNMENTS_REL,
  EXPLORERS_REL,
  git,
  makeDigestSandbox,
  runNode,
  sandboxEnv,
} from "./helpers/digest-sandbox.mjs";

const SLUG = "daily-2026-07-04";

async function publishIssue(sandbox, topics) {
  const specPath = path.join(sandbox.root, "spec.json");
  await writeFile(
    specPath,
    JSON.stringify({
      title: "Concept assignment test issue",
      cadence: "daily",
      date: "2026-07-04",
      summary: "Concept assignment test.",
      topics,
      body: "Body.",
    }),
  );
  return runNode("scripts/digest/publish-digest.mjs", ["--spec", specPath], {
    cwd: sandbox.repo,
    env: sandboxEnv(sandbox),
  }).done;
}

const staged = (repo) => git(repo, "diff", "--cached", "--name-only").split("\n").filter(Boolean);

test("publishing an issue with a concept topic stages the reseeded concept assignments", async (t) => {
  const sandbox = await makeDigestSandbox(t, { prefix: "digest-assignments-" });
  const result = await publishIssue(sandbox, ["zzz-not-a-concept", "evals"]);
  assert.equal(result.status, 0, result.stderr);

  const assignments = JSON.parse(await readFile(path.join(sandbox.repo, CONCEPT_ASSIGNMENTS_REL), "utf8"));
  assert.deepEqual(assignments, { [`digest:${SLUG}`]: { concept: "evaluation" } });
  assert.ok(staged(sandbox.repo).includes(CONCEPT_ASSIGNMENTS_REL), staged(sandbox.repo).join("\n"));
  assert.equal(git(sandbox.repo, "diff", "--name-only", "--", CONCEPT_ASSIGNMENTS_REL), "");
});

test("a seeder failure fails the publish loudly and stages nothing", async (t) => {
  const sandbox = await makeDigestSandbox(t, { prefix: "digest-assignments-" });
  await writeFile(path.join(sandbox.repo, EXPLORERS_REL), "not json\n");
  const result = await publishIssue(sandbox, ["evals"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /\[publish-digest\] reseeding concept assignments failed/);
  assert.deepEqual(staged(sandbox.repo), []);
  assert.equal(await readFile(path.join(sandbox.repo, CONCEPT_ASSIGNMENTS_REL), "utf8"), "{}\n");
});
