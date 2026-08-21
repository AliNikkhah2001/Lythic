"""Launch Lythic app and keep alive for screenshots."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
os.environ['QTWEBENGINE_CHROMIUM_FLAGS'] = '--disable-gpu'

from PySide6.QtWidgets import QApplication, QMainWindow, QSplitter, QLabel, QTextEdit
from PySide6.QtCore import Qt, QTimer
from pathlib import Path

vault_root = Path(__file__).resolve().parents[1] / "vault"
app = QApplication(sys.argv)
app.setStyle("Fusion")

from lythic.application.vault_service import VaultService
from lythic.infrastructure.qss_builder import build_qss
from lythic.infrastructure.theme_service import ThemeService
from lythic.presentation.EditorPane import EditorPane
from lythic.presentation.GraphView import GraphView
from lythic.presentation.PreviewPane import PreviewPane
from lythic.presentation.VaultTree import VaultTree

svc = VaultService(vault_root)
svc.index_all()
graph = svc.build_graph()

ts = ThemeService(vault_root=vault_root)
theme = ts.current_name()
app.setStyleSheet(build_qss(theme, vault_root))

win = QMainWindow()
win.setWindowTitle(f"Lythic — {len(graph.nodes)} notes")
win.resize(1400, 900)
splitter = QSplitter(Qt.Horizontal)

vt = VaultTree(vault_root)
tv = vt.create_view()
first_md = next(vault_root.rglob("*.md"), None)
ed = EditorPane(first_md)
ew = ed.create_widget()
prev = PreviewPane(svc.parser)
prev.set_theme(theme)
if first_md:
    prev.update_content(ed.content)
pw = prev.create_widget()
gv = GraphView()
gv.set_theme(theme)
gv.set_graph(graph)
gw = gv.create_widget()

splitter.addWidget(tv)
splitter.addWidget(ew)
splitter.addWidget(pw)
splitter.addWidget(gw)
splitter.setSizes([240, 420, 380, 360])
win.setCentralWidget(splitter)
win.show()
print("APP_READY", flush=True)

QTimer.singleShot(20000, app.quit)
app.exec()
svc.close()
