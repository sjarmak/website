import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMPANION = path.join(
  ROOT,
  "src/pages/temporal-agent-orchestration/index.astro",
);
const ARTICLE_PAGE = path.join(
  ROOT,
  "src/pages/temporal-agent-orchestration/article.astro",
);
const CODE_INDEX = path.join(
  ROOT,
  "src/pages/temporal-agent-orchestration/code/index.astro",
);
const CODE_READER = path.join(
  ROOT,
  "src/pages/temporal-agent-orchestration/code/[slug].astro",
);
const CAST = path.join(
  ROOT,
  "public/temporal-agent-orchestration/demo/worker-kill.cast",
);
const BEFORE_CAST = path.join(
  ROOT,
  "public/temporal-agent-orchestration/demo/before-temporal.cast",
);
const UI_RECORD = path.join(
  ROOT,
  "public/temporal-agent-orchestration/demo/ui-event-history-pre-checkpoint.webp",
);
const EVIDENCE_DIR = path.join(
  ROOT,
  "public/temporal-agent-orchestration/demo/artifacts",
);
const GLOSSARY = path.join(
  ROOT,
  "src/components/temporal-agent-orchestration/Glossary.astro",
);
const TERMTIP = path.join(
  ROOT,
  "src/components/temporal-agent-orchestration/TermTip.astro",
);

test("the companion page is the route's front door and the article moved beside it", () => {
  assert.equal(existsSync(COMPANION), true);
  assert.equal(existsSync(ARTICLE_PAGE), true);

  const companion = readFileSync(COMPANION, "utf8");
  const articlePage = readFileSync(ARTICLE_PAGE, "utf8");

  // The article kept its treatment; only its route changed.
  assert.match(articlePage, /<Article \/>/);
  assert.match(articlePage, /noindex=\{true\}/);

  // The companion links to both deeper surfaces and stays out of the index.
  assert.match(companion, /noindex=\{true\}/);
  assert.match(companion, /\/temporal-agent-orchestration";/);
  assert.match(companion, /\$\{root\}\/article/);
  assert.match(companion, /\$\{root\}\/code/);
});

test("the companion opens with the reviewer's four-line problem and the boundary sentence", () => {
  const companion = readFileSync(COMPANION, "utf8");

  const opening = [
    "An agent is editing code.",
    "crashes before recording",
    "The task record survives.",
    "The procedure does not.",
    "durable without making the agent",
  ];
  let previous = -1;
  for (const marker of opening) {
    const current = companion.indexOf(marker);
    assert.ok(current > previous, `${marker} must appear in opening order`);
    previous = current;
  }

  assert.match(companion, /Put the unpredictable agent inside an\s+Activity/);
  assert.match(companion, /Put the promises\s+around it in a Workflow/);

  // The three questions a restart could not answer.
  assert.match(companion, /Did this claim already start an agent\?/);
  assert.match(companion, /current attempt or a stale one\?/);
  assert.match(companion, /acknowledged this exact outcome\?/);
});

test("the companion declares the canonical unit with both halves of the status adjacent", () => {
  const companion = readFileSync(COMPANION, "utf8");
  const flat = companion.replace(/\s+/g, " ");

  // The unit is translated before it is named: plain words first, then the
  // generation fence as the technical name for the receipt guard.
  assert.ok(
    flat.includes(
      "one ready task becoming one agent execution and one receipt that only the current attempt can submit",
    ),
    "the unit must be stated in translated form",
  );
  assert.ok(
    flat.includes("The guard on that receipt is called a generation fence"),
    "the generation fence must be named after the translation, not before",
  );
  assert.match(companion, /CityRuntime\.beadReconcileTick/);
  assert.match(companion, /BeadOrchestrationWorkflow/);
  assert.match(companion, /ExecuteBeadActivity/);
  assert.match(companion, /gascity-bead-orchestration/);
  assert.match(companion, /gascity-agent-work/);

  // Separate Task Queues permit later isolation; they do not prove the current
  // deployment scales the workloads independently.
  assert.ok(
    flat.includes(
      "so orchestration and agent execution can later be isolated or scaled independently",
    ),
    "the Task Queue claim must stay a later-capability claim, not a deployed one",
  );

  // Status precision: the canary/shadow half and the continuous-production
  // half must sit together. Stating either alone is the diffuseness the
  // reviewer flagged.
  const canaryHalf = flat.indexOf("proved by a bounded canary");
  const continuousHalf = flat.indexOf(
    "running continuously in production is result delivery and acknowledgement",
  );
  assert.ok(canaryHalf > -1, "the canary/shadow half must be stated");
  assert.ok(continuousHalf > -1, "the continuous-production half must be stated");
  assert.ok(
    Math.abs(continuousHalf - canaryHalf) < 400,
    "the two status halves must be stated in the same breath",
  );

  assert.doesNotMatch(companion, /general rollout|exactly[- ]once Activities/i);
});

test("the worker-kill recording is embedded faithfully, with arm 2 carrying the claim", () => {
  assert.equal(existsSync(CAST), true, "the cast must ship with the site");
  const companion = readFileSync(COMPANION, "utf8");

  assert.match(companion, /asciinema-player/);
  assert.match(companion, /worker-kill\.cast/);

  // The demo carries its own falsifiability: the before-world recording, the
  // Web UI's event history, and the downloadable evidence both gates wrote.
  assert.equal(
    existsSync(BEFORE_CAST),
    true,
    "the before-Temporal cast must ship with the site",
  );
  assert.equal(
    existsSync(UI_RECORD),
    true,
    "the masked Web UI record must ship with the site",
  );
  assert.match(companion, /before-temporal\.cast/);
  assert.match(companion, /before-temporal-player/);
  assert.match(companion, /ui-event-history-pre-checkpoint\.webp/);
  assert.match(companion, /masked before capture/);
  for (const artifact of [
    "provenance.json",
    "worker-kill/verify-report.txt",
    "worker-kill/pre-checkpoint/retry-gap.jsonl",
    "before-temporal/verify-report.txt",
    "before-temporal/work.json",
  ]) {
    assert.equal(
      existsSync(path.join(EVIDENCE_DIR, artifact)),
      true,
      `${artifact} must ship with the site`,
    );
    assert.ok(
      companion.includes(artifact),
      `the companion must link ${artifact}`,
    );
  }

  // The before-world numbers block states both reproduced failures.
  const flat = companion.replace(/\s+/g, " ");
  assert.ok(
    flat.includes("a second agent launches, two for one task"),
    "the duplicate-launch failure must be stated",
  );
  assert.ok(
    flat.includes("its late receipt overwrites the current one"),
    "the stale-overwrite failure must be stated",
  );

  // The talk cut compresses the 18.2-second detection pause; the page must
  // embed the faithful cast and must not re-compress it in player options.
  assert.doesNotMatch(companion, /worker-kill-talk/);
  assert.doesNotMatch(companion, /worker-kill-faithful\.mp4/);
  assert.doesNotMatch(companion, /idleTimeLimit/);
  assert.doesNotMatch(companion, /speed:/);
  assert.match(companion, /eighteen seconds/);

  // Arm 2 is the only arm that demonstrates duplicate-launch prevention.
  assert.match(companion, /decisive arm/);
  assert.match(companion, /cannot demonstrate duplicate prevention on\s+its own/);
  assert.match(companion, /resolver calls = 2\s+session creations = 1/);
  assert.match(companion, /stale claim token rejected/);
  assert.match(companion, /same Activity identity across attempts/);

  // The heartbeat correction: the resolver, not the heartbeat, prevents a
  // second agent. A Worker can die before the first heartbeat lands. Pin the
  // claim rather than one phrasing of it, so a wording change cannot silently
  // reintroduce the wrong causality that this sentence exists to deny.
  assert.match(
    companion,
    /A heartbeat does not keep a retry from becoming a second agent/,
  );
  assert.match(companion, /before the first heartbeat ever lands/);
  assert.match(companion, /resolver\s+finds the existing session by stable identity/);
  assert.match(companion, /heartbeat only\s+lets the retry resume progress/);
  assert.doesNotMatch(
    companion,
    /heartbeat (?:is what |)(?:keeps|prevents|stops)[^.]*second agent/i,
    "the heartbeat must never be described as what prevents the second launch",
  );

  // The demo's scope is stated rather than implied.
  assert.match(companion, /one host/);
  assert.match(companion, /fixture process in place of a coding agent/);
});

test("the companion splits the evidence three ways and keeps the failure visible", () => {
  const companion = readFileSync(COMPANION, "utf8");
  const flat = companion.replace(/\s+/g, " ");

  const tiers = [
    "Continuous in production",
    "Bounded canary only",
    "Design hypothesis",
  ];
  let previous = -1;
  for (const tier of tiers) {
    const current = companion.indexOf(tier);
    assert.ok(current > previous, `${tier} must appear in evidence order`);
    previous = current;
  }
  assert.match(companion, /returning the worker to\s+shadow/);
  assert.match(companion, /Cross-host recovery/);

  // "Exact acknowledgement" reads as an exactly-once claim the page later
  // denies; the acknowledgement is matched, not the delivery made exact.
  assert.ok(
    flat.includes(
      "an acknowledgement matched to the exact outcome generation and agent session",
    ),
    "the acknowledgement must be described as matched, not exact",
  );
  assert.doesNotMatch(companion, /exact acknowledgement receipt/);

  // The operational status is stated directly, with both rollout switches.
  assert.match(companion, /What runs today/);
  assert.ok(
    flat.includes("Both have independent rollout controls."),
    "the two rollout switches must be stated as independent",
  );

  // Durable wrongness: Temporal retried the wrong envelope; the failure
  // marker sits on the application adapter, never on the Temporal server.
  assert.ok(flat.includes("wrong store identity"));
  assert.ok(flat.includes("every fifteen minutes"));
  assert.ok(flat.includes("failure marker belongs on the adapter"));
  assert.ok(flat.includes("forty-four seconds of synchronous work"));
});

test("the code browser renders every sample from the shared data module", () => {
  assert.equal(existsSync(CODE_INDEX), true);
  assert.equal(existsSync(CODE_READER), true);

  const codeIndex = readFileSync(CODE_INDEX, "utf8");
  const codeReader = readFileSync(CODE_READER, "utf8");

  for (const source of [codeIndex, codeReader]) {
    assert.match(source, /preTemporalAgentOrchestrationCodeSamples/);
    assert.match(source, /temporalAgentOrchestrationCodeSamples/);
    assert.match(source, /noindex=\{true\}/);
  }
  assert.match(codeReader, /getStaticPaths/);

  // The reader keeps the established annotated treatment: keyboard-operable
  // sections, contiguous-annotation validation, and provenance.
  assert.match(codeReader, /role="button"/);
  assert.match(codeReader, /tabindex="0"/);
  assert.match(codeReader, /aria-expanded="false"/);
  assert.match(codeReader, /event\.key === "Enter"/);
  assert.match(codeReader, /Non-contiguous annotations/);
  assert.match(codeReader, /annotations end at/);
  assert.match(codeReader, /sample\.sourceUrl/);
  assert.match(codeReader, /sample\.promotionStatus/);
  assert.match(codeReader, /sample\.revision/);
  assert.match(codeReader, /What this section does/);
  assert.match(codeReader, /Why it matters for Temporal/);
  assert.match(codeReader, /download=\{sample\.filename\}/);
});

test("the glossary groups the vocabulary and both pages render it", () => {
  const glossary = readFileSync(GLOSSARY, "utf8");
  const companion = readFileSync(COMPANION, "utf8");
  const article = readFileSync(
    path.join(ROOT, "src/components/temporal-agent-orchestration/Article.mdx"),
    "utf8",
  );

  for (const group of [
    "Gas City terms",
    "Temporal terms",
    "Distributed-systems terms",
  ]) {
    assert.ok(glossary.includes(group), `the glossary must group ${group}`);
  }
  // Groups are native disclosures, collapsed by default: an offer, not an
  // assignment.
  assert.match(glossary, /<details class="glossary__group">/);
  assert.doesNotMatch(glossary, /<details class="glossary__group" open/);

  // A few load-bearing terms, one per register, must stay defined.
  for (const term of [
    "Generation fence",
    "Event History",
    "Idempotency",
    "At-least-once",
    "Mayor",
  ]) {
    assert.ok(glossary.includes(`term: "${term}"`), `${term} must be defined`);
  }
  // The heartbeat correction holds in the glossary too.
  assert.doesNotMatch(
    glossary,
    /heartbeat (?:is what |)(?:keeps|prevents|stops)[^.]*second agent/i,
  );

  assert.match(companion, /<Glossary \/>/);
  assert.match(article, /<Glossary \/>/);
});

test("the code identifiers carry hover explanations a keyboard can reach", () => {
  const termtip = readFileSync(TERMTIP, "utf8");
  const companion = readFileSync(COMPANION, "utf8");

  // The tooltip is reachable without a mouse and announced with its term.
  assert.match(termtip, /tabindex="0"/);
  assert.match(termtip, /aria-describedby=\{tipId\}/);
  assert.match(termtip, /role="tooltip"/);
  assert.match(termtip, /:focus-within/);

  // Every code identifier in the conversion paragraph is explained.
  for (const identifier of [
    "CityRuntime.beadReconcileTick",
    "BeadOrchestrationWorkflow",
    "ExecuteBeadActivity",
    "gascity-bead-orchestration",
    "gascity-agent-work",
  ]) {
    assert.match(
      companion,
      new RegExp(`<TermTip[\\s\\S]{0,400}?>${identifier.replace(/\./g, "\\.")}</TermTip>`),
      `${identifier} must carry a TermTip explanation`,
    );
  }
  // "Controller tick" is the phrase the tip exists to unpack.
  const flat = companion.replace(/\s+/g, " ");
  assert.ok(
    flat.includes("every few seconds it woke (one tick)"),
    "the tick tip must explain what a tick is",
  );
});

test("companion prose carries no em dashes and no self-narration", () => {
  for (const file of [COMPANION, CODE_INDEX, CODE_READER, GLOSSARY, TERMTIP]) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(
      source,
      /—/,
      `${path.relative(ROOT, file)} must not contain em dashes`,
    );
  }
  // Self-narration is a prose defect, so scan the rendered page rather than the
  // source: a code comment may legitimately talk about the page's own sections,
  // and scanning source made an implementation note fail a prose rule.
  const builtCompanion = path.join(
    ROOT,
    "dist/temporal-agent-orchestration/index.html",
  );
  if (!existsSync(builtCompanion)) return;
  const rendered = readFileSync(builtCompanion, "utf8")
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ");
  assert.doesNotMatch(rendered, /\bin eight (?:short )?sections\b/i);
  assert.doesNotMatch(rendered, /\bthis page\b[^.]*\b(?:structure|section)/i);
  assert.doesNotMatch(
    rendered,
    /\bas (?:described|explained) (?:above|below)\b/i,
    "the page must not narrate its own structure",
  );
});

test("the built companion page keeps the quote, the recording, and the faithful timing", () => {
  const builtCompanion = path.join(
    ROOT,
    "dist/temporal-agent-orchestration/index.html",
  );
  const builtArticle = path.join(
    ROOT,
    "dist/temporal-agent-orchestration/article/index.html",
  );
  if (!existsSync(builtCompanion)) return;

  assert.equal(
    existsSync(builtArticle),
    true,
    "the article must build at its new route",
  );
  const html = readFileSync(builtCompanion, "utf8");
  assert.match(html, /The task record survives\. The procedure does not\./);
  assert.match(html, /worker-kill\.cast/);
  assert.doesNotMatch(html, /worker-kill-talk/);
  assert.match(html, /resolver calls = 2/);

  const builtCast = path.join(
    ROOT,
    "dist/temporal-agent-orchestration/demo/worker-kill.cast",
  );
  assert.equal(existsSync(builtCast), true, "the cast must reach dist");
  for (const relative of [
    "demo/before-temporal.cast",
    "demo/ui-event-history-pre-checkpoint.webp",
    "demo/artifacts/provenance.json",
    "demo/artifacts/worker-kill/verify-report.txt",
    "demo/artifacts/before-temporal/verify-report.txt",
  ]) {
    assert.equal(
      existsSync(path.join(ROOT, "dist/temporal-agent-orchestration", relative)),
      true,
      `${relative} must reach dist`,
    );
  }
});

// The companion reuses the article's diagrams rather than shipping its own set.
// Reuse is only safe while each figure still says what the companion's prose
// says: the recovery figure sat next to the wrong heartbeat causality once, and
// this page's corrected paragraph is directly beneath it.
test("the companion carries diagrams that agree with its prose", () => {
  const companion = readFileSync(COMPANION, "utf8");
  const figures = readFileSync(
    path.join(
      ROOT,
      "src/components/temporal-agent-orchestration/ConceptFigure.astro",
    ),
    "utf8",
  );

  const reading = [
    "legend",
    "scattered",
    "handoff",
    "ownership",
    "recovery",
    "shadow",
    "workshop",
    "wrongness",
    "boundary",
  ];
  let previous = -1;
  for (const kind of reading) {
    const at = companion.indexOf(`<ConceptFigure kind="${kind}" />`);
    assert.ok(at > -1, `<ConceptFigure kind="${kind}" /> must be rendered`);
    assert.ok(at > previous, `${kind} must appear in reading order`);
    previous = at;
  }

  // The new figures also land in the sections whose prose argues them.
  const scatteredAt = companion.indexOf('<ConceptFigure kind="scattered" />');
  assert.ok(
    companion.indexOf("A crash loses the procedure, not the task") <
      scatteredAt && scatteredAt < companion.indexOf("What I Temporalized"),
    "the scattered figure closes the problem section",
  );
  const shadowAt = companion.indexOf('<ConceptFigure kind="shadow" />');
  assert.ok(
    companion.indexOf("The status has two halves") < shadowAt &&
      shadowAt < companion.indexOf('<ConceptFigure kind="workshop" />'),
    "the shadow figure belongs beside the two-halves status",
  );
  const workshopAt = companion.indexOf('<ConceptFigure kind="workshop" />');
  assert.ok(
    companion.indexOf("What the evidence proves") < workshopAt &&
      workshopAt < companion.indexOf("What it did not fix"),
    "the workshop figure belongs in the evidence section",
  );
  const wrongnessAt = companion.indexOf('<ConceptFigure kind="wrongness" />');
  assert.ok(
    companion.indexOf("faithfully retried the wrong envelope") < wrongnessAt,
    "the wrongness figure follows the canary paragraph it draws",
  );

  // Each figure lands in the section it illustrates, not merely somewhere.
  const recoveryAt = companion.indexOf('<ConceptFigure kind="recovery" />');
  assert.ok(
    companion.indexOf("The Worker dies on camera") < recoveryAt &&
      recoveryAt < companion.indexOf("At eight seconds the first Worker dies"),
    "the recovery figure belongs between the kill heading and its narration",
  );
  const boundaryAt = companion.indexOf('<ConceptFigure kind="boundary" />');
  assert.ok(
    companion.indexOf("What it did not fix") < boundaryAt,
    "the boundary figure belongs in the limits section",
  );

  // The recovery diagram must keep the corrected causality: identity resolves
  // the session, the heartbeat only carries progress.
  const recovery = figures.slice(
    figures.indexOf('kind === "recovery"'),
    figures.indexOf('kind === "siblings"'),
  );
  assert.match(recovery, /heartbeat carries progress, not\s+the identity/i);
  assert.match(recovery, /even if no heartbeat was ever recorded/i);
  assert.doesNotMatch(recovery, /read heartbeat/i);

  // The figures number themselves against the article, so the companion drops
  // that index rather than showing a figure "05" inside its section 04.
  assert.match(companion, /\.tco :global\(\.concept-figure__index\)[\s\S]*display: none/);
});
