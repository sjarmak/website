import path from "node:path";

const SITE_PREFIX = "/media/";
const SLUG = /^[a-z0-9-]+$/;
const SEGMENT = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/;
const DIGEST_KEY = /^digests\/([a-z0-9-]+)\.mp3$/;

const CONTENT_TYPES = new Map([
  [".mp3", "audio/mpeg"],
  [".m4a", "audio/mp4"],
  [".wav", "audio/wav"],
  [".mp4", "video/mp4"],
  [".webm", "video/webm"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".vtt", "text/vtt"],
  [".json", "application/json"],
]);

export function assertMediaKey(key) {
  if (typeof key !== "string" || key.length === 0 || !key.split("/").every((s) => SEGMENT.test(s))) {
    throw new Error(`invalid media key: ${JSON.stringify(key)}`);
  }
  return key;
}

export function digestKey(slug) {
  if (typeof slug !== "string" || !SLUG.test(slug)) {
    throw new Error(`invalid digest slug: ${JSON.stringify(slug)}`);
  }
  return `digests/${slug}.mp3`;
}

export function slugFromDigestKey(key) {
  const match = DIGEST_KEY.exec(key);
  if (!match) throw new Error(`not a digest audio key: ${JSON.stringify(key)}`);
  return match[1];
}

export function siteUrlForKey(key) {
  return `${SITE_PREFIX}${assertMediaKey(key)}`;
}

export function isSiteMediaUrl(url) {
  return typeof url === "string" && url.startsWith(SITE_PREFIX);
}

export function keyFromSiteUrl(url) {
  if (!isSiteMediaUrl(url)) throw new Error(`not a site media URL: ${JSON.stringify(url)}`);
  return assertMediaKey(url.slice(SITE_PREFIX.length));
}

export function publicUrlForKey(base, key) {
  const encoded = assertMediaKey(key).split("/").map(encodeURIComponent).join("/");
  return `${base.replace(/\/+$/, "")}/${encoded}`;
}

export function contentTypeFor(key) {
  const type = CONTENT_TYPES.get(path.extname(key).toLowerCase());
  if (!type) throw new Error(`no content type known for ${JSON.stringify(key)}`);
  return type;
}
