# Scripts de utilidad del proyecto

Esta carpeta contiene una colección de scripts que facilitan tareas de
mantenimiento, depuración y verificación de la base de datos del blog.

## Lista de scripts

| Script                          | Propósito                                                                                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `assign_all_categories.py`      | Recorre todos los markdown en `backend/blogs_source`, extrae la categoría del front‑matter y crea/actualiza la relación `BlogPost ↔ Category`. |
| `assign_technology_category.py` | Asegura que exista la categoría **Tecnología** y la asigna a los posts cuyo front‑matter la indica.                                            |
| `check_categories.py`           | Lista los posts y la categoría que tienen, útil para validar la asignación.                                                                    |
| `debug_frontmatter.py`          | Imprime el diccionario de front‑matter de un archivo markdown concreto; ayuda a depurar el parser.                                             |
| `debug_posts.py`                | Muestra título, slug y categoría de todos los `BlogPost` existentes.                                                                           |
| `get_posts.py`                  | (No documentado en el proyecto original – se incluye para consistencia).                                                                       |
| `list_categories.py`            | Lista todas las instancias de `Category` en la base de datos.                                                                                  |
| `list_posts_detail.py`          | Imprime información detallada (título, slug, categoría) de cada `BlogPost`.                                                                    |
| `list_posts.py`                 | Versión ligera de `list_posts_detail.py`, solo título‑slug‑categoría.                                                                          |
| `reset_blog_data.py`            | Borra **todos** los `BlogPost` y `Category` de la BD; se usa antes de volver a importar los blogs.                                             |
| `test_get_post.py`              | Pequeña prueba manual para obtener un post por slug y mostrar su categoría.                                                                    |
| `verify_categories.py`          | Similar a `check_categories.py`, muestra la categoría asignada a cada post.                                                                    |
| `view_posts.py`                 | Imprime id, título, slug y `category_id` de cada post; útil para inspecciones rápidas.                                                         |

## Uso

Todos los scripts están diseñados para ejecutarse desde la raíz del proyecto:

```bash
source .venv/Scripts/activate   # activar entorno virtual
python scripts/assign_all_categories.py
```

Los scripts añaden automáticamente el directorio `backend` al `PYTHONPATH`
para que Django pueda resolverse sin necesidad de modificar la configuración
del proyecto.

## Notas de mantenimiento

* Cada script incluye comentarios que explican por qué se manipula `sys.path`.
* Si añades nuevos scripts de utilidad, colócalos dentro de esta carpeta y
  actualiza este `README.md` con una breve descripción.

---

Esta reorganización no altera la lógica de la aplicación; solo mejora la
estructura del repositorio y facilita la localización de herramientas de
soporte.
