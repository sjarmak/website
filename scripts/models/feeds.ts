import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { BenchmarkRecord, ModelRecord } from "../../src/data/models/types.ts";
import { ItemError, isObject } from "./proposal-shape.ts";

export interface BoardRow {
  agent: string;
  model: string;
  effort: string;
  accuracy: number;
  displayed: boolean;
}

export interface QuestionSet {
  categories: ReadonlyMap<string, readonly string[]>;
  rows: ReadonlyMap<string, ReadonlyMap<string, number | null>>;
}

export interface Feeds {
  livebenchRelease: string | null;
  livebenchQuestionSets: ReadonlyMap<string, QuestionSet>;
  terminalBench: { leaderboard: string; rows: BoardRow[] } | null;
}

export const NO_FEEDS: Feeds = { livebenchRelease: null, livebenchQuestionSets: new Map(), terminalBench: null };

const RELEASE = /^\d{8}$/;
const QUESTION_SET = /^(\d{4})-(\d{2})-(\d{2}) question set$/;
const SET_DIR = /^\d{4}_\d{2}_\d{2}$/;
const SUBTEST = /^[A-Za-z0-9_]{1,80}$/;
const ROW_KEY = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,119}$/;
const CELL = /^\d+(\.\d+)?$/;
const NOTED_ROW = /^LiveBench row (\S+),/;
const PRINTED_PRECISION = 0.05 + 1e-9;

export const hostOf = (url: string): string => new URL(url).hostname.replace(/^www\./, "");

const label = (release: string): string => `${release.slice(0, 4)}-${release.slice(4, 6)}-${release.slice(6, 8)}`;
const words = (s: string): string => s.toLowerCase().replace(/[\s-]+/g, " ").trim();

export function questionSet(benchmark: BenchmarkRecord): string | null {
  if (hostOf(benchmark.url) !== "livebench.ai") return null;
  const date = QUESTION_SET.exec(benchmark.version);
  return date ? `${date[1]}_${date[2]}_${date[3]}` : null;
}

const questionSetTableUrl = (benchmark: BenchmarkRecord, set: string): string => new URL(`/v1/table_${set}.csv`, benchmark.url).href;

function boardRow(raw: unknown): BoardRow | null {
  const r = raw as { metadata?: Record<string, unknown>; metrics?: Record<string, unknown>; status?: unknown };
  const meta = r?.metadata ?? {};
  const agent = (meta.agent_display as { label?: unknown } | undefined)?.label;
  const model = (meta.model_display as { label?: unknown } | undefined)?.label;
  const effort = meta.reasoning_effort;
  const accuracy = r?.metrics?.accuracy;
  if (typeof agent !== "string" || typeof model !== "string" || typeof effort !== "string" || typeof accuracy !== "number") return null;
  return { agent, model, effort, accuracy, displayed: r.status === "display" };
}

function parseTable(csv: string): { subtests: string[]; rows: QuestionSet["rows"] } | null {
  const [head, ...body] = csv.replace(/\n$/, "").split("\n");
  const [first, ...subtests] = head.split(",");
  if (first !== "model" || subtests.length === 0 || !subtests.every((s) => SUBTEST.test(s)) || new Set(subtests).size !== subtests.length) return null;
  const rows = new Map<string, ReadonlyMap<string, number | null>>();
  for (const line of body) {
    const [key, ...cells] = line.split(",");
    if (cells.length !== subtests.length || !ROW_KEY.test(key) || rows.has(key) || !cells.every((c) => c === "" || CELL.test(c))) return null;
    rows.set(key, new Map(subtests.map((s, i) => [s, cells[i] === "" ? null : Number(cells[i])])));
  }
  return rows.size > 0 ? { subtests, rows } : null;
}

function parseCategories(json: string, subtests: string[]): QuestionSet["categories"] | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!isObject(raw)) return null;
  const entries = Object.entries(raw);
  const valid = entries.every(
    ([, names]) =>
      Array.isArray(names) &&
      names.length > 0 &&
      new Set(names).size === names.length &&
      names.every((n) => typeof n === "string" && subtests.includes(n)),
  );
  return valid && entries.length > 0 ? new Map(entries as [string, string[]][]) : null;
}

function readQuestionSet(dir: string): QuestionSet | null {
  const tableFile = path.join(dir, "table.csv");
  const categoriesFile = path.join(dir, "categories.json");
  if (!existsSync(tableFile) || !existsSync(categoriesFile)) return null;
  const table = parseTable(readFileSync(tableFile, "utf8"));
  if (!table) return null;
  const categories = parseCategories(readFileSync(categoriesFile, "utf8"), table.subtests);
  return categories ? { categories, rows: table.rows } : null;
}

function readQuestionSets(dir: string): Feeds["livebenchQuestionSets"] {
  const root = path.join(dir, "livebench", "v1");
  if (!existsSync(root)) return new Map();
  return new Map(
    readdirSync(root)
      .filter((name) => SET_DIR.test(name))
      .flatMap((name) => {
        const set = readQuestionSet(path.join(root, name));
        return set ? [[name, set] as const] : [];
      }),
  );
}

export function readFeeds(dir: string | undefined): Feeds {
  if (!dir) return NO_FEEDS;
  const releaseFile = path.join(dir, "livebench", "release");
  const release = existsSync(releaseFile) ? readFileSync(releaseFile, "utf8").trim() : "";
  const boardFile = path.join(dir, "terminal-bench.json");
  let terminalBench: Feeds["terminalBench"] = null;
  if (existsSync(boardFile)) {
    const board = JSON.parse(readFileSync(boardFile, "utf8")) as { leaderboard?: { package?: unknown; name?: unknown }; rows?: unknown };
    if (typeof board.leaderboard?.package === "string" && typeof board.leaderboard?.name === "string" && Array.isArray(board.rows)) {
      const rows = board.rows.map(boardRow).filter((r): r is BoardRow => r !== null);
      terminalBench = { leaderboard: `${board.leaderboard.package} ${board.leaderboard.name}`, rows };
    }
  }
  return { livebenchRelease: RELEASE.test(release) ? release : null, livebenchQuestionSets: readQuestionSets(dir), terminalBench };
}

export interface BoardClaim {
  agent: string | undefined;
  effort: string | undefined;
  sourceRow: string | undefined;
  sourceUrl: string;
  score: number;
}

export interface Recorded {
  models: readonly ModelRecord[];
  note: string | undefined;
}

const normalized = (s: string): string => s.toLowerCase().replaceAll(".", "-");
const CONFIGURATION_SUFFIX = /^(?:-(?:\d{4}-\d{2}-\d{2}|\d{8}|\d+k|minimal|low|medium|high|xhigh|max|effort|thinking|auto))*$/;

function reach(rowKey: string, model: ModelRecord): number {
  const key = normalized(rowKey);
  const names = [model.id, model.apiId].filter((n): n is string => n !== undefined).map(normalized);
  return Math.max(0, ...names.filter((n) => key.startsWith(n) && CONFIGURATION_SUFFIX.test(key.slice(n.length))).map((n) => n.length));
}

function checkLivebench(benchmark: BenchmarkRecord, model: ModelRecord, claim: BoardClaim, feeds: Feeds, recorded: Recorded): string {
  const set = questionSet(benchmark);
  const category = benchmark.livebenchCategory;
  if (!set || !category) throw new ItemError(`${benchmark.id} names no LiveBench question set and category, so its scores cannot be checked`);
  const table = feeds.livebenchQuestionSets.get(set);
  if (!table) throw new ItemError(`the LiveBench ${benchmark.version} table was not fetched this run, so the score cannot be checked`);
  const tableUrl = questionSetTableUrl(benchmark, set);
  if (claim.sourceUrl !== tableUrl) throw new ItemError(`a ${benchmark.id} score must cite the ${benchmark.version} table ${tableUrl}, not ${claim.sourceUrl}`);
  const key = claim.sourceRow;
  if (!key) throw new ItemError(`a ${benchmark.id} score needs sourceRow, the exact row key in ${tableUrl}`);
  const row = table.rows.get(key);
  if (!row) throw new ItemError(`the LiveBench ${benchmark.version} table has no row ${key}`);
  const own = reach(key, model);
  if (own === 0) throw new ItemError(`LiveBench row ${key} does not name ${model.id}`);
  const closer = recorded.models.find((m) => m.id !== model.id && reach(key, m) >= own);
  if (closer) throw new ItemError(`LiveBench row ${key} names ${closer.id} at least as closely as ${model.id}`);
  const subtests = table.categories.get(category);
  if (!subtests) throw new ItemError(`the LiveBench ${benchmark.version} categories list no ${category}`);
  const values = subtests.map((s) => row.get(s));
  const missing = subtests.filter((_, i) => typeof values[i] !== "number");
  if (missing.length > 0) throw new ItemError(`LiveBench row ${key} has no ${missing.join(", ")} score, so its ${category} score cannot be computed`);
  const mean = Math.round(((values as number[]).reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  if (Math.abs(mean - claim.score) > PRINTED_PRECISION) {
    throw new ItemError(`LiveBench row ${key} averages ${mean} on ${category}, not ${claim.score}`);
  }
  const earlier = NOTED_ROW.exec(recorded.note ?? "")?.[1];
  if (earlier && earlier !== key) {
    throw new ItemError(`${model.id} on ${benchmark.id} is recorded from LiveBench row ${earlier}; row ${key} is another configuration`);
  }
  return `LiveBench row ${key}, ${benchmark.version}`;
}

function checkHarness(benchmark: BenchmarkRecord, harness: string, model: ModelRecord, claim: BoardClaim, feeds: Feeds): string {
  const board = feeds.terminalBench;
  if (!board) throw new ItemError(`the ${harness} leaderboard was not fetched this run, so the row cannot be checked`);
  if (board.leaderboard !== harness) throw new ItemError(`the fetched leaderboard ${board.leaderboard} is not the harness ${harness} that ${benchmark.id} records`);
  if (!claim.agent || !claim.effort) throw new ItemError(`a ${benchmark.id} row needs the leaderboard's agent and effort`);
  const name = words(model.name);
  const row = board.rows.find(
    (r) =>
      r.agent === claim.agent &&
      r.effort === claim.effort &&
      Math.abs(r.accuracy - claim.score) <= PRINTED_PRECISION &&
      (name === words(r.model) || name.endsWith(` ${words(r.model)}`)),
  );
  if (!row) throw new ItemError(`no ${harness} row for ${model.name} with agent ${claim.agent}, effort ${claim.effort} and accuracy ${claim.score}`);
  if (!row.displayed) throw new ItemError(`the ${harness} row for ${model.name} is not displayed on the leaderboard`);
  return `agent ${row.agent}, effort ${row.effort}, leaderboard ${harness}`;
}

export function checkFeedRow(benchmark: BenchmarkRecord, model: ModelRecord, claim: BoardClaim, feeds: Feeds, recorded: Recorded): string | undefined {
  if (hostOf(benchmark.url) === "livebench.ai") return checkLivebench(benchmark, model, claim, feeds, recorded);
  return benchmark.harness ? checkHarness(benchmark, benchmark.harness, model, claim, feeds) : undefined;
}

export function feedNotices(benchmarks: BenchmarkRecord[], feeds: Feeds): string[] {
  const release = feeds.livebenchRelease;
  if (!release) return [];
  const pinned = [...new Set(benchmarks.filter((b) => hostOf(b.url) === "livebench.ai").map((b) => b.version))];
  const behind = pinned.filter((v) => !v.startsWith(label(release)));
  if (behind.length === 0) return [];
  return [
    `LiveBench published release ${label(release)}, which the composite does not use; its LiveBench scores stay pinned to the ${behind.join(", ")} until the method is changed.`,
  ];
}
