import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { RefreshOutcome, RefreshSource, RefreshStatus } from "../../src/data/models/types.ts";
import type { DataSet, SourceReport } from "./refresh-lib.ts";

export const DATA_FILES = {
  models: "models.json",
  observations: "observations.json",
  pricing: "pricing.json",
  eligibility: "omni-eligibility.json",
  history: "history.json",
} as const;

export const STATUS_FILE = "refresh-status.json";

const KEY_ORDER: Record<keyof DataSet, string[]> = {
  models: [
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
    "supersededBy",
  ],
  observations: ["model", "benchmark", "score", "version", "sourceUrl", "retrieved", "note"],
  pricing: ["model", "inputPerM", "outputPerM", "provider", "scope", "sourceUrl", "retrieved", "note"],
  eligibility: ["model", "verdict", "basis", "gates", "catalogCommit", "retrieved"],
  history: ["table", "model", "key", "previous", "replacedOn", "sourceUrl"],
};

function ordered(record: object, keys: string[]): object {
  const entries = Object.entries(record).filter(([, v]) => v !== undefined);
  const unknown = entries.map(([k]) => k).filter((k) => !keys.includes(k));
  if (unknown.length > 0) throw new Error(`cannot serialize unexpected fields: ${unknown.join(", ")}`);
  return Object.fromEntries(keys.flatMap((k) => entries.filter(([key]) => key === k)));
}

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

export function serialize(data: DataSet): Record<string, string> {
  return Object.fromEntries(
    (Object.keys(DATA_FILES) as (keyof DataSet)[]).map((name) => [
      DATA_FILES[name],
      json((data[name] as object[]).map((r) => ordered(r, KEY_ORDER[name]))),
    ]),
  );
}

const readJson = (file: string): unknown => JSON.parse(readFileSync(file, "utf8"));

export function loadData(dir: string): DataSet {
  return Object.fromEntries(
    (Object.keys(DATA_FILES) as (keyof DataSet)[]).map((name) => [name, readJson(path.join(dir, DATA_FILES[name]))]),
  ) as unknown as DataSet;
}

export function writeData(dir: string, data: DataSet): void {
  for (const [file, content] of Object.entries(serialize(data))) writeFileSync(path.join(dir, file), content);
}

export function loadStatus(dir: string): RefreshStatus {
  return readJson(path.join(dir, STATUS_FILE)) as RefreshStatus;
}

export function writeStatus(dir: string, status: RefreshStatus): void {
  writeFileSync(path.join(dir, STATUS_FILE), json(status));
}

export interface RunRecord {
  at: string;
  outcome: Exclude<RefreshOutcome, "never-run">;
  failedStage: string | null;
  exitCode: number;
  catalogCommit: string | null;
  accepted: number;
  rejected: number;
  sources: SourceReport[];
  notices: string[];
}

export function nextStatus(previous: RefreshStatus, run: RunRecord): RefreshStatus {
  const reported = new Map(run.sources.map((s) => [s.source, s.status]));
  const carried: RefreshSource[] = previous.sources.map((s) => {
    const status = reported.get(s.source);
    if (status === undefined) return s;
    return { source: s.source, status, checked: run.at, lastOk: status === "ok" ? run.at : s.lastOk };
  });
  const known = new Set(previous.sources.map((s) => s.source));
  const fresh: RefreshSource[] = run.sources
    .filter((s) => !known.has(s.source))
    .map((s) => ({ source: s.source, status: s.status, checked: run.at, lastOk: s.status === "ok" ? run.at : null }));
  return {
    lastAttempt: run.at,
    lastSuccess: run.outcome === "failed" ? previous.lastSuccess : run.at,
    outcome: run.outcome,
    failedStage: run.outcome === "failed" ? run.failedStage : null,
    exitCode: run.exitCode,
    catalogCommit: run.catalogCommit ?? previous.catalogCommit,
    accepted: run.accepted,
    rejected: run.rejected,
    sources: [...carried, ...fresh].sort((a, b) => a.source.localeCompare(b.source)),
    notices: run.notices,
  };
}
