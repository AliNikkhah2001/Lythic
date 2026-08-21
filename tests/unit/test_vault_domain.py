"""Unit — vault domain value objects."""

from __future__ import annotations

from pathlib import Path

import pytest

from lythic.domain.vault import GraphNode, Tag, Vault, VaultConfig, VaultGraph, WikiLink


def test_tag_validation() -> None:
    with pytest.raises(ValueError):
        Tag(name="")
    with pytest.raises(ValueError):
        Tag(name="#bad")
    assert Tag(name="good").name == "good"


def test_wikilink_validation() -> None:
    with pytest.raises(ValueError):
        WikiLink(target="")
    assert WikiLink(target="Note", heading="H", alias="A").target == "Note"


def test_vault_is_in_vault(tmp_path: Path) -> None:
    vault = Vault(root=tmp_path, config=VaultConfig(vault_path=tmp_path))
    inside = tmp_path / "a.md"
    outside = Path("/tmp/outside.md")
    assert vault.is_in_vault(inside) is True
    assert vault.is_in_vault(outside) is False


def test_graph_ego_depth_content() -> None:
    g = VaultGraph(
        nodes=(GraphNode(node_id="x", label="X"),),
        edges=(),
    )
    local = g.ego_graph("x", depth=1)
    assert len(local.nodes) == 1


def test_vault_config_defaults(tmp_path: Path) -> None:
    cfg = VaultConfig(vault_path=tmp_path)
    assert cfg.vault_intelligence_enabled is True
    assert ".git/*" in cfg.ignore_patterns
