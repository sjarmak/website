// R6 acceptance over the BUILT site (dist/): /about and / carry ProfilePage
// blocks whose Person @id is byte-identical; every on-site post carries a
// valid BlogPosting whose author references that same @id; external-source
// writing entries render no page (so no BlogPosting); zero FAQPage anywhere;
// and every application/ld+json block sitewide is parseable JSON. Builds
// dist/ in before() if absent (same pattern as tests/colophon-dist.test.mjs).

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(REPO_ROOT, "dist");

const PERSON_ID = "https://sjarmak.ai/#person";

function parseJsonLdBlocks(pageHtml) {
  return [...pageHtml.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(
    (m) => JSON.parse(m[1]),
  );
}

function readPage(...segments) {
  return readFileSync(path.join(DIST, ...segments, "index.html"), "utf8");
}

function allDistHtmlFiles() {
  return readdirSync(DIST, { recursive: true })
    .filter((p) => p.endsWith(".html"))
    .map((p) => path.join(DIST, p));
}

/** Non-draft on-site post slugs, straight from the content source of truth. */
function onSitePostSlugs() {
  const dir = path.join(REPO_ROOT, "src", "content", "posts");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .filter((f) => !/^draft:\s*true$/m.test(readFileSync(path.join(dir, f), "utf8")))
    .map((f) => f.replace(/\.md$/, ""));
}

before(async () => {
  if (!existsSync(path.join(DIST, "index.html"))) {
    await execFileP("npm", ["run", "build"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 });
  }
});

// ------------------------------------------------- ProfilePage + Person @id

function profileBlockOf(pageHtml, label) {
  const profiles = parseJsonLdBlocks(pageHtml).filter((b) => b["@type"] === "ProfilePage");
  assert.equal(profiles.length, 1, `${label} must carry exactly one ProfilePage block`);
  const person = profiles[0].mainEntity;
  assert.ok(person, `${label} ProfilePage must have a mainEntity`);
  assert.equal(person["@type"], "Person", `${label} mainEntity must be a Person`);
  return person;
}

test("about and homepage carry ProfilePage with byte-identical Person @id", () => {
  const aboutPerson = profileBlockOf(readPage("about"), "/about");
  const homePerson = profileBlockOf(readPage(), "/");

  assert.equal(aboutPerson["@id"], PERSON_ID);
  assert.equal(homePerson["@id"], PERSON_ID);
  assert.equal(aboutPerson["@id"], homePerson["@id"], "Person @id must be byte-identical");

  for (const person of [aboutPerson, homePerson]) {
    assert.equal(person.name, "Stephanie Jarmak");
    assert.ok(Array.isArray(person.sameAs) && person.sameAs.length > 0, "Person needs sameAs links");
  }
});

test("no duplicate Person emission on about or homepage", () => {
  for (const [label, html] of [["/about", readPage("about")], ["/", readPage()]]) {
    const topLevelPersons = parseJsonLdBlocks(html).filter((b) => b["@type"] === "Person");
    assert.equal(topLevelPersons.length, 0, `${label}: Person must live inside ProfilePage only`);
  }
});

// ------------------------------------------------- BlogPosting on on-site posts

test("every on-site post carries a valid BlogPosting referencing the Person @id", () => {
  const slugs = onSitePostSlugs();
  assert.ok(slugs.length > 0, "expected at least one on-site post");

  for (const slug of slugs) {
    const html = readPage("writing", slug);
    const postings = parseJsonLdBlocks(html).filter((b) => b["@type"] === "BlogPosting");
    assert.equal(postings.length, 1, `/writing/${slug}/ must carry exactly one BlogPosting`);
    const b = postings[0];
    assert.ok(typeof b.headline === "string" && b.headline.length > 0, `${slug}: headline required`);
    assert.match(b.datePublished, /^\d{4}-\d{2}-\d{2}$/, `${slug}: datePublished required`);
    assert.match(b.dateModified, /^\d{4}-\d{2}-\d{2}$/, `${slug}: dateModified required`);
    assert.equal(b.author?.["@id"], PERSON_ID, `${slug}: author must reference the Person @id`);
  }
});

test("external-source writing entries render no page, so BlogPosting exists only under /writing/<post>/", () => {
  const slugs = new Set(onSitePostSlugs());

  // The built /writing/ subpages are exactly the on-site posts.
  const writingDirs = readdirSync(path.join(DIST, "writing"), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  assert.deepEqual(new Set(writingDirs), slugs, "dist/writing/* must equal the non-draft posts set");

  // And no page outside them emits BlogPosting (writing index included).
  for (const file of allDistHtmlFiles()) {
    const rel = path.relative(DIST, file);
    const isPostPage = /^writing\/[^/]+\/index\.html$/.test(rel);
    if (isPostPage) continue;
    const postings = parseJsonLdBlocks(readFileSync(file, "utf8")).filter(
      (b) => b["@type"] === "BlogPosting",
    );
    assert.equal(postings.length, 0, `${rel} must not carry BlogPosting`);
  }
});

// ------------------------------------------------- sitewide sweeps

test("zero FAQPage anywhere in dist", () => {
  for (const file of allDistHtmlFiles()) {
    assert.equal(
      readFileSync(file, "utf8").includes("FAQPage"),
      false,
      `${path.relative(DIST, file)} must not mention FAQPage`,
    );
  }
});

test("every application/ld+json block sitewide is valid JSON", () => {
  let blocks = 0;
  for (const file of allDistHtmlFiles()) {
    const html = readFileSync(file, "utf8");
    for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      assert.doesNotThrow(
        () => JSON.parse(m[1]),
        `${path.relative(DIST, file)}: unparseable JSON-LD block`,
      );
      blocks += 1;
    }
  }
  assert.ok(blocks > 0, "expected JSON-LD blocks in dist");
});
