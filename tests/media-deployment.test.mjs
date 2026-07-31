import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import YAML from "yaml";

const blueprint = YAML.parse(await readFile("render.yaml", "utf8"));

test("Render isolates the media archive from ordinary site deploys", () => {
  const site = blueprint.services.find((service) => service.name === "sjarmak-ai");
  const media = blueprint.services.find(
    (service) => service.name === "sjarmak-ai-media",
  );

  assert.ok(site, "main site service is missing");
  assert.ok(media, "media service is missing");
  assert.equal(media.branch, "media");
  assert.equal(media.runtime, "static");
  assert.equal(media.staticPublishPath, "./public/media");
  assert.deepEqual(media.buildFilter.paths, ["public/media/**"]);
});

test("existing /media URLs are served by the isolated media service", () => {
  const site = blueprint.services.find((service) => service.name === "sjarmak-ai");
  const mediaRoute = site.routes?.find((route) => route.source === "/media/*");

  assert.deepEqual(mediaRoute, {
    type: "rewrite",
    source: "/media/*",
    destination: "https://sjarmak-ai-media.onrender.com/*",
  });
});
