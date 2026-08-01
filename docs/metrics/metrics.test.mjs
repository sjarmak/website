/**
 * Hermetic tests for the metrics extractors.
 *
 * Nothing here connects to the work store or to Temporal. The read-only guard,
 * the scrubber, the statistics and the history analysis are all pure, and the
 * history analysis is exercised against the committed snapshot rather than a
 * live server, so the suite still passes after the live Event History expires.
 *
 *   node --test docs/metrics/metrics.test.mjs
 */

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test, { describe } from 'node:test';

import { assertReadOnly } from './lib/readonly.mjs';
import { ALLOWED_REVISION, findLeaks, groupKey, Pseudonymizer, scrubDeep, scrubText } from './lib/scrub.mjs';
import { P95_MIN_N, quantile, requiredNPerArm, summarize, wilsonInterval } from './lib/stats.mjs';
import { DoltQueryError, DoltUnavailableError, readServerPort, toNumber } from './lib/dolt-client.mjs';
import { analyzeHistories, assertReadOnlyCommand } from './temporal-metrics.mjs';
import { parseAudit, summarizeAudit } from './surfacer-audit-metrics.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_DIR = path.join(HERE, 'fixtures', 'history-2026-08-01');

describe('read-only SQL guard', () => {
  test('accepts the statements the extractor actually issues', () => {
    const real = [
      "SELECT c.id, MIN(x.created_at) FROM gc.events c LEFT JOIN gc.events x ON x.issue_id = c.issue_id AND x.event_type = 'closed' WHERE c.event_type = 'claimed' GROUP BY c.id",
      `SELECT JSON_UNQUOTE(JSON_EXTRACT(metadata, '$."gc.completion_recovered_at"')) AS r FROM gc.issues`,
      `SELECT JSON_UNQUOTE(JSON_EXTRACT(CAST(new_value AS JSON), '$.metadata."gc.temporal.session_id"')) AS s FROM gc.events WHERE new_value LIKE '%gc.temporal.session_id%'`,
      'SHOW DATABASES',
      'DESCRIBE gc.events',
    ];
    for (const sql of real) assert.equal(typeof assertReadOnly(sql), 'string');
  });

  test('column and literal values that merely contain a verb are not rejected', () => {
    // 'created' contains CREATE, 'updated' contains UPDATE, 'closed' contains CLOSE.
    assert.ok(
      assertReadOnly("SELECT event_type FROM gc.events WHERE event_type IN ('created','updated','closed')"),
    );
    assert.ok(assertReadOnly('SELECT updated_at, created_at FROM gc.issues'));
  });

  test('rejects every mutating verb', () => {
    const mutations = [
      "INSERT INTO gc.issues (id) VALUES ('x')",
      "UPDATE gc.issues SET status = 'closed'",
      'DELETE FROM gc.events',
      'DROP TABLE gc.events',
      'CREATE TABLE t (a INT)',
      'ALTER TABLE gc.issues ADD COLUMN x INT',
      'TRUNCATE gc.events',
      'REPLACE INTO gc.issues VALUES (1)',
      'GRANT ALL ON *.* TO root',
    ];
    for (const sql of mutations) assert.throws(() => assertReadOnly(sql), /read-only guard/, sql);
  });

  test('rejects mutating Dolt stored procedures invoked from a SELECT', () => {
    assert.throws(() => assertReadOnly("SELECT DOLT_COMMIT('-am','x')"), /DOLT_COMMIT/);
    assert.throws(() => assertReadOnly("SELECT dolt_reset('--hard')"), /DOLT_RESET/);
    assert.throws(() => assertReadOnly("SELECT DoLt_ChEcKoUt('main')"), /DOLT_CHECKOUT/);
  });

  // An audit of the first revision of the guard found these four. Each begins
  // with SELECT, so each cleared the leading-verb allowlist, and none was on
  // the hand-written denylist. dolt_purge_dropped_databases is irreversible.
  // They are regression cases, not hypotheticals.
  test('rejects the mutating procedures a hand-written denylist missed', () => {
    for (const sql of [
      "SELECT dolt_undrop('gc')",
      'SELECT dolt_purge_dropped_databases()',
      "SELECT dolt_stash('push')",
      "SELECT dolt_remote('add','origin','x')",
      'SELECT dolt_conflicts_resolve()',
    ]) {
      assert.throws(() => assertReadOnly(sql), /read-only guard/, sql);
    }
  });

  // The point of default-deny: a procedure nobody has enumerated is still
  // denied. If this test ever passes by being on a denylist, the guard has
  // regressed to the design that leaked.
  test('denies an unknown dolt identifier it has never heard of', () => {
    assert.throws(
      () => assertReadOnly('SELECT dolt_some_procedure_invented_next_year()'),
      /not on the read-only allowlist/,
    );
  });

  test('still allows the read-only dolt system tables the extractors use', () => {
    for (const sql of [
      'SELECT * FROM dolt_log LIMIT 10',
      "SELECT * FROM dolt_history_issues WHERE id = 'x'",
      'SELECT to_id FROM dolt_diff_issues',
      'SELECT count(*) FROM dolt_commits',
    ]) {
      assert.equal(typeof assertReadOnly(sql), 'string', sql);
    }
  });

  // Not a mutation, but a 30s SELECT SLEEP against the sql-server a live city
  // depends on is a denial of service with extra steps.
  test('rejects unbounded resource consumption', () => {
    assert.throws(() => assertReadOnly('SELECT SLEEP(30)'), /SLEEP/);
    assert.throws(() => assertReadOnly('SELECT BENCHMARK(99999999, MD5(1))'), /BENCHMARK/);
  });

  test('rejects statement chaining, including a chained write behind a read', () => {
    assert.throws(() => assertReadOnly('SELECT 1; DELETE FROM gc.events'), /multiple statements/);
    assert.throws(() => assertReadOnly('SELECT 1;SELECT 2'), /multiple statements/);
  });

  test('a trailing semicolon is fine and is stripped', () => {
    assert.equal(assertReadOnly('SELECT 1;'), 'SELECT 1');
  });

  test('cannot be smuggled past with comments', () => {
    assert.throws(() => assertReadOnly('/* SELECT */ DELETE FROM gc.events'), /read-only guard/);
    assert.throws(() => assertReadOnly('-- SELECT 1\nDROP TABLE gc.events'), /read-only guard/);
    assert.throws(() => assertReadOnly('SELECT 1 /* ; */ ; UPDATE gc.issues SET a=1'), /read-only guard/);
  });

  test('rejects empty and comment-only input rather than passing it through', () => {
    assert.throws(() => assertReadOnly(''), /non-empty/);
    assert.throws(() => assertReadOnly('   '), /non-empty/);
    assert.throws(() => assertReadOnly('-- nothing here'), /only comments/);
  });

  test('rejects SELECT INTO OUTFILE, which writes', () => {
    assert.throws(() => assertReadOnly("SELECT * FROM gc.events INTO OUTFILE '/tmp/x'"), /INTO/);
  });
});

describe('read-only Temporal command guard', () => {
  test('allows the three read commands', () => {
    assert.ok(assertReadOnlyCommand(['workflow', 'list', '--limit', '10']));
    assert.ok(assertReadOnlyCommand(['workflow', 'show', '-w', 'x']));
    assert.ok(assertReadOnlyCommand(['operator', 'namespace', 'describe']));
  });

  test('refuses anything that mutates a workflow', () => {
    for (const verb of ['start', 'signal', 'update', 'terminate', 'cancel', 'reset', 'delete']) {
      assert.throws(() => assertReadOnlyCommand(['workflow', verb, '-w', 'x']), /read-only guard/, verb);
    }
    assert.throws(() => assertReadOnlyCommand(['operator', 'namespace', 'delete']), /read-only guard/);
  });
});

describe('identifier scrubbing', () => {
  test('removes work item IDs in every prefix, including step suffixes', () => {
    const scrubbed = scrubText('claimed dr-1002, sjai-4rf and gc-8fx8z.6 in one line');
    assert.ok(!/\b(?:dr|sjai|gc)-[0-9a-z]/i.test(scrubbed), scrubbed);
    assert.equal(scrubbed, 'claimed <work-id>, <work-id> and <work-id> in one line');
  });

  test('removes outcome IDs, cycle numbers, store references and UUIDs', () => {
    const scrubbed = scrubText(
      'outcome-bb9d6dbeaa8c1a3f50bfab37e4e741ad on cycle-000001 for city:ds-research and rig:website run 019fb970-e46f-7ceb-9631-b67851d67ee9',
    );
    assert.ok(!scrubbed.includes('outcome-bb9'), scrubbed);
    assert.ok(!scrubbed.includes('cycle-000001'), scrubbed);
    assert.ok(!scrubbed.includes('ds-research'), scrubbed);
    assert.ok(!scrubbed.includes('019fb970'), scrubbed);
  });

  test('removes absolute home paths', () => {
    const scrubbed = scrubText('read /home/ds/gas-city/.gc/runtime/coordinator-outcome-surfacer.jsonl');
    assert.equal(scrubbed, 'read <path>');
  });

  test('removes long hex digests such as worker hashes', () => {
    const scrubbed = scrubText('worker 55702c9cdad535515e0d5d5c74d91636a885eddc8cb897693d506789dae55aea');
    assert.equal(scrubbed, 'worker <hash>');
  });

  test('lets the one public before-state revision through', () => {
    const text = `before state at ${ALLOWED_REVISION}`;
    assert.equal(scrubText(text), text);
    assert.deepEqual(findLeaks(text), []);
  });

  test('scrubs object keys as well as values, because a map key can carry an identity', () => {
    const scrubbed = scrubDeep({ 'dr-1002': { note: 'see /home/ds/x' } });
    assert.deepEqual(scrubbed, { '<work-id>': { note: 'see <path>' } });
  });

  test('findLeaks reports what scrubText would have removed', () => {
    const leaks = findLeaks('dr-1002 lives at /home/ds/x');
    assert.ok(leaks.some((l) => l.rule === 'work'));
    assert.ok(leaks.some((l) => l.rule === 'path'));
    assert.deepEqual(findLeaks(scrubText('dr-1002 lives at /home/ds/x')), []);
  });

  test('groupKey is stable and does not echo its input', () => {
    assert.equal(groupKey('dr-1002'), groupKey('dr-1002'));
    assert.notEqual(groupKey('dr-1002'), groupKey('dr-1003'));
    assert.ok(!groupKey('dr-1002').includes('1002'));
  });

  test('Pseudonymizer keeps distinct groups distinct where scrubbing would merge them', () => {
    const p = new Pseudonymizer('store');
    assert.equal(p.label('city:ds-research'), 'store-a');
    assert.equal(p.label('rig:gascity'), 'store-b');
    assert.equal(p.label('city:ds-research'), 'store-a');
    assert.equal(p.size, 2);
    // The failure this guards against: scrubbing all three to one key.
    assert.notEqual(scrubText('city:ds-research'), 'city:ds-research');
    assert.equal(scrubText('city:ds-research'), scrubText('rig:gascity'));
  });
});

describe('small-sample statistics', () => {
  test('p95 is suppressed below the minimum n and says why', () => {
    const s = summarize([1, 2, 3, 4, 5]);
    assert.equal(s.n, 5);
    assert.equal(s.p95, null);
    assert.match(s.p95_suppressed_reason, /n=5 < 20/);
    assert.equal(s.max, 5);
  });

  test('p95 is reported once n reaches the threshold', () => {
    const values = Array.from({ length: P95_MIN_N }, (_, i) => i + 1);
    const s = summarize(values);
    assert.equal(s.n, P95_MIN_N);
    assert.ok(typeof s.p95 === 'number');
  });

  test('median is suppressed at n below 3', () => {
    assert.equal(summarize([7]).median, null);
    assert.equal(summarize([7]).max, 7);
    assert.equal(summarize([7, 9]).median, null);
    assert.equal(summarize([7, 9, 11]).median, 9);
  });

  test('an empty sample reports n=0 rather than zero', () => {
    const s = summarize([]);
    assert.equal(s.n, 0);
    assert.equal(s.median, null);
    assert.equal(s.mean, null);
    assert.equal(s.max, null);
  });

  test('quantile interpolates', () => {
    assert.equal(quantile([1, 2, 3, 4], 0.5), 2.5);
    assert.equal(quantile([], 0.5), null);
  });

  test('Wilson interval on a handful of events is wide enough to be honest', () => {
    const ci = wilsonInterval(2, 3);
    assert.ok(ci.lower < 0.3, JSON.stringify(ci));
    assert.ok(ci.upper > 0.9, JSON.stringify(ci));
    assert.equal(wilsonInterval(0, 0), null);
  });

  test('requiredNPerArm states the sample a claimed improvement would need', () => {
    // Halving a 10% failure rate needs hundreds per arm, not a handful.
    const n = requiredNPerArm(0.1, 0.05);
    assert.ok(n > 400, String(n));
    assert.equal(requiredNPerArm(0.1, 0.1), null);
  });
});

describe('store client failure behaviour', () => {
  test('a missing sql-server info file is a loud failure, not a zero', () => {
    assert.throws(
      () => readServerPort('/nonexistent/sql-server.info'),
      (err) => err instanceof DoltUnavailableError && /no running Dolt sql-server/.test(err.message),
    );
  });

  test('toNumber refuses to turn a null into a zero', () => {
    assert.throws(() => toNumber(null, 'secs'), DoltQueryError);
    assert.throws(() => toNumber(undefined, 'secs'), DoltQueryError);
    assert.throws(() => toNumber('', 'secs'), DoltQueryError);
    assert.throws(() => toNumber('not-a-number', 'secs'), DoltQueryError);
    assert.equal(toNumber('42', 'secs'), 42);
    assert.equal(toNumber('0', 'secs'), 0);
  });
});

describe('Event History analysis', () => {
  const synthetic = [
    {
      workflowType: 'CoordinatorOutcomeWorkflow',
      events: [
        { eventId: '1', eventTime: '2026-08-01T10:00:00Z', eventType: 'EVENT_TYPE_ACTIVITY_TASK_SCHEDULED' },
        { eventId: '2', eventTime: '2026-08-01T10:00:01Z', eventType: 'EVENT_TYPE_ACTIVITY_TASK_STARTED' },
        {
          eventId: '3',
          eventTime: '2026-08-01T10:00:02Z',
          eventType: 'EVENT_TYPE_ACTIVITY_TASK_FAILED',
          activityTaskFailedEventAttributes: {
            failure: {
              message: 'wrapper for dr-1002',
              cause: { message: 'store ref "city:gas-city" does not match "city:ds-research"' },
            },
          },
        },
        { eventId: '4', eventTime: '2026-08-01T10:15:02Z', eventType: 'EVENT_TYPE_ACTIVITY_TASK_SCHEDULED' },
      ],
    },
  ];

  test('gap is measured from failure to the next scheduled attempt', () => {
    const a = analyzeHistories(synthetic);
    assert.equal(a.failure_to_next_attempt_seconds.n, 1);
    assert.equal(a.failure_to_next_attempt_seconds.max, 900);
  });

  test('failure grouping uses the innermost cause and is scrubbed', () => {
    const a = analyzeHistories(synthetic);
    const keys = Object.keys(a.failures_by_message);
    assert.equal(keys.length, 1);
    assert.ok(!keys[0].includes('ds-research'), keys[0]);
    assert.ok(!keys[0].includes('dr-1002'), keys[0]);
    assert.deepEqual(findLeaks(keys[0]), []);
  });

  test('activity counts are per event type', () => {
    const a = analyzeHistories(synthetic);
    assert.deepEqual(a.activity_events, { scheduled: 2, started: 1, failed: 1, timed_out: 0 });
  });

  test('an empty history set yields n=0 and no invented numbers', () => {
    const a = analyzeHistories([]);
    assert.equal(a.histories_analyzed, 0);
    assert.equal(a.failure_to_next_attempt_seconds.n, 0);
    assert.equal(a.failure_to_next_attempt_seconds.median, null);
    assert.equal(a.observation_window.earliest_event, null);
  });
});

describe('committed Event History snapshot', () => {
  const present = existsSync(SNAPSHOT_DIR);

  test('the snapshot exists, because the live source expires in 24 hours', { skip: !present }, () => {
    const files = readdirSync(SNAPSHOT_DIR).filter((f) => f.endsWith('.json') && f !== 'index.json');
    assert.ok(files.length > 0);
  });

  test('the snapshot carries no forbidden identifier', { skip: !present }, () => {
    const files = readdirSync(SNAPSHOT_DIR).filter((f) => f.endsWith('.json'));
    const leaks = [];
    for (const f of files) {
      for (const leak of findLeaks(readFileSync(path.join(SNAPSHOT_DIR, f), 'utf8'))) {
        leaks.push({ file: f, ...leak });
      }
    }
    assert.deepEqual(leaks, [], JSON.stringify(leaks.slice(0, 5)));
  });

  test('analysis of the snapshot reproduces without a server', { skip: !present }, () => {
    const files = readdirSync(SNAPSHOT_DIR).filter((f) => f.endsWith('.json') && f !== 'index.json');
    const histories = files.map((f) => JSON.parse(readFileSync(path.join(SNAPSHOT_DIR, f), 'utf8')));
    const a = analyzeHistories(histories);
    assert.ok(a.histories_analyzed > 0);
    // The canonical sample's Workflow has no Activity failure in the retained
    // window. That absence is the reason the recovery-time metric has no data,
    // so it is asserted rather than assumed.
    assert.equal(a.failures_by_workflow_type.BeadOrchestrationWorkflow ?? 0, 0);
  });
});

describe('watchdog audit census', () => {
  const jsonl = [
    JSON.stringify({
      kind: 'silent-outcome',
      reason: 'terminal without outcome envelope',
      store_ref: 'city:ds-research',
      work_id: 'dr-aaa',
      transition_ref: 'r1',
      transition_at: '2026-07-31T01:00:00Z',
    }),
    // Same finding re-appended because the finding set changed around it.
    JSON.stringify({
      kind: 'silent-outcome',
      reason: 'terminal without outcome envelope',
      store_ref: 'city:ds-research',
      work_id: 'dr-aaa',
      transition_ref: 'r1',
      transition_at: '2026-07-31T01:00:00Z',
    }),
    JSON.stringify({
      kind: 'silent-outcome',
      reason: 'verified without outcome envelope',
      store_ref: 'rig:website',
      work_id: 'sjai-bbb',
      transition_ref: 'r2',
      transition_at: '2026-08-01T02:00:00Z',
    }),
  ].join('\n');

  test('distinct findings are counted separately from appended lines', () => {
    const s = summarizeAudit(parseAudit(jsonl));
    assert.equal(s.audit_lines, 3);
    assert.equal(s.distinct_findings, 2);
  });

  test('stores stay distinct after pseudonymisation', () => {
    const s = summarizeAudit(parseAudit(jsonl));
    assert.equal(s.stores_seen, 2);
    assert.deepEqual(Object.keys(s.lines_by_store).sort(), ['store-a', 'store-b']);
  });

  test('the summary refuses to present itself as a rate', () => {
    const s = summarizeAudit(parseAudit(jsonl));
    assert.equal(s.is_a_rate, false);
    assert.match(s.why_not_a_rate, /No denominator/);
  });

  test('a malformed line fails loudly instead of being skipped', () => {
    assert.throws(() => parseAudit('{"kind":"silent-outcome"}\nnot json\n'), /did not parse/);
  });

  test('blank lines are tolerated', () => {
    assert.equal(parseAudit('\n\n{"kind":"x"}\n\n').length, 1);
  });
});
