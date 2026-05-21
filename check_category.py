"""Utility script to print the first BlogPost title and its category name.

This script is used to verify that the category assignment performed by
`update_categories.py` was successful.
"""

import os
import sys

# Ensure the project root (backend) is on the Python path
PROJECT_ROOT = os.path.abspath("backend")
sys.path.append(PROJECT_ROOT)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")

import django

django.setup()

from blog.models import BlogPost


def main():
    post = BlogPost.objects.first()
    if not post:
        print("No BlogPost entries found.")
        return
    category_name = post.category.name if post.category else "None"
    print(f"{post.title} | Category: {category_name}")


if __name__ == "__main__":
    main()
