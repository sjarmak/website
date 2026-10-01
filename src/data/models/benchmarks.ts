import type { BenchmarkRecord } from "./types.ts";

const percent = { kind: "linear", min: 0, max: 100 } as const;

export const benchmarks: BenchmarkRecord[] = [
  {
    id: "livebench-data-analysis",
    name: "LiveBench · Data Analysis",
    capability: "data-analysis",
    weightWithinCapability: 1,
    url: "https://livebench.ai/",
    version: "2026-06-25 question set",
    scale: "0–100 (mean task accuracy)",
    normalization: percent,
    contaminationResistant: true,
    dataExport: "https://huggingface.co/livebench",
    rationale:
      "Table reformatting, column-type annotation and join prediction on fresh Kaggle and Socrata tables. Questions rotate, so scores are hard to memorise.",
  },
  {
    id: "livebench-instruction-following",
    name: "LiveBench · Instruction Following",
    capability: "instruction-following",
    weightWithinCapability: 1,
    url: "https://livebench.ai/",
    version: "2026-06-25 question set",
    scale: "0–100 (mean task accuracy)",
    normalization: percent,
    contaminationResistant: true,
    dataExport: "https://huggingface.co/livebench",
    rationale:
      "Paraphrase, summarise and simplify recent articles under layered formatting and length constraints. IFEval is saturated and absent from current boards; IFBench covers open models only.",
  },
  {
    id: "livebench-reasoning",
    name: "LiveBench · Reasoning",
    capability: "reasoning",
    weightWithinCapability: 1,
    url: "https://livebench.ai/",
    version: "2026-06-25 question set",
    scale: "0–100 (mean task accuracy)",
    normalization: percent,
    contaminationResistant: true,
    dataExport: "https://huggingface.co/livebench",
    rationale:
      "Zebra puzzles, spatial reasoning and web-of-lies variants. Chosen over GPQA Diamond and MMLU-Pro, which the top of the field has saturated.",
  },
  {
    id: "livesqlbench-base",
    name: "LiveSQLBench · Base-Full",
    capability: "sql",
    weightWithinCapability: 1,
    url: "https://livesqlbench.ai/",
    version: "Base-Full v1 (600 tasks)",
    scale: "0–100 (execution accuracy)",
    normalization: percent,
    contaminationResistant: true,
    dataExport: "https://huggingface.co/datasets/birdsql/livesqlbench-base-full",
    rationale:
      "Text-to-SQL over live, multi-dialect production-style schemas with execution checking. Spider 2.0 was considered, but its leaderboard ranks agent systems rather than bare models.",
  },
  {
    id: "aa-lcr",
    name: "AA-LCR (Long Context Reasoning)",
    capability: "long-context",
    weightWithinCapability: 1,
    url: "https://artificialanalysis.ai/evaluations/long-context-reasoning",
    version: "v1.1",
    scale: "0–100 (accuracy)",
    normalization: percent,
    contaminationResistant: false,
    rationale:
      "Reasoning over 100k-token document sets rather than needle retrieval. LongBench v2 is no longer maintained for current models; MRCR scores are vendor self-reports.",
  },
  {
    id: "hle-no-tools",
    name: "Humanity's Last Exam (no tools)",
    capability: "general",
    weightWithinCapability: 1,
    url: "https://labs.scale.com/leaderboard/humanitys_last_exam",
    version: "Scale AI leaderboard, 2026-09-17 refresh",
    scale: "0–100 (accuracy)",
    normalization: percent,
    contaminationResistant: false,
    rationale:
      "Broad expert-level knowledge and reasoning, scored by an independent lab without tool access. Vendor-reported with-tools numbers are a different benchmark and are not mixed in.",
  },
  {
    id: "terminal-bench-4",
    name: "Terminal-Bench 4.0",
    capability: "tool-use",
    weightWithinCapability: 1,
    url: "https://www.tbench.ai/leaderboard",
    version: "4.0, tbench.ai official harness",
    scale: "0–100 (task pass rate)",
    normalization: percent,
    contaminationResistant: false,
    rationale:
      "Multi-step tool loops in a sandboxed shell. Only rows from the maintainers' own harness are recorded; third-party harnesses differ by five to ten points on the same model.",
  },
  {
    id: "tau3-banking",
    name: "τ³-bench · Banking",
    capability: "tool-use",
    weightWithinCapability: 1,
    url: "https://taubench.com/",
    version: "τ³-bench Banking domain",
    scale: "0–100 (pass^1)",
    normalization: percent,
    contaminationResistant: false,
    rationale:
      "Policy-constrained tool calling against a simulated customer, the closest public analogue to a governed analytics agent.",
  },
];
