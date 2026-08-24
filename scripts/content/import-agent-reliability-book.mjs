import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BOOK,
  BOOK_SOURCE,
} from "./agent-reliability-book-data.mjs";
import { renderAuthoredMath } from "./book-markdown.mjs";

export {
  BOOK,
  BOOK_SOURCE,
} from "./agent-reliability-book-data.mjs";
export { renderAuthoredMath } from "./book-markdown.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const PARTS = [
  { number: 1, title: "Evaluation measurement and experiment design" },
  { number: 2, title: "Evaluation and grading systems" },
  { number: 3, title: "Containment, durable execution, and recovery engineering" },
  { number: 4, title: "Context engineering: retrieval, budgets, and memory" },
  { number: 5, title: "Human review and accountability engineering" },
  { number: 6, title: "Work allocation and cost engineering" },
];

const chapter = (number, source, part) => ({
  source,
  slug: source.replace(/^ch\d+-/, "").replace(/\.md$/, ""),
  order: number,
  part,
  kind: "chapter",
  number,
});

export const CHAPTERS = [
  {
    source: "00-front-matter.md",
    slug: "introduction",
    order: 0,
    part: 0,
    kind: "introduction",
  },
  chapter(1, "ch01-variance-power-paired-comparisons.md", 1),
  chapter(2, "ch02-baselines-ablations-cost-accuracy.md", 1),
  chapter(3, "ch03-contamination-oracle-workload-validity.md", 1),
  chapter(4, "ch04-execution-correction-gates-release-tests.md", 2),
  chapter(5, "ch05-calibrating-model-graders-agreement-correctness.md", 2),
  chapter(6, "ch06-proxy-gaming-layered-signals.md", 2),
  chapter(7, "ch07-software-factory-distributed-system.md", 3),
  chapter(8, "ch08-isolation-injection-independent-verification.md", 3),
  chapter(9, "ch09-persistent-state-durable-workflows-idempotent-retries.md", 3),
  chapter(10, "ch10-replayable-traces-fault-injection-recovery.md", 3),
  chapter(11, "ch11-human-auditable-failure-analysis-taxonomy.md", 3),
  chapter(12, "ch12-measuring-designing-repository-retrieval.md", 4),
  chapter(13, "ch13-localization-funnels-repository-indexes-freshness-checks.md", 4),
  chapter(14, "ch14-usable-context-budgets-spec-restarts-file-output.md", 4),
  chapter(15, "ch15-cross-session-memory-raw-traces-compaction.md", 4),
  chapter(16, "ch16-verification-interfaces-risk-based-escalation.md", 5),
  chapter(17, "ch17-autonomy-provenance-gates-accountability.md", 5),
  chapter(18, "ch18-agent-topology-dynamic-task-allocation.md", 6),
  chapter(19, "ch19-cost-aware-fleet-scheduling-model-routing.md", 6),
  {
    source: "99-closing.md",
    slug: "closing",
    order: 20,
    part: 7,
    kind: "closing",
  },
];

const imagePattern = /^!\[(.*?)\]\(\.\/img\/([^)]+)\)$/gm;

export function transformManuscript(source, sourceName) {
  const firstBreak = source.indexOf("\n");
  const firstLine = firstBreak === -1 ? source : source.slice(0, firstBreak);
  const heading = firstLine.match(/^# (.+)$/);
  if (!heading) {
    throw new Error(`${sourceName} must begin with one H1`);
  }

  let body = firstBreak === -1 ? "" : source.slice(firstBreak + 1);
  if (body.startsWith("\n")) body = body.slice(1);

  const figures = [];
  body = body.replace(imagePattern, (_match, alt, name) => {
    if (!name.endsWith(".svg")) {
      throw new Error(`${sourceName} has unsupported manuscript image: ${name}`);
    }
    figures.push({ name, alt });
    return `![${alt}](/book-figures/${name})`;
  });

  if (body.includes("./img/")) {
    throw new Error(`${sourceName} has an unsupported or malformed manuscript image`);
  }

  body = renderAuthoredMath(body);

  return {
    title: heading[1],
    body,
    figures,
    figureCount: figures.length,
  };
}

function displayTitle(title, entry) {
  if (entry.kind !== "chapter") return title;
  return title.replace(/^Chapter \d+:\s*/, "");
}

function frontmatter(entry, title) {
  const lines = [
    "---",
    `title: ${JSON.stringify(displayTitle(title, entry))}`,
    `book: ${BOOK.slug}`,
    `order: ${entry.order}`,
    `part: ${entry.part}`,
    `kind: ${entry.kind}`,
  ];
  if (entry.number) lines.push(`number: ${entry.number}`);
  lines.push("---");
  return lines.join("\n");
}

function xmlText(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function svgTitle(svg, name) {
  const match = svg.match(/<title\s+id="[^"]+">([\s\S]*?)<\/title>/);
  if (!match) throw new Error(`${name} is missing its accessible title`);
  return xmlText(match[1]);
}

export function importBook({
  sourceDir = BOOK_SOURCE,
  contentDir = path.join(REPO_ROOT, "src/content/book-chapters", BOOK.slug),
  figureDir = path.join(REPO_ROOT, "src/assets/books", BOOK.slug),
} = {}) {
  mkdirSync(contentDir, { recursive: true });
  mkdirSync(figureDir, { recursive: true });

  const referencedFigures = new Set();
  let figureCount = 0;

  for (const entry of CHAPTERS) {
    const source = readFileSync(path.join(sourceDir, entry.source), "utf8");
    const transformed = transformManuscript(source, entry.source);
    for (const figure of transformed.figures) {
      const figurePath = path.join(sourceDir, "img", figure.name);
      const svg = readFileSync(figurePath, "utf8");
      const title = svgTitle(svg, figure.name);
      if (title !== figure.alt) {
        throw new Error(`${entry.source}: alt text differs from ${figure.name} title`);
      }
      copyFileSync(figurePath, path.join(figureDir, figure.name));
      referencedFigures.add(figure.name);
      figureCount += 1;
    }

    const output = `${frontmatter(entry, transformed.title)}\n\n${transformed.body}`;
    writeFileSync(path.join(contentDir, `${entry.slug}.md`), output);
  }

  const sourceFigures = readdirSync(path.join(sourceDir, "img"))
    .filter((name) => name.endsWith(".svg"))
    .sort();
  const referenced = [...referencedFigures].sort();
  if (JSON.stringify(sourceFigures) !== JSON.stringify(referenced)) {
    throw new Error("The manuscript SVG set does not exactly match the referenced figure set");
  }

  return { chapterCount: CHAPTERS.length, figureCount };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const result = importBook();
  process.stdout.write(
    `Imported ${result.chapterCount} book entries and ${result.figureCount} figures.\n`,
  );
}
