---
title: "Cost-aware fleet scheduling and model routing"
book: engineering-reliable-coding-agents
order: 18
part: 6
kind: chapter
number: 18
---

A fleet can increase throughput while also increasing the cost of each accepted result. Only the fleet’s own traces can establish which happened. Concurrent execution, together with a willingness to attempt work a human team might have left queued, exposes more tasks to model inference, verification, review, and recovery. Throughput alone therefore does not establish an economic gain.

The evidence is largely transferred from other fields. One strong software-engineering result concerns cheap baselines; observatory and compute-cluster scheduling, search-based software engineering, budget-constrained bandit theory, and router calibration supply directional mechanisms. My fleet replay remains a narrative illustration.

These systems schedule telescopes and compute clusters, not software-agent fleets. The transferable design is narrower:

- make new decisions from current state;
- limit how long the decision process may run;
- compare sophisticated policies with tuned cheap alternatives; and
- preserve enough evidence to detect when the policy is worse.

Their scheduling cadence, thresholds, cost ratios, and performance constants do not transfer.

Allocation policy is easy to mistake for a local configuration detail. In an agent fleet, it determines which model receives a request, which queued task moves first, whether running work remains fixed, and when an obsolete plan is discarded. These choices connect inference cost to elapsed time, reviewer demand, and the probability that completed work will survive evaluation.

A cheaper model call can trigger enough repair and review to cost more per accepted result. A mathematically better schedule can become operationally worse if computing it delays the work beyond its deadline. I therefore treat scheduling and routing as measured decisions rather than static configuration.

## Define the allocation decision before choosing the algorithm

**Cheapest-sufficient routing** selects, for each request, the least expensive worker predicted to satisfy that request’s declared requirement. The worker may be a model tier, a model-plus-tool configuration, or another execution pool with a known price.

The important word is *sufficient*. The router does not minimize the invoice in isolation, and it does not assign every task class through a fixed hand-written rule. It estimates expected performance and expected cost for the current request, then chooses the least expensive option predicted to satisfy the stated tradeoff.

This definition leaves two deployment decisions open:

- how performance is predicted; and
- how sufficiency is expressed.

Both affect calibration and evaluation.

**Shipping the incumbent at the deadline** places a hard time limit on schedule computation and executes the best feasible plan available when that limit expires. A feasible plan respects constraints that cannot be violated, such as capacity, hard deadlines, and work already in flight. The **incumbent** is the best feasible plan found so far.

Additional solve time may find a better plan or establish that the incumbent is optimal. The schedule has operational value only while it still describes the fleet’s current state. A solve deadline makes decision latency an explicit policy rather than an accidental result.

The **optimality gap** records how far the shipped plan may remain from the best possible solution, using the strongest bound available when the deadline expires. Preserving that gap distinguishes two operationally different outcomes:

- a plan known to be close to optimal; and
- a merely feasible plan found before search made much progress.

Operations may reasonably execute either. Evaluation should not treat them as equivalent.

![The re-decision loop recomputes from observed events under fixed work and churn costs, then executes a deadline capped incumbent while retaining its optimality gap.](/book-figures/ch18-redecision-loop.svg)

Ordinary arrivals may use a cheap greedy rule between re-decision events. The system discards the existing plan only when the cost of recomputing is lower than the expected cost of executing or repairing an obsolete one.

These terms identify the decisions that must be made before selecting an algorithm:

- What counts as sufficient performance?
- How long may schedule computation run?
- Which constraints are inviolable?
- How is running work represented?
- What reassignment cost counts as plan churn?
- Which measure of remaining solution uncertainty must be retained?

The companion catalog contains algorithmic patterns. The narrower question here is whether these decisions lower accepted-result cost or improve flow on the fleet’s own workload.

## Recompute from current state and stop solving on time

An observatory scheduler can spend the night improving a plan that clouds have already invalidated, or compute another imperfect plan from the sky that remains observable. Bellm et al. ([2019](https://arxiv.org/abs/1905.02209)) describe the Zwicky Transient Facility taking the second approach in production since 2018. When changing conditions invalidate the schedule, it resolves the nightly integer program again rather than enumerating every weather scenario in advance.

Three directional observatory-scheduling sources support transferring this decision architecture to agent fleets. None provides a strong result for software fleets. The recommendation is therefore limited to choosing and measuring a re-decision policy. The appropriate cadence remains a local deployment decision.

The schedule should be treated as the current output of a control loop. At a coarse interval, or after an event invalidates an important assumption, the scheduler computes again from observed state. Between those points, a competent greedy rule can place ordinary arrivals without paying for a complete solve.

The system should abandon an obsolete plan when recomputation costs less than repairing or completing that plan. This comparison must include decision latency. An excellent schedule returned after the queue, capacity, or deadlines have changed is a schedule for a fleet that no longer exists.

Current state includes more than queued work. Running tasks may:

- consume scarce model or execution capacity;
- hold repository leases;
- occupy reviewer slots;
- have produced costly intermediate state; or
- contain work another worker cannot reconstruct cheaply.

A re-solve should represent those commitments explicitly. Treating work in flight as fixed is a conservative default unless preemption has been separately justified.

The objective should also charge for **plan churn**: avoidable reassignment or resequencing that forces workers to discard useful preparation or partially completed work. Cadence, invalidation triggers, preemption, and churn penalties belong to the scheduling design rather than being added after the objective is chosen.

When the solve deadline arrives, execute the incumbent and retain its optimality gap. This follows from the mismatch between proof time and operational time. A solver may find a feasible plan quickly but take much longer to establish how close it is to the best plan. Meanwhile, new work arrives and the state used to construct the plan ages.

The deadline prevents optimization itself from becoming another queue. The stored gap supports later questions:

- Did large gaps coincide with poorer flow?
- Would more solve time have changed the executed assignments?
- Did a tuned greedy policy perform just as well?
- Did solve latency consume the predicted scheduling benefit?

Parazin et al. ([2022](https://arxiv.org/abs/2203.00013)) compared a mixed-integer scheduler for gravitational-wave follow-up with a tuned greedy heuristic. Neither won consistently. Under a 500-second cap, each performed better on different skymaps, and only 37 of 97 well-localized skymaps improved under the reported optimization comparison. Across 951 simulated events, a hybrid improved detection efficiency by roughly 3 to 11 percent. The authors also reported that reducing the cap to 100 seconds would have truncated only 64 additional schedules without a substantial efficiency loss.

These are directional results from gravitational-wave follow-up rather than operating parameters for an agent fleet. They support evaluating:

- the solve deadline;
- the retained gap;
- the greedy baseline; and
- a hybrid policy.

They argue against assuming that either the optimizer or the heuristic will win in advance.

Naghib et al. ([2019](https://arxiv.org/abs/1810.04815)) describe another observatory design in which a feature-based, memoryless policy chooses again from current state at every step. *Memoryless* here does not mean that durable state is discarded. It means that the next scheduling action does not depend on preserving a brittle sequence of prior planned actions.

Interruptions are absorbed by observing the new state and making another decision. The evidence comes from a framework and simulation, so it supports a plausible architecture rather than a measured advantage for agent execution.

The fleet-wide and worker-local decisions should remain separate. A global allocator determines how scarce model tiers, reviewer capacity, or execution pools are divided among classes of work. A worker-local dispatcher determines which eligible item a particular worker takes next.

Combining both choices in one opaque score makes it difficult to determine whether a poor outcome arose from resource allocation or queue ordering. It can also allow local dispatch to undo a capacity decision the global layer just made.

The companion entry `formalize-work-as-constraints-and-solve-globally` proposes representing requests in one constraint language so an allocator can optimize across them. Its lineage reaches Hubble scheduling in 1990. The architecture is useful only when that representation captures the constraints operations actually enforce.

A nominally global solution built from missing deadlines, false independence assumptions, or omitted affinity constraints can be less coherent than separate local rules. The companion aside `audit-the-allocation-layer` therefore asks which policy actually controls execution, planning, and optimization. Its observatory analogy has no software-fleet measurement.

Probe costs belong in the same accounting. The thinly supported companion entry `probe-only-above-an-uncertainty-threshold` asks whether a dry run, canary, or classifier call reduces enough uncertainty to justify its latency and inference cost. Its theoretical constant comes from adversarial single-machine scheduling and does not transfer.

The local question is operational:

> For which uncertain requests does a probe change the selected worker or schedule often enough to repay its cost?

When logs cannot answer that question, probing remains another unmeasured allocation policy.

The evidence boundary should remain visible. The source survey does not cover much of the major USENIX and ACM cluster-scheduling literature. Agent runtime variance is also partly endogenous. Repeated tool failures, unstable environments, and unnecessary retries should be repaired at their source before the scheduler is asked to absorb them.

Nor does the cited evidence establish a general prohibition on preempting long-running agent sessions. Keeping running work fixed during a re-solve is a conservative representation of existing commitments rather than proof that preemption is always wrong.

Choose the cadence and solve deadline through a short pilot. Retain the incumbent, optimality gap, solve time, assignment decisions, and resulting execution trace at every re-decision. Compare the complete policy with a tuned greedy baseline.

The companion entry `pilot-to-pick-the-algorithm-then-commit-the-budget` states the same logic: spend a small amount distinguishing among methods, then commit the operating budget to the one that performs better.

The design becomes auditable when the following are explicit:

- the re-decision trigger;
- the solve deadline;
- treatment of in-flight work;
- the churn cost;
- the simple baseline; and
- the metrics used to compare them.

Its value remains an empirical question until the fleet’s traces answer it.

## Route to the cheapest worker predicted to meet the requirement

Cheapest-sufficient routing has support from three directional literature items and no strong result. Cayci, Eryilmaz, and Srikant ([2020](https://arxiv.org/abs/2003.00365)) developed budget-constrained online learning under broad cost and reward distributions. Somerstep et al. ([2025](https://arxiv.org/abs/2502.03261)) analyzed a calibrated static router. Li ([2025](https://arxiv.org/abs/2502.02743)) reported preference-conditioned dynamic routing in a single-author preprint.

All three evaluate mathematical formulations or benchmarks. None evaluates a production software-agent fleet. This section therefore defines the routing decision and the measurements required to test it. It does not establish that a learned router will lower the cost of a particular fleet.

My fleet orchestrator illustrates the starting point. Each execution pool has a model assigned through a static configuration string. There is no request-level performance estimate, cost model, deadline, or lookahead.

The static table is predictable and legible. It also supplies the fallback when a selective router lacks evidence. Its limitation is that dispatch cannot respond to variation in request difficulty.

A cheapest-sufficient router replaces the static assignment with two estimates for every candidate worker on the current request:

- expected task performance; and
- expected total cost.

It then selects the least expensive worker predicted to satisfy the declared requirement.

Somerstep et al. analyze this plug-in structure in CARROT and argue that its direct routing overhead is negligible because selection requires evaluating the two predictors for each available model. The useful behavior still depends on calibration: predicted performance must correspond to observed performance on the deployment distribution.

A mathematically correct selector cannot compensate for a predictor that assigns unjustified confidence to unfamiliar work.

The sufficiency requirement must be operational rather than rhetorical. “Good enough” might mean:

- passing an executable verifier;
- remaining below a defect-probability threshold;
- satisfying a calibrated review rubric;
- meeting a deadline;
- preserving a reliability requirement; or
- satisfying a caller-selected cost-quality tradeoff.

Each defines a different routing problem.

The roughly 15-fold token premium reported for some fan-out configurations in Chapter 17 makes this choice economically consequential. Token count is still not the final objective. A cheap model that triggers repeated repair, verification, and review can cost more per accepted result than a stronger model would have cost initially.

When sufficient outcome data accumulates, the router can update through a budget-constrained bandit, such as Thompson sampling, with the algorithmic details left to the companion catalog. Cayci, Eryilmaz, and Srikant establish an asymptotic regret guarantee under moment conditions that permit heavy-tailed, correlated, and even negative cost-reward pairs.

Those properties resemble agent dispatch more closely than a setting with bounded independent rewards. The guarantee does not tell an operator whether the reward represents useful software work, and it provides limited guidance during the early period when production exploration is most costly.

Online updating addresses a real limitation of static routing. Models and workloads change. A model revision can change which tier is sufficient. A new repository or task family can move requests outside the router’s calibration population.

Li conditions routing on a user-selected performance-cost preference, allowing one learned policy to represent several tradeoffs at inference time. The evidence is benchmark-based and comes from a single-author preprint. It supports testing preference conditioning. Calibration under delayed software outcomes remains unmeasured.

The reward definition is the controlling measurement choice. Software signals arrive at different times and answer different questions:

- tests may be immediate but incomplete;
- review may identify defects later;
- rework or rollback may occur after acceptance;
- user rejection may arrive after the router has recorded success; and
- review effort may erase the apparent savings of the selected model.

Combining those signals into one reward is a construct-validity decision outside the routing mathematics. The reward definition should be versioned so that policies trained under different meanings of success are not silently compared.

A learned policy should remain advisory until its recommendations correlate with an outcome measured outside the router and relevant to accepted work. In advisory mode, record:

- the requested route;
- the route actually taken;
- predicted performance;
- predicted cost;
- uncertainty;
- the routing reason; and
- the eventual outcome.

The thinly supported companion entry `log-scheduling-decisions-for-selection-effect-modeling` adds an important field: why the request received that route. Without the selection reason, later analysis cannot distinguish model quality from the policy that sent different work to each model.

When observations are sparse, fall back to the static cost-performance table. That floor is the current configuration and can be measured directly. The learned router should take control only where its errors can be estimated with adequate density.

Rare task families, new models, and new reward definitions should remain on the static floor until the router exposes enough evidence and uncertainty to justify a different choice.

Calibration can fail before deployment. Benchmark-derived routing data may encode:

- regular prompt formats;
- benchmark-specific scoring;
- an unrealistically fixed model menu;
- task distributions unlike production; or
- missing repair and review costs.

CARROT assumes a static model pool. Production pools change as prices move, versions are retired, rate limits vary, and tool compatibility excludes some models. Each change requires recalibration or creates a region in which the router is extrapolating.

Online exploration creates another cost. A learning policy must sometimes choose an uncertain worker to gather information, and the routed request is real production work. A budget constraint reveals the cost but does not decide who may bear it.

Deployment therefore needs:

- an exploration budget;
- exclusions for high-consequence work;
- a stop condition tied to routing error;
- a static fallback; and
- a record of which production requests were used for learning.

An asymptotic guarantee does not excuse poor performance during the learning period.

The companion pattern `cost-cascade-routing` provides another response to uncertainty. Begin with a cheaper route and escalate when calibrated confidence is insufficient. Chang ([2026](https://arxiv.org/abs/2604.12262)) reports that confidence-gated cascades often outperformed always-on strong-model fan-out in both cost and quality.

That result supports the catalog pointer rather than a universal deployment rule. A cascade changes latency and couples its stages through the escalation signal. It must be evaluated as one complete route, with cost measured across every call.

A routing decision record should include:

```text
sufficiency_requirement:
reward_version:
calibration_population:
model_pool_version:
predicted_performance:
predicted_cost:
uncertainty:
routing_reason:
exploration_budget:
static_fallback:
eventual_outcome:
accepted_result_cost:
```

Evaluation should report cost per accepted result and failure rates by request class, not only average token use.

Cheapest-sufficient routing is useful because it makes the economic policy explicit: what is being predicted, what requirement must be met, and which tradeoff is being selected. It cannot repair an unrepresentative calibration set, a reward that measures the wrong outcome, or a task whose true cost appears only after repair and review.

## Replay identical arrivals before changing allocation policy

In one replay of my agent fleet, the interesting scheduling idea lost to a one-word configuration change. Across eleven weeks of recorded traffic, a four-feature weighted index performed within 0.1 percent of plain priority banding.

That result has narrative value only and is not load-bearing evidence for this practice. The strong support comes from SWAY, the controlled software-engineering study by Chen et al. ([2016](https://arxiv.org/abs/1608.07617)), which shows why a proposed search method should have to beat a cheap baseline. Decima, from Mao et al. ([2018](https://arxiv.org/abs/1810.01963)), and the telescope-network work of Lampoudi, Saunders, and Eastman ([2015](https://arxiv.org/abs/1503.07170)) provide directional support for learned scheduling and validation against known optima.

Fixed-arrival replay itself remains a reasoned transfer rather than a controlled result from an agent fleet.

An **arrival trace** is a time-ordered record of work entering the system, including the information available when each item arrived. A **dispatch policy** decides which eligible item receives a resource next. **First-come scheduling** orders eligible work by arrival time, subject to constraints that make an item impossible to run.

A **replay harness** re-executes the recorded arrivals under a candidate dispatch policy without changing production state. It differs from the single-run replay used for debugging in Chapter 9. That replay reconstructs one execution. This harness holds an entire workload sequence fixed while replacing the policy that allocates it.

The trace needs, at minimum:

- arrival time;
- priority;
- resource eligibility;
- claims and releases;
- observed duration;
- completion or failure outcome;
- review verdict; and
- work already running at each decision.

It also needs any constraint that affected feasibility. If the historical record omits capacity, cancellation, model compatibility, repository leases, or work already in flight, the replay may create choices the live scheduler never had.

Missing decision context is not neutral noise. It changes the feasible schedule.

Holding arrivals fixed creates a paired comparison. Every policy encounters the same demand in the same order. Differences in simulated flow can therefore be attributed to the policy and its interaction with the reconstructed state rather than to one arm receiving a busier week.

The replay is not causal in every respect. It does remove one large source of variation that often overwhelms scheduler comparisons.

The first run should validate the harness rather than compare policies. Construct small cases whose best schedule is known, including:

- simultaneous arrivals;
- a resource becoming unavailable;
- a priority inversion;
- incompatible execution pools;
- a cancellation while work is queued; and
- work already in flight when a new item arrives.

Confirm that the replay clock, eligibility logic, claim duration, completion events, and resource accounting reproduce the expected schedule.

Lampoudi, Saunders, and Eastman (2015) derived an integer-program formulation for the Las Cumbres Observatory network and reported computational validation at realistic problem sizes. The transferable practice is to test the scheduling kernel on instances with known answers before trusting its output on a historical trace.

The second run establishes cheap baselines. Compare the proposed policy with:

- first-come scheduling;
- a simple priority sort;
- a tuned greedy rule; and
- random oversampling.

Random oversampling generates several inexpensive randomized schedules and retains the best under the declared objective. Chen et al. (2016) developed SWAY by sampling a large candidate population down to better solutions rather than evolving many generations. Across several software-engineering models, it was competitive with state-of-the-art evolutionary algorithms at substantially lower computational cost. The authors proposed it explicitly as a baseline for search-based software engineering.

The controlled result supports the discipline: an elaborate optimizer that cannot beat a cheap alternative has not earned adoption.

The objective must be fixed before inspecting the policy results. Possible objectives include:

- mean completion time;
- priority-weighted flow time;
- deadline misses;
- accepted-result cost;
- reviewer delay; and
- time spent blocked on a constrained resource.

These measures describe different failures. A lower fleet-wide mean can coexist with severe delay for one priority or request class.

**Starvation** is persistent denial or extreme delay to a class because other eligible work repeatedly moves ahead of it. Report outcomes by class and define a starvation guard before running the comparison. An aggregate gain is not acceptable when one class pays for it through unbounded delay.

My fleet ledger contained 1,286 work items across 22 execution pools over eleven weeks. Age-only first-come scheduling produced 6.84 hours of priority-weighted flow time. A hybrid rule, plain priority rule, and four-feature weighted index each produced 6.70 hours, within 0.1 percent of one another. P1 tail latency moved from 20.4 hours to 18.8 hours without triggering the starvation guard.

I had recorded a 15 percent improvement requirement before running the replay. The weighted index therefore failed its gate. It was the more interesting design, and replay is why it did not ship.

Those figures explain what this protocol prevented me from building. They do not establish an expected gain for another fleet.

Capacity distribution explained more than the aggregate result. The visible improvement concentrated in one **contended pool**, where eligible work regularly exceeded available capacity. An **uncontended pool**, where capacity usually met demand, showed almost no difference across policies.

That is the expected shape of a genuine scheduling effect. When work rarely waits for a resource, queue order has little opportunity to change the outcome. A policy claiming large gains in an uncontended pool deserves scrutiny.

Decima provides a useful but bounded comparison. Mao et al. (2018) trained a cluster scheduler under continuous stochastic arrivals and evaluated it on a 25-node Spark cluster. They reported at least a 21 percent improvement in average job-completion time over hand-tuned heuristics, with gains reaching approximately twofold under high load.

Those measurements support learned scheduling in that cluster environment. They do not evaluate fixed-arrival replay and do not establish an expected effect for agent work. The transferable experimental rule is narrower: preserve the arrival process when comparing policies and look for gains where resources are actually contested.

Historical replay also preserves historical selection. Work absent from the ledger remains absent, including:

- requests users never submitted because the old system was slow;
- tasks operators diverted manually;
- work rejected before entering the queue; and
- difficult requests routed to another pool.

A route may therefore contain an artificially easy trace because the incumbent policy sent hard work elsewhere. The companion entry `log-scheduling-decisions-for-selection-effect-modeling` adds the reason each item entered a route, allowing later analysis to model selection. It cannot reconstruct demand that was never observed.

A live policy can also change future arrivals. Faster completion may create more demand. Priority treatment may change how users label requests. Model routing can change reviewer behavior and the kinds of tasks people submit.

Historical replay cannot capture all such feedback. Use a **temporal holdout**, a later period excluded while policies are developed, to test whether the replay result survives workload drift. Then stage deployment through:

1. shadow evaluation;
2. one-project or one-pool canary;
3. bounded live authority; and
4. fleet-wide rollout.

Each stage should retain an external outcome measure and the starvation guard.

A compact replay protocol is:

1. Export an immutable arrival trace containing decisions, resources, claims, durations, outcomes, and review verdicts.
2. Build a discrete replay clock and validate the scheduler on constructed cases with known answers.
3. Record the objective, class-specific starvation guard, acceptance threshold, and cost accounting before comparing policies.
4. Replay first-come scheduling, simple priority, a tuned cheap baseline, random oversampling, and each candidate over the identical trace.
5. Report aggregate and per-class outcomes, decision cost, contention location, and optimality information where available.
6. Repeat the comparison on a temporal holdout.
7. Require shadow and canary evidence before expanding live allocation authority.

This protocol is stricter than asking whether the queue feels better. It asks:

- whether the candidate changes a declared outcome on identical work;
- whether a trivial policy captures the same gain;
- whether one class pays for the improvement;
- whether the effect occurs where capacity is constrained; and
- whether it survives later traffic.

If the ledger already records the required state, the harness can be built without changing production scheduling. If it does not, the immediate scheduling task is instrumentation.

The earlier decisions in this chapter then become hypotheses rather than received settings. Replay several re-decision cadences and solve limits while preserving in-flight work. Measure flow, churn, solve latency, and the optimality gap retained at each limit.

Replay cheapest-sufficient routes from logged estimates when counterfactual outcomes are available. Otherwise run them in shadow. Measure accepted-result cost and calibration error by request class.

Build the trace, hold arrivals fixed, make the cheap policy compete, and let the fleet produce the evidence its allocation policy requires.

## Instrument decisions before optimizing them

When the ledger does not preserve decision state, begin with events the system can record without prediction:

- arrival time;
- priority;
- claim and release events;
- observed duration;
- completion or failure outcome; and
- review verdict.

These fields reconstruct demand, occupancy, and accepted work. They also expose missing or contradictory histories before policy-specific estimates complicate the schema.

Next, record the resource state visible at every dispatch decision:

- available capacity;
- eligible execution pools;
- work already running;
- leases or locks held;
- deadlines;
- model or tool compatibility;
- reviewer availability; and
- constraints that made an otherwise eligible item unavailable.

Record the route selected and the reason for that route in the same decision event. State and reason need a shared decision identity and timestamp. Without them, later analysis cannot determine which alternatives were feasible or distinguish worker performance from the policy that selected the work.

Only after those observations are complete should the ledger add estimates such as:

- predicted cost;
- predicted task performance;
- routing uncertainty;
- expected duration;
- solver objective value; and
- optimality gap.

Estimates belong last because they are outputs of a policy rather than observations of what happened. Store the policy, model, feature, and reward versions that produced them. Recalibration should create a new estimate record rather than rewrite the historical one.

The first operating comparison can remain descriptive. Ask whether high-throughput intervals under the incumbent policy also have a higher accepted-result cost than lower-throughput intervals. Report both measures by request class and constrained resource.

That comparison cannot establish:

- the counterfactual effect of a new router;
- the correct re-decision cadence;
- the correct solver limit;
- an exploration guarantee;
- the effect of demand that never entered the ledger; or
- the causal effect of throughput on accepted-result cost.

Those questions still require replay, shadow execution, or controlled rollout on the fleet’s workload. None of the cited studies reports results from a software-agent fleet.

My replay supplies no default cadence, threshold, or cost ratio. Do not import an observatory schedule, a bandit guarantee, or my 15 percent promotion rule.

The useful outcome is an allocation record that can answer:

- What arrived?
- What was eligible?
- What resources were available?
- Which alternatives existed?
- Which policy made the decision?
- Why did it choose that route?
- What did the work cost?
- What outcome survived review?
- Which later events changed the interpretation of that result?

Until the ledger can answer those questions, choosing a more sophisticated policy is premature.

## Sources and evidence

### Re-decide cheaply and ship the incumbent

- lit/directional: Bellm, E. C., et al. (2019), "The Zwicky Transient Facility: Surveys and Scheduler," PASP 131, 068003, arXiv:1905.02209.
- lit/directional: Naghib, E., et al. (2019), "A Framework for Telescope Schedulers: With Applications to the Large Synoptic Survey Telescope," AJ 157, 151, arXiv:1810.04815. Framework and simulation evidence.
- lit/directional: Parazin, B., et al. (2022), "Foraging with MUSHROOMS: A Mixed-integer Linear Programming Scheduler for Multimessenger Target of Opportunity Searches with the Zwicky Transient Facility," ApJ 935, 87, arXiv:2203.00013.
- No strong result and no software-fleet measurement support this entry; all three items are observatory scheduling, and the cadence, cap, and churn charge remain deployment decisions.
- Corroboration (narrative only): the author's transfer notes on observatory scheduling restate the same ZTF and MUSHROOMS results already carried above as literature evidence.

### Route each request to the cheapest sufficient model

- lit/directional: Cayci, S., Eryilmaz, A., & Srikant, R. (2020), "Budget-Constrained Bandits over General Cost and Reward Distributions," arXiv:2003.00365. Asymptotic guarantee under stated moment conditions.
- lit/directional: Somerstep, S., et al. (2025), "CARROT: A Cost Aware Rate Optimal Router," arXiv:2502.03261. Static model pool assumed.
- lit/directional: Li, Y. (2025), "LLM Bandit: Cost-Efficient LLM Generation via Preference-Conditioned Dynamic Routing," arXiv:2502.02743. Single-author preprint, benchmark evidence.
- Three directional items and zero strong results; none evaluates a production software-agent fleet, so the entry defines a decision and its measurements rather than establishing a cost reduction.
- explorer/strong: CascadeDebate (Chang 2026), arXiv:2604.12262. Supports the catalog pointer only, not the routing entry itself.
- Corroboration (narrative only): the author's transfer notes restate the budgeted-bandit formulation already carried above.

### Replay fixed arrival traces before changing policy

- explorer/strong: SWAY, Chen, J., et al. (2016), "Sampling as a Baseline Optimizer for Search-Based Software Engineering," arXiv:1608.07617. The one in-domain software-engineering result: a candidate optimizer that cannot beat a cheap baseline has not earned adoption.
- explorer/directional: Decima, Mao, H., et al. (2018), "Learning Scheduling Algorithms for Data Processing Clusters," arXiv:1810.01963. Measures learned scheduling under stochastic arrivals, not fixed-arrival replay; the replay transfer is the explorer's.
- explorer/directional: Lampoudi, S., Saunders, E., & Eastman, J. (2015), "An Integer Linear Programming Solution to the Telescope Network Scheduling Problem," arXiv:1503.07170. Supports validating a scheduling kernel on instances with known optima.
- Fixed-arrival replay itself is a reasoned transfer, not a directly controlled fleet result, and per-class starvation must be checked separately because a policy can improve the mean by starving one class.
- Corroboration (narrative only): the author's eleven-week replay of 1,286 work items across 22 execution pools, and the author's shadow, canary, then fleet rollout design. Corroboration, never an admitting basis.
