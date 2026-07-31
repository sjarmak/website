import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { receiptDomId } from "../src/lib/receipts/domId.ts";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RECEIPTS_PAGE = path.join(REPO_ROOT, "dist", "prototypes", "receipts", "index.html");
const RECEIPT = {
  id: "scix-llm-embeddings",
  kind: "paper",
  source: "Blanco-Cuaresma, Ciuca, Accomazzi, Jarmak et al. 2023",
  url: "https://arxiv.org/abs/2312.14211",
};

test("receipt DOM ids are deterministic and content-derived", () => {
  const first = receiptDomId(RECEIPT);
  const second = receiptDomId({ ...RECEIPT });

  assert.equal(second, first);
  assert.match(first, /^receipt-[a-f0-9]{8}$/);
  assert.notEqual(
    receiptDomId({ ...RECEIPT, url: "https://example.com/other-source" }),
    first,
  );
  assert.notEqual(receiptDomId({ ...RECEIPT, id: "duplicate-source" }), first);
});

test("receipt component does not create per-render random ids", async () => {
  const component = await readFile(
    path.join(REPO_ROOT, "src", "components", "receipts", "Receipt.astro"),
    "utf8",
  );

  assert.doesNotMatch(component, /randomUUID/);
  assert.match(component, /receiptDomId/);
});

test("rendered receipt tooltip ids are unique on the receipts page", async () => {
  if (!existsSync(RECEIPTS_PAGE)) {
    await execFileP("npm", ["run", "build"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 });
  }

  const html = await readFile(RECEIPTS_PAGE, "utf8");
  const ids = Array.from(html.matchAll(/id="(receipt-[a-f0-9]{8}-pop)"/g), (match) => match[1]);

  assert.equal(ids.length, 6);
  assert.equal(new Set(ids).size, ids.length);
});
