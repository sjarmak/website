---
title: AccountBot
status: active
domain: ai-agents
summary: A Slack-native sales assistant that runs a Claude tool-use loop over a curated target-account corpus, answering go-to-market questions with per-account research, segment cohorts, and campaign assets pulled live from BigQuery, a federated data proxy, and signed object stores.
role: Creator
tech: [Python, Agents, Slack, LLM]
featured: true
featuredOrder: 7
order: 22
topics: [agents]
tags: [bot, automation]
architecture: https://sjarmak.github.io/accountbot-architecture/
---

AccountBot puts an account-intelligence agent in a Slack DM. Sales and marketing users ask questions in natural language ("what's in my book this quarter," "show me the financial-services cohort," "pull the one-pager for account X") and a Claude-driven tool loop resolves them against a curated target-account list and a set of live data and asset backends, relaying only the synthesized answer. It runs as a private service, which is why there's no code link.

The conversation core is a bounded tool-use loop with a hard iteration cap driving roughly 16 registered tools across three concerns: scope (priority list, accounts by owner, accounts by segment), research (per-account intel and a federated data proxy), and content (campaign and per-account assets). The priority scope sources from either a committed CSV or a published BigQuery table ranked by composite ICP score, swappable behind one environment variable with nothing downstream aware of the difference. Deeper questions proxy to a Cloud Function that fronts BigQuery, Looker, PostHog, and HubSpot through function-calling, and generated marketing assets come back as short-lived signed GCS download links. Account scoping is enforced by the tools rather than the model: a Slack user resolves to an owner identity, and an ownership gate authoritatively decides which accounts that caller can see.

Most of the engineering is latency and cost discipline learned in production. Slack demands an acknowledgment within three seconds and LLM turns routinely exceed it, so the bot acks immediately and runs the handler on a background thread; skipping this caused Slack retries and duplicate replies. The system prompt is a cached block with per-caller identity appended as a separate uncached block, so steady-state turns hit the prompt cache and the expensive static instructions stay off the per-turn bill. In local mode the GCP metadata-server token path is skipped outright, avoiding a ~27-second timeout on every call, and BigQuery reads pin the quota project explicitly so they don't inherit a developer's default project and 403.

Delivery is link-only. The bot holds only the chat-write scope, never file upload, so every asset ships as a TTL-bounded signed URL with a per-turn cap on how many links a single turn can mint. The two object stores split by sensitivity: a no-PII marketing store reachable by any caller, and a gated store where the ownership check applies. Transport and backends are env-selected end to end, Socket Mode against a filesystem corpus for local iteration, Flask on Cloud Run with GCS and Firestore in production.
