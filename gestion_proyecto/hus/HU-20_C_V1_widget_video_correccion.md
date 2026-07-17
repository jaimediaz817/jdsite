# HU-20-C-V1 Widget de Video Local - Corrección de Carga y Visualización

## Estado: COMPLETADO ✅

## Problema Diagnóstico

Al subir un video desde el editor (`blog_editor.html`), el recurso **no aparece en el visor de recursos** ni **se carga correctamente en la visualización del artículo**.

## Causas raíz identificadas y corregidas

### ✅ 1. Widget sin evento mousedown en gripBtn
**Archivo:** `backend/blog/static/blog/js/blog_editor/index.js`  
**Función:** `createLocalVideoWidget(lineNumber, filename)`  
**Problema:** El botón de arrastre (⋮) NO tenía el evento `mousedown` que inicia la función `startImageDrag()`.  
**Solución:** Agregado el handler `gripBtn.addEventListener('mousedown', ...)` en línea ~1029-1033.

### ✅ 2. Widget sin handler del dropdown  
**Archivo:** `backend/blog/static/blog/js/blog_editor/index.js`  
**Función:** `createLocalVideoWidget(lineNumber, filename)`  
**Problema:** El botón "Eliminar video" del dropdown no tenía el handler de click.  
**Solución:** Agregado el handler `dropdown.querySelectorAll('.img-line-dropdown-item')` en línea ~1035-1047.

### ✅ 3. Condición de arrastre omitía videos locales
**Archivo:** `backend/blog/static/blog/js/blog_editor/index.js`  
**Función:** `startImageDrag(lineNumber, triggerElement)`  
**Problema:** La verificación `if (!isImageLine(lineNumber) && !isYouTube) return;` no incluía `isVideoLine(lineNumber)`, impidiendo el arrastre de videos.  
**Solución:** Modificado a `if (!isImageLine(lineNumber) && !isYouTube && !isVideoLine(lineNumber)) return;`

### ✅ 4. Regex correcta en `video-widget.js`
La línea 209 usa `serverUrl = uploadResult.url || ...` - está bien implementado.

### ✅ 5. Flujo de renderizado en `renderUploadedFile`
El video se crea correctamente como elemento `<video>` con `controls`.

### ✅ 6. Procesamiento de videos en `blog_processor.py`
La función `process_videos` detecta `<video>` tags y usa `_resolve_video_src` para resolver rutas.

### ✅ 7. URL temporal vs ruta estática
El video se sube a `/media/blog_editor_temp/<user_id>/<filename>` y luego se mueve a `blogs_source/<slug>/` y finalmente a `static/blogs/<slug>/` por `import_blogs`.

## Flujo de funcionamiento

1. Usuario sube video desde modal → `blog_editor.html` → FilePond → `/blog/api/upload-file/`
2. `services.py::save_uploaded_file()` guarda en `/media/blog_editor_temp/<user_id>/<filename>`
3. Retorna `{filename, url, type: "video"}`
4. `renderUploadedFile()` muestra preview en grid con elemento `<video controls>`
5. Usuario guarda artículo → `/blog/api/save-blog/` → mueve archivos a `blogs_source/<slug>/`
6. `import_blogs` → `blog_processor.py::process_videos()` → resuelve ruta y construye `<div class="blog-video-container">`
7. `blog_processor.py::_resolve_video_src()` copia video a `static/blogs/<slug>/`
8. `blog_detail.html` renderiza `{{ post.content_html|safe }}` con el video

## Verificaciones realizadas

- [x] Syntax JS validado (sin errores)
- [x] Widget de video muestra menú MTP correctamente con grip y dropdown
- [x] `renderUploadedFile` crea elemento `<video>` con `controls`
- [x] Widget video permite arrastre (condición corregida en `startImageDrag`)
- [x] `services.py::save_uploaded_file` soporta videos `.mp4, .webm, .mov, .avi`
- [x] `blog_processor.py::process_videos` detecta `<video>` tags

## Archivos modificados

- `backend/blog/static/blog/js/blog_editor/index.js` - Funciones `createLocalVideoWidget()` y `startImageDrag()`
- `backend/blog/templates/blog/blog_detail.html` - Script de procesamiento de videos locales para corregir rutas `/media/blog_editor_temp/` → `/static/blogs/<slug>/`

## ✅ 8. Script de procesamiento de videos en blog_detail.html (NUEVO)

**Archivo:** `backend/blog/templates/blog/blog_detail.html`  
**Problema:** Los videos se guardaban con rutas temporales `/media/blog_editor_temp/` que no existen después de publicar.  
**Solución:** Agregado script inmediato después del contenido que:
- Busca todos los elementos `<video>` dentro de `.blog-content`
- Detecta URLs que apunten a `/media/blog_editor_temp/`
- Reemplaza la ruta por `/static/blogs/{{ post.slug }}/<filename>`
