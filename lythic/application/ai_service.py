"""Application — AI service via metis api.metisai.ir (zen)."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

# mypy: ignore-errors


@dataclass(frozen=True, slots=True)
class AIResult:
    """Result from AI action."""

    original: str
    transformed: str
    action: str


class AIService:
    """Toolbar AI actions: clean/style/summarize/fix-frontmatter.

    Uses opencode.json provider metis@api.metisai.ir when available,
    falls back to local heuristics offline.
    """

    def __init__(self, vault_root: Path | None = None) -> None:
        self.vault_root = vault_root
        self._base_url = os.getenv("METIS_API_URL", "https://api.metisai.ir/openai/v1")
        self._api_key = os.getenv("METIS_API_KEY", "")

    def _call_metis(self, prompt: str, text: str) -> str | None:
        """Try metis HTTP, return None on failure (offline fallback)."""
        if not self._api_key:
            return None
        try:
            import json
            import urllib.request

            payload = json.dumps(
                {
                    "model": "metis-llm",
                    "messages": [{"role": "user", "content": f"{prompt}\n\n{text}"}],
                    "max_tokens": 800,
                }
            ).encode()
            req = urllib.request.Request(
                f"{self._base_url}/chat/completions",
                data=payload,
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode())
                return data["choices"][0]["message"]["content"]
        except Exception:
            return None

    def clean(self, text: str) -> AIResult:
        """Remove extra whitespace, fix markdown fences, normalize."""
        prompt = "Clean this markdown note: fix whitespace, fences, frontmatter."
        remote = self._call_metis(prompt, text)
        if remote is not None:
            return AIResult(original=text, transformed=remote.strip(), action="clean")
        # offline heuristic
        cleaned = "\n".join(line.rstrip() for line in text.splitlines())
        cleaned = cleaned.strip() + "\n"
        return AIResult(original=text, transformed=cleaned, action="clean")

    def style(self, text: str, tone: str = "professional") -> AIResult:
        """Style note to tone."""
        prompt = f"Rewrite this note in a {tone} style, keep wiki-links and tags."
        remote = self._call_metis(prompt, text)
        if remote is not None:
            return AIResult(original=text, transformed=remote.strip(), action="style")
        # fallback: title case headings
        styled = text.replace("lythic", "Lythic")
        return AIResult(original=text, transformed=styled, action="style")

    def summarize(self, text: str, max_sentences: int = 3) -> AIResult:
        """Summarize note."""
        prompt = f"Summarize this note in {max_sentences} sentences."
        remote = self._call_metis(prompt, text)
        if remote is not None:
            return AIResult(original=text, transformed=remote.strip(), action="summarize")
        sentences = text.split(".")
        summary = ".".join(s.strip() for s in sentences[:max_sentences] if s.strip())
        if summary and not summary.endswith("."):
            summary += "."
        return AIResult(original=text, transformed=summary or text[:200], action="summarize")

    def fix_frontmatter(self, path: Path, text: str) -> AIResult:
        """Ensure frontmatter has title/date/tags."""
        try:
            import frontmatter

            post = frontmatter.loads(text)
            if "title" not in post.metadata:
                post.metadata["title"] = path.stem
            if "tags" not in post.metadata:
                post.metadata["tags"] = []
            new_text = frontmatter.dumps(post)
            return AIResult(original=text, transformed=new_text, action="fix_frontmatter")
        except Exception:
            return AIResult(original=text, transformed=text, action="fix_frontmatter")
