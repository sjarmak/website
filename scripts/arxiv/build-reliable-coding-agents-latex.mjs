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
const pandoc = process.env.RELIABLE_AGENTS_PANDOC ?? "/tmp/arxiv-tools/bin/pandoc";
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
  ["Work allocation and cost engineering", [
    ["agent-topology-dynamic-task-allocation.md", "Agent topology selection and dynamic task allocation"],
    ["cost-aware-fleet-scheduling-model-routing.md", "Cost-aware fleet scheduling and model routing"],
  ]],
];

function decodeXml(text) {
  return text
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"');
}

function preprocessMarkdown(source, { introduction = false } = {}) {
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
  let fenced = false;
  output = output
    .split("\n")
    .map((line) => {
      if (line.startsWith("```")) fenced = !fenced;
      return fenced ? line : line.replaceAll("pass^k", "pass^k^");
    })
    .join("\n");
  output = output.replace(/\(\/book-figures\/([a-z0-9-]+)\.svg\)/g, "(figures/$1.pdf)");
  if (introduction) output = output.slice(output.indexOf("## Problem and scope"));
  if (!introduction) {
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
  output = output.replace(/^### /gm, "## ").replace(/^## /gm, "# ");
  return output;
}

function texEscape(value) {
  return value.replaceAll("&", "\\&");
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
    inputPath,
    "--from=markdown+raw_html+raw_tex+pipe_tables+autolink_bare_uris",
    "--to=latex",
    "--wrap=preserve",
    "--no-highlight",
    `--output=${outputPath}`,
  ]);
  const generated = await readFile(outputPath, "utf8");
  await writeFile(
    outputPath,
    generated
      .replaceAll("č", "\\v{c}")
      .replaceAll("\\begin{figure}", "\\begin{figure}[htbp]"),
  );
}

async function main() {
  const figureSources = (await readdir(figureSourceRoot))
    .filter((file) => file.endsWith(".svg"))
    .sort();
  if (figureSources.length !== 19) {
    throw new Error(`Expected 19 authoritative SVG figures, found ${figureSources.length}`);
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
  for (const [partTitle, chapters] of parts) {
    inputLines.push(`\\part{${texEscape(partTitle)}}`);
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
  inputLines.push("\\input{chapters/closing}");

  await writeFile(path.join(sourceRoot, "abstract.tex"), "AI coding agents are commonly evaluated as models but deployed as systems whose behavior also depends on evaluation harnesses, execution state, retrieval, permissions, review interfaces, and resource allocation. This technical review synthesizes evidence about reliability at those system boundaries. The source base comprises 118 scholarly works organized into seven topic-specific review threads, 91 practitioner records, 29 benchmark records, and 17 author-system case records. Evidence is grouped as strong, directional, corroborating, or null and conflicting; high-strength synthesis claims were rechecked against their underlying sources. The study contributes an evidence audit, a catalog of 192 bounded practices with 55 developed in depth, a dependency chain across evaluation and operation, scoped measurements and failure cases from author-operated systems, and runnable protocols for local evaluation and fault testing. The review is structured rather than exhaustive, evidence is uneven across topics, and capability results remain time- and workload-dependent. Author-system cases are therefore reported as illustrations and are not treated as independent external evidence.\n");

  await writeFile(path.join(sourceRoot, "materials.tex"), `The companion research artifact contains the machine-readable 192-practice catalog, evidence ledger, chapter crosswalk, benchmark catalog, schemas, provenance record, and checksums. It is packaged separately so that it can be versioned and archived with its own DOI. The public companion catalog is available at \\url{https://sjarmak.ai/books/engineering-reliable-coding-agents/companion}. The archival DOI must be added to this statement and to the submission metadata before the public-review edition is frozen.\n`);

  await writeFile(path.join(sourceRoot, "00README"), "Top-level file: main.tex\nEngine: pdfLaTeX\nPrepared for arXiv from the verified August 5, 2026 chapter revisions.\nThe archive contains only TeX source and the 19 required PDF figures.\nThe companion research artifact is released and archived separately.\n");

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
\\usepackage{fancyvrb}
\\usepackage{upquote}
\\usepackage[htt]{hyphenat}
\\usepackage{xcolor}
\\usepackage{xurl}
\\usepackage[hidelinks,breaklinks=true]{hyperref}

\\hypersetup{
  pdftitle={Engineering Reliable Coding Agents},
  pdfauthor={Stephanie Jarmak},
  pdfsubject={Evaluation, operation, and governance of AI coding-agent systems}
}

\\setlength{\\emergencystretch}{6em}
\\setlength{\\parindent}{1.25em}
\\setlength{\\parskip}{0pt}
\\setcounter{secnumdepth}{2}
\\setcounter{tocdepth}{1}
\\setlist{
  topsep=0.45\\baselineskip,
  partopsep=0.12\\baselineskip,
  itemsep=0.12\\baselineskip,
  parsep=0pt
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
\\pagestyle{plain}

\\providecommand{\\tightlist}{%
  \\setlength{\\itemsep}{0.10\\baselineskip}\\setlength{\\parskip}{0pt}}
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
  {\\large Public review edition\\par}
  {\\large August 2026\\par}
  \\vspace{2em}
  {\\normalsize An evidence-grounded technical review of the evaluation, operation, and governance of AI coding-agent systems.\\par}
\\end{titlepage}

\\chapter*{Abstract}
\\addcontentsline{toc}{chapter}{Abstract}
\\input{abstract}

\\tableofcontents
\\input{frontmatter}

\\mainmatter
${inputLines.join("\n\n")}

\\backmatter
\\chapter*{Data and materials availability}
\\addcontentsline{toc}{chapter}{Data and materials availability}
\\input{materials}

\\end{document}
`;
  await writeFile(path.join(sourceRoot, "main.tex"), mainTex);

  await run(tectonic, ["--keep-logs", "--keep-intermediates", "main.tex"], { cwd: sourceRoot, maxBuffer: 20 * 1024 * 1024 });
  await copyFile(path.join(sourceRoot, "main.pdf"), previewPath);

  for (const name of ["main.aux", "main.log", "main.out", "main.pdf", "main.toc", "main.xdv", "main.synctex.gz"]) {
    await rm(path.join(sourceRoot, name), { force: true });
  }
  await rm(zipPath, { force: true });
  await run("zip", ["-X", "-q", "-r", zipPath, path.basename(sourceRoot)], { cwd: path.dirname(sourceRoot) });
  await rm(buildRoot, { recursive: true, force: true });
}

await main();
