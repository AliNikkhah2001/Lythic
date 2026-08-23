"""Infrastructure — ThemeService (TOML → CSS vars, QSettings+config.json)."""

# mypy: ignore-errors
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

try:
    import tomllib
except ImportError:
    import tomli as tomllib  # type: ignore[import-not-found]


@dataclass(frozen=True, slots=True)
class Theme:
    """Loaded theme tokens."""

    name: str
    display: str
    colors: dict[str, str]
    glass: dict[str, str]
    fonts: dict[str, str]


class ThemeService:
    """Load TOML themes, resolve vault overlay, persist via QSettings."""

    def __init__(self, themes_dir: Path | None = None, vault_root: Path | None = None) -> None:
        if themes_dir is not None:
            self.themes_dir = themes_dir
        else:
            # resolve repo-root assets/themes regardless of cwd (was Path("assets/themes"))
            dev = Path(__file__).resolve().parents[2] / "assets" / "themes"
            self.themes_dir = dev if dev.exists() else Path("assets/themes")
        self.vault_root = vault_root
        self._cache: dict[str, Theme] = {}

    def list_themes(self) -> list[str]:
        """List available theme names."""
        if not self.themes_dir.exists():
            return ["default"]
        return sorted(p.stem for p in self.themes_dir.glob("*.toml"))

    def load(self, name: str) -> Theme:
        """Load theme by name, cached."""
        if name in self._cache:
            return self._cache[name]
        path = self.themes_dir / f"{name}.toml"
        if not path.exists():
            path = self.themes_dir / "default.toml"
        data = tomllib.loads(path.read_text(encoding="utf-8"))
        theme = Theme(
            name=data["theme"]["name"],
            display=data["theme"].get("display", name),
            colors=data.get("colors", {}),
            glass=data.get("glass", {}),
            fonts=data.get("fonts", {}),
        )
        self._cache[name] = theme
        return theme

    def current_name(self) -> str:
        """Resolve vault/.lythic/config.json overlay, else QSettings, else default."""
        if self.vault_root:
            cfg = self.vault_root / ".lythic" / "config.json"
            if cfg.exists():
                try:
                    import json

                    data = json.loads(cfg.read_text(encoding="utf-8"))
                    name = data.get("theme")
                    if isinstance(name, str) and name:
                        return name
                except Exception:
                    pass
        try:
            from PySide6.QtCore import QSettings

            settings = QSettings("Lythic", "Lythic")
            val = settings.value("theme", "default")
            if isinstance(val, str) and val:
                return val
        except Exception:
            pass
        return "default"

    def save(self, name: str) -> None:
        """Persist to QSettings + vault config.json."""
        try:
            from PySide6.QtCore import QSettings

            QSettings("Lythic", "Lythic").setValue("theme", name)
        except Exception:
            pass
        if self.vault_root:
            try:
                import json

                cfg = self.vault_root / ".lythic" / "config.json"
                cfg.parent.mkdir(parents=True, exist_ok=True)
                data: dict[str, str] = {}
                if cfg.exists():
                    try:
                        data = json.loads(cfg.read_text(encoding="utf-8"))
                    except Exception:
                        data = {}
                data["theme"] = name
                cfg.write_text(json.dumps(data, indent=2), encoding="utf-8")
            except Exception:
                pass

    def css_vars(self, name: str) -> str:
        """Return :root CSS vars for theme."""
        theme = self.load(name)
        return (
            f":root{{--bg:{theme.colors.get('bg')};--accent:{theme.colors.get('accent')};"
            f"--glass-bg:{theme.colors.get('glass_bg')};--border:{theme.colors.get('border')};}}"
        )
