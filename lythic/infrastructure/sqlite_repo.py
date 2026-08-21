"""Infrastructure — SQLite vault repo (WAL + FTS5 + JSON1).

DB at vault/.lythic/cache.db (gitignored). Tables: files, links, tags, fts_notes.
Migrations via PRAGMA user_version.
"""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Protocol

from lythic.domain.vault import Note

SCHEMA_VERSION = 1

SCHEMA_SQL = """
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS files (
  path TEXT PRIMARY KEY,
  mtime REAL NOT NULL,
  hash TEXT NOT NULL,
  frontmatter TEXT NOT NULL,
  word_count INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS links (
  src TEXT NOT NULL,
  dst TEXT NOT NULL,
  pos INTEGER NOT NULL,
  FOREIGN KEY(src) REFERENCES files(path) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_links_src ON links(src);
CREATE INDEX IF NOT EXISTS idx_links_dst ON links(dst);

CREATE TABLE IF NOT EXISTS tags (
  path TEXT NOT NULL,
  tag TEXT NOT NULL,
  FOREIGN KEY(path) REFERENCES files(path) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_tags_tag ON tags(tag);
CREATE INDEX IF NOT EXISTS idx_tags_path ON tags(path);

CREATE VIRTUAL TABLE IF NOT EXISTS fts_notes USING fts5(path, content, tokenize='porter unicode61');

CREATE VIEW IF NOT EXISTS backlinks_view AS SELECT dst AS path, src AS backlink FROM links;
"""


class VaultRepository(Protocol):
    """Domain port for persistence."""

    def upsert_note(self, note: Note) -> None: ...

    def delete_note(self, path: Path) -> None: ...

    def search(self, query: str, limit: int = 20) -> list[str]: ...

    def get_backlinks(self, target: str) -> list[str]: ...


class SqliteVaultRepo:
    """SQLite implementation."""

    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._migrate()

    def _migrate(self) -> None:
        cur = self._conn.execute("PRAGMA user_version")
        version = int(cur.fetchone()[0] or 0)
        if version < SCHEMA_VERSION:
            self._conn.executescript(SCHEMA_SQL)
            self._conn.execute(f"PRAGMA user_version={SCHEMA_VERSION}")
            self._conn.commit()

    def upsert_note(self, note: Note) -> None:
        fm_json = json.dumps(note.frontmatter, ensure_ascii=False)
        with self._conn:
            self._conn.execute(
                "INSERT OR REPLACE INTO files(path,mtime,hash,frontmatter,word_count) "
                "VALUES (?,?,?,?,?)",
                (str(note.path), note.mtime, note.content_hash, fm_json, note.word_count),
            )
            self._conn.execute("DELETE FROM links WHERE src=?", (str(note.path),))
            self._conn.execute("DELETE FROM tags WHERE path=?", (str(note.path),))
            self._conn.execute("DELETE FROM fts_notes WHERE path=?", (str(note.path),))
            for idx, link in enumerate(note.links):
                self._conn.execute(
                    "INSERT INTO links(src,dst,pos) VALUES (?,?,?)",
                    (str(note.path), link.target, idx),
                )
            for tag in note.tags:
                self._conn.execute(
                    "INSERT INTO tags(path,tag) VALUES (?,?)", (str(note.path), tag.name)
                )
            # FTS content = raw without frontmatter prefix is fine for search
            self._conn.execute(
                "INSERT INTO fts_notes(path,content) VALUES (?,?)",
                (str(note.path), note.raw_content),
            )

    def delete_note(self, path: Path) -> None:
        with self._conn:
            self._conn.execute("DELETE FROM files WHERE path=?", (str(path),))
            self._conn.execute("DELETE FROM fts_notes WHERE path=?", (str(path),))

    def search(self, query: str, limit: int = 20) -> list[str]:
        if not query.strip():
            return []
        # FTS5 MATCH — escape double quotes
        q = query.replace('"', '""')
        cur = self._conn.execute(
            "SELECT path, rank FROM fts_notes WHERE fts_notes MATCH ? ORDER BY rank LIMIT ?",
            (q, limit),
        )
        return [row["path"] for row in cur.fetchall()]

    def get_backlinks(self, target: str) -> list[str]:
        cur = self._conn.execute("SELECT src FROM links WHERE dst=?", (target,))
        return [row["src"] for row in cur.fetchall()]

    def get_all_files(self) -> list[str]:
        """Helper for graph builder."""
        cur = self._conn.execute("SELECT path FROM files")
        return [row["path"] for row in cur.fetchall()]

    def get_all_links(self) -> list[tuple[str, str]]:
        cur = self._conn.execute("SELECT src,dst FROM links")
        return [(row["src"], row["dst"]) for row in cur.fetchall()]

    def close(self) -> None:
        self._conn.close()
