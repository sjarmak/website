import rss from "@astrojs/rss";
import { getCollection, type CollectionEntry } from "astro:content";
import type { APIContext } from "astro";
import { site } from "@/data/site";

export async function GET(context: APIContext) {
  const posts = [...(await getCollection("posts", (p: CollectionEntry<"posts">) => !p.data.draft))].sort(
    (a, b) => +b.data.date - +a.data.date || a.id.localeCompare(b.id),
  );

  return rss({
    title: `${site.name} — Writing`,
    description: "Notes on applied AI research, agents, retrieval, and science.",
    site: context.site ?? site.url,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: `/writing/${p.id}/`,
    })),
  });
}
