# HU-021: Sanitización de nombres de archivos de imagen al importarlos

## Objetivo
Garantizar que, durante el proceso de importación de blogs y la carga de imágenes desde el editor, los nombres de los archivos de imagen nunca contengan espacios ni caracteres especiales que puedan romper la URL.

## Criterios de aceptación
1. **Función utilitaria** `sanitizar_nombre` creada en `backend/blog/utils/importer/filename_utils.py` que:
   - Elimina espacios al inicio y al final.
   + Reemplaza espacios internos por `_`.
   + Elimina caracteres que no sean alfanuméricos, `-`, `_` o `.`.
   + (Opcional) Convierte a minúsculas para consistencia.
2. Todos los métodos que copian o generan rutas de imágenes (`copy_blog_images`, `process_images`, `extract_cover_image` y sus equivalentes en `import_blogs.py`) utilizan esa función antes de crear el archivo destino.
3. **Prueba unitaria** `backend/blog/tests/test_image_name_sanitization.py` que verifica que `sanitizar_nombre('mi foto.png')` devuelve `mi_foto.png` (sin espacios).
4. La documentación de la mejora queda registrada en esta historia de usuario.

## Pasos de implementación
1. Crear el módulo `filename_utils.py` con la función `sanitizar_nombre`.
2. Importar y usar la función en los puntos señalados del backend.
3. (Opcional) Aplicar la misma lógica en los scripts de subida del editor JavaScript.
4. Añadir la prueba unitaria `test_image_name_sanitization.py`.
5. Ejecutar la suite de tests y asegurar que la nueva prueba pasa una vez implementada la función.

## Estado
24 | Pendiente de desarrollo.
25 |
26 | ## Ejemplo
27 |
28 | **Imagen original en el editor**
29 |
30 | ```markdown
31 | ![Descripción de la foto](/media/mi foto #1.png)
32 | ```
31 | 
32 | **Nombre sanitizado al guardarse**
33 |
34 | ```
35 | mi_foto_1.png
36 | ```
37 |
38 | **Resultado en el HTML del blog**
39 |
40 | ```html
41 | <img src="/static/blogs/<slug>/mi_foto_1.png" alt="Mi Foto 1" loading="lazy" />
42 | ```
43 |
44 | En este ejemplo, los espacios y el carácter `#` fueron reemplazados por guiones bajos y se eliminaron caracteres no permitidos, garantizando una URL válida.

## Diagnóstico y solución para imágenes existentes

### Problema
Algunas entradas de blog ya importadas contienen imágenes cuyo nombre de archivo incluye espacios o caracteres especiales (por ejemplo `mi foto #1.png`). Estas imágenes siguen almacenadas en el directorio estático bajo su nombre original, lo que provoca URLs rotas y errores 404 en el sitio.

### Estrategia de saneamiento
1. **Escaneo del directorio estático**: recorrer `static/blogs/` y detectar archivos cuyo nombre no cumpla la regla de `sanitizar_nombre`.
2. **Renombrado seguro**:
   - Generar el nombre sanitizado usando la función `sanitizar_nombre`.
   - Renombrar el archivo en el sistema de archivos.
   - Registrar en un mapa `{nombre_original: nombre_nuevo}`.
3. **Actualización de referencias en la base de datos**:
   - Buscar en los campos `content` de `BlogPost` (HTML) y en `cover_image` del front‑matter cualquier aparición del nombre original.
   - Reemplazar con el nombre sanitizado.
   - Guardar los cambios.
4. **Actualización de referencias en archivos markdown** (para blogs que aún no se hayan importado):
   - Ejecutar un script que abra cada `blog.md` y reemplace los enlaces de imagen con los nombres sanitizados.
5. **Ejecutar como tarea de mantenimiento**:
   - Proveer un comando de gestión Django `python manage.py sanitize_images` que realice los pasos 1‑4.

### Script de ejemplo (pseudo‑código)
```python
from pathlib import Path
from blog.utils.importer.filename_utils import sanitizar_nombre
from blog.models import BlogPost

static_root = Path('backend/static/blogs')
rename_map = {}
for img_path in static_root.rglob('*.*'):
    if not img_path.is_file():
        continue
    sanitized = sanitizar_nombre(img_path.name)
    if sanitized != img_path.name:
        new_path = img_path.with_name(sanitized)
        img_path.rename(new_path)
        rename_map[img_path.name] = sanitized

# actualizar HTML en los posts
for post in BlogPost.objects.all():
    content = post.content
    for old, new in rename_map.items():
        content = content.replace(old, new)
    if content != post.content:
        post.content = content
        post.save()
```

Este script debe ejecutarse una sola vez después de desplegar la nueva lógica de sanitización.

### Registro en la HU
Se añadirá este procedimiento al documento de la historia de usuario para que el equipo de mantenimiento tenga una guía clara de cómo aplicar la corrección a los datos existentes.

## Cómo ejecutar la corrección

1. **Activar el entorno virtual** (si no está activo):
   ```bash
   source .venv/Scripts/activate
   ```
2. **Ejecutar el comando de gestión** que acabamos de crear:
   ```bash
   python manage.py sanitize_images
   ```
   - El comando escaneará `static/blogs/`, renombrará los archivos con nombres no válidos y actualizará las referencias en la base de datos.
   - Mostrará en la consola cada archivo renombrado y cada post actualizado.
3. **Verificar** que las URLs de las imágenes en el sitio ya no generan errores 404.
4. (Opcional) **Ejecutar nuevamente** el comando para asegurarse de que no quedan nombres pendientes.

Con estos pasos el equipo podrá sanear de forma segura todas las imágenes que ya estaban publicadas con nombres problemáticos.