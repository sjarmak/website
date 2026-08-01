/**
 * Read-only SQL guard.
 *
 * Every statement this deliverable sends to the Dolt sql-server passes through
 * assertReadOnly first. It throws rather than sanitising, and layers four
 * rules: an allowlist of leading verbs, a ban on statement chaining, a
 * denylist of mutating SQL keywords, and a default-deny allowlist over every
 * `dolt_*` identifier.
 *
 * The last rule is the load-bearing one. Dolt mutates from inside a SELECT, so
 * `SELECT dolt_purge_dropped_databases()` satisfies every other rule. Only an
 * allowlist closes that, because any enumeration of the mutating procedures is
 * stale as soon as Dolt adds one.
 *
 * Scope, stated honestly: this stops a caller in this directory from sending a
 * write. It is not a security boundary. It runs in the client, so it constrains
 * this code, not the database. The database-side control is the credential, and
 * these scripts should be run with a read-only grant regardless.
 */

/** Statements may only begin with one of these. */
const ALLOWED_LEADING = ['SELECT', 'SHOW', 'DESCRIBE', 'DESC', 'EXPLAIN', 'WITH'];

/**
 * Tokens that must never appear anywhere in the statement, matched on word
 * boundaries so `selected_at` does not trip `SELECT` and `updated` in a column
 * name does not trip `UPDATE`.
 *
 * Dolt's mutating stored procedures are deliberately NOT listed here. They are
 * handled by the default-deny rule below instead: enumerating them was a
 * denylist, and a denylist of a vendor's procedure surface is wrong by
 * construction, because it passes every procedure the vendor adds next. An
 * audit of an earlier revision of this file found four misses that all begin
 * with SELECT and so cleared the leading-verb check: dolt_undrop,
 * dolt_purge_dropped_databases, dolt_stash and dolt_remote. One of those is
 * irreversibly destructive.
 */
const FORBIDDEN_TOKENS = [
  'INSERT', 'UPDATE', 'DELETE', 'REPLACE', 'MERGE', 'UPSERT',
  'CREATE', 'ALTER', 'DROP', 'TRUNCATE', 'RENAME',
  'GRANT', 'REVOKE', 'FLUSH', 'LOCK', 'UNLOCK',
  'COMMIT', 'ROLLBACK', 'SAVEPOINT', 'START', 'BEGIN',
  'CALL', 'DO', 'HANDLER', 'LOAD', 'IMPORT', 'INTO', 'PREPARE', 'EXECUTE',
  'SET', 'RESET', 'PURGE', 'ANALYZE', 'OPTIMIZE', 'REPAIR', 'CHECKSUM',
  // Not mutations, but unbounded resource consumption against a sql-server a
  // live multi-agent city depends on. The client timeout is 60s.
  'SLEEP', 'BENCHMARK', 'GET_LOCK', 'RELEASE_LOCK',
];

/**
 * The only `dolt_*` identifiers permitted. Every other identifier beginning
 * with `DOLT_` is rejected, so a new mutating procedure is denied the day it
 * ships rather than the day someone remembers to add it to a list.
 *
 * These are Dolt's read-only system tables and functions.
 */
const ALLOWED_DOLT_EXACT = new Set([
  'DOLT_LOG', 'DOLT_DIFF', 'DOLT_COMMITS', 'DOLT_COMMIT_ANCESTORS',
  'DOLT_BRANCHES', 'DOLT_REMOTE_BRANCHES', 'DOLT_REMOTES', 'DOLT_STATUS',
  'DOLT_TAGS', 'DOLT_STASHES', 'DOLT_SCHEMAS', 'DOLT_PROCEDURES',
  'DOLT_QUERY_CATALOG', 'DOLT_CONFLICTS', 'DOLT_MERGE_STATUS', 'DOLT_IGNORE',
  'DOLT_COLUMN_DIFF', 'DOLT_SCHEMA_DIFF', 'DOLT_HASHOF', 'DOLT_VERSION',
]);

/**
 * Read-only Dolt system tables that carry a user table name as a suffix, for
 * example `dolt_history_issues`. Prefix match, not substring: an identifier
 * must start with one of these AND have a non-empty suffix.
 */
const ALLOWED_DOLT_PREFIXES = [
  'DOLT_HISTORY_', 'DOLT_DIFF_', 'DOLT_COMMIT_DIFF_', 'DOLT_BLAME_',
  'DOLT_WORKSPACE_', 'DOLT_CONSTRAINT_VIOLATIONS_',
];

/** True when a DOLT_* identifier is one of the known read-only surfaces. */
function isAllowedDoltIdentifier(identifier) {
  if (ALLOWED_DOLT_EXACT.has(identifier)) return true;
  return ALLOWED_DOLT_PREFIXES.some(
    (prefix) => identifier.startsWith(prefix) && identifier.length > prefix.length,
  );
}

/** Strip -- line comments, # line comments, and block comments. */
function stripComments(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
    .replace(/#[^\n]*/g, ' ');
}

/**
 * Throw unless `sql` is a single read-only statement.
 * @param {string} sql
 * @returns {string} the statement, unchanged, when it passes
 */
export function assertReadOnly(sql) {
  if (typeof sql !== 'string' || sql.trim() === '') {
    throw new Error('read-only guard: statement must be a non-empty string');
  }

  const stripped = stripComments(sql).trim();
  if (stripped === '') {
    throw new Error('read-only guard: statement is only comments');
  }

  // Reject chaining. One trailing semicolon is allowed and nothing after it.
  const body = stripped.replace(/;\s*$/, '');
  if (body.includes(';')) {
    throw new Error('read-only guard: multiple statements are not allowed');
  }

  const upper = body.toUpperCase();

  const leading = upper.match(/^[A-Z_]+/)?.[0] ?? '';
  if (!ALLOWED_LEADING.includes(leading)) {
    throw new Error(
      `read-only guard: statement must begin with one of ${ALLOWED_LEADING.join(', ')}, got "${leading || '?'}"`,
    );
  }

  for (const token of FORBIDDEN_TOKENS) {
    const re = new RegExp(`(^|[^A-Z0-9_])${token}([^A-Z0-9_]|$)`);
    if (re.test(upper)) {
      throw new Error(`read-only guard: forbidden token "${token}" in statement`);
    }
  }

  // Default-deny every dolt_* identifier that is not a known read-only surface.
  // This is the rule that stops a SELECT-shaped mutation such as
  // `SELECT dolt_purge_dropped_databases()`.
  for (const [identifier] of upper.matchAll(/\bDOLT_[A-Z0-9_]*/g)) {
    if (!isAllowedDoltIdentifier(identifier)) {
      throw new Error(
        `read-only guard: dolt identifier "${identifier}" is not on the read-only allowlist`,
      );
    }
  }

  return body;
}
