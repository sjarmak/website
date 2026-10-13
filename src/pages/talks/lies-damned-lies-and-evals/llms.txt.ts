import type { APIRoute } from "astro";
import { site } from "@/data/site";
import {
  talk,
  canonicalUrl,
  downloads,
  speakerResources,
  chartTypeLabel,
  sectionLabel,
  chartTable,
  longDate,
  type TalkLink,
} from "@/lib/talks/liesDamnedLiesAndEvals";

function absolute(href: string): string {
  return new URL(href, site.url).href;
}

function links(items: TalkLink[]): string[] {
  return items.map((l) => `- ${l.label}: ${l.url}`);
}

function render(): string {
  const out: string[] = [];
  const eventDate = longDate(talk.event_date);
  out.push(`# ${talk.title}`);
  out.push("");
  out.push(
    `> Agent-readable version of the talk by ${talk.speaker} (${talk.speaker_role}) at ${talk.event}, ${eventDate}. ${talk.description} This file carries all ${talk.slide_count} slides in order with the exact slide text, chart data, the prepared speaker notes, per-slide scope notes and caveats, sources with URLs, and download links. The speaker notes are a prepared script, not a transcript of the delivered talk.`,
  );
  out.push("");
  out.push(`Canonical page: ${canonicalUrl}`);
  out.push(`Structured JSON: ${absolute(`${canonicalUrl}content.json`)}`);
  out.push(`Content last updated: ${talk.updated_on}`);
  out.push("");
  out.push("## Downloads");
  out.push("");
  for (const d of downloads) out.push(`- ${d.label}: ${absolute(d.href)} (${d.note})`);
  for (const d of speakerResources) out.push(`- Speaker resource, ${d.label}: ${absolute(d.href)} (${d.note})`);
  out.push("");
  out.push("## Procedures and references");
  out.push("");
  out.push(...links(talk.resources));
  out.push("");
  out.push(`## Talk outline (${talk.slide_count} slides)`);
  out.push("");
  for (const s of talk.slides) out.push(`${s.number}. ${s.title} — ${canonicalUrl}#${s.anchor}`);
  out.push("");
  out.push("## Evidence boundaries");
  out.push("");
  out.push(
    "Each slide distinguishes observed results, reported audits, simulations, illustrative arithmetic and proposed tests. Preserve denominators, units and caveats when quoting. A lack of clear score improvement does not establish equivalent quality. An observed model–harness ranking reversal is not a universal model ranking or a significance claim. Proposed tests have not been run.",
  );
  out.push("");

  for (const s of talk.slides) {
    out.push(`## Slide ${s.number}: ${s.title}`);
    out.push("");
    out.push(`Anchor: ${canonicalUrl}#${s.anchor}`);
    out.push(`Section: ${sectionLabel(s)} · Timing: ${s.timing}`);
    out.push("");
    out.push("### Slide text");
    out.push("");
    out.push(s.body_text);
    out.push("");
    if (s.visible_footer_citations.length > 0) {
      out.push("Cited on the slide:");
      out.push(...links(s.visible_footer_citations));
      out.push("");
    }
    out.push(`### Chart or diagram (${chartTypeLabel(s.chart.type)})`);
    out.push("");
    for (const alt of s.chart.alt_text) out.push(alt);
    if (s.chart.alt_text.length > 0) out.push("");
    const table = chartTable(s);
    if (table) {
      out.push(table.caption);
      out.push("");
      out.push(`| ${table.head.join(" | ")} |`);
      out.push(`| ${table.head.map(() => "---").join(" | ")} |`);
      for (const row of table.rows) out.push(`| ${row.join(" | ")} |`);
      out.push("");
    }
    out.push(`Figure brief: ${s.chart.description}`);
    out.push("");
    out.push(`### ${talk.notes_label}`);
    out.push("");
    out.push(s.prepared_speaker_notes.trim() || "No separate spoken section on this slide.");
    out.push("");
    out.push("### Scope and caveats");
    out.push("");
    out.push(s.scope_and_reference_notes);
    out.push("");
    if (s.sources.length > 0) {
      out.push("### Sources");
      out.push("");
      out.push(...links(s.sources));
      out.push("");
    }
  }

  out.push("## Delivery notes");
  out.push("");
  out.push(
    `The prepared script totals ${talk.prepared_script_words.toLocaleString("en-US")} words with a ${talk.rehearsal_target_minutes}-minute rehearsal target and a ${talk.hard_cutoff_minutes}-minute cutoff. The opening audience question is spoken while the title slide is visible; its words are stored once under slide 2. The resource slide has no spoken section.`,
  );
  out.push("");
  return out.join("\n");
}

export const GET: APIRoute = () =>
  new Response(render(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
