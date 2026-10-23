import { appendFileSync, copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { benchmarks } from "../../src/data/models/benchmarks.ts";
import { compositeConfig } from "../../src/data/models/capabilities.ts";
import { gates } from "../../src/data/models/gates.ts";
import { VENDORS, type RefreshOutcome } from "../../src/data/models/types.ts";
import { feedNotices, questionSet, readFeeds } from "./feeds.ts";
import { DATA_FILES, loadData, loadStatus, nextStatus, serialize, writeData, writeStatus } from "./refresh-io.ts";
import { ProposalError, proposedModels, refresh, type RunContext, type SourceReport } from "./refresh-lib.ts";

const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "data", "models");
const EXIT_INVALID = 5;

function required(values: Record<string, unknown>, name: string): string {
  const value = values[name];
  if (typeof value !== "string" || value === "") throw new Error(`--${name} is required`);
  return value;
}

function readProposal(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new ProposalError(`${path.basename(file)} is not readable JSON: ${(error as Error).message}`);
  }
}

function catalogText(dir: string): string {
  const files = readdirSync(dir).sort();
  if (files.length === 0) throw new Error(`catalog directory ${dir} is empty`);
  return files.map((f) => readFileSync(path.join(dir, f), "utf8")).join("\n");
}

function context(runDate: string, catalogCommit: string, catalogDir: string | null, feedsDir: string | undefined): RunContext {
  const share = Number(process.env.MODELS_MAX_REPLACEMENT_SHARE ?? "0.25");
  if (!Number.isFinite(share) || share <= 0 || share > 1) throw new Error("MODELS_MAX_REPLACEMENT_SHARE must be in (0, 1]");
  return {
    runDate,
    catalogCommit,
    catalogText: catalogDir === null ? "" : catalogText(catalogDir),
    benchmarks,
    config: compositeConfig,
    gates,
    maxReplacementShare: share,
    feeds: readFeeds(feedsDir, benchmarks),
  };
}

function rejectedWhole(log: string, error: unknown): number {
  if (!(error instanceof ProposalError)) throw error;
  appendFileSync(log, `INVALID ${error.message}\n`);
  console.error(`[models] proposals rejected as a whole: ${error.message}`);
  return EXIT_INVALID;
}

function reference(argv: string[]): number {
  const { values } = parseArgs({ args: argv, options: { out: { type: "string" } } });
  const out = required(values, "out");
  for (const file of [DATA_FILES.models, DATA_FILES.observations, DATA_FILES.pricing]) {
    copyFileSync(path.join(DATA_DIR, file), path.join(out, file));
  }
  const pinned = benchmarks.map((b) => ({
    id: b.id,
    name: b.name,
    url: b.url,
    version: b.version,
    livebenchCategory: b.livebenchCategory,
    livebenchSubtests: b.livebenchSubtests,
    scale: b.scale,
    normalization: b.normalization,
  }));
  writeFileSync(path.join(out, "benchmarks.json"), `${JSON.stringify(pinned, null, 2)}\n`);
  const gateList = gates.map((g) => ({ id: g.id, label: g.label, description: g.description }));
  writeFileSync(path.join(out, "gates.json"), `${JSON.stringify(gateList, null, 2)}\n`);
  writeFileSync(path.join(out, "vendors.json"), `${JSON.stringify(VENDORS, null, 2)}\n`);
  return 0;
}

const pinnedSets = (): string[] => [...new Set(benchmarks.map(questionSet).filter((s): s is string => s !== null))];

function questionSets(): number {
  process.stdout.write(pinnedSets().map((s) => `${s}\n`).join(""));
  return 0;
}

function checkQuestionSets(argv: string[]): number {
  const { values } = parseArgs({ args: argv, options: { feeds: { type: "string" } } });
  const parsed = readFeeds(required(values, "feeds"), benchmarks).livebenchQuestionSets;
  const broken = pinnedSets().filter((s) => !parsed.has(s));
  for (const s of broken) console.log(`[models] livebench question set ${s} does not parse as the pinned subtests`);
  return broken.length === 0 ? 0 : 1;
}

function models(argv: string[]): number {
  const { values } = parseArgs({
    args: argv,
    options: {
      research: { type: "string" },
      "run-date": { type: "string" },
      log: { type: "string" },
      out: { type: "string" },
      feeds: { type: "string" },
    },
  });
  const log = required(values, "log");
  try {
    const ctx = context(required(values, "run-date"), "", null, values.feeds);
    const proposed = proposedModels(loadData(DATA_DIR), readProposal(required(values, "research")), ctx);
    writeFileSync(required(values, "out"), `${JSON.stringify(proposed, null, 2)}\n`);
    return 0;
  } catch (error) {
    return rejectedWhole(log, error);
  }
}

function apply(argv: string[]): number {
  const { values } = parseArgs({
    args: argv,
    options: {
      research: { type: "string" },
      eligibility: { type: "string" },
      "catalog-dir": { type: "string" },
      "catalog-commit": { type: "string" },
      "run-date": { type: "string" },
      log: { type: "string" },
      summary: { type: "string" },
      feeds: { type: "string" },
    },
  });
  const log = required(values, "log");
  const runDate = required(values, "run-date");
  const ctx = context(runDate, required(values, "catalog-commit"), required(values, "catalog-dir"), values.feeds);
  try {
    const result = refresh(
      loadData(DATA_DIR),
      readProposal(required(values, "research")),
      readProposal(required(values, "eligibility")),
      ctx,
    );
    const lines = [
      ...result.accepted.map((d) => `ACCEPT ${d.item} | ${d.reason}${d.evidence ? ` | evidence: ${d.evidence}` : ""}`),
      ...result.rejected.map((d) => `REJECT ${d.item} | ${d.reason}`),
    ];
    appendFileSync(log, `${lines.join("\n")}\n`);
    const changed = Object.entries(serialize(result.data)).some(
      ([file, content]) => !existsSync(path.join(DATA_DIR, file)) || readFileSync(path.join(DATA_DIR, file), "utf8") !== content,
    );
    writeData(DATA_DIR, result.data);
    const summary = {
      changed,
      accepted: result.accepted.length,
      rejected: result.rejected.length,
      replaced: result.replaced,
      sources: result.sources,
      rejections: result.rejected,
    };
    writeFileSync(required(values, "summary"), `${JSON.stringify(summary, null, 2)}\n`);
    console.log(`[models] accepted ${summary.accepted}, rejected ${summary.rejected}, replaced ${summary.replaced}, changed ${changed}`);
    return 0;
  } catch (error) {
    return rejectedWhole(log, error);
  }
}

function sourcesFrom(argv: string[], summaryFile: string | undefined): SourceReport[] {
  const fromSummary: SourceReport[] = summaryFile && existsSync(summaryFile) ? JSON.parse(readFileSync(summaryFile, "utf8")).sources : [];
  const fromArgs = argv.map((pair) => {
    const [source, status] = pair.split("=");
    if (!source || (status !== "ok" && status !== "failed")) throw new Error(`--source must be name=ok or name=failed, found ${pair}`);
    return { source, status } as SourceReport;
  });
  return [...fromArgs, ...fromSummary];
}

function status(argv: string[]): number {
  const { values } = parseArgs({
    args: argv,
    options: {
      at: { type: "string" },
      outcome: { type: "string" },
      "exit-code": { type: "string" },
      "failed-stage": { type: "string" },
      "catalog-commit": { type: "string" },
      summary: { type: "string" },
      source: { type: "string", multiple: true },
      feeds: { type: "string" },
    },
  });
  const outcome = required(values, "outcome") as Exclude<RefreshOutcome, "never-run">;
  if (!["published", "no-change", "failed"].includes(outcome)) throw new Error(`unknown outcome ${outcome}`);
  const summary = values.summary && existsSync(values.summary) ? JSON.parse(readFileSync(values.summary, "utf8")) : null;
  const next = nextStatus(loadStatus(DATA_DIR), {
    at: required(values, "at"),
    outcome,
    failedStage: values["failed-stage"] ?? null,
    exitCode: Number(required(values, "exit-code")),
    catalogCommit: values["catalog-commit"] || null,
    accepted: summary?.accepted ?? 0,
    rejected: summary?.rejected ?? 0,
    sources: sourcesFrom(values.source ?? [], values.summary),
    notices: feedNotices(benchmarks, readFeeds(values.feeds, benchmarks)),
  });
  writeStatus(DATA_DIR, next);
  return 0;
}

const [command, ...rest] = process.argv.slice(2);
const commands: Record<string, (argv: string[]) => number> = { reference, "question-sets": questionSets, "check-question-sets": checkQuestionSets, models, apply, status };
const run = command ? commands[command] : undefined;
if (!run) {
  console.error(`usage: apply.ts <reference|question-sets|check-question-sets|models|apply|status> [options]; data files: ${Object.values(DATA_FILES).join(", ")}`);
  process.exit(2);
}
process.exitCode = run(rest);
