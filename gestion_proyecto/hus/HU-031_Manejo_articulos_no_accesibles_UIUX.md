# HU-031: Manejo UI/UX de artículos no accesibles (404 por inconsistencia)

## 🎯 Objetivo
Cuando un artículo aparece en `blog_list` pero su `blog_detail` devuelve 404 (artículo eliminado), mostrar UI amigable con toast estilizado en lugar del error genérico.

## 🔍 Diagnóstico
- **Causa**: Artículos en lista pero eliminados de BD posteriormente
- **Template actual**: `backend/blog/templates/blog_detail.html` → stub básico sin contenido
- **View actual**: `BlogDetailView` → `get_queryset()` filtra `is_published=True` + autor

## 📋 Solución propuesta

### Opción 1: Verificar existencia en `blog_list.html` (recomendado)
```javascript
// En blog_list.js - agregar verificación antes de navegar
document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href*="/blog/"]');
    if (!link) return;
    
    // Verificar si el artículo existe vía AJAX ligera
    var slug = link.pathname.split('/')[2];
    fetch('/blog/api/post-exists/' + slug + '/')
        .then(r => r.json())
        .then(data => {
            if (!data.exists) {
                e.preventDefault();
                if (typeof $.toast !== 'undefined') {
                    $.toast({
                        heading: 'Artículo no disponible',
                        text: 'Este artículo fue eliminado o archivado.',
                        icon: 'info',
                        position: 'top-center',
                        hideAfter: 5000,
                        bgColor: '#6366f1'
                    });
                }
            }
        });
});
```

### Opción 2: Endpoint `/api/post-exists/<slug>/`
```python
# views.py
def post_exists(request, slug):
    exists = BlogPost.objects.filter(
        slug=slug, 
        is_published=True
    ).exists()
    return JsonResponse({'exists': exists})
```

### Opción 3: Modificar `get_queryset` en `BlogDetailView`
```python
def get_queryset(self):
    qs = super().get_queryset()
    # ... lógica existente ...
    # Agregar: también permitir ver artículos con contenido
    return qs.filter(
        Q(is_published=True) | Q(author=user, moderation_status="pending")
    )
```

## ✅ Verificado
- Template `blog/templates/blog_detail.html` existe pero es stub básico
- View usa `blog/blog_detail.html` (el stub NO es usado)
- Artículo `2026-04-26_mejoras_ui_ux_blog_historico_manualmente-05` aparece en lista pero da 404

## 📋 Pasos Implementados
- [x] Modificar `BlogDetailView.dispatch()` para manejar 404 con redirección a blog_list + toast (HU-031.1)
- [x] Agregar endpoint `/blog/api/post-can-view/<slug>/` que verifica accesibilidad
- [x] Agregar URL del endpoint en `blog/urls.py`
- [x] Modificar `dashboard.js` para interceptar click en "Ver artículo" y verificar antes de navegar
- [x] Agregar código JavaScript en `blog_list.html` para detectar parámetros de error y mostrar toast

## 🔧 Cambios Realizados

### 1. backend/blog/views.py
- `BlogDetailView.dispatch()`: Nuevo método que intercepta accesos a artículos:
  - Si el artículo no existe → redirige a `blog_list?error=not_found&slug=X`
  - Si el artículo no es accesible → redirige a `blog_list?error=unavailable&reason=X&slug=X`
  - Si el artículo es accesible → continúa con el flujo normal

### 2. backend/blog/templates/blog/blog_list.html
- **Estilos CSS personalizados** para toast profesional:
  - Bordes redondeados (12px radius)
  - Sombra suave y elegante
  - Degradados de color modernos (indigo para danger, ámbar para warning)
  - Barra de progreso animada en la parte inferior
  - Animación de entrada/salida con cubic-bezier
- **Script mejorado** que detecta parámetros `error` en la URL:
  - `error=not_found`: "Artículo X no fue encontrado..." (con información ampliada)
  - `error=unavailable&reason=pending`: "Pendiente de aprobación" (con badge de estado)
  - `error=unavailable&reason=rejected`: "Rechazado - No puede ser visualizado"
  - `error=unavailable&reason=unavailable`: "No disponible"
- Limpia la URL después de mostrar el toast usando `history.replaceState()`

### 3. backend/blog/urls.py
- Ya existía URL: `/blog/api/post-can-view/<slug>/`

### 4. backend/blog/static/blog/js/dashboard.js
- Código existente para interceptar clicks en botones `.btn-icon-ver`
- Verifica accesibilidad vía AJAX antes de navegar
- Muestra toast con razón si no es posible ver el artículo

---
HU actualizada: 2025-07-08
Estado: ✅ COMPLETA
Tipo: UX Mejora
