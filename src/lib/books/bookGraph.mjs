const CHAPTER_HEADING = /^## Chapter (\d+): (.+)$/gm;
const PRACTICE_BLOCK = /^### (.+)\n\n(?:`(ERCA-\d{3})` · )?`([a-z0-9]+(?:-[a-z0-9]+)*)`\n\n([\s\S]*?)(?=\n### |\n## Chapter |$)/gm;
const MARKDOWN_LINK = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
const ARXIV_REFERENCE = /\barXiv:\s*(\d{4}\.\d{4,5})(?:v\d+)?\b/gi;
const DOI_REFERENCE = /\bDOI:\s*(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/gi;
const RAW_URL = /https?:\/\/[^\s<>)]+/g;

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

function trimUrlPunctuation(value) {
  return value.replace(/[.,;:]+$/g, "");
}

export function normalizeReferenceUrl(value) {
  const url = new URL(trimUrlPunctuation(value));
  url.protocol = "https:";
  url.hash = "";
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_")) url.searchParams.delete(key);
  }
  url.pathname = url.pathname.replace(/\/$/, "");
  if (url.hostname === "arxiv.org") {
    url.pathname = url.pathname
      .replace(/^\/pdf\//, "/abs/")
      .replace(/\.pdf$/i, "")
      .replace(/v\d+$/i, "");
  }
  return url.toString().replace(/\/$/, "");
}

function cleanCitation(markdown) {
  const text = markdown
    .replace(/<annotation[\s\S]*?<\/annotation>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*(?:[-*+]\s+|#{1,6}\s+)/, "")
    .replace(/^(?:lit|explorer|research|field)\/[a-z-]+:\s*/i, "")
    .replace(
      /^(?:strong evidence|directional evidence|corroborating (?:evidence|case)|corroboration(?:\s*\([^)]*\))?|author-system (?:case|artifact)|null or conflicting evidence):\s*/i,
      "",
    )
    .replace(/[`*_]/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= 320) return text;
  const shortened = text.slice(0, 319);
  return `${shortened.slice(0, shortened.lastIndexOf(" "))}…`;
}

function citationContext(source, position) {
  const lineStart = source.lastIndexOf("\n", position - 1) + 1;
  const nextBreak = source.indexOf("\n", position);
  const lineEnd = nextBreak < 0 ? source.length : nextBreak;
  const line = source.slice(lineStart, lineEnd).trim();
  if (/^[-*+]\s+/.test(line)) return cleanCitation(line);

  const paragraphStart = source.lastIndexOf("\n\n", position - 1) + 2;
  const paragraphBreak = source.indexOf("\n\n", position);
  const paragraphEnd = paragraphBreak < 0 ? source.length : paragraphBreak;
  const paragraph = source.slice(paragraphStart, paragraphEnd);
  const localPosition = position - paragraphStart;
  const prefix = paragraph.slice(0, localPosition);
  const sentenceBoundary = Math.max(
    prefix.lastIndexOf(". "),
    prefix.lastIndexOf("? "),
    prefix.lastIndexOf("! "),
  );
  const suffix = paragraph.slice(localPosition);
  const ending = suffix.search(/[.!?](?:\s|$)/);
  const start = sentenceBoundary < 0 ? 0 : sentenceBoundary + 2;
  const end = ending < 0 ? paragraph.length : localPosition + ending + 1;
  return cleanCitation(paragraph.slice(start, end));
}

function extractedCitationScore(reference) {
  let score = 0;
  if (/\b(?:arXiv|DOI):/i.test(reference.citation)) score += 100;
  return score + Math.min(reference.citation.length, 320) / 1_000;
}

export function extractReferencesFromMarkdown(source) {
  const candidates = [];
  const markdownUrlRanges = [];
  for (const match of source.matchAll(MARKDOWN_LINK)) {
    const position = match.index ?? 0;
    const urlOffset = match[0].indexOf(match[2]);
    markdownUrlRanges.push([position + urlOffset, position + urlOffset + match[2].length]);
    candidates.push({
      position,
      url: match[2],
      citation: citationContext(source, position),
    });
  }
  for (const match of source.matchAll(ARXIV_REFERENCE)) {
    const position = match.index ?? 0;
    candidates.push({
      position,
      url: `https://arxiv.org/abs/${match[1]}`,
      citation: citationContext(source, position),
    });
  }
  for (const match of source.matchAll(DOI_REFERENCE)) {
    const position = match.index ?? 0;
    candidates.push({
      position,
      url: `https://doi.org/${trimUrlPunctuation(match[1])}`,
      citation: citationContext(source, position),
    });
  }
  for (const match of source.matchAll(RAW_URL)) {
    const position = match.index ?? 0;
    if (markdownUrlRanges.some(([start, end]) => position >= start && position < end)) continue;
    if (match[0].includes("w3.org/1998/Math/MathML")) continue;
    candidates.push({
      position,
      url: match[0],
      citation: citationContext(source, position),
    });
  }

  const byUrl = new Map();
  for (const candidate of candidates.sort((left, right) => left.position - right.position)) {
    const url = normalizeReferenceUrl(candidate.url);
    const normalized = { ...candidate, url };
    const existing = byUrl.get(url);
    if (!existing || extractedCitationScore(normalized) > extractedCitationScore(existing)) {
      byUrl.set(url, normalized);
    }
  }
  return [...byUrl.values()];
}

function referenceKind(url) {
  const hostname = new URL(url).hostname;
  if (hostname === "arxiv.org" || hostname === "doi.org") return "paper";
  if (hostname === "github.com") return "repository";
  if (
    ["x.com", "twitter.com", "reddit.com", "rss.xcancel.com"].some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    )
  ) return "discussion";
  return "article";
}

function referenceIdentifier(url, kind) {
  const parsed = new URL(url);
  if (parsed.hostname === "arxiv.org") return `arXiv:${parsed.pathname.split("/").at(-1)}`;
  if (parsed.hostname === "doi.org") return `DOI:${parsed.pathname.slice(1)}`;
  if (kind === "repository") return `${parsed.hostname}${parsed.pathname}`;
  return parsed.hostname;
}

function referenceId(url) {
  let hash = 2166136261;
  for (let index = 0; index < url.length; index += 1) {
    hash ^= url.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `reference:${(hash >>> 0).toString(36)}`;
}

function citationScore(reference, sourceKind, sourceSectionStart) {
  let score = sourceKind === "chapter" ? 20 : 0;
  if (sourceSectionStart >= 0 && reference.position > sourceSectionStart) score += 100;
  if (/\b(?:arXiv|DOI):/i.test(reference.citation)) score += 10;
  if (/["“”]/.test(reference.citation)) score += 5;
  return score;
}

export function buildBookReferences({ bookId, chapters, companionSource }) {
  const rootHref = `/books/${bookId}`;
  const practiceMetadata = new Map(
    parseCompanionPractices(companionSource).map((practice) => [practice.id, practice]),
  );
  const chapterByNumber = new Map(
    chapters
      .filter((chapter) => chapter.kind === "chapter")
      .map((chapter) => [chapter.number, chapter]),
  );
  const sources = chapters.map((chapter) => {
    const numbered = chapter.kind === "chapter" && Number.isInteger(chapter.number);
    const label = numbered ? `Chapter ${chapter.number}: ${chapter.title}` : chapter.title;
    const sectionStart = chapter.source.indexOf("## Sources and evidence");
    return {
      sourceId: numbered ? `chapter:${chapter.number}` : `chapter:${chapter.id}`,
      sourceKind: "chapter",
      label,
      href: `${rootHref}/${chapter.id}${sectionStart >= 0 ? "#sources-and-evidence" : ""}`,
      part: chapter.part >= 1 && chapter.part <= 6 ? chapter.part : undefined,
      chapter: numbered ? chapter.number : undefined,
      source: chapter.source,
      sourceSectionStart: sectionStart,
    };
  });

  const practiceHeadings = [
    ...companionSource.matchAll(/^### (.+)\n\n(?:`(ERCA-\d{3})` · )?`([a-z0-9]+(?:-[a-z0-9]+)*)`/gm),
  ];
  for (let index = 0; index < practiceHeadings.length; index += 1) {
    const heading = practiceHeadings[index];
    const practice = practiceMetadata.get(heading[3]);
    if (!practice) throw new Error(`Missing companion metadata for ${heading[3]}`);
    const start = (heading.index ?? 0) + heading[0].length;
    const end = practiceHeadings[index + 1]?.index ?? companionSource.length;
    sources.push({
      sourceId: `practice:${practice.id}`,
      sourceKind: "practice",
      label: practice.title,
      href: `${rootHref}/companion#${practice.id}`,
      part: chapterByNumber.get(practice.chapter)?.part,
      chapter: practice.chapter,
      classification: practice.classification,
      source: companionSource.slice(start, end),
      sourceSectionStart: -1,
    });
  }

  const byUrl = new Map();
  for (const source of sources) {
    for (const extracted of extractReferencesFromMarkdown(source.source)) {
      const kind = referenceKind(extracted.url);
      const score = citationScore(extracted, source.sourceKind, source.sourceSectionStart);
      let reference = byUrl.get(extracted.url);
      if (!reference) {
        reference = {
          id: referenceId(extracted.url),
          url: extracted.url,
          citation: extracted.citation || referenceIdentifier(extracted.url, kind),
          identifier: referenceIdentifier(extracted.url, kind),
          kind,
          citationScore: score,
          citedBy: [],
        };
        byUrl.set(extracted.url, reference);
      } else if (score > reference.citationScore) {
        reference.citation = extracted.citation;
        reference.citationScore = score;
      }
      if (!reference.citedBy.some((location) => location.sourceId === source.sourceId)) {
        reference.citedBy.push({
          sourceId: source.sourceId,
          sourceKind: source.sourceKind,
          label: source.label,
          href: source.href,
          part: source.part,
          chapter: source.chapter,
          classification: source.classification,
        });
      }
    }
  }

  const references = [...byUrl.values()]
    .map(({ citationScore: _score, ...reference }) => reference)
    .sort((left, right) => left.citation.localeCompare(right.citation, "en"));
  if (new Set(references.map((reference) => reference.id)).size !== references.length) {
    throw new Error("Reference identifiers must be unique");
  }
  const count = (kind) => references.filter((reference) => reference.kind === kind).length;
  return {
    references,
    counts: {
      references: references.length,
      citations: references.reduce((total, reference) => total + reference.citedBy.length, 0),
      papers: count("paper"),
      articles: count("article"),
      repositories: count("repository"),
      discussions: count("discussion"),
    },
  };
}

export function parseCompanionPractices(source) {
  const headings = [...source.matchAll(CHAPTER_HEADING)];
  const practices = [];
  for (let index = 0; index < headings.length; index += 1) {
    const chapter = Number(headings[index][1]);
    const start = headings[index].index;
    const end = headings[index + 1]?.index ?? source.length;
    const section = source.slice(start, end);
    const practiceHeadingCount = [...section.matchAll(/^### /gm)].length;
    if (practiceHeadingCount === 0) continue;

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
      const summary = plainText(match[4]);
      if (!summary) throw new Error(`Practice ${match[3]} has no summary`);
      practices.push({
        id: match[3],
        practiceId: match[2] ?? match[3],
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
  const chapterCount = numberedChapters.length;
  for (let number = 1; number <= chapterCount; number += 1) {
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
