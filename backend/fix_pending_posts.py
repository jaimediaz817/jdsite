"""
Script de reparación para artículos existentes con estados inconsistentes.
# TODO: ¿?

Problemas que corrige:
1. Artículos con is_published=True pero moderation_status="pending"
   → Causa: el bug de services.py guardaba draft=is_published (False) en vez de draft=not is_published (True)
   → Solución: para usuarios NO-admin, poner is_published=False y mantener moderation_status="pending"
               para usuarios admin, poner is_published=True y moderation_status="approved"
2. Artículos con moderation_status="pending" y author=None (artículos antiguos sin autor)
   → Solución: dejar como están, solo son visibles para superadmin

Ejecutar: python manage.py shell < fix_pending_posts.py
"""

import os
import sys

# Configurar Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import django

django.setup()

from blog.models import BlogPost
from django.contrib.auth.models import User

# Obtener todos los posts en estado inconsistente
inconsistent = BlogPost.objects.filter(
    is_published=True, moderation_status="pending"
).exclude(author=None)

print(f"🔍 Artículos inconsistentes encontrados: {inconsistent.count()}")
print(f"   (is_published=True pero moderation_status='pending')\n")

# Obtener superusers
superusers = User.objects.filter(is_superuser=True)
superuser_ids = set(superusers.values_list("id", flat=True))

count_fixed = 0
for post in inconsistent:
    if post.author_id in superuser_ids:
        # Artículo de superadmin: publicar correctamente
        post.is_published = True
        post.moderation_status = "approved"
        post.approval_token = None
        post.approval_token_created = None
        print(f"  ✅ SUPERADMIN '{post.title}' → is_published=True, approved")
    else:
        # Artículo de usuario normal: poner como borrador
        post.is_published = False
        post.moderation_status = "pending"
        print(
            f"  ✅ USUARIO '{post.title}' (autor: {post.author}) → is_published=False, pending"
        )
    post.save()
    count_fixed += 1

print(f"\n✅ {count_fixed} artículos reparados.")
print("⚠️  Ahora ve a la dashboard de moderación para aprobarlos manualmente.")
