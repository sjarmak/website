import { getCollection, type CollectionEntry } from "astro:content";

/** Sort projects by explicit order, then featured, then title. */
export async function getProjects(): Promise<CollectionEntry<"projects">[]> {
  const projects = await getCollection("projects");
  return projects.sort((a, b) => {
    const ao = a.data.order ?? 999;
    const bo = b.data.order ?? 999;
    if (ao !== bo) return ao - bo;
    return a.data.title.localeCompare(b.data.title);
  });
}

/** Group CV entries by category, sorted newest-first within each group. */
export async function getCvByCategory() {
  const cv = await getCollection("cv");
  const order: CollectionEntry<"cv">["data"]["category"][] = [
    "work",
    "affiliation",
    "education",
    "award",
    "service",
  ];
  const labels: Record<string, string> = {
    work: "Experience",
    affiliation: "Affiliations",
    education: "Education",
    award: "Awards",
    service: "Service",
  };
  return order
    .map((cat) => ({
      category: cat,
      label: labels[cat],
      entries: cv
        .filter((e) => e.data.category === cat)
        .sort((a, b) => +b.data.range.start - +a.data.range.start),
    }))
    .filter((g) => g.entries.length > 0);
}

export async function getWriting() {
  const writing = await getCollection("writing");
  // Newest first; undated items (e.g. ebooks) sort last, then by title.
  return writing.sort((a, b) => {
    const ad = a.data.date ? +a.data.date : -Infinity;
    const bd = b.data.date ? +b.data.date : -Infinity;
    if (ad !== bd) return bd - ad;
    return a.data.title.localeCompare(b.data.title);
  });
}

export async function getTalks() {
  const talks = await getCollection("talks");
  // Featured first, then newest.
  return talks.sort((a, b) => {
    if (a.data.featured !== b.data.featured) return a.data.featured ? -1 : 1;
    return +b.data.date - +a.data.date;
  });
}

export async function getPublications() {
  const pubs = await getCollection("publications");
  return pubs.sort((a, b) => b.data.year - a.data.year);
}

/** Featured projects (systems worth surfacing on the research page), by featuredOrder. */
export async function getFeaturedProjects(): Promise<CollectionEntry<"projects">[]> {
  const projects = await getCollection("projects");
  return projects
    .filter((p) => p.data.featured)
    .sort((a, b) => (a.data.featuredOrder ?? 999) - (b.data.featuredOrder ?? 999));
}

/** Service and appointment CV entries (committees, editorial, elected roles), newest-first. */
export async function getServiceEntries(): Promise<CollectionEntry<"cv">[]> {
  const cv = await getCollection("cv");
  return cv
    .filter((e) => e.data.category === "service" || e.data.category === "award")
    .sort((a, b) => +b.data.range.start - +a.data.range.start);
}
