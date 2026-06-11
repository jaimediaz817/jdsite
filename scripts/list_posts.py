"""Utility script to list blog posts with their slug and category (if any).

Moved from the project root to ``scripts`` for better organization.
"""

import os
import sys
import django

PROJECT_ROOT = os.path.abspath(".")
BACKEND_DIR = os.path.abspath("backend")
for _dir in (PROJECT_ROOT, BACKEND_DIR):
    if _dir not in sys.path:
        sys.path.append(_dir)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")
django.setup()

from blog.models import BlogPost


def main():
    for post in BlogPost.objects.all():
        cat = post.category.name if post.category else "Sin categoria"
        print(f"{post.title} | slug={post.slug} | category={cat}")


if __name__ == "__main__":
    main()
