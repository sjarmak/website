import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { scrubAwsEnvironment } from "./config.mjs";
import { assertMediaKey, contentTypeFor } from "./keys.mjs";
import { readLocalObject } from "./local-object.mjs";

export const CACHE_CONTROL = "public, max-age=604800";
const PUT_ROUNDS = 3;

export class ConflictError extends Error {
  constructor(key, remote, local) {
    super(
      `R2 object ${key} already exists with different content ` +
        `(remote ${remote.bytes} bytes, sha256 ${remote.sha256 ?? "missing"}; ` +
        `local ${local.bytes} bytes, sha256 ${local.sha256}). Keys are immutable: ` +
        "publish under a new slug or restore the original file.",
    );
    this.name = "ConflictError";
    this.key = key;
  }
}

export function createR2Client(config, { maxAttempts = 3 } = {}) {
  scrubAwsEnvironment(process.env);
  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    maxAttempts,
  });
}

const statusOf = (err) => err?.$metadata?.httpStatusCode;

export function createR2Store(config, { client = createR2Client(config) } = {}) {
  const bucket = config.bucket;
  return Object.freeze({
    label: `r2://${bucket}`,
    async head(key) {
      try {
        const out = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        return { bytes: out.ContentLength, sha256: out.Metadata?.sha256 ?? null, contentType: out.ContentType };
      } catch (err) {
        if (statusOf(err) === 404) return null;
        throw err;
      }
    },
    async putIfAbsent(key, body, { contentType, sha256 }) {
      try {
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentLength: body.length,
            ContentType: contentType,
            CacheControl: CACHE_CONTROL,
            Metadata: { sha256 },
            IfNoneMatch: "*",
          }),
        );
        return "created";
      } catch (err) {
        if (statusOf(err) === 412 || statusOf(err) === 409) return "exists";
        throw err;
      }
    },
  });
}

export async function putImmutable(store, { key, file }) {
  assertMediaKey(key);
  const contentType = contentTypeFor(key);
  const local = await readLocalObject(file);
  const summary = { key, bytes: local.bytes, sha256: local.sha256 };
  for (let round = 0; round < PUT_ROUNDS; round += 1) {
    const remote = await store.head(key);
    if (remote) {
      if (remote.bytes === local.bytes && remote.sha256 === local.sha256) return { ...summary, status: "skipped" };
      throw new ConflictError(key, remote, local);
    }
    const outcome = await store.putIfAbsent(key, local.body, { contentType, sha256: local.sha256 });
    if (outcome === "created") return { ...summary, status: "uploaded" };
  }
  throw new Error(`${store.label}/${key}: a concurrent writer kept the object in flux; rerun the upload`);
}
