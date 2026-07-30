# Research request schema

The request is a JSON object:

```json
{
  "topic": "How durable execution changes repository research agents",
  "mode": "live",
  "artifact_root": "./research-artifacts",
  "angles": [
    {
      "key": "prior-work",
      "question": "What prior systems make repository research restartable?",
      "scix_query": "durable repository research agents checkpoint recovery",
      "digest_query": "code intelligence research agent recovery"
    },
    {
      "key": "failure-boundaries",
      "question": "Which failures lose completed retrieval or synthesis work?",
      "scix_query": "agent tool failure recovery provenance",
      "digest_query": "research pipeline crash retry idempotency"
    }
  ],
  "minimum_completed_angles": 2,
  "max_parallel_angles": 2,
  "activity_retry_attempts": 3
}
```

Required fields:

- `topic`: non-empty report title and research question.
- `artifact_root`: absolute path or path relative to the request file.
- `angles`: non-empty list. Every angle has exactly `key`, `question`,
  `scix_query`, and `digest_query`.

Optional fields:

- `mode`: `live` by default; `fixture` is reserved for offline verification.
- `minimum_completed_angles`: defaults to all angles.
- `max_parallel_angles`: defaults to 2.
- `activity_retry_attempts`: defaults to 3.
- `fixture_path`: required only in fixture mode, relative to the request file
  or absolute.

Use stable, lowercase, hyphenated angle keys. Give SciX queries the concepts
and terminology likely to occur in papers. Give Digest queries the product,
code, incident, or practitioner language likely to occur in engineering
material.

Unknown top-level fields and incomplete angle objects are rejected. Runtime
owners configure MCP commands through environment variables, outside request
JSON.

Live mode is available only on the configured workstation. The local SciX and
Code Intelligence Digest repositories, indexes, databases, and services are
not bundled with this skill. Copying the request schema or setting the
environment variables does not recreate those dependencies.

The `artifact_root` must be writable from every Worker that can execute the
review. A local Worker can use a workspace directory. Distributed Workers
need a shared filesystem or an artifact-store adapter.
