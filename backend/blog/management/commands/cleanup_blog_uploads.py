"""Command to clean up temporary uploaded files used by the blog editor.

The editor stores uploaded images/videos in ``MEDIA_ROOT / "blog_editor_temp"``
under a sub‑directory for each user (``<user_id>``).  After a blog is saved the
files are moved to the final ``blogs_source`` folder, but if the user abandons
the draft or an error occurs some files can remain.  This command removes files
that are older than 24 hours and deletes empty user directories.

It is safe to run manually or via a daily cron job.  The command does **not**
touch any files that are newer than the threshold, so it will never delete a
file that is still in use.
"""

import time
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Delete temporary blog editor uploads older than 24 hours"

    def handle(self, *args, **options):
        base_dir = Path(settings.MEDIA_ROOT) / "blog_editor_temp"
        if not base_dir.exists():
            self.stdout.write(
                self.style.SUCCESS("No temporary upload directory found.")
            )
            return

        now = time.time()
        cutoff = now - 24 * 60 * 60  # 24 hours
        removed_files = 0
        removed_dirs = 0

        for user_dir in base_dir.iterdir():
            if not user_dir.is_dir():
                continue
            # Remove old files inside the user directory
            for file_path in user_dir.iterdir():
                if file_path.is_file() and file_path.stat().st_mtime < cutoff:
                    try:
                        file_path.unlink()
                        removed_files += 1
                    except Exception as e:
                        self.stderr.write(f"Failed to delete {file_path}: {e}")
            # If the directory is now empty, remove it
            try:
                if not any(user_dir.iterdir()):
                    user_dir.rmdir()
                    removed_dirs += 1
            except Exception as e:
                self.stderr.write(f"Failed to remove directory {user_dir}: {e}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Cleanup complete: {removed_files} file(s) and {removed_dirs} empty directorie(s) removed."
            )
        )
