// Digest fixture filenames written into src/content/digest by the
// double-build stability tests (tests/register-stability.test.mjs). Test
// FILES run in parallel under `node --test`, so any other test that asserts
// over the live digest directory (git cleanliness, digest counts) must
// tolerate these exact files being transiently present. Single source of
// truth — both sides import from here.

export const STABILITY_FIXTURE_FILES = [
  "daily-2001-01-09.md", // R3 shifted-facet fixture (far past)
  "daily-2098-01-08.md", // R4′ within-week evidence-shift fixture (far future)
];

export const STABILITY_FIXTURE_SLUGS = STABILITY_FIXTURE_FILES.map((f) => f.replace(/\.md$/, ""));
