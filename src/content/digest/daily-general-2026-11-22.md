---
title: Gemini agents port a 170k-line AV1 decoder to Rust with bit-exact output
cadence: daily
track: general
origin: auto
date: 2026-11-22
summary: "Google's Antigravity /teamwork post claims machine-checked Lean proofs
  and a bit-exact Rust port of libgav1, while a scan of 159,041 Lovable apps
  found more than 24,000 serving Supabase rows without login. Also: the Gemini
  Decisions API, Pinterest's loop-engineering method for agent compliance, Amp
  replacing its Dial with a model selector, the US tax code in Lean, and Alpha
  School's internal results. The feed stalled on November 16, so every item
  dates from November 11 to 15."
topics:
  - model-releases
  - agent-tooling
  - multi-agent-systems
  - formal-verification
  - security
  - evals
unresolvedFacets:
  - multi-agent-systems
  - formal-verification
audioUrl: /media/digests/daily-general-2026-11-22.mp3
durationSec: 802
items:
  - title: Advancing science and engineering with Antigravity's /teamwork
    url: https://research.google/blog/advancing-science-engineering-with-antigravitys-teamwork-feature/
    source: Google Research (via Hacker News)
    category: tech_articles
  - title: Lovable apps expose passport details and more than 200K private messages
    url: https://www.crissyfield.de/research/lovable-en/
    source: Crissy Field (via Hacker News)
    category: tech_articles
  - title: "Gemini Decisions API: Fast, calibrated multimodal decisions"
    url: https://blog.google/innovation-and-ai/technology/developers-tools/gemini-decisions-api/?utm_source=tldrit
    source: Google (via TLDR)
    category: newsletters
  - title: How Pinterest Improved Analytics Agent Compliance with Loop Engineering
    url: https://medium.com/pinterest-engineering/how-pinterest-improved-analytics-agent-compliance-with-loop-engineering-d3c52d0abaa2?source=rss-ef81ef829bcb------2
    source: Pinterest Engineering
    category: product_news
  - title: Bye Bye, Dial
    url: https://ampcode.com/news/bye-bye-dial
    source: Amp News
    category: product_news
  - title: Formalizing US Tax Code (Using Lean)
    url: https://lexifina.com/blog/formalizing-the-us-tax-code
    source: Lexifina (via Hacker News)
    category: tech_articles
  - title: Parents pay $75k for Alpha's AI school. Half of its students missed math
      target
    url: https://fortune.com/2026/11/14/alpha-school-ai-students-tuition-learning-goals/
    source: Fortune (via Hacker News)
    category: tech_articles
highlights:
  - Google says /teamwork agents produced a 170k-line Rust port of libgav1 with
    bit-exact parity, running 20-30% faster than the C++
  - 24,664 of 34,545 Supabase-backed Lovable sites sent database rows on load
    without login
  - "Gemini Decisions API: up to 1,000 questions per request, 150-250 ms
    latency, $0.10 per 1M input tokens, output free"
  - Pinterest measured a 10.3% verdict flip rate between identical eval runs
    over 223 cases
  - Amp's Dial is gone; Staff Pick defaults to Claude Opus 5.5
---

Google Research says a team of Gemini agents rewrote libgav1, the AV1 video decoder, into roughly 170,000 lines of Rust that match the C++ original bit for bit and run 20 to 30 percent faster. That is one line in Vahab Mirrokni's [November 13 post on Antigravity's /teamwork feature](https://research.google/blog/advancing-science-engineering-with-antigravitys-teamwork-feature/), and the rest of the list is just as large: the Courtade–Kumar conjecture from 2013 proved in full generality and formalized in Lean 4 at a claimed 50 million lines, a 1.8-million-line Lean formalization of the Weil conjectures spread across 28,800 subagent invocations, a 9x9 Go engine that gained about 2,600 Elo in under eight days, and a Borg scheduling change that cut TPU workload preemption by 24 percent on some hardware types. The runs used Gemini 4 Argon, Carbon, and Hydrogen under /teamwork, and Google is offering 10,000 academic researchers six months of free access at the top usage tier. The numbers are Google's own and unreviewed, but the shape of the claims matters more than any one of them. Nearly every result pairs a swarm of agents with a mechanical checker (a proof assistant, a bit-exact diff against a reference decoder, an Elo ladder), which is where long multi-agent runs can actually be trusted.

The counterweight arrived a day later. Crissy Field GmbH, working with Handelsblatt, [scanned 159,041 Lovable projects](https://www.crissyfield.de/research/lovable-en/) found through Common Crawl between December 2025 and September 2026. Of the 34,545 that used Supabase, 24,664 sent database records to the browser on page load without any login, and read-only follow-up requests turned up email addresses in 10,560 tables across 7,403 of those sites. The worst cases were concrete: a German lifestyle forum exposing more than 80,000 profiles and more than 200,000 chat messages, and a service provider leaking passport numbers. The authors say their 30 percent figure is not a confirmed leak rate and that the sample does not represent all Lovable apps, but the pattern is familiar from every app builder that defaults to a client-side database key: the generated code works, and the row-level security that should sit behind it never gets written. The post drew 219 points on Hacker News on November 14.

Google also shipped something smaller and more immediately useful. The [Gemini Decisions API](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-decisions-api/?utm_source=tldrit), announced November 11, runs a dedicated model, gemini-decision-1, that answers questions instead of generating text: yes/no, a choice among 2 to 255 options, or a score on an ordered rubric, each with a confidence value between 0 and 1. A single request can carry up to 1,000 questions over 256K tokens of text, images, audio, video, or PDF, end-to-end latency is 150 to 250 ms, and pricing is $0.10 per million input tokens with output free. Google puts it at nearly 5x cheaper than Gemini 3.5 Flash-Lite on its shared benchmark suite and says Gemini Notebook's routing got up to 40 percent faster on it. For anyone running an LLM as a classifier, router, or eval labeler with a JSON-mode prompt, this is a direct replacement with calibrated confidences attached, and the confidence field is the part worth testing first.

Pinterest's engineering blog published the most transferable piece of the stretch: [how its Analytics Agent's compliance was tuned with what the team calls loop engineering](https://medium.com/pinterest-engineering/how-pinterest-improved-analytics-agent-compliance-with-loop-engineering-d3c52d0abaa2?source=rss-ef81ef829bcb------2). Hand-revising the system prompt had plateaued at 64 percent compliance on one rule, and one scope guardrail made the agent refuse an in-scope storage-cost question without searching. The fix was an automated loop with paired "required" and "skip" suites for every rule, so a prompt that says "always search dashboards" cannot score perfectly by over-triggering, plus a regression suite, a holdout set, and three gates (fixed more than it broke, a critic checking for hard-coded test answers, no regression elsewhere). The team tried a persistent session, which got expensive as context grew, and a memoryless Ralph Wiggum loop, which cost about a fifth as much but repeated its own failures; the version that worked starts each iteration fresh and hands it a structured record of scores, failing cases, the best change so far, and what not to retry. The most useful finding is the noise floor: running identical code twice over the same 223 cases flipped 10.3 percent of verdicts, which is why the first big run's 89.3 percent turned out to be one good edit followed by ten idle iterations.

Amp, on November 12, [retired its Dial](https://ampcode.com/news/bye-bye-dial), the low/medium/high/ultra control it shipped in July to keep model names out of users' way. Bring-your-own subscriptions broke the abstraction, because the mode now decided whether your Claude plan, your ChatGPT plan, or Amp credits paid for a thread. The replacement is a per-thread model and effort selector that shows who gets billed, allows switching mid-thread (each model keeps its own system prompt and tools, and the first message after a switch is read uncached), and defaults to a Staff Pick, currently Claude Opus 5.5. The post also lists what the Dial was running underneath: GLM-5.3-Flash for low, Opus 5.5 for medium, GPT-6 Astra for high, and Claude Fable 5.2 for ultra.

Two more items fit the verification theme. Lexifina [translated Title 26 of the US Code into Lean](https://lexifina.com/blog/formalizing-the-us-tax-code) as of the November 3 release and reports 257 findings, 138 of them real faults, each with a certificate Lean re-checks in about two and a half minutes. Against 5,000 households its 2025 income-tax model agreed with PolicyEngine-US on every figure for 4,993; the other seven differed by at most $11, all in the EITC, and the open-source UsTaxes turned out to have 14 bugs. The authors note that AI agents did the drafting and review and nobody has had a lawyer or CPA check it, and their own line, "Agreement is not truth," is the right reading of the cross-check. And Fortune [reported on Alpha School's internal numbers](https://fortune.com/2026/11/14/alpha-school-ai-students-tuition-learning-goals/): at up to $75,000 a year, only 42 percent of students met the promise of learning twice as fast in math and reading, about half of its K-8 private-campus students missed the math target, and only 37 percent of students who started behind hit the 2x goal by winter. More than 2,600 public school students in Texas and South Carolina already use the platform.

Google's 10,000 free research seats are worth following: if outside groups can reproduce bit-exact ports and machine-checked proofs with /teamwork, the open question shifts from whether agents can do long work to which domains have a checker strict enough to let them.

---

*Sourcing note: the code-intel-copilot feed stalled after its last ingest on 2026-11-16 (newest item 08:26 UTC; the mirror reports its last sync on 2026-09-01), so nothing from November 20 to 22 was available. Everything above was published November 11 to 15 and had not been featured in an earlier issue.*
