"""Simple script to list all BlogPost records with their raw title, slug and category.

This file was moved from the project root to the ``scripts`` directory to keep
utility scripts organized. The implementation is identical to the original
``get_posts.py``.
"""

import os
import sys
import django

# Add project root and backend to PYTHONPATH so Django can be imported.
BASE_DIR = os.path.abspath("backend")
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))

for path in (PROJECT_ROOT, BASE_DIR):
    if path not in sys.path:
        sys.path.append(path)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")
django.setup()

# pylint: disable=import-error
from blog.models import BlogPost


def main():
    for p in BlogPost.objects.all():
        cat = p.category.name if p.category else "Sin categoria"
        print(f"Title: {p.title!r} | slug: {p.slug} | category: {cat}")


if __name__ == "__main__":
    main()
