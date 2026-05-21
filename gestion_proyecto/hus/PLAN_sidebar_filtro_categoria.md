# Plan: Sidebar de filtrado por categoría (lado izquierdo)

## Objetivo
Crear un sidebar en la página de listado del blog que permita al usuario filtrar los artículos por su categoría. El sidebar debe ser accesible, responsivo y cumplir con buenas prácticas de usabilidad.

## Requisitos funcionales
1. **Listado de categorías**: Mostrar todas las categorías disponibles en el sistema.
2. **Filtro activo**: Al hacer clic en una categoría, recargar la lista de artículos mostrando solo los de esa categoría.
3. **Estado activo**: Resaltar la categoría seleccionada.
4. **Persistencia del filtro**: Mantener el filtro al navegar entre páginas de paginación.
5. **Extensibilidad**: Preparar la estructura para añadir futuros filtros (etiquetas, autor, rango de fechas, etc.).

## Requisitos no funcionales
* **Accesibilidad**: Uso de atributos ARIA, foco visible y contraste adecuado.
* **Responsive**: En pantallas pequeñas el sidebar se colapsa a un menú desplegable.
* **Performance**: Cargar las categorías una sola vez (consulta ligera).
* **Mantenibilidad**: Código modular, estilos en CSS y lógica en JavaScript separada.

## Arquitectura y componentes
### Backend
* **Vista** (`backend/blog/views.py`): Modificar la vista `BlogListView` para aceptar un parámetro GET `category` y filtrar el queryset.
* **URL** (`backend/blog/urls.py`): Mantener el mismo endpoint, el filtro se pasa como query string (`?category=slug`).
* **Template** (`backend/blog/templates/blog/blog_list.html`): Añadir una sección `<aside>` antes del grid de tarjetas.

### Frontend
* **HTML**: Estructura del sidebar con una lista `<ul>` de enlaces a cada categoría.
* **CSS** (`backend/blog/static/blog/css/blog_sidebar.css`): Estilos para el sidebar, estado activo, colapso en móviles.
* **JavaScript** (`backend/blog/static/blog/js/blog_sidebar.js`): Opcional para manejar el colapso del menú en móviles.

## Pasos de implementación (granulares, ≤15 min cada uno)
1. **Crear plantilla parcial** `templates/blog/partials/_sidebar.html` con la lista de categorías.
2. **Actualizar vista** para pasar `categories` al contexto y aplicar filtro si `category` está en la query.
3. **Incluir el sidebar** en `blog_list.html` usando `{% include 'blog/partials/_sidebar.html' %}`.
4. **Crear archivo CSS** `static/blog/css/blog_sidebar.css` con estilos básicos y media query para colapsar.
5. **Enlazar CSS** en el `<head>` de `blog_list.html`.
6. **(Opcional) Añadir JS** para toggle del menú en móviles.
7. **Probar** filtrado en desarrollo (`python manage.py runserver`).
8. **Revisar accesibilidad** (tab order, aria‑label, contraste).
9. **Commit** de los cambios y actualizar la documentación en `gestion_proyecto/hus/`.

## Impacto y consideraciones
* **Plantilla**: No afecta otras vistas del sitio.
* **Rendimiento**: La consulta de categorías es ligera (`Category.objects.all()`).
* **Compatibilidad**: Mantener la clase `border-0` de las cards sin cambios.
* **Usabilidad**: El sidebar será visible en escritorio y colapsable en móvil, siguiendo patrones comunes.

---

**Checklist**
- [ ] Crear parcial `_sidebar.html`
- [ ] Modificar `BlogListView` para filtro de categoría
- [ ] Añadir CSS `blog_sidebar.css`
- [ ] Incluir sidebar en `blog_list.html`
- [ ] Probar funcionalidad y responsividad
- [ ] Documentar cambios

---

Este plan está listo para ser ejecutado en fases siguiendo la regla de granularidad del proyecto.
