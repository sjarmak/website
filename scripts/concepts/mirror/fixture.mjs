// Synthetic fixture builder for mirror tests.
//
// Everything here is generated from the note/data schemas with lorem-style
// content. No fixture is ever derived from real notes, and no real vault
// path appears anywhere — tests always run against a throwaway tree built
// by this module inside a temp directory.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const FIXTURE_CONCEPTS = [
  {
    slug: "lorem-ipsum",
    label: "Lorem Ipsum",
    aliases: ["lorem"],
    definition: "Synthetic definition of lorem ipsum, generated for fixture use only.",
  },
  {
    slug: "dolor-sit",
    label: "Dolor Sit",
    aliases: [],
    definition: "Synthetic definition of dolor sit, generated for fixture use only.",
  },
  {
    slug: "amet-consectetur",
    label: "Amet Consectetur",
    aliases: [],
    definition: "Synthetic definition with zero evidence, so it never mirrors.",
  },
];

export const FIXTURE_VAULT_NOTE = "Fixture Reference Note";

/** Build the synthetic data tree (concepts/digest/explorers/threads/assignments). */
export async function buildFixtureData(dir) {
  const conceptsDir = path.join(dir, "concepts");
  const digestDir = path.join(dir, "digest");
  await mkdir(conceptsDir, { recursive: true });
  await mkdir(digestDir, { recursive: true });

  for (const concept of FIXTURE_CONCEPTS) {
    const aliases = concept.aliases.length > 0 ? `\naliases: [${concept.aliases.join(", ")}]` : "";
    await writeFile(
      path.join(conceptsDir, `${concept.slug}.md`),
      `---\nlabel: "${concept.label}"${aliases}\ndefinition: "${concept.definition}"\n---\n`,
      "utf8",
    );
  }

  await writeFile(
    path.join(digestDir, "daily-0001.md"),
    `---\ntitle: Fixture digest issue one\ndate: 2026-01-01\n---\nLorem body.\n`,
    "utf8",
  );
  await writeFile(
    path.join(digestDir, "daily-0002.md"),
    `---\ntitle: Fixture digest issue two\ndate: 2026-01-02\n---\nIpsum body.\n`,
    "utf8",
  );

  const assignmentsPath = path.join(dir, "concept-assignments.json");
  await writeFile(
    assignmentsPath,
    `${JSON.stringify(
      {
        "digest:daily-0001": { concept: "lorem-ipsum" },
        "digest:daily-0002": { concept: "lorem-ipsum" },
        "paper:2099fixt.0001A": { concept: "lorem-ipsum", takeaway: "Synthetic paper takeaway." },
        [`vault:${FIXTURE_VAULT_NOTE}`]: { concept: "lorem-ipsum" },
        "paper:2099fixt.0002B": { concept: "dolor-sit" },
        "thread:fixture-thread": { concept: "dolor-sit" },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const explorersPath = path.join(dir, "explorers.json");
  await writeFile(
    explorersPath,
    `${JSON.stringify({
      explorers: [
        {
          id: "fixture-explorer",
          title: "Fixture Explorer",
          homepage: "/library/explorers/fixture-explorer",
          papers: [
            {
              bibcode: "2099fixt.0001A",
              title: "Synthetic Paper One",
              branches: ["lorem"],
              notes: [{ branch: "lorem", takeaway: "Explorer note takeaway." }],
            },
            { bibcode: "2099fixt.0002B", title: "Synthetic Paper Two", branches: ["dolor-sit"], notes: [] },
          ],
        },
      ],
    })}\n`,
    "utf8",
  );

  const threadsPath = path.join(dir, "threads.json");
  await writeFile(
    threadsPath,
    `${JSON.stringify({ count: 1, threads: [{ id: "fixture-thread", question: "Synthetic fixture question?" }] })}\n`,
    "utf8",
  );

  return { conceptsDir, digestDir, assignmentsPath, explorersPath, threadsPath };
}

/** Build a synthetic vault tree with a couple of plain (non-mirror) notes. */
export async function buildFixtureVault(dir) {
  const vaultRoot = path.join(dir, "vault");
  await mkdir(path.join(vaultRoot, "Notes"), { recursive: true });
  await mkdir(path.join(vaultRoot, ".stfolder"), { recursive: true });
  await writeFile(
    path.join(vaultRoot, "Notes", `${FIXTURE_VAULT_NOTE}.md`),
    "Synthetic vault note body (lorem).\n",
    "utf8",
  );
  await writeFile(path.join(vaultRoot, "Notes", "Unrelated Note.md"), "Unrelated lorem.\n", "utf8");
  return vaultRoot;
}

/**
 * Full sandbox: data + vault + env pointing every injectable path at the
 * fixture (vault root, pipeline home, data sources, confirm env for writes).
 */
export async function buildFixtureSandbox(dir, { confirm = true } = {}) {
  const data = await buildFixtureData(path.join(dir, "data"));
  const vaultRoot = await buildFixtureVault(dir);
  const pipelineHome = path.join(dir, "pipeline-home");
  const env = {
    CONCEPTS_VAULT_ROOT: vaultRoot,
    CONCEPTS_PIPELINE_HOME: pipelineHome,
    CONCEPTS_CONCEPTS_DIR: data.conceptsDir,
    CONCEPTS_DIGEST_DIR: data.digestDir,
    CONCEPTS_ASSIGNMENTS_PATH: data.assignmentsPath,
    CONCEPTS_EXPLORERS_PATH: data.explorersPath,
    CONCEPTS_THREADS_PATH: data.threadsPath,
    ...(confirm ? { CONCEPTS_MIRROR_CONFIRM: "1" } : {}),
  };
  return { data, vaultRoot, pipelineHome, env };
}
