/**
 * Read-only network client for the running Dolt sql-server.
 *
 * Two safety properties, both structural rather than advisory:
 *
 * 1. It never opens the store directory. `dolt sql` executed inside
 *    `.beads/dolt` while a sql-server holds that directory can wedge a running
 *    multi-agent system. This client connects over TCP to the already-running
 *    server as an ordinary client, which is the same access path the city's own
 *    tooling uses.
 * 2. Every statement passes assertReadOnly before it is sent, and the statement
 *    is passed as a single argv element to a spawned process with no shell, so
 *    there is no interpolation layer that could smuggle a second statement in.
 *
 * Failure is loud. A connection refusal, a non-zero exit, or output that does
 * not parse throws. Nothing in this module returns an empty result set to stand
 * in for an error, because a metric that silently reports zero when the store
 * is unreachable is worse than no metric.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { assertReadOnly } from './readonly.mjs';

/** Where the running server records pid:port:uuid. */
export const DEFAULT_SERVER_INFO = '/home/ds/gas-city/.beads/dolt/.dolt/sql-server.info';

/** Stores that hold city work. Mirrors the watchdog's all-store scope. */
export const DEFAULT_STORES = ['gc', 'gascity', 'gascity_dashboard', 'website'];

export class DoltUnavailableError extends Error {}
export class DoltQueryError extends Error {}

/**
 * Read the listener port from the running server's info file.
 * Throws if the file is absent, which means no server is running and the
 * correct action is to stop, not to fall back to a directory-mode read.
 * @param {string} infoPath
 * @returns {number}
 */
export function readServerPort(infoPath = DEFAULT_SERVER_INFO) {
  let raw;
  try {
    raw = readFileSync(infoPath, 'utf8').trim();
  } catch (err) {
    throw new DoltUnavailableError(
      `no running Dolt sql-server: cannot read ${infoPath} (${err.code ?? err.message}). ` +
        'Refusing to open the store directory directly.',
    );
  }
  const parts = raw.split(':');
  const port = Number.parseInt(parts[1] ?? '', 10);
  if (!Number.isInteger(port) || port <= 0) {
    throw new DoltUnavailableError(`malformed sql-server.info: ${JSON.stringify(raw)}`);
  }
  return port;
}

/**
 * Run one read-only statement and return its rows.
 * @param {string} sql
 * @param {{host?:string, port?:number, cwd?:string, timeoutMs?:number}} [opts]
 * @returns {Record<string,string|null>[]}
 */
export function query(sql, opts = {}) {
  const statement = assertReadOnly(sql);
  const host = opts.host ?? '127.0.0.1';
  const port = opts.port ?? readServerPort();
  // A neutral cwd. Never the store directory.
  const cwd = opts.cwd ?? '/tmp';

  const res = spawnSync(
    'dolt',
    [
      '--host', host,
      '--port', String(port),
      '--user', 'root',
      '--no-tls',
      '--password', '',
      'sql',
      '--result-format', 'json',
      '-q', statement,
    ],
    { cwd, encoding: 'utf8', timeout: opts.timeoutMs ?? 60_000, shell: false },
  );

  if (res.error) {
    throw new DoltUnavailableError(`dolt client failed to start: ${res.error.message}`);
  }
  if (res.status !== 0) {
    throw new DoltQueryError(
      `dolt exited ${res.status}: ${(res.stderr || res.stdout || '').trim().slice(0, 500)}`,
    );
  }
  const out = (res.stdout ?? '').trim();
  if (out === '') {
    throw new DoltQueryError('dolt returned no output; refusing to treat that as an empty result');
  }
  let parsed;
  try {
    parsed = JSON.parse(out);
  } catch (err) {
    throw new DoltQueryError(`dolt output did not parse as JSON: ${err.message}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new DoltQueryError(`dolt JSON is not an object: ${out.slice(0, 200)}`);
  }
  // A genuinely empty result set serialises as `{}` with exit status 0. That is
  // a real zero-row answer, distinct from the failure cases above, all of which
  // have already thrown by this point: a refused connection, a non-zero exit,
  // empty stdout, and unparseable output.
  if (!('rows' in parsed)) return [];
  if (!Array.isArray(parsed.rows)) {
    throw new DoltQueryError(`dolt JSON rows is not an array: ${out.slice(0, 200)}`);
  }
  // The JSON writer omits a column entirely when its value is NULL, so callers
  // must treat an absent key and an explicit null identically.
  return parsed.rows;
}

/** Numeric coercion that refuses to silently produce 0 from a null. */
export function toNumber(value, field) {
  if (value === null || value === undefined || value === '') {
    throw new DoltQueryError(`expected a number for ${field}, got ${JSON.stringify(value)}`);
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new DoltQueryError(`expected a number for ${field}, got ${JSON.stringify(value)}`);
  }
  return n;
}
