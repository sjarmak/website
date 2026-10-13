import type { APIRoute } from "astro";
import { site } from "@/data/site";
import {
  talk,
  canonicalUrl,
  downloads,
  speakerResources,
  chartTypeLabel,
  sectionLabel,
  chartTable,
} from "@/lib/talks/liesDamnedLiesAndEvals";

function absolute(href: string): string {
  return new URL(href, site.url).href;
}

function build() {
  const { slides, ...header } = talk;
  return {
    ...header,
    canonical_url: canonicalUrl,
    llms_txt_url: `${canonicalUrl}llms.txt`,
    downloads: downloads.map((d) => ({ label: d.label, url: absolute(d.href), media_type: d.type, note: d.note })),
    speaker_resources: speakerResources.map((d) => ({
      label: d.label,
      url: absolute(d.href),
      media_type: d.type,
      note: d.note,
    })),
    slides: slides.map((slide) => {
      const { stage_content_html: _html, ...rest } = slide;
      return {
        ...rest,
        url: `${canonicalUrl}#${slide.anchor}`,
        section_label: sectionLabel(slide),
        chart: { ...slide.chart, type_label: chartTypeLabel(slide.chart.type), table: chartTable(slide) },
      };
    }),
  };
}

export const GET: APIRoute = () =>
  new Response(JSON.stringify(build(), null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
