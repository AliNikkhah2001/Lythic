"""Presentation — MainWindow (QMainWindow splitter: VaultTree | Editor | Preview/Graph)."""

from __future__ import annotations

from pathlib import Path

from lythic.application.vault_service import VaultService
from lythic.infrastructure.git_service import create_git_service
from lythic.presentation.EditorPane import EditorPane
from lythic.presentation.GraphView import GraphView
from lythic.presentation.PreviewPane import PreviewPane
from lythic.presentation.SettingsDialog import SettingsManager
from lythic.presentation.VaultTree import VaultTree


class MainWindow:
    """Main window controller — Qt widget creation lazy for headless tests."""

    def __init__(self, vault_root: Path) -> None:
        self.vault_root = vault_root
        self.vault_service = VaultService(vault_root)
        self.git_service = create_git_service(vault_root)
        self.settings_manager = SettingsManager(vault_root)
        self.vault_tree = VaultTree(vault_root)
        self.editor = EditorPane()
        self.preview = PreviewPane(self.vault_service.parser)
        self.graph_view = GraphView()
        self._qt_window: object | None = None

    def index_vault(self) -> int:
        """Index vault and build graph."""
        count = self.vault_service.index_all()
        graph = self.vault_service.build_graph()
        self.graph_view.set_graph(graph)
        return count

    def search(self, query: str) -> list[str]:
        """Search via FTS5."""
        return self.vault_service.search(query)

    def create_window(self) -> object:
        """Create QMainWindow when display available."""
        try:
            from PySide6.QtWidgets import QMainWindow, QSplitter

            win = QMainWindow()
            win.setWindowTitle("Lythic — Vault: " + str(self.vault_root))
            splitter = QSplitter()
            # VaultTree + Editor + Preview are added lazily; for now just set central
            win.setCentralWidget(splitter)
            self._qt_window = win
            return win
        except ImportError:
            return None

    def close(self) -> None:
        self.vault_service.close()
