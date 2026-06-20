---
title: Embertide
status: active
domain: art
summary: A browser co-op deck-builder in the Slay-the-Spire / Ascension lineage, rendered entirely in hand-authored stained-glass art and tuned to be readable by a six-year-old.
role: Creator
repo: https://github.com/sjarmak/embertide
play: /games/embertide/index.html
tech: [React, Zustand, Vite, TypeScript]
order: 15
tags: [game, side-project]
---

Embertide is a single-screen cooperative deck-builder that runs with no backend — React 19, Zustand, and Vite compiled to a static bundle, state in local storage only, no accounts and no tracking. Two players share one board, buy from a common market, fight the bosses guarding each zone, and win or lose together. The design target is unusual: it had to be legible and playable by a six-year-old, so readability and contrast are first-class constraints rather than polish — every color is a design token, the tap targets are a full 44px, and the rules text is sized so it never clips on a card face.

The whole game is rendered in an "Elysian Cathedral" visual language: every card, boss, and zone backdrop is a stained-glass panel with leaded outlines under a gold-leaf arch. The art is a hybrid pipeline — a deterministic SVG illustration composer for the structural layers, plus 2K raster panels generated through a fal.ai briefing system where each asset is reproducible from a committed prompt. The engine underneath is a pure resolver: combat and economy are functions over explicit state with the Zustand store kept at the edges, which keeps the rules unit-testable in isolation behind a couple thousand tests, balance simulations, and accessibility gates that run on every change.
