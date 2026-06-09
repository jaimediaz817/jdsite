"""
Chequeo del estado actual de todos los BlogPost.
"""

# TODO: ¿?
import os, sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import django

django.setup()
from blog.models import BlogPost

print(f"{'SLUG':<50} {'PUB':<5} {'MOD':<12} {'AUTOR':<20}")
print("-" * 90)
for p in BlogPost.objects.all().order_by("-publish_date"):
    autor = p.author.username if p.author else "<sin autor>"
    print(
        f"{p.slug:<50} {str(p.is_published):<5} {p.moderation_status:<12} {autor:<20}"
    )
print(f"\nTotal: {BlogPost.objects.count()}")
