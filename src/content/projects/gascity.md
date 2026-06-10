---
title: Gas City
status: active
domain: ai-agents
summary: "An orchestration-builder SDK for multi-agent coding workflows. I'm a maintainer."
role: Maintainer
repo: https://github.com/gastownhall/gascity
tech: [Go, Agents, Orchestration]
featured: true
featuredOrder: 2
order: 1
topics: [agents, code-intelligence]
tags: [agents, orchestration]
---

Between April 8 and June 9, 2026, 152 of my pull requests merged into Gas City, a Go runtime for building orchestrations of coding agents. A supervisor reconciles desired against actual state every tick; agents run as tmux-hosted sessions inside per-repo rigs; work lives in Dolt-backed issue beads; formulas compile multi-step workflows that get slung to workers; and a mail plus external-messaging layer connects agents to each other and to channels like Slack. The maintenance work spans most of that surface: the reconciler, dispatch, session lifecycle, the beads layer, the HTTP API, formulas, and external messaging.

Maintaining an agent orchestrator is mostly defending one property: the city keeps running unattended. The early arc was crash-and-wedge work — recovering reconciler panics so one bad rig can't cascade a whole city down, reaping session beads whose tmux session had died, preserving managed sessions across supervisor restarts, tearing down sessions that failed mid-create, and fixing the wedge where `gc session close` could strand its own work. The later arc was performance under real load, on cities whose stores had grown past two hundred thousand beads: hydration-free parallel status counts made the city-status endpoint roughly 100x faster, bead reads and formula feeds became bounded and deterministic, and the workflow-snapshot scan stopped re-listing metadata it already held.

A second thread is the fail-loud posture. The bd CLI silently falling back to on-disk mode became a loud error; an import revert that reported success became an error; formula filters that silently returned empty on unexpected output got validation; a malformed agent-settings override now says exactly what is wrong. And because agents both produce and consume the system's text, some hardening is security-shaped: stripping system-reminder breakout sequences from user-controlled fields, rejecting worktree spawns under stale ancestor `.git` pointers, and symlink-escape checks on dispatch paths.

Maintainership is also the review side: triaging incoming contributor PRs, mapping blast radius across the supervisor's shared code paths before accepting a change, and keeping CI honest by quarantining flaky integration tests with tracking anchors, running the full suite when cross-cutting core paths change, and replacing sleeps with drains in racy tests. The adjacent projects here grew out of the same work: the [dashboard](/projects/gascity-dashboard) that watches a running city, the [packs](/projects/gascity-packs) that connect it to Slack and GitHub, and the [mem](/projects/mem) benchmark that mines a city's work exhaust for agentic memory.
