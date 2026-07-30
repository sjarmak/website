---
name: run-durable-research
description: Run long-lived literature reviews across SciX scholarly evidence and Code Intelligence Digest engineering evidence with a Python Temporal Workflow. Use when an agent needs to start research now and inspect it later, preserve progress across caller or Worker exits, query branch progress, or retrieve a cited report and provenance manifest.
---

# Run Durable Research

Use the bundled client as a thin control surface. The Temporal Workflow owns
orchestration decisions and state. The Temporal Service persists its Event
History and schedules execution. `research_angle`, `verify_evidence`,
`synthesize_section`, and `finalize_review` Activities perform MCP calls,
clock reads, artifact I/O, and any future model calls. In live mode,
`finalize_review` calls SciX `synthesize_findings` over the combined scholarly
working set before writing the report and provenance manifest.

This skill is callable by any agent on the configured workstation. Its live
mode is not portable: SciX and Code Intelligence Digest rely on local
repositories, indexes, services, and Worker configuration that are not
bundled with the skill.

## Start a review

1. Run `scripts/doctor` before the first request in a session. Do not start a
   development server or Worker implicitly. If either is unavailable, report
   the failed check and follow the runtime instructions printed by the script.
2. Read [request-schema.md](references/request-schema.md).
3. Write the request JSON in the user's workspace. Put its artifact directory
   beside the request or use an absolute path.
4. Start the Workflow:

   ```bash
   scripts/research start /absolute/path/to/request.json
   ```

5. Return the `workflow_id`, `run_id`, and `temporal_ui_url` to the user. The
   command is detached after Temporal accepts the start. Do not keep the
   originating agent process open to make the research durable.

Use `mode: "live"` for real research. Use fixture mode only for tests,
rehearsals, or an explicit offline request.

## Observe or retrieve

Use the exact Workflow and Run IDs returned by `start`:

```bash
scripts/research status WORKFLOW_ID --run-id RUN_ID
scripts/research result WORKFLOW_ID --run-id RUN_ID
scripts/research wait WORKFLOW_ID --run-id RUN_ID
```

`status` returns Temporal status plus branch progress when a Worker can answer
the Query. `result` never waits and exits 2 while work is still running.
`wait` attaches to the durable result and may be used when the user wants the
answer in the current turn.

Resolve `report_ref` and `manifest_ref` beneath the request's
`artifact_root`. Read the report for findings and the manifest for source
lane, locator, content hash, and branch outcome.

## Operational rules

- Keep large evidence out of prompts and Workflow History. Read the report
  first and inspect evidence artifacts only for claims that need auditing.
- Never move SciX, Digest, filesystem, clock, or model calls into Workflow
  code. Workflow code must remain replay-deterministic.
- Treat Activities as at-least-once. Each live MCP request has a stable
  logical request ID. The Activity reuses a matching response from the
  request journal and records that ID in provenance.
- The current SciX and Digest tools are read-only and do not accept an
  idempotency key. A Worker failure after a response but before the journal
  write can repeat their computation. Any future paid or mutating provider
  must accept the stable request ID, or provide an equivalent transactional
  deduplication mechanism.
- Do not invent a new Workflow ID after a caller exits. Reattach with the
  recorded Workflow and Run IDs.
- Do not start live research when the user only asked for a plan or request
  draft.

For runtime configuration and recovery semantics, read
[runtime-and-recovery.md](references/runtime-and-recovery.md).
