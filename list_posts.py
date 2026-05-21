"""Utility to list all BlogPost entries with their slug, title, and category."""

import os
import sys

PROJECT_ROOT = os.path.abspath("backend")
sys.path.append(PROJECT_ROOT)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")

import django

django.setup()

from blog.models import BlogPost


def main():
    posts = BlogPost.objects.all()
    if not posts:
        print("No BlogPost entries found.")
        return
    for p in posts:
        cat = p.category.name if p.category else "None"
        print(f"{p.slug} | {p.title} | Category: {cat}")


if __name__ == "__main__":
    main()
