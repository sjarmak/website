#!/usr/bin/env node
// Publish a digest issue into the website's `digest` content collection.
//
// Shared by BOTH producers:
//   - the local-cron generation agent (auto), and
//   - manual curation exported from code-intelligence-digest (manual).
// Both hand this script the same spec shape, so the published library is uniform.
//
// Usage:
//   node scripts/digest/publish-digest.mjs --spec issue.json [--commit]
//
// The spec is JSON. `body` is the newsletter markdown (inline string), or pass
// `bodyFile` to read it from a file. `audioFile` (a rendered MP3 path) is copied
// into public/media/digests/<slug>.mp3; alternatively pass a ready `audioUrl`.
//
// Writes src/content/digest/<slug>.md and git-adds it. With --commit it also
// commits locally. It never pushes — that stays an explicit, separate step.

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { z } from "zod";
import YAML from "yaml";
import { collectRecentCoverage, normalizeUrl } from "./recent-coverage.mjs";
import { evaluateConceptGate, isCronMode, runPostPublishSideEffects } from "./concept-gate.mjs";

const CONTENT_DIR = "src/content/digest";
const AUDIO_DIR = "public/media/digests";

// Mirrors the `digest` collection schema in src/content.config.ts. Kept minimal
// here because the Astro schema can't be imported outside the Astro runtime.
const resourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  source: z.string().optional(),
  category: z.string().optional(),
});

const specSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
    title: z.string(),
    cadence: z.enum(["daily", "weekly", "monthly"]),
    track: z.enum(["specialized", "general"]).default("specialized"),
    origin: z.enum(["auto", "manual"]).default("auto"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    summary: z.string(),
    topics: z.array(z.string()).default([]),
    audioFile: z.string().optional(),
    audioUrl: z.string().optional(),
    embedUrl: z.string().url().optional(),
    durationSec: z.number().int().optional(),
    items: z.array(resourceSchema).default([]),
    highlights: z.array(z.string()).default([]),
    body: z.string().optional(),
    bodyFile: z.string().optional(),
  })
  .refine((s) => s.body || s.bodyFile, { message: "provide `body` or `bodyFile`" });

function parseArgs(argv) {
  const args = { commit: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--commit") args.commit = true;
    else if (a.startsWith("--")) args[a.slice(2)] = argv[++i];
  }
  return args;
}

function git(...cmd) {
  const r = spawnSync("git", cmd, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${cmd.join(" ")} failed: ${r.stderr?.trim()}`);
  return r.stdout?.trim();
}

// Repeat guard: with DIGEST_REPEAT_GUARD_DAYS set (the auto-run path), refuse
// to publish an item URL already featured by this cadence+track within the
// lookback window. The generator gets the same list up front; this is the
// mechanical backstop.
async function assertNoRepeatedItems(spec) {
  const days = Number(process.env.DIGEST_REPEAT_GUARD_DAYS || 0);
  if (!days || spec.items.length === 0) return;
  const recent = await collectRecentCoverage({
    contentDir: CONTENT_DIR,
    cadence: spec.cadence,
    track: spec.track,
    days,
    before: spec.date,
  });
  const seen = new Map(recent.map((r) => [r.normalized, r]));
  const repeats = spec.items
    .map((item) => ({ item, prior: seen.get(normalizeUrl(item.url)) }))
    .filter((r) => r.prior);
  if (repeats.length > 0) {
    const detail = repeats
      .map((r) => `  ${r.item.url} — already featured in ${r.prior.slug}`)
      .join("\n");
    throw new Error(
      `repeat guard: ${repeats.length} item(s) were featured in the last ${days} days of ${spec.cadence}/${spec.track} issues:\n${detail}\nSwap these for sources not yet covered and re-run.`
    );
  }
}

async function publish(spec) {
  const slug = spec.slug ?? `${spec.cadence}-${spec.date}`;
  const written = [];

  // Concept gate: interactive mode throws here (nothing written) when the
  // facets resolve to zero concepts; cron mode warns and publishes.
  const cron = isCronMode();
  const gate = evaluateConceptGate(spec.topics, { cron });

  await assertNoRepeatedItems(spec);

  // 1. resolve audio (copy a rendered file in, or use a provided URL)
  let audioUrl = spec.audioUrl;
  if (spec.audioFile) {
    await mkdir(AUDIO_DIR, { recursive: true });
    const dest = path.join(AUDIO_DIR, `${slug}.mp3`);
    await copyFile(spec.audioFile, dest);
    audioUrl = `/media/digests/${slug}.mp3`;
    written.push(dest);
  }

  // 2. assemble frontmatter — only include keys that are set
  const fm = {
    title: spec.title,
    cadence: spec.cadence,
    track: spec.track,
    origin: spec.origin,
    date: spec.date,
    summary: spec.summary,
    topics: spec.topics,
    ...(gate.unresolvedFacets.length > 0 ? { unresolvedFacets: gate.unresolvedFacets } : {}),
    ...(audioUrl ? { audioUrl } : {}),
    ...(spec.embedUrl ? { embedUrl: spec.embedUrl } : {}),
    ...(spec.durationSec ? { durationSec: spec.durationSec } : {}),
    items: spec.items,
    highlights: spec.highlights,
  };

  // 3. write the collection entry
  const body = spec.body ?? (await readFile(spec.bodyFile, "utf8"));
  const md = `---\n${YAML.stringify(fm).trimEnd()}\n---\n\n${body.trim()}\n`;
  await mkdir(CONTENT_DIR, { recursive: true });
  const mdPath = path.join(CONTENT_DIR, `${slug}.md`);
  await writeFile(mdPath, md, "utf8");
  written.push(mdPath);

  // 3b. concept-gate side effects: cron files alias/new-concept proposals to
  // the shared inbox; both modes re-measure the facet-resolution rate and
  // stage the heartbeat update alongside the entry. The entry is already on
  // disk, so a failure in here degrades to a loud warning (in both modes) and
  // the publish completes exactly as it would have pre-gate.
  written.push(
    ...(await runPostPublishSideEffects({
      cron,
      unresolvedFacets: gate.unresolvedFacets,
      issueSlug: slug,
      date: spec.date,
      contentDir: CONTENT_DIR,
    }))
  );

  // 4. stage (always) and commit (opt-in). Never push.
  git("add", ...written);
  return { slug, mdPath, audioUrl, written };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.spec) throw new Error("usage: publish-digest.mjs --spec <issue.json> [--commit]");

  const parsed = specSchema.safeParse(JSON.parse(await readFile(args.spec, "utf8")));
  if (!parsed.success) {
    throw new Error(`invalid spec:\n${parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")}`);
  }

  const result = await publish(parsed.data);
  if (args.commit) {
    git("commit", "-m", `content(digest): publish ${result.slug}`);
  }
  process.stdout.write(`${JSON.stringify({ slug: result.slug, path: result.mdPath, audioUrl: result.audioUrl, committed: args.commit })}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`[publish-digest] ${err.message}`);
    process.exit(1);
  });
}
