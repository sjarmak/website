import { z } from "astro/zod";
import type { Explorer } from "./types";

const source = z.object({ title: z.string().min(1), url: z.string().url() });
const schema = z.object({
  id: z.string().regex(/^[a-z]+(?:-[a-z]+)*$/),
  title: z.string().min(1),
  blurb: z.string().min(1),
  metaDescription: z.string().optional(),
  homepage: z.string().startsWith("/scix_ab_explorers/"),
  learningSlug: z.string(),
  paperCount: z.number().int(),
  themeCount: z.number().int(),
  papers: z.array(z.object({
    title: z.string().min(1), firstAuthor: z.string().min(1),
    year: z.union([z.number(), z.string()]),
    bibcode: z.string().optional(), arxiv: z.string().nullish(),
    url: z.string().url().nullish(), citationCount: z.number().optional(),
    branches: z.array(z.string()).min(1),
    notes: z.array(z.object({ branch: z.string(), takeaway: z.string(), why: z.string() })).min(1),
  })).min(1),
  sections: z.array(z.object({
    key: z.string(), label: z.string(), summary: z.string(), count: z.number().int(),
    themes: z.array(z.string()).optional(), gaps: z.array(z.string()).optional(),
    questions: z.array(z.string()).optional(),
  })).min(1),
  reading: z.array(z.tuple([z.string(), z.string(), z.string()])),
  opportunities: z.array(z.tuple([z.string(), z.string()])),
  practices: z.array(z.unknown()),
  person: z.object({
    name: z.string().min(1), affiliation: z.string().min(1), expertise: z.string().min(1),
    interests: z.array(z.string()).min(1), sources: z.array(source).min(1),
  }),
  podcast: z.object({
    title: z.string(), description: z.string(),
    audioUrl: z.string().startsWith("/media/podcasts/scix-ab-"),
    durationMin: z.number().positive(), transcript: z.string(),
  }),
});

export type ScixExplorer = z.infer<typeof schema> & Explorer;
const modules = import.meta.glob("../../data/scix-ab/*.json", { eager: true, import: "default" });
const transcripts = import.meta.glob<string>("../../data/scix-ab/transcripts/*.md", {
  eager: true, query: "?raw", import: "default",
});

export function getScixExplorers(): ScixExplorer[] {
  return Object.entries(modules).map(([file, data]) => {
    const parsed = schema.safeParse(data);
    if (!parsed.success) throw new Error(`${file}: ${parsed.error.message}`);
    const explorer = parsed.data;
    if (explorer.homepage !== `/scix_ab_explorers/${explorer.id}`) {
      throw new Error(`${file}: homepage must match explorer id`);
    }
    return explorer;
  }).sort((a, b) => a.person.name.localeCompare(b.person.name));
}

export function getScixTranscript(explorer: ScixExplorer): string[] {
  const text = transcripts[`../../data/scix-ab/transcripts/${explorer.podcast.transcript}.md`];
  if (!text?.trim()) throw new Error(`${explorer.id}: missing podcast transcript`);
  return text.trim().split(/\n\s*\n/);
}
