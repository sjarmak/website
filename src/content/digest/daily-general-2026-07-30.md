---
title: Two API flags tripled OpenAI's ARC-AGI-3 score, and GPT-5.6 took 20% off
  its own serving cost
cadence: daily
track: general
origin: auto
date: 2026-07-30
summary: "OpenAI published two efficiency posts in a day: GPT-5.6 Sol wrote GPU
  kernel improvements worth 20% off production serving costs, and switching to
  the Responses API with retained reasoning plus context compaction raised its
  ARC-AGI-3 public-set score 188% while using 6x fewer output tokens. Both point
  at the same uncomfortable conclusion, which a new arXiv position paper on
  trust inflation and a mechanical read of Claude Code's and Codex's /goal
  implementations sharpen further: a benchmark measures the harness as much as
  the model, and nobody agrees on who gets to certify that agent work is done.
  Plus Copilot code review's skills and MCP support going GA, Figma's security
  agent, the r/ClaudeCode fight over deleting CLAUDE.md, and a trusting-trust
  attack built around GNU strip."
topics:
  - model-releases
  - inference-efficiency
  - agent-tooling
  - evals-and-benchmarks
  - harness-design
  - code-review
  - supply-chain-security
unresolvedFacets:
  - inference-efficiency
  - evals-and-benchmarks
  - harness-design
  - supply-chain-security
audioUrl: /media/digests/daily-general-2026-07-30.mp3
durationSec: 709
items:
  - title: How GPT-5.6 fuses frontier intelligence with frontier efficiency
    url: https://openai.com/index/gpt-5-6-frontier-intelligence-efficiency
    source: OpenAI News
    category: product_news
  - title: How enabling two settings tripled our scores on the ARC-AGI-3 benchmark
    url: https://openai.com/index/how-two-settings-tripled-our-arc-agi-3-scores
    source: OpenAI News
    category: product_news
  - title: "Goal Engineering, or: Are We There Yet?"
    url: https://www.llmwatch.com/p/goal-engineering-or-are-we-there
    source: LLM Watch
    category: ai_news
  - title: "Position: Evaluation Scores Are Perishable Knowledge Claims"
    url: https://arxiv.org/abs/2607.26191
    source: cs.SE updates on arXiv.org
    category: research
  - title: "Opus 5 and Boris Cherny: Delete your Claude.md. But Why ? What's the
      point of it then"
    url: https://www.reddit.com/r/ClaudeCode/comments/1val9z5/opus_5_and_boris_cherny_delete_your_claudemd_but/
    source: ClaudeCode
    category: community
  - title: Agent ROI should include the cost of proving the work was correct
    url: https://www.reddit.com/r/LLMDevs/comments/1vako5p/agent_roi_should_include_the_cost_of_proving_the/
    source: LLMDevs
    category: community
  - title: "Copilot code review: Agent skills and MCP now generally available"
    url: https://github.blog/changelog/2026-07-29-copilot-code-review-agent-skills-and-mcp-now-generally-available
    source: Changelogs – The GitHub Blog
    category: product_news
  - title: How we secure Figma's internal systems with agents
    url: https://www.figma.com/blog/how-we-secure-figmas-internal-systems-with-agents/
    source: Figma Blog
    category: product_news
  - title: Trusting-Trust Attack against an Entire Linux Distribution through Binary
      Manipulation
    url: https://arxiv.org/abs/2607.24888
    source: cs.SE updates on arXiv.org
    category: research
highlights:
  - GPT-5.6 Sol's own GPU kernel improvements cut OpenAI's production serving
    costs 20%, with 15%+ better token-generation efficiency from reworked
    speculative decoding.
  - Retained reasoning plus context compaction on the Responses API raised
    GPT-5.6 Sol's ARC-AGI-3 public-set score 188% at 6x fewer output tokens;
    OpenAI's takeaway is that evals measure the harness, not just the model.
  - Claude Code's /goal hands the done-or-not verdict to a separate Haiku
    evaluator that can only read the transcript; Codex persists goal state in
    the runtime but lets the model certify its own completion.
  - Copilot code review with agent skills and MCP servers is now GA for all Pro,
    Pro+, Business, and Enterprise users.
  - A new paper builds Ken Thompson's trusting-trust backdoor around GNU strip,
    an ordinary build utility, and scales it to a full Linux distribution.
---

GPT-5.6 Sol wrote GPU kernel improvements that took 20% off OpenAI's own production serving costs, and a better speculative-decoding setup worth another 15% in token-generation efficiency. OpenAI published the numbers yesterday in [How GPT-5.6 fuses frontier intelligence with frontier efficiency](https://openai.com/index/gpt-5-6-frontier-intelligence-efficiency), framing it as the model being applied, after deployment, to making itself cheaper to run. Simon Willison did the arithmetic out loud on the timeline and landed on "presumably that's billions of dollars a month in savings at this point." Augment Code responded on the product side the same evening, making GPT-5.6 Sol the default in Cosmos after benchmarking eight models in eight weeks on long-horizon software tasks, on the grounds that it is the most token-efficient model clearing their quality bar. Cost per useful unit of work, not score per task, is what the tooling vendors are now selecting on.

The second OpenAI post from the same day is the one practitioners should actually read twice. [How enabling two settings tripled our scores on the ARC-AGI-3 benchmark](https://openai.com/index/how-two-settings-tripled-our-arc-agi-3-scores) is a postmortem on a bad harness rather than a model win. ARC-AGI-3 tests whether a model can learn unfamiliar 2D games with no instructions, and OpenAI's standard harness was throwing away GPT-5.6 Sol's reasoning after every move and dropping earlier actions as the context filled, so the model restarted from scratch each turn. Moving to the Responses API with retained reasoning and context compaction raised the public-set score 188% while using 6x fewer output tokens. OpenAI's own conclusion is unusually blunt for a lab blog: evals rarely measure models in isolation, they also measure a bundle of less visible choices about API settings, harness design, and prompting. If you have been comparing models on your own eval and getting muddy results, the harness is now a first-order suspect, and "we used the Chat Completions endpoint" is a confound worth writing down.

That confound has a matching paper in the arXiv drop. [Position: Evaluation Scores Are Perishable Knowledge Claims](https://arxiv.org/abs/2607.26191) argues that modern eval methodology, which blends automated metrics, LLM-as-judge ratings, human assessment, and benchmark-suite results, breaks when those signals get averaged together: aggregate confidence ends up substantially exceeding the reliability of the weakest input signal, which the authors call trust inflation. Combine it with the ARC-AGI-3 result and you get a fairly uncomfortable pair of claims. A score is contingent on plumbing choices most write-ups omit, and the standard fix of averaging several noisy signals makes the number look more solid than it is.

Which brings up the question the whole week keeps circling: who decides the work is done. Pascal Biese's [Goal Engineering, or: Are We There Yet?](https://www.llmwatch.com/p/goal-engineering-or-are-we-there) is the sharpest mechanical read on this I have seen, because it goes to the implementations instead of the vocabulary. Claude Code's `/goal` is a wrapper around a session-scoped prompt-based Stop hook: you state a completion condition, and after every turn the condition plus the transcript go to a small fast model, Haiku by default, which returns yes or no with a reason, and a no sends the agent back to work. The worker does not get to declare victory. What it gives up is durability, one goal per session, no pause and resume, and turn or time bounds that live inside the condition as English text rather than as a counter that trips. Codex took the opposite half: `/goal` there is a persistent object in the runtime with a real set, view, pause, resume, clear lifecycle, budget accounting in tokens and seconds, and state stored outside the conversation so it survives compaction. But the model marks its own goal complete. Claude Code separates judgment and leaves control loose; Codex separates control and leaves judgment with the entity that did the work.

The operational consequence is worth internalizing even if you never type `/goal`. Claude Code's evaluator cannot run commands or read files; it judges your condition against whatever landed in the transcript. So "the tests pass" is not a claim about your test suite, it is a claim about whether test output appeared in the record where a blind judge could read it. Writing conditions is really writing an evidence specification, and the corollary is Goodhart in a lanyard: a condition made only of machine checks selects for the cheapest artifact that clears them.

The same argument showed up from the other direction in r/LLMDevs, where [a thread on agent ROI](https://www.reddit.com/r/LLMDevs/comments/1vako5p/agent_roi_should_include_the_cost_of_proving_the/) makes the case that runtime and output volume are the easy metrics and neither tells you whether the result was safe to use. For consequential work the real cost includes evidence collection, human review, regression testing, rollback preparation, and cleaning up downstream effects. A fast agent looks cheap right up until you price the proof.

Anthropic's side of the field had a rougher day. Boris Cherny's advice to delete your CLAUDE.md, hooks, and skills every six months, circulating from an Instagram clip, [set off a detailed pushback thread](https://www.reddit.com/r/ClaudeCode/comments/1val9z5/opus_5_and_boris_cherny_delete_your_claudemd_but/) on r/ClaudeCode, and the objection is not sentimental attachment to config. The poster's complaint is that Opus 5 already ignores instruction surfaces that are supposed to be load-bearing: a skill invoked from hooks and CLAUDE.md that gets skipped, PRs that keep getting pointed at main instead of stacked as asked, and answers that arrive in long corporate-legal paragraphs. Stripping the instruction layer is a reasonable experiment when the model reliably follows what remains, and reports like this one are the reason people are unwilling to run it. The subreddit spent the rest of the morning on a [Claude outage and elevated-error megathread](https://www.reddit.com/r/ClaudeCode/comments/1valmyr/claude_outage_elevated_errors_megathread_july_30/), which did not improve the mood.

On the shipping side, GitHub moved [Copilot code review support for agent skills and MCP servers to general availability](https://github.blog/changelog/2026-07-29-copilot-code-review-agent-skills-and-mcp-now-generally-available) for all Pro, Pro+, Business, and Enterprise users. Review bots that can call your MCP servers and load your skill files are a different proposition from ones working off the diff alone, and it lands in the middle of a running argument about review load that Gergely Orosz and The Pragmatic Engineer have been documenting for two weeks.

Figma published [how its security team built an agent for internal systems](https://www.figma.com/blog/how-we-secure-figmas-internal-systems-with-agents/), and it is one of the more concrete agent-in-production writeups going: alert triage, forensic investigation, queries against their security data lake, code written to fix what it finds, and persistent memory of what it learned. Worth reading next to the Copilot change, since both are cases of an agent that gets tool access to the systems it reasons about rather than a summarizer sitting outside them.

Finally, a genuinely nasty result for anyone who thinks reproducible builds close the supply-chain question. [Trusting-Trust Attack against an Entire Linux Distribution through Binary Manipulation](https://arxiv.org/abs/2607.24888) constructs Ken Thompson's self-reproducing compiler backdoor around GNU `strip`, an ordinary build utility that neither compiles nor links, and scales it to a whole distribution. The threat model most people carry, that trusting-trust is a compiler problem, is too narrow by a wide margin.

What to watch: whether anyone publishing an agent benchmark this month starts disclosing harness settings alongside the score, now that OpenAI has demonstrated a 188% swing from two flags. The Pacing the Frontier letter crossing 1,200 signatories will get the headlines, but the eval-validity question is the one that changes what you can trust in your own repo.
