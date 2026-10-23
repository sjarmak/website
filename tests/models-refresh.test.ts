import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import * as hegel from "@hegeldev/hegel";
import * as gs from "@hegeldev/hegel/generators";
import { benchmarks } from "../src/data/models/benchmarks.ts";
import { compositeConfig } from "../src/data/models/capabilities.ts";
import { gates } from "../src/data/models/gates.ts";
import type { ModelRecord, Observation, OmniEligibility, PricingRecord, RefreshStatus } from "../src/data/models/types.ts";
import { buildTracker } from "../src/lib/models/build.ts";
import { selectCandidates } from "../src/lib/models/candidates.ts";
import { DATA_FILES, loadData, loadStatus, nextStatus, serialize } from "../scripts/models/refresh-io.ts";
import { feedNotices, NO_FEEDS, readFeeds, type Feeds } from "../scripts/models/feeds.ts";
import { ProposalError, proposedModels, refresh, type DataSet, type RunContext } from "../scripts/models/refresh-lib.ts";

const RUN = "2026-10-23";
const COMMIT = "a".repeat(40);
const CATALOG = "const ids = ['acme-one-1', 'acme-two-1'];\nfamilies: acme-*\n";
const BENCH = benchmarks.find((b) => b.id === "livesqlbench-base") as (typeof benchmarks)[number];
const OTHER_BENCH = benchmarks[1];
const DATA_DIR = path.resolve(import.meta.dirname, "..", "src", "data", "models");

const ctx = (over: Partial<RunContext> = {}): RunContext => ({
  runDate: RUN,
  catalogCommit: COMMIT,
  catalogText: CATALOG,
  benchmarks,
  config: compositeConfig,
  gates,
  maxReplacementShare: 1,
  feeds: { ...NO_FEEDS, livebenchRelease: "20260625" },
  ...over,
});

const model = (id: string, over: Partial<ModelRecord> = {}): ModelRecord => ({
  id,
  name: id,
  vendor: "Anthropic",
  contextWindow: 1_000_000,
  maxOutputTokens: 64_000,
  openWeights: false,
  apiAvailable: true,
  toolCalling: true,
  structuredOutput: true,
  zeroDataRetention: true,
  ...over,
});

const obs = (m: string, score: number, benchmark = BENCH): Observation => ({
  model: m,
  benchmark: benchmark.id,
  score,
  version: benchmark.version,
  sourceUrl: "https://bench.example/board",
  retrieved: "2026-10-01",
});

const price = (m: string, inputPerM: number): PricingRecord => ({
  model: m,
  inputPerM,
  outputPerM: inputPerM * 5,
  provider: "Acme API",
  scope: "standard",
  sourceUrl: "https://acme.example/pricing",
  retrieved: "2026-10-01",
});

const verdict = (m: string, v: OmniEligibility["verdict"] = "in-catalog"): OmniEligibility => ({
  model: m,
  verdict: v,
  basis: "exact-model-listed",
  catalogCommit: "b".repeat(40),
  retrieved: "2026-10-01",
});

const baseData = (): DataSet => ({
  models: [model("acme-one-1"), model("acme-two-1"), model("acme-three-1")],
  observations: [obs("acme-one-1", 70), obs("acme-two-1", 60)],
  pricing: [price("acme-one-1", 3)],
  eligibility: [verdict("acme-one-1"), verdict("acme-two-1"), verdict("acme-three-1", "unresolved")],
  history: [],
});

const proof = { sourceUrl: "https://bench.example/board", retrieved: RUN, evidence: "the board shows it" };
const research = (over: Record<string, unknown> = {}) => ({ runDate: RUN, sources: [], ...over });
const eligibilityFile = (verdicts: unknown[]) => ({ runDate: RUN, catalogCommit: COMMIT, verdicts });
const inCatalog = (m: string, citation = `'${m}'`) => ({ model: m, verdict: "in-catalog", citations: [citation], reason: "listed" });
const verdictOf = (data: DataSet, m: string) => data.eligibility.find((e) => e.model === m);

test("an in-catalog claim with a verbatim citation is accepted and stamped with the catalog commit", () => {
  const out = refresh(baseData(), research(), eligibilityFile([inCatalog("acme-one-1")]), ctx());
  assert.deepEqual(verdictOf(out.data, "acme-one-1"), {
    model: "acme-one-1",
    verdict: "in-catalog",
    basis: "exact-model-listed",
    catalogCommit: COMMIT,
    retrieved: RUN,
  });
});

test("a citation that is not verbatim in the catalog downgrades the claim to unresolved", () => {
  const out = refresh(baseData(), research(), eligibilityFile([inCatalog("acme-one-1", "acme-one-2")]), ctx());
  assert.equal(verdictOf(out.data, "acme-one-1")?.verdict, "unresolved");
  assert.equal(verdictOf(out.data, "acme-one-1")?.basis, "citation-not-found");
  assert.match(out.rejected[0].reason, /not found verbatim/);
});

test("a claim with no citation is rejected and the model is left unassessed", () => {
  const out = refresh(baseData(), research(), eligibilityFile([{ model: "acme-one-1", verdict: "in-catalog", citations: [], reason: "x" }]), ctx());
  assert.equal(verdictOf(out.data, "acme-one-1")?.basis, "not-assessed");
});

test("every model the run does not judge is reset to unresolved, not carried forward", () => {
  const out = refresh(baseData(), research(), eligibilityFile([inCatalog("acme-one-1")]), ctx());
  assert.equal(verdictOf(out.data, "acme-two-1")?.verdict, "unresolved");
  assert.equal(verdictOf(out.data, "acme-two-1")?.basis, "not-assessed");
  assert.equal(verdictOf(out.data, "acme-two-1")?.catalogCommit, COMMIT);
});

test("meets-constraints is re-gated: a failing gate makes it ineligible, an unknown gate unresolved", () => {
  const data = baseData();
  data.models = [model("acme-one-1", { structuredOutput: false }), model("acme-two-1", { contextWindow: undefined }), model("acme-three-1")];
  data.observations = data.models.map((m) => obs(m.id, 80, OTHER_BENCH));
  const family = (m: string) => ({ model: m, verdict: "meets-constraints", citations: ["families: acme-*"], reason: "family" });
  const out = refresh(data, research(), eligibilityFile([family("acme-one-1"), family("acme-two-1"), family("acme-three-1")]), ctx());
  assert.deepEqual(
    [verdictOf(out.data, "acme-one-1"), verdictOf(out.data, "acme-two-1"), verdictOf(out.data, "acme-three-1")].map((e) => [e?.verdict, e?.basis, e?.gates]),
    [
      ["ineligible", "failed-gate", ["structured"]],
      ["unresolved", "gates-unknown", ["context"]],
      ["meets-constraints", "provider-family-supported", undefined],
    ],
  );
});

test("an unresolved model that fails a gate is ineligible on that gate, and one with only unknown gates stays unresolved", () => {
  const data = baseData();
  data.models = [model("acme-one-1", { structuredOutput: false }), model("acme-two-1", { contextWindow: undefined })];
  data.observations = data.models.map((m) => obs(m.id, 80, OTHER_BENCH));
  const unsure = (m: string) => ({ model: m, verdict: "unresolved", reason: "catalog is silent" });
  const out = refresh(data, research(), eligibilityFile([unsure("acme-one-1"), unsure("acme-two-1")]), ctx());
  assert.deepEqual(
    [verdictOf(out.data, "acme-one-1"), verdictOf(out.data, "acme-two-1")].map((e) => [e?.verdict, e?.basis, e?.gates]),
    [
      ["ineligible", "failed-gate", ["structured"]],
      ["unresolved", "evidence-inconclusive", undefined],
    ],
  );
});

test("an ineligible failed-gate claim on a model that passes every gate is downgraded", () => {
  const claim = { model: "acme-one-1", verdict: "ineligible", basis: "failed-gate", citations: [], reason: "x" };
  const out = refresh(baseData(), research(), eligibilityFile([claim]), ctx());
  assert.equal(verdictOf(out.data, "acme-one-1")?.verdict, "unresolved");
  assert.equal(out.rejected.length, 1);
});

test("an ineligible claim needs one of the stated bases", () => {
  const claim = { model: "acme-one-1", verdict: "ineligible", basis: "vibes", citations: ["acme"], reason: "x" };
  const out = refresh(baseData(), research(), eligibilityFile([claim]), ctx());
  assert.match(out.rejected[0].reason, /needs basis/);
});

test("a verdict change is written to history once, with the previous verdict", () => {
  const out = refresh(baseData(), research(), eligibilityFile([inCatalog("acme-one-1"), inCatalog("acme-two-1")]), ctx());
  assert.deepEqual(
    out.data.history.map((h) => [h.table, h.model, (h.previous as OmniEligibility).verdict]),
    [["omni", "acme-three-1", "unresolved"]],
  );
});

test("a wrong run date or catalog commit rejects the whole proposal", () => {
  assert.throws(() => refresh(baseData(), { ...research(), runDate: "2026-10-22" }, eligibilityFile([]), ctx()), ProposalError);
  assert.throws(() => refresh(baseData(), research(), { ...eligibilityFile([]), catalogCommit: "c".repeat(40) }, ctx()), ProposalError);
});

test("an item retrieved on another day is rejected", () => {
  const out = refresh(
    baseData(),
    research({ observations: [{ model: "acme-three-1", benchmark: BENCH.id, score: 50, version: BENCH.version, ...proof, retrieved: "2026-10-22" }] }),
    eligibilityFile([]),
    ctx(),
  );
  assert.equal(out.data.observations.length, 2);
  assert.match(out.rejected[0].reason, /run date/);
});

test("an item citing a source the run reported as failed is rejected", () => {
  const out = refresh(
    baseData(),
    research({
      sources: [{ url: "https://bench.example/board", status: "failed" }],
      observations: [{ model: "acme-three-1", benchmark: BENCH.id, score: 50, version: BENCH.version, ...proof }],
    }),
    eligibilityFile([]),
    ctx(),
  );
  assert.equal(out.data.observations.length, 2);
  assert.match(out.rejected[0].reason, /reported as failed/);
  assert.deepEqual(out.sources, [{ source: "bench.example/board", status: "failed" }]);
});

test("a score for a different benchmark version is rejected", () => {
  const out = refresh(
    baseData(),
    research({ observations: [{ model: "acme-three-1", benchmark: BENCH.id, score: 50, version: "older", ...proof }] }),
    eligibilityFile([]),
    ctx(),
  );
  assert.match(out.rejected[0].reason, /differs from the pinned/);
});

const LB_REASONING = benchmarks.find((b) => b.id === "livebench-reasoning") as (typeof benchmarks)[number];
const LB_TABLE_URL = "https://livebench.ai/v1/table_2026_06_25.csv";
const LB_TABLE = [
  "model,theory_of_mind,zebra_puzzle,spatial,logic_with_navigation,consecutive_events,tablejoin,tablereformat,paraphrase,simplify,story_generation,summarize",
  "grok-4.6,86.538,95.5,98.0,82.0,78.148,43.423,100.0,71.783,69.333,78.267,68.083",
  "grok-4.7-xhigh,84.615,86.0,94.0,66.0,85.727,44.923,100.0,78.05,69.967,74.917,78.167",
  "grok-4.7-low,84.615,,94.0,66.0,85.727,44.923,100.0,78.05,69.967,74.917,78.167",
  "grok-4.7-codex-xhigh,84.615,86.0,94.0,66.0,85.727,44.923,100.0,78.05,69.967,74.917,78.167",
  "grok-4.7-0731-xhigh,84.615,86.0,94.0,66.0,85.727,44.923,100.0,78.05,69.967,74.917,78.167",
  "grok-4.7-preview-xhigh,84.615,86.0,94.0,66.0,85.727,44.923,100.0,78.05,69.967,74.917,78.167",
  "grok-4.7-2026-07-01-thinking-64k-high-effort,84.615,86.0,94.0,66.0,85.727,44.923,100.0,78.05,69.967,74.917,78.167",
].join("\n");
const LB_CATEGORIES = JSON.stringify({
  Reasoning: ["theory_of_mind", "zebra_puzzle", "spatial", "logic_with_navigation"],
  "Data Analysis": ["consecutive_events", "tablejoin", "tablereformat"],
  IF: ["paraphrase", "simplify", "story_generation", "summarize"],
});

function livebenchFeeds(files: Record<string, string> = { "table.csv": `${LB_TABLE}\n`, "categories.json": LB_CATEGORIES }): Feeds {
  const root = mkdtempSync(path.join(os.tmpdir(), "models-feeds-"));
  try {
    const dir = path.join(root, "livebench", "v1", "2026_06_25");
    mkdirSync(dir, { recursive: true });
    for (const [name, content] of Object.entries(files)) writeFileSync(path.join(dir, name), content);
    return readFeeds(root, benchmarks);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const grokData = (observations: Observation[] = []): DataSet => ({
  ...baseData(),
  models: [...baseData().models, model("grok-4", { vendor: "xAI" }), model("grok-4.6", { vendor: "xAI" }), model("grok-4.7", { vendor: "xAI" })],
  observations: [...baseData().observations, ...observations],
});
const lbClaim = (over: Record<string, unknown> = {}) => ({
  model: "grok-4.7",
  benchmark: LB_REASONING.id,
  score: 82.7,
  version: LB_REASONING.version,
  sourceRow: "grok-4.7-xhigh",
  ...proof,
  sourceUrl: LB_TABLE_URL,
  ...over,
});
const lbRefresh = (claim: Record<string, unknown>, feeds = livebenchFeeds(), data = grokData()) =>
  refresh(data, research({ observations: [claim] }), eligibilityFile([]), ctx({ feeds }));

test("a LiveBench score is accepted when it is the pinned question set's own category mean for the named row", () => {
  for (const [m, row, benchmark, score] of [
    ["grok-4.7", "grok-4.7-xhigh", "livebench-reasoning", 82.7],
    ["grok-4.7", "grok-4.7-xhigh", "livebench-data-analysis", 76.9],
    ["grok-4.6", "grok-4.6", "livebench-instruction-following", 71.9],
    ["grok-4.7", "grok-4.7-2026-07-01-thinking-64k-high-effort", "livebench-reasoning", 82.7],
  ] as const) {
    const out = lbRefresh(lbClaim({ model: m, sourceRow: row, benchmark, score }));
    assert.equal(out.rejected.length, 0, JSON.stringify(out.rejected));
    const recorded = out.data.observations.find((o) => o.model === m && o.benchmark === benchmark);
    assert.deepEqual(
      [recorded?.score, recorded?.sourceUrl, recorded?.note],
      [score, LB_TABLE_URL, `LiveBench row ${row}, 2026-06-25 question set`],
    );
  }
});

test("a LiveBench score is rejected unless the pinned table, row, model, category and score all agree", () => {
  const cases: [Record<string, unknown>, Feeds | undefined, RegExp][] = [
    [{ score: 82.8 }, undefined, /row grok-4\.7-xhigh averages 82\.7 on Reasoning, not 82\.8/],
    [{ score: 82.74 }, undefined, /row grok-4\.7-xhigh averages 82\.7 on Reasoning, not 82\.74/],
    [{ score: 82.66 }, undefined, /row grok-4\.7-xhigh averages 82\.7 on Reasoning, not 82\.66/],
    [{ sourceRow: undefined }, undefined, /needs sourceRow/],
    [{ sourceRow: "grok-4.8-xhigh" }, undefined, /has no row grok-4\.8-xhigh/],
    [{ model: "grok-4.6" }, undefined, /row grok-4\.7-xhigh does not name grok-4\.6/],
    [{ model: "grok-4" }, undefined, /row grok-4\.7-xhigh does not name grok-4$/],
    [{ sourceRow: "grok-4.7-codex-xhigh" }, undefined, /row grok-4\.7-codex-xhigh does not name grok-4\.7$/],
    [{ sourceRow: "grok-4.7-0731-xhigh" }, undefined, /row grok-4\.7-0731-xhigh does not name grok-4\.7$/],
    [{ sourceRow: "grok-4.7-preview-xhigh" }, undefined, /row grok-4\.7-preview-xhigh does not name grok-4\.7$/],
    [{ sourceRow: "grok-4.7-low" }, undefined, /row grok-4\.7-low has no zebra_puzzle score/],
    [{}, { ...NO_FEEDS, livebenchRelease: "20261014" }, /2026-06-25 question set table was not fetched this run/],
    [{ sourceUrl: "https://livebench.ai/data/20261014/table.csv" }, undefined, /must cite the 2026-06-25 question set table https:\/\/livebench\.ai\/v1\/table_2026_06_25\.csv/],
    [{ sourceUrl: "https://livebench.ai/data/20260625/v2/table.csv" }, undefined, /must cite the 2026-06-25 question set table/],
    [{ sourceUrl: "https://livebench.ai/" }, undefined, /must cite the 2026-06-25 question set table/],
  ];
  for (const [over, feeds, reason] of cases) {
    const out = lbRefresh(lbClaim(over), feeds ?? livebenchFeeds());
    assert.match(out.rejected[0]?.reason ?? "", reason, JSON.stringify(over));
    assert.equal(out.data.observations.length, 2);
  }
});

test("a LiveBench score never switches a model to another configuration's row", () => {
  const recorded = { ...obs("grok-4.7", 80, LB_REASONING), note: "LiveBench row grok-4.7-low, 2026-06-25 question set" };
  const out = lbRefresh(lbClaim(), livebenchFeeds(), grokData([recorded]));
  assert.match(out.rejected[0]?.reason ?? "", /recorded from LiveBench row grok-4\.7-low; row grok-4\.7-xhigh is another configuration/);
  assert.equal(out.data.observations.find((o) => o.model === "grok-4.7")?.score, 80);
});

test("a LiveBench score never changes a stored score whose note records no row, and an equal claim changes nothing", () => {
  const legacy = (score: number, note?: string): Observation => ({ ...obs("grok-4.7", score, LB_REASONING), ...(note ? { note } : {}) });
  for (const stored of [legacy(80, "Thinking configuration"), legacy(80)]) {
    const out = lbRefresh(lbClaim(), livebenchFeeds(), grokData([stored]));
    assert.match(out.rejected[0]?.reason ?? "", /grok-4\.7 on livebench-reasoning is recorded as 80 from an unnamed LiveBench row/);
    assert.deepEqual(out.data.observations.find((o) => o.model === "grok-4.7"), stored);
  }
  const same = legacy(82.7, "Thinking configuration");
  const out = lbRefresh(lbClaim(), livebenchFeeds(), grokData([same]));
  assert.deepEqual([out.rejected, out.accepted], [[], []]);
  assert.deepEqual(out.data.observations.find((o) => o.model === "grok-4.7"), same);
});

test("a LiveBench row is matched only against models recorded before this run, never against ids or API ids proposed in it", () => {
  const add = { id: "grok-4.8", name: "Grok 4.8", vendor: "xAI", apiId: "grok-4.7-codex", openWeights: false, apiAvailable: true, ...proof };
  const out = refresh(
    grokData(),
    research({ addModels: [add], observations: [lbClaim({ model: "grok-4.8", sourceRow: "grok-4.7-codex-xhigh" })] }),
    eligibilityFile([]),
    ctx({ feeds: livebenchFeeds() }),
  );
  assert.match(out.rejected.find((r) => r.item === "observation grok-4.8")?.reason ?? "", /grok-4\.8 is added in this run/);
  assert.ok(!out.data.observations.some((o) => o.model === "grok-4.8"));
  const shadow = { ...add, id: "grok-4.7-xhigh", apiId: undefined };
  const kept = refresh(grokData(), research({ addModels: [shadow], observations: [lbClaim()] }), eligibilityFile([]), ctx({ feeds: livebenchFeeds() }));
  assert.equal(kept.data.observations.find((o) => o.model === "grok-4.7" && o.benchmark === LB_REASONING.id)?.score, 82.7);
});

test("a question set whose categories or header differ from the pinned subtests is absent", () => {
  const categories = JSON.parse(LB_CATEGORIES) as Record<string, string[]>;
  const variants: Record<string, string>[] = [
    { "table.csv": "model,theory_of_mind\ngrok-4.7-xhigh,84.615\n", "categories.json": JSON.stringify({ Reasoning: ["theory_of_mind"] }) },
    { "table.csv": LB_TABLE, "categories.json": JSON.stringify({ ...categories, Reasoning: ["theory_of_mind", "zebra_puzzle", "spatial"] }) },
    { "table.csv": LB_TABLE, "categories.json": JSON.stringify({ ...categories, Reasoning: [...categories.Reasoning, "tablejoin"] }) },
    { "table.csv": LB_TABLE, "categories.json": JSON.stringify({ Reasoning: categories.Reasoning, IF: categories.IF }) },
  ];
  for (const files of variants) {
    assert.equal(livebenchFeeds(files).livebenchQuestionSets.size, 0, JSON.stringify(files).slice(0, 160));
  }
});

test("a malformed or incomplete pinned LiveBench file leaves that question set absent", () => {
  assert.equal(livebenchFeeds().livebenchQuestionSets.get("2026_06_25")?.rows.size, 7);
  const malformed: Record<string, string>[] = [
    { "table.csv": LB_TABLE },
    { "table.csv": LB_TABLE.replace("86.538", "86.5x"), "categories.json": LB_CATEGORIES },
    { "table.csv": LB_TABLE.replace("grok-4.6,", "grok-4.6,1,"), "categories.json": LB_CATEGORIES },
    { "table.csv": LB_TABLE.replace(/^model,/, "name,"), "categories.json": LB_CATEGORIES },
    { "table.csv": LB_TABLE, "categories.json": "{\"Reasoning\": [\"coding\"]}" },
    { "table.csv": LB_TABLE, "categories.json": "not json" },
  ];
  for (const files of malformed) {
    assert.equal(livebenchFeeds(files).livebenchQuestionSets.size, 0, JSON.stringify(files).slice(0, 120));
  }
});

test("a failed page blocks its own citations even when another page on that host was fine", () => {
  const price = { model: "acme-three-1", inputPerM: 9, outputPerM: 9, provider: "Acme API", ...proof, sourceUrl: "https://acme.example/pricing" };
  const out = refresh(
    baseData(),
    research({
      sources: [
        { url: "https://acme.example/pricing", status: "failed" },
        { url: "https://acme.example/docs", status: "ok" },
      ],
      pricing: [price],
    }),
    eligibilityFile([]),
    ctx(),
  );
  assert.match(out.rejected[0].reason, /acme\.example\/pricing was reported as failed/);
  assert.deepEqual(out.sources, [
    { source: "acme.example/pricing", status: "failed" },
    { source: "acme.example", status: "ok" },
  ]);
});

test("an existing model's API id cannot be changed to another version's id", () => {
  const data = baseData();
  data.models = data.models.map((m) => (m.id === "acme-three-1" ? { ...m, apiId: "acme-three-1" } : m));
  const out = refresh(
    data,
    research({ updateModels: [{ model: "acme-three-1", field: "apiId", value: "acme-four-0", ...proof }] }),
    eligibilityFile([]),
    ctx(),
  );
  assert.equal(out.data.models.find((m) => m.id === "acme-three-1")?.apiId, "acme-three-1");
  assert.match(out.rejected[0].reason, /a different id is a different version and needs its own model record/);
});

const TBENCH = benchmarks.find((b) => b.harness) as (typeof benchmarks)[number];
const boardRow = (over: Partial<{ agent: string; model: string; effort: string; accuracy: number; displayed: boolean }> = {}) => ({
  agent: "Claude Code",
  model: "One 1",
  effort: "max",
  accuracy: 57.88,
  displayed: true,
  ...over,
});
const board = (rows: ReturnType<typeof boardRow>[], leaderboard = TBENCH.harness as string) => ({ ...NO_FEEDS, livebenchRelease: "20260625", terminalBench: { leaderboard, rows } });
const tbClaim = (over: Record<string, unknown> = {}) => ({
  model: "acme-three-1",
  benchmark: TBENCH.id,
  score: 57.9,
  version: TBENCH.version,
  agent: "Claude Code",
  effort: "max",
  ...proof,
  sourceUrl: TBENCH.url,
  ...over,
});
const tbData = () => {
  const data = baseData();
  data.models = data.models.map((m) => (m.id === "acme-three-1" ? { ...m, name: "Acme One 1" } : m));
  return data;
};

test("a Terminal-Bench row is accepted only from a displayed row on the recorded harness, keeping agent and effort", () => {
  const ok = refresh(tbData(), research({ observations: [tbClaim()] }), eligibilityFile([]), ctx({ feeds: board([boardRow()]) }));
  assert.equal(ok.rejected.length, 0, JSON.stringify(ok.rejected));
  const row = ok.data.observations.find((o) => o.model === "acme-three-1" && o.benchmark === TBENCH.id);
  assert.equal(row?.note, `agent Claude Code, effort max, leaderboard ${TBENCH.harness}`);
  const cases: [Parameters<typeof ctx>[0], Record<string, unknown>, RegExp][] = [
    [{ feeds: board([boardRow()], "someone/else 4-0-0") }, {}, /is not the harness/],
    [{ feeds: board([boardRow({ agent: "Terminus 2" })]) }, {}, /no .* row for Acme One 1 with agent Claude Code/],
    [{ feeds: board([boardRow({ effort: "low" })]) }, {}, /no .* row/],
    [{ feeds: board([boardRow({ model: "One 1.5" })]) }, {}, /no .* row/],
    [{ feeds: board([boardRow({ accuracy: 50.3 })]) }, {}, /no .* row/],
    [{ feeds: board([boardRow({ displayed: false })]) }, {}, /not displayed/],
    [{ feeds: board([boardRow()]) }, { agent: undefined }, /needs the leaderboard's agent and effort/],
    [{ feeds: { ...NO_FEEDS, livebenchRelease: "20260625" } }, {}, /was not fetched this run/],
    [{ feeds: board([boardRow()]) }, { sourceUrl: "https://bench.example/board" }, /must cite https:\/\/www\.tbench\.ai\/leaderboard/],
  ];
  for (const [over, claim, reason] of cases) {
    const out = refresh(tbData(), research({ observations: [tbClaim(claim)] }), eligibilityFile([]), ctx(over));
    assert.match(out.rejected[0]?.reason ?? "", reason);
    assert.equal(out.data.observations.length, 2);
  }
});

test("a Terminal-Bench row checked against the fetched leaderboard is accepted though the agent could not read the leaderboard page", () => {
  const out = refresh(
    tbData(),
    research({ sources: [{ url: TBENCH.url, status: "unresolved" }], observations: [tbClaim()] }),
    eligibilityFile([]),
    ctx({ feeds: board([boardRow()]) }),
  );
  assert.equal(out.rejected.length, 0, JSON.stringify(out.rejected));
  assert.equal(out.data.observations.find((o) => o.model === "acme-three-1" && o.benchmark === TBENCH.id)?.score, 57.9);
});

test("a page reported unresolved blocks items citing it without blocking the rest of its host", () => {
  const out = refresh(
    baseData(),
    research({
      sources: [
        { url: "https://acme.example/pricing", status: "unresolved" },
        { url: "https://acme.example/models", status: "ok" },
      ],
      pricing: [
        { model: "acme-two-1", inputPerM: 2, outputPerM: 8, provider: "Acme API", scope: "standard", ...proof, sourceUrl: "https://acme.example/pricing" },
        { model: "acme-three-1", inputPerM: 2, outputPerM: 8, provider: "Acme API", scope: "standard", ...proof, sourceUrl: "https://acme.example/models" },
      ],
    }),
    eligibilityFile([]),
    ctx(),
  );
  assert.deepEqual(out.data.pricing.map((p) => p.model), ["acme-one-1", "acme-three-1"]);
  assert.match(out.rejected[0].reason, /acme\.example\/pricing was reported as failed or unresolved/);
  assert.deepEqual(out.sources, [
    { source: "acme.example/pricing", status: "unresolved" },
    { source: "acme.example", status: "ok" },
  ]);
});

test("a benchmark board's run cost is never taken as a list price", () => {
  const cost = { model: "acme-two-1", inputPerM: 2, outputPerM: 8, provider: "LiveBench", scope: "run", ...proof, sourceUrl: "https://livebench.ai/data/20261014/cost.csv" };
  const out = refresh(baseData(), research({ pricing: [cost] }), eligibilityFile([]), ctx());
  assert.match(out.rejected[0].reason, /benchmark board/);
  assert.equal(out.data.pricing.length, 1);
});

test("a newer LiveBench release is a status notice, and the pinned release is not", () => {
  assert.match(feedNotices(benchmarks, { ...NO_FEEDS, livebenchRelease: "20261014" })[0], /release 2026-10-14, which the composite does not use/);
  assert.deepEqual(feedNotices(benchmarks, { ...NO_FEEDS, livebenchRelease: "20260625" }), []);
  assert.deepEqual(feedNotices(benchmarks, NO_FEEDS), []);
});

test("supersession must stay in one vendor, never point at itself, and never form a cycle", () => {
  const data = baseData();
  data.models.push(model("other-one-1", { vendor: "OpenAI" }));
  data.eligibility.push(verdict("other-one-1"));
  const out = refresh(
    data,
    research({
      supersede: [
        { model: "acme-one-1", by: "acme-two-1", ...proof },
        { model: "acme-two-1", by: "acme-one-1", ...proof },
        { model: "acme-three-1", by: "acme-three-1", ...proof },
        { model: "acme-three-1", by: "other-one-1", ...proof },
      ],
    }),
    eligibilityFile([]),
    ctx(),
  );
  assert.equal(out.data.models.find((m) => m.id === "acme-one-1")?.supersededBy?.model, "acme-two-1");
  assert.deepEqual(
    out.rejected.map((r) => r.reason.replace(/.*(cycle|itself|vendor).*/, "$1")),
    ["cycle", "itself", "vendor"],
  );
});

test("a new model is kept only with a benchmark for its exact version or as a successor", () => {
  const add = (id: string) => ({ id, name: id, vendor: "Anthropic", openWeights: false, apiAvailable: true, ...proof });
  const out = refresh(
    baseData(),
    research({
      addModels: [add("acme-four-1"), add("acme-five-1"), add("acme-six-1")],
      observations: [{ model: "acme-four-1", benchmark: BENCH.id, score: 41, version: BENCH.version, ...proof }],
      supersede: [{ model: "acme-three-1", by: "acme-five-1", ...proof }],
    }),
    eligibilityFile([]),
    ctx(),
  );
  assert.deepEqual(out.data.models.map((m) => m.id).slice(3), ["acme-four-1", "acme-five-1"]);
  assert.deepEqual(out.rejected.map((r) => r.item), ["add model acme-six-1"]);
  assert.ok(!out.accepted.some((d) => d.item === "add model acme-six-1"));
});

test("proposedModels previews the research additions without the eligibility step", () => {
  const add = { id: "acme-four-1", name: "Four", vendor: "Anthropic", openWeights: false, apiAvailable: true, ...proof };
  const preview = proposedModels(
    baseData(),
    research({ addModels: [add], observations: [{ model: "acme-four-1", benchmark: BENCH.id, score: 41, version: BENCH.version, ...proof }] }),
    ctx(),
  );
  assert.deepEqual(preview.map((m) => m.id), ["acme-one-1", "acme-two-1", "acme-three-1", "acme-four-1"]);
});

test("the circuit breaker rejects a batch that rewrites too much of the table", () => {
  const replace = [
    { model: "acme-one-1", benchmark: BENCH.id, score: 71, version: BENCH.version, ...proof },
    { model: "acme-two-1", benchmark: BENCH.id, score: 61, version: BENCH.version, ...proof },
  ];
  assert.throws(() => refresh(baseData(), research({ observations: replace }), eligibilityFile([]), ctx({ maxReplacementShare: 0.5 })), /circuit breaker/);
  const out = refresh(baseData(), research({ observations: replace }), eligibilityFile([]), ctx({ maxReplacementShare: 1 }));
  assert.equal(out.replaced, 2);
  assert.deepEqual(out.data.history.filter((h) => h.table === "observations").map((h) => (h.previous as Observation).score), [70, 60]);
});

test("pricing needs a provider and scope and keeps the replaced price in history", () => {
  const row = { model: "acme-one-1", inputPerM: 4, outputPerM: 20, ...proof };
  const missing = refresh(baseData(), research({ pricing: [row] }), eligibilityFile([]), ctx());
  assert.match(missing.rejected[0].reason, /provider/);
  const out = refresh(baseData(), research({ pricing: [{ ...row, provider: "Acme API", scope: "standard" }] }), eligibilityFile([]), ctx());
  assert.equal(out.data.pricing[0].inputPerM, 4);
  assert.equal((out.data.history.find((h) => h.table === "pricing")?.previous as PricingRecord).inputPerM, 3);
});

test("updateModels changes only whitelisted fields", () => {
  const out = refresh(
    baseData(),
    research({
      updateModels: [
        { model: "acme-one-1", field: "contextWindow", value: 2_000_000, ...proof },
        { model: "acme-one-1", field: "vendor", value: "OpenAI", ...proof },
      ],
    }),
    eligibilityFile([]),
    ctx(),
  );
  assert.equal(out.data.models[0].contextWindow, 2_000_000);
  assert.equal(out.data.models[0].vendor, "Anthropic");
  assert.match(out.rejected[0].reason, /cannot be changed/);
});

const failedRun = { at: "2026-10-24T09:00:00Z", outcome: "failed" as const, failedStage: "gates", exitCode: 6, catalogCommit: null, accepted: 0, rejected: 0, notices: [] };

test("nextStatus keeps the last success on a failed run and dates each source separately", () => {
  const neverRun: RefreshStatus = {
    lastAttempt: null,
    lastSuccess: null,
    outcome: "never-run",
    failedStage: null,
    exitCode: null,
    catalogCommit: null,
    accepted: 0,
    rejected: 0,
    sources: [],
    notices: [],
  };
  const first = nextStatus(neverRun, {
    at: "2026-10-23T09:00:00Z",
    outcome: "published",
    failedStage: null,
    exitCode: 0,
    catalogCommit: COMMIT,
    accepted: 3,
    rejected: 1,
    sources: [
      { source: "a.example", status: "ok" },
      { source: "b.example", status: "failed" },
    ],
    notices: ["n"],
  });
  const second = nextStatus(first, { ...failedRun, sources: [{ source: "b.example", status: "ok" }] });
  assert.equal(second.lastSuccess, "2026-10-23T09:00:00Z");
  assert.equal(second.lastAttempt, "2026-10-24T09:00:00Z");
  assert.equal(second.catalogCommit, COMMIT);
  assert.deepEqual([first.notices, second.notices], [["n"], []]);
  assert.deepEqual(second.sources, [
    { source: "a.example", status: "ok", checked: "2026-10-23T09:00:00Z", lastOk: "2026-10-23T09:00:00Z" },
    { source: "b.example", status: "ok", checked: "2026-10-24T09:00:00Z", lastOk: "2026-10-24T09:00:00Z" },
  ]);
});

test("selectCandidates retires superseded, ineligible and unbenchmarked unresolved models", () => {
  const models = [
    model("a"),
    model("b", { supersededBy: { model: "a", sourceUrl: "https://x.example", retrieved: RUN } }),
    model("c"),
    model("d"),
    model("e"),
  ];
  const sel = selectCandidates(models, [verdict("a"), verdict("b"), verdict("c", "ineligible"), verdict("d", "unresolved"), verdict("e", "unresolved")], [obs("d", 50)]);
  assert.deepEqual(sel.active.map((m) => m.id), ["a", "d"]);
  assert.deepEqual([...sel.rankable], ["a"]);
  assert.deepEqual(sel.retired.map((r) => [r.model.id, r.reason]), [
    ["b", "superseded"],
    ["c", "ineligible"],
    ["e", "unresolved-unbenchmarked"],
  ]);
  assert.throws(() => selectCandidates([model("z")], [], []), /no Omni eligibility verdict/);
});

const finite = (min: number, max: number) => gs.floats({ minValue: min, maxValue: max, allowNan: false, allowInfinity: false });

function drawResearch(tc: hegel.TestCase, data: DataSet) {
  const ids = data.models.map((m) => m.id);
  const pick = () => ids[tc.draw(gs.integers({ minValue: 0, maxValue: ids.length - 1 }))];
  const count = tc.draw(gs.integers({ minValue: 0, maxValue: 6 }));
  const observations = Array.from({ length: count }, () => ({
    model: pick(),
    benchmark: tc.draw(gs.booleans()) ? BENCH.id : OTHER_BENCH.id,
    score: tc.draw(gs.booleans()) ? 60 : Math.round(tc.draw(finite(-10, 110)) * 10) / 10,
    version: tc.draw(gs.integers({ minValue: 0, maxValue: 4 })) === 0 ? "stale" : BENCH.version,
    ...proof,
  }));
  const pricing = Array.from({ length: tc.draw(gs.integers({ minValue: 0, maxValue: 3 })) }, () => ({
    model: pick(),
    inputPerM: Math.round(tc.draw(finite(-1, 50)) * 100) / 100,
    outputPerM: Math.round(tc.draw(finite(0.1, 80)) * 100) / 100,
    provider: "Acme API",
    scope: "standard",
    ...proof,
  }));
  const supersede = tc.draw(gs.booleans()) ? [{ model: pick(), by: pick(), ...proof }] : [];
  return research({ observations, pricing, supersede });
}

function drawVerdicts(tc: hegel.TestCase, data: DataSet) {
  return eligibilityFile(
    data.models
      .filter(() => tc.draw(gs.booleans()))
      .map((m) =>
        tc.draw(gs.booleans())
          ? inCatalog(m.id, tc.draw(gs.booleans()) ? `'${m.id}'` : "not in the catalog")
          : { model: m.id, verdict: "meets-constraints", citations: ["families: acme-*"], reason: "family" },
      ),
  );
}

test("property: a refresh never deletes a row and never moves a model or benchmark key", () =>
  hegel.test((tc) => {
    const data = baseData();
    let out;
    try {
      out = refresh(data, drawResearch(tc, data), drawVerdicts(tc, data), ctx({ maxReplacementShare: 1 }));
    } catch (error) {
      assert.ok(error instanceof ProposalError);
      return;
    }
    data.models.forEach((m, i) => assert.equal(out.data.models[i].id, m.id));
    data.observations.forEach((o, i) => {
      assert.equal(out.data.observations[i].model, o.model);
      assert.equal(out.data.observations[i].benchmark, o.benchmark);
    });
    data.pricing.forEach((p, i) => assert.equal(out.data.pricing[i].model, p.model));
    assert.ok(out.data.history.length >= data.history.length);
    assert.deepEqual(new Set(out.data.eligibility.map((e) => e.model)), new Set(out.data.models.map((m) => m.id)));
  }));

test("property: a score that equals another model's score on the same benchmark is never written", () =>
  hegel.test((tc) => {
    const data = baseData();
    const score = tc.draw(gs.booleans()) ? 70 : 60;
    const holder = score === 70 ? "acme-one-1" : "acme-two-1";
    const target = tc.draw(gs.booleans()) ? "acme-three-1" : holder === "acme-one-1" ? "acme-two-1" : "acme-one-1";
    const out = refresh(
      data,
      research({ observations: [{ model: target, benchmark: BENCH.id, score, version: BENCH.version, ...proof }] }),
      eligibilityFile([]),
      ctx(),
    );
    assert.ok(!out.data.observations.some((o) => o.model === target && o.benchmark === BENCH.id && o.score === score));
    assert.match(out.rejected[0].reason, /possible relabel/);
  }));

test("property: applying the same proposals twice changes nothing the second time", () =>
  hegel.test((tc) => {
    const data = baseData();
    const r = drawResearch(tc, data);
    const e = drawVerdicts(tc, data);
    let once;
    try {
      once = refresh(data, r, e, ctx({ maxReplacementShare: 1 }));
    } catch (error) {
      assert.ok(error instanceof ProposalError);
      return;
    }
    const twice = refresh(once.data, r, e, ctx({ maxReplacementShare: 1 }));
    assert.deepEqual(serialize(twice.data), serialize(once.data));
    assert.equal(twice.replaced, 0);
  }));

test("committed data: canonical files, a verdict per model, and no ranked model failing a gate", () => {
  const data = loadData(DATA_DIR);
  for (const [key, file] of Object.entries(DATA_FILES)) {
    assert.equal(readFileSync(path.join(DATA_DIR, file), "utf8"), serialize(data)[file], `${key} is not canonical`);
  }
  assert.deepEqual(new Set(data.eligibility.map((e) => e.model)), new Set(data.models.map((m) => m.id)));
  for (const e of data.eligibility) {
    assert.match(e.catalogCommit, /^[0-9a-f]{40}$/);
    assert.match(e.retrieved, /^\d{4}-\d{2}-\d{2}$/);
  }
  const tracker = buildTracker({
    models: data.models,
    benchmarks,
    observations: data.observations,
    pricing: data.pricing,
    latency: [],
    config: compositeConfig,
    gates,
    nearFrontierTolerance: 0,
  });
  for (const e of data.eligibility.filter((x) => x.verdict === "meets-constraints")) {
    const row = tracker.rows.find((r) => r.model.id === e.model);
    assert.equal(row?.eligibility, "pass", `${e.model} is meets-constraints but does not pass every gate`);
  }
  const status: RefreshStatus = loadStatus(DATA_DIR);
  assert.ok(["never-run", "published", "no-change", "failed"].includes(status.outcome));
});
