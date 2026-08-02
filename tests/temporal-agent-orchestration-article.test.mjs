import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = path.join(
  ROOT,
  "src/pages/temporal-agent-orchestration/article.astro",
);
const ARTICLE = path.join(
  ROOT,
  "src/components/temporal-agent-orchestration/Article.mdx",
);
const READER = path.join(
  ROOT,
  "src/components/temporal-agent-orchestration/AnnotatedCode.astro",
);
const FIGURES = path.join(
  ROOT,
  "src/components/temporal-agent-orchestration/ConceptFigure.astro",
);
const OPENING_FIGURE = path.join(
  ROOT,
  "src/components/temporal-agent-orchestration/OpeningFigure.astro",
);
const OPENING_ILLUSTRATION = path.join(
  ROOT,
  "src/components/temporal-agent-orchestration/img/cabo-dinner-terminal-wall.png",
);
const ILLUSTRATION = path.join(
  ROOT,
  "src/components/temporal-agent-orchestration/Illustration.astro",
);
const CONSPIRACY_FIGURE = path.join(
  ROOT,
  "src/components/temporal-agent-orchestration/ConspiracyFigure.astro",
);
const CANARY_FIGURE = path.join(
  ROOT,
  "src/components/temporal-agent-orchestration/CanaryFigure.astro",
);
const WORKSHOP_FIGURE = path.join(
  ROOT,
  "src/components/temporal-agent-orchestration/WorkshopFigure.astro",
);
const WORKSHOP_ILLUSTRATION = path.join(
  ROOT,
  "src/components/temporal-agent-orchestration/img/workshop-job-board-checklist.png",
);
const TOKENS = path.join(ROOT, "src/styles/tokens.css");
const SAMPLES = path.join(
  ROOT,
  "src/data/temporal-agent-orchestration-code-samples.ts",
);

test("the agent-orchestration essay is a direct off-navigation article", () => {
  assert.equal(existsSync(PAGE), true);
  assert.equal(existsSync(ARTICLE), true);

  const page = readFileSync(PAGE, "utf8");
  const article = readFileSync(ARTICLE, "utf8");
  const header = readFileSync(
    path.join(ROOT, "src/components/nav/Header.astro"),
    "utf8",
  );

  assert.match(page, /<Article \/>/);
  assert.match(page, /noindex=\{true\}/);
  assert.match(page, /type="article"/);
  // The article quotes its evidence through CodeExcerpt reads of the published
  // files; the complete annotated readers live at /code.
  assert.match(article, /<CodeExcerpt/);
  assert.match(article, /code\/before\/city_runtime_excerpt\.go/);
  assert.match(article, /code\/workflow\.go/);
  assert.match(article, /code\/activity\.go/);
  assert.match(article, /Nondeterministic Idempotence/);
  assert.match(article, /Put the unpredictable agent inside an Activity/);
  assert.match(article, /Gas City supplies the orchestration primitives/);
  assert.match(article, /Gas Town was one specific city design/);
  assert.match(article, /Temporal does not replace it/);
  assert.match(article, /took the primitives behind Gas Town/i);
  assert.match(
    article,
    /The coding agent itself could not be replayed deterministically/i,
    "the essay must not imply Temporal made agent behavior deterministic",
  );
  // The determinism ban covers page metadata, not just the body. <title> is the
  // browser tab AND the link-preview text, and it once read "tried to make agent
  // work deterministic" — the exact opposite of what the piece argues.
  assert.doesNotMatch(
    page,
    /determinis/i,
    "page metadata must not imply Temporal made agent behavior deterministic",
  );
  assert.match(article, /nondeterministic effects run in \[Activities\]/i);
  assert.match(article, /failed promotion gate/i);
  assert.match(article, /named a Workflow that did not exist/i);
  assert.match(article, /formula step/i);
  assert.match(article, /source task/i);
  assert.match(
    article,
    /legitimate completion paths closed real work without producing an[\s\S]{0,400}?OutcomeReady<\/TermTip> envelope at all/i,
  );
  assert.ok(
    article.indexOf("code/before/city_runtime_excerpt.go") <
      article.indexOf("code/workflow.go"),
    "the before source must appear before the Temporal implementation",
  );
  assert.doesNotMatch(article, /\bhomework\b|\bevaluation criteria\b|\bthis assignment\b/i);
  assert.doesNotMatch(header, /temporal-agent-orchestration/);
});

test("the essay opens with the sourced personal path from Beads to Temporal", () => {
  const article = readFileSync(ARTICLE, "utf8");
  const references = readFileSync(
    path.join(
      ROOT,
      "src/components/temporal-agent-orchestration/References.astro",
    ),
    "utf8",
  );

  const narrative = [
    "Sourcegraph offsite in Cabo",
    "A few weeks later",
    // Beads published 2025-10-13; the date belongs to the publication, not the
    // dinner, which the sources place in September. See the "September 2025"
    // guard below: the article must carry a true date without naming that month.
    "October 2025",
    "Introducing Beads",
    "January 1, 2026",
    "Welcome to Gas Town",
    "Nondeterministic Idempotence",
    "In March 2026",
    "Julian Knutsen",
    "over two hundred pull requests",
    "Kubernetes",
    "distributed-systems toolbox",
    "very ugly baby",
  ];
  let previous = -1;
  for (const marker of narrative) {
    const current = article.indexOf(marker);
    assert.ok(current > previous, `${marker} must appear in narrative order`);
    previous = current;
  }

  for (const link of [
    "https://steve-yegge.medium.com/introducing-beads-a-coding-agent-memory-system-637d7d92514a",
    "https://steve-yegge.medium.com/welcome-to-gas-town-4f25ee16dd04",
    "https://github.com/gastownhall/beads",
    "https://github.com/gastownhall/gascity",
    "https://github.com/gastownhall/gascity/pulls?q=is%3Apr+author%3Asjarmak+is%3Amerged",
    "https://github.com/sourcegraph/CodeScaleBench",
    "https://docs.temporal.io/temporal",
    "https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/",
    "https://www.oreilly.com/library/view/designing-distributed-systems/9781491983638/",
    "https://docs.temporal.io/workflows",
    "https://docs.temporal.io/activities",
    "https://docs.temporal.io/workers",
    "https://docs.temporal.io/encyclopedia/event-history",
    "https://docs.temporal.io/develop/go/workflows/message-passing#signal-with-start",
    "https://docs.temporal.io/workflow-execution",
    "https://docs.temporal.io/develop/go/activities/timeouts#activity-heartbeats",
    "https://github.com/sjarmak/gas-city",
    "https://github.com/gastownhall/gascity-packs",
  ]) {
    assert.ok(article.includes(link), `missing source link: ${link}`);
  }

  // No orphaned citations: every entry in the reference section is cited
  // somewhere in the body. The section is a trail back to sentences, not a
  // shelf; an uncited entry has drifted loose from the argument.
  const referenceHrefs = [...references.matchAll(/href: "([^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.ok(referenceHrefs.length >= 20, "the reference list must parse");
  for (const href of referenceHrefs) {
    assert.ok(article.includes(href), `orphaned reference: ${href}`);
  }

  assert.match(article, /invited me[^.]*maintainers/i);
  assert.match(article, /I use the city to build and repair Gas City itself/i);
  // The first NDI mention is connected on both sides: back to the abandoned
  // fork, forward to the recovery comparison it sets up.
  assert.match(article, /abandoned my ghost town/);
  assert.match(article, /one of the two kinds of recovery this article is about/);
  assert.match(article, /not a replacement for Temporal/i);
  assert.match(article, /described NDI[\s\S]{0,200}completely different machinery/i);
  assert.match(article, /I remember the answer being something like/i);
  assert.match(
    article,
    /So the thing on the laptop at dinner really did become big/i,
  );
  assert.doesNotMatch(
    article,
    /remains of an agent orchestrator and the beginning of Beads/i,
  );
  assert.doesNotMatch(article, /September 2025/i);
  assert.doesNotMatch(article, /building-a-software-factory-06032026/);
});

test("the narrative illustrations sit with the passages they illustrate", () => {
  const article = readFileSync(ARTICLE, "utf8");

  // Each illustration earns its place by landing on a specific beat, so pin the
  // beat rather than just the presence of the component.
  const placements = [
    {
      figure: "<ConspiracyFigure />",
      after: "clues scattered across controller ticks",
      before: "those clues become useless",
    },
    {
      figure: "<CanaryFigure />",
      after: "without producing an `OutcomeReady` envelope",
      before: "rolled the integration back",
    },
  ];
  for (const { figure, after, before } of placements) {
    const at = article.indexOf(figure);
    assert.ok(at > -1, `${figure} must be rendered`);
    assert.ok(
      article.indexOf(after) < at,
      `${figure} must follow the passage it illustrates`,
    );
    assert.ok(
      at < article.indexOf(before),
      `${figure} must precede what comes after that passage`,
    );
  }

  // Every illustration goes through the one shared component, so the blend and
  // caption treatment cannot drift apart between figures.
  for (const file of [OPENING_FIGURE, WORKSHOP_FIGURE, CONSPIRACY_FIGURE, CANARY_FIGURE]) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /import Illustration from "\.\/Illustration\.astro"/);
    assert.match(source, /<Illustration\b/);
    assert.doesNotMatch(
      source,
      /mix-blend-mode|<style/,
      `${file} must inherit the shared compositing treatment`,
    );
    const alt = source.match(/alt="([^"]+)"/);
    assert.ok(alt && alt[1].length >= 80, `${file} needs descriptive alt text`);
  }

  for (const image of [
    "img/reconstructing-the-procedure.png",
    "img/canary-gate-stays-shut.png",
  ]) {
    assert.ok(
      existsSync(path.join(ROOT, "src/components/temporal-agent-orchestration", image)),
      `missing committed illustration: ${image}`,
    );
  }
});

// The workshop metaphor and its illustration left the article when the
// OutcomeReady section was rewritten around the live result path; the
// component and image stay in the repo and keep the shared treatment, which
// the placements test above still verifies.

test("the opening illustration is a committed generated image, accessible, and precedes the SDK map", () => {
  const article = readFileSync(ARTICLE, "utf8");
  const page = readFileSync(PAGE, "utf8");
  const opening = readFileSync(OPENING_FIGURE, "utf8");

  assert.match(article, /import OpeningFigure from "\.\/OpeningFigure\.astro"/);
  assert.match(article, /<OpeningFigure \/>/);
  assert.ok(
    article.indexOf("<OpeningFigure />") <
      article.indexOf('<ConceptFigure kind="ownership" />'),
    "the opening illustration must precede the first technical diagram",
  );

  // The narrative illustrations are generated rasters committed to the repo and
  // served through Astro's asset pipeline, matching the approach used by the
  // published illustrated essays. The technical diagrams stay inline SVG.
  assert.match(opening, /import Illustration from "\.\/Illustration\.astro"/);
  assert.match(opening, /import illustration from "\.\/img\/[\w-]+\.png"/);
  assert.match(opening, /<Illustration\b/);
  assert.match(opening, /src=\{illustration\}/);
  assert.match(opening, /loading="eager"/, "the opening illustration is above the fold");
  assert.ok(
    existsSync(OPENING_ILLUSTRATION),
    `the committed illustration must exist at ${OPENING_ILLUSTRATION}`,
  );
  assert.doesNotMatch(
    opening,
    /<svg/,
    "the opening illustration must not reintroduce the rejected hand-authored SVG",
  );

  const alt = opening.match(/alt="([^"]+)"/);
  assert.ok(alt, "the illustration needs alt text");
  assert.ok(
    alt[1].length >= 80,
    "alt text must describe the scene, not just name it",
  );
  assert.match(alt[1], /terminal/i);
  assert.match(alt[1], /dependency|task card/i);

  assert.equal(
    (article.match(/https:\/\/github\.com\/helloianneo\/ian-xiaohei-illustrations/g) ?? [])
      .length,
    1,
    "the article must carry one bottom credit",
  );
  assert.match(article, /Ian 小黑 illustrations[^\n]*MIT/i);
  assert.doesNotMatch(page, /An agent started\. The coordinator died\. Now what\?/);
});

test("the article teaches the live OutcomeReady loop and states the rollout boundary", () => {
  const article = readFileSync(ARTICLE, "utf8");

  const teachingOrder = [
    "canonical record of mutable work facts",
    "Temporal owns the procedure",
    "## What's running now",
    "The live result path:",
  ];
  let previous = -1;
  for (const marker of teachingOrder) {
    const current = article.indexOf(marker);
    assert.ok(current > previous, `${marker} must appear in teaching order`);
    previous = current;
  }

  // The rollout vocabulary has exactly three states, and the current position
  // is named in them; "canary" alone once did double duty for a continuously
  // enabled path, which made the boundary unreadable.
  assert.match(article, /three rollout states/);
  assert.match(article, /Outcome mode is enabled/);
  assert.match(article, /Beads mode is shadow/);

  // The live result path is enumerated end to end, from the terminal
  // transition through to the acknowledgement receipt that closes it.
  for (const step of [
    /Work reaches an end state in Beads/i,
    /OutcomeReady<\/TermTip> outbox record is written against that work item/i,
    /A stable Workflow starts for that result/i,
    /waits durably and redelivers while acknowledgement is missing/i,
    /Beads stores the exact acknowledgement receipt/i,
  ]) {
    assert.match(article, step);
  }
  // Only the paths Temporal owns get the same-transaction guarantee. Stating it
  // unconditionally would claim full completion coverage with no reconciliation
  // boundary, which the technical handoff lists under "claims not yet supported".
  assert.match(
    article,
    /When Temporal closes the work itself, the close and the record are one transaction/i,
  );
  assert.match(article, /a reconciler notices the end state afterward/i);
  assert.match(
    article,
    /reconciliation boundary, not a same-transaction guarantee/i,
  );
  assert.match(article, /Results remain pending until that final receipt exists/i);
  // The scan covers terminal OR verified work; "finalized" reads narrower than
  // the code, since "verified" deliberately leaves the source root open.
  assert.match(
    article,
    /watchdog also scans every store for finished or verified work with no outcome/i,
  );
  assert.match(article, /watchdog deliberately sits outside Temporal/i);
  assert.match(
    article,
    /Temporal cannot claim production work or start a coding agent/i,
    "the live boundary must stay narrow enough to not read as a general rollout",
  );
  assert.match(article, /Beads mode is shadow/);

  // The one 40-char hash allowed in the prose surface is the public pinned
  // upstream commit the before excerpts cite; scrub it, then ban the rest.
  const scrubbed = article.replaceAll(
    "b78058917bc65846db89e1c3b25dc17269822483",
    "",
  );
  assert.doesNotMatch(scrubbed, /\b[0-9a-f]{40}\b/i);
  assert.doesNotMatch(
    article,
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
  );
  assert.doesNotMatch(article, /\b(?:dr|sjai|gc)-[a-z0-9.]+\b/i);
  assert.doesNotMatch(article, /\boutcome-[a-f0-9]+\b|\bcycle-[0-9]+\b/i);
  assert.doesNotMatch(article, /\/home\//i);
});

test("the essay shows versioned pre-Temporal code excerpts with provenance", () => {
  const reader = readFileSync(READER, "utf8");
  const samples = readFileSync(SAMPLES, "utf8");

  for (const filename of [
    "city_runtime_excerpt.go",
    "session_recovery_excerpt.go",
  ]) {
    assert.match(samples, new RegExp(filename.replaceAll(".", "\\.")));
    assert.equal(
      existsSync(
        path.join(
          ROOT,
          "public/temporal-agent-orchestration/code/before",
          filename,
        ),
      ),
      true,
      filename,
    );
  }

  assert.match(samples, /b78058917bc65846db89e1c3b25dc17269822483/);
  assert.match(samples, /cmd\/gc\/city_runtime\.go/);
  assert.match(samples, /cmd\/gc\/session_beads\.go/);
  assert.match(reader, /mode === "before"/);
  assert.match(reader, /Before Temporal/);
  assert.match(reader, /Versioned before code/);
  assert.match(reader, /sample\.sourceUrl/);
  assert.match(reader, /View original source/);
  assert.match(reader, /These selected excerpts are abridged for reading/);
});

test("the essay embeds syntax-colored Go source with selectable explanations", () => {
  assert.equal(existsSync(READER), true);
  assert.equal(existsSync(SAMPLES), true);

  const reader = readFileSync(READER, "utf8");
  const samples = readFileSync(SAMPLES, "utf8");

  for (const filename of [
    "bridge.go",
    "workflow.go",
    "activity.go",
    "command_agent_executor.go",
    "outcome_workflow.go",
    "workers.go",
  ]) {
    assert.match(samples, new RegExp(filename.replaceAll(".", "\\.")));
    assert.equal(
      existsSync(
        path.join(
          ROOT,
          "public/temporal-agent-orchestration/code",
          filename,
        ),
      ),
      true,
      filename,
    );
  }

  assert.match(reader, /codeToHtml/);
  assert.match(reader, /lang: "go"/);
  assert.match(reader, /one-light/);
  assert.match(reader, /one-dark-pro/);
  assert.match(reader, /data-code-file/);
  assert.match(reader, /data-code-section/);
  assert.match(reader, /role="button"/);
  assert.match(reader, /tabindex="0"/);
  assert.match(reader, /aria-expanded="false"/);
  assert.match(reader, /What this section does/);
  assert.match(reader, /Why it matters for Temporal/);
  assert.match(reader, /event\.key === "Enter"/);
  assert.match(reader, /event\.key === " "/);
  assert.match(reader, /data-code-inspector/);
  assert.match(reader, /data-code-explanation/);
  assert.match(reader, /explanation\.hidden = explanation !== selected/);
  assert.match(reader, /href=\{sample\.rawPath\}/);
  assert.match(reader, /download=\{sample\.filename\}/);
});

test("the after-code reader distinguishes reviewed source from live promotion", () => {
  const reader = readFileSync(READER, "utf8");
  const samples = readFileSync(SAMPLES, "utf8");

  // Provenance is described in prose, not pinned to commit hashes: the
  // implementation repo has no public remote, so those hashes rendered as
  // citations no reader could resolve. See the leakage guard at end of file.
  assert.match(samples, /bounded bead-to-agent canary/i);
  assert.match(samples, /promotionStatus:/);
  assert.match(samples, /full-integration canary[^.]*failed/i);
  assert.match(reader, /sample\.revision/);
  assert.match(reader, /sample\.promotionStatus/);
  assert.match(
    reader,
    /Source review and production activation\s+have separate evidence/,
  );
});

test("the article keeps the failure, the repair, and the containment boundary", () => {
  const article = readFileSync(ARTICLE, "utf8");
  const reader = readFileSync(READER, "utf8");
  const samples = readFileSync(SAMPLES, "utf8");

  // The article is a talk, not an incident report, so per-canary chronology
  // (counts, cycles, rollback timers, finalization receipts) lives with the
  // code samples and the engineering record rather than the reader-facing
  // prose. What must survive here is the shape of the evidence: the promotion
  // gate FAILED, it was repaired, the rerun succeeded, and the live boundary is
  // stated narrowly enough that nobody reads it as a general rollout.
  const articleStages = ["failed promotion gate", "repaired the delivery path"];
  let previous = -1;
  for (const stage of articleStages) {
    const current = article.toLowerCase().indexOf(stage);
    assert.ok(current > previous, `${stage} must appear in evidence order`);
    previous = current;
  }

  // The per-canary chronology moved out of the prose but must still be
  // recoverable: it lives in the code samples' evidence trail, where a reader
  // who wants the receipts can follow them without the talk carrying them.
  const stages = [
    "Failed promotion gate",
    "Notifier repair",
    "Successful bounded canary",
    "Nine outcomes acknowledged",
    "Returned to shadow",
  ];

  // The four findings from the failed gate. The technical handoff is explicit
  // that this failure is part of the result and may not be softened.
  assert.match(article, /contended on a shared mail store/i);
  assert.match(article, /named a Workflow that did not exist/i);
  assert.match(article, /formula step with its still-running source task/i);
  assert.match(
    article,
    /legitimate completion paths closed real work without producing an[\s\S]{0,400}?OutcomeReady<\/TermTip> envelope at all/i,
  );

  assert.match(
    article,
    /durable delivery and acknowledgement of finished results/i,
  );
  assert.match(
    article,
    /Temporal cannot claim production work or start a coding agent/i,
    "the live boundary must stay narrow enough to not read as a general rollout",
  );
  assert.match(article, /Beads mode is shadow/);
  assert.match(
    article,
    /It does not make external effects happen exactly once/i,
    "the article must not imply Activities run exactly once",
  );
  assert.doesNotMatch(article, /general production activation remains off/i);
  assert.doesNotMatch(article, /General activation still requires separate approval/i);
  assert.doesNotMatch(
    article,
    /Production activation still requires[^.]*structured inspection/i,
  );
  assert.doesNotMatch(
    article,
    /temporal-ops/i,
    "the essay no longer describes the undeployed operator CLI; if it returns, it must be labelled undeployed",
  );
  assert.doesNotMatch(article, /c7343188740c9d5f9ada2aa73ab9ef339d1dd927/);
  assert.doesNotMatch(article, /history-limit=0/);
  assert.doesNotMatch(article, /reject closed exact runs/i);
  assert.doesNotMatch(article, /two P2 findings/i);
  assert.doesNotMatch(article, /2c35746ab1b520a1d949cd2b73891a8500510332/);
  assert.doesNotMatch(article, /test-first review and repair cycle continues/i);
  assert.doesNotMatch(
    article,
    /remaining repair work[\s\S]*canary must run again before activation/i,
  );

  assert.match(samples, /evidenceTrail\?:/);
  for (const stage of stages) {
    assert.match(samples, new RegExp(stage));
  }
  assert.match(samples, /Bounded finalization/);
  const finalStages = [
    "Bounded finalization",
    "Exact-five producer canary",
    "Atomic finalization",
    "Continuous OutcomeReady activation",
    "Production receipts verified",
    "Postconditions held",
  ];
  previous = -1;
  for (const stage of finalStages) {
    const current = samples.indexOf(stage);
    assert.ok(current > previous, `${stage} must appear in evidence order`);
    previous = current;
  }
  // Each stage must still carry its substance. These assertions used to pin the
  // bead IDs, outcome IDs, PID and commit hashes instead, which is how the
  // evidence trail leaked all of them onto the rendered page while the prose
  // stayed clean. Assert what the stage SAYS, never the identifiers it names.
  assert.match(samples, /atomic receipt while preserving its acknowledged outbox/i);
  assert.match(samples, /five authorized transitions/i);
  assert.match(samples, /without creating another outcome generation/i);
  assert.match(samples, /agent mutation still in shadow/i);
  assert.match(
    samples,
    /acknowledged on their first cycle under a single coordinator fence/i,
  );
  assert.match(samples, /durably excluded as a non-outcome/i);
  assert.match(samples, /all-store health surface stayed empty/i);
  assert.match(reader, /sample\.evidenceTrail/);
  assert.match(reader, /aria-label="Canary evidence trail"/);
  assert.match(reader, /annotated-code__evidence/);
});

test("selected code explanations open in a right-hand inspector on wide screens", () => {
  const reader = readFileSync(READER, "utf8");

  assert.match(reader, /annotated-code__stage/);
  assert.match(
    reader,
    /\.annotated-code__stage\[data-inspector-open="true"\][\s\S]*grid-template-columns:[\s\S]*minmax\(18rem, 0\.8fr\)/,
  );
  assert.match(reader, /\.annotated-code__inspector[\s\S]*position: sticky/);
  assert.match(reader, /dataset\.inspectorOpen = String/);
  assert.match(
    reader,
    /@media \(max-width: 900px\)[\s\S]*\.annotated-code__stage\[data-inspector-open="true"\][\s\S]*grid-template-columns: minmax\(0, 1fr\)/,
  );
});

test("every embedded source file is completely and contiguously annotated", async () => {
  const moduleText = readFileSync(SAMPLES, "utf8");
  assert.match(moduleText, /Non-contiguous annotations/);
  assert.match(moduleText, /annotations end at/);

  const reader = readFileSync(READER, "utf8");
  assert.match(reader, /lines\.slice\(section\.start - 1, section\.end\)/);
  assert.match(reader, /set:html=\{section\.html\}/);
});

test("the embedded reader retains the established responsive and accessible treatment", () => {
  const reader = readFileSync(READER, "utf8");
  const page = readFileSync(PAGE, "utf8");

  assert.match(reader, /@media \(max-width: 800px\)/);
  assert.match(reader, /@media \(max-width: 520px\)/);
  assert.match(reader, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(reader, /focus-visible/);
  assert.match(reader, /color: var\(--shiki-dark\) !important/);
  assert.match(reader, /font-style: var\(--shiki-dark-font-style, inherit\)/);
  assert.match(page, /width: min\(100% - 2 \* var\(--space-m\), 78rem\)/);
  assert.match(page, /max-width: var\(--measure\)/);
});

test("each full file starts as a bounded preview and can expand or collapse", () => {
  const reader = readFileSync(READER, "utf8");

  assert.match(reader, /data-file-expanded="false"/);
  assert.match(reader, /data-file-toggle/);
  assert.match(reader, /Show full file/);
  assert.match(reader, /Collapse file/);
  assert.match(reader, /aria-expanded="false"/);
  assert.match(reader, /panel\.dataset\.fileExpanded = String\(expanded\)/);
  assert.doesNotMatch(reader, /setFileExpanded\(panel, true\)/);
  assert.match(
    reader,
    /\.annotated-code__panel\[data-file-expanded="false"\][\s\S]*\.annotated-code__file-frame[\s\S]*max-height: 24rem[\s\S]*overflow: hidden/,
  );
});

test("long source lines wrap inside the article instead of widening the page", () => {
  const reader = readFileSync(READER, "utf8");
  const page = readFileSync(PAGE, "utf8");

  assert.match(
    reader,
    /\.annotated-code \{[\s\S]*width: 100%[\s\S]*max-width: 78rem/,
  );
  assert.match(page, /\.temporal-agent-article__body \{[\s\S]*max-width: none/);
  assert.match(reader, /\.annotated-code__panel[\s\S]*min-width: 0/);
  assert.match(reader, /\.annotated-code__source[\s\S]*overflow-x: hidden/);
  assert.match(
    reader,
    /\.annotated-code__source :global\(\.line\)[\s\S]*white-space: pre-wrap[\s\S]*overflow-wrap: anywhere/,
  );
  assert.doesNotMatch(reader, /min-width: max-content/);
  assert.doesNotMatch(reader, /translateX\(-50%\)/);
});

test("the essay teaches the orchestrator, ownership boundary, and recovery path visually", () => {
  assert.equal(existsSync(FIGURES), true);

  const article = readFileSync(ARTICLE, "utf8");
  const figures = readFileSync(FIGURES, "utf8");

  assert.match(article, /import ConceptFigure from "\.\/ConceptFigure\.astro"/);
  // The article keeps three diagrams: the ownership boundary, the recovery
  // invariant, and the shadow wall. The wider set still lives in the shared
  // component for other surfaces.
  const readingOrder = ["ownership", "recovery", "shadow"];
  let seen = -1;
  for (const kind of readingOrder) {
    const at = article.indexOf(`<ConceptFigure kind="${kind}"`);
    assert.ok(at > -1, `<ConceptFigure kind="${kind}" /> must be rendered`);
    assert.ok(at > seen, `${kind} must appear in reading order`);
    seen = at;
  }

  // The ownership model is explained once, in prose; the diagram caption adds
  // only the bidirectional fencing detail rather than restating the owners.
  // The third owner is the application, not Activities: an Activity is a
  // Temporal primitive whose lifecycle Temporal owns, so naming it a peer of
  // Temporal would misstate the platform to the readers most likely to notice.
  for (const owner of [
    /Beads owns the work state/,
    /Temporal owns the procedure/,
    /The application owns the effects/,
  ]) {
    assert.match(article, owner);
  }
  assert.doesNotMatch(
    article,
    /\*\*Activities own effects\*\*/,
    "Activities are a Temporal primitive, not a peer owner of Temporal",
  );
  const ownershipCaption = figures.slice(
    figures.indexOf('kind === "ownership"'),
    figures.indexOf('kind === "recovery"'),
  );
  assert.match(
    ownershipCaption,
    /<figcaption class="figure-caption">\s*Fenced completion checks travel both ways/,
    "the ownership caption must add the fencing detail, not restate the owners",
  );
  assert.match(figures, /Gas City SDK: one operating system for agent work/);
  for (const component of [
    "Rigs",
    "Agent templates",
    "Named sessions",
    "Formula",
    "Work record",
    "Dispatchers and hooks",
    "Session pools",
    "Agent sessions",
    "reviews and gates",
    "Repair + reapers",
  ]) {
    assert.match(figures, new RegExp(component.replace("+", "\\+")));
  }
  const coreMap = figures.slice(
    figures.indexOf('kind === "orchestrator"'),
    figures.indexOf('kind === "workshop"'),
  );
  assert.doesNotMatch(coreMap, /Project Leads?|Mayor/);
  assert.match(figures, /aria-label="Gas City SDK components"/);
  assert.match(figures, /Who owns what/);
  assert.match(figures, /One agent session survives Worker loss/);
  // Every diagram carries the same accessibility scaffolding, so assert parity
  // against the number of diagrams rather than a number that goes stale each
  // time one is added.
  const diagramCount = (figures.match(/kind === "/g) ?? []).length;
  assert.ok(diagramCount >= 7, `expected at least 7 diagrams, found ${diagramCount}`);
  for (const [what, pattern] of [
    ["figcaption", /<figcaption class="figure-caption">/g],
    ["svg", /<svg/g],
    ["title", /<title id=/g],
    ["desc", /<desc id=/g],
    ["viewBox", /viewBox=/g],
  ]) {
    assert.equal(
      (figures.match(pattern) ?? []).length,
      diagramCount,
      `every diagram needs exactly one ${what}`,
    );
  }
  assert.doesNotMatch(figures, /<figcaption>/);
  assert.match(figures, /aria-labelledby=\{titleId\}/);
  assert.match(figures, /currentColor/);
  assert.match(figures, /var\(--color-accent\)/);
  assert.match(figures, /concept-figure__svg/);
  assert.match(figures, /@media \(max-width: 720px\)/);
  assert.match(figures, /@media \(max-width: 720px\)[\s\S]*\.concept-figure__fallback/);
  assert.match(figures, /min-width: 0/);
  assert.doesNotMatch(figures, /overflow-x: auto/);
  assert.doesNotMatch(figures, /<div class="(?:orchestrator|ownership|recovery)-map/);
});

test("the diagrams share one visual-grammar legend", () => {
  const figures = readFileSync(FIGURES, "utf8");
  // The brief's legend: double outline = durable record, bolt on an edge =
  // crash window, translucent barrier = shadow mode, broken edge = failed
  // integration contract, hourglass = durable wait, lock = identity fence.
  for (const cls of [
    "svg-box--durable",
    "svg-durable-inner",
    "svg-box--muted",
    "svg-lane",
    "svg-bolt",
    "svg-barrier",
    "svg-hourglass",
    "svg-fence",
    "svg-link--broken",
    "svg-ack",
  ]) {
    assert.match(
      figures,
      new RegExp(`\\.${cls}\\s*\\{`),
      `the visual grammar must style .${cls}`,
    );
  }
  // The failure grammar colors edges, never fills a component with a
  // hardcoded red; everything routes through the theme's accent.
  assert.match(figures, /\.svg-link--broken\s*\{[\s\S]*?var\(--color-accent\)/);
  assert.match(figures, /\.svg-bolt\s*\{[\s\S]*?var\(--color-accent\)/);
});

test("every figure uses the shared, theme-aware semantic caption treatment", () => {
  const illustration = readFileSync(ILLUSTRATION, "utf8");
  const figures = readFileSync(FIGURES, "utf8");
  const tokens = readFileSync(TOKENS, "utf8");

  // The caption contract is shared by every figure, raster or vector. Rasters
  // get it from the one Illustration component; the SVG diagrams define it.
  for (const source of [illustration, figures]) {
    assert.match(source, /<figcaption class="figure-caption">/);
    assert.match(
      source,
      /\.figure-caption\s*\{[\s\S]*font-size:\s*(?:var\(--step--1\)|0\.9rem)/,
    );
    assert.match(source, /\.figure-caption\s*\{[\s\S]*color:\s*var\(--color-text-(?:muted|secondary)\)/);
    assert.match(source, /\.figure-caption\s*\{[\s\S]*line-height:\s*(?:1\.[34]|var\(--leading-tight\))/);
    assert.match(source, /\.figure-caption\s*\{[\s\S]*max-width:\s*var\(--measure\)/);
    assert.match(source, /\.figure-caption\s*\{[\s\S]*margin-(?:block-start|top):/);
    assert.match(source, /\.figure-caption\s*\{[\s\S]*text-align:/);
  }

  // The inline SVG diagrams follow the theme through currentColor. The raster
  // illustration cannot, so it is composited into the page instead: multiply
  // drops its white paper in the light theme, and invert + screen drops the
  // paper and lifts the ink in the dark theme. Neither may hardcode a colour.
  assert.match(figures, /currentColor/);
  for (const source of [illustration, figures]) {
    assert.doesNotMatch(source, /#(?:fff(?:fff)?|000(?:000)?)(?:\b|;)/i);
  }
  const shared = readFileSync(ILLUSTRATION, "utf8");
  assert.match(shared, /mix-blend-mode:\s*multiply/);
  assert.match(
    shared,
    /\[data-theme="dark"\][\s\S]*filter:\s*invert\(1\)\s*hue-rotate\(180deg\)/,
    "the dark theme must invert the illustration so its ink stays visible",
  );
  assert.match(
    shared,
    /\[data-theme="dark"\][\s\S]*mix-blend-mode:\s*screen/,
    "the dark theme must screen away the illustration's baked white paper",
  );
  assert.doesNotMatch(
    shared,
    /\.illustration__image\s*\{[^}]*background:/,
    "the illustration must blend into the page, not sit on its own plate",
  );
  assert.match(shared, /<figcaption class="figure-caption">/);
  assert.match(shared, /widths=\{/, "illustrations need responsive widths");
  assert.match(shared, /sizes="/, "illustrations need a sizes hint");

  assert.match(tokens, /\[data-theme="dark"\]/);
  assert.match(tokens, /\[data-theme="dark"\][\s\S]*--color-bg:/);
  assert.match(tokens, /\[data-theme="dark"\][\s\S]*--color-text:/);
});

test("the SDK diagram gives every long label a measured box and accessible contrast", () => {
  const figures = readFileSync(FIGURES, "utf8");
  const coreMap = figures.slice(
    figures.indexOf('kind === "orchestrator"'),
    figures.indexOf('kind === "workshop"'),
  );

  for (const label of ["Route", "Run", "Verify + record", "Repair + reapers"]) {
    assert.match(
      coreMap,
      new RegExp(`class="svg-labelled-box" data-label="${label.replaceAll("+", "\\+")}"`),
    );
  }
  assert.match(coreMap, /class="svg-label svg-label--wrapped"/);
  assert.match(figures, /\.svg-label\s*\{[\s\S]*font-size:\s*18px/);
  assert.match(
    figures,
    /\.svg-eyebrow\s*\{[^}]*fill:\s*var\(--color-text-secondary\)/,
  );
  assert.doesNotMatch(
    figures,
    /\.svg-eyebrow\s*\{[^}]*fill:\s*var\(--color-accent\)/,
  );
});

test("the essay ends with the decision rule, and the pack idea stays out of the conclusion", () => {
  const article = readFileSync(ARTICLE, "utf8");

  assert.match(article, /Use NDI where any route to an acceptable outcome is valid/i);
  assert.match(
    article,
    /Use deterministic durable replay where the procedure is part of the promise/i,
  );
  assert.match(
    article,
    /A single multi-agent system can, and arguably should, use both/i,
  );
  assert.match(
    article,
    /Use Temporal when losing the in-flight procedure would leave the system unable to say what happened/,
  );
  assert.match(
    article,
    /let the agents be weird, but make the infrastructure keep its promises/,
  );

  // The Gas City pack is a contributor note in the evidence section, not the
  // conclusion: the ending runs division of labor, decision rule, last line.
  const packAt = article.indexOf("natural upstream shape of this integration");
  assert.ok(packAt > -1, "the pack note must survive in the evidence section");
  assert.ok(
    packAt > article.indexOf("## The evidence, and where to go deeper"),
    "the pack note belongs in the evidence section, after the conclusion",
  );
  assert.ok(
    article.indexOf("Temporal supplies durable procedure.") <
      article.indexOf("Use Temporal when losing the in-flight procedure"),
    "the conclusion must run straight from the division of labor to the rule",
  );
});

// The reader-facing surface must never carry internal provenance: commit hashes,
// bead IDs, outcome/cycle/mail IDs, or host process details. This guard covers
// every input that reaches the rendered page, not just Article.mdx — the evidence
// trail in the code-samples data leaked all of the above while the prose was clean.
test("no internal identifiers reach the reader-facing surface", () => {
  // Two hashes are allowed to appear: the public gastownhall/gascity commit
  // the "before" excerpts cite, and the demo's own published revision, which
  // provenance.json names on purpose so a reader can re-run the recordings.
  // The latter is read from provenance rather than pinned, so re-recording the
  // demo does not turn deliberate provenance into a reported leak.
  const PUBLIC_UPSTREAM_COMMIT = "b78058917bc65846db89e1c3b25dc17269822483";
  const provenancePath = path.join(
    ROOT,
    "public/temporal-agent-orchestration/demo/artifacts/provenance.json",
  );
  const allowedHashes = new Set([PUBLIC_UPSTREAM_COMMIT]);
  if (existsSync(provenancePath)) {
    const provenance = JSON.parse(readFileSync(provenancePath, "utf8"));
    if (typeof provenance.service_revision_full === "string") {
      allowedHashes.add(provenance.service_revision_full);
    }
  }

  const forbidden = [
    { name: "40-char commit hash", re: /\b[0-9a-f]{40}\b/g },
    { name: "bead ID", re: /\b(?:dr|sjai|gc)-[0-9a-z]{3,}(?:\.[0-9]+)?\b/g },
    { name: "outcome ID", re: /\boutcome-[0-9a-f]{32}\b/g },
    { name: "cycle ID", re: /\bcycle-[0-9]{3,}\b/g },
    { name: "process detail", re: /\bPID\s+[0-9]{4,}|\bNRestarts=/g },
  ];

  const codeDir = path.join(ROOT, "public/temporal-agent-orchestration/code");
  const goSamples = existsSync(codeDir)
    ? readdirSync(codeDir, { recursive: true, withFileTypes: true })
        .filter((e) => e.isFile() && e.name.endsWith(".go"))
        .map((e) => path.join(e.parentPath ?? e.path, e.name))
    : [];
  // The built pages are the authoritative surface; checked only when a build
  // exists so this still runs standalone, and it always runs in CI where build
  // precedes test. Every page in the route family is scanned: the companion
  // page, the article, and the code browser.
  const builtRouteDir = path.join(ROOT, "dist/temporal-agent-orchestration");
  const builtPages = existsSync(builtRouteDir)
    ? readdirSync(builtRouteDir, { recursive: true, withFileTypes: true })
        .filter((e) => e.isFile() && e.name.endsWith(".html"))
        .map((e) => path.join(e.parentPath ?? e.path, e.name))
    : [];

  // The published run evidence is a reader-facing surface like any page:
  // downloadable text and JSON, scanned in full.
  const evidenceDir = path.join(
    ROOT,
    "public/temporal-agent-orchestration/demo/artifacts",
  );
  const publishedEvidence = existsSync(evidenceDir)
    ? readdirSync(evidenceDir, { recursive: true, withFileTypes: true })
        .filter((e) => e.isFile())
        .map((e) => path.join(e.parentPath ?? e.path, e.name))
    : [];

  const companionPage = path.join(
    ROOT,
    "src/pages/temporal-agent-orchestration/index.astro",
  );
  const surfaces = [
    ARTICLE,
    FIGURES,
    READER,
    SAMPLES,
    CANARY_FIGURE,
    CONSPIRACY_FIGURE,
    OPENING_FIGURE,
    WORKSHOP_FIGURE,
    ILLUSTRATION,
    companionPage,
    path.join(ROOT, "public/temporal-agent-orchestration/demo/worker-kill.cast"),
    path.join(
      ROOT,
      "public/temporal-agent-orchestration/demo/before-temporal.cast",
    ),
    ...publishedEvidence,
    ...goSamples,
    ...builtPages,
  ];

  const findings = [];
  for (const file of surfaces) {
    const text = readFileSync(file, "utf8");
    for (const { name, re } of forbidden) {
      for (const hit of text.match(re) ?? []) {
        if (allowedHashes.has(hit)) continue;
        findings.push(`${path.relative(ROOT, file)}: ${name} "${hit}"`);
      }
    }
  }
  assert.deepEqual(
    [...new Set(findings)],
    [],
    "internal identifiers must not reach the reader",
  );
});

// The before/after code is the article's evidence, so the annotations must stay
// pinned to the code they describe. Section ranges are line numbers: rewriting an
// excerpt silently slides every annotation onto the wrong lines, and nothing else
// in the suite would notice.
test("before-code excerpts are honestly labelled and fully annotated", () => {
  const samples = readFileSync(SAMPLES, "utf8");
  const beforeDir = path.join(
    ROOT,
    "public/temporal-agent-orchestration/code/before",
  );

  for (const [, filename, body] of samples.matchAll(
    /filename:\s*"([^"]+\.go)"[\s\S]*?sections:\s*\[([\s\S]*?)\n {6}\],/g,
  )) {
    const file = path.join(beforeDir, filename);
    if (!existsSync(file)) continue;
    const text = readFileSync(file, "utf8");
    const lineCount = text.split("\n").length - 1;

    // An abridged excerpt must say so. "Selected production excerpt" once sat
    // atop code with substituted arguments and renamed locals.
    assert.match(
      text,
      /^\/\/ Abridged from cmd\/gc\/\S+ for reading; not the exact source\./m,
      `${filename} must declare that it is abridged, not exact`,
    );
    assert.match(
      text,
      /every omission\s+\/\/ is marked|and every omission is marked/,
      `${filename} must promise that omissions are marked`,
    );

    const ranges = [...body.matchAll(/start:\s*(\d+),\s*end:\s*(\d+)/g)].map(
      (m) => [Number(m[1]), Number(m[2])],
    );
    assert.ok(ranges.length > 0, `${filename} must have annotated sections`);

    let previousEnd = 0;
    for (const [start, end] of ranges) {
      assert.equal(
        start,
        previousEnd + 1,
        `${filename}: sections must tile without gaps or overlaps`,
      );
      assert.ok(end >= start, `${filename}: section end must follow its start`);
      previousEnd = end;
    }
    assert.equal(
      previousEnd,
      lineCount,
      `${filename}: sections must cover the file through its last line`,
    );
  }
});

// The demo reviewer's checklist: before pressing play a reader must know which
// process dies, which survives, why the old system duplicates, what to watch,
// and why the pre-checkpoint kill is the decisive case. These pins hold that
// guidance in place on the article's own demo passage.
test("the article's demo passage tells the viewer what dies and what to watch", () => {
  const article = readFileSync(ARTICLE, "utf8");

  assert.match(
    article,
    /The kill targets the orchestration Worker, not the coding agent/,
  );
  assert.match(article, /attaches to that same agent or launches another one/);
  // "Signal" alone reads as a Temporal Signal; the kill is an OS signal.
  assert.match(article, /operating-system kill signal/);
  assert.doesNotMatch(article, /with a real signal[^-]/);

  // The recording keeps real timing; the detection pause carries a status
  // note so it reads as evidence rather than a stall.
  assert.match(article, /notes=\{\{/);
  assert.match(article, /waiting out the heartbeat timeout/i);
  assert.match(article, /The retry has to ask the resolver again/);

  // The download offers a playable video; the .cast stays available as the
  // raw event log, honestly labelled.
  assert.match(article, /worker-kill\.mp4/);
  assert.match(article, /raw asciinema event log/);
  assert.equal(
    existsSync(
      path.join(ROOT, "public/temporal-agent-orchestration/demo/worker-kill.mp4"),
    ),
    true,
    "the rendered video must ship with the site",
  );

  // Arm 2 remains the decisive claim.
  assert.match(article, /The second case is the more important test/);
});

// The evidence-scope revision (2026-08-02): two external reviews agreed the
// reasoning held but pressed on evidence scope. These pins hold the answers in
// place: the resolver's real status, the after-numbers
// separated, the versioning record, workflow lifecycle, the counterfactual,
// and cross-host recovery. Each anchor is a claim that was verified against
// the gas-city tree and the metrics baseline before it was written; if one
// fails, the prose has drifted from the evidence, not just from the wording.
test("the article answers the evidence-scope review with verified claims", () => {
  const article = readFileSync(ARTICLE, "utf8");

  // The resolver's implementation status is stated as the reader's homework:
  // the production adapter is unwritten, the contract is theirs to implement,
  // and the claims rest on fence + protocol.
  assert.match(article, /### The resolver: the part you will have to build/);
  assert.match(article, /that interface is yours to implement/);
  assert.match(article, /everything that has answered the call so far is a fixture/);
  assert.match(article, /when the recorded session's process is dead/);
  // The canary's agent side was a scripted stand-in — in the status table and
  // in the failure-1 evidence line both.
  assert.match(article, /scripted stand-in answering the agent side/);

  // The demo's arm-1 blind spot is volunteered before a reader finds it.
  assert.match(article, /only arm that can catch a broken resolver/);

  // The counterfactual is confronted: fencing concession, the by-hand cost,
  // and the fair-baseline answer.
  assert.match(article, /The two layers solve different problems/);
  assert.match(article, /a query, not a memory/);
  assert.match(article, /243 lines of Bash/);
  assert.match(article, /another reliability system, including its recovery rules, failure cases, monitoring, and debugging/);
  assert.match(article, /grown one repair at a time/);
  // Standing editorial ban: the piece states its claims, it does not narrate
  // how modest they are. "the narrower claim" / "my claim is narrower" kept
  // creeping back across revisions.
  assert.doesNotMatch(
    article,
    /narrower claim|claim is narrower|was narrower/i,
    "state the claim directly instead of announcing that it is narrow",
  );

  // Evidence section: the live path's result is stated at its real size, the
  // repair jobs are reported as still in production, the comparison is
  // withheld until the claim-to-session path owns production, and the
  // infrastructure cost is given as measured while latency is not.
  assert.match(article, /## What the evidence shows so far/);
  assert.match(article, /old reconciler and its repair jobs remain in production/);
  assert.match(article, /delivered and acknowledged more than seventy outcomes/);
  assert.match(
    article,
    /It does not yet show that Temporal has reduced stranded claims or duplicate sessions/,
  );
  assert.match(
    article,
    /become valid only after the claim-to-session path takes production ownership/,
  );
  assert.match(article, /260 MB of memory for the Temporal server/);
  assert.match(article, /have not yet measured the added per-claim latency/);

  // Versioning: three GetVersion patches, unversioned Workers, and the gate's
  // record stated exactly — no real catch yet, both real defects found by
  // review.
  assert.match(article, /caught by code review instead/);
  assert.match(article, /never caught a real nondeterministic change/);
  assert.match(article, /plan for both layers/);
  assert.match(article, /stranded across a history rollover/);

  // Lifecycle: bounded episode history, Continue-As-New with the boundary-ack
  // pin, and the unacknowledged outcome answered head-on.
  assert.match(article, /scoped to one execution episode/);
  assert.match(article, /exactly at the rollover boundary/);
  assert.match(article, /it redelivers, indefinitely/);
  assert.match(article, /nagging line in a report rather than a silent immortal process/);

  // Cross-host: unproven versus out of reach, answered in the design record's
  // own sentence.
  assert.match(article, /unproven rather than architecturally out of reach/);
  assert.match(
    article,
    /Same-host Worker recovery is supported; cross-host recovery is not established/,
  );

  // The ordering that makes the argument land: the resolver status comes
  // after the code excerpts it qualifies, and the numbers section sits between
  // the rollout state and the costs discussion.
  assert.ok(
    article.indexOf("owns the fenced claim and the start-or-attach decision") <
      article.indexOf("### The resolver: the part you will have to build"),
    "the resolver status must follow the code it qualifies",
  );
  assert.ok(
    article.indexOf("## What the evidence shows so far") <
      article.indexOf("## What Temporal did not solve, and what it cost"),
    "the evidence section must precede the costs section",
  );
});
