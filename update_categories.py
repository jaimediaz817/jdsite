"""Utility script to (re)assign categories to existing BlogPost entries.

The import command skips updates when the file hash hasn't changed, which
means that after fixing the front‑matter parser existing posts may still have
``category`` set to ``None``. This script forces a refresh of the category field
for every blog based on the current front‑matter.
"""

import os
import sys
import django

BASE_DIR = os.path.abspath("backend")
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")
django.setup()

from pathlib import Path
from django.utils.text import slugify

# Import the Command class from the import_blogs management command.
# The original import attempted to load "blog.management.commands.import_blogs",
# but there is a naming conflict because a top‑level "blog" package exists that
# does not contain the management commands. By importing via the "backend"
# package (which is a proper Python package and is added to sys.path above),
# we ensure the correct module is resolved.
from backend.blog.management.commands.import_blogs import Command
from blog.models import BlogPost, Category


def main():
    cmd = Command()
    source_root = Path("backend/blogs_source")
    for blog_dir in source_root.iterdir():
        if not blog_dir.is_dir():
            continue
        # The slug used when the blog was originally imported may differ
        # depending on the version of the import script (underscores vs hyphens).
        # We first try the current slugify logic, and if no post is found we
        # fall back to using the raw directory name (which contains underscores).
        slug_candidate = slugify(blog_dir.name)
        try:
            post = BlogPost.objects.get(slug=slug_candidate)
        except BlogPost.DoesNotExist:
            # Fallback: try the directory name as‑is (preserves underscores)
            try:
                post = BlogPost.objects.get(slug=blog_dir.name)
            except BlogPost.DoesNotExist:
                # No matching post – skip this directory
                continue
        md_path = blog_dir / "blog.md"
        if not md_path.exists():
            continue
        # Parse front‑matter manually (the Command.read_markdown_file method
        # normalises the whole file and can lose the ``category`` key).
        with open(md_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        start = None
        end = None
        for i, line in enumerate(lines):
            if line.strip() == "---":
                if start is None:
                    start = i
                else:
                    end = i
                    break
        front = {}
        if start is not None and end is not None:
            for raw in lines[start + 1 : end]:
                if ":" not in raw:
                    continue
                key, value = raw.split(":", 1)
                key = key.strip().lower()
                value = value.strip().strip('"')
                front[key] = value
        category_name = front.get("category") or front.get("categoria")
        if not category_name:
            continue
        category_obj, _ = Category.objects.get_or_create(
            name__iexact=category_name,
            defaults={
                "name": category_name,
                "is_active": True,
                "slug": slugify(category_name),
            },
        )
        if post.category_id != category_obj.id:
            post.category = category_obj
            post.save()
            print(f"Updated category for '{post.title}' to '{category_obj.name}'")


if __name__ == "__main__":
    main()
