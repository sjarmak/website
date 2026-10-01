import { buildTracker, type TrackerInput } from "../../lib/models/build.ts";
import { benchmarks } from "./benchmarks.ts";
import { compositeConfig } from "./capabilities.ts";
import { gates } from "./gates.ts";
import { models } from "./models.ts";
import observationsData from "./observations.json";
import pricingData from "./pricing.json";
import latencyData from "./latency.json";
import type { LatencyRecord, Observation, PricingRecord } from "./types.ts";

export const NEAR_FRONTIER_TOLERANCE = 0.05;

export const trackerInput: TrackerInput = {
  models,
  benchmarks,
  observations: observationsData as Observation[],
  pricing: pricingData as PricingRecord[],
  latency: latencyData as LatencyRecord[],
  config: compositeConfig,
  gates,
  nearFrontierTolerance: NEAR_FRONTIER_TOLERANCE,
};

export const tracker = buildTracker(trackerInput);
