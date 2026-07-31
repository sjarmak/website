export type BookGraphNodeKind = "book" | "part" | "chapter" | "practice";
export type PracticeClassification = "taught" | "untaught";
export type BookGraphEdgeKind =
  | "book-part"
  | "part-chapter"
  | "chapter-teaches"
  | "chapter-carries";

export interface BookGraphNode {
  id: string;
  kind: BookGraphNodeKind;
  label: string;
  summary: string;
  href: string;
  part?: number;
  chapter?: number;
  classification?: PracticeClassification;
}

export interface BookGraphEdge {
  id: string;
  source: string;
  target: string;
  kind: BookGraphEdgeKind;
}

export interface BookGraphData {
  nodes: BookGraphNode[];
  edges: BookGraphEdge[];
  counts: {
    books: number;
    parts: number;
    chapters: number;
    practices: number;
    taught: number;
    untaught: number;
  };
}

export function parseCompanionPractices(source: string): Array<{
  id: string;
  title: string;
  chapter: number;
  classification: PracticeClassification;
  summary: string;
}>;

export function buildBookGraph(input: {
  book: {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    parts: Array<{ number: number; title: string }>;
  };
  chapters: Array<{
    id: string;
    title: string;
    kind: string;
    number?: number;
    part: number;
  }>;
  companionSource: string;
}): BookGraphData;
