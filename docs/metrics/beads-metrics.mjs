#!/usr/bin/env node
/**
 * Read-only metric extractor for the work store.
 *
 * Computes the three work-store metrics that the measurement plan lists and
 * that a real column can support, and refuses to compute the ones that cannot
 * be supported. Every statement goes through the read-only guard and the
 * network client in ./lib; this script never opens the store directory and
 * never issues anything but SELECT.
 *
 *   node docs/metrics/beads-metrics.mjs
 *   node docs/metrics/beads-metrics.mjs --window-start 2026-07-01 --window-end 2026-07-31
 *   node docs/metrics/beads-metrics.mjs --stores gc,website --out /tmp/metrics.json
 *
 * Output is one JSON document on stdout, scrubbed of work IDs, outcome IDs,
 * store references, session identities and absolute paths unless --raw is
 * passed. --raw output is for local inspection only and must not be pasted
 * into a reader-facing surface.
 *
 * Exit codes: 0 success, 2 store unreachable or a query failed. There is no
 * path on which an unreachable store produces a zero.
 */

import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import {
  DEFAULT_STORES,
  DoltQueryError,
  DoltUnavailableError,
  query,
  readServerPort,
  toNumber,
} from './lib/dolt-client.mjs';
import { summarize } from './lib/stats.mjs';
import { groupKey, scrubDeep } from './lib/scrub.mjs';

const IDENT = /^[A-Za-z0-9_]+$/;

/** Guard the one place a caller-supplied string reaches SQL. */
function safeStore(name) {
  if (!IDENT.test(name)) {
    throw new Error(`refusing store name that is not a bare identifier: ${JSON.stringify(name)}`);
  }
  return name;
}

/** Build an inclusive-start, exclusive-end SQL predicate over a datetime column. */
function windowPredicate(column, windowStart, windowEnd) {
  const parts = [];
  if (windowStart) parts.push(`${column} >= '${sqlDate(windowStart)}'`);
  if (windowEnd) parts.push(`${column} < '${sqlDate(windowEnd)}'`);
  return parts.length ? ` AND ${parts.join(' AND ')}` : '';
}

/** Accept only an ISO-ish date or datetime; anything else is rejected outright. */
function sqlDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?$/.test(value)) {
    throw new Error(`window bound must be YYYY-MM-DD[ HH:MM[:SS]], got ${JSON.stringify(value)}`);
  }
  return value.replace('T', ' ');
}

/**
 * The server's JSON result format omits a column entirely when its value is
 * NULL, so an absent key and an explicit null mean the same thing here. Every
 * nullable read goes through this rather than comparing against null directly.
 */
function isNullish(value) {
  return value === null || value === undefined || value === '';
}

/** RFC3339Nano string to epoch milliseconds. Throws rather than returning NaN. */
function parseRfc3339(value, field) {
  if (typeof value !== 'string' || value === '') {
    throw new DoltQueryError(`expected a timestamp for ${field}, got ${JSON.stringify(value)}`);
  }
  // JS Date truncates beyond milliseconds, which is well below the resolution
  // any of these latencies are reported at.
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) {
    throw new DoltQueryError(`unparseable timestamp for ${field}: ${JSON.stringify(value)}`);
  }
  return ms;
}

/* ------------------------------------------------------------------ *
 * Metric: claim-to-terminal duration, and claims with no terminal close
 * ------------------------------------------------------------------ */

function claimDurations(store, opts) {
  const db = safeStore(store);
  const pred = windowPredicate('c.created_at', opts.windowStart, opts.windowEnd);
  const rows = query(
    `SELECT c.id AS claim_event_id, c.issue_id AS issue_id, c.created_at AS claimed_at,
            MIN(x.created_at) AS closed_at,
            TIMESTAMPDIFF(SECOND, c.created_at, MIN(x.created_at)) AS secs
       FROM ${db}.events c
       LEFT JOIN ${db}.events x
         ON x.issue_id = c.issue_id
        AND x.event_type = 'closed'
        AND x.created_at >= c.created_at
      WHERE c.event_type = 'claimed'${pred}
      GROUP BY c.id, c.issue_id, c.created_at`,
    opts,
  );

  const closed = [];
  const open = [];
  for (const r of rows) {
    if (isNullish(r.closed_at) || isNullish(r.secs)) {
      open.push({ work: groupKey(String(r.issue_id)), claimed_at: r.claimed_at });
    } else {
      closed.push({
        work: groupKey(String(r.issue_id)),
        seconds: toNumber(r.secs, 'claim-to-close seconds'),
      });
    }
  }

  return {
    store,
    claims_in_window: rows.length,
    claims_with_terminal_close: closed.length,
    claims_without_terminal_close: open.length,
    claim_to_close_seconds: summarize(closed.map((c) => c.seconds)),
    note:
      'claim-to-close is elapsed wall time from claim to the first subsequent close event. ' +
      'It is not a stranding measure on its own: the upper tail mixes genuinely long work with ' +
      'work that finished and was not recorded. Treat it as a distribution shape, and read the ' +
      'recorded recovery set below for the clean stranding signal.',
  };
}

/* ------------------------------------------------------------------ *
 * Metric: the old path's own recorded stranded-completion set
 * ------------------------------------------------------------------ */

function completionRecoveries(store, opts) {
  const db = safeStore(store);
  const rows = query(
    `SELECT JSON_UNQUOTE(JSON_EXTRACT(metadata, '$."gc.completion_recovered_at"')) AS recovered_at,
            JSON_UNQUOTE(JSON_EXTRACT(metadata, '$."gc.completion_recovery_reason"')) AS reason,
            JSON_UNQUOTE(JSON_EXTRACT(metadata, '$."gc.completion_recovery_attempts"')) AS attempts,
            closed_at AS closed_at
       FROM ${db}.issues
      WHERE JSON_EXTRACT(metadata, '$."gc.completion_recovered_at"') IS NOT NULL`,
    opts,
  );

  const inWindow = rows.filter((r) => withinWindow(r.recovered_at, opts));
  const byReason = {};
  const attempts = [];
  for (const r of inWindow) {
    const reason = isNullish(r.reason) ? '(none recorded)' : r.reason;
    byReason[reason] = (byReason[reason] ?? 0) + 1;
    if (!isNullish(r.attempts) && Number.isFinite(Number(r.attempts))) attempts.push(Number(r.attempts));
  }

  const stamps = inWindow.map((r) => r.recovered_at).filter(Boolean).sort();

  return {
    store,
    recovered_completions: inWindow.length,
    by_reason: byReason,
    recovery_attempts: summarize(attempts),
    first_recovered_at: stamps[0] ?? null,
    last_recovered_at: stamps[stamps.length - 1] ?? null,
    note:
      'Each row is a completion the old path failed to record at the time it happened and a later ' +
      'sweep had to repair. This is the pre-Temporal path reporting its own stranding. It carries a ' +
      'repair timestamp but not a stranding-onset timestamp, so it gives a count and a reason, not a duration.',
  };
}

function withinWindow(iso, opts) {
  if (!opts.windowStart && !opts.windowEnd) return true;
  const t = Date.parse(iso ?? '');
  if (!Number.isFinite(t)) return false;
  if (opts.windowStart && t < Date.parse(`${sqlDate(opts.windowStart).replace(' ', 'T')}Z`)) return false;
  if (opts.windowEnd && t >= Date.parse(`${sqlDate(opts.windowEnd).replace(' ', 'T')}Z`)) return false;
  return true;
}

/* ------------------------------------------------------------------ *
 * Metric: delivered to acknowledged latency
 * ------------------------------------------------------------------ */

function deliveryLatency(store, opts) {
  const db = safeStore(store);
  const rows = query(
    `SELECT JSON_UNQUOTE(JSON_EXTRACT(metadata, '$."gc.coordinator_outcome.delivered_at"')) AS delivered_at,
            JSON_UNQUOTE(JSON_EXTRACT(metadata, '$."gc.coordinator_outcome.acknowledged_at"')) AS acknowledged_at
       FROM ${db}.issues
      WHERE JSON_EXTRACT(metadata, '$."gc.coordinator_outcome.delivered_at"') IS NOT NULL`,
    opts,
  );

  const seconds = [];
  let deliveredInWindow = 0;
  let pending = 0;
  let negative = 0;
  const stamps = [];

  for (const r of rows) {
    if (!withinWindow(r.delivered_at, opts)) continue;
    deliveredInWindow += 1;
    stamps.push(r.delivered_at);
    if (isNullish(r.acknowledged_at)) {
      pending += 1;
      continue;
    }
    const d = parseRfc3339(r.delivered_at, 'delivered_at');
    const a = parseRfc3339(r.acknowledged_at, 'acknowledged_at');
    const delta = (a - d) / 1000;
    // A negative delta means the two stamps were written by different cycles;
    // surface it rather than folding it into the distribution.
    if (delta < 0) negative += 1;
    else seconds.push(delta);
  }

  stamps.sort();

  return {
    store,
    delivered_in_window: deliveredInWindow,
    acknowledged: seconds.length,
    pending_acknowledgement: pending,
    negative_intervals: negative,
    delivered_to_acknowledged_seconds: summarize(seconds),
    first_delivery_at: stamps[0] ?? null,
    last_delivery_at: stamps[stamps.length - 1] ?? null,
    note:
      'After-only. The pre-Temporal path had no delivery record and no acknowledgement record, so ' +
      'this metric has no before side to compare against. It describes the current path, it does not ' +
      'measure an improvement.',
  };
}

/* ------------------------------------------------------------------ *
 * Metric: sessions bound per (work item, generation)
 * ------------------------------------------------------------------ */

function sessionsPerWorkGeneration(store, opts) {
  const db = safeStore(store);
  const pred = windowPredicate('created_at', opts.windowStart, opts.windowEnd);
  const rows = query(
    `SELECT issue_id AS issue_id,
            JSON_UNQUOTE(JSON_EXTRACT(CAST(new_value AS JSON), '$.metadata."gc.temporal.generation"')) AS generation,
            JSON_UNQUOTE(JSON_EXTRACT(CAST(new_value AS JSON), '$.metadata."gc.temporal.session_id"')) AS session_id,
            created_at AS created_at
       FROM ${db}.events
      WHERE new_value LIKE '%gc.temporal.session_id%'${pred}`,
    opts,
  );

  const pairs = new Map();
  for (const r of rows) {
    if (!r.session_id) continue;
    const key = `${r.issue_id}#${r.generation ?? 'null'}`;
    if (!pairs.has(key)) pairs.set(key, new Set());
    pairs.get(key).add(r.session_id);
  }

  const distribution = {};
  for (const sessions of pairs.values()) {
    const k = String(sessions.size);
    distribution[k] = (distribution[k] ?? 0) + 1;
  }

  return {
    store,
    interpretable: false,
    work_generation_pairs: pairs.size,
    sessions_per_pair_distribution: distribution,
    pairs_with_more_than_one_session: [...pairs.values()].filter((s) => s.size > 1).length,
    note:
      'Computed, and not evidence. The failure this is supposed to detect is a second agent launched ' +
      'by a worker that then died, and a worker that dies before recording a binding writes no binding. ' +
      'An observed count of one is therefore consistent both with no duplicate and with a duplicate that ' +
      'was never recorded. The pre-Temporal path has no equivalent field at all, so there is no before side. ' +
      'Do not report a change in this number.',
  };
}

/* ------------------------------------------------------------------ */

function main() {
  const { values } = parseArgs({
    options: {
      stores: { type: 'string' },
      'window-start': { type: 'string' },
      'window-end': { type: 'string' },
      host: { type: 'string' },
      port: { type: 'string' },
      out: { type: 'string' },
      raw: { type: 'boolean', default: false },
      label: { type: 'string' },
    },
  });

  const stores = (values.stores ?? DEFAULT_STORES.join(',')).split(',').map((s) => safeStore(s.trim()));
  const port = values.port ? Number.parseInt(values.port, 10) : readServerPort();
  const opts = {
    host: values.host,
    port,
    windowStart: values['window-start'],
    windowEnd: values['window-end'],
  };

  const document = {
    generated_at: new Date().toISOString(),
    window: {
      label: values.label ?? null,
      start: opts.windowStart ?? null,
      end: opts.windowEnd ?? null,
      note: opts.windowStart || opts.windowEnd
        ? 'Start is inclusive, end is exclusive.'
        : 'No window filter: every record in the store.',
    },
    stores,
    read_only: true,
    metrics: {
      claim_to_terminal: stores.map((s) => claimDurations(s, opts)),
      recorded_completion_recoveries: stores.map((s) => completionRecoveries(s, opts)),
      delivered_to_acknowledged: stores.map((s) => deliveryLatency(s, opts)),
      sessions_per_work_generation: stores.map((s) => sessionsPerWorkGeneration(s, opts)),
    },
    not_computed: {
      silent_outcomes_rate:
        'The all-store watchdog emits a finding set per scan but appends only when the fingerprint ' +
        'changes, and writes nothing at all on a zero-finding scan. There is no denominator and no ' +
        'per-interval series. Use surfacer-audit-metrics.mjs for the standing finding set, and read ' +
        'it as a census, not a rate.',
      recovery_time_after_worker_termination:
        'Requires Temporal Event History. The namespace retains closed executions for 24 hours with ' +
        'archival disabled, so no window older than a day exists. Use temporal-metrics.mjs against the ' +
        'live server, and snapshot the result the same day.',
      human_interventions_per_work_item: 'No disposition counter exists. Needs instrumentation.',
      completion_rate_under_injected_failure:
        'The failure matrix runs as a pass/fail suite. Needs a scored harness.',
      infrastructure_and_latency_cost: 'No collection exists for worker RSS or history bytes per episode.',
    },
  };

  const rendered = values.raw ? document : scrubDeep(document);
  const text = `${JSON.stringify(rendered, null, 2)}\n`;
  if (values.out) writeFileSync(values.out, text);
  else process.stdout.write(text);
  return 0;
}

try {
  process.exit(main());
} catch (err) {
  if (err instanceof DoltUnavailableError) {
    process.stderr.write(`[metrics] store unreachable: ${err.message}\n`);
    process.stderr.write('[metrics] no numbers emitted. An unreachable store is not a zero.\n');
    process.exit(2);
  }
  if (err instanceof DoltQueryError) {
    process.stderr.write(`[metrics] query failed: ${err.message}\n`);
    process.exit(2);
  }
  process.stderr.write(`[metrics] ${err.stack ?? err.message}\n`);
  process.exit(2);
}
