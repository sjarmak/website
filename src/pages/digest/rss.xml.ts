import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { site } from "@/data/site";
import { getDigests } from "@/lib/knowledge/build";

export async function GET(context: APIContext) {
  const base = context.site ?? new URL(site.url);
  const digests = await getDigests();

  return rss({
    title: `${site.name} — Digest`,
    description:
      "Daily and weekly digests: a specialized track on agentic coding, evals, multi-agent orchestration, agent memory, and information retrieval, plus a general track rounding up the highest-signal news across the agentic field.",
    site: base,
    items: digests.map((d) => {
      const enclosure = d.audioUrl
        ? { enclosure: { url: new URL(d.audioUrl, base).href, length: 0, type: "audio/mpeg" } }
        : {};
      return {
        title: d.title,
        description: d.summary,
        pubDate: d.date,
        link: `/digest/${d.slug}/`,
        categories: d.topics,
        ...enclosure,
      };
    }),
  });
}
