# HU-037: Validación de QR - Evitar duplicados (artículos y nombres)

## Objetivo
Prevenir duplicados en el sistema QR:
1. Un artículo no puede vincularse a múltiples QR
2. No se pueden crear QR con nombre/eslogan idénticos

## Criterios de aceptación
- [x] Un artículo publicado solo puede estar vinculado a UN QR máximo
- [x] El buscador del formulario muestra SOLO artículos SIN QR asignado
- [x] No se pueden crear QR con nombre+eslogan idénticos a otro existente (ya existía)
- [x] Si hay conflicto, mostrar toast de error HU-036
- [x] Mensaje claro: "Artículo ya vinculado" / "QR con ese nombre y eslogan ya existe"

## Implementación

### 1. Backend - Filtrar artículos sin QR ✅ HECHO
En `backend/blog/views.py`, función `dashboard_qr_view`:

```python
# Antes:
published_posts = BlogPost.objects.filter(
    is_published=True, moderation_status="approved"
).order_by("-publish_date")

# Después:
published_posts = (
    BlogPost.objects.filter(is_published=True, moderation_status="approved")
    .filter(qr_codes__isnull=True)
    .order_by("-publish_date")
)
```

### 2. Backend - Filtrar artículos en qr_no_article_view ✅ HECHO
En `backend/blog/views.py`, función `qr_no_article_view`:

```python
# Agregado antes de renderizar el template:
published_posts = (
    BlogPost.objects.filter(is_published=True, moderation_status="approved")
    .filter(qr_codes__isnull=True)
    .order_by("-publish_date")
)
```

### 3. Backend - Validar en endpoint generate_qr_view ✅ HECHO
En `generate_qr_view`, después de verificar que el artículo está publicado:

```python
# HU-037: Verificar que el artículo no tenga ya un QR activo asignado
if QRCode.objects.filter(blog_post=blog_post, is_active=True).exists():
    return JsonResponse({
        'success': False, 
        'error': 'Este artículo ya está vinculado a otro QR activo.'
    }, status=400)
```

## Estado
- [x] ✅ **Completado** - Implementado y probado