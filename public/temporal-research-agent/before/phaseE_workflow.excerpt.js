// Exact excerpt from lines 83-122 of the original workflow.
// See provenance.json for the source path and SHA-256.

phase('Research')
await pipeline(
  EPS,
  // Stage 1 — research
  (it) => {
    const S = SERIES[it.s]
    const frontierNote = it.frontier ? ` This is the FRONTIER episode: also Read the brainstorm report ${S.dir}/30-brainstorm-report.md and use its ranked open problems as the spine.` : ''
    return agent(
      `${common(S.dir)}\n\nResearch ONE podcast episode in the "${S.name}" series.\nEPISODE ${it.ep}: ${it.title}.\nFOCUS: ${it.focus}\nSEED sources already known (do NOT re-list as new): ${it.seeds}\n\nFirst Read ${S.dir}/00-bibliography-raw.md for context.${frontierNote} Then run 5-9 scix searches (and web searches where the focus is industrial/production) to find ADDITIONAL on-target sources; confirm corpus papers with get_paper. Identify the key technical findings, contrasts, named systems, and one or two vivid concrete examples usable in a podcast cold-open.\n\nBEFORE returning, write your confirmed NEW bibcodes (one per line; empty file if none) to ${S.dir}/newbibs-${it.s}-ep${it.ep}.txt using the Write tool.\nThen return the structured object: key="${it.s}-ep${it.ep}", new_bibcodes=[...], key_findings=markdown bullets.`,
      { label: `research:${it.s}-ep${it.ep}`, phase: 'Research', schema: BIBCODES_SCHEMA }
    )
  },
  // Stage 2 — deep dive
  (research, it) => {
    const S = SERIES[it.s]
    return agent(
      `${common(S.dir)}\n\nWrite a rigorous DEEP-DIVE document (1500-2500 words) for one podcast episode, to be used as source material for the script.\nSERIES: ${S.name}. EPISODE ${it.ep}: ${it.title}.\nFOCUS: ${it.focus}\nSEED sources: ${it.seeds}\nSTAGE-1 FINDINGS:\n${JSON.stringify((research && research.key_findings) || '', null, 0)}\nADDITIONAL bibcodes: ${((research && research.new_bibcodes) || []).join(', ') || 'none'}\n\nFirst Read ${S.dir}/00-bibliography-raw.md${it.frontier ? ` and ${S.dir}/30-brainstorm-report.md` : ''}. Structure:\n# ${it.title} — Deep Dive\n1. The core framing in one paragraph (with a concrete hook).\n2. Why it matters / the problem.\n3. The substance in detail — concrete and technical; name systems, papers, mechanisms.\n4. Tensions, contrasts, and dissent (what's contested).\n5. Evidence & evaluation (benchmarks, metrics, real numbers; cite sources).\n6. Practical takeaways / what to build or watch.\n7. Key sources (bibcodes for corpus items; URLs for industry; author-year for classics).\n\nGround every empirical claim in a cited source; never fabricate a bibcode. Write to: ${S.dir}/ep${it.ep}-${it.slug}-deepdive.md . Return ONLY "WROTE ep${it.ep}-${it.slug}-deepdive.md".`,
      { label: `deepdive:${it.s}-ep${it.ep}`, phase: 'DeepDive' }
    )
  },
  // Stage 3 — script
  (_dd, it) => {
    const S = SERIES[it.s]
    return agent(
      `You are writing a podcast SCRIPT for the "Code Intel Digest — ${S.name}" series (a 5-episode deep-dive series). Match the established show's single-voice, conversational style.\n\nTHIS EPISODE: Episode ${it.ep} — ${it.title}. FOCUS: ${it.focus}\n\nPrimary source: Read ${S.dir}/ep${it.ep}-${it.slug}-deepdive.md . Also Read ${S.dir}/00-bibliography-raw.md for exact bibcodes/URLs. Every claim must trace to that material; do NOT fabricate.\n\n${fmtTemplate(S.name, it.ep, it.title)}\n\nWrite to: ${OUT}/podcast-script-${S.fileprefix}-ep${it.ep}-${it.slug}.md . Return ONLY "WROTE podcast-script-${S.fileprefix}-ep${it.ep}-${it.slug}.md".`,
      { label: `script:${it.s}-ep${it.ep}`, phase: 'Script' }
    )
  },
)

// Synthesis — one literature review per series
phase('Synthesis')
await parallel(Object.entries(SERIES).map(([sk, S]) => () => {
  const eps = EPS.filter((e) => e.s === sk)
  const dds = eps.map((e) => `${S.dir}/ep${e.ep}-${e.slug}-deepdive.md`).join(', ')
  return agent(
    `${common(S.dir)}\n\nWrite a comprehensive LITERATURE REVIEW for the "${S.name}" topic. Read ${S.dir}/00-bibliography-raw.md, ${S.dir}/30-brainstorm-report.md, and the five deep-dive docs: ${dds}.\n\nStructure:\n# ${S.name} — Literature Review\n## Scope & method (note the SciX corpus + its gaps; industry/web sources)\n## Landscape (the major sub-areas, one section each — mirror the five episodes)\n## Cross-cutting themes\n## Open problems & the frontier (from the brainstorm report)\n## How this connects to agent memory ${sk === 'mas' ? '(shared substrate vs per-agent; durable team memory; consolidation/records-management governance)' : '(retrieval as the read-path of a codebase memory; staleness/forgetting; salience)'}\n## References (group corpus bibcodes vs web/industry vs classics; never fabricate a bibcode)\n\n~2500-3500 words, cited throughout. Write to: ${S.dir}/20-literature-review.md . Return ONLY "WROTE ${S.fileprefix} 20-literature-review.md".`,
    { label: `lit-review:${sk}`, phase: 'Synthesis' }
  )
}))
