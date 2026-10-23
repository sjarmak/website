#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const prompt = process.argv[process.argv.indexOf("-p") + 1] ?? "";
const phase = prompt.includes("daily research step") ? "research" : "eligibility";
if (!process.argv.includes("--restricted") || process.argv.includes("--dangerously-skip-permissions")) {
  console.error("[stub-models-agent] Error: bypassPermissions not supported in restricted mode");
  process.exit(1);
}
console.log(`[stub-models-agent] ${phase} config ${process.env.CLAUDE_CONFIG_DIR ?? "ambient"}`);
if (process.env.STUB_FAIL_PHASE === phase) {
  console.error(`[stub-models-agent] failing the ${phase} phase on request`);
  process.exit(1);
}
const runDate = prompt.match(/Today is (\d{4}-\d{2}-\d{2})/)?.[1];
if (phase === "research") {
  const release = existsSync("feeds/livebench/release") ? readFileSync("feeds/livebench/release", "utf8").trim() : "none";
  const board = existsSync("feeds/terminal-bench.json") ? JSON.parse(readFileSync("feeds/terminal-bench.json", "utf8")).leaderboard : null;
  console.log(`[stub-models-agent] research feeds ${release} ${board ? `${board.package} ${board.name}` : "none"}`);
  if (process.env.STUB_FORGE_BOARD) writeFileSync("feeds/terminal-bench.json", process.env.STUB_FORGE_BOARD);
  const extra = JSON.parse(process.env.STUB_RESEARCH ?? "{}");
  writeFileSync("research.json", JSON.stringify({ runDate, sources: [], ...extra }));
} else {
  const catalogCommit = prompt.match(/at commit `([0-9a-f]{40})`/)?.[1];
  const verdicts = JSON.parse(process.env.STUB_VERDICTS ?? "[]");
  writeFileSync("eligibility.json", JSON.stringify({ runDate, catalogCommit, verdicts }));
}
console.log(`[stub-models-agent] wrote the ${phase} proposal`);
