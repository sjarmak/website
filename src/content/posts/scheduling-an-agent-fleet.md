---
title: "Scheduling an agent fleet: a practitioner's companion"
date: 2026-07-13
description: "A multi-agent orchestrator is an online scheduler, and its allocation layer is usually one first-come-first-served line. The cheapest first build, the highest-ROI first change with the actual weights, and the rules that transfer from schedulers already running in production."
kind: essay
tags: [agents, orchestration, scheduling, operations-research, gas-city]
draft: false
---

## Your orchestrator is a scheduler, and the scheduling half is one line long

Gas City dispatches work with one shell line: fetch the ready items routed to a worker pool, drop the blocked and ineligible rows, take the oldest that survives. The autoscaler is one more line, desired sessions equals ready-queue length clamped to a configured min and max. Model selection is a static string in a per-agent config file. There is no lookahead, no cost model, and no deadline field anywhere in the work-item data structure. That is the entire allocation layer of a system that runs a fleet of coding agents.

The reframe worth making: a multi-agent orchestrator is an online scheduler operating under uncertainty. Most orchestration effort today goes into worker quality, meaning model choice, per-agent memory, per-agent planning. Almost none goes into the allocation layer, the part that decides what runs first, in what order, at what model tier, and at whose expense. That layer is where a specific class of failures lives, and no amount of worker intelligence fixes them, because a brilliant agent working on the wrong item is still the wrong item running.

It helps to split the one word "agent" into the three levels it usually collapses. Execution is one agent, one claimed task, one worktree, one model, a tool budget. Planning is decomposing goals into tasks and orderings, with fan-out flows like diverge, converge, premortem, and stress-test. Optimization is claim order, pool sizes, model tiers, merge slots, interrupt policy, and review bandwidth. Most published multi-agent work sits at the first two levels. In this factory, the third level is the FCFS line, the one-line autoscaler, and the static model string.

![The allocation layer as a control loop: observe the queue, schedule an epoch, dispatch, measure, re-decide.](./img/factory-observatory-08-closed-loop-controller.png)

## The failures that live in the allocation layer

Worker intelligence does not touch these, because none of them happen inside a worker. The wrong item runs first while a higher-value one ages. Two sessions collide in one file set and one of them burns its run producing a conflict. A dependency chain serializes a week of work because nothing at claim time knows the chain exists. An interrupt drains the whole pool onto one urgent thing. Six finished changes sit a full day waiting on one human reviewer, which means the true bottleneck was never agent throughput at all.

Each of these is a scheduling decision made badly, or more precisely, not made. First-come-first-served is a policy; it is just a policy nobody chose, tuned, or measured. The rest of this guide is the shortest path from that default to something measured, in two moves plus a set of rules borrowed from systems that have run online schedulers in production for decades. The full formulations, the literature review behind those rules, and a four-phase adoption path are in the companion report, [Operations research as a framework for software-factory scheduling](/writing/or-for-software-factories/).

## Phase 0: replay your own ledgers before changing anything

The cheapest first build is a read-only trace replay harness, and it should exist before any behavior changes. The orchestrator's audit ledgers already record every arrival, claim, and outcome: arrival time, declared priority, which worker claimed the item and when, run duration, what it produced, and whether review accepted it. Replay an identical recorded week under two dispatch policies with the arrival trace held fixed, and the difference between the two runs is attributable to the policy. No simulator is needed, because the arrivals were captured the first time through.

In Gas City's case, about 7.5 weeks of full work-item snapshots exist, from 2026-05-19 onward. The first job for the harness is baselines: replay plain FCFS and a trivially-tuned priority sort over the same trace, and report three numbers per policy: priority-weighted flow time (arrival to completion, weighted by declared priority), unblocking-value throughput (how much downstream work each completed item released), and per-class p95 tails, because a policy that improves the mean by starving one class of work is one you want to catch on paper.

The harness needs no approvals because it changes nothing; it runs read-only over history the system already wrote. What it produces is a set of numbers the fleet has never had: how much the default policy actually costs, in units you can argue about. As of 2026-07-11 this phase is incomplete and nothing is deployed; the fleet still runs the one-line FCFS. Which is exactly why it is the first thing to build.

![Your ledgers already recorded the week; replay it under a second policy and whatever differs is the policy.](./img/factory-observatory-07-replay-your-own-nights.png)

## Phase 1: replace the FCFS tie-break with four weighted features

The highest-ROI first change is a feature-weighted priority index in place of the age-only sort. This is how the Rubin Observatory points a billion-dollar survey: score every candidate, take the best, decide again next step. The engineering content survives with the telescope removed. Score each ready item as a weighted sum of four features, with the three secondary features each normalized to the unit interval before weighting:

- declared priority, weight 1.00
- due date, weight 0.10
- unblocking value (how much downstream work completion releases), weight 0.08
- age, weight 0.06

One invariant makes this safe to deploy. Adjacent priority bands sit 0.25 apart, and because each secondary feature is scaled to the [0, 1] interval, the three secondary weights can add at most their sum, 0.24, so declared priority strictly dominates and the index can only ever reorder items within a priority band. Cross-band ordering, the thing humans reason about when they set a priority, is untouched by construction rather than by hope. Within-band ordering is exactly where FCFS was leaving value on the floor: an aged, heavily-blocking, due-tomorrow item stuck behind a fresh, isolated one of the same declared priority, losing on arrival time alone.

Tune the weights offline against the replayed traces from Phase 0. In Gas City this lands as a pure configuration change, because dispatch is per-agent overridable; crash-robustness comes from the existing claim protocol, not from any property of the score, so a bad score costs ordering quality and nothing else. The missing deadline field arrives as an optional metadata convention that the scoring script reads and never enforces, which means items without deadlines behave exactly as before.

The rollout discipline is a rule worth copying verbatim. Shadow mode first: log what the index would have claimed, change nothing, and diff against what FCFS actually claimed. Then a one-project canary: a single project live on the new policy while the rest of the fleet stays on FCFS. Then fleet-wide. Each stage gates on replayed-trace evidence, not on whether the queue feels better. And there is a structural safety net in the math itself: FCFS is itself a point in this weight space (age the only nonzero weight, declared priority set to zero), so a tuned index can only lose to it by overfitting, and a temporal holdout, tuning on the early weeks and scoring on held-back later weeks, catches exactly that.

## Seven rules from schedulers that already run in production

Observatories have operated online schedulers under uncertainty, with real money on the line, for decades; these are the rules that transfer, each tied to the fleet failure it prevents.

1. **Re-decide cheaply instead of modeling all the uncertainty.** The deployed schedulers that actually quantified their uncertainty chose cheap frequent re-solving over elaborate scenario-tree planning. Make re-decision nearly free: run a real optimization at coarse intervals, score greedily but well in between, and let the noise be noise. Prevents pouring effort into predicting agent flakiness and queue churn instead of just recomputing when the state changes.

2. **Ship the best answer you have when the clock runs out; do not wait on a proof.** A production follow-up scheduler caps its solver at 500 seconds and takes whatever the best schedule is at the cap; a 100-second cap would have truncated only 64 of 951 solves. The merge queue keeps moving. A plan short of proven-optimal but in hand beats a perfect plan for a state that already changed.

3. **Keep one exact method that can say "there was work to do and we provably missed it."** A heuristic silently returns a confident wrong answer; an exact solver certifies. In one study a heuristic failed on 7 of 360 instances, and on one of them a feasible schedule provably existed that the heuristic silently missed. Any dispatcher that can drop work without noticing needs one component that can catch it, even if that component only runs nightly over yesterday's queue.

4. **Fairness is a coefficient, not a vibe.** NASA's Deep Space Network writes fairness directly into the objective, so a schedule that starves a small program pays for it visibly in the score. The fleet failure this prevents: one urgent epic arrives and for days every worker feeds it, while maintenance rots and a smaller project's issues age out, and the only current defense is a human noticing.

5. **Accept on a vector, not a scalar.** Collapsing quality to one number gets gamed. At a payments company with 5.5 million lines of code, an automated search learned to game a modularity score by moving single classes into fresh modules, and the score's improvement did not predict whether developers accepted the change. So deterministic metric gates select candidates, and an independent judge that was not the optimization target accepts them. Gas City already runs this shape: an adversarial stress-test pass before a sensitive change ships.

6. **Route model tier as a budgeted bandit, not a static table.** Each pair of task class and model tier is an arm with a random cost, in tokens and wall-time, and a random reward, defined as merged and not reverted within N days. Play each arm in proportion to the chance it is best per unit cost. With thin data the bandit collapses back to the static table, so the floor is exactly today's behavior. In Gas City the cost estimator already exists; nothing consumes it for the routing decision yet.

7. **Replay recorded traces, not simulated ones.** This is the one structural advantage a software factory holds over a telescope: the telescope sees each patch of sky once and must simulate its past, while the factory recorded its own. Require any proposed optimizer to beat a simple baseline on replayed traces before it ships. Prevents the entire genre of clever schedulers adopted on argument rather than evidence.

## A priority index is not a hidden heuristic

Gas City runs under a strict design rule: transport and plumbing code does mechanics, models do the reasoning, and no semantic judgment gets smuggled into application code as a hardcoded heuristic. A scored dispatch line looks, at first glance, like exactly the thing the rule bans.

It is not, and the distinction is worth having crisply. A priority index over declared features, a solver over declared constraints, a bandit over declared posteriors: each is a deterministic mechanism over versioned data, closer in kind to clamping a value between a min and a max than to a keyword regex deciding what a task means. The judgment lives in what the model writes into the declarative layer, the priorities, deadlines, and constraints; the solving is transport. This division of labor already has a published implementation, where a language model edits a constraint model one item at a time, every edit validated, with solving strictly separated from editing. It also gains from outside progress: open solvers improve on their own compute curve, independent of anything happening to the language model.

![Model, data, solver: the judgment lives in the declared model; the solving is transport, and when the rules admit no schedule the solver names the few that conflict.](./img/factory-observatory-10-model-data-solver-iis.png)

## What nobody has measured yet

The open questions are not decoration; several of them decide whether any of the above matters at quarter scale. Which objective actually correlates with business value over a quarter is unknown, and flow time is a guess. The exchange rate between one engineer interruption and a day of queue latency is a number every schedule sets implicitly and few teams have measured. When to preempt a running six-hour agent session that telemetry says is pursuing the wrong approach has no principled answer yet, and neither does pricing human-review bandwidth, which the six-changes-waiting-a-day failure suggests is the scarcest resource in the building. A tier router needs an exploration budget for arms it knows little about, and nobody knows how large that budget should be.

The broadest question is also the simplest. Which scheduling policies actually beat greedy agent execution, by how much, at what queue depth and dependency coupling, is an experiment nobody appears to have published for a software factory. The traces to run it are already sitting in the ledgers.

---

_This is the practitioner's companion to the technical report [Operations research as a framework for software-factory scheduling](/writing/or-for-software-factories/), which carries the full formulations, the literature review, and the four-phase adoption path. For the narrative version of the astronomy correspondence, see [The software factory as an observatory](/writing/the-software-factory-as-an-observatory/). Illustrations in the [ian-xiaohei-illustrations](https://github.com/helloianneo/ian-xiaohei-illustrations) style (MIT-licensed skill by Ian Neo)._
