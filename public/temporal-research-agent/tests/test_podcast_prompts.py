from durable_research.podcast_models import PodcastEpisode, PodcastSeries
from durable_research.podcast_prompts import (
    deep_dive_prompt,
    podcast_script_prompt,
    research_prompt,
    series_review_prompt,
)

SERIES = PodcastSeries(
    key="mas",
    name="Multi-Agent Orchestration",
    file_prefix="multiagent-orchestration",
)
EPISODE = PodcastEpisode(
    series_key="mas",
    number=5,
    slug="frontier-and-open-problems",
    title="Frontier & Open Problems",
    focus="Causal failure attribution and durable shared team memory.",
    seeds=("2025arXiv250313657C", "2026arXiv260507935X"),
    frontier=True,
)


def test_research_prompt_preserves_the_original_episode_contract() -> None:
    prompt = research_prompt(SERIES, EPISODE)

    assert "Research ONE podcast episode" in prompt
    assert "EPISODE 5: Frontier & Open Problems" in prompt
    assert "5-9" in prompt
    assert "SciX" in prompt
    assert "Code Intelligence Digest" in prompt
    assert "FRONTIER episode" in prompt
    assert "new_bibcodes" in prompt
    assert "key_findings" in prompt


def test_deep_dive_prompt_preserves_length_structure_and_grounding() -> None:
    prompt = deep_dive_prompt(
        SERIES,
        EPISODE,
        research_ref="pipeline/research/mas-ep5.md",
    )

    assert "1500-2500 words" in prompt
    assert "Tensions, contrasts, and dissent" in prompt
    assert "Evidence & evaluation" in prompt
    assert "never fabricate" in prompt
    assert "pipeline/research/mas-ep5.md" in prompt


def test_script_prompt_preserves_the_original_delivery_contract() -> None:
    prompt = podcast_script_prompt(
        SERIES,
        EPISODE,
        deep_dive_ref="pipeline/deep-dives/mas-ep5.md",
    )

    assert "podcast SCRIPT" in prompt
    assert "Target runtime:** ~20 minutes" in prompt
    assert "Segments:** 6 + cold open + outro" in prompt
    assert "VOICE: conversational" in prompt
    assert "pipeline/deep-dives/mas-ep5.md" in prompt


def test_series_review_prompt_fans_in_the_episode_deep_dives() -> None:
    prompt = series_review_prompt(
        SERIES,
        (EPISODE,),
        ("pipeline/deep-dives/mas-ep5.md",),
    )

    assert 'LITERATURE REVIEW for the "Multi-Agent Orchestration" topic' in prompt
    assert "Cross-cutting themes" in prompt
    assert "Open problems & the frontier" in prompt
    assert "pipeline/deep-dives/mas-ep5.md" in prompt
