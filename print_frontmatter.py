"""Print the frontmatter of a given markdown file using the import command's parser."""

import os
import sys

PROJECT_ROOT = os.path.abspath("backend")
sys.path.append(PROJECT_ROOT)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")

import django

django.setup()

from backend.blog.management.commands.import_blogs import Command


def main():
    md_path = os.path.abspath(
        "backend/blogs_source/2026-04-26_mejoras_ui_ux_blog_historico/blog.md"
    )
    cmd = Command()
    _, front = cmd.read_markdown_file(md_path)
    print("Frontmatter keys:", list(front.keys()))
    print("Category:", front.get("category"))


if __name__ == "__main__":
    main()
