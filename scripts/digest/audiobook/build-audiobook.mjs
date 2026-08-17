#!/usr/bin/env node
// Render the full "Engineering Reliable Coding Agents" audiobook: one Kokoro
// TTS episode per narrative chapter (introduction, chapters 1-19, closing;
// glossary is reference material and is skipped), published as a `learning`
// podcast series. Resumable — re-running skips episodes whose MP3 already
// exists in the media worktree.
//
// Requires WEBSITE_MEDIA_ROOT pointed at the website-media worktree's
// public/media directory (see scripts/digest/run.sh for the convention).

import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const CHAPTERS_DIR = path.join(
  REPO_ROOT,
  "src/content/book-chapters/engineering-reliable-coding-agents",
);
// NOTE: intentionally NOT under repo-root transcripts/ — that path is a real
// Astro content collection (schema: title + audioUrl required) for published
// accessible transcripts, and these are just TTS-prep working files.
const TRANSCRIPTS_DIR =
  process.env.AUDIOBOOK_TRANSCRIPTS_DIR ??
  path.join(REPO_ROOT, ".audiobook-transcripts/engineering-reliable-coding-agents");
const LEARNING_DIR = path.join(REPO_ROOT, "src/content/learning");
const PREPARE = path.join(__dirname, "prepare-transcript.mjs");
const TTS_RENDER = path.join(REPO_ROOT, "scripts/digest/tts-render.mjs");

const SERIES = "Engineering Reliable Coding Agents (Audiobook)";
const BOOK_ID = "engineering-reliable-coding-agents";
const SITE_ORIGIN = "https://www.sjarmak.ai";
const VOICE = "am_onyx";
const SPEED = "0.85";

function mediaRoot() {
  const root = process.env.WEBSITE_MEDIA_ROOT;
  if (!root) throw new Error("WEBSITE_MEDIA_ROOT must be set (see scripts/digest/run.sh)");
  return root;
}

function readFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  const fm = {};
  if (!m) return fm;
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^"|"$/g, "");
  }
  return fm;
}

function chapterClaim(md) {
  const m = md.match(/\*\*Chapter claim\.\*\*\s*(.+)/);
  return m ? m[1].trim() : null;
}

async function loadChapterOrder() {
  const fs = await import("node:fs/promises");
  const files = (await fs.readdir(CHAPTERS_DIR)).filter((f) => f.endsWith(".md"));
  const entries = [];
  for (const file of files) {
    const full = path.join(CHAPTERS_DIR, file);
    const md = await readFile(full, "utf8");
    const fm = readFrontmatter(md);
    if (fm.kind === "glossary") continue;
    entries.push({
      file: full,
      slug: file.replace(/\.md$/, ""),
      order: Number(fm.order),
      number: fm.number ? Number(fm.number) : null,
      kind: fm.kind,
      title: fm.title,
      claim: chapterClaim(md),
    });
  }
  entries.sort((a, b) => a.order - b.order);
  return entries;
}

function spokenTitle(entry) {
  if (entry.kind === "introduction") return "Preface";
  if (entry.kind === "closing") return entry.title;
  return `Chapter ${entry.number}: ${entry.title}`;
}

function episodeSlug(episodeNum, entry) {
  return `audiobook-erca-ep${String(episodeNum).padStart(2, "0")}-${entry.slug}`;
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed (exit ${r.status})`);
}

function ffprobeSeconds(file) {
  const r = spawnSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file,
  ]);
  return r.status === 0 ? Math.round(Number.parseFloat(String(r.stdout).trim())) : null;
}

async function writeLearningEntry({ episodeNum, entry, audioUrl, description, date }) {
  const slug = episodeSlug(episodeNum, entry);
  const fm = [
    "---",
    `title: "${spokenTitle(entry).replace(/"/g, '\\"')}"`,
    "kind: podcast",
    `series: "${SERIES}"`,
    `episode: ${episodeNum}`,
    `description: "${description.replace(/"/g, '\\"')}"`,
    `audioUrl: ${audioUrl}`,
    `url: ${SITE_ORIGIN}/books/${BOOK_ID}/${entry.slug}`,
    `date: ${date}`,
    `order: ${episodeNum}`,
    "---",
    "",
  ].join("\n");
  await writeFile(path.join(LEARNING_DIR, `${slug}.md`), fm, "utf8");
}

async function main() {
  const root = mediaRoot();
  const podcastsDir = path.join(root, "podcasts");
  const digestsDir = path.join(root, "digests");
  await mkdir(podcastsDir, { recursive: true });
  await mkdir(TRANSCRIPTS_DIR, { recursive: true });

  const entries = await loadChapterOrder();
  const date = new Date().toISOString().slice(0, 10);
  const summary = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const episodeNum = i + 1;
    const slug = episodeSlug(episodeNum, entry);
    const mp3Final = path.join(podcastsDir, `${slug}.mp3`);

    if (existsSync(mp3Final)) {
      const secs = ffprobeSeconds(mp3Final);
      summary.push({ episodeNum, title: spokenTitle(entry), status: "skipped-existing", seconds: secs });
      console.log(`[${episodeNum}/${entries.length}] ${slug} — already rendered, skipping`);
      continue;
    }

    console.log(`[${episodeNum}/${entries.length}] ${slug} — preparing transcript`);
    const transcriptPath = path.join(TRANSCRIPTS_DIR, `${slug}.md`);
    run("node", [PREPARE, "--in", entry.file, "--out", transcriptPath, "--spoken-title", spokenTitle(entry)]);

    console.log(`[${episodeNum}/${entries.length}] ${slug} — rendering TTS (this takes a few minutes)`);
    run("node", [TTS_RENDER, "--in", transcriptPath, "--out", slug, "--voice", VOICE, "--speed", SPEED], {
      env: { ...process.env, WEBSITE_MEDIA_ROOT: root },
    });

    const mp3InDigests = path.join(digestsDir, `${slug}.mp3`);
    await rename(mp3InDigests, mp3Final);
    const secs = ffprobeSeconds(mp3Final);

    const description =
      entry.claim ?? `Chapter ${entry.number ?? ""} of Engineering Reliable Coding Agents.`.trim();
    await writeLearningEntry({
      episodeNum,
      entry,
      audioUrl: `/media/podcasts/${slug}.mp3`,
      description,
      date,
    });

    summary.push({ episodeNum, title: spokenTitle(entry), status: "rendered", seconds: secs });
    console.log(`[${episodeNum}/${entries.length}] ${slug} — done (${secs}s)`);
  }

  console.log("\n=== audiobook build summary ===");
  for (const s of summary) {
    console.log(`ep${String(s.episodeNum).padStart(2, "0")}  ${s.status.padEnd(16)}  ${s.seconds ?? "?"}s  ${s.title}`);
  }
  const totalSec = summary.reduce((a, s) => a + (s.seconds ?? 0), 0);
  console.log(`total: ${entries.length} episodes, ${Math.round(totalSec / 60)} min audio`);
}

main().catch((err) => {
  console.error(`[build-audiobook] ${err.message}`);
  process.exit(1);
});
