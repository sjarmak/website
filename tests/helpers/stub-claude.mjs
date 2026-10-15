#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { appendFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const record = (event) => {
  if (process.env.STUB_LOG) {
    appendFileSync(process.env.STUB_LOG, `${JSON.stringify({ event, pid: process.pid, at: Date.now() })}\n`);
  }
};

function run(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
  if (result.status !== 0) throw new Error(`${script} exited ${result.status}`);
  return JSON.parse(result.stdout.trim().split("\n").at(-1));
}

function publishIssue(slug) {
  const work = mkdtempSync(path.join(os.tmpdir(), "stub-claude-"));
  try {
    const transcript = path.join(work, "transcript.txt");
    writeFileSync(transcript, "## SEGMENT: intro\n\nThis is the stub agent reading a short issue.\n");
    const rendered = run("scripts/digest/tts-render.mjs", ["--in", transcript, "--out", slug]);
    const spec = path.join(work, "spec.json");
    writeFileSync(
      spec,
      JSON.stringify({
        slug,
        title: `Stub issue ${slug}`,
        cadence: "daily",
        date: slug.slice(-10),
        summary: "An issue written by the stub agent.",
        topics: ["evals"],
        audioFile: rendered.file,
        durationSec: rendered.durationSec,
        body: "Stub body.",
      }),
    );
    const published = run("scripts/digest/publish-digest.mjs", ["--spec", spec]);
    console.log(`[stub-claude] published ${slug}: audio ${published.audio.status}`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

record("start");
await delay(Number(process.env.STUB_SLEEP_MS ?? 0));
if (process.env.STUB_SLUG) publishIssue(process.env.STUB_SLUG);
record("end");
