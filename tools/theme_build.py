"""Tools — TOML themes → CSS tokens + per-theme css."""

from __future__ import annotations

from pathlib import Path

try:
    import tomllib
except ImportError:
    import tomli as tomllib  # type: ignore[import-not-found]


def build_themes(themes_dir: Path, out_dir: Path) -> None:
    """Generate tokens.css and themes/*.css from *.toml."""
    out_dir.mkdir(parents=True, exist_ok=True)
    themes_out = out_dir / "themes"
    themes_out.mkdir(exist_ok=True)

    tokens_lines = [":root{"]
    for toml_path in sorted(themes_dir.glob("*.toml")):
        data = tomllib.loads(toml_path.read_text(encoding="utf-8"))
        name = data["theme"]["name"]
        colors = data.get("colors", {})
        glass = data.get("glass", {})
        fonts = data.get("fonts", {})

        # per-theme CSS
        css = (
            f'[data-theme="{name}"]{{\n'
            f'  --bg:{colors.get("bg","#0f172a")};\n'
            f'  --surface:{colors.get("surface","#1e293b")};\n'
            f'  --text:{colors.get("text","#e2e8f0")};\n'
            f'  --accent:{colors.get("accent","#38bdf8")};\n'
            f'  --border:{colors.get("border","rgba(255,255,255,0.18)")};\n'
            f'  --glass-bg:{colors.get("glass_bg","rgba(255,255,255,0.10)")};\n'
            f'  --muted:{colors.get("muted","#94a3b8")};\n'
            f'  --blur:{glass.get("blur","16px")};\n'
            f'  --saturate:{glass.get("saturate","180%")};\n'
            f'  --radius:{glass.get("radius","12px")};\n'
            f'  --shadow:{glass.get("shadow","0 8px 32px rgba(0,0,0,0.10)")};\n'
            f'  --font-sans:{fonts.get("sans","system-ui,sans-serif")};\n'
            f'  --font-mono:{fonts.get("mono","monospace")};\n'
            "}\n"
        )
        (themes_out / f"{name}.css").write_text(css, encoding="utf-8")

        if name == "default":
            tokens_lines.extend(
                [
                    f'  --bg:{colors.get("bg")};',
                    f'  --accent:{colors.get("accent")};',
                    f'  --glass-bg:{colors.get("glass_bg")};',
                    f'  --border:{colors.get("border")};',
                ]
            )
    tokens_lines.append("}")
    tokens_lines.append('.glass{background:var(--glass-bg);backdrop-filter:blur(var(--blur)) saturate(var(--saturate));border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow)}')
    (out_dir / "tokens.css").write_text("\n".join(tokens_lines), encoding="utf-8")
    print(f"Built {len(list(themes_dir.glob('*.toml')))} themes → {out_dir}")


if __name__ == "__main__":
    build_themes(Path("assets/themes"), Path("assets/web/css"))
