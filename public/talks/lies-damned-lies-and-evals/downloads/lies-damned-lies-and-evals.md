# Lies, Damned Lies, and Evals: How to trust your agents when the stakes are high

Stephanie Jarmak · AI Engineer at Omni
AIE NYC · October 13, 2026

Prepared speaker notes; this is not a transcript of an actual delivery.
14 slides · 2,091 prepared-script words · 17-minute rehearsal target · 18-minute cutoff.

## Slide 1: Lies, Damned Lies, and Evals

Anchor: #slide-1

### Visible slide text

AIE NYC · OCTOBER 13, 2026 AIE NYC
Lies, Damned Lies, and Evals
How to trust your agents when the stakes are high
Stephanie Jarmak AI Engineer at Omni
AIE NYC · OCTOBER 13, 2026 01 / 14

### Chart or diagram description

Uncluttered cream/orange opening. Large official talk title and subtitle; speaker, role and event/date below. No new diagram or substantive claim.

### Prepared speaker notes

The audience choice is spoken over the title. Its words are stored once in slide 2’s prepared notes.

### Scope and reference notes

Official title and speaker/event metadata supplied for this talk. Hold the title for the opening choice question from slide 2’s script, then advance at “That’s from my own work.” No separate spoken introduction is added.

### Delivery cue

Hold the title during the introduction. At 0:00, start the clock and ask the opening choice question from the first paragraph of slide 2’s script while the title remains visible. Pause briefly, then advance to slide 2 at “That’s from my own work.” This uses the existing script; add no separate spoken preface.

### Sources

- No empirical claim on the title bookend.

## Slide 2: Lower cost. The retrieval failure remained.

Anchor: #slide-2

### Visible slide text

01 / THE COMPARISON AIE NYC
Lower cost. The retrieval failure remained.
I changed the opening instructions to address a search failure
−28%
Observed cost
On the affected task family
+0.0048
Primary evaluation score Δ · t = 0.27
+3.9%
Elapsed time
Search missed
relevant evidence → Agent trusted
the empty result
Does quality meet the bar?
What change would repair the failure?
The retrieval failure remained. Little evidence of score improvement does not establish equivalent quality.
Jarmak · Engineering Reliable Coding Agents, ch. 18 02 / 14

### Chart or diagram description

Lead with the author’s actual preamble experiment. One dominant observed cost reduction (−28%), with primary reward Δ +0.0048, t = 0.27 and elapsed time +3.9% kept as separate outcomes. An editable schematic highlights that a false-negative retrieval result was still accepted as authoritative. Label reported author experiment; the schematic reconstructs the mechanism rather than a literal trace. Do not plot incomparable units on one axis or imply unchanged quality. Keep the affected-task-family scope visible near the −28% result.

### Prepared speaker notes

Suppose you’re choosing between the current agent and a version that costs twenty-eight percent less. Would you switch? What else would you need to know?

That’s from my own work. I changed a coding agent’s opening instructions to fix a search failure. Cost fell on the affected task family. But the primary evaluation score showed no clear improvement, and it took about four percent longer. The search still missed relevant evidence; the agent trusted the empty result.

My two questions: Is the lower cost worth keeping, if quality meets the requirement? And how would we find out what actually fixes the failure?

### Scope and reference notes

Author-reported preamble intervention intended to address a known retrieval failure. On the affected task family, observed cost reduction 28%; primary reward difference +0.0048, t = 0.27; elapsed-time change +3.9%. The predicted wall-time reduction was 40%, but that prediction is not narrated. The result provides little evidence of a primary-reward improvement; it does not establish equivalent quality or noninferiority. The agent continued to accept a false-negative retrieval result as authoritative. No repository, task identity, sample size, baseline reward or confidence interval is invented. The cost-saving and failure-repair questions are a proposed interpretation of these observations, not a claim that the change was deployed or its quality cleared a release bar.

### Delivery cue

Speak this page’s first paragraph while title slide 1 remains visible. Pause for the audience’s provisional choice, then advance here at “That’s from my own work.” Reveal the unresolved quality, latency and search evidence. Keep the cost reduction scoped to the affected task family; acceptable quality has not been established.

### Sources

- [Engineering Reliable Coding Agents, chapter 18](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/agent-topology-dynamic-task-allocation)

## Slide 3: The ranking changes with the harness

Anchor: #slide-3

### Visible slide text

01 / THE COMPARISON AIE NYC
The ranking changes with the harness
63 Terminal-Bench 4 tasks that don’t require a GPU · one scored run per task / configuration
0%
25%
50%
75%
100%
TASKS SOLVED
OpenHands
PI
19/63 · 30.2%
38/63 · 60.3%
36/63 · 57.1%
31/63 · 49.2%
Claude Opus 5 GPT-6 Astra
The observed ranking reverses. Compare the configuration you will actually run.
Results depend on the pairing; this does not establish a universal ranking or statistical significance.
Li et al. · Finding the Right Fit Hardy et al. · Agent Evaluation Reliability 03 / 14

### Chart or diagram description

Native editable grouped bars or clean 2×2 interaction chart. Display solved counts out of 63 and percentages. Preserve common zero–100% scale. OpenHands: Opus5 57.142857%, GPT6Astra49.206349%; PI: Opus530.158730%, GPT6Astra60.317460%. Highlight crossed ordering with orange, not statistical significance.

Accessible description: Solved tasks on common zero to 100 percent scale. OpenHands: Claude Opus 5 36 of 63, GPT-6 Astra 31 of 63. PI: Claude Opus 5 19 of 63, GPT-6 Astra 38 of 63.

Chart data:

{
  "tasks": 63,
  "OpenHands": {
    "Claude Opus 5": 36,
    "GPT-6 Astra": 31
  },
  "PI": {
    "Claude Opus 5": 19,
    "GPT-6 Astra": 38
  }
}

### Prepared speaker notes

Say you’re choosing a model. Here are two models on the same sixty-three terminal tasks, using two agent harnesses: OpenHands and PI. A harness is the software around the model that manages context, tools, recovery and budget.

With OpenHands, Claude Opus 5 solved thirty-six and GPT-6 Astra solved thirty-one. With PI, Claude solved nineteen and GPT solved thirty-eight. That’s one scored run per task for each configuration.

The ranking flipped. The observed gap between models differed by thirty-eight percentage points across harnesses.

For a deployment decision, the pairing matters. For a claim about which model is generally better, it adds uncertainty.

So test the combinations you might actually deploy. These results describe the tested configurations. They don’t give us a ranking that carries over to every harness.

### Scope and reference notes

Finding the Right Fit evaluated 66 configurations overall. These four Terminal-Bench 4 cells share a 63-task non-H100 subset and task IDs. One last scored run per task after infrastructure retries, not repeated trials estimating stability. Model gap: OpenHands 36/63−31/63 = +7.9365 pp; PI 19/63−38/63 = −30.1587 pp; difference in observed gaps = 38.0952 pp. This is an interaction in observed outcomes, not a randomized component ablation or established universal ranking. The mechanism discussion identifies what harnesses control; trace evidence alone does not establish which mechanism caused the crossover. Agent Evaluation Reliability uses Bayesian latent-logit variance decomposition; fixed-system versus scaffold-averaged-model estimands assign interaction variance differently. Its numerical reliability ranges refer to nine HAL benchmarks, not all 22 combined benchmarks; no range is narrated here. Reliable ranking is distinct from construct validity and absolute deployment-threshold reliability.

### Delivery cue

Give each harness result room to land. Describe the observed reversal without implying a universal ranking or a randomized estimate. One scored run per task is a real limit.

### Sources

- [Finding the Right Fit, §§3–4](https://arxiv.org/html/2610.00917)
- [Agent Evaluation Reliability, §§4–5](https://arxiv.org/html/2610.00651)

## Slide 4: Public benchmarks and internal evaluation

Anchor: #slide-4

### Visible slide text

01 / THE COMPARISON AIE NYC
Public benchmarks and internal evaluation
Benchmark A standardized reference for comparison
Public results
Map the landscape → Shortlist systems
Internal evaluation
Compare with the baseline 01
→
Diagnose failures 02
→
Change the system 03
→
Retest 04
Retest & show value against the baseline · Quality · reliability · human repair · total cost ↶
Internal benchmarks exist.
Public benchmarks can be used internally.
Public and internal describe visibility, not exclusive purposes. The decision determines what evidence we need.
Jarmak · Engineering Reliable Coding Agents, chs. 2–3 04 / 14

### Chart or diagram description

A concise conceptual bridge, not an empirical comparison. Top definition places benchmarks within evaluation. Show common uses of public results (landscape, shortlist) and internal evaluation (improvement, baseline-relative value). Explicitly connect internal benchmarks and public benchmarks used internally so public/internal is not presented as an exclusive taxonomy. Keep labels sparse; no invented metrics or data.

### Prepared speaker notes

A benchmark gives us a standardized reference for comparison. Evaluation is the broader work of gathering evidence for a decision.

Public benchmarks help us understand the landscape and make a shortlist. Keep the tested tasks and protocol in mind when you read the result.

Internally, we’re asking: does this change improve our product or process? Compare it with what we run today, on representative work. Look at output quality, consistency across runs, and total cost. Track the time people spend checking, clarifying, intervening and fixing output, too. Show that separately so we can judge the workload. Use the failures to make a change, then test it against the baseline again.

Explain the value: what got better, by how much, for whom, at what cost, and how sure are we?

These categories overlap. You can have an internal benchmark, or use a public benchmark in an internal evaluation. The public result gives us a reason to try something. Internal evidence tells us whether it helps here.

### Scope and reference notes

Conceptual definitions and proposed enterprise framing, not an empirical taxonomy. A benchmark is a standardized comparison reference with a defined workload, protocol and scoring procedure; evaluation is the broader activity of collecting evidence for an improvement or decision. Public/private describes visibility and access, not mutually exclusive purposes: organizations can maintain internal benchmarks, and public benchmarks can be included in internal evaluations. Public results support landscape and shortlist decisions within their evaluated protocol and workload. Internal representative evaluation can support product/process improvement and communicate baseline-relative value, provided its observation, sampling and uncertainty are appropriate. Total cost includes human review/repair and failed attempts, not only successful model calls. Repeated adaptation to an internal benchmark can also overfit; the fresh-confirmation control on the next slide still applies. Human effort includes checking outputs, clarifying requirements, intervening during execution and repairing results. Report its time or workload separately to show capacity demands, even when monetized labor is also included in total cost; avoid double-counting that labor.

### Delivery cue

Keep this practical: shortlist, test on your work, explain the value. Name checking, clarification, intervention and repair as people’s work, and report their time separately from total cost. Public and internal are not exclusive categories.

### Sources

- [Engineering Reliable Coding Agents, chapter 2](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/baselines-ablations-cost-accuracy)
- [Engineering Reliable Coding Agents, chapter 3](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/contamination-oracle-workload-validity)
- [Rethinking Coding Agent Benchmarks](https://medium.com/@steph.jarmak/rethinking-coding-agent-benchmarks-5cde3c696e4a)

## Slide 5: Design the experiment around the decision

Anchor: #slide-5

### Visible slide text

01 / THE COMPARISON AIE NYC
Design the experiment around the decision
01
More tasks
Workload coverage
02
More repeats
↻ ↻ ↻
Variation between runs
03
More configurations
A×1A×2B×1B×2
How results depend on the pairing
Matched starting state · Fresh confirmation cases · Account for related tasks
Report quality, reliability, people’s time
and total cost together.
Repeated runs are not independent tasks. A better relative score does not establish that either system is reliable enough.
Jarmak · Engineering Reliable Coding Agents, chs. 1–2 Hardy et al. · Agent Evaluation Reliability 05 / 14

### Chart or diagram description

Three deliberately different experimental axes: task families, repeated runs, crossed configurations. Small bottom line showing total operating cost divided by independently accepted outcomes. No invented empirical frontier or ROC. If a frontier is sketched, label conceptual and omit numerical points.

### Prepared speaker notes

First, which uncertainty are we trying to reduce?

More tasks cover more work. Repeating a task shows how much execution varies. More model and harness combinations test whether the pairing changes the result.

Give both configurations the same task and runnable starting state. Keep the repository snapshot, tools, budgets and evaluator version fixed.

Before seeing results, decide what benefit would justify switching, after running costs, people’s work and migration. Express it as a measurable requirement. Otherwise, it’s easy to lower the bar to fit the result.

Keep task families visible: an average can hide a regression. Tasks sharing a repository can share build tools and conventions, so one change might help many for the same reason. Group related tasks when estimating uncertainty rather than treating every win as independent evidence.

Report the difference with a confidence interval, accounting for those groups and repeated runs. If the range still allows outcomes that would change your decision, the question is unresolved. For a cheaper system, check whether it rules out an unacceptable quality loss. A narrow interval can still describe the wrong workload or a biased test.

Keep cases you haven’t used during development for confirmation. Tuning on the same cases can improve those scores without improving new work. Rephrase a question without changing what a correct answer requires, and see whether performance changes. That doesn’t replace unused cases.

Count failed attempts, retries, latency and people’s time. Cost per accepted result is useful only if you’ve validated what counts as accepted.

Even a stable ranking doesn’t tell us whether either system is reliable enough.

### Scope and reference notes

Methodological synthesis, not a measured experiment or a universally sufficient protocol. Repeats must not be treated as independent task draws. Paired task labels are insufficient if one arm starts from transformed code. Cluster-aware uncertainty is needed when tasks share repositories/families; report the estimand and resampling unit. Threshold reliability can differ from relative-rank reliability. Author benchmark gates separate infrastructure-invalid measurements from capability evaluation; maintain a parallel operational denominator including user-experienced failures rather than deleting outages from reliability. Cost frontier should use comparable price/cache settings and include failures, retry policy, adjudication, queue latency and human effort where measurable. Primary paper cost/task values are intentionally not repurposed as production cost per accepted outcome. A non-significant quality difference does not establish equivalence or noninferiority. Adaptive benchmark selection is supported by the book’s exposure/iteration-holdout discussion and by REUSE. REUSE formalizes within-round selection, repeated tests and adaptive dependence. Its guarantee assumes an initially independent i.i.d. evaluation set and only promotion-decision feedback to the proposer; it does not cover arbitrary access to per-item traces or score feedback. Fresh confirmation and meaning-preserving challenge variants are proposed evaluation controls, not a claim that REUSE validates every deployment protocol. Diogo Almeida’s essay is critical commentary on public-score selection, not an experiment; its empirical allegations are not repeated here. For the confidence interval, prespecify the estimand, confidence level, interval method and practically relevant quality margin. Preserve baseline/candidate pairing and account for repeats and related task or repository groups using appropriate independent sampling units or a justified model. For a cost-saving choice, compare the appropriate quality-difference bound with the acceptable-loss margin; a nonsignificant difference is insufficient. An interval crossing the decision boundary leaves the specified evidential question unresolved. Interval precision does not remove workload mismatch, adaptive-selection bias, evaluator error or model misspecification.

### Delivery cue

Use tasks, repeats and configurations as three different sources of uncertainty. Explain the predeclared decision requirement, then the confidence interval and its limits. Keep shared task groups, unused confirmation cases and acceptable-quality evidence distinct. This slide has a two-minute rehearsal budget.

### Sources

- [Engineering Reliable Coding Agents, chapter 1](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/variance-power-paired-comparisons)
- [Engineering Reliable Coding Agents, chapter 2](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/baselines-ablations-cost-accuracy)
- [Agent Evaluation Reliability](https://arxiv.org/html/2610.00651)
- [Benchmark engineering diary](https://medium.com/@steph.jarmak/i-couldnt-find-a-good-enough-benchmark-for-large-scale-software-development-so-i-built-one-d2cc5946e963)
- [Diogo Almeida, Lies, Damned Lies, and Benchmarks (11 September 2026)](https://www.completeskeptic.com/p/lies-damned-lies-and-benchmarks)
- [Sun et al., Which Self-Improvements Should We Trust? Reliable Self-Improvement When Agents Reuse Their Benchmarks, §2.1 (arXiv:2609.33180v2)](https://arxiv.org/html/2609.33180v2)

## Slide 6: Trace where evidence becomes a conclusion

Anchor: #slide-6

### Visible slide text

02 / LOCATING THE CAUSE AIE NYC
Trace where evidence becomes a conclusion
The next tests I would run on the opening retrieval failure
Available → Called → Returned
Empty response
→ Interpreted
Conclusion: nothing relevant exists
Record where and how you searched, plus gaps and incomplete results.
Hold the evidence fixed → Change how its status reaches the component using it
Hold the component using the evidence fixed → Change the evidence it receives
Test search limits and evidence separately.
Check task outcomes.
A trace tells us where to investigate. These proposed tests have not yet demonstrated a repair.
Jarmak · Engineering Reliable Coding Agents, chs. 2 & 18 06 / 14

### Chart or diagram description

Replace the repeated three-number preamble result with an editable four-stage evidence path: available → invoked → returned → interpreted. Highlight the returned-to-interpreted boundary where an empty result can become an authoritative absence claim. Show search scope, execution status and remaining uncertainty as distinct fields. Two small controlled-intervention lanes vary status presentation or evidence while holding the other part fixed. Label proposed diagnostic tests, not executed experiments.

### Prepared speaker notes

Let’s go back to the search failure. The search came back empty, and the agent treated that as proof that nothing relevant existed.

I’d ask four questions: Could the agent search? Did it? What came back? What did it conclude?

I’d also record where and how we searched, what we didn’t or couldn’t check, and whether the search stopped early or returned partial results. Even a completed search can miss evidence phrased differently.

Then I’d try two separate tests. First, give the agent the same empty result, but make the search limits explicit. Does it still conclude nothing is there? Second, keep the agent and its settings the same, but supply a known relevant result. Can it use that evidence to complete the task?

Those comparisons would help us tell a search problem from a problem using the result. They’re experiments I’d run. We still need the complete task outcomes to know whether a change helped.

### Scope and reference notes

This slide develops the mechanism from the opening preamble experiment without repeating its numerical outcomes. The observed fact is that a false-negative retrieval result continued to be treated as authoritative. Tool availability, invocation, returned evidence and subsequent use are separate observation points. Search-scope/status fields and controlled changes to the consumer’s status information or retrieved evidence are proposed diagnostic interventions, not reported completed repairs. A trace can motivate an intervention; it does not by itself establish which change will causally improve outcomes. “Adequate coverage” must be defined relative to the task and available sources, rather than claimed as an unrestricted guarantee that no relevant evidence exists.

### Delivery cue

Return to the opening failure. Make the two tests concrete: the same empty result with explicit search limits, then a known relevant result with the agent and settings unchanged. Both are proposed experiments; check complete task outcomes.

### Sources

- [Engineering Reliable Coding Agents, chapter 18](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/agent-topology-dynamic-task-allocation)
- [Engineering Reliable Coding Agents, chapter 2](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/baselines-ablations-cost-accuracy)

## Slide 7: Better evidence can still go unused

Anchor: #slide-7

### Visible slide text

02 / LOCATING THE CAUSE AIE NYC
Better evidence can still go unused
Controlled simulation. Test the evidence and the agent’s use of it separately.
Availability → Tool call → Evidence → Interpretation → Outcome
01
Change the information
Inject better evidence
02
Change the component using the evidence
Test the downstream path
Supporting observation: 41 turns · 0 calls to the tool under test
Keep non-use in the
deployed-system comparison.
Simulation result; production effects remain untested. Tool use alone does not identify the tool’s causal effect.
Alzahrani · Verify Claims, Not Scores Jarmak · Engineering Reliable Coding Agents, ch. 2 07 / 14

### Chart or diagram description

Simple pipeline with two separately highlighted controlled substitutions: evidence injection before consumer and consumer/generator bypass. Small companion lane showing randomized availability and observed non-use retained. Label methodological schematic; simulation evidence does not validate production-finance performance.

### Prepared speaker notes

Now suppose we hand the agent the information it needs, and its answer still doesn’t improve. That doesn’t tell us the information was useless. The agent may not know how to use it.

A controlled simulation showed this. Giving the system the true market conditions produced no clear gain. Bypassing its scenario generator, which turns those conditions into possible market outcomes, exposed value the earlier change hadn’t revealed. That finding is specific to this simulation.

So I’d test the evidence and the agent’s use of it separately.

There’s a related trap. In another evaluation, one candidate task ran for forty-one turns without calling the tool being tested. Keep that non-use in the deployment result.

But don’t compare only runs that chose to use the tool with runs that didn’t. Those runs may differ for other reasons. To test whether the information helps, use matched runs of the same task. Keep the setup fixed, and control which information the agent receives. Then compare the complete task outcomes.

### Scope and reference notes

Verify Claims is a simulated financial setting, explicitly not evidence about financial-market performance. Pipeline includes regime detector, generator, gate and allocator. True-regime replacement gives +0.041 ±0.153 Sharpe over 16 paired seeds; no clear gain. Full generator bypass recovers value. Do not narrate simulated returns as real business efficacy. Six-seed interaction estimate includes zero; trusted-path compromise not tested. The diagram is a methodological synthesis. A perfect-information substitution is diagnostic, not a deployable method. Availability estimand versus efficacy mechanism: conditioning on invocation is post-treatment selection, even if usage criteria were predeclared. A null result constrains the tested path, not the isolated usefulness of an upstream component under all consumers. The brief 41-turn supporting example comes from chapter 2: a candidate enterprise-benchmark task passed static checks and ran without invoking the evaluated tool. Its identity, final task score and reason for non-use are not disclosed. Non-use belongs in the tool-availability deployment comparison; selecting only tool-using runs does not establish a causal effect of the information.

### Delivery cue

Start with useful information the agent may fail to use. Keep the simulation result bounded to its tested system. Explain why self-selected tool use is an unfair causal comparison; control what information matched runs receive instead.

### Sources

- [Verify Claims, Not Scores, §§3–6](https://arxiv.org/html/2610.01348v1)
- [Engineering Reliable Coding Agents, chapter 2](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/baselines-ablations-cost-accuracy)

## Slide 8: Audit the scoring rule and the answer key

Anchor: #slide-8

### Visible slide text

03 / TESTING THE INSTRUMENT AIE NYC
Audit the scoring rule and the answer key
One CodeProbe trial · one declared reference set
295 files returned 6 reference files · all 6 found
Six reference files · One square = one returned file; placement is schematic.
Recall
1.0
Precision
0.020339
About 2%
Score under the declared rule
0.025295
F-beta · beta = 0.5
Proposed evaluator challenges
Known-good Empty Return-everything Valid alternatives missing from the key
Challenge the scoring rule and the reference set.
One output, measured against one reference set. The score was precision-sensitive; intent and prevalence are not established.
Jarmak · CodeProbe trial e5d7a4e7 / commit 2495927 08 / 14

### Chart or diagram description

Preserve three sequential reveal groups. Group 1: one returned set of 295 files, with the 6 reference files highlighted inside it; label reference set rather than universal ground truth. Group 2: the same output produces recall 1.0 and precision 0.020339; separately show actual declared F-beta(beta=0.5) reward 0.025295. Never label the actual reward perfect. Group 3: proposed evaluator challenges (known-good, empty, return-everything, valid alternatives missing from key), leading to an auditable result record. Use native editable groups and source-bound quantitative labels. The set geometry is schematic; the counts/metrics are from one recorded trial. No inferred prevalence or intentional gaming.

Accessible description: 295 returned files, including all six files in the declared reference set. Each square represents one returned file; arrangement is schematic.

Chart data:

{
  "task_id": "e5d7a4e7",
  "returned_files": 295,
  "expected_files": 6,
  "matched_expected_files": 6,
  "recall": 1,
  "precision": 0.020339,
  "f1": 0.039867,
  "declared_reward_family": "F-beta",
  "beta": 0.5,
  "actual_reward": 0.025295
}

### Prepared speaker notes

In one of my CodeProbe trials, the agent returned two hundred and ninety-five files. The expected set had six. It found all six.

That’s full recall. But only about two percent of the returned files were in the reference set: that’s precision. The actual score, which was sensitive to precision, was about zero point zero two five.

Same output, same reference set. A different headline score gives a very different impression.

That’s why I want the scoring rule in the result record. Before relying on an evaluator, give it a known-good answer, an empty answer, and an answer that returns everything. Can it tell useful selection from exhaustive coverage?

Then check the answer key. If it leaves out a valid alternative, the precision penalty may count good work as wrong.

We need to test both the scoring rule and the reference set before using the score to choose a system or let it do more.

### Scope and reference notes

Firsthand recorded CodeProbe trial, task e5d7a4e7 in investigation codeprobe-x7p3, at commit 2495927394414509f707601f1b3f22b29b158f62. Baseline output returned 295 files and matched all 6 expected files: recall 1.0, precision 0.020339, F1 0.039867. The declared scoring family was F-beta with beta 0.5; actual reward was 0.025295. The actual run was not awarded recall as its reward. This is one observed over-returning trial, not evidence of intentional gaming, a prevalence estimate, or a comparative causal tool effect. The investigation contains five tasks, two configurations and one repeat; no cross-run ranking claim is used. All set-based interpretations are relative to the task’s declared reference key; key completeness and acceptable alternatives still require validation. The counterexample suite and result-record recommendation are methodological synthesis. The current scoring-model document describes task-declared families; the immutable per-trial record establishes the reward used for this observation. The book’s separate recall-only design loophole and later overlap-F1 default are not conflated with this F-beta-scored trial. UTBoost remains supporting evidence rather than the main stage case: its Seaborn missing-data example, test-log parser defects and bounded audit results illustrate oracle incompleteness. No UTBoost statistic is spoken in this revision.

### Delivery cue

Reveal the returned-file count, then the expected set, then the measurements. Pause at the different impression of the same run. Preserve the actual reward and the answer-key caveat; no gaming-intent claim.

### Sources

- [CodeProbe per-trial record, task e5d7a4e7, immutable commit 2495927](https://github.com/sjarmak/codeprobe/blob/2495927394414509f707601f1b3f22b29b158f62/docs/investigations/codeprobe-x7p3/per_trial.json)
- [CodeProbe task-declared scoring model](https://github.com/sjarmak/codeprobe/blob/main/docs/scoring_model.md)
- [Engineering Reliable Coding Agents, chapter 6](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/proxy-gaming-layered-signals)

## Slide 9: Test whether the gate changes execution

Anchor: #slide-9

### Visible slide text

03 / TESTING THE INSTRUMENT AIE NYC
Test whether the gate changes execution
My approval-queue audit found paths that allowed execution when required components were missing
Request → Approval / check
Required components
→ Execution → Observed effect
Inspect independently
Proposed isolated probes
Reject Cancel Remove a required component Change the approved proposal
Recognizing a problem and preventing an action
are different outcomes. Measure both.
Authorized completion Safe stop People’s repair work
Measure safe completion, safe stopping and people’s repair work separately.
Deliberately break a control next. Also measure false blocks on legitimate work; this audit did not establish unauthorized production writes.
Jarmak · Engineering Reliable Coding Agents, chs. 4 & 17 09 / 14

### Chart or diagram description

Replace the SWE-CC percentage comparison with one editable decision path: request → approval/check → execution → independently observed effect. Mark the dependency-required control boundary. Use small proposed fault-injection callouts for rejected/cancelled request, missing component, and proposal changed after approval. End in three clearly distinct observed outcomes: authorized completion, safe stop, human repair. The firsthand evidence is an audit that found fail-open paths; the displayed fault-injection protocol is proposed, not a reported population experiment. Keep action correctness and permitted behavior visually distinct. No claim of observed unauthorized production writes.

### Prepared speaker notes

Eval platforms can help decide whether to release a system. In this example, I’m checking what the running agent can actually execute after a request is rejected or changed.

When I audited my approval queue, I found paths that allowed execution when required components were missing, and commands built without the intended checks. A separate check required reproducing a bug before changing code. When a required program was missing, it stopped enforcing that rule.

Test in isolation: reject a request, cancel it, remove a required component, change the proposal after approval. Use the agent’s ordinary identity and check what actually executes. Then follow the fallback. Does it finish the authorized task, stop safely, or leave someone with repair work?

A gate is a check that permits or blocks execution. Record whether the evaluator recognized the problem and whether the gate prevented the action. We need both. Include legitimate work too, so we see false blocks.

Keep the exact tested version and evidence that the checks ran. If you change the evaluator, rerun the stored baseline and candidate under that same version on matched cases. Otherwise, you may be calling a change in the evaluator an improvement in the agent.

### Scope and reference notes

The approval-queue findings and separate reproduction-before-mutation hook are firsthand author audit/reproduction examples in chapter 17. They establish fail-open paths with missing required components and unvalidated command construction; they do not establish a production unauthorized-write incident, a frequency or a quantified reduction from later fixes. The isolated rejection/cancellation/missing-dependency/changed-proposal tests are proposed methods, not reported completed experiments. Observe actual destination effects under the ordinary agent identity, including possible alternate execution paths. Record authorized completion, safe stop, unresolved failure and human repair separately, and test valid work to detect false blocks. Code QA remains part of end-to-end evaluation rather than a competing category. Rerunning a stored baseline and current candidate with the same evaluator on matched executable states is a comparison control from chapter 4, not a demonstrated efficacy percentage. SWE-CC moves to supporting notes: its 150-check audit reported 94% rater agreement versus 87.2% weighted checker acceptance (95% CI 82.1–92.3), different quantities; 50.3% of violations among functionally resolved runs occurred in trajectories. These remain corroboration for process QA and evaluator validity, not firsthand author findings. Repository policy compliance is not legal compliance.

### Delivery cue

Separate the audit findings from the tests you would run. Follow the action all the way to execution and fallback. Include legitimate work and false blocks.

### Sources

- [Engineering Reliable Coding Agents, chapter 17: gate audits and failure experiments](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/autonomy-provenance-gates-accountability)
- [Engineering Reliable Coding Agents, chapter 4: repeated trials as release tests](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/execution-correction-gates-release-tests)
- [Engineering Reliable Coding Agents, companion](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/companion)

## Slide 10: Choose what runs automatically, then measure it

Anchor: #slide-10

### Visible slide text

03 / TESTING THE INSTRUMENT AIE NYC
Choose what runs automatically, then measure it
01
Missed consequential
defects
02
False alarms
and review load
03
Share handled
automatically
1%
false alarms
× 1,000,000
legitimate actions
= 10,000
reviews
Retrieve existing rules. Clarify unresolved requirements.
Encode where possible; escalate uncertain authority.
Worked example, not measured traffic. Samples enriched for suspected errors do not estimate production error rates.
Liu et al. · Auditing and Repairing LLM-as-Judge Failures Sehanobish et al. · From Benchmarks to Production (FLINT) 10 / 14

### Chart or diagram description

Three operational quantities linked to threshold: defect misses, benign false alarms, automatic coverage. Include worked arithmetic 1% × 1,000,000 benign actions = 10,000 reviews, labeled illustration. Optional small audit annotation κ0.04 enriched n234 versus κ0.42 random n200; do not draw fake ROC or compare as a longitudinal improvement.

### Prepared speaker notes

A model judge can agree with human reviewers on a sample and still miss important errors.

To test what it misses, include consequential defects. A random sample from mostly successful work might contain almost none. But the error rate in a sample chosen for difficult cases won’t be the production error rate.

In a production text-to-SQL audit, agreement with human labels was much lower on cases drawn mainly from the judge’s flagged outputs than on a random sample. The sample changed the measurement.

The researchers also tried three model judges. When the models disagreed with each other, the case went to a person. Agreement with human labels was higher on the cases handled automatically. But fewer cases were automated, and people had more review work.

For example, at one million legitimate actions, a one-percent false-alarm rate creates ten thousand reviews.

SQL can also run successfully while using the wrong metric, fiscal period or currency convention. Did the agent miss an existing rule, or is the requirement unresolved? Retrieve the rule or clarify it with its owner. If authority is uncertain, escalate. Encode resolved requirements in fixed checks where possible.

Which costly errors does the evaluator catch? Which good work does it block? Can we sustain the review load?

### Scope and reference notes

Judge audit: enriched n 234, κ=.04 [−.02,.09]; uniform n 200, κ=.42 [.24,.58]. Enriched set 192 faithful/42 unfaithful, 148 false flags among faithful (77.1%), not population-wide false-positive rate. Grade hallucination from result previews: removing preview recovered 93/98 mechanism-labeled cases but shifted to underflagging, so repairing one failure mode did not calibrate whole judge. Three-strong-judge unanimity κ=.788 at 89.7% automatic coverage; full-coverage majority κ=.731. Selective coverage, not free judge improvement. Proposed protocol: separate threshold-tuning and heldout validation, define defect as positive, measure class-specific TPR/FPR with uncertainty, report coverage and weighted production estimates. The million-action arithmetic is a worked illustration, not measured traffic. FLINT triangulates domain validity: all compared methods ≥ 99% SQL execution but no academic baseline >50% semantic accuracy on 359 production-derived questions (221 financials, 138 transactions); opaque IDs and conventions can yield executable wrong answers. FLINT judge validation only 50 sampled decisions/47 human agreements, not a statistical guarantee. Do not conflate its judge with the separate judge-audit paper. The semantic/authority paragraph is operational synthesis, not an experimental claim that every business requirement can be captured in a deterministic rule. Missing domain meaning and missing authorization are distinct; both can require additional context or an accountable human decision before execution. Clarified requirements should be encoded and tested where feasible. A successful execution check alone need not test those semantics, although a properly specified deterministic check can. A missing requirement in the agent’s view is not automatically genuine business ambiguity. First distinguish retrieval failure for an existing rule from a requirement that its accountable owner has not yet resolved. Permission uncertainty is a separate escalation condition. Human reference labels evaluate the policy in the audit; they are not required to choose whether a live case goes to review. The routing trigger is disagreement among the three model judges. As an operational recommendation, independently audit a sample of the cases they all accept because shared mistakes can survive unanimity. This recommendation is not a measured result of this audit.

### Delivery cue

Distinguish human labels used for the audit from disagreement among model judges used to send cases to people. Higher agreement applies to the smaller automatic subset. Pause after the illustrative ten thousand reviews. Keep missing rules, unresolved requirements and missing authority distinct.

### Sources

- [Production text-to-SQL judge audit, §§4–6](https://arxiv.org/html/2609.30290)
- [Engineering Reliable Coding Agents, chapter 5](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/calibrating-model-graders-agreement-correctness)
- [Engineering Reliable Coding Agents, chapter 16](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/verification-interfaces-risk-based-escalation)
- [FLINT, §4 and Appendices C/D](https://arxiv.org/html/2610.03524v1)

## Slide 11: Some evidence needs another observer

Anchor: #slide-11

### Visible slide text

03 / TESTING THE INSTRUMENT AIE NYC
Some evidence needs another observer
Self-written record
→
What the harness says happened
Independent record
→
What reached the model
Resulting state
→
What changed in the destination
Hearsay · 28 controlled aider interventions
Own record passed the hash check 28/28
Independent record comparison detected 28/28
Proposed observer tests
Missed detections · False alarms · What the observer cannot see
Security claims need tested detection coverage
and false-alarm rates.
28 deliberately introduced changes. Detection beyond this scope is untested; model traffic does not prove execution or destination state.
Dai et al. · Hearsay 11 / 14

### Chart or diagram description

Editable three-lane evidence diagram: harness record, independent model-boundary observer, destination/tool-state receipt. Small bounded inset: 28 controlled aider interventions, own chain28/28 verified, independent reconciliation28/28 detected. Clearly no production-detection guarantee. Distinct arrows show observation coverage and blind spots. The final observer-test cue now names missed detections, false alarms and sensor blind spots for a specific security control. Do not depict an authenticated log as proof of execution or a quality score as a security guarantee.

### Prepared speaker notes

An evaluator can only judge what it can observe.

In a narrow, controlled Hearsay experiment, researchers inserted omissions and fabrications while a harness wrote its record. A hash chain checked whether entries changed afterward. It still passed all twenty-eight intervention runs. Comparing an independent record of model traffic with the harness record detected all twenty-eight.

The hash chain couldn’t tell us what the writer left out.

Catching every fault we inserted tells us about those faults under those conditions. We still need to check how well they represent failures we’ll encounter in use. Seeing model traffic doesn’t prove a tool executed correctly or a database changed as intended.

Keep evidence of what reached the model, what tools did, and what state exists at the destination. Tie it to the exact run and artifact.

For a security claim, I’d inject failures such as an omitted action, missing permission check or interrupted operation. Measure missed detections and false alarms.

If we can’t observe whether the control worked, mark the result unverified. Decide what evidence would resolve it and whether work can safely continue during that check. For consequential actions, missing evidence may mean stopping or limiting the agent.

### Scope and reference notes

Hearsay main grid 5 harnesses × 14 tasks × 2 runs=140, one Sonnet 5 backing model. Decisive separate intervention only 28 aider runs: 14 omitted model replies, 14 fabricated test-run claims contemporaneously. Own hash chain verified 28/28; independent model-boundary log plus forward/reverse reconciliation reported 28/28. Not universal detection or a production-ready anomaly detector. Other edited-copy detector had severe false positives without clean twins (52/95 clean copies flagged); model-boundary witness does not establish physical tool execution, state truth, or resistance to operator compromise/bypass. Engineering synthesis requires distinct execution/state receipts. Author software-factory article describes completed fix 3 commits ahead of main, illustrating outcome/publication gap; no incident rate claimed. HarnessTester observed nested-list redaction bypass in saved history and upstream recursive-redaction fix; traces are also a software/security surface, not automatically safe evidence storage. Pinterest quality reporting represents validation gaps explicitly and gives definitions ownership/versioning/freshness/recertification; adoption or governance is not controlled proof of agent accuracy. Keep sensitive trace fields minimized and access-controlled. The final paragraph proposes controlled fault injection to measure an observer’s failure-detection ability and false alarms. It is not a claim that the Hearsay witness detects unavailable permission checks or interrupted operations, nor that any single receipt proves all execution or authorization properties. “Trust” is confined to a specific control, claim, test scope and observation boundary. Unknown or missing observations remain explicit; they do not count as passes. Recovery behavior and escalation/fallback suitability need separate outcome observations.

### Delivery cue

Give the two twenty-eight-run results clearly. Then distinguish what each observer can establish. The proposed injected failures extend the method, not the Hearsay findings. End with the next evidence check and a risk-based decision about continuing, limiting or stopping.

### Sources

- [Hearsay, §§4,6 and Table 2](https://arxiv.org/html/2609.32495)
- [Software factories are distributed systems](https://www.sjarmak.ai/writing/software-factories-are-distributed-systems/)
- [HarnessTester, §8.2](https://arxiv.org/html/2610.04921v1)
- [Pinterest Metrics Board](https://medium.com/pinterest-engineering/metrics-board-building-an-agent-ready-metrics-layer-2c8fefe68756)
- [Engineering Reliable Coding Agents, chapter 17](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/autonomy-provenance-gates-accountability)

## Slide 12: A retrieval upgrade: the experiment I would run

Anchor: #slide-12

### Visible slide text

04 / THE NEXT CHANGE AIE NYC
A retrieval upgrade: the experiment I would run
Compare fairly. Challenge independently. Monitor after deployment.
Matched comparison
Target work · same starting states
→ Independent challenge
Plausible defects · valid alternatives
→ Run alongside current work.
Test state changes in isolation.
Bring an independent challenger
Can an independent challenger
find the decisive evidence?
Can they catch deliberately introduced
defects in time?
After deployment
01 Completion, repair, latency, cost
02 Audit accepted work and failures
03 Check traces against real outcomes
04 Watch workload and version changes
05 Owner, intervention, regression tests
Keep checking whether the score predicts
the outcome people receive.
Set restriction or rollback triggers before deployment. The monitoring loop and independent-review tests are proposed.
Jarmak, chs. 16–17 Google SRE: monitoring and alerting 12 / 14

### Chart or diagram description

Retain the existing matched-comparison, evaluator/reviewer and run-alongside workflow geometry. Replace the five-field handoff inset with five production-monitoring rows: completion/repair/latency/cost; accepted-work and failure audits; traces versus real outcomes; workload and version changes; a named intervention owner and regression tests. Keep the independent-review questions, defining the challenger as someone who did not build the change. Preserve the score-to-real-outcome takeaway. The monitoring loop and reviewer test are proposed guidance, not reported deployment evidence.

### Prepared speaker notes

Should we deploy a retrieval upgrade? Here’s the experiment I’d run.

Use representative work, including missing, stale and contradictory evidence. Set the quality requirement, worthwhile improvement and budget. Compare current and proposed systems from matched starting states.

Then repeat both configurations on a representative subset. Use that variation to choose how many tasks and repeats the larger comparison needs. Keep non-use and failed attempts in the result.

Trace the path: was the source available, retrieved, sufficient, and used? Try the two tests from earlier: clarify the search limits, then separately supply evidence we know is relevant.

Challenge the evaluator with plausible defects and valid alternatives. Can someone who didn’t build this find the decisive evidence and catch deliberately introduced defects in the time they have?

First, run alongside current work without taking live actions. Check answers independently and test state changes in isolation. After deployment, track completion and repair rates, latency and cost by task type and system version. Audit a random sample of accepted work as well as investigating failures. Compare traces with what actually changed and what customers received. Watch for changes in the workload. Decide in advance what should trigger intervention and who can restrict or roll back the system. Turn confirmed failures into regression tests, and keep checking whether the evaluator’s scores predict real outcomes.

### Scope and reference notes

Proposed method synthesized from sources; no claim the full protocol has been deployed, randomized or validated. Workload family/repository dependence requires appropriate uncertainty and sampling. Predeclare practically relevant effects and, for cost-saving deployment at maintained quality, a justified noninferiority/quality margin and sufficient evidence; a nonsignificant difference is not equality. Preserve separate valid-capability denominator and all-attempt operational denominator. Independent evidence is bounded by sensor coverage and source quality; it does not guarantee ground truth. Sourcegraph observed reward heterogeneity by repository size (−.080 below 400 kLOC, +.259 at 400 k–2 M); not a universal size threshold. Pinterest supports named ownership, validation coverage and recertification as a constructive operating model. Authority-boundary fault injection tests rejection/cancellation/timeout/missing dependencies and changed artifacts; passing injected tests estimates boundary behavior, not real incident frequency. Human review is a measured finite resource, not an automatic guarantee. The five-field decision record is described as implemented in the author’s fleet. Its attention-saving benefit is explicitly unmeasured; no comparative productivity claim is made. Testing whether a reviewer can locate decisive evidence and catch seeded defects, alongside time and repair effort, is a proposed evaluation of the verification interface. External cognitive-forcing evidence is not narrated as firsthand or universally effective. The decision record clarifies the consequential human question; it does not make missing evidence or authorization disappear. Pilot repeats should cover a representative subset under each compared configuration, rather than only failed cases. Observed pilot variation informs the allocation of tasks and repeats, but a small, stable pilot cannot establish that rare failures are absent. Predeclare the quality requirement, worthwhile effect and budget before the pilot comparison. Use pilot variation to plan task and repeat allocation, not to redefine a successful result after seeing scores. Parallel runs without live actions can check answers against observable sources, but cannot establish proposed destination-state effects. Test those effects in an isolated environment, or in a separately authorized and bounded live evaluation. Current-system destination evidence alone does not prove how the proposed system would change production state.

### Delivery cue

Use the same time budget: the monitoring loop replaces the decision-record aside. Ask for a challenger who did not build the change. Separate parallel answer checks from isolated state-change tests, then move through production outcomes, accepted-work audits, workload changes, named intervention and regression tests. The loop is proposed guidance, not a measured deployment result.

### Sources

- [Engineering Reliable Coding Agents, chapters 1–6 and closing](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/closing)
- [Engineering Reliable Coding Agents, chapter 17](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/autonomy-provenance-gates-accountability)
- [Pinterest Metrics Board](https://medium.com/pinterest-engineering/metrics-board-building-an-agent-ready-metrics-layer-2c8fefe68756)
- [Why coding agents fail in large codebases](https://sourcegraph.com/blog/why-coding-agents-fail-large-codebases)
- [Engineering Reliable Coding Agents, chapter 16: decision records and review effectiveness](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/verification-interfaces-risk-based-escalation)
- [Google SRE: Monitoring Distributed Systems (monitoring principles)](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Google SRE Workbook: Alerting on SLOs (alerting principles)](https://sre.google/workbook/alerting-on-slos/)

## Slide 13: Make the next autonomy decision explicit

Anchor: #slide-13

### Visible slide text

04 / THE NEXT CHANGE AIE NYC
Make the next autonomy decision explicit
The autonomy decision I would ask a team to make
Additional action + operating scope
Which human check would change?
Evidence bar + evaluator + execution controls
Representative repeats · tolerable failures · total cost and repair burden
01
Expand within
the tested boundary
02
Retain
review
03
Stop
and escalate
Human decision owner Acceptable risk, conflicting values and unresolved judgment
An action-specific standard to test. Procedures support the work; they do not establish reliability or supply missing evidence.
Jarmak · Engineering Reliable Coding Agents, closing 13 / 14

### Chart or diagram description

A compact proposed decision record: additional action and operating scope; which human check changes; evidence bar, evaluator and execution controls; three dispositions (expand within the tested boundary, retain review, stop and escalate); a human decision owner for risk and unresolved judgment. The current slide has no repository call to action. Practical procedures are on slide 14. This is a proposed standard, not a reported autonomy rollout.

### Prepared speaker notes

Would you switch now? What evidence are you still missing?

I’d keep the cheaper change if it meets our quality and latency requirements, and review and repair don’t erase the savings. This comparison hasn’t established that.

For the search failure, I’d test whether making the search limits explicit changes the agent’s conclusion, then check complete task outcomes. That’s a proposed test.

More authority needs repeated success on representative work, tolerable failures and acceptable total cost. Name the additional action, scope and human check you’d remove. Test the evaluator and execution controls.

If required evidence is missing, a gate fails or scope changes, stop and return the decision to its human owner, with options, evidence and uncertainty. That person owns acceptable risk and business priorities.

I’ve linked the evaluation-design, traceability and reliability procedures for your next rollout.

### Scope and reference notes

Closing is the speaker's proposed synthesis. Do not say quality is unchanged merely because a quality test was nonsignificant. Cost-saving deployment requires evidence against a stated quality requirement/noninferiority margin. Apparent task gain also requires workload, observation and operational validation, so monitoring stays attached to the same accepted-outcome definition. The book companion distinguishes supported findings from thin-support leads; it contains 206 records (56 developed, 150 compact), 42 compact thin-support leads, not 206 validated practices. Safe task completion, unsafe completion, blocked failure and recovery remain distinct in any expanded rollout. Do not present ongoing monitoring as a guarantee. The closing returns to the preamble case, distinguishing observed lower cost from unestablished acceptable quality and persisting failure. It does not assert that the cost change was a validated efficiency improvement or that the proposed handoff repair was implemented. Closing is a proposed action-class-specific autonomy standard. It requires the team to name the additional action and operating scope, specify which human check changes, predeclare its evidential and economic bar, validate both judgment and execution controls, preserve stop/escalation conditions, and retain an accountable human owner for risk and conflicting values. No single score, numerical universal threshold or claimed production authority expansion is introduced. The linked user-owned coding-agent-workflows repository is already public. The agent-eval-design skill is a planning/design aid, not an evaluation runner; agent-harness-traceability specifies attempt identity, pairing and missing-versus-zero evidence; reliability-pass has prerequisites/dependencies including those skills and failure-mode-capture. These procedures do not prove reliability or promise immediate plug-and-play integration.

### Delivery cue

Return to the audience’s original choice and pause briefly after the two questions. Give the conditional cost answer and proposed search test; acceptable quality is still unestablished. Then make the additional-action decision and human owner concrete. Advance to resources after the final sentence without added speech.

### Sources

- [Engineering Reliable Coding Agents, closing](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/closing)
- [Engineering Reliable Coding Agents, companion](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/companion)
- [Engineering Reliable Coding Agents, chapter 18](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/agent-topology-dynamic-task-allocation)
- [Engineering Reliable Coding Agents, chapter 17](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/autonomy-provenance-gates-accountability)
- [Engineering Reliable Coding Agents, chapter 16](https://www.sjarmak.ai/books/engineering-reliable-coding-agents/verification-interfaces-risk-based-escalation)
- [Public coding-agent-workflows repository: evaluation, traceability and reliability procedures](https://github.com/sjarmak/coding-agent-workflows)

## Slide 14: Evaluation procedures and references

Anchor: #slide-14

### Visible slide text

PROCEDURES & REFERENCES AIE NYC
Evaluation procedures and references
github.com/sjarmak/coding-agent-workflows ↗
Scan for the public procedures
Evaluation design ↗
Design the comparison and its decision criteria.
Harness traceability ↗
Retain attempt identity, evidence and comparison provenance.
Reliability procedures ↗
Exercise authority boundaries, recovery and review.
Engineering Reliable Coding Agents
Evaluating and Operating the System Around the Model
sjarmak.ai/books/engineering-reliable-coding-agents arxiv.org/abs/2608.13867 ↗
Planning aids and practical procedures. Implement their documented prerequisites; using them does not establish reliability.
STEPHANIE JARMAK · SJARMAK.AI 14 / 14

### Chart or diagram description

One prominent QR code to the verified public coding-agent-workflows repository, with readable repository URL. Use a compact three-link procedure list and a distinct book/reference block with full title, online edition link and direct arXiv link. Make every link clickable. Keep generous whitespace; do not render long skill-file paths. Builder must decode the QR from the final rendered slide and confirm its exact target. Hold after the final sentence; no additional spoken section.

Accessible description: QR code linking to github.com/sjarmak/coding-agent-workflows

### Prepared speaker notes

No prepared spoken section; resources hold.

### Scope and reference notes

Resources bookend. The public repository contains the three linked evaluation-design, harness-traceability and reliability procedures. The arXiv record identifies the monograph as Engineering Reliable Coding Agents: Evaluating and Operating the System Around the Model, by Stephanie Jarmak, submitted 14 August 2026. The online book is also linked. The evaluation-design skill supports planning rather than running an evaluation. Traceability and reliability procedures require target-environment implementation and their documented dependencies; they do not establish reliability by themselves. The arXiv link is to the monograph; individual empirical results retain their specific sources in the preceding notes. The QR code opens the public coding-agent-workflows repository; its readable URL is provided alongside it.

### Delivery cue

After the exact final sentence on slide 13, advance here and hold the links/QR on screen. No additional spoken explanation; finish within the same 17-minute target.

### Sources

- [Coding Agent Workflows](https://github.com/sjarmak/coding-agent-workflows)
- [Evaluation design · agent-eval-design](https://github.com/sjarmak/coding-agent-workflows/blob/main/source/skills/agent-eval-design/SKILL.md)
- [Harness traceability · agent-harness-traceability](https://github.com/sjarmak/coding-agent-workflows/blob/main/source/skills/agent-harness-traceability/SKILL.md)
- [Reliability procedures · reliability-pass](https://github.com/sjarmak/coding-agent-workflows/blob/main/source/skills/reliability-pass/SKILL.md)
- [Engineering Reliable Coding Agents: Evaluating and Operating the System Around the Model · online book](https://www.sjarmak.ai/books/engineering-reliable-coding-agents)
- [Engineering Reliable Coding Agents: Evaluating and Operating the System Around the Model · arXiv:2608.13867](https://arxiv.org/abs/2608.13867)
