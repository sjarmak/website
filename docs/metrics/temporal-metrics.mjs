#!/usr/bin/env node
/**
 * Read-only Event History extractor.
 *
 * The namespace retains closed executions for 24 hours with archival disabled,
 * so Event History is a live window, not an archive. Anything this script
 * measures is gone tomorrow unless --snapshot is used. Snapshot first, write
 * prose second.
 *
 *   node docs/metrics/temporal-metrics.mjs
 *   node docs/metrics/temporal-metrics.mjs --snapshot docs/metrics/fixtures/history-2026-08-01
 *   node docs/metrics/temporal-metrics.mjs --from-snapshot docs/metrics/fixtures/history-2026-08-01
 *
 * Read-only enforcement: the only temporal subcommands this script may run are
 * `workflow list`, `workflow show` and `operator namespace describe`. The
 * allowlist is checked on the assembled argv, the process is spawned without a
 * shell, and there is no code path that constructs a start, signal, update,
 * reset, terminate or delete command.
 *
 * Exit codes: 0 success, 2 server unreachable or a command failed. An
 * unreachable server never produces a zero.
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { summarize } from './lib/stats.mjs';
import { groupKey, scrubDeep, scrubText } from './lib/scrub.mjs';

export class TemporalUnavailableError extends Error {}

/** Exact read-only command shapes. Anything else is refused before spawn. */
const ALLOWED_COMMANDS = [
  ['workflow', 'list'],
  ['workflow', 'show'],
  ['operator', 'namespace', 'describe'],
];

/**
 * `args` is the subcommand vector this module built, verbs first. The check is
 * on its leading verbs, before any global flags are appended, so a flag value
 * can never be mistaken for a verb.
 */
export function assertReadOnlyCommand(args) {
  const ok = ALLOWED_COMMANDS.some((cmd) => cmd.every((part, i) => args[i] === part));
  if (!ok) {
    throw new Error(
      `read-only guard: refusing temporal command ${JSON.stringify(args.slice(0, 3).join(' '))}`,
    );
  }
  return args;
}

function runTemporal(args, { address, namespace, maxBuffer = 512 * 1024 * 1024 }) {
  const argv = [...assertReadOnlyCommand(args), '--address', address, '-n', namespace];
  const res = spawnSync('temporal', argv, {
    cwd: '/tmp',
    encoding: 'utf8',
    maxBuffer,
    shell: false,
    timeout: 120_000,
  });
  if (res.error) {
    throw new TemporalUnavailableError(`temporal CLI failed to start: ${res.error.message}`);
  }
  if (res.status !== 0) {
    throw new TemporalUnavailableError(
      `temporal exited ${res.status}: ${(res.stderr || res.stdout || '').trim().slice(0, 400)}`,
    );
  }
  const out = (res.stdout ?? '').trim();
  if (out === '') {
    throw new TemporalUnavailableError('temporal returned no output; refusing to treat that as empty');
  }
  try {
    return JSON.parse(out);
  } catch (err) {
    throw new TemporalUnavailableError(`temporal output did not parse as JSON: ${err.message}`);
  }
}

/* ------------------------------------------------------------------ *
 * History analysis. Pure functions over parsed histories, so the same
 * code runs against a live server and against a committed snapshot.
 * ------------------------------------------------------------------ */

const FAILED = 'EVENT_TYPE_ACTIVITY_TASK_FAILED';
const TIMED_OUT = 'EVENT_TYPE_ACTIVITY_TASK_TIMED_OUT';
const SCHEDULED = 'EVENT_TYPE_ACTIVITY_TASK_SCHEDULED';
const STARTED = 'EVENT_TYPE_ACTIVITY_TASK_STARTED';

/** Root failure message, walking the cause chain to the innermost message. */
function rootMessage(failure) {
  let f = failure;
  const chain = [];
  while (f && typeof f === 'object') {
    if (typeof f.message === 'string') chain.push(f.message);
    f = f.cause;
  }
  return chain.length ? chain[0] : '(no message)';
}

/**
 * @param {{workflowType:string, events:any[]}[]} histories
 */
export function analyzeHistories(histories) {
  const workflowTypeCensus = {};
  const failureCountsByMessage = {};
  const failureCountsByWorkflowType = {};
  const gapsSeconds = [];
  const gapsByWorkflowType = {};
  let activityFailed = 0;
  let activityTimedOut = 0;
  let activityScheduled = 0;
  let activityStarted = 0;
  let earliest = null;
  let latest = null;

  for (const h of histories) {
    const wfType = h.workflowType ?? '(unknown)';
    workflowTypeCensus[wfType] = (workflowTypeCensus[wfType] ?? 0) + 1;
    const events = h.events ?? [];

    for (const e of events) {
      const t = Date.parse(e.eventTime ?? '');
      if (Number.isFinite(t)) {
        if (earliest === null || t < earliest) earliest = t;
        if (latest === null || t > latest) latest = t;
      }
      if (e.eventType === SCHEDULED) activityScheduled += 1;
      if (e.eventType === STARTED) activityStarted += 1;
      if (e.eventType === TIMED_OUT) activityTimedOut += 1;
      if (e.eventType !== FAILED) continue;

      activityFailed += 1;
      failureCountsByWorkflowType[wfType] = (failureCountsByWorkflowType[wfType] ?? 0) + 1;
      const msg = scrubText(rootMessage(e.activityTaskFailedEventAttributes?.failure));
      failureCountsByMessage[msg] = (failureCountsByMessage[msg] ?? 0) + 1;
    }

    // Failure to next attempt. The next attempt is the next ActivityTaskScheduled
    // after the failure in the same history, which is how a Workflow-driven
    // redelivery loop appears. It is the cadence at which a failing envelope is
    // re-presented, not a recovery time.
    for (let i = 0; i < events.length; i += 1) {
      if (events[i].eventType !== FAILED) continue;
      const failedAt = Date.parse(events[i].eventTime ?? '');
      if (!Number.isFinite(failedAt)) continue;
      for (let j = i + 1; j < events.length; j += 1) {
        if (events[j].eventType !== SCHEDULED) continue;
        const nextAt = Date.parse(events[j].eventTime ?? '');
        if (!Number.isFinite(nextAt)) break;
        const gap = (nextAt - failedAt) / 1000;
        if (gap >= 0) {
          gapsSeconds.push(gap);
          (gapsByWorkflowType[wfType] ??= []).push(gap);
        }
        break;
      }
    }
  }

  const byTypeSummaries = {};
  for (const [k, v] of Object.entries(gapsByWorkflowType)) byTypeSummaries[k] = summarize(v);

  return {
    histories_analyzed: histories.length,
    workflow_type_census: workflowTypeCensus,
    observation_window: {
      earliest_event: earliest === null ? null : new Date(earliest).toISOString(),
      latest_event: latest === null ? null : new Date(latest).toISOString(),
      note:
        'Bounded by namespace retention, not by when the system started running. Closed executions ' +
        'are deleted 24 hours after close and history archival is disabled, so this window can never ' +
        'extend further back than one day for closed work.',
    },
    activity_events: {
      scheduled: activityScheduled,
      started: activityStarted,
      failed: activityFailed,
      timed_out: activityTimedOut,
    },
    failures_by_workflow_type: failureCountsByWorkflowType,
    failures_by_message: failureCountsByMessage,
    failure_to_next_attempt_seconds: summarize(gapsSeconds),
    failure_to_next_attempt_by_workflow_type: byTypeSummaries,
    interpretation:
      'This distribution is the interval at which a failing Activity is re-presented by its Workflow. ' +
      'It measures retry cadence against a request that keeps failing for the same reason. It is not ' +
      'recovery time after a Worker termination, and it must not be merged with the outcome-delivery ' +
      'event cadence visible in the work store, which is a different mechanism.',
  };
}

/* ------------------------------------------------------------------ */

function fetchHistories({ address, namespace, limit }) {
  const list = runTemporal(['workflow', 'list', '--limit', String(limit), '--output', 'json'], {
    address,
    namespace,
  });
  const executions = Array.isArray(list) ? list : (list.executions ?? []);
  if (executions.length === 0) {
    throw new TemporalUnavailableError(
      `namespace ${namespace} listed zero workflows; refusing to report metrics over an empty list`,
    );
  }

  const histories = [];
  const failures = [];
  for (const e of executions) {
    const workflowId = e.execution?.workflowId;
    const runId = e.execution?.runId;
    if (!workflowId || !runId) continue;
    try {
      const shown = runTemporal(
        ['workflow', 'show', '-w', workflowId, '--run-id', runId, '--output', 'json'],
        { address, namespace },
      );
      histories.push({
        workflowType: e.type?.name ?? '(unknown)',
        status: e.status ?? null,
        key: groupKey(`${workflowId}:${runId}`),
        events: shown.events ?? shown.history?.events ?? [],
      });
    } catch (err) {
      failures.push({ key: groupKey(`${workflowId}:${runId}`), error: err.message });
    }
  }
  if (histories.length === 0) {
    throw new TemporalUnavailableError('every history fetch failed; no metrics emitted');
  }
  return { histories, fetchFailures: failures };
}

/** Load histories from a snapshot directory written by a previous run. */
function loadSnapshot(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'index.json');
  if (files.length === 0) throw new Error(`snapshot directory ${dir} contains no history files`);
  return files.map((f) => JSON.parse(readFileSync(path.join(dir, f), 'utf8')));
}

/**
 * Snapshot scrubbed histories. Payload bodies are dropped rather than scrubbed:
 * they are base64 envelopes that carry work IDs and store refs, they are not
 * needed for any metric here, and a base64 blob defeats text scrubbing.
 */
function writeSnapshot(dir, histories) {
  mkdirSync(dir, { recursive: true });
  const index = [];
  histories.forEach((h, i) => {
    const stripped = {
      workflowType: h.workflowType,
      status: h.status,
      key: h.key,
      events: (h.events ?? []).map((e) => stripEvent(e)),
    };
    const name = `history-${String(i).padStart(3, '0')}-${h.key}.json`;
    writeFileSync(path.join(dir, name), `${JSON.stringify(scrubDeep(stripped), null, 1)}\n`);
    index.push({ file: name, workflowType: h.workflowType, events: stripped.events.length });
  });
  writeFileSync(
    path.join(dir, 'index.json'),
    `${JSON.stringify(
      {
        captured_at: new Date().toISOString(),
        histories: index.length,
        note:
          'Scrubbed Event History snapshot. Payload bodies removed. Captured because namespace ' +
          'retention is 24 hours with archival disabled, so the live source expires.',
      },
      null,
      2,
    )}\n`,
  );
  return index.length;
}

/** Keep only the fields the analysis reads, plus a scrubbed identity group key. */
function stripEvent(e) {
  const out = { eventId: e.eventId, eventTime: e.eventTime, eventType: e.eventType };
  const fa = e.activityTaskFailedEventAttributes;
  if (fa) {
    out.activityTaskFailedEventAttributes = {
      failure: stripFailure(fa.failure),
      retryState: fa.retryState ?? null,
      identity: fa.identity ? groupKey(fa.identity, 'identity') : null,
    };
  }
  const sa = e.activityTaskScheduledEventAttributes;
  if (sa) {
    out.activityTaskScheduledEventAttributes = {
      activityType: sa.activityType?.name ?? null,
      taskQueue: sa.taskQueue?.name ?? null,
    };
  }
  const st = e.activityTaskStartedEventAttributes;
  if (st) {
    out.activityTaskStartedEventAttributes = {
      attempt: st.attempt ?? null,
      identity: st.identity ? groupKey(st.identity, 'identity') : null,
    };
  }
  const to = e.activityTaskTimedOutEventAttributes;
  if (to) {
    out.activityTaskTimedOutEventAttributes = { failure: stripFailure(to.failure) };
  }
  return out;
}

function stripFailure(failure) {
  if (!failure || typeof failure !== 'object') return null;
  return {
    message: typeof failure.message === 'string' ? failure.message : null,
    type: failure.applicationFailureInfo?.type ?? null,
    cause: stripFailure(failure.cause),
  };
}

function main() {
  const { values } = parseArgs({
    options: {
      address: { type: 'string', default: '127.0.0.1:7233' },
      namespace: { type: 'string', default: 'maintenance' },
      limit: { type: 'string', default: '500' },
      snapshot: { type: 'string' },
      'from-snapshot': { type: 'string' },
      out: { type: 'string' },
    },
  });

  let histories;
  let source;
  let fetchFailures = [];

  if (values['from-snapshot']) {
    histories = loadSnapshot(values['from-snapshot']);
    source = { kind: 'snapshot', path: path.basename(values['from-snapshot']) };
  } else {
    const ns = runTemporal(['operator', 'namespace', 'describe', '--output', 'json'], {
      address: values.address,
      namespace: values.namespace,
    });
    const fetched = fetchHistories({
      address: values.address,
      namespace: values.namespace,
      limit: Number.parseInt(values.limit, 10),
    });
    histories = fetched.histories;
    fetchFailures = fetched.fetchFailures;
    source = {
      kind: 'live',
      namespace: values.namespace,
      retention: ns?.config?.workflowExecutionRetentionTtl ?? ns?.Config?.WorkflowExecutionRetentionTtl ?? null,
      history_archival: ns?.config?.historyArchivalState ?? ns?.Config?.HistoryArchivalState ?? null,
    };
    if (values.snapshot) {
      const n = writeSnapshot(values.snapshot, histories);
      source.snapshot_written = { path: path.basename(values.snapshot), histories: n };
    }
  }

  const document = {
    generated_at: new Date().toISOString(),
    source,
    read_only: true,
    fetch_failures: fetchFailures.length,
    analysis: analyzeHistories(histories),
    retention_warning:
      'Closed executions are deleted 24 hours after close and archival is disabled. Any number here ' +
      'that is not snapshotted the same day cannot be reproduced.',
  };

  const text = `${JSON.stringify(scrubDeep(document), null, 2)}\n`;
  if (values.out) writeFileSync(values.out, text);
  else process.stdout.write(text);
  return 0;
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('temporal-metrics.mjs');
if (invokedDirectly) {
  try {
    process.exit(main());
  } catch (err) {
    if (err instanceof TemporalUnavailableError) {
      process.stderr.write(`[temporal-metrics] server unreachable: ${err.message}\n`);
      process.stderr.write('[temporal-metrics] no numbers emitted. An unreachable server is not a zero.\n');
      process.exit(2);
    }
    process.stderr.write(`[temporal-metrics] ${err.stack ?? err.message}\n`);
    process.exit(2);
  }
}
