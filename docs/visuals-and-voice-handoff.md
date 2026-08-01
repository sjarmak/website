# Handoff: companion-page visuals and voice pass

## Start here

```bash
cd /home/ds/projects/website-temporal-research
git branch --show-current    # expect: feature/temporal-research-walkthrough
git log --oneline -5         # expect 5992ad4 at or near the top
```

That directory is a **git worktree** of `/home/ds/projects/website`, not a
separate clone. Sitting in `/home/ds/projects/website` puts you on `main` where
none of this exists. Change directory first.

**Written** 2026-08-01. Two tasks, in priority order: visualizations, then
voice pass. The first is the reason this handoff exists: the topic is hard and
the page currently explains it mostly in prose.

The table-overflow issue that was originally task 3 is **fixed and verified**,
at `article.astro`. The test table used to be its own scroll container, so the
73-character Go identifiers in its right column pushed it into a horizontal
scrollbar. It is now `table-layout: fixed` with `overflow-wrap: anywhere` on
the cells and on the inline `code` inside them. Measured in a real browser at
six viewport widths across both themes: zero table overflow, zero page
overflow, nothing clipped, longest identifier wraps intact over two lines.

---

## Where everything is

### The website (this repo)

| What | Path |
|---|---|
| Companion page (primary entry) | `src/pages/temporal-agent-orchestration/index.astro` (732 lines) |
| Long article | `src/pages/temporal-agent-orchestration/article.astro` (119 lines), renders `src/components/temporal-agent-orchestration/Article.mdx` |
| Code browser | `src/pages/temporal-agent-orchestration/code/{index,[slug]}.astro` |
| All SVG diagrams | `src/components/temporal-agent-orchestration/ConceptFigure.astro` (7 kinds) |
| Raster illustrations | `src/components/temporal-agent-orchestration/img/*.png` (4) + `Illustration.astro` |
| Annotated before/after code | `src/components/temporal-agent-orchestration/AnnotatedCode.astro`, data in `src/data/temporal-agent-orchestration-code-samples.ts` |
| Worker-kill recording, published | `public/temporal-agent-orchestration/demo/worker-kill.cast` |
| Pin test suite | `tests/temporal-agent-orchestration-article.test.mjs` |

Routes are settled: `/temporal-agent-orchestration/` is the companion page,
`/temporal-agent-orchestration/article` is the technical blog. Do not revisit.

### The deck and demo (separate repo, `temporal_devrel`)

Base: `/home/ds/temporal_devrel/presentation/temporalize-agent-orchestration/`

| What | Path (relative to that base) |
|---|---|
| Deck source of truth | `content.json` |
| Built deck | `deck/deck.html`, `deck/deck.pdf`, `deck/out/slide-01..14.png` |
| Build + gates | `deck/build.py`, `test_package.py`, `deck/test_build.py` (42 tests) |
| Presenter notes | `presenter-notes.md` |
| Prose review list | `prose-review.md` |
| Claim/vocabulary gate config | `status-claims.json` |
| Demo harness | `demo/run.sh`, `demo/verify.py`, `demo/harness/cmd/*` |
| Demo docs | `demo/README.md`, `demo/recording/README.md` |
| Recording | `demo/recording/worker-kill.cast` (41.7s), `worker-kill-faithful.mp4` (44.7s, real timing), `worker-kill-talk.mp4` (22.4s, **time-compressed**) |
| Pinned service tree | `/home/ds/temporal_devrel/.service-pins/temporal-maintenance-2b5df98` |

Rebuild the deck with `python3 deck/build.py`; gate it with
`python3 -m pytest test_package.py deck/test_build.py -q`.

### Specs and reference

| What | Path |
|---|---|
| **The visual brief. This is the spec for task 1.** | `docs/temporal-agent-orchestration-visual-brief.md` |
| Two-artifact split plan | `docs/temporal-submission-split.md` |
| Answers to all 20 reviewer questions | `docs/temporal-reviewer-qa.md` |
| Article prose awaiting voice pass | `docs/article-prose-for-voice-pass.md` |
| Earlier handoff (companion page build) | `docs/companion-page-handoff.md` |
| Metrics spec, scripts, fixtures | `docs/metrics/` |

---

## Task 1: the visualizations. Highest priority.

The companion page has eight sections and three figures. Verified placement:

| § | Heading | Figure |
|---|---|---|
| 1 | A crash loses the procedure, not the task | **none** |
| 2 | What was converted | **none** |
| 3 | Before and after | **none** |
| 4 | Who owns what | `ownership` |
| 5 | The Worker dies on camera | recording + `recovery` |
| 6 | What the evidence proves | **none** |
| 7 | What it did not fix, and what it cost | `boundary` |
| 8 | Go deeper | recording link |

Sections 1 and 3 are exactly where the brief's most important diagrams belong,
and both are currently prose only. Section 1 is the page's opening argument.

The previous agent's "give the companion page its diagrams" commit wired up
three existing figures. It did not build any new ones. Verified: still 7
`ConceptFigure` kinds, unchanged.

### Status against the brief's recommended set

Read `docs/temporal-agent-orchestration-visual-brief.md` sections "Recommended
illustration set" and "Visual grammar" first. Scored against it:

| # | Brief wants | Current | Gap |
|---|---|---|---|
| 1 | Scattered promise: 5 swimlanes, fracture symbols on the **edges** not the components | `ConspiracyFigure` raster (evidence board) | artistic stand-in only. **Belongs in companion §1** |
| 2 | Two durable records + one nondeterministic workshop, 3 columns | `ownership` | closest to done; brief also wants bidirectional verification drawn between Beads and Activities |
| 3 | Two **adjacent** crash windows, with separate protection for each | `handoff` | covers window 1 (outbox) only. Window 2 (session created, crash before first heartbeat) is not drawn. Not used on the companion page at all |
| 4 | Worker dies: 3 persistent rows + 2 temporary Worker boxes | `recovery` | semantics corrected, layout is still a linear 5-step. Brief is explicit: do not draw the agent as replayed |
| 5 | Finished is not acknowledged, watchdog **outside** the loop | `workshop` | exists, watchdog not placed outside. Not used on the companion page |
| 6 | **Shadow is a glass wall**, plus the two-switch mode table | none | **missing entirely.** Both pages assert shadow mode in prose with no picture of what it means |
| 7 | Three tiers: inside Temporal / **at the boundary** / outside | `boundary` | two columns. The brief calls the middle tier the important one: idempotency keys and fences are not Temporal guarantees, they are how at-least-once becomes safe |
| 8 | Durable wrongness, the latest canary | none | **missing as a figure.** Deck slide 10 has it; neither page does |

**Visual grammar legend: 0% implemented.** `grep` for `svg-bolt`, `svg-barrier`,
`svg-box--durable`, `svg-box--muted`, `svg-lane` in `ConceptFigure.astro`
returns zero. The brief specifies a consistent legend (double outline for a
durable record, lightning on an edge for a crash window, hourglass for a durable
wait, translucent barrier for shadow, red **edge** not red component for a failed
integration contract). Implementing it is what will make the set read as one
system rather than seven unrelated drawings.

### Suggested order

1. **#6 shadow glass wall.** Biggest explanatory hole, zero dependencies, and
   the brief hands you the exact two-switch table.
2. **#8 durable wrongness.** The best "what it didn't fix" story we have and it
   is on a slide but not on either page. Put the red marker on the application
   adapter, never on the Temporal server.
3. **#1 scattered promise** into companion §1. This is the page's opening and it
   currently has no picture.
4. **#7 third tier** on `boundary`.
5. **#3 second crash window**, **#4 timeline layout**, **#5 watchdog**, **#2
   bidirectional** as polish.
6. The grammar legend, applied across all of them.

### Constraints that will bite

- `tests/temporal-agent-orchestration-article.test.mjs` asserts **exactly one**
  `figcaption`, `svg`, `title`, `desc` and `viewBox` per diagram, counted against
  the number of `kind === "` occurrences. Add a kind, add all five.
- It also pins a **reading order** for the kinds in `Article.mdx`. A new kind
  used in the article must be inserted consistently with that list.
- `assert.doesNotMatch(figures, /overflow-x: auto/)` applies to
  `ConceptFigure.astro`. Diagrams must fit, not scroll.
- No hardcoded `#fff`/`#000`. Everything goes through `currentColor` and the
  theme tokens; there is a test for it.
- Every diagram needs its text fallback list, which is what is shown below 720px
  instead of the SVG.

---

## Task 2: voice pass

The companion page prose has had a de-slop pass (`7f5532c`) but not Stephanie's
voice pass. Two inputs:

- `docs/article-prose-for-voice-pass.md` lists every sentence added to
  `Article.mdx`, verbatim, grouped by section.
- The companion page prose in `src/pages/temporal-agent-orchestration/index.astro`
  is not in that list. It needs its own extraction, same format.

Run the `no-ai-slop` skill against both and read line by line rather than
approximating from memory. Hard bans: no em dashes, no agreement-performance
openers, no hedging stacks, no honesty-signalling. Two more this project has
already had to fix once each:

- **No sentence that refers to the writing's own history.** "This is the part I
  got wrong when I first explained it" was cut for exactly this. The reader does
  not care what a previous draft said.
- **No sentence that narrates the document's own structure.** "Read back to
  back, the last few sections make Temporal look like…" was cut for the same
  reason. State the claim.

---

## Gotchas carried forward

- **The full `node --test` suite has 9 failures that are not yours.** Eight are a
  harness race: `book-graph-dist.test.mjs` and `book-references-dist.test.mjs`
  each shell out to `npm run build` in a setup hook and `node --test` runs files
  in parallel, so concurrent builds clobber `dist`. The ninth,
  `concept-assignments` seeder determinism, reproduces on clean `HEAD`. Use the
  single-file command below for signal.
- **`git -C` walks up the filesystem.** A directory with no `.git` inside an
  unrelated repo reports that repo's HEAD. This produced a demo provenance record
  attributing a run to the wrong project.
- **`agg` defaults `--idle-time-limit` to 5 seconds**, so a naive render silently
  compresses the pauses. The faithful render passes `--idle-time-limit 60`.
- **`harness` is a banned word** in the deck's prose gate (AI-slop list, as in
  "harness the power of"). Rephrase rather than weakening the gate.
- **Port 7233 is production Temporal** with the city's maintenance worker
  attached. The demo owns 7244/8244 and now refuses 7233/8233.
- **The demo builds against a pinned tree.** The live service checkout moved
  three times in one afternoon.
- **Arm 1 of the demo cannot be shown alone.** It stays green against a resolver
  deliberately broken to mint duplicate sessions. Only arm 2 proves duplicate-launch
  prevention.
- **Status precision, always adjacent:** the converted unit (bead-to-agent) is
  proved by a bounded canary and runs in **shadow**; the part running
  **continuously in production** is result delivery and acknowledgement.
- **The heartbeat is not the duplicate-launch guard.** A Worker can die before the
  first heartbeat; the resolver finds the session by stable identity.

## Verify

```bash
cd /home/ds/projects/website-temporal-research
node --test tests/temporal-agent-orchestration-article.test.mjs   # signal
npm run check
npm run build                                                     # dist is scanned
node --test tests/temporal-agent-orchestration-article.test.mjs   # re-run against fresh dist
```

Deck, from `/home/ds/temporal_devrel/presentation/temporalize-agent-orchestration`:

```bash
python3 deck/build.py && python3 -m pytest test_package.py deck/test_build.py -q
```

## Rules

Do not commit or push without being asked. Do not write anything under
`/home/ds/gas-city` or `/home/ds/gas-city-worktrees`; both are read-only. Do not
change the route split. Do not rewrite the article, which passes review.
