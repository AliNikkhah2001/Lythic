"""Unit — git service (subprocess mock + Dulwich fallback)."""

from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

from lythic.infrastructure.git_service import DulwichGitAdapter, SubprocessGitAdapter


def test_should_create_git_service_factory(tmp_path: Path) -> None:
    from lythic.infrastructure.git_service import create_git_service

    svc = create_git_service(tmp_path)
    assert svc is not None


def test_should_parse_status_with_mock(tmp_path: Path) -> None:
    # Mock git binary exists
    with patch("lythic.infrastructure.git_service.shutil.which", return_value="/usr/bin/git"):
        svc = SubprocessGitAdapter(tmp_path)
        with patch("lythic.infrastructure.git_service._run_git") as mock_run:
            mock_run.side_effect = [
                (0, " M vault/a.md\n", ""),  # status
                (0, "main\n", ""),  # branch
            ]
            st = svc.status()
            assert st.is_dirty is True
            assert len(st.dirty_files) == 1


def test_should_not_dirty_when_clean(tmp_path: Path) -> None:
    with patch("lythic.infrastructure.git_service.shutil.which", return_value="/usr/bin/git"):
        svc = SubprocessGitAdapter(tmp_path)
        with patch("lythic.infrastructure.git_service._run_git", return_value=(0, "", "")):
            st = svc.status()
            assert st.is_dirty is False


def test_dulwich_adapter_status_not_dirty(tmp_path: Path) -> None:
    svc = DulwichGitAdapter(tmp_path)
    st = svc.status()
    assert st.is_dirty is False
