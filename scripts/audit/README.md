# R14 audit instrument — LLM bio audit

Manual-run instrument recording which sjarmak.ai URLs public LLM/search
endpoints cite for identity and concept-adjacent queries. It is the growth
gate for the `/concepts/*` allowlist (PRD `prd_two_register_site_architecture.md`,
R14): expansion requires evidence from this instrument, and the pre-registered
kill criterion below shrinks the surface if the evidence stays flat.

**MANUAL-RUN ONLY.** This script is never wired into CI or cron. The only
automation is a monthly reminder bead filed by the digest cron
(`scripts/audit/audit-reminder.mjs`) — a reminder to run the audit by hand,
never a run of the audit.

## Running

```bash
node scripts/audit/llm-bio-audit.mjs                 # all lanes
node scripts/audit/llm-bio-audit.mjs --endpoints perplexity,duckduckgo
node scripts/audit/llm-bio-audit.mjs --timeout 60000 --date 2026-07-04
```

Reports (dated JSON + markdown) are written OUTSIDE the repo, to
`$CONCEPTS_PIPELINE_HOME/audits/` (default `~/.concepts-pipeline/audits/`) —
the same out-of-repo pipeline home the concepts pipeline uses, so `git add -A`
can never sweep a report into a commit.

Lanes and their keys (env only — keys are never committed; an absent key
skips the lane, recorded as `unavailable`):

| lane | env key |
|------|---------|
| perplexity | `PERPLEXITY_API_KEY` |
| openai | `OPENAI_API_KEY` |
| anthropic | `ANTHROPIC_API_KEY` |
| brave-search | `BRAVE_SEARCH_API_KEY` |
| duckduckgo | none (keyless) |

The question set lives in `scripts/audit/questions.json` (identity queries
plus concept-adjacent queries keyed to the at-floor concepts).

## Flatness — numeric definition (pre-registered)

A full run = all configured scripted lanes attempted **and** the Search
Console lane recorded for the same period.

**flat = zero distinct `/concepts/*` sjarmak.ai URLs cited or impressed
across all available lanes in a full run** — i.e. `summary.conceptUrlsCited
== 0` in the report AND zero impressions on `/concepts/*` URLs in Search
Console for the audit period.

A scripted run with **zero available lanes** is *indeterminate*
(`summary.flat == null`), not flat: it counts toward the kill criterion only
if the Search Console lane also shows zero `/concepts/*` impressions for the
period. An indeterminate scripted run with no Search Console reading counts
as no audit at all.

## Kill criterion (verbatim from R14)

> **Pre-registered kill criterion (B's dissent gets teeth): two consecutive
> flat audits shrink the allowlist to authored-body pages only and stop
> DefinedTerm emission — adjudicated honestly at the R18-scheduled review,
> not frozen-by-default.**

Procedure when two consecutive audits are flat (per the numeric definition
above):

1. Bring both dated reports (plus their Search Console readings) to the
   R18-scheduled review — the adjudication happens there, honestly, not
   frozen-by-default.
2. On confirmation, shrink the concepts allowlist (the committed file under
   `src/` that is the sole determinant of indexability, per R4′) to
   authored-body pages only.
3. Stop DefinedTerm emission on the de-listed pages (withheld automatically
   for non-allowlisted pages by the R4′ machinery — the allowlist commit IS
   the lever).
4. Struck pages stay live as noindex reference cards; nothing 404s.

## Search Console wiring (primary evidence lane)

The scripted LLM queries above are the fragile secondary lane. Google Search
Console is the primary lane. One-time setup (~15 minutes):

1. Go to <https://search.google.com/search-console> and add a property.
   Choose **Domain** property `sjarmak.ai` (covers www and non-www, http and
   https).
2. Verify via DNS: Search Console shows a TXT record
   (`google-site-verification=…`); add it to the `sjarmak.ai` DNS zone at the
   registrar, wait for propagation, click Verify.
3. Submit the sitemap: Indexing → Sitemaps → enter
   `https://www.sjarmak.ai/sitemap-index.xml` → Submit.
4. Confirm data flows (takes a day or two): Performance → Search results
   should start showing queries and impressions.

Per-audit reading (do this alongside every scripted run):

1. Performance → Search results, set the date range to the period since the
   previous audit.
2. Add filter Page → URLs containing → `/concepts/`.
3. Record total impressions and clicks for that filter, plus the top queries,
   into the audit's markdown report (an `## Search Console` section appended
   by hand).
4. Zero impressions on the `/concepts/` filter = flat for this lane.

## Reminder bead (the only cron touchpoint)

`scripts/digest/run.sh` calls `scripts/audit/audit-reminder.mjs` at the end
of each digest run. The reminder:

- files at most **one** bead per calendar month (state:
  `<pipeline-home>/audits/reminder-state.json`);
- references **counts and dates only** (number of reports on file, last audit
  date) — never report content;
- never runs the audit itself;
- supports `--dry-run` (prints the `bd create` argv instead of executing) and
  `--now YYYY-MM-DD` for tests.
