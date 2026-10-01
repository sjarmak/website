import type { GateDefinition, GateVerdict, ModelRecord } from "../../data/models/types.ts";

export interface GateContext {
  model: ModelRecord;
  capabilityValue: (capability: string) => number | undefined;
}

export interface Gate extends GateDefinition {
  evaluate: (ctx: GateContext) => GateVerdict;
}

export interface GateResult {
  gate: GateDefinition;
  verdict: GateVerdict;
}

export function verdictFromFlag(flag: boolean | undefined): GateVerdict {
  if (flag === undefined) return "unknown";
  return flag ? "pass" : "fail";
}

export function verdictFromThreshold(value: number | undefined, minimum: number): GateVerdict {
  if (value === undefined) return "unknown";
  return value >= minimum ? "pass" : "fail";
}

export function evaluateGates(gates: Gate[], ctx: GateContext): GateResult[] {
  return gates.map((gate) => ({ gate, verdict: gate.evaluate(ctx) }));
}

export function eligibility(results: GateResult[]): GateVerdict {
  if (results.some((r) => r.verdict === "fail")) return "fail";
  if (results.some((r) => r.verdict === "unknown")) return "unknown";
  return "pass";
}
