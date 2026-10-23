import { buildTracker } from "../../src/lib/models/build.ts";
import type { Gate } from "../../src/lib/models/gates.ts";
import {
  VENDORS,
  type BenchmarkRecord,
  type CompositeConfig,
  type HistoryEntry,
  type ModelRecord,
  type Observation,
  type OmniBasis,
  type OmniEligibility,
  type OmniVerdict,
  type PricingRecord,
  type SourceStatus,
} from "../../src/data/models/types.ts";
import {
  ItemError,
  ProposalError,
  dated,
  finite,
  flag,
  header,
  httpsUrl,
  isObject,
  list,
  optionalFlag,
  optionalHttpsUrl,
  optionalPositiveInteger,
  optionalText,
  optionalTextList,
  positiveInteger,
  text,
  textList,
  type Raw,
} from "./proposal-shape.ts";
import { checkFeedRow, hostOf, type Feeds } from "./feeds.ts";

export { ItemError, ProposalError };

export interface DataSet {
  models: ModelRecord[];
  observations: Observation[];
  pricing: PricingRecord[];
  eligibility: OmniEligibility[];
  history: HistoryEntry[];
}

export interface RunContext {
  runDate: string;
  catalogCommit: string;
  catalogText: string;
  benchmarks: BenchmarkRecord[];
  config: CompositeConfig;
  gates: Gate[];
  maxReplacementShare: number;
  feeds: Feeds;
}

export interface Decision {
  item: string;
  reason: string;
  evidence?: string;
}

export interface SourceReport {
  source: string;
  status: SourceStatus;
}

export interface RefreshResult {
  data: DataSet;
  accepted: Decision[];
  rejected: Decision[];
  replaced: number;
  sources: SourceReport[];
}

const MODEL_ID = /^[a-z0-9][a-z0-9.-]{1,63}$/;
const RELEASED = /^\d{4}-\d{2}(-\d{2})?$/;
const DATED_KEYS = ["sourceUrl", "retrieved", "evidence"];
const NEW_MODEL_KEYS = [
  "id",
  "name",
  "vendor",
  "apiId",
  "released",
  "contextWindow",
  "maxOutputTokens",
  "openWeights",
  "apiAvailable",
  "toolCalling",
  "structuredOutput",
  "zeroDataRetention",
  "privacyVia",
  "docsUrl",
  "notes",
];
const AGENT_INELIGIBLE_BASES: OmniBasis[] = ["provider-not-supported", "failed-catalog-constraint", "failed-gate"];
const VERDICTS: OmniVerdict[] = ["in-catalog", "meets-constraints", "unresolved", "ineligible"];

const fieldParsers: Record<string, (o: Raw) => unknown> = {
  apiId: (o) => text(o, "value", 80),
  notes: (o) => text(o, "value", 400),
  released: (o) => released(o, "value"),
  contextWindow: (o) => positiveInteger(o, "value"),
  maxOutputTokens: (o) => positiveInteger(o, "value"),
  openWeights: (o) => flag(o, "value"),
  apiAvailable: (o) => flag(o, "value"),
  toolCalling: (o) => flag(o, "value"),
  structuredOutput: (o) => flag(o, "value"),
  zeroDataRetention: (o) => flag(o, "value"),
  privacyVia: (o) => textList(o, "value", 80),
  docsUrl: (o) => httpsUrl(o, "value"),
};

function released(o: Raw, key: string): string {
  const value = text(o, key, 10);
  if (!RELEASED.test(value)) throw new ItemError(`${key} must look like YYYY-MM or YYYY-MM-DD`);
  return value;
}

function onlyKeys(o: Raw, allowed: string[]): void {
  const extra = Object.keys(o).filter((k) => !allowed.includes(k));
  if (extra.length > 0) throw new ItemError(`unexpected fields: ${extra.join(", ")}`);
}

function withoutUndefined<T extends object>(record: T): T {
  return Object.fromEntries(Object.entries(record).filter(([, v]) => v !== undefined)) as T;
}

const sameValue = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

class Batch {
  models: ModelRecord[];
  observations: Observation[];
  pricing: PricingRecord[];
  eligibility: OmniEligibility[];
  history: HistoryEntry[];
  accepted: Decision[] = [];
  rejected: Decision[] = [];
  replaced = 0;
  readonly baselineRows: number;
  readonly ctx: RunContext;
  readonly startingEligibility: OmniEligibility[];
  readonly assessed = new Set<string>();
  failedSources = new Set<string>();

  constructor(data: DataSet, ctx: RunContext) {
    this.ctx = ctx;
    this.models = data.models.map((m) => ({ ...m }));
    this.observations = data.observations.map((o) => ({ ...o }));
    this.pricing = data.pricing.map((p) => ({ ...p }));
    this.eligibility = data.eligibility.map((e) => ({ ...e }));
    this.startingEligibility = data.eligibility;
    this.history = [...data.history];
    this.baselineRows = data.observations.length + data.pricing.length;
  }

  attempt(item: string, step: () => void): void {
    try {
      step();
    } catch (error) {
      if (!(error instanceof ItemError)) throw error;
      this.rejected.push({ item, reason: error.message });
    }
  }

  model(id: string): ModelRecord {
    const found = this.models.find((m) => m.id === id);
    if (!found) throw new ItemError(`model "${id}" does not exist and is not added in this batch`);
    return found;
  }

  replaceModel(next: ModelRecord): void {
    this.models = this.models.map((m) => (m.id === next.id ? next : m));
  }

  remember(entry: Omit<HistoryEntry, "replacedOn">): void {
    this.history.push({ ...entry, replacedOn: this.ctx.runDate });
  }
}

const pageOf = (url: string): string => `${hostOf(url)}${new URL(url).pathname}`;

function sourced(batch: Batch, o: Raw): ReturnType<typeof dated> {
  const proof = dated(o, batch.ctx.runDate);
  const blocked = [hostOf(proof.sourceUrl), pageOf(proof.sourceUrl)].find((key) => batch.failedSources.has(key));
  if (blocked) throw new ItemError(`source ${blocked} was reported as failed or unresolved in this run`);
  return proof;
}

function feedProof(batch: Batch, o: Raw, benchmark: BenchmarkRecord): ReturnType<typeof dated> {
  const proof = dated(o, batch.ctx.runDate);
  if (proof.sourceUrl !== benchmark.url) throw new ItemError(`a ${benchmark.id} row is checked against the fetched leaderboard and must cite ${benchmark.url}`);
  return proof;
}

function addModel(batch: Batch, o: Raw): void {
  onlyKeys(o, [...NEW_MODEL_KEYS, ...DATED_KEYS]);
  const proof = sourced(batch, o);
  const id = text(o, "id", 64);
  if (!MODEL_ID.test(id)) throw new ItemError(`id "${id}" must be lower-case letters, digits, dots and dashes`);
  const vendor = text(o, "vendor", 40);
  if (!(VENDORS as readonly string[]).includes(vendor)) throw new ItemError(`vendor "${vendor}" is not a known vendor`);
  const record = withoutUndefined<ModelRecord>({
    id,
    name: text(o, "name", 80),
    vendor: vendor as ModelRecord["vendor"],
    apiId: optionalText(o, "apiId", 80),
    released: o.released === undefined ? undefined : released(o, "released"),
    contextWindow: optionalPositiveInteger(o, "contextWindow"),
    maxOutputTokens: optionalPositiveInteger(o, "maxOutputTokens"),
    openWeights: flag(o, "openWeights"),
    apiAvailable: flag(o, "apiAvailable"),
    toolCalling: optionalFlag(o, "toolCalling"),
    structuredOutput: optionalFlag(o, "structuredOutput"),
    zeroDataRetention: optionalFlag(o, "zeroDataRetention"),
    privacyVia: optionalTextList(o, "privacyVia", 80),
    docsUrl: optionalHttpsUrl(o, "docsUrl"),
    notes: optionalText(o, "notes", 400),
  });
  const existing = batch.models.find((m) => m.id === id);
  if (existing) {
    if (sameValue(existing, record)) return;
    throw new ItemError(`model "${id}" already exists; change it with updateModels`);
  }
  batch.models.push(record);
  batch.accepted.push({ item: `add model ${id}`, reason: proof.sourceUrl, evidence: proof.evidence });
}

function updateModel(batch: Batch, o: Raw): void {
  onlyKeys(o, ["model", "field", "value", ...DATED_KEYS]);
  const proof = sourced(batch, o);
  const model = batch.model(text(o, "model", 64));
  const field = text(o, "field", 40);
  const parse = fieldParsers[field];
  if (!parse) throw new ItemError(`field "${field}" cannot be changed by the refresh`);
  const value = parse(o);
  const previous = (model as unknown as Raw)[field];
  if (sameValue(previous, value)) return;
  if (field === "apiId" && previous !== undefined) {
    throw new ItemError(`${model.id} already has API id "${String(previous)}"; a different id is a different version and needs its own model record`);
  }
  batch.remember({ table: "models", model: model.id, key: field, previous: previous ?? null, sourceUrl: proof.sourceUrl });
  batch.replaceModel({ ...model, [field]: value });
  batch.accepted.push({ item: `update ${model.id}.${field}`, reason: proof.sourceUrl, evidence: proof.evidence });
}

function supersede(batch: Batch, o: Raw): void {
  onlyKeys(o, ["model", "by", "note", ...DATED_KEYS]);
  const proof = sourced(batch, o);
  const model = batch.model(text(o, "model", 64));
  const target = batch.model(text(o, "by", 64));
  if (model.id === target.id) throw new ItemError("a model cannot supersede itself");
  if (model.vendor !== target.vendor) {
    throw new ItemError(`${target.id} (${target.vendor}) is not the same vendor as ${model.id} (${model.vendor})`);
  }
  if (model.supersededBy) {
    if (model.supersededBy.model === target.id) return;
    throw new ItemError(`${model.id} is already superseded by ${model.supersededBy.model}`);
  }
  const seen = new Set([model.id]);
  for (let cursor: ModelRecord | undefined = target; cursor; ) {
    if (seen.has(cursor.id)) throw new ItemError(`superseding ${model.id} by ${target.id} would form a cycle`);
    seen.add(cursor.id);
    const next: string | undefined = cursor.supersededBy?.model;
    cursor = next === undefined ? undefined : batch.models.find((m) => m.id === next);
  }
  const supersededBy = withoutUndefined({
    model: target.id,
    sourceUrl: proof.sourceUrl,
    retrieved: proof.retrieved,
    note: optionalText(o, "note", 300),
  });
  batch.replaceModel({ ...model, supersededBy });
  batch.accepted.push({ item: `supersede ${model.id} by ${target.id}`, reason: proof.sourceUrl, evidence: proof.evidence });
}

function scoreRange(benchmark: BenchmarkRecord): [number, number] {
  const n = benchmark.normalization;
  return n.kind === "linear" ? [Math.min(n.min, n.max), Math.max(n.min, n.max)] : [Number.MIN_VALUE, Number.MAX_VALUE];
}

function relabelSource(batch: Batch, model: string, benchmark: string, score: number): string | undefined {
  const current = batch.observations.find((r) => r.benchmark === benchmark && r.score === score && r.model !== model);
  if (current) return `existing ${current.model}`;
  const earlier = batch.history.find((h) => {
    if (h.table !== "observations" || h.key !== benchmark || h.model === model) return false;
    return (h.previous as Observation).score === score;
  });
  return earlier ? `earlier ${earlier.model}` : undefined;
}

function addObservation(batch: Batch, o: Raw, seen: Set<string>): void {
  onlyKeys(o, ["model", "benchmark", "score", "version", "note", "agent", "effort", "sourceRow", ...DATED_KEYS]);
  const model = batch.model(text(o, "model", 64));
  const benchmarkId = text(o, "benchmark", 64);
  const benchmark = batch.ctx.benchmarks.find((b) => b.id === benchmarkId);
  if (!benchmark) throw new ItemError(`benchmark "${benchmarkId}" is not defined`);
  const proof = benchmark.harness ? feedProof(batch, o, benchmark) : sourced(batch, o);
  const version = text(o, "version", 120);
  if (version !== benchmark.version) throw new ItemError(`version "${version}" differs from the pinned "${benchmark.version}"`);
  const score = finite(o, "score");
  const [min, max] = scoreRange(benchmark);
  if (score < min || score > max) throw new ItemError(`score ${score} is outside ${min}..${max}`);
  const claim = {
    agent: optionalText(o, "agent", 80),
    effort: optionalText(o, "effort", 20),
    sourceRow: optionalText(o, "sourceRow", 120),
    sourceUrl: proof.sourceUrl,
    score,
  };
  const index = batch.observations.findIndex((r) => r.model === model.id && r.benchmark === benchmark.id);
  const boardNote = checkFeedRow(benchmark, model, claim, batch.ctx.feeds, { models: batch.models, note: batch.observations[index]?.note });
  const key = `${model.id}/${benchmark.id}`;
  if (seen.has(key)) throw new ItemError(`${key} appears twice in this batch`);
  seen.add(key);
  if (index >= 0 && batch.observations[index].score === score) return;
  const clash = relabelSource(batch, model.id, benchmark.id, score);
  if (clash) throw new ItemError(`score ${score} equals the ${clash} row on ${benchmark.id}; possible relabel`);
  const row = withoutUndefined<Observation>({
    model: model.id,
    benchmark: benchmark.id,
    score,
    version,
    sourceUrl: proof.sourceUrl,
    retrieved: proof.retrieved,
    note: boardNote ?? optionalText(o, "note", 200),
  });
  if (index >= 0) {
    const previous = batch.observations[index];
    batch.remember({ table: "observations", model: model.id, key: benchmark.id, previous, sourceUrl: proof.sourceUrl });
    batch.observations = batch.observations.map((r, i) => (i === index ? row : r));
    batch.replaced += 1;
    batch.accepted.push({ item: `replace ${key} ${previous.score} -> ${score}`, reason: proof.sourceUrl, evidence: proof.evidence });
    return;
  }
  batch.observations.push(row);
  batch.accepted.push({ item: `observe ${key} = ${score}`, reason: proof.sourceUrl, evidence: proof.evidence });
}

function addPricing(batch: Batch, o: Raw, seen: Set<string>): void {
  onlyKeys(o, ["model", "inputPerM", "outputPerM", "provider", "scope", "note", ...DATED_KEYS]);
  const proof = sourced(batch, o);
  if (batch.ctx.benchmarks.some((b) => hostOf(b.url) === hostOf(proof.sourceUrl))) {
    throw new ItemError(`${hostOf(proof.sourceUrl)} is a benchmark board; its run costs are not provider list prices`);
  }
  const model = batch.model(text(o, "model", 64));
  if (seen.has(model.id)) throw new ItemError(`pricing for ${model.id} appears twice in this batch`);
  seen.add(model.id);
  const inputPerM = finite(o, "inputPerM");
  const outputPerM = finite(o, "outputPerM");
  for (const [k, v] of [["inputPerM", inputPerM], ["outputPerM", outputPerM]] as const) {
    if (v <= 0 || v > 10_000) throw new ItemError(`${k} must be above 0 and at most 10000 dollars per million tokens`);
  }
  const row = withoutUndefined<PricingRecord>({
    model: model.id,
    inputPerM,
    outputPerM,
    provider: text(o, "provider", 80),
    scope: text(o, "scope", 200),
    sourceUrl: proof.sourceUrl,
    retrieved: proof.retrieved,
    note: optionalText(o, "note", 200),
  });
  const index = batch.pricing.findIndex((r) => r.model === model.id);
  if (index >= 0) {
    const previous = batch.pricing[index];
    const unchanged =
      previous.inputPerM === inputPerM &&
      previous.outputPerM === outputPerM &&
      previous.provider === row.provider &&
      previous.scope === row.scope;
    if (unchanged) return;
    batch.remember({ table: "pricing", model: model.id, key: "list-price", previous, sourceUrl: proof.sourceUrl });
    batch.pricing = batch.pricing.map((r, i) => (i === index ? row : r));
    batch.replaced += 1;
    batch.accepted.push({ item: `reprice ${model.id}`, reason: proof.sourceUrl, evidence: proof.evidence });
    return;
  }
  batch.pricing.push(row);
  batch.accepted.push({ item: `price ${model.id}`, reason: proof.sourceUrl, evidence: proof.evidence });
}

function dropUnbenchmarked(batch: Batch, tracked: Set<string>): void {
  const successors = new Set(batch.models.flatMap((m) => (m.supersededBy ? [m.supersededBy.model] : [])));
  const observed = new Set(batch.observations.map((o) => o.model));
  const dropped = new Set(batch.models.filter((m) => !tracked.has(m.id) && !observed.has(m.id) && !successors.has(m.id)).map((m) => m.id));
  if (dropped.size === 0) return;
  batch.models = batch.models.filter((m) => !dropped.has(m.id));
  batch.accepted = batch.accepted.filter((d) => ![...dropped].some((id) => d.item === `add model ${id}`));
  for (const id of dropped) {
    batch.rejected.push({ item: `add model ${id}`, reason: "no verified benchmark for this exact version, and it supersedes no tracked model" });
  }
}

function sourceReports(batch: Batch, root: Raw): SourceReport[] {
  const bySource = new Map<string, SourceStatus>();
  for (const raw of list(root, "sources")) {
    batch.attempt("source report", () => {
      if (!isObject(raw)) throw new ItemError("source report must be an object");
      const status = text(raw, "status", 10);
      if (status !== "ok" && status !== "failed" && status !== "unresolved") {
        throw new ItemError(`source status must be ok, failed or unresolved, found ${status}`);
      }
      const url = httpsUrl(raw, "url");
      const key = status === "ok" ? hostOf(url) : pageOf(url);
      const previous = bySource.get(key);
      bySource.set(key, previous && previous !== "ok" ? previous : status);
    });
  }
  return [...bySource].map(([source, status]) => ({ source, status }));
}

function each(batch: Batch, root: Raw, key: string, label: string, step: (o: Raw) => void): void {
  list(root, key).forEach((raw, i) => {
    const name = isObject(raw) && typeof raw.model === "string" ? raw.model : isObject(raw) && typeof raw.id === "string" ? raw.id : `#${i}`;
    batch.attempt(`${label} ${name}`, () => {
      if (!isObject(raw)) throw new ItemError("item must be an object");
      step(raw);
    });
  });
}

function applyResearch(batch: Batch, research: unknown): SourceReport[] {
  const root = header(research, batch.ctx.runDate);
  const sources = sourceReports(batch, root);
  batch.failedSources = new Set(sources.filter((s) => s.status !== "ok").map((s) => s.source));
  const observed = new Set<string>();
  const priced = new Set<string>();
  const tracked = new Set(batch.models.map((m) => m.id));
  each(batch, root, "addModels", "add model", (o) => addModel(batch, o));
  each(batch, root, "observations", "observation", (o) => addObservation(batch, o, observed));
  each(batch, root, "supersede", "supersede", (o) => supersede(batch, o));
  dropUnbenchmarked(batch, tracked);
  each(batch, root, "updateModels", "update model", (o) => updateModel(batch, o));
  each(batch, root, "pricing", "pricing", (o) => addPricing(batch, o, priced));
  const share = batch.replaced / Math.max(1, batch.baselineRows);
  if (share > batch.ctx.maxReplacementShare) {
    throw new ProposalError(
      `circuit breaker: ${batch.replaced} of ${batch.baselineRows} existing rows would change (limit ${Math.round(batch.ctx.maxReplacementShare * 100)}%)`,
    );
  }
  return sources;
}

function setVerdict(batch: Batch, model: string, verdict: OmniVerdict, basis: OmniBasis, gates?: string[]): void {
  const next = withoutUndefined<OmniEligibility>({
    model,
    verdict,
    basis,
    gates: gates && gates.length > 0 ? gates : undefined,
    catalogCommit: batch.ctx.catalogCommit,
    retrieved: batch.ctx.runDate,
  });
  batch.assessed.add(model);
  const index = batch.eligibility.findIndex((e) => e.model === model);
  if (index < 0) {
    batch.eligibility.push(next);
    return;
  }
  batch.eligibility = batch.eligibility.map((e, i) => (i === index ? next : e));
}

type GateSummary = Map<string, { failing: string[]; unknown: string[] }>;

function judge(batch: Batch, o: Raw, gates: GateSummary): void {
  onlyKeys(o, ["model", "verdict", "basis", "citations", "reason"]);
  const model = batch.model(text(o, "model", 64)).id;
  const verdict = text(o, "verdict", 20) as OmniVerdict;
  if (!VERDICTS.includes(verdict)) throw new ItemError(`verdict must be one of ${VERDICTS.join(", ")}`);
  const reason = text(o, "reason", 600);
  if (verdict === "unresolved") {
    setVerdict(batch, model, "unresolved", "evidence-inconclusive");
    batch.accepted.push({ item: `eligibility ${model} unresolved`, reason });
    return;
  }
  const basis: OmniBasis =
    verdict === "in-catalog" ? "exact-model-listed" : verdict === "meets-constraints" ? "provider-family-supported" : (text(o, "basis", 40) as OmniBasis);
  if (verdict === "ineligible" && !AGENT_INELIGIBLE_BASES.includes(basis)) {
    throw new ItemError(`an ineligible verdict needs basis ${AGENT_INELIGIBLE_BASES.join(" or ")}`);
  }
  if (basis === "failed-gate") {
    const failing = gates.get(model)?.failing ?? [];
    if (failing.length === 0) {
      setVerdict(batch, model, "unresolved", "evidence-inconclusive");
      throw new ItemError("ineligible claim downgraded to unresolved; the model fails no gate");
    }
    setVerdict(batch, model, "ineligible", "failed-gate", failing);
    batch.accepted.push({ item: `eligibility ${model} ineligible`, reason });
    return;
  }
  const citations = textList(o, "citations", 200);
  const missing = citations.filter((c) => c.trim().length < 4 || !batch.ctx.catalogText.includes(c));
  if (missing.length > 0) {
    setVerdict(batch, model, "unresolved", "citation-not-found");
    throw new ItemError(`${verdict} claim downgraded to unresolved; not found verbatim in the catalog: ${missing.map((c) => JSON.stringify(c)).join(", ")}`);
  }
  setVerdict(batch, model, verdict, basis);
  batch.accepted.push({ item: `eligibility ${model} ${verdict}`, reason, evidence: citations.join(" | ") });
}

function gateVerdicts(batch: Batch): GateSummary {
  const tracker = buildTracker({
    models: batch.models,
    benchmarks: batch.ctx.benchmarks,
    observations: batch.observations,
    pricing: batch.pricing,
    latency: [],
    config: batch.ctx.config,
    gates: batch.ctx.gates,
    nearFrontierTolerance: 0,
  });
  return new Map(
    tracker.rows.map((r) => [
      r.model.id,
      {
        failing: r.gates.filter((g) => g.verdict === "fail").map((g) => g.gate.id),
        unknown: r.gates.filter((g) => g.verdict === "unknown").map((g) => g.gate.id),
      },
    ]),
  );
}

function applyEligibility(batch: Batch, proposals: unknown): void {
  const root = header(proposals, batch.ctx.runDate);
  if (root.catalogCommit !== batch.ctx.catalogCommit) {
    throw new ProposalError(`catalogCommit must be ${batch.ctx.catalogCommit}, found ${String(root.catalogCommit)}`);
  }
  const gates = gateVerdicts(batch);
  const judged = new Set<string>();
  each(batch, root, "verdicts", "eligibility", (o) => {
    if (typeof o.model === "string" && judged.has(o.model)) throw new ItemError("model judged twice in this batch");
    if (typeof o.model === "string") judged.add(o.model);
    judge(batch, o, gates);
  });
  for (const m of batch.models) {
    if (!batch.assessed.has(m.id)) setVerdict(batch, m.id, "unresolved", "not-assessed");
  }
  for (const e of batch.eligibility.filter((x) => x.verdict === "meets-constraints" || x.verdict === "unresolved")) {
    const g = gates.get(e.model);
    if (!g) continue;
    if (g.failing.length > 0) setVerdict(batch, e.model, "ineligible", "failed-gate", g.failing);
    else if (g.unknown.length > 0 && e.verdict === "meets-constraints") setVerdict(batch, e.model, "unresolved", "gates-unknown", g.unknown);
  }
  for (const previous of batch.startingEligibility) {
    const now = batch.eligibility.find((e) => e.model === previous.model);
    const changed = !now || now.verdict !== previous.verdict || now.basis !== previous.basis || !sameValue(now.gates, previous.gates);
    if (changed) batch.remember({ table: "omni", model: previous.model, key: "verdict", previous });
  }
}

export function proposedModels(data: DataSet, research: unknown, ctx: RunContext): ModelRecord[] {
  const batch = new Batch(data, ctx);
  applyResearch(batch, research);
  return batch.models;
}

export function refresh(data: DataSet, research: unknown, eligibility: unknown, ctx: RunContext): RefreshResult {
  const batch = new Batch(data, ctx);
  const sources = applyResearch(batch, research);
  applyEligibility(batch, eligibility);
  return {
    data: {
      models: batch.models,
      observations: batch.observations,
      pricing: batch.pricing,
      eligibility: batch.eligibility,
      history: batch.history,
    },
    accepted: batch.accepted,
    rejected: batch.rejected,
    replaced: batch.replaced,
    sources,
  };
}
