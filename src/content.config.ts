import { defineCollection, reference, z } from "astro:content";
import { glob } from "astro/loaders";
import { REGISTERS, registerFromDigestOrigin } from "./lib/register";

// ---- register (PRD R3) ----
// Closed provenance enum; every collection below makes an EXPLICIT choice
// (default, or a derivation for machine-produced collections — never a bare
// enum with no stance). Page-level register is a required BaseHead prop; this
// field is what collection routes pass through.
const registerEnum = z.enum(REGISTERS);

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
    // register: career timeline entries are written by Stephanie by hand.
    register: registerEnum.default("authored"),
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
    // register: bibliographic records of published work — structured metadata,
    // not site prose.
    register: registerEnum.default("reference"),
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
    // register: records of third-party coverage — reference data, not authored prose.
    register: registerEnum.default("reference"),
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
      // register: project summaries and framing are Stephanie's own writing.
      register: registerEnum.default("authored"),
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
    // register: curated graph vocabulary — reference structure, not prose.
    register: registerEnum.default("reference"),
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
    // register: the concept registry is canonical reference vocabulary (PRD R3
    // names this collection explicitly).
    register: registerEnum.default("reference"),
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
    // register: link records pointing at work published elsewhere — graph
    // leaves, not on-site prose.
    register: registerEnum.default("reference"),
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
      // register: the writing index catalogs Stephanie's own writing.
      register: registerEnum.default("authored"),
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
      // register: on-site long-form essays are Stephanie's genuine writing
      // (PRD: agent prose never lands in this collection).
      register: registerEnum.default("authored"),
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
      // register: talks she delivered, with hand-written descriptions. The
      // machine-transcribed text of a talk lives in the `transcripts`
      // collection, which carries its own (hybrid, never authored) register.
      register: registerEnum.default("authored"),
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
      // register: illustration, music, and books are Stephanie's own work.
      register: registerEnum.default("authored"),
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
  }).transform((data) => ({
    ...data,
    // register: machine-built literature explorers and pipeline-generated
    // podcasts. Sensitive collection — DERIVED, not defaulted, so a frontmatter
    // edit can never relabel machine learning-content as authored.
    register: "generated" as const,
  })),
});

// ---- digest (generated + manually curated newsletter/podcast issues) ----
const digest = defineCollection({
  loader: base("digest"),
  // register: sensitive collection — NO bare default. Register DERIVES from the
  // existing `origin` field (manual→hybrid, auto→generated; see
  // registerFromDigestOrigin), so the 60+ existing entries need no frontmatter
  // rewrite. An entry MAY declare `register` explicitly (the publish gate
  // writes it), but a declared value that contradicts the origin derivation is
  // a build error, never silently accepted.
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
    register: registerEnum.optional(),
  })
    .superRefine((data, ctx) => {
      const derived = registerFromDigestOrigin(data.origin);
      if (data.register && data.register !== derived) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["register"],
          message: `digest register "${data.register}" contradicts origin "${data.origin}" (must derive to "${derived}")`,
        });
      }
    })
    .transform((data) => ({ ...data, register: registerFromDigestOrigin(data.origin) })),
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
  }).transform((data) => ({
    ...data,
    // register: machine-transcribed audio. Sensitive collection — DERIVED, not
    // defaulted: the words may be Stephanie's but the transcription is machine
    // output, so a transcript is hybrid and can NEVER surface as authored.
    register: "hybrid" as const,
  })),
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
  posts,
  talks,
  art,
  learning,
  digest,
  transcripts,
};
