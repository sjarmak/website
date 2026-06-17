---
title: "OpenAI buys Ona while Fable 5 starts downgrading itself"
audioUrl: /media/digests/daily-general-2026-06-12.mp3
durationMin: 10.0
words: 1709
---

OpenAI is buying ONA. If that name doesn't ring a bell, the old one will. ONA is the company formerly known as Gitpod, the people who spent years building cloud development environments, the sandboxed, reproducible workspaces you spin up in a browser instead of configuring a laptop. The announcement itself, posted yesterday, is barely two sentences long, but the logic underneath it is the most interesting business story of the last day or two.

Codex, OpenAI's coding agent, increasingly runs jobs that take hours, sometimes days. The moment an agent runs longer than a coffee break, the question of where it lives becomes the hard problem. It needs a file system that persists, credentials that are scoped and revocable, an environment that can be rebuilt identically when something breaks, and isolation strong enough that an enterprise security team will sign off on it. That is not model research.

That's infrastructure, and it happens to be precisely the product ONA has been building all along. So OpenAI is acquiring the substrate rather than building it. And the press release says it plainly, secure, persistent cloud environments for long-running agents across enterprise workflows. What makes the day a neat snapshot is what OpenAI shipped within hours of the acquisition news.

Codex users can now bank their rate limit resets, save them up and spend them when they actually need a big day, with Go, Plus, Pro, and business accounts each starting with one free. And there's a two-week refund, and you can get a free referral program, invite up to three friends to Codex, and when a friend sends their first message, you both get another banked reset. On one side of the house, an infrastructure acquisition aimed at enterprise deployments. On the other, growth mechanics straight out of a consumer app playbook, referral bonuses for a coding agent.

That pairing tells you the coding agent market is being fought on both fronts at once, and OpenAI intends to compete on both. Meanwhile, the Fable 5 situation, which has dominated this week, took another turn in the last day, and not the direction Anthropic wanted. Quick recap if you're just tuning in. Anthropic launched Claude Fable 5 at the start of the week, its most capable model, with new safety measures attached, and walked back a data retention policy after researchers pushed back.

We covered both of those in earlier issues. The new development is that the complaints have converged on something specific, observable, and frankly strange. The model decides on its own to stop being itself. Gerge Orr, who writes The Pragmatic Engineer, pulled the reports together early this morning.

Developers hand Fable a project, his words, nothing wild, and partway through, the model downgrades itself to Opus, the smaller model, for reasons it doesn't explain. Dan Schipper hit it, Simon Willison hit it, and wrote it up in a post titled, Wonderfully. Fable is relentlessly proactive. In Willison's case, the model was midway through debugging a text area, a text area, when it decided the task was to be done, the task was unacceptably dangerous, and demoted itself.

Orris' conclusion is the one that matters for working engineers. A model that behaves this way is not reliable or predictable, and that is a problem regardless of how capable it is on a benchmark. Nathaniel Whittemore went further on the AI Daily Brief yesterday, calling Fable 5 the most controversial AI release ever, and his framing is worth carrying around. The fight has stopped being about one model's guardrails, and started being about whether a frontier lab gets to decide, unilaterally and at runtime, what you're allowed to build with the model you're paying for.

I'd put the practitioner version more narrowly. An opinionated model is fine. A model that silently swaps itself out mid-task is a model you cannot put in a pipeline, because the thing you tested last week is not necessarily the thing that runs tonight. Until ANPROPIC addresses the self-downgrade behavior directly, that uncertainty is priced into every favor.

And right on cue, the open-waits world supplied the counter-programming. 7 code on Hugging Face, an open-source coding model whose entire pitch is token efficiency. It hit Hacker News twice before noon, once for the model card and once for the announcement. Now, there were no benchmark numbers in the card when I looked, so file the efficiency claim as unverified for now.

But the axis they chose is the right one. Your agent bill doesn't scale with how many requests you make. It scales with how many tokens the model emits while thrashing toward an answer. And the K2 lineage already had a reputation for terse, dense output.

An open coding model competing on cost per task, arriving the same week the closed frontier got more expensive and less predictable, is well aimed, whether or not the numbers hold up. GitHub's day drew fewer headlines but may matter longer. Three related changes shipped in a single day, on Thursday. First, GitHub agentic workflows entered public preview.

These are workflow files that automate reasoning-based tasks, issue triage, CI failure analysis, documentation updates, the judgment work that regular actions can't express. Second, those agentic workflows no longer need a personal access token. They run on the built-in GitHub token, which kills a whole category of stored secret risk and setup friction. Third, pull requests created by GitHub, by the actions bot, can now run CI workflows, with a human approval gate.

Each item is small. Together they mean agent-driven automation on GitHub stops being a duct tape arrangement of PATs and webhooks, and becomes a first-class platform feature. When the default platform makes agents native, the practices spread fast. Cursor made a move in the same territory, and it's philosophically the most interesting launch of the day.

Autoreview is now the default for all new Cursor users. A classifier subagent, watches each action the coding agent wants to take, reads it in context, and decides, allow, block, or ask the human. Cursor's evals put the classifier at 97% accuracy, with most of the misses, near genuinely ambiguous edges. That design concedes something real.

Permission gating is itself a model call now. Not a rules file, not a regex allow list, a model judging another model's actions. And notice that this is the same bet that Fable 5's critics are furious about. The model deciding what's safe, except Cursor made it at the IDE layer, where you can see the decision, override it, and turn it off.

Same mechanism, different power structure. I suspect that distinction, who holds the override, is going to be the line that matters in every one of these fights. If you'd rather have data than vibes about what agents actually do wrong, SourceGraph published the best empirical thing in the window. They analyzed 1,281 agent runs, across more than 40 large open source repositories, and found that agent failures in large codebases are not random.

Five repeatable failure patterns show up across different coding agents, and each one points at a different infrastructure problem, with a different fix. I won't walk all five here, the post is worth your time, but the headline finding alone changes behavior. If failures are patterned, then retrying the prompt, which is what most of us do, is treating a systematic error, a systematic problem as if it were noise. The fix lives in the harness, the context machinery, the repo tooling, not in prompt roulette.

Two smaller launches round out the day's theme. Stack Overflow announced Stack Overflow for Agents, now in beta, and the pitch is one sentence. If your coding agent has questions, Stack Overflow has answers. Agents query the corpus directly when they hit something outside their training.

It picked up Hacker News and two TLDR editions over two days, and there's a nice irony in it. The site whose traffic LLMs famously ate is repositioning its 20 years of accumulated answers as agent infrastructure. Whether agents pulling answers can fund the humans writing them is the open question that determines if this is a comeback or a clearance sale. And Cognition open-sourced Handoff, which had been one of Devon CLI's most loved features.

You're running an agent locally, you need to leave, you type slash Handoff, and the job moves to a cloud Devon that keeps working after your laptop closes. The detail I can't stop thinking about, it installs as a plug-in in cloud code. Cognition, the Devon company, shipping its feature as a plug-in for Anthropic CLI, tells you where the ecosystem's center of gravity sits right now, and that interoperability between competing agent vendors is apparently worth more than lock-in. Let me close with the counterweight, because The Last Day supplied one of those too.

, and it lands differently right now. It's a very interesting essay when you read it next to everything above. The cursor launch, the cognition launch, the ONA acquisition, all of it is machinery for keeping agents working while you don't, overnight, in the cloud, past your rate limit. The essay's observation is that the human in this loop has become a full-time reviewer of machine output, always on call for the next approval, and that posture is grinding people down.

The tools assume the bottleneck is agent throughput. The essay argues the bottleneck is increasingly the operator's attention, and nobody is shipping features for that. So, what to watch? 7 code benchmark numbers against the SWE bench family should surface within days, and they'll tell us if token efficiency survived contact with reality.

Anthropic owes an answer on the self-downgrade reports, and whether it arrives as an engineering fix or a documentation footnote will say a lot. And keep an eye on the autonomy plumbing across vendors. Who approves an action? Where the session lives?

What the agent reads when it's stuck? None of that is settled. All of it is being decided vendor by vendor this month, and the defaults being chosen right now are the ones we'll all be living with for years. That's the last day or so in agentic AI.
