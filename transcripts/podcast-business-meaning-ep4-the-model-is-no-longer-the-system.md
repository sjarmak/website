---
title: "The Model Is No Longer the System"
audioUrl: /media/podcasts/podcast-business-meaning-ep4-the-model-is-no-longer-the-system.mp3
durationMin: 12.9
words: 1811
---

Two papers published four weeks apart this year asked the same question. How much of an agent's measured performance comes from the model, and how much comes from the scaffold around it?

One found a difference of up to eight points, with confidence intervals mostly covering zero. The other found up to twenty-eight points, and rejected its own preregistered hypothesis in the process.

Both are careful. Both are right. And the reason they disagree is the most useful thing either of them produced.

This is episode four of Where Business Meaning Lives. So far we have moved a decision out of the model three times: into a document it reads, into a representation it targets, into a compiler it cannot bypass. Today we look at the thing that has been quietly present in all three and that almost no evaluation controls for. The harness.

Let me define the term, because it gets used loosely. The harness is everything between the user's question and the model's output that is not the model. What context gets assembled. Which tools are exposed and how they are described. Whether there is a planning step. Whether output is validated and the model gets to try again. How many turns before it stops. When a paper reports that a model scored some percentage on an agentic benchmark, every one of those decisions was made by someone, and almost none of them are in the paper.

The first study is from Aryan Vats and Dmitri Golev. They ran two models, Qwen three point six Plus and MiniMax M two point five, across three agent harnesses, Goose, OpenCode and OpenHands-SDK, on a stratified fifty-task subset of Terminal-Bench Pro. Paired within model and within task, with bootstrap intervals over the paired tasks.

Their headline finding on accuracy is a shrug. Paired pass-rate differences between harnesses ran from zero to eight points, and the ninety-five percent intervals covered zero everywhere except at the largest gap. On the evidence, harness choice barely moved whether the task got solved.

Their finding on cost is not a shrug at all. Up to a forty-fold difference in tokens consumed per solved task. Same model. Same tasks. Same outcomes, roughly. Forty times the tokens.

The second study is from Giulio Starace and colleagues. Preregistered, which matters for what follows. Three scaffolds: ReAct, a Planner-Actor-Rater multi-agent structure, and a planner-then-executor. Five models, GAIA validation levels one and two, three attempts per question.

Scaffold choice alone moved measured accuracy by as much as twenty-eight points within a single model.

And the preregistered prediction, the intuitive one, that stronger models are less sensitive to scaffolding because they need less help, was rejected in direction. The effect ran the opposite way.

Zero to eight points against up to twenty-eight. What is the experimental difference?

Goose, OpenCode and OpenHands-SDK are three implementations of broadly the same thing: a tool-calling loop with a model in it. They differ in prompt wording, tool descriptions, retry policy, context management. ReAct versus Planner-Actor-Rater versus planner-then-executor are three different control structures. One interleaves reasoning and action. One separates planning from execution from evaluation across multiple agents. One plans fully, then executes.

That suggests a hypothesis worth stating precisely, because it is testable and nobody has tested it. Harness implementation is a cost variable. Harness architecture is an accuracy variable. If that holds, agent evaluation gets a much cheaper reporting standard than the current implied requirement of measuring every model against every configuration.

There is a second difference, and it matters for our subject specifically. Terminal-Bench Pro tasks are largely self-contained: the work happens in a shell the agent already has. GAIA tasks require finding information the agent does not start with. When the task's difficulty lives in retrieval, the scaffold is the thing doing the retrieving, and its architecture becomes load-bearing.

Which is exactly the situation in enterprise analytics.

Think back to Spider two point zero from episode one. Six hundred and thirty-two problems where solving one means searching database metadata, reading dialect documentation, and reading project code. The o1-preview agent scored twenty-one percent. How much of that twenty-one is the model's SQL ability and how much is the scaffold's ability to find the right three tables among a thousand columns? Nothing in the reported number separates them.

And when the semantic layer arrives, this gets sharper. A semantic layer is a retrieval surface. Something has to decide which metrics and dimensions are relevant to the question before the model composes anything. That decision is made in the harness. So a comparison between a semantic-layer system and a text-to-SQL system, run with different harnesses, is measuring at least two variables and attributing the result to one.

Let me make that concrete, because "the harness matters" is a claim people nod at without picturing what is in it.

Take a question against a warehouse: which product lines lost margin in the Northeast last quarter. Before any model writes anything, some code has decided which of eighteen thousand columns to show it, whether to show sample values, whether the semantic model's measure definitions are in the prompt or behind a search tool, whether the agent may run an exploratory query first, whether a failed query returns the database error text or a sanitized message, how many repair attempts it gets, and whether the final answer is checked against anything before it is returned.

Nine decisions, none of them model capability, all of them upstream of the number you report. Change the sixth one, whether the agent sees the real Postgres error, and a class of failures becomes recoverable that previously was not. That is not a small effect and it has nothing to do with which model you chose.

And notice that several of those decisions are the same interventions from episodes one through three, implemented in the scaffold rather than in a data model. Deciding what context to assemble is supplying knowledge. Restricting which tools exist is enforcement. A validate-and-retry loop is post-hoc validation. So when a study changes the semantic layer and leaves the harness free to vary, the mechanism it is attributing to representation may be sitting in the retry loop.

There is a growing body of work naming this problem. Harness-Bench measures harness effects across models in realistic agent settings. A source-code taxonomy of coding agent architectures, from Ren and colleagues this year, does the descriptive work of cataloguing what these systems actually contain rather than what their papers say. There is work on learnable controllers that adapt the harness rather than fixing it. And there is a result from Gao and colleagues that should worry anyone doing safety evaluation: measured safety behavior also shifts with the evaluation conditions, which means a safety number is a property of a pair as well.

Perhaps the most direct piece of evidence about the state of the field is an audit by Nguyen and colleagues of what twelve agent benchmark papers disclose about themselves. The answer is: not enough to reproduce the harness. Which means the field is currently publishing measurements of model-and-harness pairs while reporting only the model.

I have written about this from the other side, in a book on engineering reliable coding agents, and the argument there is the same one arriving from practice rather than from benchmarks. When you operate these systems, the model is one component among a dozen, and the components you control are usually the ones determining whether the thing works. Retrieval quality. Context budget. Whether failures are recoverable. Whether state survives a restart. None of that is model capability, and all of it shows up in whatever number you eventually report.

I want to dwell on the cost finding for a second, because it tends to get treated as a footnote to the accuracy finding and it is the more actionable of the two.

Forty times the tokens for the same outcome is not a tuning detail. At production volume that is the difference between a feature that pays for itself and one that does not, and it is invisible to every leaderboard, because leaderboards report accuracy. A system that reaches the same answer through eleven exploratory queries and four self-corrections scores identically to one that reaches it in two, and costs an order of magnitude more, and has an order of magnitude more surface on which to fail in a way nobody logged.

For analytics specifically, that cost lives in a predictable place: the exploration loop. An agent that cannot see the semantic model has to discover the schema by querying it, and discovery is where the tokens go. Which is a testable prediction rather than a slogan. If representation is doing real work, the governed condition should be cheaper as well as more accurate, and if it is only more accurate then something else is producing the accuracy.

Let me connect this back to the through-line of the series.

Episodes one through three described three ways of moving a decision out of the generation step: into documentation, into a representation, into a compiler. The harness is the fourth, and it is the one that has been there the whole time without being named. What context assembly does is decide what the model knows. What tool design does is decide what it is allowed to attempt. What a validation-and-retry loop does is decide whether a wrong first answer becomes a wrong final answer.

Those are the same three functions as knowledge, representation and enforcement, implemented in imperative code instead of in a data model. Which is why an experiment that changes the semantic layer and the harness together and reports the difference cannot tell you which one did the work.

In my own design, the harness is what condition three and condition four differ by, deliberately. Same semantic model. One condition lets the agent search it and compose queries itself, the other routes every query through a governed interface. If the harness is doing most of the work in enterprise deployments, that comparison is where it should show up.

What this theme does not settle is large. There is no controlled measurement of harness effects on text-to-SQL specifically. Both studies I described are on coding and general agent benchmarks. The implementation-versus-architecture hypothesis is a hypothesis. And there is no reporting standard: no journal, conference or leaderboard currently requires that you disclose the scaffold in enough detail for anyone to reproduce it, which means the disclosure audit's finding will keep being true.

Next episode is about the instrument. Every number I have quoted across these four episodes was produced by a benchmark, and this year someone audited the answer keys of two of the most widely used ones and found that more than half the examples they checked were wrong. That is episode five, and it is the one that most changes how you should read the previous four.
