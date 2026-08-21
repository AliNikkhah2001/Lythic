"""Presentation — MediaEmbed (QtMultimedia video + image)."""

from __future__ import annotations

from pathlib import Path

# mypy: ignore-errors
try:
    from PySide6.QtCore import QSize, Qt, QUrl
    from PySide6.QtGui import QPixmap
    from PySide6.QtWidgets import QLabel, QWidget

    class MediaEmbed:
        """Handles picture drag→vault/attachments + video poster."""

        def __init__(self, vault_root: Path) -> None:
            self.vault_root = vault_root
            self.attach_dir = vault_root / "attachments"
            self.attach_dir.mkdir(parents=True, exist_ok=True)

        def image_label(self, path: Path, max_size: QSize | None = None) -> QLabel:
            """Create QLabel with scaled pixmap."""
            if max_size is None:
                max_size = QSize(400, 300)
            label = QLabel()
            pix = QPixmap(str(path))
            if not pix.isNull():
                label.setPixmap(pix.scaled(max_size, Qt.KeepAspectRatio, Qt.SmoothTransformation))
            label.setToolTip(str(path))
            return label

        def video_widget(self, path: Path) -> QWidget:
            """Create video widget (QMediaPlayer+QVideoWidget or fallback <video> HTML)."""
            try:
                from PySide6.QtMultimedia import QMediaPlayer
                from PySide6.QtMultimediaWidgets import QVideoWidget

                player = QMediaPlayer()
                video = QVideoWidget()
                player.setVideoOutput(video)
                player.setSource(QUrl.fromLocalFile(str(path)))
                # poster: return container with video
                return video
            except ImportError:
                # fallback: label with <video> hint
                lbl = QLabel(f"<video controls src='{path.name}'></video>")
                lbl.setTextFormat(Qt.RichText)
                return lbl

        def handle_drop(self, url: QUrl) -> Path | None:
            """Copy dropped file to attachments and return new path."""
            src = Path(url.toLocalFile())
            if not src.exists():
                return None
            dst = self.attach_dir / src.name
            try:
                dst.write_bytes(src.read_bytes())
                return dst
            except Exception:
                return None

except ImportError:  # pragma: no cover

    class MediaEmbed:  # type: ignore[no-redef]
        def __init__(self, vault_root: Path) -> None:
            self.vault_root = vault_root

        def image_label(self, path: Path, max_size=None):  # type: ignore[no-untyped-def]
            return None

        def video_widget(self, path: Path):  # type: ignore[no-untyped-def]
            return None

        def handle_drop(self, url):  # type: ignore[no-untyped-def]
            return None
