---
title: "The Layer Between Language and SQL"
audioUrl: /media/podcasts/podcast-business-meaning-ep2-the-layer-between-language-and-sql.mp3
durationMin: 14.4
words: 1953
---

In two thousand sixteen, four years before GPT-3, a system called ATHENA answered natural language questions over relational databases with one hundred percent precision on two of its three domains and ninety-nine percent on the third.

I want to start there, because the number is the least interesting thing about it, and because the reason it is not a scandal that you have never heard of it turns out to be the substance of this episode.

This is episode two of Where Business Meaning Lives. Last time we established that the schema underdetermines the question, and that writing the missing meaning down as a document closes part of the gap, cheaply, and leaves a large residual. Today: what happens when instead of handing the model a document to read, you change what the model is asked to produce.

ATHENA came from Diptikalyan Saha and colleagues at IBM Research, published in the VLDB proceedings. The architecture is a two-stage translation. A question is first translated into a query over a domain ontology, in a language called OQL. Only then is the OQL query compiled down into SQL against whatever physical schema the data happens to live in. The ontology carries the business concepts and how they relate to each other. The mapping from those concepts to actual tables is a separate, maintained artifact.

The accuracy figures I opened with are precision, measured over the questions for which ATHENA produced any interpretation at all. Recall, over the whole workload, was around eighty-eight percent in each domain. That gap between the two numbers is not a rounding artifact. On the finance domain, ATHENA generated no interpretation whatsoever for eleven of one hundred and eight questions. It declined.

Which means that in two thousand sixteen there was a deployed natural language interface with refusal built into its architecture and visible in its published metrics, roughly a decade before the current literature gave that behavior a name. We will come back to that in episode three, because it turns out to be the single most consequential property of these systems and the one that accuracy tables are structurally incapable of showing.

The durable argument in ATHENA is physical independence rather than accuracy. An ontology query survives a schema migration. Denormalize a table for performance, split an entity in two, rename a column, and the ontology query is unchanged, because the mapping absorbed the change. That property, and not the score, is what an organization is actually buying when it builds a semantic layer, and it is essentially never what gets benchmarked.

Four years later, Jaydeep Sen and colleagues published ATHENA plus plus, which extended the approach to nested and aggregate queries. This matters because real business questions are overwhelmingly comparative. Revenue by segment against the prior period. Customers whose spend exceeds their cohort median. Those are nested queries, and the first generation of these systems handled them badly.

They also introduced a benchmark called FIBEN: three hundred natural language queries mapping to two hundred and thirty-seven distinct complex SQL queries, over a financial schema of one hundred and fifty-two tables, with an ontology derived from FIBO and FRO, which are real published financial ontologies rather than something constructed for the paper. ATHENA plus plus scored eighty-eight percent on FIBEN.

And then they ran it on the Spider development set, the neural parsing community's own benchmark, and got seventy-nine percent. The best reported development accuracy at the time was seventy point six.

A symbolic, ontology-mediated system, beating the neural leaderboard on the neural leaderboard's own benchmark, in twenty twenty. I went looking for the follow-up work re-running that comparison against a modern language model baseline. There is none. It is, as far as I can tell, the most under-cited result in this entire corpus, and reproducing it is one of the concrete open problems the map ends with.

Now, why did the field go the other way?

Partly because building an ontology is work, and the neural approach promised to skip it. But there is a more interesting technical answer, and it comes from a line of research that ran in parallel: intermediate representations for text-to-SQL.

The idea is the same in miniature. SQL is a bad target for a sequence model. It has ordering constraints that carry no meaning, mismatches between how questions are phrased and how clauses are structured, and syntax that varies by dialect. So instead of generating SQL, generate a simpler intermediate language and compile that to SQL. Jiaqi Guo and colleagues did this in twenty nineteen with SemQL, inside a system called IRNet. Yujian Gan and colleagues did it in twenty twenty-one with NatSQL, which strips out set operators and makes the representation closer in shape to the natural language.

Both reported gains. Both changed several things at once.

The experiment that isolates the variable is Jonathan Herzig and colleagues, twenty twenty-one. They held the model architecture completely fixed and varied only the intermediate representation the model was trained to generate. They compared designs along two axes: whether the mapping back to the original query is lossless, and how closely the representation's structure mirrors the structure of the natural language.

Fourteen point eight points of improvement on CFQ. Between fifteen and nineteen points on template splits of three text-to-SQL datasets. From changing the representation alone.

That is the result that makes representation a first-class variable in this literature rather than an implementation detail. And it establishes something we are going to lean on hard next episode: changing what the model is asked to generate, and constraining how it generates, are different interventions. The field calls both of them constraints. The evidence for them points in opposite directions.

There is a third strand here, and it is the most aggressive version of the same move. If SQL is the wrong target, why stop at a friendlier SQL?

Liana Patel and colleagues, in twenty twenty-four, proposed semantic operators: an extension of the relational algebra in which some operators are themselves model invocations. Filter by meaning. Rank by a described criterion. Because they are algebraic operators with defined semantics, a query plan can mix relational and semantic operations and then be optimized as a plan, rather than being a hand-tuned chain of prompts. Chunwei Liu and colleagues make a closely related argument with Palimpzest, presented at CIDR in twenty twenty-five: treat AI-powered analytics as declarative query processing and let an optimizer make the execution decisions. And this year, Yuxuan Dai and colleagues take the natural next step for our purposes, compiling natural language directly into semantic analytics pipelines rather than into SQL.

The through-line is that every one of these systems makes the model's output smaller and better typed. Not more capable. Smaller. The model emits an object with fewer degrees of freedom, and a compiler that the model does not control turns that object into something executable.

Before I go further I want to lay out the lineage, because these ideas keep getting collapsed into one and they are not one.

A database schema describes physical structure. Tables, columns, types, keys. It says where bytes live and nothing about what they mean.

An ontology describes a domain. Concepts and the relations between them, independent of any particular database. It is the layer ATHENA translates into.

Metadata and documentation attach descriptions to schema elements. Column comments, data dictionaries, dbt descriptions. It supplies knowledge without changing structure, which is why episode one's documentation results and this episode's representation results are measuring different things.

A conceptual model, in the older data modeling sense, sits between the two: entities and relationships that a business recognizes, mapped down onto physical tables.

Semantic parsing is the act of translating language into any formal meaning representation, of which SQL generation is one instance.

An intermediate representation is a formal target chosen because it is easier to generate than the eventual executable, and compiled afterward.

A metrics layer or semantic layer, in the modern BI sense, is a specific and narrower thing: named measures and dimensions with their computation defined once, and a query interface that composes them. It carries knowledge like documentation, has a structure like a conceptual model, and is executable like an intermediate representation.

And a governed analytical interface is a semantic layer plus the property that you cannot go around it.

Those are eight distinct things, and each one adds something the previous does not. The reason it matters to keep them apart is that the enterprise conversation uses one phrase, semantic layer, for all eight, and then argues about evidence drawn from different rows of that list.

So let me try to say precisely what representation adds over documentation, because collapsing the two is the most common error in how this whole area gets discussed.

Documentation supplies knowledge. It is text, it goes in the context window, and the model does whatever it does with it. Nothing checks that the model used it, nothing checks that it used it correctly, and nothing stops it from writing a query that contradicts the document it was just handed. It is advisory.

Representation changes the object. The model is no longer producing SQL, it is producing something in a language where certain mistakes are not expressible. If your representation has one node type for a metric, and the metric's definition lives in the compiler, then the model cannot emit a subtly wrong revenue calculation. It can emit the wrong metric, which is a different and more visible failure, but it cannot emit a plausible arithmetic error inside the right one.

Those are genuinely different mechanisms, and they have different failure modes, and this is exactly where the schema linking literature sits as well. RAT-SQL, RESDSQL, and more recently multi-path schema linking work like EviLink, are all attacking the problem of which tables and columns the question is even about. Schema linking is the retrieval step; representation is what you do once you have it. Systems that conflate them tend to report a single number that mixes both.

What the theme does not settle is the same shape of gap as last episode.

Every controlled result I have described holds representation as the variable while everything else stays fixed, but does it in a research setting on academic schemas. Every enterprise result comes from systems that changed representation, enforcement, retrieval and the surrounding harness all at once and reported the total. So the defensible position is that representation is measurably worth a lot in controlled settings that do not look like production, and is confounded with three other things in every setting that does.

Separating them is the experiment I am running, and I will describe its design next episode, because that is where it belongs.

One thing I want to flag before we go. The ontology in ATHENA was built by hand, and the FIBEN ontology was derived from published financial standards. That is a real cost, and it is the reason people reach for text-to-SQL instead. But there is a strand of work now on inferring semantic layers rather than authoring them. Bootstrapping a semantic layer from query execution logs. Learning the mapping from how people actually query the warehouse. If that works, the entire cost argument against representation changes, and the ATHENA line stops being a historical curiosity and becomes a live alternative.

Next episode: what happens when the model is not merely encouraged to respect business meaning but structurally prevented from bypassing it. A vendor benchmark that produces both the highest and the lowest number in this entire map, from the same eleven questions. And a two thousand twenty-six paper arguing that the whole question of when a system should decline has been posed wrong. That is episode three.
