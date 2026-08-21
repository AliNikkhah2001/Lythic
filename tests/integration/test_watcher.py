"""Integration — watcher is_ignored + VaultIndexer tmp_path."""

from __future__ import annotations

from pathlib import Path

from lythic.infrastructure.markdown_parser import ObsidianMarkdownParser
from lythic.infrastructure.sqlite_repo import SqliteVaultRepo
from lythic.infrastructure.watcher import VaultIndexer, is_ignored


def test_should_ignore_git_and_obsidian(tmp_path: Path) -> None:
    vault = tmp_path / "vault"
    vault.mkdir()
    assert is_ignored(vault / ".git" / "config", vault) is True
    assert is_ignored(vault / ".obsidian" / "workspace.json", vault) is True
    assert is_ignored(vault / "note.md", vault) is False


def test_should_index_file_and_search(tmp_path: Path) -> None:
    vault = tmp_path / "vault"
    vault.mkdir()
    note = vault / "hello.md"
    note.write_text("# Hello\nLink to [[World]] #tag", encoding="utf-8")
    repo = SqliteVaultRepo(vault / ".lythic" / "cache.db")
    parser = ObsidianMarkdownParser()
    indexer = VaultIndexer(vault, repo, parser)
    res = indexer.index_file(note)
    assert res.updated is True
    assert repo.search("Hello") != []
    repo.close()


def test_should_index_all(tmp_path: Path) -> None:
    vault = tmp_path / "vault"
    vault.mkdir()
    (vault / "a.md").write_text("a", encoding="utf-8")
    (vault / "b.md").write_text("b", encoding="utf-8")
    repo = SqliteVaultRepo(vault / ".lythic" / "cache.db")
    parser = ObsidianMarkdownParser()
    indexer = VaultIndexer(vault, repo, parser)
    count = indexer.index_all()
    assert count == 2
    repo.close()
