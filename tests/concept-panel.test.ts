// Fixture-driven tests for the concept detail-panel model (shared by the
// client panel and the server-rendered no-JS fallback) and the freshness line.
import test from "node:test";
import assert from "node:assert/strict";
import type { ConceptEvidence } from "../src/lib/knowledge/conceptMembership.ts";
import {
  buildConceptPanel,
  digestHref,
  sectionHref,
} from "../src/scripts/concept-panel.ts";
import {
  computeConceptFreshness,
  formatFreshnessLine,
} from "../src/lib/knowledge/conceptFreshness.ts";
import { NODE_TYPE_STYLES } from "../src/scripts/graph-style.ts";
import { buildConceptGraph } from "../src/lib/graph/buildConceptGraph.ts";
import type { ConceptEntry } from "../src/lib/knowledge/conceptAliases.ts";

function evidence(partial: Partial<ConceptEvidence>): ConceptEvidence {
  return { digests: [], sections: [], papers: [], vaultNotes: [], threads: [], ...partial };
}

test("digest evidence renders as /digest/<slug>/ links with dates", () => {
  const panel = buildConceptPanel({
    evidence: evidence({
      digests: [
        { slug: "daily-2026-06-10", title: "Issue ten", date: "2026-06-10" },
        { slug: "daily-2026-06-09", title: "Issue nine", date: "2026-06-09" },
      ],
    }),
  });
  const group = panel.groups.find((g) => g.heading === "Digest issues");
  assert.ok(group, "digest group present");
  assert.deepEqual(group.items, [
    { label: "Issue ten", href: "/digest/daily-2026-06-10/", meta: "2026-06-10" },
    { label: "Issue nine", href: "/digest/daily-2026-06-09/", meta: "2026-06-09" },
  ]);
  assert.equal(digestHref("x"), "/digest/x/");
});

test("explorer sections link to the explorer page theme anchors", () => {
  const panel = buildConceptPanel({
    evidence: evidence({
      sections: [
        {
          explorerId: "memory-design",
          explorerTitle: "Memory design",
          sectionKey: "retrieval",
          sectionLabel: "Retrieval",
          url: "/library/explorers/memory-design",
        },
      ],
    }),
  });
  const group = panel.groups.find((g) => g.heading === "Explorer sections");
  assert.ok(group);
  assert.deepEqual(group.items, [
    {
      label: "Memory design — Retrieval",
      href: "/library/explorers/memory-design#theme-retrieval",
    },
  ]);
  assert.equal(sectionHref("/library/explorers/x", "k"), "/library/explorers/x#theme-k");
});

test("papers link to their URL when present, else render as plain text", () => {
  const panel = buildConceptPanel({
    evidence: evidence({
      papers: [
        { bibcode: "2025arXiv1", title: "Paper A", url: "https://arxiv.org/abs/1", takeaway: "a take" },
        { bibcode: "2025noUrl..1", title: "Paper B" },
        { bibcode: "2025untitled" },
      ],
    }),
  });
  const group = panel.groups.find((g) => g.heading === "Papers");
  assert.ok(group);
  assert.deepEqual(group.items, [
    { label: "Paper A", href: "https://arxiv.org/abs/1", meta: "a take" },
    { label: "Paper B" },
    { label: "2025untitled" }, // falls back to the bibcode
  ]);
  assert.equal(group.items[1].href, undefined, "no external link invented for url-less papers");
});

test("vault notes are plain labeled entries carrying the vaultNote style token", () => {
  const panel = buildConceptPanel({
    evidence: evidence({
      vaultNotes: [{ id: "2026-06-01-context-packing", takeaway: "pack the context" }],
    }),
  });
  const group = panel.groups.find((g) => g.heading === "Vault notes");
  assert.ok(group, "vault note group present");
  const item = group.items[0];
  assert.deepEqual(item, {
    label: "2026-06-01-context-packing",
    meta: "pack the context",
    type: "vaultNote",
  });
  assert.equal(item.href, undefined, "vault notes never render as external links");
  // the type maps to the note style token used by the fallback/panel CSS
  assert.equal(NODE_TYPE_STYLES[item.type!].cssToken, "--graph-node-note");
});

test("fixture graph carries a vaultNote node whose panel entry keeps the token mapping", () => {
  const concepts: ConceptEntry[] = [
    { slug: "agent-memory", label: "Agent memory", aliases: [], definition: "d", related: [] },
  ];
  const data = buildConceptGraph({
    concepts,
    digests: [],
    explorers: [],
    assignments: { "vault:fixture-note": { concept: "agent-memory", takeaway: "fixture take" } },
    topics: new Map(),
  });
  const vaultNode = data.nodes.find((n) => n.type === "vaultNote");
  assert.ok(vaultNode, "fixture assignment produces a vaultNote node");
  assert.equal(vaultNode.id, "vault:fixture-note");
  assert.equal(NODE_TYPE_STYLES[vaultNode.type].cssToken, "--graph-node-note");

  const conceptNode = data.nodes.find((n) => n.id === "agent-memory");
  assert.ok(conceptNode?.evidence);
  const panel = buildConceptPanel(conceptNode);
  const group = panel.groups.find((g) => g.heading === "Vault notes");
  assert.deepEqual(group?.items, [{ label: "fixture-note", meta: "fixture take", type: "vaultNote" }]);
});

test("empty evidence yields zero groups; freshness line still renders", () => {
  const panel = buildConceptPanel({ evidence: evidence({}) }, { tagged: 0, total: 12, mostRecent: null });
  assert.deepEqual(panel.groups, []);
  assert.equal(panel.freshnessLine, "tagged in 0 of 12 digest issues");
});

test("paper-lane concept with zero digest tags leads with the richer lanes", () => {
  const panel = buildConceptPanel(
    {
      evidence: evidence({
        papers: [
          { bibcode: "2024arXiv1", title: "Paper one" },
          { bibcode: "2024arXiv2", title: "Paper two" },
        ],
        sections: [
          { explorerId: "memory-design", explorerTitle: "Memory design", sectionKey: "evaluation", sectionLabel: "Evaluation" },
        ],
      }),
    },
    { tagged: 0, total: 60, mostRecent: null },
  );
  assert.equal(
    panel.freshnessLine,
    "2 papers · 1 explorer section · tagged in 0 of 60 digest issues",
  );
});

test("digest-tagged concept keeps the freshness fragment first, lanes appended", () => {
  const panel = buildConceptPanel(
    {
      evidence: evidence({
        digests: [{ slug: "daily-2026-07-04", title: "Issue", date: "2026-07-04" }],
        papers: [{ bibcode: "2024arXiv1", title: "Paper one" }],
      }),
    },
    { tagged: 1, total: 60, mostRecent: "2026-07-04" },
  );
  assert.equal(
    panel.freshnessLine,
    "tagged in 1 of 60 digest issues, most recently 2026-07-04 · 1 paper",
  );
});

test("no freshness data: line is the lane summary alone, or null when empty", () => {
  const withLanes = buildConceptPanel({
    evidence: evidence({ vaultNotes: [{ id: "vault:abc", takeaway: "t" }] }),
  });
  assert.equal(withLanes.freshnessLine, "1 vault note");
  const bare = buildConceptPanel({ evidence: evidence({}) });
  assert.equal(bare.freshnessLine, null);
});

test("freshness computes tagged count + most recent date and formats the line", () => {
  const f = computeConceptFreshness(
    [{ date: "2026-06-10" }, { date: "2026-07-01" }, { date: undefined }],
    26,
  );
  assert.deepEqual(f, { tagged: 3, total: 26, mostRecent: "2026-07-01" });
  assert.equal(
    formatFreshnessLine(f),
    "tagged in 3 of 26 digest issues, most recently 2026-07-01",
  );
});
