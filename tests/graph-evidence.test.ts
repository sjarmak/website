// Unit tests for the local evidence view: satellite element-spec builder and
// the deterministic ring-placement math. Run with `npm test` (node --test).

import test from "node:test";
import assert from "node:assert/strict";

import {
  buildEvidenceSpecs,
  evidenceElements,
  panToReveal,
  ringPlacement,
  REVEAL_FRACTION,
  truncateLabel,
  EVIDENCE_ID_PREFIX,
  EVIDENCE_SATELLITE_CAP,
  SATELLITE_LABEL_MAX,
  SATELLITE_SIZE,
  OVERFLOW_TYPE,
  RING_BASE_RADIUS,
  RING_CAPACITIES,
} from "../src/scripts/graph-evidence.ts";
import { NODE_TYPE_STYLES } from "../src/scripts/graph-style.ts";
import type { ConceptEvidence } from "../src/lib/knowledge/conceptMembership.ts";

const LONG_TITLE = "Paper with a very long title that runs well past forty characters";

function fixtureEvidence(): ConceptEvidence {
  return {
    digests: [{ slug: "2026-07-01-issue", title: "A digest issue title", date: "2026-07-01" }],
    sections: [
      {
        explorerId: "exp1",
        explorerTitle: "Explorer One",
        sectionKey: "alpha",
        sectionLabel: "Alpha",
        url: "/library/explorers/exp1/",
      },
      { explorerId: "exp1", explorerTitle: "Explorer One", sectionKey: "beta", sectionLabel: "Beta" },
    ],
    papers: [
      { bibcode: "2020A&A.1B", title: LONG_TITLE, url: "https://ui.adsabs.harvard.edu/abs/x" },
      { bibcode: "2021B..2C" },
    ],
    vaultNotes: [{ id: "note-1", takeaway: "t" }],
    threads: [{ id: "thread-1" }],
  };
}

// ------------------------------------------------------------ spec builder

test("buildEvidenceSpecs: ids are ev:-namespaced per lane, panel order", () => {
  const specs = buildEvidenceSpecs({ id: "my-concept", evidence: fixtureEvidence() });
  assert.deepEqual(
    specs.nodes.map((n) => n.id),
    [
      "ev:digest:2026-07-01-issue",
      "ev:section:exp1:alpha",
      "ev:section:exp1:beta",
      "ev:paper:2020A&A.1B",
      "ev:paper:2021B..2C",
      "ev:note:note-1",
      "ev:thread:thread-1",
    ],
  );
  for (const n of specs.nodes) assert.ok(n.id.startsWith(EVIDENCE_ID_PREFIX));
});

test("buildEvidenceSpecs: satellite types are valid style-table entries", () => {
  const specs = buildEvidenceSpecs({ id: "my-concept", evidence: fixtureEvidence() });
  assert.deepEqual(
    specs.nodes.map((n) => n.type),
    ["digest", "section", "section", "paper", "paper", "vaultNote", "vaultNote"],
  );
  for (const n of specs.nodes) {
    assert.ok(n.type in NODE_TYPE_STYLES, `${n.type} has a style-table entry`);
  }
});

test("buildEvidenceSpecs: hrefs reuse digestHref/sectionHref; url-less items are inert", () => {
  const specs = buildEvidenceSpecs({ id: "my-concept", evidence: fixtureEvidence() });
  const byId = new Map(specs.nodes.map((n) => [n.id, n]));
  assert.equal(byId.get("ev:digest:2026-07-01-issue")!.href, "/digest/2026-07-01-issue/");
  assert.equal(byId.get("ev:section:exp1:alpha")!.href, "/library/explorers/exp1/#theme-alpha");
  assert.equal(byId.get("ev:section:exp1:beta")!.href, undefined);
  assert.equal(byId.get("ev:paper:2020A&A.1B")!.href, "https://ui.adsabs.harvard.edu/abs/x");
  assert.equal(byId.get("ev:paper:2021B..2C")!.href, undefined);
  assert.equal(byId.get("ev:note:note-1")!.href, undefined);
  assert.equal(byId.get("ev:thread:thread-1")!.href, undefined);
});

test("buildEvidenceSpecs: labels truncate at the max with an ellipsis", () => {
  const specs = buildEvidenceSpecs({ id: "my-concept", evidence: fixtureEvidence() });
  const paper = specs.nodes.find((n) => n.id === "ev:paper:2020A&A.1B")!;
  assert.ok(paper.label.length <= SATELLITE_LABEL_MAX);
  assert.ok(paper.label.endsWith("…"));
  assert.equal(paper.label, truncateLabel(LONG_TITLE));
  const digest = specs.nodes.find((n) => n.id === "ev:digest:2026-07-01-issue")!;
  assert.equal(digest.label, "A digest issue title", "short labels pass through untouched");
});

test("buildEvidenceSpecs: one ev:-namespaced edge per satellite, concept as source", () => {
  const specs = buildEvidenceSpecs({ id: "my-concept", evidence: fixtureEvidence() });
  assert.equal(specs.edges.length, specs.nodes.length);
  const targets = new Set(specs.nodes.map((n) => n.id));
  for (const e of specs.edges) {
    assert.ok(e.id.startsWith(`${EVIDENCE_ID_PREFIX}edge:`));
    assert.equal(e.source, "my-concept");
    assert.ok(targets.has(e.target));
    assert.equal(e.kind, "concept-evidence");
  }
});

test("buildEvidenceSpecs: no satellites when evidence is absent or empty", () => {
  assert.deepEqual(buildEvidenceSpecs({ id: "plain-node" }), { nodes: [], edges: [] });
  const empty: ConceptEvidence = { digests: [], sections: [], papers: [], vaultNotes: [], threads: [] };
  assert.deepEqual(buildEvidenceSpecs({ id: "empty", evidence: empty }), { nodes: [], edges: [] });
});

test("buildEvidenceSpecs: cap adds a single inert '+N more in panel' overflow node", () => {
  const papers = Array.from({ length: EVIDENCE_SATELLITE_CAP + 5 }, (_, i) => ({
    bibcode: `2020bib..${i}`,
  }));
  const evidence: ConceptEvidence = { digests: [], sections: [], papers, vaultNotes: [], threads: [] };
  const specs = buildEvidenceSpecs({ id: "big", evidence });
  assert.equal(specs.nodes.length, EVIDENCE_SATELLITE_CAP + 1);
  const overflow = specs.nodes[specs.nodes.length - 1];
  assert.equal(overflow.id, "ev:overflow:big");
  assert.equal(overflow.type, OVERFLOW_TYPE);
  assert.equal(overflow.label, "+5 more in panel");
  assert.equal(overflow.href, undefined);
  assert.equal(specs.edges.length, EVIDENCE_SATELLITE_CAP + 1, "overflow node is connected too");

  const small = buildEvidenceSpecs({ id: "big", evidence }, 3);
  assert.equal(small.nodes.length, 4);
  assert.equal(small.nodes[3].label, `+${EVIDENCE_SATELLITE_CAP + 5 - 3} more in panel`);
});

test("buildEvidenceSpecs: under the cap there is no overflow node", () => {
  const specs = buildEvidenceSpecs({ id: "my-concept", evidence: fixtureEvidence() });
  assert.ok(specs.nodes.every((n) => n.type !== OVERFLOW_TYPE));
});

// ---------------------------------------------------------- ring placement

test("ringPlacement is deterministic", () => {
  for (const [index, total] of [
    [0, 1],
    [5, 12],
    [13, 40],
    [60, 61],
  ]) {
    assert.deepEqual(ringPlacement(index, total), ringPlacement(index, total));
  }
});

test("ringPlacement: the first ring sits at the base radius, later rings farther out", () => {
  const total = 61;
  for (let i = 0; i < RING_CAPACITIES[0]; i++) {
    const { dx, dy } = ringPlacement(i, total);
    assert.ok(Math.abs(Math.hypot(dx, dy) - RING_BASE_RADIUS) < 1e-9);
  }
  const outer = ringPlacement(RING_CAPACITIES[0], total);
  assert.ok(Math.hypot(outer.dx, outer.dy) > RING_BASE_RADIUS);
});

test("ringPlacement: 61 satellites (cap + overflow) never collide", () => {
  const total = EVIDENCE_SATELLITE_CAP + 1;
  const points = Array.from({ length: total }, (_, i) => ringPlacement(i, total));
  for (let i = 0; i < total; i++) {
    for (let j = i + 1; j < total; j++) {
      const d = Math.hypot(points[i].dx - points[j].dx, points[i].dy - points[j].dy);
      assert.ok(
        d >= SATELLITE_SIZE * 2,
        `satellites ${i} and ${j} are ${d.toFixed(1)}px apart (< ${SATELLITE_SIZE * 2})`,
      );
    }
  }
});

test("ringPlacement: a partial ring spreads items over the full circle", () => {
  // 4 items on ring 0 should be ~90 degrees apart, not bunched at the start.
  const a = ringPlacement(0, 4);
  const b = ringPlacement(1, 4);
  const dot = (a.dx * b.dx + a.dy * b.dy) / (RING_BASE_RADIUS * RING_BASE_RADIUS);
  assert.ok(Math.abs(dot) < 1e-9, "adjacent of 4 are orthogonal");
});

// -------------------------------------------------------- element mapping

test("evidenceElements: positions ring around the center, sizes below concept size", () => {
  const specs = buildEvidenceSpecs({ id: "my-concept", evidence: fixtureEvidence() });
  const tokens: Record<string, string> = {};
  for (const style of Object.values(NODE_TYPE_STYLES)) tokens[style.cssToken] = "#123456";
  const els = evidenceElements(specs, { x: 100, y: 50 }, tokens);
  assert.equal(els.length, specs.nodes.length + specs.edges.length);

  const nodeEls = els.filter((el) => el.position !== undefined);
  assert.equal(nodeEls.length, specs.nodes.length);
  nodeEls.forEach((el, i) => {
    const { dx, dy } = ringPlacement(i, specs.nodes.length);
    assert.deepEqual(el.position, { x: 100 + dx, y: 50 + dy });
    assert.equal(el.data.size, SATELLITE_SIZE);
    assert.ok((el.data.size as number) < 26, "satellites are smaller than concepts");
    assert.equal(el.data.color, "#123456");
    assert.equal(el.selectable, false);
  });
});

// -------------------------------------------------------- small-screen reveal

test("panToReveal: inverts renderedPosition so the node lands at the target fraction", () => {
  const pos = { x: 200, y: 400 };
  const zoom = 1.5;
  const viewport = { width: 390, height: 700 };
  const pan = panToReveal(pos, zoom, viewport, { x: 0.5, y: 0.3 });
  // renderedPosition = pos * zoom + pan
  assert.equal(zoom * pos.x + pan.x, viewport.width * 0.5);
  assert.equal(zoom * pos.y + pan.y, viewport.height * 0.3);
});

test("panToReveal: defaults to REVEAL_FRACTION (upper third, centered)", () => {
  const pan = panToReveal({ x: 0, y: 0 }, 1, { width: 400, height: 600 });
  assert.deepEqual(pan, { x: 400 * REVEAL_FRACTION.x, y: 600 * REVEAL_FRACTION.y });
  assert.equal(REVEAL_FRACTION.x, 0.5);
  assert.ok(REVEAL_FRACTION.y < 0.5, "reveal target sits above the bottom sheet");
});
