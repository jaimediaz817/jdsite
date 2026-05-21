"""Utility script to list all Category objects in the database.

Moved from the project root to the ``scripts`` directory for better
organization. The implementation mirrors the original script.
"""

import os
import sys
import django

BASE_DIR = os.path.abspath("backend")
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")
django.setup()

# Import may not be resolved by static analysis tools because sys.path is modified at runtime
from blog.models import Category  # type: ignore


def main():
    for c in Category.objects.all():
        print(f"{c.id} | {c.name} | {c.slug}")


if __name__ == "__main__":
    main()
