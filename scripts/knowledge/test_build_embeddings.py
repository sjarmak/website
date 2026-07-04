"""Model-free unit tests for the embeddings bake core.

The core is pure: ``bake`` takes an injected ``encode`` callable
(texts -> rows of floats) so nothing here loads sentence-transformers or any
model weights. Run with any pytest:
``python3 -m pytest scripts/knowledge/test_build_embeddings.py``
"""

import glob
import os

import pytest

import build_embeddings as B


def _registry_slugs():
    paths = glob.glob(os.path.join(B.CONTENT, "concepts", "*.md")) + glob.glob(
        os.path.join(B.CONTENT, "concepts", "*.mdx")
    )
    return sorted(os.path.splitext(os.path.basename(p))[0] for p in paths)


def test_concept_nodes_emit_one_id_per_registry_entry():
    slugs = _registry_slugs()
    assert slugs, "concepts registry is empty — base branch missing?"
    nodes = B.concept_nodes()
    assert sorted(nodes) == [f"concept:{slug}" for slug in slugs]


def test_concept_blurb_combines_label_and_definition():
    nodes = B.concept_nodes()
    blurb = nodes["concept:evaluation"]
    assert blurb.startswith("Evaluation. ")
    assert "benchmark design" in blurb


def test_concept_missing_label_or_definition_raises(tmp_path):
    (tmp_path / "broken.md").write_text('---\nlabel: "Only Label"\n---\n')
    with pytest.raises(ValueError, match="concept:broken"):
        B.concept_nodes(str(tmp_path))


def test_collect_nodes_includes_all_three_sources():
    nodes = B.collect_nodes()
    prefixes = {i.split(":", 1)[0] for i in nodes}
    assert "concept" in prefixes
    assert "paper" in prefixes
    assert "projects" in prefixes


def _fake_encode(dim=4):
    """Deterministic unit-vector embedder: one axis per text."""

    def encode(texts):
        return [[1.0 if i == n % dim else 0.0 for i in range(dim)] for n in range(len(texts))]

    return encode


def test_bake_emits_concept_vectors_and_toolchain_metadata():
    nodes = B.concept_nodes()
    toolchain = {"python": "3.12.3", "sentence_transformers": "9.9.9", "torch": "0.0.0"}
    out = B.bake(nodes, _fake_encode(), model_name=B.MODEL, toolchain=toolchain)

    # every registry concept gets a vector
    assert sorted(out["vectors"]) == sorted(nodes)
    # metadata schema: model + pinned library versions
    assert out["model"] == "all-mpnet-base-v2"
    assert out["dim"] == 4
    assert out["normalized"] is True
    assert out["toolchain"] == toolchain
    # values are plain floats rounded to 5 decimals
    vec = out["vectors"]["concept:evaluation"]
    assert len(vec) == 4
    assert all(x == round(float(x), 5) for x in vec)


def test_bake_rejects_empty_node_set():
    with pytest.raises(ValueError):
        B.bake({}, _fake_encode(), model_name=B.MODEL, toolchain={})


def test_bake_rejects_ragged_embedding_rows():
    def ragged(texts):
        return [[0.1] * (2 + n) for n in range(len(texts))]

    with pytest.raises(ValueError, match="dim"):
        B.bake({"a": "x", "b": "y"}, ragged, model_name=B.MODEL, toolchain={})


def test_toolchain_versions_reports_python_always():
    versions = B.toolchain_versions()
    assert versions["python"].count(".") >= 1
    # model libraries appear only when installed; keys must never be empty strings
    assert all(v for v in versions.values())
