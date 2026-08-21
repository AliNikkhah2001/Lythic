"""Presentation — VaultTree (QTreeView + QFileSystemModel filter)."""

from __future__ import annotations

from pathlib import Path

try:
    from PySide6.QtCore import QDir
    from PySide6.QtWidgets import QFileSystemModel, QTreeView
except ImportError:  # pragma: no cover
    QDir = object
    QFileSystemModel = object
    QTreeView = object


class VaultTree:
    """Vault file explorer — wraps QTreeView for testing without display."""

    def __init__(self, vault_root: Path) -> None:
        self.vault_root = vault_root
        self._model: object | None = None
        self._view: object | None = None

    def create_view(self) -> object:
        """Create Qt view when display available."""
        try:
            from PySide6.QtWidgets import QFileSystemModel, QTreeView

            model = QFileSystemModel()
            model.setRootPath(str(self.vault_root))
            model.setNameFilters(["*.md"])
            model.setNameFilterDisables(False)
            view = QTreeView()
            view.setModel(model)
            view.setRootIndex(model.index(str(self.vault_root)))
            self._model = model
            self._view = view
            return view
        except ImportError:
            return None

    def list_markdown_files(self) -> list[Path]:
        """Non-Qt fallback for tests."""
        return sorted(self.vault_root.rglob("*.md"))
