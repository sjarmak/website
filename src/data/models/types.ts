export type CapabilityId =
  | "data-analysis"
  | "instruction-following"
  | "reasoning"
  | "sql"
  | "long-context"
  | "tool-use"
  | "cost"
  | "general";

export const VENDORS = [
  "Anthropic",
  "OpenAI",
  "Google",
  "DeepSeek",
  "Alibaba",
  "Moonshot",
  "Zhipu",
  "Meta",
  "Mistral",
  "MiniMax",
  "xAI",
] as const;

export type Vendor = (typeof VENDORS)[number];

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
  privacyVia?: string[];
  notes?: string;
  docsUrl?: string;
  supersededBy?: Supersession;
}

export interface Supersession {
  model: string;
  sourceUrl: string;
  retrieved: string;
  note?: string;
}

export type OmniVerdict = "in-catalog" | "meets-constraints" | "unresolved" | "ineligible";

export type OmniBasis =
  | "exact-model-listed"
  | "provider-family-supported"
  | "evidence-inconclusive"
  | "citation-not-found"
  | "gates-unknown"
  | "not-assessed"
  | "provider-not-supported"
  | "failed-catalog-constraint"
  | "failed-gate";

export interface OmniEligibility {
  model: string;
  verdict: OmniVerdict;
  basis: OmniBasis;
  gates?: string[];
  catalogCommit: string;
  retrieved: string;
}

export type SourceStatus = "ok" | "failed";

export interface RefreshSource {
  source: string;
  status: SourceStatus;
  checked: string;
  lastOk: string | null;
}

export type RefreshOutcome = "never-run" | "published" | "no-change" | "failed";

export interface RefreshStatus {
  lastAttempt: string | null;
  lastSuccess: string | null;
  outcome: RefreshOutcome;
  failedStage: string | null;
  exitCode: number | null;
  catalogCommit: string | null;
  accepted: number;
  rejected: number;
  sources: RefreshSource[];
}

export type HistoryTable = "models" | "observations" | "pricing" | "omni";

export interface HistoryEntry {
  table: HistoryTable;
  model: string;
  key: string;
  previous: unknown;
  replacedOn: string;
  sourceUrl?: string;
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
  provider?: string;
  scope?: string;
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
