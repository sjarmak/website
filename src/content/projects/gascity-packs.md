---
title: Gas City Packs
status: active
domain: tooling
summary: Reusable packs for Gas City. The PR-pipeline and Slack packs are mine.
role: Maintainer
repo: https://github.com/gastownhall/gascity-packs
architecture: https://sjarmak.github.io/gascity-packs/
tech: [Go, Python, Agents]
order: 17
topics: [agents, code-intelligence]
tags: [agents, packs]
---

Packs are reusable integrations for the Gas City orchestrator; I built the PR-pipeline pack and the Slack pack, and most of the engineering went into the Slack pack. A Slack message reaches a Gas City agent and leaves again through three layers speaking HTTP: a Go adapter that terminates Slack's webhook, verifies HMAC-SHA256 signatures per workspace inside a five-minute replay window, and routes inbound messages to agent sessions; a Go CLI whose setup verbs write five JSON registries with atomic temp-and-rename and an all-or-nothing SIGHUP reload; and eleven Python one-shot commands behind `gc slack <verb>` wrappers. The split keeps the concurrency-heavy state (single-flight session spawn, dedup cache, registry lifecycle) in a race-detector-clean compiled binary, while the code that changes weekly stays in Python.

The adapter's go.mod has no dependencies, and that has been defended twice: once by duplicating a registry schema rather than importing orchestrator internals, and once by closing a symlink race with a hand-rolled path walk using stdlib openat and O_NOFOLLOW, the same kernel guarantee as openat2's RESOLVE_BENEATH with zero new imports.

The posture is fail-closed wherever a wire shape is ambiguous. The bug that taught it: the publish CLIs exited 0 on any HTTP 200 while ignoring the receipt's delivered field, so an auth failure or a renamed channel meant silent message loss with a success audit trail. The fix centralized receipt interpretation in one function that treats any unrecognized shape as a failure. Retries carry an idempotency key that the orchestrator dedups against a short delivered-receipt window, so a delivered-but-timed-out POST can't double-post.

Load shedding is the sharpest standing edge. Slack demands an acknowledgment within three seconds, so on saturation the adapter returns 200 and drops the event rather than blocking. A 503 would invite Slack's retry, but sustained delivery failures get an app's event subscription disabled, so the drop stays and the mitigation is observability: a dropped-dispatch counter on the health endpoint that has, so far, stayed at zero in the deployments I run.
