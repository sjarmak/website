// Mechanical takeaway guards for the pull pipeline's LLM stage and apply step.
//
// These are the injection boundary between vault-derived LLM output and the
// committed concept-assignments.json (which feeds the public site and the
// llms*.txt scraper endpoints). Anything that trips a guard is REJECTED to
// review — never silently stripped and kept, because stripping changes
// semantics and would let a mutated string through unreviewed.

import { MAX_QUOTED_WORDS, TAKEAWAY_MAX_CHARS } from "./config.mjs";

// Word tokenizer for the n-gram containment check: lowercase, alphanumeric
// runs only. Mechanical comparison, not semantic judgment (ZFC-allowed).
export function tokenizeWords(text) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []);
}

function ngrams(words, n) {
  const grams = [];
  for (let i = 0; i + n <= words.length; i++) {
    grams.push(words.slice(i, i + n).join(" "));
  }
  return grams;
}

// True when the takeaway shares MORE than `cap` contiguous words with the
// note body — i.e. any (cap + 1)-gram of the takeaway appears verbatim (as a
// word sequence) in the body. Guards against wholesale quoting of private
// note text into a public string.
export function quotesOverCap(takeaway, body, cap = MAX_QUOTED_WORDS) {
  const n = cap + 1;
  const takeawayGrams = ngrams(tokenizeWords(takeaway), n);
  if (takeawayGrams.length === 0) return false;
  const bodyGrams = new Set(ngrams(tokenizeWords(body), n));
  return takeawayGrams.some((gram) => bodyGrams.has(gram));
}

const URL_RE = /https?:\/\//i;
const MARKDOWN_LINK_RE = /\[[^\]]*\]\([^)]*\)/;

// Instruction-like imperative line openers. A takeaway is a declarative
// summary; a line that opens like an instruction to a reader (or a model
// scraping llms-full.txt) is treated as an injection attempt.
const INSTRUCTION_LINE_RES = [
  /^\s*(ignore|disregard|forget|override)\b/i,
  /^\s*(you must|you should|you need to|you have to)\b/i,
  /^\s*(do not|don't|never|always)\b/i,
  /^\s*(please|now|instead)[\s,]/i,
  /^\s*(execute|run|install|download|visit|click|open|delete|copy|paste|send|reply|email|call)\b/i,
  /^\s*(system|assistant|user)\s*:/i,
  /^\s*(follow these|as an ai|new instructions?)\b/i,
];

// Returns a rejection reason string, or null when the takeaway is clean.
// Order: structural caps first, then content guards.
export function findTakeawayViolation(takeaway, body) {
  if (typeof takeaway !== "string" || takeaway.trim() === "") {
    return "takeaway must be a non-empty string";
  }
  if (takeaway.length > TAKEAWAY_MAX_CHARS) {
    return `takeaway exceeds ${TAKEAWAY_MAX_CHARS} chars (${takeaway.length})`;
  }
  if (URL_RE.test(takeaway)) {
    return "takeaway contains a URL (http(s)://)";
  }
  if (MARKDOWN_LINK_RE.test(takeaway)) {
    return "takeaway contains a markdown link [text](url)";
  }
  for (const line of takeaway.split(/\r?\n/)) {
    if (line.trim() === "") continue;
    for (const re of INSTRUCTION_LINE_RES) {
      if (re.test(line)) {
        return `takeaway line reads as an instruction (${re}): ${JSON.stringify(line.trim())}`;
      }
    }
  }
  if (quotesOverCap(takeaway, body)) {
    return `takeaway quotes more than ${MAX_QUOTED_WORDS} contiguous words from the source note`;
  }
  return null;
}
