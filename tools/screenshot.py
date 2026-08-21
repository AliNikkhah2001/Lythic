"""Take screenshots of the running Lythic app using Qt's QScreen.grabWindow."""

from __future__ import annotations

import sys
import time
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from PySide6.QtCore import QTimer
from PySide6.QtGui import QGuiApplication, QScreen
from PySide6.QtWidgets import QApplication


def take_screenshot(output_path: Path, delay_ms: int = 2000) -> None:
    """Launch app, wait delay, grab screen, save PNG."""
    app = QApplication.instance() or QApplication(sys.argv)

    # Import and setup the real app
    vault_root = Path(__file__).resolve().parents[1] / "vault"

    from lythic.application.vault_service import VaultService
    from lythic.infrastructure.qss_builder import build_qss
    from lythic.infrastructure.theme_service import ThemeService
    from lythic.presentation.EditorPane import EditorPane
    from lythic.presentation.GraphView import GraphView
    from lythic.presentation.PreviewPane import PreviewPane
    from lythic.presentation.VaultTree import VaultTree

    from PySide6.QtCore import Qt
    from PySide6.QtWidgets import QMainWindow, QSplitter, QLabel, QTextEdit

    vault_root.mkdir(parents=True, exist_ok=True)
    svc = VaultService(vault_root)
    svc.index_all()
    graph = svc.build_graph()

    theme_svc = ThemeService(vault_root=vault_root)
    active_theme = theme_svc.current_name()
    app.setStyleSheet(build_qss(active_theme, vault_root))
    app.setApplicationName("Lythic")
    app.setOrganizationName("Lythic")
    app.setStyle("Fusion")

    win = QMainWindow()
    win.setWindowTitle(f"Lythic — {vault_root} — {len(graph.nodes)} notes")
    win.resize(1400, 900)
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
    preview.set_theme(active_theme)
    if first_md:
        preview.update_content(editor.content)
    preview_widget = preview.create_widget()
    if preview_widget is None:
        fallback = QTextEdit()
        fallback.setReadOnly(True)
        fallback.setPlainText(preview.html or "<preview>")
        preview_widget = fallback

    # Far-right: graph
    gv = GraphView()
    gv.set_theme(active_theme)
    gv.set_graph(graph)
    graph_widget = gv.create_widget()
    if graph_widget is None:
        fallback_g = QTextEdit()
        fallback_g.setReadOnly(True)
        fallback_g.setPlainText(f"Graph: {len(graph.nodes)} nodes, {len(graph.edges)} edges")
        graph_widget = fallback_g

    splitter.addWidget(tree_view)
    splitter.addWidget(editor_widget)
    splitter.addWidget(preview_widget)
    splitter.addWidget(graph_widget)
    splitter.setSizes([240, 420, 380, 360])
    win.setCentralWidget(splitter)

    # Status bar
    from lythic.domain.graph_clustering import cluster_graph
    from lythic.presentation.graph_channel import GraphChannel

    clusters = cluster_graph(graph)
    channel = GraphChannel()
    renderer = channel.choose_renderer(len(graph.nodes))
    win.statusBar().showMessage(
        f"Idx {len(graph.nodes)}n {len(graph.edges)}e cl:{len(clusters)} {renderer} Qt:PySide6"
    )

    win.show()

    def do_screenshot():
        screen = app.primaryScreen()
        if screen is None:
            print("ERROR: no screen available")
            app.quit()
            return
        pixmap = screen.grabWindow(win.winId())
        output_path.parent.mkdir(parents=True, exist_ok=True)
        pixmap.save(str(output_path), "PNG")
        print(f"Screenshot saved: {output_path} ({pixmap.width()}x{pixmap.height()})")
        app.quit()

    QTimer.singleShot(delay_ms, do_screenshot)
    app.exec()
    svc.close()


if __name__ == "__main__":
    out = Path(__file__).resolve().parents[1] / "docs" / "screenshots" / "lythic-main.png"
    take_screenshot(out, delay_ms=3000)
