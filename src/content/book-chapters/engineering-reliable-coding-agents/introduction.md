---
title: "Engineering Reliable Coding Agents"
book: engineering-reliable-coding-agents
order: 0
part: 0
kind: introduction
---

*Evaluation, Recovery, Context, and Control Beyond the Model*

Stephanie Jarmak

## Preface

An agent has finished a change. The tests are green, and a reviewer is looking at a compact diff. The run appears successful. Yet, no one can say whether another run would produce the same result, whether the tests exercised the relevant behavior, or whether the reviewer was aware of the decisions that carried the most risk.

The visible output is code. The uncertainty around its quality lives in the system that produced, evaluated, and approved it.

I wrote this monograph for the staff engineer, evaluation lead, or technical owner who now owns that system. I assume comfort with experiment design, production controls, and technical review. When agents write and ship code, the operator must decide which claims about their reliability deserve trust.

That system includes more than the model and the tools that make its operation agentic. The agent itself is one component in a more complex apparatus. Managing that apparatus involves evaluation, governance, context management, review, and scheduling. Evaluation determines what counts as success, governance defines what an agent should be able to access, context management controls what information enters the session state, review determines the quality gate, and scheduling allocates time, money, compute, and human attention.

Those five activities do not map one-to-one onto the six parts of this monograph. Evaluation takes two parts, measurement first and grading systems second, because the second depends on the first. Context management is Part IV. Scheduling is Part VI. Governance runs across two parts rather than sitting in one: Part III covers what an agent can reach and whether its work survives failure, and Part V covers who authorizes the work and who answers for it.

These components do not operate independently. A better score may reflect an easier test rather than a better system. A reviewer may appear ineffective because the interface concealed the evidence needed for judgment. Instrumentation may record failures within individual components while missing failures in the connections among them. A recovery procedure may pass repeatedly while relying on the same credentials whose compromise would make recovery impossible.

Plausible results can survive weak measurement. In one controlled study, researchers compared a single score from each of two identical systems. As many as 26 percent of those comparisons appeared significantly different at \(p < 0.05\). The statistical test correctly described the two runs it received, but the experiment could not establish that the systems differed because it had sampled too few runs to estimate the variation between them.

That example captures the practical problem beneath many claims about agents. A number can be calculated correctly and still answer a narrower question than the reader assumes. Measurement is part of the operating system around an agent: it determines which changes are adopted, which regressions are detected, and which risks remain invisible.

The same reasoning applies to safety boundaries. In one reported incident, an agent deleted a production database and the backups could not be recovered. The same credentials could reach both resources, so the deeper failure was shared authority across systems expected to fail independently. The design question is testable even when the frequency of comparable incidents is unknown: can one deployed identity destroy both the primary resource and its recovery path?

I focus on mechanisms because outcomes alone provide poor guidance. “The agent failed” is as useful as a two-percentage-point spread on a benchmark leaderboard. It does not reveal where state lived, which boundary was crossed, why the failure propagated, or why recovery failed as well. A useful account traces ownership, permissions, persistence, ordering, and observation. It also distinguishes correctness from reliability, performance, cost, safety, and usability.

This monograph draws from a catalog of 192 practices assembled from research literature, independent practitioner sources, and author-system cases. The chapters develop 55 of those practices in depth; the remaining 137 appear in compact form in the companion catalog. Three selection passes considered teachability, consequence for an engineering decision, and coverage of the mechanism clusters. Evidence strength and operational urgency were evaluated separately.

That selection is my engineering judgment, not an evidence-derived consensus. Some practices are included because a controlled comparison measured their effect. Others are controls justified by a structural failure mechanism, an observable check, and an asymmetric cost of waiting for trial evidence. Separating a recovery identity from a production identity, for example, can be tested directly against the authority boundary even when no study estimates how often shared credentials cause loss. Imperative headings name a control or observation to implement; they do not imply a universal effect size or settled prevalence estimate.

These practices are not universal rules. Each applies under particular workloads, permissions, failure costs, and organizational constraints. Where the evidence supports only a narrow claim, I keep the claim narrow. Where support remains incomplete, I state the uncertainty and describe the comparison needed to resolve it.

The goal of this monograph is to enable others to build and maintain agentic systems whose reliability can be observed, tested, and defended.

## The reliability dependency chain

The organizing argument is a dependency chain. Measurement determines whether a difference is credible. Grading converts observations into acceptance decisions. Containment and recovery determine whether the execution record survives failure without extending authority. Retrieval and context determine which evidence reaches the agent. Review and accountability determine who can challenge the result and who controls the consequential transition. Allocation and cost determine which system receives future work.

Each layer determines what the next may trust. A defect that begins in measurement can propagate through every later decision while retaining the appearance of a clean score, verdict, or artifact.

This creates a repair asymmetry. Later machinery is often easier to add than the earlier instrument is to repair, yet it is evaluated through that earlier instrument. More samples cannot repair a task distribution that excludes production work. More judges cannot repair a rubric experts apply inconsistently. More agents cannot repair a retrieval boundary that treats an empty result as authoritative. The dependency chain is therefore a sequence of evidence obligations, not a list of subsystems.

![Argument map for the reliability dependency chain: measurement, grading, containment and recovery, retrieval and context, review and accountability, and allocation and cost. Each layer supplies the evidence boundary on which the next relies.](/book-figures/dependency-chain.svg)

## What this monograph is not

It is not an exhaustive survey of the literature. The companion catalog provides breadth, while the chapters develop a minority of the practices and the conditions under which each one stops working. Equal coverage would produce a better index and a less coherent monograph.

It is not a comparison of models either. Capability moves faster than a monograph can track, and a ranking of the state of the art written in one quarter describes a different population by the next. The methods here concern how you measure and contain whatever model you are handed, which is why they outlast the ranking.

It is also not a construction guide for coding agents. No chapter covers prompt structure, tool schema design, or framework selection. I assume you already have an agent running, or will soon, and that your open question is whether its results can be believed and its reach can be bounded.

## How the monograph is organized

The monograph has six parts and eighteen chapters. Measurement comes first because every later practice is adopted or rejected through a measured comparison. Nineteen developed practices in Parts II through VI also require a method introduced in Part I. Interleaving those methods with their uses would scatter each method across four or five chapters.

This order places roughly three chapters of experiment design before the agent-specific operating chapters. The alternative would make later recommendations easier to reach but harder to assess. Definitions would arrive after their first use, and repeated fragments would replace a coherent method.

Part I establishes how I compare systems when runs vary and scores can mislead. Part II turns those measurements into grading and release decisions. Part III addresses containment, persistent state, recovery, and failure analysis. Part IV examines how repository information enters, survives, and leaves an agent run. Part V treats human review as an engineered control with interfaces, escalation rules, and accountable ownership. Part VI is a research agenda for allocating work across agents and models under cost and capacity constraints. Its questions transfer methods from adjacent scheduling and multi-agent literatures rather than presenting settled coding-agent effects.

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
| **Part VI: Research agenda—work allocation and cost engineering** | 17 | Agent topology selection and dynamic task allocation |
| | 18 | Cost-aware fleet scheduling and model routing |

*Table: Parts and chapters in the dependency-chain order.*


## What I assume you know

I assume working knowledge of version control, continuous integration, code review, on-call practice, containers, and basic statistics. I use those foundations without rebuilding them. I still describe the relevant system boundary when a familiar tool plays an unfamiliar role.

I assume no prior exposure to the evaluation methods specific to public agent results. I begin with how to read a public score and identify the claim it can support. I then show how many repeated runs a comparison needs before an observed difference carries useful information. The answer depends on variation and the size of the difference you need to detect.

I also explain why agreement with human labels does not by itself make an automated grader correct. Agreement can conceal shared mistakes, ambiguous examples, or a reference answer that measures the wrong property. I separate the observed agreement from the inference made about correctness, which becomes important when a grader controls release.

Another method checks whether a score was earned on work the model had already encountered. I introduce the required vocabulary only when the mechanism appears. My goal is that a technically capable reader should be able to reproduce the reasoning presented in this monograph, not merely accept my interpretation.

The monograph does not assume a particular agent architecture or deployment scale. I describe architecture separately from implementation so the mechanism survives changes in products and interfaces. Examples expose permissions, retries, caching, concurrency, identity, and ordering when those details affect the claim. Code appears only when prose would obscure a state transition or failure path.

## Method, scope, and evidence classification

This review treats source collection, evidence grading, practice derivation, and the treatment of author-system cases as separate methodological decisions. The following subsections describe each decision and the limits it places on the resulting claims.

### Search and source assembly

The review was consolidated on July 26, 2026, then subjected to a bounded update audit and a software-engineering venue coverage probe through August 6, 2026. The release-candidate source collection contains 138 scholarly works, 91 practitioner records, 29 benchmark records, and 17 author-system case records. The original 118 scholarly works were organized into seven topic-specific threads covering benchmark validity, failure taxonomy, evaluation statistics, oversight and accountability, context and retrieval, durable execution, and scheduling with repository-scale scoping. Eleven works were admitted during the update audit and nine during the coverage probe.

Scholarly retrieval used [SciX](https://scixplorer.org/scixabout/), the NASA-supported literature discovery service operated by the Smithsonian Astrophysical Observatory, and a local retrieval layer referred to here as **SciX Agent**. The official [SciX API](https://scixplorer.org/scixhelp/api-scix/) supplied bibliographic identities and metadata. At consolidation, SciX Agent searched a 32.4-million-record SciX and arXiv corpus with 299.3 million citation links and full text for 14.9 million records. It combined INDUS dense retrieval with BM25 lexical retrieval through reciprocal-rank fusion. These systems determined which records were retrieved and read first; they did not determine evidence grades.

Queries were scoped by topic, subject class, and year where appropriate. Each thread combined seminal work with recent agent-era research. Candidate records were verified by identity, and full text was read when available and when the claim required more than the abstract. A citation audit added the seventh thread after finding scheduling and repository-scoping sources that had entered the draft through adjacent operations-research material.

Practitioner retrieval used the **[Code Intelligence Digest](https://www.sjarmak.ai/projects/code-intelligence-digest)**, an author-operated corpus that ingests research feeds, engineering publications, newsletters, podcasts, community discussions, and product or operations accounts. At the July 26 cutoff, its local snapshot contained 162,350 normalized records from 149 source labels, including 43,953 records with retained full text. Keyword and semantic retrieval were used within relevant practitioner categories. Research records found through the Digest were moved to the scholarly lane and deduplicated there. Repeated practitioner accounts of one incident shared an independence key and could not be counted as independent corroboration merely because several pages repeated the event.

This practitioner lane makes the review **multivocal** in the software-engineering sense described by Garousi, Felderer, and Mäntylä ([2019](https://doi.org/10.1016/j.infsof.2018.09.006)): it combines scholarly and grey literature because operational mechanisms and incidents are often documented outside venues. The lane also follows the more restrictive point made by Kitchenham and colleagues ([2022](https://doi.org/10.1109/TSE.2022.3165938)): a mutable social-media post is not treated as a primary study merely because it is informative. Practitioner records remain corroborating cases unless they report a sufficiently specific measurement, and mutable cited pages are archived. The independence key operationalizes source independence by grouping reports that repeat one originating incident or claim.

The benchmark collection was assembled separately from benchmark documentation and publications, merged from two inventories, deduplicated by identity, and validated against a JSON Schema. Three repeated benchmark records were removed during that merge.

The initial scholarly search did not establish adequate coverage of the core software-engineering venue literature. A subsequent OpenAlex metadata probe searched eight topic formulations across ICSE, FSE, ASE, ISSTA, *Empirical Software Engineering*, *IEEE Transactions on Software Engineering*, *ACM Transactions on Software Engineering and Methodology*, and *Computer Supported Cooperative Work*. It surfaced 148 unique candidates. Nine methodologically material works were admitted after title-and-abstract screening, including the SEGRESS reporting guideline ([Kitchenham et al. 2022](https://doi.org/10.1109/TSE.2022.3174092)), the ABC framework for software-engineering research ([Stol and Fitzgerald 2018](https://doi.org/10.1145/3241743)), and work on construct validity in software engineering ([Sjøberg and Bergersen 2023](https://doi.org/10.1109/TSE.2022.3176725)).

That probe diagnosed coverage; it did not replace a publisher-native search. In a deterministic sample of 40 candidate DOIs, SciX contained eight exact DOI matches. All eight were TSE records. A follow-up known-set check found exact SciX DOI matches for all 26 TSE candidates surfaced by the probe, while the sample's 32 records from other venue families remained absent. These comparisons show record-level gaps and a venue-specific difference in the known candidate set; they are too topical to estimate corpus recall, topic-search recall within TSE, or equivalence to a publisher index.

ACM Digital Library returned HTTP 403 to the automated search client, and ACM's end-user policy excludes automated agents, so its prepared supplement is manual. An IEEE Xplore metadata key is configured but awaits provider activation. A credentialed, identifier-only Scopus lane is prepared but not yet configured with an API key or any institutional token required by the host's entitlement. The archival first edition is therefore conditional on executing the preserved ACM Digital Library, IEEE Xplore, and Scopus plans, or on a documented database substitution whose coverage is justified. The companion preserves the probe protocol, all 148 candidates, both exact-DOI comparisons, and the pending search plans.

![Flow of source review and practice synthesis. The source lane distinguishes the base review, bounded update audit, SE coverage probe, and the remaining publisher-native search. The practice lane reports the admission gate and overlapping hardening operations without treating their counts as an arithmetic decomposition.](/book-figures/review-flow.svg)

The search remains structured rather than exhaustive. It does not cover every scholarly index, venue, private operational record, or adjacent model-comparison literature. The SEGRESS reporting items provide the vocabulary used below: source admission is governed by inclusion and exclusion criteria; evidence-group assignment is a quality assessment of a scoped claim; and practice construction is data extraction and synthesis. These names do not change the underlying decisions, but they make the review easier to compare with software-engineering secondary studies.

### Curation and assembly workflow

The assembly process followed a fixed sequence: define a question for each thread; retrieve candidates; resolve record identity; screen for an in-scope claim; extract the bounded claim and its conditions; assign an evidence group; challenge the assignment; derive candidate practices; select practices for chapter treatment; and audit the final citations. Retrieval rank determined screening order only. A highly ranked record received no evidentiary preference after screening.

Automated systems assisted with retrieval, normalization, duplicate detection, bounded claim extraction, metadata checks, and challenge passes. The cited source remained authoritative. The author made the final decisions about inclusion, evidence grouping, practice admission, chapter placement, and prose. When a challenge pass exposed ambiguity, the lower evidence group was used unless the narrower strong claim could be stated directly.

| Review step | Mode | Human decision retained |
|---|---|---|
| Candidate retrieval and ranking | Automated and assisted | I defined each thread question and search boundary, then read the admitted sources. |
| Identity resolution, normalization, and duplicate checks | Automated checks with human resolution | I resolved ambiguous identities and practitioner independence keys. |
| Bounded-claim extraction | Assisted | I checked the source, revised the extracted claim, and accepted or rejected it. |
| Initial evidence-group proposal | Assisted | I assigned the final label to the scoped claim. |
| Challenge pass | Assisted | Automated passes flagged composite claims, contrary findings, duplicate support, and label inconsistencies; I reread the source and adjudicated each change. |
| Practice admission, chapter selection, and prose | Human | I made the selection and writing decisions. |
| Schema, checksum, identifier, and cross-reference gates | Automated verification | A failure blocked the release until the underlying record was corrected. |

*Table: Automation and human judgment in the review workflow. Automated means the operation ran without item-level prompting; assisted means a system proposed or flagged material for a human decision; human means the substantive choice was made without an automated verdict.*

The challenge pass was an error-finding aid, not an independent grader. In particular, automated assistance in that pass searched for composite claims, inconsistent evidence groups, contrary findings, duplicate support, and broken identifiers. It did not accept a practice or promote an evidence group.

The update audit screened 38 distinct scholarly records surfaced in Code Intelligence Digest editions published from July 27 through August 5, plus one paper found in a targeted August 6 check. Eleven new works were admitted, one record was already present, and 27 were deferred or excluded. Admission required a material addition to a claim already in scope; novelty or recency alone was insufficient. Material published after August 6 enters the update queue for a later edition unless it corrects a factual error in this one.

Working thread syntheses and source receipts were retained, but the original interactive searches did not preserve every machine-issued query in a publication-ready log. The companion therefore distinguishes retained records from reconstructions. It publishes the source snapshots, sanitized thread protocols, the retained update-search record, and record-level update decisions; it does not present reconstructed query text as an exact historical log. This permits protocol-level review without implying that every interactive search can be replayed byte for byte.

### Screening and evidence grading

A source entered the working corpus when it contributed at least one measured result, reproducible mechanism, operational incident, benchmark property, or concrete practice relevant to coding-agent reliability. Screening removed records with unresolved identity, no recoverable claim, no relation to a decision in scope, or complete redundancy with a better-supported record. Sources could remain in the review while a proposed practice was rejected; source inclusion and practice admission were separate decisions.

Evidence is reported in four reader-facing groups:

- **Strong evidence** is an on-claim controlled comparison, validated benchmark result, or comparably specific measurement within stated conditions.
- **Directional evidence** supports a mechanism, threat model, comparison design, or direction of effect without establishing the complete recommendation, its magnitude, or broad transfer.
- **Corroborating evidence** consists of case reports, practitioner accounts, or convergent observations that establish plausibility without estimating prevalence.
- **Null or conflicting evidence** records a result that did not support the expected effect or that materially limits another claim.

These labels attach to evidence items and scoped claims, not to publication venues or whole chapters. A composite recommendation does not become strong because several directional sources converge. When no individual controlled study supports the complete recommendation, the text either narrows the claim to the measured component, classifies the transfer as directional, or presents a protocol to test locally. A strong item may therefore support one step of a developed practice while leaving the generalized prescription directional.

The catalog was graded during assembly and then challenged through independent verification passes. A targeted audit examined ten practices whose sole supporting synthesis had been graded strong, together with two restored items. Six grades were reduced because the source demonstrated a hazard, substrate, or adjacent result rather than the stated remedy; six were retained because the controlled comparison matched the claim. Identifier checks, duplicate-identifier gates, thin-evidence rulings, practitioner-independence checks, and contrary evidence were preserved in the audit record. Ambiguous cases defaulted to the lower grade.

The final adjudication was performed by the author. The challenge passes reduced correlated review error, but they do not constitute blinded independent grading by several human reviewers. That creates an asymmetry with Chapter 5, which asks operators to calibrate graders against independent labels before relying on them.

The release artifact therefore includes a deterministic random sample of 20 practices, the associated evidence items with the author's labels hidden, a reviewer response template, and a script that can report pairwise Cohen's kappa, Fleiss's kappa when three readers participate, observed agreement, and disagreement patterns. For this edition, the author did not commission external graders. The monograph reports no inter-rater agreement value and does not claim independent calibration or reproducibility of its evidence-group assignments. This is a standing limitation of v1 rather than an incomplete release gate. If independent readers reuse the protocol later, the author label should be compared only after their blinded pass and should not be treated as ground truth; agreement would measure reproducibility of the classification instrument rather than correctness of every grade.

The machine-readable edition status in `companion/methodology/external-grading/status.json` records that no completed external response, calibration report, or agreement result is part of this edition.

### Practice derivation and chapter selection

Candidate practices were derived through bounded-claim extraction and synthesis, then passed through a separate admission gate. A record qualified at the final gate through at least one scholarly item, a non-author synthesis with a resolvable scholarly identity, or at least two practitioner items with distinct independence keys. Hardening separated bundled claims, removed redundant or self-defeating records, preserved contrary findings, and repaired provenance. The resulting catalog contains 192 edition records, each with a stable identifier. That total reflects the chosen claim granularity and editorial boundaries; it is not an estimate of how many reliability practices exist. The companion preserves the full record arithmetic and identifies which hardening operations overlap.

Three selection passes ranked the catalog by different criteria: teachability through a bounded case, consequence for an engineering decision, and coverage of the fourteen mechanism clusters. Practices selected by at least two passes formed the base of the developed set. Individual adjudication then repaired thin mechanism coverage and one provenance defect. The resulting 55 practices receive full treatment in the 18 chapters; the remaining 137 appear in the companion catalog.

The consequence ranking also supplies the operational-urgency calculation used later in the monograph. Among its 52 ranked practices, the Spearman correlation between urgency rank and a binary indicator for whether the practice carried at least one strong evidence item was -0.004. The phrase *nearly uncorrelated* refers to this calculation, not to all 192 catalog entries or to a latent universal measure of importance.

The resulting chapter set is an authorial engineering judgment, not an evidence-derived consensus. The near-zero correlation makes that distinction visible. Some practices are included because a controlled comparison measured their effect; others are engineering controls justified by a structural failure mechanism, an observable check, and an asymmetric cost of waiting for trial evidence. Separating a recovery identity from a production identity, for example, can be tested directly against the authority boundary even when no study estimates how often shared credentials cause loss. Imperative section titles name the control or observation to implement; they do not imply a universal effect size or settled prevalence estimate. Where the argument is mechanistic rather than experimental, the chapter supplies a local test and avoids a numerical target.

### Author-system cases and limitations

Cases from systems operated by the author expose mechanisms, original measurements, and reproducible failure cases. They are always treated as illustrations or local measurements. They are not counted as independent external evidence and do not by themselves support a general recommendation.

A **local artifact** is a record from a system operated by the author and used to expose a mechanism or local measurement. It is not independent external evidence. When its source was uncommitted at the cited revision or its figures were read from source rather than independently remeasured, the chapter states that provenance condition at first use instead of assigning the artifact a second name.

Evidence remains uneven across topics. Several operational questions have only case-level support, recent capability measurements can age quickly, and practitioner reports are vulnerable to selection, survivorship, and reporting bias. The review excludes model-comparison and prompt-engineering literatures except where they bear directly on system reliability. Transfer is especially substantial in Part VI, where observatory scheduling, compute-cluster scheduling, and adjacent multi-agent studies motivate testable designs for coding-agent fleets. That part should be read partly as a research agenda, not as a body of settled deployment guidance.

This section establishes the standard evidence legend for the whole monograph. Later chapters repeat a limitation only when it changes how a particular result may be used.

## Contributions

This work makes six contributions:

1. a multivocal evidence audit and machine-readable ledger that distinguish direct support, directional findings, corroborating cases, and null or conflicting results;
2. a versioned catalog of 192 bounded practice records in this edition, including 55 developed in depth and stable identifiers that connect the manuscript, companion, and implementation artifacts;
3. a dependency chain—and its repair asymmetry—connecting measurement, grading, containment and recovery, context management, human oversight, and resource allocation;
4. original measurements and failure cases from author-operated systems, explicitly separated from external evidence;
5. runnable protocols for local evaluation, capability-boundary testing, recovery testing, trace analysis, and release decisions; and
6. five reusable agent skills with practice-level evidence maps, packaged in the project repository as implementation artifacts rather than additional evidence.

The chapters emphasize conditions, measurements, and failure boundaries because an outcome alone rarely identifies why a system succeeded or failed. A useful account traces ownership, permissions, persistence, ordering, and observation while distinguishing correctness from reliability, performance, cost, safety, and usability.

## A minimum pass through the dependency chain

For an existing system, one compact pass produces the minimum record on which later decisions can build:

1. Reopen one decision based on an aggregate score. Run the cheapest credible baseline and the candidate on identical task versions, initially three times per item, and preserve per-item outcomes.
2. Record success, reliability, cost, latency, model, harness, prompt, permissions, and pricing snapshot separately.
3. Exercise one permitted and one prohibited action with the ordinary identity, including the boundary between primary and recovery resources.
4. Verify one recent completion claim from repository or system state and rerun the executable check that makes it true.
5. Read twenty failed or unverifiable runs, label the first upstream failure where the trace permits it, and repair the first ordinary causal question the schema cannot answer.
6. Before the next promotion run, record the success floor, cost ceiling, task and baseline versions, mechanism condition, and fault-containment guard.

The pass leaves six challengeable artifacts: a paired distribution, a cost-quality record, an observed authority boundary, an independently verified state transition, a seed failure corpus, and a decision rule fixed before the result was known. It is an entry point, not a reliability certificate. The repository artifact [`protocols/minimum-reliability-pass.md`](https://github.com/sjarmak/engineering-reliable-coding-agents/blob/main/protocols/minimum-reliability-pass.md) supplies the runnable checklist and retained-artifact layout; the chapters develop each step.


## How to read a chapter

A chapter opens on a concrete situation, usually a measurement that came out wrong or a failure with a traceable cause. The mechanism follows, then what the evidence does and does not establish, then the boundary conditions, then a procedure you can run. Specialized terms are marked in bold where they are defined, so a term met later can be traced back to that site.

Citations appear inline in author-year form, with the year linked to the source. The back matter of each chapter, headed Sources and evidence, records the evidence grouping, identifier, and claim supported by each item. The back matter is authoritative for identifiers and evidence grouping; the prose states the claim for which a source is used. A disagreement between the two is an editorial defect.

The evidence legend in the methods section applies throughout. Chapter text restates only limitations that materially narrow a particular result, while each unnumbered Sources and evidence section records the claim, identifier, and evidence group for the cited items.


## The companion catalog

The [companion site](/books/engineering-reliable-coding-agents/companion) indexes all 192 practices under the chapter whose mechanism each extends. The 55 developed in the main chapters appear as short pointers into the chapter; the remaining 137 appear as compact entries. The catalog broadens the set of available options without forcing the main text to explain every variation. The [project repository](https://github.com/sjarmak/engineering-reliable-coding-agents) contains the versioned manuscript, evidence ledger, benchmark catalog, schemas, provenance data, and release checksums.

Use the relevant chapter as the foundation, then consult the catalog for practices that match a specific constraint. A compact entry cannot reproduce the chapter’s full treatment of mechanism, evidence, tradeoffs, and failure boundaries. The chapter provides the reasoning needed to decide whether a neighboring practice applies to your workload.

Twenty-nine of the full entries are labeled as limited-support notes. I excluded them from the developed set because the available evidence does not support a recommendation. Treat them as prompts for investigation rather than established guidance. They may point to a useful experiment, a missing control, or a failure mode worth instrumenting.

The chapters and catalog serve different purposes. The chapters develop methods and claims in enough detail to evaluate critically. The catalog preserves breadth and makes related practices easier to find. Together, they let you begin with a measured problem and identify an intervention suited to the system you actually operate.

The repository also packages five reusable agent skills derived from selected practices: evaluation design, end-to-end test design, failure-mode capture, focused execution, and verified long-running implementation. Each skill includes a practice-level evidence map. These are reusable implementation artifacts, not additional evidence for the practices.

This edition is versioned because capability measurements and source availability change. The evidence ledger is scheduled for an annual review, with an out-of-cycle release when a material factual error, citation failure, or retraction changes a claim. Stable practice IDs persist across those releases; a later edition may retire, split, or merge a record without silently reusing its identifier.

## What you should be able to do by the end

Given a published agent score, you should be able to state the narrower claim it supports and identify the conditions on which that claim depends. Given a proposed change to your own system, you should be able to measure run-to-run variation before crediting a difference and size the comparison before spending the model calls. Both systems should run on the same items, and a design that cannot resolve the difference relevant to the decision should return no verdict. Cost belongs in that judgment alongside accuracy, as does the possibility that a simpler configuration would have performed just as well.

You should be able to assess whether a public score was earned on tasks the model may already have encountered and to build an evaluation set from your own repositories when the public benchmark does not represent your work. Grades should rest on execution rather than the model's confidence, and automated graders should be validated against human labels before they gate releases. When a proxy improves without a corresponding improvement in the outcome it represents, the system should make that divergence visible.

Operationally, you should be able to bound what a single run can access and destroy, and you should treat an agent's account of its own work as a claim that still requires verification. A run that fails partway through should leave a durable record of which steps completed, and every retried step should be safe to execute again. Recovery should be tested by injecting failures rather than inferred from an architecture diagram. Reading a hundred traces from your own system should yield a concrete failure taxonomy.

Retrieval should be evaluated separately from generation so that a wrong answer can be attributed to the stage that produced it. You should also be able to measure how much of an advertised context window the system can use effectively. Human review should occur where the reviewer can see the decision that carries the risk, and autonomy should expand by action type only when measured approval and modification rates justify it. A multi-agent design should be required to outperform a single agent on the same tasks, and each component should run on the least expensive model that can perform its role reliably.

The goal is to provide you with the tools to measure what matters for your work, so the result describes the system you operate rather than a position on a leaderboard.
