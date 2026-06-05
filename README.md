# sjarmak.ai

Personal site for Stephanie Jarmak. Astro static site, warm "archival atlas" design, with an interactive knowledge-graph projects explorer. Deployed on Render from this repo.

## Develop

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static output to ./dist
npm run preview    # serve the built site
npm run check      # type-check (astro check)
```

Node 22 (see `.nvmrc`).

## Architecture

- **Framework:** Astro 5 (static), zero JS by default. Islands only for the theme toggle, video facades, and the graph explorer.
- **Content:** Markdown/MDX in `src/content/`, typed by Zod schemas in `src/content.config.ts` (the single source of truth). Add/edit content by editing Markdown and pushing.
- **Design system:** `src/styles/tokens.css` (OKLCH warm-archival palette, light default + dark "viewing room"), `typography.css` (self-hosted Literata + Hanken Grotesk).
- **Knowledge graph:** `src/lib/graph/buildGraph.ts` compiles nodes/edges from content `reference()` links at build time. The `/projects/explorer` page renders an accessible fallback list (always) plus a lazily-loaded Cytoscape canvas (`src/scripts/graph-explorer.ts`).

## Authoring content

Each collection is a folder under `src/content/`. One Markdown file per entry; the filename (minus extension) is its id.

| Collection | What it is |
|---|---|
| `cv` | Roles, education, affiliations, awards (timeline) |
| `publications` | Papers and preprints |
| `press` | Media coverage |
| `projects` | Project entries (also the graph's project nodes) |
| `topics` | Graph topic hubs |
| `outputs` | Papers/posts/talks as graph leaf nodes |
| `writing` | Unified writing index (links to Medium / Sourcegraph / on-site posts) |
| `posts` | On-site long-form essays (rendered) |
| `talks` | Talks and webinars (optional video embed) |
| `astrophoto` | Astrophotography (local display master + optional Cloudinary `remoteFull`) |
| `art` | Art, music, children's books |

The knowledge graph wires itself from frontmatter: a project's `topics:` and `outputs:` arrays (and a topic's `related:`) become graph edges. Broken references fail the build.

### Images

Put web-display images in `src/assets/…` and reference them via the schema's `image()` field (Astro optimizes them). For full-resolution astrophotography originals, host on Cloudinary and set `remoteFull:` to the URL (allowed domain configured in `astro.config.mjs`).

## Deploy (Render)

`render.yaml` defines a static site: `npm ci && npm run build` → `./dist`, auto-deploying on push to `main`.

1. Push this repo to GitHub (`sjarmak/website`, public).
2. In Render: New → Blueprint → connect the repo. It reads `render.yaml`.
3. Add the custom domain `sjarmak.ai` (+ `www`) and set DNS at the registrar (apex ALIAS/A, `www` CNAME) per Render's instructions. TLS is automatic.
4. Set `site` in `astro.config.mjs` is already `https://sjarmak.ai` (drives canonical/sitemap/RSS).

### Analytics

`BaseHead.astro` includes a production-only Cloudflare Web Analytics beacon. Replace `REPLACE_WITH_CF_TOKEN` with the real token (or remove the snippet).

### sjarmak.com → sjarmak.ai (deferred)

Once DNS access for sjarmak.com (currently on WordPress.com) is available, add it to Render and 301-redirect the whole domain to `https://sjarmak.ai`.

## Plan

Full design rationale and decisions: `~/.claude/plans/i-currently-have-a-snuggly-pearl.md`.
