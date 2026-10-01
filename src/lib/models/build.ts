import type {
  BenchmarkRecord,
  CapabilityId,
  CompositeConfig,
  LatencyRecord,
  ModelRecord,
  Observation,
  PricingRecord,
  GateVerdict,
} from "../../data/models/types.ts";
import type { Gate, GateResult } from "./gates.ts";
import { eligibility, evaluateGates } from "./gates.ts";
import { nearFrontier, paretoFrontier } from "./pareto.ts";
import { blendedPricePerM } from "./normalize.ts";
import {
  capabilityScores,
  composite,
  costScore,
  scoreObservations,
  type CapabilityScore,
  type CompositeResult,
  type ScoredObservation,
} from "./score.ts";

export interface TrackerInput {
  models: ModelRecord[];
  benchmarks: BenchmarkRecord[];
  observations: Observation[];
  pricing: PricingRecord[];
  latency: LatencyRecord[];
  config: CompositeConfig;
  gates: Gate[];
  nearFrontierTolerance: number;
}

export type ParetoStatus = "frontier" | "near" | "dominated" | "unplaced";

export interface TrackerRow {
  model: ModelRecord;
  capabilities: Map<CapabilityId, CapabilityScore>;
  values: Map<CapabilityId, number>;
  composite: CompositeResult;
  pricing?: PricingRecord;
  blendedPrice: number | null;
  latency?: LatencyRecord;
  gates: GateResult[];
  eligibility: GateVerdict;
  pareto: ParetoStatus;
  lastUpdated: string | null;
}

export interface Tracker {
  rows: TrackerRow[];
  scored: ScoredObservation[];
  lastUpdated: string | null;
}

function latestDate(dates: string[]): string | null {
  if (dates.length === 0) return null;
  return [...dates].sort().at(-1) ?? null;
}

export function buildTracker(input: TrackerInput): Tracker {
  const knownModels = new Set(input.models.map((m) => m.id));
  for (const o of input.observations) {
    if (!knownModels.has(o.model)) throw new Error(`observation references unknown model "${o.model}"`);
  }
  for (const p of input.pricing) {
    if (!knownModels.has(p.model)) throw new Error(`pricing references unknown model "${p.model}"`);
  }
  const scored = scoreObservations(input.observations, input.benchmarks);
  const pricingByModel = new Map(input.pricing.map((p) => [p.model, p]));
  const latencyByModel = new Map(input.latency.map((l) => [l.model, l]));

  const partial = input.models.map((model) => {
    const capabilities = capabilityScores(model.id, scored, input.benchmarks);
    const values = new Map<CapabilityId, number>();
    for (const [id, c] of capabilities) values.set(id, c.value);
    const pricing = pricingByModel.get(model.id);
    const cost = costScore(pricing, input.config);
    if (cost !== null) values.set("cost", cost);
    const blendedPrice = pricing
      ? blendedPricePerM(pricing.inputPerM, pricing.outputPerM, input.config.cost.inputShare, input.config.cost.outputShare)
      : null;
    const comp = composite(values, input.config.capabilities, input.config.minimumCoverage);
    const gateResults = evaluateGates(input.gates, {
      model,
      capabilityValue: (id) => values.get(id as CapabilityId),
    });
    const dates = [
      ...scored.filter((o) => o.model === model.id).map((o) => o.retrieved),
      ...(pricing ? [pricing.retrieved] : []),
    ];
    return {
      model,
      capabilities,
      values,
      composite: comp,
      pricing,
      blendedPrice,
      latency: latencyByModel.get(model.id),
      gates: gateResults,
      eligibility: eligibility(gateResults),
      lastUpdated: latestDate(dates),
    };
  });

  const points = partial
    .filter((r) => r.composite.value !== null && r.blendedPrice !== null)
    .map((r) => ({ id: r.model.id, cost: r.blendedPrice as number, value: r.composite.value as number }));
  const frontier = paretoFrontier(points);
  const near = nearFrontier(points, frontier, input.nearFrontierTolerance);
  const placed = new Set(points.map((p) => p.id));

  const rows: TrackerRow[] = partial.map((r) => ({
    ...r,
    pareto: frontier.has(r.model.id)
      ? "frontier"
      : near.has(r.model.id)
        ? "near"
        : placed.has(r.model.id)
          ? "dominated"
          : "unplaced",
  }));

  rows.sort((a, b) => {
    const av = a.composite.value ?? -1;
    const bv = b.composite.value ?? -1;
    if (av !== bv) return bv - av;
    return a.model.name.localeCompare(b.model.name);
  });

  return {
    rows,
    scored,
    lastUpdated: latestDate(rows.flatMap((r) => (r.lastUpdated ? [r.lastUpdated] : []))),
  };
}
