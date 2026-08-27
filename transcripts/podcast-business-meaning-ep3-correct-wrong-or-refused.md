---
title: "Correct, Wrong, or Refused"
audioUrl: /media/podcasts/podcast-business-meaning-ep3-correct-wrong-or-refused.mp3
durationMin: 16.5
words: 2272
---

The same experiment, run this year, on the same eleven questions, against the same fifteen-table schema, produced both the highest number in this entire literature map and the lowest. One hundred percent, and zero percent.

Nothing went wrong in that experiment. It is the most informative single result in the corpus, and unpacking why is this episode.

Welcome back to Where Business Meaning Lives, episode three. We have established that the schema underdetermines the question, that a document closes part of that gap, and that changing what the model generates closes a different part. Today we cross the line from advice to enforcement: systems where the model is not encouraged to respect business meaning but structurally prevented from bypassing it. And then, immediately, the price of that.

Start with the mechanism everyone reaches for first, which is constraining the decoder.

PICARD, from Torsten Scholak, Nathan Schucher and Dzmitry Bahdanau in twenty twenty-one, is the reference implementation. At every decoding step, an incremental parser checks the candidate next tokens and rejects any continuation that cannot extend into a parseable, schema-valid SQL query. It needs no change to the underlying model. You attach it to a pre-trained parser and invalid output stops appearing. Synchromesh, from Gabriel Poesia and colleagues, does a related thing with a different mechanism. This family of work established constrained decoding as the standard answer to a model that produces syntactically broken or schema-violating queries.

Now the counter-evidence, from this year, and it is specific.

Tuan Dang and colleagues show that enforcing constraints by masking next tokens produces biased sampling. The argument is clean once stated. Masking at each step is a myopic approximation of conditioning on the constraint over the entire sequence. Those two are not the same operation. Greedily forbidding a token now because it cannot lead to a valid string changes the distribution over the strings that remain, in a way that does not correspond to the model's own conditional distribution given the constraint. They characterize the bias, propose tensorized finite automata as global proposal distributions inside a sequential Monte Carlo sampler, and evaluate on function calling, keyword-based generation, and SQL.

On SQL generation, masking degrades performance relative to the corrected sampler.

So put that next to episode two. Herzig and colleagues: changing the target language, fifteen to nineteen points better. Dang and colleagues: masking tokens during decoding, measurably worse. Both of these are filed in the literature under "constraints help text-to-SQL."

They are opposite interventions. Changing the target language changes what the model is asked to produce, and the model generates freely inside that smaller space. Masking leaves the task unchanged and edits the sampling process from outside. One is a redesign of the problem, the other is a filter on the solution. Calling them by the same word is how a field ends up with a literature that appears to contradict itself.

Now to the strongest form of enforcement, which is architectural rather than a decoding trick. The model does not write the query at all. It calls an interface, and something else writes the query.

The dbt Labs semantic layer benchmark, published this April by Jason Ganz and Benoit Perigaud, is the clearest public measurement of this. Eleven questions, twenty repetitions each, over a fifteen-table insurance schema in third normal form. Two frontier models. Both conditions run against the same modeled data. The only difference is whether the model queries through the semantic layer's API or writes SQL against the tables.

Through the semantic layer: ninety-eight percent for one model, one hundred percent for the other. Writing SQL against the same data: ninety percent and eighty-four percent. They also report the same question set run each year from twenty twenty-three to twenty twenty-six, and both approaches improved substantially over that window, text-to-SQL from thirty-three percent to sixty-five and the semantic layer from sixty-one to seventy-three. Which is worth noticing on its own: the gap narrowed as models improved. It did not close.

Now the other half of the same experiment. On questions that fall outside what the semantic layer models, the semantic layer scores zero percent. Text-to-SQL scores seventy percent and one hundred percent on those same questions.

Zero. Not seventy, not thirty. Zero, because the layer returns an error rather than a number.

I want to be careful about how much weight this can hold. It is a vendor benchmark. Eleven questions, one schema, run by the company that sells the semantic layer. That is the size of the evidence base underneath what is currently the loudest architectural claim in enterprise analytics, and anyone citing the ninety-eight percent should also be citing the eleven.

But the shape of the result does not depend on the sample size, and the shape is the finding. The same design produced the best and worst numbers in this map. Which means the two numbers are measuring different things rather than one thing well and one thing badly.

The resolution is not a compromise between the two numbers, and it starts with what the column they share is doing.

An accuracy column silently merges two populations: questions the system answers, and questions it does not. When a text-to-SQL system meets a question it cannot handle, it writes a query anyway, and that query returns a number, and the number is wrong, and nothing about the output announces this. When a governed semantic layer meets the same question, it fails to resolve it and says so.

So the semantic layer's zero percent and the text-to-SQL system's seventy percent describe genuinely different behaviors. In one, seven of ten answers are right and three are confidently wrong and indistinguishable. In the other, ten of ten are refusals. Which of those you want depends entirely on what happens downstream, and no single number can express the choice.

The fix is embarrassingly simple and almost nobody does it. Report three numbers. Correct, wrong, refused.

This is where the two abstention literatures meet, and they are worth separating carefully, because they are solving different problems with the same word.

One is statistical. Generate a candidate answer, estimate the probability that it is right, decline below a threshold. There is real work here: adaptive abstention for text-to-SQL, confidence estimation for SQL generation, calibrated confidence for tabular question answering, and Adithya Bhaskar and colleagues' benchmark for text-to-SQL under ambiguity, which addresses the related case where the question genuinely has more than one reading. All of these produce a candidate and then decide whether to trust it.

The other is structural, and Zhelun Wu named it this year in a paper about systems whose outputs are consumed as fact. The architecture is a trusted deterministic kernel wrapped in a generative shell, holding one invariant: a component that can fabricate may influence which question the system answers, never which value it returns. The unanswerable request is not declined, it is unrepresentable.

The paper reports no datasets and no accuracy metrics, and states that plainly. It is a design argument backed by a two-year production case study, and it should be read as one.

But the distinction it draws is the useful thing. A structurally abstaining system needs no confidence estimate, because there is nothing to be confident about. It also cannot be miscalibrated, which sounds like an unalloyed win and is not, because it names the failure mode too: such a system can be silently wrong about its own scope. It will confidently refuse a question it could have answered, and confidently answer a question whose modeling is subtly stale, and in neither case does anything in the architecture notice.

And the idea is much older than either of them. In two thousand three, at the Intelligent User Interfaces conference, Ana-Maria Popescu, Oren Etzioni and Henry Kautz published a system called PRECISE with a theorem attached. Given a lexicon and an attachment function, PRECISE is sound and complete for any question in a class they defined and called semantically tractable, and given any question it can decide which side of that line the question falls on. Outside the class it does not guess. It asks for a paraphrase.

They then measured how big the class actually is on Ray Mooney's question sets. Ninety-seven percent of the restaurant questions, eighty-eight percent of the jobs questions, seventy-seven and a half percent of the geography questions. And inside the class, on all three databases, PRECISE made no mistakes at all. The queries it produced matched the hand-written ones.

Read what they say about the questions it rejects, because the reason is never that the sentence was hard. A word was not in the lexicon. Or the query needed a function the system did not implement. Or, in their own example, the database stores population density for states and not for cities, so a question about the population density of major cities is unanswerable rather than hard. That is the schema underdetermining the question, from episode one, diagnosed formally, twenty-three years ago.

Eleven years later, Fei Li and H. V. Jagadish built NaLIR and measured the thing that makes all of this matter. NaLIR puts a query tree between the parse and the SQL, and shows it to the user to confirm before running anything, on the argument that a person can check a query tree and cannot check a SQL statement. Their user study had fourteen participants on the Microsoft Academic Search database. With the verification step, participants completed eighty-eight of ninety-eight query tasks. Without it, there were thirty-two failures, and the participants noticed seven of them. Twenty-five wrong answers were accepted as correct by the person who asked the question, and the paper says the undetected ones were mostly aggregates, which you cannot check by looking at the number.

That is the number to carry out of this episode. The failure mode is a wrong query whose answer looks fine.

And notice that ATHENA, from episode two, was doing exactly this in two thousand sixteen. Eleven of one hundred and eight finance questions with no interpretation generated. That is structural abstention, measured and published, a decade before the framing existed.

Which brings me to my own experiment, and to why I am building it this way.

Every result in these three episodes changes more than one thing at a time. Documentation studies change what the model knows. Representation studies change what it emits. Enforcement studies change knowledge, representation and the harness simultaneously, and compare the total against raw SQL. So when someone asks where reliability comes from, the literature cannot currently say, because no published study separates those variables.

The design is four conditions over one sealed set of questions from the LiveSQLBench release we measured in episode one. First, raw schema, model writes SQL. Second, the same schema plus that hierarchical knowledge base made searchable as text. Third, the same knowledge expressed as a structured semantic model. Fourth, that same model queried through a production governed interface the agent cannot bypass.

One to two isolates knowledge. Two to three isolates representation with the knowledge held fixed. Three to four isolates enforcement with the representation held fixed.

There are no results. The experiment ledger is empty as I record this. What exists is a preregistered design, a sealed hold-out of one hundred and one questions scored once, a development set with a metered checkpoint budget, and a set of measurements of the benchmark artifact itself. I would rather tell you what has been designed and measured than imply an outcome, and I will say now that the design has a known confound: the governed condition and the semantic-model condition may not run identical models, and that is preregistered as a limitation rather than discovered afterward.

There is one more disagreement in this theme worth naming, because it decides whether any of this is practical.

One camp says you author the model up front. Define your entities, your measures and your conventions, and the questions you can answer follow from what you built. That is ATHENA in two thousand sixteen and it is the dbt benchmark this year: eleven questions, all of them modeled, ninety-eight percent.

The other camp says a semantic model is never finished. Business questions arrive faster than anyone models them, so the modeled surface is permanently behind the question stream, and the zero percent on unmodeled questions is not an edge case, it is the steady state.

Both of those are reported by practitioners with real deployments, so what is the experimental difference? I think it is whether the domain's conventions were ever written down in the first place. Finance and insurance have decades of regulated, documented definitions, and FIBEN's ontology came from published financial standards rather than from the authors' heads. In a domain like that, authoring the model is transcription. In a domain where the conventions live in six people's heads and change quarterly, the same task is elicitation, and elicitation does not converge.

Which suggests the measurement nobody has published: the coverage curve. Answerable question share as a function of modeling effort, for a fixed workload. The dbt benchmark reports a single point on it, that adding three models made all eleven questions answerable. The curve is what an organization actually needs to decide whether to build the thing at all, and it does not exist for any dataset.

Next episode, we take the whole question apart from a different angle. Because in every one of these systems there is a scaffold deciding what the model sees, when it retries, and what tools it can call, and two careful studies published this year disagree about whether that scaffold matters at all. That is episode four.
