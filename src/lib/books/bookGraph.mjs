const CHAPTER_HEADING = /^## Chapter (\d+): (.+)$/gm;
const PRACTICE_BLOCK = /^### (.+)\n\n`([a-z0-9]+(?:-[a-z0-9]+)*)`\n\n([\s\S]*?)(?=\n### |\n## Chapter |$)/gm;

function plainText(markdown) {
  return markdown
    .split(/\n\s*\n/, 1)[0]
    .replace(/<annotation[\s\S]*?<\/annotation>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_]/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseCompanionPractices(source) {
  const headings = [...source.matchAll(CHAPTER_HEADING)];
  if (headings.length !== 18) {
    throw new Error(`Companion must contain 18 chapters; found ${headings.length}`);
  }

  const practices = [];
  for (let index = 0; index < headings.length; index += 1) {
    const chapter = Number(headings[index][1]);
    const start = headings[index].index;
    const end = headings[index + 1]?.index ?? source.length;
    const section = source.slice(start, end);
    const taughtMarker = section.indexOf("The following pointer entries");
    const untaughtMarker = section.indexOf("The following compact entries");
    if (taughtMarker < 0 || untaughtMarker < taughtMarker) {
      throw new Error(`Chapter ${chapter} is missing its taught or untaught group`);
    }

    const practiceHeadings = [...section.matchAll(/^### /gm)].length;
    const parsed = [...section.matchAll(PRACTICE_BLOCK)];
    if (practiceHeadings !== parsed.length) {
      throw new Error(`Chapter ${chapter} has a practice without a stable identifier`);
    }

    for (const match of parsed) {
      const position = match.index ?? 0;
      const summary = plainText(match[3]);
      if (!summary) throw new Error(`Practice ${match[2]} has no summary`);
      practices.push({
        id: match[2],
        title: plainText(match[1]),
        chapter,
        classification: position < untaughtMarker ? "taught" : "untaught",
        summary,
      });
    }
  }

  if (practices.length !== 192) {
    throw new Error(`Companion practice count must be 192; found ${practices.length}`);
  }
  if (new Set(practices.map((practice) => practice.id)).size !== practices.length) {
    throw new Error("Companion practice identifiers must be unique");
  }
  const taught = practices.filter((practice) => practice.classification === "taught").length;
  const untaught = practices.length - taught;
  if (taught !== 55 || untaught !== 137) {
    throw new Error(`Companion classification count must be 55 taught and 137 untaught; found ${taught} and ${untaught}`);
  }
  return practices;
}

export function buildBookGraph({ book, chapters, companionSource }) {
  const numberedChapters = chapters
    .filter((chapter) => chapter.kind === "chapter" && Number.isInteger(chapter.number))
    .sort((left, right) => left.number - right.number);
  if (numberedChapters.length !== 18) {
    throw new Error(`Book graph requires 18 chapters; found ${numberedChapters.length}`);
  }
  for (let number = 1; number <= 18; number += 1) {
    if (numberedChapters[number - 1]?.number !== number) {
      throw new Error(`Book graph is missing chapter ${number}`);
    }
  }

  const practices = parseCompanionPractices(companionSource);
  const chapterByNumber = new Map(numberedChapters.map((chapter) => [chapter.number, chapter]));
  const rootHref = `/books/${book.id}`;
  const nodes = [
    {
      id: `book:${book.id}`,
      kind: "book",
      label: book.title,
      summary: book.subtitle,
      href: rootHref,
    },
    ...book.parts.map((part) => ({
      id: `part:${part.number}`,
      kind: "part",
      label: `Part ${part.number}: ${part.title}`,
      summary: `${numberedChapters.filter((chapter) => chapter.part === part.number).length} chapters`,
      href: `${rootHref}#part-${part.number}`,
      part: part.number,
    })),
    ...numberedChapters.map((chapter) => ({
      id: `chapter:${chapter.number}`,
      kind: "chapter",
      label: `Chapter ${chapter.number}: ${chapter.title}`,
      summary: `${practices.filter((practice) => practice.chapter === chapter.number).length} practices`,
      href: `${rootHref}/${chapter.id}`,
      part: chapter.part,
      chapter: chapter.number,
    })),
    ...practices.map((practice) => ({
      id: `practice:${practice.id}`,
      kind: "practice",
      label: practice.title,
      summary: practice.summary,
      href: `${rootHref}/companion#${practice.id}`,
      part: chapterByNumber.get(practice.chapter)?.part,
      chapter: practice.chapter,
      classification: practice.classification,
    })),
  ];

  const edges = [
    ...book.parts.map((part) => ({
      id: `book-part:${part.number}`,
      source: `book:${book.id}`,
      target: `part:${part.number}`,
      kind: "book-part",
    })),
    ...numberedChapters.map((chapter) => ({
      id: `part-chapter:${chapter.number}`,
      source: `part:${chapter.part}`,
      target: `chapter:${chapter.number}`,
      kind: "part-chapter",
    })),
    ...practices.map((practice) => ({
      id: `chapter-practice:${practice.id}`,
      source: `chapter:${practice.chapter}`,
      target: `practice:${practice.id}`,
      kind: practice.classification === "taught" ? "chapter-teaches" : "chapter-carries",
    })),
  ];

  return {
    nodes,
    edges,
    counts: {
      books: 1,
      parts: book.parts.length,
      chapters: numberedChapters.length,
      practices: practices.length,
      taught: practices.filter((practice) => practice.classification === "taught").length,
      untaught: practices.filter((practice) => practice.classification === "untaught").length,
    },
  };
}
