---
title: Wheel Practice App
status: active
domain: tooling
summary: A Wheel of Fortune practice app built with React Native and Expo, three game modes, real puzzle packs, seeded for repeatable practice.
role: Creator
repo: https://github.com/sjarmak/WheelOfFortune
architecture: https://sjarmak.github.io/WheelOfFortune/
play: /games/wheel-of-fortune/index.html
tech: [React Native, Expo, TypeScript]
order: 20
tags: [app, side-project]
---

17,254 puzzles: 11,256 from the show's first twenty seasons, 5,724 from seasons 40–42 with full category and round-type metadata, a 220-puzzle kid pack, and a 54-puzzle starter set, ingested through a small data pipeline from CSV and JSON sources. Three modes mirror the show: the main game with an authentic 24-wedge wheel (21 cash wedges from $500 to $2,500, two bankrupts, one lose-a-turn), toss-ups where letters reveal one per second until someone buzzes, and the bonus round with RSTLNE pre-revealed, three consonants and a vowel to pick, and a 20-second solve timer.

The engine is a pure reducer over explicit turn states, with all randomness routed through a seeded Mulberry32 generator, so the wheel landing and the toss-up reveal order are deterministic per seed and a practice session is exactly repeatable. There are two builds from a shared design: a React Native and Expo app, and a Vite web build that deploys under this site at [/games/wheel-of-fortune](/games/wheel-of-fortune/index.html), built with an explicit base path because the default root-relative asset URLs 404 on a subpath deploy and render a blank page. State persists to local storage only, with no accounts and no tracking.

The engineering story worth recording is the toss-up timer. The original implementation ticked on a fixed `setInterval`, and iOS Safari throttles or suspends intervals in Low Power Mode, during scroll, and in backgrounded tabs, so on a phone the letters simply never revealed. The rewrite drives the reveal from a `requestAnimationFrame` loop that measures real elapsed wall-clock time and feeds the measured delta into the reducer, with a visibility-change handler that rebases the clock when the tab returns. Reveals self-correct after any throttling instead of dumping accumulated ticks in a burst, and pausing falls out for free because the frame loop stops when the page isn't painting. The fix was verified on the engine iOS actually uses, with a Playwright WebKit test polling the revealed-tile count to confirm progressive reveal under throttling.

The suite is 46 test files across the engine, both apps, and the ingestion pipeline, plus a strategy-analytics layer that computes letter frequencies and category bias per pack for anyone who wants to practice like they mean it.
