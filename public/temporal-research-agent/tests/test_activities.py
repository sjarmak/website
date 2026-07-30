import json
import threading

import pytest
from temporalio.testing import ActivityEnvironment

import durable_research.activities as activity_module
from durable_research.activities import (
    _normalize_sources,
    finalize_review,
    research_angle,
    synthesize_section,
    verify_evidence,
)
from durable_research.external_calls import JournaledCallResult
from durable_research.models import (
    Angle,
    BranchRequest,
    BranchResult,
    FinalizeRequest,
    McpServer,
    ReviewInput,
    SectionRequest,
    SourceRef,
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
    section_text = (tmp_path / "artifacts" / section.section_ref).read_text()
    assert "### Synthesized findings" in section_text
    assert "[SciX] Checkpoints permit recovery after process loss." in section_text
    assert (
        "[Code Intelligence Digest] Operators need visible retry state."
        in section_text
    )


@pytest.mark.asyncio
async def test_fixture_reads_are_offloaded_from_the_async_activity_loop(
    tmp_path,
    monkeypatch,
) -> None:
    activity_thread = threading.get_ident()
    read_threads: list[int] = []

    def fixture_sources(request):
        read_threads.append(threading.get_ident())
        return [
            {
                "id": "paper-1",
                "lane": "scix",
                "title": "Paper",
                "locator": "paper-1",
                "summary": "Evidence",
                "retrieved_at": "2026-07-29T00:00:00Z",
            }
        ]

    monkeypatch.setattr(activity_module, "_fixture_sources", fixture_sources)
    review = ReviewInput(
        topic="Durable agents",
        angles=(Angle("recovery", "How?", "papers", "posts"),),
        artifact_root=str(tmp_path),
        fixture_path=str(tmp_path / "unused.json"),
    )

    await research_angle(BranchRequest("review-1", review, review.angles[0]))

    assert read_threads
    assert all(thread_id != activity_thread for thread_id in read_threads)


@pytest.mark.asyncio
async def test_live_retrieval_heartbeats_while_mcp_calls_are_in_flight(
    tmp_path,
    monkeypatch,
) -> None:
    heartbeats: list[tuple[object, ...]] = []
    environment = ActivityEnvironment()
    environment.on_heartbeat = lambda *details: heartbeats.append(details)

    async def slow_live_sources(request, store):
        del request, store
        await activity_module.asyncio.sleep(0.04)
        return [
            {
                "id": "paper-1",
                "lane": "scix",
                "title": "Paper",
                "locator": "paper-1",
                "summary": "Evidence",
                "retrieved_at": "2026-07-29T00:00:00Z",
            }
        ]

    monkeypatch.setattr(activity_module, "_live_sources", slow_live_sources)
    monkeypatch.setattr(activity_module, "_HEARTBEAT_INTERVAL_SECONDS", 0.01)
    review = ReviewInput(
        topic="Durable agents",
        angles=(Angle("recovery", "How?", "papers", "posts"),),
        artifact_root=str(tmp_path),
        mode="live",
        scix_server=McpServer(command="scix"),
        digest_server=McpServer(command="digest"),
    )

    await environment.run(
        research_angle,
        BranchRequest("review-1", review, review.angles[0]),
    )

    assert len(heartbeats) >= 2
    assert all(details[0]["stage"] == "retrieval" for details in heartbeats)


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


@pytest.mark.asyncio
async def test_finalize_live_review_uses_scix_synthesis_and_records_it(
    tmp_path,
    monkeypatch,
) -> None:
    review = ReviewInput(
        topic="Durable agents",
        angles=(Angle("recovery", "How?", "papers", "posts"),),
        artifact_root=str(tmp_path),
        mode="live",
        scix_server=McpServer(command="scix"),
        digest_server=McpServer(command="digest"),
    )
    branch = BranchResult(
        angle_key="recovery",
        status="complete",
        section_ref="review-1/sections/recovery.md",
        sources=(
            SourceRef(
                source_id="2026TEST",
                lane="scix",
                title="Semantic recovery",
                locator="2026TEST",
                retrieved_at="2026-07-30T00:00:00Z",
                content_hash="abc",
                artifact_ref="evidence/scix.json",
            ),
            SourceRef(
                source_id="post-1",
                lane="digest",
                title="Production retries",
                locator="https://example.test/retries",
                retrieved_at="2026-07-30T00:00:00Z",
                content_hash="def",
                artifact_ref="evidence/digest.json",
            ),
        ),
    )
    (tmp_path / "review-1" / "sections").mkdir(parents=True)
    (tmp_path / branch.section_ref).write_text("## Recovery\n\nEvidence.\n")
    calls: list[tuple[str, dict[str, object]]] = []

    async def fake_journaled_call_tool(**kwargs):
        calls.append((kwargs["tool"], kwargs["arguments"]))
        return JournaledCallResult(
            request_id="request-synthesis",
            journal_ref="review-1/requests/request-synthesis.json",
            response={
                "sections": [
                    {
                        "name": "background",
                        "cited_papers": [
                            {
                                "bibcode": "2026TEST",
                                "title": "Semantic recovery",
                                "year": 2026,
                                "signal_used": "community_fallthrough",
                            }
                        ],
                        "theme": {
                            "communities": [],
                            "top_papers_by_citation": [],
                        },
                    }
                ],
                "unattributed_bibcodes": [],
            },
            cache_hit=False,
        )

    monkeypatch.setattr(
        activity_module,
        "journaled_call_tool",
        fake_journaled_call_tool,
    )

    result = await finalize_review(FinalizeRequest("review-1", review, (branch,)))

    report = (tmp_path / result.report_ref).read_text()
    manifest = json.loads((tmp_path / result.manifest_ref).read_text())
    assert calls == [
        (
            "synthesize_findings",
            {
                "working_set_bibcodes": ["2026TEST"],
                "include_full_abstracts": True,
                "include_citation_contexts": True,
            },
        )
    ]
    assert "## SciX synthesis scaffold" in report
    assert "Semantic recovery" in report
    assert manifest["synthesis"]["tool"] == "synthesize_findings"
    assert manifest["synthesis"]["request_id"] == "request-synthesis"


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


def test_mcp_result_summaries_normalize_scix_snippets_and_digest_html() -> None:
    scix = _normalize_sources(
        {
            "papers": [
                {
                    "bibcode": "2026TEST",
                    "title": "Paper",
                    "abstract_snippet": "Semantic recovery preserves completed work.",
                }
            ]
        },
        "scix",
        "2026-07-29T00:00:00Z",
    )
    digest = _normalize_sources(
        {
            "items": [
                {
                    "url": "https://example.test/item",
                    "description": (
                        "<p>Retries need <strong>stable identities</strong>.</p>"
                        "<p>Operators need traces.</p>"
                    ),
                }
            ]
        },
        "digest",
        "2026-07-29T00:00:00Z",
    )

    assert scix[0]["summary"] == "Semantic recovery preserves completed work."
    assert digest[0]["summary"] == "Retries need stable identities. Operators need traces."


def test_mcp_result_without_usable_items_fails_clearly() -> None:
    with pytest.raises(ValueError, match="no usable sources"):
        _normalize_sources([], "scix", "2026-07-29T00:00:00Z")
