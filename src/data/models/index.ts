import { buildTracker, type TrackerInput } from "../../lib/models/build.ts";
import { selectCandidates } from "../../lib/models/candidates.ts";
import { benchmarks } from "./benchmarks.ts";
import { compositeConfig } from "./capabilities.ts";
import { gates } from "./gates.ts";
import { models } from "./models.ts";
import observationsData from "./observations.json";
import pricingData from "./pricing.json";
import latencyData from "./latency.json";
import eligibilityData from "./omni-eligibility.json";
import refreshStatusData from "./refresh-status.json";
import type {
  LatencyRecord,
  Observation,
  OmniEligibility,
  PricingRecord,
  RefreshStatus,
} from "./types.ts";

export const NEAR_FRONTIER_TOLERANCE = 0.05;

const observations = observationsData as Observation[];
const pricing = pricingData as PricingRecord[];
const latency = latencyData as LatencyRecord[];

export const selection = selectCandidates(models, eligibilityData as OmniEligibility[], observations);
export const refreshStatus = refreshStatusData as RefreshStatus;

const active = new Set(selection.active.map((m) => m.id));

export const trackerInput: TrackerInput = {
  models: selection.active,
  benchmarks,
  observations: observations.filter((o) => active.has(o.model)),
  pricing: pricing.filter((p) => active.has(p.model)),
  latency: latency.filter((l) => active.has(l.model)),
  config: compositeConfig,
  gates,
  nearFrontierTolerance: NEAR_FRONTIER_TOLERANCE,
  rankable: (model) => selection.rankable.has(model.id),
};

export const tracker = buildTracker(trackerInput);
