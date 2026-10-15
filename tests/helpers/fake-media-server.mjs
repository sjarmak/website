import { createHash } from "node:crypto";
import http from "node:http";

const PUBLIC_PREFIX = "/media/";

function decodeKey(rest) {
  return rest.split("/").map(decodeURIComponent).join("/");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function s3Error(res, status, code) {
  res.writeHead(status, { "content-type": "application/xml" });
  res.end(`<?xml version="1.0" encoding="UTF-8"?><Error><Code>${code}</Code><Message>${code}</Message></Error>`);
}

function objectHeaders(obj) {
  return {
    "content-length": String(obj.body.length),
    "content-type": obj.contentType,
    etag: obj.etag,
    "last-modified": new Date(0).toUTCString(),
    ...(obj.cacheControl ? { "cache-control": obj.cacheControl } : {}),
    ...Object.fromEntries(Object.entries(obj.meta).map(([k, v]) => [`x-amz-meta-${k}`, v])),
  };
}

function makeObject(body, { contentType = "application/octet-stream", cacheControl, meta = {} } = {}) {
  return {
    body,
    contentType,
    cacheControl,
    meta,
    etag: `"${createHash("md5").update(body).digest("hex")}"`,
  };
}

async function handleS3(state, req, res, key) {
  if (req.method === "HEAD" || req.method === "GET") {
    state.stats.heads += req.method === "HEAD" ? 1 : 0;
    const obj = state.objects.get(key);
    if (!obj) return req.method === "HEAD" ? (res.writeHead(404), res.end()) : s3Error(res, 404, "NoSuchKey");
    res.writeHead(200, objectHeaders(obj));
    return res.end(req.method === "GET" ? obj.body : undefined);
  }
  if (req.method !== "PUT") return s3Error(res, 405, "MethodNotAllowed");
  state.stats.putAttempts += 1;
  if (state.faults.interruptPuts > 0) {
    state.faults.interruptPuts -= 1;
    req.once("data", () => req.socket.destroy());
    return;
  }
  const body = await readBody(req);
  if (state.faults.beforePutCommit) await state.faults.beforePutCommit(key);
  if (req.headers["if-none-match"] === "*" && state.objects.has(key)) return s3Error(res, 412, "PreconditionFailed");
  const meta = Object.fromEntries(
    Object.entries(req.headers)
      .filter(([k]) => k.startsWith("x-amz-meta-"))
      .map(([k, v]) => [k.slice("x-amz-meta-".length), v]),
  );
  const obj = makeObject(body, {
    contentType: req.headers["content-type"],
    cacheControl: req.headers["cache-control"],
    meta,
  });
  state.objects.set(key, obj);
  state.stats.puts += 1;
  res.writeHead(200, { etag: obj.etag });
  res.end();
}

function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header ?? "");
  if (!match) return null;
  const [, a, b] = match;
  if (a === "" && b === "") return null;
  if (a === "") return { start: Math.max(0, size - Number(b)), end: size - 1 };
  return { start: Number(a), end: b === "" ? size - 1 : Math.min(Number(b), size - 1) };
}

async function handlePublic(state, req, res, key) {
  state.stats.publicRequests.push({ method: req.method, key, range: req.headers.range ?? null });
  const fault = state.faults.public.get(key) ?? {};
  if (fault.hold) await fault.hold;
  if (fault.notFoundTimes > 0) {
    fault.notFoundTimes -= 1;
    res.writeHead(404, { "content-type": "text/html" });
    return res.end("not found");
  }
  const obj = state.objects.get(key);
  if (!obj || fault.status === 404) {
    res.writeHead(404, { "content-type": "text/html" });
    return res.end("not found");
  }
  let body = obj.body;
  if (fault.truncateBy) body = body.subarray(0, body.length - fault.truncateBy);
  if (fault.corrupt) {
    body = Buffer.from(body);
    body[0] ^= 0xff;
    body[body.length - 1] ^= 0xff;
  }
  const contentType = fault.contentType ?? obj.contentType;
  const base = { "content-type": contentType, "accept-ranges": fault.noRange ? "none" : "bytes" };
  const range = fault.noRange ? null : parseRange(req.headers.range, body.length);
  if (range) {
    const slice = body.subarray(range.start, range.end + 1);
    res.writeHead(206, {
      ...base,
      "content-length": String(slice.length),
      "content-range": `bytes ${range.start}-${range.end}/${body.length}`,
    });
    if (req.method !== "HEAD" && takeOnce(fault, "stallRangeBodyTimes")) return res.write(slice.subarray(0, slice.length >> 1));
    return res.end(req.method === "HEAD" ? undefined : slice);
  }
  res.writeHead(200, { ...base, "content-length": String(body.length) });
  if (req.method !== "HEAD" && takeOnce(fault, "resetFullBodyTimes")) {
    return res.write(body.subarray(0, body.length >> 1), () => res.socket.destroy());
  }
  return res.end(req.method === "HEAD" ? undefined : body);
}

function takeOnce(fault, name) {
  if (!(fault[name] > 0)) return false;
  fault[name] -= 1;
  return true;
}

export async function startFakeMediaServer({ bucket = "test-bucket" } = {}) {
  const state = {
    objects: new Map(),
    stats: { puts: 0, putAttempts: 0, heads: 0, publicRequests: [] },
    faults: { public: new Map(), interruptPuts: 0, beforePutCommit: null },
  };
  const server = http.createServer((req, res) => {
    const { pathname } = new URL(req.url, "http://localhost");
    const s3Prefix = `/${bucket}/`;
    const route = pathname.startsWith(PUBLIC_PREFIX)
      ? handlePublic(state, req, res, decodeKey(pathname.slice(PUBLIC_PREFIX.length)))
      : pathname.startsWith(s3Prefix)
        ? handleS3(state, req, res, decodeKey(pathname.slice(s3Prefix.length)))
        : Promise.resolve(s3Error(res, 404, "NoSuchBucket"));
    route.catch((err) => {
      res.destroy(err);
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const origin = `http://127.0.0.1:${port}`;
  return {
    ...state,
    bucket,
    endpoint: origin,
    publicBase: `${origin}/media`,
    putObject(key, body, contentType = "audio/mpeg", meta = {}) {
      state.objects.set(key, makeObject(body, { contentType, meta }));
    },
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}
