# Architecture diagram (LikeC4)

Architecture-as-code model of `website` (sjarmak.ai), rendered with
[LikeC4](https://likec4.dev). The model is the source of truth across
[`spec.c4`](spec.c4) (element kinds, tags, deployment node kinds),
[`model.c4`](model.c4) (the system), and [`views.c4`](views.c4) (structure,
walkthrough, and prototype views), with the deployment model in
[`deployment.c4`](deployment.c4). The narrative companion is the repo-root
[`README.md`](../README.md) and the conventions in [`AGENTS.md`](../AGENTS.md).

A little meta: sjarmak.ai is itself one of the projects the site catalogs
(`src/content/projects/personal-website.md`), so this model describes the very
machine that renders it. The site is an Astro static build whose Markdown
content collections are the single source of truth; a Zod schema
(`content.config.ts`) pins each collection and carries `reference()` edges
between projects, topics, and outputs — and those edges *are* the knowledge
graph the site renders with Cytoscape. Everything is computed at build time and
emitted as static HTML to `./dist`, which Render serves. Two offline agent
pipelines feed the content layer: a **digest cron** (claude-auto + Kokoro TTS)
and a **knowledge builder** (NASA ADS → libraries/explorers).

Every element `link`s to its source (`src/…`, `scripts/…`) so any box in the
explorer is one click from the code.

## Delivery state is tagged, not guessed

Every element carries a tag so **prototype / opt-in work renders distinctly from
what is shipped and live** (legend in `spec.c4`):

| Tag | Meaning | Render |
|---|---|---|
| `#built` | live in production, exercised on every build | solid |
| `#evolving` | shipped, but the contract / surface is still moving | solid amber |
| `#planned` | designed, not yet implemented | **dashed, dimmed** |
| `#research` | speculative / opt-in prototype (under `/prototypes`, not in the nav) | **dashed, indigo** |

The shipped spine — content, schema, the Astro build, the knowledge graph — is
`#built`. `#evolving` items: the knowledge hub and its retrieval lanes, both
agent pipelines (digest authoring + the ADS knowledge build). `#research`: the
`/prototypes` surfaces (starmap, research-atlas, reading paths, receipts,
questions) and the embeddings build, which are opt-in and not in the primary
nav.

## Views

**Structure** — the static map:

| View | Scope |
|---|---|
| `index` | system landscape — sjarmak.ai in context of Render, GitHub, the Claude API + code-intel MCP, and NASA ADS |
| `websiteSystem` | the system decomposed into containers (content → schema → build → graph/knowledge, plus the two offline pipelines) |
| `siteContainer` | the Astro build — pages, layouts, components, collection helpers, prototypes |
| `graphContainer` | the knowledge graph — build-time edge resolution → client Cytoscape explorer |
| `knowledgeContainer` | the knowledge hub — curated threads + the three retrieval lanes (semantic / lexical / graph) + RRF |
| `digestContainer` | the digest pipeline — cron runner, publish + repeat guard, Kokoro TTS |
| `knowledgeBuildContainer` | the libraries/explorers builder over NASA ADS |
| `deployment` | where each piece runs — Render edge, GitHub Actions/Pages, the local cron host, the trust boundaries between them |

**Walkthrough flows** (dynamic / numbered-step views):

| View | Flow |
|---|---|
| `publishFlow` | a Markdown edit → schema validation in CI → Render deploy on checksPass → live page |
| `graphFlow` | the knowledge graph derived from `reference()` edges, hydrated client-side |
| `digestFlow` | the digest cron authoring an issue headless, rendering audio offline, and pushing |

**Prototype lens:**

| View | Scope |
|---|---|
| `prototypes` | the `#research` / `#evolving` opt-in surfaces, with the shipped spine dimmed |

### Running the walkthrough

For a review, present in this order: `index` → `websiteSystem` (orient on
structure) → the three walkthrough flows (publish → graph → digest, what
actually happens) → `deployment` (where it runs) → `prototypes` (what's opt-in /
moving). In `npx likec4 start`, the dynamic views animate step-by-step.

## Viewing & regenerating

```bash
# Interactive, hot-reloading explorer (recommended)
npx likec4 start architecture

# Re-export the static PNGs (needs a one-time browser download:
#   npx playwright install chromium-headless-shell)
npx likec4 export png architecture -o architecture/exports

# Validate the model (strict — the source of truth for correctness)
npx likec4 validate architecture
```

The published site (figures + interactive explorer + a landing page matched to
the sjarmak.ai design system) is built by
[`.github/workflows/likec4-pages.yml`](../.github/workflows/likec4-pages.yml) on
any push that touches `architecture/**`, and served at
<https://sjarmak.github.io/website/>.
