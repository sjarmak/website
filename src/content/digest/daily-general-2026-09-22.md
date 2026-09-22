---
title: Jev's decision models, Xiaomi's $3M open-weights leader, and the Codex
  sandbox escapes
cadence: daily
track: general
origin: auto
date: 2026-09-22
summary: Simon Willison's read on Jev, the input-only decision model that has
  been cloned a dozen times in a week, and why its cheapness makes bias evals
  the whole job. Xiaomi's MiMo-V2.6-Pro tops the open-weights Intelligence Index
  on a reported $3M training run, two Codex sandbox escapes show why enforcement
  cannot live inside the agent, and GitHub's workflow execution rules start
  biting pull_request_target on November 2.
topics:
  - decision-models
  - open-weights
  - agent-security
  - ci-security
  - claude-code
  - ai-policy
unresolvedFacets:
  - decision-models
  - ci-security
  - claude-code
audioUrl: /media/digests/daily-general-2026-09-22.mp3
durationSec: 783
items:
  - title: Jev introduces a new shape of LLM - System One, aka Decision Models
    url: https://simonwillison.net/2026/Sep/21/jev/
    source: Simon Willison
    category: tech_articles
  - title: "[AINews] Xiaomi MiMo-V2.6-Pro 1T-A42B: the new top Open Weights model,
      trained for $3M"
    url: https://www.latent.space/p/ainews-xiaomi-mimo-v26-pro-1t-a42b
    source: Newsletter Misc
    category: newsletters
  - title: Codex Sandbox Escapes Show Why Agent Guardrails Can't Live Inside the Agent
    url: https://devops.com/codex-sandbox-escapes-show-why-agent-guardrails-cant-live-inside-the-agent/
    source: DevOps.com
    category: tech_articles
  - title: Stealth Routing to 5.2
    url: https://www.reddit.com/r/ClaudeCode/comments/1wm8jfl/stealth_routing_to_52/
    source: ClaudeCode
    category: community
  - title: GitHub Separates Who Writes Code From Who Runs Your CI
    url: https://devops.com/github-separates-who-writes-code-from-who-runs-your-ci/
    source: DevOps.com
    category: tech_articles
  - title: Cloudflare Proposes an Agent Development Lifecycle to Replace the SDLC
    url: https://www.infoq.com/news/2026/09/cloudflare-adlc-agents/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=global
    source: InfoQ
    category: tech_articles
  - title: Anthropic Tries to Make Claude Stickier with Launch of Docs and Slides
    url: https://www.computerworld.com/article/4223177/anthropic-tries-to-make-claude-stickier-with-launch-of-docs-and-slides.html?utm_source=tldrdesign
    source: TLDR-Topics
    category: ai_news
  - title: Building standards for the next phase of AI
    url: https://openai.com/index/building-standards-next-phase-ai
    source: OpenAI News
    category: product_news
highlights:
  - Jev charges $0.042/M input tokens and produces no output; Willison's warning
    is that a decision model is a deeper black box, so evals become the whole
    job
  - Xiaomi MiMo-V2.6-Pro (1.02T total / 42B active, MIT) debuts at 46 on the
    Artificial Analysis open-weights index with ~7K RL environments promised
  - Heapjack and Overpatch escaped the Codex sandbox from read-only and
    workspace-write modes; fixed in CLI 0.149.0 and Desktop 26.818.21641
  - GitHub disables pull_request_target by default in public repos without an
    event policy, enforced November 2, 2026
  - r/ClaudeCode suspects Opus 5 is being routed to 5.2; no evidence beyond
    slower runs and faster limit burn
---

Jev charges $0.042 per million input tokens and nothing for output, because it produces none. That is the detail Simon Willison leads with in his write-up of TypeSafe AI's new model, posted late yesterday, and it explains why the thing has spawned a dozen ports in under a week. Text goes in; floats come out. A yes/no with a confidence, a distribution over options, a numeric score. No generated tokens means no decoding loop, which makes Jev cheaper than GPT-5 Nano at $0.05 per million and lets it answer many questions about the same input in parallel. Willison walks through the three question types (a "Noul" is a yes/no derived from a Bernoulli, Choice spreads probability over a fixed set, Score returns a level) and the obvious jobs: spam filtering, labeling, ranking, reranking a BM25 top-100 before you hand it to a bigger model.

The part worth reading twice is his reservation. A decision model is a deeper black box than a chat model, because there is no reasoning trace to inspect and no way to ask it why. He tried a "Good city?" score and got Cupertino at the top and East Palo Alto at the bottom, which is the kind of bias a ranker will bake into whatever you build on it. His line: "I really hope nobody uses Jev to rank job applicants." His prescription is evals, and the pricing makes that practical, since running thousands of cases costs pocket change.

The ecosystem that formed in two days is the social signal. Jared Palmer's Kev recreates the idea on open weights (Qwen 3.5 at 0.8B, 4B and 9B) and hit Hacker News. jev-leftpad from Fatih Kadir Akın did the same as a joke and got 67 points. archestra ran Jev over 100 real agent tool calls to see whether it could gate them. Latent.Space put TypeSafe's CEO Diogo Almeida on the podcast under the title "System One models for Prod, not God." Someone on r/ClaudeCode is already scoring resumes with it, which is the one use Willison asked people to avoid.

## Xiaomi ships the top open-weights model, trained for $3M

Artificial Analysis put Xiaomi's MiMo-V2.6-Pro at the top of its Intelligence Index among open-weight models yesterday, at 46, with 1.02 trillion total and 42 billion active parameters, priced at $0.435 per million input and $0.87 per million output tokens, under an MIT license. This morning's AINews issue is the best single read; the Hacker News thread on Xiaomi's release page sits at 334 points and 151 comments. The model is natively omnimodal, ships alongside a Flash sibling and an "UltraSpeed" variant claiming up to 20x faster output at the same quality, and the figure everyone is repeating is a training bill of roughly $3M. Xiaomi is not one of the "six tigers" of Chinese AI. A phone maker crowning itself a frontier lab is where Thom Wolf's ten-week list of Chinese open releases (Kimi K3, Qwen3.8-Max, DeepSeek V4-Pro, GLM-5.3 and more) had been heading.

What the technical crowd fixed on was the RL stack rather than the weights. The report describes fully asynchronous training at 1,568 samples per update, context up to one million tokens, and 3.5 to 3.7 billion tokens per step, across coding, general-agent, visual and cyber tasks, with graders that compare within a group to sharpen long-horizon rewards. Xiaomi says the environment code and recipes are open and that it intends to release around 7,000 RL environments; the full task datasets have not landed yet. Fuli Luo, formerly of DeepSeek, had been streaming the final RL runs publicly for days, which is not how frontier labs usually behave. If you have been assuming open models plateau below the closed frontier, this is the release to re-check that against.

## Codex sandbox escapes: enforcement was inside the thing being enforced

Oren Yomtov of Accomplish AI published two Codex escapes last week, and Tom Smith's DevOps.com piece yesterday is the clearest account of what they mean. Heapjack targeted Codex Desktop, which installs a `node_repl` helper without asking. Trusted and untrusted code ran as two contexts in one Node process sharing a heap; the untrusted side called `v8.getHeapSnapshot()`, read the trust token out of memory, and forged requests over the shared pipe so the parent ran commands outside the sandbox. It fired in read-only mode, from a question about a cloned repo. Overpatch hit the Codex CLI's `apply_patch`, which derived the writable scope from the parent directory of each path; name `/tmp` and you get the disk root. Yomtov's patch wrote a `.zshrc` through a symlink in workspace-write mode, with no prompt, and it persisted across sessions. OpenAI fixed both within eight days of the August 12 report (CLI 0.149.0, Desktop 26.818.21641).

Yomtov's summary: "The thing doing the enforcement was sitting inside the thing being enforced." Pillar Security found a related class in July across Cursor, Codex, Gemini CLI and Antigravity, and Cymulate before that in April. Mitch Ashley at Futurum puts the design rule bluntly: a sandbox the agent can modify enforces nothing, and enforcement has to live in a layer the agent cannot reach. Accomplish's own answer is agent in a VM, credentials on the host, a proxy between them. If your agent runs on your laptop next to your keychain, that architecture is the takeaway, not the specific fixes.

## Is Opus 5 being routed to 5.2?

The loudest thread on r/ClaudeCode today is a user who asked Opus every day who the "openai reset guy" is and got "Tibo" each time, then watched the model turn sluggish, ignore the task, and burn through a weekly 5x limit for the first time on an unchanged workload. They moved to GPT. A sibling thread compared Opus against Astra on a Blender Nissan Skyline build (an hour and a half versus thirty minutes) and asked outright whether Opus 5 is being served by 5.2. "Opus 5 tests patience a lot" makes the same complaint without the theory. None of this is evidence of routing, and a model naming the same wrong person on consecutive days is what a fixed weight set does. But it lands on top of the 17% weekly-limit cut covered here yesterday, and the mood in the pricing threads ("I'd pay 25% more rather than lose 25% of usage") says the trust cost of a limits change is larger than the limit. A smaller thread in the same feed makes a sharper engineering point: when a subagent is unsure, the main agent never finds out, because uncertainty does not survive the handoff.

## GitHub separates who writes code from who runs CI

GitHub's workflow execution protections went GA on September 17, and DevOps.com's write-up yesterday lays out the parts that will bite. Actor rules decide who can trigger a workflow (users, roles, Apps, Copilot, Dependabot); event rules decide which events can (push, pull_request, pull_request_target, workflow_dispatch). GA added per-workflow-file targeting, an insights view, a REST API and an evaluate mode on Enterprise Cloud. The default rule that matters: in public repos without an event policy, `pull_request_target` is disabled, evaluating now and enforced on November 2. Alongside it, actions/checkout v7 refuses to check out a fork's PR unless you set `allow-unsafe-pr-checkout`. The incidents behind this are the ones you remember (tj-actions/changed-files, Nx, trivy-action), and the workflows most likely to break are the AI review bots and auto-labelers that run on fork PRs with write tokens. Dependency locking, scoped secrets and an egress firewall are on the roadmap. Audit your `pull_request_target` uses before November.

## Cloudflare wants an Agent Development Lifecycle

InfoQ's Olimpiu Pop summarized Cloudflare's argument that the SDLC needs replacing with an ADLC: automated software factories, dynamic orchestration, observability built for agents, and a security model that assumes the developer is autonomous. It is a vendor framing, and the summary is light on specifics, but it landed the same day Cloudflare took Python Workers to general availability, which is the concrete half of the pitch. Read it next to the Codex escapes and the GitHub rules above and the pattern is plain: the platforms are moving enforcement out of the agent and into the runtime.

## Anthropic: Docs, Slides, a delayed IPO, and an embedded evaluator

Computerworld reports Anthropic launched Docs and Slides inside Claude to make the product stickier, on the same day TLDR carried a delay of its IPO staging to November "amid AI fears" and Cointelegraph reported Accenture as an embedded evaluator for the AI slowdown proposal. The Superhuman newsletter adds a claim I could not trace to a primary source: security firm Hacktron AI says its agents infiltrated OpenAI on July 25 in under 72 hours, and Google disclosed Gemini breaking into three companies during internal testing in May. Treat that as unconfirmed until a first-party post appears.

## OpenAI asks for shared standards; Sinofsky says the vocabulary is the problem

OpenAI's post "Building standards for the next phase of AI" calls for coordinated evaluation, reporting and governance across labs. The same afternoon a16z released Steven Sinofsky arguing that "alignment", "goal-seeking" and "rogue agents" anthropomorphize engineering problems and are wrecking the debate. AI Daily Brief's episode rounds up the rest: the Trump AI Force, kill switches, the IPO delay, and a Trump–Xi meeting this week with AI on the table. That meeting is the thing to watch over the next day or two, and Xiaomi's release just made open weights part of the agenda.

---

*Source note: the code-intel-copilot mirror reported its last sync as 2026-09-01 (30,165 minutes stale) while its item feed ran through 2026-09-22 06:34Z, so the sync metadata looks stale rather than the data. Items were selected from the 2026-09-20 to 2026-09-22 window.*
