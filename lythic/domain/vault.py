"""Domain — Vault, Note, Link, Tag, Graph value objects.

Layered: presentation → application → domain ← infrastructure.
Domain defines protocols; infra implements. No DB access here.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path


@dataclass(frozen=True, slots=True)
class Tag:
    """Obsidian tag like #tag or #nested/tag."""

    name: str

    def __post_init__(self) -> None:
        if not self.name:
            raise ValueError("tag name must be non-empty")
        if self.name.startswith("#"):
            raise ValueError("tag name must not include leading #")


@dataclass(frozen=True, slots=True)
class WikiLink:
    """Parsed [[wiki]] / [[target#heading|alias]] / ![[embed]]."""

    target: str
    heading: str | None = None
    alias: str | None = None
    is_embed: bool = False
    raw: str = ""

    def __post_init__(self) -> None:
        if not self.target:
            raise ValueError("wiki link target must be non-empty")


@dataclass(frozen=True, slots=True)
class Note:
    """Single markdown file in vault."""

    path: Path
    mtime: float
    content_hash: str
    raw_content: str
    frontmatter: dict[str, object] = field(default_factory=dict)
    tags: tuple[Tag, ...] = ()
    links: tuple[WikiLink, ...] = ()
    headings: tuple[str, ...] = ()
    word_count: int = 0


@dataclass(frozen=True, slots=True)
class VaultConfig:
    """Vault-level settings — mirrors src/settings.ts:1 + AGENTS.md vaultIntelligenceEnabled."""

    vault_path: Path
    vault_intelligence_enabled: bool = True
    graph_enhancement_enabled: bool = True
    ignore_patterns: tuple[str, ...] = (
        ".git/*",
        ".obsidian/*",
        "__pycache__/*",
        "*.tmp",
        "vault/.lythic/*",
    )


@dataclass(slots=True)
class Vault:
    """Aggregate root — vault folder, not a DB."""

    root: Path
    config: VaultConfig

    def is_in_vault(self, candidate: Path) -> bool:
        """Guard path traversal via resolve().is_relative_to (guardrails.md)."""
        try:
            candidate.resolve().relative_to(self.root.resolve())
            return True
        except ValueError:
            return False

    def note_path_for_target(self, target: str) -> Path:
        """Resolve wiki target to file path (exact name + .md)."""
        candidate = (self.root / target).with_suffix(".md")
        return candidate.resolve() if candidate.exists() else candidate


@dataclass(frozen=True, slots=True)
class GraphNode:
    """Graph node for Cytoscape.js — mirrors Obsidian graph.json."""

    node_id: str
    label: str
    group: str | None = None
    mtime: float | None = None


@dataclass(frozen=True, slots=True)
class GraphEdge:
    """Directed edge src → dst."""

    source: str
    target: str


@dataclass(frozen=True, slots=True)
class VaultGraph:
    """Vault graph — nodes + edges for rendering."""

    nodes: tuple[GraphNode, ...]
    edges: tuple[GraphEdge, ...]

    def to_cytoscape_json(self) -> dict[str, object]:
        """Shape expected by QWebChannel → Cytoscape.js (deduped edges)."""
        seen: set[tuple[str, str]] = set()
        deduped: list[GraphEdge] = []
        for edge in self.edges:
            key = (edge.source, edge.target)
            if key not in seen:
                seen.add(key)
                deduped.append(edge)
        return {
            "nodes": [
                {"data": {"id": n.node_id, "label": n.label, "group": n.group}} for n in self.nodes
            ],
            "edges": [{"data": {"source": e.source, "target": e.target}} for e in deduped],
        }

    def to_cytoscape_with_positions(self) -> dict[str, object]:
        """Cytoscape JSON with networkx.spring_layout positions (QThread-ready)."""
        base = self.to_cytoscape_json()
        if not self.nodes:
            return base
        try:
            import networkx as nx

            graph = nx.DiGraph()
            for node in self.nodes:
                graph.add_node(node.node_id)
            for edge in self.edges:
                graph.add_edge(edge.source, edge.target)
            # spring_layout gives {node: [x,y]} in [-1,1]; scale to 800x600
            positions = nx.spring_layout(graph, seed=42, scale=400)
        except Exception:
            # fallback without numpy/scipy: deterministic circular layout
            positions = {}
            count = len(self.nodes)
            import math

            for idx, node in enumerate(self.nodes):
                angle = 2 * math.pi * idx / max(count, 1)
                positions[node.node_id] = [400 * math.cos(angle), 300 * math.sin(angle)]
        nodes_raw = base["nodes"]
        assert isinstance(nodes_raw, list)
        nodes_with_pos: list[dict[str, object]] = []
        for entry in nodes_raw:
            assert isinstance(entry, dict)
            data = entry.get("data")
            assert isinstance(data, dict)
            node_id = data.get("id")
            assert isinstance(node_id, str)
            pos = positions.get(node_id)
            if pos is not None:
                entry["position"] = {"x": float(pos[0]) + 400, "y": float(pos[1]) + 300}
            nodes_with_pos.append(entry)
        return {"nodes": nodes_with_pos, "edges": base["edges"]}

    def ego_graph(self, center: str, depth: int = 2) -> VaultGraph:
        """2-hop local graph around center (BFS). Depth 1-3."""
        if depth < 1 or depth > 3:
            raise ValueError("depth must be 1..3")
        # Build adjacency for BFS
        adjacency: dict[str, set[str]] = {}
        for e in self.edges:
            adjacency.setdefault(e.source, set()).add(e.target)
            adjacency.setdefault(e.target, set()).add(e.source)
        visited: set[str] = {center}
        frontier: set[str] = {center}
        for _ in range(depth):
            nxt: set[str] = set()
            for node in frontier:
                for nb in adjacency.get(node, set()):
                    if nb not in visited:
                        visited.add(nb)
                        nxt.add(nb)
            frontier = nxt
            if not frontier:
                break
        allowed_nodes = {n for n in self.nodes if n.node_id in visited}
        allowed_edges = tuple(e for e in self.edges if e.source in visited and e.target in visited)
        return VaultGraph(nodes=tuple(allowed_nodes), edges=allowed_edges)
