# Verification record

Verified on July 30, 2026.

## Historical source fidelity

The complete captured source and its original have the same SHA-256:

```text
68cee4a169b053f42cf63ebd7e0620297db55aca8deb371bb79952e7a2e9cf29
```

Compared files:

```text
before/phaseE_workflow.js
/home/ds/projects/code-intelligence-digest/research/phaseE_workflow.js
```

The source contains two series, ten episode briefs, three episode stages, two
series literature reviews, and the full editorial prompt contracts.

## Application quality gates

```text
uv run pytest -q
89 passed
81.90% branch-aware coverage

uv run ruff check src tests
All checks passed

uv run mypy src/durable_research
Success: no issues found in 22 source files
```

The test suite covers the faithful podcast models, prompts, preset, Activities,
Workflow, Worker registration, general durable-research path, recording
evidence, and video edit contract.

## Full ten-episode Workflow

A full fixture-backed Workflow executed every historical episode:

```text
Workflow ID  temporal-phasee-full-fixture
Run ID       019fb4c0-ff35-7888-a93a-144810a1f004
Pipeline ID  podcast-pipeline-24ecbbe71bc8
Completed    10 episodes
Failed       0 episodes
Reviews      mas, code
```

Output:

```text
after/fixture-products/
├── research/       10 documents
├── deep-dives/     10 documents
├── scripts/        10 documents
├── reviews/         2 documents
├── evidence/       20 source records plus episode indexes
└── manifest.json
```

## Worker-kill recovery

The recording run started two slow, heartbeat-emitting
`research_episode` Activities. The script waited for Temporal to report both
pending Activities and their heartbeat details, then sent `SIGKILL` to the
Worker.

```text
Workflow ID        temporal-phasee-demo-1785443614
Run ID             019fb4bb-817e-70cc-ad36-1857e4f10388
Killed Worker PID  3494508
New Worker PID     3494644
Status             COMPLETED
Episodes           mas-ep4, code-ep4
Failed episodes    none
Series reviews     mas, code
```

The exported Event History records two `research_episode` Activity starts on
attempt 2 with the replacement Worker identity. The recording evidence gate
passes all eight checks:

```text
PASS: 8/8 recording checks
Heartbeat retry Activity starts: 2
```

Evidence:

```text
demo/out/run-artifacts/run.json
demo/out/run-artifacts/description.json
demo/out/run-artifacts/history.json
demo/out/run-artifacts/manifest.json
demo/out/run-artifacts/demo-worker-1.log
demo/out/run-artifacts/demo-worker-2.log
```

## Video

```text
File        demo/out/temporal-literature-review-demo.mp4
Profile     H.264, 1920×1080, yuv420p
Duration    51.8 seconds
Views       terminal and Temporal Web from the same Workflow Execution
```

The edit plan contains six evidence beats, four held frames, two zooms, one
three-pixel highlight, a separate 600-pixel caption panel, and a ten-second
summary card.

## Website

The Temporal-specific website tests pass:

```text
node --test tests/temporal-code-reader.test.mjs \
  tests/temporal-research-page.test.mjs
11 passed
```

`npm run check` reports no errors, and `npm run build` completes all static
routes, including six annotated code readers.

The repository-wide website test run has one unrelated failure:
`concept-assignments.test.ts` detects newer digest records than the committed
concept-assignment snapshot. The Temporal-specific tests pass within that same
run.

## Runtime boundary

The live SciX and Code Intelligence Digest path depends on local repositories,
indexes, databases, services, and writer configuration. The public website is
a review package containing source, raw downloads, products, the recording,
and captured evidence. It is not presented as a public runnable distribution.
