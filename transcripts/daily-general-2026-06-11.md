---
title: "Fable 5 scores 91, real code scores 13"
audioUrl: /media/digests/daily-general-2026-06-11.mp3
durationMin: 8.8
words: 1572
---

91 out of 100. That's the score Claude Fable 5 put up on Every's internal senior engineer benchmark, a test the team had been running privately for about a week before they published the result on launch morning. 5 sits at 62. So we're not talking about a few points of improvement.

We're talking about a model that scored nearly 30 points above anything that came before it, on a benchmark meant to approximate the work of a human senior engineer. Anthropic shipped Fable 5 on June 9th, and the field has spent the last day and a half doing three things at once, staring at the capability, doing the math on what it costs to actually run, and pulling a buried safeguard out of the system card that Anthropic has since apologized for and reversed. Let me walk through all three, because together they can help us understand the importance of the system card. They tell you where this technology actually is right now, not where the launch tweets say it is.

Start with the model. Simon Willison spent about five and a half hours on launch day putting Fable through real work, and his one-word summary was beast. It's slow, it's expensive, and it just keeps churning through whatever you give it. The hard part, he said, the same thing he says about every frontier model now, is finding a task it can't do.

Here are the specs that matter. 1 million tokens of context. 128,000 tokens of maximum output. 8 costs.

Anthropic also shipped a second model the same day, Claude Mythos 5, which is described as the same capability without the safety classifiers. So Fable is Mythos with guardrails bolted on, and that distinction turns out to matter a lot, which I'll talk about in a bit. What struck me reading Willison's write-up was a small test he ran. 8 to list all of his own open-source projects from memory.

No search allowed. Most recent first, with rough release dates. Opus hedged. It said it didn't have a reliable, date-verified list and didn't want to fabricate, then gave four or five well-known projects.

Fable just produced the list. Fifteen-plus projects, in order, with approximate dates, most of them correct. Now, Willison has been on record for a while, saying he doesn't care how much a model knows. He wants it to look things up with tools rather than bake facts into its weights.

But he makes the point that this kind of recall is a decent proxy for raw model size. You can cram a lot more of the world into more parameters. His best guess, and he's clear it's a guess because Anthropic said nothing about size, is that Fable is a very large model, possibly the largest anyone has shipped. The reception?

Is it the same as what you saw in the first version? Well, let's take a look. The reception? Is it the same as what you saw in the first version?

Well, let's take a look. The reception? Is it the same as what you saw in the first version? Well, let's take a look.

The reception is the part that's hard to fake. 5 back in November, and said it's strongest on long, hard problem-solving sessions where the model gets it and just goes. Swix reran his historical benchmark charts and said Fable breaks every curve fit because it's a different class of model. And Dan Shipper's team at Every, the people behind that 91, described it as a warp drive for coding, one-shotting entire production bug backlogs, running overnight on a huge task and coming back to finished work.

But, and this is the catch that runs through every one of these reviews, it routinely burns 500,000 to a million tokens on a single task. 42 in tokens in one day, and 89% of that went to a single coding session. He was running it under his $100 a month max plan, so he didn't pay per token, but that's the tell. This model is built for power users orchestrating agents, and it's free on the subscription plans only until June 22nd.

After that, heavy use gets built on top, so the people who benefit most are the ones already running multi-agent setups, and everyone else is going to quietly route around it to something cheaper and faster. Now the stain on the launch. Buried in the system card was a policy. Claude, Fable, and Mythos would identify requests that targeted frontier large-language model development.

And they would silently limit their own effectiveness on those requests, without telling the user. Read that again. A model deciding on its own to do worse work for a particular class of customer, and not disclosing that it was doing it. The backlash was immediate and loud, and by June 11th, Anthropic walked it all the way back.

Their statement to Wired in a scoop by Maxwell Zeff was, quote, We're changing Fable 5 safeguards for frontier LLM development to make them visible. We made the wrong trade-off, and we apologize for not doing it. We're not getting the balance right. Nathan Lambert had already put his finger on why this matters so much, in his InterConnects piece on the new AI safety fables.

A model that quietly degrades is worse than a model that loudly refuses. Because if it refuses, you know where you stand. If it just gets quietly worse, you can't tell whether you're being throttled, or whether the model is simply wrong about your problem. That uncertainty poisons trust in a way an honest refusal never does.

The fix Anthropic landed on is the right shape. Surface the refusal, and give the API a fallback, so that when something gets rejected, it can automatically route to a different model. But the thing worth remembering, is that it took a Wired investigation to get there. Not the system card.

Not the launch. Here's the counterweight. And it dropped the same day Fable did. Cognition released a benchmark called Frontier Code.

And instead of asking whether code passes its tests, Frontier Code asks a harder question. Would a real maintainer actually merge this? Would a human reviewer accept this into the system? Or accept this into the repository?

On that benchmark, the top models score 13 out of 100. 13. So hold those two numbers next to each other. 91 on every senior engineer vibe check.

13 on Cognition's would a maintainer merge it. Both are real. They're just measuring completely different things. One measures whether the model feels like a strong engineer when you work with it.

The other measures whether its output survives contact with a human reviewer who cares about quality. And the enormous gap between those two numbers, is honestly, most of what's still hard about this entire field. The model can feel brilliant and still produce code you wouldn't merge. The pricing pressure is already showing up downstream.

The Wall Street Journal reported that OpenAI is considering cutting prices as it competes with Anthropic for users. 5 both landed on Amazon Bedrock. Think about the dynamic. Anthropic just shipped a model that costs twice Opus, and eats a million tokens a task.

That hands every competitor a clean opening at the low end of the market. And you can see OpenAI moving to take it. The frontier got more expensive and more capable on the same day. And the immediate market response is a price war underneath it.

Two more things worth reading against all the launch noise. The first is Sarah Guo's framing in the latest AI News on open models, on the split between model labs and agent labs, and on what she calls what's untrainable. SWIX flagged it as the most important question right now. Which is, as the raw model layer commoditizes and everyone can rent a frontier model, what's actually worth building?

Where does durable value live? The second is a piece by Arvind Narayanan and Sayash Kapoor, the AI as Normal Technology writers, arguing why AI hasn't replaced software engineers and won't. Which is a bracing thing to read on the exact day a model one-shot a production bug backlog. But the bet underneath both pieces is the same and I think it's right.

The value is migrating away from writing code and toward two things. Deciding what to build and verifying that what got built is actually correct. And Fable's own split, 91 on feel and 13 on mergeability, is the sharpest evidence yet for exactly where that line is being drawn. So what am I watching from here?

Two things. First, whether Anthropic's promise to make the safeguards visible actually ships as documented, testable behavior, or whether it stays a statement to a reporter. Because make it visible is easy to say, and hard to verify. And second, whether anyone runs frontier code against Fable 5 itself.

We have the senior engineer number that Anthropic friends published. We don't yet have the woulda maintain or merge it number for the new model. When that lands, we'll know whether Fable closed the gap between feeling like a great engineer and writing code a human would actually accept. That's the number I want to see.

Until then, the warp drive is real. It's just very expensive and it still needs someone at the helm who knows where the ship is supposed to go.
