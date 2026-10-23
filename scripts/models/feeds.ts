import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { BenchmarkRecord, ModelRecord } from "../../src/data/models/types.ts";
import { ItemError } from "./proposal-shape.ts";

export interface BoardRow {
  agent: string;
  model: string;
  effort: string;
  accuracy: number;
  displayed: boolean;
}

export interface Feeds {
  livebenchRelease: string | null;
  terminalBench: { leaderboard: string; rows: BoardRow[] } | null;
}

export const NO_FEEDS: Feeds = { livebenchRelease: null, terminalBench: null };

const RELEASE = /^\d{8}$/;
const LIVEBENCH_DATA = /^https:\/\/livebench\.ai\/data\/(\d{8})\//;
const PRINTED_PRECISION = 0.05 + 1e-9;

export const hostOf = (url: string): string => new URL(url).hostname.replace(/^www\./, "");

const label = (release: string): string => `${release.slice(0, 4)}-${release.slice(4, 6)}-${release.slice(6, 8)}`;
const words = (s: string): string => s.toLowerCase().replace(/[\s-]+/g, " ").trim();

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
  return { livebenchRelease: RELEASE.test(release) ? release : null, terminalBench };
}

function checkLivebench(benchmark: BenchmarkRecord, sourceUrl: string, feeds: Feeds): void {
  const release = LIVEBENCH_DATA.exec(sourceUrl)?.[1] ?? feeds.livebenchRelease;
  if (!release) throw new ItemError("the LiveBench release behind this score is unknown, because the source names none and the release feed was not fetched");
  if (!benchmark.version.startsWith(label(release))) {
    throw new ItemError(`LiveBench release ${label(release)} differs from the pinned "${benchmark.version}"`);
  }
}

export interface BoardClaim {
  agent: string | undefined;
  effort: string | undefined;
  score: number;
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

export function checkFeedRow(benchmark: BenchmarkRecord, model: ModelRecord, sourceUrl: string, claim: BoardClaim, feeds: Feeds): string | undefined {
  if (hostOf(benchmark.url) === "livebench.ai") checkLivebench(benchmark, sourceUrl, feeds);
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
