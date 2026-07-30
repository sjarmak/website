from pathlib import Path

PROJECT = Path(__file__).parents[1]


def test_deck_has_requested_title_code_comparison_skill_and_demo_frames() -> None:
    deck = (PROJECT / "deck.html").read_text()

    assert "Temporal lets us bring a research agent back to life" in deck
    assert "Improving the durability of our research pipeline using Temporal's Python SDK" in deck
    assert "A real before-and-after rewrite" not in deck
    assert "The same Temporal Workflow run" not in deck
    comparison = deck.split('id="code-comparison"', 1)[1].split("</section>", 1)[0]
    assert "phase('Research')" in comparison
    assert "workflow.execute_activity" in comparison
    assert "researchPrompt" not in comparison
    assert "run-durable-research" in deck
    assert "any agent on this workstation" in deck
    assert "TEMPORAL WORKFLOW" in deck
    assert "Temporal owns" not in deck
    slide_seven = deck.split('aria-label="Slide 7 of 10"', 1)[1].split("</section>", 1)[0]
    assert "<video controls" in slide_seven
    assert "temporal-literature-review-demo.mp4" in slide_seven
    assert deck.count('class="slide') == 10

    for asset in (
        "worker-killed.png",
        "workflow-completed.png",
        "activity-attempt-two.png",
    ):
        assert f"deck-assets/{asset}" in deck
        assert (PROJECT / "deck-assets" / asset).is_file()


def test_readme_and_blog_do_not_imply_public_reproducibility() -> None:
    readme = (PROJECT / "README.md").read_text()
    blog = (PROJECT / "blog.md").read_text()

    assert "workstation-only" in readme
    assert "workstation-only" in blog
    assert "Run it from this directory:" not in readme
    assert "Recreate all recording evidence" not in readme
    assert "from any agent on this workstation" in readme
    assert "Temporal engineers" not in readme
    assert "Temporal engineers" not in blog
    assert "Temporal owns" not in readme
    assert "Temporal owns" not in blog
    assert "## Presentation materials" not in readme


def test_brief_alignment_covers_deliverables_and_evaluation_criteria() -> None:
    alignment = (PROJECT / "brief-alignment.md").read_text()

    for heading in (
        "## Objective",
        "## Conversion requirements",
        "## Presentation questions",
        "## Deliverables",
        "## Evaluation criteria",
        "## Honest limitation",
    ):
        assert heading in alignment
    for criterion in (
        "Technical depth",
        "Clarity of explanation",
        "Developer empathy",
        "Code quality",
    ):
        assert criterion in alignment
