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
        )
    except ImportError as e:  # pragma: no cover
        print(f"Qt import failed: {e}")
        return 1

    app = QApplication(sys.argv)
    app.setApplicationName("Lythic")
    app.setOrganizationName("Lythic")
    app.setStyle("Fusion")

    # Lazy imports after QApplication (needs event loop)
    from lythic.application.vault_service import VaultService
    from lythic.infrastructure.qss_builder import build_qss
    from lythic.infrastructure.theme_service import ThemeService
    from lythic.presentation.EditorPane import EditorPane
    from lythic.presentation.GraphView import GraphView
    from lythic.presentation.PreviewPane import PreviewPane
    from lythic.presentation.VaultTree import VaultTree

    vault_root.mkdir(parents=True, exist_ok=True)
    svc = VaultService(vault_root)
    svc.index_all()
    graph = svc.build_graph()

    # Theme (M1+M9) — QSS Fusion glass for native shell
    theme_svc = ThemeService(vault_root=vault_root)
    active_theme = theme_svc.current_name()
    app.setStyleSheet(build_qss(active_theme, vault_root))

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

    # Right: preview (glass design system)
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

    # Far-right: graph (visible interactive, not hidden export)
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

    # Attach EditingToolbar to QMainWindow (M5)
    try:
        from lythic.presentation.EditingToolbar import EditingToolbar

        toolbar = EditingToolbar(editor_widget).widget()  # type: ignore[no-untyped-call]
        if toolbar is not None:
            win.addToolBar(toolbar)
    except Exception:
        pass

    # Status bar: git + clusters (M4) + sigma switch (M3)
    from lythic.domain.graph_clustering import cluster_graph
    from lythic.infrastructure.git_service import GitAutoSync, create_git_service
    from lythic.presentation.graph_channel import GraphChannel

    git = create_git_service(Path.cwd())
    st = git.status()
    clusters = cluster_graph(graph)
    channel = GraphChannel()
    renderer = channel.choose_renderer(len(graph.nodes))
    status_msg = (
        f"Idx {len(graph.nodes)}n {len(graph.edges)}e "
        f"cl:{len(clusters)} {renderer} git:{st.branch or '—'}"
        f"{' dirty' if st.is_dirty else ''} Qt:{binding}"
    )
    win.statusBar().showMessage(status_msg)

    try:
        win.setProperty("theme", active_theme)
        autosync = GitAutoSync(vault_root, interval_ms=30000)
        autosync.start()
        app.aboutToQuit.connect(lambda: autosync.stop())
    except Exception:
        pass

    # Watchdog + QTimer 200ms debounce (fixes watcher.py:102 never started)
    try:
        from PySide6.QtCore import QTimer

        from lythic.infrastructure.sqlite_repo import SqliteVaultRepo
        from lythic.infrastructure.watcher import VaultIndexer, start_observer

        repo_for_watch = SqliteVaultRepo(vault_root / ".lythic" / "cache.db")
        indexer = VaultIndexer(vault_root, repo_for_watch, svc.parser)
        pending: set[Path] = set()
        timer = QTimer()
        timer.setSingleShot(True)
        timer.setInterval(200)

        def on_timer() -> None:
            for path in list(pending):
                indexer.index_file(path)
            pending.clear()
            refreshed = svc.build_graph()
            gv.set_graph(refreshed)
            # refresh web view without full reload if possible
            try:
                new_html = Path("/tmp/lythic-graph.html")
                gv.export_html(new_html)
                if hasattr(graph_widget, "setHtml"):
                    html_str = new_html.read_text(encoding="utf-8")
                    from lythic.infrastructure.resources import base_url

                    graph_widget.setHtml(html_str, base_url())
            except Exception:
                pass
            win.setWindowTitle(f"Lythic — {vault_root} — {len(refreshed.nodes)} notes")
            win.statusBar().showMessage(
                f"Live: {len(refreshed.nodes)} nodes | {len(refreshed.edges)} links"
            )

        timer.timeout.connect(on_timer)

        def on_change(path: Path) -> None:
            pending.add(path)
            if not timer.isActive():
                timer.start()

        observer = start_observer(vault_root, on_change)
        # ensure observer stops on close
        app.aboutToQuit.connect(lambda: (observer.stop(), observer.join(timeout=1)))  # type: ignore[attr-defined]
    except Exception:
        pass

    win.show()
    # Browser fallback export
    gv.export_html(Path("/tmp/lythic-graph.html"))
    print(f"Graph → /tmp/lythic-graph.html ({len(graph.nodes)} nodes, {len(graph.edges)} edges)")
    print(f"Lythic GUI running — vault={vault_root} 4-pane close window to exit")

    code = app.exec()
    svc.close()
    return int(code)
