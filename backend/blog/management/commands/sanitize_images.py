"""Django management command to sanitize existing image filenames.

This command scans the static blog images directory, renames any file whose
name does not comply with the ``sanitizar_nombre`` rules and updates the
references stored in the ``BlogPost`` model (HTML content) as well as the
``cover_image`` field that may be present in the front‑matter.

Usage:
    python manage.py sanitize_images

The command is idempotent – running it multiple times will not cause further
changes once all filenames are already sanitized.
"""

import re
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

# Import the utility function that implements the sanitization logic
from blog.utils.importer.filename_utils import sanitizar_nombre

# Model where the HTML content is stored
from blog.models import BlogPost


class Command(BaseCommand):
    help = "Sanitiza nombres de archivos de imagen y actualiza referencias en la base de datos"

    def handle(self, *args, **options):
        # Root directory where static blog assets are collected.
        # In this project the static files live under ``backend/static/blogs``.
        # ``__file__`` points to ``backend/blog/management/commands/sanitize_images.py``.
        # ``parents[3]`` climbs up to the ``backend`` directory, then we append ``static/blogs``.
        static_root = Path(__file__).resolve().parents[3] / "static" / "blogs"
        if not static_root.exists():
            self.stdout.write(
                self.style.ERROR(
                    f"Directorio estático no encontrado: {static_root}"
                )
            )
            return

        rename_map = {}
        # -----------------------------------------------------------------
        # 1. Scan and rename files
        # -----------------------------------------------------------------
        for img_path in static_root.rglob("*.*"):
            if not img_path.is_file():
                continue
            sanitized = sanitizar_nombre(img_path.name)
            if sanitized != img_path.name:
                new_path = img_path.with_name(sanitized)
                # Avoid collisions: if the target name already exists, add a numeric suffix
                counter = 1
                while new_path.exists():
                    stem = Path(sanitized).stem
                    suffix = Path(sanitized).suffix
                    new_name = f"{stem}_{counter}{suffix}"
                    new_path = img_path.with_name(new_name)
                    counter += 1
                img_path.rename(new_path)
                rename_map[img_path.name] = new_path.name
                self.stdout.write(
                    f"Renombrado: {img_path.name} → {new_path.name}"
                )

        if not rename_map:
            self.stdout.write(
                self.style.SUCCESS(
                    "No se encontraron nombres de archivo que necesiten sanitización."
                )
            )
            return

        # -----------------------------------------------------------------
        # 2. Update references in BlogPost content (HTML)
        # -----------------------------------------------------------------
        with transaction.atomic():
            for post in BlogPost.objects.all():
                # Update the HTML content field (previously named ``content`` in older versions)
                original = getattr(post, "content_html", "")
                updated = original
                for old_name, new_name in rename_map.items():
                    # Replace occurrences of the old filename (both relative and absolute URLs)
                    pattern = re.escape(old_name)
                    updated = re.sub(pattern, new_name, updated)
                if updated != original:
                    setattr(post, "content_html", updated)
                    post.save(update_fields=["content_html"])
                    self.stdout.write(
                        f"Actualizado contenido_html de post ID={post.id}"
                    )

        # -----------------------------------------------------------------
        # 3. Update cover_image field if it references a renamed file
        # -----------------------------------------------------------------
        for post in BlogPost.objects.filter(cover_image__isnull=False):
            cover = post.cover_image or ""
            updated_cover = cover
            for old_name, new_name in rename_map.items():
                if old_name in cover:
                    updated_cover = cover.replace(old_name, new_name)
            if updated_cover != cover:
                post.cover_image = updated_cover
                post.save(update_fields=["cover_image"])
                self.stdout.write(f"Actualizado cover_image de post ID={post.id}")

        self.stdout.write(
            self.style.SUCCESS("Sanitización completada con éxito.")
        )
