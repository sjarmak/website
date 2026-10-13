import type { APIRoute } from "astro";
import { renderTalkMarkdown } from "@/lib/talks/renderLiesDamnedLiesAndEvalsMarkdown";

export const GET: APIRoute = () =>
  new Response(renderTalkMarkdown(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
