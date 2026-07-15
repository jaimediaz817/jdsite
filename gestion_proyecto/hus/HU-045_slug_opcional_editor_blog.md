# HU-045: Campo slug opcional en el editor de artículos

## Objetivo
Agregar un campo de texto opcional en la barra lateral del formulario del editor (`blog_editor.html`) para permitir al usuario definir un slug personalizado. Si se escribe algo en ese campo, el slug del artículo se generará a partir de ese texto; si se deja vacío, se mantiene el comportamiento actual: `slugify(title)`.

## Contexto
- Actualmente el slug se genera exclusivamente a partir del título (`models.py`: `slugify(self.title)`).
- No hay forma de definir un slug manual sin editar BD o código.
- El HTML actualmente NO incluye un input visible para slug; existe un hidden `#edit-slug`, pero no está conectado a un input visible.
- El SEO/URL amigable se beneficia de poder controlar el slug cuando el título es largo o cambia frecuentemente.

**Nota importante sobre formato actual:**
- El slug **en base de datos** se guarda limpio: `slugify(title)`.
- El folder en `blogs_source/` usa formato `YYYY-MM-DD_slug`, pero ese es un detalle de almacenamiento; la HU no cambia ese comportamiento.

## Criterios de aceptación
1. Se agrega un input de texto opcional en el formulario del editor, cerca del campo título.
2. Si el usuario escribe texto en ese input y guarda, el slug final se genera aplicando `slugify()` a ese texto.
3. Si el input está vacío, el slug final se genera aplicando `slugify()` al título (comportamiento actual).
4. En edición, si el input está vacío se respeta el slug existente (no se modifica).
5. Si el slug custom genera un duplicado existente, se añade un sufijo numérico automaticamente (`-2`, `-3`, etc.) para garantizar unicidad.
6. El cambio es mínimo: sin migraciones, sin modificar modelos, sin tocar JS del editor (solo lectura del valor al enviar).

## Ajuste adicional: límites de Título y Descripción

Actualmente en `backend/blog/templates/blog/blog_editor.html`:
- `#title` → `maxlength="60"`
- `#description` → `maxlength="155"`

Esto obliga a recortar títulos/descripciones completas. Se ajusta sin tocar el backend:
- Título: **150** caracteres.
- Descripción: **350** caracteres.
- Se mantienen intactos los limites de SEO (`#meta_title` y `#meta_description`) porque son campos diferentes.

---

## Artefactos involucrados

### Solo lectura/diagnóstico
- `backend/blog/templates/blog/blog_editor.html` - template del editor.
- `backend/blog/models.py` - modelo `BlogPost` y su lógica `save()` actual.
- `backend/blog/services.py` - función `save_blog_to_source()` donde se recibe y procesa el `slug`.
- `backend/blog/views.py` - vista `blog_editor_view()` y endpoint de guardado.
- `backend/blog/static/blog/js/blog_editor/index.js` - JS del editor.

### Archivos a modificar
- `backend/blog/templates/blog/blog_editor.html` - agregar input slug opcional en sidebar.
- `backend/blog/services.py` - ajustar `save_blog_to_source()` para priorizar slug del request sobre el autogenerado.

## Diagnóstico inicial

### Flujo actual de generación de slug
1. Usuario llena título en el editor.
2. Al hacer clic en Guardar, el formulario envía datos al backend.
3. `save_blog_to_source(data, user, is_admin)` en `services.py` recibe `data.get("slug", "").strip()`.
4. Si `existing_slug` está vacío, genera `slug = slugify(title)` con sufijos ante duplicados de carpeta.
5. Si `existing_slug` existe, edita ese artículo manteniendo el slug.
6. En `models.py`, el método `save()` también asegura: `if not self.slug: self.slug = slugify(self.title)`.

### Problema
- No existe input que capture un slug deseado por el usuario.
- El `slug` oculto en el template (`<input type="hidden" id="edit-slug" name="slug" value="">`) no está conectado a un input visible.
- La unicidad se maneja en BD y en `services.py`, pero no hay override manual desde el frontend.

## Propuesta: impacto mínimo, sin romper compatibilidad

### Cambios estructurales
#### 1. Template `blog_editor.html` (sidebar)
Insertar después del campo Título un nuevo input visible:

```html
<div class="mb-3">
    <label class="form-label" for="custom-slug">Slug personalizado <span class="text-muted">(opcional)</span></label>
    <input type="text" id="custom-slug" name="custom_slug" class="form-control" placeholder="Dejar vacío para generar desde título" autocomplete="off">
    <div class="form-text">Si se escribe texto aquí, se usará para la URL del artículo. Vacío = generar desde título.</div>
</div>
```

**Ubicación exacta:** Después de `<div class="mb-3"> ... Título ... </div>` y antes de `<div class="mb-3"> ... Descripción ... </div>`.

**Nota:** No se elimina el hidden `#edit-slug`; ese campo sigue ahí para posible sincronización en JS existente.

#### 2. Servicio `save_blog_to_source()` en `services.py`
Modificar la sección de generación de slug para priorizar el valor enviado por el usuario solo cuando el nuevo input tenga texto.

Lógica propuesta:
```python
existing_slug = data.get("slug", "").strip()
custom_slug = data.get("custom_slug", "").strip()  # NUEVO CAMPO

# Determinar slug base: custom > title
if is_edit and existing_slug:
    slug = existing_slug
else:
    base_slug = slugify(custom_slug or title)[:60] or f"articulo-{uuid.uuid4().hex[:8]}"
    slug = base_slug
    counter = 1
    while list(source_dir.glob(f"*_{slug}")):
        slug = f"{base_slug}-{counter}"
        counter += 1
```

**Punto de inserción:** Reemplazar la línea actual donde se asigna `base_slug = slugify(title)[:60]` por la lógica anterior.

#### 3. Validación backend
- No requiere nueva migración.
- No se altera el modelo `BlogPost`.
- Unicidad garantizada por `unique=True` en el modelo y por el loop de `counter` en `services.py`.

## Plan de implementación en fases

### Fase 1: Template
1.1. Insertar input en `blog_editor.html` después de Título.
1.2. Usar `id="custom-slug"` y `name="custom_slug"`.

### Fase 2: Backend
2.1. Modificar `save_blog_to_source()` en `services.py` para leer `custom_slug`.
2.2. Priorizar `custom_slug` sobre `title` solo cuando `custom_slug` no esté vacío.
2.3. Mantener unicidad con el sufijo numérico ante carpetas existentes.

### Fase 3: Pruebas
3.1. Probar creación sin custom slug -> se genera desde título.
3.2. Probar creación con custom slug -> se usa el texto ingresado.
3.3. Probar edición sin modificar custom slug -> se mantiene el anterior.
3.4. Probar duplicado de custom slug -> se añade `-2`, `-3`.
3.5. Verificar que no se rompen pruebas existentes.

## Restricciones y reglas
- No modificar HTML/JS existente salvo el agregado del input.
- No agregar dependencias.
- No modificar modelos ni crear migraciones.
- No alterar el comportamiento por defecto (auto-slug desde título) si el usuario no escribe nada.
- La fecha del formato `YYYY-MM-DD_` en folders NO se modifica; está fuera de scope.

## Estado
**Pendiente** 🔲

---
Creada: 2026-06-14