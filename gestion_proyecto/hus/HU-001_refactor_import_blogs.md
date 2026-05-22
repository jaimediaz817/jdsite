# HU-001: Refactorizar comando de importación de blogs

## Historia de Usuario
**ID:** HU-001
**Título:** Como desarrollador, quiero refactorizar el comando `import_blogs.py` en fragmentos más manejables y escalables, sin romper la funcionalidad actual, para facilitar su mantenimiento y evolución.
**Objetivo:** Mejorar la legibilidad, modularidad y testabilidad del proceso de importación de blogs.
**Criterios de aceptación:**
1. El comando sigue importando, actualizando y limpiando blogs exactamente como antes.
2. Cada bloque funcional (secuencias DB, lectura markdown, gestión de imágenes, bloques especiales, guardado, etc.) está aislado en su propio módulo o clase.
3. Se añaden pruebas unitarias básicas para los nuevos módulos (no obligatorias en esta fase, pero la estructura permite añadirlas fácilmente).
4. No se elimina ni modifica código existente que ya funciona; los cambios son aditivos o refactorizaciones internas.
5. La documentación del proceso (HU, plan, diagramas) se encuentra en `gestion_proyecto/hus/`.

## Plan de Refactorización

### 1. Análisis y clasificación de responsabilidades
| Bloque actual                                                 | Responsabilidad                                               | Propuesta de módulo/clase                                                  |
| ------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `reset_id_sequences`                                          | Gestión de secuencias DB                                      | `db_utils.py` – función `reset_blogpost_sequence`                          |
| `process_single_blog`                                         | Orquestación de importación de un blog                        | `blog_processor.py` – clase `BlogImporter`                                 |
| Lectura/normalización markdown                                | `read_markdown_file`, `_normalize_lines`                      | `markdown_utils.py` – funciones `read_markdown`, `normalize_lines`         |
| Extracción de título, portada, front‑matter                   | `extract_title`, `extract_cover_image`                        | `metadata_extractor.py` – funciones `extract_title`, `extract_cover_image` |
| Gestión de imágenes estáticas                                 | `copy_blog_images`, `process_images`, `replace_popup_gallery` | `static_assets.py` – funciones `copy_images`, `process_image_tags`         |
| Bloques especiales (slides, callout, pullquote, codefile, vl) | `replace_special_blocks_md`, `process_special_blocks`         | `special_blocks.py` – funciones por tipo                                   |
| Conversión markdown → HTML                                    | `convert_markdown_to_html`                                    | `markdown_converter.py` – función `markdown_to_html`                       |
| Formateo final HTML                                           | `apply_custom_formatting`                                     | `html_formatter.py` – función `apply_custom_formatting`                    |
| Categorías y tags                                             | `get_or_create_category`, `get_tags_from_frontmatter`         | `taxonomy.py` – funciones `get_or_create_category`, `parse_tags`           |
| Guardado en BD                                                | `save_blog_post`                                              | `persistence.py` – función `save_or_update_blogpost`                       |
| Limpieza de blogs huérfanos                                   | `cleanup_removed_blogs`                                       | `cleanup.py` – función `remove_missing_blogs`                              |

### 2. Creación de paquetes
Crear una nueva carpeta `backend/blog/utils/importer/` que contenga los módulos listados arriba. Esta ubicación sigue la convención del proyecto para utilidades reutilizables y evita dudas sobre la ubicación del código refactorizado.

### 3. Migración paso a paso
1. **Extraer** cada método del `Command` a su módulo correspondiente, manteniendo la firma original.
2. **Importar** los nuevos módulos en `import_blogs.py` y **delegar** la lógica.
3. Mantener el método `handle` como orquestador que llama a la clase `BlogImporter.import_all()`.
4. Ejecutar pruebas manuales (`python manage.py import_blogs`) para validar que el comportamiento no cambie.

### 4. Actualizar pruebas y documentación
* Añadir referencias a los nuevos módulos en la documentación del proyecto.
* (Opcional) Crear pruebas unitarias para funciones puras (e.g., `normalize_lines`, `extract_title`).

### 5. Revisión y merge
* Revisar con el equipo que la nueva estructura sigue la convención de código del proyecto.
* Ejecutar `python manage.py check` y `python manage.py test` para asegurar que todo pasa.

---

**Nota:** Esta fase de planificación no modifica código existente; solo introduce nuevos archivos y actualiza el comando para utilizarlos. Se seguirá el proceso de HU descrito en `.clinerules` (creación de HU, validación, implementación en fases ≤20 min).
