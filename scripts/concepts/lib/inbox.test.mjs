import { test } from "node:test";
import assert from "node:assert/strict";
import { appendFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { appendProposal, backlogStats, readProposals } from "./inbox.mjs";

async function tmpInbox(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "concepts-inbox-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const inboxPath = path.join(dir, "inbox.jsonl");
  await writeFile(inboxPath, "");
  return inboxPath;
}

test("append then read roundtrips entries in order", async (t) => {
  const inboxPath = await tmpInbox(t);
  const now = new Date("2026-07-01T10:00:00.000Z");

  const first = await appendProposal(
    inboxPath,
    { source: "digest-publish-gate", kind: "concept", payload: { term: "alpha" } },
    { now },
  );
  await appendProposal(
    inboxPath,
    { source: "knowledge-sync-rider", kind: "facet", payload: "beta" },
    { now: new Date("2026-07-01T11:00:00.000Z") },
  );

  assert.equal(first.createdAt, "2026-07-01T10:00:00.000Z");

  const entries = await readProposals(inboxPath);
  assert.equal(entries.length, 2);
  assert.deepEqual(entries[0], {
    source: "digest-publish-gate",
    kind: "concept",
    payload: { term: "alpha" },
    createdAt: "2026-07-01T10:00:00.000Z",
  });
  assert.equal(entries[1].source, "knowledge-sync-rider");
});

test("append rejects missing source, kind, or payload", async (t) => {
  const inboxPath = await tmpInbox(t);
  await assert.rejects(appendProposal(inboxPath, { source: "", kind: "concept", payload: {} }), /source/);
  await assert.rejects(appendProposal(inboxPath, { source: "x", kind: "", payload: {} }), /kind/);
  await assert.rejects(appendProposal(inboxPath, { source: "x", kind: "concept" }), /payload/);
  assert.deepEqual(await readProposals(inboxPath), []);
});

test("read throws on a malformed line, naming the line number", async (t) => {
  const inboxPath = await tmpInbox(t);
  await appendProposal(inboxPath, { source: "backfill", kind: "concept", payload: 1 });
  await appendFile(inboxPath, "{not json\n");
  await assert.rejects(readProposals(inboxPath), /:2: malformed JSON/);
});

test("read throws on an entry missing required fields", async (t) => {
  const inboxPath = await tmpInbox(t);
  await appendFile(inboxPath, JSON.stringify({ kind: "concept", payload: 1, createdAt: "2026-07-01T00:00:00Z" }) + "\n");
  await assert.rejects(readProposals(inboxPath), /source/);
});

test("read of an empty inbox returns [], a missing inbox throws", async (t) => {
  const inboxPath = await tmpInbox(t);
  assert.deepEqual(await readProposals(inboxPath), []);
  await assert.rejects(readProposals(path.join(path.dirname(inboxPath), "nope.jsonl")), { code: "ENOENT" });
});

test("backlogStats reports count and oldest age in seconds", () => {
  const now = new Date("2026-07-04T00:00:00.000Z");
  assert.deepEqual(backlogStats([], { now }), { count: 0, oldestAgeSeconds: null, oldestCreatedAt: null });

  const entries = [
    { source: "a", kind: "k", payload: 1, createdAt: "2026-07-03T00:00:00.000Z" },
    { source: "b", kind: "k", payload: 2, createdAt: "2026-07-01T00:00:00.000Z" },
    { source: "c", kind: "k", payload: 3, createdAt: "2026-07-02T00:00:00.000Z" },
  ];
  assert.deepEqual(backlogStats(entries, { now }), {
    count: 3,
    oldestAgeSeconds: 3 * 24 * 3600,
    oldestCreatedAt: "2026-07-01T00:00:00.000Z",
  });
});
