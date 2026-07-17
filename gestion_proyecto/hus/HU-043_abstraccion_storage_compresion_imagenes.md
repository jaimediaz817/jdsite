# HU-043: Abstracción de Storage y Compresión de Imágenes/Video

## Objetivo
Refactorizar el manejo de almacenamiento de imágenes y videos para:
1. Introducir una capa de abstracción que permita intercambiar el backend de almacenamiento (filesystem local, S3, Cloudflare R2, etc.) sin cambiar la lógica de negocio.
2. Implementar compresión automática de imágenes y videos al momento de subida para reducir tamaño, ahorrar ancho de banda y prevenir colapso del servidor por archivos pesados.

## Contexto y Diagnóstico
- **Problema actual**: El usuario sube imágenes de alta resolución desde móvil (54MB, 10MB, etc.). Django guarda todo en `/media/blog_editor_temp/<user_id>/` y luego se mueve a `blogs_source/<slug>/`. No hay compresión ni optimización.
- **Riesgo**: Con el crecimiento de artículos y archivos multimedia, el almacenamiento local de la VPS se saturará. También se consume ancho de banda innecesariamente.
- **Artefactos responsables hoy**:
  - `backend/blog/services.py`: funciones `save_uploaded_file` y `save_blog_to_source` (líneas 681-746, 264-582).
  - `backend/blog/views.py`: vista `upload_file_api` y lógica de movimiento de archivos.
  - `backend/jdsite/settings.py`: configuración de `MEDIA_ROOT`, `MEDIA_URL`, `MAX_UPLOAD_SIZE_MB`.
  - `backend/.env`: variable `MAX_UPLOAD_SIZE_MB`.
- **Arquitectura actual**: Acoplamiento directo a `shutil.move()` y escritura en filesystem local. No hay interfaz de storage desacoplada.

## Criterios de Aceptación
1. **Abstracción de Storage (Backend-agnostic)**:
   - Crear interfaz `blog/storage_backends/base.py` con métodos: `save(uploaded_file, user, path)` y `delete(path)` y `url(path)`.
   - Implementaciones:
     - `LocalStorageBackend` (por defecto, mantiene comportamiento actual).
     - `S3StorageBackend` (preparado para futura activación mediante settings).
   - Configuración en `.env` y `settings.py`: `STORAGE_BACKEND = "blog.storage_backends.local.LocalStorageBackend"` y parámetros de S3 (`AWS_ACCESS_KEY_ID`, etc.) ya preparados.
   - Todo upload y delete en el código debe pasar por esta abstracción (SINromper la lógica de sanitización de nombres, movimiento a `blogs_source`, etc.).

2. **Compresión de Imágenes**:
   - Usar Pillow (ya instalado en el proyecto) para:
     - Redimensionar imágenes que superen resolución máxima (ej: 1920px en el lado más largo).
     - Aplicar compresión con pérdida controlada (calidad 85).
     - Convertir a formatos optimizados cuando aplique (preservar originales no, generar nuevo nombre: `original_optim.jpg`).
   - Aceptar videos: no comprimir (requiere ffmpeg, fuera de scope), solo mover/advertencia si excede límite. Se prioriza imágenes.

3. **Variables de entorno configurables**:
   - `IMAGE_MAX_WIDTH`, `IMAGE_MAX_HEIGHT` (default 1920).
   - `IMAGE_COMPRESSION_QUALITY` (default 85).
   - `COMPRESS_IMAGES_ON_UPLOAD` (default True).

4. **No romper flujos existentes**:
   - Si la compresión falla, hacer fallback al guardado original (no perder el archivo).
   - Los nombres de archivo sanitizados y URLs generadas deben mantenerse igual (`/media/blog_editor_temp/...` en dev, o dominio S3 en prod).
   - Eliminación de recursos (`delete_resource_file`) debe funcionar contra cualquier backend.
   - `import_blogs` sigue funcionando porque opera sobre `blogs_source/` y `static/blogs/` locales; no depende del backend de storage de uploads. Solo si se desea migrar assets históricos entre backends se requiere un comando externo opcional (fuera de scope).

5. **Testing mínimo**:
   - Añadir test unitario que suba una imagen de 20MB y devuelva un archivo comprimido menor a 2MB.
   - Verificar que `save_uploaded_file` con backend S3 simulado guarde correctamente (mock del cliente boto3).

## Diseño Propuesto

### Patrones de Diseño
- **Strategy Pattern**: `StorageBackend` como estrategia intercambiable configurada por settings.
- **Decorator/Wrapper**: `CompressorMiddleware` que envuelve el storage backend y comprime antes de guardar.

### Estructura de archivos (nueva)
```
backend/blog/
  storage_backends/
    __init__.py
    base.py                 # Clase abstracta BaseStorageBackend
    local.py                # Implementación filesystem local (actual)
    s3.py                   # Implementación S3 (preparada para agnostico)
    r2.py                   # (Opcional) Cloudflare R2 u otro proveedor compatible S3
  services/
    __init__.py (ya existe)
    image_compressor.py     # Lógica de compresión con Pillow
```
Nota: Se mantiene `services.py` intacto, solo se modifica `save_uploaded_file` para usar el backend y compresor.

### Contractos de la abstracción (proveedor-agnóstica)
- `BaseStorageBackend.save(uploaded_file, user, path_hint) -> dict` con `{filename, url, size_bytes}`.
- `BaseStorageBackend.delete(path) -> bool`.
- `BaseStorageBackend.url(path) -> str`.
- `BaseStorageBackend.health_check() -> bool` (ping simple: listar/HEAD objeto) para diagnósticos y dashboard.

### Principios de Proveedor-Agnosticismo y Manejo de Credenciales
- Cambiar de proveedor (o volver a la VPS) se hace **solo por configuración**: modificar `STORAGE_BACKEND` en `.env` y valores de conexión del proveedor elegido.
- Las credenciales se inyectan por variables de entorno; el código **no hardcodea** secretos ni proveedores.
- La abstracción **no debe filtrar dependencias** de un proveedor concreto. `LocalStorageBackend` no depende de `boto3`; `S3StorageBackend` sí, pero se importa/instala solo cuando se usa.
- Al regresar a almacenamiento local en la VPS: cambiar `STORAGE_BACKEND` a `local` y listo. No se obliga a migrar archivos existentes; las URLs pueden mantenerse igual gracias a que el backend devuelve la ruta pública correcta (`/media/...`).

### Política de URLs y dominio público
- Cada backend **provee su propia URL pública** a través de `url(path)`:
  - Local: `/media/...`
  - S3/R2: dominio del bucket o CDN
- El frontend y templates consumen la URL que el backend retorne; no hay dominio hardcodeado.
- Nginx/Django pueden servir `/media/` en local o proxyar a CDN sin cambiar código.

### Flujo esperado
1. Usuario sube imagen vía `image-selector.js` → POST a `upload_file_api`.
2. Vista delega a `save_uploaded_file(file, user)`.
3. `save_uploaded_file`:
   - Sanitiza nombre (filename_utils).
   - Si `COMPRESS_IMAGES_ON_UPLOAD=True` y es imagen: comprime con Pillow (buffer temporal).
   - Delega a `storage_backend.save(compressed_file, user, ruta)`.
4. El backend concreto guarda en:
   - Filesystem local (VPS), o
   - S3/R2, sin cambiar lógica de negocio.
5. Devuelve `{filename, url, type}` al frontend.

### Rollback y operación en VPS
- El caso “volver a almacenar en esta misma VPS” se cubre con `LocalStorageBackend` activando `STORAGE_BACKEND=local`.
- No se eliminan archivos externos al cambiar de proveedor; se mantiene rutas claras y un posible comando de migración opcional (fuera de scope) si se requiere mover assets.
- No hay lock-in: cambiar de bucket/S3 a local no requiere reescribir código, solo `.env`.

### Configuración de ejemplo en `.env` (sin secretos hardcodeados)
```bash
# Desarrollo / VPS (local)
STORAGE_BACKEND=blog.storage_backends.local.LocalStorageBackend

# Producción externa (S3/R2) - ejemplo
# STORAGE_BACKEND=blog.storage_backends.s3.S3StorageBackend
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# AWS_STORAGE_BUCKET_NAME=...
# AWS_S3_REGION_NAME=...
# Opcional: CDN endpoint personalizado
# MEDIA_URL_DOMAIN=https://cdn.tudominio.com
```

### Riesgos y Mitigaciones
- **Credenciales expuestas**: nunca loguear keys. Usar env vars + gestor de secretos en deploy. Rotación sin deploy (solo cambiar `.env`).
- **Proveedor-agnosticismo roto por dependencias**: `boto3` es dependencia opcional; se instala solo si se usa S3/R2. `LocalStorageBackend` no depende de librerías externas.
- **Compatibilidad URLs**: respetar siempre el `url()` del backend; Django/nginx pueden proxyar `/media/` hacia local o CDN sin tocar código.

## Plan de Implementación (Fases ≤ 20 min)
- **Fase 1**: Crear abstracción `storage_backends/base.py` + `local.py`. Modificar `save_uploaded_file` para usar el backend (sin compresión aún).
- **Fase 2**: Implementar `image_compressor.py` y pruebas unitarias básicas.
- **Fase 3**: Integrar compresor en `save_uploaded_file` con fallback si falla.
- **Fase 4**: Ajustar `save_blog_to_source` y vistas de eliminación para usar el backend (delete).
- **Fase 5**: Agregar settings y .env defaults. Documentar cómo activar S3.
- **Fase 6**: Pruebas end-to-end (imagen grande → verificar peso reducido; backend local funciona; URLs consistentes).

## Riesgos y Mitigaciones
- **Performance CPU (compresión)**: límite de resolución configurable; si es muy alta, rechazar (ya se hace con MAX_UPLOAD_SIZE_MB).
- **Memoria**: procesar en chunks si es necesario (Pillow puede abrir archivos completos). Para MVP, se confía en PIL stream y límite de 20MB (DATA_UPLOAD_MAX_MEMORY_SIZE).
- **Compatibilidad**: rollback fácil desactivando `COMPRESS_IMAGES_ON_UPLOAD` o cambiando `STORAGE_BACKEND` a local.
## Impacto
- **Cero downtime**: se implementa detrás de un feature flag (`COMPRESS_IMAGES_ON_UPLOAD`).

## Ejemplo práctico: migración S3 → VPS local paso a paso
1. Estado actual: `STORAGE_BACKEND=blog.storage_backends.s3.S3StorageBackend`; assets nuevos van al bucket.
2. Cambiar `.env`: `STORAGE_BACKEND=blog.storage_backends.local.LocalStorageBackend`.
3. Dejar de definir variables AWS en `.env` (o limpiarlas).
4. Reiniciar Django.
5. A partir de ahí, nuevos uploads se guardan en `/media/blog_editor_temp/...`, y `save_blog_to_source` mueve a `blogs_source/...`.
6. `import_blogs` sigue copiando a `static/blogs/<slug>/`.
7. URLs públicas nuevas vuelven a ser `/media/...` y `/static/blogs/...` servidos por la VPS.
8. Si querés migrar assets históricos que quedaron en S3, podés crear un script opcional que los descargue y los copie a `blogs_source/` y `static/blogs/`, pero **no es obligatorio** para que el sistema funcione.
</parameter>
</write_to_file>