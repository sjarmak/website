import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { bookFigureTitle, prepareBookFigure } from "../../src/lib/books.ts";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const FIGURE_PREFIX = "/book-figures/";
const FIGURE_DIR = path.join(
  REPO_ROOT,
  "src/assets/books/the-system-around-the-model",
);

function inlineFigure(node) {
  if (node.type !== "image" || !node.url.startsWith(FIGURE_PREFIX)) return undefined;

  const name = node.url.slice(FIGURE_PREFIX.length);
  if (!/^[a-z0-9-]+\.svg$/.test(name)) {
    throw new Error(`Invalid book figure name: ${name}`);
  }

  const raw = readFileSync(path.join(FIGURE_DIR, name), "utf8");
  const title = bookFigureTitle(raw, name);
  if (title !== node.alt) {
    throw new Error(`${name}: SVG title differs from the Markdown alt text`);
  }

  const svg = prepareBookFigure(raw, name);
  return {
    type: "html",
    value: `<figure class="book-figure"><div class="book-figure__scroll">${svg}</div></figure>`,
  };
}

function transformChildren(parent) {
  if (!Array.isArray(parent.children)) return;
  parent.children = parent.children.map((child) => {
    const replacement = inlineFigure(child);
    if (replacement) return replacement;
    transformChildren(child);
    return child;
  });
}

export default function remarkInlineBookFigures() {
  return (tree) => {
    transformChildren(tree);
  };
}
