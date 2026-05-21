"""Utility to print detailed info of BlogPost entries for debugging."""

import os
import sys
import django

BASE_DIR = os.path.abspath("backend")
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")
django.setup()

# Importing the BlogPost model directly can cause import resolution issues
# when this utility script is executed outside of the Django manage.py context.
# Instead, we retrieve the model via Django's app registry after calling
# ``django.setup()``. This approach is robust regardless of how the PYTHONPATH
# is configured.
from django.apps import apps

BlogPost = apps.get_model("blog", "BlogPost")


def main():
    for p in BlogPost.objects.all():
        cat = p.category.name if p.category else "Sin categoria"
        print(f"Title: {p.title!r} | slug: {p.slug} | category: {cat}")


if __name__ == "__main__":
    main()
