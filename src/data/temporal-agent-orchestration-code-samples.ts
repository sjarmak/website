export interface AgentOrchestrationCodeSection {
  start: number;
  end: number;
  title: string;
  purpose: string;
  whyTemporal: string;
  details: string[];
}

export interface AgentOrchestrationCodeSample {
  slug: "bridge" | "workflow" | "activity" | "executor" | "workers";
  filename: string;
  label: string;
  summary: string;
  sourcePath: string;
  rawPath: string;
  sections: AgentOrchestrationCodeSection[];
}

const root = "/temporal-agent-orchestration";

export const temporalAgentOrchestrationCodeSamples: AgentOrchestrationCodeSample[] =
  [
    {
      slug: "bridge",
      filename: "bridge.go",
      label: "Ready-event bridge",
      summary:
        "Delivers a durable work-store event through Signal-With-Start, then records the exact Workflow receipt.",
      sourcePath: "public/temporal-agent-orchestration/code/bridge.go",
      rawPath: `${root}/code/bridge.go`,
      sections: [
        {
          start: 1,
          end: 48,
          title: "The delivery boundary",
          purpose:
            "Defines the typed request, receipt, Temporal gateway, and acknowledgement interfaces used to cross from the work store into a Workflow.",
          whyTemporal:
            "The application can test delivery and acknowledgement separately from the Temporal client while keeping one stable contract at the boundary.",
          details: ["Typed boundary", "Receipt identity", "Testable adapters"],
        },
        {
          start: 49,
          end: 101,
          title: "Signal first, acknowledge second",
          purpose:
            "Validates the ready event, derives a stable Workflow ID, performs Signal-With-Start, verifies the receipt, and only then acknowledges the outbox event.",
          whyTemporal:
            "A crash between delivery and acknowledgement causes redelivery. The stable Workflow ID and duplicate-event handling make that retry safe.",
          details: ["Signal-With-Start", "Outbox acknowledgement", "Crash gap"],
        },
        {
          start: 102,
          end: 149,
          title: "Seal a finite run",
          purpose:
            "Sends the authoritative event set for a finite run and constructs a stable Workflow ID from city, run, and work-item identity.",
          whyTemporal:
            "The Workflow cannot close early when a final ready event and the close command arrive in either order.",
          details: ["Finite-run seal", "Stable Workflow ID", "Input validation"],
        },
        {
          start: 150,
          end: 218,
          title: "Bind the contract to the Go SDK",
          purpose:
            "Configures Workflow identity, Task Queue, Memo, optional Search Attributes, conflict policy, and the atomic signal-or-start call.",
          whyTemporal:
            "Signal-With-Start removes the client-side race between checking for a Workflow and starting or signaling it.",
          details: ["Go client", "Memo", "Search Attributes", "Conflict policy"],
        },
        {
          start: 219,
          end: 228,
          title: "Deliver the close command",
          purpose:
            "Sends the typed close request to the current Workflow Execution.",
          whyTemporal:
            "The close request becomes part of Event History and is evaluated by deterministic Workflow logic.",
          details: ["Typed Signal", "Durable close"],
        },
      ],
    },
    {
      slug: "workflow",
      filename: "workflow.go",
      label: "Workflow",
      summary:
        "Owns deterministic progression for one work item, including duplicate delivery, a finite-run seal, cancellation, and formula visibility.",
      sourcePath: "public/temporal-agent-orchestration/code/workflow.go",
      rawPath: `${root}/code/workflow.go`,
      sections: [
        {
          start: 1,
          end: 59,
          title: "Enter through replay-safe state",
          purpose:
            "Validates immutable input, installs a state query, registers signals, schedules initial events, and returns only after the run reaches a terminal state.",
          whyTemporal:
            "A replacement Worker rebuilds this state from Event History. No dispatcher process has to remember the current step.",
          details: ["Deterministic entry", "State Query", "Version marker"],
        },
        {
          start: 60,
          end: 111,
          title: "Keep procedure state inside the Workflow",
          purpose:
            "Holds selectors, accepted event IDs, expected close IDs, in-flight Activities, and cancellation state for the current execution.",
          whyTemporal:
            "These fields describe procedure, so replay can reconstruct them without treating the mutable work ledger as a Workflow database.",
          details: ["Selector", "Deduplication set", "In-flight state"],
        },
        {
          start: 112,
          end: 185,
          title: "Receive ready, close, and cancellation events",
          purpose:
            "Registers the Signal handlers, rejects conflicting seals, drains events already buffered, and propagates cancellation to running Activities.",
          whyTemporal:
            "Signals advance a known execution while the close seal prevents a delivery race from losing the final unit of work.",
          details: ["Signals", "Cancellation", "Authoritative seal"],
        },
        {
          start: 186,
          end: 254,
          title: "Schedule one stable Activity",
          purpose:
            "Deduplicates each ready event, bounds history growth, projects formula metadata, and schedules agent work with a stable Activity ID and bounded retry policy.",
          whyTemporal:
            "Temporal persists the schedule, retry timer, and completion. The application still supplies identity, timeouts, and retry limits.",
          details: ["Stable Activity ID", "Task Queue", "Retries", "Event limit"],
        },
        {
          start: 255,
          end: 342,
          title: "Accept only the matching terminal result",
          purpose:
            "Validates the Activity result, records success or failure, and signals the maintenance parent with the child outcome when one exists.",
          whyTemporal:
            "The Workflow records the exact result that advanced the procedure and preserves the parent-child topology for operators.",
          details: ["Typed result", "Parent link", "Failure state"],
        },
        {
          start: 343,
          end: 427,
          title: "Wait until the run is genuinely drained",
          purpose:
            "Waits for cancellation delivery, all Activities, parent notifications, and every event named by the close seal.",
          whyTemporal:
            "Durable waits replace polling loops and repair scans for procedure state while keeping the Workflow finite.",
          details: ["Durable wait", "Cancellation drain", "Set equality"],
        },
        {
          start: 428,
          end: 446,
          title: "Return a compact terminal state",
          purpose:
            "Returns a copied success state or a failure carrying the last domain error code.",
          whyTemporal:
            "Callers can retrieve the result after their own process exits, and mutable slices cannot escape the Workflow state object.",
          details: ["Terminal result", "Defensive copy"],
        },
      ],
    },
    {
      slug: "activity",
      filename: "activity.go",
      label: "Activity",
      summary:
        "Claims the exact work generation, starts or reattaches the bound agent, heartbeats progress, propagates cancellation, and fences completion.",
      sourcePath: "public/temporal-agent-orchestration/code/activity.go",
      rawPath: `${root}/code/activity.go`,
      sections: [
        {
          start: 1,
          end: 70,
          title: "Define compact Activity contracts",
          purpose:
            "Models agent progress, execution, cancellation, and the adapter interfaces for the work store and external agent process.",
          whyTemporal:
            "Compact typed payloads keep large prompts, code changes, and artifacts out of Workflow History.",
          details: ["Typed payloads", "Artifact references", "Adapter boundary"],
        },
        {
          start: 71,
          end: 149,
          title: "Claim the exact generation",
          purpose:
            "Validates configuration and input, reads any prior heartbeat, claims the work item under the current Workflow identity, and rejects stale fences.",
          whyTemporal:
            "Activity execution is at least once. The generation and claim token stop a late attempt from writing into a newer run.",
          details: ["Generation fence", "Heartbeat resume", "Non-retryable errors"],
        },
        {
          start: 150,
          end: 231,
          title: "Start or reattach the agent",
          purpose:
            "Resolves one session from the claim token, resumes from heartbeat state, streams progress, and records a failed attempt before Temporal retries.",
          whyTemporal:
            "A retry attaches to the same long-running agent session instead of launching a second agent against the same worktree.",
          details: ["Start-or-attach", "Attempt record", "Session identity"],
        },
        {
          start: 232,
          end: 305,
          title: "Cancel and complete through the fence",
          purpose:
            "Targets the exact session during cancellation and writes the terminal receipt only when generation, claim, session, outcome, and artifact references are valid.",
          whyTemporal:
            "Temporal delivers cancellation and retry semantics, while the application prevents stale or ambiguous completions from being accepted.",
          details: ["Exact-session cancellation", "Fenced receipt", "Artifact validation"],
        },
        {
          start: 306,
          end: 367,
          title: "Recover the last durable checkpoint",
          purpose:
            "Reads Activity heartbeat details and verifies that the checkpoint belongs to the current bead generation and claim token.",
          whyTemporal:
            "A new Activity attempt can resume from progress recorded by the Worker that disappeared.",
          details: ["Heartbeat details", "Stale-checkpoint rejection"],
        },
        {
          start: 368,
          end: 472,
          title: "Keep progress alive and monotonic",
          purpose:
            "Runs a bounded heartbeat pump, records agent checkpoints, rejects changed session identity or reused sequence numbers, and copies resume state safely.",
          whyTemporal:
            "Heartbeat timeout detects Worker loss, and monotonic checkpoints give the retry a compact recovery cursor.",
          details: ["Heartbeat timeout", "Monotonic sequence", "Progress cursor"],
        },
      ],
    },
    {
      slug: "executor",
      filename: "command_agent_executor.go",
      label: "Agent adapter",
      summary:
        "Invokes a trusted executable through a bounded JSON/JSONL protocol that supports resolve, execute, progress, result, and cancellation.",
      sourcePath:
        "public/temporal-agent-orchestration/code/command_agent_executor.go",
      rawPath: `${root}/code/command_agent_executor.go`,
      sections: [
        {
          start: 1,
          end: 48,
          title: "Make the process protocol explicit",
          purpose:
            "Defines bounded message sizes, trusted executable configuration, and the request and response envelopes for the adapter.",
          whyTemporal:
            "The Activity can retry safely only when external process identity and protocol semantics are stable.",
          details: ["JSON protocol", "Bounded input", "Trusted executable"],
        },
        {
          start: 49,
          end: 113,
          title: "Validate the executable and resolve one session",
          purpose:
            "Requires absolute paths, an executable regular file, a real working directory, and exactly one valid resolved-session response.",
          whyTemporal:
            "The session is keyed before execution so a later attempt can attach to it instead of starting another process.",
          details: ["Absolute path", "Fail closed", "Stable session"],
        },
        {
          start: 114,
          end: 180,
          title: "Stream progress and target cancellation",
          purpose:
            "Consumes progress messages, accepts one terminal result, and sends cancellation with the bead, generation, claim token, and session ID.",
          whyTemporal:
            "Progress feeds Activity heartbeats, while exact cancellation prevents a stale run from stopping an unrelated agent.",
          details: ["Streaming progress", "One terminal result", "Exact cancellation"],
        },
        {
          start: 181,
          end: 251,
          title: "Run without a shell",
          purpose:
            "Starts the fixed executable directly, sends JSON over stdin, strictly decodes bounded output, and terminates on malformed protocol messages.",
          whyTemporal:
            "This keeps nondeterministic process I/O inside the Activity and narrows the command-injection surface.",
          details: ["No shell", "Strict JSON", "Message limits"],
        },
        {
          start: 252,
          end: 279,
          title: "Validate identity and filter secrets",
          purpose:
            "Rejects incomplete execution requests and removes the work-store password from the child process environment.",
          whyTemporal:
            "Retries reproduce the same validated request without widening the external process's credential access.",
          details: ["Request validation", "Environment filtering"],
        },
      ],
    },
    {
      slug: "workers",
      filename: "workers.go",
      label: "Workers",
      summary:
        "Registers orchestration and agent execution on separate Task Queues, with a fail-closed shadow worker for deployment.",
      sourcePath: "public/temporal-agent-orchestration/code/workers.go",
      rawPath: `${root}/code/workers.go`,
      sections: [
        {
          start: 1,
          end: 23,
          title: "Own two Worker pollers",
          purpose:
            "Keeps the orchestration Worker and the agent Activity Worker under one small lifecycle object.",
          whyTemporal:
            "Separate Task Queues let deterministic Workflow tasks and resource-heavy agent work scale and fail independently.",
          details: ["Two Task Queues", "Lifecycle state"],
        },
        {
          start: 24,
          end: 51,
          title: "Choose canary or shadow dependencies",
          purpose:
            "Builds a real Worker set only with a work store and agent executor, while shadow mode binds an Activity that rejects execution before mutation.",
          whyTemporal:
            "The same Workflow registration can be observed in deployment without accidentally dispatching an agent.",
          details: ["Dependency checks", "Shadow mode", "Fail closed"],
        },
        {
          start: 52,
          end: 76,
          title: "Register by explicit names",
          purpose:
            "Registers the Workflow and Activity on their dedicated Task Queues using stable public names.",
          whyTemporal:
            "Explicit names and Task Queues form a deployment contract that survives Go symbol refactors.",
          details: ["Stable names", "Workflow registration", "Activity registration"],
        },
        {
          start: 77,
          end: 112,
          title: "Start and stop as one unit",
          purpose:
            "Starts both pollers, rolls back a partial start, and makes repeated lifecycle calls safe.",
          whyTemporal:
            "A managed service should not leave one Task Queue polling after the other Worker fails to start.",
          details: ["Rollback", "Idempotent lifecycle"],
        },
      ],
    },
  ];

export function validateTemporalAgentOrchestrationCodeSamples(
  lineCounts: Record<string, number>,
): void {
  for (const sample of temporalAgentOrchestrationCodeSamples) {
    let expectedStart = 1;
    for (const section of sample.sections) {
      if (section.start !== expectedStart || section.end < section.start) {
        throw new Error(`Non-contiguous annotations in ${sample.filename}`);
      }
      expectedStart = section.end + 1;
    }
    const lineCount = lineCounts[sample.filename];
    if (expectedStart !== lineCount + 1) {
      throw new Error(
        `${sample.filename} has ${lineCount} lines but annotations end at ${expectedStart - 1}`,
      );
    }
  }
}
