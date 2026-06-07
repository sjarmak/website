/**
 * NASA ADS / SciX client wrapper.
 *
 * Live endpoint:
 *   https://api.adsabs.harvard.edu/v1/search/query
 *   ?q=author:"Jarmak,+S"&fl=bibcode,title,author,year,pub,doctype,citation_count,abstract&rows=50&sort=date+desc
 *   Authorization: Bearer <token>
 *
 * SciX (same API, same token):
 *   https://api.scixplorer.org/v1/search/query  (mirrors ADS)
 *
 * Env var:  ADS_API_TOKEN  (set in .env or hosting env — never commit)
 * At build time Astro exposes it via import.meta.env.ADS_API_TOKEN.
 * If absent, the fixture is returned immediately so the build succeeds offline.
 */

import { adsFixture, type AdsPaper } from "./fixture";

// Re-export so consumers can import the paper type from the client entrypoint.
export type { AdsPaper } from "./fixture";

// ── ADS response shape (subset) ──────────────────────────────────────────────

interface AdsDoc {
  bibcode?: string;
  title?: string[];
  author?: string[];
  year?: string;
  pub?: string;
  doctype?: string;
  citation_count?: number;
  abstract?: string;
  identifier?: string[];
}

interface AdsSearchResponse {
  response?: {
    docs?: AdsDoc[];
  };
}

// ── field inference ───────────────────────────────────────────────────────────

const PLANETARY_KEYWORDS = [
  "saturn", "cassini", "rings", "ring", "jwst", "psyche", "asteroid",
  "regolith", "microgravity", "uranus", "cubesat", "planetesimal",
  "apophis", "polana", "bennu", "ryugu", "occultation", "planetary",
  "solar system", "impact", "orbit", "mission concept",
];

const INFORMATION_KEYWORDS = [
  "llm", "large language model", "embedding", "vector", "scix", "ads",
  "search", "retrieval", "information", "knowledge graph", "agent",
  "code intelligence", "natural language",
];

function inferField(title: string): "planetary" | "information" {
  const lower = title.toLowerCase();
  const infoScore = INFORMATION_KEYWORDS.filter((k) => lower.includes(k)).length;
  const planScore = PLANETARY_KEYWORDS.filter((k) => lower.includes(k)).length;
  return infoScore > planScore ? "information" : "planetary";
}

// ── URL helper ────────────────────────────────────────────────────────────────

function resolveUrl(doc: AdsDoc): string {
  if (doc.bibcode) {
    return `https://ui.adsabs.harvard.edu/abs/${encodeURIComponent(doc.bibcode)}`;
  }
  const arxivId = doc.identifier?.find((id) => id.startsWith("arXiv:"));
  if (arxivId) {
    return `https://arxiv.org/abs/${arxivId.replace("arXiv:", "")}`;
  }
  const doi = doc.identifier?.find((id) => id.startsWith("10."));
  if (doi) {
    return `https://doi.org/${doi}`;
  }
  return "https://scixplorer.org/search?p=1&q=author%3Ajarmak&sort=score+desc&sort=date+desc&d=general";
}

// ── mapper ────────────────────────────────────────────────────────────────────

function mapDoc(doc: AdsDoc): AdsPaper {
  const title = doc.title?.[0] ?? "(untitled)";
  const arxivId = doc.identifier?.find((id) => id.startsWith("arXiv:"))?.replace("arXiv:", "");
  const doi = doc.identifier?.find((id) => id.startsWith("10."));

  return {
    bibcode: doc.bibcode,
    title,
    year: doc.year ? parseInt(doc.year, 10) : 0,
    authors: doc.author ?? [],
    authorString: doc.author ? `${doc.author.slice(0, 3).join(", ")}${doc.author.length > 3 ? ", et al." : ""}` : undefined,
    venue: doc.pub,
    type: doc.doctype ?? "journal",
    citationCount: doc.citation_count ?? 0,
    url: resolveUrl(doc),
    abstract: doc.abstract,
    arxiv: arxivId,
    doi,
    field: inferField(title),
  };
}

// ── public API ────────────────────────────────────────────────────────────────

const ADS_ENDPOINT =
  "https://api.adsabs.harvard.edu/v1/search/query" +
  "?q=author%3A%22Jarmak%2C+S%22" +
  "&fl=bibcode%2Ctitle%2Cauthor%2Cyear%2Cpub%2Cdoctype%2Ccitation_count%2Cabstract%2Cidentifier" +
  "&rows=50" +
  "&sort=date+desc";

export async function fetchAuthorPapers(
  opts?: { author?: string },
): Promise<{ papers: AdsPaper[]; source: "live" | "fixture" }> {
  const token = import.meta.env.ADS_API_TOKEN as string | undefined;

  if (!token) {
    return { papers: adsFixture, source: "fixture" };
  }

  const url = opts?.author
    ? `https://api.adsabs.harvard.edu/v1/search/query?q=author%3A%22${encodeURIComponent(opts.author)}%22&fl=bibcode%2Ctitle%2Cauthor%2Cyear%2Cpub%2Cdoctype%2Ccitation_count%2Cabstract%2Cidentifier&rows=50&sort=date+desc`
    : ADS_ENDPOINT;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return { papers: adsFixture, source: "fixture" };
    }

    const json: AdsSearchResponse = await res.json() as AdsSearchResponse;
    const docs = json?.response?.docs;

    if (!Array.isArray(docs) || docs.length === 0) {
      return { papers: adsFixture, source: "fixture" };
    }

    return { papers: docs.map(mapDoc), source: "live" };
  } catch {
    return { papers: adsFixture, source: "fixture" };
  }
}
