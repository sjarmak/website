// R6 — shared JSON-LD emission. One canonical Person entity, referenced by
// the same @id from every block that names the site author, so crawlers can
// join ProfilePage/BlogPosting emissions into a single graph node.
import { site, socials, affiliations } from "@/data/site";

/** Canonical, stable identifier for Stephanie across all structured data. */
export const PERSON_ID = `${site.url}/#person`;

type JsonLd = Record<string, unknown>;

/** The full Person node. Embedded once per profile page via profilePageLd(). */
export function personLd(): JsonLd {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: site.name,
    url: site.url,
    email: `mailto:${site.email}`,
    jobTitle: "Applied Research Scientist & AI Agent Advocate",
    worksFor: affiliations.map((a) => ({ "@type": "Organization", name: a.name })),
    sameAs: socials.filter((s) => s.label !== "Email").map((s) => s.href),
  };
}

/** ProfilePage wrapping the canonical Person, for / and /about. */
export function profilePageLd(path: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: new URL(path, site.url).href,
    mainEntity: personLd(),
  };
}

/** BlogPosting for on-site posts; author points at the canonical Person @id. */
export function blogPostingLd(opts: {
  title: string;
  description: string;
  path: string;
  datePublished: Date;
  dateModified?: Date;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: opts.title,
    description: opts.description,
    url: new URL(opts.path, site.url).href,
    datePublished: isoDate(opts.datePublished),
    dateModified: isoDate(opts.dateModified ?? opts.datePublished),
    author: { "@type": "Person", "@id": PERSON_ID, name: site.name, url: site.url },
  };
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
