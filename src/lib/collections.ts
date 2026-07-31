import { getCollection, type CollectionEntry } from "astro:content";

/** Sort projects by explicit order, then featured, then title. */
export async function getProjects(): Promise<CollectionEntry<"projects">[]> {
  const projects = await getCollection("projects");
  return [...projects].sort(
    (a, b) =>
      (a.data.order ?? 999) - (b.data.order ?? 999) ||
      a.data.title.localeCompare(b.data.title) ||
      a.id.localeCompare(b.id),
  );
}

/** Group CV entries by category, sorted newest-first within each group. */
export async function getCvByCategory() {
  const cv = (await getCollection("cv")) as CollectionEntry<"cv">[];
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
        .filter((e: CollectionEntry<"cv">) => e.data.category === cat)
        .sort(
          (a: CollectionEntry<"cv">, b: CollectionEntry<"cv">) =>
            +b.data.range.start - +a.data.range.start || a.id.localeCompare(b.id),
        ),
    }))
    .filter((g) => g.entries.length > 0);
}

export async function getWriting() {
  const writing = await getCollection("writing");
  // Newest first; undated items (e.g. ebooks) sort last, then by title.
  return [...writing].sort((a, b) => {
    const ad = a.data.date ? +a.data.date : -Infinity;
    const bd = b.data.date ? +b.data.date : -Infinity;
    return bd - ad || a.data.title.localeCompare(b.data.title) || a.id.localeCompare(b.id);
  });
}

export async function getTalks() {
  const talks = await getCollection("talks");
  // Featured first, then newest.
  return [...talks].sort((a, b) => {
    if (a.data.featured !== b.data.featured) return a.data.featured ? -1 : 1;
    return +b.data.date - +a.data.date || a.id.localeCompare(b.id);
  });
}

export async function getPublications() {
  const pubs = await getCollection("publications");
  return [...pubs].sort((a, b) => b.data.year - a.data.year || a.id.localeCompare(b.id));
}

/**
 * Radar links grouped by category. Entries sort newest-first within a category;
 * categories sort by their freshest entry so recently-fed categories float up.
 */
export async function getLinksByCategory() {
  const links = await getCollection("links");
  const byCategory = new Map<string, CollectionEntry<"links">[]>();
  for (const link of links) {
    const group = byCategory.get(link.data.category) ?? [];
    group.push(link);
    byCategory.set(link.data.category, group);
  }
  return [...byCategory.entries()]
    .map(([category, entries]) => ({
      category,
      entries: entries.sort((a, b) => +b.data.added - +a.data.added),
    }))
    .sort((a, b) => +b.entries[0].data.added - +a.entries[0].data.added);
}
