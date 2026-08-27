---
title: "What the Schema Doesn't Say"
audioUrl: /media/podcasts/podcast-business-meaning-ep1-what-the-schema-doesnt-say.mp3
durationMin: 12.9
words: 1794
---

There is a column in a data warehouse somewhere called rev net amt. An agent asked what revenue looked like last quarter will find that column, because the name is close enough to the question, and it will write a query that sums it and filters on a date. The query will parse. It will execute. It will return a number that has the right shape, the right magnitude, and the right units. Whether it is the right number depends on a fact that appears nowhere in the schema: whether this company recognizes revenue at order or at fulfillment, whether returns are already netted out in that column or subtracted somewhere else, and whether the four subsidiaries acquired since twenty twenty-two were ever migrated onto the same convention.

That gap is what this series is about. Welcome to a five part walk through a literature map called Where Business Meaning Lives, following about seventy-five papers organized into nine themes, plus a tenth section for an experiment of my own that has not produced results yet.

The question underneath all of it is this. When an AI agent answers questions about enterprise data, what changes when business meaning is represented and enforced as part of the system, rather than left for the model to infer while it writes SQL? And the follow-on question, which turns out to be the harder one: where does reliability actually come from? Is it access to business knowledge, the way that knowledge is represented, constraints on what the model is allowed to generate, the harness around the model, or validation after the fact? Those five sound like a list. They are actually five different engineering investments with different costs, and almost nothing in the published literature separates them.

This is episode one. The schema underdetermines the question, and what a document buys you.

Let me start with the result that made everyone think this problem was solved. Spider, from Tao Yu and colleagues in twenty eighteen, was the benchmark that defined the modern task: cross-domain text-to-SQL, two hundred databases, and crucially, databases at test time that the model had never seen during training. That last property is what made it feel like a real generalization test rather than a memorization test. And by the early twenty twenties, systems were scoring above ninety percent on it. If you only read that number, natural language querying is finished.

Three benchmarks took that apart, and they took it apart in three different ways, which is why all three matter.

The first is KaggleDBQA, from Chia-Hsuan Lee, Oleksandr Polozov and Matthew Richardson in twenty twenty-one. It is small, two hundred and seventy-two examples over eight databases, and it is the most surgical of the three. They took real databases that real people had uploaded to Kaggle, and they kept them exactly as they found them. Original abbreviated column names. Unnormalized values. No cleanup. Then they had the question writers look at the data but not at the schema, which is what does the work. In the academic benchmarks, the people writing questions could see the tables, so their questions came out already phrased in the schema's vocabulary. Remove that, and the question arrives in the domain's vocabulary instead, which is what actually happens when a person asks a question. A state-of-the-art parser scored thirteen and a half percent.

The second is BIRD, from Jinyang Li and colleagues in twenty twenty-three. Twelve thousand seven hundred and fifty-one question and SQL pairs over ninety-five databases, thirty-three gigabytes of data, thirty-seven professional domains. Dirty values, large table counts, and query efficiency scored as its own dimension because on data this size a correct answer computed a stupid way is still a problem. ChatGPT reached about forty percent execution accuracy where human experts on the same questions reached about ninety-three. A gap of roughly fifty-three points, and it is not a parsing gap. The failures are the model attaching the wrong business meaning to a plausible looking column.

BIRD also ships an external knowledge annotation with each question: the piece of domain understanding a human analyst would already have. That is a benchmark conceding, in its design, that the schema alone is not a sufficient input to the task. Everything the semantic layer people argue for follows from accepting that premise.

The third is Spider two point zero, from Fangyu Lei and colleagues in twenty twenty-four, and this one is about scale. Six hundred and thirty-two problems drawn from real enterprise workflows on BigQuery, Snowflake and DuckDB. Databases that routinely exceed a thousand columns. Dialect-specific SQL. Multi-step transformations where the answer is not one query. Solving these usually means searching metadata, reading dialect documentation, and reading project code. An o1-preview code agent solved twenty-one percent. Against ninety-one on Spider one point zero and seventy-three on BIRD.

Seventy points. That is the size of what the original benchmark's simplifications were worth.

So the schema underdetermines the question. Now: what happens if you just write the missing meaning down?

KaggleDBQA ran that ablation, and it remains the cleanest version of it. Thirteen and a half percent zero-shot. Seventeen point nine with in-domain fine-tuning. Twenty-six point eight once they added column descriptions drawn from each database's own published documentation. So documentation is worth close to nine points, about two thirds of the total lift, and the largest single measured intervention anywhere in this corpus.

And the system is still under twenty-seven percent.

Hold that number, because the next result appears to contradict it. Mikita Rumiantsau and Aleksei Fokeev, this year, ran a paired benchmark on exactly this question. One hundred natural-language questions over the Contoso retail dataset in ClickHouse, three frontier models, single shot, no retries. Schema only: forty-five to fifty percent depending on the model. Schema plus a business context document: sixty-eight percent, near enough, for all three. Every cross-condition comparison significant below point zero one.

The document was four kilobytes of markdown. Measures, conventions, disambiguation rules. Someone sat down for an afternoon and wrote out what the words mean.

And here is the finding I keep coming back to. Within each condition, the three frontier models were statistically indistinguishable from each other. On this workload, the four kilobyte document mattered and the choice of frontier model did not.

Now, two studies. One says documentation is the biggest lever available and still leaves you failing three questions in four. The other says documentation is worth twenty points and outweighs the model. The lazy move is to average them into "context helps somewhat." Do not do that. Ask instead what experimental difference produces the disagreement, because that difference is the actual finding.

Contoso is a clean star schema. Fact tables, dimension tables, sane naming. When a model fails there, it fails because it does not know that this business defines an active customer as ninety days rather than thirty. That is a vocabulary gap, and a vocabulary gap is exactly what a four kilobyte glossary closes.

KaggleDBQA and Spider two point zero measure structure and scale gaps instead of vocabulary gaps. A thousand columns you have to search. Transformation logic defined in a dbt project you have to read. Dialect quirks. A glossary does not touch any of that, and the residual after adding one is enormous.

So the defensible statement is narrower than either paper's headline, and more useful than both. Writing down what the words mean closes the vocabulary gap, and it is cheap relative to the return. It does nothing for the structure gap. Which of those two gaps dominates depends on your warehouse, and nobody publishes that split.

There is one more thing this theme establishes, and it changes the shape of the problem rather than its size.

LiveSQLBench, from the BIRD team, pairs industrial-scale PostgreSQL databases with what they call a hierarchical knowledge base, one per database. It is a directed graph rather than a glossary, and definitions in it depend on other definitions.

I measured the public release for this map, because the structure is the interesting claim and I wanted to know whether it was really there. Across eighteen databases: one thousand and ninety knowledge entries, nine hundred and forty-five dependency edges between them. Five hundred and sixty of those entries depend on at least one other entry. The longest chain runs six deep. Multi-hop structure is present in every one of the eighteen databases, not concentrated in a few. No duplicate identifiers, no dangling references, no cycles. The schemas underneath hold nine hundred and seventy-one tables and just under eighteen thousand columns.

Sit with what a dependency graph implies. If net revenue is defined in terms of gross revenue and returns, and returns is defined in terms of an adjustment convention, then retrieving the definition of net revenue and pasting it into a prompt has retrieved a fragment. You need the closure. Which makes supplying meaning a multi-hop composition problem over a structured object, and top-k retrieval will not do it.

And once you have said that, you have stopped talking about documentation and started talking about representation. Which is the next episode.

One last observation about that same artifact, because it belongs here. The public agent that ships alongside LiveSQLBench exposes the knowledge base to the model through a service, and that service omits two fields from every entry it returns: the entry's type, and the list of its children. Those two fields are the dependency structure. The benchmark exists to test whether a system can compose business definitions, and the reference agent is handed the definitions with the composition erased.

I am not raising that as a complaint about a useful public artifact. I am raising it because it is the first appearance of a pattern that will come back in episode five: the instrument that measures these systems is itself a system, built by people making decisions, and those decisions are rarely reported alongside the scores they produce.

What this theme establishes is that the bottleneck moved off parsing, and it moved several years ago. The model is now being asked to infer, from column names, a set of conventions that a company arrived at through years of decisions nobody wrote down. What it does not establish is how much of that inference can be supplied as text, because the two best measurements of that disagree, and they disagree for a reason we can name and nobody has yet tested directly.

Next episode: what happens when you stop handing the model a document and start handing it a different thing to generate. Ontologies in two thousand sixteen that beat the neural leaderboard in twenty twenty, one controlled experiment that isolates representation as a variable, and the question of whether the target language is the real intervention. That is episode two.
