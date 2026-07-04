# 🔍 Diagnóstico: Error al guardar blog desde producción

## Problema 1: ValueError "No se encontró la carpeta del artículo"

**Error:**
```
ValueError: No se encontró la carpeta del artículo con slug: 2026-07-03_mi-primer-articulo-en-produccion-2
```

**Causa (services.py:304-321):**
- Cuando `is_edit = True`, busca la carpeta en `blogs_source/`
- El superadmin eliminó todos los artículos → las carpetas desaparecieron
- Al intentar guardar, falla porque `target_dir` no existe

**Solución:**
En la función `save_blog_to_source()`, cambiar la lógica de búsqueda de carpetas para crear la carpeta si no existe:

```python
# Línea 304-321 (actual)
if is_edit:
    for folder in source_dir.iterdir():
        if folder.is_dir():
            # Buscar coincidencia con slug
            ...
    if not target_dir:
        raise ValueError(
            f"No se encontró la carpeta del artículo con slug: {existing_slug}"
        )
```

Debe cambiar a:

```python
if is_edit:
    for folder in source_dir.iterdir():
        if folder.is_dir():
            # Buscar coincidencia con slug
            ...
    # Si no se encuentra la carpeta, crearla
    if not target_dir:
        target_dir = source_dir / existing_slug
        target_dir.mkdir(parents=True, exist_ok=True)
```

---

## Problema 2: Alerta "Borrador guardado" en lugar de "Ver artículo"

**Escenario:**
- Usuario edita un artículo YA APROBADO previamente
- El editor carga el artículo correctamente
- Al guardar, muestra "Borrador guardado. Pendiente de aprobación" en lugar de "Ver artículo"

**Causa:**
1. `get-blog/<slug>/` NO retorna el estado `is_published` del artículo
2. El editor asume que es un borrador nuevo y llama a `/blog/api/save-blog/`
3. El backend guarda `draft: true` en el frontmatter (porque el usuario no es admin)
4. El frontend ve `result.published: false` y muestra la alerta incorrecta

**Debug en index.js (línea 2220):**
```javascript
console.log('🐛 [DEBUG] save response =', result);
```

Verificar si `result.published` es `false` cuando debería ser `true` (artículo ya existente y publicado).

**Solución requerida en views.py:**
Añadir `is_published` y `moderation_status` al endpoint `get-blog/`:

```python
# get_blog_api debe retornar:
return JsonResponse({
    "frontmatter": fm,
    "content_md": body,
    "existing_files": files,
    "is_published": post.is_published,  # NUEVO
    "moderation_status": post.moderation_status,  # NUEVO
})
```

Y en el frontend (index.js) usar estos valores para el badge inicial:

```javascript
// En loadExistingArticle()
if (data.is_published) {
    updateStatusBadge('published');
} else if (data.moderation_status === 'pending') {
    updateStatusBadge('pending');
}
```

---

## Comandos para diagnosticar (en VPS):

```bash
# Verificar estructura de blogs_source
ls -la /var/www/jdiaz.tipsterbyte.com/app/backend/blogs_source/

# Ver logs de Gunicorn
sudo journalctl -u jdiaz_gunicorn.service --since '5 minutes ago' -n 20 --no-pager