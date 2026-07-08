# HU-026: Publicación automática para Superadmin + Indicador visual azul

## Objetivo
Cuando el superadministrador crea un blog desde el editor, el artículo debe publicarse **inmediatamente** sin pasar por el flujo de moderación pendiente. Además, se debe añadir un **indicador visual azul claro** en `blog_list.html` para distinguir los artículos creados por el superadmin.

---

## Contexto actual (diagnóstico)

### 1. Flujo de guardado de blogs
**Archivo:** `backend/blog/services.py` (líneas 262-574)

En la función `save_blog_to_source()`:

```python
# Línea 292
is_admin = user.is_superuser

# Línea 304
is_published = is_admin  # True para superadmin
```

**Hallazgo:** La lógica YA detecta si el usuario es superadmin y establece `is_published = True` para él. Esto significa que **los superadmins ya publican automáticamente**.

### 2. Problema: Estado de moderación
El flujo es:
1. `services.py` establece `draft=false` en el frontmatter para superadmin
2. Se llama a `import_blogs` (línea 514)
3. `import_blogs` línea 1219: `is_published = not frontmatter.get("draft", "false").lower() == "true"` → `is_published=True`
4. **PERO `save_blog_post()` líneas 1302-1342 NO establece `moderation_status`**
5. El modelo `BlogPost` tiene `default="pending"` para `moderation_status` (líneas 115-120 models.py)

**Issue CRÍTICO:** El superadmin publica con `is_published=True` pero `moderation_status` queda como `"pending"` por el default del modelo, a pesar de estar publicado.

### 3. Indicador visual pendiente
**Archivo:** `backend/blog/static/blog/css/blog_list.css` (líneas 1463-1490)

```css
.article_pending {
    position: relative;
    border: 2px dashed #ffc107 !important;  /* Borde amarillo */
    box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.15), 0 4px 12px rgba(255, 193, 7, 0.1);
}

.article_pending::before {
    content: "⏳ Pendiente";
    background: linear-gradient(135deg, #ffc107, #e0a800);
}
```

### 4. Template blog_list.html - Contexto pending_post_ids
**Archivo:** `backend/blog/templates/blog/blog_list.html` (línea 42)

```django
<article class="blog-card card h-100 overflow-hidden rounded-3 position-relative shadow-sm hover-shadow{% if post.id in pending_post_ids %} article_pending{% endif %}">
```

### 5. ¿Qué significa `is_published=True` pero `moderation_status="pending"`?
**Impacto:** El artículo es visible públicamente (is_published=True) pero en el dashboard del superadmin aparece con el badge amarillo de "pendiente", lo cual es confuso y redundante.

---

## ❓ Flujo actual vs Flujo esperado

### Para usuarios NORMALES (authors regulares):
1. Crean artículo → `is_published=False`, `moderation_status="pending"`
2. Se genera `approval_token` en el modelo (models.py líneas 207-211)
3. Se envía email al superadmin (**settings.OWNER_EMAIL**) para aprobación
4. El superadmin aprueba desde dashboard o vía link único

### Para SUPERADMIN:
1. Crea artículo → `is_published=True`, `moderation_status="pending"` (BUG)
2. NO se genera `approval_token` (porque is_published=True)
3. NO se envía email al superadmin (porque la condición `if not is_published` NO se cumple)
4. **PERO el artículo aparece con badge amarillo "Pendiente" - confuso**

---

## 📧 Email del superadmin para notificaciones

**Archivo:** `backend/jdsite/settings.py` (buscar `OWNER_EMAIL`)

```python
OWNER_EMAIL = config("OWNER_EMAIL", default="jaime@jaimediaz.dev")
```

O en `backend/.env`:
```
OWNER_EMAIL=jaime@jaimediaz.dev
```

---

## Criterios de aceptación

1. ✅ **Superadmin publica inmediatamente** - No requiere aprobación manual
2. ✅ **Status "approved" automático** - El superadmin no aparece como "pendiente de aprobación"
3. ✅ **Badge visual azul** - Los artículos del superadmin se distinguen con un borde azul claro (`#17a2b8`)
4. ✅ **Texto indicativo "Superadmin"** - Badge que muestre el rol del usuario
5. ✅ **No afecta usuarios normales** - Los autores comunes siguen el flujo de moderación
6. ✅ **Sin emails de notificación al admin** - El superadmin no envía email de borrador a sí mismo

---

## Archivos involucrados

1. **`backend/blog/services.py`** - Función `save_blog_to_source()` (líneas 302-315, 513-514)
2. **`backend/blog/management/commands/import_blogs.py`** - Función `save_blog_post()` (líneas 1207-1342)
3. **`backend/blog/templates/blog/blog_list.html`** - Template de lista (línea 42)
4. **`backend/blog/static/blog/css/blog_list.css`** - Estilos pendientes (añadir nuevo estilo `.article_superadmin`)
5. **`backend/blog/views.py`** - `BlogListView.get_context_data()` (líneas 786-814) - añadir `superadmin_post_ids`

---

## Pasos de implementación

### Fase 1: Backend - services.py
- [ ] Después de `call_command("import_blogs")` (línea 514), actualizar el post con `moderation_status = "approved"` si el autor es superadmin
- [ ] Evitar envío de email de notificación al admin cuando el autor es superadmin

### Fase 2: Backend - views.py
- [ ] En `BlogListView.get_context_data()`, añadir `superadmin_post_ids` al contexto
- [ ] Filtrar posts donde `author == request.user and user.is_superuser`

### Fase 3: Template - blog_list.html
- [ ] Añadir lógica condicional para aplicar clase `article_superadmin` cuando el autor es superuser
- [ ] Mostrar badge "Superadmin" con estilo distintivo (azul)

### Fase 4: CSS - blog_list.css
- [ ] Añadir estilos `.article_superadmin` con borde azul claro `#17a2b8`
- [ ] Hover y animaciones similares a `.article_pending`

---

## Estado
- **Estado:** PENDIENTE - Esperando aprobación para implementar
- **Prioridad:** Media
- **Complejidad:** Baja
- **Dependencias:** Ninguna

---

## Notas técnicas

- El superadmin usa su email como `author_email` en el frontmatter
- El badge debe tener prioridad visual sobre el badge "Pendiente" (azul vs amarillo)
- Color sugerido: `#17a2b8` (info/tokens de Bootstrap 4)
- La clase `.article_superadmin` debe ir **antes** que `.article_pending` en el CSS para que tenga prioridad en el orden del archivo