export function bookChapterHref(bookId: string, chapterId: string): string {
  return `/books/${bookId}/${chapterId}`;
}

export function bookCompanionHref(bookId: string): string {
  return `/books/${bookId}/companion`;
}

export function bookExploreHref(bookId: string): string {
  return `/books/${bookId}/explore`;
}

export function bookChapterSlug(entryId: string): string {
  return entryId.slice(entryId.lastIndexOf("/") + 1);
}

export function bookFigureTitle(svg: string, name: string): string {
  const title = svg.match(/<title\s+id="[^"]+">([\s\S]*?)<\/title>/)?.[1];
  if (!title) throw new Error(`${name} is missing its accessible title`);
  return title
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

const BOOK_FIGURE_THEME = [
  "<style>",
  ".bookfig .f-bg{fill:var(--color-bg)}",
  ".bookfig .s-bg{stroke:var(--color-bg)}",
  ".bookfig .f-ink{fill:var(--color-text)}",
  ".bookfig .s-ink{stroke:var(--color-text)}",
  ".bookfig .f-mid{fill:var(--color-text-secondary)}",
  ".bookfig .s-mid{stroke:var(--color-text-secondary)}",
  ".bookfig .f-faint{fill:var(--color-border)}",
  ".bookfig .s-faint{stroke:var(--color-border)}",
  ".bookfig .f-wash{fill:var(--color-surface)}",
  ".bookfig .s-wash{stroke:var(--color-surface)}",
  ".bookfig .f-accent{fill:var(--color-accent)}",
  ".bookfig .s-accent{stroke:var(--color-accent)}",
  ".bookfig .f-onacc{fill:var(--color-bg)}",
  ".bookfig .s-onacc{stroke:var(--color-bg)}",
  "</style>",
].join("");

function attribute(element: string, name: string): string | undefined {
  return element.match(new RegExp(`\\b${name}=(["'])(.*?)\\1`))?.[2];
}

function removeCanvasRect(svg: string, root: string, name: string): string {
  const viewBox = attribute(root, "viewBox")
    ?.trim()
    .split(/\s+/)
    .map(Number);
  if (
    !viewBox ||
    viewBox.length !== 4 ||
    viewBox.some((value) => !Number.isFinite(value))
  ) {
    throw new Error(`${name} is missing a valid viewBox`);
  }

  const [viewX, viewY, viewWidth, viewHeight] = viewBox;
  let removed = false;
  const transparent = svg.replace(/<rect\b[^>]*\/>/g, (rect) => {
    if (removed || !attribute(rect, "class")?.split(/\s+/).includes("f-bg")) {
      return rect;
    }

    const x = Number(attribute(rect, "x") ?? 0);
    const y = Number(attribute(rect, "y") ?? 0);
    const width = Number(attribute(rect, "width"));
    const height = Number(attribute(rect, "height"));
    if (x !== viewX || y !== viewY || width !== viewWidth || height !== viewHeight) {
      return rect;
    }

    removed = true;
    return "";
  });

  if (!removed) throw new Error(`${name} is missing its full-canvas background`);
  return transparent;
}

export function prepareBookFigure(svg: string, name: string): string {
  const root = svg.match(/^<svg\b[^>]*>/)?.[0];
  if (!root) throw new Error(`${name} is not an SVG document`);
  if (
    /<(?:script|foreignObject|iframe|object|embed)\b/i.test(svg) ||
    /\son[a-z]+\s*=/i.test(svg) ||
    /\b(?:href|xlink:href)\s*=\s*["']\s*(?:javascript:|data:|https?:)/i.test(svg)
  ) {
    throw new Error(`${name} contains unsafe executable content`);
  }

  const labelledBy = root.match(/\baria-labelledby="([^"]+)"/)?.[1];
  if (!labelledBy || !svg.includes(`<title id="${labelledBy}">`)) {
    throw new Error(`${name} is missing its accessible title`);
  }
  if (!svg.includes('[data-theme="dark"]') || !svg.includes('[data-theme="light"]')) {
    throw new Error(`${name} must include explicit light and dark theme rules`);
  }
  if (!/<style>[\s\S]*?<\/style>/.test(svg)) {
    throw new Error(`${name} is missing its embedded palette`);
  }

  const responsiveRoot = root
    .replace(/\swidth="[^"]*"/, "")
    .replace(/\sheight="[^"]*"/, "");
  const responsive = svg
    .replace(root, responsiveRoot)
    .replace(/<style>[\s\S]*?<\/style>/, BOOK_FIGURE_THEME);
  return removeCanvasRect(responsive, responsiveRoot, name);
}
