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
      // Keep the unlisted durable-podcast-render page and its deck out of the
      // sitemap; it is shareable by direct link only.
      filter: (page) => !page.includes("/durable-podcast-render"),
    }),
  ],
  redirects: {
    "/prototypes/concepts": "/concepts",
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  devToolbar: { enabled: false },
});
