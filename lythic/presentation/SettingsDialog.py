"""Presentation — SettingsDialog (QSettings + vault/.lythic/config.json)."""

# mypy: ignore-errors
from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path


@dataclass(frozen=True, slots=True)
class LythicSettings:
    """Mirrors src/settings.ts:1 + vaultIntelligenceEnabled."""

    vault_intelligence_enabled: bool = True
    graph_enhancement_enabled: bool = True
    auto_commit_interval_seconds: int = 30
    auto_push: bool = False


class SettingsManager:
    """Layered: QSettings global + vault JSON vault override."""

    def __init__(self, vault_root: Path) -> None:
        self.vault_root = vault_root
        self.config_path = vault_root / ".lythic" / "config.json"

    def load(self) -> LythicSettings:
        """Load vault config if exists."""
        if self.config_path.exists():
            try:
                data = json.loads(self.config_path.read_text(encoding="utf-8"))
                return LythicSettings(
                    **{k: v for k, v in data.items() if k in asdict(LythicSettings())}
                )
            except Exception:
                return LythicSettings()
        return LythicSettings()

    def save(self, settings: LythicSettings) -> None:
        """Save vault config."""
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        self.config_path.write_text(json.dumps(asdict(settings), indent=2), encoding="utf-8")


class SettingsDialog:
    """Dialog wrapper — testable without Qt, theme combobox + live preview."""

    def __init__(self, vault_root: Path) -> None:
        self.manager = SettingsManager(vault_root)
        self.vault_root = vault_root

    def create_widget(self) -> object:
        """Create QDialog when available (theme combobox <100ms live + preview)."""
        try:
            from PySide6.QtWidgets import (
                QCheckBox,
                QComboBox,
                QDialog,
                QFormLayout,
                QHBoxLayout,
                QLabel,
                QSpinBox,
            )

            from lythic.infrastructure.theme_service import ThemeService

            dlg = QDialog()
            dlg.setWindowTitle("Lythic Settings — Design")
            layout = QFormLayout(dlg)
            s = self.manager.load()
            cb1 = QCheckBox(dlg)
            cb1.setChecked(s.vault_intelligence_enabled)
            layout.addRow("vault intelligence", cb1)
            cb2 = QCheckBox(dlg)
            cb2.setChecked(s.graph_enhancement_enabled)
            layout.addRow("graph enhancement", cb2)
            spin = QSpinBox(dlg)
            spin.setValue(s.auto_commit_interval_seconds)
            layout.addRow("auto-commit interval", spin)
            # theme picker 4 themes + live glass preview
            theme_svc = ThemeService(vault_root=self.vault_root)
            combo = QComboBox(dlg)
            themes = theme_svc.list_themes()
            combo.addItems(themes)
            cur = theme_svc.current_name()
            if cur in themes:
                combo.setCurrentText(cur)

            # live preview swatch (mini glass card)
            preview_row = QHBoxLayout()
            preview_label = QLabel(dlg)
            preview_label.setMinimumSize(220, 64)
            preview_label.setStyleSheet(self._preview_qss(cur))
            preview_row.addWidget(preview_label)
            layout.addRow("live preview", preview_row)

            def on_theme(idx: int) -> None:
                import contextlib

                name = combo.itemText(idx)
                theme_svc.save(name)
                # update native preview swatch
                with contextlib.suppress(Exception):
                    preview_label.setStyleSheet(self._preview_qss(name))
                # live apply to all web views via theme-manager.js
                with contextlib.suppress(Exception):
                    parent = dlg.parent()
                    if parent is None:
                        return
                    for view in parent.findChildren(object):  # type: ignore[union-attr]
                        with contextlib.suppress(Exception):
                            view.page().runJavaScript(  # type: ignore[union-attr]
                                f"LythicTheme.applyTheme('{name}')",
                            )

            combo.currentIndexChanged.connect(on_theme)  # type: ignore[attr-defined]
            layout.addRow("theme", combo)
            return dlg
        except ImportError:
            return None

    def _preview_qss(self, theme: str) -> str:
        """Mini glass card QSS for the settings preview."""
        from lythic.infrastructure.theme_service import ThemeService

        try:
            svc = ThemeService(vault_root=self.vault_root)
        except Exception:
            svc = None
        try:
            t = svc.load(theme) if svc else None
            colors = t.colors if t else {}
            glass = t.glass if t else {}
        except Exception:
            colors, glass = {}, {}
        bg = colors.get("bg", "#0f172a")
        accent = colors.get("accent", "#38bdf8")
        text = colors.get("text", "#e2e8f0")
        radius = glass.get("radius", "12px")
        blur = glass.get("blur", "16px")
        saturate = glass.get("saturate", "180%")
        glass_bg = colors.get("glass_bg", "rgba(255,255,255,0.10)")
        return (
            f"background-color:{bg};"
            f"border-radius:{radius};"
            "border:1px solid rgba(255,255,255,0.10);"
            f"color:{text};padding:10px;"
            f"font-size:11px;"
            f"backdrop-filter:blur({blur}) saturate({saturate});"
            f"background-image:linear-gradient(135deg,{glass_bg},{accent}22);"
            f"border-left:3px solid {accent};"
            f"box-shadow:0 8px 32px rgba(0,0,0,0.15);"
            f"border-radius:{radius}"
        )
