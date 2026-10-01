import type {
  BenchmarkRecord,
  CapabilityDefinition,
  CapabilityId,
  CompositeConfig,
  Observation,
  PricingRecord,
} from "../../data/models/types.ts";
import { blendedPricePerM, normalizeScore } from "./normalize.ts";

export interface ScoredObservation extends Observation {
  normalized: number;
  benchmarkName: string;
  capability: CapabilityId;
}

export interface CapabilityScore {
  capability: CapabilityId;
  value: number;
  observations: ScoredObservation[];
}

export interface CompositeResult {
  value: number | null;
  coverage: number;
  coveredWeight: number;
  totalWeight: number;
}

export function scoreObservations(
  observations: Observation[],
  benchmarks: BenchmarkRecord[],
): ScoredObservation[] {
  const byId = new Map(benchmarks.map((b) => [b.id, b]));
  return observations.map((o) => {
    const benchmark = byId.get(o.benchmark);
    if (!benchmark) throw new Error(`observation references unknown benchmark "${o.benchmark}"`);
    if (benchmark.version !== o.version) {
      throw new Error(
        `observation for ${o.model} on ${o.benchmark} is version "${o.version}" but the benchmark definition is "${benchmark.version}"`,
      );
    }
    return {
      ...o,
      normalized: normalizeScore(o.score, benchmark.normalization),
      benchmarkName: benchmark.name,
      capability: benchmark.capability,
    };
  });
}

export function capabilityScores(
  modelId: string,
  scored: ScoredObservation[],
  benchmarks: BenchmarkRecord[],
): Map<CapabilityId, CapabilityScore> {
  const result = new Map<CapabilityId, CapabilityScore>();
  const weightOf = new Map(benchmarks.map((b) => [b.id, b.weightWithinCapability]));
  const mine = scored.filter((o) => o.model === modelId);
  const grouped = new Map<CapabilityId, ScoredObservation[]>();
  for (const o of mine) {
    const list = grouped.get(o.capability) ?? [];
    grouped.set(o.capability, [...list, o]);
  }
  for (const [capability, obs] of grouped) {
    let weighted = 0;
    let weightSum = 0;
    for (const o of obs) {
      const w = weightOf.get(o.benchmark) ?? 0;
      weighted += o.normalized * w;
      weightSum += w;
    }
    if (weightSum > 0) {
      result.set(capability, { capability, value: weighted / weightSum, observations: obs });
    }
  }
  return result;
}

export function costScore(pricing: PricingRecord | undefined, config: CompositeConfig): number | null {
  if (!pricing) return null;
  const blended = blendedPricePerM(
    pricing.inputPerM,
    pricing.outputPerM,
    config.cost.inputShare,
    config.cost.outputShare,
  );
  return normalizeScore(blended, config.cost.normalization);
}

export function composite(
  values: Map<CapabilityId, number>,
  capabilities: CapabilityDefinition[],
  minimumCoverage: number,
): CompositeResult {
  let totalWeight = 0;
  let coveredWeight = 0;
  let weighted = 0;
  for (const cap of capabilities) {
    if (cap.weight <= 0) continue;
    totalWeight += cap.weight;
    const v = values.get(cap.id);
    if (v === undefined) continue;
    coveredWeight += cap.weight;
    weighted += v * cap.weight;
  }
  if (totalWeight === 0) return { value: null, coverage: 0, coveredWeight: 0, totalWeight: 0 };
  const coverage = coveredWeight / totalWeight;
  const value = coverage >= minimumCoverage && coveredWeight > 0 ? weighted / coveredWeight : null;
  return { value, coverage, coveredWeight, totalWeight };
}
