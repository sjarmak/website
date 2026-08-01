# GOAL: Temporal companion visuals + voice pass

Spec: `docs/temporal-agent-orchestration-visual-brief.md`
Handoff: `~/handoff-prompts/temporal-visuals-and-voice.md`
Worktree: `/home/ds/projects/website-temporal-research` on `feature/temporal-research-walkthrough`
Epic bead: `sjai-zmj`

## Decisions (2026-08-01)

1. **Scope: full brief compliance.** All 8 illustration items + the visual
   grammar legend applied across every figure. Core: shadow glass wall (#6),
   durable wrongness (#8), scattered promise (#1), boundary third tier (#7).
   Amendments: handoff second crash window (#3), recovery timeline layout
   (#4), workshop watchdog outside the loop (#5), ownership bidirectional
   verification (#2).
2. **Placement: companion + targeted article inserts.** New kinds go on the
   companion page per the handoff placement table. The article additionally
   gets `shadow` and `wrongness` figure tags inserted next to existing prose
   (no prose rewrite); the pinned readingOrder list in the test updates with
   them.
3. **Commit policy: local commits per deliverable, never push.** Each commit
   gated by pin tests + `npm run check` + `npm run build`. Stephanie reviews
   before anything leaves the machine.
4. **Voice pass: apply no-ai-slop fixes directly.** Line-by-line over
   companion prose and the article-prose extraction; minimal per-sentence
   diffs; article prose touched only on hard-ban violations. Companion
   extraction doc produced first. Stephanie's personal voice pass happens on
   the diff before any push.
5. **Architecture: single ConceptFigure.astro.** The pin test counts
   per-diagram invariants inside that one file and explicitly anticipates
   kinds being added; new figures extend it. Noted deviation: file will
   exceed the 800-line house guideline; the pinned test contract wins here.
6. **Tests ship with figures.** Pin-test extensions land in the same commit
   as the kind they pin.
7. **Placement micro-decisions are implementation judgment.** Which exact
   companion section hosts `shadow`/`wrongness`, and whether amended
   `handoff`/`workshop` also appear on the companion page, follows prose fit;
   recorded in the status log when made.

## Deliverables

| Bead | Deliverable |
|---|---|
| sjai-zmj.1 | Grammar legend primitives (durable double-outline, crash bolt on edges, hourglass, lock/fence, shadow barrier, red edge not component, dashed at-least-once, circular retry) |
| sjai-zmj.2 | New kind `shadow` — glass wall + two-switch modes |
| sjai-zmj.3 | New kind `wrongness` — durable wrongness canary, red marker on the application adapter |
| sjai-zmj.4 | New kind `scattered` — five swimlanes, fractures on edges |
| sjai-zmj.5 | `boundary` reworked to three tiers, middle tier emphasized |
| sjai-zmj.6 | Amendments to `handoff`, `recovery`, `workshop`, `ownership` |
| sjai-zmj.7 | Companion placements + article inserts + readingOrder pin |
| sjai-zmj.8 | Companion prose extraction doc + no-ai-slop pass applied |
| sjai-zmj.9 | Final verification: gates + browser matrix |

## Acceptance criteria

- [ ] A1 `node --test tests/temporal-agent-orchestration-article.test.mjs`
      passes against source, with kinds `shadow`, `wrongness`, `scattered`
      present (≥10 kinds counted, five pinned elements each).
- [ ] A2 `grep -c 'svg-box--durable\|svg-bolt\|svg-barrier'
      ConceptFigure.astro` > 0 and each new/amended figure uses the grammar
      classes its semantics call for; no hardcoded `#fff`/`#000`; no
      `overflow-x: auto` (pin test).
- [ ] A3 `boundary` renders three tiers (inside / at the boundary / outside).
- [ ] A4 `recovery` is a timeline: three persistent rows + two temporary
      Worker boxes; desc + fallback state the agent is not replayed.
- [ ] A5 `handoff` draws two adjacent crash windows with separate
      protections; heartbeat not presented as duplicate-launch protection.
- [ ] A6 `workshop` places the all-store watchdog outside the delivery loop.
- [ ] A7 `ownership` draws bidirectional Beads↔Activities verification.
- [ ] A8 Companion §1 renders `scattered`; `shadow` + `wrongness` placed on
      companion; article renders `shadow` (see decision 8); readingOrder pin
      updated and passing.
- [ ] A9 `npm run check` passes.
- [ ] A10 `npm run build` passes and pin test re-passes against fresh dist.
- [ ] A11 Real-browser walk of both pages: 6 viewport widths × 2 themes,
      zero horizontal overflow, fallback lists render below 720px. Evidence
      artifact saved.
- [ ] A12 `docs/companion-prose-for-voice-pass.md` exists, same format as
      the article extraction, covering all visitor-facing companion prose
      including new figure captions/fallbacks.
- [ ] A13 no-ai-slop pass applied: zero hard-ban violations (em dash,
      agreement openers, hedging stacks, honesty-signaling, self-history,
      structure-narration) in companion prose + new figure text; article
      only where a sentence violated a hard ban.
- [ ] A14 One local commit per deliverable on
      `feature/temporal-research-walkthrough`; working tree clean; nothing
      pushed.

8. **(2026-08-01, mid-execution) Article insert is `shadow` only.** The
   article's canary section tells the earlier four-defect canary
   (CanaryFigure); the latest two-step store-identity canary appears nowhere
   in its prose. Inserting `wrongness` there would assert a story the
   article never tells, forcing a prose rewrite, which the handoff bans.
   `wrongness` is companion-only (§06, where the prose describes it).
   `shadow` inserts after the "What's running now" opening paragraph, whose
   text is the glass-wall statement. Amends decision 2.
9. **(2026-08-01) Companion placement map (decision 7 resolved):**
   §problem → `scattered`; §01 converted → `shadow`; §02 before/after →
   `handoff` (after the architecture cards); §03 who-owns → `ownership`;
   §04 worker-dies → `recovery`; §05 evidence → `workshop`; §06 didn't-fix →
   `wrongness` (copy split after the canary paragraph) + `boundary`.
   Article readingOrder pin becomes [siblings, orchestrator, ownership,
   handoff, recovery, workshop, shadow, boundary].

10. **(2026-08-01) Companion extraction supersedes article doc §6.** After
    the handoff was written, `article-prose-for-voice-pass.md` gained a §6
    carrying the companion prose. The new
    `docs/companion-prose-for-voice-pass.md` carries that prose plus all
    new/amended figure text; §6 now points forward to it.

## Status log

- 2026-08-01: Goal opened. Grill-me decisions 1–4 taken by Stephanie;
  5–7 derived from repo. Beads sjai-zmj.1–.9 created with dependency chain
  (.1 → .2–.6 → .7 → .8 → .9).
- 2026-08-01: Beads .1–.7 closed. 14-agent design workflow (7 designers, 7
  adversarial critics) produced all blocks; every critique fix applied at
  integration. One escaped defect caught and fixed: the recovery amendment
  broke the companion pin `/heartbeat carries progress, not the identity/`
  (gate had only run the article suite; all four temporal suites gate every
  commit from db94324 on).
- 2026-08-01: Voice pass (bead .8). Mechanical scans: zero em dashes, zero
  banned words in companion + figures. Fixes: cut the article's "Two lists,
  and the first one is the short one" (structure narration, the one
  hard-ban touch); trimmed the wrongness and recovery captions' status
  sentences and the wrongness fallback status item (each stated one half of
  the two-half status rule, and the adjacent page prose already carries the
  full status). Companion page prose itself needed nothing beyond the
  earlier 7f5532c de-slop pass. Stephanie's personal voice pass remains
  owed on the diff, from docs/companion-prose-for-voice-pass.md.
