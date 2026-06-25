#!/usr/bin/env python
"""Script temporal para verificar que el fix de YouTube se guardó correctamente."""

import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "."))
django.setup()

from blog.models import BlogPost

post = BlogPost.objects.filter(
    slug="2026-04-26_mejoras_ui_ux_blog_historico_manualmente-05"
).first()
if not post:
    print("❌ Post no encontrado")
    sys.exit(1)

print(f"✅ Post encontrado: {post.title} (ID={post.id})")
print(f"   Slug: {post.slug}")

content = post.content_md or ""
print("\n=== MARKDOWN GUARDADO ===")
print(content[:800])

html = post.content_html or ""
print("\n=== HTML GENERADO (primeros 1200 chars) ===")
print(html[:1200])

if "youtube-mosaic" in html and "p2WA672HrdI" in html:
    print(
        "\n✅ FIX VERIFICADO: El mosaico de YouTube está presente en el HTML guardado."
    )
else:
    print(
        "\n❌ FIX NO FUNCIONÓ: No se encontró el mosaico de YouTube en el HTML."
    )
    sys.exit(1)
