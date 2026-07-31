---
title: "Replayable traces and fault-injection recovery testing"
book: engineering-reliable-coding-agents
order: 9
part: 3
kind: chapter
number: 9
---

Vogel et al. ([2024](https://arxiv.org/abs/2404.06203)) injected pod kills and recurring failures into Apache Flink, Kafka Streams, and Spark Structured Streaming on a Kubernetes testbed under representative load. Apache Flink was the most stable of the three and had one of the best recovery profiles, which contradicted earlier published fault-recovery comparisons. The effect of a failure also changed across successive failures. A test that stopped after one successful restart could not have detected that variation.

Fault tolerance is usually inferred from an architecture diagram. A checkpoint appears before a restart arrow, and the design is then described as 'fault tolerant'. A diagram of that kind is a hypothesis about the running system, and only measurement tests it.

Agent runtimes present the same measurement problem. A runtime may preserve state, retry interrupted work, and isolate external effects in its architecture, and still recover incorrectly when a timeout, a persistence boundary, a software version, or a fault location changes the behavior of the running system. Two practices make the recovery claim testable. A typed event stream preserves enough structure to inspect and replay a run. Fault injection then forces the runtime through the intervals its recovery design claims to protect.

The evidence here is uneven. Four items support the chapter's two entries. Two are explorer-class and two are literature-class, and only one of the four, the fault-recovery benchmark, is a strong study. No strong study supports the trace argument. I therefore treat typed traces as an instrumentation design supported by demonstrations and a specification, and prescribe measurement rather than a universal recovery threshold.

Recorded state, as Chapter 8 established, can make a run resumable. Replay adds a stricter requirement. The system must know which events produced the recorded state, which work may be repeated, and at which point a changed decision invalidates the old path. Recovery testing adds a third. The runtime must exhibit the claimed behavior when faults arrive at inconvenient times, not only when a demonstration script kills a process at a clean boundary.

## What a transcript cannot answer

Consider the first question an operator asks after an agent sends the same payment instruction twice. Did the tool execute twice, or did one execution produce two visible records? A transcript might show two assistant messages and two tool-shaped responses. It usually cannot establish whether the first request reached the payment service, whether the service committed it, whether the runtime received the response, or whether the runtime persisted that response before restarting.

The design argument in this section rests on demonstrated uses of typed traces. Yu et al. ([2026](https://arxiv.org/abs/2605.10913)) described a runtime substrate whose recorded executions can be forked and re-run from a changed step, and Zheng et al. ([2025](https://arxiv.org/abs/2508.02736)) described system-level agent observability collected below the application. Neither work compared typed traces against transcript-only observability in a controlled setting. The portability half of the argument rests on the OpenTelemetry GenAI semantic conventions (CNCF 2025), which define a shared vocabulary without testing whether adopting it improves portability.

A transcript represents a run as utterances. That representation is useful for reading prompts and model outputs, but it compresses several distinct kinds of event into similar-looking text. A model response, a tool request, an environment mutation, and a durable state transition can all appear as adjacent messages even though they have different owners and different failure semantics. Once the runtime crosses a process boundary, adjacency in a transcript is weak evidence of causal order.

A typed event stream preserves those distinctions. Each record declares what occurred, which component produced it, which run and step it belongs to, and how its state relates to earlier records. A model-call record may contain the model input reference, output reference, timing, token accounting, and completion status. A tool-invocation record may describe dispatch, acknowledgment, returned data, and an external-effect identifier. A state-transition record may name the prior state it consumed and the new state version that became durable. The payloads need not share one shape merely because they share one stream.

The difference becomes operational during a partial failure. Suppose an agent decides at step 17 to create a support ticket. The runtime emits `tool_call_dispatched`, the ticket service creates ticket 8421, and the worker dies before the runtime writes `tool_result_persisted`. A transcript assembled after restart might omit the first call or show only an unanswered request.

A typed stream can represent the absence precisely. Dispatch occurred, external commitment is known or still uncertain, and durable result persistence did not occur. That state does not settle the recovery decision, but it tells the recovery code which uncertainty it must resolve.

Causal structure is therefore the property I instrument for, and the trace viewer's visual details are secondary. The stream should make ownership and ordering queryable. For every agent-originated output or action, the schema should include an agent identifier. For every tool call, it should also include the reasoning-step identifier that selected the action and the session identifier in which that decision occurred. Those joins allow an operator or a policy layer to compare intent with effect, and to alert when a tool call is attributed to a step that never authorized it.

Those identifier fields come from governance analysis rather than deployment measurements. Chan et al. ([2024](https://arxiv.org/abs/2401.13138)) named agent identifiers on agent-originated outputs and actions, real-time monitoring of clear-cut violations, and retained activity logs as visibility mechanisms for agent governance. They are plausible controls with an unmeasured failure-prevention effect. The same analysis flagged their costs. Stable cross-system identifiers can expose sensitive relationships among users, agents, and actions, and a central trace store can concentrate observational power. A useful design specifies access control, retention, and redaction alongside joinability, because a trace that omits them improves operational visibility by building an unbounded surveillance record.

### Replay from a changed step

Replay means reconstructing a run from recorded events while re-executing only the portion that must change. The simple case begins with a durable state at step 16, replaces the decision logic or input at step 17, and executes the suffix from there. The earlier prefix remains evidence of what happened, and it is not regenerated as plausible prose. This depends on Chapter 8's recorded state, but recorded state alone does not identify which downstream events became invalid when step 17 changed.

The event stream supplies that dependency path. Each state transition refers to its inputs, each action refers to the reasoning step that selected it, and each result refers to the action that produced it. When step 17 changes, the runtime can mark dependent results as invalid and retain independent results. This narrow form of provenance-driven re-execution repeats only the work a change invalidated. More elaborate provenance schemes belong in the companion catalog. The requirement here is that the trace retain enough identity to compute the invalidated suffix.

Replay also has to separate deterministic control from nondeterministic activity. Model responses, wall-clock reads, random choices, and external calls cannot be assumed to return the same value a second time. A replayable runtime records those observations as events and replays deterministic control code against them when the old behavior should be reproduced. When the purpose is to test a changed step, it replaces only the selected observation or decision and records a new branch. The companion pattern on recording nondeterminism develops that separation in full.

Branching creates a data-model question that transcripts usually evade. The replacement at step 17 must not overwrite the original step 17, because the old branch is part of the evidence. The new event should reference the prior event it supersedes and the replay operation that created it. Downstream events then belong to either the original branch or the changed branch. Without branch identity, a trace can appear internally consistent while mixing state transitions from incompatible executions.

The same structure supports the golden sets introduced in Chapter 4. A useful golden case need not consist only of a prompt and an expected final answer. It can retain the sequence of typed decisions, actions, observations, and state transitions that made the answer possible. A regression test can then compare the properties that should remain stable while allowing an intentionally changed step to alter its descendants. The event stream is also the substrate for a supervisory layer, because supervision requires an object to inspect and an unambiguous point at which to intervene.

My own trial-annotation pipeline, which structures the per-trial output of diagnostic agent runs, illustrates the join problem without establishing general efficacy. It ingests standard harness output into 31 structured fields per trial and assigns a stable join key. Its annotation store includes provenance in the primary key, so two annotators can describe the same trial without overwriting one another. The lesson is architectural. Identity belongs in the stored record, not in a filename convention or an analyst's memory.

My own durable-execution demonstration harness provides a second illustration. It judges recovery invariants against an append-only ledger with distinct records for run start, injected kill, worker restart, replay completion, invariant checks, committed side effects, detected duplicates, and model calls with cost fields. A prose log could state that recovery succeeded. The ledger allows a check to ask whether replay completed after restart, whether any side effect committed twice, and which model calls contributed to the recovered run.

Neither illustration shows that typed traces outperform transcripts in a controlled setting. They show what becomes mechanically queryable once a runtime preserves event type, identity, order, and provenance. That distinction supports an instrumentation decision when the required query cannot be answered from the existing artifact. It does not support a claim that the instrumentation will reduce incident duration or improve recovery correctness by a predictable amount.

### A shared vocabulary and its limits

The OpenTelemetry GenAI semantic conventions define common names and attributes for telemetry emitted by generative-AI systems. Their value is syntactic coordination. A runtime, a collector, a storage system, and an analysis tool can exchange records without every pair inventing a translation for model identity, operation type, token usage, or agent activity. Shared conventions reduce the number of bespoke assumptions that become hidden dependencies in an observability pipeline.

Specification status is itself the evidence boundary. The conventions do not demonstrate that a trace produced by one agent runtime can be replayed by another, and they do not require enough information to reconstruct application state. Telemetry portability and execution portability are separate properties. A shared event name can help two tools agree that a model call occurred while leaving them unable to agree on how the call changed workflow state.

Instrumentation should therefore begin with the shared GenAI vocabulary and extend it only for the fields a workload actually requires. Replay may require state-version references, branch identity, external-effect identifiers, persistence status, or a digest of a large payload stored elsewhere. Those extensions should remain explicit and documented. A bespoke schema may fit one runtime more closely, but every private field moves translation cost to collectors, tests, migration tools, and future runtimes.

Complete instrumentation is the harder constraint. If the runtime records a tool request but the tool wrapper omits the external commitment, the trace preserves the transcript's ambiguity in a more structured form. If records remain in the worker's memory until a batch flush, a kill can remove the events needed to explain the kill. If clocks are unsynchronized across processes, timestamps can imply an order that never occurred. The stream needs durable persistence and causal identifiers, not merely timestamped JSON.

Typed events also do not make effects idempotent, restore corrupted state, or decide whether an uncertain call should be repeated. They expose where the uncertainty lives. A recovery mechanism must still reconcile external state, enforce deduplication, and choose an admissible continuation. A restore point must also be checked against downstream commitments, because local state can be internally valid after observers have already seen a later effect. The companion catalog treats that boundary as certification against downstream commitments.

Long histories introduce a cost that correctness arguments can obscure. Replaying a complete run may require reading and validating thousands of events before useful work resumes. Splitting long workflows at durable semantic boundaries can bound recovery to a short suffix, as described in the companion pattern on replay-history limits. The split changes where state lives and which prior commitments must be summarized, so it should follow measured recovery requirements rather than an arbitrary event count.

Transcript-only observability remains attractive because it is easy to render and resembles the interface through which people interact with a model. I still keep transcripts, as a derived view rather than as the recovery record. The durable artifact is the typed stream. A transcript is one projection over selected event types. That relationship preserves readability without allowing a presentation format to erase the causal information recovery requires.

## Recovery is a measured property

Vogel et al. (2024) did more than establish that injected failures degrade performance. Their direct measurements of recovery reversed conclusions drawn in earlier published comparisons, and the effect of a fault was not constant across successive failures. Software configuration, workload, accumulated recovery state, and fault timing all participated in the observed result. The useful response is a protocol that makes those conditions part of the claim.

An architecture diagram describes intended control flow. It may show a worker reading a checkpoint, replaying events, and resuming output. The drawing cannot establish how long failure detection takes, whether retry queues compete with live work, whether a restored worker rebuilds caches, or whether an external effect occurred before its completion record became durable. Those behaviors emerge from the interaction of runtime, persistence layer, network, workload, and deployment configuration.

Fault injection forces that interaction to occur on demand. Kill a worker or a pod, interrupt an external call, terminate the process during persistence, and repeat the disturbance while representative work is active. The purpose is to estimate recovery behavior over a declared fault menu and operating envelope, with faults placed at inconvenient times.

### Specify the claim before the kill

I begin by writing the recovery claim in observable terms. A useful claim names the fault, the protected state or effect, the expected continuation, and the measurements that decide whether the continuation was acceptable. A worked claim reads like this. After an ungraceful worker kill during ticket creation, the runtime resumes the interrupted run without creating a second ticket, reproduces the final response of the clean reference, and returns to the declared throughput range. Each clause points to an observable event or measurement.

The control run uses the same workload and configuration without an injected fault. This applies Chapter 2's control logic to recovery. The difference between the faulted run and the clean run estimates the effect of the injection within the tested conditions. When exact output comparison is possible, I retain a content digest or a canonicalized output from the clean run. When model nondeterminism prevents byte equality, I compare the deterministic state and effects that the recovery contract actually constrains, and I state which outputs remain incomparable.

The faulted run needs more than a final pass indicator. At minimum, measure failure-detection time, time until useful work resumes, time until throughput stabilizes, post-recovery throughput, latency during and after recovery, duplicated or missing effects, and output equivalence to the clean reference. Queue depth, retry count, checkpoint age, and cache state may explain those measurements, but they should not replace the outcome metrics. A system can restart quickly while delivering low throughput or committing duplicates for several minutes.

Recovery time also requires a declared start event and a declared end event. Starting at process death and ending at process creation measures orchestration latency rather than application recovery. For a user-facing run, the interval may begin at the last confirmed useful event before the kill and end when the interrupted run commits its next correct state transition. For a streaming workload, the end may require backlog clearance and stable throughput. Different definitions answer different questions, so the event definitions belong beside the number. The clean control has to use the same two events, because a recovery time compared against a differently anchored baseline measures the anchoring instead of the recovery.

A single restart demonstrates one recovery, but estimating stability requires repetition. Repeated faults connect recovery testing to Chapter 1's repeated-runs discipline. Recovery impact is a distribution across runs and across recurring failures. Schedule multiple injections within a run as well as independent runs from a clean starting state. The first reveals accumulated effects such as queue growth, leaked leases, enlarged histories, and cache churn. The second separates those effects from ordinary run-to-run variation.

Recurring failures deserve their own sequence position in the data. If the third kill produces a longer outage than the first, a pooled mean hides a stateful degradation. Plot or tabulate recovery metrics by failure ordinal and retain the individual observations. The sample may still be too small for a stable population estimate, but the raw sequence can show whether recovery changes as faults accumulate.

### Strike the interval the design claims to protect

The most informative kill point is rarely the boundary between steps. Chapter 8 identified the execute-then-log window. An external system may commit an effect after the runtime sends the request and before the runtime durably records completion. A recovery design that claims exactly-once visible effects or safe retry has to hold when the process dies inside that gap, and the test should place a kill there deliberately.

A worst-case protocol sends an ungraceful kill from inside the active step, after the external call returns and before the completion marker is written. The process exit status must confirm that the kill occurred. If the step reaches its normal return path, or the harness reports another exit mode, the trial is invalid rather than a passing recovery. This check prevents an imprecise injection from testing a clean boundary while claiming to test the vulnerable interval.

The harness must not repair the system it measures. It may schedule the kill and observe the typed event stream, but recovery knowledge must come from the runtime's own persisted state and recovery mechanism. If the harness ledger tells the replacement worker which call completed, the experiment has supplied information the deployed system may not possess. The resulting pass would measure the runtime and the test fixture together rather than the runtime's recovery property.

I use a negative control to detect that error. A naive adapter restarts the workflow from its initial step without reconciliation or deduplication. At every kill point after an external commitment, that adapter should violate the no-duplicates invariant. If it passes, the harness may be suppressing effects, leaking recovery state into the adapter, or failing to place the kill where claimed. A control expected to fail is worth running here, because a false pass is otherwise easy to mistake for fault tolerance. It also detects only the defect it was built to expose, and a subtler recovery error can still pass both arms.

The kill-point sweep should include boundaries before dispatch, after dispatch but before external commitment, after commitment but before local acknowledgment, after acknowledgment but before the durable state transition, and after that transition. These points are not interchangeable. The first tests whether unstarted work can be rescheduled. The middle points test ambiguity and deduplication. The last tests the runtime's recognition of completed work and its suppression of repetition. A step with several external effects has one such sweep per effect.

![Five lifecycle kill points test recovery from unstarted work through ambiguous commitment gaps to durable completion, including recognition and suppression of repeated external effects.](/book-figures/ch09-kill-points.svg)

Each external effect requires its own sweep, with a deliberate kill in the gap between external commitment and local acknowledgment.

Calls that can hang or return partially add another fault class. Interrupt the connection, inject a retryable response, delay the response beyond the worker heartbeat, and deliver a late response after the retry has begun. The runtime must distinguish a request known not to have executed from one whose status is uncertain. Treating both as ordinary retryable failures converts transport ambiguity into duplicated effects.

Redeployment adds versioned state to the protocol. Kill or replace a worker while a run is active, then resume it with patched code. The event schema, the serialized state, and the deterministic replay path may each cross a compatibility boundary. A restart that succeeds with the same binary does not test that case. The configuration record should therefore name both the pre-fault version and the recovery version.

History growth is another boundary condition. A short demonstration can avoid the replay costs and rollover behavior that appear only after many events. Run beyond the runtime's history rollover or compaction threshold, and inject faults on both sides of that boundary. Compaction replaces working history with a condensed representation so the run stays inside the context budget. The companion pattern on bounding replay history addresses the architectural response, while the experiment establishes whether the current boundary behaves as intended.

The fault menu should ultimately come from observed production faults rather than from what the harness can inject easily. Worker kills are useful because they are reproducible and severe, but they do not cover slow storage, stale leases, delayed acknowledgments, partial network partitions, quota errors, or malformed persisted state. The companion catalog's realistic-fault-menu pattern gives the fuller construction method. The narrower requirement here is to publish the menu so readers can see what the recovery claim excludes.

### Keep the result attached to its envelope

My own kill demonstration, an **unverified working artifact**, illustrates the protocol without extending the literature evidence. In that run, a worker was killed during an activity after one retryable fault had been injected. The recovered run passed 13 of 13 invariant checks, the interrupted activity resumed through a heartbeat-timeout retry and used a cached path, and its output matched the clean reference byte for byte by content hash. Thirteen of thirteen is a satisfying line to write down, and it describes one kill placement in one configuration.

I can say that the running system exhibited the specified invariants in the tested trial. I cannot infer that the engine is generally fault tolerant, that a different activity would take the same path, or that another software version would preserve the result. Vogel et al. (2024) is the reason for that restraint. Recovery comparisons changed once configurations and recurring faults were measured directly.

My own publish-gate protocol, also an **unverified working artifact**, expands the intended experiment. Its first gate injects failure in continuous integration at a randomized kill point. Its fault matrix includes a kill during a model call, a kill in the execute-then-log gap, a redeployment with patched code during an active run, and execution to three times the history-rollover threshold. Randomization broadens placement, but it does not remove the need for a fixed sweep over named high-risk intervals.

No cross-engine comparison follows from those artifacts. My comparison sweep was never run, and the non-naive adapters remain specification stubs. There are no author-generated comparative engine measurements to report. An interface diagram showing multiple adapters can look like an experiment even when no workload has passed through them.

Configuration should travel with every published result. Record runtime and engine versions, deployment topology, persistence settings, checkpoint interval, retry policy, heartbeat and timeout values, resource limits, workload shape, concurrency, input rate, external-service behavior, fault-injector version, kill-point definition, and metric definitions. Preserve the typed trace, or an appropriately redacted derivative, so another investigator can reconstruct event order. Without those details, a recovery number is difficult to interpret and impossible to reproduce closely.

Results age as the stack changes. A new scheduler, storage client, default timeout, or checkpoint implementation can alter both fault detection and state restoration without changing the architecture diagram. A passing experiment establishes behavior only within the tested envelope. Re-run it after changes that affect persistence, concurrency, retry, version compatibility, external calls, or resource allocation.

Correctness, reliability, and performance should remain separate in the report. No duplicate effect and no missing state are correctness properties of a particular trial. The frequency with which those properties hold across injections is a reliability measurement. Recovery time, latency, and throughput are performance measurements.

Resource consumption and extra model calls affect cost, and an operator's ability to understand or safely initiate recovery is a usability property. One combined recovery score conceals which of these properties failed.

A recovery system may also need to withhold action when it cannot classify the failure safely. The companion pattern on diagnosing before gating recovery covers that policy. Another companion pattern asks whether recovery can remain invisible to downstream observers except as monotonic progress. Neither property follows from a successful restart, so I keep both outside the basic pass criterion unless the system explicitly claims them.

## A protocol for trusting recovery

Before crediting a recovery claim about an agent runtime, I look for two linked artifacts. The first is a durably persisted typed event stream that distinguishes model calls, tool dispatch and completion, environment changes, external commitments, and state transitions. I begin with the shared OpenTelemetry GenAI conventions, then add explicit state, branch, and effect fields only where the workload requires them. Every agent action names its owner, and every tool call can be joined to the reasoning step and the session that authorized it.

The second artifact is a fault-injection result produced under representative load. I run a clean control, kill a worker from inside an active step, and place at least one kill between an external effect and its durable record. I repeat the injections within runs and across independent runs, because the first restart does not characterize the behavior of later ones. The harness confirms that the kill occurred, observes recovery without supplying it, and checks a naive negative control that should duplicate effects.

I measure recovery time from declared application events rather than from process restart time. I retain post-recovery throughput and latency, invariant outcomes, duplicate and missing effects, and output equivalence against the clean control. When exact equivalence is impossible, I state the constrained properties and the remaining nondeterminism. A pass means that the runtime met those conditions for the tested trials.

The fault menu and the complete configuration belong with the result. They define the envelope within which the claim is valid and provide the basis for rerunning it after version or deployment changes. A reader should be able to identify which intervals were struck, which faults were omitted, how recurring failures behaved, and which measurements separated correctness from performance and cost.

This protocol does not convert one engine into a universally reliable one. It produces a narrower and more useful statement. Under a recorded workload and configuration, with specified faults placed at specified boundaries, the runtime recovered with measured behavior and preserved named invariants. That statement can be challenged, repeated, and revised when the system changes.

A trace worth replaying is also the artifact a human reads when the run fails, but even a complete trace does not establish which action caused the failure, or how a person can defend that attribution.

## Sources and evidence

### Make every run a structured, replayable trace

- explorer/directional: Shepherd runtime substrate (Yu et al. 2026, arXiv:2605.10913); companion material named in the same synthesis without a paper identifier: OpenTelemetry GenAI conventions (CNCF 2025).
- explorer/directional: AgentSight eBPF observability (Zheng et al. 2025, arXiv:2508.02736).
- lit/directional: Chan, A., et al. (2024), "Visibility into AI Agents," ACM FAccT 2024, arXiv:2401.13138.

### Benchmark recovery with fault injection

- lit/strong: Vogel et al. (2024), "A Comprehensive Benchmarking Analysis of Fault Recovery in Stream Processing Frameworks," arXiv:2404.06203 (JSS line).

Author-system cases are narrative illustration, not evidence. The kill demonstration and publish-gate protocol are unverified working artifacts.
