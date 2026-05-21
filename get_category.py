"""Utility to print the category of a specific BlogPost by slug."""

import os
import sys

PROJECT_ROOT = os.path.abspath("backend")
sys.path.append(PROJECT_ROOT)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")

import django

django.setup()

from blog.models import BlogPost


def main():
    slug = "2026-04-26-mejoras-ui-ux-blog-historico"
    try:
        post = BlogPost.objects.get(slug=slug)
        cat_name = post.category.name if post.category else "None"
        print(f"Title: {post.title}\nCategory: {cat_name}")
    except BlogPost.DoesNotExist:
        print("BlogPost not found for slug", slug)


if __name__ == "__main__":
    main()
