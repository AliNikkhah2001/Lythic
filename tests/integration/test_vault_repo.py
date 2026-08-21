"""Integration — VaultService end-to-end tmp vault."""

from __future__ import annotations

from pathlib import Path

from lythic.application.vault_service import VaultService


def test_vault_service_index_and_graph(tmp_path: Path) -> None:
    vault = tmp_path / "vault"
    vault.mkdir()
    (vault / "A.md").write_text("link to [[B]]", encoding="utf-8")
    (vault / "B.md").write_text("hello", encoding="utf-8")
    svc = VaultService(vault)
    count = svc.index_all()
    assert count == 2
    g = svc.build_graph()
    assert len(g.nodes) == 2
    # Edge A->B exists
    assert any(e.source == "A" and e.target == "B" for e in g.edges)
    assert svc.search("hello") != []
    svc.close()
