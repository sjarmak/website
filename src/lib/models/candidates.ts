import type { ModelRecord, Observation, OmniEligibility } from "../../data/models/types.ts";

export type RetiredReason = "superseded" | "ineligible" | "unresolved-unbenchmarked";

export interface RetiredModel {
  model: ModelRecord;
  reason: RetiredReason;
  eligibility: OmniEligibility;
}

export interface CandidateSelection {
  active: ModelRecord[];
  rankable: Set<string>;
  eligibilityByModel: Map<string, OmniEligibility>;
  retired: RetiredModel[];
}

export function selectCandidates(
  models: ModelRecord[],
  eligibility: OmniEligibility[],
  observations: Observation[],
): CandidateSelection {
  const eligibilityByModel = new Map(eligibility.map((e) => [e.model, e]));
  const benchmarked = new Set(observations.map((o) => o.model));
  const active: ModelRecord[] = [];
  const rankable = new Set<string>();
  const retired: RetiredModel[] = [];
  for (const model of models) {
    const e = eligibilityByModel.get(model.id);
    if (!e) throw new Error(`model "${model.id}" has no Omni eligibility verdict`);
    if (model.supersededBy) retired.push({ model, reason: "superseded", eligibility: e });
    else if (e.verdict === "ineligible") retired.push({ model, reason: "ineligible", eligibility: e });
    else if (e.verdict === "unresolved" && !benchmarked.has(model.id)) {
      retired.push({ model, reason: "unresolved-unbenchmarked", eligibility: e });
    } else {
      active.push(model);
      if (e.verdict !== "unresolved") rankable.add(model.id);
    }
  }
  return { active, rankable, eligibilityByModel, retired };
}
