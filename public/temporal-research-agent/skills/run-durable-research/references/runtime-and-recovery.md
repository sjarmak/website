# Runtime and recovery

The client reads these connection settings:

```text
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_UI_URL=http://localhost:8233
TEMPORAL_RESEARCH_TASK_QUEUE=temporal-literature-review
```

A long-lived Temporal Service and at least one research Worker must be
available. For a local development runtime:

```bash
temporal server start-dev --db-filename /absolute/path/to/temporal.db
scripts/research-worker
```

The SQLite filename preserves local development-server state across a server
restart. The current sample connects to a plaintext Temporal frontend.
Temporal Cloud requires TLS and API-key client configuration, which this
example does not yet provide.

Live retrieval settings:

```text
SCIX_PYTHON=/path/to/scix/.venv/bin/python
SCIX_CWD=/path/to/scix
SCIX_EMBED_DEVICE=cpu
QDRANT_URL=http://127.0.0.1:6633
DIGEST_COMMAND=npx
DIGEST_SERVER=/path/to/code-intelligence-digest/src/mcp/server.ts
DIGEST_CWD=/path/to/code-intelligence-digest
```

Once `start` returns, the caller may exit. Temporal retains the Workflow
Execution. A replacement client can query or retrieve it by Workflow ID and
Run ID. A Worker may also exit; another Worker polling the same Task Queue
replays Workflow state and continues outstanding work.

Activities use at-least-once execution. A Worker can finish an external call
and die before reporting completion, so a later attempt may repeat that call.
This project makes artifact writes retry-safe but does not claim exactly-once
behavior for SciX, Digest, or a future model provider.
