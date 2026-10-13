import type { APIRoute } from "astro";
import { site } from "@/data/site";
import {
  talk,
  canonicalUrl,
  downloads,
  repositories,
  chartTypeLabel,
  sectionLabel,
  chartTable,
} from "@/lib/talks/liesDamnedLiesAndEvals";

function absolute(href: string): string {
  return new URL(href, site.url).href;
}

function build() {
  const {
    slides,
    notes_label: _notesLabel,
    prepared_script_words: _words,
    rehearsal_target_minutes: _rehearsal,
    hard_cutoff_minutes: _cutoff,
    ...header
  } = talk;
  return {
    ...header,
    canonical_url: canonicalUrl,
    llms_txt_url: `${canonicalUrl}llms.txt`,
    downloads: downloads.map((d) => ({ label: d.label, url: absolute(d.href), media_type: d.type, note: d.note })),
    repositories: repositories.map((g) => ({
      heading: g.heading,
      repos: g.repos.map((r) => ({ name: `sjarmak/${r.name}`, url: r.url, note: r.note })),
    })),
    slides: slides.map((slide) => {
      const {
        stage_content_html: _html,
        presentation_only_pre_reveal_prompts: _prompts,
        timing: _timing,
        delivery_cue: _cue,
        speaker_note_word_count: _count,
        prepared_speaker_notes,
        ...rest
      } = slide;
      return {
        ...rest,
        notes: prepared_speaker_notes,
        url: `${canonicalUrl}#${slide.anchor}`,
        section_label: sectionLabel(slide),
        chart: { ...slide.chart, type_label: chartTypeLabel(slide.chart.type), table: chartTable(slide) },
      };
    }),
  };
}

export const GET: APIRoute = () =>
  new Response(JSON.stringify(build(), null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
