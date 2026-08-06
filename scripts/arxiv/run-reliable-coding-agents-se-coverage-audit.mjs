#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = process.cwd();
const outputRoot = path.join(root, "artifacts/arxiv/supplementary-se-search");
const referenceAuditPath = path.join(root, "artifacts/arxiv/reference-audit/reference-audit.json");
const cutoff = "2026-08-06";
const sourceIds = [
  "S4306419842", // ICSE
  "S4306418451", // FSE
  "S4210177399", // Automated Software Engineering
  "S4306420215", // ISSTA
  "S109852484",  // Empirical Software Engineering
  "S8351582",    // IEEE Transactions on Software Engineering
  "S142627899",  // ACM Transactions on Software Engineering and Methodology
  "S177586587",  // Computer Supported Cooperative Work
];
const queries = [
  ["secondary-study-method", "systematic literature review multivocal grey literature software engineering quality assessment"],
  ["evaluation-validity", "coding agent evaluation benchmark validity contamination test oracle"],
  ["grader-validity", "automated software engineering evaluation human labels agreement correctness"],
  ["human-review", "AI assisted code review human oversight automation bias verification"],
  ["operations-recovery", "software agent reliability fault injection recovery durable workflow"],
  ["retrieval-context", "repository code search retrieval context developer task"],
  ["topology", "multi agent software engineering coordination delegation failure"],
  ["adoption-governance", "generative AI software engineering adoption governance accountability"],
];

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function getJson(url) {
  const response = await fetch(url, { headers: { "User-Agent": "ERCA-SE-coverage-audit/1.0 (https://sjarmak.ai)" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

async function providerStatus(name, url) {
  const response = await fetch(url, { redirect: "follow", headers: { "User-Agent": "ERCA-SE-coverage-audit/1.0" } });
  return { name, url, http_status: response.status, accessible: response.ok };
}

await mkdir(outputRoot, { recursive: true });
const referenceAudit = JSON.parse(await readFile(referenceAuditPath, "utf8"));
const knownDois = new Set(referenceAudit.dois.map((item) => item.doi.toLowerCase()));
const knownTitles = new Set([
  ...referenceAudit.arxiv.map((item) => item.metadata?.title),
  ...referenceAudit.dois.map((item) => item.title),
].filter(Boolean).map((title) => title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()));

const discovered = new Map();
for (const [queryId, query] of queries) {
  const filter = `primary_location.source.id:${sourceIds.join("|")},from_publication_date:2018-01-01,to_publication_date:${cutoff}`;
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("filter", filter);
  url.searchParams.set("search", query);
  url.searchParams.set("per-page", "50");
  const result = await getJson(url);
  for (const work of result.results) {
    const record = discovered.get(work.id) ?? {
      openalex_id: work.id,
      title: work.display_name,
      doi: work.doi?.replace(/^https:\/\/doi\.org\//, "") ?? null,
      year: work.publication_year,
      type: work.type,
      venue: work.primary_location?.source?.display_name ?? null,
      landing_page: work.primary_location?.landing_page_url ?? work.doi ?? work.id,
      cited_by_count: work.cited_by_count,
      abstract_inverted_index: work.abstract_inverted_index,
      query_ids: [],
    };
    record.query_ids.push(queryId);
    discovered.set(work.id, record);
  }
}

const candidates = [...discovered.values()].map((record) => {
  const normalizedTitle = record.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const alreadyInManuscript = (record.doi && knownDois.has(record.doi.toLowerCase())) || knownTitles.has(normalizedTitle);
  return { ...record, query_ids: [...new Set(record.query_ids)], already_in_manuscript: alreadyInManuscript };
}).sort((left, right) => Number(left.already_in_manuscript) - Number(right.already_in_manuscript)
  || right.query_ids.length - left.query_ids.length
  || right.cited_by_count - left.cited_by_count);

const doiSample = candidates.filter((record) => record.doi)
  .sort((left, right) => hash(`ERCA-SE-COVERAGE:${left.doi}`).localeCompare(hash(`ERCA-SE-COVERAGE:${right.doi}`)))
  .slice(0, 40);
const doiVariants = doiSample.flatMap((record) => [record.doi, record.doi.toUpperCase()]);
const doiArray = doiVariants.map((doi) => `'${doi.replaceAll("'", "''")}'`).join(",");
let scixMatches = [];
if (doiArray) {
  const sql = `SELECT bibcode, title, unnest(doi) AS doi FROM papers WHERE doi && ARRAY[${doiArray}]::text[] ORDER BY bibcode`;
  try {
    const { stdout } = await run("psql", ["-d", "scix", "-At", "-F", "\t", "-c", sql], { maxBuffer: 5 * 1024 * 1024 });
    scixMatches = stdout.trim().split("\n").filter(Boolean).map((line) => {
      const [bibcode, title, doi] = line.split("\t");
      return { bibcode, title, doi };
    });
  } catch (error) {
    scixMatches = [{ error: error.message }];
  }
}
const matchedDois = new Set(scixMatches.map((row) => row.doi?.toLowerCase()).filter(Boolean));
const coverageSample = doiSample.map((record) => ({
  doi: record.doi,
  title: record.title,
  venue: record.venue,
  year: record.year,
  in_scix_by_exact_doi: matchedDois.has(record.doi.toLowerCase()),
}));

const providerChecks = await Promise.all([
  providerStatus("ACM Digital Library search", "https://dl.acm.org/action/doSearch?AllField=AI%20coding%20agents"),
  providerStatus("IEEE Xplore metadata API without a configured key", "https://ieeexploreapi.ieee.org/api/v1/search/articles?querytext=AI%20coding%20agents&max_records=1"),
  providerStatus("Scopus Search API without a configured key", "https://api.elsevier.com/content/search/scopus?query=TITLE-ABS-KEY%28AI%20coding%20agents%29&count=1"),
]);

const protocol = {
  run_date: cutoff,
  status: "discovery_audit_not_publisher_native_supplement",
  purpose: "Test whether the existing SciX plus arXiv review can assume coverage of core software-engineering venues and prepare a publisher-native supplementary search.",
  discovery_source: "OpenAlex public metadata, used as a coverage probe rather than a substitute for ACM DL, IEEE Xplore, or Scopus.",
  venues: sourceIds,
  queries: queries.map(([id, query]) => ({ id, query })),
  years: [2018, 2026],
  results: {
    unique_candidates: candidates.length,
    not_already_in_manuscript_by_doi_or_normalized_title: candidates.filter((record) => !record.already_in_manuscript).length,
    deterministic_scix_doi_sample: coverageSample.length,
    exact_doi_matches_in_scix: coverageSample.filter((record) => record.in_scix_by_exact_doi).length,
  },
  provider_checks: providerChecks,
  interpretation: "A missing exact DOI in this deterministic sample demonstrates a coverage gap but does not estimate recall for all software-engineering literature. The archival edition remains conditional on a native ACM/IEEE/Scopus search or a justified database substitution with documented equivalence.",
};

const csvColumns = ["title", "doi", "year", "venue", "type", "query_ids", "already_in_manuscript", "landing_page"];
const csv = [csvColumns.join(","), ...candidates.map((record) => csvColumns.map((column) => csvCell(
  column === "query_ids" ? record.query_ids.join("|") : record[column],
)).join(","))].join("\n") + "\n";
await Promise.all([
  writeFile(path.join(outputRoot, "protocol-and-status.json"), `${JSON.stringify(protocol, null, 2)}\n`),
  writeFile(path.join(outputRoot, "candidate-records.json"), `${JSON.stringify(candidates, null, 2)}\n`),
  writeFile(path.join(outputRoot, "candidate-records.csv"), csv),
  writeFile(path.join(outputRoot, "scix-doi-coverage-sample.json"), `${JSON.stringify({ seed: "ERCA-SE-COVERAGE", sample: coverageSample, matches: scixMatches }, null, 2)}\n`),
]);

console.log(JSON.stringify(protocol.results));
console.log(providerChecks.map((check) => `${check.name}: HTTP ${check.http_status}`).join("\n"));
