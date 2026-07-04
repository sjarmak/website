#!/usr/bin/env node
// Local pre-commit register validation for the digest cron channel (PRD R3).
// run.sh calls this between generation and commit, so a schema-violating cron
// issue is caught on the cron host — never at 3 a.m. in site CI.
//
// Scans every src/content/digest/*.md frontmatter and fails when:
//   - `origin` is missing or outside {auto, manual}
//   - `register` is present but outside the closed enum
//   - `register` is present but contradicts the origin derivation
//     (auto→generated, manual→hybrid)
//
// Register may be ABSENT (the 60 pre-R3 entries derive it at build time); it
// may never be wrong. Same weakening-requires-bead rule as
// register-drift.mjs: relaxing any criterion here needs a bd bead naming it.
//
// Usage: node scripts/checks/validate-digest-registers.mjs [--dir src/content/digest]

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";
import YAML from "yaml";
import { REGISTERS, registerFromDigestOrigin } from "../../src/lib/register.ts";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, "..", "..");
const DIGEST_ORIGINS = ["auto", "manual"];

// Exported for tests. Returns { problems, checked }.
export async function validateDigestRegisters({
  contentDir = path.join(REPO_ROOT, "src", "content", "digest"),
} = {}) {
  const problems = [];
  let checked = 0;
  for (const file of (await readdir(contentDir)).sort()) {
    if (!file.endsWith(".md")) continue;
    checked += 1;
    const text = await readFile(path.join(contentDir, file), "utf8");
    const fmMatch = text.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) {
      problems.push(`${file}: no frontmatter block`);
      continue;
    }
    let fm;
    try {
      fm = YAML.parse(fmMatch[1]);
    } catch (err) {
      problems.push(`${file}: unparseable frontmatter (${err.message})`);
      continue;
    }
    const origin = fm?.origin ?? "auto"; // schema default
    if (!DIGEST_ORIGINS.includes(origin)) {
      problems.push(`${file}: origin "${origin}" outside {${DIGEST_ORIGINS.join(", ")}}`);
      continue;
    }
    const register = fm?.register;
    if (register === undefined || register === null) continue; // derives at build
    if (!REGISTERS.includes(register)) {
      problems.push(
        `${file}: register "${register}" outside the closed enum [${REGISTERS.join(", ")}]`,
      );
      continue;
    }
    const derived = registerFromDigestOrigin(origin);
    if (register !== derived) {
      problems.push(
        `${file}: register "${register}" contradicts origin "${origin}" (must be "${derived}")`,
      );
    }
  }
  return { problems, checked };
}

async function main() {
  const { values } = parseArgs({ options: { dir: { type: "string" } } });
  const result = await validateDigestRegisters(
    values.dir ? { contentDir: path.resolve(values.dir) } : {},
  );
  if (result.problems.length > 0) {
    console.error(`[digest-registers] FAIL — ${result.problems.length} problem(s):`);
    for (const p of result.problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(`[digest-registers] OK — ${result.checked} digest entr(ies) register-consistent`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`[digest-registers] ${err.message}`);
    process.exit(1);
  });
}
