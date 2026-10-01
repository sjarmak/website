import type { Normalization } from "../../data/models/types.ts";

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function normalizeScore(raw: number, rule: Normalization): number {
  if (!Number.isFinite(raw)) throw new Error(`normalizeScore: raw score is not finite: ${raw}`);
  if (rule.kind === "linear") {
    if (rule.max <= rule.min) throw new Error("normalizeScore: linear rule needs max > min");
    return clamp01((raw - rule.min) / (rule.max - rule.min));
  }
  if (rule.best <= 0 || rule.worst <= rule.best) {
    throw new Error("normalizeScore: log-inverse rule needs 0 < best < worst");
  }
  if (raw <= 0) throw new Error(`normalizeScore: log-inverse input must be positive: ${raw}`);
  const span = Math.log(rule.worst) - Math.log(rule.best);
  return clamp01(1 - (Math.log(raw) - Math.log(rule.best)) / span);
}

export function blendedPricePerM(
  inputPerM: number,
  outputPerM: number,
  inputShare: number,
  outputShare: number,
): number {
  const total = inputShare + outputShare;
  if (total <= 0) throw new Error("blendedPricePerM: shares must sum to a positive number");
  if (inputPerM < 0 || outputPerM < 0) throw new Error("blendedPricePerM: prices must be non-negative");
  return (inputPerM * inputShare + outputPerM * outputShare) / total;
}
