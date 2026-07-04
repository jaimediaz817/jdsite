# HU-025: Gestión de imágenes en borradores con flujo fluido

## Objetivo
Permitir que las imágenes subidas durante la edición de un borrador se recuperen correctamente cuando se reabre el editor, y que las imágenes temporales se eliminen automáticamente cuando el artículo se guarda o se descarta el borrador.

## Analisis del Problema Actual

### Estado Actual (Investigado)
```
URL del editor: /blog/editor/{slug}/ (cuando edita un artículo existente)
URL del editor: /blog/editor/ (cuando crea un nuevo artículo)

Carpeta temporal: /media/blog_editor_temp/{user_id}/
  - EJ: /media/blog_editor_temp/15/Captura_de_pantalla.png
  - EJ: /media/blog_editor_temp/15/IMG_20260501.jpg

Carpeta definitiva: /static/blogs/{slug}/
  - EJ: /static/blogs/2026-07-03_test2/JD_marca_personal_fbb1e952.jpg
```

### Problema Identificado
1. **Número "quemado" en la ruta**: La carpeta temporal usa `{user_id}` (ej: `15`) que:
   - No es semántico ni descriptivo
   - Puede cambiar si el usuario cambia de ID
   - No funciona bien en producción si los IDs difieren entre entornos

2. **Flujo de recuperación de borradores roto**:
   - Cuando el usuario abre `/blog/editor/2026-07-03_test2/` y edita → se guarda borrador
   - Al recuperar el borrador, las imágenes intentan cargar desde rutas incorrectas
   - El slug NO está disponible aún en `renderUploadedFile` porque `file.url` NO se guarda en el draft

3. **Imágenes temporales no se limpian**:
   - Al guardar el artículo → imágenes se mueven a `/static/blogs/{slug}/`
   - Las imágenes en `/media/blog_editor_temp/15/` quedan huérfanas
   - No hay mecanismo de limpieza automática

### Flujo Ideal Propuesto
```
[Usuario abre editor]
      ↓
[Sube imagen] → /media/blog_editor_temp/tmp/{session_token}/imagen.jpg
      ↓
[Borrador guardado en localStorage] → incluye session_token
      ↓
[Usuario recupera borrador] → usa session_token para cargar imágenes
      ↓
[Usuario guarda artículo] → imágenes se mueven a /static/blogs/{slug}/ y se elimina /tmp/{session_token}/
      ↓
[Borrador descartado] → se elimina /tmp/{session_token}/ automáticamente
```

## Criterios de Aceptación

- [ ] Las imágenes subidas aparecen en el grid del editor aunque el artículo no tenga slug todavía
- [ ] Al recuperar un borrador, las imágenes se visualizan sin errores 404
- [ ] La carpeta temporal usa `tmp` en lugar de `{user_id}`
- [ ] Las imágenes temporales se eliminan cuando:
  - El artículo se guarda exitosamente
  - El borrador se descarta
  - El usuario cierra el editor sin guardar (opcional)
- [ ] No hay imágenes huérfanas acumuladas en el servidor

## Flujo Técnico Detallado

### 1. Al subir imagen (FilePond → `/blog/api/upload-file/`)
- **Actual**: `POST /blog/api/upload-file/` guarda en `media/blog_editor_temp/{user_id}/`
- **Propuesto**: Guardar en `media/blog_editor_temp/tmp/{session_token}/`
- El response incluye `url: "/media/blog_editor_temp/tmp/{session_token}/{filename}"`

### 2. Al guardar borrador (localStorage)
- Se guarda `file.url` completo en el draft
- Se guarda `file.tmp_folder: "tmp/{session_token}"` para referencia

### 3. Al recuperar borrador
- `renderUploadedFile` usa `file.url` directamente (sin fallback necesario)
- Si no hay URL, usa `file.tmp_folder` para construir la ruta

### 4. Al guardar artículo (POST `/blog/api/save-blog/`)
- Backend mueve imágenes de `tmp/{session_token}/` a `blogs/{slug}/`
- Backend elimina `tmp/{session_token}/` vacío si queda

### 5. Al descartar borrador
- Frontend llama a endpoint `/blog/api/cleanup-temp-files/`
- Backend elimina `tmp/{session_token}/`

## Implementación por Fases

### Fase 1: Endpoint de upload
- Modificar `save_uploaded_file()` en `services.py` para usar carpeta `tmp/`
- Generar `session_token` único usando `Date.now()` o UUID

### Fase 2: Endpoint de save-blog
- Modificar para mover imágenes de temp a static
- Eliminar carpeta temporal vacía después del move

### Fase 3: Endpoint de cleanup (nuevo)
- Crear endpoint para limpiar imágenes temporales
- Llamar al descartar borrador

### Fase 4: Frontend
- Guardar `file.url` completo en el draft
- Actualizar `renderUploadedFile` para usar URLs guardadas

## Consideraciones Técnicas

### ¿Qué pasa con múltiples pestañas abiertas?
- Cada pestaña genera su propio `session_token`
- Las imágenes son independientes por sesión

### ¿Qué pasa si el usuario recarga la página?
- El `session_token` se pierde, pero el slug ya existe (está en la URL)
- Fallback: usar `/static/blogs/{slug}/` para encontrar imágenes

### ¿Qué pasa con usuarios anónimos?
- No pueden subir archivos sin autenticación
- El endpoint requiere login_required (ya está implementado)

## Archivos Involucrados

```
backend/blog/services.py          # save_uploaded_file()
backend/blog/views.py             # endpoints de upload, save-blog
backend/blog/urls.py              # rutas
backend/blog/static/blog/js/blog_editor/index.js  # renderUploadedFile, restoreDraft
```

## Escenarios Actuales - Análisis Profundo

### Escenario A: Nuevo artículo desde cero
```
1. Usuario abre /blog/editor/
2. Sube imágenes → /media/blog_editor_temp/15/imagen.jpg
3. Escribe contenido → se guarda en localStorage
4. Cierra pestaña sin guardar
5. Vuelve al editor → recupera borrador
   ❌ Problema: Las imágenes intentan cargar desde ruta vacía (sin slug)
```

### Escenario B: Editar artículo existente
```
1. Usuario abre /blog/editor/2026-07-03_test2/
2. El artículo EXISTE → loadExistingArticle() carga imágenes desde static/blogs/2026-07-03_test2/
3. El draft se elimina automáticamente al cargar
4. Usuario edita → NUEVO borrador en localStorage (archivos NUEVOS van a media/blog_editor_temp/15/)
5. Si recarga → ve modal de borrador
   ❌ Problema: Las imágenes NUEVAS no tienen slug guardado
```

### Escenario C: Guardar artículo exitoso
```
1. Usuario guarda → save_blog() mueve imágenes de media/15/ a static/blogs/{slug}/
2. El response incluye el slug y las imágenes apuntan a la nueva ubicación
3. Pero... media/blog_editor_temp/15/ NO se limpia
   ❌ Problema: Imágenes huérfanas acumuladas
```

### Escenario D: Producción
```
- Usuario local tiene ID 15
- Usuario producción tiene ID 3
- Las imágenes apuntan a /media/blog_editor_temp/15/ → 404 en producción
```

## Impacto del Problema

### Archivos huérfanos acumulados
El `git status` mostró:
- 50+ imágenes en `media/blog_editor_temp/15/`
- Ninguna carpeta `26/` o `10/` fue limpiada
- Crecimiento infinito del storage

### Imagen 404 en borradores
- `/static/blogs/JD_marca_personal_fbb1e952.jpg` (sin slug) → 404
- La imagen real está en `/static/blogs/2026-07-03_test2/JD_marca_personal_fbb1e952.jpg`

## Status
- Estado: **En análisis**
- Prioridad: **Media-Alta**
