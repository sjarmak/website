import type { CompositeConfig } from "./types.ts";

export const compositeConfig: CompositeConfig = {
  capabilities: [
    {
      id: "data-analysis",
      label: "Data analysis",
      shortLabel: "Data",
      weight: 0.2,
      description: "Reading tables, reformatting and joining records, predicting column types and relationships.",
    },
    {
      id: "instruction-following",
      label: "Instruction following",
      shortLabel: "Instr.",
      weight: 0.2,
      description: "Honouring explicit formatting, length and content constraints, including over several turns.",
    },
    {
      id: "sql",
      label: "SQL / structured data",
      shortLabel: "SQL",
      weight: 0.2,
      description: "Writing correct queries against real enterprise schemas and warehouse dialects.",
    },
    {
      id: "reasoning",
      label: "Reasoning",
      shortLabel: "Reason",
      weight: 0.15,
      description: "Multi-step logical and quantitative problems that do not reduce to recall.",
    },
    {
      id: "long-context",
      label: "Long context",
      shortLabel: "Long ctx",
      weight: 0.1,
      description: "Keeping facts straight across tens of thousands of tokens of tool output and history.",
    },
    {
      id: "cost",
      label: "Cost / efficiency",
      shortLabel: "Cost",
      weight: 0.1,
      description: "Blended list price per million tokens, on a log scale (see the cost rule below).",
    },
    {
      id: "general",
      label: "General knowledge",
      shortLabel: "General",
      weight: 0.05,
      description: "Broad domain knowledge that helps the agent interpret business vocabulary.",
    },
    {
      id: "tool-use",
      label: "Tool / agent",
      shortLabel: "Tools",
      weight: 0,
      description:
        "Multi-turn tool calling and agentic task completion. Tracked and shown, but held at zero weight until a public measurement matches our tool surface.",
    },
  ],
  minimumCoverage: 0.75,
  cost: {
    inputShare: 3,
    outputShare: 1,
    normalization: { kind: "log-inverse", best: 0.1, worst: 50 },
  },
};
