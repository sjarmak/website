import { createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

import { contentTypeFor } from "./keys.mjs";
import { readLocalObject } from "./local-object.mjs";

const EDGE_BYTES = 1024;

export class VerifyError extends Error {
  constructor({ url, check, detail, attempts }) {
    super(`${url} failed the ${check} check after ${attempts} attempt(s): ${detail}`);
    this.name = "VerifyError";
    this.url = url;
    this.check = check;
    this.detail = detail;
    this.attempts = attempts;
  }
}

class CheckFailure extends Error {
  constructor(check, detail) {
    super(detail);
    this.check = check;
  }
}

function expect(condition, check, detail) {
  if (!condition) throw new CheckFailure(check, detail);
}

const mediaType = (res) => (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();

async function request(fetchImpl, url, { method = "GET", range, timeoutMs }) {
  try {
    return await fetchImpl(url, {
      method,
      headers: { "accept-encoding": "identity", ...(range ? { range } : {}) },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new CheckFailure("request", `${method}${range ? ` ${range}` : ""} failed: ${err.message}`);
  }
}

async function checkRange(fetchImpl, url, local, { start, end, check, timeoutMs }) {
  const res = await request(fetchImpl, url, { range: `bytes=${start}-${end}`, timeoutMs });
  const body = Buffer.from(await res.arrayBuffer());
  expect(res.status === 206, check, `expected 206 for bytes=${start}-${end}, got ${res.status}`);
  const expected = `bytes ${start}-${end}/${local.bytes}`;
  const contentRange = res.headers.get("content-range");
  expect(contentRange === expected, check, `expected Content-Range "${expected}", got "${contentRange}"`);
  expect(body.equals(local.body.subarray(start, end + 1)), check, `bytes ${start}-${end} differ from the local file`);
}

async function runChecks(fetchImpl, url, local, contentType, timeoutMs) {
  const head = await request(fetchImpl, url, { method: "HEAD", timeoutMs });
  expect(head.status === 200, "status", `HEAD returned ${head.status}`);
  expect(mediaType(head) === contentType, "content-type", `expected ${contentType}, got "${mediaType(head)}"`);
  const length = head.headers.get("content-length");
  expect(length === String(local.bytes), "content-length", `expected ${local.bytes}, got ${length}`);

  const window = Math.min(EDGE_BYTES, local.bytes);
  await checkRange(fetchImpl, url, local, { start: 0, end: window - 1, check: "range-start", timeoutMs });
  await checkRange(fetchImpl, url, local, {
    start: local.bytes - window,
    end: local.bytes - 1,
    check: "range-end",
    timeoutMs,
  });

  const full = await request(fetchImpl, url, { timeoutMs });
  const body = Buffer.from(await full.arrayBuffer());
  expect(full.status === 200, "full-get", `GET returned ${full.status}`);
  expect(mediaType(full) === contentType, "full-get", `GET Content-Type "${mediaType(full)}"`);
  const sha256 = createHash("sha256").update(body).digest("hex");
  expect(
    body.length === local.bytes && sha256 === local.sha256,
    "full-get",
    `GET returned ${body.length} bytes with sha256 ${sha256}, expected ${local.bytes} bytes with ${local.sha256}`,
  );
}

export async function verifyPublicMedia({
  url,
  file,
  deadline,
  fetchImpl = globalThis.fetch,
  sleep = delay,
  now = Date.now,
  requestTimeoutMs = 120_000,
  minDelayMs = 2_000,
  maxDelayMs = 30_000,
  log = () => {},
}) {
  const local = await readLocalObject(file);
  const contentType = contentTypeFor(new URL(url).pathname);
  let waitMs = minDelayMs;
  for (let attempts = 1; ; attempts += 1) {
    try {
      await runChecks(fetchImpl, url, local, contentType, requestTimeoutMs);
      return { url, bytes: local.bytes, sha256: local.sha256, attempts };
    } catch (err) {
      if (!(err instanceof CheckFailure)) throw err;
      const remaining = deadline - now();
      if (remaining <= 0) throw new VerifyError({ url, check: err.check, detail: err.message, attempts });
      log(`[verify] ${url}: ${err.check} not yet satisfied (${err.message}); retrying`);
      await sleep(Math.min(waitMs, remaining));
      waitMs = Math.min(waitMs * 2, maxDelayMs);
    }
  }
}
