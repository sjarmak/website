import json

import pytest

from durable_research.activities import (
    _normalize_sources,
    finalize_review,
    research_angle,
    synthesize_section,
    verify_evidence,
)
from durable_research.models import (
    Angle,
    BranchRequest,
    BranchResult,
    FinalizeRequest,
    ReviewInput,
    SectionRequest,
    VerifyRequest,
)


@pytest.fixture
def fixture_file(tmp_path):
    path = tmp_path / "sources.json"
    path.write_text(
        json.dumps(
            {
                "recovery": {
                    "scix": [
                        {
                            "id": "paper-1",
                            "title": "Fault-Tolerant Agents",
                            "locator": "doi:10/example",
                            "summary": "Checkpoints permit recovery after process loss.",
                        }
                    ],
                    "digest": [
                        {
                            "id": "post-1",
                            "title": "Retries in production",
                            "locator": "https://example.test/retries",
                            "summary": "Operators need visible retry state.",
                        }
                    ],
                }
            }
        )
    )
    return path


@pytest.mark.asyncio
async def test_activity_pipeline_keeps_full_evidence_out_of_results(tmp_path, fixture_file) -> None:
    review = ReviewInput(
        topic="Durable agents",
        angles=(Angle("recovery", "How?", "fault tolerant agents", "agent retries"),),
        artifact_root=str(tmp_path / "artifacts"),
        fixture_path=str(fixture_file),
    )
    request = BranchRequest("review-1", review, review.angles[0])

    researched = await research_angle(request)
    verified = await verify_evidence(VerifyRequest(review, researched))
    section = await synthesize_section(SectionRequest(review, verified))

    assert researched.status == "researched"
    assert {source.lane for source in researched.sources} == {"scix", "digest"}
    assert all("summary" not in source.__dict__ for source in researched.sources)
    assert verified.status == "verified"
    assert section.status == "complete"
    assert (tmp_path / "artifacts" / section.section_ref).exists()


@pytest.mark.asyncio
async def test_finalize_activity_writes_report_and_provenance_manifest(tmp_path) -> None:
    review = ReviewInput(
        topic="Durable agents",
        angles=(Angle("recovery", "How?", "papers", "posts"),),
        artifact_root=str(tmp_path),
    )
    branch = BranchResult(
        angle_key="recovery",
        status="complete",
        section_ref="review-1/sections/recovery.md",
    )
    (tmp_path / "review-1" / "sections").mkdir(parents=True)
    (tmp_path / branch.section_ref).write_text("## Recovery\n\nFinding [paper-1].\n")

    result = await finalize_review(FinalizeRequest("review-1", review, (branch,)))

    report = (tmp_path / result.report_ref).read_text()
    manifest = json.loads((tmp_path / result.manifest_ref).read_text())
    assert "# Durable agents" in report
    assert manifest["review_id"] == "review-1"
    assert manifest["completed_angles"] == ["recovery"]


def test_mcp_results_are_normalized_from_both_source_shapes() -> None:
    scix = _normalize_sources(
        {"papers": [{"bibcode": "2026TEST", "title": "Paper", "abstract": "Evidence"}]},
        "scix",
        "2026-07-29T00:00:00Z",
        request_id="request-scix",
    )
    digest = _normalize_sources(
        {"items": [{"url": "https://example.test/item", "description": "Field report"}]},
        "digest",
        "2026-07-29T00:00:00Z",
    )

    assert scix[0]["locator"] == "2026TEST"
    assert scix[0]["summary"] == "Evidence"
    assert scix[0]["request_id"] == "request-scix"
    assert digest[0]["title"] == "https://example.test/item"
    assert digest[0]["summary"] == "Field report"


def test_mcp_result_without_usable_items_fails_clearly() -> None:
    with pytest.raises(ValueError, match="no usable sources"):
        _normalize_sources([], "scix", "2026-07-29T00:00:00Z")
