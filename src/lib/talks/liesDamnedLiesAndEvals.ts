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
    note: "14 slides with the notes for each slide in the notes pane.",
  },
  {
    label: "Talk content as Markdown",
    href: `${path}downloads/${slug}.md`,
    type: "text/markdown",
    note: "Every slide's text, chart notes, notes, scope notes and sources in one readable file.",
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

export type RepoGroup = {
  heading: string;
  repos: { name: string; url: string; note: string }[];
};

const gh = (name: string) => `https://github.com/sjarmak/${name}`;

export const repositories: RepoGroup[] = [
  {
    heading: "Evaluation harnesses and benchmarks",
    repos: [
      {
        name: "codeprobe",
        url: gh("codeprobe"),
        note: "Turns a repository's merged pull requests into coding-agent evaluations, then measures the whole agent setup (model, tools, retrieval, cost, harness) against them. Python CLI, on PyPI. The slide 8 trial comes from it.",
      },
      {
        name: "agent-oriented-architecture",
        url: gh("agent-oriented-architecture"),
        note: "Measures how well a repository works for AI coding agents by running agents on tasks drawn from the repo's own history and scoring how quickly they find, and how cleanly they change, the right code.",
      },
      {
        name: "CodeScaleBench-Public",
        url: gh("CodeScaleBench-Public"),
        note: "275 tasks across 20 suites measuring how coding agents use context retrieval tools in enterprise-scale codebases, with auditable result snapshots.",
      },
      {
        name: "terminal-bench-science",
        url: gh("terminal-bench-science"),
        note: "Terminal-Bench Science: evaluating agents on complex real-world scientific workflows in the terminal.",
      },
      {
        name: "migration-evals",
        url: gh("migration-evals"),
        note: "Grades agent-produced batch-change diffs through tiered oracles (diff validity, compile, tests, AST, LLM judge, invariants), anchored to merged-PR survival.",
      },
      {
        name: "mg-ax",
        url: gh("mg-ax"),
        note: "Evaluation framework for the agentic experience of MCP tools: static lint rules over tool manifests plus a cassette-backed trace pipeline that replays recorded agent sessions into schema-validated claims about tool behavior.",
      },
      {
        name: "omni-benchmark",
        url: gh("omni-benchmark"),
        note: "Omni on LiveSQLBench Large-v1: a frozen, preregistered held-out evaluation (89 questions, four conditions, three repetitions, 1,068 immutable attempts, two preregistered scorers) with a separate mechanism analysis on development data.",
      },
    ],
  },
  {
    heading: "Diagnosis and reliability",
    repos: [
      {
        name: "agent-diagnostics",
        url: gh("agent-diagnostics"),
        note: "Behavioral taxonomy and annotation framework for coding-agent failures: 40 failure categories across 11 dimensions labeled over 11,995 trials from 4 models on 61 benchmarks, with a queryable dataset backend and a pip-installable labeling tool.",
      },
      {
        name: "agent-durability-lab",
        url: gh("agent-durability-lab"),
        note: "An evidence lab for agent durability. Every claim has an unsafe control that fails, an exact fault barrier, and preserved raw runs.",
      },
      {
        name: "software-factory-reliability",
        url: gh("software-factory-reliability"),
        note: "Executable reliability patterns and fault drills for AI software factories. Companion to \"Software Factories Are Distributed Systems.\"",
      },
      {
        name: "agent-routing",
        url: gh("agent-routing"),
        note: "Does an agent need its most capable model for every step? Four routing arms, one designed to lose, measured at cost per successful task.",
      },
      {
        name: "mem",
        url: gh("mem"),
        note: "Agentic memory built from multi-agent orchestration traces (6,691 work items, 874 session transcripts) and benchmarked on the same record: does retained memory improve agent success rate, iterations, and cost?",
      },
    ],
  },
  {
    heading: "Procedures and the monograph",
    repos: [
      {
        name: "coding-agent-workflows",
        url: gh("coding-agent-workflows"),
        note: "Neutral source of coding standards, agent roles, skills, and workflows, rendered to native config for Claude Code, Codex, and Amp. Home of the evaluation-design, harness-traceability and reliability-pass procedures the talk cites.",
      },
      {
        name: "engineering-reliable-coding-agents",
        url: gh("engineering-reliable-coding-agents"),
        note: "The monograph the evidence comes from, with runnable reliability and evaluation protocols, a machine-readable evidence and practice catalog, and reusable agent skills derived from selected practices.",
      },
    ],
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
