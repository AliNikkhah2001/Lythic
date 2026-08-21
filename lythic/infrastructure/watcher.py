"""Infrastructure — File watcher (watchdog) + incremental indexer helpers."""

from __future__ import annotations

import hashlib
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from watchdog.events import FileSystemEvent, FileSystemEventHandler
from watchdog.observers import Observer

from lythic.infrastructure.markdown_parser import ObsidianMarkdownParser
from lythic.infrastructure.sqlite_repo import SqliteVaultRepo

IGNORED_DIRS = {".git", ".obsidian", "__pycache__", ".lythic", ".venv", "node_modules"}


def is_ignored(path: Path, vault_root: Path) -> bool:
    """Check if path should be ignored (pathspec-lite)."""
    try:
        rel = path.relative_to(vault_root)
    except ValueError:
        return True
    for part in rel.parts:
        if part in IGNORED_DIRS:
            return True
    return path.suffix not in {".md", ""} and path.is_file() and path.suffix != ".md"


def file_hash(path: Path) -> str:
    """SHA1 of file content."""
    return hashlib.sha1(path.read_bytes()).hexdigest()


@dataclass(slots=True)
class IndexResult:
    """Result of incremental index."""

    path: Path
    updated: bool
    deleted: bool = False


class IndexerPort(Protocol):
    """Domain port for indexing."""

    def index_file(self, path: Path) -> IndexResult: ...


class VaultIndexer:
    """Incremental vault indexer — hashes + mtime check."""

    def __init__(
        self, vault_root: Path, repo: SqliteVaultRepo, parser: ObsidianMarkdownParser
    ) -> None:
        self.vault_root = vault_root
        self.repo = repo
        self.parser = parser

    def index_file(self, path: Path) -> IndexResult:
        if not path.exists():
            self.repo.delete_note(path)
            return IndexResult(path=path, updated=False, deleted=True)
        if is_ignored(path, self.vault_root):
            return IndexResult(path=path, updated=False)
        raw = path.read_text(encoding="utf-8", errors="ignore")
        mtime = path.stat().st_mtime
        note = self.parser.parse(path, raw, mtime)
        self.repo.upsert_note(note)
        return IndexResult(path=path, updated=True)

    def index_all(self) -> int:
        """Full scan — returns count."""
        count = 0
        for md_file in self.vault_root.rglob("*.md"):
            if is_ignored(md_file, self.vault_root):
                continue
            self.index_file(md_file)
            count += 1
        return count


class VaultEventHandler(FileSystemEventHandler):
    """Watchdog handler — debouncing delegated to QTimer in presentation."""

    def __init__(self, on_change: Callable[[Path], None], vault_root: Path) -> None:
        super().__init__()
        self._on_change = on_change
        self._vault_root = vault_root

    def on_any_event(self, event: FileSystemEvent) -> None:
        # watchdog gives str path
        p = Path(str(event.src_path))
        if is_ignored(p, self._vault_root):
            return
        # Debounce is handled by QTimer 200ms in MainWindow; we fire immediately
        self._on_change(p)


def start_observer(vault_root: Path, on_change: Callable[[Path], None]) -> Observer:  # type: ignore[valid-type]
    """Helper to start watchdog observer (caller must .stop()/.join())."""
    handler = VaultEventHandler(on_change, vault_root)
    observer = Observer()
    observer.schedule(handler, str(vault_root), recursive=True)
    observer.start()
    return observer
