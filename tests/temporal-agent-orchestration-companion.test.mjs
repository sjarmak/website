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
const ARTICLE = path.join(
  ROOT,
  "src/components/temporal-agent-orchestration/Article.mdx",
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

test("the companion opens with the failure, the boundary sentence, and the bounded ledger", () => {
  const companion = readFileSync(COMPANION, "utf8");

  const opening = [
    "An agent in a software factory is editing code",
    "crashes before recording",
    "The task still exists",
    "the steps needed to resume it are lost",
    "durable without requiring the agent itself to be deterministic",
  ];
  let previous = -1;
  for (const marker of opening) {
    const current = companion.indexOf(marker);
    assert.ok(current > previous, `${marker} must appear in opening order`);
    previous = current;
  }

  assert.match(companion, /Put the unpredictable agent inside an\s+Activity/);
  assert.match(companion, /Put the promises\s+around it in a Workflow/);

  // The hero ledger bounds the claim in four lines before any detail.
  assert.match(companion, /One ready task → one agent session → one fenced receipt\./);
  assert.match(
    companion,
    /Recovery from a real Worker kill without starting a second agent\./,
  );
  assert.match(companion, /Durable result delivery and acknowledgement\./);
  assert.match(companion, /Cross-host recovery\./);

  // The three crash windows a restart could not answer.
  assert.match(
    companion,
    /dies after claiming the work but before launching the agent/,
  );
  assert.match(
    companion,
    /dies after launching the agent but before recording the session/,
  );
  assert.match(companion, /finishes late and overwrites the current result/);
  assert.match(
    companion,
    /What was missing was a durable\s+owner for the procedure/,
  );
});

test("the companion declares the bounded unit and one ownership model", () => {
  const companion = readFileSync(COMPANION, "utf8");
  const flat = companion.replace(/\s+/g, " ");

  assert.ok(
    flat.includes(
      "I made one procedure durable: assign one ready work item to one agent session and accept a result only from the current attempt.",
    ),
    "the Temporalized unit must be stated in one bounded sentence",
  );

  // The before/after table carries the conversion.
  assert.match(companion, /A process-owned reconcile tick/);
  assert.match(companion, /Recovery replays recorded history/);
  assert.match(companion, /Generation-fenced receipts/);

  // One ownership model, four lines, application included; the second
  // at-least-once restatement was cut by editorial decision.
  assert.match(companion, /<li>Beads owns work facts\.<\/li>/);
  assert.match(companion, /<li>Temporal owns procedural progress\.<\/li>/);
  assert.match(companion, /<li>Activities touch the external world\.<\/li>/);
  assert.match(
    companion,
    /<li>The application owns identity, fencing, idempotency, and correctness\.<\/li>/,
  );
  assert.doesNotMatch(companion, /at-least-once execution/);

  // One ownership diagram accompanies the list.
  assert.match(companion, /<ConceptFigure kind="ownership" \/>/);

  assert.doesNotMatch(companion, /general rollout|exactly[- ]once Activities/i);
});

test("the demo section tells the viewer what dies, what to watch, and why arm two decides", () => {
  assert.equal(existsSync(CAST), true, "the cast must ship with the site");
  assert.equal(
    existsSync(BEFORE_CAST),
    true,
    "the before-Temporal cast must ship with the site",
  );
  const companion = readFileSync(COMPANION, "utf8");
  const flat = companion.replace(/\s+/g, " ");

  assert.match(companion, /asciinema-player/);
  assert.match(companion, /worker-kill\.cast/);
  assert.match(companion, /before-temporal\.cast/);
  assert.match(companion, /before-temporal-player/);

  // Two recordings, three demonstrated executions, said in those words.
  assert.ok(
    flat.includes("Two recordings, three demonstrated executions"),
    "the counting must be explicit: two recordings, three executions",
  );

  // Before playback the reader learns which process dies and which survives.
  assert.ok(
    flat.includes("I kill the orchestration process, not the coding agent."),
    "the framing must state what dies before either player",
  );
  assert.ok(
    flat.includes(
      "whether the restarted orchestration attaches to that same agent or launches a competitor",
    ),
    "the framing must state the question the recordings answer",
  );

  // The before demo explains its failure causally, not just its counters.
  assert.ok(
    flat.includes("sees claimed work with no recorded session and starts a replacement"),
    "the before demo must explain why a duplicate launches",
  );
  assert.ok(
    flat.includes("the older attempt finishes last, overwriting the current receipt"),
    "the before demo must explain the stale overwrite",
  );

  // The Temporal demo gives watch-for assertions per kill, and names arm two
  // as the decisive case, mirroring the invariant report's own caveat.
  assert.ok(flat.includes("What to watch, per kill:"));
  assert.ok(
    flat.includes(
      "the replacement Worker resumes from heartbeat details, and session creations stay at one",
    ),
  );
  assert.ok(
    flat.includes(
      "the resolver is called a second time and returns the existing session instead of creating another one",
    ),
  );
  assert.ok(flat.includes("The second kill is the decisive one."));
  assert.ok(
    flat.includes(
      "Surviving a kill after a checkpoint does not by itself prove duplicate-launch prevention",
    ),
  );

  // The heartbeat must never be described as what prevents the second launch.
  assert.doesNotMatch(
    companion,
    /heartbeat (?:is what |)(?:keeps|prevents|stops)[^.]*second agent/i,
    "the heartbeat must never be described as what prevents the second launch",
  );

  // The label names the survivor, and the kill is an OS signal, not a
  // Temporal Signal.
  assert.match(
    companion,
    /With Temporal: the Worker dies, the agent does not/,
  );
  assert.match(companion, /operating-system kill signal/);
  assert.doesNotMatch(companion, /with a real signal\./);

  // The recordings stay faithful: no re-timing in player options, and the
  // detection pause carries a status note so it reads as evidence.
  assert.doesNotMatch(companion, /idleTimeLimit/);
  assert.doesNotMatch(companion, /speed:/);
  assert.match(companion, /tco__player-note/);
  assert.match(companion, /waiting out the heartbeat timeout/i);
  assert.match(companion, /The retry has to ask the resolver again/);

  // Downloads offer a playable video; the .cast stays as the raw event log.
  assert.match(companion, /worker-kill\.mp4/);
  assert.match(companion, /before-temporal\.mp4/);
  assert.match(companion, /raw asciinema event log/);
  for (const rendered of ["worker-kill.mp4", "before-temporal.mp4"]) {
    assert.equal(
      existsSync(
        path.join(ROOT, "public/temporal-agent-orchestration/demo", rendered),
      ),
      true,
      `${rendered} must ship with the site`,
    );
  }

  // The demo's scope is stated rather than implied.
  assert.match(companion, /one host/);
  assert.match(companion, /fixture process in place of a coding agent/);

  // The companion links the summary evidence; the full bundle is linked from
  // the article's appendix.
  for (const artifact of ["provenance.json", "worker-kill/verify-report.txt"]) {
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
  const article = readFileSync(ARTICLE, "utf8");
  for (const artifact of [
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
      article.includes(artifact),
      `the article appendix must link ${artifact}`,
    );
  }
});

test("the status table is the one definitive rollout statement", () => {
  const companion = readFileSync(COMPANION, "utf8");
  const flat = companion.replace(/\s+/g, " ");

  assert.match(companion, /What is actually running/);

  // Four rows, most-proven first, in the reviewer's terms. The scan starts at
  // the section head because the hero ledger names cross-host recovery first.
  const statusSection = companion.slice(
    companion.indexOf("What is actually running"),
  );
  const rows = [
    ["Result delivery and exact acknowledgement", "Production"],
    ["Temporal-controlled claim and agent launch", "Shadow; bounded canary completed"],
    ["Worker recovery on one host", "Demonstrated"],
    ["Cross-host recovery", "Not demonstrated"],
  ];
  let previous = -1;
  for (const [pathName, status] of rows) {
    const at = statusSection.indexOf(pathName);
    assert.ok(at > previous, `${pathName} must appear in evidence order`);
    assert.ok(
      flat.includes(status),
      `${pathName} must carry the status "${status}"`,
    );
    previous = at;
  }

  // Limits stay on the page: durable wrongness, the retry cadence, and the
  // job that stayed on cron.
  assert.ok(flat.includes("wrong store identity"));
  assert.ok(flat.includes("every fifteen minutes"));
  assert.ok(flat.includes("forty-four seconds of synchronous work"));
  assert.ok(flat.includes("what a crash leaves unresolved"));
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

test("the glossary stays on the article, and its content holds the corrected causality", () => {
  const glossary = readFileSync(GLOSSARY, "utf8");
  const companion = readFileSync(COMPANION, "utf8");
  const article = readFileSync(ARTICLE, "utf8");

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

  // The article owns the full glossary; the companion defines its handful of
  // terms inline through TermTips instead of a second glossary.
  assert.match(article, /<Glossary \/>/);
  assert.doesNotMatch(companion, /<Glossary \/>/);
});

test("the companion's terms carry hover explanations a keyboard can reach", () => {
  const termtip = readFileSync(TERMTIP, "utf8");
  const companion = readFileSync(COMPANION, "utf8");

  // The tooltip is reachable without a mouse and announced with its term.
  assert.match(termtip, /tabindex="0"/);
  assert.match(termtip, /aria-describedby=\{tipId\}/);
  assert.match(termtip, /role="tooltip"/);
  assert.match(termtip, /:focus-within/);

  // Every specialist term the companion leans on is explained inline.
  for (const term of [
    "beads",
    "workflow",
    "activity",
    "generation-fence",
    "worker",
  ]) {
    assert.match(
      companion,
      new RegExp(`term="${term}"`),
      `the companion must explain the ${term} term inline`,
    );
  }
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

test("the built companion page keeps the quote, the recordings, and the demo guidance", () => {
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
    "the article must build at its route",
  );
  const html = readFileSync(builtCompanion, "utf8");
  assert.match(
    html,
    /The task still exists, but the steps needed to resume it are lost\./,
  );
  assert.match(html, /worker-kill\.cast/);
  assert.match(html, /I kill the orchestration process, not the coding agent\./);
  assert.match(html, /What to watch, per kill:/);
  assert.match(html, /With Temporal: the Worker dies, the agent does not/);
  assert.doesNotMatch(html, /worker-kill-talk/);

  for (const relative of [
    "demo/worker-kill.cast",
    "demo/before-temporal.cast",
    "demo/worker-kill.mp4",
    "demo/before-temporal.mp4",
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

// The companion reuses the article's ownership diagram rather than shipping its
// own set. Reuse is only safe while the figure still says what the page says.
test("the companion's diagram agrees with its prose", () => {
  const companion = readFileSync(COMPANION, "utf8");
  const figures = readFileSync(
    path.join(
      ROOT,
      "src/components/temporal-agent-orchestration/ConceptFigure.astro",
    ),
    "utf8",
  );

  // One diagram: ownership, inside the "What I Temporalized" section.
  const ownershipAt = companion.indexOf('<ConceptFigure kind="ownership" />');
  assert.ok(ownershipAt > -1, "the ownership figure must be rendered");
  assert.ok(
    companion.indexOf("What I Temporalized") < ownershipAt &&
      ownershipAt < companion.indexOf("The Worker dies on camera"),
    "the ownership figure belongs in the Temporalized section",
  );
  assert.equal(
    (companion.match(/<ConceptFigure /g) ?? []).length,
    1,
    "the companion carries exactly one concept figure",
  );

  // The recovery diagram in the shared component must keep the corrected
  // causality: identity resolves the session, the heartbeat only carries
  // progress. The companion's watch-for list states the same claim.
  const recovery = figures.slice(
    figures.indexOf('kind === "recovery"'),
    figures.indexOf('kind === "siblings"'),
  );
  assert.match(recovery, /heartbeat carries progress, not\s+the identity/i);
  assert.match(recovery, /even if no heartbeat was ever recorded/i);
  assert.doesNotMatch(recovery, /read heartbeat/i);
});
