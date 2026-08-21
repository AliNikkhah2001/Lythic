"""Infrastructure — Resources (asset paths, baseUrl for QWebEngine)."""

from __future__ import annotations

from pathlib import Path


def assets_root() -> Path:
    """Resolve assets/web root (installed vs dev)."""
    dev = Path(__file__).resolve().parents[1] / "assets/web"
    if dev.exists():
        return dev
    alt = Path("assets/web")
    return alt.resolve() if alt.exists() else Path("assets/web")


def vendor_path(name: str) -> Path:
    """Vendor file path e.g. cytoscape.min.js."""
    return assets_root() / "vendor" / name


def theme_css_path(theme: str) -> Path:
    """Per-theme CSS path."""
    return assets_root() / "css" / "themes" / f"{theme}.css"


def tokens_css_path() -> Path:
    """Global tokens.css."""
    return assets_root() / "css" / "tokens.css"


def base_url() -> str:
    """File URL for QWebEngineView.setHtml baseUrl."""
    return assets_root().as_uri() + "/"
