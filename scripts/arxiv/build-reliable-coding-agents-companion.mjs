#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

const root = process.cwd();
const researchRoot = process.env.RELIABLE_AGENTS_RESEARCH_ROOT
  ?? path.resolve(path.dirname(root), "..", "agent_reliability/reference_context");
const catalogPath = path.join(researchRoot, "catalog_v2/catalog-final.json");
const chapterMapPath = path.join(researchRoot, "catalog_v2/companion-chapter-map.json");
const taughtMapPath = path.join(researchRoot, "catalog_v2/companion-taught-map.json");
const benchmarkRoot = path.join(researchRoot, "benchmarks");
const referenceAuditPath = path.join(root, "artifacts/arxiv/reference-audit/reference-audit.json");
const websiteCompanionPath = path.join(root, "src/content/book-companions/engineering-reliable-coding-agents.md");
const outputRoot = path.join(root, "artifacts/arxiv/companion-release");
const releaseZip = path.join(root, "artifacts/arxiv/engineering-reliable-coding-agents-companion-1.0.0-rc.9.zip");
const repositoryUrl = "https://github.com/sjarmak/engineering-reliable-coding-agents";
const websiteCompanionUrl = "https://sjarmak.ai/books/engineering-reliable-coding-agents/companion";
const skillsUrl = `${repositoryUrl}/tree/main/skills`;

const version = "1.0.0-rc.9";
const sourceKinds = {
  lit: "scholarly",
  explorer: "synthesis",
  practitioner: "practitioner",
};
const evidenceGroups = {
  strong: "strong",
  directional: "directional",
  anecdotal: "corroborating",
  contested: "null_or_conflicting",
  "null-result": "null_or_conflicting",
};
const excludedEvidenceUrls = new Set([
  "https://x.com/swyx/status/2011344788486774942",
]);
const practiceTextCorrections = new Map([
  ["benchmark-on-your-own-workload", {
    rationale: "Public benchmarks diverge from production workloads in language distribution, prompt style, and codebase structure; production-derived tasks restore fidelity. One lending-domain account reports that a model near the 90th percentile on a general measure still failed basic domain tasks and that rankings changed on a domain-lifecycle evaluation. The account motivates a local construct-validity test without supplying a population rate.",
  }],
]);

// Public-release corrections for claims whose working-catalog labels are broader
// than the cited study. Keeping these transformations here makes the archived
// artifact reproducible without rewriting the private research workspace.
const evidenceCorrections = new Map([
  ["run-ablation-controls:2605.24117", {
    evidenceGroup: "directional",
    claimSupport: "SkillEvolBench directly measures no-skill and raw-trajectory controls, coverage matching, and controlled skill evaluation. These controls inform, but do not validate, the chapter's broader ablation protocol across coding-agent systems.",
  }],
  ["run-ablation-controls:2407.02883", {
    evidenceGroup: "directional",
    claimSupport: "CoIR provides a multi-task code-retrieval benchmark and its evaluation measures. It does not test the no-tool/tool-access controls or tautology checks in the broader ablation protocol.",
  }],
  ["hybrid-retrieval-fused-on-ranks:1909.09436", {
    evidenceGroup: "directional",
    claimSupport: "CodeSearchNet documents the vocabulary gap between natural-language queries and code. It motivates complementary retrieval channels but does not test rank fusion or the chapter's hybrid-retrieval protocol.",
  }],
  ["retain-raw-distill-separately:2605.12978", {
    evidenceGroup: "strong",
    claimSupport: "The controlled study measures degradation under repeated LLM memory updates and supports preserving episodic source material. It does not compare immutable-source and rebuildable-distillate system architectures.",
  }],
]);

const supplementalEvidence = new Map([
  ["run-ablation-controls", [{
    arxiv: "2607.22520",
    evidenceGroup: "strong",
    claimSupport: "Across nearly 6,000 runs on two office-automation benchmarks and three model-harness stacks, the study supports decomposing a skill intervention into gains, regressions, and residual failures. Transfer to coding-agent skill libraries remains directional.",
  }]],
  ["checklist-agentic-benchmarks-for-validity", [{
    arxiv: "2607.22368",
    evidenceGroup: "strong",
    claimSupport: "The audit measured protocol exposures and paired score inflation in 2,385 traces across 15 agent benchmarks. The reported rates apply to the audited protocols, not agent benchmarks generally.",
  }, {
    arxiv: "2607.28587",
    evidenceGroup: "strong",
    claimSupport: "The study measured PR-issue misalignment in SWE-bench Verified and detector accuracy on SWE-Gym and SWE-bench Multilingual. Other benchmark collections require their own alignment audit.",
  }]],
  ["gate-self-correction-on-external-feedback", [{
    arxiv: "2607.25152",
    evidenceGroup: "strong",
    claimSupport: "In a preregistered 54-cycle testbed, changing only the evaluator's information channel showed that externally grounded state, rather than self-verdict, determined whether the gate tracked real progress.",
  }]],
  ["topology-as-security-decision", [{
    arxiv: "2607.27294",
    evidenceGroup: "strong",
    claimSupport: "Across 6,560 benchmark runs, safety varied by harness-model pairing and risk carrier, and 66.22 percent of runs were both unsafe under a prespecified signal and complete. This is not a production incident rate.",
  }]],
  ["score-retrieval-and-generation-separately", [{
    arxiv: "2607.24882",
    evidenceGroup: "strong",
    claimSupport: "The 427-sample repository benchmark and controlled seed pilot directly measure the upstream retrieval stage. They do not establish one retrieval family as best for every repository.",
  }]],
  ["match-topology-to-task-shape", [{
    arxiv: "2608.01507",
    evidenceGroup: "strong",
    claimSupport: "On SWE-QA, semantic retrieval outperformed planner-to-subagent search at lower cost, and 41.8 percent of subagent failures occurred at the handoff. Transfer beyond read-only repository questions remains directional.",
  }]],
  ["measure-context-files-and-maintain-them-like-config", [{
    arxiv: "2607.27250",
    evidenceGroup: "null_or_conflicting",
    claimSupport: "Across two agents, 17 tasks, three repositories, and 288 runs, the study found no measurable correctness improvement and bounded effects through equivalence testing to roughly 10 to 15 percentage points in the studied conditions.",
  }]],
  ["derive-taxonomy-from-own-traces", [{
    arxiv: "2607.28802",
    evidenceGroup: "directional",
    claimSupport: "The interaction-centered taxonomy organizes 41 failure modes, and its strongest automated judge reached Cohen's kappa of 0.76 against human labels. The agreement result supports label reproducibility, not causal correctness or the chapter's local derivation protocol.",
  }]],
  ["route-work-to-the-cheapest-sufficient-model", [{
    arxiv: "2608.04804",
    evidenceGroup: "strong",
    claimSupport: "On 266 Python SWE-bench Pro tasks, the scout-and-fixer configuration matched the best single model at about one fifth of the reported cost per solve. A no-router ablation tied the routed system, locating the measured result in the handoff rather than the router.",
  }]],
  ["audit-the-allocation-layer", [{
    arxiv: "2608.00101",
    evidenceGroup: "directional",
    claimSupport: "Production traces from GitHub Copilot characterize turn-boundary cache loss and long user-idle periods at scale. They motivate measuring these workload features but do not test an allocation policy.",
  }]],
]);

const updateScreeningDecisions = [
  ["2026-07-27", "2607.22368", "Do Agent Benchmarks Measure Capability? Protocol Validity in the Age of Agentic AI", "admitted", "strong", "Chapter 3; checklist-agentic-benchmarks-for-validity", "Audited protocol exposures and paired score inflation under identified benchmark conditions."],
  ["2026-07-27", "2607.22157", "Learning on the Job: Continual Learning from Deployment Feedback for Frozen-Weights Agents", "deferred", "", "update queue", "Relevant to memory, but not required to correct or materially extend a frozen chapter claim."],
  ["2026-07-27", "2607.22479", "Legal Nugget Extraction for Granular Retrieval over Long Jurisprudential Texts", "deferred", "", "update queue", "Retrieval-granularity result is outside repository-code evidence and adds no necessary qualification."],
  ["2026-07-27", "2607.22520", "The Regression Tax: Decomposing Why Skills Help and Hurt LLM Agents", "admitted", "strong", "Chapter 2; run-ablation-controls", "Nearly 6,000 controlled runs support separating gains, regressions, and residual failures; coding transfer is directional."],
  ["2026-07-28", "2607.21997", "Go Home Copilot, You're Drunk: Understanding Developer Responses to AI Coding Assistance", "deferred", "", "update queue", "Developer-response study is relevant but does not alter a developed reliability control."],
  ["2026-07-28", "2607.22807", "The Best Programming Language for Tokenmaxxing: An Investigation of AI-Assisted Code Generation", "deferred", "", "update queue", "Language-token comparison is outside the monograph's system-reliability claims."],
  ["2026-07-28", "2607.22917", "Agent Team Work Zone: An Automated, Persistent Workspace for Long-Lived Agentic Coding", "deferred", "", "update queue", "Architecture proposal does not add a necessary controlled result to the durable-state chapters."],
  ["2026-07-28", "2607.24663", "A Corrective Agentic Hybrid RAG and an Operations-Grounded Evaluation for Production Incident Response", "deferred", "", "update queue", "Adjacent incident-response result; transfer to repository coding requires separate treatment."],
  ["2026-07-29", "2607.24882", "Agent Retrieval Bench: Evaluating Repository Context Retrieval for Coding Agents", "admitted", "strong", "Chapter 11; score-retrieval-and-generation-separately", "Direct repository retrieval benchmark plus a controlled seed-context pilot."],
  ["2026-07-29", "2607.25152", "When Do Agent Loops Mistake Stagnation for Progress?", "admitted", "strong", "Chapter 4; gate-self-correction-on-external-feedback", "Controlled evaluator-channel intervention directly tests externally grounded progress gates."],
  ["2026-07-29", "2607.25765", "WorkSurface-Bench: Benchmarking Enterprise Agents on Multi-Surface Knowledge Routing", "deferred", "", "update queue", "Enterprise knowledge routing is adjacent but does not change a developed coding-agent claim."],
  ["2026-07-30", "2607.26451", "ExplainBench: Evaluating Code Explanations from Agents", "deferred", "", "update queue", "Explanation quality is outside the selected chapter claims."],
  ["2026-07-30", "2607.27155", "OmegaUse-OfficeVal: Benchmarking LLM Agents on Long-Horizon Office-Suite Tasks with Economic Grounding", "deferred", "", "update queue", "Office-suite benchmark is useful context but adds no required coding-agent control."],
  ["2026-07-30", "2607.26191", "Position: Evaluation Scores Are Perishable Knowledge Claims", "deferred", "", "update queue", "Position paper is consistent with the benchmark-lifecycle argument but adds no new measurement."],
  ["2026-07-30", "2604.01527", "REAP: Automatic Curation of Coding Agent Benchmarks from Interactive Production Usage", "already_present", "directional", "Chapter 3; benchmark-on-your-own-workload", "The source was already included before the update audit."],
  ["2026-07-30", "2607.24888", "Trusting-Trust Attack against an Entire Linux Distribution through Binary Manipulation", "deferred", "", "update queue", "Supply-chain attack is outside the coding-agent system boundary developed here."],
  ["2026-07-31", "2607.26819", "A First Look at Coding Agents' Compliance with AI Contribution Rules in Open-Source Communities", "deferred", "", "update queue", "Governance study is relevant but does not change a developed control in this edition."],
  ["2026-07-31", "2607.28587", "PAIChecker: Uncovering and Checking PR-Issue Misalignment in SWE-Bench-Like Benchmarks", "admitted", "strong", "Chapter 3; checklist-agentic-benchmarks-for-validity", "Measures PR-issue alignment defects and detector accuracy on named benchmark collections."],
  ["2026-07-31", "2607.27409", "SWE-NFI: Studying and Benchmarking Coding Agents for Non-Functional Improvements", "deferred", "", "update queue", "New task family is relevant to future workload-validity coverage but does not correct this edition."],
  ["2026-07-31", "2607.26937", "VITAL-RAG: Invariance Race for Context Allocation in Coding Agents", "deferred", "", "update queue", "Context-allocation method requires fuller comparison with the existing context claims."],
  ["2026-08-01", "2607.27294", "AgentS4D: Benchmarking Runtime Risks across the Execution Lifecycle of LLM-Based Workspace Agents", "admitted", "strong", "Chapter 7; topology-as-security-decision", "Separates task completion from runtime safety across 20 harness-model combinations."],
  ["2026-08-01", "2607.28591", "Change2Task: From Repository Changes to Executable Coding Agent Tasks and Environments", "deferred", "", "update queue", "Task-construction method is adjacent to local benchmark curation but not needed for a frozen claim."],
  ["2026-08-01", "2607.27250", "Do Context Files Help Coding Agents? A Two-Agent Ablation Study on Real Repositories", "admitted", "null_or_conflicting", "Chapter 13; measure-context-files-and-maintain-them-like-config", "Controlled null result and equivalence bounds directly qualify the standing-context practice."],
  ["2026-08-01", "2607.27249", "OwlPath: Lossless Knowledge Compression for LLM Bug Repair", "deferred", "", "update queue", "Compression method is adjacent to context budgeting but does not alter a selected claim."],
  ["2026-08-02", "2607.28271", "Agentic Method for Deterministic Validation of Legacy Code Migration", "deferred", "", "update queue", "Migration validation is a specialized application beyond the chapter's general execution gate."],
  ["2026-08-02", "2607.28229", "EMBL AI Librarian: Life-Sciences Knowledge Layer for AI Agents", "deferred", "", "update queue", "Domain knowledge-layer report does not add repository-code evidence."],
  ["2026-08-02", "2607.26805", "MRCoder: An Efficient Context Selecting Approach for Repository-Level Code Generation", "deferred", "", "update queue", "Method comparison is relevant but not required after the retrieval chapter's bounded update."],
  ["2026-08-02", "2607.28609", "OSReward: Instituting Standardized Evaluation for Cross-Platform Computer-Use Reward Models", "deferred", "", "update queue", "Reward-model benchmark is outside coding-agent grading scope."],
  ["2026-08-04", "2608.00718", "Adversarial Attacks in Multi-Agent LLM Pipelines", "deferred", "", "update queue", "Security result is relevant to topology but requires a dedicated threat-model comparison."],
  ["2026-08-04", "2608.00101", "Agentic Coding in the Wild: Characterizing GitHub Copilot Traces at Production Scale", "admitted", "directional", "Chapter 18; audit-the-allocation-layer", "Strong workload characterization; directional support for measuring turn boundaries and idle capacity."],
  ["2026-08-04", "2608.01507", "Deep Agentic Search for Repository-Level Code Question Answering: An Empirical Study", "admitted", "strong", "Chapter 17; match-topology-to-task-shape", "Controlled SWE-QA comparison localizes silent failure at the planner-subagent handoff."],
  ["2026-08-04", "2608.01001", "From AI Technical Debt to Agentic Technical Debt: A Systematic Mapping", "deferred", "", "update queue", "Taxonomy is relevant background but does not alter the monograph's developed dependency chain."],
  ["2026-08-04", "2608.01672", "Learning What to Remember: Test-Time Training via Context Distillation", "deferred", "", "update queue", "Memory-training method lies outside the selected operational memory claims."],
  ["2026-08-05", "2608.01913", "Diagnosing Search Behavior and Failure Modes in Long-Horizon Search Agents", "deferred", "", "update queue", "Search-agent evidence is adjacent to retrieval stopping but not repository-code specific."],
  ["2026-08-05", "2608.00267", "LoopsBench: From Harness Engineering to Loop Engineering in Benchmarking Coding Agent", "deferred", "", "update queue", "Substantial benchmark that merits a later benchmark-card and chapter-level treatment rather than a late citation."],
  ["2026-08-05", "2607.28802", "Model or Harness? An Interaction-Centric Taxonomy for Localizing Agent Failures", "admitted", "directional", "Chapter 10; derive-taxonomy-from-own-traces", "Interaction-centered taxonomy is directional; Cohen's kappa supports label reproducibility only."],
  ["2026-08-05", "2608.01347", "Prompt-Induced Waste in Large Reasoning Models: A Preregistered Two-Harness Benchmark of Coding Agents", "deferred", "", "update queue", "Important cost study is reserved for a later edition because it would require a broader cost-section revision."],
  ["2026-08-05", "2608.02499", "SWE-Touch: Benchmarking Coding Agents When Users Touch the Code", "deferred", "", "update queue", "Shared-workspace benchmark is important but needs dedicated treatment of concurrent user edits."],
  ["2026-08-06", "2608.04804", "Scrouting: Cost-Aware Routing of Coding Agents by Scouting the Repository First", "admitted", "strong", "Chapter 18; route-work-to-the-cheapest-sufficient-model", "Benchmark-bound cost result admitted together with its no-router ablation, which locates the gain in the handoff."],
];

const threadDefinitions = [
  { id: 1, file: "thread-1-benchmark-validity.md", count: 17, scope: "Benchmark validity, contamination, oracle strength, task realism, and benchmark overfitting." },
  { id: 2, file: "thread-2-failure-taxonomies.md", count: 17, scope: "Agent failure taxonomies, trajectory diagnostics, attribution, fault injection, and specification gaming." },
  { id: 3, file: "thread-3-eval-statistics.md", count: 17, scope: "Pass-at-k estimation, run-to-run variance, significance testing, sample efficiency, and leaderboard noise." },
  { id: 4, file: "thread-4-oversight-accountability.md", count: 17, scope: "Human oversight, meaningful control, automation bias, trust calibration, and accountability." },
  { id: 5, file: "thread-5-context-retrieval.md", count: 17, scope: "Repository retrieval, code RAG, context management, code graphs, and long-context degradation." },
  { id: 6, file: "thread-6-durable-execution.md", count: 17, scope: "Durable workflows, event sourcing, replay, compensation, retry semantics, and checkpointing." },
  { id: 7, file: "thread-7-scheduling-and-repo-scoping.md", count: 16, scope: "Scheduling under uncertainty, repository scoping, graph localization, and allocation governance." },
];

const chapterTitles = {
  1: "Run-to-run variance, statistical power, and paired comparisons",
  2: "Baselines, ablations, and cost-accuracy tradeoffs",
  3: "Benchmark contamination, oracle strength, and workload validity",
  4: "Execution-based evaluation, correction gates, and release tests",
  5: "Calibrating model graders and separating agreement from correctness",
  6: "Proxy metric gaming and layered evaluation signals",
  7: "Agent isolation, injection defenses, and independent verification",
  8: "Persistent agent state, durable workflows, and idempotent retries",
  9: "Replayable traces and fault-injection recovery testing",
  10: "Human-auditable failure analysis and taxonomy development",
  11: "Measuring and designing repository retrieval",
  12: "Localization funnels, repository indexes, and freshness checks",
  13: "Usable context budgets, consolidated-spec restarts, and file-based tool output",
  14: "Cross-session memory, raw traces, and compaction policies",
  15: "Efficient verification interfaces and risk-based human escalation",
  16: "Autonomy calibration, provenance, effective gates, and accountability",
  17: "Agent topology selection and dynamic task allocation",
  18: "Cost-aware fleet scheduling and model routing",
};

function sanitizeProse(value) {
  if (!value) return value;
  return value
    .replace(/\s+Reference aside(?: \(thin support\))?:[\s\S]*$/i, "")
    .replace(/^Rehomed 2026-07-27 from cut pattern [^.]+\.\s*/i, "")
    .replace(/^Merged 2026-07-27 from [^.]+\.\s*/i, "")
    .replace(/^Named in the same multi-work explorer source string[\s\S]*?No figure from this work is carried into the catalog, so /i, "")
    .replace(/Audited 2026-07-27 \(explorer-strong-audit\):\s*/gi, "Evidence audit: ")
    .replace(/\bexplorer syntheses\b/gi, "source syntheses")
    .replace(/\bexplorer synthesis\b/gi, "source synthesis")
    .replace(/\bexplorer corpus\b/gi, "source corpus")
    .replace(/\bexplorer item\b/gi, "synthesis item")
    .replace(/\bexplorer\b/g, "synthesis")
    .replace(/\blit evidence items?\b/gi, "scholarly evidence items")
    .replace(/\blit sources?\b/gi, "scholarly sources")
    .replace(/\buntaught\b/gi, "companion-only")
    .replace(/\btaught\b/gi, "developed")
    .replace(/\bGATE1-SHORTLIST item \d+\b/gi, "evidence audit")
    .replace(/\bGATE1 item \d+\b/gi, "evidence audit")
    .replace(/\bsynthesis-strong-audit\b/gi, "evidence audit")
    .replace(/\bdecision-\d+ sweep\b/gi, "evidence review")
    .replace(/\bdossier\b/gi, "author-system record")
    .replace(/\bauthor-owned\b/gi, "author-system")
    .replace(/\bwebsite-patterns(?:\.md)?\b/gi, "published field notes")
    .replace(/\bthe synthesis's\b/gi, "an inference in this catalog")
    .replace(/\bthis pattern teaches\b/gi, "this practice recommends")
    .replace(/\bSame paper is (?:already )?(?:carried|admitted) as lit evidence under ([a-z0-9-]+)[^.]*\./gi, "The same paper also supports the related practice $1. ")
    .replace(/\bpreviously listed once as lit and once as practitioner\./gi, "Duplicate source records were consolidated.")
    .replace(/\b(?:the )?(?:sweep|flag|reinstatement) defect[^.]*\./gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function renderReviewableLearnings(source) {
  const body = source
    .replace(/^---\n[\s\S]*?\n---\n+/, "")
    .replace(
      /<span class="katex">[\s\S]*?<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>[\s\S]*?<\/span>/g,
      (_match, tex) => `$${tex.trim()}$`,
    )
    .trim();
  return `# Companion learnings\n\nThis human-readable edition presents all 192 practices in chapter context. For navigation, filtering, and graph exploration, use the [website companion](${websiteCompanionUrl}).\n\n${body}\n`;
}

function cleanCitation(value, metadata, arxiv) {
  if (metadata && arxiv) {
    const authorText = metadata.authors.length > 5
      ? `${metadata.authors.slice(0, 5).join(", ")}, et al.`
      : metadata.authors.join(", ");
    const year = metadata.published?.slice(0, 4) ?? "n.d.";
    return `${authorText} (${year}). ${metadata.title}. arXiv:${arxiv}.`;
  }
  let citation = value.includes("—") ? value.split("—").at(-1).trim() : value;
  citation = sanitizeProse(citation)
    .replace(/\s+-\s+.*$/i, "")
    .replace(/^([A-Za-z0-9_-]+)\.md\s+—\s+/, "Author-system illustration: ")
    .replace(/,?\s*published field notes P\d+[\s\S]*$/i, "")
    .trim();
  return citation || (arxiv ? `arXiv:${arxiv}.` : "Unpublished author-system illustration.");
}

function csvCell(value) {
  const text = value == null ? "" : typeof value === "string" ? value : JSON.stringify(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows, columns) {
  return [columns.join(","), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(","))].join("\n") + "\n";
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function parseThreadSourceIndex(thread, source) {
  const matches = [...source.matchAll(/^### \[(\d+)\] (.+)$/gm)];
  return matches.map((match, index) => {
    const block = source.slice(match.index, matches[index + 1]?.index ?? source.length);
    const arxiv = block.match(/arXiv:?\s*`?(\d{4}\.\d{4,5})/i)?.[1] ?? null;
    const bibcode = block.match(/Bibcode:\s*`?([^`;|·\s]+)/i)?.[1] ?? null;
    return {
      thread_id: thread.id,
      source_order: Number(match[1]),
      heading: match[2].trim(),
      arxiv,
      bibcode,
    };
  });
}

async function main() {
  const [catalogSource, chapterMapSource, taughtMapSource, benchmarkSource, referenceAudit, websiteCompanionSource] = await Promise.all([
    readFile(catalogPath, "utf8"),
    readFile(chapterMapPath, "utf8"),
    readFile(taughtMapPath, "utf8"),
    readFile(path.join(benchmarkRoot, "benchmarks.json"), "utf8"),
    readFile(referenceAuditPath, "utf8").then(JSON.parse),
    readFile(websiteCompanionPath, "utf8"),
  ]);
  const catalog = JSON.parse(catalogSource);
  const companionMap = JSON.parse(chapterMapSource);
  const taughtMap = JSON.parse(taughtMapSource);
  const threadSources = new Map(await Promise.all(threadDefinitions.map(async (thread) => [
    thread.file,
    await readFile(path.join(researchRoot, "lit_review", thread.file), "utf8"),
  ])));
  const threadSourceRows = threadDefinitions.flatMap((thread) => {
    const rows = parseThreadSourceIndex(thread, threadSources.get(thread.file));
    if (rows.length !== thread.count) {
      throw new Error(`Expected ${thread.count} sources in ${thread.file}, found ${rows.length}`);
    }
    return rows;
  });

  const arxivMetadata = new Map(referenceAudit.arxiv.map((item) => [item.id, item.metadata]));
  const assignment = new Map();
  for (const [chapter, ids] of Object.entries(taughtMap)) {
    for (const id of ids) assignment.set(id, { chapter: Number(chapter), treatment: "developed_in_manuscript", thin_support: false });
  }
  for (const [chapter, entries] of Object.entries(companionMap)) {
    for (const entry of entries) assignment.set(entry.id, { chapter: Number(chapter), treatment: "companion_only", thin_support: entry.aside });
  }

  const evidenceRows = [];
  const publicCatalog = catalog.map((practice) => {
    const location = assignment.get(practice.id);
    if (!location) throw new Error(`No chapter assignment for ${practice.id}`);
    const evidence = (practice.evidence ?? [])
      .filter((item) => !excludedEvidenceUrls.has(item.url))
      .map((item, index) => {
      const correction = evidenceCorrections.get(`${practice.id}:${item.arxiv ?? ""}`);
      const record = {
        evidence_id: `${practice.id}:e${index + 1}`,
        source_kind: sourceKinds[item.class] ?? "other",
        evidence_group: correction?.evidenceGroup ?? evidenceGroups[item.strength] ?? "unclassified",
        citation: cleanCitation(item.source, item.arxiv ? arxivMetadata.get(item.arxiv) : null, item.arxiv),
        bibcode: item.bibcode ?? null,
        arxiv: item.arxiv ?? null,
        url: item.url ?? (item.arxiv ? `https://arxiv.org/abs/${item.arxiv}` : null),
        claim_support: correction?.claimSupport ?? sanitizeProse(item.note),
        resolved_metadata: item.arxiv ? arxivMetadata.get(item.arxiv) ?? null : null,
      };
      evidenceRows.push({
        practice_id: practice.id,
        ...record,
        independent_external_evidence: true,
      });
        return record;
      });
    for (const [index, item] of (supplementalEvidence.get(practice.id) ?? []).entries()) {
      const metadata = arxivMetadata.get(item.arxiv);
      if (!metadata) throw new Error(`Missing audited metadata for supplemental arXiv:${item.arxiv}`);
      const record = {
        evidence_id: `${practice.id}:supplement-${index + 1}`,
        source_kind: "scholarly",
        evidence_group: item.evidenceGroup,
        citation: cleanCitation(`arXiv:${item.arxiv}`, metadata, item.arxiv),
        bibcode: null,
        arxiv: item.arxiv,
        url: `https://arxiv.org/abs/${item.arxiv}`,
        claim_support: item.claimSupport,
        resolved_metadata: metadata,
      };
      evidence.push(record);
      evidenceRows.push({
        practice_id: practice.id,
        ...record,
        independent_external_evidence: true,
        limitation: "Post-consolidation source admitted during the bounded August 6 update audit; claim scope is recorded in claim_support.",
      });
    }
    const corroboratingMaterial = (practice.corroboration ?? []).map((item, index) => {
      const authorOwned = item.author_owned === true || ["dossier", "author-owned", "explorer-author-owned"].includes(item.class);
      const record = {
        evidence_id: `${practice.id}:c${index + 1}`,
        source_kind: authorOwned ? "author_system_illustration" : "corroborating_material",
        evidence_group: item.class === "demoted-evidence" ? "null_or_conflicting" : "corroborating",
        citation: cleanCitation(item.source, item.arxiv ? arxivMetadata.get(item.arxiv) : null, item.arxiv),
        bibcode: item.bibcode ?? null,
        arxiv: item.arxiv ?? null,
        url: item.url ?? null,
        claim_support: sanitizeProse(item.note),
        independent_external_evidence: false,
        limitation: item.class === "demoted-evidence"
          ? "Retained as a limitation or counterexample; not counted as independent supporting evidence."
          : authorOwned
            ? "Illustrative author-system case; not counted as independent external evidence."
            : "Corroborating material; not counted as independent evidence.",
      };
      evidenceRows.push({ practice_id: practice.id, ...record });
      return record;
    });
    return {
      id: practice.id,
      name: practice.name,
      practice: sanitizeProse(practice.do),
      rationale: practiceTextCorrections.get(practice.id)?.rationale ?? sanitizeProse(practice.why),
      boundary_conditions: sanitizeProse(practice.boundary),
      transfers_to: sanitizeProse(practice.transfers_to),
      chapter: location.chapter,
      chapter_title: chapterTitles[location.chapter],
      treatment: location.treatment,
      thin_support: location.thin_support,
      evidence,
      corroborating_material: corroboratingMaterial,
    };
  });

  if (publicCatalog.length !== 192) throw new Error(`Expected 192 practices, found ${publicCatalog.length}`);
  const taughtCount = publicCatalog.filter((entry) => entry.treatment === "developed_in_manuscript").length;
  if (taughtCount !== 55) throw new Error(`Expected 55 developed practices, found ${taughtCount}`);

  const crosswalk = Object.entries(chapterTitles).map(([number, title]) => ({
    chapter: Number(number),
    title,
    developed_practices: taughtMap[number],
    companion_practices: companionMap[number],
  }));

  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(path.join(outputRoot, "schemas"), { recursive: true });
  await mkdir(path.join(outputRoot, "methodology"), { recursive: true });

  const files = new Map();
  files.set("methodology/source-snapshot.json", `${JSON.stringify({
    schema_version: "1.0",
    companion_version: version,
    consolidated_at: "2026-07-26",
    update_cutoff: "2026-08-06",
    manuscript_source_counts: {
      scholarly: 129,
      scholarly_at_consolidation: 118,
      scholarly_admitted_in_update: 11,
      practitioner: 91,
      benchmarks: 29,
      author_system_cases: 17,
    },
    scholarly_retrieval: {
      official_service: "SciX, operated by the Smithsonian Astrophysical Observatory under a NASA cooperative agreement",
      official_about: "https://scixplorer.org/scixabout/",
      official_api: "https://scixplorer.org/scixhelp/api-scix/",
      local_layer: "SciX Agent",
      records: 32400000,
      citation_edges: 299300000,
      full_text_records: 14900000,
      retrieval: "INDUS dense retrieval and BM25 lexical retrieval fused by reciprocal rank",
      retained_revision_nearest_consolidation: "dd618037f61035bd62f1e7a620029c6b4867ab6a",
      release_audit_revision: "14c8dea19a80494e9a64dc76afb8c0cb64483701",
      revision_note: "The nearest pre-cutoff repository revision is reconstructed from version history; it is not represented as an exact execution-environment lockfile.",
    },
    practitioner_retrieval: {
      corpus: "Code Intelligence Digest",
      public_description: "https://www.sjarmak.ai/projects/code-intelligence-digest",
      snapshot_at: "2026-07-27T00:00:00Z",
      normalized_records: 162350,
      retained_full_text_records: 43953,
      normalized_source_labels: 149,
      categories: {
        research: 62870,
        community: 39133,
        newsletters: 29360,
        tech_articles: 17850,
        product_news: 9446,
        ai_dev: 1602,
        marketing: 1413,
        ai_news: 365,
        podcasts: 311,
      },
      retained_revision_nearest_consolidation: "efa3dba247c8c8c3f47c572078747df63b1fae3c",
      release_audit_revision: "0d4b707c8465d2b5d08137563a87718648d927bd",
      revision_note: "Counts are the retained cutoff snapshot. The revision fields identify inspected repository states and do not imply that current corpus contents equal the cutoff snapshot.",
    },
    thread_syntheses: threadDefinitions.map((thread) => ({
      thread_id: thread.id,
      file: thread.file,
      source_count: thread.count,
      sha256: sha256(threadSources.get(thread.file)),
    })),
    provenance_boundary: "Retrieval systems ordered candidates. The author made final inclusion, evidence-group, practice, chapter, and prose decisions.",
  }, null, 2)}\n`);
  files.set("methodology/search-log.csv", toCsv([
    ...threadDefinitions.map((thread) => ({
      record_type: "protocol_reconstruction",
      date: "2026-07-26",
      source: "SciX Agent",
      scope_or_query: thread.scope,
      exact_query_preserved: false,
      candidates_screened: "",
      admitted: thread.count,
      already_present: "",
      deferred_or_excluded: "",
      notes: thread.id === 7
        ? "Back-filled from the citation audit; no original search query is claimed."
        : "Scope reconstructed from the retained thread synthesis; individual machine-issued queries were not preserved as a publication-ready log.",
    })),
    {
      record_type: "retained_update_audit",
      date: "2026-08-06",
      source: "Code Intelligence Digest published editions",
      scope_or_query: "Distinct scholarly records in daily and daily-general editions dated 2026-07-27 through 2026-08-05",
      exact_query_preserved: true,
      candidates_screened: 38,
      admitted: 10,
      already_present: 1,
      deferred_or_excluded: 27,
      notes: "Deterministic publication-window extraction; record-level decisions appear in screening-decisions.csv.",
    },
    {
      record_type: "targeted_release_check",
      date: "2026-08-06",
      source: "arXiv",
      scope_or_query: "arXiv:2608.04804",
      exact_query_preserved: true,
      candidates_screened: 1,
      admitted: 1,
      already_present: 0,
      deferred_or_excluded: 0,
      notes: "Admitted with its no-router ablation because the ablation changes the interpretation of the routing claim.",
    },
  ], [
    "record_type", "date", "source", "scope_or_query", "exact_query_preserved", "candidates_screened", "admitted", "already_present", "deferred_or_excluded", "notes",
  ]));
  files.set("methodology/screening-decisions.csv", toCsv(updateScreeningDecisions.map(([
    surfaced_at, arxiv, title, decision, evidence_group, placement, bounded_claim_or_reason,
  ]) => ({
    surfaced_at, arxiv, title, url: `https://arxiv.org/abs/${arxiv}`, decision, evidence_group, placement, bounded_claim_or_reason,
  })), [
    "surfaced_at", "arxiv", "title", "url", "decision", "evidence_group", "placement", "bounded_claim_or_reason",
  ]));
  files.set("methodology/thread-source-index.csv", toCsv(threadSourceRows, [
    "thread_id", "source_order", "heading", "arxiv", "bibcode",
  ]));
  files.set("methodology/thread-protocols.md", `# Scholarly thread protocols

The seven retained literature-review threads were consolidated on July 26, 2026. This file records their public protocol and the hashes of the working syntheses. It does not recreate unretained interactive query text.

## Common screening protocol

For each thread, candidates were retrieved through keyword and semantic searches, resolved to bibliographic identities, screened for an in-scope measured result or mechanism, and checked in full text when the claim exceeded the abstract. Seminal work and current agent-era results were both eligible. Retrieval rank determined reading order only.

${threadDefinitions.map((thread) => `## Thread ${thread.id}

**Scope:** ${thread.scope}

**Retained sources:** ${thread.count}.
**Working-synthesis SHA-256:** \`${sha256(threadSources.get(thread.file))}\`.
`).join("\n")}
Thread 7 differs from the first six. It was assembled during the citation audit from scheduling and repository-scoping sources already used by the draft, then identity-checked through SciX. It is a provenance repair, not a reconstructed original search.

The sanitized source identities are in \`thread-source-index.csv\`. Full working syntheses are omitted because they contain internal drafting notes and chapter-routing instructions; their hashes identify the retained inputs without presenting those notes as part of the scholarly artifact.
`);
  files.set("methodology/assembly-and-adjudication.md", `# Assembly and adjudication

## Retrieval systems

SciX is the NASA-supported scholarly discovery service used for bibliographic identity and metadata. SciX Agent is the author's local retrieval layer over a SciX and arXiv corpus. Code Intelligence Digest is the author's ingestion and search corpus for research feeds and practitioner material. These systems retrieved and ordered candidates. They were not evidence classes and did not assign final evidence groups.

## Decision sequence

The review followed this sequence:

1. define the question and boundary of each thread;
2. retrieve candidate records;
3. resolve record identity and deduplicate it;
4. screen for an in-scope claim;
5. extract the bounded claim and its conditions;
6. assign an evidence group to that claim;
7. challenge the assignment and record contrary or null findings;
8. derive candidate engineering practices;
9. select practices for chapter or companion treatment; and
10. audit identifiers, citations, and source-section labels.

Automated systems assisted with retrieval, normalization, duplicate detection, bounded claim extraction, metadata checks, and challenge passes. The cited source remained authoritative. The author made the final inclusion, evidence-group, practice-admission, chapter-placement, and prose decisions. Ambiguous evidence defaulted to the lower group unless the narrower directly measured claim could be stated.

## Independence and deduplication

Research records found through Code Intelligence Digest entered the scholarly lane and were deduplicated by bibliographic identity. Practitioner accounts were deduplicated by incident or originating claim. Several pages repeating one incident did not count as several independent observations.

## Update policy

The consolidation cutoff was July 26, 2026. A bounded audit through August 6 screened 39 candidate records: 38 surfaced in published Digest editions and one in a targeted release check. Eleven new works were admitted, one was already present, and 27 were deferred. Newness alone did not justify admission. The source had to correct, materially qualify, or directly strengthen a claim already in scope. Later records enter the next-edition queue unless they correct a factual error.

## Reproducibility boundary

The retained thread syntheses, source identities, corpus counts, update window, and update decisions are recorded here. Every machine-issued query from the original interactive searches was not preserved. The release therefore labels reconstructed protocol records as reconstructions and does not claim byte-for-byte replay of the original searches.
`);
  files.set("WEB-SOURCE-PRESERVATION.md", `# Web-source preservation

The manuscript retains canonical URLs in its citations and records the following independently captured snapshots for practitioner sources whose host content may change. Snapshot availability preserves the cited page; it does not promote the source's evidence grade.

| Source | Canonical URL | Archived snapshot |
| --- | --- | --- |
| Trautmann and Sutter, “Agents that remember” | https://blog.cloudflare.com/introducing-agent-memory/ | https://web.archive.org/web/20260806014045/https://blog.cloudflare.com/introducing-agent-memory/ |
| Bytesfortruth, lending-domain benchmark account | https://www.reddit.com/r/compsci/comments/1rqcmu8/ | https://web.archive.org/web/20260806020302/https://www.reddit.com/r/compsci/comments/1rqcmu8/benchmark_contamination_and_the_case_for/ |
| saurabhjain1592, production-workflow failure account | https://www.reddit.com/r/LLMDevs/comments/1q7avil/ | https://web.archive.org/web/20260806014103/https://www.reddit.com/r/LLMDevs/comments/1q7avil/what_actually_broke_when_we_put_ai_agents_into/ |
| Upstairs_Safe2922, Railway database incident account | https://www.reddit.com/r/devops/comments/1tbbls4/ | https://web.archive.org/web/20260806014121/https://www.reddit.com/r/devops/comments/1tbbls4/ai_agent_wiped_railway_db_in_9_seconds_how_do_you/ |

Two unstable records identified during review were removed rather than preserved as support: an unlinked audit attributed to swyx and an unlinked statement attributed to Patwardhan. A separate X post about benchmark transfer was also removed after the host and archive service could not provide a stable snapshot. None is counted in the released evidence ledger.
`);
  files.set("LEARNINGS.md", renderReviewableLearnings(websiteCompanionSource));
  files.set("catalog.json", `${JSON.stringify(publicCatalog, null, 2)}\n`);
  files.set("chapter-crosswalk.json", `${JSON.stringify(crosswalk, null, 2)}\n`);
  files.set("reference-metadata.json", `${JSON.stringify({
    generated_at: referenceAudit.generated_at,
    arxiv: referenceAudit.arxiv.map(({ id, status, metadata }) => ({ id, status, metadata })),
    dois: referenceAudit.dois.map(({ doi, url, status, title, authors, published }) => ({ doi, url, status, title, authors, published })),
    web_sources: referenceAudit.urls.map(({ url, status, http_status, final_url, title }) => ({ url, status, http_status, final_url, title })),
  }, null, 2)}\n`);
  files.set("evidence-ledger.csv", toCsv(evidenceRows, [
    "practice_id", "evidence_id", "source_kind", "evidence_group", "citation", "bibcode", "arxiv", "url", "claim_support", "independent_external_evidence", "limitation",
  ]));
  files.set("CITATION.cff", `cff-version: 1.2.0\nmessage: "Please cite the archived release of this companion and the associated manuscript."\ntitle: "Engineering Reliable Coding Agents: Companion Research Artifact"\ntype: dataset\nauthors:\n  - family-names: Jarmak\n    given-names: Stephanie\nversion: "${version}"\nrepository-code: "${repositoryUrl}"\nurl: "${websiteCompanionUrl}"\nabstract: >-\n  Human-readable and machine-readable practice catalog, evidence ledger,\n  chapter crosswalk, and benchmark records accompanying Engineering Reliable\n  Coding Agents.\nkeywords:\n  - AI coding agents\n  - software engineering\n  - evaluation\n  - reliability\n  - agent operations\n`);
  files.set("README.md", `# Engineering Reliable Coding Agents: companion research artifact\n\nRelease candidate ${version}, prepared August 6, 2026.\n\nThis package accompanies *Engineering Reliable Coding Agents: Evaluation, Recovery, Context, and Control Beyond the Model*. It is designed to be archived as a separate, citable research artifact. The final archival release should receive its own DOI and should be cited alongside the manuscript.\n\nReview the interactive [website companion](${websiteCompanionUrl}), or read the complete chapter-organized catalog in [\`LEARNINGS.md\`](LEARNINGS.md).\n\nReusable agent workflows derived from selected practices are published separately in the repository's [\`skills/\` collection](${skillsUrl}). They are implementation artifacts, not additional evidence.\n\nCanonical repository: [${repositoryUrl}](${repositoryUrl})\n\n## Contents\n\n- \`LEARNINGS.md\`: human-readable, chapter-organized presentation of all 192 practices, including actions, mechanisms, evidence, and boundaries.\n- \`catalog.json\`: all 192 bounded practices in machine-readable form, including the bounded August 6 evidence additions.\n- \`evidence-ledger.csv\`: one row per evidence item or corroborating item.\n- \`chapter-crosswalk.json\`: the 55 practices developed in the manuscript and the 137 companion-only entries.\n- \`benchmark-catalog.json\`: 29 coding-agent benchmark records.\n- \`reference-metadata.json\`: resolved arXiv, DOI, and web-source metadata from the manuscript audit.\n- \`methodology/\`: corpus snapshots, thread protocols and source identities, search records, record-level update decisions, and the human/automated adjudication boundary.\n- \`schemas/\`: JSON Schemas for the catalog and benchmark records.\n- \`PROVENANCE.md\`: source snapshot, transformations, evidence definitions, and release exclusions.\n- \`CITATION.cff\`: citation metadata for GitHub and archival services.\n- \`SHA256SUMS\`: checksums for the release files.\n\n## Evidence vocabulary\n\n\`strong\` directly supports the stated claim through a controlled comparison, validated benchmark result, or comparably specific measurement. \`directional\` supports the mechanism or direction without establishing magnitude or broad transfer. \`corroborating\` establishes plausibility through a case or convergent observation. \`null_or_conflicting\` records a result that did not support the expected effect or limits another claim.\n\nAuthor-system cases are labeled \`author_system_illustration\` and set \`independent_external_evidence\` to \`false\`. They illustrate mechanisms and failure cases but do not support general claims independently.\n\n## Before public release\n\nReplace this release-candidate version with \`1.0.0\`, add the selected license, publish a tagged release in the canonical repository, archive that exact tag with Zenodo or another DOI-granting repository, and add the resulting DOI to this file and \`CITATION.cff\`. Do not archive internal review notes, rejected candidates, private receipts, or unpublished operational data.\n`);
  files.set("PROVENANCE.md", `# Provenance\n\nCanonical repository: [${repositoryUrl}](${repositoryUrl})\n\nInteractive companion: [${websiteCompanionUrl}](${websiteCompanionUrl})\n\nDerived agent skills: [${skillsUrl}](${skillsUrl})\n\n## Source snapshot\n\n- Public manuscript chapter snapshot: packaged with companion version \`${version}\` in the canonical repository.\n- Human-readable companion input SHA-256: \`${sha256(websiteCompanionSource)}\`.\n- Practice catalog input SHA-256: \`${sha256(catalogSource)}\`.\n- Companion chapter-map input SHA-256: \`${sha256(chapterMapSource)}\`.\n- Developed-practice map input SHA-256: \`${sha256(taughtMapSource)}\`.\n- Benchmark catalog input SHA-256: \`${sha256(benchmarkSource)}\`.\n\nCorpus counts, retrieval revisions, and retained thread hashes appear in \`methodology/source-snapshot.json\`. The hashes identify exact retained inputs without exposing workstation paths or unpublished repository contents.\n\n## Transformations\n\n\`LEARNINGS.md\` is generated from the website companion source by removing site frontmatter and replacing rendered MathML spans with ordinary inline LaTeX. Internal evidence shorthand and editorial workflow notes were replaced by reader-facing \`source_kind\` and \`evidence_group\` fields in the machine-readable catalog. Internal derivation pointers were omitted. Four public-release evidence records were narrowed to the claim tested by the cited study: the SkillEvolBench and CoIR records under \`run-ablation-controls\`, the CodeSearchNet record under \`hybrid-retrieval-fused-on-ranks\`, and the memory-degradation record under \`retain-raw-distill-separately\`. Eleven post-consolidation scholarly records were added with claim-specific evidence groups; their record-level rulings appear in \`methodology/screening-decisions.csv\`. The known DynTaskMAS author-name defect in the source catalog was corrected from “Yin” to Yu, Ding, and Sato using the official arXiv record. Official arXiv metadata captured during the manuscript reference audit supplies citations and appears under \`resolved_metadata\`.\n\nThe separately packaged skills retain their own practice maps and evidence boundaries. They are derived operational artifacts and are not counted as independent evidence.\n\nCorroborating author-system records remain available for reproducibility but are explicitly excluded from independent external evidence. Records previously removed from supporting evidence are retained as null or conflicting material with their limitation.\n\n## Excluded material\n\nThe package excludes private working notes, detailed selection deliberations beyond the published update rulings, rejected catalog entries, private comments, unpublished raw operational data, local configuration, and internal receipts. The release is a public research artifact, not a mirror of the working directory.\n`);
  files.set("schemas/catalog.schema.json", `${JSON.stringify({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Engineering Reliable Coding Agents practice catalog",
    type: "array",
    minItems: 192,
    maxItems: 192,
    items: {
      type: "object",
      required: ["id", "name", "practice", "rationale", "boundary_conditions", "chapter", "treatment", "evidence"],
      properties: {
        id: { type: "string", pattern: "^[a-z0-9][a-z0-9-]*$" },
        name: { type: "string" },
        practice: { type: "string" },
        rationale: { type: "string" },
        boundary_conditions: { type: "string" },
        transfers_to: { type: "string" },
        chapter: { type: "integer", minimum: 1, maximum: 18 },
        chapter_title: { type: "string" },
        treatment: { enum: ["developed_in_manuscript", "companion_only"] },
        thin_support: { type: "boolean" },
        evidence: { type: "array" },
        corroborating_material: { type: "array" },
      },
    },
  }, null, 2)}\n`);

  files.set("README.md", files.get("README.md").replace(
    "- `reference-metadata.json`: resolved arXiv, DOI, and web-source metadata from the manuscript audit.\n",
    "- `reference-metadata.json`: resolved arXiv, DOI, and web-source metadata from the manuscript audit.\n- `WEB-SOURCE-PRESERVATION.md`: canonical and archived URLs for retained practitioner sources on mutable hosts.\n",
  ));
  files.set("PROVENANCE.md", files.get("PROVENANCE.md").replace(
    "Records previously removed from supporting evidence are retained as null or conflicting material with their limitation.",
    "Records previously removed from supporting evidence are retained as null or conflicting material with their limitation. Mutable practitioner pages retained by the manuscript have canonical and archived locations in `WEB-SOURCE-PRESERVATION.md`; unstable unsupported records removed during review are named there for auditability.",
  ));

  for (const [name, content] of files) await writeFile(path.join(outputRoot, name), content);
  await cp(path.join(benchmarkRoot, "benchmarks.json"), path.join(outputRoot, "benchmark-catalog.json"), { force: true });
  await cp(path.join(benchmarkRoot, "schema.json"), path.join(outputRoot, "schemas/benchmark-catalog.schema.json"), { force: true });

  const checksumNames = [...files.keys(), "benchmark-catalog.json", "schemas/benchmark-catalog.schema.json"]
    .filter((name) => name !== "SHA256SUMS")
    .sort();
  const checksums = [];
  for (const name of checksumNames) {
    const content = await readFile(path.join(outputRoot, name));
    checksums.push(`${sha256(content)}  ${name}`);
  }
  await writeFile(path.join(outputRoot, "SHA256SUMS"), `${checksums.join("\n")}\n`);
  await rm(releaseZip, { force: true });
  await run("zip", ["-X", "-q", "-r", releaseZip, path.basename(outputRoot)], { cwd: path.dirname(outputRoot) });
}

await main();
