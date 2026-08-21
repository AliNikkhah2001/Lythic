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
        """Shape expected by QWebChannel → Cytoscape.js."""
        return {
            "nodes": [
                {"data": {"id": n.node_id, "label": n.label, "group": n.group}} for n in self.nodes
            ],
            "edges": [{"data": {"source": e.source, "target": e.target}} for e in self.edges],
        }

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
