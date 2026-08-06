# I put Temporal around my software factory. Here's what it fixed, and what it didn't.

*What I learned adding durable execution to a fleet of coding agents built on Gas City*

> A durable work record is not the same thing as a durable procedure.

## Cabo and Beads

In the fall of 2025, I sat next to Steve Yegge at dinner during a Sourcegraph offsite in Cabo.

Steve had brought his laptop to the table to continue working with his agents (I was just running mine from my phone instead, so I understood the impulse). Terminals running agents were scattered across his screen in a rainbow of different colors, and he kept moving between them while everyone else was doing more normal dinner activities.

I asked what he was building, and I remember the answer being something like, "Something that's going to be big."

A few weeks later, in October 2025, he published [Introducing Beads](https://steve-yegge.medium.com/introducing-beads-a-coding-agent-memory-system-637d7d92514a), a task and dependency system designed around how coding agents actually work. So the thing on the laptop at dinner really did become big. It was [Beads](https://github.com/gastownhall/beads).

[FIGURE 01: 01-cabo-dinner.png]
*Fall 2025, a group dinner at a Sourcegraph offsite: eight terminal windows open on one laptop, and the task graph that would become Beads.*

A new coding-agent context typically begins without episodic memory of the session before it, so it starts by reconstructing what the last one already learned. Beads gave me a dependency-aware work record that survives those boundaries.

On January 1, 2026, Steve published [Welcome to Gas Town](https://steve-yegge.medium.com/welcome-to-gas-town-4f25ee16dd04): an opinionated coding-agent factory built on Beads, with persistent agent identities, bounded sessions, reusable workflows called formulas, coordination through mail and nudges, and a Mayor agent, the top-level coordinating agent and human handoff point. It also came with Polecats, a Deacon, a Witness, a Refinery, and other abstractions I struggled a bit to keep straight in my head.

I forked Gas Town in early January with lofty goals of making it more vendor-agnostic, and briefly mentioned this to Steve (to which he responded "send PRs!"). But I never quite got my first town working the way I wanted, and I had a critical project at the time ([CodeScaleBench](https://github.com/sourcegraph/CodeScaleBench)) that couldn't afford to stall on dropped queues and other random orchestrator nonsense, so I reluctantly abandoned my ghost town. I could run a bunch of coding agents; I didn't know how to keep a town of them from catching fire (or, more accurately, from agents sitting around doing mostly nothing while passing around poorly translated tasks in a game of Agent Telephone).

Many of these issues were in theory resolved by a philosophy Steve called **Nondeterministic Idempotence**, or NDI: if a session ends, a later session, potentially continuing the same persistent role, can inspect the durable work record and choose another valid route to the same outcome. NDI is one of the two kinds of recovery this article is about.

In March 2026, I found a deconstructed version of the system in [Gas City](https://github.com/gastownhall/gascity), created by Julian Knutsen and Chris Sells, which took the primitives behind Gas Town and turned them into a composable orchestration SDK. Gas Town was one specific city design. Gas City gave you the building materials to create your own. I began contributing heavily in early April, and Julian invited me and a fellow avid contributor to become Gas City's first outside maintainers; I've since authored [over two hundred pull requests](https://github.com/gastownhall/gascity/pulls?q=is%3Apr+author%3Asjarmak+is%3Amerged) across session lifecycle, reconciliation, Beads integration, dispatch, and the API. I use the city to build and repair Gas City itself, which is a useful (if slightly hostile) test environment: every bug in the machinery eventually becomes a bug in the system trying to fix the machinery.

## When a town won't stay lit

That work taught me how a city actually stays humming (ish), patch by patch by patch. A claim goes stale, so I add a stale-claim reaper. Sessions wedge on a provider error, so I add a scanner that checks every session every two minutes. Each fix is small, reasonable, and correct about the failure in front of it.

By mid-July, my orders directory held roughly 100 of these patrol and repair jobs, firing about 850 times an hour. When I had my agents audit the city's reliability, they flagged the cadence itself: the repair jobs were consuming the machine they were supposed to defend, oops.

One night, the store file grew to 168 MB: 79,210 beads, 96 percent of them already closed. Because every dispatch reparsed the entire file under a lock, order firing froze. One wedged session claimed the same bead ten times over 5.6 hours. A maintenance order sat dormant for ten days before anyone noticed, because the thing responsible for checking whether orders fired was itself an order.

Another artifact from this era was a recovery flag written by one workflow so that "a reaper" could query it. But no reaper ever did. The session-recovery scanner ran every two minutes for two months, around forty thousand scans, and detected zero instances of what it existed to find.

Meanwhile, the actual repairs fell to the Mayor, who really is supposed to have better things to do than track down city infra issues. Their prompt slowly became a field manual for infrastructure archaeology: drain duplicate sessions every cycle, bypass the broken delivery path, never let a dead nudge sit ahead of a P0.

Each new reaper fixed one failure mode. It also spread ownership of the procedure across another process. The patrols checked liveness: is the process still there? But the failures were about outcomes. Did this claim launch exactly one agent? Who owns the next transition?

And every layer of protection was itself an order, watched byyyy... nothing.

I was not the only one who couldn't keep a town lit. In [The Shape of Things to Come](https://yegge.ai/essays/the-shape-of-things-to-come/), Steve writes about Gas Town in the past tense: "Gas Town was intended to be reusable, but I only ever wound up using it to build itself." And on the exact thing I had been chasing with reapers: "I did know that Gas Town never quite succeeded in getting my workers to go all night long. It took too much elbow grease to keep it running. There were some missing ingredients somewhere." It never became the self-running loop he was after: "It was more like a chariot, with you driving."

He responded by building a new harness, Wheelhouse, "closed-source, made just for me." I went looking instead for what those missing ingredients were. I really wanted Gas City to just work, not to do detective work every time something stopped moving, or chase down why a second agent started editing an already-claimed branch.

## The task survived. The procedure did not.

The problem became clearer through one recurring failure. A work item becomes ready. The Mayor claims it and launches a coding agent. The agent gets a worktree, edits files, runs tests, and works for an hour. Then the Mayor's session abruptly ends before recording the handoff.

After restart, the system basically has three bad options. It can launch another agent and leave two processes editing the same worktree. It can wait indefinitely for a process it no longer knows how to contact. Or it can release the claim and ask a repair loop to reconstruct what happened from whatever evidence the first process left behind. At different points, I ran versions of all three.

The procedure existed only as clues scattered across controller ticks, session records, mail, hooks, process state, and repair logic.

[FIGURE 02: 02-reconstructing-the-procedure.png]
*Reconstructing the procedure from stale claims, half-delivered mail, and whatever process happened to still be alive.*

At enough scale, those clues become useless. I saw stranded claims, duplicate sessions after retries, stale completions arriving after a newer generation had started, and correlation metadata pointing at executions that did not exist.

The work record survived. What the system lost was the procedure connecting one state to the next.

## Two kinds of recovery

So how do we handle work transition and continuity in the face of inevitable failure and nondeterminism?

NDI is one answer, and a good one where any reasonable path to an acceptable outcome is valid, which describes a lot of agent work. Coding itself is nondeterministic: two agents can solve the same issue in very different ways, and either result may be fine (unless you're a [SWE-Bench verifier](https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/)).

But some parts of an orchestration system are promises rather than work:

- Did this claim already start an agent?
- Does this result belong to the current generation?
- Has this exact outcome been acknowledged?
- Is a retry resuming the same execution or creating a competing one?
- Which recovery action owns the next transition?
- Should a late completion still be allowed to mutate the work record?

Those are procedural questions, and "a capable agent will inspect the clues and figure something out" is not the guarantee I want. The flaw was asking an NDI-style recovery model to own guarantees whose ordering, retries, waits, identities, and acknowledgements were themselves the contract. For those parts, I need more determinism. ([Persistent agent state, durable workflows, and idempotent retries](https://sjarmak.ai/books/engineering-reliable-coding-agents/persistent-state-durable-workflows-idempotent-retries/) takes that split further.)

By this point, [my research on coding-agent failures](https://www.sjarmak.ai/library/explorers/enterprise-reliability) had convinced me that reliability depends as much on the system around the agent as on the agent itself. Gas Town can kinda be described as "Kubernetes for agents," so I read [Designing Distributed Systems](https://www.oreilly.com/library/view/designing-distributed-systems/9781491983638/) against Gas City's controller: leases, transactional outboxes, stable identities, generation fencing. That toolbox supplied necessary pieces, but no durable owner for the sequence connecting them. Then I remembered Steve saying Gas Town looked like what you'd get if Kubernetes and [Temporal](https://docs.temporal.io/temporal) had a very ugly baby together, and that he had likened NDI to Temporal's deterministic durable replay through completely different machinery, and he was explicit that Gas Town was not a replacement for Temporal.

In Temporal's model, a [Workflow](https://docs.temporal.io/workflows) records a deterministic procedure in an [Event History](https://docs.temporal.io/encyclopedia/event-history). When a [Worker](https://docs.temporal.io/workers), the process executing Workflow code, crashes, another Worker can replay that history, reconstruct the Workflow's state, and continue from the recorded boundary. External and nondeterministic effects run in [Activities](https://docs.temporal.io/activities).

The two models differ on three things. **After a crash,** Nondeterministic Idempotence lets a new agent find another valid route, while deterministic durable replay requires ordering and acknowledgement to remain exact. **Recovery** under NDI means inspecting the durable work record; under replay it means replaying the durable history. And the **owner** differs: Beads and Gas City for the first, a Temporal Workflow for the second.

The two models are complementary: a durable work record preserves what was learned and what remains to be done, and a durable procedure preserves the system's outstanding promises.

## The boundary I chose

> Put the unpredictable agent inside an Activity. Put the procedure around it in a Workflow.

The integration settled on three owners.

Beads owns the work state: tasks, dependencies, claims, generation fences, claim tokens, artifacts, outcomes, and acknowledgement receipts. It remains the canonical record of mutable work facts, and a user or agent can inspect the work without going through Temporal.

Temporal owns the procedure: what the system is waiting for, which retry is active, and what may safely happen next after a crash.

The application owns the effects: agent processes, tests, reviews, external messages. An Activity is where Temporal hands control back to my code. What the Activity touches, and whether touching it twice is safe, remains my responsibility.

[FIGURE 03: 03-ownership.png]
*Fenced completion checks travel both ways: Activities report completions carrying the generation and claim token, and Beads accepts only a completion that still matches the canonical claim.*

Think of Gas City as a workshop. Beads is the job board: it records the work, who owns it, what depends on what, and what happened. Coding agents are the workers, and their path through a job is whatever they decide is best. Temporal is the clipboard on the wall: one step ticked off, one waiting, one retry pending after the inevitable mishap.

[FIGURE 04: 04-workshop.png]
*Beads holds the work, the agents do it their own way, and Temporal keeps the running checklist of what already happened.*

So why not store the procedure in the database I already run? That is the standard controller answer: "a query, not a memory." It fails when the store cannot tell the difference between two procedures that leave behind the same records. In one twenty-hour stranding, two work items finished and pushed their branches, but the worker died before recording completion. The proof was sitting on origin; the store held an open item with an empty next-step field, which is exactly what work that never started looks like. Both watchers keyed on that field, the probe that launches more agents and the sweep that hunts abandoned claims, and neither saw anything wrong.

Once those repairs had become an implicit workflow system, I preferred adopting a durable one over building it incident by incident.

## The three failures I wanted Temporal to stop

The implementation focused on three concrete breakpoints. The first two are still in shadow; the third runs in a scoped canary.

**1. A crash between claiming work and launching the agent.** The system could record that work was ready and then die while delivering the event that launched its execution. The naive fix is a retry: if the launch never happened, send the event again. That is safe only if the second send cannot start a second execution, which nothing in the old path guaranteed. Temporal contributes a stable [Signal-With-Start](https://docs.temporal.io/develop/go/workflows/message-passing#signal-with-start): a bridge hands the pending event to a Workflow ID derived from the city, run, and work item. What stays my job is the crash window that does not disappear: Temporal can accept the event, then the bridge can die before acknowledging the delivery record. So the event is delivered again, and the Workflow ignores an event ID it has already processed. Stable identity turns redelivery from an anomaly into expected behavior, within Temporal's retention window; past that, the generation fence, not the Workflow ID, keeps a late duplicate out.

**2. A retry accidentally starts a second agent.** Temporal Activities may execute more than once. A Worker can die after an external effect succeeds but before Temporal records its completion, so "Temporal will retry it" is not, by itself, safe for starting coding agents. Temporal contributes retry scheduling, heartbeats, and cancellation delivery, all recorded durably. Identity is still mine to get right. The Activity claims one exact work generation and receives a fencing token, and a trusted adapter uses that token either to start the session once or to return the session already bound to that claim. The adapter that answers which session already owns a claim is the piece Temporal cannot supply, and only test fixtures have implemented it. What keeps a retry from becoming a second agent is not the heartbeat: a Worker can die before the first heartbeat ever lands. Completion is fenced too: Beads accepts a receipt only when the work ID, generation, claim token, and Workflow identity still match.

[FIGURE 05: 05-recovery.png]
*The retry has to find the session that already owns the claim rather than mint a second one.*

**3. A completed result is never acknowledged.** This was the failure I got wrong first. The initial canary appeared to work: the Workflow completed, and the agent produced a valid result. Buuuuut, the Mayor never learned that the result existed. I had treated mail and session nudges as if successful delivery meant successful receipt (nope). A notification can wake an agent, but it cannot prove the agent reviewed and acknowledged a specific result. Temporal contributes the durable wait: each verified result creates an OutcomeReady record and a Workflow that notifies, waits, and redelivers while the result stays pending. I still have to define what counts as an answer: the Workflow closes only on an acknowledgement bound to the exact store, work item, outcome, generation, and session fence.

## The canary failed, but that's why we use canaries

The result-delivery path didn't land cleanly. Its first full-integration canary hit a failed promotion gate and exposed four real defects: concurrent notifications contended on a shared mail store; correlation metadata named a Workflow that did not exist; an observer confused a completed formula step with its still-running source task; and legitimate completion paths closed real work without producing an OutcomeReady envelope at all.

[FIGURE 06: 06-canary-gate.png]
*The canary came back with four things wrong, so the gate stayed shut. That is the canary doing its job.*

The Mayor rolled the integration back to shadow, repaired the delivery path, and ran a bounded recovery that delivered and acknowledged the stranded results.

This was somewhat disappointing, but it's also why I put in explicit canaries and promotion gates, so at least we learned something. Temporal made the procedure observable enough that failures became specific and recoverable. You learn what a recovery path does by killing it on purpose, which is the argument of [Replayable traces and fault-injection recovery testing](https://sjarmak.ai/books/engineering-reliable-coding-agents/replayable-traces-fault-injection-recovery/).

## What it cost, and what it didn't solve

Temporal gives a procedure a durable owner. It does not make external effects happen exactly once. A Worker can die after an external API call succeeds but before Temporal records the Activity completion, and Temporal may then run the Activity again. Generation fences make repeated Beads writes safe, and start-or-attach semantics keep retries from launching duplicate agent sessions. But GitHub and Slack do not acquire exactly-once behavior because their calls came from a Temporal Activity. If an Activity posts to Slack ([I set my agents up to do that](https://www.sjarmak.ai/writing/slack-as-my-agent-orchestration-interface)), safe repetition depends on that destination's idempotency model.

It also preserves mistakes as faithfully as correct behavior. In one canary, the agent completed its work correctly, but an adapter placed the wrong store identity in the outcome envelope. Temporal retried the same invalid envelope every fifteen minutes, exactly as instructed, until I rolled the canary back. Durable execution made the failure persistent and observable rather than silent. It could not correct it.

[FIGURE 07: 07-durable-wrongness.png]
*Durable execution repeats a wrong instruction exactly as faithfully as a right one.*

The costs are real. Workflow code must stay deterministic and previously recorded histories must keep replaying, so every orchestration change needs compatibility planning and replay tests. The system gains a server, Workers, and rollout machinery. Debugging now requires knowing which of two durable records answers the question in front of you. Not every job justifies that. My first pilot was a maintenance job that runs forty-four seconds every two hours, and it stayed cron plus a lockfile, because a crash there leaves no in-flight procedure the database can't explain.

Beads mode stays shadow until that adapter exists in production. Outcome mode runs as a canary that has not been promoted to enabled; within it the path has delivered and acknowledged more than seventy outcomes, with no silent outcomes detected. That shows the integration works under the canary's current load. It does not show that Temporal has reduced stranded claims or duplicate sessions; that comparison becomes valid only after the claim-to-session path takes production ownership. Same-host Worker recovery is supported. Cross-host recovery has not been demonstrated: that adapter finds the running session from host-local state, its tmux session and worktree, so a Worker on another host has nothing to look up.

## What transfers

The transferable part is the division of responsibility. Stable identity lets a retry continue the same logical operation instead of starting another one, which is continuity, not just duplicate prevention. External effects remain the application's responsibility. Everything past that follows from the workload: a Gas City agent that may edit a Git worktree for an hour and keep running after the Worker that launched it has died needs fencing, session reattachment, an exact acknowledgement, and an independent watchdog. A short, idempotent Activity would not.

The useful question is not which framework should own the system. It is which guarantees must survive a crash.

The city will still stall and catch fire. The goal is not to prevent every failure, but to keep one failure from turning into a chain of repairs. A missing coordinator should not erase the ownership of a session that is still working. A restarted Worker should not create a second agent because it cannot remember the first.

> Durable execution is not only about surviving process failure. It is about choosing which forms of continuity the system refuses to lose.

Steve rebuilt the harness instead. Wheelhouse, he writes, "has found its way to being roughly the same shape as Gas Town, but without the scars," and he reads that convergence as inevitable: "I didn't design Wheelhouse, just like I didn't design Gas Town. I excavated both of them, and I'm confident you'll dig up the same shape." I think he's right about the shape. What I keep digging up inside it is the seam between the work and the promises around it.

**Going deeper.** The [full annotated version](https://www.sjarmak.ai/temporal-agent-orchestration/article) has the recordings and the evidence bundle, and the [annotated source reader](https://www.sjarmak.ai/temporal-agent-orchestration/code) renders every before and after file. [Engineering Reliable Coding Agents](https://sjarmak.ai/books/engineering-reliable-coding-agents/) is the guidebook this is a field report from.

---

*Originally published at [www.sjarmak.ai](https://www.sjarmak.ai/writing/temporal-around-my-software-factory).*
