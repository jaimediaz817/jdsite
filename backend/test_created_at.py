"""
Script de prueba para verificar created_at.
"""

import os, sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
import django

django.setup()

from django.utils import timezone
from blog.models import BlogPost

# 1. Crear post directamente
post1 = BlogPost.objects.create(
    slug="test-created-at-1", title="Test 1", content_html="<p>test</p>"
)
print("CREATED via create():")
print(f"  id: {post1.id}")
print(f"  created_at: {post1.created_at}")
print(f"  publish_date: {post1.publish_date}")
print(f"  timezone.now(): {timezone.now()}")
if post1.created_at:
    delta = timezone.now() - post1.created_at
    print(f"  diff seconds: {delta.total_seconds()}")
    if delta.total_seconds() < 60:
        print("  CORRECTO: < 1 minuto")
    else:
        print(f"  INCORRECTO: {delta}")
else:
    print("  created_at es NULL")

# 2. update_or_create simulando import_blogs
defaults = {
    "source_hash": "abc123",
    "title": "Test 2",
    "content_html": "<p>test 2</p>",
    "is_published": False,
}
obj2, created2 = BlogPost.objects.update_or_create(
    slug="test-created-at-2", defaults=defaults
)
print(f"\nCREATED via update_or_create (created={created2}):")
print(f"  id: {obj2.id}")
print(f"  created_at: {obj2.created_at}")
if obj2.created_at:
    delta = timezone.now() - obj2.created_at
    print(f"  diff seconds: {delta.total_seconds()}")
    if delta.total_seconds() < 60:
        print("  CORRECTO: < 1 minuto")
    else:
        print(f"  INCORRECTO: {delta}")
else:
    print("  created_at es NULL")

# Limpiar
post1.delete()
obj2.delete()
print("\nListo.")
