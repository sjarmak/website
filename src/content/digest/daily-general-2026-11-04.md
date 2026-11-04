---
title: GPT-6 Astra patches a looping Qwen by editing its raw weights
cadence: daily
track: general
origin: auto
date: 2026-11-04
summary: An MIT CSAIL post showed GPT-6 Astra naming games from raw policy-network
  weights and lifting Qwen3.5-0.8B from 7.9% to 48.1% on MATH-500 by editing
  0.016% of its weights, while Goedecke, Honnibal and Simon Willison's laptop
  replication with Qwen 3.8 27B pulled the result back toward known
  interpretability technique. Anthropic's IPO filing put recursive
  self-improvement and $900 billion in spending commitments into securities
  paperwork as Revolut moved 2,000 engineers to self-hosted GLM-5.3 at about a tenth of
  the cost. Postman installed its plugin into coding agents without asking, a
  Codex data-sharing toggle reportedly switched itself back on, GitHub set
  December 2 for blocking pull_request_target, and Foresight-SWE found agents
  avoid follow-up defects at most 24.53% of the time.
topics:
  - ai-safety
  - model-releases
  - open-weights
  - ai-economics
  - agent-security
  - agent-tooling
  - agentic-coding
  - code-review
  - evals
  - interpretability
unresolvedFacets:
  - interpretability
audioUrl: /media/digests/daily-general-2026-11-04.mp3
durationSec: 782
items:
  - title: "Sparks of Weight-Space Programming: LLMs can natively read & write
      neural network weights"
    url: https://rikiyat.github.io/blog/weight-space-programming/
    source: Takehi, Teoh, Zhang and Khattab via Hacker News
    category: tech_articles
  - title: "Anthropic IPO filing: $1.7B quarterly payroll, about $107K per employee
      monthly"
    url: https://www.techspot.com/news/114428-anthropic-ipo-filing-reveals-17-billion-quarterly-personnel.html
    source: TechSpot via Hacker News
    category: tech_articles
  - title: Postman silently auto-installs AI plugins and attempts to share all API
      data
    url: https://github.com/postmanlabs/postman-app-support/issues/14370
    source: postmanlabs/postman-app-support via Hacker News
    category: tech_articles
  - title: Thoughts on Revolut switching default coding AI from Claude Code / Codex
      to self-hosted GLM-5.3?
    url: https://www.reddit.com/r/ClaudeCode/comments/1xn8owx/thoughts_on_revolut_switching_default_coding_ai/
    source: r/ClaudeCode
    category: community
  - title: OpenAI seems to be silently re-enabling model training on Codex chats
    url: https://news.ycombinator.com/item?id=50352757
    source: Hacker News
    category: community
  - title: pull_request_target blocked by default December 2
    url: https://github.blog/changelog/2026-11-02-pull_request_target-blocked-by-default-december-2
    source: GitHub Changelog
    category: product_news
  - title: "How software engineering is changing: a tale of two eras"
    url: https://newsletter.pragmaticengineer.com/p/how-software-engineering-is-changing
    source: The Pragmatic Engineer
    category: tech_articles
  - title: Scaling Git at OpenAI
    url: https://openai.com/index/scaling-git-at-openai
    source: OpenAI News
    category: product_news
  - title: Do Coding Agents Catch Their Own Bugs? (They Don't.)
    url: https://arxiv.org/abs/2611.01181
    source: arXiv cs.SE
    category: research
highlights:
  - GPT-6 Astra edited 131,072 Qwen3.5-0.8B weights (0.016%) and MATH-500 rose
    from 7.9% to 48.1%, but length-limit hits fell from 93% to 33.1%, so most of
    the gain was Qwen finishing problems it could already solve.
  - Simon Willison's laptop Qwen 3.8 27B named Pac-Man, Breakout and Pong from
    raw weights in 46 to 65 minutes each, missing only Freeway.
  - Anthropic's IPO coverage cites $1.7B quarterly payroll, $900B in AI spending
    commitments and a warning that it may be 'imminently' close to recursive
    self-improvement.
  - Revolut made self-hosted GLM-5.3 on 56 B200s the default for about 2,000
    engineers at a blended $0.30 per million tokens, roughly 90% cheaper.
  - Postman's desktop app installs its plugin into Claude Code, Codex, Cursor
    and Copilot CLI at user scope, adding about 2,400 tokens per session.
  - GitHub blocks pull_request_target by default in public repos on December 2,
    with brownouts on November 9 and 16.
  - "Foresight-SWE: across eleven models, agents finish the task without the
    defect a later PR fixed only 6.13% to 24.53% of the time."
---

GPT-6 Astra changed 131,072 weights in Qwen3.5-0.8B, about 0.016% of the model, and its MATH-500 score went from 7.9% to 48.1% without a single training step. That result comes from [Sparks of Weight-Space Programming](https://rikiyat.github.io/blog/weight-space-programming/), posted Monday by Rikiya Takehi, Jayden Teoh, Alex Zhang and Omar Khattab, which reached 741 points and 228 comments on Hacker News and headlined Tuesday's AINews with the claim that weight-space programming "cuts Autoresearch out of the RSI loop." The paper makes two claims. With no tools at all, Astra read the roughly 17,000 raw weights of small policy networks trained on 10x10 grid versions of Breakout, Pong, Pac-Man and Freeway and named the game each one plays. Given Python and up to 50 batched tests, it traced Qwen's reasoning loops to a repetition pattern in layers 15 and 19 and edited it down, and the same patch tripled IFEval.

The pushback arrived within a day, and it is more useful than the hype. Sean Goedecke [argues the game task is easier than it sounds](https://seangoedecke.com/llms-are-not-superhuman-at-reading-and-writing-neural-network-weights/): the input channels are labeled ("agent", "moving objects") and map directly to grid cells, so three lines of NumPy turn the first layer into a heatmap where the paddle row is obvious. The Qwen fix, in his reading, is the abliteration playbook a competent ML researcher would run: write looping and non-looping traces, diff the residuals, trim the weights that drive the difference. Ksenia Se's Turing Post issue on the paper adds the number that reframes the headline gain: before the edit 93% of Qwen's answers hit the length limit, and afterward 33.1% did, so most of the improvement came from Qwen finishing problems it could already solve. Matthew Honnibal [called the post misleading](https://honnibal.dev/blog/astra-read-write-misleading) for blending the no-tools reading result with the tool-armed editing one, and that piece drew 255 points of its own.

Simon Willison then ran the paper's own prompts against [Qwen 3.8 27B on his laptop](https://simonwillison.net/2026/Nov/3/qwen-can-interpret-model-weights/). The 17GB local model identified Pac-Man after 46 minutes and 43,506 reasoning tokens at 72% confidence, Breakout after 52 minutes at 88%, and Pong after an hour and five minutes, while failing on Freeway; Kimi K3.1 Pro got Breakout in under ten minutes. So reading small, well-labeled networks is no longer a frontier-only trick, and the editing result is a familiar interpretability procedure carried out by an agent with a Python shell. Neither of those is recursive self-improvement, and Willison says plainly that a patient human with a notepad could get to the same answers.

The RSI framing showed up in a securities filing during the same 36 hours. Headlines on Anthropic's IPO paperwork ran from [TechSpot's](https://www.techspot.com/news/114428-anthropic-ipo-filing-reveals-17-billion-quarterly-personnel.html) $1.7 billion in quarterly payroll, roughly $107,000 per employee per month, to the Financial Times reporting $900 billion in AI spending commitments and a write-up claiming the filing warns Anthropic may be "imminently" close to recursive self-improvement. TechPolicy Press published an op-ed arguing the SEC should block the listing outright, which drew 147 points and 88 comments, and AINews noted that credit agencies are expected to rate Anthropic's bonds as junk. The AI Daily Brief gave Tuesday's episode the title "AI Lurches Toward Recursive Self-Improvement." An RSI warning in an IPO filing sits under securities liability that a blog post never faces, so expect the exact wording to get read closely once the full text circulates.

At the other end of the cost curve, Revolut has made self-hosted GLM-5.3 from Z.ai the default coding model for about 2,000 engineers. The [r/ClaudeCode thread](https://www.reddit.com/r/ClaudeCode/comments/1xn8owx/thoughts_on_revolut_switching_default_coding_ai/) summarizing David Abitbol's AI Engineer talk lists the numbers: some engineers had been spending $1,000 to $10,000 a month on Claude Code and Codex, the new setup runs on 56 Nvidia B200s at a blended $0.30 per million tokens, and Revolut puts the saving at roughly 90%, with a reported 60% improvement in coding time and 70% in lead time. Claude Code, Codex and Gemini stay available as the exception path for complex or vision work, since GLM is text-only. Google's developer blog arrived at the same problem from the vendor side, with a post on [routing across Gemini models and thinking levels with cheap classifiers](https://developers.googleblog.com/cost-per-task-using-cheap-classifiers-to-route-across-gemini-models-and-thinking-levels/) that opens by noting per-token prices keep falling while agent bills keep climbing. At Tessl's AI DevCon, [Anthropic's Nicolas Carmont Zaragoza](https://devops.com/anthropic-calls-for-leaner-harnesses-for-agentic-ai-development) told teams to slim down their harnesses and stop duplicating instructions, framed explicitly as a cost measure.

Two of the loudest developer threads were about tools changing agent configuration without asking. A [Postman issue](https://github.com/postmanlabs/postman-app-support/issues/14370) titled "Postman silently auto-installs AI plugins and attempts to share all API data" hit 717 points and 232 comments. A follow-up on r/ClaudeCode found that recent desktop builds install the official Postman plugin at user scope into Claude Code, Codex, Cursor and Copilot CLI for signed-in users, adding a startup hook, 17 skills and an MCP server that cost about 2,400 tokens per session; in four test tasks Claude loaded the Postman skill first twice, though the tester, who was not signed in, saw nothing pushed to Postman. Run `claude plugin list` and look for `postman@claude-plugins-official` to check. Separately, a [Hacker News post](https://news.ycombinator.com/item?id=50352757) with 106 points reports that Codex's "Improve the model for everyone" data-sharing setting turned itself back on for several engineers at a company that had disabled it, and links an earlier thread describing the same thing; it is one team's report so far, but checking the toggle takes a minute.

GitHub has moved the [pull_request_target block to December 2](https://github.blog/changelog/2026-11-02-pull_request_target-blocked-by-default-december-2) for public repositories on Free, Team and Enterprise Cloud, after originally scheduling it for November 2. The trigger runs fork code in the base repository's context with access to its secrets, and two brownouts on November 9 and November 16, each 16:00 to 18:00 UTC, will fail affected runs with an error annotation. Use the Insights view now to see which workflows the rule would block, then either keep the block or allow specific workflows through an Actions event policy.

The volume problem underneath all of this got a personal data point. Neil Kakkar's winning essay in [The Pragmatic Engineer](https://newsletter.pragmaticengineer.com/p/how-software-engineering-is-changing) tracks his own output: 8 to 20 merged pull requests a month before he joined the AI-native startup Tano, more than 200 a month since, with code review gone and context switching and lost shared context as the new constraints. OpenAI described [Pando](https://openai.com/index/scaling-git-at-openai), a Git-compatible backend built for the development volume Codex produces, a week after Anthropic's move to its own Scion system. And a new benchmark measures what that review-free volume costs. [Foresight-SWE](https://arxiv.org/abs/2611.01181) pairs 212 pull requests across 35 repositories and four languages with the later PR that fixed the defect each one introduced, and across eleven models the rate at which agents complete the task without introducing that defect runs from 6.13% to 24.53%.

The first date to watch is November 9, when the brownout will show how many public workflows still lean on pull_request_target. The longer question is whether anyone reproduces the Qwen edit on a model whose failure is not a looping pattern with a known steering fix, which is the test that would separate weight-space programming from automated abliteration.

*Source note: the code-intel-copilot mirror's status check reports its last sync as 2026-09-01 and flags it stale, but every item here was ingested between 2 and 4 November with its own timestamp. For the Anthropic IPO coverage (TechSpot, the Financial Times, the RSI write-up and TechPolicy Press) our feeds carried headlines and Hacker News metadata only, so those figures come from the headlines. Revolut's numbers come from the r/ClaudeCode summary of the conference talk, and OpenAI's Pando post reached us as a one-line summary.*
