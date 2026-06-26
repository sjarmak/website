# Architecture orientation — website

_Mechanically derived from the LikeC4 model (`likec4 export json`). High-altitude map only — names every subsystem, its purpose, delivery state, and exact source path so you targeted-read instead of grep-walking. For symbol-level depth, hand a source link below to an Explore/CodeGraph agent._

## Subsystems (32 elements)

- **Author / agent** (actor)
  Stephanie or an agent editing Markdown under src/content/ and pushing to main
- **Claude API (claude-auto)** (externalSystem)
  Multi-account router the digest cron drives headless to write each issue
- **code-intel-copilot MCP** (externalSystem)
  Item feed the digest agent queries for recent code-intelligence sources
- **Digest cron** (actor)
  Local scheduled job that runs claude-auto -p to produce a digest issue, then pushes
- **GitHub** (externalSystem)
  sjarmak/website repo — source of truth, Actions CI (astro check + build), and Pages for the architecture model
  - **main branch** (datastore)
    Code + Markdown content; push to main is the deploy trigger
- **NASA ADS / SciX** (externalSystem)
  biblib + full text the knowledge pipeline pulls to build research libraries and explorers
- **Render** (externalSystem)
  Static host.
- **Visitor** (actor)
  Reads sjarmak.ai — projects, writing, research, talks, the knowledge graph, the digest
- **sjarmak.ai** (system)
  Astro static site whose Markdown content collections form a typed knowledge graph, rendered to static HTML
  ↳ `../README.md, ../AGENTS.md, ../astro.config.mjs`
  - **Content collections** (datastore) #built
    src/content/ — 13 Markdown collections (projects, topics, outputs, cv, publications, posts, writing, talks, p…
    ↳ `../src/content`
  - **Digest pipeline** (container) #evolving
    scripts/digest — cron generates a newsletter+podcast issue via claude-auto, renders audio with local Kokoro T…
    ↳ `../scripts/digest`
    - **publish + repeat guard** (component) #built
      Validate an issue spec → write the digest collection entry; recent-coverage.mjs dedupes item URLs across rece…
      ↳ `../scripts/digest/publish-digest.mjs, ../scripts/digest/recent-coverage.mjs`
    - **run.sh (cron entry)** (component) #evolving
      generate → commit → (DIGEST_PUSH=1) push; daily/weekly × specialized/general tracks + curated
      ↳ `../scripts/digest/run.sh`
    - **Kokoro TTS render** (component) #evolving
      Transcript → chunked local Kokoro TTS (fully offline) → single MP3 under public/media/digests/
      ↳ `../scripts/digest/tts-render.mjs, ../scripts/digest/kokoro-render.py`
  - **Knowledge graph** (container) #built
    src/lib/graph + src/scripts — build the project/topic/output node-edge set at build time; Cytoscape + fcose r…
    ↳ `../src/lib/graph/buildGraph.ts`
    - **buildGraph + buildTimeline** (component) #built
      Resolves projects↔topics↔outputs references into a deduped node/edge graph (and a timeline projection)
      ↳ `../src/lib/graph/buildGraph.ts, ../src/lib/graph/buildTimeline.ts`
    - **client graph explorer** (component) #built
      Cytoscape/fcose pan-zoom-filter explorer + mini-graph, hydrated client-side from the build-time graph data
      ↳ `../src/scripts/graph-explorer.ts, ../src/scripts/graph-style.ts`
    - **starmap projection** (component) #research
      Alternate star-map layout of the same graph data (prototype surface)
      ↳ `../src/lib/starmap/buildStarmap.ts`
  - **Knowledge hub** (container) #evolving
    src/lib/knowledge — resolves curated threads against committed JSON, then computes 3 retrieval lanes (semanti…
    ↳ `../src/lib/knowledge/build.ts`
    - **hub assembler** (component) #evolving
      Joins threads/papers/libraries/explorers JSON to content; emits node + related lists the pages embed
      ↳ `../src/lib/knowledge/build.ts`
    - **retrieval lanes (BM25 + embeddings + RRF)** (component) #evolving
      Lexical BM25, embedding dot-product, and graph lanes fused with reciprocal-rank fusion over the curated node…
      ↳ `../src/lib/knowledge/retrieval.ts`
  - **Knowledge build (libraries/explorers)** (container) #evolving
    scripts/knowledge — Python that pulls NASA ADS biblib + SciX, validates in-repo explorers, and folds new dige…
    ↳ `../scripts/knowledge`
    - **build_libraries + explorers** (component) #evolving
      Pull biblib (live), validate explorer JSON, recompute counts, assemble the committed libraries.json / explore…
      ↳ `../scripts/knowledge/build_libraries.py, ../scripts/knowledge/build_explorers.py`
    - **build_embeddings** (component) #research
      Compute embeddings for the knowledge hub retrieval lane (needs the brainstorm venv); snapshot-at-author-time…
      ↳ `../scripts/knowledge/build_embeddings.py`
  - **Content schema** (container) #built
    content.config.ts — Zod schema per collection; reference() edges (projects→topics/outputs/related) make a dan…
    ↳ `../src/content.config.ts`
  - **Astro site (SSG)** (container)
    src/pages + layouts + components — route pages rendered to static HTML at build
    ↳ `../src/pages`
    - **collection helpers** (component) #built
      getProjects / CV grouping / date helpers — typed reads over the content layer for pages
      ↳ `../src/lib/collections.ts, ../src/lib/dates.ts`
    - **components + nav + theme** (component) #built
      Header/Footer, ThemeToggle (no-flash ThemeScript), receipts, embedded video, primitives
      ↳ `../src/components/nav/Header.astro, ../src/components/nav/ThemeScript.astro`
    - **layouts + head** (component) #built
      BaseLayout / PageLayout + BaseHead (canonical, sitemap, OG)
      ↳ `../src/layouts/BaseLayout.astro, ../src/components/head/BaseHead.astro`
    - **route pages** (component) #built
      Project, writing, research, cv, talks, art, digest, library routes incl.
      ↳ `../src/pages/projects/index.astro, ../src/pages/projects/[slug].astro, ../src/pages/rss.xml.ts`
    - **prototypes (/prototypes)** (component) #research
      Opt-in experiments not in the primary nav: graph-time, starmap, research-atlas, questions, receipts, reading…
      ↳ `../src/pages/prototypes`

## Connections (19 edges)

- `visitor` → `website.site`: browses sjarmak.ai (static HTML)
- `visitor` → `website.graph.explorer`: pans / filters the knowledge graph
- `author` → `website.content`: edits Markdown, pushes to main
- `website.schema` → `website.content`: validates frontmatter + reference() edges (build error on drift)
- `website.site` → `website.schema`: typed collection reads
- `website.graph.buildGraph` → `website.content`: reads projects↔topics↔outputs references
- `website.site` → `website.graph`: embeds build-time graph data
- `website.knowledge.knowledgeBuild` → `website.content`: joins curated threads to content
- `website.site` → `website.knowledge`: embeds node + related lists
- `digestCron` → `website.digest.runner`: scheduled invoke
- `website.digest.runner` → `claudeBackend`: claude-auto -p (headless authoring)
- `claudeBackend` → `codeIntelMcp`: select recent items
- `website.digest.publish` → `website.content`: write digest collection entry
- `website.digest.tts` → `render`: MP3 under public/media (served static)
- `website.knowledgeBuild.buildLibraries` → `nasaAds`: pull biblib + full text
- `website.knowledgeBuild.buildLibraries` → `website.knowledge`: commits libraries.json / explorers.json
- `website.content` → `github.repo`: committed + pushed to main
- `website.site` → `github.repo`: npm run build → ./dist
- `github.repo` → `render`: autoDeploy on checksPass → serve ./dist
