#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

const root = process.cwd();
const researchRoot = process.env.RELIABLE_AGENTS_RESEARCH_ROOT
  ?? path.resolve(path.dirname(root), "..", "agent_reliability/reference_context");
const catalogPath = path.join(researchRoot, "catalog_v2/catalog-final.json");
const chapterMapPath = path.join(researchRoot, "catalog_v2/companion-chapter-map.json");
const taughtMapPath = path.join(researchRoot, "catalog_v2/companion-taught-map.json");
const benchmarkRoot = path.join(researchRoot, "benchmarks");
const referenceAuditPath = path.join(root, "artifacts/arxiv/reference-audit/reference-audit.json");
const websiteCompanionPath = path.join(root, "src/content/book-companions/engineering-reliable-coding-agents.md");
const outputRoot = path.join(root, "artifacts/arxiv/companion-release");
const releaseZip = path.join(root, "artifacts/arxiv/engineering-reliable-coding-agents-companion-1.0.0-rc.5.zip");
const repositoryUrl = "https://github.com/sjarmak/engineering-reliable-coding-agents";
const websiteCompanionUrl = "https://sjarmak.ai/books/engineering-reliable-coding-agents/companion";
const skillsUrl = `${repositoryUrl}/tree/main/skills`;

const version = "1.0.0-rc.5";
const sourceKinds = {
  lit: "scholarly",
  explorer: "synthesis",
  practitioner: "practitioner",
};
const evidenceGroups = {
  strong: "strong",
  directional: "directional",
  anecdotal: "corroborating",
  contested: "null_or_conflicting",
  "null-result": "null_or_conflicting",
};

const chapterTitles = {
  1: "Run-to-run variance, statistical power, and paired comparisons",
  2: "Baselines, ablations, and cost-accuracy tradeoffs",
  3: "Benchmark contamination, oracle strength, and workload validity",
  4: "Execution-based evaluation, correction gates, and release tests",
  5: "Calibrating model graders and separating agreement from correctness",
  6: "Proxy metric gaming and layered evaluation signals",
  7: "Agent isolation, injection defenses, and independent verification",
  8: "Persistent agent state, durable workflows, and idempotent retries",
  9: "Replayable traces and fault-injection recovery testing",
  10: "Human-auditable failure analysis and taxonomy development",
  11: "Measuring and designing repository retrieval",
  12: "Localization funnels, repository indexes, and freshness checks",
  13: "Usable context budgets, consolidated-spec restarts, and file-based tool output",
  14: "Cross-session memory, raw traces, and compaction policies",
  15: "Efficient verification interfaces and risk-based human escalation",
  16: "Autonomy calibration, provenance, effective gates, and accountability",
  17: "Agent topology selection and dynamic task allocation",
  18: "Cost-aware fleet scheduling and model routing",
};

function sanitizeProse(value) {
  if (!value) return value;
  return value
    .replace(/\s+Reference aside(?: \(thin support\))?:[\s\S]*$/i, "")
    .replace(/^Rehomed 2026-07-27 from cut pattern [^.]+\.\s*/i, "")
    .replace(/^Merged 2026-07-27 from [^.]+\.\s*/i, "")
    .replace(/^Named in the same multi-work explorer source string[\s\S]*?No figure from this work is carried into the catalog, so /i, "")
    .replace(/Audited 2026-07-27 \(explorer-strong-audit\):\s*/gi, "Evidence audit: ")
    .replace(/\bexplorer syntheses\b/gi, "source syntheses")
    .replace(/\bexplorer synthesis\b/gi, "source synthesis")
    .replace(/\bexplorer corpus\b/gi, "source corpus")
    .replace(/\bexplorer item\b/gi, "synthesis item")
    .replace(/\bexplorer\b/g, "synthesis")
    .replace(/\blit evidence items?\b/gi, "scholarly evidence items")
    .replace(/\blit sources?\b/gi, "scholarly sources")
    .replace(/\buntaught\b/gi, "companion-only")
    .replace(/\btaught\b/gi, "developed")
    .replace(/\bGATE1-SHORTLIST item \d+\b/gi, "evidence audit")
    .replace(/\bGATE1 item \d+\b/gi, "evidence audit")
    .replace(/\bsynthesis-strong-audit\b/gi, "evidence audit")
    .replace(/\bdecision-\d+ sweep\b/gi, "evidence review")
    .replace(/\bdossier\b/gi, "author-system record")
    .replace(/\bauthor-owned\b/gi, "author-system")
    .replace(/\bwebsite-patterns(?:\.md)?\b/gi, "published field notes")
    .replace(/\bthe synthesis's\b/gi, "an inference in this catalog")
    .replace(/\bthis pattern teaches\b/gi, "this practice recommends")
    .replace(/\bSame paper is (?:already )?(?:carried|admitted) as lit evidence under ([a-z0-9-]+)[^.]*\./gi, "The same paper also supports the related practice $1. ")
    .replace(/\bpreviously listed once as lit and once as practitioner\./gi, "Duplicate source records were consolidated.")
    .replace(/\b(?:the )?(?:sweep|flag|reinstatement) defect[^.]*\./gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function renderReviewableLearnings(source) {
  const body = source
    .replace(/^---\n[\s\S]*?\n---\n+/, "")
    .replace(
      /<span class="katex">[\s\S]*?<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>[\s\S]*?<\/span>/g,
      (_match, tex) => `$${tex.trim()}$`,
    )
    .trim();
  return `# Companion learnings\n\nThis human-readable edition presents all 192 practices in chapter context. For navigation, filtering, and graph exploration, use the [website companion](${websiteCompanionUrl}).\n\n${body}\n`;
}

function cleanCitation(value, metadata, arxiv) {
  if (metadata && arxiv) {
    const authorText = metadata.authors.length > 5
      ? `${metadata.authors.slice(0, 5).join(", ")}, et al.`
      : metadata.authors.join(", ");
    const year = metadata.published?.slice(0, 4) ?? "n.d.";
    return `${authorText} (${year}). ${metadata.title}. arXiv:${arxiv}.`;
  }
  let citation = value.includes("—") ? value.split("—").at(-1).trim() : value;
  citation = sanitizeProse(citation)
    .replace(/\s+-\s+.*$/i, "")
    .replace(/^([A-Za-z0-9_-]+)\.md\s+—\s+/, "Author-system illustration: ")
    .replace(/,?\s*published field notes P\d+[\s\S]*$/i, "")
    .trim();
  return citation || (arxiv ? `arXiv:${arxiv}.` : "Unpublished author-system illustration.");
}

function csvCell(value) {
  const text = value == null ? "" : typeof value === "string" ? value : JSON.stringify(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows, columns) {
  return [columns.join(","), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(","))].join("\n") + "\n";
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

async function main() {
  const [catalogSource, chapterMapSource, taughtMapSource, benchmarkSource, referenceAudit, websiteCompanionSource] = await Promise.all([
    readFile(catalogPath, "utf8"),
    readFile(chapterMapPath, "utf8"),
    readFile(taughtMapPath, "utf8"),
    readFile(path.join(benchmarkRoot, "benchmarks.json"), "utf8"),
    readFile(referenceAuditPath, "utf8").then(JSON.parse),
    readFile(websiteCompanionPath, "utf8"),
  ]);
  const catalog = JSON.parse(catalogSource);
  const companionMap = JSON.parse(chapterMapSource);
  const taughtMap = JSON.parse(taughtMapSource);

  const arxivMetadata = new Map(referenceAudit.arxiv.map((item) => [item.id, item.metadata]));
  const assignment = new Map();
  for (const [chapter, ids] of Object.entries(taughtMap)) {
    for (const id of ids) assignment.set(id, { chapter: Number(chapter), treatment: "developed_in_manuscript", thin_support: false });
  }
  for (const [chapter, entries] of Object.entries(companionMap)) {
    for (const entry of entries) assignment.set(entry.id, { chapter: Number(chapter), treatment: "companion_only", thin_support: entry.aside });
  }

  const evidenceRows = [];
  const publicCatalog = catalog.map((practice) => {
    const location = assignment.get(practice.id);
    if (!location) throw new Error(`No chapter assignment for ${practice.id}`);
    const evidence = (practice.evidence ?? []).map((item, index) => {
      const record = {
        evidence_id: `${practice.id}:e${index + 1}`,
        source_kind: sourceKinds[item.class] ?? "other",
        evidence_group: evidenceGroups[item.strength] ?? "unclassified",
        citation: cleanCitation(item.source, item.arxiv ? arxivMetadata.get(item.arxiv) : null, item.arxiv),
        bibcode: item.bibcode ?? null,
        arxiv: item.arxiv ?? null,
        url: item.url ?? (item.arxiv ? `https://arxiv.org/abs/${item.arxiv}` : null),
        claim_support: sanitizeProse(item.note),
        resolved_metadata: item.arxiv ? arxivMetadata.get(item.arxiv) ?? null : null,
      };
      evidenceRows.push({
        practice_id: practice.id,
        ...record,
        independent_external_evidence: true,
      });
      return record;
    });
    const corroboratingMaterial = (practice.corroboration ?? []).map((item, index) => {
      const authorOwned = item.author_owned === true || ["dossier", "author-owned", "explorer-author-owned"].includes(item.class);
      const record = {
        evidence_id: `${practice.id}:c${index + 1}`,
        source_kind: authorOwned ? "author_system_illustration" : "corroborating_material",
        evidence_group: item.class === "demoted-evidence" ? "null_or_conflicting" : "corroborating",
        citation: cleanCitation(item.source, item.arxiv ? arxivMetadata.get(item.arxiv) : null, item.arxiv),
        bibcode: item.bibcode ?? null,
        arxiv: item.arxiv ?? null,
        url: item.url ?? null,
        claim_support: sanitizeProse(item.note),
        independent_external_evidence: false,
        limitation: item.class === "demoted-evidence"
          ? "Retained as a limitation or counterexample; not counted as independent supporting evidence."
          : authorOwned
            ? "Illustrative author-system case; not counted as independent external evidence."
            : "Corroborating material; not counted as independent evidence.",
      };
      evidenceRows.push({ practice_id: practice.id, ...record });
      return record;
    });
    return {
      id: practice.id,
      name: practice.name,
      practice: sanitizeProse(practice.do),
      rationale: sanitizeProse(practice.why),
      boundary_conditions: sanitizeProse(practice.boundary),
      transfers_to: sanitizeProse(practice.transfers_to),
      chapter: location.chapter,
      chapter_title: chapterTitles[location.chapter],
      treatment: location.treatment,
      thin_support: location.thin_support,
      evidence,
      corroborating_material: corroboratingMaterial,
    };
  });

  if (publicCatalog.length !== 192) throw new Error(`Expected 192 practices, found ${publicCatalog.length}`);
  const taughtCount = publicCatalog.filter((entry) => entry.treatment === "developed_in_manuscript").length;
  if (taughtCount !== 55) throw new Error(`Expected 55 developed practices, found ${taughtCount}`);

  const crosswalk = Object.entries(chapterTitles).map(([number, title]) => ({
    chapter: Number(number),
    title,
    developed_practices: taughtMap[number],
    companion_practices: companionMap[number],
  }));

  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(path.join(outputRoot, "schemas"), { recursive: true });

  const files = new Map();
  files.set("LEARNINGS.md", renderReviewableLearnings(websiteCompanionSource));
  files.set("catalog.json", `${JSON.stringify(publicCatalog, null, 2)}\n`);
  files.set("chapter-crosswalk.json", `${JSON.stringify(crosswalk, null, 2)}\n`);
  files.set("reference-metadata.json", `${JSON.stringify({
    generated_at: referenceAudit.generated_at,
    arxiv: referenceAudit.arxiv.map(({ id, status, metadata }) => ({ id, status, metadata })),
    dois: referenceAudit.dois.map(({ doi, url, status, title, authors, published }) => ({ doi, url, status, title, authors, published })),
    web_sources: referenceAudit.urls.map(({ url, status, http_status, final_url, title }) => ({ url, status, http_status, final_url, title })),
  }, null, 2)}\n`);
  files.set("evidence-ledger.csv", toCsv(evidenceRows, [
    "practice_id", "evidence_id", "source_kind", "evidence_group", "citation", "bibcode", "arxiv", "url", "claim_support", "independent_external_evidence", "limitation",
  ]));
  files.set("CITATION.cff", `cff-version: 1.2.0\nmessage: "Please cite the archived release of this companion and the associated manuscript."\ntitle: "Engineering Reliable Coding Agents: Companion Research Artifact"\ntype: dataset\nauthors:\n  - family-names: Jarmak\n    given-names: Stephanie\nversion: "${version}"\nrepository-code: "${repositoryUrl}"\nurl: "${websiteCompanionUrl}"\nabstract: >-\n  Human-readable and machine-readable practice catalog, evidence ledger,\n  chapter crosswalk, and benchmark records accompanying Engineering Reliable\n  Coding Agents.\nkeywords:\n  - AI coding agents\n  - software engineering\n  - evaluation\n  - reliability\n  - agent operations\n`);
  files.set("README.md", `# Engineering Reliable Coding Agents: companion research artifact\n\nRelease candidate ${version}, prepared August 5, 2026.\n\nThis package accompanies *Engineering Reliable Coding Agents: Evaluation, Recovery, Context, and Control Beyond the Model*. It is designed to be archived as a separate, citable research artifact. The final archival release should receive its own DOI and should be cited alongside the manuscript.\n\nReview the interactive [website companion](${websiteCompanionUrl}), or read the complete chapter-organized catalog in [\`LEARNINGS.md\`](LEARNINGS.md).\n\nReusable agent workflows derived from selected practices are published separately in the repository's [\`skills/\` collection](${skillsUrl}). They are implementation artifacts, not additional evidence.\n\nCanonical repository: [${repositoryUrl}](${repositoryUrl})\n\n## Contents\n\n- \`LEARNINGS.md\`: human-readable, chapter-organized presentation of all 192 practices, including actions, mechanisms, evidence, and boundaries.\n- \`catalog.json\`: all 192 bounded practices in machine-readable form.\n- \`evidence-ledger.csv\`: one row per evidence item or corroborating item.\n- \`chapter-crosswalk.json\`: the 55 practices developed in the manuscript and the 137 companion-only entries.\n- \`benchmark-catalog.json\`: 29 coding-agent benchmark records.\n- \`reference-metadata.json\`: resolved arXiv, DOI, and web-source metadata from the manuscript audit.\n- \`schemas/\`: JSON Schemas for the catalog and benchmark records.\n- \`PROVENANCE.md\`: source snapshot, transformations, evidence definitions, and release exclusions.\n- \`CITATION.cff\`: citation metadata for GitHub and archival services.\n- \`SHA256SUMS\`: checksums for the release files.\n\n## Evidence vocabulary\n\n\`strong\` directly supports the stated claim through a controlled comparison, validated benchmark result, or comparably specific measurement. \`directional\` supports the mechanism or direction without establishing magnitude or broad transfer. \`corroborating\` establishes plausibility through a case or convergent observation. \`null_or_conflicting\` records a result that did not support the expected effect or limits another claim.\n\nAuthor-system cases are labeled \`author_system_illustration\` and set \`independent_external_evidence\` to \`false\`. They illustrate mechanisms and failure cases but do not support general claims independently.\n\n## Before public release\n\nReplace this release-candidate version with \`1.0.0\`, add the selected license, publish a tagged release in the canonical repository, archive that exact tag with Zenodo or another DOI-granting repository, and add the resulting DOI to this file and \`CITATION.cff\`. Do not archive internal review notes, rejected candidates, private receipts, or unpublished operational data.\n`);
  files.set("PROVENANCE.md", `# Provenance\n\nCanonical repository: [${repositoryUrl}](${repositoryUrl})\n\nInteractive companion: [${websiteCompanionUrl}](${websiteCompanionUrl})\n\nDerived agent skills: [${skillsUrl}](${skillsUrl})\n\n## Source snapshot\n\n- Public manuscript chapter snapshot: website repository commit \`c40183e\` (August 5, 2026).\n- Human-readable companion input SHA-256: \`${sha256(websiteCompanionSource)}\`.\n- Practice catalog input SHA-256: \`${sha256(catalogSource)}\`.\n- Companion chapter-map input SHA-256: \`${sha256(chapterMapSource)}\`.\n- Developed-practice map input SHA-256: \`${sha256(taughtMapSource)}\`.\n- Benchmark catalog input SHA-256: \`${sha256(benchmarkSource)}\`.\n\nThe hashes identify the exact build inputs without exposing workstation paths or unpublished repository contents.\n\n## Transformations\n\n\`LEARNINGS.md\` is generated from the website companion source by removing site frontmatter and replacing rendered MathML spans with ordinary inline LaTeX. Internal evidence shorthand and editorial workflow notes were replaced by reader-facing \`source_kind\` and \`evidence_group\` fields in the machine-readable catalog. Internal derivation pointers were omitted. The known DynTaskMAS author-name defect in the source catalog was corrected from “Yin” to Yu, Ding, and Sato using the official arXiv record. Official arXiv metadata captured during the manuscript reference audit supplies citations and appears under \`resolved_metadata\`.\n\nThe separately packaged skills retain their own practice maps and evidence boundaries. They are derived operational artifacts and are not counted as independent evidence.\n\nCorroborating author-system records remain available for reproducibility but are explicitly excluded from independent external evidence. Records previously removed from supporting evidence are retained as null or conflicting material with their limitation.\n\n## Excluded material\n\nThe package excludes working notes, selection deliberations, rejected entries, private comments, unpublished raw operational data, local configuration, and internal receipts. The release is a public research artifact, not a mirror of the working directory.\n`);
  files.set("schemas/catalog.schema.json", `${JSON.stringify({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Engineering Reliable Coding Agents practice catalog",
    type: "array",
    minItems: 192,
    maxItems: 192,
    items: {
      type: "object",
      required: ["id", "name", "practice", "rationale", "boundary_conditions", "chapter", "treatment", "evidence"],
      properties: {
        id: { type: "string", pattern: "^[a-z0-9][a-z0-9-]*$" },
        name: { type: "string" },
        practice: { type: "string" },
        rationale: { type: "string" },
        boundary_conditions: { type: "string" },
        transfers_to: { type: "string" },
        chapter: { type: "integer", minimum: 1, maximum: 18 },
        chapter_title: { type: "string" },
        treatment: { enum: ["developed_in_manuscript", "companion_only"] },
        thin_support: { type: "boolean" },
        evidence: { type: "array" },
        corroborating_material: { type: "array" },
      },
    },
  }, null, 2)}\n`);

  for (const [name, content] of files) await writeFile(path.join(outputRoot, name), content);
  await cp(path.join(benchmarkRoot, "benchmarks.json"), path.join(outputRoot, "benchmark-catalog.json"), { force: true });
  await cp(path.join(benchmarkRoot, "schema.json"), path.join(outputRoot, "schemas/benchmark-catalog.schema.json"), { force: true });

  const checksumNames = [...files.keys(), "benchmark-catalog.json", "schemas/benchmark-catalog.schema.json"]
    .filter((name) => name !== "SHA256SUMS")
    .sort();
  const checksums = [];
  for (const name of checksumNames) {
    const content = await readFile(path.join(outputRoot, name));
    checksums.push(`${sha256(content)}  ${name}`);
  }
  await writeFile(path.join(outputRoot, "SHA256SUMS"), `${checksums.join("\n")}\n`);
  await rm(releaseZip, { force: true });
  await run("zip", ["-X", "-q", "-r", releaseZip, path.basename(outputRoot)], { cwd: path.dirname(outputRoot) });
}

await main();
