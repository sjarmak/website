#!/usr/bin/env node

import { execFile } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = process.cwd();
const editorialRoot = path.join(root, "artifacts/arxiv/editorial-source");
const sourceRoot = path.join(root, "artifacts/arxiv/engineering-reliable-coding-agents-arxiv-source");
const chapterRoot = path.join(sourceRoot, "chapters");
const figureRoot = path.join(sourceRoot, "figures");
const figureSourceRoot = path.join(root, "src/assets/books/engineering-reliable-coding-agents");
const buildRoot = path.join(root, "artifacts/arxiv/.latex-build");
const previewPath = path.join(root, "artifacts/arxiv/engineering-reliable-coding-agents-preview.pdf");
const zipPath = path.join(root, "artifacts/arxiv/engineering-reliable-coding-agents-arxiv-source.zip");
const referenceAuditPath = path.join(root, "artifacts/arxiv/reference-audit/reference-audit.json");
const repositoryUrl = "https://github.com/sjarmak/engineering-reliable-coding-agents";
const expectedFigureCount = 17;
const pandoc = process.env.RELIABLE_AGENTS_PANDOC ?? "/tmp/arxiv-tools/bin/pandoc";
const pandocDataDir = process.env.RELIABLE_AGENTS_PANDOC_DATA_DIR;
const tectonic = process.env.RELIABLE_AGENTS_TECTONIC ?? "/tmp/arxiv-tools/tectonic";
const rsvgConvert = process.env.RELIABLE_AGENTS_RSVG_CONVERT
  ?? "/tmp/arxiv-tools/rsvg/usr/bin/rsvg-convert";

const parts = [
  ["Evaluation measurement and experiment design", [
    ["variance-power-paired-comparisons.md", "Run-to-run variance, statistical power, and paired comparisons"],
    ["baselines-ablations-cost-accuracy.md", "Baselines, ablations, and cost-accuracy tradeoffs"],
    ["contamination-oracle-workload-validity.md", "Benchmark contamination, oracle strength, and workload validity"],
  ]],
  ["Evaluation and grading systems", [
    ["execution-correction-gates-release-tests.md", "Execution-based evaluation, correction gates, and release tests"],
    ["calibrating-model-graders-agreement-correctness.md", "Calibrating model graders and separating agreement from correctness"],
    ["proxy-gaming-layered-signals.md", "Proxy metric gaming and layered evaluation signals"],
  ]],
  ["Containment, durable execution, and recovery engineering", [
    ["isolation-injection-independent-verification.md", "Agent isolation, injection defenses, and independent verification"],
    ["persistent-state-durable-workflows-idempotent-retries.md", "Persistent agent state, durable workflows, and idempotent retries"],
    ["replayable-traces-fault-injection-recovery.md", "Replayable traces and fault-injection recovery testing"],
    ["human-auditable-failure-analysis-taxonomy.md", "Human-auditable failure analysis and taxonomy development"],
  ]],
  ["Context engineering: retrieval, budgets, and memory", [
    ["measuring-designing-repository-retrieval.md", "Measuring and designing repository retrieval"],
    ["localization-funnels-repository-indexes-freshness-checks.md", "Localization funnels, repository indexes, and freshness checks"],
    ["usable-context-budgets-spec-restarts-file-output.md", "Usable context budgets, consolidated-spec restarts, and file-based tool output"],
    ["cross-session-memory-raw-traces-compaction.md", "Cross-session memory, raw traces, and compaction policies"],
  ]],
  ["Human review and accountability engineering", [
    ["verification-interfaces-risk-based-escalation.md", "Efficient verification interfaces and risk-based human escalation"],
    ["autonomy-provenance-gates-accountability.md", "Autonomy calibration, provenance, effective gates, and accountability"],
  ]],
  ["Research agenda: work allocation and cost engineering", [
    ["agent-topology-dynamic-task-allocation.md", "Agent topology selection and dynamic task allocation"],
    ["cost-aware-fleet-scheduling-model-routing.md", "Cost-aware fleet scheduling and model routing"],
  ]],
];
const partRunningTitles = [
  "Part I: Evaluation",
  "Part II: Grading",
  "Part III: Containment and recovery",
  "Part IV: Context",
  "Part V: Human review",
  "Part VI: Research agenda",
];

function decodeXml(text) {
  return text
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"');
}

function preprocessMarkdown(source, { introduction = false, sourcesEndmatter = true } = {}) {
  let output = source;
  output = output.replace(
    /<div class="book-math book-math--display">[\s\S]*?<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>[\s\S]*?<\/div>/g,
    (_match, tex) => `\n\n$$\n${decodeXml(tex).trim()}\n$$\n\n`,
  );
  output = output.replace(
    /<span class="katex">[\s\S]*?<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>[\s\S]*?<\/span>/g,
    (_match, tex) => `$${decodeXml(tex).trim()}$`,
  );
  output = output.replace(/\\\(([\s\S]*?)\\\)/g, (_match, tex) => `$${tex}$`);
  output = output.replaceAll("τ-bench", "tau-bench");
  output = output.replaceAll("κ", "kappa").replaceAll("≈", "approximately");
  output = output.replace(/\(\/book-figures\/([a-z0-9-]+)\.svg\)/g, "(figures/$1.pdf)");
  output = output.replace("(figures/dependency-chain.pdf)", "(figures/dependency-chain.pdf){width=100%}");
  output = output.replace("(figures/review-flow.pdf)", "(figures/review-flow.pdf){width=100%}");
  output = output.replace(
    /^(.+:)\n\n(?=(?:- |\d+\. ))/gm,
    "\\Needspace{5\\baselineskip}\n$1\n\n",
  );
  if (introduction) output = output.slice(output.indexOf("## Problem and scope"));
  if (!introduction && sourcesEndmatter) {
    const marker = "## Sources and evidence";
    const markerIndex = output.lastIndexOf(marker);
    if (markerIndex === -1) throw new Error("Chapter is missing its sources end matter");
    const sources = output
      .slice(markerIndex + marker.length)
      .replace(/^### (.+)$/gm, "**$1**");
    if (/^#{1,6} /m.test(sources)) {
      throw new Error("Unexpected heading inside chapter sources end matter");
    }
    output = `${output.slice(0, markerIndex)}\\section*{Sources and evidence}${sources}`;
  }
  if (introduction) {
    // Preserve the introduction's hierarchy when shifting it beneath the
    // unnumbered Introduction chapter. A sequential replacement collapses
    // both H2 and H3 headings into peer LaTeX sections.
    output = output
      .replace(/^### /gm, "@@INTRO_SUBSECTION@@ ")
      .replace(/^## /gm, "# ")
      .replace(/^@@INTRO_SUBSECTION@@ /gm, "## ");
  } else {
    output = output.replace(/^### /gm, "## ").replace(/^## /gm, "# ");
  }
  return output;
}

function texEscape(value) {
  return value.replaceAll("&", "\\&");
}

function texText(value) {
  const unicode = new Map([
    ["ç", "\\c{c}"], ["è", "\\`{e}"], ["é", "\\'{e}"], ["ë", "\\\"{e}"],
    ["í", "\\'{i}"], ["ö", "\\\"{o}"], ["ø", "\\o{}"], ["ü", "\\\"{u}"],
    ["ć", "\\'{c}"], ["č", "\\v{c}"], ["ž", "\\v{z}"], ["τ", "tau"],
    ["“", "``"], ["”", "''"], ["’", "'"], ["–", "--"], ["—", "---"],
  ]);
  const placeholders = [];
  let output = String(value ?? "").replaceAll("$τ$", "tau").replace(/[çèéëíöøüćčžτ“”’–—]/g, (character) => {
    const marker = `@@TEX${placeholders.length}@@`;
    placeholders.push(unicode.get(character));
    return marker;
  });
  output = output
    .replaceAll("\\", "\\textbackslash{}")
    .replaceAll("&", "\\&")
    .replaceAll("%", "\\%")
    .replaceAll("$", "\\$")
    .replaceAll("#", "\\#")
    .replaceAll("_", "\\_")
    .replaceAll("{", "\\{")
    .replaceAll("}", "\\}");
  placeholders.forEach((replacement, index) => {
    output = output.replace(`@@TEX${index}@@`, replacement);
  });
  return output;
}

function manuscriptRecord(record) {
  return record.occurrences?.some((occurrence) => occurrence.file !== "companion catalog");
}

function formatAuthors(authors) {
  if (!authors?.length) return "Anonymous";
  const selected = authors.length > 8 ? [...authors.slice(0, 8), "et al."] : authors;
  return selected.map(texText).join(", ");
}

function referenceSortKey(reference) {
  const lead = reference.sortAuthor ?? reference.authors?.[0] ?? reference.organization ?? "";
  const normalizedLead = lead.replace(/\s+et al\.$/i, "");
  const words = normalizedLead.trim().split(/\s+/);
  const surname = words.length > 1 ? words.at(-1) : normalizedLead;
  return `${surname} ${normalizedLead} ${reference.year ?? ""} ${reference.title}`.toLocaleLowerCase();
}

function renderReferences(audit) {
  const references = [];
  for (const record of audit.arxiv.filter(manuscriptRecord)) {
    const journalOverride = record.id === "2109.05067"
      ? { year: "2022", prefix: "Computer Law \\& Security Review, 45, 105681. " }
      : { year: record.metadata.published.slice(0, 4), prefix: "" };
    references.push({
      key: `arxiv-${record.id.replaceAll(".", "-")}`,
      authors: record.metadata.authors,
      year: journalOverride.year,
      title: record.metadata.title,
      locator: `${journalOverride.prefix}arXiv:${record.id}. \\url{https://arxiv.org/abs/${record.id}}`,
    });
  }
  for (const record of audit.dois.filter(manuscriptRecord)) {
    references.push({
      key: `doi-${record.doi.replace(/[^a-z0-9]+/gi, "-").replace(/-$/, "")}`,
      authors: record.authors,
      year: record.published.slice(0, 4),
      title: record.title,
      locator: `DOI: \\url{${record.url}}`,
    });
  }

  const webMetadata = {
    "https://addyo.substack.com/p/long-running-agents": ["Addy Osmani", "2026", "Long-running agents", "Elevate"],
    "https://blog.cloudflare.com/introducing-agent-memory/": ["Tyson Trautmann and Rob Sutter", "2026", "Agents that remember: introducing Agent Memory", "Cloudflare Blog"],
    "https://cursor.com/blog/dynamic-context-discovery": ["Cursor", "2026", "Dynamic context discovery", "Cursor Blog"],
    "https://devops.com/when-should-a-devops-agent-act-without-human-approval/": ["Bala Priya C", "2026", "When should a DevOps agent act without human approval?", "DevOps.com"],
    "https://github.com/sjarmak/engineering-reliable-coding-agents": ["Stephanie Jarmak", "2026", "Engineering Reliable Coding Agents: manuscript and companion repository", "GitHub repository"],
    "https://github.com/sjarmak/engineering-reliable-coding-agents/blob/main/protocols/minimum-reliability-pass.md": ["Stephanie Jarmak", "2026", "Minimum reliability pass", "Engineering Reliable Coding Agents protocol"],
    "https://github.com/sjarmak/engineering-reliable-coding-agents/blob/main/protocols/evaluation-comparison.md": ["Stephanie Jarmak", "2026", "Evaluation comparison protocol", "Engineering Reliable Coding Agents protocol"],
    "https://github.com/sjarmak/engineering-reliable-coding-agents/blob/main/protocols/authority-boundary-test.md": ["Stephanie Jarmak", "2026", "Authority-boundary test", "Engineering Reliable Coding Agents protocol"],
    "https://github.com/sjarmak/engineering-reliable-coding-agents/blob/main/protocols/recovery-fault-injection.md": ["Stephanie Jarmak", "2026", "Recovery fault-injection protocol", "Engineering Reliable Coding Agents protocol"],
    "https://github.com/sjarmak/engineering-reliable-coding-agents/blob/main/protocols/failure-trace-review.md": ["Stephanie Jarmak", "2026", "Failure-trace review", "Engineering Reliable Coding Agents protocol"],
    "https://github.com/sjarmak/engineering-reliable-coding-agents/blob/main/protocols/allocation-policy-replay.md": ["Stephanie Jarmak", "2026", "Allocation-policy replay", "Engineering Reliable Coding Agents protocol"],
    "https://github.com/sjarmak/codeprobe": ["Stephanie Jarmak", "2026", "CodeProbe", "GitHub repository"],
    "https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html": ["Birgitta Bockeler", "2026", "Harness engineering for coding agent users", "martinfowler.com"],
    "https://netflixtechblog.com/how-temporal-powers-reliable-cloud-operations-at-netflix-73c69ccb5953": ["Jacob Meyers and Rob Zienert", "2025", "How Temporal powers reliable cloud operations at Netflix", "Netflix Technology Blog"],
    "https://newsletter.pragmaticengineer.com/p/evals": ["Gergely Orosz and Hamel Husain", "2025", "A pragmatic guide to LLM evals for devs", "The Pragmatic Engineer"],
    "https://openai.com/index/separating-signal-from-noise-coding-evaluations/": ["OpenAI", "2026", "Separating signal from noise in coding evaluations", "OpenAI"],
    "https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified": ["OpenAI", "2026", "Why we no longer evaluate SWE-bench Verified", "OpenAI"],
    "https://scixplorer.org/scixabout/": ["Smithsonian Astrophysical Observatory", "2026", "About SciX", "NASA Science Explorer"],
    "https://scixplorer.org/scixhelp/api-scix/": ["NASA Science Explorer", "2026", "SciX API", "NASA Science Explorer documentation"],
    "https://tech.instacart.com/blueberry-force-multiplier-for-the-on-call-engineer-98c446dfcc12": ["Karthik Halukurike et al.", "2026", "Blueberry: force multiplier for the on-call engineer", "Instacart Tech"],
    "https://www.amplifypartners.com/blog-posts/how-hightouch-built-their-long-running-agent-harness": ["Amplify Partners", "2026", "How Hightouch built its long-running agent harness", "Amplify Partners"],
    "https://www.infoq.com/news/2026/03/stripe-autonomous-coding-agents/": ["InfoQ", "2026", "Stripe uses autonomous coding agents to generate over 1,300 pull requests per week", "InfoQ"],
    "https://www.morling.dev/blog/building-durable-execution-engine-with-sqlite/": ["Gunnar Morling", "2025", "Building a durable execution engine with SQLite", "morling.dev"],
    "https://www.reddit.com/r/compsci/comments/1rqcmu8/": ["Bytesfortruth", "2026", "Lending-domain benchmark account", "Reddit, r/compsci"],
    "https://www.reddit.com/r/devops/comments/1tbbls4/": ["Upstairs_Safe2922", "2026", "AI agent wiped Railway DB in 9 seconds", "Reddit, r/devops"],
    "https://www.reddit.com/r/devops/comments/1touxz4/": ["Prateek Jain", "2026", "Harness engineering: the new DevOps layer for AI agents", "Reddit, r/devops"],
    "https://www.reddit.com/r/LLMDevs/comments/1q7avil/": ["saurabhjain1592", "2026", "What actually broke when we put AI agents into real production workflows", "Reddit, r/LLMDevs"],
    "https://web.archive.org/web/20260806014103/https://www.reddit.com/r/LLMDevs/comments/1q7avil/what_actually_broke_when_we_put_ai_agents_into/": ["Internet Archive", "2026", "Archived snapshot of the LLMDevs production-workflow account", "Wayback Machine"],
    "https://web.archive.org/web/20260806014121/https://www.reddit.com/r/devops/comments/1tbbls4/ai_agent_wiped_railway_db_in_9_seconds_how_do_you/": ["Internet Archive", "2026", "Archived snapshot of the DevOps destructive-agent account", "Wayback Machine"],
    "https://sjarmak.ai/books/engineering-reliable-coding-agents": ["Stephanie Jarmak", "2026", "Engineering Reliable Coding Agents: web edition", "sjarmak.ai"],
    "https://sjarmak.ai/books/engineering-reliable-coding-agents/companion": ["Stephanie Jarmak", "2026", "Engineering Reliable Coding Agents: companion catalog", "sjarmak.ai"],
    "https://www.sjarmak.ai/projects/code-intelligence-digest": ["Stephanie Jarmak", "2026", "Code Intelligence Digest", "sjarmak.ai"],
  };
  for (const record of audit.urls.filter(manuscriptRecord)) {
    if (record.url.includes("w3.org/1998/Math/MathML")) continue;
    const metadata = webMetadata[record.url];
    if (!metadata) throw new Error(`Missing bibliography metadata for ${record.url}`);
    const [author, year, title, publication] = metadata;
    references.push({
      key: `web-${references.length + 1}`,
      authors: [author],
      sortAuthor: author === "Amplify Partners" ? "Amplify" : author,
      year,
      title,
      locator: `${texText(publication)}. \\url{${record.url}}`,
    });
  }

  references.push(
    {
      key: "suryana-2025",
      authors: ["L. E. Suryana", "S. Nordhoff", "S. Calvert", "A. Zgonnikov", "B. van Arem"],
      year: "2025",
      title: "Meaningful human control of partially automated driving systems: insights from interviews with Tesla users",
      locator: "Transportation Research Part F: Traffic Psychology and Behaviour, 113, 213--236.",
    },
    {
      key: "push-to-prod-2026",
      authors: ["Matthew Hawthorne"],
      year: "2026",
      title: "My AI agent said it was done. It hadn't done anything",
      locator: "Push to Prod newsletter, February 17, 2026. \\url{https://pushtoprod.substack.com/archive}",
    },
    {
      key: "openai-swe-bench-verified-2024",
      organization: "OpenAI",
      year: "2024",
      title: "Introducing SWE-bench Verified",
      locator: "\\url{https://openai.com/index/introducing-swe-bench-verified/}",
    },
    {
      key: "owasp-llm-top-10",
      organization: "OWASP Foundation",
      year: "2025",
      title: "OWASP Top 10 for LLM applications 2025",
      locator: "\\url{https://genai.owasp.org/llm-top-10/}",
    },
    {
      key: "jarmak-retrieval-systems-2026",
      authors: ["Stephanie Jarmak"],
      year: "2026",
      title: "Two retrieval systems write this site",
      locator: "\\url{https://sjarmak.ai/writing/two-retrieval-systems-write-this-site/}",
    },
    {
      key: "jarmak-slack-agent-city-2026",
      authors: ["Stephanie Jarmak"],
      year: "2026",
      title: "Running my own agent city on Slack",
      locator: "\\url{https://sjarmak.ai/writing/slack-as-my-agent-orchestration-interface/}",
    },
  );

  references.sort((left, right) => referenceSortKey(left).localeCompare(referenceSortKey(right)));
  const items = references.map((reference) => {
    const authors = reference.organization ? texText(reference.organization) : formatAuthors(reference.authors);
    const normalizedTitle = reference.title.replace(/^"Sampling"' as/, "Sampling as").trim();
    const title = texText(normalizedTitle);
    const punctuation = /[.!?]$/.test(title) ? "" : ".";
    return `\\bibitem{${reference.key}} ${authors} (${reference.year}). ${title}${punctuation} ${reference.locator}`;
  });
  return {
    count: references.length,
    latex: `\\begin{thebibliography}{999}\n\\addcontentsline{toc}{chapter}{References}\n${items.join("\n\n")}\n\\end{thebibliography}\n`,
  };
}

function assertSourcesAreEndmatter(latex, sourceName) {
  const marker = "\\section*{Sources and evidence}";
  const markerIndex = latex.indexOf(marker);
  if (markerIndex === -1) throw new Error(`Missing unnumbered chapter-end sources in ${sourceName}`);
  const sources = latex.slice(markerIndex + marker.length);
  if (/\\(?:sub)*section\*?\{/.test(sources)) {
    throw new Error(`Section heading found inside chapter-end sources in ${sourceName}`);
  }
}

async function pandocConvert(markdown, outputPath) {
  const inputPath = path.join(buildRoot, `${path.basename(outputPath, ".tex")}.md`);
  await writeFile(inputPath, markdown);
  await run(pandoc, [
    ...(pandocDataDir ? [`--data-dir=${pandocDataDir}`] : []),
    inputPath,
    "--from=markdown+raw_html+raw_tex+pipe_tables+autolink_bare_uris",
    "--to=latex",
    "--wrap=preserve",
    "--no-highlight",
    `--output=${outputPath}`,
  ]);
  const generated = await readFile(outputPath, "utf8");
  const metricsTypeset = generated.replace(
    /\\href\{mailto:((?:pass|Pass|Recall|Precision)@(k|\d+))\}\{\\nolinkurl\{\1\}\}/g,
    (_match, metric, suffix) => {
      const name = metric.slice(0, metric.indexOf("@"));
      return `\\(\\mathrm{${name}}@${suffix}\\)`;
    },
  );
  await writeFile(
    outputPath,
    metricsTypeset
      .replaceAll("č", "\\v{c}")
      .replace(/\\includegraphics\[([^\]]+)\]\{/g, "\\includegraphics[$1,keepaspectratio]{")
      .replaceAll("\\begin{figure}", "\\begin{figure}[htbp]"),
  );
}

async function main() {
  const referenceAudit = JSON.parse(await readFile(referenceAuditPath, "utf8"));
  const references = renderReferences(referenceAudit);
  const figureSources = (await readdir(figureSourceRoot))
    .filter((file) => file.endsWith(".svg"))
    .sort();
  if (figureSources.length !== expectedFigureCount) {
    throw new Error(`Expected ${expectedFigureCount} authoritative SVG figures, found ${figureSources.length}`);
  }

  await rm(sourceRoot, { recursive: true, force: true });
  await rm(buildRoot, { recursive: true, force: true });
  await mkdir(chapterRoot, { recursive: true });
  await mkdir(figureRoot, { recursive: true });
  await mkdir(buildRoot, { recursive: true });
  for (const name of figureSources) {
    await run(rsvgConvert, [
      "--format=pdf1.5",
      `--output=${path.join(figureRoot, name.replace(/\.svg$/, ".pdf"))}`,
      path.join(figureSourceRoot, name),
    ]);
  }

  const introduction = preprocessMarkdown(
    await readFile(path.join(editorialRoot, "introduction.md"), "utf8"),
    { introduction: true },
  );
  await pandocConvert(introduction, path.join(sourceRoot, "frontmatter.tex"));
  const frontmatterBody = await readFile(path.join(sourceRoot, "frontmatter.tex"), "utf8");
  await writeFile(path.join(sourceRoot, "frontmatter.tex"), `\\chapter*{Introduction}\n\\addcontentsline{toc}{chapter}{Introduction}\n${frontmatterBody}`);

  const inputLines = [];
  let chapterNumber = 1;
  for (const [partIndex, [partTitle, chapters]] of parts.entries()) {
    inputLines.push(
      `\\part{${texEscape(partTitle)}}\n\\gdef\\currentparttitle{${texEscape(partRunningTitles[partIndex])}}`,
    );
    for (const [file, title] of chapters) {
      const stem = `ch${String(chapterNumber).padStart(2, "0")}-${path.basename(file, ".md")}`;
      const markdown = preprocessMarkdown(await readFile(path.join(editorialRoot, file), "utf8"));
      const outputPath = path.join(chapterRoot, `${stem}.tex`);
      await pandocConvert(markdown, outputPath);
      const body = await readFile(outputPath, "utf8");
      assertSourcesAreEndmatter(body, file);
      await writeFile(outputPath, `\\chapter{${texEscape(title)}}\n\\label{${stem}}\n${body}`);
      inputLines.push(`\\input{chapters/${stem}}`);
      chapterNumber += 1;
    }
  }

  const closingStem = "closing";
  const closing = preprocessMarkdown(await readFile(path.join(editorialRoot, "closing.md"), "utf8"));
  await pandocConvert(closing, path.join(chapterRoot, `${closingStem}.tex`));
  const closingBody = await readFile(path.join(chapterRoot, `${closingStem}.tex`), "utf8");
  assertSourcesAreEndmatter(closingBody, "closing.md");
  await writeFile(path.join(chapterRoot, `${closingStem}.tex`), `\\chapter{Closing: the evidence chain behind reliable agents}\n\\label{closing-evidence-chain}\n${closingBody}`);
  inputLines.push("\\gdef\\currentparttitle{Closing}\n\\input{chapters/closing}");

  const glossaryStem = "glossary";
  const glossary = preprocessMarkdown(
    await readFile(path.join(editorialRoot, "glossary.md"), "utf8"),
    { sourcesEndmatter: false },
  );
  await pandocConvert(glossary, path.join(chapterRoot, `${glossaryStem}.tex`));
  const glossaryBody = await readFile(path.join(chapterRoot, `${glossaryStem}.tex`), "utf8");
  await writeFile(path.join(chapterRoot, `${glossaryStem}.tex`), `\\chapter*{Glossary}\n\\addcontentsline{toc}{chapter}{Glossary}\n${glossaryBody}`);

  await writeFile(path.join(sourceRoot, "abstract.tex"), "AI coding agents are commonly evaluated as models but deployed as systems whose behavior also depends on evaluation harnesses, execution state, retrieval, permissions, review interfaces, and resource allocation. This technical review and engineering monograph examines reliability at those system boundaries. A structured multivocal search, bounded update audit, and software-engineering coverage probe assembled 138 scholarly works, 91 practitioner records, 29 benchmark records, and 17 author-system case records. Sources were screened through stated inclusion and exclusion criteria, assigned claim-scoped quality assessments, and challenged through targeted audits; ambiguous classifications defaulted to the lower group. The study contributes an evidence ledger, a versioned catalog of 192 practice records with 55 developed in depth, a dependency chain and repair asymmetry across evaluation and operation, scoped measurements and failure cases from author-operated systems, runnable protocols, and five reusable skills with evidence maps. The search is structured rather than exhaustive. Publisher-native ACM, IEEE, and Scopus searching and blinded external calibration of a 20-practice sample remain release gates for archival v1. Evidence is uneven across topics, capability results remain time- and workload-dependent, and author-system cases are illustrations rather than independent external evidence.\n");

  await writeFile(path.join(sourceRoot, "references.tex"), references.latex);

  await writeFile(path.join(sourceRoot, "materials.tex"), `The version-controlled manuscript source and companion research artifact are available at \\url{${repositoryUrl}}. The companion contains the machine-readable 192-record practice catalog, evidence ledger, chapter crosswalk, benchmark catalog, schemas, source snapshots, thread protocols and source identities, update-screening decisions, software-engineering coverage probe, blinded external-grading packet, provenance record, and checksums. The repository also packages six named runnable protocols and five reusable agent skills derived from selected practices, with practice-level evidence maps; these workflows are implementation artifacts rather than independent evidence. A browser-based catalog is available at \\url{https://sjarmak.ai/books/engineering-reliable-coding-agents/companion}, and the web edition is available at \\url{https://sjarmak.ai/books/engineering-reliable-coding-agents}. The final replication package should be archived with a DOI; no archival DOI had been assigned when this release candidate was prepared. The evidence ledger is scheduled for annual review, with out-of-cycle releases for material factual or citation corrections. The 199-trace diagnostic corpus, the 1,286-item fleet ledger, and the 370-task retrieval evaluation are not redistributed. They contain private repository material, service and operational identifiers, prompts or tool outputs, and third-party task content that was not collected with redistribution consent. De-identification would remove state and grouping information required to audit the reported causal and dependence structure. Their aggregate results are therefore identified in the text as author-system illustrations rather than independently reproducible external evidence.\n`);

  await writeFile(path.join(sourceRoot, "00README"), `Top-level file: main.tex\nEngine: pdfLaTeX\nPrepared for arXiv from the verified August 6, 2026 chapter revisions.\nThe archive contains only TeX source, ${references.count} full reference entries, and the ${expectedFigureCount} required PDF figures.\nCanonical project repository: ${repositoryUrl}\nThe companion research artifact is released and archived separately.\n`);

  const mainTex = `\\documentclass[11pt,oneside]{book}

\\usepackage[letterpaper,margin=1in]{geometry}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{lmodern}
\\usepackage{microtype}
\\usepackage{textcomp}
\\usepackage{graphicx}
\\usepackage{amsmath}
\\usepackage{longtable}
\\usepackage{booktabs}
\\usepackage{array}
\\usepackage{calc}
\\usepackage{enumitem}
\\usepackage{needspace}
\\usepackage{fancyvrb}
\\usepackage{upquote}
\\usepackage[htt]{hyphenat}
\\usepackage{xcolor}
\\usepackage{xurl}
\\usepackage{fancyhdr}
\\usepackage[hidelinks,breaklinks=true]{hyperref}

\\hypersetup{
  pdftitle={Engineering Reliable Coding Agents},
  pdfauthor={Stephanie Jarmak},
  pdfsubject={Evaluation, operation, and governance of AI coding-agent systems}
}

\\setlength{\\emergencystretch}{6em}
\\setlength{\\parindent}{1.25em}
\\setlength{\\parskip}{0.14\\baselineskip plus 0.04\\baselineskip minus 0.03\\baselineskip}
\\setcounter{secnumdepth}{2}
\\setcounter{tocdepth}{1}
\\makeatletter
\\renewcommand*\\l@section{\\@dottedtocline{1}{1.5em}{3.3em}}
\\renewcommand*{\\@pnumwidth}{2.2em}
\\makeatother
\\setlist{
  topsep=0.62\\baselineskip,
  partopsep=0.18\\baselineskip,
  itemsep=0.16\\baselineskip,
  parsep=0.04\\baselineskip
}
\\setcounter{topnumber}{3}
\\setcounter{bottomnumber}{2}
\\setcounter{totalnumber}{4}
\\renewcommand{\\topfraction}{0.90}
\\renewcommand{\\bottomfraction}{0.80}
\\renewcommand{\\textfraction}{0.08}
\\renewcommand{\\floatpagefraction}{0.72}
\\setlength{\\textfloatsep}{0.80\\baselineskip plus 0.20\\baselineskip minus 0.10\\baselineskip}
\\setlength{\\intextsep}{0.80\\baselineskip plus 0.20\\baselineskip minus 0.10\\baselineskip}
\\setlength{\\floatsep}{0.65\\baselineskip plus 0.15\\baselineskip minus 0.10\\baselineskip}
\\setlength{\\abovecaptionskip}{0.45\\baselineskip}
\\setlength{\\belowcaptionskip}{0.15\\baselineskip}
\\fvset{fontsize=\\small}
\\newcommand{\\currentparttitle}{}
\\providecommand{\\partmark}[1]{}
\\renewcommand{\\partmark}[1]{\\gdef\\currentparttitle{#1}}
\\renewcommand{\\chaptermark}[1]{\\markboth{Chapter \\thechapter}{}}
\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{\\small\\nouppercase{\\leftmark}}
\\fancyhead[R]{\\small\\nouppercase{\\currentparttitle}}
\\fancyfoot[C]{\\thepage}
\\renewcommand{\\headrulewidth}{0.3pt}
\\fancypagestyle{plain}{\\fancyhf{}\\fancyfoot[C]{\\thepage}\\renewcommand{\\headrulewidth}{0pt}}

\\providecommand{\\tightlist}{%
  \\setlength{\\itemsep}{0.16\\baselineskip}\\setlength{\\parskip}{0.04\\baselineskip}}
\\newcommand{\\pandocbounded}[1]{%
  \\begingroup
  \\setbox0=\\hbox{#1}%
  \\ifdim\\wd0>\\linewidth
    \\resizebox{\\linewidth}{!}{\\box0}%
  \\else
    \\box0
  \\fi
  \\endgroup}

\\begin{document}
\\frontmatter

\\begin{titlepage}
  \\centering
  \\vspace*{0.16\\textheight}
  {\\Huge\\bfseries Engineering Reliable Coding Agents\\par}
  \\vspace{1.2em}
  {\\Large Evaluation, Recovery, Context, and Control Beyond the Model\\par}
  \\vspace{2.5em}
  {\\large Stephanie Jarmak\\par}
  \\vfill
  {\\large Version 1.0.0-rc.12 --- August 2026\\par}
\\end{titlepage}

\\chapter*{Abstract}
\\addcontentsline{toc}{chapter}{Abstract}
\\input{abstract}

\\tableofcontents
\\listoffigures
\\listoftables
\\input{frontmatter}

\\mainmatter
${inputLines.join("\n\n")}

\\backmatter
\\markboth{Reference material}{}
\\gdef\\currentparttitle{}
\\input{chapters/glossary}
\\renewcommand{\\bibname}{References}
\\input{references}

\\chapter*{Data and materials availability}
\\addcontentsline{toc}{chapter}{Data and materials availability}
\\input{materials}

\\end{document}
`;
  await writeFile(path.join(sourceRoot, "main.tex"), mainTex);

  await run(tectonic, ["--keep-logs", "--keep-intermediates", "main.tex"], { cwd: sourceRoot, maxBuffer: 20 * 1024 * 1024 });
  await copyFile(path.join(sourceRoot, "main.pdf"), previewPath);

  for (const name of ["main.aux", "main.log", "main.lof", "main.lot", "main.out", "main.pdf", "main.toc", "main.xdv", "main.synctex.gz"]) {
    await rm(path.join(sourceRoot, name), { force: true });
  }
  await rm(zipPath, { force: true });
  await run("zip", ["-X", "-q", "-r", zipPath, path.basename(sourceRoot)], { cwd: path.dirname(sourceRoot) });
  await rm(buildRoot, { recursive: true, force: true });
}

await main();
