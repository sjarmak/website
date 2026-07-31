---
title: "Engineering Reliable Coding Agents"
book: the-system-around-the-model
order: 0
part: 0
kind: introduction
---

*Evaluation, Recovery, Context, and Control Beyond the Model*

Stephanie Jarmak

## Preface

An agent has finished a change. The tests are green, and a reviewer is looking at a compact diff. The run appears successful. Yet, no one can say whether another run would produce the same result, whether the tests exercised the relevant behavior, or whether the reviewer was aware of the decisions that carried the most risk.

The visible output is code. The uncertainty around its quality lives in the system that produced, evaluated, and approved it.

I wrote this book for the engineer who now owns that system. I assume you are fluent in software engineering and may be new to evaluation methodology. Your agents write and ship code, so you must decide which claims about their reliability ought to be trusted. 

That system is more than the model, and even more than the tools that model uses that make it 'agentic'. The agent itself is one component in a more complex apparatus. Managing that apparatus involves evaluation, governance, context management, review, and scheduling. Evaluation determines what counts as success, governance defines what an agent should be able to access, context management controls what information enters the session state, review determines the quality gate, and scheduling allocates time, money, compute, and human attention.

Those five activities do not map one-to-one onto the six parts of this book. Evaluation takes two parts, measurement first and grading systems second, because the second depends on the first. Context management is Part IV. Scheduling is Part VI. Governance runs across two parts rather than sitting in one: Part III covers what an agent can reach and whether its work survives failure, and Part V covers who authorizes the work and who answers for it.

These components do not operate independently. A better score may reflect an easier test rather than a better system. A reviewer may appear ineffective because the interface concealed the evidence needed for judgment. Instrumentation may record failures within individual components while missing failures in the connections among them. A recovery procedure may pass repeatedly while relying on the same credentials whose compromise would make recovery impossible.

Plausible results can survive weak measurement. In one controlled study, researchers compared a single score from each of two identical systems. As many as 26 percent of those comparisons appeared significantly different at (p < 0.05). The statistical test correctly described the two runs it received, but the experiment could not establish that the systems differed because it had sampled too few runs to estimate the variation between them.

That example captures the practical problem beneath many claims about agents. A number can be calculated correctly and still answer a narrower question than the reader assumes (i.e., lies, damned lies, and statistics). It is best to treat measurement as part of the operating system around an agent. It determines which changes are adopted, which regressions are detected, and which risks remain invisible.

The same reasoning applies to safety boundaries. We all know the stories of an agent deleting a production database with the backups disappearing along with it. In one such case, the same credentials could reach both resources, so while the immediate action was deletion, the deeper failure was shared authority across systems that were expected to fail independently. These systems are far too complex with unpredictable emergent behaviors, make such assumptions at your own peril.

I focus on mechanisms because outcomes alone provide poor guidance. “The agent failed” is as useful as a two-percent point spread on a benchmark leaderboard. It does not reveal where state lived, which boundary was crossed, why the failure propagated, or why recovery failed as well. A useful account traces ownership, permissions, persistence, ordering, and observation. It also distinguishes correctness from reliability, performance, cost, safety, and usability.

This book draws from a catalog of 192 practices assembled from research literature and independent practitioner sources along with my own experiences. The chapters develop 55 of those practices in depth. All 192 appear in the companion catalog, with the remaining 137 in compact form. The extent to which we explore these was prioritized based on a tradeoff between evidence strength and operational urgency, which did not always correlate with each other.

These practices are not universal rules. Each applies under particular workloads, permissions, failure costs, and organizational constraints. Where the evidence supports only a narrow claim, I keep the claim narrow. Where support remains incomplete, I state the uncertainty and describe the comparison needed to resolve it.

The goal of this book is to enable others to build and maintain agentic systems whose reliability can be observed, tested, and defended.

## What this book is not

It is not a survey of the literature. The companion catalog does that work, at an entry each, while the chapters spend their length on a minority of the practices and on the conditions under which each one stops working. Equal coverage would produce a better index and a worse book.

It is not a comparison of models either. Capability moves faster than a book can track, and a ranking of the 'state of the art' written in one quarter describes a different population by the next. The methods here concern how you measure and contain whatever model you are handed, which is why they outlast the ranking.

It is also not a guide to writing agents. No chapter covers prompt structure, tool schema design, or framework selection. I assume you already have an agent running, or will soon, and that your open question is whether its results can be believed and its reach can be bounded.

## How the book is organized

The book has six parts and eighteen chapters. Measurement comes first because every later practice is adopted or rejected through a measured comparison. Nineteen taught practices in Parts II through VI also require a method taught in Part I. Interleaving those methods with their uses would scatter each method across four or five chapters.

This order costs you roughly three chapters of experiment design before we specifically get to agents. The alternative would make later recommendations easier to reach but harder to assess. Definitions would arrive after their first use, and repeated fragments would replace a coherent method.

Part I establishes how I compare systems when runs vary and scores can mislead. Part II turns those measurements into grading and release decisions. Part III addresses containment, persistent state, recovery, and failure analysis. Part IV examines how repository information enters, survives, and leaves an agent run. Part V treats human review as an engineered control with interfaces, escalation rules, and accountable ownership. Part VI allocates work across agents and models under cost and capacity constraints.

| Part | Ch | Title |
|---|---:|---|
| **Part I: Evaluation measurement and experiment design** | 1 | Run-to-run variance, statistical power, and paired comparisons |
| | 2 | Baselines, ablations, and cost-accuracy tradeoffs |
| | 3 | Benchmark contamination, oracle strength, and workload validity |
| **Part II: Evaluation and grading systems** | 4 | Execution-based evaluation, correction gates, and release tests |
| | 5 | Calibrating model graders and separating agreement from correctness |
| | 6 | Proxy metric gaming and layered evaluation signals |
| **Part III: Containment, durable execution, and recovery engineering** | 7 | Agent isolation, injection defenses, and independent verification |
| | 8 | Persistent agent state, durable workflows, and idempotent retries |
| | 9 | Replayable traces and fault-injection recovery testing |
| | 10 | Human-auditable failure analysis and taxonomy development |
| **Part IV: Context engineering: retrieval, budgets, and memory** | 11 | Measuring and designing repository retrieval |
| | 12 | Localization funnels, repository indexes, and freshness checks |
| | 13 | Usable context budgets, consolidated-spec restarts, and file-based tool output |
| | 14 | Cross-session memory, raw traces, and compaction policies |
| **Part V: Human review and accountability engineering** | 15 | Efficient verification interfaces and risk-based human escalation |
| | 16 | Autonomy calibration, provenance, effective gates, and accountability |
| **Part VI: Work allocation and cost engineering** | 17 | Agent topology selection and dynamic task allocation |
| | 18 | Cost-aware fleet scheduling and model routing |


## What I assume you know

I assume working knowledge of version control, continuous integration, code review, on-call practice, containers, and basic statistics. I use those foundations without rebuilding them. I still describe the relevant system boundary when a familiar tool plays an unfamiliar role.

I assume no prior exposure to the evaluation methods specific to public agent results. I begin with how to read a public score and identify the claim it can support. I then show how many repeated runs a comparison needs before an observed difference carries useful information. The answer depends on variation and the size of the difference you need to detect.

I also teach why agreement with human labels does not by itself make an automated grader correct. Agreement can conceal shared mistakes, ambiguous examples, or a reference answer that measures the wrong property. I separate the observed agreement from the inference made about correctness, which becomes important when a grader controls release. 

Another method checks whether a score was earned on work the model had already encountered. I introduce the required vocabulary only when the mechanism appears. My goal is that a technically capable reader should be able to reproduce the reasoning presented in this book, not merely accept my interpretation.

The book does not assume a particular agent architecture or deployment scale. I describe architecture separately from implementation so the mechanism survives changes in products and interfaces. Examples expose permissions, retries, caching, concurrency, identity, and ordering when those details affect the claim. Code appears only when prose would obscure a state transition or failure path.

## How I grade evidence

Every taught practice states its support in its first paragraph. Each evidence item has a **source class** and an independent **strength grade**. **Research literature** comprises papers, preprints, and published benchmarks cited by identifier. An **explorer synthesis** distills a topic-scoped corpus of papers and industry sources into named practices with a source list for each. An item in this class points to the synthesis, whose record usually names one paper identifier even when the synthesis summarized several works. I assessed this class separately because its claim may be real despite thinner provenance than a direct citation. Convergence across independent corpora on the same structure provides a different kind of support from a single reported measurement in one study. A **practitioner account** is a production report, incident write-up, or first-person operational account.

The strength grades are **strong**, directly supporting the practice's claim, and **directional**, supporting its direction without establishing it firmly. An **anecdotal** grade is drawn from a single reported case. A **null-result** grade records a test that found no supported effect. Class and grade are reported together, so an explorer-synthesis item may be graded strong while a practitioner account may be graded anecdotal.

The **selection lenses** were three independent passes over the catalog. Each proposed a taught set by asking whether a practice changes a decision in the reader's system, whether its omission loses coverage, or whether there is a case that can be taught. Their agreements and disagreements decided the taught set.

The **evidence audit** separately rechecked every explorer-synthesis item graded strong against its underlying source, retaining that grade only when the source was a controlled result supporting the practice's own claim and downgrading the rest.

The catalog's **mechanism clusters**, numbered 1 through 14, group practices acting on the same mechanism. The book's parts are named for the engineering disciplines those clusters require. Chapters refer to clusters by number.

Items graded strong form a minority of the evidence items across the book. Their distribution is also uneven. In Part I, they account for 59% of the items. In Part III, the thinnest part, they account for 14%.

Cases from my own systems appear only as illustrations to reveal a mechanism, suggest a failure mode, or make an abstract constraint concrete. I do not use them as the basis for a recommendation. 

Chapter 7 presents the clearest tension between evidence strength and operational urgency. None of its three practices is supported by research literature, and three of the seven supporting sources are single anecdotes. Even so, two of its three practices were chosen for the main chapters by all three selection methods independently, and the third by two of them. Across this corpus, evidence strength and urgency showed little relationship.

That mismatch does not warrant greater confidence in the practices. It indicates a decision made under uncertainty, where the costs of acting and waiting are unequal. Some failures justify protective boundaries before their frequency is known with confidence, especially when a single credential can destroy both the primary resource and its recovery path. In those cases, I state the limits of the evidence and identify the observation that would cause me to revise the design.

I also treat every measured result as conditional on the experiment that produced it. A comparison inherits its workload, scoring procedure, task sample, and run conditions. Interpretation begins by checking those boundaries. Any claim that extends beyond them requires a separate argument; the result does not generalize on its own.

## How to read a chapter

A chapter opens on a concrete situation, usually a measurement that came out wrong or a failure with a traceable cause. The mechanism follows, then what the evidence does and does not establish, then the boundary conditions, then a procedure you can run. Specialized terms are marked in bold where they are defined, so a term met later can be traced back to that site.

Citations appear inline, in author-year form, with the year linked to the source. The back matter of each chapter, headed Sources and evidence, carries the record behind those mentions: the source class, the strength grade, the identifier, and what the item supports. The two layers have separate jobs. The back matter is the authority for the identifier, the author list, and the grade, while the prose is the authority for the claim a source is being used to support. A disagreement between them is a defect.

The class and the grade both do practical work while you read. Research literature, an explorer synthesis, and a practitioner account fail in different ways. A paper can be narrow, a synthesis can compress several works into one line of provenance, and a production report can be true of exactly one system.

A strong item means I state the finding as measured, inside the conditions the study ran under. A directional item means the direction has support and the magnitude does not, so the prose stops at the direction. An anecdotal item is one reported case, which can establish that a failure mode exists and cannot establish how often it occurs. A null-result item records a test that found no supported effect, and any recommendation standing near it has to survive that. A few items are contested, meaning the same corpus supplies a counterweight, and there the chapter names the counterweight.

Sentences are scoped to what was actually measured. Where support is thin, the chapter says so in its opening paragraph and prescribes a measurement you can run rather than a number to adopt. 

## The companion catalog

The companion site indexes all 192 practices under the chapter whose mechanism each extends. The 55 developed in the main chapters appear as short pointers into the chapter; the remaining 137 appear as compact entries. The catalog broadens the set of available options without forcing the main text to explain every variation.

Use the relevant chapter as the foundation, then consult the catalog for practices that match a specific constraint. A compact entry cannot reproduce the chapter’s full treatment of mechanism, evidence, tradeoffs, and failure boundaries. The chapter provides the reasoning needed to decide whether a neighboring practice applies to your workload.

Twenty-nine of the full entries are labeled as thin-support asides. I excluded them from the taught set because the available evidence does not support a recommendation. Treat them as prompts for investigation rather than established guidance. They may point to a useful experiment, a missing control, or a failure mode worth instrumenting.

The chapters and catalog serve different purposes. The chapters develop methods and claims in enough detail to evaluate critically. The catalog preserves breadth and makes related practices easier to find. Together, they let you begin with a measured problem and identify an intervention suited to the system you actually operate.

## What you should be able to do by the end

Given a published agent score, you should be able to state the narrower claim it supports and identify the conditions on which that claim depends. Given a proposed change to your own system, you should be able to measure run-to-run variation before crediting a difference and size the comparison before spending the model calls. Both systems should run on the same items, and a design that cannot resolve the difference relevant to the decision should return no verdict. Cost belongs in that judgment alongside accuracy, as does the possibility that a simpler configuration would have performed just as well.

You should be able to assess whether a public score was earned on tasks the model may already have encountered and to build an evaluation set from your own repositories when the public benchmark does not represent your work. Grades should rest on execution rather than the model's confidence, and automated graders should be validated against human labels before they gate releases. When a proxy improves without a corresponding improvement in the outcome it represents, the system should make that divergence visible.

Operationally, you should be able to bound what a single run can access and destroy, and you should treat an agent's account of its own work as a claim that still requires verification. A run that fails partway through should leave a durable record of which steps completed, and every retried step should be safe to execute again. Recovery should be tested by injecting failures rather than inferred from an architecture diagram. Reading a hundred traces from your own system should yield a concrete failure taxonomy.

Retrieval should be evaluated separately from generation so that a wrong answer can be attributed to the stage that produced it. You should also be able to measure how much of an advertised context window the system can use effectively. Human review should occur where the reviewer can see the decision that carries the risk, and autonomy should expand by action type only when measured approval and modification rates justify it. A multi-agent design should be required to outperform a single agent on the same tasks, and each component should run on the least expensive model that can perform its role reliably.

The goal is to provide you with the tools to measure what matters for your work, so the result describes the system you operate rather than a position on a leaderboard.
