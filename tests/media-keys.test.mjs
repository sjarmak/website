import assert from "node:assert/strict";
import { test } from "node:test";
import * as hegel from "@hegeldev/hegel";
import * as gs from "@hegeldev/hegel/generators";

import {
  contentTypeFor,
  digestKey,
  keyFromSiteUrl,
  publicUrlForKey,
  siteUrlForKey,
  slugFromDigestKey,
} from "../scripts/media/keys.mjs";

test("digest slugs map to the existing /media/digests URL layout", () => {
  assert.equal(digestKey("daily-2026-10-15"), "digests/daily-2026-10-15.mp3");
  assert.equal(siteUrlForKey("digests/daily-2026-10-15.mp3"), "/media/digests/daily-2026-10-15.mp3");
  assert.equal(
    publicUrlForKey("https://www.sjarmak.ai/media/", "digests/daily-2026-10-15.mp3"),
    "https://www.sjarmak.ai/media/digests/daily-2026-10-15.mp3",
  );
  assert.equal(keyFromSiteUrl("/media/podcasts/audiobook-erca-ep01-introduction.mp3"), "podcasts/audiobook-erca-ep01-introduction.mp3");
});

test("keys that could escape the media namespace are rejected", () => {
  for (const bad of ["../etc/passwd", "/digests/a.mp3", "digests//a.mp3", "digests/.tmp-a/part-000.wav", "a\\b.mp3", ""]) {
    assert.throws(() => siteUrlForKey(bad), /invalid media key/, bad);
  }
  assert.throws(() => keyFromSiteUrl("https://evil.example/media/a.mp3"), /not a site media URL/);
  assert.throws(() => digestKey("Daily_2026"), /invalid digest slug/);
  assert.throws(() => slugFromDigestKey("podcasts/x.mp3"), /not a digest audio key/);
});

test("content types are exact per extension and unknown extensions fail", () => {
  assert.equal(contentTypeFor("digests/a.mp3"), "audio/mpeg");
  assert.equal(contentTypeFor("demo.mp4"), "video/mp4");
  assert.equal(contentTypeFor("cover.JPG"), "image/jpeg");
  assert.equal(contentTypeFor("clip.m4a"), "audio/mp4");
  assert.throws(() => contentTypeFor("notes.exe"), /no content type/);
});

test("property: slug -> key -> site URL -> public URL round-trips back to the slug", () =>
  hegel.test((tc) => {
    const slug = tc.draw(gs.fromRegex("[a-z0-9-]{1,80}"));
    const key = digestKey(slug);
    const siteUrl = siteUrlForKey(key);
    assert.equal(keyFromSiteUrl(siteUrl), key);
    assert.equal(slugFromDigestKey(key), slug);
    const base = "https://www.sjarmak.ai/media";
    const publicUrl = publicUrlForKey(base, key);
    assert.equal(publicUrl, `${base}${siteUrl.slice("/media".length)}`);
    assert.equal(keyFromSiteUrl(new URL(publicUrl).pathname), key);
  }));
