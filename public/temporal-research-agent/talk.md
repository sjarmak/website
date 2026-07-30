# Talk plan: Temporal lets us bring a research agent back to life

Target: 12 minutes, with room to land between 10 and 15.

The audience already understands distributed systems. Define the boundary
choices precisely, show the failure evidence, and avoid implying that the
workstation-only MCP integration is a public quickstart.

| Slide | Topic | End time |
|---|---|---:|
| 1 | Failure as proof | 0:50 |
| 2 | Before and after code | 2:15 |
| 3 | Crash windows | 3:15 |
| 4 | Workflow and Activity boundary | 4:40 |
| 5 | External-call request contract | 5:55 |
| 6 | Durable agent skill | 7:05 |
| 7 | Worker kill | 8:30 |
| 8 | Completion evidence in terminal and Temporal Web | 9:50 |
| 9 | Portable evidence and workstation-only runtime | 10:45 |
| 10 | What Temporal changed | 12:00 |

## Before people enter

On the configured workstation:

```bash
cd /home/ds/temporal_devrel/presentation/temporal-literature-review
uv run pytest -q
```

Open:

1. `deck.html` full screen in a browser.
2. The final recording at
   `demo/out/temporal-literature-review-demo.mp4`.
3. A terminal at the project directory.
4. Temporal Web at <http://127.0.0.1:8723> if running the internal live
   harness.

The recorded frames are the primary proof. The optional live kill uses fixture
evidence and a private Temporal server. Keep live MCP mode out of the talk.

## 0:00–0:50, slide 1: Open with the failure

Say:

> This research pipeline had already produced work for us. We rewrote its
> orchestration with Temporal's Python SDK, killed the Worker while two
> research Activities were running, and required the same Workflow run to
> finish.

> The useful questions are which state becomes durable, where nondeterminism
> belongs, and which failure boundaries remain ours.

## 0:50–2:15, slide 2: Put the old and new code side by side

Say:

> The JavaScript on the left came from our Code Intelligence Digest research
> pipeline. Ten episode branches performed research, deep dives, and scripts;
> two literature reviews fanned in at the end.

> The orchestration is concise, but progress belongs to the client process
> and whatever files it managed to write. The Python on the right gives one
> external step an explicit Activity name, timeout, heartbeat timeout, retry
> policy, and typed result.

Point to the full before snapshot and Python replacement named in the footer.

## 2:15–3:15, slide 3: Name the crash windows

Say:

> Retrieval can return before the process records it. A file can exist before
> the client records completion. One branch can fail after the others have
> produced useful evidence.

> The rewrite answers those windows with Activity retry policy, replay-safe
> artifacts, a durable external-request journal, and an explicit minimum of
> three completed angles.

## 3:15–4:40, slide 4: Defend the determinism boundary

Say:

> The Workflow owns decisions: bounded fan-out, fan-in, retry policy,
> partial-result policy, and progress.

> Temporal Activities perform everything nondeterministic: SciX and Digest calls, the
> clock, heartbeats, artifact I/O, hash verification, and any future model
> synthesis.

> Full source payloads stay in the artifact store. Event History gets compact
> IDs, hashes, statuses, and paths, which keeps replay from becoming document
> storage.

## 4:40–5:55, slide 5: Explain the request contract

Say:

> Temporal gives Activities at-least-once execution. We now hash each logical
> external request into a stable ID, check a durable response journal, reuse a
> recorded response, and carry the request ID into provenance.

> The abstraction can forward the same ID as a provider idempotency key. Our
> current SciX and Digest calls are read-only and do not accept one. If a
> Worker dies after a response but before the journal write, a lookup can
> repeat. The repeated lookup wastes computation while preserving correctness.

> A paid model call or external mutation must use a provider that honors the
> key, or an equivalent transactional deduplication boundary.

## 5:55–7:05, slide 6: Show the durable skill

Say:

> The rewrite became a skill called `run-durable-research`, available to any
> agent on this workstation.

> The starting agent submits a request and can exit. The Workflow owns the
> durable branch graph and progress; the Temporal Service persists its Event
> History and schedules execution. Another agent can use the Workflow and Run
> IDs to query progress, wait, or retrieve the report and provenance manifest.

> We verified this across caller exit, a persisted local Temporal Service
> restart, and a Worker replacement. The skill stays a thin client while
> Temporal remains the orchestrator.

## 7:05–8:30, slide 7: Kill the Worker

Play the embedded recording. Pause at the Worker-kill frame if you want to
read the pending Activity details before continuing; the player also supports
fullscreen.

Say:

> The harness waited until two retrieval Activities emitted heartbeats, then
> sent `SIGKILL` to the exact Worker PID. The terminal confirms two pending
> Activities and says the same Workflow run remains open.

If performing the optional internal live sequence, run:

```bash
./demo/recovery-demo.sh
```

The command is workstation-only. The source repos, services, and indexes used
by live mode are not bundled for external reproduction.

## 8:30–9:50, slide 8: Read the completion evidence

Say:

> The left frame shows all four angles complete and records the replacement
> Worker identity. The right frame is Temporal Web: events 7 and 10 show the
> two research Activities starting on attempt two after heartbeat timeout.

> The Workflow ID and Run ID did not change. The report and provenance
> manifest were produced under that original run.

Mention the additional checks: three clean recovery runs, an injected
retryable failure, and a decoded-history test proving that a 20 KB evidence
body stays out of Event History.

## 9:50–10:45, slide 9: State the availability boundary

Say:

> The reviewable deliverables are portable: before and after source, the
> explanation, deck, recording, exported history, report, and manifest.

> Live research depends on our workstation-local SciX and Digest repositories,
> indexes, services, Temporal Worker, and configuration. The published page is
> a walkthrough of captured evidence; the research service and demo runtime
> remain on this workstation.

## 10:45–12:00, slide 10: Close on what changed

Say:

> The research code already knew how to use SciX and the Digest, parallelize
> research angles, and produce cited reports with provenance.

> Temporal adds durable Workflow state, Activity retries and recovery,
> queryable progress, and an Event History that proves how the run survived.

> The key teaching point is the boundary: the Workflow owns orchestration
> decisions, the Temporal Service persists Event History, and Activities
> isolate nondeterminism. External effects still need their own request
> contract.

Invite questions.

## If the live sequence misbehaves

1. Stay on slides 7 and 8. They contain frames from the verified recording.
2. Play the full recording if the audience wants to see the full sequence.
3. If Temporal Web is unavailable, use the terminal completion frame and
   `verification.md`.
4. If time drops below ten minutes, skip the optional live command and retain
   the code comparison, boundary, skill, and evidence.
5. If time expands to fifteen minutes, open the request journal and the test
   that keeps large evidence out of Event History.
