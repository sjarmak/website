// Shared types for the knowledge hub (the "threads" + libraries feature).

export type NodeKind =
  | "project"
  | "writing"
  | "talk"
  | "learning"
  | "publication"
  | "paper";

/** The four retrieval lenses, plus their fused combination. */
export type Lane = "semantic" | "lexical" | "graph" | "recency" | "fused";

export interface KnowledgeNode {
  /** `${collection}:${slug}` for on-site content, `paper:${bibcode}` for papers. */
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

// ---- lit_explorers ----

export interface ExplorerSection {
  key: string;
  label: string;
  summary: string;
  count: number;
}

export interface ExplorerPaper {
  bibcode?: string;
  title: string;
  firstAuthor: string;
  year?: string;
  citationCount: number;
  arxiv?: string | null;
  url?: string | null;
}

export interface Explorer {
  id: string;
  title: string;
  /** One-line description, for parity with research-library cards. */
  blurb?: string;
  homepage: string;
  learningSlug: string;
  paperCount: number;
  themeCount: number;
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
  cadence: "daily" | "weekly" | "manual";
  origin: "auto" | "manual";
  date: Date;
  summary: string;
  topics: string[];
  audioUrl?: string;
  embedUrl?: string;
  durationSec?: number;
  items: DigestResource[];
  highlights: string[];
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
