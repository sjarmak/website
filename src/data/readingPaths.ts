export type CollectionName =
  | "projects"
  | "writing"
  | "talks"
  | "publications"
  | "learning";

export interface Stop {
  collection: CollectionName;
  slug: string;
  why: string;
}

export interface ReadingPath {
  id: string;
  title: string;
  audience: string;
  blurb: string;
  stops: Stop[];
}

export const readingPaths: ReadingPath[] = [
  {
    id: "hiring-agents",
    title: "Agents, Evals & Production Scale",
    audience: "If you're evaluating me for agent or eval work",
    blurb:
      "A tour from the philosophy behind the Agent Advocate role through the benchmark I built, the ideas shaping how I think about evaluation, a live webinar on composing agents into workflows, and the open-source orchestration framework I help maintain.",
    stops: [
      {
        collection: "writing",
        slug: "why-agent-advocate-exists",
        why: "Start here to understand why I think production agent infrastructure matters more than prompt engineering — and what the Agent Advocate role is actually about.",
      },
      {
        collection: "projects",
        slug: "codescalebench",
        why: "From philosophy to practice: CodeScaleBench is the benchmark I built after finding that existing evals could not capture how coding agents fail on real enterprise codebases.",
      },
      {
        collection: "writing",
        slug: "rethinking-coding-agent-benchmarks",
        why: "This piece lays out the measurement problems CodeScaleBench is designed to fix — a good companion to the project itself for understanding the design choices.",
      },
      {
        collection: "talks",
        slug: "building-a-software-factory",
        why: "A webinar where I walk through how teams compose agents into repeatable engineering workflows — the systems-level view that connects benchmarking to day-to-day agent use.",
      },
      {
        collection: "projects",
        slug: "gascity",
        why: "Gas City is the multi-agent orchestration SDK I maintain. Seeing it alongside the benchmark makes the evaluation-to-production loop concrete.",
      },
    ],
  },
  {
    id: "science-to-agents",
    title: "From Planetary Science to Information Science",
    audience: "If you want to trace the arc from rings of Saturn to AI agents",
    blurb:
      "My research career started with Cassini data and Saturn's ring system. This path traces the pivot from planetary science to building AI infrastructure for scientific literature — via LLM embeddings, an agentic research assistant, and the talk that synthesises it all.",
    stops: [
      {
        collection: "publications",
        slug: "saturn-rings-cassini-uvis",
        why: "My first peer-reviewed paper: solar occultation observations of Saturn's rings with the Cassini UVIS instrument. The starting point for everything that followed.",
      },
      {
        collection: "publications",
        slug: "scix-llm-embeddings",
        why: "The pivot paper — experimenting with LLM embeddings inside the NASA SciX corpus. Same instinct for structured data analysis, new domain and new tools.",
      },
      {
        collection: "projects",
        slug: "scix-agent",
        why: "From embedding experiments to a full agentic research assistant over 32M+ scholarly papers — the project where the two careers fully converged.",
      },
      {
        collection: "talks",
        slug: "making-scientific-knowledge-navigable",
        why: "An invited talk where I tell this whole story live, including a demo of the SciX agent navigating the scientific literature for a researcher in real time.",
      },
      {
        collection: "learning",
        slug: "agentic-memory-systems",
        why: "The open question the SciX work raised for me: how do agents maintain long-horizon context over a vast corpus? This literature explorer is where I've been mapping that frontier.",
      },
    ],
  },
  {
    id: "agent-memory-deep",
    title: "The Agent-Memory Throughline",
    audience: "If you're researching or building agent memory systems",
    blurb:
      "Memory is the unsolved problem in long-horizon agent work. This path moves from the foundational literature survey through a benchmark project, into the practical design considerations that shape real systems, and out to an audio series that synthesises the research.",
    stops: [
      {
        collection: "learning",
        slug: "agentic-memory-systems",
        why: "The literature explorer I built to map the field — 108 papers across 9 themes covering retrieval, consolidation, and architectural patterns for agent memory.",
      },
      {
        collection: "projects",
        slug: "mem",
        why: "The benchmark project that came out of the survey: evaluating agentic memory by using an orchestrator's own work traces as the ground-truth corpus, where every outcome is verifiable.",
      },
      {
        collection: "writing",
        slug: "multi-agent-pipelines-week",
        why: "A week of running multi-agent pipelines in anger — where context management and memory boundaries show up as practical friction, not theoretical problems.",
      },
      {
        collection: "learning",
        slug: "memory-design-considerations",
        why: "The engineering companion to the foundational survey: 51 sources distilled into the design considerations that actually matter when you're building a memory layer.",
      },
      {
        collection: "learning",
        slug: "podcast-am-ep1",
        why: "The first episode of the Agentic Memory Reading Path podcast series — an audio synthesis of the literature that ties together everything in this tour.",
      },
    ],
  },
];
