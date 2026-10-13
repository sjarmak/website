import { site } from "@/data/site";
import {
  talk,
  canonicalUrl,
  downloads,
  repositories,
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

export function renderTalkMarkdown(): string {
  const out: string[] = [];
  const eventDate = longDate(talk.event_date);
  out.push(`# ${talk.title}`);
  out.push("");
  out.push(
    `> Text version of the talk by ${talk.speaker} (${talk.speaker_role}) at ${talk.event}, ${eventDate}. ${talk.description} This file carries all ${talk.slide_count} slides in order with the exact slide text, chart data, the notes for each slide, per-slide scope notes and caveats, sources with URLs, related public repositories, and download links. The notes are the prepared text, not a transcript of the delivered talk.`,
  );
  out.push("");
  out.push(`Canonical page: ${canonicalUrl}`);
  out.push(`Structured JSON: ${absolute(`${canonicalUrl}content.json`)}`);
  out.push(`Content last updated: ${talk.updated_on}`);
  out.push("");
  out.push("## Downloads");
  out.push("");
  for (const d of downloads) out.push(`- ${d.label}: ${absolute(d.href)} (${d.note})`);
  out.push("");
  out.push("## Repositories");
  out.push("");
  for (const group of repositories) {
    out.push(`### ${group.heading}`);
    out.push("");
    for (const r of group.repos) out.push(`- sjarmak/${r.name}: ${r.url} — ${r.note}`);
    out.push("");
  }
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
    out.push(`Section: ${sectionLabel(s)}`);
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
    out.push("### Notes");
    out.push("");
    out.push(s.prepared_speaker_notes.trim() || "No notes for this slide.");
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

  return out.join("\n");
}
