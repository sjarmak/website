import os from "node:os";
import path from "node:path";

export const R2_ENV_VARS = Object.freeze(["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"]);

const ACCOUNT_ID = /^[a-f0-9]{32}$/;
const BUCKET = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

export function mediaBackend(env = process.env) {
  const backend = env.MEDIA_BACKEND ?? "git";
  if (backend !== "git" && backend !== "r2") {
    throw new Error(`MEDIA_BACKEND must be "git" or "r2", got ${JSON.stringify(backend)}`);
  }
  return backend;
}

function endpointFor(accountId, override) {
  if (!override) return `https://${accountId}.r2.cloudflarestorage.com`;
  const url = new URL(override);
  if (url.protocol !== "http:" || !LOOPBACK_HOSTS.has(url.hostname)) {
    throw new Error("R2_ENDPOINT_OVERRIDE is only accepted for a loopback http test server");
  }
  return url.origin;
}

export function r2ConfigFromEnv(env = process.env) {
  const missing = R2_ENV_VARS.filter((name) => !env[name]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `R2 credentials missing: ${missing.join(", ")}. MEDIA_BACKEND=r2 reads only these variables; ` +
        "fill ~/.config/sjarmak-media/r2.env",
    );
  }
  const accountId = env.R2_ACCOUNT_ID.trim();
  const bucket = env.R2_BUCKET.trim();
  if (!ACCOUNT_ID.test(accountId)) throw new Error("R2_ACCOUNT_ID must be the 32-character hex Cloudflare account id");
  if (!BUCKET.test(bucket)) throw new Error(`R2_BUCKET is not a valid bucket name: ${JSON.stringify(bucket)}`);
  return Object.freeze({
    accountId,
    bucket,
    accessKeyId: env.R2_ACCESS_KEY_ID.trim(),
    secretAccessKey: env.R2_SECRET_ACCESS_KEY.trim(),
    endpoint: endpointFor(accountId, env.R2_ENDPOINT_OVERRIDE),
  });
}

export function scrubAwsEnvironment(env = process.env) {
  const removed = Object.keys(env).filter((name) => name.startsWith("AWS_"));
  for (const name of removed) delete env[name];
  env.AWS_CONFIG_FILE = "/dev/null";
  env.AWS_SHARED_CREDENTIALS_FILE = "/dev/null";
  return removed;
}

export function publicBase(env = process.env) {
  const raw = env.MEDIA_PUBLIC_BASE ?? "https://www.sjarmak.ai/media";
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`MEDIA_PUBLIC_BASE is not a URL: ${JSON.stringify(raw)}`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`MEDIA_PUBLIC_BASE must be http(s): ${JSON.stringify(raw)}`);
  }
  return raw.replace(/\/+$/, "");
}

export function verifyTimeoutMs(env = process.env) {
  const raw = env.MEDIA_VERIFY_TIMEOUT_SEC ?? "300";
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(`MEDIA_VERIFY_TIMEOUT_SEC must be a positive number of seconds, got ${JSON.stringify(raw)}`);
  }
  return Math.round(seconds * 1000);
}

export function spoolRoot(env = process.env) {
  const configured = env.DIGEST_SPOOL ?? path.join(env.HOME ?? os.homedir(), ".local", "share", "sjarmak-media", "spool");
  if (!path.isAbsolute(configured)) throw new Error("DIGEST_SPOOL must be an absolute path");
  return path.resolve(configured);
}
