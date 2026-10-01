---
title: Omni Evaluations
status: active
domain: research
summary: The evaluation program behind Omni's analytics agent, including regression and quality-gap suites scored by rubric judges over full traces, a public-benchmark screen for deciding which models earn an internal run, and the loop that calibrates the screen against the suites.
role: AI Engineer
tech: [Evaluation, Agents, SQL, TypeScript, Python]
order: 3
topics: [evaluation, agents]
related: [enterprisebench, migration-evals]
links:
  - label: Model selection tracker
    url: https://www.sjarmak.ai/models
tags: [evals, model-selection, analytics]
---

Omni's agent answers data questions end to end: it searches a governed semantic model for the right fields, writes SQL against it, runs the query, checks the result against the question, and turns it into charts and dashboards through a multi-step tool loop. Every step is a place to be subtly wrong. A query can execute and still answer a different question. A relative date filter can be off by one period. A question that spans two isolated groups of tables needs a specific query shape or it fails at planning time. None of that shows up in a general leaderboard score, so the evaluation program is built around the product's own failure modes rather than around published numbers.

Cases live in two kinds of suite. Regression suites hold prompts for behaviors that were broken and then fixed, grouped by failure class: cross-query calculations, fiscal and relative date filters, time-unit conversions, pivot ordering, custom fields, sampled data, map visualizations, retry after a validation failure. Quality-gap suites hold the prompts the agent is known to handle badly and nobody is working on yet, so the gap stays measured instead of forgotten. Each case carries the user prompt, a written expectation, and any human notes from triage. Scoring runs over the full execution trace, not the final message: an LLM judge reads every tool call and intermediate result against a rubric. Rule-based rubrics return yes or no and name the violated rule; a graded rubric returns 0 to 3, where 3 means every expected behavior was satisfied. A judge can cap a score but cannot award credit the trace does not contain. Self-correction counts. An agent that fails a query, reads the error, and reruns correctly passes, because that is what a good analyst does.

Runs are stored as product records. An evaluation run fans a suite out against a chosen model configuration, keeps every trace and judge rationale, and can be cancelled, archived and compared. A presenter turns a run into a bundle of its failures with the agent's trace inline, which is the input to prompt and tool iteration: read the failures, change the system prompt or a tool description, rerun the suite, diff. An earlier local framework built on an experiment tracker was retired once the hosted run platform could do the job; its cases and judge templates were kept and seeded the current suites.

Choosing which models to put through those suites is its own question, and public benchmarks are the screening layer for it, never the verdict. The [model selection tracker](/models) maps the capabilities the loop depends on (data analysis, instruction following, SQL, reasoning, long context, cost) to one versioned public benchmark each, normalizes and combines them with stated weights, and applies eligibility gates for context window, structured output, tool calling, API availability and data-retention terms that no composite score can override. Models that clear the gates and score well are shortlisted for a full internal run. The intended loop is public benchmarks to a shortlist, the internal suites scoring that shortlist, the correlation between the two recorded, and the screening weights revised from it. The correlation step has not run yet, so the current weights are a prior rather than a fit.
