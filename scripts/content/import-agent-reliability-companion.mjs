import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BOOK,
  BOOK_SOURCE,
} from "./agent-reliability-book-data.mjs";
import { renderAuthoredMath } from "./book-markdown.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PRACTICE_ID_MAP = JSON.parse(
  readFileSync(path.join(REPO_ROOT, "artifacts/arxiv/practice-id-map.json"), "utf8"),
);

export const COMPANION_SOURCE = path.join(BOOK_SOURCE, "COMPANION.md");

const EXPECTED_TOTALS = Object.freeze({
  chapterCount: 19,
  practiceCount: 206,
  taughtCount: 56,
  untaughtCount: 150,
});
const WEBSITE_INTRO_TITLE = "How to use this catalog";

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const renderStableChapterHeading = (_match, number, title) =>
  `<h2 id="chapter-${number}">Chapter ${number}: ${escapeHtml(title)}</h2>`;

const practiceIds = (text) =>
  [...text.matchAll(/^(?:`ERCA-\d{3}` · )?`([a-z0-9]+(?:-[a-z0-9]+)*)`$/gm)].map(
    (match) => match[1],
  );

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function addStablePracticeIds(body, slugs) {
  let taggedBody = body;
  for (const slug of slugs) {
    const existingTag = new RegExp(
      `^\`ERCA-\\d{3}\` · \`${escapeRegExp(slug)}\`$`,
      "m",
    );
    if (existingTag.test(taggedBody)) continue;
    const practiceId = PRACTICE_ID_MAP[slug];
    if (!practiceId) throw new Error(`Missing stable practice id for ${slug}`);
    const bare = new RegExp(`^\`${escapeRegExp(slug)}\`$`, "m");
    if (!bare.test(taggedBody)) throw new Error(`Could not tag companion entry ${slug}`);
    taggedBody = taggedBody.replace(bare, `\`${practiceId}\` · \`${slug}\``);
  }
  return taggedBody;
}

function addStablePracticeAnchors(body) {
  return body.replace(
    /^### (.+)\n\n(`ERCA-\d{3}` · `([a-z0-9]+(?:-[a-z0-9]+)*)`)$/gm,
    (_match, title, identifiers, slug) =>
      `### <a id="${slug}" href="#${slug}">${escapeHtml(title)}</a>\n\n${identifiers}`,
  );
}

export function analyzeCompanion(source) {
  const heading = source.match(/^# (.+)\n/);
  if (!heading) throw new Error("COMPANION.md must begin with one H1");

  const chapterMatches = [...source.matchAll(/^## Chapter (\d+): (.+)$/gm)];
  if (chapterMatches.length !== EXPECTED_TOTALS.chapterCount) {
    throw new Error(
      `COMPANION.md must contain ${EXPECTED_TOTALS.chapterCount} chapter sections, found ${chapterMatches.length}`,
    );
  }

  const chapters = chapterMatches.map((match, index) => {
    const number = Number(match[1]);
    if (number !== index + 1) {
      throw new Error(`Expected Chapter ${index + 1}, found Chapter ${number}`);
    }

    const end = chapterMatches[index + 1]?.index ?? source.length;
    const section = source.slice(match.index, end);
    const counts = section.match(
      /^(\d+) (?:taught|developed) in the chapter, (\d+) carried here\. (\d+) practices in total\.$/m,
    );
    if (!counts) throw new Error(`Chapter ${number} is missing its count statement`);

    const taughtCount = Number(counts[1]);
    const untaughtCount = Number(counts[2]);
    const totalCount = Number(counts[3]);
    const pointerMarker = section.indexOf("The following pointer entries");
    const compactMarker = section.indexOf("The following compact entries");
    if (
      totalCount > 0 &&
      (pointerMarker === -1 || compactMarker === -1 || compactMarker < pointerMarker)
    ) {
      throw new Error(`Chapter ${number} is missing its ordered practice groups`);
    }

    const taughtIds = totalCount === 0
      ? []
      : practiceIds(section.slice(pointerMarker, compactMarker));
    const untaughtIds = totalCount === 0 ? [] : practiceIds(section.slice(compactMarker));
    if (
      taughtIds.length !== taughtCount ||
      untaughtIds.length !== untaughtCount ||
      taughtCount + untaughtCount !== totalCount
    ) {
      throw new Error(
        `Chapter ${number} count mismatch: declared ${taughtCount}/${untaughtCount}/${totalCount}, found ${taughtIds.length}/${untaughtIds.length}`,
      );
    }

    return {
      number,
      title: match[2],
      taughtCount,
      untaughtCount,
      totalCount,
      practiceIds: [...taughtIds, ...untaughtIds],
    };
  });

  const ids = chapters.flatMap((chapter) => chapter.practiceIds);
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) throw new Error(`duplicate practice id: ${id}`);
    seen.add(id);
  }

  const taughtCount = chapters.reduce((sum, chapter) => sum + chapter.taughtCount, 0);
  const untaughtCount = chapters.reduce((sum, chapter) => sum + chapter.untaughtCount, 0);
  if (
    ids.length !== EXPECTED_TOTALS.practiceCount ||
    taughtCount !== EXPECTED_TOTALS.taughtCount ||
    untaughtCount !== EXPECTED_TOTALS.untaughtCount
  ) {
    throw new Error(
      `Companion totals must be ${EXPECTED_TOTALS.practiceCount}/${EXPECTED_TOTALS.taughtCount}/${EXPECTED_TOTALS.untaughtCount}, found ${ids.length}/${taughtCount}/${untaughtCount}`,
    );
  }

  return {
    introTitle: WEBSITE_INTRO_TITLE,
    chapters,
    practiceIds: ids,
    taughtCount,
    untaughtCount,
  };
}

export function transformCompanion(source) {
  const analysis = analyzeCompanion(source);
  const firstBreak = source.indexOf("\n");
  let body = firstBreak === -1 ? "" : source.slice(firstBreak + 1);
  if (body.startsWith("\n")) body = body.slice(1);
  body = body
    .replace(
      /^This human-readable edition presents all \d+ practices in chapter context\.[^\n]*\n\n/,
      "",
    )
    .replace(/^## Chapter (\d+): (.+)$/gm, renderStableChapterHeading)
    .replace(/\buntaught\b/gi, "companion-only")
    .replace(/\btaught\b/gi, "developed")
    .replace(/\bteaches\b/gi, "develops")
    .replace(/\bteaching\b/gi, "development");
  body = addStablePracticeAnchors(addStablePracticeIds(body, analysis.practiceIds));

  return {
    ...analysis,
    body: renderAuthoredMath(body),
  };
}

function frontmatter(companion) {
  const lines = [
    "---",
    'title: "Companion catalog"',
    `introTitle: ${JSON.stringify(companion.introTitle)}`,
    `book: ${BOOK.slug}`,
    `practiceCount: ${companion.practiceIds.length}`,
    `taughtCount: ${companion.taughtCount}`,
    `untaughtCount: ${companion.untaughtCount}`,
    "chapters:",
  ];

  for (const chapter of companion.chapters) {
    lines.push(
      `  - number: ${chapter.number}`,
      `    title: ${JSON.stringify(chapter.title)}`,
      `    taughtCount: ${chapter.taughtCount}`,
      `    untaughtCount: ${chapter.untaughtCount}`,
      `    totalCount: ${chapter.totalCount}`,
    );
  }
  lines.push("---");
  return lines.join("\n");
}

export function importCompanion({
  sourcePath = COMPANION_SOURCE,
  outputPath = path.join(
    REPO_ROOT,
    "src/content/book-companions",
    `${BOOK.slug}.md`,
  ),
} = {}) {
  const transformed = transformCompanion(readFileSync(sourcePath, "utf8"));
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${frontmatter(transformed)}\n\n${transformed.body}`);

  return {
    chapterCount: transformed.chapters.length,
    practiceCount: transformed.practiceIds.length,
    taughtCount: transformed.taughtCount,
    untaughtCount: transformed.untaughtCount,
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const result = importCompanion();
  process.stdout.write(
    `Imported ${result.practiceCount} companion practices across ${result.chapterCount} chapters.\n`,
  );
}
