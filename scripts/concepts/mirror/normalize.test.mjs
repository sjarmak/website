import { test } from "node:test";
import assert from "node:assert/strict";
import {
  REGION_BEGIN,
  REGION_END,
  canonicalizeWikilinks,
  contentHash,
  extractWikilinkTargets,
  normalizeManaged,
  parseNote,
  serializeNote,
} from "./normalize.mjs";

test("wikilink canonicalization strips paths, aliases, headings, and case", () => {
  assert.equal(canonicalizeWikilinks("see [[Some Note|an alias]]"), "see [[some note]]");
  assert.equal(canonicalizeWikilinks("see [[Folder/Sub/Some Note]]"), "see [[some note]]");
  assert.equal(canonicalizeWikilinks("see [[Some Note#Heading|x]]"), "see [[some note]]");
  assert.equal(canonicalizeWikilinks("see [[SOME  NOTE]]"), "see [[some note]]");
});

test("content hash re-converges under simulated Obsidian link rewrites", () => {
  const original = "> Thesis.\n\n- [[Fixture Reference Note]] evidence\n";
  // Obsidian move: path segment inserted + display alias added.
  const rewritten = "> Thesis.\n\n- [[Archive/Fixture Reference Note|Fixture Reference Note]] evidence\n";
  assert.equal(contentHash(original), contentHash(rewritten));
});

test("content hash changes when a human edits the region text", () => {
  const original = "> Thesis.\n\n- bullet one";
  const edited = "> Thesis.\n\n- bullet one\n- my own annotation";
  assert.notEqual(contentHash(original), contentHash(edited));
});

test("normalizeManaged is stable across CRLF, trailing space, edge blank lines", () => {
  const a = normalizeManaged("\n\n> T.\r\nline  \n\n");
  const b = normalizeManaged("> T.\nline");
  assert.equal(a, b);
});

test("parseNote/serializeNote round-trips annotation space outside the markers", () => {
  const note = [
    "---",
    "title: Lorem Ipsum",
    "concept-id: lorem-ipsum",
    "content-hash: abc",
    "my-own-key: kept",
    "---",
    "",
    "Personal note above the managed region.",
    REGION_BEGIN,
    "> Thesis.",
    REGION_END,
    "Personal note below.",
    "",
  ].join("\n");

  const parsed = parseNote(note);
  assert.equal(parsed.frontmatter["concept-id"], "lorem-ipsum");
  assert.equal(parsed.frontmatter["my-own-key"], "kept");
  assert.match(parsed.pre, /Personal note above/);
  assert.equal(parsed.managed, "> Thesis.");
  assert.match(parsed.post, /Personal note below/);
  assert.equal(parsed.beginLine, 9);
  assert.equal(parsed.endLine, 11);

  const out = serializeNote({ ...parsed, managed: "> New thesis." });
  assert.match(out, /Personal note above/);
  assert.match(out, /Personal note below/);
  assert.match(out, /my-own-key: kept/);
  const reparsed = parseNote(out);
  assert.equal(reparsed.managed, "> New thesis.");
});

test("parseNote rejects notes with missing or unbalanced markers", () => {
  assert.throws(() => parseNote("no markers at all"), /markers missing/);
  assert.throws(() => parseNote(`${REGION_END}\n${REGION_BEGIN}`), /markers missing or unbalanced/);
});

test("extractWikilinkTargets returns raw targets", () => {
  assert.deepEqual(extractWikilinkTargets("- [[A/B|x]] and [[C]]"), ["A/B", "C"]);
});
