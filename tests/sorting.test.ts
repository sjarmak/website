import assert from "node:assert/strict";
import { test } from "node:test";
import { byDate, byId, byNumber, thenBy } from "../src/lib/sorting.ts";

interface Row {
  id: string;
  date: Date;
  score: number;
  order?: number;
}

const ids = (rows: Row[]) => rows.map((row) => row.id);

test("thenBy applies id as a deterministic same-date tiebreaker", () => {
  const rows: Row[] = [
    { id: "beta", date: new Date("2026-07-31T00:00:00Z"), score: 0 },
    { id: "old", date: new Date("2026-07-30T00:00:00Z"), score: 0 },
    { id: "alpha", date: new Date("2026-07-31T00:00:00Z"), score: 0 },
  ];

  const sorted = [...rows].sort(thenBy(byDate((row) => row.date, "desc"), byId()));

  assert.deepEqual(ids(sorted), ["alpha", "beta", "old"]);
});

test("thenBy applies id as a deterministic same-number tiebreaker", () => {
  const rows: Row[] = [
    { id: "gamma", date: new Date("2026-07-31T00:00:00Z"), score: 2 },
    { id: "alpha", date: new Date("2026-07-31T00:00:00Z"), score: 3 },
    { id: "beta", date: new Date("2026-07-31T00:00:00Z"), score: 3 },
  ];

  const sorted = [...rows].sort(thenBy(byNumber((row) => row.score, "desc"), byId()));

  assert.deepEqual(ids(sorted), ["alpha", "beta", "gamma"]);
});

test("optional numeric ranks can still break ties by id", () => {
  const rows: Row[] = [
    { id: "beta", date: new Date("2026-07-31T00:00:00Z"), score: 0 },
    { id: "first", date: new Date("2026-07-31T00:00:00Z"), score: 0, order: 1 },
    { id: "alpha", date: new Date("2026-07-31T00:00:00Z"), score: 0 },
  ];

  const sorted = [...rows].sort(thenBy(byNumber((row) => row.order ?? 99), byId()));

  assert.deepEqual(ids(sorted), ["first", "alpha", "beta"]);
});
