"""Utility to dump BlogPost records with id, title, slug and category_id."""

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
    for obj in BlogPost.objects.all():
        print(
            f"id={obj.id} | title={repr(obj.title)} | slug={obj.slug} | category_id={obj.category_id}"
        )


if __name__ == "__main__":
    main()
