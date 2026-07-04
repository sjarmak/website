// Loud local alarm markers for the digest pipeline (PRD R19a).
//
// When no push-notification channel is configured (env NOTIFY_CMD), red-CI
// and deploy-staleness alarms fall back to a marker file under
// <pipeline-home>/alerts/. The pipeline home lives OUTSIDE the repo
// (scripts/concepts/lib/pipeline-home.mjs rejects in-repo paths), so a marker
// can never be swept into a commit by `git add -A`.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolvePipelineHome } from "../../concepts/lib/pipeline-home.mjs";

export const ALERTS_SUBDIR = "alerts";

// Resolve <pipeline-home>/alerts without touching the filesystem.
export function resolveAlertsDir(env = process.env) {
  return path.join(resolvePipelineHome(env), ALERTS_SUBDIR);
}

// Collision-proof marker filename: <kind>-20260704-031500-123.txt
export function markerFilename(kind, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
  const ms = String(now.getUTCMilliseconds()).padStart(3, "0");
  return `${kind}-${stamp}-${ms}.txt`;
}

// Write a marker and return its path. Creates the alerts dir on first use
// (logged by the caller's banner — the marker itself IS the loud artifact).
export async function writeAlertMarker(kind, body, { env = process.env, now = new Date() } = {}) {
  const dir = resolveAlertsDir(env);
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, markerFilename(kind, now));
  await writeFile(file, body.endsWith("\n") ? body : `${body}\n`, "utf8");
  return file;
}
