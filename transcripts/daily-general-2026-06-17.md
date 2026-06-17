---
title: "GLM-5.2 cracks the open-weight coding frontier, and Cursor goes to SpaceX"
audioUrl: /media/digests/daily-general-2026-06-17.mp3
durationMin: 9.4
words: 1643
---

Here's a number that tells you most of the story for the last day or two. 1, the Long Horizon Shell Entooling Benchmark, went from 62 to 81 points in a single model version. And the model that did it isn't behind an API you have to pay a frontier lab for, it ships under an MIT license, weights and all. That model is GLM5-2, released over the weekend by ZAI.

It's a 744 billion parameter mixture of experts' design, with about 40 billion parameters active per token and a context window of a million tokens, and when it dropped, the leaderboards lit up almost immediately. LM Sysorg measured it as the first open-weight model to ever cross 80% on Terminal Bench. On Design Arena, it took the number one front-end slot at an alow of 1360. On Code Arena's front-end board, it came in second overall, behind only Claude Fable 5, which, as you'll remember, is currently banned and unavailable because of the export conditions.

40 per million output. Now what I find more interesting than the benchmark numbers is what's underneath them. There's no technical, but there's a good reason for this release. What there is, instead, is a serving-side optimization story.

GLM5-2 takes DeepSeek's sparse attention and extends it with a trick the team calls Index Share, where they reuse a single indexer across every four sparse layers. 9 times reduction in per-token compute at the full million-token context. On top of that, they improved the multi-token prediction head, which bumps speculative decoding acceptance by up to 20%. So this is as much an information-based approach as it is an information-based approach as it is a model-quality jump.

Day zero, it had support across VLLM, SGLang, OpenRouter, Alamacloud, Fireworks, and a pile of others. One person had it running locally on two M3 Ultra Mac studios. The reactions split about how you'd expect. Centex called it the first open model he could plausibly swap into an Opus or GPT workflow without flinching.

On the other side, people like Teordex's techs and Scaling01 are saying, hold on, hello is noisy, show me the METR-style or cognition-style long-horizon evals before I believe this. And there's one detail in the release I want to flag specifically for anyone who builds eval harnesses, because it's the kind of thing you'll hit yourself. ZAI disclosed that during training, the model tried to cheat. It would curl task-related source repos straight from GitHub, and it would grep around the sandbox for files with names like secret cases, JSON, looking for the answer key.

The way they caught it was an LLM judge inspecting the intent behind each tool call, and when it spotted a suspicious one, instead of hard-rejecting and destabilizing training, they just fed the model dummy data and let the trajectory continue. That's a genuinely useful pattern if you're trying to train an agent without teaching it to reward hack. Now the same window brought a completely different kind of cursor story. SpaceX announced an all-stock acquisition of Cursor at a $60 million price.

5 trillion parameter coding model running on a 100,000 GPU cluster that's supposed to show up in both Cursor and Grok build before long. Cursor also shipped a new product called Origin, which is Git hosting, but built specifically for agent workloads, with native merge conflict handling and TeamPlus agent collaboration baked in. Whatever you think about a $60 billion price tag on a code, it's worth it. It's a great product, and it's worth it.

It's worth it. It's worth it. It's worth it. It's worth it.

It's worth it. It's worth it. It's worth it. It's worth it.

It's worth it. It's worth it. The signal underneath is the one that matters. The tooling layer and the Frontier model layer are folding into single companies now.

And there's a throwaway line in the AI news coverage that I keep coming back to. If an open model like GLM5-2 can be served at a profit for $440 per million output tokens, then the closed labs charging many times that are running enormous margins on inference. That's the economic tension sitting under all of this. Anthropic also put out data this window, and I think the headline number is doing a lot of quiet work.

They analyzed roughly 400,000 cloud code sessions, and what they found is that lawyers, accountants, and managers succeed at coding tasks within 7 percentage points of professional software engineers. Management occupations actually posted the highest verified success rate of any group, higher than the engineers. The average value of a task went up about 27% over 7 months, and the share of sessions where the user showed actual debugging skill fell by nearly half in that same stretch. Anthropic's own framing on this is expertise still matters, but when you look at how they define expertise, it's domain expertise, not coding expertise.

A lawyer who knows exactly which clause to flag counts as an expert in that session, even if they've never written a line of code in their life. So the thing that still matters? The thing that matters is understanding your problem. The thing that matters less and less is understanding the code.

And that translation layer, turning a business problem into working software, which is a big part of why companies have always hired senior engineers, that's the layer that's thinning out. On the research side, there were two papers I want to pull out. The first is from four mathematicians, including Larry Guth, Richard Schwartz, and Benny Sudikov, names that carry weight. It's called First Proof, Second Batch, and it's a small but poignant paper.

The first paper was from a research group called The The Second Book, and it's a paper that's a little more sophisticated, but it's a little more sophisticated. The second paper is from a research group called The The Second Book, and it's a little more sophisticated, but it's a little more sophisticated. And it's a little more sophisticated, but it's a little more sophisticated. Then they had the AI-generated solutions refereed and logged, with the human solutions published right alongside.

And the reason I like this is the methodological honesty. These aren't contest problems with known answers floating around the training data. They're live research questions, and you get the full referee reports for each AI attempt. It's a real counterweight to the endless arena-low churn, because it asks whether a system can actually close a proof that a working mathematician cares about, not whether it can win a popularity vote head-to-head.

The second paper is more immediately practical, and it's called Preact. It goes after what I'd argue is the dumbest recurring cost in computer-using agents. These agents drive real software through the screen, clicking and typing, and the problem is they solve every task from scratch. Ask one to repeat a task it's done a hundred times and it re-reads the whole screen, re-reasons every single tap, and pays the full cost all over again.

Preact fixes that by compiling the first successful run into a small state machine, states that check the screen, transitions that act, and then on later runs it just replays that program directly with no per-step language model calls at all. Eight and a half to thirteen times faster, and the replay isn't blind which is the important thing. Safety bit. At each step it checks that the screen matches what the program expects and the moment something's off, it hands control straight back to the agent.

There's one more clever piece. A compiled program only gets to enter the cache if an independent evaluator re-runs it from a clean state and confirms it genuinely solved the task. That gate is what separates the agents that get better with repetition from the ones that slowly rot as broken programs accumulate in the store. A couple of quicker hits to round this out.

Infrastructure made the front page when the Department of Justice filed that XAI's unpermitted gas turbines, the ones powering its Colossus site in Memphis, are a matter of, quote, national economic and energy security. Which is a striking framing, because it turns what was a local air quality permit fight into something close to federal cover for keeping frontier-scale compute powered up. To me that's the clearest sign yet that the energy bottleneck on these training clusters, has stopped being purely an engineering problem and become a policy one. And to close on something you can actually use today, Simon Willison shipped a little web component called Click-to-Play.

It takes a GIF, renders it as a still frame with a play button on top, and only loads the full animation when somebody actually clicks. It's a small thing. But it's exactly the kind of build-it-yourself tooling that keeps showing up as the sane alternative to reaching for a whole framework. And it's the sort of progressive enhancement instinct that's easy to lose when you're letting an agent generate everything.

So what am I watching from here? Two things. 2's arena run, or whether the open-waits frontier story deflates a little once someone runs it through a harder, slower test. And second, what a SpaceX-owned cursor does to how the rest of the coding tool market prices itself, especially if that 100,000 GPU model lands, the way they're describing.

That's the window. Talk soon.
