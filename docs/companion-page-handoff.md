# Handoff: build the Gas City companion page

## Start here

```bash
cd /home/ds/projects/website-temporal-research
git branch --show-current    # expect: feature/temporal-research-walkthrough
git log --oneline -1         # expect: d3ea34a or later
```

That directory is a **git worktree** of `/home/ds/projects/website`, not a
separate clone. If you are sitting in `/home/ds/projects/website` you are on
`main` and you will not see any of this work. Change directory first.

This file exists in two places, deliberately:

- `/home/ds/handoff-prompts/temporal-companion-page.md` (worktree-independent)
- `docs/companion-page-handoff.md` on the feature branch (versioned with the
  work it describes)

**Written** 2026-08-01, at commit `d3ea34a` on `feature/temporal-research-walkthrough`.
**For** the next agent picking this up cold.
**Priority** critical. This is the assignment's front door.

> **Status 2026-08-01, later the same day: built.** Stephanie answered the
> three open questions: the companion page takes `/temporal-agent-orchestration/`
> and the article moved unchanged to `/temporal-agent-orchestration/article`
> (mirroring `blog.astro`); full shape confirmed, page plus code browser; the
> whole route family stays `noindex` and is now also excluded from the sitemap
> like `/temporal-research-agent`. Delivered: companion `index.astro` (eight
> sections), `code/index.astro` + `code/[slug].astro` over the existing samples
> data, the faithful cast copied to `public/temporal-agent-orchestration/demo/`
> and embedded with `asciinema-player` (npm dependency, bundled, no network at
> play time, no idle compression), the article pin suite repointed at
> `article.astro` with the dist scan widened to every built page in the route
> family plus the cast, and a new
> `tests/temporal-agent-orchestration-companion.test.mjs`. All companion prose
> is logged in `docs/article-prose-for-voice-pass.md` §6 and awaits the voice
> pass. Still open from this handoff: nothing structural; the voice pass and
> the parked figure work remain elsewhere.

## The mission in one paragraph

Build a companion page at `/temporal-agent-orchestration/` that becomes the
primary entry point for the Gas City Temporal work, structured the way
`/temporal-research-agent/` already is. Today that route renders only the long
article. The reviewer's single largest structural criticism was that the article
is a compelling deep essay and a poor first experience: a reviewer has to learn
Beads, Gas Town, Gas City, NDI, Mayor, formulas, sessions, generations, and the
pre-existing repair model before reaching the Temporal boundary. The companion
page is the fix. The article stays exactly as it is and becomes the thing the
companion page links to.

## The eight sections

1. One-sentence problem.
2. Precise definition of what was Temporalized.
3. Small before-and-after architecture.
4. Workflow/Activity boundary.
5. Worker-kill or recovery demonstration.
6. What the evidence proves.
7. Limits and tradeoffs.
8. Links to the long article and full code.

## Copy the structure that already works

`src/pages/temporal-research-agent/index.astro` (758 lines) is the model. Read it
first. Its section shape maps almost one to one onto the list above:

| Its heading | Your section |
|---|---|
| An existing research product, rebuilt around durable execution | 1 and 2 |
| The code sample before Temporal | 3 (before) |
| The Temporal implementation, with h3s for Temporal Service, Workflow, Activities, Worker | 3 (after) and 4 |
| Recovery proof | 5 |
| Results and verification | 6 |
| Design choices and tradeoffs | 7 |

That route also ships `readme.astro`, `blog.astro`, a `code/` browser
(`code/index.astro` + `code/[slug].astro`) and a `research-output/` browser. The
code browser is the one worth copying; this work has no standalone code route,
only `AnnotatedCode.astro` embedded inside the article.

Copy its **structure and its component conventions**. Do not copy its prose.

## Where every piece of content already is

All eight sections have their material written and verified. You are assembling,
not researching. Do not re-derive any of this.

**1. One-sentence problem.** Use the reviewer's own four lines, close to verbatim.
They are in `docs/temporal-submission-split.md` under "Talk opening, verbatim" and
on slide 1 of the deck:

> An agent is editing code. Its coordinator crashes before recording the handoff.
> The task record survives. The procedure does not. Temporal makes that procedure
> durable without making the agent deterministic.

**2. What was Temporalized.** Written and settled. `docs/temporal-submission-split.md`
section "2. Declare the canonical unit", and the same declaration already lands in
the article under "### The unit I converted". Before is
`CityRuntime.beadReconcileTick` in `cmd/gc/city_runtime.go` plus the session
recovery and close path in `cmd/gc/session_beads.go` at public gascity revision
`b78058917bc65846db89e1c3b25dc17269822483`. After is `BeadOrchestrationWorkflow`
plus `ExecuteBeadActivity` on task queues `gascity-bead-orchestration` and
`gascity-agent-work`.

**3. Before and after architecture.** Rendered before/after source already exists
at `public/temporal-agent-orchestration/code/before/{city_runtime,session_recovery}_excerpt.go`
and `public/temporal-agent-orchestration/code/{bridge,workflow,activity,command_agent_executor,outcome_workflow,workers}.go`,
with annotations in `src/data/temporal-agent-orchestration-code-samples.ts`.
Reuse `src/components/temporal-agent-orchestration/AnnotatedCode.astro`.

**4. Workflow/Activity boundary.** `ConceptFigure kind="ownership"` is the
three-column figure. The fuller three-tier version (inside Temporal / at the
boundary / outside) is written as prose in `docs/temporal-reviewer-qa.md` answer
10 and specified as a diagram in
`docs/temporal-agent-orchestration-visual-brief.md` illustration 7. The boundary
row is the important one and the current `kind="boundary"` figure does not have
it yet.

**5. Worker-kill demonstration. This is the section that changed today.**
It used to be a description. It is now a recording.

- `/home/ds/temporal_devrel/presentation/temporalize-agent-orchestration/demo/recording/worker-kill.cast`
  (7KB, 41.7s, real timing)
- `worker-kill-faithful.mp4` (44.7s, real timing, 1910x1420 H.264)
- `worker-kill-talk.mp4` (22.4s, **idle gaps compressed to 3s**)
- `recording/README.md` has the beat-by-beat timing table.

For a web page, embed the `.cast` with `asciinema-player` (self-contained JS and
CSS, no network at play time). It stays selectable text and is 7KB against 1.1MB.
Do not use the talk cut on the page: it silently compresses the 18.2-second pause
where Temporal notices the dead Worker, and that pause is one of the more
interesting facts in the run.

The numbers to put on the page, from the run of 2026-08-01 against service
revision `2b5df98`:

```
arm 1  mid-execute      resolver calls = 1   session creations = 1   final attempt = 2
arm 2  pre-checkpoint   resolver calls = 2   session creations = 1   final attempt = 2
both   one session, one receipt, stale claim token rejected,
       same Activity identity across attempts
```

**6. What the evidence proves.** `docs/temporal-reviewer-qa.md` answer 13 splits
this three ways and you should keep that split: proven continuously in
production, proven only in a bounded canary, and design hypothesis. The test map
is in `docs/temporal-submission-split.md` section 3 and already lands in the
article under "## What the tests hold down".

**7. Limits and tradeoffs.** The article's "## What Temporal did not solve" plus
`docs/temporal-reviewer-qa.md` answers 15 and 19. The strongest single item is
durable wrongness: the latest canary executed two steps exactly once, survived a
mid-episode Worker interruption, then failed at the outcome boundary because the
envelope builder derived `city:gas-city` while the store was `city:ds-research`,
and Temporal faithfully retried the wrong envelope every fifteen minutes. Put the
failure marker on the application adapter, never on the Temporal server.

**8. Links.** The article at `/temporal-agent-orchestration/` (decide the route
split; see open question below), plus a new code browser modelled on
`temporal-research-agent/code/`.

## Hard constraints. Read these before writing a line.

**The test suite pins article content.** Read
`tests/temporal-agent-orchestration-article.test.mjs` in full first. It asserts a
fixed `ConceptFigure` reading order, exactly one figcaption/svg/title/desc/viewBox
per diagram, narrative-order and teaching-order marker lists, and a
forbidden-identifier scan across `Article.mdx`, `ConceptFigure.astro`,
`AnnotatedCode.astro`, the code samples, and **the built page in `dist/`**. A new
page under the same route family will be scanned. Run the build before trusting a
green suite.

**No internal identifiers on any reader-facing surface.** No 40-char commit
hashes except the one public gascity commit `b7805891…`, no
`(dr|sjai|gc)-[0-9a-z]+` bead IDs, no `outcome-<hex>`, no `cycle-<digits>`, no
PIDs, no `/home/ds` paths, no `src/` or `public/` paths.

**Status precision, every time, adjacently.** The unit converted (bead-to-agent)
is proved by a bounded canary and runs in **shadow**. The part running
**continuously in production** is result delivery and acknowledgement. Stating
either alone is what created the diffuseness the reviewer flagged. Never claim
general rollout, exactly-once Activities, that Temporal replaced Beads or was
added to Gas Town, that `temporal-ops` is deployed, or that cross-host recovery
works.

**The heartbeat correction.** A heartbeat is not what prevents a duplicate agent
launch. A Worker can die before the first heartbeat lands. The resolver finds the
existing session by stable identity; the heartbeat only resumes progress. This was
wrong in the article and in the recovery diagram and is now fixed in both. Do not
reintroduce it.

**Arm 1 cannot be shown alone.** Arm 1's retry resumes from a checkpoint and never
re-resolves, so it stays fully green against a resolver deliberately broken to
mint a duplicate session on every call. Only arm 2 demonstrates duplicate-launch
prevention. If the page shows one arm, it must be arm 2.

**Prose rules.** No em dashes anywhere. No AI-slop tells. No sentence that refers
to the writing's own history ("this is the part I got wrong when I first
explained it" was cut for exactly this reason) and none that narrates the
document's own structure. Every visitor-facing sentence you author goes into
`docs/article-prose-for-voice-pass.md` verbatim, under its section, because
Stephanie voice-passes them in one sweep. That list is currently accurate against
the article diff; keep it that way.

**Git.** Do not commit or push without being asked. Do not write anything under
`/home/ds/gas-city` or `/home/ds/gas-city-worktrees`; both are read-only here.

## Gotchas this session paid for. You would otherwise re-hit them.

- **`git -C` walks up the filesystem.** A directory with no `.git` sitting inside
  an unrelated repository reports *that* repository's HEAD. This produced a demo
  provenance record confidently attributing a run to the wrong project. Fixed in
  `demo/run.sh`; the lesson generalises.
- **`agg` defaults `--idle-time-limit` to 5 seconds.** A render with no explicit
  flag silently compresses pauses. The faithful render passes
  `--idle-time-limit 60`.
- **The full `node --test` suite has 9 failures that are not yours.** Eight are a
  harness race: `book-graph-dist.test.mjs` and `book-references-dist.test.mjs`
  each shell out to `npm run build` in a setup hook, and `node --test` runs files
  in parallel, so concurrent builds clobber `dist`. The ninth,
  `concept-assignments` seeder determinism, reproduces on clean `HEAD` with all
  this work reverted. Run
  `node --test tests/temporal-agent-orchestration-article.test.mjs` for signal.
- **The service checkout moves.** It went `65c2edd` to `2b5df98` to `2e0740d` in
  a few hours while the city worked in it. The demo now builds against a pinned
  `git archive` tree at
  `/home/ds/temporal_devrel/.service-pins/temporal-maintenance-2b5df98`.
  Keep it on the pin for anything you record or publish.
- **Port 7233 is production.** A live Temporal server with the city's
  `maintenance-worker` attached runs the continuously-active OutcomeReady path
  there. The demo owns 7244/8244 and now refuses 7233/8233 outright.
- **`harness` is a banned word in the deck's prose gate** (it is on the AI-slop
  list as in "harness the power of"). Rephrase rather than weakening the gate.
- **This repo is a git worktree of `/home/ds/projects/website`**, sharing an
  object store with the repo whose digest cron auto-commits and pushes to `main`
  daily. Four worktrees hang off it. Commit locally early; the city has
  dispatched agents into this worktree before.

## Verify like this

```bash
cd /home/ds/projects/website-temporal-research
node --test tests/temporal-agent-orchestration-article.test.mjs   # signal
npm run check
npm run build                                                     # must pass; dist is scanned
node --test tests/temporal-agent-orchestration-article.test.mjs   # re-run against fresh dist
```

For the demo, from
`/home/ds/temporal_devrel/presentation/temporalize-agent-orchestration/demo`:

```bash
./run.sh                       # both arms, exit non-zero if any invariant fails
cat out/run-artifacts/provenance.json   # must say 2b5df98, never "unknown"
```

## Open questions for Stephanie. Ask, do not decide.

1. **Route split.** The companion page wants to be `/temporal-agent-orchestration/`,
   which is the article's current route. Does the article move to
   `/temporal-agent-orchestration/article`, mirroring
   `temporal-research-agent/blog.astro`, or does the companion page take a new
   route? This changes the test suite's `PAGE` constant and the `noindex` handling.
2. **New visitor-facing surface.** Her standing rule is that a new visitor-facing
   surface needs a utility case *before* shipping, not after. The reviewer asking
   for a smaller front door is a strong case, but confirm the shape before
   building the whole thing.
3. **`noindex`.** The article route carries `noindex={true}` and publication is
   separately gated. Should the companion page be indexable?

## Explicitly not in scope

- Rewriting the article. It passes review. The companion page links to it.
- Redrawing the `ConceptFigure` set to
  `docs/temporal-agent-orchestration-visual-brief.md`. Deliberately parked: those
  figures change meaning depending on how the article/companion split lands.
- Pushing anything, or publishing.

## Still open elsewhere, not yours unless asked

Voice pass on `docs/article-prose-for-voice-pass.md`. The deck's two code screens
carry `w.Beads.Claim` and `BeadID`, which is the work-store vocabulary the talk
avoids, and changing them would fabricate code. 42 sentences of metrics prose
never made it into the voice-pass list. The metrics figures are live reads with
no as-of snapshot and drift between runs. The deck's 10-minute cut plan lists
slides 3, 4 and 14 in neither its keep nor its cut column.
