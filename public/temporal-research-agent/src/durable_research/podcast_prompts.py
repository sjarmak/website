from __future__ import annotations

from durable_research.podcast_models import PodcastEpisode, PodcastSeries


def research_prompt(series: PodcastSeries, episode: PodcastEpisode) -> str:
    frontier_note = (
        "\nThis is the FRONTIER episode. Use the ranked open problems from the "
        "series research plan as the spine."
        if episode.frontier
        else ""
    )
    return f"""Research ONE podcast episode in the "{series.name}" series.

EPISODE {episode.number}: {episode.title}
FOCUS: {episode.focus}
SEED sources already known: {", ".join(episode.seeds) or "none"}
{frontier_note}

Run 5-9 searches across SciX and Code Intelligence Digest to find additional
on-target sources. Confirm scholarly records before citing them. Identify the
key technical findings, contrasts, named systems, evaluation evidence, and one
or two concrete examples usable in a podcast cold open.

Return a structured research artifact with:
- key="{episode.key}"
- new_bibcodes=[confirmed scholarly identifiers not already listed as seeds]
- key_findings=6-12 grounded Markdown bullets

Never fabricate a bibcode, title, result, or URL."""


def deep_dive_prompt(
    series: PodcastSeries,
    episode: PodcastEpisode,
    *,
    research_ref: str,
) -> str:
    return f"""Write a rigorous DEEP-DIVE document of 1500-2500 words for one
podcast episode.

SERIES: {series.name}
EPISODE {episode.number}: {episode.title}
FOCUS: {episode.focus}
SEED sources: {", ".join(episode.seeds) or "none"}
RESEARCH ARTIFACT: {research_ref}

Structure:
# {episode.title} — Deep Dive
## The core framing
## Why it matters
## The mechanism and technical substance
## Tensions, contrasts, and dissent
## Evidence & evaluation
## Practical takeaways
## Key sources

Ground every empirical claim in the research artifact. Cite scholarly records
by confirmed identifier and engineering sources by title and URL; never fabricate
a source."""


def podcast_script_prompt(
    series: PodcastSeries,
    episode: PodcastEpisode,
    *,
    deep_dive_ref: str,
) -> str:
    return f"""Write a podcast SCRIPT for the "Code Intel Digest — {series.name}"
series.

THIS EPISODE: Episode {episode.number} — {episode.title}
PRIMARY SOURCE: {deep_dive_ref}

# Code Intel Digest — {series.name}, Episode {episode.number}: {episode.title}

**Series:** {series.name} ({episode.number} of 5)
**Target runtime:** ~20 minutes (~3,000 words spoken)
**Segments:** 6 + cold open + outro

## COLD OPEN
Use a vivid concrete scenario from the deep dive.

## INTRO
Situate the episode in the series.

## SEGMENT 1..6
For each segment: claim, evidence from named sources, contrast or dissent, and
a concrete takeaway.

## OUTRO
Recap, one thing to watch, and one concrete action.

## Citations
List every source cited in prose.

VOICE: conversational, single-voice, and suitable for speech. Do not invent
claims or citations; every claim must trace to the deep dive."""


def series_review_prompt(
    series: PodcastSeries,
    episodes: tuple[PodcastEpisode, ...],
    deep_dive_refs: tuple[str, ...],
) -> str:
    episode_list = "\n".join(
        f"- Episode {episode.number}: {episode.title}" for episode in episodes
    )
    artifact_list = "\n".join(f"- {reference}" for reference in deep_dive_refs)
    return f"""Write a comprehensive LITERATURE REVIEW for the "{series.name}" topic.

Episodes:
{episode_list}

Deep-dive artifacts:
{artifact_list}

Structure:
# {series.name} — Literature Review
## Scope & method
## Landscape
## Cross-cutting themes
## Open problems & the frontier
## Practical implications
## References

Synthesize across the episode deep dives rather than concatenating them.
Preserve disagreements and evidence quality. Never fabricate a source."""
