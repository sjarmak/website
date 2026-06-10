---
title: Two retrieval systems write this site
date: 2026-06-10
description: "How sjarmak.ai works: the paper libraries, explorers, and digest podcasts are produced by two retrieval systems exposed over MCP, a 32-million-paper literature engine and a feed pipeline in a 512 MB container, with headless agent runs writing the content and git as the review gate."
tags: [agents, retrieval, mcp, meta]
draft: false
---

The most recent content commit to this site's repo before this post was a purely agent driven cron job: a daily digest for June 10th, one markdown file with eleven items in its frontmatter and a 10-minute MP3 beside it under `public/media/digests/`. A headless Claude session queried a Postgres database of scored feed items over MCP, wrote a newsletter and a podcast transcript, rendered the audio through OpenAI's TTS endpoint, and committed the result locally right around the time I was waking up for the day.

I'm constantly surprised by how capable these harnesses are now, and keep trying to push the limit on ways I can improve my learning and entertainment while reducing the toil involved. Except of course the necessary toil that learning requires, I'm talking about the strictly required complexity not the other stuff.

The resources here, the curated paper libraries and thematic explorers, the daily and weekly digests with their podcast audio, are produced upstream by two systems I built with agents: a literature engine over the full [SciX](https://scixplorer.org) corpus that populates the Library page, and a feed-triage pipeline running that populates the Digest. Both are exposed to agents as MCP servers; the site itself is a static Astro build with no database and no server-side code, very simple and I tried my best for it to *not* resemble gradient globs of slop.

## Everything on the site publishes as a diff

The motivation for revamping my site was searching my name and realizing my old Wordpress was woefully out of date in both presentation and content. I thought hey it's 2026 now, I've made a bunch of websites with these agents, why not make my own much better. So over the weekend I moved off Wordpress and have full control over the setup to do whatever sorts of neat experiments I want. Everything here is markdown and JSON checked into git. Astro content collections with Zod schemas define what a digest issue, an essay, a talk, or a paper library is allowed to look like; `astro build` turns the lot into static HTML; nice and simple. The Library's interactive explorers, the knowledge graph, the digest archive with its audio players: all of it is computed at build time from JSON files sitting in `src/data/`.

## The Library is powered by a 32-million-paper engine

The Library section publishes curated [SciX](https://scixplorer.org) paper libraries and thematic explorers: reading paths through a topic, with a per-paper synthesis. The machinery behind them is a retrieval platform I derived from the [SciX](https://scixplorer.org) corpus and all of its metadata that I run on a single workstation (an RTX 5090 box with 1.9 TB of NVMe): the full [SciX](https://scixplorer.org) corpus, 32.4 million papers spanning 1800 to 2026, in one PostgreSQL 16 instance with pgvector, alongside 299.3 million citation edges and full-text bodies for 14.9 million of the papers. Dense embeddings (INDUS, 768 dimensions, stored as fp16 halfvec) cover the entire corpus. Retrieval is hybrid: a sparse BM25 lane over the text, and a dense HNSW lane, fused with reciprocal rank fusion.

Each explorer paper gets a four-part write-up, plain-language abstract, motivation, methodology, and results, generated from the paper's actual full text fetched section by section through the MCP `read_paper` tool that accesses the full text.

## The Digest sits on a pipeline that fits in 512 MB

The Digest section, daily and weekly issues with newsletters and podcast audio, comes out of a different system: a content-intelligence pipeline, where ingestion, scoring, embeddings, and agents all have to fit a 512 MB container with the Node heap capped at 460 MB.

[Inoreader](https://www.inoreader.com/) feeds and [SciX](https://scixplorer.org) flow in on an hourly cron, resumable via continuation tokens. Each item is normalized, categorized into one of about nine categories, and scored with a hybrid formula: an LLM relevance-and-usefulness judgment blended with BM25 over domain vocabulary, multiplied by watchlist and topic boosts. Everything is batched to respect the container, eight full-text fetches per run, 100 embeddings, 40 LLM scores per category, so full text sometimes arrives a day late, an accepted cost. The design bias throughout is graceful degradation: Anthropic falls back to OpenAI, one web-search provider falls back to another, missing embeddings fall back to pseudo-vectors.

The pipeline is exposed as an MCP server too, with search, semantic search, and aggregation over the scored items, and that surface is what the publishing step consumes.

## Publishing is a headless agent run, and git is the gate

The connections between those systems and this site is `scripts/digest/run.sh`, which invokes `claude -p`, a non-interactive Claude Code session, with a prompt template and the digest MCP tools on the allowlist. The prompt does the editorial work: search the last day or week of scored items, pick what clears the bar, write a newsletter and a podcast transcript grounded in the items' full text. The same template embeds the site's writing-voice rules with a mandatory revision pass against a catalog of AI-prose tells, which is also the process this post went through; it's not a perfect solution, I intend to experiment with training smaller writing models where my requirements can have more impact (it's really hard to motivate a large model to move away from what it was trained on), and like most of the work here it's a hybrid approach of agent + human ;p.

From there it's mostly plumbing. `tts-render.mjs` chunks the transcript through OpenAI TTS and concatenates the audio, `publish-digest.mjs` validates a spec JSON and writes the content-collection entry plus the MP3, and the run commits and pushes on a daily and weekly schedule. A curated variant exists for hand-picked issues: items tagged in the digest UI (I have a separate, auth-protected website for this, which I talk about [here](https://medium.com/@steph.jarmak/rethinking-coding-agent-benchmarks-5cde3c696e4a)), go out through a send-to-website button that writes a handoff JSON and spawns the same pipeline constrained to exactly those items.

## One retrieval shape recurs at three scales

I have this stack running the same pattern at three orders of magnitude. The [SciX](https://scixplorer.org) MCP tools fuse lexical and dense lanes with RRF over 32 million papers; I'm currently slogging through a \*checks watch\* 40+ hour Disk-ANN graph build to try out some optimization experiment, currently in the long tail where even though it's 95% done it has 8+ hours to go. The Digest blends BM25 with LLM scores over tens of thousands of feed items and worries about heap. And the site's own build step, `src/lib/knowledge/build.ts`, runs semantic, lexical, and graph lanes, fused with RRF, mostly for thematic funsies, over a few hundred nodes of projects, talks, and papers to compute the related-content links, at a scale where the embeddings live in a JSON file and the whole computation happens inside `astro build`. Hybrid retrieval plus rank fusion works well at many scales, operationally it's mostly whether an index rebuild takes 3 days or six milliseconds (at least for the user scale of Mostly Just Me).

The tools I've built for the Library and Digest pages are still in progress with their own (Stephanie's-whims-dictated-not-revenue) roadmaps. I've been enjoying figuring out ways I can blend my love of sharing information and connecting it and learning from it all in my own customizable space.
