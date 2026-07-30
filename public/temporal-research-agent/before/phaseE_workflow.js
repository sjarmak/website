export const meta = {
  name: 'orchestration-and-coderetrieval-series',
  description: 'Two podcast series (Multi-Agent Orchestration ep1-5, Code Retrieval & Enterprise Codebases ep1-5): per-episode research + deep-dive docs + scripts + 2 literature reviews',
  phases: [
    { title: 'Research', detail: 'scix(+web) deep research per episode; collect sources' },
    { title: 'DeepDive', detail: 'write a deep-dive doc per episode' },
    { title: 'Script', detail: 'write a ~20-min podcast script per episode' },
    { title: 'Synthesis', detail: 'write one literature review per series' },
  ],
}

const RD = '/home/ds/projects/code-intelligence-digest/research'
const OUT = '/home/ds/projects/code-intelligence-digest/out'

const SERIES = {
  mas: {
    dir: `${RD}/multiagent-orchestration`,
    name: 'Multi-Agent Orchestration',
    fileprefix: 'multiagent-orchestration',
  },
  code: {
    dir: `${RD}/code-retrieval-enterprise`,
    name: 'Code Retrieval & Enterprise Codebases',
    fileprefix: 'code-retrieval',
  },
}

function common(dir) {
  const bib = `${dir}/00-bibliography-raw.md`
  return `This project has the SciX MCP. To use it, first call ToolSearch with query exactly: select:mcp__scix__search,mcp__scix__get_paper,mcp__scix__concept_search then call the tools. Always pass a filter (filters.arxiv_class e.g. "cs.MA","cs.AI","cs.SE","cs.IR","cs.PL","cs.LG","cs.CL","cs.DC", or filters.year_min) to avoid the unscoped-broad-query guard. The dense/ANN vector index may be unavailable (vector_index_unavailable) — expected; rely on hybrid/keyword. You MAY also use the web for production/industrial topics: call ToolSearch with query exactly: select:WebSearch,WebFetch . NEVER invent a bibcode; only cite bibcodes that appear in ${bib} or that you confirm via get_paper; cite web/industry items by title+URL and classic works by author-year with NO bibcode.`
}

const BIBCODES_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['key', 'new_bibcodes', 'key_findings'],
  properties: {
    key: { type: 'string' },
    new_bibcodes: { type: 'array', items: { type: 'string' }, description: 'ADS bibcodes NOT already in the series bibliography that you confirmed via get_paper. May be empty.' },
    key_findings: { type: 'string', description: '6-12 markdown bullets of the most important findings/sources for this episode (cite bibcode, web URL, or author-year).' },
  },
}

// episode list: {s, ep, slug, title, focus, seeds, frontier?}
const EPS = [
  // ---- Series A: Multi-Agent Orchestration ----
  { s: 'mas', ep: 1, slug: 'foundations-and-topologies', title: 'Foundations & Topologies',
    focus: 'What multi-agent orchestration is and why/when it helps vs hurts vs a single agent. Topologies: orchestrator-worker/supervisor, hierarchical, swarm/decentralized, blackboard/shared-workspace, pipeline. The core vocabulary.',
    seeds: '2024arXiv240201680G (Guo survey), 2023arXiv230603314T (Talebirad), 2024arXiv241104468F (Magentic-One), 2024arXiv240204578C (S-Agents), 2025arXiv250400587Y (AgentNet), 2026arXiv260513850H (design-pattern taxonomy), 2026arXiv260502431W (ARIADNE blackboard), 2026arXiv260503310N (coordination as a layer)' },
  { s: 'mas', ep: 2, slug: 'patterns-and-frameworks', title: 'Patterns & Frameworks',
    focus: 'The pattern vocabulary and the frameworks that encode it: AutoGen, MetaGPT, CAMEL, ChatDev, AgentVerse; planning/decomposition, routing, handoffs, debate/voting; interop protocols (MCP, A2A). Note LangGraph/CrewAI/OpenAI Swarm as external (vendor docs).',
    seeds: '2023arXiv230808155W (AutoGen), 2023arXiv230800352H (MetaGPT), 2023arXiv230317760L (CAMEL), 2023arXiv230707924Q (ChatDev), 2023arXiv230810848C (AgentVerse), 2023arXiv230514325D (debate), 2023arXiv231002170L (DyLAN), 2026arXiv260409744Q (MPAC), 2025arXiv250323278H (MCP), 2025arXiv250202533Z (prompts+topologies)' },
  { s: 'mas', ep: 3, slug: 'memory-in-mas', title: 'Memory in Multi-Agent Systems',
    focus: 'THE link back to the agentic-memory series. Shared vs per-agent memory; shared ledger/blackboard; KV-cache sharing; shared knowledge graphs; reusable workflow memory; durable cross-session TEAM substrate; how conventions and identity emerge from accumulated memory. Explicitly cross-reference the agentic-memory series (records-management as shared-substrate governance; consolidation).',
    seeds: '2026arXiv260522721H (decentralized memory), 2025arXiv250406135H (SHIMI Merkle-DAG+CRDT), 2024arXiv241102820L (DroidSpeak KV sharing), 2024arXiv240907429Z (Agent Workflow Memory), 2024arXiv241104468F (Magentic-One ledger), 2023arXiv230403442P (Generative Agents), 2026arXiv260604197M (topology×memory), 2025arXiv250205453Y (shared KG), 2024arXiv241100114A (Project Sid institutional memory)' },
  { s: 'mas', ep: 4, slug: 'enterprise-and-production', title: 'Enterprise & Production',
    focus: 'Running agent systems in production: reliability & failure modes, observability/tracing, evaluation, guardrails & policy, security (cross-agent injection), cost/latency, human-in-the-loop, real enterprise deployments and their lessons. Use the web/industry sources heavily here.',
    seeds: '2025arXiv250313657C (MAST failures), 2026arXiv260509076L (Byzantine), 2026arXiv260520874S (Governance-by-Construction), 2025arXiv250211448L (AGrail), 2024arXiv241007283L (Prompt Infection), 2024arXiv241002644Z (ASB), 2026arXiv260412262C (CascadeDebate cost), 2026arXiv260411641L (CodeTracer observability), 2026arXiv260602755L (acceptance-test eval) + web: Anthropic multi-agent system, OpenAI agents guide, LangSmith observability, Cleanlab production survey' },
  { s: 'mas', ep: 5, slug: 'frontier-and-open-problems', title: 'Frontier & Open Problems', frontier: true,
    focus: 'The research frontier. Build the episode around the ranked open problems in the series brainstorm report (read it). Causal failure attribution; verified coordination protocols; cost-bounded orchestration; durable shared team memory; emergent-behavior eval; information-flow control; calibrated consensus; learned topology; HITL checkpoint placement; trace observability standards; cognitive-tier routing.',
    seeds: '2026arXiv260507935X (TraceFix verified protocols), 2026arXiv260407667F (conformal social choice), 2026arXiv260409703L (Cayley topology scaling), 2026arXiv260408963L (bias amplification), 2026arXiv260407775A (ACIArena cascading injection), 2025arXiv250313657C (MAST)' },
  // ---- Series B: Code Retrieval & Enterprise Codebases ----
  { s: 'code', ep: 1, slug: 'why-code-isnt-text-ir', title: "Why Code Isn't Text IR",
    focus: 'Foundations: how retrieving code differs from text IR — structure, symbols, references, the NL-intent-to-code gap, exact vs semantic match. The evaluation backbone (CodeSearchNet, CoIR). Why naive embedding search underperforms on code.',
    seeds: '2019arXiv190909436H (CodeSearchNet), 2022arXiv220402765D (Di Grazia survey), 2020arXiv200208155F (CodeBERT), 2024arXiv240702883L (CoIR), 2023arXiv231107989Z (LM4Code survey), 2020arXiv200514373L (CodeMatcher lexical-vs-neural)' },
  { s: 'code', ep: 2, slug: 'techniques-lexical-neural-graph', title: 'Techniques: Lexical → Neural → Graph',
    focus: 'The technique ladder: lexical/trigram/BM25 on code; neural embeddings (CodeBERT, GraphCodeBERT, UniXcoder, CodeT5, OpenAI code embeddings); AST/graph-based retrieval (deGraphCS, GraphSearchNet, graph matching); hybrid retrieve-then-rerank (ColBERT late interaction, CoRNStack, cascaded fast/slow). Contrastive representation learning.',
    seeds: '2020arXiv200908366G (GraphCodeBERT), 2021arXiv210900859W (CodeT5), 2022arXiv220303850G (UniXcoder), 2022arXiv220110005N (text+code embeddings), 2021arXiv210313020Z (deGraphCS), 2021arXiv211102671L (GraphSearchNet), 2020arXiv200412832K (ColBERT), 2024arXiv240201007S (CoRNStack), 2021arXiv211007811G (cascaded fast/slow), 2020arXiv200704973J (ContraCode)' },
  { s: 'code', ep: 3, slug: 'repo-scale-and-code-graphs', title: 'Repository-Scale & Code Graphs',
    focus: 'Scaling beyond a single file: cross-file/repo-level retrieval (RepoCoder, RepoBench, CrossCodeEval), dataflow/static-analysis-guided retrieval, code property graphs & code knowledge graphs (QVoG, Code Digital Twin, AOCI symbolic+semantic index), and agentic codebase navigation (SWE-agent, OpenHands, LocAgent, ARISE, CodePlan).',
    seeds: '2023arXiv230312570Z (RepoCoder), 2023arXiv230603091L (RepoBench), 2023arXiv231011248D (CrossCodeEval), 2024arXiv240519782C (dataflow retrieval), 2024arXiv240608098L (QVoG CPG), 2025arXiv250307967P (Code Digital Twin), 2026arXiv260502421L (AOCI), 2024arXiv240515793Y (SWE-agent), 2024arXiv240716741W (OpenHands), 2025arXiv250309089C (LocAgent), 2023arXiv230912499B (CodePlan)' },
  { s: 'code', ep: 4, slug: 'enterprise-codebase-challenges', title: 'The Unique Challenges of Large Enterprise Codebases',
    focus: 'What breaks at enterprise scale: monorepos & billions of LOC, polyglot/cross-language dependency chains, proprietary code & access-control boundaries, stale/dead code & churn, tribal knowledge & poor docs, build-system complexity, and honest evaluation. Cover industrial systems (Google Kythe/Zoekt/monorepo, Meta Glean, Sourcegraph SCIP) via the web, and the local benchmarks (EnterpriseBench, CodeScaleBench, codeprobe) described in the bibliography — including the ground-truth-tautology / tool-vs-no-tool evaluation problem.',
    seeds: '2024arXiv240601359D (R2C2-Coder), 2024arXiv240606025L (RepoQA long-context), 2025arXiv250215872K (MutaGReP), 2023arXiv230902182C (scalable clone detection), 2025arXiv250417972A (industrial clone detection), 2026arXiv260508112D (product/tribal context +49%), 2025arXiv250318305O (polyglot translation), 2024arXiv240814354Z (SWE-bench-java) + web: Google monorepo (CACM), Kythe, Zoekt, Meta Glean, Sourcegraph SCIP + local: EnterpriseBench/CodeScaleBench/codeprobe (see bibliography)' },
  { s: 'code', ep: 5, slug: 'frontier-and-open-problems', title: 'Frontier & Open Problems', frontier: true,
    focus: 'The research frontier. Build the episode around the ranked open problems in the series brainstorm report (read it). Retrieval under access-control; contamination-proof eval from private history; symbolic+semantic index at monorepo scale; staleness-aware retrieval; polyglot dependency-aware retrieval; tribal-knowledge retrieval; build-graph-grounded context; tool-vs-no-tool causal eval; long-context-vs-retrieval policy; incremental real-time indexing; graph-guided edit localization.',
    seeds: '2026arXiv260502421L (AOCI), 2026arXiv260508112D (tribal context), 2025arXiv250215872K (MutaGReP), 2024arXiv240608098L (QVoG scale), 2025arXiv250309089C (LocAgent), 2026arXiv260503117S (ARISE)' },
]

function fmtTemplate(seriesName, ep, title) {
  return `FORMAT (match the existing "Code Intel Digest" podcast series exactly) — write Markdown:\n# Code Intel Digest — ${seriesName}, Episode ${ep}: ${title}\n\n**Episode date:** 2026-06-08\n**Series:** ${seriesName} (${ep} of 5)\n**Data through:** SciX primary sources + industry sources\n**Target runtime:** ~20 minutes (~3,000 words spoken)\n**Segments:** 6 + cold open + outro\n\n---\n\n## COLD OPEN\n<~150 words: a vivid concrete scenario motivating this episode>\n\n## INTRO\n<~150 words: situate in the series; what this episode covers>\n\n## SEGMENT 1..6 — <punchy title>\n<~450 words each: claim -> evidence from named papers/researchers/systems (say names in prose) -> a contrast or dissent -> a concrete takeaway>\n\n## OUTRO\n<~100 words: recap, one thing to watch, one concrete action>\n\n## Citations\n| # | Title | Author/Org | Year | bibcode/URL |\n<every source cited in prose>\n\n---\n*Generated for the ${seriesName} deep-dive series from SciX primary sources + industry sources.*\n\nVOICE: conversational, contractions, spoken cadence. NO emoji, NO markdown decoration inside segment prose (it trips TTS). Spell out years and large round numbers. Name people, papers, and systems in prose. Each segment ends with a concrete takeaway. Aim ~3,000 words total.`
}

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

return { done: true, episodes: EPS.map((e) => `${SERIES[e.s].fileprefix}-ep${e.ep}-${e.slug}`) }
