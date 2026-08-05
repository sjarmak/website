#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.join(root, "artifacts/arxiv/editorial-source");
const outputPath = path.join(
  root,
  "artifacts/arxiv/reference-audit/strong-evidence-audit.json",
);

const compositeRiskPatterns = [
  /source synthesis/i,
  /source corpus/i,
  /same synthesis/i,
  /catalog pointer only/i,
];

const entries = [];
const failures = [];

for (const file of (await readdir(sourceRoot)).filter((name) => name.endsWith(".md")).sort()) {
  const source = await readFile(path.join(sourceRoot, file), "utf8");
  const lines = source.split("\n");
  const sourcesIndex = lines.findIndex((line) => line === "## Sources and evidence");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!/Strong evidence(?: for [^:]+)?:/i.test(line)) continue;

    const arxivIds = [...line.matchAll(/arXiv:([0-9]{4}\.[0-9]{4,5})/gi)].map((match) => match[1]);
    const linkedUrls = [...line.matchAll(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/g)].map((match) => match[1]);
    const doiUrls = [...line.matchAll(/https?:\/\/(?:dx\.)?doi\.org\/[^\s)]+/gi)].map((match) => match[0]);
    const riskTerms = compositeRiskPatterns
      .filter((pattern) => pattern.test(line))
      .map((pattern) => pattern.source);
    const location = `${file}:${index + 1}`;
    const problems = [];

    if (sourcesIndex === -1 || index <= sourcesIndex) {
      problems.push("strong label appears outside the Sources and evidence section");
    }
    if (arxivIds.length + linkedUrls.length + doiUrls.length === 0) {
      problems.push("no direct identifier or source URL");
    }
    if (arxivIds.length > 1) {
      problems.push("multiple arXiv studies grouped under one strong label");
    }
    if (riskTerms.length > 0) {
      problems.push(`composite-risk wording: ${riskTerms.join(", ")}`);
    }

    entries.push({
      location,
      arxiv_ids: arxivIds,
      linked_urls: linkedUrls,
      doi_urls: doiUrls,
      composite_risk_terms: riskTerms,
      status: problems.length === 0 ? "pass" : "fail",
      text: line,
    });
    if (problems.length > 0) failures.push({ location, problems, text: line });
  }
}

const chapterTwoStrong = entries.filter((entry) =>
  entry.location.startsWith("baselines-ablations-cost-accuracy.md:"));
if (chapterTwoStrong.length > 0) {
  failures.push({
    location: "baselines-ablations-cost-accuracy.md",
    problems: ["Chapter 2 composite ablation sources remain labeled strong"],
    text: chapterTwoStrong.map((entry) => entry.text).join(" | "),
  });
}

const report = {
  generated_at: new Date().toISOString(),
  rule: "A strong label must point to one directly identifiable source and must not promote a synthesis, corpus, or catalog-only transfer into a strong composite claim.",
  totals: {
    strong_entries: entries.length,
    passing: entries.filter((entry) => entry.status === "pass").length,
    failing: failures.length,
  },
  entries,
  failures,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Audited ${entries.length} Strong evidence entries: ${report.totals.passing} passed, ${failures.length} failed.`);
console.log(`Report: ${path.relative(root, outputPath)}`);

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`${failure.location}: ${failure.problems.join("; ")}`);
  }
  process.exitCode = 1;
}
