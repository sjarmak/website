export interface CodeSection {
  start: number;
  end: number;
  title: string;
  purpose: string;
  whyTemporal: string;
  details: string[];
}

export interface TemporalCodeSample {
  slug: "before" | "workflow" | "activities" | "worker";
  filename: string;
  title: string;
  kicker: string;
  summary: string;
  language: "javascript" | "python";
  sourcePath: string;
  rawPath: string;
  sections: CodeSection[];
}

const root = "/temporal-research-agent";

export const temporalResearchCodeSamples: TemporalCodeSample[] = [
  {
    slug: "before",
    filename: "phaseE_workflow.excerpt.js",
    title: "The captured JavaScript pipeline",
    kicker: "Before Temporal",
    summary:
      "The original process had a sensible research graph, but the caller owned scheduling and progress. A process exit meant reconstructing state from files and deciding what to run again.",
    language: "javascript",
    sourcePath:
      "public/temporal-research-agent/before/phaseE_workflow.excerpt.js",
    rawPath: `${root}/before/phaseE_workflow.excerpt.js`,
    sections: [
      {
        start: 1,
        end: 3,
        title: "Provenance note",
        purpose:
          "Identifies the earlier workflow and makes clear that this is a captured excerpt rather than a newly invented straw man.",
        whyTemporal:
          "A useful migration starts with the real dependency graph and its actual failure boundary.",
        details: ["Source fidelity", "Migration boundary"],
      },
      {
        start: 4,
        end: 8,
        title: "One process owns the run",
        purpose:
          "Creates the workflow and keeps its execution inside a single JavaScript client process.",
        whyTemporal:
          "There is no durable orchestration history outside this caller. If it disappears, the control state disappears with it.",
        details: ["Process-local state", "No durable resume point"],
      },
      {
        start: 9,
        end: 17,
        title: "Research fan-out",
        purpose:
          "Runs the episode research branches through a helper that coordinates concurrent agent calls.",
        whyTemporal:
          "The concurrency is useful, but completion and retry decisions are not durably recorded by an orchestration system.",
        details: ["Parallel branches", "Caller-managed progress"],
      },
      {
        start: 18,
        end: 29,
        title: "Deep-dive fan-out",
        purpose:
          "Starts another set of independent research jobs from the same process.",
        whyTemporal:
          "A failure between phases leaves the operator to infer which branches committed their output and which should be repeated.",
        details: ["Phase boundary", "Manual recovery"],
      },
      {
        start: 30,
        end: 36,
        title: "Podcast-script generation",
        purpose:
          "Transforms the retrieved material into per-episode scripts.",
        whyTemporal:
          "This is another nondeterministic call whose outcome needs an explicit retry and deduplication contract.",
        details: ["External side effect", "Idempotency required"],
      },
      {
        start: 37,
        end: 43,
        title: "Final synthesis",
        purpose:
          "Fans the accumulated evidence into two literature-review products.",
        whyTemporal:
          "The graph is worth preserving. Temporalization moves its control state into a replayable Workflow while leaving external work in Activities.",
        details: ["Fan-in", "Same graph, durable control"],
      },
    ],
  },
  {
    slug: "workflow",
    filename: "workflow.py",
    title: "The deterministic Workflow",
    kicker: "After Temporal · orchestration",
    summary:
      "The Workflow owns durable branch state, bounded fan-out, retry policy selection, progress queries, and the final fan-in. It contains no network, filesystem, or wall-clock calls.",
    language: "python",
    sourcePath:
      "public/temporal-research-agent/src/durable_research/workflow.py",
    rawPath: `${root}/src/durable_research/workflow.py`,
    sections: [
      {
        start: 1,
        end: 23,
        title: "Replay-safe imports",
        purpose:
          "Imports Temporal’s Workflow API and passes data-model imports through the Workflow sandbox.",
        whyTemporal:
          "Workflow code must replay deterministically. Keeping side-effecting integrations out of this module makes that boundary inspectable.",
        details: ["Workflow sandbox", "Deterministic boundary"],
      },
      {
        start: 24,
        end: 33,
        title: "Durable state with a query",
        purpose:
          "Defines the Workflow and exposes current branch progress without mutating execution.",
        whyTemporal:
          "The progress value is rebuilt from Event History after a Worker restart, so callers do not need to keep the original process alive.",
        details: ["Workflow state", "Read-only query"],
      },
      {
        start: 34,
        end: 58,
        title: "Bounded research fan-out",
        purpose:
          "Runs research angles in configured batches and updates progress after each durable branch result.",
        whyTemporal:
          "The Workflow records scheduling and completion decisions. Replay reconstructs them rather than launching the external calls again.",
        details: ["Bounded concurrency", "Durable checkpoints"],
      },
      {
        start: 59,
        end: 71,
        title: "Explicit quorum policy",
        purpose:
          "Stops the run if too few research angles complete, otherwise advances to finalization.",
        whyTemporal:
          "Partial failure is a domain decision, not an incidental exception. Encoding it here makes recovery behavior stable and testable.",
        details: ["Failure policy", "Non-retryable domain error"],
      },
      {
        start: 72,
        end: 87,
        title: "Durable fan-in",
        purpose:
          "Schedules final report assembly as an Activity and records the completed result in Workflow state.",
        whyTemporal:
          "Artifact reads, writes, and synthesis are nondeterministic, so the Workflow schedules them but does not perform them.",
        details: ["Activity boundary", "Final result"],
      },
      {
        start: 88,
        end: 121,
        title: "Per-angle Activity chain",
        purpose:
          "Sequences retrieval, evidence verification, and section synthesis with timeouts, heartbeats, and a typed failure result.",
        whyTemporal:
          "Temporal can retry each nondeterministic step independently while Event History preserves the branch’s orchestration path.",
        details: ["Timeouts", "Heartbeats", "Typed failure"],
      },
      {
        start: 122,
        end: 129,
        title: "Bounded retry policy",
        purpose:
          "Centralizes exponential backoff and caps attempts using review input.",
        whyTemporal:
          "Retries are durable timers rather than sleeps in a client process, but the limit still needs to reflect cost and provider behavior.",
        details: ["Exponential backoff", "Cost boundary"],
      },
    ],
  },
  {
    slug: "activities",
    filename: "activities.py",
    title: "The nondeterministic Activities",
    kicker: "After Temporal · external work",
    summary:
      "Activities own MCP and CLI calls, artifact I/O, content verification, report rendering, and live synthesis. Their outputs are durable inputs to the Workflow’s next decision.",
    language: "python",
    sourcePath:
      "public/temporal-research-agent/src/durable_research/activities.py",
    rawPath: `${root}/src/durable_research/activities.py`,
    sections: [
      {
        start: 1,
        end: 27,
        title: "Side-effecting dependencies",
        purpose:
          "Imports filesystem, hashing, MCP, recording, and Activity APIs in the module where nondeterministic work is allowed.",
        whyTemporal:
          "This boundary keeps replay-sensitive Workflow code separate from external state and changing services.",
        details: ["Activity module", "Nondeterministic dependencies"],
      },
      {
        start: 28,
        end: 79,
        title: "Retrieve and persist evidence",
        purpose:
          "Searches SciX and Code Intelligence Digest, stores each response, and returns compact source metadata with hashes.",
        whyTemporal:
          "Activities may retry after a crash. Stable artifact names and a request-derived review ID prevent retries from multiplying output.",
        details: ["MCP calls", "Artifact references", "Stable identity"],
      },
      {
        start: 80,
        end: 103,
        title: "Verify before synthesis",
        purpose:
          "Re-reads every evidence artifact and checks required metadata and its SHA-256 content hash.",
        whyTemporal:
          "Temporal durably schedules work; this application-level check proves the referenced evidence is still the evidence that was retrieved.",
        details: ["Content integrity", "Application invariant"],
      },
      {
        start: 104,
        end: 176,
        title: "Render readable citations",
        purpose:
          "Builds one report section per angle, normalizes provider labels, links titles, and collapses duplicate titles in the human report.",
        whyTemporal:
          "All retrieved records remain in the returned branch for provenance. Presentation deduplication is deliberately separate from execution history.",
        details: ["Human-readable output", "Lossless provenance"],
      },
      {
        start: 177,
        end: 271,
        title: "Finalize report and provenance",
        purpose:
          "Fans completed sections into the report, calls live SciX synthesis when configured, and writes a manifest that retains every source record.",
        whyTemporal:
          "Finalization is retriable external work. Named artifacts and recorded hashes give repeated attempts an idempotent write target.",
        details: ["Durable fan-in", "Provenance manifest", "Idempotent writes"],
      },
      {
        start: 272,
        end: 317,
        title: "Normalize SciX synthesis",
        purpose:
          "Turns the provider’s structured synthesis response into readable Markdown without leaking raw response shapes into the report.",
        whyTemporal:
          "Provider response parsing can evolve in Activity code without changing the Workflow’s orchestration contract.",
        details: ["Provider adapter", "Stable Workflow contract"],
      },
      {
        start: 318,
        end: 336,
        title: "Fixture-backed evidence",
        purpose:
          "Provides deterministic SciX-shaped and Digest-shaped inputs for the recorded failure demonstration.",
        whyTemporal:
          "Fixtures isolate the durability experiment from local index health; a separate live run proves the real integration.",
        details: ["Reproducible demo", "Live path kept separate"],
      },
      {
        start: 337,
        end: 408,
        title: "Live provider calls and heartbeats",
        purpose:
          "Executes both live research lanes and emits heartbeats while long-running requests are in flight.",
        whyTemporal:
          "Heartbeats let the Service detect an Activity lost with its Worker and make retry progress observable.",
        details: ["Live MCP/CLI boundary", "Heartbeat timeout"],
      },
      {
        start: 409,
        end: 457,
        title: "Normalize provider records",
        purpose:
          "Maps heterogeneous provider results into the shared source model while retaining raw response artifacts.",
        whyTemporal:
          "The Workflow receives a compact, stable payload instead of large or provider-specific records in Event History.",
        details: ["Payload discipline", "Shared source model"],
      },
      {
        start: 458,
        end: 499,
        title: "Text cleanup and demo pacing",
        purpose:
          "Converts HTML summaries to readable text, emits demo heartbeats during an intentional delay, and validates artifact references.",
        whyTemporal:
          "Clock waits and heartbeat calls belong in Activities. A Workflow-side sleep would be durable, but it would not demonstrate recovery of in-flight external work.",
        details: ["Text normalization", "Activity heartbeat", "Reference guard"],
      },
    ],
  },
  {
    slug: "worker",
    filename: "worker.py",
    title: "The Worker process",
    kicker: "After Temporal · execution host",
    summary:
      "The Worker connects to the Temporal Service, polls one task queue, and registers the Workflow and four Activities. It is replaceable: killing this process does not erase the Workflow run.",
    language: "python",
    sourcePath:
      "public/temporal-research-agent/src/durable_research/worker.py",
    rawPath: `${root}/src/durable_research/worker.py`,
    sections: [
      {
        start: 1,
        end: 18,
        title: "Register the implementation",
        purpose:
          "Imports the Temporal client and Worker plus the exact Workflow and Activity functions this process can execute.",
        whyTemporal:
          "Registration is explicit: the task queue routes durable tasks to a Worker that knows their implementation.",
        details: ["Worker dependencies", "Task implementation"],
      },
      {
        start: 19,
        end: 33,
        title: "Connect, poll, and drain",
        purpose:
          "Connects to the configured Service, polls the research task queue, and allows in-flight Activities a graceful shutdown window.",
        whyTemporal:
          "The Worker owns compute, not orchestration state. Another compatible Worker can continue from the same Event History.",
        details: ["Task queue", "Graceful shutdown", "Replaceable compute"],
      },
      {
        start: 34,
        end: 43,
        title: "Process lifecycle",
        purpose:
          "Runs the asynchronous Worker and handles an intentional keyboard shutdown cleanly.",
        whyTemporal:
          "Normal shutdown is cooperative; the recorded demo uses SIGKILL to prove recovery when cooperation is impossible.",
        details: ["Async entry point", "Failure demonstration"],
      },
    ],
  },
];
