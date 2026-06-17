---
title: "Claude Fable 5 arrives at twice Opus pricing, and Cognition's day-old"
audioUrl: /media/digests/daily-general-2026-06-10.mp3
durationMin: 10.9
words: 1722
---

42 worth of tokens in a single afternoon yesterday, and he sounded delighted about it. That number is as good a place as any to start. Because yesterday, Anthropic shipped Claude Fable 5, and the field has spent the last day figuring out what it is, what it costs, and what it quietly declines to do. Start with the facts.

Fable 5 is Anthropic's release of Claude Mythos 5, a model the company says exceeds the capabilities of anything it has ever made generally available. The difference between the two names is the wrapper. Fable 5 is Mythos 5 with strict safety classifiers bolted on, so it can ship to everyone. Mythos 5 itself, the same weights without the classifiers, goes out to qualifying customers.

Both have a 1 million token context window, 128,000 maximum output tokens, and a knowledge cutoff of January 22, 2026. The pricing is the headline for most working developers, $10 per million input tokens, and $50 per million output. 8, and there is no extra surcharge for long context. If you are on a Claude subscription plan, the model is included until June 2022, and after that, it bills on top.

The rollout tells you how coordinated these launches have become. Devin had it day one, with Cognition saying they tuned their harness so the ultra-agent running Fable costs only about 40% more than the default. GitLab put it in duo-agent platform. AWS announced it on Bedrock.

Replit wired it into a new high-effort mode. Augment Code shipped it in their Cosmos platform with the same framing everyone is using. This is the premium option for long, multi-step engineering work, not your daily driver. So what does it actually do?

The early reviews are unusually consistent. Simon Willison didn't have early access, so his write-up is five and a half hours of launch-day testing, and his one-word summary was beast. Slow, expensive, and happily churning through everything he threw at it. Two examples stand out.

First, he asked it to clone his MicroPython WASM project, a sandbox that runs MicroPython in WebAssembly, and figure out how to upgrade it to full CPython. It identified the right upstream builds, worked around environment restrictions when he uploaded the files by hand. Second, he pointed it at his Dataset agent project to add human-in-the-loop tool approval. And over the course of the day, it not only built the feature, but identified and shipped six supporting improvements to his underlying LLM library, with API design, tests, and documentation he described as several days' worth of work.

com. And that's the end of this video. Thank you for watching, and I'll see you in the next video. Thank you for watching, and I'll see you in the next video.

Thank you for watching, and I'll see you in the next video. Thank you for watching, and I'll see you in the next video. Thank you for watching, and I'll see you in the next video. Thank you for watching, and I'll see you in the next video.

Thank you for watching, and I'll see you in the next video. They're finding, Fable is genuinely better when the prompt is incomplete, and the agent has to discover the environment before it can build, learning the files, the tools, and the constraints before writing anything. 8 and their current baseline safer choices. That split, exploration versus judgment, is worth remembering when you decide where to spend the tokens.

And the community texture backs it up. Thank you for watching, and I'll see you in the next video. Jay Karpathy and Swix were both passing around charts, showing benchmark curves breaking. Swix re-ran his historical difficulty class charts on Frontier Code Diamond, and said none of the official tables capture the degree of takeoff.

That Fable is a different class of model, with, in his words, big model smell. Simon Willison made the same observation, from a different angle. 8 managed. Anthropic has said nothing about parameter counts, but the speed, the price, and the depth of knowledge all point the same direction.

This is probably a very large model, maybe the largest any vendor has shipped. The practical tip circulating, also from Swix, while Fable is included on subscriptions rather than pay-per-use, pointed at code review. Tell Claude Code to review your codebase for issues, and as he put it, be prepared to be an abject horror that you shipped anything to prod without a Fable check first. The subreddits are working out the same calibration in public.

8 on its highest setting, and why a low version exists at all, burns twice the resources. Others are noticing personality. One user who switched mid-project reported the model simply gets on with the work without flattering you, and another collected genuinely funny one-liners it dropped while helping pick out a monitor. All signals, but model character shapes daily use, as much as benchmarks do.

Now the asterisk, and it's a real one. Fable's launch came with usage policies that have the open AI community genuinely upset. Anthropic is applying what it calls RSI suppression to mythos class models, interventions that limit the model's effectiveness on requests targeting frontier LLM development. Think pre-training pipelines, distributed training infrastructure, and accelerator design.

Using Claude to build competing models, it's easy to see that the model's already violated the terms of service. The change is that enforcement now happens inside the model, through prompt modification, steering vectors, or parameter-efficient fine-tuning. And, unlike Anthropic's safeguards for cybersecurity or biology, these are invisible by design. There is no refusal message.

The model does not fall back to a different model. It just gets worse at helping you. Silently. Anthropic estimates this touches about three-hundredths of a percent of traffic, concentrated in fewer than a ten-thousandth of a percent of organizations.

And most coding work will never brush against it. But the principle is what bothers people. One widely shared blog post put the objection in a single sentence, if Claude stops helping you, you'll never know. Nathan Lambert at interconnects has the longest and fairest read on the whole policy package, including the new commitment that mythos class traffic gets safety logging with deletion after 30 days.

Whatever you think of the trade-off, this is the first time a frontier lab has shipped capability suppression that deliberately doesn't announce itself. And that precedent will outlive this particular model. The benchmark fable now sits on top of is itself brand new. And it deserves its own minute.

On Monday, Cognition released FrontierCode, a coding benchmark built in partnership with the maintainers of 36 flagship open-source repositories, projects like Celery and BuddyBase. The maintainers put more than 40 hours into each task across multiple rounds of iteration, defining what they call the best-in-the-box, best-in-the-box, best-in-the-box, best-in-the-box, best-in-the-box, best-in-the-box, best-in-the-box, best-in-the-box, best-in-the-box, best-in-the-box, would actually have to look like to get merged. Every task gets manually reviewed by a cognition researcher and they claim 81% fewer misclassification errors than SWE Bench Pro. 4 out of a hundred on the Diamond task set.

4. After years of models saturating SWE Bench variants, here is a benchmark grounded in real maintainer standards, where state of the art, barely gets off the floor, and then one day later, Fable 5 took the number one spot. The timing worked out perfectly for Cognition, and honestly for the rest of us too, because a fresh benchmark with real headroom is exactly the instrument you want, on the day a new model class shows up. 5 barely improve with more thinking effort on Diamond, while Fable scales, is the most interesting technical claim of the launch.

If it holds, the post-training has learned to convert test-time compute into progress on problems measured in dozens of human hours, which is precisely where the previous generation stalled. A few more things from the last day, briefly. Cohere launched North MiniCode, an agentic coding model and their clearest entry yet into the coding agent market. It won't headline against Fable on a day like this, but a fifth lab planting a flag in agent coding tells you where everyone thinks the revenue is.

On the money side, reporting surfaced that Google's financial backstops underpin a $35 billion chip deal for Anthropic. Read that next to the fact that Anthropic just shipped what is probably its largest model ever. The capital structure behind these training runs is becoming as load-bearing as the research. A new spend report says DeepSeek is climbing the token volume charts while Anthropic continues to dominate actual dollars spent, which is a useful reminder that volume and revenue are different leaderboards measuring different things.

GitHub shipped a dedicated security review slash command in Copilot CLI, an experimental public preview that scans your working changes for vulnerabilities before they reach production. Small feature, but it's part of a clear pattern. The review side of the agent loop is getting first-class commands, not just prompts. Stepping back, the day had a theme.

Capability went up a tier, and so did the question of who controls it. Fable is included free on subscriptions until June 22nd, which means the next day will be the day when it's going to be available. The next two weeks are effectively a field-wide free trial of mythos-class capability. Watch what people build with overnight runs during that window, because that's the real eval.

Watch whether Frontier Code Diamond becomes the number everyone quotes, the way SWE Bench was for the last two years. And watch whether the other labs follow Anthropic's lead on silent capability suppression, because if invisible degradation becomes the industry's preferred safety mechanism, the debate about it will not stay at three-hundredths of a percent of traffic. org community
