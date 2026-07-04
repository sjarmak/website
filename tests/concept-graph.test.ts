/**
 * Fixture-driven tests for the concept graph: derived-membership join,
 * co-occurrence weighting, top-k capping, gaps, rename stability, and
 * vaultNote support. No fixture here touches the vault or writes anything.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import type { ConceptEntry } from "../src/lib/knowledge/conceptAliases.ts";
import {
  deriveConceptMembership,
  type DigestDoc,
  type Explorer,
} from "../src/lib/knowledge/conceptMembership.ts";
import {
  buildConceptGraph,
  capConceptEdges,
  computeCooccurrenceEdges,
  computeGaps,
  type TopicMeta,
  type WeightedConceptEdge,
} from "../src/lib/graph/buildConceptGraph.ts";

function concept(slug: string, label: string, aliases: string[] = [], topic?: string): ConceptEntry {
  return { slug, label, aliases, definition: `def of ${label}`, topic, related: [] };
}

const CONCEPTS: ConceptEntry[] = [
  concept("agent-memory", "Agent memory", ["memory"], "agent-memory"),
  concept("agentic-coding", "Agentic coding"),
  concept("ai-safety", "AI safety"),
  concept("evaluation", "Evaluation", ["evals"]),
  concept("retrieval-augmented-generation", "Retrieval-augmented generation", ["rag"]),
];

const TOPICS = new Map<string, TopicMeta>([
  ["agent-memory", { title: "Agent memory (topic)", summary: "topic summary", weight: 2 }],
]);

const NO_DATA = { digests: [], explorers: [], assignments: {} };

// ---------------------------------------------------------------- join logic

test("digest facets resolve through aliases into evidence + one group per issue", () => {
  const digests: DigestDoc[] = [
    { slug: "daily-1", title: "Issue one", date: "2026-06-01", facets: ["evals", "memory", "not-a-concept"] },
    { slug: "daily-2", title: "Issue two", date: "2026-06-02", facets: ["evaluation"] },
  ];
  const { evidence, groups } = deriveConceptMembership({ concepts: CONCEPTS, digests, explorers: [], assignments: {} });

  assert.deepEqual(
    evidence.get("evaluation")!.digests.map((d) => d.slug),
    ["daily-2", "daily-1"], // date desc
  );
  assert.deepEqual(
    evidence.get("agent-memory")!.digests.map((d) => d.slug),
    ["daily-1"],
  );
  // single-concept digests contribute evidence but no co-occurrence group
  assert.deepEqual(groups, [{ kind: "digest", id: "daily-1", concepts: ["agent-memory", "evaluation"] }]);
});

test("explorer sections resolve by key first, then label; papers form groups", () => {
  const explorers: Explorer[] = [
    {
      id: "ex-1",
      title: "Explorer one",
      homepage: "/library/explorers/ex-1",
      sections: [
        { key: "eval-harness-suite", label: "Evaluation" }, // resolves via label
        { key: "rag", label: "Not A Concept Label" }, // resolves via key (alias)
        { key: "unresolvable", label: "Also Unresolvable" },
      ],
      papers: [
        {
          bibcode: "2026arXiv0001",
          title: "Paper A",
          branches: ["eval-harness-suite", "rag", "unresolvable"],
          notes: [],
        },
        { bibcode: "2026arXiv0002", title: "Paper B", branches: ["rag"], notes: [] },
      ],
    },
  ];
  const { evidence, groups } = deriveConceptMembership({ concepts: CONCEPTS, digests: [], explorers, assignments: {} });

  const evalSections = evidence.get("evaluation")!.sections;
  assert.equal(evalSections.length, 1);
  assert.deepEqual(evalSections[0], {
    explorerId: "ex-1",
    explorerTitle: "Explorer one",
    sectionKey: "eval-harness-suite",
    sectionLabel: "Evaluation",
    url: "/library/explorers/ex-1",
  });
  assert.equal(evidence.get("retrieval-augmented-generation")!.sections.length, 1);
  // only the multi-concept paper forms a group
  assert.deepEqual(groups, [
    { kind: "paper", id: "2026arXiv0001", concepts: ["evaluation", "retrieval-augmented-generation"] },
  ]);
});

test("assignments contribute immutable-id evidence: takeaway merge, paper enrichment, vault, thread", () => {
  const digests: DigestDoc[] = [
    { slug: "daily-1", title: "Issue one", date: "2026-06-01", facets: ["evals"] },
  ];
  const explorers: Explorer[] = [
    {
      id: "ex-1",
      title: "Explorer one",
      sections: [{ key: "rag", label: "RAG section" }],
      papers: [
        { bibcode: "2026arXiv0009", title: "Paper Nine", year: 2026, arxiv: "2606.00009", branches: ["rag"], notes: [] },
      ],
    },
  ];
  const assignments = {
    "digest:daily-1": { concept: "evaluation", takeaway: "merged takeaway" },
    "digest:unknown-issue": { concept: "evaluation" },
    "paper:2026arXiv0009": { concept: "agent-memory", takeaway: "paper takeaway" },
    "vault:note-abc": { concept: "ai-safety", takeaway: "vault takeaway" },
    "thread:thr-1": { concept: "ai-safety" },
  };
  const { evidence } = deriveConceptMembership({ concepts: CONCEPTS, digests, explorers, assignments });

  const evalDigests = evidence.get("evaluation")!.digests;
  assert.equal(evalDigests.length, 2);
  const merged = evalDigests.find((d) => d.slug === "daily-1")!;
  assert.equal(merged.takeaway, "merged takeaway");
  assert.equal(merged.title, "Issue one"); // derived entry kept, takeaway merged in
  assert.ok(evalDigests.some((d) => d.slug === "unknown-issue")); // assignment-only digest still listed

  const papers = evidence.get("agent-memory")!.papers;
  assert.deepEqual(papers, [
    {
      bibcode: "2026arXiv0009",
      title: "Paper Nine",
      year: 2026,
      url: "https://arxiv.org/abs/2606.00009",
      takeaway: "paper takeaway",
    },
  ]);

  assert.deepEqual(evidence.get("ai-safety")!.vaultNotes, [{ id: "note-abc", takeaway: "vault takeaway" }]);
  assert.deepEqual(evidence.get("ai-safety")!.threads, [{ id: "thr-1", takeaway: undefined }]);
});

test("assignment referencing an unknown concept throws", () => {
  assert.throws(
    () =>
      deriveConceptMembership({
        concepts: CONCEPTS,
        digests: [],
        explorers: [],
        assignments: { "digest:daily-1": { concept: "no-such-concept" } },
      }),
    /unknown concept "no-such-concept"/,
  );
});

// ------------------------------------------------------------- co-occurrence

test("co-occurrence weights accumulate across digests and papers with provenance", () => {
  const edges = computeCooccurrenceEdges([
    { kind: "digest", id: "daily-1", concepts: ["agent-memory", "evaluation"] },
    { kind: "digest", id: "daily-2", concepts: ["agent-memory", "evaluation", "ai-safety"] },
    { kind: "paper", id: "bib-1", concepts: ["agent-memory", "evaluation"] },
  ]);
  const top = edges[0];
  assert.deepEqual(top, {
    source: "agent-memory",
    target: "evaluation",
    weight: 3,
    sharedDigests: ["daily-1", "daily-2"],
    sharedPapers: ["bib-1"],
  });
  assert.equal(edges.length, 3); // + memory~safety, evaluation~safety from daily-2
});

// ------------------------------------------------------------ top-k capping

function wedge(source: string, target: string, weight: number): WeightedConceptEdge {
  return { source, target, weight, sharedDigests: [], sharedPapers: [] };
}

test("capConceptEdges keeps at most k rendered edges per node, strongest first", () => {
  const full = [
    wedge("a", "hub", 9),
    wedge("b", "hub", 8),
    wedge("c", "hub", 7),
    wedge("d", "hub", 6),
    wedge("e", "hub", 5),
    wedge("a", "b", 4),
  ];
  const kept = capConceptEdges(full, 3);
  assert.deepEqual(
    kept.map((e) => `${e.source}~${e.target}`),
    ["a~hub", "b~hub", "c~hub", "a~b"],
  );
  const degree = new Map<string, number>();
  for (const e of kept) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }
  assert.ok(Math.max(...degree.values()) <= 3);
});

test("capConceptEdges is deterministic under weight ties", () => {
  const full = [wedge("b", "c", 5), wedge("a", "b", 5), wedge("a", "c", 5)];
  const kept1 = capConceptEdges(full, 1);
  const kept2 = capConceptEdges([...full].reverse(), 1);
  assert.deepEqual(kept1, kept2);
  assert.deepEqual(
    kept1.map((e) => `${e.source}~${e.target}`),
    ["a~b"], // key-ascending tiebreak; a and b then at budget, c orphaned at k=1
  );
});

// -------------------------------------------------------------------- gaps

test("computeGaps emits above-median pairs with no direct edge", () => {
  const slugs = ["a", "b", "c", "d", "e"];
  const full = [wedge("a", "c", 10), wedge("b", "d", 10), wedge("c", "e", 1), wedge("d", "e", 1)];
  // totals: a=10 b=10 c=11 d=11 e=2 -> median 10 -> heavy: c, d (no c~d edge)
  const gaps = computeGaps(full, slugs);
  assert.deepEqual(gaps, [{ source: "c", target: "d", sourceWeight: 11, targetWeight: 11 }]);
});

test("computeGaps excludes connected pairs and pairs at/below the median", () => {
  const slugs = ["a", "b", "c"];
  const full = [wedge("a", "b", 5), wedge("a", "c", 5)];
  // totals: a=10 b=5 c=5 -> median 5 -> heavy: a alone -> no pairs
  assert.deepEqual(computeGaps(full, slugs), []);
});

// ------------------------------------------------------ graph assembly + rename

test("buildConceptGraph emits concept, anchor-topic, and vaultNote nodes with typed edges", () => {
  const data = buildConceptGraph({
    concepts: CONCEPTS,
    topics: TOPICS,
    digests: [{ slug: "daily-1", title: "Issue one", date: "2026-06-01", facets: ["evals", "memory"] }],
    explorers: [],
    assignments: { "vault:note-abc": { concept: "ai-safety", takeaway: "vault takeaway" } },
  });

  assert.equal(data.nodes.filter((n) => n.type === "concept").length, CONCEPTS.length);
  const topicNode = data.nodes.find((n) => n.id === "topic:agent-memory");
  assert.equal(topicNode?.type, "topic");
  assert.equal(topicNode?.label, "Agent memory (topic)");

  const noteNode = data.nodes.find((n) => n.id === "vault:note-abc");
  assert.equal(noteNode?.type, "vaultNote");
  assert.ok(data.edges.some((e) => e.kind === "concept-note" && e.source === "ai-safety" && e.target === "vault:note-abc"));
  assert.ok(
    data.edges.some((e) => e.kind === "concept-topic" && e.source === "agent-memory" && e.target === "topic:agent-memory"),
  );
  assert.ok(
    data.edges.some(
      (e) => e.kind === "concept-concept" && e.source === "agent-memory" && e.target === "evaluation",
    ),
  );
  // evidence rides on the concept node for the detail panel
  const memory = data.nodes.find((n) => n.id === "agent-memory");
  assert.equal(memory?.evidence?.digests[0]?.slug, "daily-1");
});

test("buildConceptGraph throws on a dangling topic anchor", () => {
  assert.throws(
    () =>
      buildConceptGraph({
        concepts: [concept("evaluation", "Evaluation", [], "no-such-topic")],
        topics: new Map(),
        ...NO_DATA,
      }),
    /topic anchor "no-such-topic" not found/,
  );
});

function renameFixture(sectionKey: string): Explorer[] {
  return [
    {
      id: "ex-1",
      title: "Explorer one",
      sections: [
        { key: sectionKey, label: "Evaluation" }, // label resolves regardless of key
        { key: "rag", label: "Whatever" },
      ],
      papers: [
        { bibcode: "2026arXiv0001", title: "Paper A", branches: [sectionKey, "rag"], notes: [] },
        { bibcode: "2026arXiv0002", title: "Paper B", branches: [sectionKey], notes: [] },
      ],
    },
  ];
}

test("renaming an explorer branch slug changes zero committed bytes and derived edges follow", () => {
  const committedBefore = readFileSync("src/data/knowledge/concept-assignments.json");

  const before = buildConceptGraph({
    concepts: CONCEPTS,
    topics: TOPICS,
    digests: [],
    explorers: renameFixture("eval-harness-v1"),
    assignments: {},
  });
  const after = buildConceptGraph({
    concepts: CONCEPTS,
    topics: TOPICS,
    digests: [],
    explorers: renameFixture("eval-harness-v2-renamed"),
    assignments: {},
  });

  // derived edges follow the rename: identical weighted list and rendered set
  assert.deepEqual(after.conceptEdges, before.conceptEdges);
  assert.deepEqual(
    after.edges.filter((e) => e.kind === "concept-concept"),
    before.edges.filter((e) => e.kind === "concept-concept"),
  );
  assert.equal(before.conceptEdges.length, 1);
  assert.equal(before.conceptEdges[0].source, "evaluation");
  assert.equal(before.conceptEdges[0].target, "retrieval-augmented-generation");

  // membership derivation persisted nothing
  const committedAfter = readFileSync("src/data/knowledge/concept-assignments.json");
  assert.ok(committedBefore.equals(committedAfter));
});

test("emitted structure satisfies the GraphData contract the explorer island consumes", () => {
  const data = buildConceptGraph({ concepts: CONCEPTS, topics: TOPICS, ...NO_DATA });
  const ids = new Set(data.nodes.map((n) => n.id));
  assert.equal(ids.size, data.nodes.length, "node ids are unique");
  for (const edge of data.edges) {
    assert.ok(ids.has(edge.source), `edge source ${edge.source} exists`);
    assert.ok(ids.has(edge.target), `edge target ${edge.target} exists`);
  }
  for (const node of data.nodes) {
    assert.equal(typeof node.label, "string");
    assert.equal(typeof node.summary, "string");
    assert.ok(Array.isArray(node.links));
    assert.equal(typeof node.weight, "number");
  }
});
