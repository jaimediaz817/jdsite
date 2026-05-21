"""Utility to fetch a BlogPost by slug and display its category.

Moved from the project root to ``scripts`` for better organization.
"""

import os
import sys
import django

BASE_DIR = os.path.abspath("backend")
PROJECT_ROOT = os.path.abspath(".")
for path in (BASE_DIR, PROJECT_ROOT):
    if path not in sys.path:
        sys.path.append(path)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")
django.setup()

from blog.models import BlogPost


def main():
    slug = "2026-04-24-por-que-las-integraciones-zoho-fallan"
    try:
        post = BlogPost.objects.get(slug=slug)
        cat = post.category.name if post.category else "Sin categoria"
        print(f"Post: {post.title}\nSlug: {post.slug}\nCategory: {cat}")
    except BlogPost.DoesNotExist:
        print("Post not found")


if __name__ == "__main__":
    main()
