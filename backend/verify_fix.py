"""
Quick verification: show the most recent 10 posts and their time diffs.
"""

import os, sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
import django

django.setup()
from django.utils import timezone
from blog.models import BlogPost

now = timezone.now()
print("=== ULTIMOS 10 POSTS ===")
print(f"{'SLUG':<35} {'PUBLISH_DATE':<18} {'CREATED_AT':<18} {'DIFF_MIN'}")
print("-" * 90)
for p in BlogPost.objects.order_by("-publish_date")[:10]:
    diff_min = int((now - p.created_at).total_seconds() / 60)
    ts = p.publish_date.strftime("%m/%d %H:%M") if p.publish_date else "N/A"
    ca = p.created_at.strftime("%m/%d %H:%M") if p.created_at else "N/A"
    print(f"{p.slug[:35]:<35} {ts:<18} {ca:<18} {diff_min}m")
