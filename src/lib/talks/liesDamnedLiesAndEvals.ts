import raw from "@/data/talks/lies-damned-lies-and-evals.json";
import { site } from "@/data/site";

export type TalkLink = { label: string; url: string };

export type TalkChart = {
  type: string;
  description: string;
  alt_text: string[];
  data: Record<string, unknown> | null;
};

export type TalkSlide = {
  number: number;
  anchor: string;
  title: string;
  kind: "bookend" | "body";
  presentation_only_pre_reveal_prompts: { until_step: number; text: string }[];
  visible_slide_text: string;
  body_text: string;
  stage_content_html: string;
  chart: TalkChart;
  prepared_speaker_notes: string;
  speaker_note_word_count: number;
  timing: string;
  delivery_cue: string;
  scope_and_reference_notes: string;
  sources: TalkLink[];
  visible_footer_citations: TalkLink[];
  resource_links: TalkLink[];
};

export type TalkData = {
  schema_version: string;
  prepared_on: string;
  updated_on: string;
  title: string;
  speaker: string;
  speaker_role: string;
  event: string;
  event_date: string;
  notes_label: string;
  notes_are_delivered_transcript: boolean;
  slide_count: number;
  prepared_script_words: number;
  rehearsal_target_minutes: number;
  hard_cutoff_minutes: number;
  description: string;
  resources: TalkLink[];
  current_qr_target: string;
  slides: TalkSlide[];
};

export const talk = raw as TalkData;

export const slug = "lies-damned-lies-and-evals";
export const path = `/talks/${slug}/`;
export const canonicalUrl = new URL(path, site.url).href;

export type Download = {
  label: string;
  href: string;
  type: string;
  note: string;
};

export const downloads: Download[] = [
  {
    label: "Slides PDF — static edition",
    href: `${path}downloads/AIE_2026_Slides_Static_Edition.pdf`,
    type: "application/pdf",
    note: "14 pages. Same talk and numbers as the animated presentation, with its own static layouts and concise labels.",
  },
  {
    label: "Editable slides — static edition (PPTX)",
    href: `${path}downloads/AIE_2026_Slides_Static_Edition.pptx`,
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    note: "14 slides with the prepared speaker notes in the notes pane.",
  },
  {
    label: "Talk content as Markdown",
    href: `${path}downloads/${slug}.md`,
    type: "text/markdown",
    note: "Every slide's text, chart notes, prepared speaker notes, scope notes and sources in one readable file.",
  },
  {
    label: "Talk content as JSON",
    href: `${path}content.json`,
    type: "application/json",
    note: "Structured version of this page: slides, chart data, notes, sources and downloads.",
  },
  {
    label: "Offline animated presentation (ZIP)",
    href: `${path}downloads/AIE_2026_Animated_Talk_Offline.zip`,
    type: "application/zip",
    note: "The staged HTML presentation with all bundled dependencies, fonts and notices. Open index.html locally.",
  },
];

export const speakerResources: Download[] = [
  {
    label: "Concise speaker cues (PDF)",
    href: `${path}speaker-resources/AIE_NYC_Concise_Speaker_Cues.pdf`,
    type: "application/pdf",
    note: "Per-slide cue sheet used to rehearse the talk.",
  },
  {
    label: "Concise speaker cues (DOCX)",
    href: `${path}speaker-resources/AIE_NYC_Concise_Speaker_Cues.docx`,
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    note: "Editable version of the same cue sheet.",
  },
];

export const qrImage = `${path}coding-agent-workflows-qr.png`;

const chartTypeLabels: Record<string, string> = {
  title: "Title slide",
  mixed: "Reported experiment with a mechanism schematic",
  empirical: "Empirical result",
  conceptual: "Conceptual diagram",
  schematic: "Schematic",
  diagnostic_schematic: "Diagnostic schematic of proposed tests",
  empirical_three_step_build: "Empirical result from one recorded trial",
  reported_audit_plus_proposed_tests: "Reported audit plus proposed tests",
  schematic_with_bounded_empirical_result: "Schematic with a bounded empirical result",
  proposed_protocol: "Proposed protocol",
  proposed_action_decision_record: "Proposed decision record",
  resource_endcard: "Resources",
};

export function chartTypeLabel(type: string): string {
  return chartTypeLabels[type] ?? type.replaceAll("_", " ");
}

export function sectionLabel(slide: TalkSlide): string {
  const first = slide.visible_slide_text.split("\n")[0] ?? "";
  return first.replace(/\s+AIE NYC$/, "").trim();
}

export function notesParagraphs(slide: TalkSlide): string[] {
  return slide.prepared_speaker_notes
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export type ChartTable = {
  caption: string;
  head: string[];
  rows: (string | number)[][];
};

function pct(n: number, d: number): string {
  return `${((n / d) * 100).toFixed(1)}%`;
}

export function chartTable(slide: TalkSlide): ChartTable | null {
  const data = slide.chart.data;
  if (!data) return null;
  if (slide.number === 3) {
    const tasks = data.tasks as number;
    const harnesses = ["OpenHands", "PI"] as const;
    const models = ["Claude Opus 5", "GPT-6 Astra"] as const;
    const rows = harnesses.flatMap((h) =>
      models.map((m) => {
        const solved = (data[h] as Record<string, number>)[m];
        return [h, m, `${solved} / ${tasks}`, pct(solved, tasks)];
      }),
    );
    return {
      caption: `Tasks solved out of ${tasks}, one scored run per task and configuration.`,
      head: ["Harness", "Model", "Solved", "Share"],
      rows,
    };
  }
  if (slide.number === 8) {
    const d = data as Record<string, string | number>;
    return {
      caption: `One CodeProbe trial (task ${d.task_id}), scored against one declared reference set.`,
      head: ["Measure", "Value"],
      rows: [
        ["Files returned", d.returned_files],
        ["Reference files expected", d.expected_files],
        ["Reference files found", d.matched_expected_files],
        ["Recall", d.recall],
        ["Precision", d.precision],
        ["F1", d.f1],
        ["Declared reward family", `${d.declared_reward_family} (beta = ${d.beta})`],
        ["Actual reward under the declared rule", d.actual_reward],
      ],
    };
  }
  return null;
}

export function dedupeLinks(links: TalkLink[]): TalkLink[] {
  const seen = new Set<string>();
  return links.filter((l) => {
    if (seen.has(l.url)) return false;
    seen.add(l.url);
    return true;
  });
}

export function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
