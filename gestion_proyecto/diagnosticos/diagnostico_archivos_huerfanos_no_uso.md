# Diagnóstico de archivos huérfanos (no uso)

## Partial `_navigation_menu.html`

### Archivos existentes
1. `backend/templates/partials/_navigation_menu.html`
2. `backend/blog/templates/blog/partials/_navigation_menu.html`

### Uso en el proyecto
- El template **`backend/templates/partials/_navigation_menu.html`** es referenciado en varias plantillas del blog mediante la sentencia:
  ```django
  {% include "partials/_navigation_menu.html" %}
  ```
  Estas inclusiones se encuentran en:
  - `backend/blog/templates/blog/base_dashboard.html`
  - `backend/blog/templates/blog/blog_detail.html`
  - `backend/blog/templates/blog/blog_editor.html`
  - `backend/blog/templates/blog/blog_list.html`
  - `backend/blog/templates/blog/dashboard.html`
  - `backend/blog/templates/blog/dashboard_post_comments.html`
  - `backend/blog/templates/blog/blog_email_config.html`

- El archivo **`backend/blog/templates/blog/partials/_navigation_menu.html`** **no es referenciado** por ninguna plantilla ni vista del proyecto. No existen inclusiones que apunten a `blog/partials/_navigation_menu.html` ni a esa ruta específica.

### Conclusión
- **Archivo en uso:** `backend/templates/partials/_navigation_menu.html`
- **Archivo huérfano:** `backend/blog/templates/blog/partials/_navigation_menu.html`

Se recomienda eliminar el archivo huérfano o mover su contenido al archivo en uso si fuera necesario.

## Archivos a eliminar

En la última sección del presente diagnóstico, se listan los archivos que pueden ser eliminados sin afectar el funcionamiento del proyecto:

- `backend/blog/templates/blog/partials/_navigation_menu.html` – archivo huérfano, no es referenciado por ninguna plantilla ni vista.
- `backend/blog/templates/blog/partials/_post_grid.html` – tampoco es incluido en ninguna plantilla del proyecto.

Eliminar estos archivos contribuirá a mantener el código limpio y evitar confusiones futuras.
