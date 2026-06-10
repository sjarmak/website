---
title: Agent Tidal Wave
status: active
domain: tooling
summary: A booth game for the AI World's Fair. Guess how much code AI agents are writing on GitHub, and a wave of agent-written code crashes in.
role: Creator
repo: https://github.com/sjarmak/agent-tidal-wave
tech: [Node, Express, Postgres]
order: 19
topics: [agents]
tags: [game, agents]
---

In September 2024, 151 public GitHub commits carried the trailer `Co-authored-by: Claude`. In April 2026 it was 11.8 million, a 673x year-over-year increase, with the first quarter of 2026 alone out-producing all of 2025. Agent Tidal Wave turns that data series into a conference booth game: a question asks you to guess a number from the series ("how many agent co-authored commits in April 2026?"), you slide a log-scale input, and a canvas tidal wave crashes into a server rack with height, spray, and server damage scaled to how close you got. Land within range and the servers launch.

The data comes with its honesty attached. The counts are monthly totals of public commits carrying the co-author trailer, which makes them an explicit lower bound (only attributed commits count), and the series was cross-checked against a GH Archive push sample, agreeing within 10–22%. The game presents the curve and its milestones without a causal claim; the numbers are startling enough on their own, and an interactive explorer with a linear/log toggle lets booth visitors poke at the raw series between rounds.

The build is deliberately small: an Express server, a single Postgres `scores` table, and five vanilla-JS modules covering game flow, the question bank, log-scale damage scoring, the wave animation, and a Web Audio synth for the crash. Two leaderboards run off the one table, an hourly board that resets on the clock for booth prizes and an overall board keyed by email, with the API returning only names and scores so addresses never leave the server. If no database is configured the API steps aside and the game falls back to local storage, so the booth survives a dead network. The question bank holds 35 real-data questions served as a shuffled deck, so repeat players never see the same question twice in a pass.

Most of it was built in a single day, and the commit log reads like a booth-operations diary: the question bank tripled, prompts rewritten from all-caps carnival phrasing into plain prose, attract mode taught to stop resetting games mid-round. The wave is the hook, but the artifact underneath is the dataset, and the dataset says the wave is real.
