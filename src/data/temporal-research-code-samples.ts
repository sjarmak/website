export interface CodeSection {
  start: number;
  end: number;
  title: string;
  purpose: string;
  whyTemporal: string;
  details: string[];
}

export interface TemporalCodeSample {
  slug: "before" | "inputs" | "prompts" | "workflow" | "activities" | "worker";
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
    filename: "phaseE_workflow.js",
    title: "The complete JavaScript pipeline",
    kicker: "Before Temporal",
    summary:
      "This is the full historical program: two series, ten episode briefs, the editorial prompt contracts, three stages per episode, and two final literature reviews.",
    language: "javascript",
    sourcePath: "public/temporal-research-agent/before/phaseE_workflow.js",
    rawPath: `${root}/before/phaseE_workflow.js`,
    sections: [
      {
        start: 1,
        end: 11,
        title: "Pipeline intent and stages",
        purpose:
          "Names the prior workflow and declares the research, deep-dive, script, and literature-review stages.",
        whyTemporal:
          "The migration starts from the real product sequence, so durability is added without changing what the program is meant to produce.",
        details: ["Historical source", "Four business stages"],
      },
      {
        start: 12,
        end: 27,
        title: "Series configuration",
        purpose:
          "Defines the two research series, their directories, names, and output prefixes.",
        whyTemporal:
          "These values are business input. They belong in typed Workflow input rather than hidden in Worker state.",
        details: ["Two series", "Output identity"],
      },
      {
        start: 28,
        end: 43,
        title: "Shared research contract",
        purpose:
          "Sets source-verification rules and the structured schema returned by episode research.",
        whyTemporal:
          "A durable retry needs a stable input and output contract. The Python version models both as dataclasses.",
        details: ["Source policy", "Structured result"],
      },
      {
        start: 44,
        end: 78,
        title: "Ten episode briefs",
        purpose:
          "Carries every title, focus statement, seed list, and frontier flag for the two five-episode series.",
        whyTemporal:
          "This is the business logic that a generic research-angle example would miss. The replacement preserves all ten records.",
        details: ["Ten episodes", "Seeds", "Frontier flags"],
      },
      {
        start: 79,
        end: 82,
        title: "Podcast format",
        purpose:
          "Defines the spoken format, six segments, citation table, voice, and approximately 3,000-word target.",
        whyTemporal:
          "Temporal schedules the writing step; the application still owns the editorial definition of a correct result.",
        details: ["Editorial contract", "Output quality"],
      },
      {
        start: 83,
        end: 113,
        title: "Per-episode pipeline",
        purpose:
          "Runs research, deep-dive writing, and script writing in sequence for each episode, with concurrent episode branches.",
        whyTemporal:
          "The graph is sound. The missing piece is a durable record of which stage and branch completed when the client process exits.",
        details: ["Sequential stages", "Concurrent branches", "Process-local progress"],
      },
      {
        start: 114,
        end: 123,
        title: "Series-level synthesis",
        purpose:
          "Waits for episode work, then writes one literature review for each complete series.",
        whyTemporal:
          "The Temporal Workflow makes this fan-in explicit and schedules each review as a retriable Activity.",
        details: ["Fan-in", "Two reviews"],
      },
      {
        start: 124,
        end: 124,
        title: "Process-local completion",
        purpose:
          "Returns a compact list after the JavaScript process reaches the end of the happy path.",
        whyTemporal:
          "Temporal records the final result in Workflow state, so a later client can retrieve it without keeping this caller alive.",
        details: ["Final result", "Caller lifetime"],
      },
    ],
  },
  {
    slug: "inputs",
    filename: "podcast_preset.py",
    title: "The preserved business inputs",
    kicker: "After Temporal · domain configuration",
    summary:
      "The Python preset keeps the original two series and all ten episode briefs visible, typed, and separate from orchestration code.",
    language: "python",
    sourcePath:
      "public/temporal-research-agent/src/durable_research/podcast_preset.py",
    rawPath: `${root}/src/durable_research/podcast_preset.py`,
    sections: [
      {
        start: 1,
        end: 20,
        title: "Task queue and dependencies",
        purpose:
          "Imports the typed input models, selects the podcast task queue, and locates bundled fixtures.",
        whyTemporal:
          "The task queue connects the Workflow to compatible Workers while input data remains independent of Worker memory.",
        details: ["Task queue", "Typed input"],
      },
      {
        start: 21,
        end: 33,
        title: "Two series",
        purpose:
          "Recreates the Multi-Agent Orchestration and Code Retrieval series with stable keys and output prefixes.",
        whyTemporal:
          "Stable domain keys support deterministic Workflow identity and repeatable artifact paths.",
        details: ["Series identity", "Artifact naming"],
      },
      {
        start: 34,
        end: 278,
        title: "All ten episode briefs",
        purpose:
          "Preserves titles, focus statements, seed papers, and frontier flags for every historical episode.",
        whyTemporal:
          "Temporalization changes execution semantics. It does not flatten the application into anonymous branches.",
        details: ["Business logic", "Ten typed episodes"],
      },
      {
        start: 279,
        end: 297,
        title: "Full pipeline input",
        purpose:
          "Builds the complete historical input by delegating to the same selector used for smaller runs.",
        whyTemporal:
          "The ten-episode catalog is a preset, not Workflow control flow.",
        details: ["Complete preset", "Shared selector"],
      },
      {
        start: 298,
        end: 354,
        title: "Arbitrary episode selection",
        purpose:
          "Builds typed Workflow input for one episode, several episodes, or the complete preset, retaining only the referenced series.",
        whyTemporal:
          "The Workflow derives branches, concurrency, completion policy, and series fan-in from its input; it contains no episode constants.",
        details: ["Input-driven branches", "One or many episodes"],
      },
      {
        start: 355,
        end: 367,
        title: "Stable source-context identity",
        purpose:
          "Hashes the bibliography and brainstorm context for only the selected series.",
        whyTemporal:
          "Stable content hashes make the logical pipeline identity independent of workstation paths.",
        details: ["Content identity", "Selected series"],
      },
      {
        start: 368,
        end: 387,
        title: "Timed recovery preset",
        purpose:
          "Selects one production-focused episode from each series for the short Worker-kill recording.",
        whyTemporal:
          "The smaller recording input exercises the same Workflow and Activity graph while keeping the proof easy to follow.",
        details: ["Same code path", "Two-episode demo"],
      },
    ],
  },
  {
    slug: "prompts",
    filename: "podcast_prompts.py",
    title: "The preserved editorial contracts",
    kicker: "After Temporal · business rules",
    summary:
      "The prompt module keeps research depth, document structure, script length, citation rules, and series synthesis out of the orchestration layer.",
    language: "python",
    sourcePath:
      "public/temporal-research-agent/src/durable_research/podcast_prompts.py",
    rawPath: `${root}/src/durable_research/podcast_prompts.py`,
    sections: [
      {
        start: 1,
        end: 32,
        title: "Episode research",
        purpose:
          "Requires 5–9 searches, confirmed scholarly records, grounded findings, new bibcodes, and examples suitable for a cold open.",
        whyTemporal:
          "The Activity may retry, so its prompt and structured result need a stable contract independent of attempt number.",
        details: ["5–9 searches", "Grounded sources", "Structured findings"],
      },
      {
        start: 33,
        end: 79,
        title: "Research synthesis",
        purpose:
          "Turns retrieved evidence into an 800–1,500 word brief, removing off-topic and duplicate records before downstream writing.",
        whyTemporal:
          "Retrieval and synthesis remain in one retriable Activity while their large evidence stays outside Workflow History.",
        details: ["Evidence selection", "Research product"],
      },
      {
        start: 80,
        end: 128,
        title: "Deep-dive document",
        purpose:
          "Defines the 1,500–2,500 word source document, its seven sections, and its citation requirements.",
        whyTemporal:
          "The Workflow passes an artifact reference into this stage. The full research payload stays outside Event History.",
        details: ["Artifact input", "Long-form contract"],
      },
      {
        start: 129,
        end: 181,
        title: "Podcast script",
        purpose:
          "Defines the six-segment spoken format, cold open, outro, citations, voice, and approximately 3,000-word target.",
        whyTemporal:
          "Writing remains application logic inside an Activity. Temporal controls when it runs and how failure is handled.",
        details: ["Six segments", "Spoken voice", "Citations"],
      },
      {
        start: 182,
        end: 239,
        title: "Series literature review",
        purpose:
          "Synthesizes completed episode deep dives into one structured review while preserving disagreements and evidence quality.",
        whyTemporal:
          "This is the durable fan-in after episode branches complete. A separate Activity keeps model and file I/O out of Workflow replay.",
        details: ["Series fan-in", "Synthesis contract"],
      },
    ],
  },
  {
    slug: "workflow",
    filename: "podcast_workflow.py",
    title: "The deterministic Workflow",
    kicker: "After Temporal · orchestration",
    summary:
      "The Workflow owns episode order, bounded concurrency, completion policy, progress, series-review fan-in, and the final manifest.",
    language: "python",
    sourcePath:
      "public/temporal-research-agent/src/durable_research/podcast_workflow.py",
    rawPath: `${root}/src/durable_research/podcast_workflow.py`,
    sections: [
      {
        start: 1,
        end: 27,
        title: "Replay-safe imports",
        purpose:
          "Imports Temporal Workflow APIs and passes typed data models through the sandbox without importing the I/O implementation.",
        whyTemporal:
          "Workflow code replays from Event History. Separating Activity dependencies makes the determinism boundary visible.",
        details: ["Workflow sandbox", "Typed payloads"],
      },
      {
        start: 28,
        end: 38,
        title: "Workflow state and query",
        purpose:
          "Defines the Workflow and exposes a read-only progress snapshot.",
        whyTemporal:
          "A replacement Worker rebuilds this state from Event History. The starting client does not need to remain alive.",
        details: ["Durable state", "Progress query"],
      },
      {
        start: 39,
        end: 71,
        title: "Bounded episode fan-out",
        purpose:
          "Runs episode branches in batches, records typed results, and updates progress after each batch.",
        whyTemporal:
          "Activity scheduling and completion are recorded. Replay restores the same branch decisions without repeating completed stages.",
        details: ["Bounded concurrency", "Durable progress"],
      },
      {
        start: 72,
        end: 81,
        title: "Completion policy",
        purpose:
          "Stops the Workflow with a non-retryable domain error when too few episodes complete.",
        whyTemporal:
          "Partial completion is a product decision, so it belongs in deterministic Workflow logic.",
        details: ["Domain policy", "Typed failure"],
      },
      {
        start: 82,
        end: 128,
        title: "Series fan-in and manifest",
        purpose:
          "Schedules reviews for the selected series, writes the manifest, and records the compact completed result.",
        whyTemporal:
          "The Workflow coordinates synthesis while Activities perform the file and writer operations.",
        details: ["Series reviews", "Manifest", "Final result"],
      },
      {
        start: 129,
        end: 165,
        title: "Three Activity stages per episode",
        purpose:
          "Sequences research, deep-dive writing, and script writing with timeouts, heartbeats, retries, and a typed failed-episode result.",
        whyTemporal:
          "Each nondeterministic stage can retry independently. Event History retains the orchestration path across Worker loss.",
        details: ["Stage chain", "Timeouts", "Heartbeat recovery"],
      },
      {
        start: 166,
        end: 188,
        title: "Per-series review Activity",
        purpose:
          "Filters completed episodes for one series and schedules its literature review.",
        whyTemporal:
          "The filter decision replays deterministically while the external synthesis remains retriable Activity work.",
        details: ["Completed-input filter", "Activity boundary"],
      },
      {
        start: 189,
        end: 196,
        title: "Bounded retry policy",
        purpose:
          "Defines exponential backoff, a five-second cap, and an input-controlled attempt limit.",
        whyTemporal:
          "Temporal persists retry timers, but the application still chooses limits that reflect provider cost and latency.",
        details: ["Exponential backoff", "Attempt limit"],
      },
    ],
  },
  {
    slug: "activities",
    filename: "podcast_activities.py",
    title: "The nondeterministic Activities",
    kicker: "After Temporal · external work",
    summary:
      "Five Activities own MCP retrieval, writer calls, heartbeats, artifact I/O, series synthesis, and the final manifest.",
    language: "python",
    sourcePath:
      "public/temporal-research-agent/src/durable_research/podcast_activities.py",
    rawPath: `${root}/src/durable_research/podcast_activities.py`,
    sections: [
      {
        start: 1,
        end: 43,
        title: "Side-effecting dependencies",
        purpose:
          "Imports filesystem, time, subprocess, MCP, artifact, prompt, and Activity dependencies in the external-work module.",
        whyTemporal:
          "Keeping these imports out of the Workflow module protects replay from changing external state.",
        details: ["Activity module", "Nondeterministic dependencies"],
      },
      {
        start: 44,
        end: 140,
        title: "Research and persist one episode",
        purpose:
          "Retrieves fixture or live evidence, stores each source, synthesizes the live research brief, and returns compact references.",
        whyTemporal:
          "The Activity can be retried after Worker loss. Stable pipeline identity and artifact paths keep repeated attempts on one logical output.",
        details: ["SciX + Digest", "Evidence hashes", "Artifact references"],
      },
      {
        start: 141,
        end: 185,
        title: "Write the deep dive",
        purpose:
          "Validates the research stage, invokes the live writer or fixture renderer, and writes the deep-dive artifact.",
        whyTemporal:
          "This long external call has its own timeout, heartbeat, retry, and stable output path.",
        details: ["Stage invariant", "Writer call", "Stable path"],
      },
      {
        start: 186,
        end: 233,
        title: "Write the podcast script",
        purpose:
          "Requires a completed deep dive, invokes the writer, and records the script under the original naming convention.",
        whyTemporal:
          "A script attempt can fail without discarding completed research or deep-dive work.",
        details: ["Independent retry", "Historical filename"],
      },
      {
        start: 234,
        end: 303,
        title: "Write a series review",
        purpose:
          "Collects completed deep dives for one series and writes its literature review.",
        whyTemporal:
          "The Workflow chooses the completed inputs; this Activity performs nondeterministic reads, writing, and synthesis.",
        details: ["Series fan-in", "Completed inputs"],
      },
      {
        start: 304,
        end: 353,
        title: "Write the provenance manifest",
        purpose:
          "Indexes episode status, every artifact reference, all source metadata, and the selected series-review outputs.",
        whyTemporal:
          "The Workflow returns this compact reference while the full research product stays outside Event History.",
        details: ["Provenance", "Compact Workflow result"],
      },
      {
        start: 354,
        end: 464,
        title: "Fixture and live retrieval",
        purpose:
          "Selects fixed evidence for the recording or calls both local MCP servers through the response journal.",
        whyTemporal:
          "Stable logical request IDs suppress repeats after a journaled response. The read-only providers tolerate the remaining pre-journal crash window.",
        details: ["Fixture lane", "Live MCP lane", "Request journal"],
      },
      {
        start: 465,
        end: 552,
        title: "Heartbeats and writer process",
        purpose:
          "Emits progress while retrieval or writing is in flight, cancels child work on shutdown, and launches the writer without a shell.",
        whyTemporal:
          "Heartbeats let the Service detect an Activity lost with its Worker. Subprocess argument arrays avoid shell interpolation.",
        details: ["Heartbeat Timeout", "Cancellation", "No shell"],
      },
      {
        start: 553,
        end: 729,
        title: "Research product renderers",
        purpose:
          "Builds inspectable fixture research, deep dives, scripts, and series reviews with linked SciX and Digest sources.",
        whyTemporal:
          "Fixtures keep the failure experiment repeatable while exercising the same artifacts and stage transitions.",
        details: ["Deterministic fixture", "Readable products"],
      },
      {
        start: 730,
        end: 788,
        title: "Artifact and source helpers",
        purpose:
          "Extracts document sections, renders citations, resolves scholarly URLs, and validates series, episode, and pipeline references.",
        whyTemporal:
          "These helpers enforce application invariants around the compact references that cross Activity boundaries.",
        details: ["Reference validation", "Citation rendering"],
      },
    ],
  },
  {
    slug: "worker",
    filename: "podcast_worker.py",
    title: "The Worker process",
    kicker: "After Temporal · execution host",
    summary:
      "The Worker registers the faithful podcast Workflow and all five Activities on one task queue. Another compatible Worker can replace it.",
    language: "python",
    sourcePath:
      "public/temporal-research-agent/src/durable_research/podcast_worker.py",
    rawPath: `${root}/src/durable_research/podcast_worker.py`,
    sections: [
      {
        start: 1,
        end: 20,
        title: "Implementation registration",
        purpose:
          "Imports the client, Worker, task queue, podcast Workflow, and the complete Activity set.",
        whyTemporal:
          "Registration is explicit. A Worker can execute only the task types whose implementations it has loaded.",
        details: ["Workflow type", "Five Activities", "Task queue"],
      },
      {
        start: 21,
        end: 40,
        title: "Connect, poll, and drain",
        purpose:
          "Connects to the configured Temporal Service, polls the podcast queue, and gives in-flight Activities a 30-second graceful-shutdown window.",
        whyTemporal:
          "The Worker supplies compute. Event History remains in the Service, so a replacement Worker can continue the Workflow.",
        details: ["Replaceable compute", "Graceful shutdown"],
      },
      {
        start: 41,
        end: 50,
        title: "Process lifecycle",
        purpose:
          "Runs the asynchronous Worker and handles a cooperative keyboard shutdown.",
        whyTemporal:
          "The demo uses SIGKILL to bypass this normal path and prove recovery from an abrupt process loss.",
        details: ["Async entry point", "Failure test"],
      },
    ],
  },
];
