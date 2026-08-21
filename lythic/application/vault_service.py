"""Application — Vault service (open, index, search, graph)."""

from __future__ import annotations

from pathlib import Path

from lythic.domain.vault import GraphEdge, GraphNode, Vault, VaultConfig, VaultGraph
from lythic.infrastructure.markdown_parser import ObsidianMarkdownParser
from lythic.infrastructure.sqlite_repo import SqliteVaultRepo
from lythic.infrastructure.watcher import VaultIndexer


class VaultService:
    """Application façade over domain + infra."""

    def __init__(self, vault_root: Path) -> None:
        self.vault_root = vault_root
        self.config = VaultConfig(vault_path=vault_root)
        self.vault = Vault(root=vault_root, config=self.config)
        self.parser = ObsidianMarkdownParser()
        self.repo = SqliteVaultRepo(vault_root / ".lythic" / "cache.db")
        self.indexer = VaultIndexer(vault_root, self.repo, self.parser)

    def index_all(self) -> int:
        return self.indexer.index_all()

    def search(self, query: str, limit: int = 20) -> list[str]:
        return self.repo.search(query, limit=limit)

    def build_graph(self) -> VaultGraph:
        files = self.repo.get_all_files()
        links = self.repo.get_all_links()
        nodes = tuple(
            GraphNode(node_id=Path(p).stem, label=Path(p).stem, group=None) for p in files
        )
        # links dst is raw target (without .md) — map to node ids if exists
        node_ids = {n.node_id for n in nodes}
        edges = tuple(
            GraphEdge(source=Path(src).stem, target=dst)
            for src, dst in links
            if Path(src).stem in node_ids and dst in node_ids
        )
        return VaultGraph(nodes=nodes, edges=edges)

    def close(self) -> None:
        self.repo.close()
