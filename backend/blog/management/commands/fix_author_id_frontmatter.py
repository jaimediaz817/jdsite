"""
Comando: fix_author_id_frontmatter

Arregla los archivos .md que no tienen author_id en el frontmatter.
Procesa todos los blogs source y agrega author_id resolviendo
el autor por email, username o consultando la BD.

Uso: python manage.py fix_author_id_frontmatter
"""

import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from django.contrib.auth.models import User
from blog.models import BlogPost


class Command(BaseCommand):
    help = "Agrega author_id al frontmatter de archivos .md que no lo tienen"

    def handle(self, *args, **options):
        source_dir = Path(settings.BASE_DIR) / "blogs_source"
        count_updated = 0
        count_skipped = 0
        count_no_author = 0

        for blog_dir in source_dir.iterdir():
            if not blog_dir.is_dir():
                continue

            md_file = blog_dir / "blog.md"
            if not md_file.exists():
                continue

            try:
                raw = md_file.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                try:
                    raw = md_file.read_text(encoding="latin-1", errors="replace")
                except Exception:
                    continue

            if not raw.startswith("---"):
                continue

            parts = raw.split("---", 2)
            if len(parts) < 3:
                continue

            import yaml

            try:
                fm = yaml.safe_load(parts[1]) or {}
                if not isinstance(fm, dict):
                    fm = {}
            except Exception:
                continue

            body = parts[2]

            if fm.get("author_id"):
                count_skipped += 1
                continue

            slug = blog_dir.name
            author = None
            blog_post = None
            author_email = (fm.get("author_email") or "").strip()
            author_username = (fm.get("author") or "").strip()

            if author_email:
                try:
                    author = User.objects.get(email__iexact=author_email)
                except User.DoesNotExist:
                    pass

            if not author and author_username and "@" not in author_username:
                try:
                    author = User.objects.get(username__iexact=author_username)
                except User.DoesNotExist:
                    pass

            if not author:
                slug = blog_dir.name
                blog_post = BlogPost.objects.filter(slug=slug).first()
                if blog_post and blog_post.author:
                    author = blog_post.author

            if not author:
                count_no_author += 1
                self.stdout.write(
                    self.style.WARNING(
                        f"No se pudo resolver autor para: {blog_dir.name}"
                    )
                )
                continue

            fm["author_id"] = author.id

            author_field = fm.get("author", "")
            if "@" in str(author_field):
                fm["author"] = author.get_full_name() or author.username

            new_lines = ["---"]
            for key, value in fm.items():
                if value is None or value == "":
                    if key != "draft":
                        continue
                if isinstance(value, list):
                    value_str = json.dumps(value, ensure_ascii=False)
                    new_lines.append(f"{key}: {value_str}")
                elif isinstance(value, bool):
                    new_lines.append(f"{key}: {'true' if value else 'false'}")
                elif isinstance(value, int):
                    new_lines.append(f"{key}: {value}")
                else:
                    escaped = str(value).replace('"', '\\"')
                    new_lines.append(f'{key}: "{escaped}"')
            new_lines.append("---")
            new_lines.append("")

            new_content = "\n".join(new_lines) + "\n" + body.strip()
            md_file.write_text(new_content, encoding="utf-8")

            if not blog_post:
                blog_post = BlogPost.objects.filter(slug=slug).first()
            if blog_post and not blog_post.author:
                blog_post.author = author
                blog_post.save(update_fields=["author"])

            self.stdout.write(
                self.style.SUCCESS(
                    f"author_id={author.id} agregado a: {blog_dir.name} "
                    f"(autor: {author.username})"
                )
            )
            count_updated += 1

        self.stdout.write("\nCOMPLETADO:")
        self.stdout.write(f"  Actualizados: {count_updated}")
        self.stdout.write(f"  Ya tenian author_id: {count_skipped}")
        self.stdout.write(f"  Sin autor resuelto: {count_no_author}")
