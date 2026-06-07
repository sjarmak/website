export type QuestionStatus = "open" | "exploring" | "partial";

export interface ResearchLink {
  label: string;
  url: string;
}

export interface ResearchQuestion {
  id: string;
  question: string;
  status: QuestionStatus;
  tags: string[];
  updated: string;
  note: string;
  links: ResearchLink[];
}

export const researchQuestions: ResearchQuestion[] = [
  {
    id: "multi-agent-reliability",
    question:
      "How do we make multi-agent systems reliable enough to change production code unattended?",
    status: "exploring",
    tags: ["agents", "reliability"],
    updated: "2026-05-18",
    note:
      "I've been building and maintaining Gas City specifically to stress-test this — composing specialized agents into workflows that don't require a human in the loop for every decision. The hard part isn't the individual agent; it's the handoff protocol and the trust boundary. EnterpriseBench is surfacing exactly where those boundaries collapse.",
    links: [
      { label: "Gas City — orchestration SDK", url: "/projects/gascity" },
      { label: "EnterpriseBench", url: "/projects/enterprisebench" },
    ],
  },
  {
    id: "benchmark-large-scale",
    question:
      "What should a benchmark for large-scale software work actually measure?",
    status: "partial",
    tags: ["evaluation", "benchmarks"],
    updated: "2026-04-02",
    note:
      "Pass/fail on small isolated tasks misses the point for enterprise-scale engineering. CodeScaleBench is my attempt to operationalize what that actually means — 275 tasks across 20 suites, 9 work types, spanning multi-repo scope. The hard unsolved piece is how to score partial progress and recovery, not just task completion.",
    links: [
      { label: "CodeScaleBench project", url: "/projects/codescalebench" },
      {
        label: "I couldn't find a good enough benchmark, so I built one",
        url: "https://medium.com/@steph.jarmak/i-couldnt-find-a-good-enough-benchmark-for-large-scale-software-development-so-i-built-one-d2cc5946e963",
      },
      {
        label: "Rethinking coding agent benchmarks",
        url: "https://medium.com/@steph.jarmak/rethinking-coding-agent-benchmarks-5cde3c696e4a",
      },
    ],
  },
  {
    id: "agent-memory",
    question:
      "How should long-horizon agent memory be structured and consolidated?",
    status: "open",
    tags: ["agent-memory", "agents"],
    updated: "2026-05-30",
    note:
      "Most memory work treats retention as a single problem. I think it's at least three: what to keep, how to retrieve it when relevant, and how to consolidate across sessions without compounding noise. The mem project is building an evaluation corpus from real multi-agent work traces — every item has a verifiable outcome, which makes memory quality measurable in a way session prose doesn't allow.",
    links: [
      { label: "mem — benchmark project", url: "/projects/mem" },
      {
        label: "Agentic Memory Systems — literature explorer",
        url: "https://sjarmak.github.io/lit_explorers/agentic_memory_explorer.html",
      },
    ],
  },
  {
    id: "scientific-literature-navigation",
    question:
      "Can embeddings make scientific literature genuinely navigable, not just searchable?",
    status: "exploring",
    tags: ["retrieval", "scientific-search"],
    updated: "2026-04-28",
    note:
      "Search returns documents. Navigation traverses relationships — between claims, methods, datasets, authors, and results. My work with NASA SciX on LLM embeddings showed real gains in retrieval quality, but navigation is a harder goal: you need to follow a thread of scientific reasoning, not just find similar papers. The SciX Agent and the making-scientific-knowledge-navigable talk lay out what I think that architecture looks like.",
    links: [
      {
        label: "Experimenting with LLMs and vector embeddings in NASA SciX (arXiv)",
        url: "https://arxiv.org/abs/2312.14211",
      },
      { label: "SciX Agent project", url: "/projects/scix-agent" },
      {
        label: "Talk: Making Scientific Knowledge Navigable for Agents",
        url: "https://docs.google.com/presentation/d/1TTkiEMqk-xnONvRpXK5dyIs6BNB83kSXbXv3jmCLndI/edit",
      },
    ],
  },
  {
    id: "agent-failure-prediction",
    question:
      "Where do coding agents fail unpredictably, and can we see it coming?",
    status: "exploring",
    tags: ["agents", "evaluation"],
    updated: "2026-03-14",
    note:
      "Agent Diagnostics classifies failure modes across 40 categories, 11 dimensions, ~12k trials, 4 models, 61 benchmarks — and what I keep finding is that the failures that matter most are the ones that look like successes until they aren't. Reward hacking, flawed test passes, lucky patches. The open question is whether behavioral signals in the trajectory predict those failures before they ship.",
    links: [
      { label: "Agent Diagnostics project", url: "/projects/agent-diagnostics" },
      {
        label: "Why your coding agent keeps failing in ways you can't predict",
        url: "https://medium.com/@steph.jarmak/why-your-coding-agent-keeps-failing-in-ways-you-cant-predict-4de939284bb7",
      },
    ],
  },
  {
    id: "ai-planetary-science",
    question:
      "What would it look like for an AI agent to do real planetary science — not assist a scientist, but run a hypothesis-test loop autonomously?",
    status: "open",
    tags: ["agents", "scientific-search", "astronomy"],
    updated: "2025-11-07",
    note:
      "My background is planetary science — asteroid surfaces, Saturn's rings, JWST spectroscopy — and I keep asking what it would take for an agent to move from literature search to experiment design to result interpretation in a domain where data is public, tools are scriptable, and hypotheses are falsifiable. The SciX Agent is a step toward the retrieval layer. The execution layer is still mostly blank.",
    links: [
      { label: "SciX Agent project", url: "/projects/scix-agent" },
      {
        label: "NLS Fine-tune (SciX) — natural language to structured queries",
        url: "/projects/nls-finetune-scix",
      },
      {
        label: "JWST spectroscopy of (16) Psyche — water/hydroxyl detection",
        url: "https://iopscience.iop.org/article/10.3847/PSJ/ad66b9",
      },
    ],
  },
];
