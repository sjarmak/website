import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export type ResearchRun = "original" | "live" | "fixture";
export type ResearchKind = "research" | "deep-dives" | "scripts" | "reviews";

export interface ResearchProduct {
  run: ResearchRun;
  kind: ResearchKind;
  slug: string;
  title: string;
  series: "mas" | "code";
  filename: string;
  filePath: string;
  rawPath: string;
  href: string;
  wordCount: number;
}

const publicRoot = path.resolve(
  "public",
  "temporal-research-agent",
);

const runRoots: Record<Exclude<ResearchRun, "original">, string> = {
  live: path.join(publicRoot, "after", "live-products"),
  fixture: path.join(publicRoot, "after", "fixture-products"),
};

const kinds: ResearchKind[] = [
  "research",
  "deep-dives",
  "scripts",
  "reviews",
];

function titleFromMarkdown(markdown: string, fallback: string): string {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return heading || fallback;
}

function seriesFromName(filename: string): "mas" | "code" {
  return filename.includes("mas") || filename.includes("multiagent")
    ? "mas"
    : "code";
}

function product(
  run: ResearchRun,
  kind: ResearchKind,
  slug: string,
  filePath: string,
  rawPath: string,
): ResearchProduct {
  const markdown = readFileSync(filePath, "utf8");
  const filename = path.basename(filePath);
  return {
    run,
    kind,
    slug,
    title: titleFromMarkdown(markdown, slug),
    series: seriesFromName(filename),
    filename,
    filePath,
    rawPath,
    href: `/temporal-research-agent/research-output/${run}/${kind}/${slug}/`,
    wordCount: markdown.trim().split(/\s+/).filter(Boolean).length,
  };
}

function generatedProducts(
  run: Exclude<ResearchRun, "original">,
): ResearchProduct[] {
  const root = runRoots[run];
  return kinds.flatMap((kind) => {
    const directory = path.join(root, kind);
    if (!existsSync(directory)) {
      return [];
    }
    return readdirSync(directory)
      .filter((filename) => filename.endsWith(".md"))
      .sort()
      .map((filename) => {
        const slug = filename.slice(0, -3);
        return product(
          run,
          kind,
          slug,
          path.join(directory, filename),
          `/temporal-research-agent/after/${run}-products/${kind}/${filename}`,
        );
      });
  });
}

function originalProducts(): ResearchProduct[] {
  const root = path.join(publicRoot, "before", "products");
  return [
    ["multiagent-orchestration", "mas"],
    ["code-retrieval", "code"],
  ].flatMap(([folder, series]) =>
    readdirSync(path.join(root, folder))
      .filter((filename) => filename.endsWith(".md"))
      .sort()
      .map((filename) => {
        const isReview = filename === "20-literature-review.md";
        const kind: ResearchKind = isReview ? "reviews" : "scripts";
        const slug = isReview
          ? `${folder}-literature-review`
          : filename.slice(0, -3);
        const result = product(
          "original",
          kind,
          slug,
          path.join(root, folder, filename),
          `/temporal-research-agent/before/products/${folder}/${filename}`,
        );
        return { ...result, series: series as "mas" | "code" };
      }),
  );
}

export function listTemporalResearchProducts(): ResearchProduct[] {
  return [
    ...originalProducts(),
    ...generatedProducts("live"),
    ...generatedProducts("fixture"),
  ];
}
