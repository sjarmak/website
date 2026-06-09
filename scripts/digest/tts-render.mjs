#!/usr/bin/env node
// Render a podcast transcript to a single MP3 via OpenAI TTS.
//
// Usage:
//   node scripts/digest/tts-render.mjs --in transcript.txt --out daily-2026-06-10 \
//     [--voice alloy] [--model gpt-4o-mini-tts]
//
// Prints a JSON line to stdout: { "audioUrl": "/media/digests/<out>.mp3", "durationSec": <n> }
// so the publish step / generation agent can consume it directly.
//
// Requires OPENAI_API_KEY. Uses ffmpeg to concatenate chunks when available;
// falls back to (loudly warned) binary concatenation otherwise.

import { readFile, writeFile, mkdir, rm, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";

const MAX_CHARS = 4000; // OpenAI TTS hard cap is 4096 chars/request; leave headroom
const OUT_DIR = "public/media/digests";
const SPEECH_URL = "https://api.openai.com/v1/audio/speech";
const WORDS_PER_MIN = 150; // fallback duration estimate when ffprobe is absent

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

async function renderChunk({ input, voice, model, apiKey }) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(SPEECH_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, voice, input, response_format: "mp3" }),
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    const retryable = res.status === 429 || res.status >= 500;
    const detail = await res.text().catch(() => "");
    if (!retryable || attempt === maxAttempts) {
      throw new Error(`OpenAI TTS failed (${res.status}): ${detail.slice(0, 300)}`);
    }
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  throw new Error("unreachable");
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

async function concatChunks(partFiles, outFile, listPath) {
  if (hasBin("ffmpeg")) {
    const list = partFiles.map((f) => `file '${path.resolve(f)}'`).join("\n");
    await writeFile(listPath, list, "utf8");
    const r = spawnSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outFile], {
      stdio: "ignore",
    });
    if (r.status !== 0) throw new Error("ffmpeg concat failed");
    return;
  }
  console.warn(
    "[tts-render] WARNING: ffmpeg not found — falling back to binary MP3 concatenation. " +
      "This usually plays fine but can produce minor seam glitches and inaccurate seek/duration. " +
      "Install ffmpeg for clean output.",
  );
  const buffers = await Promise.all(partFiles.map((f) => readFile(f)));
  await writeFile(outFile, Buffer.concat(buffers));
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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const args = parseArgs(process.argv.slice(2));
  if (!args.in || !args.out) {
    throw new Error("usage: tts-render.mjs --in <transcript.txt> --out <basename> [--voice v] [--model m]");
  }
  const voice = args.voice ?? "alloy";
  const model = args.model ?? "gpt-4o-mini-tts";
  const base = path.basename(args.out, ".mp3");

  const raw = await readFile(args.in, "utf8");
  const speech = stripForSpeech(raw);
  const chunks = chunkText(speech);
  if (chunks.length === 0) throw new Error("transcript produced no speakable text");

  await mkdir(OUT_DIR, { recursive: true });
  const tmpDir = path.join(OUT_DIR, `.tmp-${base}`);
  await mkdir(tmpDir, { recursive: true });

  const partFiles = [];
  for (let i = 0; i < chunks.length; i++) {
    process.stderr.write(`[tts-render] chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)\n`);
    const mp3 = await renderChunk({ input: chunks[i], voice, model, apiKey });
    const part = path.join(tmpDir, `part-${String(i).padStart(3, "0")}.mp3`);
    await writeFile(part, mp3);
    partFiles.push(part);
  }

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
