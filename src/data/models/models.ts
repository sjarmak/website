import type { ModelRecord } from "./types.ts";

const anthropicDocs = "https://platform.claude.com/docs/en/about-claude/models/overview";
const openaiDocs = "https://developers.openai.com/api/docs/models";
const geminiDocs = "https://ai.google.dev/gemini-api/docs/models";
const deepseekDocs = "https://api-docs.deepseek.com/quick_start/pricing";
const kimiDocs = "https://platform.kimi.ai/docs/api/models-overview";
const zaiDocs = "https://docs.z.ai/guides/llm/glm-5.3";

const anthropicCurrent = {
  vendor: "Anthropic",
  contextWindow: 1_000_000,
  maxOutputTokens: 128_000,
  openWeights: false,
  apiAvailable: true,
  toolCalling: true,
  structuredOutput: true,
  zeroDataRetention: true,
  docsUrl: anthropicDocs,
} as const;

const anthropicLegacy = {
  vendor: "Anthropic",
  openWeights: false,
  apiAvailable: true,
  toolCalling: true,
  structuredOutput: true,
  zeroDataRetention: true,
  docsUrl: anthropicDocs,
} as const;

const openaiCurrent = {
  vendor: "OpenAI",
  contextWindow: 1_050_000,
  maxOutputTokens: 128_000,
  openWeights: false,
  apiAvailable: true,
  toolCalling: true,
  structuredOutput: true,
  zeroDataRetention: true,
  docsUrl: openaiDocs,
} as const;

const geminiCurrent = {
  vendor: "Google",
  contextWindow: 1_048_576,
  maxOutputTokens: 65_536,
  openWeights: false,
  apiAvailable: true,
  toolCalling: true,
  structuredOutput: true,
  zeroDataRetention: true,
  docsUrl: geminiDocs,
} as const;

const deepseekCurrent = {
  vendor: "DeepSeek",
  contextWindow: 1_000_000,
  maxOutputTokens: 384_000,
  openWeights: true,
  apiAvailable: true,
  toolCalling: true,
  structuredOutput: false,
  zeroDataRetention: false,
  docsUrl: deepseekDocs,
} as const;

export const models: ModelRecord[] = [
  { ...anthropicCurrent, id: "claude-fable-5.1", name: "Claude Fable 5.1", apiId: "claude-fable-5-1", released: "2026-09-01", notes: "Forced tool choice returns an error on this model." },
  { ...anthropicLegacy, id: "claude-fable-5", name: "Claude Fable 5", notes: "No current model page; limits not recorded." },
  { ...anthropicCurrent, id: "claude-opus-5.5", name: "Claude Opus 5.5", apiId: "claude-opus-5-5", released: "2026-09-22" },
  { ...anthropicCurrent, id: "claude-opus-5", name: "Claude Opus 5", apiId: "claude-opus-5", released: "2026-07-24", notes: "Marked legacy by the vendor." },
  { ...anthropicCurrent, id: "claude-sonnet-5.5", name: "Claude Sonnet 5.5", apiId: "claude-sonnet-5-5", released: "2026-09-28" },
  { ...anthropicCurrent, id: "claude-sonnet-5", name: "Claude Sonnet 5", apiId: "claude-sonnet-5", released: "2026-06-30", notes: "Marked legacy by the vendor." },
  { ...anthropicLegacy, id: "claude-opus-4.8", name: "Claude Opus 4.8", notes: "No current model page; limits not recorded." },
  { ...anthropicLegacy, id: "claude-sonnet-4.6", name: "Claude Sonnet 4.6", notes: "No current model page; limits not recorded." },
  { ...anthropicLegacy, id: "claude-sonnet-4.5", name: "Claude Sonnet 4.5", apiId: "claude-sonnet-4-5", released: "2025-09-29", contextWindow: 200_000, maxOutputTokens: 64_000, notes: "Deprecated 2026-09-30, retires 2026-11-30." },
  { ...anthropicLegacy, id: "claude-haiku-4.5", name: "Claude Haiku 4.5", apiId: "claude-haiku-4-5", released: "2025-10-15", contextWindow: 200_000, maxOutputTokens: 64_000 },
  { ...openaiCurrent, id: "gpt-6-astra", name: "GPT-6 Astra", apiId: "gpt-6-astra", released: "2026-09-03" },
  { ...openaiCurrent, id: "gpt-6.1-sol", name: "GPT-6.1 Sol", apiId: "gpt-6.1-sol", released: "2026-09-29" },
  { ...openaiCurrent, id: "gpt-6-sol", name: "GPT-6 Sol", apiId: "gpt-6-sol", released: "2026-09-22", notes: "Superseded by GPT-6.1 Sol." },
  { ...openaiCurrent, id: "gpt-6-luna", name: "GPT-6 Luna", apiId: "gpt-6-luna", released: "2026-09-22" },
  { ...openaiCurrent, id: "gpt-5.6-sol", name: "GPT-5.6 Sol", apiId: "gpt-5.6-sol", released: "2026-07-09" },
  { ...openaiCurrent, id: "gpt-5.6-terra", name: "GPT-5.6 Terra", apiId: "gpt-5.6-terra", released: "2026-07-09" },
  { ...openaiCurrent, id: "gpt-5.6-luna", name: "GPT-5.6 Luna", apiId: "gpt-5.6-luna", released: "2026-07-09" },
  { ...openaiCurrent, id: "gpt-5.5", name: "GPT-5.5", apiId: "gpt-5.5", released: "2026-04-24" },
  { ...openaiCurrent, id: "gpt-5.4", name: "GPT-5.4", apiId: "gpt-5.4", released: "2026-03-05" },
  { vendor: "OpenAI", id: "gpt-5.2", name: "GPT-5.2", apiId: "gpt-5.2", openWeights: false, apiAvailable: true, toolCalling: true, structuredOutput: true, zeroDataRetention: true, docsUrl: openaiDocs, notes: "No current model page; limits not recorded." },
  { vendor: "Google", id: "gemini-4-argon", name: "Gemini 4 Argon", released: "2026-09-30", openWeights: false, apiAvailable: false, zeroDataRetention: true, docsUrl: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/", notes: "Announced the day before this snapshot; limited release with no public API id or benchmark rows yet." },
  { ...geminiCurrent, id: "gemini-3.8-flash", name: "Gemini 3.8 Flash", apiId: "gemini-3.8-flash", released: "2026-09-02" },
  { vendor: "Google", id: "gemini-3.7-flash", name: "Gemini 3.7 Flash", openWeights: false, apiAvailable: true, toolCalling: true, structuredOutput: true, zeroDataRetention: true, docsUrl: geminiDocs, notes: "No current model page; limits not recorded." },
  { ...geminiCurrent, id: "gemini-3.1-pro", name: "Gemini 3.1 Pro", apiId: "gemini-3.1-pro-preview", released: "2026-02-19", notes: "Still served as a preview." },
  { ...deepseekCurrent, id: "deepseek-v4.1-flash", name: "DeepSeek V4.1 Flash", apiId: "deepseek-flash", released: "2026-09-10", privacyVia: ["Fireworks", "DeepInfra", "Vercel AI Gateway"], notes: "JSON mode only, no schema enforcement. The first-party API permits training with an opt-out; Fireworks serves the same weights with zero data retention by default. MIT weights." },
  { ...deepseekCurrent, id: "deepseek-v4-pro", name: "DeepSeek V4 Pro (0813)", apiId: "deepseek-v4-pro", released: "2026-08-13", privacyVia: ["Fireworks", "Microsoft Foundry"], notes: "JSON mode only, no schema enforcement. The first-party API permits training with an opt-out; Fireworks serves the same weights with zero data retention by default, directly and through Microsoft Foundry. MIT weights." },
  { ...deepseekCurrent, id: "deepseek-v4-flash", name: "DeepSeek V4 Flash (0731)", released: "2026-07-31", apiAvailable: false, notes: "The hosted Flash endpoint now serves V4.1; this release remains available only as MIT weights." },
  { vendor: "Moonshot", id: "kimi-k3", name: "Kimi K3", apiId: "kimi-k3", released: "2026-07-16", contextWindow: 1_000_000, maxOutputTokens: 131_072, openWeights: true, apiAvailable: true, toolCalling: true, structuredOutput: true, zeroDataRetention: true, docsUrl: kimiDocs, notes: "Output limit is configurable up to the full window. Weights under the Kimi K3 License." },
  { vendor: "Moonshot", id: "kimi-k2.6", name: "Kimi K2.6", apiId: "kimi-k2.6", released: "2026-04", contextWindow: 262_144, openWeights: true, apiAvailable: true, toolCalling: true, zeroDataRetention: true, docsUrl: kimiDocs, notes: "JSON mode documented; schema-enforced output not confirmed. Modified MIT weights." },
  { vendor: "Zhipu", id: "glm-5.3", name: "GLM-5.3", apiId: "glm-5.3", released: "2026-08-18", contextWindow: 1_000_000, maxOutputTokens: 128_000, openWeights: true, apiAvailable: true, toolCalling: true, structuredOutput: true, zeroDataRetention: true, docsUrl: zaiDocs, notes: "Weights under a custom GLM-5.3 licence." },
  { vendor: "Zhipu", id: "glm-5.3-flash", name: "GLM-5.3 Flash", apiId: "glm-5.3-flash", released: "2026-08-26", contextWindow: 1_000_000, maxOutputTokens: 128_000, openWeights: true, apiAvailable: true, toolCalling: true, structuredOutput: true, zeroDataRetention: true, docsUrl: "https://docs.z.ai/guides/vlm/glm-5.3-flash", notes: "MIT weights." },
  { vendor: "Alibaba", id: "qwen3.8-max", name: "Qwen3.8 Max", apiId: "qwen3.8-max", released: "2026-09-02", contextWindow: 1_000_000, maxOutputTokens: 131_072, openWeights: true, apiAvailable: true, toolCalling: true, structuredOutput: true, zeroDataRetention: true, docsUrl: "https://www.alibabacloud.com/help/en/model-studio/qwen3-8-max", notes: "Weights published under a custom licence; no-training commitment but call data is stored." },
  { vendor: "MiniMax", id: "minimax-m3", name: "MiniMax M3", apiId: "MiniMax-M3", released: "2026-06-01", contextWindow: 1_000_000, openWeights: true, apiAvailable: true, toolCalling: true, structuredOutput: false, zeroDataRetention: false, privacyVia: ["Fireworks", "Vercel AI Gateway"], docsUrl: "https://platform.minimax.io/docs/guides/models-intro.md", notes: "Schema-enforced output is limited to an older model; the first-party policy permits de-identified data use, but Fireworks serves the same weights with zero data retention by default. Community-licence weights." },
  { vendor: "Meta", id: "muse-spark-1.3", name: "Muse Spark 1.3", openWeights: false, apiAvailable: false, notes: "No public API." },
  { vendor: "xAI", id: "grok-4.7", name: "Grok 4.7", openWeights: false, apiAvailable: true, toolCalling: true, structuredOutput: true, zeroDataRetention: true, docsUrl: "https://docs.x.ai/build/enterprise", notes: "xAI does not train on API traffic without permission and offers zero data retention on enterprise agreements." },
  { vendor: "xAI", id: "grok-4.6", name: "Grok 4.6", openWeights: false, apiAvailable: true, toolCalling: true, structuredOutput: true, zeroDataRetention: true, docsUrl: "https://docs.x.ai/build/enterprise", notes: "xAI does not train on API traffic without permission and offers zero data retention on enterprise agreements." },
];
