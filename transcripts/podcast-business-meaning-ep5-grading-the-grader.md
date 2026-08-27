---
title: "Grading the Grader"
audioUrl: /media/podcasts/podcast-business-meaning-ep5-grading-the-grader.mp3
durationMin: 13.7
words: 1901
---

Someone audited the answer keys.

Yiwen Jin and colleagues took a widely used development subset of the BIRD benchmark, four hundred and ninety-eight examples, and put every one through a three-stage human review. Not the models' answers. The gold answers. The queries the benchmark treats as correct by definition.

Two hundred and sixty-three of them were wrong. Fifty-three percent.

Then they did the same for a subset of Spider two point zero on Snowflake. One hundred and twenty-one examples, seventy-six of them wrong. Sixty-three percent.

A previous audit had reported thirty-six percent for the first of those, so the problem was known to exist and understated by half.

This is episode five of Where Business Meaning Lives, and it is the episode that changes how you should read the previous four. Every number I have quoted came out of an instrument, and this is what happens when you point an instrument at the instrument.

Start with why this is possible at all, because execution-based evaluation was supposed to have solved it.

The first generation of text-to-SQL benchmarks compared generated queries to gold queries as strings or trees. That is obviously wrong: two queries can be textually different and semantically identical. So the field moved to execution accuracy. Run both queries against the database, compare the results. If they match, the query is correct. That feels airtight, and it removes an entire class of false negatives.

It introduces two new problems instead, and both were documented years ago.

Ruiqi Zhong and colleagues, in twenty twenty, showed the first: two semantically different queries very often agree on any single database instance. Filter for customers with more than five orders and customers with at least five orders will produce identical results on any instance where nobody has exactly five. Execution accuracy on one instance is therefore an upper bound on semantic correctness, not a measurement of it. They built distilled test suites, compact sets of database instances chosen to separate semantically distinct queries, and that method exists and is available. Most of this literature still reports the upper bound.

Catherine Finegan-Dollak and colleagues, in twenty eighteen, showed the second: how you split the data determines what you measure. If you split by question, the same query template appears in training and test with different phrasings, and a system that memorizes templates scores well. Split by query instead and the numbers drop sharply. That paper is eight years old and its recommendation is still not universal.

Both of those are about the evaluation procedure. Jin and colleagues found something worse, because it is about the data itself.

After the audit they re-scored sixteen open-source agents from the BIRD leaderboard against the corrected gold. Relative execution accuracy moved between minus seven percent and plus thirty-one percent. Twelve of the sixteen went up. Ranks shifted by as much as nine places. One system, CHESS, went from sixty-two percent to eighty-one percent, and from seventh place to tied for first.

And then the measurement that I think is the single most important number in this whole map. They computed the rank correlation between the subset and the full development set. Before correction: Spearman zero point eight five, highly significant. After correction: zero point three two, not significant at all.

Read that carefully. The subset and the full set agreed about which systems were best, right up until both were corrected. They agreed because they were wrong in the same way. The apparent reliability of the benchmark came from a shared error, not from a shared signal.

There is a separate failure mode that gets conflated with this one, and I want to keep them apart. Contamination. If a model saw the benchmark during training, its score is memory rather than capability. This year, a syntactic probe called SPENCE tested BIRD for exactly that, and found it clean of the leakage it was designed to detect.

So BIRD is not contaminated and is more than half mis-annotated. Those are independent problems with independent fixes, and a paper that establishes one says nothing about the other. Anyone reasoning about benchmark validity should be tracking both.

Two more pieces belong here, because they attack the same problem from the other end.

The first is a line of work on detecting semantic errors in generated SQL directly, rather than inferring them from a result comparison. NL2SQL-BUGs, from last year, is a benchmark for exactly that: given a question and a generated query, identify whether the query means something other than the question asked. That is a harder task than checking whether two result sets match, and it is the task an evaluation would perform if you wanted to know why a system failed rather than that it failed.

The second is about the questions themselves. Harm de Vries and colleagues, in twenty twenty, argued that research on language user interfaces is systematically unlike the deployed setting, because of how the data gets collected. Questions written by annotators looking at a schema differ from the questions users ask. That is the same critique KaggleDBQA operationalized by hiding the schema from its question writers, and it generalizes past text-to-SQL to every benchmark where the task designer and the eventual user are different people with different information.

Put those alongside the annotation audit and you get a fairly uncomfortable summary of the state of evaluation in this area. The answer keys are unreliable, the comparison procedure is an upper bound, the splits often measure memorization, and the questions may not resemble the ones anyone will ask. Each of those has a published fix. Very little published work applies more than one of them.

Now, granting that the instrument works, there is a second question. What is it measuring that should generalize?

Yujian Gan and colleagues built Spider-Syn by replacing schema-related words in questions with synonyms, which breaks the shortcut where a system matches question words to column names directly. Performance drops. Shuaichen Chang and colleagues built Dr.Spider, seventeen perturbation test sets spanning question, database and SQL perturbations, so a robustness failure can be attributed to a specific cause rather than reported as an aggregate. Xinyu Pi and colleagues perturbed the tables themselves.

That is a well-developed diagnostic toolkit for the parser. There is nothing equivalent for the semantic layer, and by now that absence should be conspicuous. Rename a metric. Change a join convention. Split one entity into two. Leave a measure undefined. Those are the perturbations a semantic model actually undergoes at a real company, and not one of them appears in any published evaluation. A system whose reliability depends on a model that nobody perturbs has an untested dependency at its center.

Which brings us to the last theme, and to the trap waiting at the end of all of this.

Suppose you now have an evaluation you trust. You start improving your system against it. You rewrite prompts, adjust retrieval, rearrange the scaffold, and accept each change because the development score went up.

Cynthia Dwork and colleagues published the analysis of that exact process in Science, in twenty fifteen. A holdout set reused across adaptively chosen analyses stops being a valid estimate of generalization, because every decision you make after looking at it leaks information from it. The number of effective hypotheses you have tested is unbounded and untracked. Their constructive result is that accessing the holdout through a differentially private mechanism restores validity for a bounded number of queries.

Every development-set-driven agent optimization loop in this literature is an instance of the problem that paper solved eleven years ago. Almost none of them cite it.

And the optimizers are getting fast. GEPA, from Lakshya Agrawal and colleagues, evolves prompts by reflecting on execution traces in natural language and keeping a Pareto frontier of candidates rather than a single best. It beats reinforcement learning by six percent on average and up to twenty, with as much as thirty-five times fewer rollouts, and beats the previous prompt optimizer by more than ten percent. It was accepted at ICLR this year as an oral.

Sample efficiency is symmetric. An optimizer that reaches a good configuration in few rollouts reaches an overfitted one just as fast. And the paper reports the optimization gain without a held-out generalization gap beside it, which is exactly the missing measurement.

So what do you do? You meter the holdout. In my own design that means a deterministic split: one hundred and one questions sealed and scored once, two hundred and thirty-one for development, and the development set split again so that the second half functions as a metered holdout with a hard cap of ten checkpoints, an append-only ledger, and a rule against changing anything in response to a specific evaluation instance.

That is the applied form of a twenty fifteen theorem, and I will say plainly that nobody has demonstrated it survives a real agent optimization loop. The experiment is straightforward to describe and nobody has run it: two teams, one optimizing against an unmetered development set and one against a metered one, both scored on the same sealed set at the end.

One more thing about instruments, and it is from our own reconnaissance rather than from the literature.

Reading the public LiveSQLBench evaluator at a pinned commit shows that before comparing results it strips standalone DISTINCT while keeping DISTINCT ON, replaces ROUND with its first argument including in nested calls, normalizes datetimes down to dates, recursively rounds floats to two decimal places without consulting what the individual task declared about precision, fails a comparison when both result sets are empty, and compares results as sets when order is not required, which discards duplicate multiplicity.

Every one of those is a decision about what counts as the same answer. Several are applied regardless of what the task itself specifies. I am not saying the scores are wrong. I am saying that a leaderboard built on those rules is partly measuring the normalizer, and the only way to find out how much is to run the same submissions through two scorers that differ only in those decisions, which is a cheap experiment nobody has published.

Let me close the series.

Nine themes, about seventy-five papers, and one pattern underneath all of them. Every system in this literature that made natural language querying work in a real domain moved a decision out of the generation step. Into documentation the model reads. Into a representation it targets instead of SQL. Into a compiler it cannot bypass. Into a harness that decides what it is even asked.

And the payoff is something the accuracy tables cannot show. What these systems mainly buy is not more correct answers but a partition of a confidently wrong one: correct inside a boundary someone drew on purpose, and refused outside it. That trade is worth making in some settings and not in others, and you cannot evaluate it with one number.

The map ends with nine open problems, and I will leave you with three. Separate knowledge, representation and enforcement in a single experiment, because no published study does. Report correct, wrong and refused as three numbers instead of one. And re-run the last three years of text-to-SQL results on corrected gold, because the corrections are published, the compute is trivial, and a large fraction of what the field currently believes rests on an answer key that was more than half wrong.

Thanks for listening.
