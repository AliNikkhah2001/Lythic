"""Tools — TOML themes → CSS tokens + per-theme css."""

from __future__ import annotations

from pathlib import Path

try:
    import tomllib
except ImportError:
    import tomli as tomllib  # type: ignore[import-not-found]


def _css_var(key: str) -> str:
    return key.replace("_", "-")


def build_themes(themes_dir: Path, out_dir: Path) -> None:
    """Generate tokens.css and themes/*.css from *.toml (full design system)."""
    out_dir.mkdir(parents=True, exist_ok=True)
    themes_out = out_dir / "themes"
    themes_out.mkdir(exist_ok=True)

    default_data: dict[str, object] | None = None
    themes: list[str] = []

    for toml_path in sorted(themes_dir.glob("*.toml")):
        data = tomllib.loads(toml_path.read_text(encoding="utf-8"))
        name = data["theme"]["name"]
        themes.append(name)
        if name == "default":
            default_data = data

        # Build per-theme CSS with all sections → CSS vars
        lines: list[str] = [f'[data-theme="{name}"]{{']

        for section in ("colors", "glass", "spacing", "fonts", "motion", "effects"):
            sec = data.get(section, {})
            if not isinstance(sec, dict):
                continue
            for key, val in sec.items():
                var = _css_var(key)
                # expose as --{key} for colors/glass and --{section}-{key} for namespaced
                if section in ("colors", "glass", "spacing", "fonts", "motion"):
                    lines.append(f"  --{var}:{val};")
                lines.append(f"  --{section}-{var}:{val};")
        # theme meta
        lines.append(f"  --theme-name:{name};")
        lines.append("}")
        (themes_out / f"{name}.css").write_text("\n".join(lines), encoding="utf-8")

    # Build tokens.css from default + glass recipe
    if default_data is None:
        default_data = {}
    def_colors = default_data.get("colors", {}) if isinstance(default_data.get("colors"), dict) else {}
    def_glass = default_data.get("glass", {}) if isinstance(default_data.get("glass"), dict) else {}
    def_spacing = default_data.get("spacing", {}) if isinstance(default_data.get("spacing"), dict) else {}
    def_fonts = default_data.get("fonts", {}) if isinstance(default_data.get("fonts"), dict) else {}
    def_motion = default_data.get("motion", {}) if isinstance(default_data.get("motion"), dict) else {}
    def_effects = default_data.get("effects", {}) if isinstance(default_data.get("effects"), dict) else {}

    # Ensure .get works with dict[str,str]
    if not isinstance(def_colors, dict):
        def_colors = {}
    if not isinstance(def_glass, dict):
        def_glass = {}

    tokens_lines: list[str] = [":root{"]
    # core vars from default
    for k, v in def_colors.items():
        tokens_lines.append(f"  --{_css_var(k)}:{v};")
        tokens_lines.append(f"  --color-{_css_var(k)}:{v};")
    for k, v in def_glass.items():
        tokens_lines.append(f"  --{_css_var(k)}:{v};")
        tokens_lines.append(f"  --glass-{_css_var(k)}:{v};")
    for k, v in def_spacing.items():
        tokens_lines.append(f"  --spacing-{_css_var(k)}:{v};")
        tokens_lines.append(f"  --{_css_var(k)}:{v};")
    for k, v in def_fonts.items():
        tokens_lines.append(f"  --font-{_css_var(k)}:{v};")
    for k, v in def_motion.items():
        tokens_lines.append(f"  --motion-{_css_var(k)}:{v};")
    # effects backdrop
    backdrop = def_effects.get("backdrop_body", "radial-gradient(ellipse at top, #1e293b, #0f172a)")
    tokens_lines.append(f"  --backdrop-body:{backdrop};")
    tokens_lines.append("}")
    # also set default data-theme so :root == default
    tokens_lines.append('[data-theme="default"]{/* default mirrors :root */}')
    # write tokens.css
    (out_dir / "tokens.css").write_text("\n".join(tokens_lines), encoding="utf-8")
    print(f"Built {len(themes)} themes → {out_dir} ({', '.join(themes)})")


if __name__ == "__main__":
    build_themes(Path("assets/themes"), Path("assets/web/css"))
