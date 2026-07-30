from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

SOURCE_WIDTH = 1920
SOURCE_HEIGHT = 1080
MAX_PANEL_LINE_CHARACTERS = 25
MAX_SUMMARY_LINE_CHARACTERS = 32
MIN_HIGHLIGHT_FREEZE_SECONDS = 8
MIN_SUMMARY_SECONDS = 10


class EditPlanError(ValueError):
    """Raised when a video edit plan would produce an invalid or unreadable cut."""


@dataclass(frozen=True)
class Rect:
    x: int
    y: int
    width: int
    height: int


@dataclass(frozen=True)
class Canvas:
    width: int
    height: int
    content_width: int
    panel_x: int
    panel_width: int
    stripe_width: int
    highlight_stroke_width: int


@dataclass(frozen=True)
class SummaryCard:
    duration_s: float
    title: str
    existing_heading: str
    existing_lines: tuple[str, ...]
    temporal_heading: str
    temporal_lines: tuple[str, ...]


@dataclass(frozen=True)
class Beat:
    id: str
    source: str
    mode: str
    start_s: float | None
    end_s: float | None
    at_s: float | None
    duration_s: float
    zoom_transition_s: float
    label: str
    caption_lines: tuple[str, ...]
    crop: Rect
    highlights: tuple[Rect, ...]

    @property
    def is_zoomed(self) -> bool:
        return self.crop != Rect(0, 0, SOURCE_WIDTH, SOURCE_HEIGHT)


@dataclass(frozen=True)
class EditPlan:
    canvas: Canvas
    summary: SummaryCard
    beats: tuple[Beat, ...]

    @property
    def total_beat_duration(self) -> float:
        return sum(beat.duration_s for beat in self.beats)

    @property
    def freeze_count(self) -> int:
        return sum(beat.mode == "freeze" for beat in self.beats)

    @property
    def zoom_count(self) -> int:
        return sum(beat.is_zoomed for beat in self.beats)

    @property
    def highlight_count(self) -> int:
        return sum(len(beat.highlights) for beat in self.beats)


def _object(value: Any, location: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise EditPlanError(f"{location} must be an object")
    return value


def _integer(value: Any, location: str) -> int:
    if not isinstance(value, int) or isinstance(value, bool):
        raise EditPlanError(f"{location} must be an integer")
    return value


def _number(value: Any, location: str) -> float:
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        raise EditPlanError(f"{location} must be a number")
    return float(value)


def _rect(value: Any, location: str) -> Rect:
    data = _object(value, location)
    rect = Rect(
        x=_integer(data.get("x"), f"{location}.x"),
        y=_integer(data.get("y"), f"{location}.y"),
        width=_integer(data.get("width"), f"{location}.width"),
        height=_integer(data.get("height"), f"{location}.height"),
    )
    if rect.x < 0 or rect.y < 0 or rect.width <= 0 or rect.height <= 0:
        raise EditPlanError(f"{location} must have nonnegative coordinates and positive size")
    return rect


def _canvas(value: Any) -> Canvas:
    data = _object(value, "canvas")
    canvas = Canvas(
        width=_integer(data.get("width"), "canvas.width"),
        height=_integer(data.get("height"), "canvas.height"),
        content_width=_integer(data.get("content_width"), "canvas.content_width"),
        panel_x=_integer(data.get("panel_x"), "canvas.panel_x"),
        panel_width=_integer(data.get("panel_width"), "canvas.panel_width"),
        stripe_width=_integer(data.get("stripe_width"), "canvas.stripe_width"),
        highlight_stroke_width=_integer(
            data.get("highlight_stroke_width"),
            "canvas.highlight_stroke_width",
        ),
    )
    if canvas.width != 1920 or canvas.height != 1080:
        raise EditPlanError("canvas must be 1920x1080")
    if canvas.content_width != canvas.panel_x:
        raise EditPlanError("caption panel must begin after the content lane")
    if canvas.panel_x + canvas.panel_width != canvas.width:
        raise EditPlanError("caption panel must occupy the remaining canvas width")
    if not 0 < canvas.stripe_width < canvas.panel_width:
        raise EditPlanError("caption panel stripe width is invalid")
    if not 0 < canvas.highlight_stroke_width <= 3:
        raise EditPlanError("highlight stroke width must be between 1 and 3 pixels")
    return canvas


def _summary(value: Any) -> SummaryCard:
    data = _object(value, "summary")
    duration_s = _number(data.get("duration_s"), "summary.duration_s")
    if duration_s < MIN_SUMMARY_SECONDS:
        raise EditPlanError(
            f"summary.duration_s must be at least {MIN_SUMMARY_SECONDS} seconds"
        )
    return SummaryCard(
        duration_s=duration_s,
        title=_summary_text(data.get("title"), "summary.title"),
        existing_heading=_summary_text(
            data.get("existing_heading"),
            "summary.existing_heading",
        ),
        existing_lines=_summary_lines(
            data.get("existing_lines"),
            "summary.existing_lines",
        ),
        temporal_heading=_summary_text(
            data.get("temporal_heading"),
            "summary.temporal_heading",
        ),
        temporal_lines=_summary_lines(
            data.get("temporal_lines"),
            "summary.temporal_lines",
        ),
    )


def _summary_text(value: Any, location: str) -> str:
    if not isinstance(value, str) or not value:
        raise EditPlanError(f"{location} must be a nonempty string")
    if len(value) > MAX_SUMMARY_LINE_CHARACTERS:
        raise EditPlanError(
            f"{location} exceeds {MAX_SUMMARY_LINE_CHARACTERS} characters"
        )
    return value


def _summary_lines(value: Any, location: str) -> tuple[str, ...]:
    if not isinstance(value, list) or not 2 <= len(value) <= 4:
        raise EditPlanError(f"{location} must contain two to four summary lines")
    return tuple(
        _summary_text(line, f"{location}[{index}]") for index, line in enumerate(value)
    )


def _beat(value: Any, index: int) -> Beat:
    location = f"beats[{index}]"
    data = _object(value, location)
    beat_id = data.get("id")
    source = data.get("source")
    mode = data.get("mode")
    label = data.get("label")
    caption_lines = data.get("caption_lines")
    if not isinstance(beat_id, str) or not beat_id:
        raise EditPlanError(f"{location}.id must be a nonempty string")
    if source not in {"terminal", "webui"}:
        raise EditPlanError(f"{location}.source must be terminal or webui")
    if mode not in {"clip", "freeze"}:
        raise EditPlanError(f"{location}.mode must be clip or freeze")
    if not isinstance(label, str) or not label:
        raise EditPlanError(f"{location}.label must be a nonempty string")
    if not isinstance(caption_lines, list) or not 1 <= len(caption_lines) <= 4:
        raise EditPlanError(f"{location}.caption_lines must contain one to four lines")
    for line in caption_lines:
        if not isinstance(line, str) or not line:
            raise EditPlanError(f"{location} caption line must be a nonempty string")
        if len(line) > MAX_PANEL_LINE_CHARACTERS:
            raise EditPlanError(
                f"{location} caption line exceeds {MAX_PANEL_LINE_CHARACTERS} characters"
            )

    start_s: float | None = None
    end_s: float | None = None
    at_s: float | None = None
    if mode == "clip":
        start_s = _number(data.get("start_s"), f"{location}.start_s")
        end_s = _number(data.get("end_s"), f"{location}.end_s")
        if start_s < 0 or end_s <= start_s:
            raise EditPlanError(f"{location} clip timing is invalid")
        duration_s = end_s - start_s
    else:
        at_s = _number(data.get("at_s"), f"{location}.at_s")
        duration_s = _number(data.get("duration_s"), f"{location}.duration_s")
        if at_s < 0 or duration_s <= 0:
            raise EditPlanError(f"{location} freeze timing is invalid")

    crop = _rect(data.get("crop"), f"{location}.crop")
    if crop.x + crop.width > SOURCE_WIDTH or crop.y + crop.height > SOURCE_HEIGHT:
        raise EditPlanError(f"{location} crop extends outside the source frame")
    zoom_transition_s = _number(
        data.get("zoom_transition_s", 0),
        f"{location}.zoom_transition_s",
    )
    if zoom_transition_s < 0 or zoom_transition_s > duration_s:
        raise EditPlanError(f"{location} zoom transition timing is invalid")
    if zoom_transition_s > 0:
        if mode != "freeze" or crop == Rect(0, 0, SOURCE_WIDTH, SOURCE_HEIGHT):
            raise EditPlanError(
                f"{location} zoom transition requires a zoomed freeze beat"
            )
        if crop.width * SOURCE_HEIGHT != crop.height * SOURCE_WIDTH:
            raise EditPlanError(
                f"{location} zoom transition crop must preserve source aspect ratio"
            )

    raw_highlights = data.get("highlights")
    if not isinstance(raw_highlights, list):
        raise EditPlanError(f"{location}.highlights must be a list")
    highlights = tuple(
        _rect(highlight, f"{location}.highlights[{highlight_index}]")
        for highlight_index, highlight in enumerate(raw_highlights)
    )
    for highlight in highlights:
        if (
            highlight.x + highlight.width > crop.width
            or highlight.y + highlight.height > crop.height
        ):
            raise EditPlanError(f"{location} highlight extends outside its crop")

    return Beat(
        id=beat_id,
        source=source,
        mode=mode,
        start_s=start_s,
        end_s=end_s,
        at_s=at_s,
        duration_s=duration_s,
        zoom_transition_s=zoom_transition_s,
        label=label,
        caption_lines=tuple(caption_lines),
        crop=crop,
        highlights=highlights,
    )


def load_edit_plan(path: Path) -> EditPlan:
    try:
        raw = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError) as error:
        raise EditPlanError(f"cannot read valid edit plan JSON: {path}") from error
    data = _object(raw, "edit plan")
    canvas = _canvas(data.get("canvas"))
    raw_beats = data.get("beats")
    if not isinstance(raw_beats, list) or not raw_beats:
        raise EditPlanError("edit plan must contain beats")
    beats = tuple(_beat(value, index) for index, value in enumerate(raw_beats))
    beat_ids = [beat.id for beat in beats]
    if len(set(beat_ids)) != len(beat_ids):
        raise EditPlanError("beat IDs must be unique")

    plan = EditPlan(
        canvas=canvas,
        summary=_summary(data.get("summary")),
        beats=beats,
    )
    if plan.freeze_count < 2:
        raise EditPlanError("edit plan must contain at least two freeze beats")
    if plan.zoom_count < 1:
        raise EditPlanError("edit plan must contain a zoomed proof beat")
    if plan.highlight_count < 1:
        raise EditPlanError("edit plan must contain highlighted evidence")
    if any(
        beat.mode == "freeze"
        and beat.highlights
        and beat.duration_s < MIN_HIGHLIGHT_FREEZE_SECONDS
        for beat in plan.beats
    ):
        raise EditPlanError(
            "each highlighted freeze must last at least "
            f"{MIN_HIGHLIGHT_FREEZE_SECONDS} seconds"
        )
    return plan
