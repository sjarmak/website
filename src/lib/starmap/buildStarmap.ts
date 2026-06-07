import { getCollection } from "astro:content";

export type StarKind = "project" | "writing" | "talk" | "publication" | "topic" | "learning";

export interface StarPoint {
  id: string;
  kind: StarKind;
  title: string;
  url: string;
  x: number;
  y: number;
}

export interface StarmapData {
  points: StarPoint[];
}

// ---- PRNG (mulberry32, deterministic, seeded) ----

function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Stopwords ----

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "it", "its", "this", "that", "as",
  "are", "was", "were", "be", "been", "being", "have", "has", "had",
  "do", "does", "did", "will", "would", "could", "should", "may", "might",
  "i", "we", "you", "he", "she", "they", "my", "our", "your", "their",
  "how", "what", "why", "when", "where", "who", "which", "than", "more",
  "also", "not", "no", "so", "up", "can", "into", "over", "after",
]);

function titleTokens(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function tokenBag(tokens: string[]): Set<string> {
  return new Set(tokens);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ---- SMACOF stress majorization MDS ----

function smacof(
  D: Float64Array,
  n: number,
  rand: () => number,
  iterations: number,
): { x: Float64Array; y: Float64Array } {
  const EPS = 1e-9;

  // seed initial positions on a unit circle + small jitter
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n;
    x[i] = Math.cos(angle) + (rand() - 0.5) * 0.1;
    y[i] = Math.sin(angle) + (rand() - 0.5) * 0.1;
  }

  for (let iter = 0; iter < iterations; iter++) {
    const nx = new Float64Array(n);
    const ny = new Float64Array(n);
    const w = new Float64Array(n); // row sums of weight matrix

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const dij = D[i * n + j];
        const dx = x[i] - x[j];
        const dy = y[i] - y[j];
        const dist = Math.sqrt(dx * dx + dy * dy);
        const safeDist = Math.max(dist, EPS);
        // weight = 1 / dij² (classical SMACOF); guard zero target distance
        const safeDij = Math.max(dij, EPS);
        const wij = 1 / (safeDij * safeDij);
        // B matrix contribution: wij * dij / dist * x[j]
        const ratio = (wij * dij) / safeDist;
        nx[i] += ratio * x[j];
        ny[i] += ratio * y[j];
        w[i] += wij;
      }
    }

    for (let i = 0; i < n; i++) {
      const wi = Math.max(w[i], EPS);
      x[i] = nx[i] / wi;
      y[i] = ny[i] / wi;
    }
  }

  return { x, y };
}

const EPS_RANGE = 1e-6;

function normalizeCoords(
  x: Float64Array,
  y: Float64Array,
  n: number,
): { x: number[]; y: number[] } {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    if (x[i] < minX) minX = x[i];
    if (x[i] > maxX) maxX = x[i];
    if (y[i] < minY) minY = y[i];
    if (y[i] > maxY) maxY = y[i];
  }
  const rangeX = Math.max(maxX - minX, EPS_RANGE);
  const rangeY = Math.max(maxY - minY, EPS_RANGE);
  const nx: number[] = [];
  const ny: number[] = [];
  // Leave a small margin so points don't sit on the edge
  const MARGIN = 0.04;
  for (let i = 0; i < n; i++) {
    nx.push(MARGIN + ((x[i] - minX) / rangeX) * (1 - 2 * MARGIN));
    ny.push(MARGIN + ((y[i] - minY) / rangeY) * (1 - 2 * MARGIN));
  }
  return { x: nx, y: ny };
}

// ---- Main export ----

export async function buildStarmap(): Promise<StarmapData> {
  const [projects, topics, writing, talks, publications, learning] = await Promise.all([
    getCollection("projects"),
    getCollection("topics"),
    getCollection("writing"),
    getCollection("talks"),
    getCollection("publications"),
    getCollection("learning"),
  ]);

  // Build topic slug → id map for resolving references
  const topicSlugById = new Map(topics.map((t) => [t.id, t.id]));

  type RawItem = {
    id: string;
    kind: StarKind;
    title: string;
    url: string;
    tokens: Set<string>;
  };

  const items: RawItem[] = [];

  // Topics
  for (const t of topics) {
    const tokens = tokenBag([
      ...titleTokens(t.data.title),
      t.id,
      ...t.data.related.map((r) => r.id),
    ]);
    items.push({ id: `topic:${t.id}`, kind: "topic", title: t.data.title, url: `/projects/explorer?node=${t.id}`, tokens });
  }

  // Projects
  for (const p of projects) {
    const topicTokens = p.data.topics.map((ref) => topicSlugById.get(ref.id) ?? ref.id);
    const tokens = tokenBag([
      ...titleTokens(p.data.title),
      ...(p.data.tags ?? []),
      ...topicTokens,
    ]);
    const url = `/projects/${p.id}`;
    items.push({ id: `project:${p.id}`, kind: "project", title: p.data.title, url, tokens });
  }

  // Writing
  for (const w of writing) {
    const tokens = tokenBag([
      ...titleTokens(w.data.title),
      ...(w.data.tags ?? []),
    ]);
    const url = w.data.url ?? `/writing/${w.id}`;
    items.push({ id: `writing:${w.id}`, kind: "writing", title: w.data.title, url, tokens });
  }

  // Talks
  for (const t of talks) {
    const tokens = tokenBag([
      ...titleTokens(t.data.title),
      t.data.kind,
      ...titleTokens(t.data.event),
    ]);
    const url = `/talks`;
    items.push({ id: `talk:${t.id}`, kind: "talk", title: t.data.title, url, tokens });
  }

  // Publications
  for (const p of publications) {
    const tokens = tokenBag([
      ...titleTokens(p.data.title),
      ...(p.data.tags ?? []),
      p.data.type,
    ]);
    const url =
      p.data.url ??
      (p.data.doi
        ? `https://doi.org/${p.data.doi}`
        : `https://ui.adsabs.harvard.edu/search/q=${encodeURIComponent(p.data.title)}`);
    items.push({ id: `pub:${p.id}`, kind: "publication", title: p.data.title, url, tokens });
  }

  // Learning
  for (const l of learning) {
    const tokens = tokenBag([
      ...titleTokens(l.data.title),
      l.data.kind,
      ...titleTokens(l.data.description),
    ]);
    const url = l.data.url ?? "#";
    items.push({ id: `learning:${l.id}`, kind: "learning", title: l.data.title, url, tokens });
  }

  const n = items.length;
  const rand = mulberry32(0xdeadbeef);

  // Build O(N²) distance matrix (Jaccard)
  const D = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = jaccard(items[i].tokens, items[j].tokens);
      const dist = 1 - sim;
      D[i * n + j] = dist;
      D[j * n + i] = dist;
    }
  }

  // Items with empty token bags get zero similarity to everything → large distance.
  // SMACOF will naturally push them toward the periphery.

  const { x: rawX, y: rawY } = smacof(D, n, rand, 150);
  const { x: normX, y: normY } = normalizeCoords(rawX, rawY, n);

  const points: StarPoint[] = items.map((item, i) => ({
    id: item.id,
    kind: item.kind,
    title: item.title,
    url: item.url,
    x: normX[i],
    y: normY[i],
  }));

  return { points };
}
