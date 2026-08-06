// Render the inline-SVG ConceptFigures from the published post to retina PNGs
// for Medium, which cannot take inline SVG.
// Usage: node export-figures.mjs <baseUrl> <outDir>
import { chromium } from "/home/ds/projects/website/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:8899";
const outDir = process.argv[3];
if (!outDir) throw new Error("outDir required");

// Each figure carries `aria-labelledby="concept-figure-<kind>"`, the only stable
// per-kind hook in the markup. Names match the paste order in README.md.
const targets = [
  { kind: "ownership", file: "03-ownership.png" },
  { kind: "recovery", file: "05-recovery.png" },
  { kind: "wrongness", file: "07-durable-wrongness.png" },
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  deviceScaleFactor: 2,
  viewport: { width: 1400, height: 1200 },
  colorScheme: "light",
});

const url = `${baseUrl}/writing/temporal-around-my-software-factory/`;
const res = await page.goto(url, { waitUntil: "networkidle" });
if (!res || !res.ok()) throw new Error(`${url} -> ${res?.status()}`);

await page.addStyleTag({
  content: `
    /* The post renders in a narrow reading column; widen it so the diagrams
       export at their intended size rather than the column's. */
    .post, .container-narrow { max-width: none !important; width: 1120px !important; }
    .post__body { max-width: none !important; }
    /* Export the diagram alone. The heading, the "Figure NN / ..." index (which
       counts against the long article's sequence) and the caption all become
       Medium text instead, so they must not be burned into the image. */
    .concept-figure__header,
    .concept-figure figcaption,
    .concept-figure__fallback { display: none !important; }
    /* Medium's canvas is white; the site's cream page tint would read as a
       grey plate around every diagram. */
    html, body, .concept-figure, .concept-figure__svg { background: #fff !important; }
  `,
});
await page.waitForTimeout(400);

for (const { kind, file } of targets) {
  const el = page.locator(`figure[aria-labelledby="concept-figure-${kind}"] .concept-figure__svg`);
  const count = await el.count();
  if (count !== 1) throw new Error(`kind="${kind}" matched ${count} diagrams, expected 1`);
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await el.screenshot({ path: `${outDir}/${file}`, omitBackground: false });
  const box = await el.boundingBox();
  console.log(`${file}  ${Math.round(box.width)}x${Math.round(box.height)} css px @2x`);
}

await browser.close();
