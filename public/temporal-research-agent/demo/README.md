# Recorded Worker-recovery demo

This recording follows the Temporalized version of the podcast research
pipeline across two views:

1. The terminal starts two episode branches, kills their Worker with `SIGKILL`
   while research Activities are running, starts a replacement Worker, and
   waits for research, deep dives, scripts, and series reviews to complete.
2. Temporal Web opens the same run, shows the completed result, then sorts
   Event History oldest-first so Activity attempts 2 are visible.

## Outputs

```text
out/
├── temporal-literature-review-demo.mp4
├── temporal-literature-review-teaser.gif
├── recording-manifest.json
├── raw/                    # asciinema and Playwright source recordings
└── run-artifacts/          # Event History, run metadata, logs, report, evidence gate
```

The MP4 is a 1920×1080 H.264 file. Evidence occupies the left 1320 pixels;
captions use a separate 600-pixel panel with the same amber-divider treatment
as the Code Intelligence Digest demo. No caption covers terminal or Temporal
Web text.

[`edit-plan.json`](edit-plan.json) defines six evidence beats. Four pause on a
captured frame. The failure frame keeps one three-pixel amber box. Completion
eases from the full pane into a moderate 1.25× zoom over 1.5 seconds, keeping
status and Worker identity in context without a clipped intermediate frame.
Retry evidence uses a tighter crop instead of an overlay, so events 7 and 10
and both attempt values remain unobstructed. Proof frames hold for 8–10
seconds. The Temporal Web overview holds for seven seconds, and the final card
gives viewers ten seconds to compare the existing research code with the
durability Temporal adds.

The final card contains only this comparison:

| The code already provided | Adding Temporal provides |
|---|---|
| 10 episode plans + prompts | Durable Workflow progress |
| Research → deep dive → script | Activity retries after failure |
| Two series literature reviews | Queryable state + Event History |

The manifest records the Workflow ID, run ID, duration, media profile,
editorial timing and stroke width, and SHA-256 hashes.

## Reproduce it

Requirements: `uv`, the Temporal CLI, `jq`, `asciinema`, Node.js, Playwright,
`ffmpeg`, `ffprobe`, and `agg`. `capture.sh` installs the pinned Playwright
package without downloading another browser when the local cache is present.

```bash
./capture.sh
./render.sh
```

`capture.sh` rejects a take unless Event History proves a heartbeat timeout
followed by Activity attempt 2 on a distinct replacement Worker. It also
requires two completed episode branches, both series reviews, no failed
episodes, and non-empty terminal and Temporal Web recordings. `render.sh`
validates the edit plan, caption-panel bounds, crop and highlight coordinates,
duration, resolution, codec, and pixel format before writing the manifest.

The browser recorder can also be run against an existing Workflow:

```bash
TEMPORAL_UI_URL=http://127.0.0.1:8723 \
  node record_webui.mjs 02-temporal-web 14 WORKFLOW_ID RUN_ID
```
