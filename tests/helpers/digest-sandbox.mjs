import { spawn, spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const TEST_ACCOUNT_ID = "0123456789abcdef0123456789abcdef";
const HEARTBEAT_REL = path.join("src", "data", "knowledge", "concept-sync-status.json");

export function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed in ${cwd}: ${result.stderr}`);
  return result.stdout.trim();
}

function gitIdentity(cwd) {
  git(cwd, "config", "user.email", "sandbox@example.invalid");
  git(cwd, "config", "user.name", "Digest Sandbox");
  git(cwd, "config", "commit.gpgsign", "false");
}

export async function makeDigestSandbox(t, { prefix = "digest-sandbox-", withScripts = false } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), prefix));
  t.after(() => rm(root, { recursive: true, force: true }));
  const repo = path.join(root, "repo");
  const home = path.join(root, "pipeline-home");
  const spool = path.join(root, "spool");
  await mkdir(path.join(repo, "src", "content", "digest"), { recursive: true });
  await mkdir(path.join(repo, "src", "data", "knowledge"), { recursive: true });
  await mkdir(home, { recursive: true });
  await cp(path.join(REPO_ROOT, "src", "content", "concepts"), path.join(repo, "src", "content", "concepts"), {
    recursive: true,
  });
  await cp(path.join(REPO_ROOT, HEARTBEAT_REL), path.join(repo, HEARTBEAT_REL));
  await writeFile(
    path.join(repo, ".gitignore"),
    ".digest-runs/\n/public/media/\n/scripts\n/node_modules\n/src/lib\n",
    "utf8",
  );
  if (withScripts) {
    await cp(path.join(REPO_ROOT, "scripts"), path.join(repo, "scripts"), { recursive: true });
    await symlink(path.join(REPO_ROOT, "node_modules"), path.join(repo, "node_modules"));
    await symlink(path.join(REPO_ROOT, "src", "lib"), path.join(repo, "src", "lib"));
  }
  git(repo, "init", "-q", "-b", "main");
  gitIdentity(repo);
  git(repo, "add", "-A");
  git(repo, "commit", "-q", "-m", "sandbox baseline");
  return { root, repo, home, spool };
}

export function sandboxEnv(sandbox, fake, extra = {}) {
  const env = { ...process.env };
  for (const name of Object.keys(env)) {
    if (/^(AWS_|R2_|MEDIA_|DIGEST_|WEBSITE_)/.test(name)) delete env[name];
  }
  return {
    ...env,
    CONCEPTS_PIPELINE_HOME: sandbox.home,
    DIGEST_CRON: "1",
    DIGEST_SPOOL: sandbox.spool,
    MEDIA_BACKEND: "r2",
    MEDIA_VERIFY_TIMEOUT_SEC: "5",
    ...(fake
      ? {
          MEDIA_PUBLIC_BASE: fake.publicBase,
          R2_ACCOUNT_ID: TEST_ACCOUNT_ID,
          R2_ACCESS_KEY_ID: "test-access",
          R2_SECRET_ACCESS_KEY: "test-secret",
          R2_BUCKET: fake.bucket,
          R2_ENDPOINT_OVERRIDE: fake.endpoint,
        }
      : {}),
    ...extra,
  };
}

export function runProcess(command, args, { cwd, env }) {
  const child = spawn(command, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => (stdout += chunk));
  child.stderr.on("data", (chunk) => (stderr += chunk));
  const done = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (status, signal) => resolve({ status, signal, stdout, stderr }));
  });
  return { child, done };
}

export const runNode = (script, args, options) =>
  runProcess(process.execPath, [path.join(REPO_ROOT, script), ...args], options);
