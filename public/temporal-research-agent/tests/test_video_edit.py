import json
from pathlib import Path

import pytest

from durable_research.video_edit import EditPlanError, load_edit_plan


def valid_plan() -> dict[str, object]:
    return {
        "canvas": {
            "width": 1920,
            "height": 1080,
            "content_width": 1320,
            "panel_x": 1320,
            "panel_width": 600,
            "stripe_width": 4,
            "highlight_stroke_width": 3,
        },
        "summary": {
            "duration_s": 10,
            "title": "The research code + Temporal",
            "existing_heading": "THE CODE ALREADY PROVIDED",
            "existing_lines": [
                "SciX + Digest retrieval",
                "Parallel research angles",
                "Cited report + provenance",
            ],
            "temporal_heading": "ADDING TEMPORAL PROVIDES",
            "temporal_lines": [
                "Durable Workflow state",
                "Activity retries + recovery",
                "Progress + Event History",
            ],
        },
        "beats": [
            {
                "id": "live",
                "source": "terminal",
                "mode": "clip",
                "start_s": 0,
                "end_s": 3,
                "label": "LIVE",
                "caption_lines": ["Two Activities start", "on the first Worker."],
                "crop": {"x": 0, "y": 0, "width": 1920, "height": 1080},
                "highlights": [],
            },
            {
                "id": "kill-pause",
                "source": "terminal",
                "mode": "freeze",
                "at_s": 2.8,
                "duration_s": 8,
                "label": "PAUSED: FAILURE POINT",
                "caption_lines": ["The Worker is killed.", "The Workflow stays open."],
                "crop": {"x": 0, "y": 0, "width": 1920, "height": 1080},
                "highlights": [{"x": 20, "y": 20, "width": 1000, "height": 100}],
            },
            {
                "id": "retry-pause",
                "source": "webui",
                "mode": "freeze",
                "at_s": 9,
                "duration_s": 8,
                "zoom_transition_s": 1.5,
                "label": "PAUSED + ZOOMED",
                "caption_lines": ["Events 7 and 10 show", "Activity attempt 2."],
                "crop": {"x": 200, "y": 270, "width": 1440, "height": 810},
                "highlights": [
                    {"x": 0, "y": 200, "width": 1400, "height": 65},
                    {"x": 0, "y": 330, "width": 1400, "height": 65},
                ],
            },
        ],
    }


def write_plan(tmp_path: Path, data: dict[str, object]) -> Path:
    path = tmp_path / "edit-plan.json"
    path.write_text(json.dumps(data))
    return path


def test_edit_plan_reserves_a_caption_panel_and_proof_beats(tmp_path: Path) -> None:
    plan = load_edit_plan(write_plan(tmp_path, valid_plan()))

    assert plan.canvas.content_width == plan.canvas.panel_x
    assert plan.canvas.panel_x + plan.canvas.panel_width == plan.canvas.width
    assert plan.total_beat_duration == 19
    assert plan.freeze_count == 2
    assert plan.zoom_count == 1
    assert plan.highlight_count == 3
    assert plan.canvas.highlight_stroke_width == 3
    assert plan.summary.duration_s == 10
    assert plan.summary.existing_heading == "THE CODE ALREADY PROVIDED"
    assert plan.summary.temporal_heading == "ADDING TEMPORAL PROVIDES"
    assert plan.beats[-1].zoom_transition_s == 1.5


def test_edit_plan_rejects_caption_that_will_overflow_panel(tmp_path: Path) -> None:
    data = valid_plan()
    data["beats"][0]["caption_lines"] = ["x" * 26]  # type: ignore[index]

    with pytest.raises(EditPlanError, match="caption line"):
        load_edit_plan(write_plan(tmp_path, data))


def test_edit_plan_rejects_crop_outside_source_frame(tmp_path: Path) -> None:
    data = valid_plan()
    data["beats"][2]["crop"]["x"] = 600  # type: ignore[index]

    with pytest.raises(EditPlanError, match="source frame"):
        load_edit_plan(write_plan(tmp_path, data))


def test_edit_plan_rejects_highlight_outside_crop(tmp_path: Path) -> None:
    data = valid_plan()
    data["beats"][1]["highlights"][0]["height"] = 2000  # type: ignore[index]

    with pytest.raises(EditPlanError, match="highlight"):
        load_edit_plan(write_plan(tmp_path, data))


def test_edit_plan_rejects_thick_highlight_stroke(tmp_path: Path) -> None:
    data = valid_plan()
    data["canvas"]["highlight_stroke_width"] = 5  # type: ignore[index]

    with pytest.raises(EditPlanError, match="highlight stroke"):
        load_edit_plan(write_plan(tmp_path, data))


def test_edit_plan_requires_reading_time_for_highlighted_freezes(tmp_path: Path) -> None:
    data = valid_plan()
    data["beats"][1]["duration_s"] = 6.9  # type: ignore[index]

    with pytest.raises(EditPlanError, match="highlighted freeze"):
        load_edit_plan(write_plan(tmp_path, data))


def test_edit_plan_rejects_incomplete_summary_card(tmp_path: Path) -> None:
    data = valid_plan()
    data["summary"]["temporal_lines"] = []  # type: ignore[index]

    with pytest.raises(EditPlanError, match="summary"):
        load_edit_plan(write_plan(tmp_path, data))


def test_edit_plan_rejects_zoom_transition_on_live_clip(tmp_path: Path) -> None:
    data = valid_plan()
    data["beats"][0]["zoom_transition_s"] = 1.5  # type: ignore[index]

    with pytest.raises(EditPlanError, match="zoom transition"):
        load_edit_plan(write_plan(tmp_path, data))


def test_edit_plan_requires_pause_zoom_and_highlights(tmp_path: Path) -> None:
    data = valid_plan()
    data["beats"] = [data["beats"][0]]  # type: ignore[index]

    with pytest.raises(EditPlanError, match="freeze beats"):
        load_edit_plan(write_plan(tmp_path, data))


def test_repository_edit_plan_satisfies_editorial_contract() -> None:
    plan_path = Path(__file__).parents[1] / "demo" / "edit-plan.json"

    plan = load_edit_plan(plan_path)

    assert len(plan.beats) == 6
    assert plan.freeze_count == 4
    assert plan.zoom_count == 2
    assert plan.highlight_count == 1
    assert plan.canvas.highlight_stroke_width <= 3
    assert all(
        beat.duration_s >= 8
        for beat in plan.beats
        if beat.mode == "freeze" and beat.highlights
    )
    overview = next(beat for beat in plan.beats if beat.id == "05-webui-overview")
    assert overview.mode == "freeze"
    assert overview.duration_s >= 7
    completed = next(beat for beat in plan.beats if beat.id == "04-terminal-completed")
    attempts = next(beat for beat in plan.beats if beat.id == "06-webui-attempt-two")
    assert completed.highlights == ()
    assert attempts.highlights == ()
    assert completed.zoom_transition_s >= 1.5
    assert completed.crop.width <= 1600
    assert completed.crop.height >= 800
    assert completed.crop.width * 9 == completed.crop.height * 16
    assert attempts.crop.width <= 1450
    assert attempts.crop.height <= 280
    assert plan.summary.duration_s >= 10
    assert plan.summary.existing_lines == (
        "SciX + Digest retrieval",
        "Parallel research angles",
        "Cited report + provenance",
    )
    assert plan.summary.temporal_lines == (
        "Durable Workflow state",
        "Activity retries + recovery",
        "Progress + Event History",
    )
