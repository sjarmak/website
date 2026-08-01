#!/usr/bin/env node
/**
 * Read-only census of the all-store watchdog's standing audit file.
 *
 * The watchdog scans every store on an interval and prints its finding set,
 * appending to a JSONL audit. Two properties of that append make the file a
 * census and not a time series, and this script reports it as a census:
 *
 * 1. The append is fingerprint-deduplicated. If a scan produces the same
 *    finding set as the previous scan, nothing is written. Consecutive
 *    identical scans are therefore invisible.
 * 2. A zero-finding scan writes nothing at all. There is no record that a scan
 *    ran and found nothing, so there is no denominator and no per-interval
 *    history.
 *
 * When the fingerprint does change, the whole current finding set is appended,
 * so one work item can appear on several lines. The script reports both the raw
 * line count and the distinct-finding count, because conflating them inflates
 * the number.
 *
 *   node docs/metrics/surfacer-audit-metrics.mjs
 *   node docs/metrics/surfacer-audit-metrics.mjs --audit <path> --out summary.json
 *
 * This script only reads. It never invokes the watchdog binary: that binary is
 * wired to notify, and running it to "get a current count" would send mail into
 * a live system.
 *
 * Exit codes: 0 success, 2 audit file missing or unparseable. A missing file is
 * never reported as zero findings.
 */

import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { groupKey, Pseudonymizer, scrubDeep } from './lib/scrub.mjs';

export const DEFAULT_AUDIT_PATH = '/home/ds/gas-city/.gc/runtime/coordinator-outcome-surfacer.jsonl';

export class AuditUnavailableError extends Error {}

/**
 * @param {string} text raw JSONL
 * @returns {object[]}
 */
export function parseAudit(text) {
  const rows = [];
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed === '') return;
    try {
      rows.push(JSON.parse(trimmed));
    } catch (err) {
      throw new AuditUnavailableError(`audit line ${i + 1} did not parse: ${err.message}`);
    }
  });
  return rows;
}

/**
 * @param {object[]} rows
 */
export function summarizeAudit(rows) {
  const byKind = {};
  const byReason = {};
  const byStore = {};
  const distinct = new Map();
  const transitionStamps = [];
  // Store references are pseudonymised rather than scrubbed, because scrubbing
  // a map key collapses every store into one bucket and destroys the breakdown.
  const stores = new Pseudonymizer('store');

  for (const r of rows) {
    byKind[r.kind ?? '(none)'] = (byKind[r.kind ?? '(none)'] ?? 0) + 1;
    byReason[r.reason ?? '(none)'] = (byReason[r.reason ?? '(none)'] ?? 0) + 1;
    const store = stores.label(r.store_ref ?? r.store ?? '(none)');
    byStore[store] = (byStore[store] ?? 0) + 1;
    if (typeof r.transition_at === 'string') transitionStamps.push(r.transition_at);
    const identity = `${store}|${r.work_id ?? ''}|${r.transition_ref ?? ''}`;
    if (!distinct.has(identity)) {
      distinct.set(identity, { key: groupKey(identity), kind: r.kind, reason: r.reason, store });
    }
  }

  const distinctByKind = {};
  const distinctByStore = {};
  for (const d of distinct.values()) {
    distinctByKind[d.kind ?? '(none)'] = (distinctByKind[d.kind ?? '(none)'] ?? 0) + 1;
    distinctByStore[d.store] = (distinctByStore[d.store] ?? 0) + 1;
  }

  transitionStamps.sort();

  return {
    audit_lines: rows.length,
    distinct_findings: distinct.size,
    stores_seen: stores.size,
    lines_by_kind: byKind,
    lines_by_reason: byReason,
    lines_by_store: byStore,
    distinct_findings_by_kind: distinctByKind,
    distinct_findings_by_store: distinctByStore,
    transition_span: {
      earliest: transitionStamps[0] ?? null,
      latest: transitionStamps[transitionStamps.length - 1] ?? null,
    },
    is_a_rate: false,
    why_not_a_rate:
      'No denominator exists. The append is fingerprint-deduplicated and a zero-finding scan writes ' +
      'nothing, so the number of scans that ran is unrecorded. This is a census of findings that were ' +
      'standing at some point in the covered span, not a per-scan rate and not a time series.',
    duplication_note:
      'A fingerprint change re-appends the entire current finding set, so audit_lines exceeds ' +
      'distinct_findings whenever the set changed while old members were still standing. Report ' +
      'distinct_findings, not audit_lines.',
    rotation_note:
      'The audit rotates to a .1 sibling at its size limit, so a long-running deployment loses its ' +
      'oldest lines. The span reported here is bounded by the current file, not by the deployment.',
  };
}

function main() {
  const { values } = parseArgs({
    options: {
      audit: { type: 'string', default: DEFAULT_AUDIT_PATH },
      out: { type: 'string' },
    },
  });

  let text;
  let size;
  try {
    size = statSync(values.audit).size;
    text = readFileSync(values.audit, 'utf8');
  } catch (err) {
    throw new AuditUnavailableError(
      `cannot read audit at ${values.audit}: ${err.code ?? err.message}. ` +
        'A missing audit is not a zero-finding result.',
    );
  }

  const rows = parseAudit(text);
  const document = {
    generated_at: new Date().toISOString(),
    audit_bytes: size,
    read_only: true,
    summary: summarizeAudit(rows),
  };

  const rendered = `${JSON.stringify(scrubDeep(document), null, 2)}\n`;
  if (values.out) writeFileSync(values.out, rendered);
  else process.stdout.write(rendered);
  return 0;
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('surfacer-audit-metrics.mjs');
if (invokedDirectly) {
  try {
    process.exit(main());
  } catch (err) {
    if (err instanceof AuditUnavailableError) {
      process.stderr.write(`[surfacer-audit] ${err.message}\n`);
      process.exit(2);
    }
    process.stderr.write(`[surfacer-audit] ${err.stack ?? err.message}\n`);
    process.exit(2);
  }
}
