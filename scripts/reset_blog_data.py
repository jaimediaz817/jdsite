"""Utility script to clear all BlogPost and Category data.
Used to reset the database for re‑importing blogs after fixing front‑matter parsing.
"""

import os
import sys
import django

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(PROJECT_ROOT, "..", "backend"))

for path in (PROJECT_ROOT, BACKEND_DIR):
    if path not in sys.path:
        sys.path.append(path)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")
django.setup()

from blog.models import BlogPost, Category  # type: ignore


def main():
    BlogPost.objects.all().delete()
    Category.objects.all().delete()
    print("Deleted all BlogPost and Category entries")


if __name__ == "__main__":
    main()
