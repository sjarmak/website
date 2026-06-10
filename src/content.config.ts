import { defineCollection, reference, z } from "astro:content";
import { glob } from "astro/loaders";

// ---- shared sub-schemas ----
const link = z.object({
  label: z.string(),
  url: z.string().url(),
});

const dateRange = z.object({
  start: z.coerce.date(),
  end: z.coerce.date().optional(), // omit = "present"
});

const base = (dir: string) => glob({ pattern: "**/*.{md,mdx}", base: `./src/content/${dir}` });

// ---- cv: timeline entries (roles, education, affiliations, awards, service) ----
const cv = defineCollection({
  loader: base("cv"),
  schema: z.object({
    title: z.string(),
    org: z.string(),
    location: z.string().optional(),
    category: z.enum(["work", "education", "affiliation", "award", "service"]),
    range: dateRange,
    current: z.boolean().default(false),
    summary: z.string().optional(),
    highlights: z.array(z.string()).default([]),
    links: z.array(link).default([]),
    tags: z.array(z.string()).default([]),
    order: z.number().optional(),
  }),
});

// ---- publications ----
const publications = defineCollection({
  loader: base("publications"),
  schema: z.object({
    title: z.string(),
    authors: z.array(z.string()).default([]),
    authorString: z.string().optional(),
    venue: z.string().optional(),
    year: z.number().int(),
    date: z.coerce.date().optional(),
    type: z.enum(["journal", "conference", "preprint", "thesis", "abstract", "software"]),
    doi: z.string().optional(),
    bibcode: z.string().optional(),
    arxiv: z.string().optional(),
    url: z.string().url().optional(),
    pdf: z.string().url().optional(),
    abstract: z.string().optional(),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
  }),
});

// ---- press ----
const press = defineCollection({
  loader: base("press"),
  schema: z.object({
    title: z.string(),
    outlet: z.string(),
    date: z.coerce.date().optional(),
    year: z.number().int().optional(),
    url: z.string().url(),
    kind: z.enum(["article", "interview", "feature", "mention", "podcast"]).default("article"),
    excerpt: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

// ---- projects (backbone for the knowledge graph; edges via references) ----
const projects = defineCollection({
  loader: base("projects"),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      status: z.enum(["active", "maintained", "archived", "concept"]).default("active"),
      domain: z.enum(["research", "ai-agents", "tooling", "art", "science"]),
      summary: z.string(),
      role: z.string().optional(),
      period: dateRange.optional(),
      repo: z.string().url().optional(),
      homepage: z.string().url().optional(),
      // Playable in-browser build served from /public (e.g. /games/<slug>/).
      play: z.string().optional(),
      tech: z.array(z.string()).default([]),
      cover: image().optional(),
      featured: z.boolean().default(false),
      featuredOrder: z.number().optional(),
      topics: z.array(reference("topics")).default([]),
      outputs: z.array(reference("outputs")).default([]),
      related: z.array(reference("projects")).default([]),
      tags: z.array(z.string()).default([]),
      order: z.number().optional(),
    }),
});

// ---- topics (graph hubs) ----
const topics = defineCollection({
  loader: base("topics"),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    related: z.array(reference("topics")).default([]),
    weight: z.number().default(1),
  }),
});

// ---- outputs (papers, posts, talks — graph leaves) ----
const outputs = defineCollection({
  loader: base("outputs"),
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
    kind: z.enum(["paper", "medium", "sourcegraph-blog", "talk", "webinar", "external"]),
    date: z.coerce.date().optional(),
    url: z.string().url(),
    topics: z.array(reference("topics")).default([]),
  }),
});

// ---- writing (unified curated index) ----
const writing = defineCollection({
  loader: base("writing"),
  schema: z
    .object({
      title: z.string(),
      date: z.coerce.date().optional(), // omit for undated items (e.g. ebooks)
      source: z.enum(["medium", "sourcegraph", "ebook", "on-site", "external"]),
      url: z.string().url().optional(),
      post: reference("posts").optional(),
      description: z.string(),
      tags: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
    })
    .refine((d) => (d.source === "on-site" ? !!d.post : !!d.url), {
      message: "External writing needs `url`; on-site writing needs a `post` reference.",
    }),
});

// ---- posts (on-site long-form, rendered bodies) ----
const posts = defineCollection({
  loader: base("posts"),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      description: z.string(),
      cover: image().optional(),
      draft: z.boolean().default(false),
      tags: z.array(z.string()).default([]),
    }),
});

// ---- talks ----
const talks = defineCollection({
  loader: base("talks"),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      event: z.string(),
      location: z.string().optional(),
      date: z.coerce.date(),
      kind: z.enum(["webinar", "conference", "panel", "invited", "podcast"]),
      videoProvider: z.enum(["youtube", "vimeo", "other"]).optional(),
      videoId: z.string().optional(),
      videoUrl: z.string().url().optional(),
      videoFile: z.string().optional(), // self-hosted mp4, path under /public
      videoPoster: z.string().optional(), // poster image path under /public
      videoCaption: z.string().optional(), // e.g. "Live demo from the talk"
      slidesUrl: z.string().url().optional(),
      photo: image().optional(),
      photoAlt: z.string().optional(),
      description: z.string().optional(),
      featured: z.boolean().default(false),
    }),
});

// ---- art / music / children's books ----
const art = defineCollection({
  loader: base("art"),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      medium: z.enum(["illustration", "music", "book", "mixed"]),
      section: z.string().default("Other"),
      cover: image().optional(),
      year: z.number().int().optional(),
      description: z.string().optional(),
      audioUrl: z.string().url().optional(),
      embedUrl: z.string().url().optional(),
      publisher: z.string().optional(),
      purchaseUrl: z.string().url().optional(),
      links: z.array(link).default([]),
      featured: z.boolean().default(false),
      order: z.number().optional(),
    }),
});

// ---- learning (literature explorers + generated podcasts) ----
const learning = defineCollection({
  loader: base("learning"),
  schema: z.object({
    title: z.string(),
    kind: z.enum(["explorer", "podcast"]),
    description: z.string(),
    url: z.string().url().optional(), // explorer link or external podcast page
    audioUrl: z.string().optional(), // direct audio file (absolute URL or site-relative path)
    embedUrl: z.string().url().optional(), // Spotify/YouTube/etc embed
    series: z.string().optional(), // podcast series grouping
    episode: z.number().optional(),
    meta: z.string().optional(), // e.g. "108 papers · 9 themes"
    date: z.coerce.date().optional(),
    order: z.number().optional(),
  }),
});

// ---- digest (generated + manually curated newsletter/podcast issues) ----
const digest = defineCollection({
  loader: base("digest"),
  schema: z.object({
    title: z.string(),
    // cadence is the time-range the issue covers (curated issues derive it from
    // the date spread of their hand-picked items)
    cadence: z.enum(["daily", "weekly", "monthly"]),
    // origin: produced by the cron agent, or hand-curated in code-intelligence-digest
    origin: z.enum(["auto", "manual"]).default("auto"),
    date: z.coerce.date(),
    summary: z.string(),
    topics: z.array(z.string()).default([]), // filter facets, e.g. "agentic-coding", "evals"
    audioUrl: z.string().optional(), // podcast file: site-relative path or absolute URL
    embedUrl: z.string().url().optional(), // Spotify/YouTube embed fallback
    durationSec: z.number().int().optional(),
    items: z
      .array(
        z.object({
          title: z.string(),
          url: z.string().url(),
          source: z.string().optional(), // publication / feed name
          category: z.string().optional(),
        }),
      )
      .default([]), // linked resources surfaced in the issue
    highlights: z.array(z.string()).default([]),
  }),
});

export const collections = {
  cv,
  publications,
  press,
  projects,
  topics,
  outputs,
  writing,
  posts,
  talks,
  art,
  learning,
  digest,
};
