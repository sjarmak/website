// Committed-embeddings well-formedness gate. Asserts src/data/knowledge/
// embeddings.json parses and its vectors are internally consistent and match
// what src/lib/knowledge/retrieval.ts expects: L2-normalized rows of `dim`
// finite floats, so the semantic lane's plain dot product is a valid cosine.
// Concept vectors and toolchain metadata are OPTIONAL in the committed file —
// they appear only after the next real bake (build_embeddings.py); when
// present they must satisfy the same checks.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { dot } from "../src/lib/knowledge/retrieval.ts";

const COMMITTED = "src/data/knowledge/embeddings.json";
const CORRUPT_FIXTURE = "tests/fixtures/embeddings-corrupt.json";

/** Tolerance on |v|^2 == 1: components are rounded to 5 decimals at bake time. */
const NORM_TOLERANCE = 0.01;

function validateEmbeddings(data) {
  assert.equal(typeof data, "object", "embeddings must be an object");
  assert.ok(data !== null && !Array.isArray(data), "embeddings must be an object");
  assert.ok(typeof data.model === "string" && data.model.length > 0, "model must be a non-empty string");
  assert.ok(Number.isInteger(data.dim) && data.dim > 0, "dim must be a positive integer");
  assert.equal(data.normalized, true, "vectors must be L2-normalized (retrieval.ts uses a plain dot product)");
  if (data.toolchain !== undefined) {
    assert.equal(typeof data.toolchain, "object", "toolchain must be an object");
    for (const [lib, version] of Object.entries(data.toolchain)) {
      assert.ok(typeof version === "string" && version.length > 0, `toolchain.${lib} must be a non-empty version string`);
    }
  }
  const vectors = data.vectors;
  assert.ok(vectors && typeof vectors === "object" && !Array.isArray(vectors), "vectors must be an object");
  const entries = Object.entries(vectors);
  assert.ok(entries.length > 0, "vectors must not be empty");
  for (const [id, vec] of entries) {
    assert.match(id, /^[a-z][a-z0-9-]*:.+$/, `vector id "${id}" must follow the <kind>:<slug|bibcode> scheme`);
    assert.ok(Array.isArray(vec), `${id}: vector must be an array`);
    assert.equal(vec.length, data.dim, `${id}: vector length ${vec.length} != dim ${data.dim}`);
    for (const x of vec) {
      assert.ok(typeof x === "number" && Number.isFinite(x), `${id}: non-finite component`);
    }
    const normSq = dot(vec, vec);
    assert.ok(
      Math.abs(normSq - 1) <= NORM_TOLERANCE,
      `${id}: |v|^2 = ${normSq.toFixed(4)} — not L2-normalized`,
    );
  }
}

function load(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

test("committed embeddings.json parses and is internally consistent", () => {
  validateEmbeddings(load(COMMITTED));
});

test("corrupted fixture fails validation (dim mismatch)", () => {
  assert.throws(() => validateEmbeddings(load(CORRUPT_FIXTURE)), /vector length 3 != dim 4/);
});

test("wrong dim field fails validation", () => {
  const data = load(COMMITTED);
  data.dim += 1;
  assert.throws(() => validateEmbeddings(data), /!= dim/);
});

test("non-normalized vector fails validation", () => {
  const data = load(COMMITTED);
  const [id] = Object.keys(data.vectors);
  data.vectors[id] = data.vectors[id].map((x) => x * 2);
  assert.throws(() => validateEmbeddings(data), /not L2-normalized/);
});

test("non-finite component fails validation", () => {
  const data = load(COMMITTED);
  const [id] = Object.keys(data.vectors);
  data.vectors[id] = [...data.vectors[id]];
  data.vectors[id][0] = null;
  assert.throws(() => validateEmbeddings(data), /non-finite component/);
});

test("concept vectors, when present, satisfy the same contract", () => {
  const data = load(COMMITTED);
  const unit = [1, ...Array(data.dim - 1).fill(0)];
  data.vectors["concept:evaluation"] = unit;
  validateEmbeddings(data); // must not throw — concept ids are first-class
});
