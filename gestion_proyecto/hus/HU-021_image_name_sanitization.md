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
Pendiente de desarrollo.