export type CapabilityId =
  | "data-analysis"
  | "instruction-following"
  | "reasoning"
  | "sql"
  | "long-context"
  | "tool-use"
  | "cost"
  | "general";

export type Vendor =
  | "Anthropic"
  | "OpenAI"
  | "Google"
  | "DeepSeek"
  | "Alibaba"
  | "Moonshot"
  | "Zhipu"
  | "Meta"
  | "Mistral"
  | "MiniMax"
  | "xAI";

export interface ModelRecord {
  id: string;
  name: string;
  vendor: Vendor;
  apiId?: string;
  released?: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  openWeights: boolean;
  apiAvailable: boolean;
  toolCalling?: boolean;
  structuredOutput?: boolean;
  zeroDataRetention?: boolean;
  notes?: string;
  docsUrl?: string;
}

export interface LinearNormalization {
  kind: "linear";
  min: number;
  max: number;
}

export interface LogInverseNormalization {
  kind: "log-inverse";
  best: number;
  worst: number;
}

export type Normalization = LinearNormalization | LogInverseNormalization;

export interface BenchmarkRecord {
  id: string;
  name: string;
  capability: CapabilityId;
  weightWithinCapability: number;
  url: string;
  version: string;
  scale: string;
  normalization: Normalization;
  contaminationResistant: boolean;
  dataExport?: string;
  rationale: string;
}

export interface Observation {
  model: string;
  benchmark: string;
  score: number;
  version: string;
  sourceUrl: string;
  retrieved: string;
  note?: string;
}

export interface PricingRecord {
  model: string;
  inputPerM: number;
  outputPerM: number;
  sourceUrl: string;
  retrieved: string;
  note?: string;
}

export interface LatencyRecord {
  model: string;
  ttftSeconds?: number;
  outputTokensPerSecond?: number;
  sourceUrl: string;
  retrieved: string;
}

export interface CapabilityDefinition {
  id: CapabilityId;
  label: string;
  shortLabel: string;
  weight: number;
  description: string;
}

export interface CostBlend {
  inputShare: number;
  outputShare: number;
  normalization: LogInverseNormalization;
}

export interface CompositeConfig {
  capabilities: CapabilityDefinition[];
  minimumCoverage: number;
  cost: CostBlend;
}

export type GateVerdict = "pass" | "fail" | "unknown";

export interface GateDefinition {
  id: string;
  label: string;
  description: string;
}
