import type { Gate } from "../../lib/models/gates.ts";
import { verdictFromFlag, verdictFromThreshold } from "../../lib/models/gates.ts";

export const MIN_CONTEXT_WINDOW = 200_000;
export const MIN_OUTPUT_TOKENS = 32_000;
export const MIN_INSTRUCTION_FOLLOWING = 0.7;

export const gates: Gate[] = [
  {
    id: "context",
    label: `Context ≥ ${MIN_CONTEXT_WINDOW / 1000}k`,
    description:
      "Analytics turns carry a semantic model, tool results and history; the harness prunes between 75k and 175k tokens, so the model needs headroom above that.",
    evaluate: ({ model }) => verdictFromThreshold(model.contextWindow, MIN_CONTEXT_WINDOW),
  },
  {
    id: "output",
    label: `Output ≥ ${MIN_OUTPUT_TOKENS / 1000}k`,
    description: "Dashboard and app generation emit long structured artifacts in a single response.",
    evaluate: ({ model }) => verdictFromThreshold(model.maxOutputTokens, MIN_OUTPUT_TOKENS),
  },
  {
    id: "tools",
    label: "Tool calling",
    description: "The agent loop is tool calls all the way down: search the semantic model, generate SQL, validate, visualize.",
    evaluate: ({ model }) => verdictFromFlag(model.toolCalling),
  },
  {
    id: "structured",
    label: "Structured output",
    description: "Validators and one-shot generators require JSON-schema or tool-shaped structured responses.",
    evaluate: ({ model }) => verdictFromFlag(model.structuredOutput),
  },
  {
    id: "api",
    label: "Hosted API",
    description: "Available through a first-party API or a major cloud (Bedrock, Vertex, Azure) or an OpenAI-compatible host.",
    evaluate: ({ model }) => verdictFromFlag(model.apiAvailable),
  },
  {
    id: "privacy",
    label: "No-training / ZDR option",
    description:
      "A contractual option for zero data retention or at least a no-training commitment on API traffic, from the vendor or from a third-party host that serves the same model (Bedrock, Vertex, Fireworks, Vercel AI Gateway and similar).",
    evaluate: ({ model }) =>
      model.privacyVia && model.privacyVia.length > 0 ? "pass" : verdictFromFlag(model.zeroDataRetention),
  },
  {
    id: "instruction-floor",
    label: `Instruction following ≥ ${Math.round(MIN_INSTRUCTION_FOLLOWING * 100)}`,
    description: "A model that ignores formatting and scope constraints fails the harness regardless of raw capability.",
    evaluate: ({ capabilityValue }) =>
      verdictFromThreshold(capabilityValue("instruction-following"), MIN_INSTRUCTION_FOLLOWING),
  },
];
