// Pure retrieval primitives for the three lanes. No IO, no Astro.
// BM25 (lexical), dot product over normalized vectors (semantic), and
// Reciprocal Rank Fusion (the fused lane) — the same RRF used in
// scix_experiments/src/scix/search.py:rrf_fuse (k=60).

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "are", "was", "were",
  "but", "not", "you", "your", "our", "their", "its", "into", "over", "than",
  "then", "they", "them", "what", "which", "how", "why", "who", "can", "could",
  "would", "should", "about", "across", "via", "use", "uses", "using", "used",
  "more", "most", "some", "such", "other", "one", "two", "have", "has", "had",
]);

export function tokenize(text: string): string[] {
  const matches = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return matches.filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

export interface Scored {
  id: string;
  score: number;
}

interface Bm25Doc {
  id: string;
  tokens: string[];
}

export interface Bm25Index {
  docs: Bm25Doc[];
  df: Map<string, number>;
  avgLen: number;
  n: number;
}

export function buildBm25(docs: Bm25Doc[]): Bm25Index {
  const df = new Map<string, number>();
  let totalLen = 0;
  for (const doc of docs) {
    totalLen += doc.tokens.length;
    for (const term of new Set(doc.tokens)) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }
  return { docs, df, avgLen: totalLen / Math.max(docs.length, 1), n: docs.length };
}

/** BM25 scores for a query (token bag) against every doc except `excludeId`. */
export function bm25Query(
  index: Bm25Index,
  queryTokens: string[],
  excludeId: string,
  k1 = 1.5,
  b = 0.75,
): Scored[] {
  const queryTerms = new Set(queryTokens);
  const results: Scored[] = [];
  for (const doc of index.docs) {
    if (doc.id === excludeId) continue;
    const len = doc.tokens.length;
    const tf = new Map<string, number>();
    for (const t of doc.tokens) if (queryTerms.has(t)) tf.set(t, (tf.get(t) ?? 0) + 1);
    let score = 0;
    for (const [term, freq] of tf) {
      const idf = Math.log(1 + (index.n - (index.df.get(term) ?? 0) + 0.5) / ((index.df.get(term) ?? 0) + 0.5));
      const denom = freq + k1 * (1 - b + (b * len) / index.avgLen);
      score += idf * ((freq * (k1 + 1)) / denom);
    }
    if (score > 0) results.push({ id: doc.id, score });
  }
  return results.sort((a, b) => b.score - a.score);
}

/** Dot product of two L2-normalized vectors == cosine similarity. */
export function dot(a: number[], b: number[]): number {
  let s = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) s += a[i] * b[i];
  return s;
}

/**
 * Semantic lane: rank every vectored id against a query vector (excluding
 * `excludeId`), best first. Id-agnostic like the other lanes — any id scheme
 * present in the baked vectors (`<collection>:<slug>`, `paper:<bibcode>`,
 * `concept:<slug>`) flows through and can be returned as a result.
 */
export function semanticQuery(
  vectors: Record<string, number[]>,
  queryVec: number[],
  excludeId: string,
): Scored[] {
  const results: Scored[] = [];
  for (const [id, vec] of Object.entries(vectors)) {
    if (id === excludeId) continue;
    results.push({ id, score: dot(queryVec, vec) });
  }
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Reciprocal Rank Fusion over several already-sorted rankings.
 * score(id) = sum over lanes of 1 / (k + rank), rank 0-based.
 */
export function rrf(rankings: Scored[][], k = 60): Scored[] {
  const fused = new Map<string, number>();
  for (const ranking of rankings) {
    ranking.forEach((item, rank) => {
      fused.set(item.id, (fused.get(item.id) ?? 0) + 1 / (k + rank));
    });
  }
  return [...fused.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
}
