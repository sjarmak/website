#!/usr/bin/env node
// Render a podcast transcript to a single MP3 via local Kokoro TTS (offline).
//
// Usage:
//   node scripts/digest/tts-render.mjs --in transcript.txt --out daily-2026-06-10 \
//     [--voice af_heart] [--speed 0.85]
//
// Prints a JSON line to stdout: { "audioUrl": "/media/digests/<out>.mp3", "durationSec": <n> }
// so the publish step / generation agent can consume it directly.
//
// Requires the Kokoro venv (scripts/digest/setup-kokoro.sh; override location with
// $KOKORO_VENV) and ffmpeg for WAV→MP3 concat+encode. No API key, no network —
// the model runs locally (first-ever render downloads weights into the HF cache).

import { readFile, writeFile, mkdir, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import os from "node:os";
import path from "node:path";

const MAX_CHARS = 4000; // per-chunk cap keeps Kokoro inputs and memory bounded
const OUT_DIR = "public/media/digests";
const RENDERER = path.join(path.dirname(new URL(import.meta.url).pathname), "kokoro-render.py");
const WORDS_PER_MIN = 150; // fallback duration estimate when ffprobe is absent (~af_heart at speed 0.85)

/** Strip markdown so the TTS reads clean spoken prose. Pure. */
export function stripForSpeech(md) {
  return md
    .replace(/^---\n[\s\S]*?\n---\n/, "") // drop leading frontmatter if present
    .replace(/^\s*#{0,6}\s*SEGMENT:.*$/gim, "") // drop "## SEGMENT:" director notes
    .replace(/^#{1,6}\s+/gm, "") // header markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links -> visible text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitSentences(para, maxChars) {
  const sentences = para.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [para];
  const out = [];
  let cur = "";
  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) continue;
    if (s.length > maxChars) {
      if (cur) {
        out.push(cur);
        cur = "";
      }
      for (let i = 0; i < s.length; i += maxChars) out.push(s.slice(i, i + maxChars));
      continue;
    }
    if (cur && cur.length + 1 + s.length > maxChars) {
      out.push(cur);
      cur = "";
    }
    cur = cur ? `${cur} ${s}` : s;
  }
  if (cur) out.push(cur);
  return out;
}

/** Split text into <=maxChars chunks on paragraph then sentence boundaries. Pure. */
export function chunkText(text, maxChars = MAX_CHARS) {
  const paras = text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  const chunks = [];
  let cur = "";
  const flush = () => {
    if (cur.trim()) chunks.push(cur.trim());
    cur = "";
  };
  for (const para of paras) {
    const units = para.length <= maxChars ? [para] : splitSentences(para, maxChars);
    for (const u of units) {
      if (cur && cur.length + 2 + u.length > maxChars) flush();
      cur = cur ? `${cur}\n\n${u}` : u;
    }
  }
  flush();
  return chunks;
}

function hasBin(name) {
  return spawnSync(name, ["-version"], { stdio: "ignore" }).status === 0;
}

function kokoroPython() {
  const venv = process.env.KOKORO_VENV ?? path.join(os.homedir(), ".venvs", "kokoro-tts");
  const python = path.join(venv, "bin", "python");
  if (!existsSync(python)) {
    throw new Error(
      `Kokoro venv not found at ${venv} — run scripts/digest/setup-kokoro.sh (or set $KOKORO_VENV)`,
    );
  }
  return python;
}

/** Render all chunks to part-NNN.wav in tmpDir via one kokoro-render.py process. */
async function renderChunks({ chunks, tmpDir, voice, speed }) {
  for (let i = 0; i < chunks.length; i++) {
    await writeFile(path.join(tmpDir, `chunk-${String(i).padStart(3, "0")}.txt`), chunks[i], "utf8");
  }
  process.stderr.write(`[tts-render] rendering ${chunks.length} chunks via local Kokoro (${voice}, speed ${speed})\n`);
  const r = spawnSync(
    kokoroPython(),
    [RENDERER, "--chunks-dir", tmpDir, "--voice", voice, "--speed", String(speed)],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  if (r.status !== 0) throw new Error(`kokoro-render.py failed (exit ${r.status})`);
  return Array.from({ length: chunks.length }, (_, i) =>
    path.join(tmpDir, `part-${String(i).padStart(3, "0")}.wav`),
  );
}

function ffprobeDuration(file) {
  const r = spawnSync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    file,
  ]);
  if (r.status !== 0) return null;
  const sec = Number.parseFloat(String(r.stdout).trim());
  return Number.isFinite(sec) ? Math.round(sec) : null;
}

/** Concatenate WAV parts and encode to MP3 (24 kHz mono, 160k). ffmpeg required. */
async function concatChunks(partFiles, outFile, listPath) {
  if (!hasBin("ffmpeg")) {
    throw new Error("ffmpeg is required to encode WAV parts to MP3 — sudo apt install ffmpeg");
  }
  const list = partFiles.map((f) => `file '${path.resolve(f)}'`).join("\n");
  await writeFile(listPath, list, "utf8");
  const r = spawnSync(
    "ffmpeg",
    ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-ar", "24000", "-ac", "1", "-b:a", "160k", outFile],
    { stdio: "ignore" },
  );
  if (r.status !== 0) throw new Error("ffmpeg concat/encode failed");
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, "");
    if (key) args[key] = argv[i + 1];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.in || !args.out) {
    throw new Error("usage: tts-render.mjs --in <transcript.txt> --out <basename> [--voice v] [--speed s]");
  }
  const voice = args.voice ?? "af_heart";
  const speed = Number.parseFloat(args.speed ?? "0.85");
  if (!Number.isFinite(speed) || speed <= 0) throw new Error(`invalid --speed: ${args.speed}`);
  const base = path.basename(args.out, ".mp3");

  const raw = await readFile(args.in, "utf8");
  const speech = stripForSpeech(raw);
  const chunks = chunkText(speech);
  if (chunks.length === 0) throw new Error("transcript produced no speakable text");

  await mkdir(OUT_DIR, { recursive: true });
  const tmpDir = path.join(OUT_DIR, `.tmp-${base}`);
  await mkdir(tmpDir, { recursive: true });

  const partFiles = await renderChunks({ chunks, tmpDir, voice, speed });

  const outFile = path.join(OUT_DIR, `${base}.mp3`);
  await concatChunks(partFiles, outFile, path.join(tmpDir, "concat.txt"));
  await rm(tmpDir, { recursive: true, force: true });

  const wordCount = speech.split(/\s+/).filter(Boolean).length;
  const durationSec = ffprobeDuration(outFile) ?? Math.round((wordCount / WORDS_PER_MIN) * 60);
  await stat(outFile); // assert it exists

  process.stdout.write(`${JSON.stringify({ audioUrl: `/media/digests/${base}.mp3`, durationSec })}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`[tts-render] ${err.message}`);
    process.exit(1);
  });
}
