---
title: "Enhancing Developer Productivity with Google Colab CLI and Agentic"
audioUrl: /media/digests/manual-enhancing-developer-productivity-with-google-colab-cli-and-agentic-observability.mp3
durationMin: 28.8
words: 5321
---

20 tasks, 27 million tokens each, on average. That's the size of the haystack a coding agent has to hold in its head to clear a single problem on SWE Marathon, a new benchmark that showed up this week, and it reframes most of what we argue about when we argue about coding agents. We spend a lot of breath on whether a model can land one clean edit. SWE Marathon is asking a different question.

Can it stay coherent across a change that takes the equivalent of reading a small library, without losing the thread halfway through? So that's where I want to start today, because almost everything else in this issue circles the same problem from a different side. This is the Code Intelligence Digest. I pulled together four things worth your time and a stack of links underneath them, and the through line is the gap between an agent that demos well and an agent that holds up over a long, messy, real piece of work.

That gap is the whole story of this stretch of the field. The demos have been solved for a while. What hasn't been solved is the second aspect of the problem. The second aspect of the problem is the fact that the agent has to remember a decision it made 20 stacks ago, and honor it.

Keep that tension in mind, because every item today is a different attempt to close it. I want to name the structure up front, because it'll make the rest hang together. There are four layers in play this week, and they stack. At the bottom is compute.

Can an agent get to the hardware it needs without a human in the loop, which is the Colab CLI story? Above that is environment. Can you put the agent somewhere its work is actually checkable, which is the environment? Can you put the agent somewhere its work is actually checkable, which is the environment?

Above that is measurement. Can you tell whether the agent held up over a long, realistic task, which is the SWE marathon story, and running through all of it is operation? Can the agent maintain accurate state over time instead of drifting, which is the observability story, and honestly, the deepest one? Compute, environment, measurement, operation.

Every link today slots into one of those, and the interesting thing is how much they've started to depend on each other. So let me take them roughly in that order. Let me give you an example of what's most immediately useful, which is Google's new Colab CLI. The pitch is simple.

Colab has always been a notebook in a browser. You click a cell, it runs on Google's hardware. The CLI takes that runtime and hands it to your terminal. You can request a high-powered GPU and write a script from the shell.

No notebook UI in the loop. If you've ever scripted an ML job and resented clicking through cells to babysit it, this is the part that matters. It turns the Colab GPU into something you can call from a makefile from a cron from an agent. And that last one is the quiet implication.

So let me sit on it. A terminal-shaped interface to Cloud GPU is exactly the surface a coding agent can drive. The notebook was built for a human reading output between cells. A human who pauses, scrolls up, reasons about a plot, edits the next cell.

The CLI is built for a process, and increasingly that process is going to be a model running scripts and reading back what happened. Think about what that unlocks. An agent that needs a GPU for a training run or an eval, no longer needs a human to provision one and paste results back. It can request the hardware, run the job, capture the output, and decide what to do next.

All inside its own loop. We've spent a year giving agents better access to code and to the shell. Giving them clean, scriptable access to accelerated compute is the same move applied to the most expensive resource in the stack. It's a small release with a large shadow.

Here's a concrete way to picture it. Say you've got an agent whose job is to tune a small model. Run an eval suite. Read the script, write the script, and read the metrics.

Adjust a hyperparameter, and go again. Today, that loop usually has a human in the middle, spinning up the instance, kicking off the run, copying the numbers back into the agent's context. Each of those handoffs is a place the loop stalls waiting on a person. With a scriptable GPU runtime, the agent owns the whole cycle, and it runs while you sleep.

That's the difference between a tool you operate and a tool that operates, and the gating factor was never the model's reasoning. It was whether it could reach the compute without a human relay. This release quietly removes one of those relays. I don't think Google framed it as an agent story, but that's the story.

com, and it's an argument rather than a release. Agentic observability is not a chatbot bolted on top of telemetry. The cheap version of this idea is a chatbox next to your dashboards that answers questions about your metrics. Ask it why latency spiked.

It summarizes a graph. That's fine. It's also not worth it. It's not worth much, because the bottleneck in incident response was never typing the query.

The version they're making the case for is a system that does the unglamorous work, automating asset management, and feeding cleaner data into root cause analysis and incident investigation. The interesting claim is about where the value lands, and it's worth being precise here. It's not the natural language query. It's the reconciliation.

Half of incident response is figuring out what's actually deployed versus what you think is deployed. That mismatch is where the minutes bleed out at 3 in the morning. You're staring at a dashboard that describes a system that no longer exists, chasing a root cause in a topology that drifted two deploys ago. If an agent keeps that picture current, continuously, and hands the investigation a clean inventory of what is genuinely running and how it's wired, you've removed a category of manual triage that nobody enjoys and everybody does.

The chatbot is the demo, the asset graph underneath, kept honest by something that never gets tired or distracted, is the product. And notice the pattern. Because it'll repeat today, the value isn't in the flashy conversational layer. It's in the patient maintenance of accurate state.

That's a theme. Agents earn their keep on the boring, continuous work, not the dramatic one-shot answer. Back to SWE Marathon, because it deserves more than the headline number. The benchmark covers 20 tasks, and the design is the whole point.

The scale, those 27 million tokens per task on average, isn't there to be impressive. It's there to test endurance. A short benchmark rewards a model that makes one good decision. A long horizon benchmark punishes a model that makes one good decision, and then drifts, because over a multi-million token task, there are hundreds of decisions, and the errors compound.

Let me make that compounding concrete, because it's the crux. Say an agent is right 99% of the time on any single step. That sounds excellent. Now string 200 steps together, each one of them is a good example of how to do it.

So let's do it. Let's do it. Let's do it. Let's do it.

Let's do it. Let's do it. Let's do it. Let's do it.

Each depending on the last staying correct, and your odds of a clean run fall off a cliff, because reliability multiplies. It doesn't average. 99% per step across 200 dependent steps is a coin flip on the whole task. One subtle wrong turn early, a misread of how a module is structured, a wrong assumption about a function's contract, and everything built on top of it inherits the mistake.

The agent doesn't know it's wrong, so it keeps going, confidently, building more on a cracked foundation. And this is the failure mode anyone who's actually run an agent on a big task has watched happen. It starts strong, the first few steps look great, and then somewhere in the middle, it quietly loses the plot, forgets a constraint it established an hour ago, reintroduces a bug it already fixed, and by the end, you're staring at a confident, coherent looking, wrong result. The short benchmarks never catch that, because they end before the drift sets in.

The short benchmarks never catch that, because they end before the drift sets in, That's the whole indictment, and it's why a benchmark built to run long is measuring something the leaderboards we've trusted simply can't see. What SWE Marathon is really probing is whether an agent can keep a complex change consistent with itself, from the first file it touches, to the last test it runs. That's a memory problem, a planning problem, and a context management problem stacked together. It's much closer to what shipping a feature actually feels like than the tidy single function benchmarks we've been grading on.

And I suspect the rankings on it will look different from the rankings we're used to, because the skills it rewards are different. Stamina and self-consistency, not cleverness in the small. Which sets up the fourth headline item, MN's Agent, because it goes after the thing that makes long-horizon evaluation trustworthy in the first place, a verifiable environment. The dirty secret of software engineering benchmarks is that they're starved for environments you can actually check against.

You need a repository that builds, a test suite that runs, a way to confirm the agent's change did what it claimed across more than one language. Building those by hand is slow and expensive, which is why good benchmarks are scarce, and why so many results don't replicate. MN's Agent generates polyglot environments for exactly that. Environments an agent can be checked against, rather than graded on vibes.

6% increase in success rate, alongside a 43% drop in cost. Sit with the story. The second number for a second, because it's the one that actually changes behavior. Checkable environment is what makes every other number in this issue worth trusting, because a result you can't reproduce in a clean environment is a press release, not a finding.

The success rate is the headline. The cost cut is the enabler, because evaluation you can only afford to run once is barely evaluation. You need to run it across many models, many configurations, many seeds, and watch whether the result holds. Drop the score.

The cost cut is the enabler, and the cost cut is the enabler. The cost cut is the enabler, and the cost cut is the enabler. And if you run it across multiple models, you can manage to run it by a thousand times, and if you run it across two, you can manage to run it by a thousand times. The polyglot part deserves a B2, because it's not decoration.

Most benchmark environments are single language, usually python. And an agent that looks great on python can fall apart the moment it's asked to reason about a go service calling a typescript front end, calling a rust library. Real software is polyglot. The seams between languages are where the hard bugs live, and an evaluation that only ever tests one language is quietly deliciously useless.

And you've got a just-reviewed example of a polyglot that's a hard bug to beat. is quietly measuring the easy case. Generating environments across languages means you're testing the agent where actual systems break, not where they're tidy. Put that together with the cost cut and you've got the thing the field has been short on, a way to check agents on realistic multi-language work, often enough and cheaply enough to trust the answer.

That's the unblammerous infrastructure everything else stands on. And it's the same lesson as the observability piece in a different outfit. The durable value is in the boring scaffolding. The environments and the inventories, not the demo on top.

I keep coming back to that because it's the least Twitter-friendly idea in the field and one of the most important. The breakthroughs people remember are the models, but the breakthroughs that compound are the harnesses that let you measure them honestly. Those four are the spine. Let me walk the rest because the research underneath fills in the same picture from more angles.

Codetaste asks whether language models can generate human-level code refactorings, and it's a sharper question than it sounds. Writing new code is one skill. Restructuring existing code the way an experienced engineer would, that's a different muscle. And it's where agents tend to reveal their limits at managing complexity.

Refactoring isn't about making code that works. The code already works. That's the premise. It's about making code that's better by some human standard.

More readable, better factored, easier to extend, and that standard lives in taste, not in a test suite. A refactor can pass every test and still be the wrong refactor. The paper is essentially testing whether a model knows not just what works, but what a human would have done. And that distinction is going to matter more fast as agents move from greenfield scripts into maintaining code other people wrote and will have to keep reading.

Customer agent tackles the long context problem from the consumer side. Ultra-long shopping trajectories, the kind of record where a customer has hundreds of interactions stretching back months. Standard models choke on that history. The relevant signal is buried in noise and the window won't hold all of it anyway.

The approach pairs tool-augmented agents with reinforcement learning from verifiable rewards to keep the relevant past in reach without drowning in it. This is the same context selection problem SWE Marathon exposes, just wearing a retail hat instead of a software one. The agent has more history than it can use, and the skill that matters is choosing what to pull forward and what to leave behind. Whether the long record is a customer's purchase history or a code basis structure, the core competence is the same, deciding what's relevant now.

That problem keeps showing up under different names, which is usually a sign it's fundamental. SIGA is the one-eyed flag for anyone near scientific computing. It's a self-evolving coding agent adapter for scientific simulation, and the payoff is concrete. It cuts the time scientists spend setting up simulations, and it adapts across different simulators instead of being welded to one.

That portability is the part that's easy to undersell. Most research code is a one-off, bound to a synchronization, single tool, written once and abandoned. And the setup tax on scientific simulation is enormous, often a bigger time sink than the science. An adapter that carries an agent's competence from one simulator to the next is the difference between a clever demo and something a lab actually adopts, because labs run many tools and can't afford a bespoke agent for each.

Self-evolving is the other half. The adapter improves as it goes, rather than freezing at its first competence, which is exactly what you want for a tool meant to live in a working environment and not a paper. And step back across those three research items for a second, because they rhyme. Code taste is about whether an agent has the judgment to restructure code the way a human would.

Customer agent is about whether an agent can pick the relevant slice out of an enormous history. SIGA is about whether an agent's competence transfers from one tool to the next. Judgment, selection, transfer. Those are the three things that separate an agent that can do a narrow task from an agent you'd actually hand a real job.

We've mostly solved can it produce something. These papers are all chipping at the harder question. Can it produce the right something in the right context somewhere it hasn't been trained? That's the frontier that matters for anyone trying to use these things in earnest, and it's quietly where a lot of the good research has moved.

Now the tooling and the articles, which is where the weak got practical. Simon Willison wrote up running Python in a sandbox with MicroPython compiled to WebAssembly. The problem is old and nasty. You want to let users bring Python plugins, but executing arbitrary Python is a security hole the size of a barn.

Anything the user's code can reach, it can abuse. Compiling MicroPython to Wasm lets you run that code inside a controlled environment, isolated from the host, with the boundaries WebAssembly gives you, and it works in constrained places where a full interpreter won't fit. For anyone building a product that runs user code, and a lot of agent products quietly do, because letting the model or the user supply a snippet to execute is half the appeal. This is a pattern worth stealing.

The agent that writes and runs code is powerful, and it is also a sandboxing problem you cannot wave away. And a Wasm-isolated interpreter is one of the cleaner answers going. Simon also covered Microsoft's new MAI models, and the angle there is cost. These are positioned as cost-effective options for coding and reasoning, which keeps the pressure on at the cheaper end of the market.

The story this year isn't only the frontier getting smaller, but it's also getting smarter. It's the floor getting better and cheaper. And that floor is where most production agent traffic actually lives. When your agent calls a model 50 times to close one task, the per-call price isn't a rounding error.

It's the budget. A capable, cheap model changes which workloads are economically viable, and it changes them quietly, without a frontier headline, which is why the floor moving up is one of the most consequential and least discussed trends in the space. On the same theme, there's a piece on using local LLMs for agentic coding, about a 26-minute read, making the case that running models locally answers two things cloud models can't always give you, speed and privacy. You don't pay the round-trip latency on every call, which in a tight agentic loop, adds up to real wall clock time, and your code never leaves the machine, which for a lot of teams is the difference between being allowed to use these tools and not.

For an agentic coding loop, where the model is called dozens of times in a cycle, local inference changes the economics and the threat model at once. It's not the right answer for everything. The biggest models still live in the cloud, but the gap between what runs on your own hardware and what you actually need for a coding loop is closing, and that's worth tracking. From Google Research, there's a write-up on Gemini Enterprise Agent Platform's Agentic RAG, aimed squarely at the enterprise reliability problem.

How do you get dependable answers out of an agent, when the stakes are real, and a confident wrong answer carries a cost? The framing is retrieval as a reliability mechanism, not just a recall mechanism, grounding the agent so its answers hold up to scrutiny, rather than just sounding plausible. That's the right framing for the enterprise, where the failure mode that kills adoption isn't the agent that says I don't know, it's the agent that says something wrong with total confidence and gets believed. And InfoQ ran a presentation on choosing your AI co-pilot and maximizing developer productivity, which is less about any one tool and more about the discipline of using them, balancing the speed an assistant gives you against the code quality you remain responsible for.

That tension, velocity versus quality, is the one every team adopting these tools is negotiating right now, whether they've named it or not. The co-pilot makes you faster at producing code, and someone still has to own whether that code should exist and whether it's any good. Pull the camera back for a moment, because there was a cluster of bigger picture commentary this week worth registering, mostly from the AI Daily Brief. One episode walked through what open AI and anthropic think happens next with AI, and the value there isn't prediction, it's reading the lab zone framing of where this goes, because their assumptions about governance and development shape what gets built, and what gets restricted.

When the people setting the frontier tell you how they think the next phase plays out, that's not a forecast to bet on, it's a map of the constraints the rest of us will be building inside. Worth listening to the way you'd read a regulator's draft, not a horoscope. A second episode made a sharp little argument, there are more than 10 things you should build with AI instead of sending files. The premise is that the default knowledge work motion, attach a static document, email it, wait, is a bad fit for what these tools now make cheap.

Instead of shipping a frozen file, you build a small interactive thing, something the recipient can query, adjust, explore. It's a reframing of the unit of collaboration, from the document as artifact, to the document as a live surface, and it lands on the same nerve as the Obsidian SQL PC, which is what I'll get to. The static blob of text is giving way to something you can interrogate. For anyone whose job is producing reports and decks, that's a real shift in what good output even looks like.

And a third, titled simply How We Use AI is Changing, sat with the uncomfortable part. The shift toward more advanced AI use can create unequal benefits, widening the gap between people and organizations who invest in the capability and those who don't. The optimistic read is that investing in AI capability compounds into a real competitive edge. The honest read is that the gap is a gap, and it's opening.

That's worth holding next to everything else in this issue, because all the tooling we've talked about, the agents, the benchmarks, the cheaper models, accrues fastest to the people already positioned to use it well. The technology diffuses, but not evenly and not automatically. Then there's the community signal, which this week was unusually good, because it's where people say the quiet parts out loud, ahead of the papers and the product pages. There's a show HN with a title I love, I Nerfed Our Coding Agents On Purpose.

The tool, NerfGuard, deliberately constrains how agents use models to save cost, and the author argues improved productivity. It's the inverse of the usual pitch. Everyone's selling you a bigger model, more context, more capability. This is someone arguing that capping the agent, giving it less, produced better and cheaper outcomes, because an unconstrained agent burns tokens exploring when it should be deciding, wanders when it should commit.

That matches something a lot of people have felt, and few have shipped a tool around. More capability handed to an agent, without guardrails, often produces more flailing, not more progress. Constraint as a feature, it runs against the grain, and the grain has been wrong about this often enough that I take the contrarian seriously. In the same spirit, swyx reshared a talk on getting coding agents to actually use a tool, in this case Langfuse, and the framing was that it turned out to be a quote, skill issue, literally.

Mark Klingin from ClickHouse talks through teaching agents to use new tools, and why it's harder than you'd expect. The lesson generalizes well beyond Langfuse. Handing an agent a tool isn't the same as the agent knowing when and how to reach for it. You can put a tool in the agent's hands and watch it never pick it up, or pick it up at the wrong moment, or use it clumsily.

Closing that gap is a training and design problem, not a documentation problem, and it's one of the underrated frictions in actually deploying these systems. The integration is the easy part. Teaching the judgment of when to use what is the work. Amjad Masad introduced VyBench, the first benchmark for app creation based on real-world tasks, and the finding had teeth.

8 stayed ahead on both price and performance. That split is the entire argument for application-level benchmarks. The model that tops a code benchmark isn't automatically the model that ships the best app, because shipping an app is a long-horizon, multi-step, judgment-heavy task, and a benchmark of isolated coding problems doesn't capture it. And look where that lands us.

Right back at SWE Marathon. Right back at endurance over a long task. Versus brilliance on a short one. VyBench is measuring the same quality from the product side that SWE Marathon measures from the engineering side.

And they're both telling you the leaderboard you trust depends entirely on whether you're grading the sprint or the marathon. And there's KeenCode, a context-aware CLI coding agent that was, fittingly, built by coding agents. The pitch is maintaining context across a development session. The same thread-holding problem SWE Marathon measures.

It's a tool you can actually run rather than a paper you can read. The recursion is a little on the nose. Agents building the tools that make agents better at the thing agents are bad at. But it's also genuinely where a lot of this tooling is coming from now.

The last cluster is about knowledge bases and what counts as evidence. Motherduck wrote up letting your Obsidian Vault run SQL so an agent can query it. Roughly a five-minute read. Turning a pile of notes into something queryable with SQL changes what an agent can do with your knowledge.

Moving it from fuzzy semantic retrieval which is great until you need a precise answer to exact lookups over structured data. The two together, fuzzy recall plus precise query is a more capable shape for a knowledge base than either alone. There's a companion piece on building a multimodal AI knowledge base with Gemini Embedding 2 extending that idea past text into images and other data types which is clearly where personal and team knowledge bases are headed. Not a text index, but a queryable store of everything you've collected in whatever form it came in.

And to close the loop on evidence, Ardell ran an issue about a seven-minute read asking which popular beliefs about generative AI and software engineering actually hold up to research. It's a useful corrective and an overdue one because a lot of what we repeat about these tools is folklore that hasn't been checked. Claims that sound right and propagate because nobody stopped to test them. An agentic coding practice built on folklore is how you end up surprised in production, confidently doing the thing everyone says works that turns out, when someone finally measures it, not to.

Checking the beliefs is the same discipline as building verifiable environments. It's all evidence over vibes. Before I pull this together, let me make it personal, because a digest is only worth the time if it changes something on Monday. If you're running a coding agent on real work right now, the theme of this issue has a few direct consequences for how you set it up.

First, stop trusting short-task leaderboards as a proxy for whether an agent will survive your codebase. The VI bench and SWE marathon results both say the same thing from opposite ends. The model that wins the sprint may not win the marathon. So if your work is long horizon, and most real work is, weight your model choice toward the ones that hold context, not the ones that top a single edit chart.

Second, treat the agent's environment as a first class part of the system. The VI agent lesson isn't only for benchmark authors. If you can't cheaply and reliably check what your agent produced in a clean build with a real test run, you don't actually know if it's working. You're grading on vibes, and vibes don't survive contact with production.

Invest in the checkable environment before you invest in the fancier model. Third, and this is the nerf guard point, more isn't automatically better. Before you reach for a bigger model or a larger context window, ask whether your agent is flailing for lack of capability or flailing for lack of constraint. A surprising amount of the time, it's the second, and the fix is to give it less room to wander, not more.

And fourth, mind the tool use gap from the Langfuse talk. If you've handed your agent a tool and it isn't using it well, the problem usually isn't the integration, it's that the agent doesn't have the judgment yet for when to reach for it. That's something you shape with how you prompt and scaffold, not something you fix by writing more docs the agent won't read at the right moment. So pull back and look at the shape of the week.

A terminal interface to cloud GPUs that an agent can drive. An observability argument that the value is in the boring reconciliation, not the chat box. A benchmark that measures endurance over 27 million tokens instead of a single edit. A method that makes evaluation cheap and checkable enough to trust.

And underneath, a research and community current all pointing the same way. The hard part was never the clever one shot. It was holding a complex piece of work together over a long horizon, in an environment you can verify, at a cost you can afford to run twice. The question I'd carry into next week is which of these compounds, because they're not independent.

Cheaper verifiable environments make long horizon benchmarks practical to run. Long horizon benchmarks expose which agents actually hold context, instead of just demoing well. Better context handling is what makes an agent worth pointing at a real repository instead of a toy. And scriptable infrastructure, the Colab CLIs of the world, is what lets an agent act on all of it without a human in the loop relaying results.

Each piece makes the next one cheaper to attempt. Watch whether that loop tightens over the next few months, because the day it does, is the day these tools stop being assistants you supervise line by line, and start being colleagues you delegate a whole task to, and check on later. Because that's where you'll see it first. Compute getting scriptable, so agents reach hardware on their own.

Environments getting cheap and verifiable, so their work is checkable by default. Measurement getting long horizon, so we stop overrating the ones that only sprint. And operation getting genuinely autonomous, agents holding accurate state, instead of drifting. The progress that matters won't announce itself as a single model launch.

It'll show up as those four quietly clicking together, until one day, you realize you handed an agent something real on Friday, and it was done, correctly, when you looked Monday. The lab's own commentary this week, the bigger picture stuff, was circling the same intuition from the policy side. And the unequal benefits warning is the shadow it casts. This capability is arriving, it's arriving unevenly, and the gap goes to whoever learns to use it well first.

We're not at the colleague stage wet. But nothing in this issue is a dead end, and they're starting to reinforce each other. Which is exactly what the early phase of something compounding looks like. That's it for this issue.

Go tag the things you want to remember, and I'll see you in the next one.
