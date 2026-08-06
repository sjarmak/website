import { defineCollection, reference, z } from "astro:content";
import { file, glob } from "astro/loaders";
import { parse as parseYaml } from "yaml";

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

// Derive a stable, unique id per link so entries never need a hand-written `id`.
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "link";

// Parser for the single-file links collection: YAML array in, id-tagged records out.
const linksParser = (text: string) => {
  const items = parseYaml(text);
  if (!Array.isArray(items)) return [];
  const seen = new Map<string, number>();
  return items.map((item) => {
    const b = slugify(item?.title ?? item?.url ?? "link");
    const n = seen.get(b) ?? 0;
    seen.set(b, n + 1);
    return { id: n === 0 ? b : `${b}-${n}`, ...item };
  });
};

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
      // Architecture diagram site (LikeC4 on GitHub Pages).
      architecture: z.string().url().optional(),
      // Playable in-browser build served from /public (e.g. /games/<slug>/).
      play: z.string().optional(),
      // Extra labeled link-outs (blog posts, coverage, etc.).
      links: z.array(link).default([]),
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

// ---- concepts (canonical vocabulary; aliases absorb facet drift) ----
const concepts = defineCollection({
  loader: base("concepts"),
  schema: z.object({
    label: z.string(),
    // alternate facet spellings that resolve to this concept (cross-entry
    // uniqueness is enforced by scripts/knowledge/validate-concepts.mjs)
    aliases: z.array(z.string()).default([]),
    definition: z.string(),
    topic: reference("topics").optional(), // anchor into the topics graph
    related: z.array(reference("concepts")).default([]),
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
      source: z.enum(["medium", "sourcegraph", "ebook", "book", "on-site", "external"]),
      // Document type override for the index row label. Defaults to the
      // source-derived label ("Essay" for on-site); set "technical-report"
      // to present a piece as a technical report instead.
      kind: z.enum(["essay", "technical-report"]).default("essay"),
      url: z.string().url().optional(),
      post: reference("posts").optional(),
      book: reference("books").optional(),
      description: z.string(),
      tags: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
    })
    .refine((d) => {
      if (d.source === "on-site") return !!d.post && !d.book && !d.url;
      if (d.source === "book") return !!d.book && !d.post && !d.url;
      return !!d.url && !d.post && !d.book;
    }, {
      message:
        "External writing needs `url`; on-site writing needs `post`; book writing needs `book`.",
    }),
});

// ---- books (landing metadata) ----
const books = defineCollection({
  loader: base("books"),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    author: z.string(),
    description: z.string(),
    repository: z.string().url().optional(),
    pageCount: z.number().int().positive(),
    parts: z.array(
      z.object({
        number: z.number().int().positive(),
        title: z.string(),
      }),
    ),
  }),
});

// ---- book chapters (ordered long-form bodies) ----
const bookChapters = defineCollection({
  loader: base("book-chapters"),
  schema: z.object({
    title: z.string(),
    book: reference("books"),
    order: z.number().int().nonnegative(),
    part: z.number().int().nonnegative(),
    kind: z.enum(["introduction", "chapter", "closing", "glossary"]),
    number: z.number().int().positive().optional(),
  }),
});

// ---- book companion catalogs (complete practice indexes) ----
const bookCompanions = defineCollection({
  loader: base("book-companions"),
  schema: z.object({
    title: z.string(),
    introTitle: z.string(),
    book: reference("books"),
    practiceCount: z.number().int().positive(),
    taughtCount: z.number().int().nonnegative(),
    untaughtCount: z.number().int().nonnegative(),
    chapters: z.array(
      z.object({
        number: z.number().int().positive(),
        title: z.string(),
        taughtCount: z.number().int().nonnegative(),
        untaughtCount: z.number().int().nonnegative(),
        totalCount: z.number().int().positive(),
      }),
    ),
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
      // Document type. Drives the on-page kicker: "essay" (default) renders
      // "Essay", "technical-report" renders "Technical report".
      kind: z.enum(["essay", "technical-report"]).default("essay"),
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
      eventUrl: z.string().url().optional(), // event homepage; links the event name
      location: z.string().optional(),
      date: z.coerce.date(),
      kind: z.enum(["webinar", "conference", "panel", "invited", "podcast", "demo"]),
      videoProvider: z.enum(["youtube", "vimeo", "other"]).optional(),
      videoId: z.string().optional(),
      videoStart: z.number().int().optional(), // start offset in seconds (deep-linked segment)
      videoUrl: z.string().url().optional(),
      videoFile: z.string().optional(), // self-hosted mp4, path under /public
      videoPoster: z.string().optional(), // poster image path under /public
      videoCaption: z.string().optional(), // e.g. "Live demo from the talk"
      slidesUrl: z.string().url().optional(),
      scheduleUrl: z.string().url().optional(), // session/schedule page (for upcoming talks)
      photo: image().optional(),
      photoAlt: z.string().optional(),
      photoCard: z.boolean().default(false), // promo/speaker card: render small, not full-bleed
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
    hub: z.string().optional(), // page section this episode belongs to (e.g. "field-notes")
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
    // track: "specialized" follows the site's core topics (agentic coding, evals,
    // memory, retrieval); "general" is a field-wide roundup selected by social
    // signal and utility across the whole intel corpus
    track: z.enum(["specialized", "general"]).default("specialized"),
    // origin: produced by the cron agent, or hand-curated in code-intelligence-digest
    origin: z.enum(["auto", "manual"]).default("auto"),
    date: z.coerce.date(),
    summary: z.string(),
    topics: z.array(z.string()).default([]), // filter facets, e.g. "agentic-coding", "evals"
    // facets the publish-time concept gate could not resolve against
    // src/content/concepts (cron runs publish anyway and record them here)
    unresolvedFacets: z.array(z.string()).optional(),
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

// ---- links / radar (categorized watchlist of resources to follow up on) ----
const links = defineCollection({
  loader: file("src/content/links/inbox.yaml", { parser: linksParser }),
  schema: z.object({
    title: z.string(),
    url: z.string().url(),
    // Freeform so a new category needs no schema change; used verbatim as the
    // section heading, so write it human-readable (e.g. "AI writing").
    category: z.string(),
    kind: z.enum(["tool", "repo", "article", "paper", "video", "thread", "other"]).default("other"),
    // Why it's worth a follow-up.
    note: z.string().optional(),
    tags: z.array(z.string()).default([]),
    added: z.coerce.date(),
    featured: z.boolean().default(false),
  }),
});

// ---- transcripts (audio transcripts, joined to any audio entry by audioUrl) ----
const transcripts = defineCollection({
  // raw transcripts live at repo root /transcripts (pipeline output); INDEX.md has no
  // frontmatter, so it's excluded from the collection
  loader: glob({ pattern: ["**/*.md", "!INDEX.md"], base: "./transcripts" }),
  schema: z.object({
    title: z.string(),
    audioUrl: z.string(), // the audio file this transcribes — the join key
    durationMin: z.number().optional(),
    words: z.number().int().optional(),
  }),
});

export const collections = {
  cv,
  publications,
  press,
  projects,
  topics,
  concepts,
  outputs,
  writing,
  books,
  bookChapters,
  bookCompanions,
  posts,
  talks,
  art,
  learning,
  digest,
  links,
  transcripts,
};
