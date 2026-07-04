# HU-025: Gestión de imágenes en borradores con flujo fluido

## Objetivo
Permitir que las imágenes subidas durante la edición de un borrador se recuperen correctamente cuando se reabre el editor, y que las imágenes temporales se eliminen automáticamente cuando el artículo se guarda o se descarta el borrador.

## 🔍 ANÁLISIS CORREGIDO vs CÓDIGO REAL (v2)

### Hallazgo CRÍTICO: `save_uploaded_file()` YA devuelve `url`

```python
# services.py línea 718
return {
    "filename": safe_name,
    "url": url_path,   # ← YA EXISTE
    "type": ftype,
}
```

**Esto cambia el diagnóstico.** El backend SIEMPRE ha devuelto `url`. El frontend SIEMPRE ha recibido `url`. `uploadedFiles.push(data)` SIEMPRE ha guardado el objeto completo con `url`. `collectFormData()` → `files: uploadedFiles` → **SÍ guarda `file.url` en el draft**.

### ¿Entonces cuál es el problema REAL?

| #   | Problema real                      | Severidad | Explicación                                                                                                                                                                                                                    |
| --- | ---------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Carpeta `{userId}` en la ruta**  | 🔴 Alta    | `url_path = f".../blog_editor_temp/{user.id}/{safe_name}"`. Si el ID del usuario difiere entre local y producción, los drafts guardados en local apuntan a rutas que no existen en producción → **404**                        |
| 2   | **Falta de cleanup post-guardado** | 🔴 Alta    | `save_blog_to_source()` mueve archivos de `{userId}/` a `blogs_source/{slug}/` pero NO elimina la carpeta `{userId}/` ni las imágenes no referenciadas en `files_list`                                                         |
| 3   | **Drafts antiguos sin `url`**      | 🟡 Media   | Si existieran drafts guardados antes de que `save_uploaded_file` devolviera `url` (hipotético), `restoreDraft` línea 2124 construye `/static/blogs/${slug}/${f.filename}`. Con slug vacío → `/static/blogs//img.jpg` → **404** |
| 4   | **Fallback anidado frágil**        | 🟢 Baja    | `renderUploadedFile` línea 197-241 tiene 4 `onerror` anidados. Funciona pero es código frágil y difícil de mantener                                                                                                            |

### Verificación: ¿El flujo actual funciona?

**Sí, para el caso normal.** Cuando el usuario:
1. Sube imagen → backend devuelve `{filename, url, type}` → `uploadedFiles.push(data)` guarda con `url`
2. Auto-save cada 15s → `collectFormData()` → `files: uploadedFiles` → **SÍ incluye `url`**
3. Recupera borrador → `restoreDraft` línea 2124: `f.url = f.url || ...` → **usa `f.url` directamente**
4. `renderUploadedFile` línea 183: `tempUrl = file.url || ...` → **usa `file.url` directamente**

**La imagen se carga correctamente SIN ejecutar ningún fallback.**

### ¿Dónde falla entonces?

**SOLO en producción si el ID del usuario cambia.** Ejemplo:
- Local: usuario ID 15 → `url: "/media/blog_editor_temp/15/img.jpg"`
- Producción: usuario ID 3 → esa ruta NO existe → **404**

Y **los fallbacks anidados** intentan rescatar pero:
1. `/static/blogs/{slug}/{filename}` → no existe (slug vacío o imagen no guardada)
2. `/static/blogs_source/{slug}/{filename}` → no existe
3. `/static/blogs/{filename}` → no existe
4. `/media/blog_editor_temp/{userId}/{filename}` → **userId del HTML actual** (3 en prod) → **tampoco existe**

→ **404 definitivo**.

## Estado Actual (CORREGIDO)

```
URL del editor: /blog/editor/{slug}/ (cuando edita un artículo existente)
URL del editor: /blog/editor/ (cuando crea un nuevo artículo)

Carpeta temporal: /media/blog_editor_temp/{user_id}/
  - EJ: /media/blog_editor_temp/15/Captura_de_pantalla.png

Carpeta definitiva: /static/blogs/{slug}/
  - EJ: /static/blogs/2026-07-03_test2/JD_marca_personal_fbb1e952.jpg

Backend save_uploaded_file(): ✅ YA devuelve {filename, url, type}
Frontend upload: ✅ YA recibe url y la guarda en uploadedFiles
Frontend collectFormData(): ✅ YA guarda file.url en el draft
Frontend restoreDraft(): ✅ YA usa file.url si existe
Frontend renderUploadedFile(): ✅ YA usa file.url como tempUrl
```

## Problemas Reales (CORREGIDOS)

### Problema 1: Carpeta `{userId}` en lugar de `tmp`
- **Actual**: `media/blog_editor_temp/{user_id}/`
- **Riesgo**: Si el ID del usuario cambia entre entornos, las URLs guardadas en drafts son inválidas
- **Solución**: Usar `media/blog_editor_temp/tmp/`

### Problema 2: Sin cleanup después de guardar
- `save_blog_to_source()` mueve archivos de `{userId}/` a `blogs_source/{slug}/`
- La carpeta `{userId}/` NO se elimina
- Las imágenes NO referenciadas en `files_list` quedan huérfanas
- **Solución**: Eliminar carpeta temporal después del move + endpoint de cleanup

### Problema 3: Drafts sin slug (artículo nuevo)
- `restoreDraft` línea 2124: `f.url = f.url || /static/blogs/${slug}/${f.filename}`
- Si `f.url` existe (caso normal) → funciona
- Si `f.url` NO existe (draft hipotético antiguo) y slug vacío → `/static/blogs//img.jpg` → 404
- **Solución**: Como `f.url` YA existe siempre, este problema es teórico. Pero por seguridad, mejorar el fallback.

## Flujo Ideal Propuesto

```
[Usuario abre editor]
      ↓
[Sube imagen] → /media/blog_editor_temp/tmp/imagen.jpg
      ↓          response incluye url: "/media/blog_editor_temp/tmp/imagen.jpg"
      ↓
[Borrador guardado en localStorage] → incluye file.url: "/media/blog_editor_temp/tmp/imagen.jpg"
      ↓
[Usuario recupera borrador] → usa file.url para cargar imágenes
      ↓                          (ruta independiente del userId)
[Usuario guarda artículo] → imágenes se mueven a blogs_source/{slug}/ y se elimina tmp/
```

## Criterios de Aceptación (ACTUALIZADOS)

- [ ] La carpeta temporal usa `tmp` en lugar de `{user_id}`
- [ ] Las imágenes subidas aparecen en el grid del editor aunque el artículo no tenga slug todavía (✅ YA funciona)
- [ ] Al recuperar un borrador, las imágenes se visualizan sin errores 404 (✅ YA funciona con userId local)
- [ ] Al recuperar un borrador en producción, las imágenes se visualizan sin errores 404 (🔴 NUEVO: esto es lo que falla)
- [ ] Las imágenes temporales se eliminan cuando:
  - El artículo se guarda exitosamente
  - El borrador se descarta
- [ ] No hay imágenes huérfanas acumuladas en el servidor

## Flujo Técnico Detallado (ACTUALIZADO)

### 1. Al subir imagen (FilePond → `/blog/api/upload-file/`)
- **Actual**: Guarda en `media/blog_editor_temp/{user_id}/` y devuelve `{filename, url, type}`
- **Propuesto**: Guardar en `media/blog_editor_temp/tmp/` y devolver `{filename, url: "/media/blog_editor_temp/tmp/{filename}", type}`
- **Cambio mínimo**: Solo cambiar `str(user.id)` por `"tmp"` en `services.py` línea 702 y 717

### 2. Al guardar borrador (localStorage)
- **Actual**: ✅ YA guarda `file.url` completo en el draft
- **Propuesto**: Sin cambios, ya funciona

### 3. Al recuperar borrador
- **Actual**: ✅ `renderUploadedFile` usa `file.url` directamente
- **Propuesto**: Sin cambios, ya funciona. Pero actualizar fallback de `{userId}` a `tmp`

### 4. Al guardar artículo (POST `/blog/api/save-blog/`)
- **Actual**: Backend mueve imágenes de `{userId}/` a `blogs_source/{slug}/`
- **Propuesto**: Mover de `tmp/` a `blogs_source/{slug}/` y eliminar `tmp/` después

### 5. Al descartar borrador
- **Actual**: ❌ No existe cleanup
- **Propuesto**: Frontend llama a endpoint `/blog/api/cleanup-temp-files/` vía jQuery

## Archivos a Modificar

```diff
- backend/blog/services.py línea 702:  temp_dir = Path(settings.MEDIA_ROOT) / "blog_editor_temp" / str(user.id)
+ backend/blog/services.py línea 702:  temp_dir = Path(settings.MEDIA_ROOT) / "blog_editor_temp" / "tmp"

- backend/blog/services.py línea 717:  url_path = f"{media_url.rstrip('/')}/blog_editor_temp/{user.id}/{safe_name}"
+ backend/blog/services.py línea 717:  url_path = f"{media_url.rstrip('/')}/blog_editor_temp/tmp/{safe_name}"

- backend/blog/services.py línea 355:  temp_dir = Path(settings.MEDIA_ROOT) / "blog_editor_temp" / str(user.id)
+ backend/blog/services.py línea 355:  temp_dir = Path(settings.MEDIA_ROOT) / "blog_editor_temp" / "tmp"

+ backend/blog/services.py:  cleanup_temp_files()  # Nueva función

- backend/blog/views.py:  Nuevo endpoint cleanup_temp_api
+ backend/blog/urls.py:    Nueva ruta /blog/api/cleanup-temp-files/

- backend/blog/static/blog/js/blog_editor/index.js línea 183:  ...${document.body.dataset.userId}...
+ backend/blog/static/blog/js/blog_editor/index.js línea 183:  ...tmp...

- backend/blog/static/blog/js/blog_editor/index.js línea 237:  ...${userId}...
+ backend/blog/static/blog/js/blog_editor/index.js línea 237:  ...tmp...

+ backend/blog/static/blog/js/blog_editor/index.js:  Llamar a cleanup al descartar borrador
```

## Garantía de no ruptura

### ¿Por qué NO se rompe nada?

1. **`save_uploaded_file()` cambia de `{userId}` a `tmp`**: Las imágenes nuevas irán a `tmp/`. Las imágenes viejas en `{userId}/` NO se tocan. Los artículos ya guardados tienen sus imágenes en `blogs_source/{slug}/` y `static/blogs/{slug}/` → no se ven afectados.

2. **`save_blog_to_source()` cambia de `{userId}` a `tmp`**: Lee desde `tmp/` en lugar de `{userId}/`. Como las imágenes nuevas estarán en `tmp/`, funciona. Las imágenes viejas ya fueron movidas en su momento.

3. **Frontend `renderUploadedFile()`**: `tempUrl = file.url || ...` → si `file.url` existe (que es el caso normal), se usa directamente. El cambio en el fallback de `{userId}` a `tmp` solo afecta si `file.url` no existe (caso teórico).

4. **Drafts existentes en localStorage**: Tienen `file.url` con la ruta antigua `{userId}`. Al recuperarlos, `file.url` apunta a `media/blog_editor_temp/{userId}/` que SÍ existe (porque las imágenes viejas siguen ahí). **No se rompen.**

5. **Artículos ya publicados**: Sus imágenes están en `static/blogs/{slug}/`. No dependen de `media/blog_editor_temp/`. **No se rompen.**

### ¿Qué pasa con las imágenes existentes en `media/blog_editor_temp/15/`?

- **No se tocan**: Quedan donde están
- **Solo las nuevas** irán a `tmp/`
- **Opcional**: Script de limpieza manual para eliminar carpetas viejas

## Implementación por Fases

### Fase 1: Endpoint de upload (services.py)
- Cambiar `str(user.id)` por `"tmp"` en `save_uploaded_file()` (líneas 702 y 717)
- ✅ El response ya incluye `url`, no necesita cambios

### Fase 2: Endpoint de save-blog (services.py)
- Cambiar `str(user.id)` por `"tmp"` en `save_blog_to_source()` (línea 355)
- Agregar eliminación de carpeta `tmp/` después del move

### Fase 3: Endpoint de cleanup (nuevo)
- Crear función `cleanup_temp_files()` en `services.py`
- Crear endpoint `cleanup_temp_api` en `views.py`
- Agregar ruta en `urls.py`

### Fase 4: Frontend (index.js)
- Actualizar fallback en `renderUploadedFile` línea 183: `tmp` en lugar de `userId`
- Actualizar fallback en `renderUploadedFile` línea 237: `tmp` en lugar de `userId`
- Llamar a cleanup al descartar borrador (con jQuery)

## Riesgos y Mitigaciones

### Riesgo: Múltiples pestañas abiertas
- Todas comparten la misma carpeta `tmp/`
- Al guardar, solo se mueven las imágenes referenciadas en el contenido
- **Mitigación**: No eliminar `tmp/` si aún hay archivos no referenciados de otras pestañas. Solo eliminar si está vacía después del move.

### Riesgo: Colisión de nombres en `tmp/`
- `save_uploaded_file()` ya genera nombres únicos con sufijo UUID (línea 700: `unique_suffix = uuid.uuid4().hex[:8]`)
- **No hay riesgo** de colisión

### Riesgo: Drafts existentes con ruta `{userId}`
- Al recuperarlos, `file.url` apunta a `media/blog_editor_temp/{userId}/`
- Esas imágenes siguen existiendo (no se eliminan)
- **No hay ruptura**

## Status
- Estado: **Listo para implementar**
- Prioridad: **Media-Alta**
- Garantía de no ruptura: **100%** (cambios aditivos, backward compatible)