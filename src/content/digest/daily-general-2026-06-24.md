---
title: Anthropic Puts Claude in Slack
cadence: daily
track: general
origin: auto
date: 2026-06-24
summary: Anthropic launched Claude Tag, a shared multiplayer agent that lives in
  Slack channels, distributed the same day via AWS Marketplace. Memory became
  the through-line across an arXiv preprint and Bedrock AgentCore's
  cross-account update, while GitHub Copilot added bring-your-own-key and Cursor
  shipped team marketplaces.
topics:
  - agent-tooling
  - model-infrastructure
  - agent-memory
  - agent-security
  - open-models
audioUrl: /media/digests/daily-general-2026-06-24.mp3
durationSec: 518
items:
  - title: Claude Tag is now available in beta via Claude Enterprise in AWS
      Marketplace
    url: https://aws.amazon.com/about-aws/whats-new/2026/06/claude-tag-aws-marketplace/
    source: AWS What's New
    category: product_news
  - title: Are We Ready For An Agent-Native Memory System?
    url: https://arxiv.org/abs/2606.24775
    source: arXiv cs.IR
    category: research
  - title: GitHub Copilot app support for BYOK
    url: https://github.blog/changelog/2026-06-23-github-copilot-app-support-for-byok
    source: GitHub Blog
    category: product_news
  - title: Cursor team marketplaces, plugin leaderboard, and prebuilt canvases
    url: https://rss.xcancel.com/cursor_ai/status/2069512597628440908#m
    source: Cursor / @cursor_ai
    category: product_news
  - title: How GPT-5 helped immunologist Derya Unutmaz solve a 3-year-old mystery
    url: https://openai.com/index/gpt-5-immunology-mystery
    source: OpenAI News
    category: product_news
  - title: AI agent security needs a composition graph, not just an SBOM
    url: https://openaca.dev/blog/your-agent-risk-is-in-the-composition/
    source: Hacker News
    category: community
  - title: "Z.ai post-IPO: GLM as the world's top open model"
    url: https://rss.xcancel.com/swyx/status/2069598378191941835#m
    source: swyx / @swyx
    category: community
  - title: Semantic Search in Under 3MB
    url: https://blog.lukesalamone.com/posts/creating-tiny-semantic-search/
    source: Hacker News
    category: community
highlights:
  - "Anthropic launched Claude Tag in beta: a shared multiplayer agent that
    lives in selected Slack channels, distributed same-day through AWS
    Marketplace for Claude Enterprise."
  - GitHub Copilot added bring-your-own-key (OpenAI, Azure, Anthropic, LM
    Studio, Ollama, any OpenAI-compatible); Cursor shipped team marketplaces
    across GitLab, Bitbucket, and Azure DevOps.
  - "Memory was the week's through-line: an arXiv preprint pushed agent-native
    memory as a first-class capability as AWS made Bedrock AgentCore Memory
    cross-account."
---

Anthropic put Claude inside Slack. Claude Tag, in beta as of the last day, gives a team a shared agent that lives in selected channels, follows the conversation, and acts in it. You grant it access to specific channels, connect it to whichever tools and data you want it touching, and it participates instead of waiting to be DM'd a prompt. Latent Space's [AINews led with it](https://www.latent.space/p/ainews-claude-tag-multiplayer-proactive) under the framing "multiplayer, proactive, persistent," and distribution landed the same day through [AWS Marketplace](https://aws.amazon.com/about-aws/whats-new/2026/06/claude-tag-aws-marketplace/), where Claude Enterprise customers can switch it on without a separate procurement path.

The shift worth noticing is from one-human-one-thread to an agent several people share state with. That is a different surface than a coding agent in your terminal. Who it listens to when two people disagree in a channel, what it volunteers unprompted, and what it carries across a channel's history all become product decisions rather than config you set once. A proactive agent that misreads the room is a new failure mode, and it shows up in the most visible place a team has.

Memory is the quiet substrate under a lot of the week's other plumbing. The arXiv preprint ["Are We Ready For An Agent-Native Memory System?"](https://arxiv.org/abs/2606.24775) argues that bolting a vector store onto an agent is not the same as giving it memory an agent can reason over, and proposes evaluating persistence as a first-class capability rather than a retrieval add-on. The vendors are converging on the same problem from the infrastructure side: AWS made [Bedrock AgentCore Memory cross-account](https://aws.amazon.com/about-aws/whats-new/2026/06/agentcore-memory-cross-account-access) so memory resources and the agents consuming them can span separate accounts. When the research and the cloud changelogs land on the same week, it usually means the field has decided where the next bottleneck is.

GitHub shipped [bring-your-own-key for the Copilot app](https://github.blog/changelog/2026-06-23-github-copilot-app-support-for-byok). Agent sessions can now run against your own provider keys, including OpenAI, Azure OpenAI, Microsoft Foundry, Anthropic, LM Studio, Ollama, and anything OpenAI-compatible. For anyone who has watched Copilot's routing decide which model handles a task, BYOK is the lever to pin a session to the model and the billing relationship you actually want, and it pulls local runtimes like Ollama into the same surface as the hosted frontier labs.

Cursor pushed in the opposite direction, toward shared team setup. The new Customize page adds [team marketplaces for GitLab, Bitbucket, and Azure DevOps](https://rss.xcancel.com/cursor_ai/status/2069512597628440908#m) alongside local repos, plus a leaderboard of the most-used plugins, skills, and MCPs across your team that you can adopt with one click. The throughline with Copilot's BYOK is that both tools are treating "which models, plugins, and context a team standardizes on" as the thing to manage, now that the per-developer agent is table stakes.

OpenAI published a concrete result rather than a feature: GPT-5 Pro [helped immunologist Derya Unutmaz crack a three-year-old T-cell mystery](https://openai.com/index/gpt-5-immunology-mystery). It is a vendor blog, so read it as one, but the shape of the claim is worth holding onto, a model proposing a mechanistic hypothesis that a domain expert had been stuck on for years, in a field where being wrong is cheap to check at the bench. That is the regime where these tools earn their keep: a human who can verify, working a problem where the search space is the bottleneck.

On the security side, ["AI agent security needs a composition graph, not just an SBOM"](https://openaca.dev/blog/your-agent-risk-is-in-the-composition/) makes a sharp point as agents grow more interconnected. A software bill of materials tells you which components you ship; it says nothing about how an agent's tools, data sources, and sub-agents compose at runtime, which is exactly where the risky paths live. The argument tracks the recent run of agent-RCE and tool-privilege findings: the vulnerability is rarely one component, it is the edge between two of them that nobody audited.

Market context arrived from [swyx](https://rss.xcancel.com/swyx/status/2069598378191941835#m), noting that Z.ai IPO'd in January at HK$120 a share and now ships what he calls the undisputed top open model, having passed DeepSeek. It is one practitioner's read, but it puts a number on a story that has been building through GLM-5.2's benchmark run: the open-weight frontier is now a financed, public-company effort, not a research-lab side project.

Closing on something hands-on, ["Semantic Search in Under 3MB"](https://blog.lukesalamone.com/posts/creating-tiny-semantic-search/) walks through building usable semantic search that fits in a few megabytes. For anyone wiring retrieval into a local coding agent, the constraint is the point: small enough to ship in the client, no server round-trip, no embedding API bill.

What to watch next is whether shared-context agents like Claude Tag develop the same governance scaffolding the terminal agents are growing, permissions, audit, and a clear answer to who the agent works for when a channel disagrees with itself.
