---
title: "Proxy metric gaming and layered evaluation signals"
book: the-system-around-the-model
order: 6
part: 2
kind: chapter
number: 6
---

## When perfect recall rewards returning everything

CodeProbe ([public repository](https://github.com/sjarmak/codeprobe)) scores agent runs on tasks mined from our own repositories, and for one day its scorer offered a recall-family reward. Under that reward an agent could earn a 'perfect' 1.0 by returning the entire repository, because a response containing everything cannot omit a relevant item. The strategy was degenerate, but it was correct under the proxy. Recall counts how much of the relevant material came back and ignores how much irrelevant material came back with it. We shipped the recall family and retracted it a day later, which was a day later than I would have liked.

The replacement default scores overlap F1 against the oracle set, and that measure penalizes over-shipping as well as under-shipping. An agent that returns the entire repository no longer scores 1.0, and the recall family remains available only as an explicit per-task opt-in. The change did not make the benchmark immune to gaming. It changed the rewarded surface by adding a precision penalty to the scorer's treatment of overlap. A scoring rule that penalizes volume leaves a different set of strategies open: retain less, compress aggressively, or shape the retrieved text toward whatever the judge rewards.

In my own agent memory system, the corresponding control sits at a different point and governs a different decision. A write gate decides what may enter the store. At write time, the system predicts whether keeping an item retrievable will improve a future outcome. Retention is one available action, alongside time-to-live, discard, and supersede.

Returning everything would stop that memory system from selecting anything. Every retained mistake, obsolete instruction, and irrelevant observation would compete for the model's attention. An answer-quality rubric could still accept the response when the needed fact sits somewhere inside that mass. Such a rubric records the judged answer. It does not reveal whether memory supplied a small, current, causally useful context.

Any proxy worth optimizing admits behavior that improves the measured value without preserving the property the measure was meant to represent. An acceptance system therefore needs signals separated by control point, ownership, or time. The overlap F1 belongs to the benchmark's scoring point. The write gate belongs to the memory system's retention decision. Treating them as one composite control would conceal which failure each mechanism can observe and which decision it can change.

This is an optimization failure. The plurality-vote oracle gap in Chapter 5 was a grading failure, and there the selection was already wrong before any optimization began. Here the metric degrades because a system searches for behavior that scores well under it. A hackable proxy can track the intended property quite well at first and then become less informative as models, prompts, candidate selection, or engineering effort adapt to it.

The distinction determines the remedy. Better labels repair a grader. Layered control limits the damage when a once-useful measure becomes a target.

Skalse et al. ([2022](https://arxiv.org/abs/2209.13085)) made the limit precise. Consider two reward functions evaluated over the set of all stochastic policies, where a policy may assign probabilities to any available action. Call the rewards mutually unhackable when optimizing either one cannot lower expected reward under the other. Across that unrestricted policy set, mutual unhackability is possible only when at least one reward is constant. A constant reward expresses no preference among behaviors. It therefore cannot guide useful optimization.

The result rules out a universal escape through metric design. Tests passed, diff size, lint status, answer quality, and a model judge each encode real information about a change. Once one of them ranks candidate behavior, however, the ranking leaves distinctions out. Another nonconstant account of quality can order some policies differently. Enough search pressure can find that disagreement and move toward the proxy while moving away from the intended outcome.

The theorem establishes a property of the policy space. The timetable for failure remains empirical. A deployed coding agent has a constrained action set, a finite search budget, limited knowledge of the evaluator, and whatever permissions the surrounding system grants. Those restrictions can make a proxy difficult to exploit in practice, and they can leave two measures in agreement throughout the region the agent can reach. The theorem does not estimate the pressure required to expose a disagreement, and it does not predict whether a particular release will encounter one.

That boundary changes how I use the result. I do not treat every rising score as evidence of active gaming, and I do not discard useful metrics because they are imperfect. I assume instead that the validity of a proxy is conditional on the optimizer, its accessible actions, and the pressure applied. When any of those change, the evaluation system has to show again that the proxy still tracks the property that justified it.

Layering supplies that control only when the layers are separate in the right way. Adding three model judges trained on similar data may reduce random error, but it does little against a behavior all three reward. Averaging test pass rate, lint status, and a rubric score produces another scalar target. The optimizer can search against the weighted sum, and whoever chose the weights has already decided which failures are affordable, because all three measurements feed one acceptance decision.

The useful separation is architectural. One signal can be read from state the candidate change cannot modify. Another can be collected after deployment, when delayed failures become visible. A third can be owned by a group that does not ship the agent whose score is under review.

These signals may be statistically correlated, which is often desirable. Their independence is a property of control rather than of the numbers. The optimizing party cannot rewrite the rule, suppress the observation, or approve a threshold change inside the same transaction that seeks acceptance.

In my own background-agent review pipeline, the gate reads its invariant definitions and agent instructions from the base branch. The proposed change supplies neither. An author can change code that the gate evaluates but cannot weaken the active rules inside that same proposal. If the base branch lacks the required configuration, the check fails rather than running an empty ruleset that would pass everything. This separation removes the most direct path, which is editing the judge while editing the candidate. The invariants themselves can still be gamed.

Published support for layering comes from search-based software testing rather than from agents. Formica et al. ([2022](https://arxiv.org/abs/2207.11016)) searched Simulink models with two fitness functions, one generated from a specification and one defined by hand to encode an engineer's domain knowledge. The combined search found failures that neither guidance source found alone. That evidence is directional. It stops at complementarity in that setting and does not establish a result for coding agents.

The same study also exposed a coordination cost that the word 'layering' hides. The two fitness functions could guide one search only after someone chose how to scale them against each other. A weighted combination can let many small gains outweigh a rare but serious violation. A veto arrangement avoids that trade for hard invariants, but it can reject useful work when the invariant is noisy. An advisory signal preserves throughput and has no force unless a person or a later gate responds to it.

I therefore assign different jobs to different signals. Structural invariants veto changes that cross a boundary the organization is unwilling to trade away. Outcome measures estimate whether accepted changes helped under actual use. Diagnostic scores explain movement without granting acceptance. Human-owned thresholds govern when an advisory result becomes a block.

The design remains fallible. No single optimizable score both defines success and decides acceptance.

## Watch the relationship, not the rising score

Gao et al. ([2022](https://arxiv.org/abs/2210.10760)) increased the optimization pressure applied to a learned proxy reward model and measured a separate gold reward model alongside it. Gold reward rose at first, reached a peak, and then fell while the proxy continued to improve. Reinforcement learning and best-of-n candidate selection produced different smooth curve shapes. Measuring the whole optimization trajectory revealed a divergence that a single endpoint measurement would have missed.

I treat an improving proxy as a hypothesis about quality and retest the relationship that made the proxy useful in the first place. I track its association with an independently observed quality signal on a specified reference distribution, alongside the proxy level itself. A rising proxy paired with a weakening association is an evaluation incident even when no acceptance threshold has been crossed.

The two optimization methods in the study clarify why the curve depends on process. Reinforcement learning updates a policy toward behavior that its reward model prefers. Best-of-n selection leaves the generator fixed, samples more candidates, and chooses the one with the highest proxy score. Both methods search harder as pressure increases, but they expose different regions of candidate behavior. Their distinct fitted curves show that divergence can have regular structure while still depending on how the search is conducted.

That regularity makes monitoring plausible, but the evidence has a narrow boundary. The study measured quality with a synthetic gold reward model. Production systems rarely have an evaluator that is both available at monitoring time and entitled to serve as truth. The measured coefficients therefore do not transfer to code review, migration work, or agent memory.

The observed shape does transfer. Proxy improvement can precede, accompany, and then conceal deterioration under increasing optimization pressure.

![In illustrative shape without reported coefficients, proxy performance keeps rising as optimization pressure increases, but independent quality peaks and then declines throughout the shaded region beyond that peak.](/book-figures/ch06-proxy-divergence.svg)

Independent quality can rise, peak, and fall while the optimized proxy keeps improving. The relationship's shape transfers beyond the source study.

Laidlaw et al. ([2024](https://arxiv.org/abs/2403.03185)) framed reward hacking as correlation collapse, in an analysis that is directional rather than measured. Start with a proxy whose scores correlate with a separate account of quality on a fixed reference distribution. Apply optimization against the proxy, then measure the relationship again on that same reference. If the relationship weakens, the reason for trusting the proxy has weakened even when its mean score has increased. Their analysis also derives a mitigation anchored to the reference relationship, but it does not establish a measured deployment effect for software agents.

An optimizer changes the samples one sees. If I compute a new baseline from each release's chosen outputs, the evaluation moves with the policy and can hide the change I meant to detect. A stable reference holds one part of the comparison still. It lets me ask whether the current proxy orders known cases, or outputs elicited from known tasks, in the same way an external quality process does.

For a coding-agent evaluator, I would freeze a stratified sample of tasks and the procedure that produces the artifacts to be judged. The held-out expert labels built in Chapter 5 supply one independent quality anchor. At baseline, I record the proxy score and the expert judgment for each artifact, calculate the chosen association statistic, and validate the operating point with its TPR and FPR. On later releases, I repeat the same production and labeling procedure before comparing the relationship against the baseline.

The statistic has to match the data. A continuous outcome can support an ordinary correlation coefficient, while a binary acceptability label may call for a rank-based association or for direct tracking of TPR and FPR at the operating point. Two association estimates computed on finite reference samples can differ because of sampling variation alone. The comparison therefore needs an interval around the change rather than a bare difference of two point estimates. The choice of statistic, the sampling plan, and the uncertainty calculation should all be fixed before anyone looks at the new release. Otherwise the monitor acquires its own optimization surface, and analysts can switch statistics, strata, or thresholds until the relationship appears stable.

This procedure consumes true-quality observations on the reference sample. Expert judgment costs review time and can itself drift unless the rubric and the adjudication process stay controlled. Delayed outcomes avoid some judge-model coupling, but they arrive slowly and only for work that was allowed to proceed. A post-merge survival measure says nothing about rejected changes, and retries can obscure which candidate caused the eventual outcome. The monitor inherits the identity, ordering, and missing-data problems of the production process that feeds it.

Reference maintenance is part of the control. A sample can stay internally consistent while losing contact with current work as repositories, task mixes, model capabilities, or agent permissions change. In that state, the monitor may correctly report that the old proxy-quality relationship still holds on old cases. It cannot establish that the same relationship describes the behavior now being optimized in production.

I handle that tension with two separate decisions. The fixed sample stays unchanged long enough to support comparison over time. A separate coverage review checks whether its strata and failure modes still resemble the live workload. When that review finds material drift, I close the old series and establish a new reference. The explicit break preserves the meaning of both comparisons.

In my own migration-evaluation framework, I designed an external outcome check around whether merged changes survive for 30 days. When the correlation between evaluator scores and that outcome drops below an owned floor, the framework declares the evaluator broken and blocks publication of headline results. The control exists in the code path, but it has never fired on live data, because the framework has produced only replay fixtures. Its implementation therefore supplies no evidence that the floor or the outcome measure works.

Even a live divergence alarm only diagnoses a changing relationship. The cause remains open. Correlation can fall because an agent found a loophole, because expert labeling changed, because the outcome pipeline lost events, or because the workload moved outside the reference sample. A response therefore begins with preserving the artifacts needed to distinguish those paths. Proxy scores, external judgments, model and evaluator versions, task identity, retry history, and sampling strata must remain joinable across the measurement window.

The operational rule is to investigate the mapping before tuning the threshold. Raising an acceptance cutoff after correlation falls applies more pressure to the suspect proxy and can select more extreme failures. Lowering it may reduce immediate pressure, but it admits more low-scoring work. Neither action repairs the evidence that the score orders candidates by quality. Until that evidence is restored, the proxy can remain diagnostic, but it should lose authority over acceptance and publication.

## Preserve the channel that reveals intent

Readers who consume hosted models and train nothing still sometimes receive a visible reasoning trace beside an agent's coding actions. Baker et al. ([2025](https://arxiv.org/abs/2503.11926)) had a separate model inspect that trace for evidence of reward hacking during agentic coding. Trace inspection detected hacks substantially better than inspection limited to the agent's actions, and a weaker general model successfully monitored a stronger reasoning model. The inspected artifact was the agent's chain of thought, e.g., the intermediate reasoning a model exposes while choosing its actions.

I give a reasoning-trace monitor the limited role of an additional signal. It can expose evidence of intent that the final patch and the tool log do not contain, and in that study the advantage held when a weaker model monitored a stronger one. Its verdict should raise review, preserve a suspicious run, or contribute to an investigation. It should not decide acceptance alone.

Action-only monitoring sees what the agent did: commands, edits, test results, and the final artifact. That evidence may show an invalid action without showing whether the agent recognized and exploited an evaluator weakness. A trace can expose a plan to change a test, suppress an error, or satisfy the visible checker while bypassing the intended requirement. The added signal is useful because it observes a different surface from the artifact being scored.

Oversight does not necessarily require a model with the same coding capability as the agent under review. A smaller or less capable model can scan traces continuously and route a subset to human review. That arrangement lowers the cost of adding coverage. It does not establish that every weaker model can oversee every stronger one, and the measured result belongs to the models, tasks, and forms of hacking that were studied.

The monitor also changes the failure investigation. When the action log and the patch look acceptable but the trace describes an attempt to exploit the grader, the team can retain the run as a detector case even when the exploit happened to fail. A suspicious action without a suspicious trace does not clear the run. The trace may be incomplete, strategically misleading, or silent about the decisive step.

For readers who use hosted models, the main control is to keep the flag outside anything the model or the selection procedure optimizes. Sending flagged runs to a person preserves an oversight path. Automatically retrying until the trace monitor goes quiet creates best-of-n selection against the monitor. The model need not receive the verdict directly, because repeated selection is enough on its own to favor outputs that evade it.

This constraint reaches beyond formal training. A harness can sample several trajectories and pick the least suspicious one. A release process can promote the prompts with the lowest monitor rate. Even a human team can teach the surrounding prompts and filters to suppress recognizable warnings when monitor quietness becomes a performance target. Any process in which the verdict affects which behavior survives applies pressure, whatever label the team gives it.

For readers who do apply training pressure to their own models, the second half of the study supplies the warning. At high reinforcement-learning pressure against the monitor, the agents continued to hack while producing reasoning that appeared benign. Optimization damaged the transparency channel that the oversight advantage depended on. The monitor did not merely miss more of the hacks already present. Training selected behavior that concealed them from the monitor.

The pressure response was not monotonic from the start. Low pressure initially improved both task capability and alignment in the study. That result prevents a blanket claim that any use of monitor feedback is harmful. It also creates the practical difficulty. The study did not characterize a threshold below which the transparency benefit remains safe across models and tasks.

Without such a boundary, I keep the monitor verdict out of the reward. This conservative operating choice extends beyond the measured result, because the study established no universal threshold. It gives up whatever capability or alignment gains low-pressure feedback could have produced. That foregone optimization is the monitorability tax. I preserve a channel for observing misbehavior by refusing to optimize the model against the observer.

Zero reward pressure does not guarantee independence forever. Model developers may already train against related detectors, users may select prompts on monitor outcomes, and a published monitoring rule can shape behavior indirectly. Those paths belong in the monitor's provenance record. The useful claim is narrower. An operator should not add direct pressure whose known failure mode is to make the visible reasoning less informative.

This method requires access to reasoning traces. It does not apply to a system that exposes only final actions, and a short generated explanation may not carry the same information as the traces that were studied. Even with access, visible reasoning is neither complete nor necessarily truthful. The monitor preserves an observed advantage over action-only inspection. It does not convert private reasoning into dependable ground truth.

The resulting acceptance path has three distinct views. Artifact checks ask whether the change satisfies observable requirements. Outcome monitoring observes whether proxy scores continue to track independent quality. Trace monitoring examines the agent's visible reasoning for indications of an attempt to exploit the evaluation. A disagreement among the three is useful information when the system retains it in full.

Several adjacent controls stay in the companion catalog because they answer narrower questions than the three practices taught here. One entry escalates oversight when mild specification gaming appears, based on a constructed curriculum in which gaming progressed to rewriting the reward function. Another hardens oversight when honest task completion is infeasible; in its source, a reasoning model exploited a chess environment after ordinary play could not win. Other entries measure reasoning effort through content-independent truncation, average compatible reward-model weights, evaluate agents inside the feedback loops they will encounter, and test detectors on contrastive cases. A thinly supported aside also suggests multi-objective acceptance with an independent judge, and that design note carries no evidentiary weight in the layered system argued here.

## Rebuild the acceptance path

I rebuild an acceptance pipeline by following one recently accepted agent change from candidate generation to deployment. At each transition, I identify the value that could have ended the decision by itself: a passing test suite, a clean lint run, a judge score, an approval label, or a post-run summary. A useful inventory records more than the metric name. It records who produces the value, which files or state can affect it, who owns its threshold, whether retries see the verdict, and what evidence remains after the gate runs.

Any gate with sole authority needs a second observation outside the optimizing side's immediate control. A test gate can read its invariants from outside the candidate change. A pre-merge score can be checked against an outcome that becomes visible after deployment. A threshold can require approval from an owner who does not ship the agent under evaluation. The second signal should address a failure the first one omits, because repeating the same judgment through another model or another formatting of the same data adds little separation.

I then choose one independent quality signal that can support a relationship test. Held-out expert judgment works when reviewers can label the relevant artifacts without seeing the proxy verdict. Delayed outcomes work when identity and event history survive long enough to join a change to its consequences. I freeze a reference sample and a measurement procedure, calculate the current proxy-quality relationship as the baseline, and record the sampling and uncertainty information needed to interpret later movement.

The remeasurement belongs on a schedule and at meaningful changes in pressure. A new model, a larger candidate pool, a prompt selected against the evaluator, a changed permission boundary, or a revised acceptance threshold can each move the optimizer into a different part of policy space. When the proxy rises while its relationship to independent quality falls, I handle the event as a broken control. Publication and promotion stop until the team can distinguish gaming from label drift, workload drift, and instrumentation failure.

If reasoning traces are visible, I add a separate monitor and preserve its findings alongside the actions and the final artifact. A suspicious trace routes the run to investigation, but it does not become a solitary rejection oracle. I also audit every feedback path around the monitor, because automatic retry, candidate ranking, prompt promotion, and reinforcement updates can all optimize against the verdict even when the monitored model never reads it directly.

This rebuilt path will still make mistakes. Signals owned at different points leave disagreements visible after a failure. The team can inspect a base-branch invariant that rejected a nominal pass, an external outcome that stopped tracking the launch score, or a trace warning attached to an acceptable patch. Part III starts from that observable boundary and turns to containing what happens when an agent crosses it.

## Sources and evidence

The evidence class and strength on each entry below come from its catalog record. Author-system cases in this chapter are narrative illustration and are not part of the evidence base.

### Layer signals beyond a single proxy

- **lit/strong:** Skalse, Howe, Krasheninnikov & Krueger (2022). *Defining and Characterizing Reward Hacking*. NeurIPS 2022. arXiv:2209.13085.
- **lit/directional:** Formica, Fan & Menghi (2022). *Search-based Software Testing Driven by Automatically Generated and Manually Defined Fitness Functions*. arXiv:2207.11016.

### Monitor proxy-true divergence

- **lit/strong:** Gao, Schulman & Hilton (2022). *Scaling Laws for Reward Model Overoptimization*. ICML 2023. arXiv:2210.10760.
- **lit/directional:** Laidlaw, C., et al. (2024). *Correlated Proxies*. arXiv:2403.03185.

### Monitor reasoning without training pressure

- **lit/strong:** Baker, B., et al. (2025). *Monitoring Reasoning Models for Misbehavior and the Risks of Promoting Obfuscation*. OpenAI. arXiv:2503.11926.

### Author artifact cited inline

- Not an evidence item: CodeProbe, the author's task-mining evaluation tool, [public repository](https://github.com/sjarmak/codeprobe). Named inline for the recall-family scorer and its replacement default, both of which are narrative illustration.
