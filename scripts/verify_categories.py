"""Utility script to list blog posts and their categories for verification.

Moved from the project root to ``scripts`` for better organization.
"""

import os
import sys
import django

BASE_DIR = os.path.abspath("backend")
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")
django.setup()

from blog.models import BlogPost


def main():
    for post in BlogPost.objects.all():
        cat_name = (
            post.category.name if post.category else "Sin categoria asignada"
        )
        print(f"{post.title} -> {cat_name}")


if __name__ == "__main__":
    main()
