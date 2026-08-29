// Shared types for the knowledge hub (the "threads" + libraries feature).

export type NodeKind =
  | "project"
  | "writing"
  | "talk"
  | "learning"
  | "publication"
  | "paper"
  | "concept";

/** The four retrieval lenses, plus their fused combination. */
export type Lane = "semantic" | "lexical" | "graph" | "recency" | "fused";

export interface KnowledgeNode {
  /** `${collection}:${slug}` on-site, `paper:${bibcode}` papers, `concept:${slug}` registry concepts. */
  id: string;
  kind: NodeKind;
  title: string;
  url: string;
  /** title + summary/abstract, used by the lexical lane. */
  text: string;
  /** Short label, e.g. "Project" or "2024 · 28 cites". */
  meta: string;
  external: boolean;
  /** Publication year, used by the recency lane. */
  year?: number;
}

export interface RelatedItem {
  id: string;
  title: string;
  url: string;
  kind: NodeKind;
  /** Lane-native score (cosine, BM25, edge weight, recency, or RRF). */
  score: number;
}

export type Related = Record<Lane, RelatedItem[]>;

export interface ReadingStop {
  node: KnowledgeNode;
  why: string;
}

// ---- ADS biblib libraries ----

export interface LibraryPaper {
  bibcode: string;
  title: string;
  firstAuthor: string;
  authorCount?: number;
  year?: number | string;
  pubdate?: string;
  doctype?: string;
  citationCount: number;
  abstract: string;
  adsUrl: string;
  arxiv?: string | null;
}

export interface Library {
  id: string;
  name: string;
  description: string;
  public: boolean;
  numDocuments: number;
  papers: LibraryPaper[];
}

// ---- thematic explorers (self-contained in src/data/knowledge/explorers/) ----

export interface ExplorerSection {
  key: string;
  label: string;
  summary: string;
  count: number;
  /** Key threads observed across the theme's papers. */
  themes?: string[];
  /** Open gaps / unresolved problems in the theme. */
  gaps?: string[];
  questions?: string[];
}

/** One stop on an explorer's suggested reading path. */
export interface ExplorerReadingStop {
  n: number;
  bibcode: string;
  title: string;
  url: string;
}

/** Reading stops grouped by phase, in order. */
export interface ExplorerReadingGroup {
  group: string;
  stops: ExplorerReadingStop[];
}

/** An open research opportunity surfaced by an explorer. */
export interface ExplorerOpportunity {
  title: string;
  description: string;
}

/** SciX-generated per-paper synthesis, normalized across explorers. */
export interface ExplorerPaperNote {
  /** Theme this note was written for. */
  branch: string;
  /** Plain-language key takeaway. */
  takeaway: string;
  /** Why the paper matters / its relevance. */
  why: string;
}

/**
 * Full-text 4-part synthesis, generated agentically from the paper's body via
 * the SciX MCP. Each field is grounded strictly in the retrieved text; a field
 * the source does not support is left empty rather than invented.
 */
export interface ExplorerPaperSynthesis {
  /** A jargon-free restatement of what the paper is and does. */
  plainAbstract: string;
  /** The problem and why it needed solving (the paper's motivation). */
  motivation: string;
  /** How the work was actually done (approach, system, experiments). */
  methodology: string;
  /** What the paper found or demonstrated (concrete outcomes). */
  results: string;
}

export interface ExplorerPaper {
  bibcode?: string;
  title: string;
  firstAuthor: string;
  year?: number | string;
  citationCount?: number;
  arxiv?: string | null;
  url?: string | null;
  branches?: string[];
  notes?: ExplorerPaperNote[];
  /** Full-text 4-part synthesis (joined at build time from paper-synthesis.json). */
  synthesis?: ExplorerPaperSynthesis;
}

export interface Explorer {
  id: string;
  title: string;
  /** One-line description, for parity with research-library cards. */
  blurb?: string;
  /**
   * Short description for <meta name="description"> and link previews, where
   * anything past ~160 characters is truncated. Falls back to blurb, so it is
   * only worth setting when the blurb is longer than that or reads as on-page
   * prose rather than a summary.
   */
  metaDescription?: string;
  homepage: string;
  learningSlug: string;
  paperCount: number;
  themeCount: number;
  /** Provenance for a collection curated by an external source. */
  source?: {
    name: string;
    url: string;
    note: string;
  };
  papers: ExplorerPaper[];
  sections: ExplorerSection[];
  /** Raw reading-order tuples: [bibcode, label, group]. */
  reading: unknown[];
  /** Raw opportunity tuples: [title, description] or strings. */
  opportunities: unknown[];
  practices: unknown[];
}

// ---- podcasts + digest ----

export interface PodcastEpisode {
  title: string;
  episode?: number;
  description: string;
  audioUrl?: string;
  embedUrl?: string;
  /** Series this episode belongs to, when it is part of one. */
  series?: string;
  /**
   * Explorer this episode is a companion to. Set means the episode belongs on
   * that explorer page in the library rather than in the digest's deep-dive
   * list, so the argument and the audio that teaches it live together.
   */
  explorer?: string;
  /** Page section this episode belongs to (e.g. "field-notes") instead of the deep-dive list. */
  hub?: string;
}

export interface PodcastSeries {
  name: string;
  episodes: PodcastEpisode[];
}

export interface DigestItem {
  bibcode: string;
  title: string;
  url: string;
  library: string;
  pubdate?: string;
  year?: number | string;
  citationCount: number;
}

// ---- digest library (generated + curated newsletter/podcast issues) ----

/** A single linked resource surfaced inside a digest issue. */
export interface DigestResource {
  title: string;
  url: string;
  source?: string;
  category?: string;
}

/**
 * One published digest issue (newsletter + optional podcast). Distinct from
 * `DigestItem`, which is a single paper row in the "what's new" stream.
 */
export interface DigestIssue {
  slug: string;
  title: string;
  cadence: "daily" | "weekly" | "monthly";
  /** "specialized" = the site's core topics; "general" = field-wide roundup. */
  track: "specialized" | "general";
  origin: "auto" | "manual";
  date: Date;
  summary: string;
  topics: string[];
  audioUrl?: string;
  embedUrl?: string;
  durationSec?: number;
  items: DigestResource[];
  highlights: string[];
  /**
   * Number of distinct linked resources in the issue. Uses `items` when the
   * frontmatter declares them (auto-pipeline issues), else counts the links in
   * the rendered body (hand-curated issues keep their links inline).
   */
  linkCount: number;
}

// ---- threads ----

export interface KnowledgeThread {
  id: string;
  question: string;
  status: string;
  take: string;
  concepts: string[];
  artifacts: KnowledgeNode[];
  papers: KnowledgeNode[];
  readingOrder: ReadingStop[];
  /** Resolved ADS libraries anchoring this thread. */
  libraries: Library[];
  /** Resolved lit_explorer, if any. */
  explorer: Explorer | null;
}

export interface KnowledgeGraph {
  threads: KnowledgeThread[];
  nodes: KnowledgeNode[];
  /** Per-node related lists, one ranking per lane. */
  related: Record<string, Related>;
}
