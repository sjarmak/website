import assert from "node:assert/strict";
import { test } from "node:test";
import * as hegel from "@hegeldev/hegel";
import * as gs from "@hegeldev/hegel/generators";
import { blendedPricePerM, normalizeScore } from "../src/lib/models/normalize.ts";
import { capabilityScores, composite, scoreObservations } from "../src/lib/models/score.ts";
import { nearFrontier, paretoFrontier } from "../src/lib/models/pareto.ts";
import { eligibility, verdictFromFlag, verdictFromThreshold } from "../src/lib/models/gates.ts";
import { buildTracker } from "../src/lib/models/build.ts";
import type { Gate } from "../src/lib/models/gates.ts";
import type {
  BenchmarkRecord,
  CapabilityDefinition,
  CapabilityId,
  ModelRecord,
  Observation,
  PricingRecord,
} from "../src/data/models/types.ts";

const bench = (id: string, capability: BenchmarkRecord["capability"], weight = 1): BenchmarkRecord => ({
  id,
  name: id,
  capability,
  weightWithinCapability: weight,
  url: "https://example.test",
  version: "v1",
  scale: "0-100",
  normalization: { kind: "linear", min: 0, max: 100 },
  contaminationResistant: true,
  rationale: "test",
});

const obs = (model: string, benchmark: string, score: number, version = "v1"): Observation => ({
  model,
  benchmark,
  score,
  version,
  sourceUrl: "https://example.test",
  retrieved: "2026-10-01",
});

const caps: CapabilityDefinition[] = [
  { id: "data-analysis", label: "Data", shortLabel: "Data", weight: 0.5, description: "" },
  { id: "sql", label: "SQL", shortLabel: "SQL", weight: 0.3, description: "" },
  { id: "cost", label: "Cost", shortLabel: "Cost", weight: 0.2, description: "" },
  { id: "tool-use", label: "Tools", shortLabel: "Tools", weight: 0, description: "" },
];

test("linear normalization maps the declared scale onto 0..1 and clamps", () => {
  assert.equal(normalizeScore(50, { kind: "linear", min: 0, max: 100 }), 0.5);
  assert.equal(normalizeScore(120, { kind: "linear", min: 0, max: 100 }), 1);
  assert.equal(normalizeScore(-3, { kind: "linear", min: 0, max: 100 }), 0);
});

test("log-inverse normalization rewards cheaper prices on a log scale", () => {
  const rule = { kind: "log-inverse" as const, best: 0.1, worst: 100 };
  assert.equal(normalizeScore(0.1, rule), 1);
  assert.equal(normalizeScore(100, rule), 0);
  assert.ok(Math.abs(normalizeScore(Math.sqrt(0.1 * 100), rule) - 0.5) < 1e-9);
  assert.throws(() => normalizeScore(0, rule));
});

test("blended price weights input and output by share", () => {
  assert.equal(blendedPricePerM(1, 5, 3, 1), 2);
  assert.throws(() => blendedPricePerM(1, 5, 0, 0));
});

test("scoreObservations rejects a version that does not match the benchmark definition", () => {
  assert.throws(
    () => scoreObservations([obs("m", "b", 10, "v2")], [bench("b", "sql")]),
    /version/,
  );
});

test("scoreObservations rejects an unknown benchmark id", () => {
  assert.throws(() => scoreObservations([obs("m", "nope", 10)], [bench("b", "sql")]), /unknown benchmark/);
});

test("capability score is the within-capability weighted mean of normalized scores", () => {
  const benchmarks = [bench("a", "sql", 3), bench("b", "sql", 1), bench("c", "data-analysis")];
  const scored = scoreObservations([obs("m", "a", 80), obs("m", "b", 40), obs("other", "c", 99)], benchmarks);
  const result = capabilityScores("m", scored, benchmarks);
  assert.ok(Math.abs(result.get("sql")!.value - 0.7) < 1e-9);
  assert.equal(result.has("data-analysis"), false);
});

test("composite renormalizes over covered weight and reports coverage", () => {
  const values = new Map([
    ["data-analysis", 0.8],
    ["sql", 0.6],
  ] as const);
  const result = composite(new Map(values), caps, 0.5);
  assert.ok(Math.abs(result.coverage - 0.8) < 1e-9);
  assert.ok(Math.abs(result.value! - (0.8 * 0.5 + 0.6 * 0.3) / 0.8) < 1e-9);
});

test("composite is unavailable below the minimum coverage instead of imputing zero", () => {
  const result = composite(new Map([["sql", 0.9]]), caps, 0.5);
  assert.equal(result.value, null);
  assert.ok(Math.abs(result.coverage - 0.3) < 1e-9);
});

test("zero-weight capabilities never affect the composite", () => {
  const with_ = composite(new Map([["data-analysis", 0.5], ["tool-use", 1]]), caps, 0.1);
  const without = composite(new Map([["data-analysis", 0.5]]), caps, 0.1);
  assert.equal(with_.value, without.value);
  assert.equal(with_.coverage, without.coverage);
});

test("pareto frontier keeps only undominated points", () => {
  const points = [
    { id: "cheap-weak", cost: 1, value: 0.4 },
    { id: "mid", cost: 5, value: 0.7 },
    { id: "dominated", cost: 6, value: 0.65 },
    { id: "frontier-expensive", cost: 20, value: 0.9 },
  ];
  const frontier = paretoFrontier(points);
  assert.deepEqual([...frontier].sort(), ["cheap-weak", "frontier-expensive", "mid"]);
  const near = nearFrontier(points, frontier, 0.05);
  assert.deepEqual([...near], ["dominated"]);
});

test("frontier and near-frontier are computed over gate-passing models only", () => {
  const model = (id: string, toolCalling: boolean | undefined): ModelRecord => ({
    id,
    name: id,
    vendor: "OpenAI",
    openWeights: false,
    apiAvailable: true,
    toolCalling,
  });
  const pricing = (id: string, perM: number): PricingRecord => ({
    model: id,
    inputPerM: perM,
    outputPerM: perM,
    sourceUrl: "https://example.test",
    retrieved: "2026-10-01",
  });
  const toolGate: Gate = {
    id: "tools",
    label: "Tool calling",
    description: "",
    evaluate: (ctx) => verdictFromFlag(ctx.model.toolCalling),
  };
  const tracker = buildTracker({
    models: [model("cheap-strong-fails", false), model("pricey-passes", true), model("unknown-gate", undefined)],
    benchmarks: [bench("da", "data-analysis")],
    observations: [obs("cheap-strong-fails", "da", 95), obs("pricey-passes", "da", 80), obs("unknown-gate", "da", 99)],
    pricing: [pricing("cheap-strong-fails", 0.2), pricing("pricey-passes", 5), pricing("unknown-gate", 0.1)],
    latency: [],
    config: {
      capabilities: [caps[0]],
      minimumCoverage: 0,
      cost: { inputShare: 3, outputShare: 1, normalization: { kind: "log-inverse", best: 0.1, worst: 50 } },
    },
    gates: [toolGate],
    nearFrontierTolerance: 0.05,
  });
  const status = Object.fromEntries(tracker.rows.map((r) => [r.model.id, r.pareto]));
  assert.equal(status["pricey-passes"], "frontier");
  assert.equal(status["cheap-strong-fails"], "ineligible");
  assert.equal(status["unknown-gate"], "ineligible");
});

test("gate verdicts: unknown data never counts as pass or fail", () => {
  assert.equal(verdictFromFlag(undefined), "unknown");
  assert.equal(verdictFromFlag(true), "pass");
  assert.equal(verdictFromThreshold(undefined, 0.5), "unknown");
  assert.equal(verdictFromThreshold(0.4, 0.5), "fail");
  const g = (verdict: "pass" | "fail" | "unknown") => ({
    gate: { id: "x", label: "x", description: "" },
    verdict,
  });
  assert.equal(eligibility([g("pass"), g("unknown")]), "unknown");
  assert.equal(eligibility([g("pass"), g("unknown"), g("fail")]), "fail");
  assert.equal(eligibility([g("pass")]), "pass");
});

test("property: normalized scores stay inside 0..1 and are monotone in the raw score", () =>
  hegel.test((tc) => {
    const min = tc.draw(gs.floats({ minValue: -1000, maxValue: 1000, allowNan: false, allowInfinity: false }));
    const width = tc.draw(gs.floats({ minValue: 0.001, maxValue: 1000, allowNan: false, allowInfinity: false }));
    const a = tc.draw(gs.floats({ minValue: -5000, maxValue: 5000, allowNan: false, allowInfinity: false }));
    const b = tc.draw(gs.floats({ minValue: -5000, maxValue: 5000, allowNan: false, allowInfinity: false }));
    const rule = { kind: "linear" as const, min, max: min + width };
    const na = normalizeScore(a, rule);
    const nb = normalizeScore(b, rule);
    assert.ok(na >= 0 && na <= 1);
    if (a <= b) assert.ok(na <= nb);
  }));

test("property: log-inverse is monotone decreasing in price and bounded", () =>
  hegel.test((tc) => {
    const best = tc.draw(gs.floats({ minValue: 0.01, maxValue: 10, allowNan: false, allowInfinity: false }));
    const worst = best * tc.draw(gs.floats({ minValue: 1.5, maxValue: 1000, allowNan: false, allowInfinity: false }));
    const p = tc.draw(gs.floats({ minValue: 0.001, maxValue: 10000, allowNan: false, allowInfinity: false }));
    const q = tc.draw(gs.floats({ minValue: 0.001, maxValue: 10000, allowNan: false, allowInfinity: false }));
    const rule = { kind: "log-inverse" as const, best, worst };
    const np = normalizeScore(p, rule);
    const nq = normalizeScore(q, rule);
    assert.ok(np >= 0 && np <= 1);
    if (p <= q) assert.ok(np >= nq);
  }));

test("property: composite lies within the range of its inputs and coverage is in 0..1", () =>
  hegel.test((tc) => {
    const ids = ["data-analysis", "sql", "cost", "general"] as const;
    const defs: CapabilityDefinition[] = ids.map((id) => ({
      id,
      label: id,
      shortLabel: id,
      weight: tc.draw(gs.booleans())
        ? 0
        : tc.draw(gs.floats({ minValue: 0.001, maxValue: 1, allowNan: false, allowInfinity: false })),
      description: "",
    }));
    const values = new Map<CapabilityId, number>();
    for (const id of ids) {
      if (tc.draw(gs.booleans())) {
        values.set(id, tc.draw(gs.floats({ minValue: 0, maxValue: 1, allowNan: false, allowInfinity: false })));
      }
    }
    const result = composite(values, defs, 0);
    assert.ok(result.coverage >= 0 && result.coverage <= 1 + 1e-9);
    if (result.value !== null) {
      const covered = defs.filter((d) => d.weight > 0 && values.has(d.id)).map((d) => values.get(d.id)!);
      assert.ok(result.value >= Math.min(...covered) - 1e-9);
      assert.ok(result.value <= Math.max(...covered) + 1e-9);
    }
  }));

test("property: no frontier point is dominated by any other point", () =>
  hegel.test((tc) => {
    const n = tc.draw(gs.integers({ minValue: 1, maxValue: 12 }));
    const points = Array.from({ length: n }, (_, i) => ({
      id: `p${i}`,
      cost: tc.draw(gs.floats({ minValue: 0.01, maxValue: 100, allowNan: false, allowInfinity: false })),
      value: tc.draw(gs.floats({ minValue: 0, maxValue: 1, allowNan: false, allowInfinity: false })),
    }));
    const frontier = paretoFrontier(points);
    assert.ok(frontier.size >= 1);
    for (const p of points.filter((p) => frontier.has(p.id))) {
      for (const q of points) {
        if (q.id === p.id) continue;
        const dominates = q.cost <= p.cost && q.value >= p.value && (q.cost < p.cost || q.value > p.value);
        assert.equal(dominates, false);
      }
    }
  }));
