// Homepage lab teaser (PRD R9′) asserted over the BUILT site (dist/).
// If dist/ is absent the suite builds it (npm run build); in the ordered CI
// pipeline the build has already run.

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(REPO_ROOT, "dist");

let home;

before(async () => {
  if (!existsSync(path.join(DIST, "index.html"))) {
    await execFileP("npm", ["run", "build"], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 });
  }
  home = readFileSync(path.join(DIST, "index.html"), "utf8");
});

// The rendered marker attribute — markup-anchored, never matched inside CSS.
const MARKER = "data-lab-teaser";

function teaserBlock() {
  const start = home.indexOf(MARKER);
  assert.ok(start >= 0, "homepage must render the lab teaser");
  return home.slice(start, home.indexOf("</section>", start));
}

test("homepage renders exactly one lab teaser block", () => {
  const count = home.split(MARKER).length - 1;
  assert.equal(count, 1, `expected exactly one ${MARKER} block, found ${count}`);
});

test("the teaser links to the Lab (/prototypes) and the colophon (/colophon)", () => {
  const block = teaserBlock();
  assert.match(block, /href="\/prototypes"/, "teaser must link to /prototypes");
  assert.match(block, /href="\/colophon"/, "teaser must link to /colophon");
  // Both targets exist in the built site — the teaser never points at a 404.
  assert.ok(existsSync(path.join(DIST, "prototypes", "index.html")));
  assert.ok(existsSync(path.join(DIST, "colophon", "index.html")));
});

test("no other homepage section moved: base-build section order is preserved, teaser last", () => {
  // The base build's homepage flow, in order. The teaser appends after them
  // and before </main>; nothing else on the page is rearranged.
  const markers = [
    '<section class="hero container"',
    ">Currently<",
    ">Selected work<",
    ">Speaking<",
    ">Recent writing<",
    MARKER,
    "</main>",
  ];
  let at = -1;
  for (const marker of markers) {
    const next = home.indexOf(marker, at + 1);
    assert.ok(next > at, `marker "${marker}" must appear after the previous section`);
    at = next;
  }
});

test("the teaser stays inside the existing visual language: one modest block, no new heading", () => {
  const block = teaserBlock();
  assert.doesNotMatch(block, /<h[1-6]/, "teaser is a line, not a new headed section");
  assert.equal(
    (block.match(/<a\b/g) ?? []).length,
    2,
    "teaser carries exactly the two links (lab + colophon)",
  );
});
