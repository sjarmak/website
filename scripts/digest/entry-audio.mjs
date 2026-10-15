import YAML from "yaml";

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n/;
const TOP_LEVEL_KEY = /^([A-Za-z_][\w-]*):/;
const FOLLOWS_AUDIO_URL = ["embedUrl", "durationSec", "items", "highlights"];
const FOLLOWS_DURATION = ["items", "highlights"];

function parseFrontmatter(text) {
  const doc = YAML.parseDocument(text);
  if (doc.errors.length > 0) throw new Error(`digest frontmatter does not parse: ${doc.errors[0].message}`);
  const data = doc.toJS();
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("digest frontmatter is not a mapping");
  }
  return data;
}

function splitEntry(md) {
  const match = FRONTMATTER.exec(md);
  if (!match) throw new Error("digest entry has no YAML frontmatter");
  const blocks = [];
  for (const line of match[1].split("\n")) {
    const key = TOP_LEVEL_KEY.exec(line)?.[1];
    if (key || blocks.length === 0) blocks.push({ key: key ?? null, lines: [line] });
    else blocks.at(-1).lines.push(line);
  }
  return { data: parseFrontmatter(match[1]), blocks, rest: md.slice(match[0].length) };
}

function joinEntry(blocks, rest) {
  const frontmatter = blocks.flatMap((block) => block.lines).join("\n");
  parseFrontmatter(frontmatter);
  return `---\n${frontmatter}\n---\n${rest}`;
}

const renderField = (key, value) => YAML.stringify({ [key]: value }, { lineWidth: 0 }).trimEnd().split("\n");

function withField(blocks, key, value, followers) {
  if (value === undefined) return blocks;
  const block = { key, lines: renderField(key, value) };
  if (blocks.some((b) => b.key === key)) return blocks.map((b) => (b.key === key ? block : b));
  const index = blocks.findIndex((b) => followers.includes(b.key));
  return index === -1 ? [...blocks, block] : [...blocks.slice(0, index), block, ...blocks.slice(index)];
}

export function readEntryAudio(md) {
  const { data } = splitEntry(md);
  return Object.fromEntries(["audioUrl", "durationSec"].filter((key) => key in data).map((key) => [key, data[key]]));
}

export function stripEntryAudio(md) {
  const { data, blocks, rest } = splitEntry(md);
  const drop = new Set(["audioUrl", ...("embedUrl" in data ? [] : ["durationSec"])]);
  const removed = Object.fromEntries([...drop].filter((key) => key in data).map((key) => [key, data[key]]));
  return { md: joinEntry(blocks.filter((b) => !drop.has(b.key)), rest), removed };
}

export function attachEntryAudio(md, { audioUrl, durationSec }) {
  if (!audioUrl) throw new Error("attachEntryAudio needs an audioUrl");
  const { blocks, rest } = splitEntry(md);
  const withUrl = withField(blocks, "audioUrl", audioUrl, FOLLOWS_AUDIO_URL);
  return joinEntry(withField(withUrl, "durationSec", durationSec, FOLLOWS_DURATION), rest);
}
