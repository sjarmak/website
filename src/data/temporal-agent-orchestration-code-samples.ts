export interface AgentOrchestrationCodeSection {
  start: number;
  end: number;
  title: string;
  purpose: string;
  whyTemporal: string;
  details: string[];
}

export interface AgentOrchestrationCodeSample {
  slug: string;
  filename: string;
  label: string;
  summary: string;
  revision?: string;
  promotionStatus?: string;
  evidenceTrail?: Array<{
    label: string;
    detail: string;
    revision?: string;
  }>;
  sourcePath: string;
  rawPath: string;
  sourceUrl?: string;
  sourceLabel?: string;
  sections: AgentOrchestrationCodeSection[];
}

const root = "/temporal-agent-orchestration";
const beforeRevision = "b78058917bc65846db89e1c3b25dc17269822483";
const upstreamSource = `https://github.com/gastownhall/gascity/blob/${beforeRevision}`;
const passedAgentCanary = {
  promotionStatus:
    "Passed the bounded bead-to-agent canary; the service returned to shadow mode after the run.",
};
const failedOutcomeReadyCanary = {
  promotionStatus:
    "The first full-integration canary for this historical source failed. Reviewed repairs later passed bounded gates, and OutcomeReady now runs continuously in production on the reviewed build.",
  evidenceTrail: [
    {
      label: "Failed promotion gate",
      detail:
        "The first OutcomeReady canary exposed notification contention, false correlation, observer misclassification, and missing producer coverage.",
    },
    {
      label: "Notifier repair",
      detail:
        "Independent exact-head review passed after the mail writer was serialized and bounded diagnostics were made UTF-8 safe.",
    },
    {
      label: "Successful bounded canary",
      detail:
        "The repaired run delivered five stranded outcomes and one Temporal-origin formula result with exact Workflow and Run correlation.",
    },
    {
      label: "Nine outcomes acknowledged",
      detail:
        "The coordinator verified nine unique outcomes as acknowledged; repeated attention mail came from later redelivery cycles.",
    },
    {
      label: "Returned to shadow",
      detail:
        "The worker finished the bounded recovery in shadow mode for both agent mutation and outcome delivery.",
    },
    {
      label: "Bounded finalization",
      detail:
        "The installed operator finalized the first production work item with an atomic receipt while preserving its acknowledged outbox; the worker stayed in shadow mode.",
    },
    {
      label: "Exact-five producer canary",
      detail:
        "The all-store preflight found only five authorized transitions. All five produced first-cycle deliveries, then committed exact coordinator acknowledgements in a bounded acknowledgement phase.",
    },
    {
      label: "Atomic finalization",
      detail:
        "The reviewed operator finalized the remaining work item without creating another outcome generation; the worker returned to shadow mode with an empty health surface.",
    },
    {
      label: "Continuous OutcomeReady activation",
      detail:
        "After a separate approval, the reviewed worker was left running continuously, with agent mutation still in shadow and only the result-delivery path active. The running binary matched the reviewed build.",
    },
    {
      label: "Production receipts verified",
      detail:
        "The first two production outcomes, one from a project store and one from the city store, were delivered and acknowledged on their first cycle under a single coordinator fence.",
    },
    {
      label: "Postconditions held",
      detail:
        "A later synthetic close was durably excluded as a non-outcome because its source result had already been acknowledged and finalized. Operators then disarmed the rollback timer with the same process and configuration still running, and the all-store health surface stayed empty.",
    },
  ],
};

export const preTemporalAgentOrchestrationCodeSamples: AgentOrchestrationCodeSample[] =
  [
    {
      slug: "before-controller",
      filename: "city_runtime_excerpt.go",
      label: "Controller tick",
      summary:
        "A readable abridgment of the production tick that repaired orphaned assignments, reconciled sessions, delivered nudges, and ran a second wake-up backstop.",
      sourcePath:
        "public/temporal-agent-orchestration/code/before/city_runtime_excerpt.go",
      rawPath: `${root}/code/before/city_runtime_excerpt.go`,
      sourceUrl: `${upstreamSource}/cmd/gc/city_runtime.go#L2140-L2384`,
      sourceLabel: `cmd/gc/city_runtime.go at ${beforeRevision.slice(0, 9)}`,
      sections: [
        {
          start: 1,
          end: 20,
          title: "Enter through one process-owned tick",
          purpose:
            "Identifies the exact upstream revision and enters the controller method that owned this pass through the current snapshots.",
          whyTemporal:
            "If this process stopped, the call stack and its current position disappeared. The next process could only run another tick against persisted facts.",
          details: [
            "Process-local procedure",
            "Versioned source",
            "Snapshot input",
          ],
        },
        {
          start: 21,
          end: 56,
          title: "Repair what the previous owner left behind",
          purpose:
            "Reloads session state, searches for assignments whose session no longer owns them, reopens those records, and filters the current snapshot.",
          whyTemporal:
            "The repair is inferential. It observes the resulting records after a failure rather than replaying the command that was in progress.",
          details: ["Snapshot repair", "Orphan scan", "Reopen event"],
        },
        {
          start: 57,
          end: 142,
          title: "Reconcile desired sessions with current sessions",
          purpose:
            "Selects assigned work that should wake a session, then passes a large state bundle into the session reconciler.",
          whyTemporal:
            "The procedure crosses work-store, runtime, timing, and provider boundaries inside one controller pass. None of those calls were a durable step.",
          details: [
            "Session reconciliation",
            "Desired state",
            "Runtime boundary",
          ],
        },
        {
          start: 143,
          end: 159,
          title: "Deliver the wake-up after reconciliation",
          purpose:
            "Reloads session state, sends ready-wait nudges, and runs a patrol fallback in case the wake socket lost an enqueue.",
          whyTemporal:
            "The fallback addresses one delivery gap, but it still reconstructs intent from queue and session state after the fact.",
          details: ["Nudge delivery", "Patrol fallback", "Second snapshot"],
        },
        {
          start: 160,
          end: 173,
          title: "Add another recovery lane for idle sessions",
          purpose:
            "Runs a separate backstop for a live session that received work but never claimed its trigger record.",
          whyTemporal:
            "This is the accumulated cost of missing durable procedure state: each ambiguous boundary needs its own detector and retry rule.",
          details: ["Idle-claim detector", "Re-nudge", "Repair loop"],
        },
      ],
    },
    {
      slug: "before-recovery",
      filename: "session_recovery_excerpt.go",
      label: "Session recovery",
      summary:
        "A readable abridgment of the production close-and-release path used to recover work after a session disappeared.",
      sourcePath:
        "public/temporal-agent-orchestration/code/before/session_recovery_excerpt.go",
      rawPath: `${root}/code/before/session_recovery_excerpt.go`,
      sourceUrl: `${upstreamSource}/cmd/gc/session_beads.go#L2923-L3027`,
      sourceLabel: `cmd/gc/session_beads.go at ${beforeRevision.slice(0, 9)}`,
      sections: [
        {
          start: 1,
          end: 17,
          title: "Close only from persisted session facts",
          purpose:
            "Introduces the versioned source and begins the best-effort close path with a promise that a later reconciler tick can try again.",
          whyTemporal:
            "Retry belonged to a future controller scan. There was no execution record naming which command failed or when it should resume.",
          details: ["Best-effort close", "Future scan", "No execution history"],
        },
        {
          start: 18,
          end: 55,
          title: "Commit metadata, close, then release",
          purpose:
            "Reads a snapshot, writes close metadata, closes the session record, cleans related state, and only then asks the release helper to find its work.",
          whyTemporal:
            "Each successful write creates another crash boundary. A later scan sees the writes but not the coordinator's lost call stack.",
          details: ["Ordered writes", "Crash windows", "Idempotent guard"],
        },
        {
          start: 56,
          end: 85,
          title: "Reconstruct every identity the session may have used",
          purpose:
            "Builds a set of bead, session, configured-name, and alias identities that might appear as an assignee.",
          whyTemporal:
            "Recovery has to infer ownership from several mutable identifiers because no single durable execution owns the handoff.",
          details: [
            "Identity reconstruction",
            "Assignee aliases",
            "Mutable facts",
          ],
        },
        {
          start: 86,
          end: 109,
          title: "Search open and in-progress work",
          purpose:
            "Queries every reconstructed assignee in two statuses, skips session records, and deduplicates work found through overlapping identities.",
          whyTemporal:
            "The repair cost grows with the number of representations that can describe the same logical operation.",
          details: ["Multi-query scan", "Deduplication", "Status inference"],
        },
        {
          start: 110,
          end: 127,
          title: "Reopen work without restoring its route",
          purpose:
            "Clears the dead assignee and resets in-progress work to open, passing an empty route fallback in this historical revision.",
          whyTemporal:
            "This exact path could leave completed, pushed work open but undiscoverable. A later production fix had to add another recovery contract.",
          details: ["Empty route", "Stranded handoff", "Historical failure"],
        },
      ],
    },
  ];

export const temporalAgentOrchestrationCodeSamples: AgentOrchestrationCodeSample[] =
  [
    {
      slug: "bridge",
      filename: "bridge.go",
      label: "Ready-event bridge",
      summary:
        "Delivers a durable work-store event through Signal-With-Start, then records the exact Workflow receipt.",
      ...passedAgentCanary,
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
      ...passedAgentCanary,
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
            "These fields describe procedure, so replay can reconstruct them without treating the mutable work record as a Workflow database.",
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
      slug: "outcome-workflow",
      filename: "outcome_workflow.go",
      label: "Outcome acknowledgement",
      summary:
        "Keeps a verified result visible and retrying until the coordinator records a disposition and acknowledges the exact delivery fence.",
      ...failedOutcomeReadyCanary,
      sourcePath:
        "public/temporal-agent-orchestration/code/outcome_workflow.go",
      rawPath: `${root}/code/outcome_workflow.go`,
      sections: [
        {
          start: 1,
          end: 61,
          title: "Give every result a stable execution",
          purpose:
            "Defines the OutcomeReady Workflow contract, queryable state, and stable Workflow ID derived from the immutable outcome ID.",
          whyTemporal:
            "The result is represented by a durable execution rather than a best-effort message that can disappear when the coordinator is unavailable.",
          details: ["Stable Workflow ID", "Queryable phase", "Immutable outcome"],
        },
        {
          start: 62,
          end: 146,
          title: "Rebuild state without accepting stale evidence",
          purpose:
            "Validates the envelope, restores Continue-As-New state, drains buffered duplicate signals, and rejects acknowledgements for the wrong delivery fence.",
          whyTemporal:
            "Replay and Continue-As-New reconstruct the procedure while the application-level fence prevents an old coordinator session from completing a newer delivery.",
          details: [
            "Continue-As-New",
            "Duplicate signal handling",
            "Stale acknowledgement fence",
          ],
        },
        {
          start: 147,
          end: 211,
          title: "Redeliver until the coordinator proves receipt",
          purpose:
            "Runs the notification Activity, exposes needs-ack state, waits for the exact acknowledgement, and retries both delivery and canonical acknowledgement failures.",
          whyTemporal:
            "A queued notification is attention, not completion. The Workflow remains open until the canonical store records acknowledgement.",
          details: ["Durable retry", "Needs-ack phase", "Explicit completion"],
        },
        {
          start: 212,
          end: 274,
          title: "Bound history and identify each delivery cycle",
          purpose:
            "Carries state through Continue-As-New and assigns a stable Activity ID to each logical redelivery cycle.",
          whyTemporal:
            "Activity retries within one cycle can deduplicate their side effects, while a later cycle can create fresh attention without growing one history forever.",
          details: ["Cycle identity", "Activity retry", "Bounded history"],
        },
        {
          start: 275,
          end: 350,
          title: "Wait on signals and a durable timer",
          purpose:
            "Selects between duplicate outcome signals, exact acknowledgement, and the redelivery timer while counting stale or conflicting input.",
          whyTemporal:
            "The wait survives Worker loss and remains inspectable in Event History; no polling process has to remember when to try again.",
          details: ["Selector", "Durable timer", "Exact tuple matching"],
        },
        {
          start: 351,
          end: 376,
          title: "Commit acknowledgement through a separate Activity",
          purpose:
            "Writes the acknowledgement to the canonical store with a cycle-specific Activity ID and bounded retry policy.",
          whyTemporal:
            "The Workflow only completes after the nondeterministic store mutation returns a durable receipt.",
          details: ["Canonical receipt", "Unique Activity ID", "Bounded retry"],
        },
      ],
    },
    {
      slug: "activity",
      filename: "activity.go",
      label: "Activity",
      summary:
        "Claims the exact work generation, starts or reattaches the bound agent, heartbeats progress, propagates cancellation, and fences completion.",
      promotionStatus:
        "Shown at the current implementation head rather than the canary revision: completion now also validates the source Workflow identity and clamps artifact evidence references.",
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
          end: 145,
          title: "Claim the exact generation",
          purpose:
            "Validates configuration and input, reads any prior heartbeat, claims the work item under the current Workflow identity, and rejects stale fences.",
          whyTemporal:
            "Activity execution is at least once. The generation and claim token stop a late attempt from writing into a newer run.",
          details: ["Generation fence", "Heartbeat resume", "Non-retryable errors"],
        },
        {
          start: 146,
          end: 232,
          title: "Start or reattach the agent",
          purpose:
            "Resolves one session from the claim token, resumes from heartbeat state, streams progress, and records a failed attempt before Temporal retries.",
          whyTemporal:
            "A retry attaches to the same long-running agent session instead of launching a second agent against the same worktree.",
          details: ["Start-or-attach", "Attempt record", "Session identity"],
        },
        {
          start: 233,
          end: 345,
          title: "Cancel and complete through the fence",
          purpose:
            "Targets the exact session during cancellation and writes the terminal receipt only when the generation, claim, session, outcome, artifact references, and the calling Workflow identity are all valid.",
          whyTemporal:
            "Temporal delivers cancellation and retry semantics, while the application prevents stale or ambiguous completions from being accepted.",
          details: [
            "Exact-session cancellation",
            "Fenced receipt",
            "Source Workflow identity",
          ],
        },
        {
          start: 346,
          end: 371,
          title: "Recover the last durable checkpoint",
          purpose:
            "Reads Activity heartbeat details and verifies that the checkpoint belongs to the current bead generation and claim token.",
          whyTemporal:
            "A new Activity attempt can resume from progress recorded by the Worker that disappeared.",
          details: ["Heartbeat details", "Stale-checkpoint rejection"],
        },
        {
          start: 372,
          end: 507,
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
      ...passedAgentCanary,
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
      ...passedAgentCanary,
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
            "Separate Task Queues allow the two workloads to be deployed and scaled independently, although this WorkerSet currently co-locates both pollers.",
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
  samples: AgentOrchestrationCodeSample[],
  lineCounts: Record<string, number>,
): void {
  for (const sample of samples) {
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
