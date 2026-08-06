#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const editorialRoot = path.join(root, "artifacts/arxiv/editorial-source");
const websiteRoot = path.join(root, "src/content/book-chapters/engineering-reliable-coding-agents");
const catalogPath = path.join(root, "artifacts/arxiv/companion-release/catalog.json");
const idMapPath = path.join(root, "artifacts/arxiv/practice-id-map.json");

const chapters = [
  [1, "variance-power-paired-comparisons.md", "One run is one draw."],
  [2, "baselines-ablations-cost-accuracy.md", "A component that never executes cannot explain the result."],
  [3, "contamination-oracle-workload-validity.md", "A passing score is only as valid as its workload, exposure boundary, and oracle."],
  [4, "execution-correction-gates-release-tests.md", "Execution decides whether work moves."],
  [5, "calibrating-model-graders-agreement-correctness.md", "Agreement is a calibration result, not a correctness verdict."],
  [6, "proxy-gaming-layered-signals.md", "Any optimized proxy needs an independent signal."],
  [7, "isolation-injection-independent-verification.md", "Authority, not instruction, defines blast radius."],
  [8, "persistent-state-durable-workflows-idempotent-retries.md", "Durable intent survives the worker; external effects require their own contract."],
  [9, "replayable-traces-fault-injection-recovery.md", "Recovery is a measured property."],
  [10, "human-auditable-failure-analysis-taxonomy.md", "Attribute the first upstream failure the trace can support."],
  [11, "measuring-designing-repository-retrieval.md", "Retrieval can improve while task outcomes do not."],
  [12, "localization-funnels-repository-indexes-freshness-checks.md", "Evidence without revision identity is stale, not current."],
  [13, "usable-context-budgets-spec-restarts-file-output.md", "Advertised capacity is not usable context."],
  [14, "cross-session-memory-raw-traces-compaction.md", "Preserve raw events; rebuild derived memory."],
  [15, "verification-interfaces-risk-based-escalation.md", "Verification must be cheaper than uncritical acceptance."],
  [16, "autonomy-provenance-gates-accountability.md", "A gate that cannot change execution records assent and nothing more."],
  [17, "agent-topology-dynamic-task-allocation.md", "Coordination must earn its cost against a live single-agent baseline."],
  [18, "cost-aware-fleet-scheduling-model-routing.md", "Re-decide from observed state, then ship the best feasible incumbent on time."],
];

function evidenceCounts(practices) {
  const counts = { strong: 0, directional: 0, corroborating: 0, null_or_conflicting: 0 };
  for (const practice of practices) {
    for (const item of practice.evidence) {
      if (Object.hasOwn(counts, item.evidence_group)) counts[item.evidence_group] += 1;
    }
  }
  return counts;
}

function replaceReaderMetadata(source, block) {
  const marked = `<!-- reader-metadata:start -->\n${block}\n<!-- reader-metadata:end -->`;
  if (/<!-- reader-metadata:start -->[\s\S]*?<!-- reader-metadata:end -->/.test(source)) {
    return source.replace(
      /<!-- reader-metadata:start -->[\s\S]*?<!-- reader-metadata:end -->\n*/,
      `${marked}\n\n`,
    );
  }
  if (source.startsWith("---\n")) {
    const end = source.indexOf("\n---\n", 4);
    if (end === -1) throw new Error("Unclosed frontmatter");
    const insertion = end + 5;
    return `${source.slice(0, insertion)}\n${marked}\n${source.slice(insertion).replace(/^\n+/, "")}`;
  }
  return `${marked}\n\n${source}`;
}

function replaceClosingClaim(source, claim) {
  const marked = `<!-- chapter-claim-close:start -->\n**Portable claim.** ${claim}\n<!-- chapter-claim-close:end -->`;
  if (/<!-- chapter-claim-close:start -->[\s\S]*?<!-- chapter-claim-close:end -->/.test(source)) {
    return source.replace(/<!-- chapter-claim-close:start -->[\s\S]*?<!-- chapter-claim-close:end -->/, marked);
  }
  const sources = "\n## Sources and evidence\n";
  const index = source.lastIndexOf(sources);
  if (index === -1) throw new Error("Missing Sources and evidence section");
  return `${source.slice(0, index).trimEnd()}\n\n${marked}\n${source.slice(index)}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const [catalog, idMap] = await Promise.all([
  readFile(catalogPath, "utf8").then(JSON.parse),
  readFile(idMapPath, "utf8").then(JSON.parse),
]);

for (const [chapter, filename, claim] of chapters) {
  const developed = catalog.filter((practice) => practice.chapter === chapter && practice.treatment === "developed_in_manuscript");
  const counts = evidenceCounts(developed);
  const profile = [
    `${counts.strong} strong`,
    `${counts.directional} directional`,
    `${counts.corroborating} corroborating`,
    ...(counts.null_or_conflicting ? [`${counts.null_or_conflicting} null or conflicting`] : []),
  ].join(" · ");
  const ids = developed.map((practice) => practice.practice_id).join(", ");
  const block = `> **Evidence profile.** ${profile} evidence items across ${developed.length} developed practices (${ids}).\n>\n> **Chapter claim.** ${claim}`;
  for (const directory of [editorialRoot, websiteRoot]) {
    const target = path.join(directory, filename);
    const source = await readFile(target, "utf8");
    await writeFile(target, replaceClosingClaim(replaceReaderMetadata(source, block), claim));
  }
}

const companionPath = path.join(root, "src/content/book-companions/engineering-reliable-coding-agents.md");
let companion = await readFile(companionPath, "utf8");
for (const [slug, practiceId] of Object.entries(idMap)) {
  const bare = new RegExp("^`" + escapeRegExp(slug) + "`$", "m");
  const tagged = new RegExp("^`" + escapeRegExp(practiceId) + "` · `" + escapeRegExp(slug) + "`$", "m");
  if (tagged.test(companion)) continue;
  if (!bare.test(companion)) throw new Error(`Could not find companion entry for ${slug}`);
  companion = companion.replace(bare, `\`${practiceId}\` · \`${slug}\``);
}
await writeFile(companionPath, companion);

console.log(`Updated reader metadata for ${chapters.length} chapters and ${Object.keys(idMap).length} companion entries.`);
