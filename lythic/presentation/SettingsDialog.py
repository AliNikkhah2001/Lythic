"""Presentation — SettingsDialog (QSettings + vault/.lythic/config.json)."""

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
    """Dialog wrapper — testable without Qt."""

    def __init__(self, vault_root: Path) -> None:
        self.manager = SettingsManager(vault_root)

    def create_widget(self) -> object:
        """Create QDialog when available."""
        try:
            from PySide6.QtWidgets import QCheckBox, QDialog, QFormLayout, QSpinBox

            dlg = QDialog()
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
            return dlg
        except ImportError:
            return None
