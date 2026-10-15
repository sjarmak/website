import assert from "node:assert/strict";
import { test } from "node:test";

import {
  mediaBackend,
  publicBase,
  r2ConfigFromEnv,
  scrubAwsEnvironment,
  spoolRoot,
  verifyTimeoutMs,
} from "../scripts/media/config.mjs";

const ACCOUNT = "0123456789abcdef0123456789abcdef";
const FULL = {
  R2_ACCOUNT_ID: ACCOUNT,
  R2_ACCESS_KEY_ID: "access",
  R2_SECRET_ACCESS_KEY: "secret",
  R2_BUCKET: "sjarmak-ai-media",
};

test("missing R2 variables throw and name every missing variable", () => {
  assert.throws(() => r2ConfigFromEnv({}), /R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET/);
  assert.throws(() => r2ConfigFromEnv({ ...FULL, R2_SECRET_ACCESS_KEY: "  " }), /missing: R2_SECRET_ACCESS_KEY/);
});

test("the R2 endpoint is derived from the account id, never from AWS defaults", () => {
  const config = r2ConfigFromEnv({ ...FULL, AWS_PROFILE: "omni-sso", AWS_ENDPOINT_URL_S3: "https://s3.amazonaws.com" });
  assert.equal(config.endpoint, `https://${ACCOUNT}.r2.cloudflarestorage.com`);
  assert.equal(config.bucket, "sjarmak-ai-media");
  assert.throws(() => r2ConfigFromEnv({ ...FULL, R2_ACCOUNT_ID: "evil.example.com/x" }), /R2_ACCOUNT_ID/);
  assert.throws(() => r2ConfigFromEnv({ ...FULL, R2_BUCKET: "Bad_Bucket" }), /R2_BUCKET/);
});

test("an endpoint override is accepted only for loopback test servers", () => {
  assert.equal(
    r2ConfigFromEnv({ ...FULL, R2_ENDPOINT_OVERRIDE: "http://127.0.0.1:9000" }).endpoint,
    "http://127.0.0.1:9000",
  );
  assert.throws(
    () => r2ConfigFromEnv({ ...FULL, R2_ENDPOINT_OVERRIDE: "https://attacker.example" }),
    /loopback/,
  );
});

test("AWS shared-config variables are removed so ~/.aws is never consulted", () => {
  const env = {
    AWS_PROFILE: "omni",
    AWS_DEFAULT_PROFILE: "omni",
    AWS_ACCESS_KEY_ID: "x",
    AWS_REGION: "us-east-1",
    PATH: "/usr/bin",
  };
  const removed = scrubAwsEnvironment(env);
  assert.deepEqual(removed.sort(), ["AWS_ACCESS_KEY_ID", "AWS_DEFAULT_PROFILE", "AWS_PROFILE", "AWS_REGION"]);
  assert.equal(env.PATH, "/usr/bin");
  assert.equal(env.AWS_CONFIG_FILE, "/dev/null");
  assert.equal(env.AWS_SHARED_CREDENTIALS_FILE, "/dev/null");
});

test("backend, public base, timeout and spool defaults", () => {
  assert.equal(mediaBackend({}), "git");
  assert.equal(mediaBackend({ MEDIA_BACKEND: "r2" }), "r2");
  assert.throws(() => mediaBackend({ MEDIA_BACKEND: "s3" }), /MEDIA_BACKEND/);
  assert.equal(publicBase({}), "https://www.sjarmak.ai/media");
  assert.equal(publicBase({ MEDIA_PUBLIC_BASE: "https://cdn.example/m/" }), "https://cdn.example/m");
  assert.throws(() => publicBase({ MEDIA_PUBLIC_BASE: "ftp://x" }), /MEDIA_PUBLIC_BASE/);
  assert.equal(verifyTimeoutMs({}), 300_000);
  assert.equal(verifyTimeoutMs({ MEDIA_VERIFY_TIMEOUT_SEC: "1200" }), 1_200_000);
  assert.throws(() => verifyTimeoutMs({ MEDIA_VERIFY_TIMEOUT_SEC: "soon" }), /MEDIA_VERIFY_TIMEOUT_SEC/);
  assert.equal(spoolRoot({ HOME: "/var/lib/x" }), "/var/lib/x/.local/share/sjarmak-media/spool");
  assert.equal(spoolRoot({ DIGEST_SPOOL: "/srv/spool" }), "/srv/spool");
  assert.throws(() => spoolRoot({ DIGEST_SPOOL: "relative" }), /absolute/);
});
