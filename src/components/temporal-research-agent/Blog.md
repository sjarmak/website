# I killed my research pipeline mid-run. Temporal brought it back.

*What changed when I rebuilt an existing agent pipeline with Temporal's Python SDK*

I have a research pipeline that uses two tools I built: [SciX](https://www.sjarmak.ai/projects/scix-agent), which gives agents access to scientific literature, and [Code Intelligence Digest](https://www.sjarmak.ai/projects/code-intelligence-digest), which collects engineering posts, releases, and discussions. The pipeline uses both evidence lanes to research technical podcast episodes.

The original version was a JavaScript program. It ran each episode through research, a deep dive, and a podcast script, then combined the completed episode research into a literature review for each series.

It worked! It also kept its understanding of the run inside one process.

If that process died after an agent finished a long research call, the files it had already written would still exist. The pipeline cursor, active promises, attempt counts, and knowledge of what should happen next would disappear. I would get to inspect a directory full of partial work and make an educated guess about what to rerun. Fun.

I rebuilt the pipeline as a Python application using Temporal, then killed its Worker while two research Activities were running. A replacement Worker picked up new attempts, and the original Workflow Execution finished the research, deep dives, podcast scripts, series reviews, and provenance manifest.

The same Workflow ID and Run ID survived the whole thing.

## The original pipeline already had useful business logic

The source program had real editorial and business detail. It contained two podcast series, episode briefs, seed papers, frontier-research flags, and separate prompt contracts for research, deep dives, scripts, and series-level synthesis.

The orchestration itself was pleasantly compact:

```javascript
phase('Research')
await pipeline(
  EPS,
  (episode) => agent(researchPrompt(episode)),
  (research, episode) => agent(deepDivePrompt(episode, research)),
  (deepDive, episode) => agent(scriptPrompt(episode, deepDive)),
)

phase('Synthesis')
await parallel(
  writeSeriesReview('mas'),
  writeSeriesReview('code'),
)
```

Each episode followed the same dependency chain:

```text
research → deep dive → podcast script
```

Once the episode branches completed, the results fanned in to series reviews.

The process owned all of that coordination. A direct Python translation with `asyncio.gather()` would preserve the same failure boundary:

```python
async def run_episode(episode: Episode) -> None:
    research = await agent(research_prompt(episode))
    deep_dive = await agent(deep_dive_prompt(episode, research))
    await agent(script_prompt(episode, deep_dive))


async def run_pipeline() -> None:
    await asyncio.gather(*(run_episode(episode) for episode in EPISODES))
    await asyncio.gather(*(write_series_review(series) for series in SERIES))
```

`asyncio` coordinates concurrent work while that Python process is alive. Recovering after it exits would require me to add a durable checkpoint store, attempt tracking, a retry scheduler, timeout handling, and rules for reconciling external calls that may have succeeded before the crash.

Those concerns had started to become more interesting to me than the prompts.

## Temporalizing the pipeline meant drawing a boundary

The central design decision was where deterministic orchestration ended and uncertain external work began.

The `PodcastResearchWorkflow` owns the episode order, bounded concurrency, completion policy, series-review fan-in, progress query, and final result. Those decisions can be reconstructed from Temporal's Event History, so the Workflow code has to remain deterministic.

The Activities own everything that can depend on the outside world:

- `research_episode` queries SciX and Code Intelligence Digest, saves the evidence, and writes a synthesized research brief.
- `write_deep_dive` turns that research brief into a technical deep dive.
- `write_podcast_script` creates the episode script.
- `write_series_review` synthesizes the completed deep dives for a series.
- `write_pipeline_manifest` records the final artifacts and provenance.

The Worker registers the Workflow and those five Activities on one task queue. The Temporal Service persists Event History and schedules work. If a Worker disappears, another Worker polling that queue can continue the execution.

Temporal's [Python documentation](https://docs.temporal.io/develop/python) separates Workflows, Activities, Workers, and Clients along these lines. The distinction gets especially useful in an agent pipeline because model calls, MCP requests, filesystem access, and clock reads are all nondeterministic operations. They belong in Activities, while the Workflow describes when they should run and what to do with their results.

Here is the episode path in the Python Workflow:

```python
researched = await workflow.execute_activity(
    "research_episode",
    request,
    result_type=EpisodeResult,
    start_to_close_timeout=timedelta(minutes=10),
    heartbeat_timeout=timedelta(seconds=30),
    retry_policy=self._retry_policy(request.pipeline),
)

deep_dive = await workflow.execute_activity(
    "write_deep_dive",
    DeepDiveRequest(request.pipeline, request.episode, researched),
    result_type=EpisodeResult,
    start_to_close_timeout=timedelta(minutes=10),
    heartbeat_timeout=timedelta(seconds=30),
    retry_policy=self._retry_policy(request.pipeline),
)

return await workflow.execute_activity(
    "write_podcast_script",
    ScriptRequest(request.pipeline, request.episode, deep_dive),
    result_type=EpisodeResult,
    start_to_close_timeout=timedelta(minutes=10),
    heartbeat_timeout=timedelta(seconds=30),
    retry_policy=self._retry_policy(request.pipeline),
)
```

The branches still use `asyncio.gather()`, but now they use it inside Temporal's Workflow runtime. Activity scheduling and completion become events in Workflow History. A replay rebuilds the orchestration state without rerunning completed Activities.

This let me keep the shape of the original program. Temporal replaced the process-local coordination around it.

## Keeping large research artifacts out of Event History

Research pipelines produce an obnoxious amount of text. One episode can retrieve dozens of abstracts and engineering articles before producing the research brief, deep dive, and script.

Passing all of those documents through Workflow inputs and Activity results would turn Event History into a second document store. I wanted History to explain the execution while the artifact store held the research product.

The Activities write evidence and documents under stable artifact paths. The Workflow receives frozen typed dataclasses with compact information: episode keys, status, hashes, source IDs, and artifact references. The final manifest connects every output back to its evidence.

This also gives retries a useful file contract. Evidence paths include a content hash. A retry can write identical content to the same location. Conflicting content raises an error and preserves the earlier artifact.

The current implementation uses a filesystem store because it makes the example easy to inspect. Workers running on several hosts would need shared object storage or a database. The Workflow leaves that deployment boundary visible.

## Then I killed the Worker

The recovery run uses fixed SciX-shaped and Digest-shaped evidence. This isolates Temporal's recovery behavior from the health of two local indexes and the behavior of a model provider on a particular afternoon.

The demo starts a Workflow with two representative episode branches. Both enter slow, heartbeat-emitting research Activities. Once Temporal reports that both Activities are running, the script sends `SIGKILL` to the exact Worker PID.

[![Temporal Web shows both research Activities pending after the Worker is killed](https://www.sjarmak.ai/temporal-research-agent/deck-assets/worker-killed.png)](https://www.sjarmak.ai/temporal-research-agent/deck-assets/worker-killed.png)

`SIGKILL` matters here because the Worker has a 30-second graceful-shutdown window. Killing it abruptly prevents cleanup code from making the demonstration nicer than an actual process failure.

The Temporal Service keeps the Workflow Execution open. After the 30-second Heartbeat Timeout, a replacement Worker receives attempt 2 for each research Activity.

[![Temporal Web records attempt 2 for both research Activities](https://www.sjarmak.ai/temporal-research-agent/deck-assets/activity-attempt-two.png)](https://www.sjarmak.ai/temporal-research-agent/deck-assets/activity-attempt-two.png)

The original Workflow Execution continues through the deep dives, scripts, series reviews, and manifest.

[![The replacement Worker completes the original Workflow Execution](https://www.sjarmak.ai/temporal-research-agent/deck-assets/workflow-completed.png)](https://www.sjarmak.ai/temporal-research-agent/deck-assets/workflow-completed.png)

The test script rejects the recording unless Event History shows both research Activities reaching attempt 2 on the replacement Worker. That gate makes the video independently checkable evidence of the failure and recovery (and avoids a terminal reenactment with suspiciously convenient timing).

The captured run finished with no failed episodes:

```text
Workflow ID  temporal-phasee-demo-1785443614
Run ID       019fb4bb-817e-70cc-ad36-1857e4f10388
Status       COMPLETED
Episodes     mas-ep4, code-ep4
Reviews      mas, code
```

You can [watch the edited recovery demo](https://www.sjarmak.ai/temporal-research-agent/demo/out/temporal-literature-review-demo.mp4), including the Worker kill, replacement Worker, Activity attempts, and completed Event History in Temporal Web.

## I ran the real product path separately

Fixtures make the durability test repeatable. They are a terrible way to judge whether the research pipeline still produces useful work.

I ran a separate live Workflow against my local SciX and Code Intelligence Digest services with a configured writer. It selected the “Enterprise & Production” episode from the original business input and executed the full path:

```text
29 deduplicated sources
        ↓
synthesized research brief
        ↓
technical deep dive
        ↓
podcast script
        ↓
series synthesis + provenance manifest
```

That Workflow completed as `temporal-phasee-live-one-20260730-v1`. The [research-output page](https://www.sjarmak.ai/temporal-research-agent/research-output/) renders each stage beside the corresponding products from the original pipeline, including the citations and source provenance.

Reproducing the live MCP run requires the repositories, indexes, databases, and services configured on my workstation. The public project includes the source, fixture-backed recovery path, captured Event History, video, and output.

## Activity retries forced me to think about idempotency

Temporal Activities follow an at-least-once execution model. A Worker can finish an external call and die before reporting Activity completion to the Temporal Service. Temporal will retry the Activity because, from its perspective, the completion was never recorded. The [Temporal Python error-handling guide](https://docs.temporal.io/develop/python/best-practices/error-handling) recommends idempotent Activities for exactly this reason.

The pipeline now gives every logical MCP and writer request a stable ID. Before making a call, an Activity checks a write-once response journal. After a successful response is recorded, later attempts reuse it. The request ID also travels with the source provenance.

The journal closes most of the duplicate-work window, though one edge remains:

```text
provider succeeds → Worker dies → journal write never happens
```

SciX and Digest searches are read-only, so repeating one wastes computation without changing external state. A paid model call or mutating provider needs to honor the stable idempotency key, or provide an equivalent transaction, to close that gap. The writer adapter can receive the key through an environment variable; the provider still has to enforce it.

This was one of my favorite parts of the rewrite because it made a fuzzy “Temporal handles retries” statement concrete. Temporal records and retries Activity execution. The Activity implementation still needs a contract for the external effect.

## The failure policy became business logic

The original program would reject when its promise graph rejected. The Temporal version had to answer more useful questions:

- How many episode branches may run at once?
- Which failures should retry?
- How long can a research or writer call remain silent?
- Can a series review proceed with a failed episode?
- What should the caller see while the run is still active?

The input now sets the concurrency limit, retry attempts, and minimum number of completed episodes required for synthesis. Activities use bounded exponential retries, ten-minute Start-to-Close Timeouts, and 30-second Heartbeat Timeouts for long calls. An exhausted episode branch becomes a typed failed result. The Workflow checks the completion threshold before scheduling the series reviews.

The Workflow also exposes a `PodcastProgress` query with the current phase and counts for running, completed, and failed episodes. An agent can start research, save the Workflow ID and Run ID, exit, and inspect the same execution later.

I packaged that client behavior as a local `run-durable-research` agent skill. The skill is intentionally thin. It starts, queries, waits for, and retrieves a Workflow result; the durable lifecycle remains in Temporal. The skill depends on my workstation services for live research. The research continues after its caller process exits.

## What I would change for a larger deployment

The current shape is right for a bounded research run. A much larger or continuously refreshed catalog would push me toward Child Workflows or Continue-As-New before Event History grew too large. Multiple Worker hosts would require the shared artifact store I mentioned earlier. Long-lived production deployments would also need a Worker Versioning strategy so a code change could not break replay for open executions.

I would keep the Activity boundaries. Research, deep-dive writing, script writing, and series synthesis have different costs, inputs, failure modes, and retry behavior. Keeping them separate means a failed script call does not rerun retrieval and a failed series review does not regenerate every episode.

The full implementation uses typed dataclasses, strict MyPy, Ruff, and tests that inspect the real Workflow Event History. One test puts a 20 KB sentinel document in an Activity artifact, decodes History payloads, and verifies that the path appears while the document body does not. The recovery suite also covers a caller exiting, a persisted local Temporal Service restarting, and a replacement Worker retrieving the original result.

The [interactive project](https://www.sjarmak.ai/temporal-research-agent/) includes the complete before source, annotated Workflow, Activities, Worker, README, presentation, recorded recovery, and produced research. Click any annotated code section to open the explanation beside the full syntax-colored file.
