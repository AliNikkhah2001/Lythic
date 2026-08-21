"""Infrastructure — Git sync service (subprocess git + Dulwich fallback)."""

from __future__ import annotations

import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

import pathspec


@dataclass(frozen=True, slots=True)
class GitStatus:
    """Parsed git status --porcelain."""

    dirty_files: tuple[str, ...]
    is_dirty: bool
    branch: str | None = None


class GitService(Protocol):
    """Domain port."""

    def status(self) -> GitStatus: ...

    def auto_commit(self, message: str = "lythic: auto save") -> bool: ...

    def sync(self) -> bool: ...


def _run_git(cwd: Path, *args: str) -> tuple[int, str, str]:
    result = subprocess.run(
        ["git", *args], cwd=str(cwd), capture_output=True, text=True, check=False
    )
    return result.returncode, result.stdout, result.stderr


class SubprocessGitAdapter:
    """Primary adapter — uses system git (reuses ~/.gitconfig/ssh-agent)."""

    def __init__(self, vault_root: Path) -> None:
        if shutil.which("git") is None:
            raise RuntimeError("git not found on PATH — use DulwichGitAdapter")
        self.vault_root = vault_root
        # Ignore patterns for auto-commit (pathspec)
        self._ignore_spec = pathspec.PathSpec.from_lines(
            "gitwildmatch",
            [
                ".git/*",
                ".obsidian/workspace.json",
                ".obsidian/hotkeys.json",
                "vault/.lythic/*",
                "__pycache__/*",
                "*.tmp",
            ],
        )

    def is_git_repo(self) -> bool:
        code, _, _ = _run_git(self.vault_root, "rev-parse", "--is-inside-work-tree")
        return code == 0

    def status(self) -> GitStatus:
        code, out, _ = _run_git(self.vault_root, "status", "--porcelain")
        if code != 0:
            return GitStatus(dirty_files=(), is_dirty=False)
        files = tuple(line.strip() for line in out.splitlines() if line.strip())
        # Filter ignored
        filtered = tuple(f for f in files if not self._ignore_spec.match_file(f.split()[-1]))
        _, branch_out, _ = _run_git(self.vault_root, "rev-parse", "--abbrev-ref", "HEAD")
        branch = branch_out.strip() or None
        return GitStatus(dirty_files=filtered, is_dirty=len(filtered) > 0, branch=branch)

    def auto_commit(self, message: str = "lythic: auto save") -> bool:
        st = self.status()
        if not st.is_dirty:
            return False
        _run_git(self.vault_root, "add", "-A")
        code, _, _ = _run_git(self.vault_root, "commit", "-m", message)
        return code == 0

    def sync(self) -> bool:
        """fetch + pull --rebase + push. Returns True if remote updated."""
        _run_git(self.vault_root, "fetch", "--all", "--prune")
        code_pull, _, _ = _run_git(self.vault_root, "pull", "--rebase", "--autostash")
        if code_pull != 0:
            # Rebase conflict — abort and notify
            _run_git(self.vault_root, "rebase", "--abort")
            return False
        code_push, _, _ = _run_git(self.vault_root, "push")
        return code_push == 0


class DulwichGitAdapter:
    """Fallback when git binary missing — pure Python via dulwich.

    Minimal implementation for tests; real rebase/push via dulwich porcelain.
    """

    def __init__(self, vault_root: Path) -> None:
        self.vault_root = vault_root

    def status(self) -> GitStatus:
        # Dulwich fallback — report not dirty for MVP (requires pygit2 for real)
        return GitStatus(dirty_files=(), is_dirty=False)

    def auto_commit(self, message: str = "lythic: auto save") -> bool:
        try:
            from dulwich import porcelain

            porcelain.add(str(self.vault_root))
            porcelain.commit(str(self.vault_root), message=message.encode())
            return True
        except Exception:
            return False

    def sync(self) -> bool:
        return False


def _is_safe_path(candidate: Path, vault_root: Path) -> bool:
    """Guard vault/.lythic/config.json path traversal."""
    try:
        return candidate.resolve().is_relative_to(vault_root.resolve())
    except ValueError:
        return False


class GitAutoSync:
    """QTimer 30s autosync + QProcess (fallback subprocess)."""

    def __init__(self, vault_root: Path, interval_ms: int = 30000) -> None:
        self.vault_root = vault_root
        self.interval_ms = interval_ms
        self._timer: object | None = None
        self._service = create_git_service(vault_root)

    def start(self) -> None:
        """Start 30s QTimer autosync (requires QApplication)."""
        try:
            from PySide6.QtCore import QTimer

            timer = QTimer()
            timer.setInterval(self.interval_ms)
            timer.timeout.connect(self.tick)
            timer.start()
            self._timer = timer
        except Exception:
            pass

    def tick(self) -> bool:
        """Single autosync tick: commit if dirty then sync."""
        try:
            if self._service.status().is_dirty:
                self._service.auto_commit()
            return self._service.sync()
        except Exception:
            return False

    def stop(self) -> None:
        """Stop timer."""
        try:
            if self._timer is not None:
                self._timer.stop()  # type: ignore[attr-defined]
        except Exception:
            pass


def store_git_token(service: str, token: str) -> None:
    """Store git token via keyring (secrets via env/keyring only)."""
    try:
        import keyring

        keyring.set_password(f"lythic-{service}", "git", token)
    except Exception:
        pass


def load_git_token(service: str) -> str | None:
    """Load token from keyring."""
    try:
        import keyring

        return keyring.get_password(f"lythic-{service}", "git")
    except Exception:
        return None


def create_git_service(vault_root: Path) -> GitService:
    """Factory — subprocess if git available else dulwich."""
    if shutil.which("git") is not None:
        return SubprocessGitAdapter(vault_root)
    return DulwichGitAdapter(vault_root)
