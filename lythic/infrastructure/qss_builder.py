"""Infrastructure — QSS Fusion dark glass stylesheet for native Qt widgets.

Mirrors assets/web/css tokens so native shell matches WebEngine glass.
"""

from __future__ import annotations

from lythic.infrastructure.theme_service import ThemeService


def build_qss(theme: str = "default", vault_root: object = None) -> str:
    """Generate QSS from theme tokens (native widgets)."""
    svc = ThemeService(vault_root=vault_root)  # type: ignore[arg-type]
    t = svc.load(theme)
    c = t.colors
    g = t.glass
    f = t.fonts
    bg = c.get("bg", "#0f172a")
    surface = c.get("surface", "#1e293b")
    surface_hover = c.get("surface_hover", "#334155")
    text = c.get("text", "#e2e8f0")
    muted = c.get("text_muted", c.get("muted", "#94a3b8"))
    accent = c.get("accent", "#38bdf8")
    border = c.get("border", "rgba(255,255,255,0.18)")
    radius = g.get("radius", "12px")
    radius_sm = g.get("radius_sm", "8px")
    sans = f.get("sans", "system-ui")
    mono = f.get("mono", "monospace")
    return f"""
QMainWindow, QDialog {{
    background: {bg};
    color: {text};
    font-family: "{sans}";
}}
QSplitter::handle {{
    background: transparent;
    width: 2px;
}}
QToolBar {{
    background: rgba(255,255,255,0.06);
    border: 1px solid {border};
    border-radius: {radius_sm};
    padding: 4px;
    spacing: 4px;
}}
QToolBar QToolButton {{
    background: {surface};
    color: {text};
    border: 1px solid {border};
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 12px;
}}
QToolBar QToolButton:hover {{
    background: {surface_hover};
}}
QTreeView, QListView {{
    background: rgba(255,255,255,0.04);
    color: {text};
    border: 1px solid {border};
    border-radius: {radius};
    padding: 8px;
    outline: none;
}}
QTreeView::item:selected, QListView::item:selected {{
    background: {accent};
    color: {bg};
    border-radius: 6px;
}}
QTextEdit, QPlainTextEdit {{
    background: rgba(255,255,255,0.05);
    color: {text};
    border: 1px solid {border};
    border-radius: {radius};
    padding: 12px;
    font-family: "{mono}";
    font-size: 13px;
    selection-background-color: {accent};
    selection-color: {bg};
}}
QStatusBar {{
    background: rgba(255,255,255,0.06);
    color: {muted};
    border-top: 1px solid {border};
    font-size: 11px;
}}
QMenuBar {{
    background: {bg};
    color: {text};
}}
QMenuBar::item:selected {{
    background: {surface_hover};
    border-radius: 6px;
}}
QMenu {{
    background: {surface};
    color: {text};
    border: 1px solid {border};
    border-radius: {radius_sm};
    padding: 4px;
}}
QMenu::item:selected {{
    background: {accent};
    color: {bg};
    border-radius: 4px;
}}
QComboBox, QSpinBox, QLineEdit {{
    background: {surface};
    color: {text};
    border: 1px solid {border};
    border-radius: 6px;
    padding: 4px 8px;
}}
QPushButton {{
    background: {accent};
    color: {bg};
    border: none;
    border-radius: 6px;
    padding: 6px 14px;
    font-weight: 600;
}}
QPushButton:hover {{
    background: {c.get("accent_hover", accent)};
}}
QScrollBar:vertical {{
    background: transparent;
    width: 8px;
    margin: 0;
}}
QScrollBar::handle:vertical {{
    background: {border};
    border-radius: 4px;
    min-height: 24px;
}}
QScrollBar::add-line, QScrollBar::sub-line {{
    height: 0;
}}
QLabel {{
    color: {text};
    background: transparent;
}}
QCheckBox {{
    color: {text};
    spacing: 8px;
}}
"""
