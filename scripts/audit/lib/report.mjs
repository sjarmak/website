// Report assembly for the R14 LLM-bio audit: numeric flatness summary plus
// JSON/markdown rendering. Flatness definition (pre-registered, see
// scripts/audit/README.md): flat = zero distinct /concepts/* URLs cited
// across all AVAILABLE lanes in a full run. A run with zero available lanes
// is indeterminate (flat: null) — it never silently counts as flat.

function uniqueUrls(lanes, field) {
  const urls = new Set();
  for (const lane of lanes) {
    for (const result of lane.results ?? []) {
      for (const url of result[field] ?? []) urls.add(url);
    }
  }
  return [...urls].sort();
}

export function summarize(lanes, questions) {
  const available = lanes.filter((l) => l.status === "ok");
  const sjarmakUrls = uniqueUrls(available, "sjarmakUrls");
  const conceptUrls = uniqueUrls(available, "conceptUrls");
  const flat = available.length === 0 ? null : conceptUrls.length === 0;
  return {
    questionCount: questions.length,
    lanesConfigured: lanes.length,
    lanesAvailable: available.length,
    sjarmakUrlsCited: sjarmakUrls.length,
    conceptUrlsCited: conceptUrls.length,
    sjarmakUrls,
    conceptUrls,
    flat,
    flatNote:
      flat === null
        ? "indeterminate — zero lanes available; consult the Search Console lane before counting this run toward the kill criterion"
        : flat
          ? "FLAT — zero /concepts/* URLs across all available lanes; pair with the Search Console lane"
          : "not flat — /concepts/* URLs were cited",
  };
}

export function buildReport({ site, questions, lanes, generatedAt = new Date().toISOString() }) {
  return { generatedAt, site, summary: summarize(lanes, questions), questions, lanes };
}

export function renderMarkdown(report) {
  const { summary } = report;
  const lines = [
    `# LLM bio audit — ${report.generatedAt}`,
    "",
    `Site: ${report.site}`,
    "",
    "## Summary",
    "",
    `- Lanes: ${summary.lanesAvailable}/${summary.lanesConfigured} available`,
    `- Questions per lane: ${summary.questionCount}`,
    `- sjarmak.ai URLs cited (distinct): ${summary.sjarmakUrlsCited}`,
    `- /concepts/* URLs cited (distinct): ${summary.conceptUrlsCited}`,
    `- Flat: ${summary.flat === null ? "indeterminate" : summary.flat} — ${summary.flatNote}`,
    "",
    "## Lanes",
    "",
  ];
  for (const lane of report.lanes) {
    lines.push(`### ${lane.label} (\`${lane.id}\`) — ${lane.status}`);
    lines.push("");
    if (lane.status !== "ok") {
      lines.push(`Unavailable: ${lane.reason}`);
      lines.push("");
      continue;
    }
    for (const result of lane.results) {
      if (result.status === "error") {
        lines.push(`- ${result.questionId}: error (${result.reason})`);
      } else {
        const cited = result.sjarmakUrls.length > 0 ? result.sjarmakUrls.join(", ") : "none";
        lines.push(`- ${result.questionId}: sjarmak.ai URLs: ${cited}`);
      }
    }
    lines.push("");
  }
  lines.push("## Questions");
  lines.push("");
  for (const q of report.questions) {
    lines.push(`- \`${q.id}\` (${q.kind}${q.concept ? `: ${q.concept}` : ""}): ${q.text}`);
  }
  lines.push("");
  return lines.join("\n");
}
