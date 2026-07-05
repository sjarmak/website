// Assertions over the BUILT concepts page (dist/concepts/) plus a
// guard that the /projects/explorer output is untouched by the concepts work.
// If dist/ is absent the suite builds it (npm run build) — in the ordered CI
// pipeline the build has already run, so this normally reuses the output.

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(REPO_ROOT, "dist");
const PAGE = path.join(DIST, "concepts", "index.html");

const GRAPH_DATA_RE = /<script type="application\/json" data-graph-data[^>]*>([\s\S]*?)<\/script>/;

let html;
let payload;

before(async () => {
  if (!existsSync(path.join(DIST, "index.html"))) {
    await execFileP("npm", ["run", "build"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 });
  }
  html = readFileSync(PAGE, "utf8");
  const match = html.match(GRAPH_DATA_RE);
  assert.ok(match, "concepts page embeds a data-graph-data payload");
  payload = JSON.parse(match[1]);
});

// ---------------------------------------------------------- page structure

test("built page contains the graph payload AND the no-JS fallback list", () => {
  const conceptNodes = payload.nodes.filter((n) => n.type === "concept");
  assert.ok(conceptNodes.length >= 30, `expected >=30 concept nodes, got ${conceptNodes.length}`);
  assert.ok(Array.isArray(payload.conceptEdges), "full conceptEdges list is embedded");
  assert.ok(payload.freshness, "freshness map is embedded");

  // no-JS fallback: server-rendered list with per-concept articles + links
  assert.match(html, /data-concept-fallback/, "fallback section present");
  for (const node of conceptNodes) {
    assert.ok(html.includes(`id="concept-${node.id}"`), `fallback entry for ${node.id}`);
  }
  assert.match(html, /href="\/digest\/[^"]+\/"/, "fallback links to digest issues");
});

test("detail panel evidence container ships in the page markup", () => {
  assert.match(html, /data-detail-evidence/);
});

test("evidence toggle ships in the concepts toolbar, default ON", () => {
  assert.match(html, /data-evidence-toggle aria-pressed="true"/);
});

// Hard PRD constraint (edge-density budget): the unexpanded global view never
// contains evidence nodes — satellites exist only client-side, on selection.
test("global concepts payload contains no evidence-type or ev:-namespaced nodes", () => {
  assert.deepEqual(
    payload.nodes.filter((n) => ["paper", "digest", "section"].includes(n.type)),
    [],
    "no paper/digest/section nodes in the build-time payload",
  );
  assert.deepEqual(
    payload.nodes.filter((n) => n.id.startsWith("ev:")),
    [],
    "no ev:-namespaced nodes in the build-time payload",
  );
});

// ------------------------------------------------------------- heartbeat

// The sync heartbeat is pipeline telemetry (owner decision 2026-07-04): the
// pipeline still commits concept-sync-status.json, but it must not render on
// the public page.
test("sync heartbeat is not rendered on the public concepts page", () => {
  assert.doesNotMatch(html, /data-concept-heartbeat/);
  assert.ok(!html.includes("Sync heartbeat"));
});

// ---------------------------------------------- freshness (independent join)

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

function frontmatterDocs(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .sort()
    .map((file) => {
      const slug = file.replace(/\.(md|mdx)$/, "");
      const raw = readFileSync(path.join(dir, file), "utf8");
      const fm = parseYaml(raw.match(FRONTMATTER_RE)[1]);
      return { slug, fm };
    });
}

// Deliberately independent normalization + join (no imports from src/lib).
function norm(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

test("embedded freshness matches an independent alias-aware digest count (>=3 concepts)", () => {
  const conceptDocs = frontmatterDocs(path.join(REPO_ROOT, "src", "content", "concepts"));
  const digestDocs = frontmatterDocs(path.join(REPO_ROOT, "src", "content", "digest"));
  const assignments = JSON.parse(
    readFileSync(path.join(REPO_ROOT, "src", "data", "knowledge", "concept-assignments.json"), "utf8"),
  );

  const totalDigests = digestDocs.length;
  const keysFor = new Map(
    conceptDocs.map(({ slug, fm }) => [
      slug,
      new Set([slug, norm(fm.label), ...(fm.aliases ?? []).map(norm)]),
    ]),
  );

  function independentTaggedSlugs(concept) {
    const keys = keysFor.get(concept);
    const tagged = new Set();
    for (const { slug, fm } of digestDocs) {
      const facets = (fm.topics ?? []).map(norm);
      if (facets.some((f) => keys.has(f))) tagged.add(slug);
    }
    for (const [key, a] of Object.entries(assignments)) {
      if (key.startsWith("digest:") && a.concept === concept) tagged.add(key.slice("digest:".length));
    }
    return tagged;
  }

  // pick the 3 most-tagged concepts from the embedded map — content-drift safe
  const top = Object.entries(payload.freshness)
    .sort((a, b) => b[1].tagged - a[1].tagged)
    .slice(0, 3);
  assert.equal(top.length, 3, "at least 3 concepts have freshness data");
  assert.ok(top[0][1].tagged > 0, "top concept is tagged in at least one digest");

  for (const [slug, fresh] of top) {
    const independent = independentTaggedSlugs(slug);
    assert.equal(
      fresh.tagged,
      independent.size,
      `freshness.tagged for ${slug}: embedded ${fresh.tagged} vs independent ${independent.size}`,
    );
    assert.equal(fresh.total, totalDigests, `freshness.total for ${slug}`);
    // the formatted line is server-rendered in the fallback
    const line =
      fresh.tagged > 0 && fresh.mostRecent !== null
        ? `tagged in ${fresh.tagged} of ${fresh.total} digest issues, most recently ${fresh.mostRecent}`
        : `tagged in ${fresh.tagged} of ${fresh.total} digest issues`;
    assert.ok(html.includes(line), `freshness line rendered for ${slug}: "${line}"`);
  }
});

// ------------------------------------------- /projects/explorer untouched

test("/projects/explorer payload has no concepts additions", () => {
  const explorerHtml = readFileSync(path.join(DIST, "projects", "explorer", "index.html"), "utf8");
  const match = explorerHtml.match(GRAPH_DATA_RE);
  assert.ok(match, "explorer page still embeds its payload");
  const data = JSON.parse(match[1]);
  assert.equal(data.freshness, undefined, "no freshness map on the projects explorer");
  assert.deepEqual(
    data.nodes.filter((n) =>
      ["concept", "vaultNote", "paper", "digest", "section"].includes(n.type),
    ),
    [],
    "no concept/vaultNote/evidence nodes on the projects explorer",
  );
  assert.ok(!explorerHtml.includes("data-detail-evidence"), "no evidence container on the projects explorer");
  assert.ok(!explorerHtml.includes("data-evidence-toggle"), "no evidence toggle on the projects explorer");
});

test("/projects/explorer node/edge sets match the recorded base-branch baseline (when present)", (t) => {
  const baselinePath = path.join(REPO_ROOT, ".prd-build", "artifacts", "explorer-baseline.json");
  if (!existsSync(baselinePath)) {
    t.skip("no baseline snapshot in this checkout");
    return;
  }
  const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
  const explorerHtml = readFileSync(path.join(DIST, "projects", "explorer", "index.html"), "utf8");
  const data = JSON.parse(explorerHtml.match(GRAPH_DATA_RE)[1]);
  assert.deepEqual(
    data.nodes.map((n) => n.id).sort(),
    baseline.nodeIds,
    "explorer node ids identical to base branch",
  );
  assert.deepEqual(
    data.edges.map((e) => e.id).sort(),
    baseline.edgeIds,
    "explorer edge ids identical to base branch",
  );
});
