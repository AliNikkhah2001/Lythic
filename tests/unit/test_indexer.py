"""Unit — SQLite repo + FTS5 + migrations."""

from __future__ import annotations

from pathlib import Path

from lythic.domain.vault import Note, WikiLink
from lythic.infrastructure.sqlite_repo import SqliteVaultRepo


def _note(path: str, content: str, links: tuple[WikiLink, ...] = ()) -> Note:
    return Note(
        path=Path(path),
        mtime=1.0,
        content_hash="abc",
        raw_content=content,
        frontmatter={},
        tags=(),
        links=links,
        headings=(),
        word_count=len(content.split()),
    )


def test_should_upsert_and_search(tmp_path: Path) -> None:
    repo = SqliteVaultRepo(tmp_path / "cache.db")
    repo.upsert_note(_note("a.md", "hello Lythic vault"))
    repo.upsert_note(_note("b.md", "another note"))
    results = repo.search("Lythic")
    assert "a.md" in results
    repo.close()


def test_should_track_backlinks(tmp_path: Path) -> None:
    repo = SqliteVaultRepo(tmp_path / "cache.db")
    repo.upsert_note(_note("a.md", "link", links=(WikiLink(target="b"),)))
    repo.upsert_note(_note("b.md", "target"))
    bl = repo.get_backlinks("b")
    assert "a.md" in bl
    repo.close()


def test_should_handle_user_version_migration(tmp_path: Path) -> None:
    db = tmp_path / "cache.db"
    repo = SqliteVaultRepo(db)
    import sqlite3

    cur = sqlite3.connect(str(db)).execute("PRAGMA user_version")
    assert int(cur.fetchone()[0]) == 1
    repo.close()


def test_should_delete_note(tmp_path: Path) -> None:
    repo = SqliteVaultRepo(tmp_path / "cache.db")
    repo.upsert_note(_note("a.md", "to delete"))
    repo.delete_note(Path("a.md"))
    assert repo.search("delete") == []
    repo.close()
