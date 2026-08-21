"""Presentation — Lythic Qt App (QApplication + MainWindow). Headless-safe."""

from __future__ import annotations

import sys
from pathlib import Path

from lythic.presentation.qt_compat import get_qt_binding


def run_app(vault_root: Path) -> int:
    """Run Qt event loop. Returns exit code. Falls back to headless if Qt missing."""
    binding = get_qt_binding()
    if binding == "none":
        print("Qt not available (PySide6 not installed). Run: pip install PySide6")
        print("Headless index demo still works via: python -m lythic.presentation.main vault")
        from lythic.application.vault_service import VaultService

        svc = VaultService(vault_root)
        count = svc.index_all()
        print(f"Indexed {count} notes → {vault_root / '.lythic' / 'cache.db'}")
        print(f"Graph: {len(svc.build_graph().nodes)} nodes")
        svc.close()
        return 1

    try:
        from PySide6.QtCore import Qt
        from PySide6.QtWidgets import (
            QApplication,
            QLabel,
            QMainWindow,
            QSplitter,
            QTextEdit,
            QTreeView,
        )
    except ImportError as e:  # pragma: no cover
        print(f"Qt import failed: {e}")
        return 1

    app = QApplication(sys.argv)
    app.setApplicationName("Lythic")
    app.setOrganizationName("Lythic")

    # Lazy imports after QApplication (needs event loop)
    from lythic.application.vault_service import VaultService
    from lythic.presentation.EditorPane import EditorPane
    from lythic.presentation.GraphView import GraphView
    from lythic.presentation.PreviewPane import PreviewPane
    from lythic.presentation.VaultTree import VaultTree

    vault_root.mkdir(parents=True, exist_ok=True)
    svc = VaultService(vault_root)
    svc.index_all()
    graph = svc.build_graph()

    win = QMainWindow()
    win.setWindowTitle(f"Lythic — {vault_root} — {len(graph.nodes)} notes")
    win.resize(1200, 800)

    splitter = QSplitter(Qt.Horizontal)

    # Left: vault tree
    vault_tree = VaultTree(vault_root)
    tree_view = vault_tree.create_view()
    if tree_view is None:
        tree_view = QLabel(f"Vault: {vault_root}\n(no Qt tree)")

    # Center: editor
    first_md = next(vault_root.rglob("*.md"), None)
    editor = EditorPane(first_md)
    editor_widget = editor.create_widget()
    if editor_widget is None:
        editor_widget = QTextEdit()
        editor_widget.setPlainText(editor.content or "# Lythic\nOpen a note...")

    # Right: preview
    preview = PreviewPane(svc.parser)
    if first_md:
        preview.update_content(editor.content)
    preview_widget = preview.create_widget()
    if preview_widget is None:
        # Fallback QTextEdit showing HTML source
        fallback = QTextEdit()
        fallback.setReadOnly(True)
        fallback.setPlainText(preview.html or "<preview>")
        preview_widget = fallback

    splitter.addWidget(tree_view)
    splitter.addWidget(editor_widget)
    splitter.addWidget(preview_widget)
    splitter.setSizes([250, 500, 450])

    win.setCentralWidget(splitter)

    # Status bar: search + git
    from lythic.infrastructure.git_service import create_git_service

    git = create_git_service(Path.cwd())
    st = git.status()
    win.statusBar().showMessage(
        f"Indexed {len(graph.nodes)} notes | {len(graph.edges)} links | git:{st.branch or '—'}{' dirty' if st.is_dirty else ''} | Qt:{binding}"
    )

    win.show()
    # Also export graph HTML for browser fallback
    gv = GraphView()
    gv.set_graph(graph)
    gv.export_html(Path("/tmp/lythic-graph.html"))
    print(
        f"Graph exported → /tmp/lythic-graph.html  ({len(graph.nodes)} nodes, {len(graph.edges)} edges)"
    )
    print(f"Lythic GUI running — vault={vault_root}  close window to exit")

    code = app.exec()
    svc.close()
    return int(code)
