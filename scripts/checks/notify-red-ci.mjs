#!/usr/bin/env node
// R19a red-CI / pipeline-failure notification — turns a silent red streak into
// a loud morning message.
//
// Called automatically by scripts/digest/run.sh (ERR trap on any local gate
// failure, and the deploy-staleness refusal path). For a red REMOTE run —
// GitHub CI red on a `content(digest):` commit silently blocks Render deploys
// under autoDeployTrigger: checksPass — run it manually with the run context:
//
//   gh run list --limit 5     # find the red run on main
//   node scripts/checks/notify-red-ci.mjs \
//     --context "red remote CI on digest commit <sha> — deploys blocked; run: <gh run id>"
//
// Usage:
//   node scripts/checks/notify-red-ci.mjs --context "<what failed>" [--title "<t>"] [--dry-run]
//
// Channel selection (best available local channel):
//   1. env NOTIFY_CMD set — run it via `sh -c "$NOTIFY_CMD"` with the message
//      in env NOTIFY_TITLE / NOTIFY_MESSAGE and on stdin. Example:
//        NOTIFY_CMD='ntfy publish --title "$NOTIFY_TITLE" digest-alarms "$NOTIFY_MESSAGE"'
//   2. otherwise — write a LOUD marker file under <pipeline-home>/alerts/
//      (CONCEPTS_PIPELINE_HOME, default ~/.concepts-pipeline) and print a
//      banner on stderr.
//   If NOTIFY_CMD fails, the marker fallback is STILL written (the alarm is
//   never dropped) and the exit code is nonzero so the broken channel shows.
//
// --dry-run prints what it would do on the selected channel, sends nothing,
// writes nothing.
//
// Exit codes: 0 delivered; 1 NOTIFY_CMD failed (marker fallback written);
//             2 usage error.

import { spawn } from "node:child_process";
import path from "node:path";
import { parseArgs } from "node:util";
import { markerFilename, resolveAlertsDir, writeAlertMarker } from "./lib/alerts.mjs";

const DEFAULT_TITLE = "[sjarmak.ai] digest pipeline RED";
const MARKER_KIND = "red-ci";

function banner(lines) {
  const bar = "!".repeat(72);
  console.error(bar);
  for (const line of lines) console.error(`[notify-red-ci] ${line}`);
  console.error(bar);
}

// Run NOTIFY_CMD via sh -c with the message in env and on stdin. ALWAYS
// resolves — to the exit code, or nonzero on spawn failure. It must never
// throw: any escape here would crash the process before main()'s marker
// fallback runs, silently dropping the alarm.
function runNotifyCmd(cmd, { title, message }) {
  return new Promise((resolve) => {
    const child = spawn("sh", ["-c", cmd], {
      env: { ...process.env, NOTIFY_TITLE: title, NOTIFY_MESSAGE: message },
      stdio: ["pipe", "inherit", "inherit"],
    });
    child.on("error", (err) => {
      console.error(`[notify-red-ci] NOTIFY_CMD spawn failed: ${err.message}`);
      resolve(1);
    });
    child.on("close", (code) => resolve(code ?? 1));
    // A notifier that exits without reading stdin — the NORMAL shape of a
    // fast-failing broken command (wrong path, permission denied, `exit 1`) —
    // EPIPEs this stream. Without a listener that is an uncaught exception
    // that kills the process before the marker fallback; with one, delivery
    // failure is reported via the exit code alone. Only broken-pipe-class
    // write errors are expected; anything else is still logged (and still
    // must not crash — `close` resolves the promise either way).
    child.stdin.on("error", (err) => {
      if (!["EPIPE", "ERR_STREAM_DESTROYED", "ECONNRESET"].includes(err.code)) {
        console.error(`[notify-red-ci] NOTIFY_CMD stdin error: ${err.message}`);
      }
    });
    child.stdin.write(`${message}\n`);
    child.stdin.end();
  });
}

async function main() {
  const { values } = parseArgs({
    options: {
      context: { type: "string" },
      title: { type: "string", default: DEFAULT_TITLE },
      "dry-run": { type: "boolean", default: false },
    },
  });
  if (!values.context?.trim()) {
    console.error(
      "usage: notify-red-ci.mjs --context \"<what failed>\" [--title <t>] [--dry-run]",
    );
    process.exit(2);
  }
  const title = values.title;
  const message = values.context.trim();
  const notifyCmd = process.env.NOTIFY_CMD?.trim();

  if (values["dry-run"]) {
    if (notifyCmd) {
      console.log(
        `[notify-red-ci] dry-run: would run NOTIFY_CMD via sh -c: ${notifyCmd} ` +
          `(NOTIFY_TITLE=${JSON.stringify(title)}, NOTIFY_MESSAGE + stdin=${JSON.stringify(message)})`,
      );
    } else {
      const wouldWrite = path.join(resolveAlertsDir(), markerFilename(MARKER_KIND));
      console.log(
        `[notify-red-ci] dry-run: NOTIFY_CMD unset — would write marker ${wouldWrite} ` +
          `containing: ${JSON.stringify(`${title}\n${message}`)}`,
      );
    }
    return;
  }

  if (notifyCmd) {
    const code = await runNotifyCmd(notifyCmd, { title, message });
    if (code === 0) {
      console.log(`[notify-red-ci] notified via NOTIFY_CMD: ${title}`);
      return;
    }
    // The configured channel is broken — never drop the alarm: fall through to
    // the marker, then exit nonzero so the broken channel itself is visible.
    const marker = await writeAlertMarker(
      MARKER_KIND,
      `${title}\n${message}\n(NOTIFY_CMD exited ${code} — fix the notify channel)`,
    );
    banner([
      `NOTIFY_CMD exited ${code} — notification channel is BROKEN`,
      `alarm preserved as marker: ${marker}`,
      message,
    ]);
    process.exit(1);
  }

  const marker = await writeAlertMarker(MARKER_KIND, `${title}\n${message}`);
  banner([`RED: ${title}`, message, `marker: ${marker}`]);
}

main().catch((err) => {
  console.error(`[notify-red-ci] FAILED: ${err.message}`);
  process.exit(1);
});
