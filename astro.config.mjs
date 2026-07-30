// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// Canonical site URL. Drives <link rel="canonical">, sitemap, and RSS.
// sjarmak.ai is the launch/canonical domain; sjarmak.com 301-redirects here (deferred).
export default defineConfig({
  site: "https://sjarmak.ai",
  integrations: [
    mdx(),
    sitemap({
      // Keep direct-link-only presentation pages out of the sitemap.
      filter: (page) =>
        !page.includes("/durable-podcast-render") &&
        !page.includes("/temporal-research-agent"),
    }),
  ],
  redirects: {
    "/prototypes/concepts": "/concepts",
    "/temporal-research-agent/blog": "/temporal-research-agent/readme",
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  devToolbar: { enabled: false },
});
