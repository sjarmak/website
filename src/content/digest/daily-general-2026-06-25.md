---
title: Open weights match Opus at half the cost, and ship free in Devin
cadence: daily
track: general
origin: auto
date: 2026-06-25
summary: "Open-weight models crossed from benchmarks into default tooling: GLM
  5.2 matched Claude Opus on 45 terminal-bench tasks at under half the cost,
  Cognition shipped GLM 5.2 and Kimi K2.7 free in Devin, and an essay on their
  'unbearable cheapness' topped Hacker News. Google DeepMind brought computer
  use to the cheap Gemini 3.5 Flash tier, while a Sentry-key hijack of Claude
  Code, Cursor, and Codex headlined a run of agent-identity news. The connective
  theme: meta-harnesses, and the shift of agent work from building to
  operating."
topics:
  - open-weight-models
  - model-economics
  - agent-tooling
  - computer-use
  - agent-security
  - agent-harness
  - agentops
audioUrl: /media/digests/daily-general-2026-06-25.mp3
durationSec: 568
items:
  - title: The Unbearable Cheapness of Open Weight Models
    url: https://jamesoclaire.com/2026/06/25/the-unbearable-cheapness-of-open-weight-models/
    source: "Hacker News: Front Page"
    category: tech_articles
  - title: Introducing computer use in Gemini 3.5 Flash
    url: https://deepmind.google/blog/introducing-computer-use-in-gemini-3-5-flash/
    source: Google DeepMind Blog
    category: product_news
  - title: "AgentJacking: a public Sentry key is all it takes to hijack Claude Code,
      Cursor, and Codex"
    url: https://thenewstack.io/agentjacking-sentry-mcp-attack/
    source: The New Stack
    category: ai_dev
  - title: "[AINews] It's Meta-Harness Summer"
    url: https://www.latent.space/p/ainews-its-meta-harness-summer
    source: Newsletter Misc
    category: newsletters
  - title: Grab Builds Secure Agentic AI Workload Platform (Palana)
    url: https://www.infoq.com/news/2026/06/grab-ai-platform/
    source: InfoQ
    category: tech_articles
  - title: Delegate tasks to Cursor directly from Notion, built on the Cursor SDK
    url: https://rss.xcancel.com/cursor_ai/status/2069872515548340407#m
    source: Cursor / @cursor_ai
    category: product_news
  - title: "Config 2026: New materials, new tools and a more expressive canvas"
    url: https://www.figma.com/blog/config-2026-recap/
    source: Figma Blog
    category: product_news
highlights:
  - GLM 5.2 matched Claude Opus on 45 terminal-bench tasks at under half the
    cost; Cognition shipped GLM 5.2 and Kimi K2.7 free in Devin Desktop and CLI.
  - Google DeepMind put computer use into Gemini 3.5 Flash, moving GUI control
    to its fast, low-cost tier.
  - "AgentJacking: a single public Sentry key can hijack Claude Code, Cursor,
    and Codex through the Sentry MCP integration."
  - swyx's AINews named the season 'Meta-Harness Summer' as Grab, Slack, and
    Microsoft pushed agent work from building toward operating.
---

GLM 5.2 matched Claude Opus on 45 terminal-bench coding-agent tasks in a real shell, graded by each task's own hidden tests, at less than half the cost. That [head-to-head from Entelligence](https://www.reddit.com/r/LLMDevs/comments/1uemv44/glm52_matched_claude_opus_on_45_terminalbench/) ran inside Claude Code on binary pass/fail, no partial credit, no model-as-judge. The same day, Cognition put open weights where the result actually lands: [GLM 5.2 and Kimi K2.7 Code are now free in Devin Desktop and CLI](https://rss.xcancel.com/cognition/status/2069918309869633913#m), scoring 43.0% and 39.5% on Cognition's own FrontierCode Extended benchmark for real engineering tasks. James O'Claire's ["The Unbearable Cheapness of Open Weight Models"](https://jamesoclaire.com/2026/06/25/the-unbearable-cheapness-of-open-weight-models/) hit the Hacker News front page hours later with the obvious conclusion: when a model you can run yourself clears the bar a production agent needs, the price floor stops being set by the lab.

This is the thread that's been building for two weeks finally crossing into default tooling. The earlier GLM 5.2 wave was benchmarks and vibe checks; the new part is a frontier coding agent shipping open weights for free and a price-of-intelligence essay topping HN the same morning. The pressure now runs in one direction. If GLM 5.2 and Kimi K2.7 close most of the gap at a fraction of the token cost, the question for anyone running a coding agent at scale shifts from "which model is best" to "what am I paying for the last few points."

## Computer use gets cheap

Google DeepMind put [computer use into Gemini 3.5 Flash](https://deepmind.google/blog/introducing-computer-use-in-gemini-3-5-flash/), moving GUI and browser control down to its fast, low-cost tier. Computer use is not new across labs, but it has mostly run on the expensive models, which kept screen-driving agents in demo territory for cost reasons. Putting it on Flash changes the math for anything that loops over a browser hundreds of times: form-filling, QA passes, scraping behind a login. The economics that make a screen-agent viable at scale are the same economics the open-weight story is about, from a different angle.

## A public Sentry key can hijack your coding agent

The sharpest practitioner risk in the window: [a single public Sentry DSN is enough to hijack Claude Code, Cursor, and Codex](https://thenewstack.io/agentjacking-sentry-mcp-attack/) through the Sentry MCP integration. AgentJacking turns a key that was never treated as a secret into a path to drive the agent. It lands amid a run of agent-identity news over the last day or two: Cisco [acquired WideField](https://www.crn.com/news/security/2026/cisco-bets-on-widefield-security-acquisition-to-tackle-agentic-ai-security-gap) to secure non-human identities, [Identiverse 2026](https://www.scworld.com/perspective/lessons-from-identiverse-2026) centered on the identity gap behind agents, Cloudflare shipped [self-managed OAuth for all](https://blog.cloudflare.com/oauth-for-all/), and GitHub added [break-glass credential revocation](https://github.blog/changelog/2026-06-24-self-service-credential-revocation-for-incident-response) so an enterprise owner can kill every credential for a compromised user at once. The pattern: agents are now principals with tool access, and the controls are racing to treat them like ones that can be tricked.

## Meta-harness summer

swyx's AINews called the season ["Meta-Harness Summer"](https://www.latent.space/p/ainews-its-meta-harness-summer): the field's current obsession is not the agent but the architecture around it. The framing traces a line from Conductor to bets like Omnigent, an open, pluggable harness for pulling any coding or knowledge-work agent into one standardized, secure, scalable system. The supporting evidence is all over the window: IBM Research shipped [CUGA, a lightweight harness with two dozen working agentic-app examples](https://huggingface.co/blog/ibm-research/cuga-apps), and Lenny's ran a [29-minute teardown of how to design agent loops](https://www.lennysnewsletter.com/p/how-i-ai-how-to-write-ai-agent-loops). The interesting question underneath, asked bluntly in r/LLMDevs, is whether you [eval the whole harness or each of its parts](https://www.reddit.com/r/LLMDevs/comments/1uemgi7/do_you_eval_the_whole_harness_or_each_of_its_parts/), local optima in individual prompts and tools versus the system behavior that actually ships.

## The hard part moved to operations

Multiple teams said the same thing in the last day or two from different vantage points: building an agent is now the easy part, and running it in production is where the work is. Grab's security team built [Palana, a Kubernetes-native secure execution platform](https://www.infoq.com/news/2026/06/grab-ai-platform/) to contain model-driven tool use and prompt-injection risk at the infrastructure level rather than inside the agent's own prompt. Slack [walked through four phases](https://www.infoq.com/news/2026/06/slack-multicloud/) of moving its AI serving from self-managed SageMaker to a multi-cloud setup spanning AWS Bedrock and Google Vertex. Microsoft pitched [agentic observability for cloud operations](https://blogs.microsoft.com/blog/2026/06/23/rethinking-cloud-operations-with-agentic-observability/), and a much-upvoted r/devops post argued you should [stop deploying AI agents like it's 2012](https://www.reddit.com/r/devops/comments/1ueysbv/stop_deploying_ai_agents_like_its_2012/), because the Git-CI-rollback safety net dissolves when system prompts, dynamic memory, and tool permissions change behavior at runtime.

## Tooling platformizes

Cursor turned its agent into a platform other products call: you can now [delegate tasks to Cursor directly from Notion](https://rss.xcancel.com/cursor_ai/status/2069872515548340407#m), built on the Cursor SDK so the delegated work runs on the same models, harness, and runtime as the IDE. Sourcegraph added [automatic compaction to Deep Search](https://rss.xcancel.com/Sourcegraph/status/2069785637692325951#m) when a follow-up nears the context-window limit, the same context-management problem the meta-harness crowd is trying to solve one level up. And Figma's [Config 2026](https://www.figma.com/blog/config-2026-recap/) put motion on a timeline inside the design file, added code layers to the canvas, and extended its design agent with custom tools, context, and skills, the design-tool version of everyone else's move toward agents that carry real context instead of one-shot prompts.

What to watch: AI Engineer World's Fair runs July 1, and the talk-prep chatter from speakers like swyx and Thariq suggests meta-harnesses and open-weight economics will be the loudest hallway conversations. The open question into next week is how fast the price pressure from GLM 5.2 and Kimi K2.7 forces the frontier labs to respond on cost rather than just capability.
