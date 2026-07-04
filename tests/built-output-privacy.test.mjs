// Tests for scripts/checks/built-output-privacy.mjs — the post-build
// assertion that no candidate-derived string (note titles, takeaway drafts)
// appears in dist/ unless its edge id is in the applied manifest.
//
// Everything here is synthetic: fake dist directories, fixture candidate
// lists, and a temp pipeline home. No real vault, no real dist.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = path.join(REPO_ROOT, "scripts", "checks", "built-output-privacy.mjs");

const TITLE = "Synthetic Unmarked Beta Topic";
const APPLIED_TAKEAWAY = "A distinctive applied takeaway string for the fixture.";
const REJECTED_TAKEAWAY = "A distinctive rejected takeaway that must never ship.";
const VAULT_ID = "abc123def4567890";
const EDGE_ID = `vault:${VAULT_ID}~agent-memory`;

async function tempDir(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "privacy-check-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

// Build a synthetic scenario: fake dist + pull artifact files. Returns the
// exit code and output of the check run against them.
async function runCheck(t, { distFiles, withEdges = true, withManifest = false, candidates = true }) {
  const root = await tempDir(t);
  const distDir = path.join(root, "dist");
  await mkdir(distDir, { recursive: true });
  for (const [rel, content] of Object.entries(distFiles)) {
    await mkdir(path.join(distDir, path.dirname(rel)), { recursive: true });
    await writeFile(path.join(distDir, rel), content);
  }

  const args = ["--dist", distDir];
  if (candidates) {
    const candidatesPath = path.join(root, "pull-candidates.json");
    await writeFile(
      candidatesPath,
      JSON.stringify({ candidates: [{ id: VAULT_ID, relPath: "notes/x.md", title: TITLE, body: "Body." }] }),
    );
    args.push("--candidates", candidatesPath);
  } else {
    args.push("--candidates", path.join(root, "missing-candidates.json"));
  }
  if (withEdges) {
    const edgesPath = path.join(root, "pull-edges.json");
    await writeFile(
      edgesPath,
      JSON.stringify({
        edges: [{ edgeId: EDGE_ID, vaultId: VAULT_ID, concept: "agent-memory", takeaway: APPLIED_TAKEAWAY }],
      }),
    );
    args.push("--edges", edgesPath);
    const rejectedPath = path.join(root, "pull-rejected.json");
    await writeFile(
      rejectedPath,
      JSON.stringify({
        rejected: [
          {
            edgeId: `vault:${VAULT_ID}~evaluation`,
            vaultId: VAULT_ID,
            concept: "evaluation",
            takeaway: REJECTED_TAKEAWAY,
            reason: "fixture",
          },
        ],
      }),
    );
    args.push("--rejected", rejectedPath);
  } else {
    args.push("--edges", path.join(root, "missing-edges.json"));
    args.push("--rejected", path.join(root, "missing-rejected.json"));
  }
  const manifestPath = path.join(root, "pull-applied-manifest.json");
  if (withManifest) {
    await writeFile(manifestPath, JSON.stringify({ appliedEdgeIds: [EDGE_ID] }));
  }
  args.push("--manifest", manifestPath);

  try {
    const { stdout, stderr } = await execFileP(process.execPath, [CHECK, ...args], {
      cwd: REPO_ROOT,
      env: { ...process.env, CONCEPTS_PIPELINE_HOME: path.join(root, "pipeline-home") },
    });
    return { code: 0, stdout, stderr };
  } catch (err) {
    if (typeof err.code !== "number") throw err;
    return { code: err.code, stdout: err.stdout, stderr: err.stderr };
  }
}

test("a marker-less candidate title seeded into a fake dist page fails the assertion", async (t) => {
  const result = await runCheck(t, {
    distFiles: { "writing/index.html": `<html><body><h1>${TITLE}</h1></body></html>` },
    withEdges: false,
  });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /VIOLATION/);
  assert.match(result.stderr, /note title/);
});

test("candidate strings in llms-full.txt are caught when the file is present", async (t) => {
  const result = await runCheck(t, {
    distFiles: {
      "index.html": "<html><body>clean</body></html>",
      "llms-full.txt": `# Site dump\n${TITLE}\n`,
    },
    withEdges: false,
  });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /llms-full\.txt/);
});

test("a clean dist passes", async (t) => {
  const result = await runCheck(t, {
    distFiles: { "index.html": "<html><body>Nothing vault-derived here.</body></html>" },
  });
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /OK/);
});

test("an applied takeaway may appear once its edge id is in the manifest", async (t) => {
  const page = `<html><body><p>${APPLIED_TAKEAWAY}</p></body></html>`;
  const without = await runCheck(t, { distFiles: { "index.html": page } });
  assert.equal(without.code, 1, "unapplied draft in dist must fail");

  const withManifest = await runCheck(t, { distFiles: { "index.html": page }, withManifest: true });
  assert.equal(withManifest.code, 0, withManifest.stderr);
});

test("a rejected takeaway draft in dist fails even with a manifest", async (t) => {
  const result = await runCheck(t, {
    distFiles: { "index.html": `<html><body>${REJECTED_TAKEAWAY}</body></html>` },
    withManifest: true,
  });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /REJECTED takeaway draft/);
});

test("missing candidates file is a clean pass (dark-ship state)", async (t) => {
  const result = await runCheck(t, {
    distFiles: { "index.html": `<html><body>${TITLE}</body></html>` },
    candidates: false,
    withEdges: false,
  });
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /nothing pulled/);
});
