---
title: Personal Website
status: active
domain: tooling
summary: "sjarmak.ai: an Astro static site whose content collections form a typed knowledge graph. This very project entry is one node in it."
role: Creator
repo: https://github.com/sjarmak/website
homepage: https://sjarmak.ai
architecture: https://sjarmak.github.io/website/
tech: [Astro, TypeScript, Zod, Cytoscape, MDX]
order: 23
topics: [knowledge-graphs, agents]
tags: [astro, knowledge-graph, content]
---

The site is the catalog you are reading: every project, paper, talk, and topic lives as a Markdown file under `src/content/`, loaded through Astro content collections and validated by Zod schemas at build time. The projects collection is the backbone of a knowledge graph rather than a flat list: entries carry `reference()` edges to topics, outputs, and related projects, so a typo'd slug or a dangling link is an `astro check` failure in CI rather than a silently broken page. The graph those references describe is rendered live with Cytoscape and an fcose layout, which means the navigation surface is derived from the same typed data that drives the prose pages. This entry is itself a node: the website appears inside the graph the website builds.

Structurally it stays simple by design. It is a static build (no server, no database in production) deployed on Render by pushing to `main`; `sharp` handles image optimization, MDX carries the long-form writing, and the whole content layer is a directory of Markdown that a human or an agent can edit without touching a line of TypeScript. The schema in `src/content.config.ts` is the single contract: thirteen collections (cv, publications, press, projects, topics, outputs, writing, posts, talks, art, learning, digest, transcripts) each pin their frontmatter shape, and the enums (`status`, `domain`, `kind`) keep the editorial vocabulary closed so the filters and graph hubs stay coherent as the corpus grows.

The one moving part beyond static rendering is the digest pipeline: a cron agent produces newsletter and podcast issues into the `digest` collection (`origin: auto`), alongside hand-curated issues, with audio transcripts joined back to their source entries by `audioUrl`. Issue tracking runs on bd/beads with a local Dolt database synced over the git remote, so the project's todo state travels with the repo instead of living in a separate tool. The design bet is the same one livedocs makes from the other direction: keep the source of truth structured and typed, and let everything downstream (pages, graph, feeds, agents) be a projection of it rather than a parallel copy that drifts.
