#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.join(root, "artifacts/arxiv/editorial-source");
const outputRoot = path.join(root, "artifacts/arxiv/reference-audit");
const researchRoot = process.env.RELIABLE_AGENTS_RESEARCH_ROOT
  ?? path.resolve(path.dirname(root), "..", "agent_reliability/reference_context");
const catalogPath = path.join(researchRoot, "catalog_v2/catalog-final.json");
const arxivPattern = /(?:arXiv:|arxiv\.org\/(?:abs|html|pdf)\/)(\d{4}\.\d{4,5})/gi;
const urlPattern = /https?:\/\/[^\s)>\]]+/g;
const doiPattern = /https?:\/\/doi\.org\/10\.\d{4,9}\/[-._;()/:a-z0-9]+/gi;

function cleanUrl(url) {
  return url.replace(/[.,;:'"]+$/, "");
}

function cleanDoiUrl(url) {
  let cleaned = cleanUrl(url);
  while ((cleaned.match(/\)/g) ?? []).length > (cleaned.match(/\(/g) ?? []).length) {
    cleaned = cleaned.slice(0, -1);
  }
  return cleaned;
}

function xmlText(value) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 25_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "reliable-coding-agents-reference-audit/1.0 (mailto:stephanie@stephaniejarmak.com)" },
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function mapLimited(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function loadOccurrences() {
  const files = (await readdir(sourceRoot)).filter((name) => name.endsWith(".md")).sort();
  const arxiv = new Map();
  const dois = new Map();
  const urls = new Map();

  for (const file of files) {
    const lines = (await readFile(path.join(sourceRoot, file), "utf8")).split("\n");
    lines.forEach((line, index) => {
      for (const match of line.matchAll(arxivPattern)) {
        const id = match[1];
        const occurrence = { file, line: index + 1, context: line.trim() };
        arxiv.set(id, [...(arxiv.get(id) ?? []), occurrence]);
      }
      for (const raw of line.match(urlPattern) ?? []) {
        const url = cleanUrl(raw);
        const occurrence = { file, line: index + 1, context: line.trim() };
        urls.set(url, [...(urls.get(url) ?? []), occurrence]);
      }
      for (const raw of line.match(doiPattern) ?? []) {
        const url = cleanDoiUrl(raw);
        const occurrence = { file, line: index + 1, context: line.trim() };
        dois.set(url, [...(dois.get(url) ?? []), occurrence]);
      }
    });
  }

  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  for (const practice of catalog) {
    for (const item of [...(practice.evidence ?? []), ...(practice.corroboration ?? [])]) {
      const occurrence = { file: "companion catalog", line: null, practice_id: practice.id, context: item.source ?? "" };
      if (item.arxiv) arxiv.set(item.arxiv, [...(arxiv.get(item.arxiv) ?? []), occurrence]);
      if (item.url) urls.set(item.url, [...(urls.get(item.url) ?? []), occurrence]);
      for (const raw of (item.source ?? "").match(doiPattern) ?? []) {
        const url = cleanDoiUrl(raw);
        dois.set(url, [...(dois.get(url) ?? []), occurrence]);
      }
    }
  }
  return { arxiv, dois, urls, catalogPractices: catalog.length };
}

async function auditArxiv(ids, occurrences) {
  const records = new Map();
  const batches = [];
  for (let i = 0; i < ids.length; i += 20) batches.push(ids.slice(i, i + 20));

  for (const batch of batches) {
    const endpoint = `https://export.arxiv.org/api/query?id_list=${batch.join(",")}&max_results=${batch.length}`;
    const response = await fetchWithTimeout(endpoint);
    if (!response.ok) throw new Error(`arXiv API returned ${response.status}`);
    const xml = await response.text();
    for (const entry of xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? []) {
      const id = entry.match(/<id>https?:\/\/arxiv\.org\/abs\/(\d{4}\.\d{4,5})(?:v\d+)?<\/id>/)?.[1];
      if (!id) continue;
      const title = xmlText(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
      const published = entry.match(/<published>(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
      const updated = entry.match(/<updated>(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
      const authors = [...entry.matchAll(/<author>\s*<name>([\s\S]*?)<\/name>/g)].map((m) => xmlText(m[1]));
      records.set(id, { id, title, authors, published, updated });
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  return ids.map((id) => ({
    id,
    status: records.has(id) ? "resolved" : "unresolved",
    metadata: records.get(id) ?? null,
    occurrences: occurrences.get(id) ?? [],
  }));
}

async function auditUrl(url, occurrences) {
  try {
    const response = await fetchWithTimeout(url, { method: "GET" });
    const title = (await response.text()).match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    return {
      url,
      status: response.ok ? "resolved" : "http_error",
      http_status: response.status,
      final_url: response.url,
      title: title ? xmlText(title) : null,
      occurrences,
    };
  } catch (error) {
    return {
      url,
      status: "request_error",
      http_status: null,
      final_url: null,
      title: null,
      error: error instanceof Error ? error.message : String(error),
      occurrences,
    };
  }
}

async function auditDoi(url, occurrences) {
  const doi = url.replace(/^https?:\/\/doi\.org\//i, "");
  try {
    const response = await fetchWithTimeout(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
    const body = response.ok ? await response.json() : null;
    return {
      doi,
      url,
      status: response.ok ? "resolved" : "http_error",
      http_status: response.status,
      title: body?.message?.title?.[0] ?? null,
      authors: (body?.message?.author ?? []).map((author) =>
        [author.given, author.family].filter(Boolean).join(" "),
      ),
      published: body?.message?.published?.["date-parts"]?.[0]?.join("-") ?? null,
      occurrences,
    };
  } catch (error) {
    return {
      doi,
      url,
      status: "request_error",
      http_status: null,
      title: null,
      authors: [],
      published: null,
      error: error instanceof Error ? error.message : String(error),
      occurrences,
    };
  }
}

function renderMarkdown(record) {
  const unresolvedArxiv = record.arxiv.filter((item) => item.status !== "resolved");
  const unresolvedDois = record.dois.filter((item) => item.status !== "resolved");
  const failedUrls = record.urls.filter((item) => item.status !== "resolved");
  const lines = [
    "# Reference audit",
    "",
    `Generated ${record.generated_at} from the arXiv editorial source.`,
    "",
    "## Coverage",
    "",
    `- ${record.summary.files} manuscript files and ${record.summary.catalog_practices} companion practices scanned`,
    `- ${record.summary.arxiv_identifiers} unique arXiv identifiers checked against the official arXiv API`,
    `- ${record.summary.other_urls} other unique URLs checked with redirects enabled`,
    `- ${record.summary.arxiv_unresolved} unresolved arXiv identifiers`,
    `- ${record.summary.doi_identifiers} unique DOI identifiers checked against Crossref`,
    `- ${record.summary.doi_unresolved} unresolved DOI identifiers`,
    `- ${record.summary.url_failures} URLs that did not return a successful response`,
    "",
    "Identifier resolution verifies that the cited record exists and captures its current title, authors, and dates. It does not by itself establish that every interpretation in the manuscript is correct; claim scope is reviewed separately in the evidence notes and chapter prose.",
    "",
    "## Unresolved arXiv identifiers",
    "",
  ];

  if (unresolvedArxiv.length === 0) lines.push("None.");
  for (const item of unresolvedArxiv) {
    const first = item.occurrences[0];
    lines.push(`- ${item.id}: ${first?.file ?? "unknown"}:${first?.line ?? "?"}`);
  }

  lines.push("", "## Unresolved DOI identifiers", "");
  if (unresolvedDois.length === 0) lines.push("None.");
  for (const item of unresolvedDois) {
    const first = item.occurrences[0];
    lines.push(`- ${item.doi}: ${first?.file ?? "unknown"}:${first?.line ?? "?"}`);
  }

  lines.push("", "## URL failures", "");
  if (failedUrls.length === 0) lines.push("None.");
  for (const item of failedUrls) {
    const first = item.occurrences[0];
    lines.push(`- ${item.http_status ?? item.status}: ${item.url} (${first?.file ?? "unknown"}:${first?.line ?? "?"})`);
  }
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const { arxiv, dois, urls, catalogPractices } = await loadOccurrences();
  const arxivIds = [...arxiv.keys()].sort();
  const doiUrls = [...dois.keys()].sort();
  const otherUrls = [...urls.keys()]
    .filter((url) => !/https?:\/\/(?:www\.)?arxiv\.org\//i.test(url))
    .filter((url) => !/^https?:\/\/doi\.org\//i.test(url))
    .sort();

  const arxivResults = await auditArxiv(arxivIds, arxiv);
  const doiResults = await mapLimited(doiUrls, 4, (url) => auditDoi(url, dois.get(url) ?? []));
  const urlResults = await mapLimited(otherUrls, 6, (url) => auditUrl(url, urls.get(url) ?? []));
  const record = {
    generated_at: new Date().toISOString(),
    method: {
      arxiv: "Official arXiv Atom API, queried by identifier in batches of 20.",
      doi: "Crossref REST API, queried by DOI.",
      urls: "HTTP GET with redirects enabled and a 25-second timeout.",
    },
    summary: {
      files: (await readdir(sourceRoot)).filter((name) => name.endsWith(".md")).length,
      catalog_practices: catalogPractices,
      arxiv_identifiers: arxivResults.length,
      arxiv_unresolved: arxivResults.filter((item) => item.status !== "resolved").length,
      doi_identifiers: doiResults.length,
      doi_unresolved: doiResults.filter((item) => item.status !== "resolved").length,
      other_urls: urlResults.length,
      url_failures: urlResults.filter((item) => item.status !== "resolved").length,
    },
    arxiv: arxivResults,
    dois: doiResults,
    urls: urlResults,
  };

  await mkdir(outputRoot, { recursive: true });
  await writeFile(path.join(outputRoot, "reference-audit.json"), `${JSON.stringify(record, null, 2)}\n`);
  await writeFile(path.join(outputRoot, "README.md"), renderMarkdown(record));
}

await main();
