"""Infrastructure — LaTeX renderer (KaTeX bundle + matplotlib fallback)."""

from __future__ import annotations

import re
from pathlib import Path

_KATEX_CSS = "assets/katex/katex.min.css"
_KATEX_JS = "assets/katex/katex.min.js"
_KATEX_RENDER = "assets/katex/auto-render.min.js"


def has_katex_bundle() -> bool:
    """Check local KaTeX bundle exists."""
    return Path(_KATEX_JS).exists() and Path(_KATEX_CSS).exists()


def render_math_html(text: str) -> str:
    """Replace $inline$ and $$display$$ with KaTeX spans (offline bundle)."""
    # display $$...$$
    text = re.sub(r"\$\$(.+?)\$\$", r'<span class="katex-display">\1</span>', text, flags=re.DOTALL)
    # inline $...$
    text = re.sub(r"(?<!\$)\$(.+?)\$(?!\$)", r'<span class="katex">\1</span>', text)
    return text


def katex_header() -> str:
    """HTML header tags for KaTeX (bundle or CDN fallback)."""
    if has_katex_bundle():
        return (
            f'<link rel="stylesheet" href="{_KATEX_CSS}">'
            f'<script src="{_KATEX_JS}"></script>'
            f'<script src="{_KATEX_RENDER}"></script>'
        )
    # CDN fallback 0.16.9
    return (
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">'
        '<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>'
        '<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>'
    )


def render_with_fallback(markdown_html: str) -> str:
    """Wrap HTML with KaTeX header and trigger auto-render."""
    header = katex_header()
    return (
        f"{header}<div class='markdown-body'>{render_math_html(markdown_html)}</div>"
        "<script>document.addEventListener('DOMContentLoaded',function(){"
        "if(window.renderMathInElement){renderMathInElement(document.body,{"
        "delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}]});}});</script>"
    )
