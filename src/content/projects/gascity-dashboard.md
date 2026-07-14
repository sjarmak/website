---
title: Gas City Dashboard
status: active
domain: tooling
summary: A dashboard for Gas City multi-agent orchestrations.
role: Maintainer
repo: https://github.com/gastownhall/gascity-dashboard
architecture: https://sjarmak.github.io/gascity-dashboard/
tech: [TypeScript, React]
order: 18
topics: [agents, code-intelligence]
tags: [agents, dashboard]
---

An editorial-typographic cockpit for a single operator watching a Gas City supervisor run multi-agent work. Status reads as typeset sentences rather than dashboard swatches: a binding `DESIGN.md` at the repo root sets the visual law (low-chroma OKLCH palette, quiet by default and loud on demand, one mark for attention), with Datadog-style information theatre named as the explicit anti-reference.

Structurally it is three npm workspaces with a narrow seam: a shared package holding the DTOs and a generated OpenAPI client, so a contract mismatch is a compile error rather than a runtime `undefined`; a backend that owns only what the browser can't (allow-listed subprocess execution, background health samplers, an audit log, a transport-only proxy); and a React frontend that talks to the supervisor directly through the generated client. The central rule is the direct-supervisor boundary: the backend is forbidden from growing mirror routes or DTO facades for supervisor data, because the repo is temporary: it folds back into Gas City proper, and every mirrored DTO would be a second copy of supervisor truth to migrate and delete.

The frontend assumes the supervisor is slow and flaky under load and budgets every read: a 2.5-second preview that blocks first paint, a 15-second required core read that is the only failure allowed to blank the page, and a 30-second background wide scan, with event bursts coalesced and failed refreshes republishing the last good snapshot tagged stale instead of blanking. Provenance (fresh, stale, error, fixture) travels on every alert, so degraded data can never impersonate truth. The nav badge and the runs page render the same snapshot object from one provider, making badge/page divergence structurally impossible, a property learned the hard way after an epic's worth of undercounts traced to two readers computing from different fetches.

The recurring lessons generalized. Two readers of one truth always drift, and the durable fix is structural unification, not synchronized parallel code. Validation at the wrong layer breaks evolution: strict Zod response validation runs at the client edge, but it must never reject the supervisor's valid degraded payloads, because an over-strict validator that blanks on legitimate partial data is exactly the failure the boundary guards against. Timeouts must be sized to the measured slow path, not the happy path. The repo's terminal goal is to replace `gc dashboard` inside Gas City itself, and every supervisor API gap it papers over client-side is tagged with a deletion condition for that fold-back.
