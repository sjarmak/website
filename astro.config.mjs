// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { isNoindexPath } from "./src/lib/register.ts";
import { conceptLastmodForPath } from "./src/lib/concepts/lastmod.ts";

// Deterministic lastmod for digest URLs: the date embedded in the issue slug
// (e.g. /digest/daily-2026-06-09/). NEVER build time — the register drift
// check's double-build stability guarantee depends on byte-identical sitemaps.
/** @param {string} pathname */
function digestLastmod(pathname) {
  const m = pathname.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? new Date(`${m[1]}T00:00:00.000Z`) : undefined;
}

// Canonical site URL. Drives <link rel="canonical">, sitemap, and RSS.
// sjarmak.ai is the launch/canonical domain; sjarmak.com 301-redirects here (deferred).
export default defineConfig({
  site: "https://sjarmak.ai",
  integrations: [
    mdx(),
    sitemap({
      // Register hygiene (PRD R3): the sitemap and the on-page robots meta are
      // driven by the SAME source of truth (src/lib/register.ts) so a noindexed
      // URL can never appear in the sitemap. The prototypes INDEX is crawlable
      // and stays in; the experiment pages are excluded.
      filter: (url) => !isNoindexPath(new URL(url).pathname),
      // Digest URLs: machine-cadence content gets a dated lastmod (from the
      // slug, deterministic) and a lowered priority.
      serialize(item) {
        const pathname = new URL(item.url).pathname;
        if (pathname === "/digest/" || pathname.startsWith("/digest/")) {
          const lastmod = digestLastmod(pathname);
          return {
            ...item,
            ...(lastmod ? { lastmod: lastmod.toISOString() } : {}),
            priority: 0.3,
          };
        }
        // Concept pages (PRD R4′): lastmod quantized to the week floor of the
        // newest dated evidence, so the daily digest cron never moves concept
        // lastmods en masse. Only allowlisted concept URLs reach here — the
        // filter above already dropped the noindexed ones.
        if (pathname.startsWith("/concepts/")) {
          const lastmod = conceptLastmodForPath(pathname);
          return { ...item, ...(lastmod ? { lastmod } : {}) };
        }
        return item;
      },
    }),
  ],
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  devToolbar: { enabled: false },
});
