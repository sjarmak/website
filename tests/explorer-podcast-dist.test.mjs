// Assertions over the BUILT pages for the podcast/explorer split.
//
// A companion series lives on the explorer page it was recorded from, not in
// the digest's audio list. Three things can break that silently:
//
//   1. A typo in a learning entry's `explorer:` id drops the episode from the
//      explorer page AND from /digest, so it disappears from the site with a
//      green build.
//   2. An episode gains an `explorer:` id but the explorer page stops
//      rendering audio (or transcripts), so the move loses the player.
//   3. /digest starts listing companion episodes again, putting the same
//      audio in two places.
//
// Expected values are read from the learning collection the pages render.

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(REPO_ROOT, "dist");
const LEARNING = path.join(REPO_ROOT, "src", "content", "learning");
const DATA = path.join(REPO_ROOT, "src", "data", "knowledge");

// Enough of a frontmatter reader for the flat scalar fields these entries use.
function frontmatter(file) {
  const text = readFileSync(file, "utf8");
  const block = text.split(/^---$/m)[1] ?? "";
  const fields = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (!m) continue;
    fields[m[1]] = m[2].trim().replace(/^["'](.*)["']$/, "$1");
  }
  return fields;
}

function podcastEntries() {
  return readdirSync(LEARNING)
    .filter((f) => f.endsWith(".md"))
    .map((f) => frontmatter(path.join(LEARNING, f)))
    .filter((e) => e.kind === "podcast");
}

function explorerIds() {
  const combined = readJson(path.join(DATA, "explorers.json")).explorers.map((e) => e.id);
  return new Set([...combined, readJson(path.join(DATA, "explorers", "thirty-papers.json")).id]);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function page(...parts) {
  return readFileSync(path.join(DIST, ...parts, "index.html"), "utf8");
}

before(async () => {
  if (!existsSync(path.join(DIST, "index.html"))) {
    await execFileP("npm", ["run", "build"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 });
  }
});

test("every companion episode names an explorer that exists", () => {
  const ids = explorerIds();
  const companions = podcastEntries().filter((e) => e.explorer);
  assert.ok(companions.length > 0, "expected at least one companion episode");

  for (const e of companions) {
    assert.ok(ids.has(e.explorer), `${e.title}: unknown explorer id "${e.explorer}"`);
  }
});

test("each explorer renders its companion episodes with audio and transcript", () => {
  const byExplorer = new Map();
  for (const e of podcastEntries().filter((e) => e.explorer)) {
    byExplorer.set(e.explorer, [...(byExplorer.get(e.explorer) ?? []), e]);
  }

  for (const [id, episodes] of byExplorer) {
    const html = page("library", "explorers", id);
    const titles = [...html.matchAll(/<span class="pod-ep__title"[^>]*>([\s\S]*?)<\/span>/g)];
    assert.equal(titles.length, episodes.length, `${id}: rendered episode count`);

    for (const e of episodes) {
      assert.ok(
        html.includes(`<source src="${e.audioUrl}"`),
        `${id}: no player for ${e.title}`,
      );
    }
    // Transcripts join by audioUrl; every one of these episodes has one.
    const chips = html.match(/class="transcript/g) ?? [];
    assert.equal(chips.length > 0, true, `${id}: no transcript rendered`);
  }
});

test("/digest lists the non-companion audio only", () => {
  const html = page("digest");
  const entries = podcastEntries();

  for (const e of entries.filter((e) => e.explorer)) {
    assert.ok(
      !html.includes(`<source src="${e.audioUrl}"`),
      `digest still lists companion episode ${e.title}`,
    );
  }

  const standalone = entries.filter((e) => !e.explorer);
  assert.ok(standalone.length > 0, "expected some audio to stay on /digest");
  for (const e of standalone) {
    if (!e.audioUrl) continue;
    assert.ok(
      html.includes(`<source src="${e.audioUrl}"`),
      `digest dropped non-companion episode ${e.title}`,
    );
  }
});
