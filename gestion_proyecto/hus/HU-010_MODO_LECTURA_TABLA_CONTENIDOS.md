# HU-010: Modo Lectura + Tabla de Contenidos Automática

**Estado:** 🔵 Pendiente
**Prioridad:** Alta
**Dependencias:** Ninguna (usa Alpine.js ya instalado)
**Tiempo estimado:** 3 fases de ~20 min cada una

---

## 🎯 Objetivo

Implementar en `blog_detail.html` dos funcionalidades de experiencia de lectura premium:

1. **Modo Lectura** (3 estados): toggle para cambiar la apariencia del artículo
2. **Tabla de Contenidos automática**: genera índice desde los `<h2>/<h3>` del contenido

---

## 📐 Alcance

### ✅ Incluye

**Modo Lectura:**
- Toggle con 3 estados: `Normal → Lectura Claro → Lectura Oscuro → Normal`
- **Lectura Claro**: fondo sepia (#faf0e6), texto oscuro, tipografía 1.2rem
- **Lectura Oscuro**: fondo #1a1a2e, texto claro, tipografía 1.2rem
- Ancho de contenido limitado (~780px centrado)
- Oculta/atenúa decoraciones visuales (imagen de fondo, bordes decorativos, sidebar)
- Persistencia en `localStorage` (recuerda la preferencia entre visitas)
- Implementado con Alpine.js + CSS `[data-reading-mode]` en el `<html>`

**Tabla de Contenidos:**
- Escanea los `<h2>` y `<h3>` dentro de `.blog-content`
- Los inyecta en el `#toc-sidebar` existente (escritorio, col-lg-3)
- Cada ítem es un anchor link con `scroll-behavior: smooth`
- Highlight automático de la sección activa mientras se hace scroll
- En mobile: se pliega dentro de un acordeón/dropdown sobre el contenido

### ❌ Excluye

- El listado `blog_list.html` no se modifica
- Sidebar de categorías no se toca
- Comentarios, reacciones y navegación siguen igual
- No se instalan dependencias nuevas

---

## 🧩 Criterios de aceptación

1. [ ] Al hacer clic en el toggle, el artículo cambia de modo visual instantáneamente
2. [ ] Los 3 modos se ven correctamente (Normal, Claro, Oscuro)
3. [ ] Al recargar la página, se mantiene el último modo seleccionado
4. [ ] La tabla de contenidos se genera automáticamente si hay `<h2>` en el artículo
5. [ ] Los links del TOC hacen scroll suave a la sección correspondiente
6. [ ] La sección activa se resalta mientras se hace scroll
7. [ ] En mobile el TOC se muestra como acordeón plegable
8. [ ] No se rompe ninguna funcionalidad existente (comentarios, reacciones, etc.)

---

## 📋 Plan de implementación

### Fase 1: Modo Lectura (Alpine + CSS)

**Archivos a modificar:**
- `backend/blog/templates/blog/blog_detail.html`
- `backend/blog/static/blog/css/blog_detail.css`
- `backend/blog/static/blog/js/blog_detail.js`

**Pasos:**
1. Agregar componente Alpine `x-data="readingMode()"` en el body
2. Definir el objeto `readingMode()` en `blog_detail.js` (antes de Alpine load)
3. El objeto maneja: estado actual, toggle entre 3 modos, persistencia localStorage
4. Agregar estilos CSS para `[data-reading-mode="sepia"]` y `[data-reading-mode="dark"]`
5. Insertar el botón toggle flotante en el artículo (arriba del header)

### Fase 2: Tabla de Contenidos automática

**Archivos a modificar:**
- `backend/blog/templates/blog/blog_detail.html` (el TOC sidebar ya existe)
- `backend/blog/static/blog/js/blog_detail.js`
- `backend/blog/static/blog/css/blog_detail.css`

**Pasos:**
1. En `blog_detail.js` (después de DOMContentLoaded), escanear `.blog-content` en busca de h2/h3
2. Asignar `id` a cada heading encontrado (slugify del texto)
3. Inyectar los items en `#toc-sidebar`
4. Implementar IntersectionObserver para highlight de sección activa
5. Agregar estilos CSS para el TOC

### Fase 3: Responsive y pulido

**Pasos:**
1. En mobile, convertir el TOC en un acordeón colapsable
2. Ajustar estilos responsive
3. Probar combinación: modo lectura + TOC
4. Verificar que nada se rompe