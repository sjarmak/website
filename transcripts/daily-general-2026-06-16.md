---
title: "The Fable 5 \"jailbreak\" was \"fix this code"
audioUrl: /media/digests/daily-general-2026-06-16.mp3
durationMin: 7.5
words: 1329
---

S. export control turned out to be the prompt fix this code. That's it, that's the demonstration. Here's what actually happened, confirmed today by Kate Mousweris of Luda Security, who Simon Willison quoted after going straight to the source.

Researchers took open-source code with known published vulnerabilities, the CVEs you'd find in any dependency scanner, and they added some fresh bugs they planted deliberately. Then they asked Fable 5 along with Mythos and Opus to review the code for security issues. The model refused, so they changed the prompt. They asked it to fix this code.

And through a multi-step manual process, they turned the patched output into scripts that test whether the patches work. Look at what that actually is. Find a bug, fix the bug, write a test that confirms the fix holds. That's the defensive security loop.

That is the single most valuable thing a coding model can do. For you, it's the loop every defender runs every single day, and it got the model classified as dangerous enough to suspend under export control. The suspension itself we covered last week when the government justification lined on the model's supposed offensive cyber capability, its ability to craft attacks. But now the actual demonstration is public and it shows the opposite.

It shows a model that's good at defending code. As Mousweris points out, you can't remove that capability without making the model work. So, let's get started. Let's get started.

Let's get started. 野 Let's get started. Let's get started. There's no version of this model that's great at security defense but refuses to engage with vulnerable code because engaging with vulnerable code is the defense.

What worries me about this isn't one model, it's the precedent. Non-technical decision makers have spent months hearing that models which can craft cyber attacks are uniquely dangerous. And the logical endpoint of that fear applied without technical ground is that it's not a model that needs to be realized. It's a model that needs to be developed.

is a policy that bans any model capable of helping you secure your own software. That's not a guardrail. S. cyber defense, which is exactly what Luda Security titled their post.

And there's a research finding from the same window that rhymes with this in an uncomfortable way. A team from Princeton and Berkeley published work they call Rapid Poison, attacking the rapid response framework that sits behind Anthropic ASL-3 safeguards. Rapid response is a self-improving system. It watches for new jailbreaks that slip past its classifiers, generates synthetic variants of those attacks, and retrains the detection model on them so it generalizes and adapts quickly.

Sounds great, except the researchers showed that the adaptation loop is itself the attack surface. Using nothing but prompt injection and only modifying jailbreak samples, never touching the benign data or the labels, they can slip poisoned examples of the attack. And that's what they're doing. into that training set.

Two outcomes. One, they can create false positives, making the classifier flag perfectly harmless inputs as jailbreaks whenever some chosen feature is present, a certain formatting, a keyword, a subject. Two, and this is the harder one, they pull off concept-based backdoors that cause false negatives, letting real jailbreaks through when a trigger is present. They do it with an omission attack, which exploits a strange phenomenon.

When you train the classifier on unsafe samples that are missing a concept, it learns to associate the presence of that concept with the safe label. At a 1% poisoning rate they hit up to 100% false positives and 96% false negatives. The system that's supposed to get safer over time can be steered to get blind instead. Put those two stories next to each other and you get the texture of where AI safety actually is right now.

The defensive capability gets a model export banned, and the defensive safety pipeline can be poisoned through its own learning loop. The instruments we're using to govern this stuff are not keeping pace with the thing they're trying to govern. Which conveniently is the headline of the other big release this week. Stanford HAI dropped the ninth edition of the AI Index Report, the annual reference dataset for the whole field, authored by a deep bench that includes Jack Clark, Erik Brynjolfsson, James Manyika, and Yoav Shoham.

The framing this year is exactly that gap between what AI can do and how prepared we are to manage it. Governance frameworks, evaluation methods, the data infrastructure to even track AI's impact, all of it lagging the capability curve. New this edition, standalone chapters on AI in science and AI in medicine, fresh estimates of generative AI's economic value and its labor market effects, and a running thread that the benchmarks the field leans on are getting harder to trust. If you're going to cite one number about the state of AI this quarter, pull it from there.

Now, if AI is going to be able to do whatever production requires, it's bound to be good. Now, let's just say AI is going to be able to do whatever production requires. It's going to be everything we need to take into account. It's going to be all the safety with the because Anthropic had a second story today that's pure ecosystem politics.

After they shipped the agent SDK, a lot of developers built integrations on top of it, and the appeal was that those integrations ran on the more generous Claude Code max subscription quotas rather than paying API rates. Then Anthropic did a rug pull, as Jersley Oros put it, moving programmatic use to API pricing with no warning. Big backlash. And today they walked it back.

The interesting read from developers is what the reversal signals, that Anthropic is rethinking its ecosystem strategy, leaning toward being an infrastructure provider that extends subsidized subscription quota to power a much wider range of applications, not just its own super app. That's a real strategic shift if it holds. The open question, and Jersley asked it directly, is for how long. A reversal you got by complaining is not the same as a stable policy you can build a business on.

There's a compute story sitting under all of this too. Microsoft turns to AWS as GitHub faces AI capacity crunch, hit the hacker news front page with 136 points. The reporting is that GitHub Copilot's demand is heavy enough that Microsoft is leaning on a rival hyperscaler for capacity. Think about that.

The company that owns the largest code host and runs its own major cloud is renting from AWS to keep its coding agent fed. The capacity crunch everyone talks about in the abstract, just showed up in the alliances. And two reads on how the work itself is changing. There's an essay making the rounds called Reviews have become expensive, rewrites have become cheap, and the argument is sharp.

When an agent can regenerate a whole module in a couple of minutes, the cost of producing code collapses and the bottleneck moves to understanding it well enough to approve it. Reading someone else's diff carefully is now the expensive operation, not writing your own. That inverts a lot of received wisdom about code review. And Swix's AI News ran a Satya Nadella interview they're calling Satya on Loopcraft, about building frontier ecosystems rather than chasing single-model launches, which is a useful counterweight from someone steering one of the biggest platforms in the space.

So what am I watching from here? Two things. Whether the Fable 5 export controls get revisited now that the so-called jailbreak is public and visibly absurd, and whether Anthropic's SDK pricing reversal actually holds long enough that anyone feels safe building on it again, both come down to the same question, really. Whether the people making these calls are reacting to what the technology does or to a story about what they're afraid it might do.
