// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// Canonical site URL. Drives <link rel="canonical">, sitemap, and RSS.
// sjarmak.ai is the launch/canonical domain; sjarmak.com 301-redirects here (deferred).
export default defineConfig({
  site: "https://sjarmak.ai",
  integrations: [mdx(), sitemap()],
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  devToolbar: { enabled: false },
});
