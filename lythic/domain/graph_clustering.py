"""Domain — Graph clustering (Louvain communities → hulls + compound nodes)."""

# mypy: ignore-errors
from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from lythic.domain.vault import VaultGraph


@dataclass(frozen=True, slots=True)
class Cluster:
    """Cluster with nodes and hull."""

    cluster_id: str
    node_ids: tuple[str, ...]
    color: str


def cluster_graph(graph: VaultGraph) -> list[Cluster]:
    """Louvain clustering via networkx.community.louvain_communities.

    Falls back to tag/folder groups when networkx or numpy missing.
    """
    try:
        import networkx as nx

        nx_graph = nx.Graph()
        for node in graph.nodes:
            nx_graph.add_node(node.node_id, group=node.group)
        for edge in graph.edges:
            nx_graph.add_edge(edge.source, edge.target)
        try:
            from networkx.algorithms.community import louvain_communities

            communities = louvain_communities(nx_graph, seed=42)
        except ImportError:
            # fallback: connected components
            communities = list(nx.connected_components(nx_graph))
        palette = ["#38bdf8", "#fb7185", "#34d399", "#fbbf24", "#a78bfa", "#f472b6"]
        clusters: list[Cluster] = []
        for idx, comm in enumerate(communities):
            color = palette[idx % len(palette)]
            clusters.append(
                Cluster(cluster_id=f"cluster_{idx}", node_ids=tuple(sorted(comm)), color=color)
            )
        return clusters
    except Exception:
        # ultimate fallback: group by prefix before "/"
        groups: dict[str, list[str]] = {}
        for node in graph.nodes:
            key = node.group or node.node_id.split("/")[0] if "/" in node.node_id else "default"
            groups.setdefault(key, []).append(node.node_id)
        palette = ["#38bdf8", "#fb7185", "#34d399"]
        return [
            Cluster(cluster_id=f"cluster_{i}", node_ids=tuple(v), color=palette[i % len(palette)])
            for i, (k, v) in enumerate(groups.items())
        ]


def to_compound_cytoscape(graph: VaultGraph, clusters: list[Cluster]) -> dict[str, object]:
    """Convert clusters to cytoscape compound nodes (:parent) + map group→color."""
    base = graph.to_cytoscape_with_positions()
    nodes = base["nodes"]
    assert isinstance(nodes, list)
    # add cluster parent nodes
    parent_nodes: list[dict[str, object]] = []
    node_to_cluster: dict[str, str] = {}
    for cluster in clusters:
        parent_nodes.append(
            {"data": {"id": cluster.cluster_id, "label": cluster.cluster_id}, "classes": "cluster"}
        )
        for nid in cluster.node_ids:
            node_to_cluster[nid] = cluster.cluster_id
    # enrich original nodes with parent and color
    for entry in nodes:
        assert isinstance(entry, dict)
        data = entry.get("data")
        assert isinstance(data, dict)
        nid = data.get("id")
        assert isinstance(nid, str)
        cluster_id = node_to_cluster.get(nid)
        if cluster_id:
            data["parent"] = cluster_id
            # color from cluster
            cluster = next((c for c in clusters if c.cluster_id == cluster_id), None)
            if cluster:
                entry.setdefault("style", {})  # type: ignore[attr-defined]
    all_nodes = parent_nodes + nodes
    return {"nodes": all_nodes, "edges": base["edges"]}
