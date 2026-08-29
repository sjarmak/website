// Assemble the knowledge hub: resolve curated threads against real content,
// then compute the three retrieval lanes (semantic / lexical / graph) and their
// RRF fusion over the curated node set. All work happens at build time; pages
// embed only the resulting node + related lists.

import { getCollection, type CollectionEntry } from "astro:content";
import threadsData from "@/data/knowledge/threads.json";
import papersData from "@/data/knowledge/papers.json";
import litData from "@/data/knowledge/lit-papers.json";
import citationData from "@/data/knowledge/citation-edges.json";
import embeddingsData from "@/data/knowledge/embeddings.json";
import librariesData from "@/data/knowledge/libraries.json";
import explorersData from "@/data/knowledge/explorers.json";
import thirtyPapersData from "@/data/knowledge/explorers/thirty-papers.json";
import paperSynthesisData from "@/data/knowledge/paper-synthesis.json";
import { byDate, byString, thenBy } from "@/lib/sorting";
import { buildBm25, bm25Query, rrf, semanticQuery, tokenize, type Scored } from "./retrieval";
import type {
  DigestItem,
  DigestIssue,
  Explorer,
  ExplorerOpportunity,
  ExplorerPaper,
  ExplorerPaperSynthesis,
  ExplorerReadingGroup,
  KnowledgeGraph,
  KnowledgeNode,
  KnowledgeThread,
  Lane,
  Library,
  NodeKind,
  PodcastEpisode,
  PodcastSeries,
  Related,
  RelatedItem,
} from "./types";

const TOP_K = 6;

interface RawPaper {
  bibcode: string;
  title: string;
  year?: number | string;
  citationCount?: number;
  abstract?: string;
}

interface RawOnSite {
  collection: string;
  slug: string;
  bibcode?: string;
}

interface RawThread {
  id: string;
  question: string;
  status: string;
  take: string;
  concepts: string[];
  on_site: RawOnSite[];
  seed_papers: string[];
  reading_order: { bibcode: string; why: string }[];
  ads_libraries: string[];
  explorer: string | null;
}

const libraries = librariesData.libraries as unknown as Library[];

// Full-text 4-part synthesis, generated agentically via the SciX MCP and keyed
// by whichever identifier the paper carries: bibcode first, then arXiv id, then
// url. Conference papers with no ADS record (PVLDB, CIDR) and released
// artifacts have only the last of those, and they carry the argument on several
// explorers, so the join cannot be bibcode-only. Joined at module load so pages
// get it for free; a paper with no entry falls back to its 2-part notes.
const synthesisByRef = paperSynthesisData.synthesis as Record<string, ExplorerPaperSynthesis>;

function hasSynthesis(s: ExplorerPaperSynthesis | undefined): s is ExplorerPaperSynthesis {
  return !!s && [s.plainAbstract, s.motivation, s.methodology, s.results].some((f) => f?.trim());
}

function lookupSynthesis(p: ExplorerPaper): ExplorerPaperSynthesis | undefined {
  for (const ref of [p.bibcode, p.arxiv, p.url]) {
    const s = ref ? synthesisByRef[ref] : undefined;
    if (hasSynthesis(s)) return s;
  }
  return undefined;
}

function joinSynthesis(explorer: Explorer): Explorer {
  return {
    ...explorer,
    papers: explorer.papers.map((p) => {
      const s = lookupSynthesis(p);
      return s ? { ...p, synthesis: s } : p;
    }),
  };
}

const explorers = [
  ...(explorersData.explorers as unknown as Explorer[]),
  thirtyPapersData as unknown as Explorer,
].map(joinSynthesis);
const libraryByName = new Map(libraries.map((l) => [l.name, l]));
const explorerById = new Map(explorers.map((e) => [e.id, e]));

function yearOf(value: number | string | undefined): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number.parseInt(value.slice(0, 4), 10);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

const vectors = embeddingsData.vectors as Record<string, number[]>;
const paperById = new Map<string, RawPaper>();
for (const p of papersData.papers as unknown as RawPaper[]) paperById.set(p.bibcode, p);
for (const p of litData.papers as unknown as RawPaper[]) paperById.set(p.bibcode, p);

const KIND_LABEL: Record<Exclude<NodeKind, "paper">, string> = {
  project: "Project",
  writing: "Writing",
  talk: "Talk",
  learning: "Learning",
  publication: "Paper (mine)",
  concept: "Concept",
};

function adsUrl(bibcode: string): string {
  return `https://ui.adsabs.harvard.edu/abs/${encodeURIComponent(bibcode)}/abstract`;
}

function paperNode(bibcode: string): KnowledgeNode {
  const p = paperById.get(bibcode);
  if (!p) throw new Error(`knowledge: unknown bibcode ${bibcode}`);
  const cites = p.citationCount ?? 0;
  return {
    id: `paper:${bibcode}`,
    kind: "paper",
    title: p.title,
    url: adsUrl(bibcode),
    text: `${p.title}. ${p.abstract ?? ""}`,
    meta: `${p.year ?? "?"}${cites ? ` · ${cites} cites` : ""}`,
    external: true,
    year: yearOf(p.year),
  };
}

// ---- on-site content resolution ----

type OnSiteResolved = { title: string; url: string; text: string; kind: NodeKind; meta: string };

function summaryOf(data: Record<string, unknown>): string {
  const s = data.summary ?? data.description ?? "";
  return typeof s === "string" ? s : "";
}

async function loadOnSite(): Promise<Map<string, OnSiteResolved>> {
  const [projects, writing, talks, learning, publications] = await Promise.all([
    getCollection("projects"),
    getCollection("writing"),
    getCollection("talks"),
    getCollection("learning"),
    getCollection("publications"),
  ]);

  const map = new Map<string, OnSiteResolved>();
  const add = (kind: Exclude<NodeKind, "paper">, col: string, entry: { id: string; data: Record<string, unknown> }, url: string) => {
    const title = String(entry.data.title ?? entry.id);
    map.set(`${col}:${entry.id}`, {
      title,
      url,
      text: `${title}. ${summaryOf(entry.data)}`,
      kind,
      meta: KIND_LABEL[kind],
    });
  };

  for (const e of projects as CollectionEntry<"projects">[]) add("project", "projects", e, `/projects/${e.id}`);
  for (const e of writing as CollectionEntry<"writing">[]) add("writing", "writing", e, e.data.url ?? `/writing/${e.id}`);
  for (const e of talks as CollectionEntry<"talks">[]) add("talk", "talks", e, "/talks");
  for (const e of learning as CollectionEntry<"learning">[]) add("learning", "learning", e, e.data.url ?? "/library");
  for (const e of publications as CollectionEntry<"publications">[])
    add("publication", "publications", e, e.data.url ?? "https://scixplorer.org/search?q=author:jarmak");
  return map;
}

// ---- graph edges ----

function edgeKey(a: string, b: string): string {
  return a < b ? `${a} ${b}` : `${b} ${a}`;
}

function buildAdjacency(threads: RawThread[], onSiteId: (o: RawOnSite) => string): Map<string, Map<string, number>> {
  const weights = new Map<string, number>();
  const bump = (a: string, b: string, w: number) => {
    if (a === b) return;
    const k = edgeKey(a, b);
    weights.set(k, (weights.get(k) ?? 0) + w);
  };

  for (const t of threads) {
    const ids = [...t.on_site.map(onSiteId), ...t.seed_papers.map((b) => `paper:${b}`)];
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) bump(ids[i], ids[j], 1);

    // publication <-> its own paper (the SciX embeddings paper)
    for (const o of t.on_site) if (o.bibcode) bump(onSiteId(o), `paper:${o.bibcode}`, 3);

    // reading-order adjacency
    const order = t.reading_order.map((r) => `paper:${r.bibcode}`);
    for (let i = 1; i < order.length; i++) bump(order[i - 1], order[i], 1);
  }

  for (const e of citationData.edges as { source: string; target: string }[])
    bump(`paper:${e.source}`, `paper:${e.target}`, 2);

  const adj = new Map<string, Map<string, number>>();
  for (const [key, w] of weights) {
    const [a, b] = key.split(" ");
    if (!adj.has(a)) adj.set(a, new Map());
    if (!adj.has(b)) adj.set(b, new Map());
    adj.get(a)!.set(b, w);
    adj.get(b)!.set(a, w);
  }
  return adj;
}

// ---- lane computation ----

function toItems(scored: Scored[], byId: Map<string, KnowledgeNode>, limit: number): RelatedItem[] {
  const items: RelatedItem[] = [];
  for (const s of scored) {
    const n = byId.get(s.id);
    if (!n) continue;
    items.push({ id: n.id, title: n.title, url: n.url, kind: n.kind, score: Math.round(s.score * 1000) / 1000 });
    if (items.length >= limit) break;
  }
  return items;
}

let cache: Promise<KnowledgeGraph> | null = null;

export function buildKnowledge(): Promise<KnowledgeGraph> {
  cache ??= assemble();
  return cache;
}

async function assemble(): Promise<KnowledgeGraph> {
  const rawThreads = (threadsData.threads as RawThread[]);
  const onSite = await loadOnSite();
  const onSiteId = (o: RawOnSite) => `${o.collection}:${o.slug}`;

  // ---- collect the curated node set ----
  const byId = new Map<string, KnowledgeNode>();
  const addOnSite = (o: RawOnSite) => {
    const id = onSiteId(o);
    if (byId.has(id)) return;
    const r = onSite.get(id);
    if (!r) throw new Error(`knowledge: unresolved on-site node ${id}`);
    byId.set(id, { id, kind: r.kind, title: r.title, url: r.url, text: r.text, meta: r.meta, external: false });
  };
  const addPaper = (bibcode: string) => {
    const id = `paper:${bibcode}`;
    if (!byId.has(id)) byId.set(id, paperNode(bibcode));
  };

  for (const t of rawThreads) {
    t.on_site.forEach(addOnSite);
    t.seed_papers.forEach(addPaper);
    t.reading_order.forEach((r) => addPaper(r.bibcode));
    t.on_site.forEach((o) => o.bibcode && addPaper(o.bibcode));
  }

  const nodes = [...byId.values()];

  // ---- lanes ----
  const bm25 = buildBm25(nodes.map((n) => ({ id: n.id, tokens: tokenize(n.text) })));
  const adj = buildAdjacency(rawThreads, onSiteId);
  const degree = new Map<string, number>();
  for (const [id, nbrs] of adj) degree.set(id, nbrs.size);

  // Baked vectors restricted to the curated node set. semanticQuery itself is
  // id-agnostic, so any node kind in the set (including concept:<slug>) flows
  // through; vectors without a curated node stay dark until one joins the set.
  const nodeVectors: Record<string, number[]> = {};
  for (const n of nodes) if (vectors[n.id]) nodeVectors[n.id] = vectors[n.id];

  const related: Record<string, Related> = {};
  for (const node of nodes) {
    // semantic
    const qv = vectors[node.id];
    const semScored: Scored[] = qv ? semanticQuery(nodeVectors, qv, node.id) : [];

    // lexical
    const lexScored = bm25Query(bm25, tokenize(node.text), node.id);

    // graph
    const nbrs = adj.get(node.id);
    const graphScored: Scored[] = nbrs
      ? [...nbrs.entries()]
          .map(([id, w]) => ({ id, score: w }))
          .sort((a, b) => b.score - a.score || (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0))
      : [];

    // recency: rank the other nodes by publication year (the freshness prior
    // from the code-intelligence-digest hybrid scorer). Undated nodes drop out.
    const recencyScored: Scored[] = nodes
      .filter((m) => m.id !== node.id && m.year !== undefined)
      .map((m) => ({ id: m.id, score: m.year! }))
      .sort((a, b) => b.score - a.score);

    const fusedScored = rrf([semScored, lexScored, graphScored, recencyScored]).filter(
      (s) => s.id !== node.id,
    );

    related[node.id] = {
      semantic: toItems(semScored, byId, TOP_K),
      lexical: toItems(lexScored, byId, TOP_K),
      graph: toItems(graphScored, byId, TOP_K),
      recency: toItems(recencyScored, byId, TOP_K),
      fused: toItems(fusedScored, byId, TOP_K),
    };
  }

  // ---- resolve threads ----
  const threads: KnowledgeThread[] = rawThreads.map((t) => ({
    id: t.id,
    question: t.question,
    status: t.status,
    take: t.take,
    concepts: t.concepts,
    artifacts: t.on_site.map((o) => byId.get(onSiteId(o))!),
    papers: t.seed_papers.map((b) => byId.get(`paper:${b}`)!),
    readingOrder: t.reading_order.map((r) => ({ node: byId.get(`paper:${r.bibcode}`)!, why: r.why })),
    libraries: (t.ads_libraries ?? []).map((name) => libraryByName.get(name)).filter((l): l is Library => !!l),
    explorer: t.explorer ? explorerById.get(t.explorer) ?? null : null,
  }));

  return { threads, nodes, related };
}

// ---- libraries / explorers / resources / digest (for the libraries page) ----

export function getLibraries(): Library[] {
  return libraries;
}

export function getLibrary(id: string): Library | undefined {
  return libraries.find((l) => l.id === id);
}

export function getExplorers(): Explorer[] {
  return explorers;
}

export function getExplorer(id: string): Explorer | undefined {
  return explorers.find((e) => e.id === id);
}

/** Resolve a paper's best external link: arXiv, then explicit url, then ADS. */
function arxivOrAds(bibcode?: string, arxiv?: string | null, url?: string | null): string {
  if (arxiv) return `https://arxiv.org/abs/${arxiv}`;
  if (url) return url;
  if (bibcode) return adsUrl(bibcode);
  return "#";
}

export function explorerPaperUrl(p: ExplorerPaper): string {
  return arxivOrAds(p.bibcode, p.arxiv, p.url);
}

/** Parse the raw `[bibcode, title, group]` reading tuples into ordered, numbered groups. */
export function explorerReadingPath(e: Explorer): ExplorerReadingGroup[] {
  const byReference = new Map<string, ExplorerPaper>();
  for (const paper of e.papers) {
    for (const reference of [paper.bibcode, paper.arxiv, paper.url]) {
      if (reference) byReference.set(reference, paper);
    }
  }
  const groups: ExplorerReadingGroup[] = [];
  const indexByGroup = new Map<string, number>();
  let n = 0;
  for (const row of e.reading ?? []) {
    if (!Array.isArray(row)) continue;
    const [reference, title, group] = row as [string, string, string?];
    const g = group ?? "";
    if (!indexByGroup.has(g)) {
      indexByGroup.set(g, groups.length);
      groups.push({ group: g, stops: [] });
    }
    const paper = reference ? byReference.get(reference) : undefined;
    groups[indexByGroup.get(g)!].stops.push({
      n: ++n,
      bibcode: paper?.bibcode ?? "",
      title: title ?? reference ?? "",
      url: paper
        ? arxivOrAds(paper.bibcode, paper.arxiv ?? null, paper.url ?? null)
        : reference?.startsWith("http")
          ? reference
          : arxivOrAds(undefined, reference, null),
    });
  }
  return groups;
}

/** Parse the raw opportunity tuples (`[title, description]` or bare strings). */
export function explorerOpportunities(e: Explorer): ExplorerOpportunity[] {
  return (e.opportunities ?? [])
    .map((o): ExplorerOpportunity =>
      Array.isArray(o)
        ? { title: String(o[0] ?? ""), description: String(o[1] ?? "") }
        : { title: String(o), description: "" },
    )
    .filter((o) => o.title);
}

/** Every podcast episode, in listening order. */
async function podcastEpisodes(): Promise<PodcastEpisode[]> {
  const learning = await getCollection("learning");
  return (learning as CollectionEntry<"learning">[])
    .filter((e) => e.data.kind === "podcast")
    .sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999))
    .map((e) => ({
      title: e.data.title,
      episode: e.data.episode,
      description: e.data.description,
      audioUrl: e.data.audioUrl,
      embedUrl: e.data.embedUrl,
      series: e.data.series,
      explorer: e.data.explorer,
      hub: e.data.hub,
    }));
}

function groupIntoSeries(episodes: PodcastEpisode[]): PodcastSeries[] {
  const names = [...new Set(episodes.map((e) => e.series).filter(Boolean))] as string[];
  return names.map((name) => ({ name, episodes: episodes.filter((e) => e.series === name) }));
}

/**
 * Podcasts for the digest: everything that is not a companion to an explorer.
 * An episode that names an explorer renders on that explorer page instead, so
 * the literature map and the audio walking through it stay in one place.
 */
export async function getPodcasts(): Promise<{ series: PodcastSeries[]; standalone: PodcastEpisode[] }> {
  const episodes = (await podcastEpisodes()).filter((e) => !e.explorer);
  return {
    series: groupIntoSeries(episodes),
    standalone: episodes.filter((e) => !e.series),
  };
}

/**
 * The companion series for one explorer, in listening order. Throws when an
 * episode names an explorer that does not exist, because a typo there would
 * otherwise drop the episode from both the digest and the library silently.
 */
export async function getExplorerPodcasts(explorerId: string): Promise<PodcastSeries[]> {
  const episodes = (await podcastEpisodes()).filter((e) => e.explorer);
  const known = new Set(getExplorers().map((ex) => ex.id));
  for (const e of episodes) {
    if (!known.has(e.explorer!)) {
      throw new Error(`knowledge: podcast "${e.title}" names unknown explorer ${e.explorer}`);
    }
  }
  return groupIntoSeries(episodes.filter((e) => e.explorer === explorerId));
}

/** What's new: papers across all ADS libraries, newest first (deduped). */
export function getDigestStream(limit = 40): DigestItem[] {
  const seen = new Set<string>();
  const items: DigestItem[] = [];
  for (const lib of libraries) {
    for (const p of lib.papers) {
      if (seen.has(p.bibcode)) continue;
      seen.add(p.bibcode);
      items.push({
        bibcode: p.bibcode,
        title: p.title,
        url: p.adsUrl,
        library: lib.name,
        pubdate: p.pubdate,
        year: p.year,
        citationCount: p.citationCount,
      });
    }
  }
  items.sort((a, b) => (b.pubdate ?? "").localeCompare(a.pubdate ?? ""));
  return items.slice(0, limit);
}

/** The digest library: published newsletter/podcast issues, newest first. */
export async function getDigests(): Promise<DigestIssue[]> {
  const entries = (await getCollection("digest")) as CollectionEntry<"digest">[];
  return entries
    .map((e) => ({
      slug: e.id,
      title: e.data.title,
      cadence: e.data.cadence,
      track: e.data.track,
      origin: e.data.origin,
      date: e.data.date,
      summary: e.data.summary,
      topics: e.data.topics,
      audioUrl: e.data.audioUrl,
      embedUrl: e.data.embedUrl,
      durationSec: e.data.durationSec,
      items: e.data.items,
      highlights: e.data.highlights,
      linkCount: Math.max(e.data.items.length, countBodyLinks(e.body ?? "")),
    }))
    .sort(thenBy(byDate((d) => d.date, "desc"), byString((d) => d.slug)));
}

/** Count the distinct external links in a digest's markdown body. */
function countBodyLinks(body: string): number {
  const urls = new Set<string>();
  for (const m of body.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) urls.add(m[1]);
  return urls.size;
}

/** Distinct topic facets across all digests, for the library's filter UI. */
export async function getDigestTopics(): Promise<string[]> {
  const digests = await getDigests();
  return [...new Set(digests.flatMap((d) => d.topics))].sort();
}

export type { Lane };
