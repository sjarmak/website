# Project Instructions for AI Agents

This file provides instructions and context for AI coding agents working on this project.

See `AGENTS.md` for issue tracking: work is tracked as GitHub issues, not beads.


## Build & Test

Astro static site. Mirror CI locally before pushing:

```bash
npm ci
npm run check   # astro check (type/diagnostics) — CI gate
npm run build   # astro build → ./dist — CI gate
```

## Deployment

Prod is **Render static site `sjarmak-ai` → https://www.sjarmak.ai**, built from
this repo's `main` branch (config: `render.yaml`).

- **Trigger:** any push to `main` auto-deploys, but **only after the GitHub CI
  check passes** (`autoDeployTrigger: checksPass`; CI = `.github/workflows/ci.yml`
  = `npm run check` + `npm run build`). A red check silently blocks the deploy —
  if a change isn't live, check `gh run list` first.
- **Build:** `npm ci && npm run build` → publishes `./dist`. Astro compiles
  `src/` and copies `public/` in verbatim.
- **buildFilter:** Render only rebuilds when a push touches `src/**`, `public/**`,
  `astro.config.mjs`, `tsconfig.json`, or `package*.json`.

### Ordinary site changes (pages, content, styles)

Edit under `src/` (`pages/`, `components/`, `layouts/`, `styles/`, `content/`) or
static files under `public/`, then:

```bash
npm run check && npm run build      # mirror CI locally
git add -A && git commit -m "..."
git push                            # → CI passes → Render deploys (~2 min)
```

(A digest cron also auto-pushes daily content commits here — that's expected;
each carries a CI check and deploys.)

### Sub-games (`public/games/<game>/`)

Games like `embertide` and `wheel-of-fortune` are **pre-built copies committed
under `public/games/<game>/`** — the site does NOT build them. To update one,
rebuild it in its own repo and sync the build in, then commit + push here.

For embertide (from the `projects/embertide` repo):

```bash
npm run deploy:site                 # build:web + rsync into website/public/games/embertide
```

then in this repo:

```bash
git add public/games/embertide
git commit -m "games/embertide: update build"
git push                            # → Render deploys
```

**Cache gotcha:** `_astro/*` and `fonts/*` are served `immutable, max-age=1yr`.
Astro bundles are content-hashed so they bust automatically, but game assets at
**stable, unhashed paths** (e.g. `/games/embertide/illustrations/*.webp`) do NOT
bust on content change. When changing such an asset in place, **bump its
filename** (e.g. `craghorn_001 → craghorn_003`) or browsers/CDN keep the old one.

## Architecture orientation (LikeC4-derived)

@architecture/exports/orient.md

_A mechanically-derived high-altitude map of this rig's subsystems (from the LikeC4 model). Orient off it — names every container/component, its purpose, delivery state, and exact source path — then targeted-read the files it points at instead of grep-walking. Regenerated daily by the city `likec4-orient-refresh` order; for symbol-level depth hand a source link to an Explore/CodeGraph agent._

## Conventions & Patterns

### Radar (link watchlist)

"Add this link to our radar" / "add to the radar" means append an entry to the
`links` content collection, which powers the `/radar` page.

- **File:** `src/content/links/inbox.yaml` — a single YAML array; append one block, no `id` needed (it's derived from `title`).
- **Fields:** `title`, `url`, `category` (freeform string used verbatim as the section heading — reuse an existing one to group under it), `kind` (`tool|repo|article|paper|video|thread|other`), `note` (why it's worth a follow-up), `tags` (array), `added` (date), optional `featured`.
- **Schema:** defined in `src/content.config.ts` (`links` collection); page at `src/pages/radar.astro`; grouping helper `getLinksByCategory()` in `src/lib/collections.ts`.
- Reuse the exact spelling of an existing `category` to file under it; a new string starts a new section. Then commit + push like any content change (CI check → Render deploy).
- **Fetch the page/README before writing the `note`, `category`, or `kind` — summarize from the real content, never infer from the name, URL, or repo slug** (e.g. squeakyclean.ai is an agentic Clean-Architecture *codegen* tool, not an AI-writing tool as the name suggests).
