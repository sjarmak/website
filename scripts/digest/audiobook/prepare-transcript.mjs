#!/usr/bin/env node
// Convert one book-chapter Markdown file into a narratable transcript for
// tts-render.mjs. tts-render's own stripForSpeech handles frontmatter,
// headers, links, and emphasis markers — this pass handles the constructs it
// doesn't: the reader-metadata evidence callout, figures, tables, fenced code
// blocks, and inline/display KaTeX math, none of which are speakable as-is.
//
// Usage: node prepare-transcript.mjs --in <chapter.md> --out <transcript.md> --title "..."

import { readFile, writeFile } from "node:fs/promises";

function stripReaderMetadata(md) {
  return md.replace(/<!-- reader-metadata:start -->[\s\S]*?<!-- reader-metadata:end -->\n*/g, "");
}

function replaceMath(md) {
  return md
    .replace(/<div class="book-math[^>]*">[\s\S]*?<\/div>/g, "as given in the equation in the printed chapter.")
    .replace(/<span class="katex">[\s\S]*?<\/span>/g, "an expression given in the printed chapter");
}

function replaceFigures(md) {
  return md.replace(/^!\[[^\]]*\]\([^)]*\)\s*$/gm, "This figure appears in the printed chapter.");
}

function replaceCodeBlocks(md) {
  return md.replace(/^```[\s\S]*?^```\s*$/gm, "The example that follows appears in the printed chapter.");
}

/** A markdown table block: a header row, a `---`-style separator row, and body rows. */
function replaceTables(md) {
  const lines = md.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const isRow = (l) => /^\s*\|.*\|\s*$/.test(l);
    const isSep = (l) => /^\s*\|[\s:|-]+\|\s*$/.test(l);
    if (isRow(lines[i]) && isSep(lines[i + 1] ?? "")) {
      let j = i + 2;
      while (j < lines.length && isRow(lines[j])) j++;
      out.push("The table that follows appears in the printed chapter.");
      i = j;
      continue;
    }
    out.push(lines[i]);
    i++;
  }
  return out.join("\n");
}

function parseFrontmatterTitle(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const titleLine = m[1].split("\n").find((l) => l.startsWith("title:"));
  return titleLine ? titleLine.replace(/^title:\s*/, "").replace(/^"|"$/g, "") : null;
}

async function main() {
  const args = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    args[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];
  }
  if (!args.in || !args.out) {
    throw new Error("usage: prepare-transcript.mjs --in <chapter.md> --out <transcript.md> [--spoken-title \"...\"]");
  }

  const raw = await readFile(args.in, "utf8");
  const title = args["spoken-title"] ?? parseFrontmatterTitle(raw) ?? "Untitled chapter";

  let body = raw.replace(/^---\n[\s\S]*?\n---\n*/, "");
  body = stripReaderMetadata(body);
  body = replaceMath(body);
  body = replaceTables(body);
  body = replaceCodeBlocks(body);
  body = replaceFigures(body);
  body = body.replace(/\n{3,}/g, "\n\n").trim();

  const transcript = `${title}.\n\n${body}\n`;
  await writeFile(args.out, transcript, "utf8");
  process.stdout.write(`${JSON.stringify({ out: args.out, title, chars: transcript.length })}\n`);
}

main().catch((err) => {
  console.error(`[prepare-transcript] ${err.message}`);
  process.exit(1);
});
