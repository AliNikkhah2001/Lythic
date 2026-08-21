"""Unit — VaultGraph Cytoscape JSON + ego graph."""

from __future__ import annotations

import pytest

from lythic.domain.vault import GraphEdge, GraphNode, VaultGraph


def test_should_build_cytoscape_json() -> None:
    g = VaultGraph(
        nodes=(GraphNode(node_id="a", label="A"), GraphNode(node_id="b", label="B")),
        edges=(GraphEdge(source="a", target="b"),),
    )
    j = g.to_cytoscape_json()
    assert len(j["nodes"]) == 2  # type: ignore[arg-type]
    assert len(j["edges"]) == 1  # type: ignore[arg-type]


def test_should_compute_ego_graph_depth2() -> None:
    g = VaultGraph(
        nodes=tuple(GraphNode(node_id=c, label=c) for c in ["a", "b", "c", "d"]),
        edges=(
            GraphEdge(source="a", target="b"),
            GraphEdge(source="b", target="c"),
            GraphEdge(source="c", target="d"),
        ),
    )
    local = g.ego_graph("a", depth=2)
    ids = {n.node_id for n in local.nodes}
    assert "a" in ids and "b" in ids and "c" in ids
    assert "d" not in ids


def test_should_validate_ego_depth() -> None:
    g = VaultGraph(nodes=(), edges=())
    with pytest.raises(ValueError):
        g.ego_graph("a", depth=0)
