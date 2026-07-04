# HU-025: Análisis de Flujos - Gestión de imágenes en borradores

## Flujo Actual (sin implementar cambios)

### 1. Al subir imagen (FilePond → `/blog/api/upload-file/`)
**Frontend (index.js líneas 1889-1922):**
- El response incluye `{filename, url, type}`
- Se guarda en `uploadedFiles.push(data)` array
- Se llama `renderUploadedFile(data)` con el objeto completo

**Backend (services.py líneas 702, 717):**
```
temp_dir = Path(settings.MEDIA_ROOT) / "blog_editor_temp" / str(user.id)
url_path = f"{media_url.rstrip('/')}/blog_editor_temp/{user.id}/{safe_name}"
```

### 2. Al guardar borrador (localStorage)
**Frontend (index.js líneas 1940-1962):**
- `collectFormData()` guarda `files: uploadedFiles` en localStorage
- Cada archivo tiene: `{filename, url, type, hidden, is_cover}`
- `url` apunta a `/media/blog_editor_temp/{user_id}/`

### 3. Al recuperar borrador
**Frontend (index.js líneas 2062-2100+):**
- `restoreDraft(data)` asigna slug si existe
- Los archivos se recargan con `file.url` disponible
- `renderUploadedFile()` usa `file.url` (línea 183)

### 4. Al guardar artículo (POST `/blog/api/save-blog/`)
**Backend (services.py líneas 355-376):**
- `temp_dir = Path(settings.MEDIA_ROOT) / "blog_editor_temp" / str(user.id)`
- Se mueven archivos de `tmp/{user_id}/` → `blogs_source/{slug}/`
- La carpeta temporal NO se elimina después

## Escenarios posibles al crear nuevo artículo

### Escenario A: Nuevo artículo → subir imágenes → guardar borrador → recuperar
1. Usuario abre `/blog/editor/` (slug vacío)
2. Sube imágenes → `/media/blog_editor_temp/{userId}/imagen.jpg`
3. `renderUploadedFile()` muestra imágenes desde `file.url`
4. Borrador guardado en localStorage con `file.url` completo
5. Recupera borrador: **imágenes cargan correctamente** (url guardado)
6. Al guardar artículo: imágenes se mueven a `blogs_source/{slug}/`

### Escenario B: Nuevo artículo → recargar página → recuperar borrador
1. Usuario recarga `/blog/editor/`
2. `restoreDraft()` carga archivos con `file.url`
3. **Imágenes cargan** porque `url` está en el draft

### Escenario C: Editar artículo existente + subir nuevas imágenes
1. Usuario abre `/blog/editor/{slug_existente}/`
2. `loadExistingArticle()` carga imágenes desde `static/blogs/{slug}/`
3. Sube nuevas imágenes → `media/blog_editor_temp/{userId}/nuevas.jpg`
4. Borrador guardado con `file.url` para nuevas imágenes
5. Al recargar/recuperar: **imágenes nuevas cargan correctamente**

### Escenario D: Múltiples pestañas abiertas
1. Usuario abre 2 pestañas de editor
2. Ambas suben imágenes → ambas van a `media/blog_editor_temp/{userId}/`
3. **Colisión de nombres posible** (aunque el código usa UUID suffix)
4. Al guardar: ambas imágenes se mueven (las 2 referenciadas en su contenido)

### Escenario E: Producción vs desarrollo
- Desarrollo: `user.id = 15`
- Producción: `user.id = 3`
- Imágenes subidas apuntan a `/media/blog_editor_temp/15/` → **404 en producción**

## Problemas identificados

| Problema                       | Impacto                    | Solución         |
| ------------------------------ | -------------------------- | ---------------- |
| `{user_id}` en ruta temporal   | No portable entre entornos | Cambiar a `tmp`  |
| Carpeta temporal no se limpia  | Acumulación infinita       | Endpoint cleanup |
| Colisión en múltiples pestañas | Bajo (UUID suffix)         | Compartir `tmp/` |

## Garantía de no ruptura

### ¿Qué pasa con drafts existentes?
- Los drafts actuales tienen `file.url: "/media/blog_editor_temp/{userId}/{filename}"`
- La carpeta `{userId}` **existe** y las imágenes están allí
- Al recuperar: **funcionan correctamente**

### ¿Qué pasa con artículos publicados?
- Imágenes están en `static/blogs/{slug}/`
- No se tocan ni se mueven
- **No afectados**

### ¿Qué pasa con imágenes nuevas?
- Irán a `tmp/` en lugar de `{userId}/`
- Al recuperar borrador: usan `file.url` que apunta a `tmp/`
- Al guardar artículo: se mueven a `blogs_source/{slug}/`

## Cambios requeridos (mínimos)

### services.py (3 líneas)
```python
# Línea 702: 
temp_dir = Path(settings.MEDIA_ROOT) / "blog_editor_temp" / "tmp"

# Línea 717:
url_path = f"{media_url.rstrip('/')}/blog_editor_temp/tmp/{safe_name}"

# Línea 355:
temp_dir = Path(settings.MEDIA_ROOT) / "blog_editor_temp" / "tmp"
```

### Frontend (2 líneas)
```javascript
// Línea 183 (ya funciona con file.url):
const tempUrl = file.url || `/media/blog_editor_temp/tmp/${file.filename}`;

// image-selector.js línea similar:
img.src = file.url || `/media/blog_editor_temp/tmp/${file.filename}`;
```

### Nuevo endpoint (opcional)
```python
# DELETE /blog/api/cleanup-temp-files/
# Elimina imágenes en /media/blog_editor_temp/tmp/
```

## Checklist de verificación

- [x] `save_uploaded_file()` YA devuelve `url` en response
- [x] `renderUploadedFile()` YA usa `file.url` primero
- [x] `restoreDraft()` guarda y recupera `files` array completo
- [ ] Cambiar `{user_id}` → `tmp` en services.py
- [ ] Cambiar fallback en frontend a `tmp/`
- [ ] Implementar endpoint cleanup (opcional)