"""DB-free unit tests for the scix-data refresh core.

The core is pure: it takes an injected ``fetch`` callable (bibcode -> parsed
scix JSON) so nothing here touches the CLI, a subprocess, or the prod DB. Run
with any pytest:  ``python -m pytest scripts/knowledge/test_refresh_scix_data.py``
"""

import pytest

import refresh_scix_data as R


def _get_paper(bibcode, *, title, author, year, cites):
    """Shape a ``get_paper`` result the way the CLI returns it (snake_case)."""
    return {
        "papers": [
            {
                "bibcode": bibcode,
                "title": title,
                "first_author": author,
                "year": year,
                "citation_count": cites,
                "abstract": "the real full abstract, not the gloss",
            }
        ]
    }


def test_lit_entry_maps_snake_to_camel_and_keeps_gloss():
    gloss = {"2020arXiv1A": "editorial one-liner"}
    fetched = {"2020arXiv1A": _get_paper("2020arXiv1A", title="T", author="A, B", year=2020, cites=7)}
    papers, warnings = R.build_lit_papers(gloss, fetched.__getitem__, prior_by_bibcode={})
    assert warnings == []
    assert papers == [
        {
            "bibcode": "2020arXiv1A",
            "title": "T",
            "firstAuthor": "A, B",
            "year": 2020,
            "citationCount": 7,
            "abstract": "editorial one-liner",
        }
    ]


def test_lit_entry_unescapes_ads_html_entities():
    # ADS delivers entity-encoded titles/authors; the site renders them as text,
    # so they must be decoded (matches build_libraries.py / build_explorers.py).
    gloss = {"b": "g"}
    fetched = {"b": _get_paper("b", title="Astronomy &amp; Astrophysics", author="O'Brien &amp; Co", year=2024, cites=1)}
    papers, _ = R.build_lit_papers(gloss, fetched.__getitem__, prior_by_bibcode={})
    assert papers[0]["title"] == "Astronomy & Astrophysics"
    assert papers[0]["firstAuthor"] == "O'Brien & Co"


def test_lit_papers_preserve_gloss_insertion_order():
    gloss = {"b3": "g3", "b1": "g1", "b2": "g2"}
    fetched = {b: _get_paper(b, title=b, author="X", year=2021, cites=0) for b in gloss}
    papers, _ = R.build_lit_papers(gloss, fetched.__getitem__, prior_by_bibcode={})
    assert [p["bibcode"] for p in papers] == ["b3", "b1", "b2"]


def test_absent_paper_retains_prior_and_refreshes_gloss():
    gloss = {"gone": "NEW gloss"}
    prior = {
        "gone": {
            "bibcode": "gone",
            "title": "Old Title",
            "firstAuthor": "Old, A",
            "year": 2019,
            "citationCount": 3,
            "abstract": "OLD gloss",
        }
    }
    fetched = {"gone": {"papers": []}}  # successful call, paper not in local mirror
    papers, warnings = R.build_lit_papers(gloss, fetched.__getitem__, prior_by_bibcode=prior)
    assert len(warnings) == 1 and "gone" in warnings[0]
    # mechanical fields retained from snapshot, gloss refreshed from editorial layer
    assert papers[0]["title"] == "Old Title"
    assert papers[0]["citationCount"] == 3
    assert papers[0]["abstract"] == "NEW gloss"


def test_absent_paper_with_no_prior_raises():
    gloss = {"orphan": "g"}
    fetched = {"orphan": {"papers": []}}
    with pytest.raises(R.RefreshError):
        R.build_lit_papers(gloss, fetched.__getitem__, prior_by_bibcode={})


def test_fetch_error_propagates_and_aborts():
    def boom(_bibcode):
        raise R.ScixUnavailable("nonzero exit")

    with pytest.raises(R.ScixUnavailable):
        R.build_lit_papers({"b": "g"}, boom, prior_by_bibcode={})


def test_missing_papers_key_is_contract_violation_not_absence():
    # A response with no `papers` key at all means the CLI shape changed; it must
    # hard-fail, not be treated as "paper absent from mirror" and silently fall back.
    fetched = {"b": {"unexpected": "shape"}}
    with pytest.raises(R.ScixUnavailable):
        R.build_lit_papers({"b": "g"}, fetched.__getitem__, prior_by_bibcode={"b": {"bibcode": "b"}})


def _sim(*targets):
    """A ``citation_similarity`` result (snake_case, score-ordered, with extras)."""
    return {
        "papers": [
            {"bibcode": b, "overlap_count": ov, "title": b, "citation_count": c}
            for (b, ov, c) in targets
        ],
        "total": len(targets),
    }


def test_edges_filter_to_nodes_map_fields_and_sort():
    source = "2023her"
    nodes = {"n_b", "n_a"}  # only these exist as lit-papers nodes
    # returned score-order puts n_b first, includes a non-node target that must drop
    sim = _sim(("n_b", 4, 100), ("not_a_node", 3, 50), ("n_a", 2, 10))
    edges = R.build_edges(source, lambda _s: sim, node_bibcodes=nodes)
    assert edges == [
        {"source": source, "target": "n_a", "kind": "co_citation", "overlap": 2},
        {"source": source, "target": "n_b", "kind": "co_citation", "overlap": 4},
    ]


def test_edges_empty_when_no_targets_are_nodes():
    edges = R.build_edges("s", lambda _s: _sim(("x", 2, 1)), node_bibcodes={"y"})
    assert edges == []
