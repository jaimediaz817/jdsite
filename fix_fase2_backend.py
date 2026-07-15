# FASE 2: Backend - Validacion slug duplicado en save_blog_api
# Este script modifica backend/blog/views.py para detectar slug duplicado

import re

views_path = "backend/blog/views.py"
with open(views_path, "r", encoding="utf-8") as f:
    content = f.read()

# Buscar el bloque de save_blog_api donde se valida si el post existe/actualiza
# Necesitamos agregar validacion: si custom_slug existe y no es el mismo articulo, retornar error

# Patron a buscar: donde se obtiene el slug final antes de guardar
old_pattern = """    # Usar custom_slug si se proporciona
    final_slug = custom_slug if custom_slug and custom_slug.strip() else slug"""

new_pattern = """    # Usar custom_slug si se proporciona
    final_slug = custom_slug if custom_slug and custom_slug.strip() else slug
    
    # Validar que el slug no este duplicado (a menos que sea edicion del mismo articulo)
    if final_slug and final_slug != slug:
        from .models import BlogPost
        if BlogPost.objects.filter(slug=final_slug).exists():
            # Verificar si es el mismo articulo
            existing = BlogPost.objects.get(slug=final_slug)
            if not (slug and existing.slug == slug):
                return JsonResponse({
                    "error": "slug_duplicado",
                    "slug_existente": final_slug
                }, status=400)"""

if old_pattern in content:
    content = content.replace(old_pattern, new_pattern, 1)
    with open(views_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("FASE 2 OK: Validacion slug duplicado agregada a views.py")
else:
    # Verificar si ya existe la validacion
    if "slug_duplicado" in content:
        print("FASE 2 OK: Validacion slug duplicado ya existe en views.py")
    else:
        print("ERROR: No se encontro el patron en views.py")
