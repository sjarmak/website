// sjarmak.ai URL extraction + classification for the R14 audit.
//
// The audit only cares about ONE thing per lane: which sjarmak.ai URLs an
// endpoint surfaced, and which of those are /concepts/* pages (the flatness
// signal). Everything else in an answer is discarded.

const SJARMAK_URL_RE = /https?:\/\/(?:www\.)?sjarmak\.ai(?:\/[^\s)"'<>\]]*)?/gi;

function isSjarmakHost(hostname) {
  return hostname === "sjarmak.ai" || hostname === "www.sjarmak.ai";
}

// Normalize to a canonical https://www.sjarmak.ai/<path> form (no trailing
// slash except root, no query/fragment) so dedupe is meaningful.
function normalize(raw) {
  let url;
  try {
    // Trailing sentence punctuation is prose, not path.
    url = new URL(raw.replace(/[.,;:!?]+$/, ""));
  } catch {
    return null;
  }
  if (!isSjarmakHost(url.hostname)) return null;
  let pathname = url.pathname.replace(/\/+$/, "");
  if (pathname === "") pathname = "/";
  return `https://www.sjarmak.ai${pathname}`;
}

// Extract sjarmak.ai URLs from free answer text plus any structured cited-URL
// list an endpoint returned. Returns deduped, sorted:
//   { sjarmakUrls: [...], conceptUrls: [...] }  (conceptUrls ⊆ sjarmakUrls)
export function extractSjarmakUrls(answerText = "", citedUrls = []) {
  const candidates = [
    ...(answerText.match(SJARMAK_URL_RE) ?? []),
    // Bare "sjarmak.ai/..." mentions without a scheme.
    ...[...answerText.matchAll(/(?:^|[\s("'<])((?:www\.)?sjarmak\.ai(?:\/[^\s)"'<>\]]*)?)/gi)].map(
      (m) => `https://${m[1]}`,
    ),
    ...citedUrls,
  ];

  const sjarmak = new Set();
  for (const candidate of candidates) {
    const normalized = normalize(candidate);
    if (normalized) sjarmak.add(normalized);
  }

  const sjarmakUrls = [...sjarmak].sort();
  const conceptUrls = sjarmakUrls.filter((u) =>
    u.startsWith("https://www.sjarmak.ai/concepts/"),
  );
  return { sjarmakUrls, conceptUrls };
}
